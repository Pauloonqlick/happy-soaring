/* Custos e limites da conta Cloudflare. Base SQLite real, sem rede (a API é falsa). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TARIFAS, ciclo, classeR2, linhasDeConsumo, calcularCiclo, recolherConsumos, lerCustos, limitesParaHoje, avisarConsumo
} from '../src/custos.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const stmt = (sql, params = []) => ({
    sql, params,
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return { meta: {} }; }
  });
  return { prepare: sql => stmt(sql), batch: async ss => { for (const s of ss) db.prepare(s.sql).run(...s.params); return []; }, sqlite: db };
}

test('o ciclo de faturação vai de renovação a renovação, também em meses curtos e na viragem do ano', () => {
  assert.deepEqual(ciclo('2026-09-14', 14), { inicio: '2026-09-14', fim: '2026-10-14' });
  assert.deepEqual(ciclo('2026-10-13', 14), { inicio: '2026-09-14', fim: '2026-10-14' });
  assert.deepEqual(ciclo('2026-09-14', 14, 1), { inicio: '2026-08-14', fim: '2026-09-14' });
  assert.deepEqual(ciclo('2026-01-05', 14), { inicio: '2025-12-14', fim: '2026-01-14' });
  assert.deepEqual(ciclo('2026-02-28', 31), { inicio: '2026-02-28', fim: '2026-03-31' });
  assert.deepEqual(ciclo('2026-03-15', 31), { inicio: '2026-02-28', fim: '2026-03-31' });
});

test('as respostas da Cloudflare viram linhas por dia, métrica e recurso', () => {
  assert.equal(classeR2('PutObject'), 'classe_a');
  assert.equal(classeR2('GetObject'), 'classe_b');
  assert.equal(classeR2('DeleteObject'), null);
  assert.equal(classeR2('AlgoNovo'), 'classe_a');
  const w = linhasDeConsumo('workers', { x: [
    { dimensions: { date: '2026-09-14', scriptName: 'hs-inteligencia' }, sum: { requests: 1000, cpuTimeUs: 2500000 } },
    { dimensions: { date: '2026-09-14', scriptName: 'hs-inteligencia' }, sum: { requests: 18, cpuTimeUs: 500000 } }
  ] });
  assert.deepEqual(w.find(l => l.metrica === 'pedidos'), { dia: '2026-09-14', produto: 'workers', metrica: 'pedidos', recurso: 'hs-inteligencia', valor: 1018 });
  assert.equal(w.find(l => l.metrica === 'cpu_ms').valor, 3000);
  const r2 = linhasDeConsumo('r2', {
    x: [{ dimensions: { date: '2026-09-14', actionType: 'PutObject', bucketName: 'b' }, sum: { requests: 5 } },
      { dimensions: { date: '2026-09-14', actionType: 'ListObjects', bucketName: 'b' }, sum: { requests: 2 } },
      { dimensions: { date: '2026-09-14', actionType: 'GetObject', bucketName: 'b' }, sum: { requests: 9 } },
      { dimensions: { date: '2026-09-14', actionType: 'DeleteObject', bucketName: 'b' }, sum: { requests: 99 } }],
    y: [{ dimensions: { date: '2026-09-14', bucketName: 'b' }, max: { payloadSize: 1000, metadataSize: 10 } }]
  });
  assert.equal(r2.find(l => l.metrica === 'classe_a').valor, 7);
  assert.equal(r2.find(l => l.metrica === 'classe_b').valor, 9);
  assert.equal(r2.find(l => l.metrica === 'armazenamento_bytes').valor, 1010);
});

test('o cálculo: uso, projecção, nível e custo acima do incluído', () => {
  const linhas = [];
  /* 3 dias de um ciclo de 30: 4 milhões de pedidos → projecção 40 milhões (4× o incluído) */
  for (const d of ['2026-09-14', '2026-09-15', '2026-09-16']) {
    linhas.push({ dia: d, produto: 'workers', metrica: 'pedidos', recurso: 'a', valor: 1e6 });
    linhas.push({ dia: d, produto: 'd1', metrica: 'armazenamento_bytes', recurso: 'x', valor: 2e9 });
  }
  linhas.push({ dia: '2026-09-16', produto: 'workers', metrica: 'pedidos', recurso: 'b', valor: 1e6 });
  const r = calcularCiclo(linhas, { fraccao: 0.1, diasCiclo: 30 });
  const M = Object.fromEntries(r.metricas.map(m => [m.id, m]));
  assert.equal(M['workers.pedidos'].usado, 4e6);
  assert.equal(M['workers.pedidos'].projeccao, 4e7);
  assert.equal(M['workers.pedidos'].nivel, 'alerta');
  assert.ok(Math.abs(M['workers.pedidos'].custo_projectado - 30 * 0.30) < 1e-9);
  assert.equal(M['workers.pedidos'].custo_actual, 0);
  assert.deepEqual(M['workers.pedidos'].recursos.map(x => x.recurso), ['a', 'b']);
  assert.equal(M['d1.armazenamento_bytes'].usado, 2e9);
  assert.equal(M['d1.armazenamento_bytes'].nivel, 'ok');
  assert.equal(M['workers.cpu_ms'].com_dados, false);
  assert.equal(r.nivel, 'alerta');
  assert.ok(Math.abs(r.total_projectado_usd - (TARIFAS.base_usd + 9)) < 1e-9);
  /* no 1.º dia a projecção não conta para o nível */
  assert.equal(calcularCiclo(linhas, { fraccao: 0.02, diasCiclo: 30 }).metricas.find(m => m.id === 'workers.pedidos').nivel, 'ok');
  /* excedido: passou mesmo do incluído */
  assert.equal(calcularCiclo([{ dia: '2026-09-14', produto: 'r2', metrica: 'classe_a', recurso: 'b', valor: 1.2e6 }], { fraccao: 0.5, diasCiclo: 30 })
    .metricas.find(m => m.id === 'r2.classe_a').nivel, 'excedido');
  /* plano gratuito: sem custos */
  assert.equal(calcularCiclo(linhas, { fraccao: 1, diasCiclo: 31, planoPago: false }).total_projectado_usd, null);
});

function cloudflareFalsa({ pedidos = 1000 } = {}) {
  const pedidosFeitos = [];
  const f = async (url, opcoes) => {
    pedidosFeitos.push({ url, auth: opcoes?.headers?.authorization });
    if (String(url).includes('/d1/database')) return { ok: true, status: 200, json: async () => ({ success: true, result: [{ uuid: 'db-1', name: 'hs-inteligencia' }] }) };
    if (String(url).includes('resend')) return { ok: true, status: 200, json: async () => ({ id: 'email-1' }) };
    const q = JSON.parse(opcoes.body).query;
    const v = JSON.parse(opcoes.body).variables;
    const conta = { x: [], y: [] };
    if (q.includes('workersInvocationsAdaptive')) conta.x = [{ dimensions: { date: v.d1, scriptName: 'hs-inteligencia' }, sum: { requests: pedidos, cpuTimeUs: 5000000 } }];
    if (q.includes('d1AnalyticsAdaptiveGroups')) {
      conta.x = [{ dimensions: { date: v.d1, databaseId: 'db-1' }, sum: { rowsRead: 5000, rowsWritten: 300 } }];
      conta.y = [{ dimensions: { date: v.d1, databaseId: 'db-1' }, max: { databaseSizeBytes: 6e6 } }];
    }
    return { ok: true, status: 200, json: async () => ({ data: { viewer: { accounts: [conta] } } }) };
  };
  f.pedidos = pedidosFeitos;
  return f;
}

test('a recolha grava os consumos, e a leitura dá o ciclo, os recursos com nome e o histórico', async () => {
  const db = await d1Falsa();
  const agora = '2026-09-20T10:00:00.000Z';
  const sem = await recolherConsumos({ DB: db, CF_ACCOUNT_ID: 'c' }, { agora });
  assert.equal(sem.motivo, 'SEM_TOKEN');
  assert.equal(sem.dataforseo.motivo, 'SEM_CREDENCIAIS');

  const f = cloudflareFalsa();
  const env = { DB: db, CF_ACCOUNT_ID: 'conta', CF_ANALYTICS_TOKEN: 'segredo-de-teste' };
  const r = await recolherConsumos(env, { agora, fetchImpl: f });
  assert.equal(r.erros.length, 0);
  assert.ok(r.linhas >= 5);
  /* a primeira recolha vai buscar desde o início do ciclo anterior (no máximo 30 dias) */
  assert.equal(r.desde, '2026-08-21');
  assert.ok(!JSON.stringify(r).includes('segredo-de-teste'));
  assert.ok(f.pedidos.every(p => p.auth === 'Bearer segredo-de-teste'));

  const c = await lerCustos(env, { agora });
  assert.equal(c.token_configurado, true);
  assert.deepEqual([c.ciclo.inicio, c.ciclo.fim], ['2026-09-14', '2026-10-14']);
  assert.equal(c.ciclo.plano_pago, true);
  const pedidos = c.metricas.find(m => m.id === 'workers.pedidos');
  assert.equal(pedidos.usado, 1000);
  assert.equal(pedidos.nivel, 'ok');
  assert.equal(c.metricas.find(m => m.id === 'd1.linhas_lidas').recursos[0].nome, 'hs-inteligencia');
  assert.equal(c.base_usd, 5);
  assert.equal(c.historico[0].actual, true);
  assert.ok(!JSON.stringify(c).includes('segredo-de-teste'));
  assert.deepEqual(await limitesParaHoje(env, agora), []);
});

test('perto do limite: aparece no «Hoje» e é avisado por email uma só vez por nível e por ciclo', async () => {
  const db = await d1Falsa();
  const agora = '2026-09-24T10:00:00.000Z';
  for (let i = 0; i < 10; i++) {
    db.sqlite.prepare("INSERT INTO consumos_dia (dia, produto, metrica, recurso, valor, actualizado_em) VALUES (?, 'workers', 'pedidos', 'x', 900000, ?)")
      .run('2026-09-' + String(14 + i).padStart(2, '0'), agora);
  }
  const env = { DB: db, CF_ACCOUNT_ID: 'conta', CF_ANALYTICS_TOKEN: 't' };
  const hoje = await limitesParaHoje(env, agora);
  assert.equal(hoje.length, 1);
  assert.equal(hoje[0].id, 'workers.pedidos');
  assert.equal(hoje[0].nivel, 'alerta');

  assert.equal((await avisarConsumo(env, { agora })).motivo, 'SEM_CONFIGURACAO');
  const comEmail = { ...env, RESEND_API_KEY: 're_teste', AVISOS_DE: 'a@b.pt', AVISOS_PARA: 'c@d.pt' };
  const f = cloudflareFalsa();
  const r1 = await avisarConsumo(comEmail, { agora, fetchImpl: f });
  assert.equal(r1.enviado, true);
  const linha = db.sqlite.prepare("SELECT * FROM avisos WHERE motivo = 'CONSUMO'").get();
  assert.equal(linha.estado, 'ENVIADO');
  assert.deepEqual(JSON.parse(linha.assuntos), [{ metrica: 'workers.pedidos', nivel: 'alerta', ciclo: '2026-09-14' }]);
  assert.equal((await avisarConsumo(comEmail, { agora, fetchImpl: f })).motivo, 'JA_AVISADO');
});

test('DataForSEO: o gasto é a descida do saldo, sem contar carregamentos; o saldo avisa antes de acabar', async () => {
  const { gastosDataForSeo, estadoDataForSeo, recolherDataForSeo } = await import('../src/custos.js');
  const leituras = [
    { em: '2026-09-14T10:00:00.000Z', saldo: 50.00, total: 51 },
    { em: '2026-09-14T11:00:00.000Z', saldo: 49.80, total: 51 },   /* gastou 0,20 */
    { em: '2026-09-15T10:00:00.000Z', saldo: 69.70, total: 71 },   /* carregou 20 e gastou 0,10 */
    { em: '2026-09-16T10:00:00.000Z', saldo: 69.70, total: 71 }
  ];
  const g = gastosDataForSeo(leituras);
  assert.ok(Math.abs(g.porDia.get('2026-09-14') - 0.2) < 1e-9);
  assert.ok(Math.abs(g.porDia.get('2026-09-15') - 0.1) < 1e-9);
  assert.deepEqual(g.cargas, [{ em: '2026-09-15T10:00:00.000Z', usd: 20 }]);
  const e = estadoDataForSeo(leituras, { agora: '2026-09-16T10:00:00.000Z', ciclo: { inicio: '2026-09-14', fim: '2026-10-14' }, fraccao: 0.1 });
  assert.ok(Math.abs(e.gasto_ciclo - 0.3) < 1e-9);
  assert.equal(e.saldo, 69.7);
  assert.equal(e.nivel, 'ok');
  assert.ok(e.dias_restantes > 60);
  /* ritmo alto: 5 USD por dia com 30 de saldo → 6 dias → alerta */
  const rapido = [{ em: '2026-09-14T00:00:00.000Z', saldo: 45, total: 51 }, { em: '2026-09-17T00:00:00.000Z', saldo: 30, total: 51 }];
  assert.equal(estadoDataForSeo(rapido, { agora: '2026-09-17T00:00:00.000Z', ciclo: { inicio: '2026-09-14', fim: '2026-10-14' }, fraccao: 0.1 }).nivel, 'alerta');
  assert.equal(estadoDataForSeo([{ em: '2026-09-14T00:00:00.000Z', saldo: 8, total: 51 }], { agora: '2026-09-14T01:00:00.000Z', ciclo: { inicio: '2026-09-14', fim: '2026-10-14' }, fraccao: 0.01 }).nivel, 'atencao');

  const db = await d1Falsa();
  let pedido = null;
  const f = async (url, o) => { pedido = { url, auth: o.headers.authorization }; return { ok: true, status: 200, json: async () => ({ tasks: [{ result: [{ money: { total: 51.01, balance: 50.29, statistics: { day: { total: 0 } } } }] }] }) }; };
  const env = { DB: db, DATAFORSEO_LOGIN: 'eu@exemplo.pt', DATAFORSEO_PASSWORD: 'palavra' };
  const r = await recolherDataForSeo(env, { agora: '2026-09-14T20:00:00.000Z', fetchImpl: f });
  assert.equal(r.saldo, 50.29);
  assert.equal(pedido.url, 'https://api.dataforseo.com/v3/appendix/user_data');
  assert.equal(pedido.auth, 'Basic ' + Buffer.from('eu@exemplo.pt:palavra').toString('base64'));
  assert.ok(!JSON.stringify(r).includes('palavra'));
  const c = await lerCustos({ DB: db }, { agora: '2026-09-14T21:00:00.000Z' });
  assert.equal(c.dataforseo.saldo, 50.29);
  assert.ok(Math.abs(c.dataforseo.gasto_desde_abertura - 0.72) < 1e-9);
  assert.equal(c.historico[0].dataforseo_usd, 0);

  db.sqlite.prepare("INSERT INTO dataforseo_saldos (em, saldo, total) VALUES ('2026-09-20T21:00:00.000Z', 2.5, 51.01)").run();
  const hoje = await limitesParaHoje({ DB: db }, '2026-09-20T22:00:00.000Z');
  assert.equal(hoje.find(x => x.id === 'dataforseo.saldo').nivel, 'alerta');
});
