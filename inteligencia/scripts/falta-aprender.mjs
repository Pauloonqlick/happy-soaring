/**
 * O que ainda não deixou lição — lido do módulo (só leitura).
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/falta-aprender.mjs          lista os casos
 *   node inteligencia/scripts/falta-aprender.mjs --aviso  uma linha de aviso (para os scripts de publicação)
 *
 * Nunca falha a quem o chama: sem sessão ou sem rede, diz que não conseguiu ler e sai com 0.
 * Cada caso resolve-se de uma de três maneiras (ver registar.mjs):
 *   · registar a lição que o reconhece ou refere      registar.mjs licao
 *   · para um problema sem causa conhecida, registar  registar.mjs hipotese
 *     as hipóteses eliminadas (fica «causa por descobrir»)
 *   · dispensar, com o motivo escrito                 registar.mjs dispensar
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lerFaltaAprender } from '../src/aprendizagem.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const AVISO = process.argv.includes('--aviso');
/* process.exit logo a seguir a um fetch faz o Node rebentar no Windows (assert do libuv): sai-se por return */
const sair = m => { console.log(m); return true; };

const toml = fs.readFileSync(path.join(MODULO, 'wrangler.toml'), 'utf8');
const conta = /CF_ACCOUNT_ID\s*=\s*"([0-9a-f]{32})"/.exec(toml)?.[1];
const base = /database_id\s*=\s*"([0-9a-f-]{36})"/.exec(toml)?.[1];
let token = null;
try {
  const s = execFileSync(process.execPath, [WRANGLER, 'auth', 'token', '--json'], { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  token = JSON.parse(s.slice(s.indexOf('{'))).token;
} catch (e) { token = null; }
const semSessao = !conta || !base || !token;

async function consulta(sql, params) {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('recusado: este script só lê');
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${conta}/d1/database/${base}/query`, {
    method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ sql, params })
  });
  const j = await r.json();
  if (!j.success) throw new Error('D1: ' + (j.errors || []).map(e => e.message).join('; '));
  return j.result[0].results;
}
const stmt = (sql, params = []) => ({
  bind: (...p) => stmt(sql, p),
  all: async () => ({ results: await consulta(sql, params) }),
  first: async () => (await consulta(sql, params))[0] ?? null
});

const ESTADO = { FALTA_LICAO: 'falta lição', CAUSA_POR_DESCOBRIR: 'causa por descobrir', CAUSA_POR_CONFIRMAR: 'causa por confirmar', REVER_LICAO: 'rever lição', SEM_FONTE: 'sem fonte oficial' };

async function principal() {
  if (semSessao) return sair('  (não foi possível ler «O que falta aprender»: sem sessão do wrangler)');
  let falta;
  try { falta = await lerFaltaAprender({ prepare: sql => stmt(sql) }); }
  catch (e) { return sair('  (não foi possível ler «O que falta aprender»: ' + String(e.message).slice(0, 120) + ')'); }

  if (AVISO) {
    const semLicao = falta.filter(x => x.estado === 'FALTA_LICAO' || x.estado === 'CAUSA_POR_CONFIRMAR');
    if (!falta.length) return sair('  ✓ nada por aprender: todos os problemas e incidentes já deixaram lição ou foram dispensados');
    return sair('  ⚠ O QUE FALTA APRENDER: ' + falta.length + ' caso(s)' + (semLicao.length ? ', ' + semLicao.length + ' sem lição nem hipóteses' : '') +
      ' — node inteligencia/scripts/falta-aprender.mjs. Registar a lição (ou dispensar com motivo) antes de fechar o trabalho.');
  }
  console.log('O QUE FALTA APRENDER' + (falta.length ? ' (' + falta.length + ')' : ''));
  if (!falta.length) console.log('- Nada: todos os problemas e incidentes já deixaram lição ou foram dispensados com motivo.');
  for (const x of falta) {
    console.log('- [' + ESTADO[x.estado] + '] ' + x.titulo + ' — ' + x.detalhe +
      (x.hipoteses_eliminadas ? ' (' + x.hipoteses_eliminadas + ' hipóteses eliminadas)' : '') + (x.activo ? ' · por resolver' : '') + '\n    ' + x.referencia);
  }
}
await principal();
