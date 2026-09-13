/* Testes da Fase 1 — sem rede, sem Cloudflare.
   Correr a partir da raiz do repositório:  node --test "inteligencia/test/*.test.mjs" */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { limparCacheChaves } from '../src/acesso.js';

const EQUIPA = 'https://happysoaring-teste.cloudflareaccess.com';
const AUD = 'aud-de-teste-123';
const EMAIL = 'paulo.pereira@happysoaring.com';
const BASE = 'https://happysoaring.com/inteligencia';

const b64url = bytes => Buffer.from(bytes).toString('base64url');

async function parDeChaves(kid) {
  const par = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
  return { privada: par.privateKey, jwk: { kid, kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256' } };
}

async function assinar(chave, kid, carga) {
  const cab = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const corpo = b64url(JSON.stringify(carga));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(cab + '.' + corpo));
  return cab + '.' + corpo + '.' + b64url(new Uint8Array(sig));
}

const agora = () => Math.floor(Date.now() / 1000);
const cargaValida = (extra = {}) => ({ aud: [AUD], iss: EQUIPA, email: EMAIL, exp: agora() + 600, iat: agora(), ...extra });

const chaveBoa = await parDeChaves('k1');
const chaveEstranha = await parDeChaves('k1');   /* mesmo kid, outra chave */

const fetchOriginal = globalThis.fetch;
let pedidosCerts = 0;
test.beforeEach(() => {
  limparCacheChaves();
  pedidosCerts = 0;
  globalThis.fetch = async (url) => {
    if (String(url) === EQUIPA + '/cdn-cgi/access/certs') {
      pedidosCerts++;
      return new Response(JSON.stringify({ keys: [chaveBoa.jwk] }), { headers: { 'content-type': 'application/json' } });
    }
    throw new Error('rede proibida nos testes: ' + url);
  };
});
test.after(() => { globalThis.fetch = fetchOriginal; });

function envFalso(extra = {}) {
  const linhas = {
    'SELECT valor': { valor: '1' },
    'SELECT COUNT': { n: 0 }
  };
  const db = {
    prepare(sql) {
      return {
        first: async () => {
          for (const [k, v] of Object.entries(linhas)) if (sql.startsWith(k)) return v;
          return null;
        },
        all: async () => ({
          results: sql.includes('objectivos_negocio')
            ? [{ id: 'voos', nome: 'Voos de parapente', importancia: null, activo: 1 }]
            : sql.includes('termos_marca') ? [{ termo: 'happy soaring', tipo: 'MARCA' }] : []
        })
      };
    }
  };
  return {
    ACCESS_TEAM_DOMAIN: 'happysoaring-teste.cloudflareaccess.com',
    ACCESS_AUD: AUD,
    EMAILS_AUTORIZADOS: EMAIL,
    DB: db,
    BRUTO: { list: async () => ({ objects: [] }) },
    ASSETS: { fetch: async () => new Response('<!doctype html><title>ui</title>', { headers: { 'content-type': 'text/html' } }) },
    ...extra
  };
}

const pedido = (caminho, token, init = {}) => new Request(BASE + caminho, {
  ...init, headers: { ...(token ? { 'Cf-Access-Jwt-Assertion': token } : {}), ...(init.headers || {}) }
});

function temCabecalhosSeguranca(r) {
  assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.match(r.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
}

/* ---- falha fechado ---------------------------------------------------- */

test('sem configuração do Access, recusa tudo com 503 — mesmo com token válido', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  for (const env of [envFalso({ ACCESS_AUD: '' }), envFalso({ ACCESS_TEAM_DOMAIN: '' }), envFalso({ EMAILS_AUTORIZADOS: '' })]) {
    const r = await worker.fetch(pedido('/', token), env);
    assert.equal(r.status, 503);
    temCabecalhosSeguranca(r);
  }
});

test('sem token, 403 e nenhum ficheiro da interface é servido', async () => {
  let servido = false;
  const env = envFalso({ ASSETS: { fetch: async () => { servido = true; return new Response('x'); } } });
  const r = await worker.fetch(pedido('/'), env);
  assert.equal(r.status, 403);
  assert.equal(servido, false);
  temCabecalhosSeguranca(r);
});

test('sem token, a API também recusa', async () => {
  const r = await worker.fetch(pedido('/api/estado'), envFalso());
  assert.equal(r.status, 403);
});

/* ---- token válido ------------------------------------------------------ */

test('token válido do email autorizado: interface servida com cabeçalhos de segurança', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(pedido('/', token), envFalso());
  assert.equal(r.status, 200);
  temCabecalhosSeguranca(r);
});

test('token válido: /api/estado devolve identidade, sistema e configuração', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(pedido('/api/estado', token), envFalso());
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.identidade, EMAIL);
  assert.equal(d.fase, 3);
  assert.equal(d.sistema.base.ok, true);
  assert.equal(d.sistema.armazenamento_bruto.ok, true);
  assert.equal(d.configuracao.objectivos[0].importancia, null);
  assert.equal(d.configuracao.concorrentes, 0);
});

test('o email é comparado sem diferença de maiúsculas', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida({ email: 'Paulo.Pereira@HappySoaring.com' }));
  const r = await worker.fetch(pedido('/', token), envFalso());
  assert.equal(r.status, 200);
});

test('o cookie CF_Authorization também é aceite quando não há cabeçalho', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(pedido('/', null, { headers: { Cookie: 'x=1; CF_Authorization=' + token } }), envFalso());
  assert.equal(r.status, 200);
});

test('as chaves públicas ficam em cache entre pedidos', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  await worker.fetch(pedido('/', token), envFalso());
  await worker.fetch(pedido('/', token), envFalso());
  assert.equal(pedidosCerts, 1);
});

/* ---- tokens inválidos -------------------------------------------------- */

const casosInvalidos = [
  ['assinatura de outra chave', async () => assinar(chaveEstranha.privada, 'k1', cargaValida())],
  ['audiência errada', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ aud: ['outra-aud'] }))],
  ['emissor errado', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ iss: 'https://outra.cloudflareaccess.com' }))],
  ['expirado', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ exp: agora() - 3600 }))],
  ['ainda não válido', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ nbf: agora() + 3600 }))],
  ['email não autorizado', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ email: 'outra@pessoa.com' }))],
  ['sem email', async () => assinar(chaveBoa.privada, 'k1', cargaValida({ email: undefined }))],
  ['kid desconhecido', async () => assinar(chaveBoa.privada, 'k-que-nao-existe', cargaValida())],
  ['lixo', async () => 'isto.nao.e-um-jwt'],
  ['algoritmo none', async () => b64url(JSON.stringify({ alg: 'none', kid: 'k1' })) + '.' + b64url(JSON.stringify(cargaValida())) + '.']
];
for (const [nome, fazer] of casosInvalidos) {
  test('token inválido — ' + nome + ' — 403', async () => {
    const r = await worker.fetch(pedido('/api/estado', await fazer()), envFalso());
    assert.equal(r.status, 403);
    temCabecalhosSeguranca(r);
  });
}

test('se as chaves do Access não estão disponíveis, falha fechado (503)', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  globalThis.fetch = async () => new Response('erro', { status: 500 });
  const r = await worker.fetch(pedido('/', token), envFalso());
  assert.equal(r.status, 503);
});

/* ---- rotas ------------------------------------------------------------- */

test('/inteligencia sem barra redirecciona para /inteligencia/, depois de validar', async () => {
  const semToken = await worker.fetch(new Request('https://happysoaring.com/inteligencia'), envFalso());
  assert.equal(semToken.status, 403);
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(new Request('https://happysoaring.com/inteligencia', {
    headers: { 'Cf-Access-Jwt-Assertion': token } }), envFalso());
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), '/inteligencia/');
});

test('caminhos fora do prefixo nunca são servidos', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  for (const c of ['https://happysoaring.com/admin/', 'https://happysoaring.com/admin/inteligencia/', 'https://happysoaring.com/inteligencia-outra/',
    'https://happysoaring.com/']) {
    const r = await worker.fetch(new Request(c, { headers: { 'Cf-Access-Jwt-Assertion': token } }), envFalso());
    assert.equal(r.status, 404, c);
  }
});

test('nesta fase não há escrita: POST é recusado', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(pedido('/api/estado', token, { method: 'POST' }), envFalso());
  assert.equal(r.status, 405);
});

test('API inexistente dá 404, não cai na interface', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const r = await worker.fetch(pedido('/api/nada', token), envFalso());
  assert.equal(r.status, 404);
});

test('falha da base não parte a API: o estado diz indisponível', async () => {
  const token = await assinar(chaveBoa.privada, 'k1', cargaValida());
  const env = envFalso({ DB: { prepare() { throw new Error('D1 em baixo'); } }, BRUTO: { list: async () => { throw new Error('R2'); } } });
  const r = await worker.fetch(pedido('/api/estado', token), env);
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.sistema.base.ok, false);
  assert.equal(d.sistema.armazenamento_bruto.ok, false);
  assert.equal(d.configuracao.objectivos, null);
});
