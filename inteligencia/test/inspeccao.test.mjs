/* Fase 4 — inspecção de URL, rastreios, episódios e fila de indexação.
   Base SQLite real com as migrações aplicadas e um Google falso. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  derivarEstado, escolherParaInspeccionar, lerResultado, executarCicloInspeccao, lerIndexacao, registarPedido,
  ORCAMENTO_INSPECCAO, NOTA_RASTREIO
} from '../src/inspeccao.js';
import { esquecerAcessoGoogle } from '../src/google.js';
import { limparCacheChaves } from '../src/acesso.js';
import worker from '../src/index.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');                                   /* como na D1 */
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const cont = { consultas: 0 };
  const verificar = sql => {
    const n = (sql.match(/\?/g) || []).length;
    if (n > 100) throw new Error('D1: mais de 100 parâmetros numa consulta (' + n + ')');
  };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { cont.consultas++; verificar(sql); const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => { cont.consultas++; verificar(sql); return { results: db.prepare(sql).all(...params).map(r => ({ ...r })) }; },
    run: async () => { cont.consultas++; verificar(sql); const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
    executar: () => { verificar(sql); db.prepare(sql).run(...params); }
  });
  return {
    prepare: sql => stmt(sql),
    batch: async stmts => {
      db.exec('BEGIN');
      try { for (const s of stmts) { cont.consultas++; s.executar(); } db.exec('COMMIT'); }
      catch (e) { db.exec('ROLLBACK'); throw e; }
      return stmts.map(() => ({ success: true }));
    },
    cont, sqlite: db
  };
}

const ORIGEM = 'https://happysoaring.com';
const sitemap = caminhos => '<?xml version="1.0"?><urlset>' +
  caminhos.map(c => `<url><loc>${ORIGEM}${c}</loc></url>`).join('') + '</urlset>';

/* Google falso: o último rastreio de cada página e o estado HTTP de cada inspecção */
function googleFalso({ paginas = ['/', '/a/', '/b/'], rastreios = {}, estados = {} } = {}) {
  const log = [];
  const f = async (url, init) => {
    const u = String(url);
    log.push(u);
    if (u === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'acesso-de-teste', expires_in: 3600 });
    if (u === ORIGEM + '/sitemap.xml') return new Response(sitemap(paginas));
    if (u === 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect') {
      const corpo = JSON.parse(init.body);
      assert.equal(corpo.siteUrl, 'sc-domain:happysoaring.com');
      assert.equal(init.headers.authorization, 'Bearer acesso-de-teste');
      const caminho = corpo.inspectionUrl.slice(ORIGEM.length);
      const estado = estados[caminho] ?? 200;
      if (estado === 429) return Response.json({ error: { status: 'RESOURCE_EXHAUSTED' } }, { status: 429 });
      if (estado !== 200) return Response.json({ error: { status: 'INTERNAL' } }, { status: estado });
      return Response.json({ inspectionResult: { indexStatusResult: {
        verdict: 'PASS', coverageState: 'Enviada e indexada', indexingState: 'INDEXING_ALLOWED', robotsTxtState: 'ALLOWED',
        pageFetchState: 'SUCCESSFUL', crawledAs: 'MOBILE', lastCrawlTime: rastreios[caminho],
        googleCanonical: corpo.inspectionUrl, userCanonical: corpo.inspectionUrl
      } } });
    }
    throw new Error('rede proibida: ' + u);
  };
  f.log = log;
  f.inspeccoes = () => log.filter(u => u.includes('urlInspection')).length;
  return f;
}

function envCom(db, extra = {}) {
  const r2 = [];
  return {
    DB: db, BRUTO: { put: async (k, v) => { r2.push({ k, v }); } }, r2,
    GSC_PROPRIEDADE: 'sc-domain:happysoaring.com',
    GOOGLE_OAUTH_CLIENT_ID: 'id', GOOGLE_OAUTH_CLIENT_SECRET: 'segredo', GSC_REFRESH_TOKEN: 'refresh', ...extra
  };
}

/* uma publicação processada que alterou páginas */
function alterar(db, caminhos, em, id = 'dep-' + em) {
  db.sqlite.prepare("INSERT OR IGNORE INTO deployments (id, short_id, url, criado_em_cf, processamento) VALUES (?, ?, 'https://x.happy-soaring.pages.dev', ?, 'PROCESSADO')")
    .run(id, id.slice(0, 8), em);
  for (const c of caminhos) {
    db.sqlite.prepare(`INSERT INTO paginas_alteracao (caminho, ultima_alteracao_em, deployment_id, tipo) VALUES (?, ?, ?, 'conteudo')
      ON CONFLICT(caminho) DO UPDATE SET ultima_alteracao_em = excluded.ultima_alteracao_em, deployment_id = excluded.deployment_id`).run(c, em, id);
  }
}

/* ---------------------------------------------------------------- puro -- */

test('estado: cada combinação de alteração, rastreio, inspecção e pedido', () => {
  const alt = '2026-09-10T10:00:00Z';
  const ok = (entrada, estado, rastreio_posterior) => {
    const r = derivarEstado(entrada);
    assert.equal(r.estado, estado, JSON.stringify(entrada));
    assert.equal(r.rastreio_posterior, rastreio_posterior, JSON.stringify(entrada));
    return r;
  };
  ok({ alteracao: null, rastreio: '2026-09-11T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z' }, null, null);
  ok({ alteracao: alt, rastreio: null, inspeccao: null }, 'SEM_INSPECCAO', 'DESCONHECIDO');
  ok({ alteracao: alt, rastreio: '2026-09-01T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z' }, 'PENDENTE', 'NAO');
  ok({ alteracao: alt, rastreio: null, inspeccao: '2026-09-12T00:00:00Z' }, 'PENDENTE', 'NAO');
  ok({ alteracao: alt, rastreio: '2026-09-01T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z', pedido: '2026-09-11T00:00:00Z' }, 'PEDIDO', 'NAO');
  ok({ alteracao: alt, rastreio: '2026-09-01T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z', pedido: '2026-09-05T00:00:00Z' }, 'ULTRAPASSADO', 'NAO');
  ok({ alteracao: alt, rastreio: '2026-09-11T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z' }, 'RASTREADO_SEM_PEDIDO', 'SIM');
  const r = ok({ alteracao: alt, rastreio: '2026-09-11T12:00:00Z', inspeccao: '2026-09-12T00:00:00Z', pedido: '2026-09-11T00:00:00Z' },
    'RASTREADO_DEPOIS_DO_PEDIDO', 'SIM');
  assert.equal(r.atraso_horas, 12);
  /* pedido feito antes da alteração, e rastreio depois dela: o pedido não conta para este episódio */
  ok({ alteracao: alt, rastreio: '2026-09-11T00:00:00Z', inspeccao: '2026-09-12T00:00:00Z', pedido: '2026-09-05T00:00:00Z' }, 'RASTREADO_SEM_PEDIDO', 'SIM');
  /* rastreio no próprio instante da alteração não é posterior */
  ok({ alteracao: alt, rastreio: alt, inspeccao: '2026-09-12T00:00:00Z' }, 'PENDENTE', 'NAO');
});

test('escolha: primeiro episódios abertos (os mais antigos), depois nunca vistas, depois as de há mais de uma semana', () => {
  const agora = '2026-09-13T12:00:00Z';
  const universo = ['/ok/', '/nova/', '/velha/', '/ep-recente/', '/ep-antigo/', '/ep-visto-hoje/', '/fechado/'];
  const google = [
    { caminho: '/ok/', ultima_inspeccao_em: '2026-09-12T00:00:00Z', ultimo_rastreio: '2026-09-01T00:00:00Z' },
    { caminho: '/velha/', ultima_inspeccao_em: '2026-09-01T00:00:00Z', ultimo_rastreio: '2026-08-01T00:00:00Z' },
    { caminho: '/ep-recente/', ultima_inspeccao_em: '2026-09-11T00:00:00Z', ultimo_rastreio: '2026-08-01T00:00:00Z' },
    { caminho: '/ep-visto-hoje/', ultima_inspeccao_em: '2026-09-13T06:00:00Z', ultimo_rastreio: '2026-08-01T00:00:00Z' },
    { caminho: '/fechado/', ultima_inspeccao_em: '2026-09-12T00:00:00Z', ultimo_rastreio: '2026-09-12T00:00:00Z' }
  ];
  const alteracoes = [
    { caminho: '/ep-recente/', ultima_alteracao_em: '2026-09-10T00:00:00Z' },
    { caminho: '/ep-antigo/', ultima_alteracao_em: '2026-09-02T00:00:00Z' },
    { caminho: '/ep-visto-hoje/', ultima_alteracao_em: '2026-09-02T00:00:00Z' },
    { caminho: '/fechado/', ultima_alteracao_em: '2026-09-10T00:00:00Z' },
    { caminho: '/fora-do-sitemap/', ultima_alteracao_em: '2026-09-10T00:00:00Z' }
  ];
  assert.deepEqual(escolherParaInspeccionar(universo, google, alteracoes, agora, 10),
    ['/ep-antigo/', '/ep-recente/', '/nova/', '/velha/'],
    'visto há menos de 20 h não se repete; episódio fechado e inspecção recente esperam pela semana');
  assert.deepEqual(escolherParaInspeccionar(universo, google, alteracoes, agora, 2), ['/ep-antigo/', '/ep-recente/']);
});

test('resultado: lê o que o Google devolve, sem inventar o que falta', () => {
  const l = lerResultado('/a/', { inspectionResult: {
    indexStatusResult: { verdict: 'NEUTRAL', coverageState: 'Rastreada, mas não indexada', lastCrawlTime: '2026-09-01T00:00:00Z',
      referringUrls: Array.from({ length: 30 }, (_, i) => 'https://x/' + i), sitemap: ['https://happysoaring.com/sitemap.xml'] },
    richResultsResult: { verdict: 'PASS', detectedItems: [{ richResultType: 'FAQ' }] }
  } }, '2026-09-13T12:00:00Z');
  assert.equal(l.veredicto, 'NEUTRAL');
  assert.equal(l.ultimo_rastreio, '2026-09-01T00:00:00Z');
  assert.equal(JSON.parse(l.referencias).length, 20);
  assert.deepEqual(JSON.parse(l.resultados_ricos), { veredicto: 'PASS', tipos: ['FAQ'], problemas: [] });
  assert.equal(l.canonico_google, null);
  const vazio = lerResultado('/b/', {}, '2026-09-13T12:00:00Z');
  assert.equal(vazio.ultimo_rastreio, null);
  assert.equal(vazio.erro, null);
});

/* ------------------------------------------------------------ execução -- */

test('ciclo: inspecciona, guarda o bruto no R2 e as observações na base; a fila responde à pergunta do rastreio', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const env = envCom(db);
  alterar(db, ['/a/', '/b/'], '2026-09-10T10:00:00.000Z');
  const g = googleFalso({ rastreios: { '/': '2026-09-12T08:00:00Z', '/a/': '2026-09-11T08:00:00Z', '/b/': '2026-09-01T08:00:00Z' } });

  const r = await executarCicloInspeccao(env, { fetchImpl: g, agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(r.inspeccionadas, 3);
  assert.equal(r.com_erro, 0);
  assert.equal(r.rastreios_novos, 3);
  assert.ok(r.orcamento.pedidos <= ORCAMENTO_INSPECCAO.pedidos && r.orcamento.consultas <= ORCAMENTO_INSPECCAO.consultas);
  assert.equal(env.r2.length, 1, 'um só objecto bruto por execução');
  assert.match(env.r2[0].k, /^inspecoes\/2026-09-13T12-00-00-000Z\.json$/);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM inspecoes').first()).n, 3);

  const f = await lerIndexacao(db, { agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(f.nota, NOTA_RASTREIO);
  const por = Object.fromEntries(f.paginas.map(p => [p.caminho, p]));
  assert.equal(por['/a/'].estado, 'RASTREADO_SEM_PEDIDO');
  assert.equal(por['/a/'].rastreio_posterior, 'SIM');
  assert.equal(por['/b/'].estado, 'PENDENTE');
  assert.equal(por['/'].estado, null, 'sem alteração observada não há episódio');
  assert.equal(f.paginas[0].caminho, '/b/', 'o que pede acção vem primeiro');
  assert.deepEqual({ p: f.resumo.por_pedir, i: f.resumo.inspeccionadas }, { p: 1, i: 3 });
  assert.equal(por['/a/'].canonico_divergente, false);

  /* o Paulo pede a indexação de /b/ … */
  await registarPedido(db, '/b/', '2026-09-13T13:00:00.000Z');
  assert.equal((await lerIndexacao(db)).paginas.find(p => p.caminho === '/b/').estado, 'PEDIDO');

  /* … e no dia seguinte o Google já lá voltou */
  const g2 = googleFalso({ rastreios: { '/b/': '2026-09-14T01:00:00Z' } });
  const r2 = await executarCicloInspeccao(env, { fetchImpl: g2, agora: '2026-09-14T12:00:00.000Z' });
  assert.equal(g2.inspeccoes(), 1, 'só o episódio aberto é reinspeccionado; as outras esperam pela semana');
  assert.equal(r2.rastreios_novos, 1);
  const b = (await lerIndexacao(db)).paginas.find(p => p.caminho === '/b/');
  assert.equal(b.estado, 'RASTREADO_DEPOIS_DO_PEDIDO');
  assert.equal(b.atraso_horas, 12);

  /* uma resposta sem data de rastreio não apaga o rastreio conhecido */
  const g3 = googleFalso({});
  await executarCicloInspeccao(env, { fetchImpl: g3, agora: '2026-09-22T12:00:00.000Z' });
  const a = await db.prepare("SELECT ultimo_rastreio FROM paginas_google WHERE caminho = '/a/'").first();
  assert.equal(a.ultimo_rastreio, '2026-09-11T08:00:00Z');
});

test('quota esgotada (429): pausa, limitação registada, nada inventado — e retoma depois da pausa', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const env = envCom(db);
  const g = googleFalso({ paginas: ['/a/', '/b/', '/c/'], estados: { '/b/': 429 } });
  const r = await executarCicloInspeccao(env, { fetchImpl: g, agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(r.motivo, 'QUOTA_ESGOTADA');
  assert.equal(g.inspeccoes(), 2, 'pára no primeiro 429');
  assert.equal(r.inspeccionadas, 1, 'o que já foi lido fica guardado');
  const ev = await db.prepare("SELECT COUNT(*) AS n FROM eventos_operacionais WHERE tipo = 'INSPECCAO_QUOTA_ESGOTADA'").first();
  assert.equal(ev.n, 1);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM inspecoes WHERE erro IS NOT NULL').first()).n, 0,
    'quota esgotada é limitação da execução, não resultado da página');

  const f = await lerIndexacao(db, { agora: '2026-09-13T12:30:00.000Z' });
  assert.ok(f.limitacoes.quota_esgotada_hoje);
  assert.equal(f.limitacoes.inspeccao_em_pausa_ate, '2026-09-13T13:00:00.000Z');

  const g2 = googleFalso({ paginas: ['/a/', '/b/', '/c/'] });
  const emPausa = await executarCicloInspeccao(env, { fetchImpl: g2, agora: '2026-09-13T12:30:00.000Z' });
  assert.equal(emPausa.motivo, 'PAUSA_QUOTA');
  assert.equal(g2.log.length, 0, 'em pausa não se pede nada ao Google');

  const depois = await executarCicloInspeccao(env, { fetchImpl: g2, agora: '2026-09-13T13:10:00.000Z' });
  assert.equal(depois.motivo, null);
  assert.equal(depois.inspeccionadas, 2, 'retoma pelas que faltam');
});

test('erro do Google numa página: fica registado como limitação dessa inspecção, as outras continuam', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const env = envCom(db);
  const g = googleFalso({ paginas: ['/a/', '/b/'], estados: { '/a/': 500 } });
  const r = await executarCicloInspeccao(env, { fetchImpl: g, agora: '2026-09-13T12:00:00.000Z' });
  assert.deepEqual({ i: r.inspeccionadas, e: r.com_erro }, { i: 1, e: 1 });
  const erro = await db.prepare("SELECT erro, veredicto FROM inspecoes WHERE caminho = '/a/'").first();
  assert.deepEqual({ ...erro }, { erro: 'HTTP_500 INTERNAL', veredicto: null });
  assert.equal(await db.prepare("SELECT 1 FROM paginas_google WHERE caminho = '/a/'").first(), null,
    'uma inspecção falhada não conta como inspeccionada');
});

test('orçamento: com muitas páginas, no máximo 30 inspecções por execução, e dentro dos limites do plano gratuito', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const env = envCom(db);
  const paginas = Array.from({ length: 120 }, (_, i) => '/p' + i + '/');
  const g = googleFalso({ paginas });
  const antes = db.cont.consultas;
  const r = await executarCicloInspeccao(env, { fetchImpl: g, agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(r.inspeccionadas, 30);
  assert.ok(g.log.length <= 45, 'pedidos: ' + g.log.length);
  assert.ok(db.cont.consultas - antes <= 45, 'consultas: ' + (db.cont.consultas - antes));
});

test('sem credencial Google: limitação registada, nenhum pedido feito', async () => {
  esquecerAcessoGoogle();
  const db = await d1Falsa();
  const g = googleFalso();
  const r = await executarCicloInspeccao(envCom(db, { GSC_REFRESH_TOKEN: '' }), { fetchImpl: g, agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(r.motivo, 'SEM_CREDENCIAL_GOOGLE');
  assert.equal(g.log.length, 0);
});

test('migração 0004: a reconstrução das últimas alterações escolhe a publicação mais recente de cada página', async () => {
  const db = await d1Falsa();
  const s = db.sqlite;
  const dep = (id, em, anterior) => s.prepare(`INSERT INTO deployments (id, short_id, url, criado_em_cf, processamento, anterior_id)
    VALUES (?, ?, 'https://x.happy-soaring.pages.dev', ?, 'PROCESSADO', ?)`).run(id, id, em, anterior);
  const pag = (d, c, resumo) => s.prepare(`INSERT INTO deployment_paginas (deployment_id, caminho, estado, resumo_conteudo, spa)
    VALUES (?, ?, 'LIDA', ?, 0)`).run(d, c, resumo);
  dep('d1', '2026-09-01T00:00:00Z', null); pag('d1', '/a/', 'a1'); pag('d1', '/b/', 'b1');
  dep('d2', '2026-09-02T00:00:00Z', 'd1'); pag('d2', '/a/', 'a2'); pag('d2', '/b/', 'b1'); pag('d2', '/c/', 'c1');
  dep('d3', '2026-09-03T00:00:00Z', 'd2'); pag('d3', '/a/', 'a3'); pag('d3', '/b/', 'b1'); pag('d3', '/c/', 'c1');

  const sql = fs.readFileSync(MIGRACOES.find(f => path.basename(f).startsWith('0004')), 'utf8');
  const insert = sql.slice(sql.indexOf('INSERT INTO paginas_alteracao'), sql.indexOf('WHERE n = 1;') + 'WHERE n = 1;'.length);
  s.exec(insert);
  const linhas = s.prepare('SELECT caminho, deployment_id, tipo FROM paginas_alteracao ORDER BY caminho').all().map(r => ({ ...r }));
  assert.deepEqual(linhas, [
    { caminho: '/a/', deployment_id: 'd3', tipo: 'conteudo' },
    { caminho: '/c/', deployment_id: 'd2', tipo: 'nova' }
  ], '/b/ nunca mudou; a primeira publicação não tem com que comparar');
});

/* ----------------------------------------------------------------- HTTP -- */

const EQUIPA = 'https://equipa-teste.cloudflareaccess.com', AUD = 'aud-teste';
const b64url = x => Buffer.from(x).toString('base64url');
async function tokenValido() {
  const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
  const cab = b64url(JSON.stringify({ alg: 'RS256', kid: 'k' }));
  const agora = Math.floor(Date.now() / 1000);
  const corpo = b64url(JSON.stringify({ aud: [AUD], iss: EQUIPA, email: 'paulo.pereira@happysoaring.com', exp: agora + 600 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(cab + '.' + corpo));
  return { token: cab + '.' + corpo + '.' + b64url(new Uint8Array(sig)), chave: { kid: 'k', kty: jwk.kty, n: jwk.n, e: jwk.e } };
}

test('API: a fila lê-se atrás do Access; registar um pedido exige JSON, cabeçalho próprio e a mesma origem', async () => {
  const db = await d1Falsa();
  alterar(db, ['/a/'], new Date(Date.now() - 3 * 864e5).toISOString());
  const { token, chave } = await tokenValido();
  const original = globalThis.fetch;
  globalThis.fetch = async u => String(u) === EQUIPA + '/cdn-cgi/access/certs'
    ? new Response(JSON.stringify({ keys: [chave] })) : new Response('rede proibida', { status: 599 });
  limparCacheChaves();
  try {
    const env = { ...envCom(db), ACCESS_TEAM_DOMAIN: 'equipa-teste.cloudflareaccess.com', ACCESS_AUD: AUD,
      EMAILS_AUTORIZADOS: 'paulo.pereira@happysoaring.com', ASSETS: { fetch: async () => new Response('ui') } };
    const URL_PEDIDO = 'https://happysoaring.com/inteligencia/api/indexacao/pedido';
    const pedir = (cab = {}, corpo = { caminho: '/a/' }, metodo = 'POST') => worker.fetch(new Request(URL_PEDIDO, {
      method: metodo, body: metodo === 'POST' ? JSON.stringify(corpo) : undefined,
      headers: { 'Cf-Access-Jwt-Assertion': token, 'content-type': 'application/json', 'x-hs-inteligencia': '1', ...cab }
    }), env);

    const semToken = await worker.fetch(new Request('https://happysoaring.com/inteligencia/api/indexacao'), env);
    assert.equal(semToken.status, 403);
    const semTokenPost = await worker.fetch(new Request(URL_PEDIDO, { method: 'POST', body: '{"caminho":"/a/"}',
      headers: { 'content-type': 'application/json', 'x-hs-inteligencia': '1' } }), env);
    assert.equal(semTokenPost.status, 403);

    const fila = await worker.fetch(new Request('https://happysoaring.com/inteligencia/api/indexacao',
      { headers: { 'Cf-Access-Jwt-Assertion': token } }), env);
    assert.equal(fila.status, 200);
    assert.equal((await fila.json()).paginas[0].estado, 'SEM_INSPECCAO');

    assert.equal((await pedir({ 'x-hs-inteligencia': '' })).status, 403, 'sem o cabeçalho do módulo');
    assert.equal((await pedir({ origin: 'https://outro-site.example' })).status, 403, 'outra origem');
    assert.equal((await pedir({ 'content-type': 'text/plain' })).status, 403, 'formulário simples');
    assert.equal((await pedir({}, null, 'GET')).status, 404, 'não é uma leitura');
    assert.equal((await pedir({}, { caminho: '/../admin/' })).status, 400);
    assert.equal((await pedir({}, { caminho: 'https://x.example/' })).status, 400);
    assert.equal((await pedir({}, { caminho: '/a/', pedido_em: '2026-01-01T00:00:00Z' })).status, 400, 'data antiga');
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM pedidos_indexacao').first()).n, 0, 'nada recusado foi gravado');

    const ok = await pedir({ origin: 'https://happysoaring.com' });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('cache-control'), 'no-store');
    const depois = await ok.json();
    assert.ok(depois.paginas.find(p => p.caminho === '/a/').pedido_em);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM pedidos_indexacao').first()).n, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test('resultados enriquecidos: guardam-se as mensagens de erro do Google, sem repetições', () => {
  const l = lerResultado('/asas/x/', { inspectionResult: { indexStatusResult: {}, richResultsResult: { verdict: 'FAIL', detectedItems: [
    { richResultType: 'Fragmentos do produto', items: [{ name: 'X', issues: [{ issueMessage: 'Falta offers.', severity: 'ERROR' }, { issueMessage: 'Aviso.', severity: 'WARNING' }] },
      { name: 'Y', issues: [{ issueMessage: 'Falta offers.', severity: 'ERROR' }] }] },
    { richResultType: 'Guias de navegação', items: [{ name: 'Item sem nome' }] }
  ] } } }, '2026-09-13T12:00:00Z');
  assert.deepEqual(JSON.parse(l.resultados_ricos).problemas, ['Fragmentos do produto: Falta offers.']);
});
