/**
 * A leitura do módulo em texto — as MESMAS frases do «Hoje» e da «Semana em revista».
 * Serve o resumo de 2 em 2 dias, para que o que o Paulo lê num lado e no outro coincida.
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/leitura.mjs            últimas 48 horas + a semana mais recente
 *   node inteligencia/scripts/leitura.mjs --horas 24
 *   node inteligencia/scripts/leitura.mjs --simular-semana   como ficaria a última semana completa (não grava)
 *
 * SÓ LEITURA: lê a base de produção pela API do D1 com a sessão do wrangler (o token fica
 * em memória e nunca é impresso) e recusa qualquer instrução que não seja uma consulta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lerHoje } from '../src/assuntos.js';
import { lerSemana, gerarSemana } from '../src/leitura.js';
import { lerFaltaAprender } from '../src/aprendizagem.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(MODULO, '..');
const WRANGLER = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const i = process.argv.indexOf('--horas');
const horas = i > 0 ? Number(process.argv[i + 1]) : 48;
if (!Number.isFinite(horas) || horas <= 0 || horas > 24 * 14) { console.error('--horas tem de ser entre 1 e 336'); process.exit(1); }

const toml = fs.readFileSync(path.join(MODULO, 'wrangler.toml'), 'utf8');
const conta = /CF_ACCOUNT_ID\s*=\s*"([0-9a-f]{32})"/.exec(toml)?.[1];
const base = /database_id\s*=\s*"([0-9a-f-]{36})"/.exec(toml)?.[1];
if (!conta || !base) { console.error('Não encontrei a conta ou a base no wrangler.toml.'); process.exit(1); }

let token;
try {
  const saida = execFileSync(process.execPath, [WRANGLER, 'auth', 'token', '--json'], { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  token = JSON.parse(saida.slice(saida.indexOf('{'))).token;
} catch (e) { token = null; }
if (!token) { console.error('Sem sessão do wrangler: não foi possível ler a base.'); process.exit(1); }

const SO_LEITURA = /^\s*(SELECT|WITH)\b/i;
async function consulta(sql, params) {
  if (!SO_LEITURA.test(sql)) throw new Error('recusado: este script só lê');
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${conta}/d1/database/${base}/query`, {
    method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params })
  });
  const j = await r.json();
  if (!j.success) throw new Error('D1: ' + (j.errors || []).map(e => e.message).join('; '));
  return j.result[0].results;
}
const stmt = (sql, params = []) => ({
  bind: (...p) => stmt(sql, p),
  all: async () => ({ results: await consulta(sql, params) }),
  first: async () => (await consulta(sql, params))[0] ?? null,
  run: async () => { throw new Error('recusado: este script só lê'); }
});
const db = { prepare: sql => stmt(sql), batch: async () => { throw new Error('recusado: este script só lê'); } };

const agora = new Date().toISOString();
const desde = new Date(Date.now() - horas * 36e5).toISOString();
const quando = s => new Date(s).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', dateStyle: 'short', timeStyle: 'short' });

if (process.argv.includes('--simular-semana')) {
  const u = await db.prepare(`SELECT semana FROM (SELECT date(data, 'weekday 0', '-6 days') AS semana, COUNT(*) AS dias FROM gsc_dias
    WHERE completo = 1 GROUP BY semana) WHERE dias = 7 ORDER BY semana DESC LIMIT 1`).first();
  const w = u ? await gerarSemana(db, u.semana, { agora }) : null;
  if (!w) { console.log('Nenhuma semana completa.'); process.exit(0); }
  console.log(`SIMULAÇÃO — SEMANA ${w.semana} a ${w.fim} (não gravada)`);
  for (const s of w.secoes) {
    console.log(`
${s.titulo}`);
    if (!s.frases.length) console.log(`- ${s.vazio || 'Nada a dizer.'}`);
    for (const f of s.frases) console.log(`- ${f.texto}`);
  }
  process.exit(0);
}

const [hoje, semana] = await Promise.all([lerHoje(db, { agora, desde }), lerSemana(db).catch(() => null)]);

console.log(`A LEITURA DAS ÚLTIMAS ${horas} HORAS (desde ${quando(desde)}, hora de Lisboa)`);
if (!hoje.leitura) console.log('- Não foi possível escrever a leitura.');
else if (!hoje.leitura.frases.length) console.log('- Nada de novo.');
else for (const f of hoje.leitura.frases) console.log(`- [${f.tom}] ${f.texto}`);

console.log('');
if (!semana) console.log('SEMANA EM REVISTA: ainda nenhuma semana escrita.');
else {
  const nova = Date.parse(semana.gerada_em) > Date.parse(desde);
  console.log(`SEMANA EM REVISTA ${semana.semana} a ${semana.fim} (escrita a ${quando(semana.gerada_em)}${nova ? ' — NOVA neste período' : ' — já referida antes'})`);
  for (const s of semana.secoes) {
    console.log(`\n${s.titulo}`);
    if (!s.frases.length) console.log(`- ${s.vazio || 'Nada a dizer.'}`);
    for (const f of s.frases) console.log(`- ${f.texto}`);
  }
}

/* 14/09/2026 · o que ainda não deixou lição — para que nada se perda por esquecimento */
const ESTADOS_FALTA = { FALTA_LICAO: 'falta lição', CAUSA_POR_DESCOBRIR: 'causa por descobrir', CAUSA_POR_CONFIRMAR: 'causa por confirmar', REVER_LICAO: 'rever lição', SEM_FONTE: 'sem fonte oficial' };
const falta = await lerFaltaAprender(db, { agora }).catch(e => { console.log('\nO QUE FALTA APRENDER: não foi possível ler (' + e.message + ')'); return null; });
if (falta) {
  console.log('\nO QUE FALTA APRENDER' + (falta.length ? ' (' + falta.length + ')' : ''));
  if (!falta.length) console.log('- Nada: todos os problemas e incidentes já deixaram lição ou foram dispensados com motivo.');
  for (const x of falta) console.log('- [' + ESTADOS_FALTA[x.estado] + '] ' + x.titulo + ' — ' + x.detalhe +
    (x.hipoteses_eliminadas ? ' (' + x.hipoteses_eliminadas + ' hipóteses eliminadas)' : '') + ' · ' + x.referencia);
}
