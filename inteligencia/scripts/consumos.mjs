/**
 * Consumos da conta Cloudflare, lidos agora com a sessão do wrangler — sem esperar pelo
 * token do Worker (CF_ANALYTICS_TOKEN) nem pela próxima hora.
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/consumos.mjs              lê e mostra o ciclo actual (NÃO grava)
 *   node inteligencia/scripts/consumos.mjs --json F     idem, e escreve a resposta do painel em F
 *   node inteligencia/scripts/consumos.mjs --gravar     lê e grava em consumos_dia na base remota
 *
 * O token da sessão fica em memória: nunca é impresso nem gravado. Sem --gravar, os dados
 * vão para uma base SQLite em memória com as mesmas migrações — nada sai para produção.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { recolherConsumos, lerCustos } from '../src/custos.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const GRAVAR = process.argv.includes('--gravar');
const iJson = process.argv.indexOf('--json');
const toml = fs.readFileSync(path.join(MODULO, 'wrangler.toml'), 'utf8');
const conta = /CF_ACCOUNT_ID\s*=\s*"([0-9a-f]{32})"/.exec(toml)?.[1];
const base = /database_id\s*=\s*"([0-9a-f-]{36})"/.exec(toml)?.[1];
if (!conta || !base) { console.error('✖ não encontrei a conta ou a base no wrangler.toml'); process.exit(1); }

let token;
try {
  const s = execFileSync(process.execPath, [WRANGLER, 'auth', 'token', '--json'], { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  token = JSON.parse(s.slice(s.indexOf('{'))).token;
} catch (e) { token = null; }
if (!token) { console.error('✖ sem sessão do wrangler'); process.exit(1); }

async function baseEmMemoria() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(path.join(MODULO, 'migrations', f), 'utf8'));
  }
  const stmt = (sql, params = []) => ({
    sql, params, bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return {}; }
  });
  return { prepare: sql => stmt(sql), batch: async ss => { for (const s of ss) db.prepare(s.sql).run(...s.params); return []; } };
}

/* a base remota pela API do D1; só escreve em consumos_dia, dataforseo_saldos e nas chaves consumos_* */
function baseRemota() {
  const pedir = async body => {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${conta}/d1/database/${base}/query`, {
      method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.success) throw new Error('D1: ' + (j.errors || []).map(e => e.message).join('; '));
    return j.result;
  };
  const PERMITIDO = /^\s*(SELECT|INSERT OR REPLACE INTO consumos_dia|INSERT OR REPLACE INTO dataforseo_saldos|INSERT OR REPLACE INTO esquema_meta \(chave, valor\) VALUES \('consumos_)/i;
  const stmt = (sql, params = []) => ({
    sql, params, bind: (...p) => stmt(sql, p),
    first: async () => (await pedir({ sql, params }))[0].results[0] ?? null,
    all: async () => ({ results: (await pedir({ sql, params }))[0].results }),
    run: async () => { if (!PERMITIDO.test(sql)) throw new Error('recusado: ' + sql.slice(0, 60)); await pedir({ sql, params }); return {}; }
  });
  return {
    prepare: sql => stmt(sql),
    batch: async ss => {
      for (const s of ss) if (!PERMITIDO.test(s.sql)) throw new Error('recusado: ' + s.sql.slice(0, 60));
      for (const s of ss) await pedir({ sql: s.sql, params: s.params });
      return [];
    }
  };
}

const db = GRAVAR ? baseRemota() : await baseEmMemoria();
/* as credenciais da DataForSEO vêm das variáveis de ambiente, como no resto do projecto; nunca se imprimem */
const env = { DB: db, CF_ACCOUNT_ID: conta, DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD };
const r = await recolherConsumos(env, { token });
console.log((GRAVAR ? '✔ gravado na base remota: ' : 'lido (não gravado): ') + r.linhas + ' linhas desde ' + r.desde + (r.erros.length ? ' · erros: ' + r.erros.join(' | ') : ''));
console.log('DataForSEO: ' + (r.dataforseo.saldo != null ? 'saldo ' + r.dataforseo.saldo.toFixed(2) + ' USD' : JSON.stringify(r.dataforseo)));
const c = await lerCustos({ ...env, DATAFORSEO_LOGIN: '', DATAFORSEO_PASSWORD: '', CF_ANALYTICS_TOKEN: GRAVAR ? '' : 'x' });
if (iJson > 0 && process.argv[iJson + 1]) fs.writeFileSync(process.argv[iJson + 1], JSON.stringify(c));
const pct = x => (x * 100).toLocaleString('pt-PT', { maximumFractionDigits: 3 }) + '%';
console.log(`ciclo ${c.ciclo.inicio} a ${c.ciclo.fim} · total estimado ${c.total_projectado_usd?.toFixed(2)} USD · nível ${c.nivel}`);
for (const m of c.metricas.filter(x => x.com_dados)) {
  console.log(`  ${m.titulo}: ${Math.round(m.usado).toLocaleString('pt-PT')} (${pct(m.pct)}) → fim ${pct(m.pct_projeccao)} · ${m.nivel}` +
    ' · ' + m.recursos.slice(0, 4).map(x => x.nome + ' ' + Math.round(x.valor).toLocaleString('pt-PT')).join(', '));
}
