/* Fase 2 — publicações. Corre contra uma base SQLite real com as migrações
   aplicadas e um site falso servido por um fetch simulado. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizarHtml, sha1, caminhosDoSitemap, eSpa, ficheirosDeDados, classificarAlteracoes,
  executarCiclo, listarPublicacoes, detalhePublicacao, estadoPublicacoes, ORCAMENTO
} from '../src/publicacoes.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MODULO = path.join(AQUI, '..');
const RAIZ = path.join(MODULO, '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

/* ---- uma D1 falsa sobre node:sqlite, com os limites do plano gratuito ---- */
async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
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

/* ---- um site falso com duas publicações ---- */
const pagina = (titulo, v = 'aaaaaaaa', spa = false) =>
  `<!doctype html><html><head><title>${titulo}</title><link rel="stylesheet" href="/pagina.css?v=${v}">` +
  (spa ? `<script src="/app.js?v=${v}" defer></script>` : '') + `</head><body><h1>${titulo}</h1></body></html>`;
const sitemap = caminhos => '<?xml version="1.0"?><urlset>' +
  caminhos.map(c => `<url><loc>https://happysoaring.com${c}</loc></url>`).join('') + '</urlset>';
const EXTRA = Array.from({ length: 60 }, (_, i) => '/extra-' + i + '/');

const A = { id: 'aaaaaaaa-0000-4000-8000-000000000001', short_id: 'aaaaaaaa', url: 'https://aaaaaaaa.happy-soaring.pages.dev',
  created_on: '2026-09-12T10:00:00.000Z', environment: 'production', latest_stage: { name: 'deploy', status: 'success' } };
const B = { id: 'bbbbbbbb-0000-4000-8000-000000000002', short_id: 'bbbbbbbb', url: 'https://bbbbbbbb.happy-soaring.pages.dev',
  created_on: '2026-09-12T11:00:00.000Z', environment: 'production', latest_stage: { name: 'deploy', status: 'success' } };
const FALHADO = { id: 'cccccccc-0000-4000-8000-000000000003', short_id: 'cccccccc', url: 'https://cccccccc.happy-soaring.pages.dev',
  created_on: '2026-09-12T10:30:00.000Z', environment: 'production', latest_stage: { name: 'deploy', status: 'failure' } };

function site() {
  const r = new Map();
  const pôr = (base, caminho, corpo, estado = 200) => r.set(base + caminho, { corpo, estado });
  /* A */
  pôr(A.url, '/meta.json', JSON.stringify({ commit: 'a'.repeat(40), sujo: false, publicado: A.created_on, impressao: '1111' }));
  pôr(A.url, '/sitemap.xml', sitemap(['/', '/a/', '/b/', '/c/', ...EXTRA]));
  pôr(A.url, '/', pagina('Inicial', 'aaaaaaaa', true));
  pôr(A.url, '/a/', pagina('A versão 1'));
  pôr(A.url, '/b/', pagina('B', 'aaaaaaaa'));
  pôr(A.url, '/c/', pagina('C'));
  for (const e of EXTRA) pôr(A.url, e, pagina('Extra ' + e));
  pôr(A.url, '/content/settings.json', JSON.stringify({ slides: ['hero'], avisos: [] }));
  pôr(A.url, '/content/tema.json', '{}');
  pôr(A.url, '/content/cores/flow-tecidos.json', '[]');
  pôr(A.url, '/content/slides/hero.json', JSON.stringify({ titulo: 'Olá' }));
  /* B: /a/ muda o texto, /b/ só o carimbo, /c/ sai, /d/ entra, o slide do CMS muda */
  pôr(B.url, '/meta.json', JSON.stringify({ commit: 'b'.repeat(40), sujo: true, publicado: B.created_on, impressao: '2222' }));
  pôr(B.url, '/sitemap.xml', sitemap(['/', '/a/', '/b/', '/d/', ...EXTRA]));
  pôr(B.url, '/', pagina('Inicial', 'bbbbbbbb', true));
  pôr(B.url, '/a/', pagina('A versão 2'));
  pôr(B.url, '/b/', pagina('B', 'bbbbbbbb'));
  pôr(B.url, '/d/', pagina('D'));
  for (const e of EXTRA) pôr(B.url, e, pagina('Extra ' + e, 'bbbbbbbb'));
  pôr(B.url, '/content/settings.json', JSON.stringify({ slides: ['hero'], avisos: [] }));
  pôr(B.url, '/content/tema.json', '{}');
  pôr(B.url, '/content/cores/flow-tecidos.json', '[]');
  pôr(B.url, '/content/slides/hero.json', JSON.stringify({ titulo: 'Olá outra vez' }));
  return r;
}

function fetchFalso({ recursos = site(), deployments = [B, FALHADO, A], apiEstado = 200 } = {}) {
  const log = [];
  const f = async (url) => {
    const u = String(url);
    log.push(u);
    if (u.startsWith('https://api.cloudflare.com/')) {
      if (apiEstado !== 200) return new Response('{}', { status: apiEstado });
      return new Response(JSON.stringify({ success: true, result: deployments, result_info: { page: 1, total_pages: 1 } }),
        { headers: { 'content-type': 'application/json' } });
    }
    const x = recursos.get(u);
    if (!x) return new Response('não existe', { status: 404 });
    return new Response(x.corpo, { status: x.estado });
  };
  f.log = log;
  return f;
}

const envCom = (db, extra = {}) => ({
  DB: db, BRUTO: { put: async () => {}, list: async () => ({ objects: [] }) },
  CF_ACCOUNT_ID: 'conta', CF_PAGES_PROJECT: 'happy-soaring', CF_API_TOKEN_PAGES: 'token-de-teste', ...extra
});

/* ---------------------------------------------------------------- puro -- */

test('normalizar: tira só os carimbos ?v= de 8 hexadecimais antes de aspas', () => {
  assert.equal(normalizarHtml('<link href="/pagina.css?v=46fb021d"><a href="/x?v=1">'), '<link href="/pagina.css"><a href="/x?v=1">');
});

test('sitemap: caminhos únicos, e entradas inválidas ignoradas', () => {
  assert.deepEqual(caminhosDoSitemap(sitemap(['/', '/a/', '/a/']) + '<loc>lixo</loc>'), ['/', '/a/']);
});

test('SPA: só páginas que carregam o app.js', () => {
  assert.equal(eSpa(pagina('x', 'aaaaaaaa', true)), true);
  assert.equal(eSpa(pagina('x')), false);
});

test('dados: os ficheiros que a inicial carrega, a partir do settings.json, sem caminhos perigosos', () => {
  const f = ficheirosDeDados({ slides: ['hero', '../segredo', 'mapa'], avisos: ['faixa'] });
  assert.deepEqual(f, ['/content/settings.json', '/content/tema.json', '/content/cores/flow-tecidos.json',
    '/content/slides/hero.json', '/content/slides/mapa.json', '/content/avisos/faixa.json']);
  assert.deepEqual(ficheirosDeDados(null).length, 3);
});

test('contrato com o app.js do site: a inicial continua a carregar os dados desta maneira', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
  assert.match(app, /fetch\('\/content\/settings\.json'\)/);
  assert.match(app, /fetch\('\/content\/tema\.json'\)/);
  assert.match(app, /settings\.slides/);
  assert.match(app, /fetch\('\/content\/slides\/' \+ id \+ '\.json'\)/);
  assert.match(app, /settings\.avisos/);
  assert.match(app, /fetch\('\/content\/avisos\/' \+ id \+ '\.json'\)/);
  assert.match(app, /fetch\('\/content\/cores\/flow-tecidos\.json'\)/);
});

test('dados reais: o HTML publicado, sem carimbos, é igual à fonte gerada (quando _publicar/ existe)', async (t) => {
  const pub = path.join(RAIZ, '_publicar');
  if (!fs.existsSync(pub)) { t.skip('_publicar/ não existe neste computador'); return; }
  const locs = caminhosDoSitemap(fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8'));
  let comparadas = 0;
  for (const c of locs) {
    const f = c.replace(/^\//, '') + 'index.html';
    const a = path.join(pub, f), b = path.join(RAIZ, f);
    if (!fs.existsSync(a) || !fs.existsSync(b)) continue;
    assert.equal(normalizarHtml(fs.readFileSync(a, 'utf8')), fs.readFileSync(b, 'utf8'), c);
    comparadas++;
  }
  assert.ok(comparadas > 100, 'comparadas ' + comparadas);
});

test('classificar: sem anterior não há comparação', () => {
  assert.equal(classificarAlteracoes(null, { paginas: new Map(), dados: new Map() }), null);
});

/* ------------------------------------------------------------ processar -- */

test('ciclo completo: duas publicações observadas, a falhada ignorada, e as alterações certas', async () => {
  const db = await d1Falsa();
  const env = envCom(db);
  const f = fetchFalso();
  let ciclos = 0;
  for (; ciclos < 30; ciclos++) {
    const antes = db.cont.consultas;
    const r = await executarCiclo(env, { fetchImpl: f });
    assert.ok(r.orcamento.pedidos <= ORCAMENTO.pedidos + 1, 'pedidos por execução: ' + r.orcamento.pedidos);
    assert.ok(db.cont.consultas - antes <= 50, 'consultas D1 por execução: ' + (db.cont.consultas - antes));
    const pend = (await db.prepare("SELECT COUNT(*) AS n FROM deployments WHERE processamento='PENDENTE'").first()).n;
    if (!pend && ciclos > 0) break;
  }
  assert.ok(ciclos < 30, 'não terminou');
  assert.ok(ciclos >= 3, 'com 64 páginas por publicação tem de precisar de várias execuções');

  const lista = await listarPublicacoes(db);
  assert.deepEqual(lista.map(x => x.short_id), ['bbbbbbbb', 'aaaaaaaa'], 'a falhada não aparece');
  const ign = await db.prepare('SELECT processamento FROM deployments WHERE id=?').bind(FALHADO.id).first();
  assert.equal(ign.processamento, 'IGNORADO');

  const b = await detalhePublicacao(db, B.id);
  assert.equal(b.publicacao.anterior_id, A.id);
  assert.equal(b.publicacao.meta_sujo, 1);
  assert.equal(b.publicacao.paginas_total, 64);
  assert.deepEqual(b.alteracoes.conteudo, ['/a/']);
  assert.deepEqual(b.alteracoes.dados, ['/']);
  assert.deepEqual(b.alteracoes.nova, ['/d/']);
  assert.deepEqual(b.alteracoes.retirada, ['/c/']);
  assert.deepEqual(b.alteracoes.tecnica, ['/b/', ...EXTRA].sort(), 'mudar só o carimbo é técnico, não conteúdo');
  assert.equal(b.alteracoes.igual.length, 0);

  const a = await detalhePublicacao(db, A.id);
  assert.equal(a.alteracoes, null, 'a primeira publicação não tem anterior');

  const est = await estadoPublicacoes(db, env);
  assert.deepEqual({ p: est.processadas, n: est.pendentes, c: est.credencial }, { p: 2, n: 0, c: true });
});

test('publicações processadas por ordem cronológica, mesmo quando a API lista a mais recente primeiro', async () => {
  const db = await d1Falsa();
  const env = envCom(db);
  const f = fetchFalso();
  for (let i = 0; i < 30; i++) await executarCiclo(env, { fetchImpl: f });
  const ordem = f.log.filter(u => u.endsWith('/meta.json'));
  assert.deepEqual(ordem, [A.url + '/meta.json', B.url + '/meta.json']);
});

test('cada publicação é lida no SEU endereço — a de produção actual nunca é usada', async () => {
  const db = await d1Falsa();
  const f = fetchFalso();
  for (let i = 0; i < 30; i++) await executarCiclo(envCom(db), { fetchImpl: f });
  assert.ok(!f.log.some(u => u.startsWith('https://happysoaring.com')));
});

test('sem credencial do Pages: nada é inventado, fica uma limitação registada', async () => {
  const db = await d1Falsa();
  const env = envCom(db, { CF_API_TOKEN_PAGES: '' });
  const f = fetchFalso();
  const r = await executarCiclo(env, { fetchImpl: f });
  assert.equal(r.motivo, 'SEM_CREDENCIAL_PAGES');
  assert.equal(f.log.length, 0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM deployments').first()).n, 0);
  const ev = await db.prepare('SELECT tipo FROM eventos_operacionais').first();
  assert.equal(ev.tipo, 'PUBLICACOES_SEM_CREDENCIAL_PAGES');
  assert.equal((await estadoPublicacoes(db, env)).credencial, false);
});

test('API do Pages em falha: limitação registada, e nada processado', async () => {
  const db = await d1Falsa();
  const r = await executarCiclo(envCom(db), { fetchImpl: fetchFalso({ apiEstado: 403 }) });
  assert.equal(r.motivo, 'API_PAGES_HTTP_403');
  assert.equal((await db.prepare('SELECT tipo FROM eventos_operacionais').first()).tipo, 'PUBLICACOES_API_PAGES_HTTP_403');
});

test('publicação cujo endereço já não existe: FALHOU, com a razão — não bloqueia as outras', async () => {
  const db = await d1Falsa();
  const recursos = site();
  for (const k of [...recursos.keys()]) if (k.startsWith(A.url)) recursos.delete(k);
  const f = fetchFalso({ recursos });
  for (let i = 0; i < 30; i++) await executarCiclo(envCom(db), { fetchImpl: f });
  const a = await db.prepare('SELECT processamento, erro, meta_estado FROM deployments WHERE id=?').bind(A.id).first();
  assert.deepEqual({ ...a }, { processamento: 'FALHOU', erro: 'SITEMAP_HTTP_404', meta_estado: 'AUSENTE' });
  const b = await detalhePublicacao(db, B.id);
  assert.equal(b.publicacao.processamento, 'PROCESSADO');
  assert.equal(b.publicacao.anterior_id, null, 'sem anterior processada, não se compara com uma falhada');
});

test('uma página em erro fica «sem leitura» — limitação, não alteração', async () => {
  const db = await d1Falsa();
  const recursos = site();
  recursos.set(B.url + '/a/', { corpo: 'erro', estado: 500 });
  const f = fetchFalso({ recursos });
  for (let i = 0; i < 30; i++) await executarCiclo(envCom(db), { fetchImpl: f });
  const b = await detalhePublicacao(db, B.id);
  assert.deepEqual(b.alteracoes.sem_leitura, ['/a/']);
  assert.ok(!b.alteracoes.conteudo.includes('/a/'));
});

test('descoberta: executar outra vez não duplica nem reprocessa', async () => {
  const db = await d1Falsa();
  const f = fetchFalso();
  for (let i = 0; i < 30; i++) await executarCiclo(envCom(db), { fetchImpl: f });
  const pedidosAntes = f.log.length;
  const r = await executarCiclo(envCom(db), { fetchImpl: f });
  assert.equal(r.descobertos, 0);
  assert.equal(f.log.length - pedidosAntes, 1, 'só a listagem da API');
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM deployments').first()).n, 3);
});

test('sha1 do Worker é igual ao do Node — o mesmo algoritmo do sitemap-datas.json', async () => {
  const { createHash } = await import('node:crypto');
  const t = pagina('Ação e ç', 'aaaaaaaa');
  assert.equal(await sha1(t), createHash('sha1').update(t).digest('hex'));
});

test('a mesma limitação repetida grava-se no máximo uma vez por hora', async () => {
  const db = await d1Falsa();
  const env = envCom(db, { CF_API_TOKEN_PAGES: '' });
  for (let i = 0; i < 5; i++) await executarCiclo(env, { fetchImpl: fetchFalso() });
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM eventos_operacionais').first()).n, 1);
});

/* ---- as rotas da API e a tarefa agendada, através do Worker ---- */
import worker from '../src/index.js';
import { limparCacheChaves } from '../src/acesso.js';

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

test('API: /api/alteracoes e /api/alteracoes/<id> atrás do Access; tarefa agendada avança sozinha', async () => {
  const db = await d1Falsa();
  const { token, chave } = await tokenValido();
  const site = fetchFalso();
  const original = globalThis.fetch;
  globalThis.fetch = async (u, i) => String(u) === EQUIPA + '/cdn-cgi/access/certs'
    ? new Response(JSON.stringify({ keys: [chave] })) : site(u, i);
  limparCacheChaves();
  try {
    const env = { ...envCom(db), ACCESS_TEAM_DOMAIN: 'equipa-teste.cloudflareaccess.com', ACCESS_AUD: AUD,
      EMAILS_AUTORIZADOS: 'paulo.pereira@happysoaring.com', ASSETS: { fetch: async () => new Response('ui') } };

    for (let i = 0; i < 30; i++) {
      const esperas = [];
      await worker.scheduled({}, env, { waitUntil: p => esperas.push(p) });
      await Promise.all(esperas);
    }

    const pedir = c => worker.fetch(new Request('https://happysoaring.com/inteligencia' + c,
      { headers: { 'Cf-Access-Jwt-Assertion': token } }), env);

    const semToken = await worker.fetch(new Request('https://happysoaring.com/inteligencia/api/alteracoes'), env);
    assert.equal(semToken.status, 403);

    const lista = await (await pedir('/api/alteracoes')).json();
    assert.equal(lista.publicacoes.length, 2);

    const det = await pedir('/api/alteracoes/' + B.id);
    assert.equal(det.status, 200);
    assert.deepEqual((await det.json()).alteracoes.conteudo, ['/a/']);

    assert.equal((await pedir('/api/alteracoes/00000000-0000-4000-8000-000000000000')).status, 404);
    assert.equal((await pedir('/api/alteracoes/nao-e-um-id')).status, 404);

    const est = await (await pedir('/api/estado')).json();
    assert.equal(est.fontes.publicacoes.processadas, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test('API do Pages: a primeira página vai sem `page` (com page=1 a API responde 400)', async () => {
  const db = await d1Falsa();
  const f = fetchFalso();
  await executarCiclo(envCom(db), { fetchImpl: f });
  const pedidosApi = f.log.filter(u => u.startsWith('https://api.cloudflare.com/'));
  assert.equal(pedidosApi.length, 1);
  assert.match(pedidosApi[0], /\/deployments\?env=production$/);
});
