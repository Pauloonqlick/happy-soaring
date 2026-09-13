/* Fase 3 — Search Console. SQLite real com as migrações; o Google é simulado. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inferirLingua, classificarMarca } from '../src/linguas.js';
import { executarCicloGsc, estadoSearchConsole, resumoSearchConsole, ORCAMENTO_GSC } from '../src/search-console.js';
import { esquecerAcessoGoogle } from '../src/google.js';
import worker from '../src/index.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const verificar = sql => { if ((sql.match(/\?/g) || []).length > 100) throw new Error('D1: mais de 100 parâmetros'); };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { verificar(sql); const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => { verificar(sql); return { results: db.prepare(sql).all(...params).map(r => ({ ...r })) }; },
    run: async () => { verificar(sql); const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
    executar: () => { verificar(sql); db.prepare(sql).run(...params); }
  });
  return {
    prepare: sql => stmt(sql),
    batch: async stmts => { db.exec('BEGIN'); try { for (const s of stmts) s.executar(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; }
  };
}

/* ---------------------------------------------------------------- língua -- */

const casos = [
  ['what is a parakite', 'en'], ['was ist ein parakite', 'de'], ["qu'est-ce qu'un parakite", 'fr'],
  ['o que é um parakite', 'pt'], ['qué es un parakite', 'es'], ['voo de parapente lisboa', 'pt'],
  ['tandem paragliding lisbon', 'en'], ['gleitschirm tandemflug portugal', 'de'], ['baptême parapente portugal', 'fr'],
  ['vuelo biplaza parapente', 'es'],
  /* sem evidência suficiente: UNKNOWN, nunca uma língua à força */
  ['parakite', 'UNKNOWN'], ['happy soaring', 'UNKNOWN'], ['mullet 2', 'UNKNOWN'], ['parakite portugal', 'UNKNOWN'],
  ['curso parapente lisboa', 'UNKNOWN'], ['flow paragliders', 'UNKNOWN'], ['', 'UNKNOWN'], ['albatroxx', 'UNKNOWN']
];
for (const [q, esperado] of casos) {
  test('língua: «' + q + '» → ' + esperado, () => assert.equal(inferirLingua(q).lingua, esperado));
}

test('língua: a confiança só é ALTA com duas pistas e nenhuma contrária', () => {
  assert.equal(inferirLingua('was ist ein parakite').confianca, 'ALTA');
  assert.equal(inferirLingua('voo de parapente').confianca, 'MEDIA');
  assert.equal(inferirLingua('parakite').confianca, null);
});

/* ------------------------------------------------------------------ marca -- */

const TERMOS = ['happy soaring', 'happysoaring', 'happysoaring.com', 'pilot2wing', 'body first', 'smartground'];
test('marca: termos configurados, com ou sem espaços; o fabricante não é marca', () => {
  assert.equal(classificarMarca('happy soaring portugal', TERMOS), 'BRANDED');
  assert.equal(classificarMarca('happysoaring', TERMOS), 'BRANDED');
  assert.equal(classificarMarca('happy  soaring', TERMOS), 'BRANDED');
  assert.equal(classificarMarca('smartground parakite', TERMOS), 'BRANDED');
  assert.equal(classificarMarca('flow paragliders portugal', TERMOS), 'NON_BRANDED');
  assert.equal(classificarMarca('parakite portugal', TERMOS), 'NON_BRANDED');
  assert.equal(classificarMarca('', TERMOS), 'UNKNOWN');
});

/* ------------------------------------------------------- recolha falsa -- */

const DIAS = ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'];
function googleFalso({ tokenEstado = 200, gscEstado = 200 } = {}) {
  const log = [];
  const f = async (url, init) => {
    const u = String(url);
    log.push({ u, corpo: init?.body ? String(init.body) : '' });
    if (u === 'https://oauth2.googleapis.com/token') {
      if (tokenEstado !== 200) return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: tokenEstado });
      return new Response(JSON.stringify({ access_token: 'acesso-de-teste', expires_in: 3600 }));
    }
    if (u.includes('/searchAnalytics/query')) {
      if (gscEstado !== 200) return new Response(JSON.stringify({ error: { status: 'PERMISSION_DENIED' } }), { status: gscEstado });
      const c = JSON.parse(init.body);
      const dims = c.dimensions.join(',');
      if (dims === 'date') return Response.json({ rows: DIAS.map(d => ({ keys: [d], clicks: 5, impressions: 100, ctr: 0.05, position: 8 })) });
      const linhas = {
        query: [{ keys: ['happy soaring'], clicks: 3, impressions: 20 }, { keys: ['what is a parakite'], clicks: 1, impressions: 50 }],
        page: [{ keys: ['https://happysoaring.com/'], clicks: 4, impressions: 60 }],
        country: [{ keys: ['prt'], clicks: 3, impressions: 70 }, { keys: ['deu'], clicks: 2, impressions: 30 }],
        device: [{ keys: ['DESKTOP'], clicks: 5, impressions: 100 }],
        'query,page,country,device': [{ keys: ['happy soaring', 'https://happysoaring.com/', 'prt', 'DESKTOP'], clicks: 3, impressions: 20 }]
      }[dims];
      return Response.json({ rows: linhas });
    }
    throw new Error('rede proibida: ' + u);
  };
  f.log = log;
  return f;
}

const envGsc = (db, extra = {}) => ({
  DB: db, GSC_PROPRIEDADE: 'sc-domain:happysoaring.com',
  GOOGLE_OAUTH_CLIENT_ID: 'id', GOOGLE_OAUTH_CLIENT_SECRET: 'segredo', GSC_REFRESH_TOKEN: 'refresh', ...extra
});
const HOJE = new Date('2026-09-13T12:00:00Z');

test('recolha: todos os dias com dados, os cinco conjuntos de cada um, dentro do orçamento', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const f = googleFalso();
  let execucoes = 0;
  for (; execucoes < 10; execucoes++) {
    const r = await executarCicloGsc(envGsc(db), { fetchImpl: f, hoje: HOJE });
    assert.ok(r.orcamento.pedidos <= ORCAMENTO_GSC.pedidos, 'pedidos ' + r.orcamento.pedidos);
    assert.ok(r.orcamento.consultas <= ORCAMENTO_GSC.consultas, 'consultas ' + r.orcamento.consultas);
    const e = await estadoSearchConsole(db, envGsc(db));
    if (e.dias === DIAS.length && e.completos === DIAS.length) break;
  }
  assert.ok(execucoes >= 1 && execucoes < 10);
  const e = await estadoSearchConsole(db, envGsc(db));
  assert.deepEqual({ dias: e.dias, completos: e.completos, primeira: e.primeira, ultima: e.ultima },
    { dias: 8, completos: 8, primeira: '2026-08-23', ultima: '2026-08-30' });
  const n = (await db.prepare('SELECT COUNT(*) AS n FROM gsc_conjuntos').first()).n;
  assert.equal(n, 40, '8 dias × 5 conjuntos');

  const corpos = f.log.filter(x => x.u.includes('searchAnalytics')).map(x => JSON.parse(x.corpo));
  assert.ok(corpos.every(c => c.dataState === 'final' && c.type === 'web'), 'só dados finais da pesquisa Web');
});

test('recolha: um dia gravado nunca é pedido nem reescrito outra vez', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const f = googleFalso();
  for (let i = 0; i < 6; i++) await executarCicloGsc(envGsc(db), { fetchImpl: f, hoje: HOJE });
  const antes = f.log.length;
  const r = await executarCicloGsc(envGsc(db), { fetchImpl: f, hoje: HOJE });
  const pedidos = f.log.slice(antes).filter(x => x.u.includes('searchAnalytics'));
  assert.equal(pedidos.length, 1, 'só a consulta dos totais por dia');
  assert.equal(r.dias_novos, 0);
});

test('resumo: marca + não-marca + desconhecido = total do Google; países; cobertura', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  for (let i = 0; i < 6; i++) await executarCicloGsc(envGsc(db), { fetchImpl: googleFalso(), hoje: HOJE });
  const s = await resumoSearchConsole(db, { dias: 28 });
  assert.deepEqual(s.totais, { cliques: 40, impressoes: 800 });
  assert.deepEqual(s.marca.marca, { cliques: 24, impressoes: 160 });
  assert.deepEqual(s.marca.nao_marca, { cliques: 8, impressoes: 400 });
  assert.deepEqual(s.marca.desconhecido, { cliques: 8, impressoes: 240 }, 'o que o Google não mostra por pesquisa');
  const soma = s.marca.marca.impressoes + s.marca.nao_marca.impressoes + s.marca.desconhecido.impressoes;
  assert.equal(soma, s.totais.impressoes);
  assert.equal(s.cobertura_queries, 70);
  assert.equal(s.paises[0].pais, 'prt');
  assert.equal(s.linguas_da_pesquisa_impressoes.en, 400);
  assert.equal(s.linguas_da_pesquisa_impressoes.UNKNOWN, 160, 'happy soaring não tem língua');
});

test('sem credencial Google: limitação registada, nenhum pedido feito', async () => {
  const db = await d1Falsa();
  const f = googleFalso();
  const r = await executarCicloGsc(envGsc(db, { GSC_REFRESH_TOKEN: '' }), { fetchImpl: f, hoje: HOJE });
  assert.equal(r.motivo, 'SEM_CREDENCIAL_GOOGLE');
  assert.equal(f.log.length, 0);
  assert.equal((await db.prepare('SELECT tipo FROM eventos_operacionais').first()).tipo, 'GSC_SEM_CREDENCIAL_GOOGLE');
});

test('autorização revogada: só o código do Google é registado, nunca credenciais', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const r = await executarCicloGsc(envGsc(db), { fetchImpl: googleFalso({ tokenEstado: 400 }), hoje: HOJE });
  assert.equal(r.motivo, 'GOOGLE_TOKEN_HTTP_400');
  const ev = await db.prepare('SELECT tipo, detalhe FROM eventos_operacionais').first();
  assert.deepEqual({ ...ev }, { tipo: 'GSC_GOOGLE_TOKEN_HTTP_400', detalhe: 'invalid_grant' });
  const tudo = JSON.stringify(await db.prepare('SELECT * FROM eventos_operacionais').all());
  assert.doesNotMatch(tudo, /refresh|segredo|acesso-de-teste/);
});

test('sem permissão na propriedade: limitação, nada gravado', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const r = await executarCicloGsc(envGsc(db), { fetchImpl: googleFalso({ gscEstado: 403 }), hoje: HOJE });
  assert.equal(r.motivo, 'GSC_HTTP_403');
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM gsc_dias').first()).n, 0);
});

test('tarefa agendada: minutos múltiplos de 10 são do Search Console, os outros das publicações', async () => {
  const chamadas = [];
  const env = {
    DB: { prepare: () => ({ bind() { return this; }, first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: {} }) }), batch: async () => [] },
    GSC_PROPRIEDADE: '', CF_API_TOKEN_PAGES: ''
  };
  const logOriginal = console.log;
  console.log = m => chamadas.push(JSON.parse(m).evento);
  try {
    for (const minuto of [0, 2, 10, 14]) {
      const esperas = [];
      await worker.scheduled({ scheduledTime: Date.UTC(2026, 8, 13, 12, minuto) }, env, { waitUntil: p => esperas.push(p) });
      await Promise.all(esperas);
    }
  } finally { console.log = logOriginal; }
  assert.deepEqual(chamadas, ['ciclo_search_console', 'ciclo_publicacoes', 'ciclo_search_console', 'ciclo_publicacoes']);
});
