/* Fase 5 (fim) — avisos críticos por email, pelo Resend. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escolherAviso, compor, executarCicloAvisos, enviarAvisoTeste, estadoAvisos, MAX_ENVIOS_24H } from '../src/avisos.js';
import { executarCicloAssuntos, decidirAssunto } from '../src/assuntos.js';
import { gravarPagina } from '../src/conhecimento.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
    executar: () => db.prepare(sql).run(...params)
  });
  return {
    prepare: sql => stmt(sql),
    batch: async st => { db.exec('BEGIN'); try { st.forEach(x => x.executar()); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; },
    sqlite: db
  };
}

const CHAVE_TESTE = 'chave-de-teste-nao-real';
const envCom = (db, extra = {}) => ({
  DB: db, RESEND_API_KEY: CHAVE_TESTE, AVISOS_DE: 'Inteligência <alertas@avisos.happysoaring.com>',
  AVISOS_PARA: 'paulo.pereira@happysoaring.com', ...extra
});
function resendFalso({ estado = 200 } = {}) {
  const envios = [];
  const f = async (url, init) => {
    const u = String(url);
    if (u.endsWith('/sitemap.xml')) return new Response('<urlset><loc>https://happysoaring.com/b/</loc><loc>https://happysoaring.com/c/</loc></urlset>');
    assert.equal(u, 'https://api.resend.com/emails');
    envios.push({ cab: init.headers, corpo: JSON.parse(init.body) });
    return estado === 200 ? Response.json({ id: 'email-' + envios.length }) : Response.json({ name: 'validation_error', message: 'domínio por verificar' }, { status: estado });
  };
  f.envios = envios;
  return f;
}
function critico(db, caminho, em) {
  db.sqlite.prepare(`INSERT INTO inspecoes (caminho, inspeccionado_em, veredicto, estado_indexacao, estado_robots, estado_obtencao, ultimo_rastreio)
    VALUES (?, ?, 'NEUTRAL', 'BLOCKED_BY_META_TAG', 'ALLOWED', 'SUCCESSFUL', '2026-09-01T00:00:00Z')`).run(caminho, em);
  db.sqlite.prepare(`INSERT OR REPLACE INTO paginas_google (caminho, ultima_inspeccao_em, ultimo_rastreio, veredicto) VALUES (?, ?, '2026-09-01T00:00:00Z', 'NEUTRAL')`).run(caminho, em);
}

test('escolha: um agregado por dia; excepção para página prioritária ou 3 críticos; nunca mais de 3 em 24 h', () => {
  const c = (chave, nivel = null) => ({ chave, detectado_em: '2026-09-13T10:00:00Z', nivel });
  const agora = '2026-09-13T12:00:00Z';
  const base = { avisados: new Set(), ultimoEnvio: null, enviados24h: 0, agora };
  assert.equal(escolherAviso({ ...base, criticos: [] }), null);
  assert.equal(escolherAviso({ ...base, criticos: [c('a')] }).motivo, 'DIARIO');
  const recente = { ...base, ultimoEnvio: '2026-09-13T08:00:00Z', enviados24h: 1 };
  assert.equal(escolherAviso({ ...recente, criticos: [c('a')] }), null, 'espera pelo dia seguinte');
  assert.equal(escolherAviso({ ...recente, criticos: [c('a', 1)] }).motivo, 'EXCEPCIONAL');
  assert.equal(escolherAviso({ ...recente, criticos: [c('a'), c('b'), c('c')] }).motivo, 'EXCEPCIONAL');
  assert.equal(escolherAviso({ ...recente, enviados24h: MAX_ENVIOS_24H, criticos: [c('a', 1)] }), null);
  assert.equal(escolherAviso({ ...base, avisados: new Set(['a@2026-09-13T10:00:00Z']), criticos: [c('a')] }), null, 'já avisado');
  const voltou = { chave: 'a', detectado_em: '2026-09-20T10:00:00Z' };
  assert.equal(escolherAviso({ ...base, avisados: new Set(['a@2026-09-13T10:00:00Z']), criticos: [voltou] }).assuntos.length, 1, 'regressão volta a avisar');
});

test('email: só texto, com ligação a cada assunto e ao «Hoje»', () => {
  const { assunto, texto } = compor({ motivo: 'DIARIO', assuntos: [{ id: 7, titulo: 'Página marcada para não ser indexada', caminho: '/b/', objectivos: ['Cursos e formação'], detectado_em: '2026-09-13T10:00:00Z' }] });
  assert.equal(assunto, 'Happy Soaring — 1 problema crítico');
  assert.match(texto, /https:\/\/happysoaring\.com\/inteligencia\/assunto\/\?id=7/);
  assert.match(texto, /Tudo o resto aparece no «Hoje»/);
});

test('ciclo: envia um aviso, não repete, não avisa o que já foi decidido, e regista a falha sem a chave', async () => {
  const db = await d1Falsa();
  critico(db, '/b/', '2026-09-13T09:00:00.000Z');
  const site = resendFalso();
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: '2026-09-13T10:00:00.000Z' });

  assert.equal((await executarCicloAvisos({ DB: db }, { fetchImpl: site })).motivo, 'SEM_CONFIGURACAO', 'sem chave não envia');
  assert.equal(site.envios.length, 0);

  const r = await executarCicloAvisos(envCom(db), { fetchImpl: site, agora: '2026-09-13T10:08:00.000Z' });
  assert.deepEqual([r.enviado, r.motivo, r.assuntos], [true, 'DIARIO', 1]);
  assert.equal(site.envios[0].cab.authorization, 'Bearer ' + CHAVE_TESTE);
  assert.deepEqual(site.envios[0].corpo.to, ['paulo.pereira@happysoaring.com']);
  assert.ok(site.envios[0].cab['idempotency-key']);

  const r2 = await executarCicloAvisos(envCom(db), { fetchImpl: site, agora: '2026-09-13T11:08:00.000Z' });
  assert.equal(r2.enviado, false);
  assert.equal(site.envios.length, 1, 'o mesmo problema não se repete');

  /* novo crítico numa página prioritária: excepção, mesmo dentro das 24 h */
  critico(db, '/c/', '2026-09-13T11:30:00.000Z');
  await gravarPagina(db, { caminho: '/c/', nivel: 1, objectivos: ['voos'] });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: '2026-09-13T11:38:00.000Z' });
  const idC = db.sqlite.prepare("SELECT id FROM assuntos WHERE caminho = '/c/'").get().id;
  const idB = db.sqlite.prepare("SELECT id FROM assuntos WHERE caminho = '/b/'").get().id;
  await decidirAssunto(db, idB, { decisao: 'IGNORAR', razao: 'intencional' }, { agora: '2026-09-13T11:40:00.000Z' });
  const r3 = await executarCicloAvisos(envCom(db), { fetchImpl: site, agora: '2026-09-13T12:08:00.000Z' });
  assert.deepEqual([r3.enviado, r3.motivo, r3.assuntos], [true, 'EXCEPCIONAL', 1]);
  assert.match(site.envios[1].corpo.text, new RegExp('id=' + idC));

  /* falha do Resend: fica registada só com o código */
  const db2 = await d1Falsa();
  critico(db2, '/b/', '2026-09-13T09:00:00.000Z');
  await executarCicloAssuntos({ DB: db2 }, { fetchImpl: site, agora: '2026-09-13T10:00:00.000Z' });
  const falha = resendFalso({ estado: 403 });
  const r4 = await executarCicloAvisos(envCom(db2), { fetchImpl: falha, agora: '2026-09-13T10:08:00.000Z' });
  assert.deepEqual([r4.enviado, r4.motivo], [false, 'HTTP_403 validation_error']);
  const linha = db2.sqlite.prepare('SELECT * FROM avisos').get();
  assert.equal(linha.estado, 'FALHOU');
  assert.ok(!JSON.stringify(linha).includes(CHAVE_TESTE), 'a chave nunca é gravada');
  const est = await estadoAvisos(db2, envCom(db2));
  assert.equal(est.ultima_falha.erro, 'HTTP_403 validation_error');
  assert.ok(!JSON.stringify(est).includes(CHAVE_TESTE));
});

test('aviso de teste: só com configuração, e no máximo um a cada 10 minutos', async () => {
  const db = await d1Falsa();
  const site = resendFalso();
  assert.equal((await enviarAvisoTeste({ DB: db }, { fetchImpl: site })).estado, 409);
  const r = await enviarAvisoTeste(envCom(db), { fetchImpl: site, agora: '2026-09-13T12:00:00.000Z' });
  assert.equal(r.estado, 200);
  assert.equal(r.valor.ultimo_envio.motivo, 'TESTE');
  assert.equal((await enviarAvisoTeste(envCom(db), { fetchImpl: site, agora: '2026-09-13T12:05:00.000Z' })).estado, 429);
  assert.equal(site.envios.length, 1);
});
