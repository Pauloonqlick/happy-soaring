/* Vigia da tarefa agendada. Base SQLite real, sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slotsEsperados, classificarSlots, planearIncidentes, executarVigia, descreverIncidente, incidentesParaHoje } from '../src/vigia.js';
import { lerOperacao } from '../src/evolucao.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  /* a migração traz o incidente real de 13–14/09; aqui começa-se do zero */
  db.exec("DELETE FROM incidentes; DELETE FROM esquema_meta WHERE chave = 'vigia_verificado_ate'");
  const stmt = (sql, params = []) => ({
    sql, params,
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return { meta: {} }; }
  });
  return {
    prepare: sql => stmt(sql),
    batch: async ss => { for (const s of ss) db.prepare(s.sql).run(...s.params); return []; },
    sqlite: db
  };
}

const MIN = 60000;
const em = (base, min) => new Date(Date.parse(base) + min * MIN).toISOString();
/* execuções como a tarefa agendada as escreve: alguns segundos depois do minuto */
function execucoesEntre(desde, minutos, { cortar = () => false, faltar = () => false } = {}) {
  return slotsEsperados(desde, em(desde, minutos)).filter(s => !faltar(s))
    .map(s => ({ vez: s.vez, inicio: new Date(Date.parse(s.em) + 1500).toISOString(), ok: cortar(s) ? null : 1, erro: null }));
}

test('slots: só minutos pares, com a tarefa da agenda', () => {
  const s = slotsEsperados('2026-09-14T08:59:30Z', '2026-09-14T09:11:00Z');
  assert.deepEqual(s.map(x => x.em.slice(11, 16)), ['09:00', '09:02', '09:04', '09:06', '09:08', '09:10']);
  assert.deepEqual(s.map(x => x.vez), ['search_console', 'publicacoes', 'inspeccao', 'publicacoes', 'avisos', 'search_console']);
});

test('classificar: ok, falhou, cortada a meio, a correr e em falta', () => {
  const agora = '2026-09-14T09:10:00Z';
  const slots = slotsEsperados('2026-09-14T09:00:00Z', '2026-09-14T09:10:00Z');
  const execs = [
    { vez: 'search_console', inicio: '2026-09-14T09:00:01Z', ok: 1 },
    { vez: 'publicacoes', inicio: '2026-09-14T09:02:01Z', ok: null },
    { vez: 'inspeccao', inicio: '2026-09-14T09:04:01Z', ok: 0, erro: 'quota' },
    { vez: 'avisos', inicio: '2026-09-14T09:08:01Z', ok: null },
    { vez: 'publicacoes', inicio: '2026-09-14T09:00:30Z', ok: 1 }   /* outra tarefa noutro minuto não conta */
  ];
  assert.deepEqual(classificarSlots(slots, execs, agora).map(x => x.estado), ['OK', 'INTERROMPIDA', 'FALHOU', 'EM_FALTA', 'A_CORRER']);
});

test('incidentes: um soluço isolado não abre; dois perto abrem; 20 minutos calmos fecham', () => {
  const base = '2026-09-14T00:00:00Z';
  const slots = slotsEsperados(base, em(base, 120));
  const problema = new Set(['00:12', '00:50', '00:54', '00:56']);
  const cls = slots.map(s => ({ ...s, estado: problema.has(s.em.slice(11, 16)) ? 'INTERROMPIDA' : 'OK' }));
  const r = planearIncidentes(null, cls, em(base, 120));
  assert.equal(r.length, 1);
  assert.equal(r[0].aberto_em.slice(11, 16), '00:50', 'o de 00:12 estava sozinho');
  assert.equal(r[0].ultimo_problema_em.slice(11, 16), '00:56');
  assert.equal(r[0].fechado_em.slice(11, 16), '00:58');
  const total = Object.values(r[0].contagens).reduce((n, c) => n + (c.INTERROMPIDA || 0), 0);
  assert.equal(total, 3);

  /* ainda sem 20 minutos calmos: fica aberto */
  const aindaAberto = planearIncidentes(null, cls.slice(0, 32), em(base, 64));
  assert.equal(aindaAberto[0].fechado_em, null);
  /* e um incidente já aberto prolonga-se com um único problema novo */
  const aberto = { id: 7, aberto_em: base, ultimo_problema_em: em(base, 10), fechado_em: null, contagens: '{"publicacoes":{"INTERROMPIDA":2}}' };
  const p = planearIncidentes(aberto, [{ em: em(base, 16), vez: 'decisoes', estado: 'EM_FALTA' }], em(base, 18));
  assert.equal(p[0].id, 7);
  assert.deepEqual(p[0].contagens, { publicacoes: { INTERROMPIDA: 2 }, decisoes: { EM_FALTA: 1 } });
});

test('vigia com base real: noite de cortes → incidente aberto; volta ao normal → fechado; retoma onde ficou', async () => {
  const db = await d1Falsa();
  const ins = db.sqlite.prepare('INSERT INTO execucoes (vez, inicio, ok, erro) VALUES (?, ?, ?, ?)');
  const inicio = '2026-09-13T23:00:00.000Z';
  db.sqlite.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('vigia_verificado_ate', ?)").run(inicio);
  /* 23:30–01:00: publicações, assuntos e decisões cortadas a meio */
  const pesada = s => ['publicacoes', 'assuntos', 'decisoes'].includes(s.vez);
  const noite = s => s.em >= '2026-09-13T23:30' && s.em < '2026-09-14T01:00';
  for (const e of execucoesEntre(inicio, 120, { cortar: s => pesada(s) && noite(s) })) ins.run(e.vez, e.inicio, e.ok, e.erro);

  const r1 = await executarVigia(db, { agora: em(inicio, 126) });
  assert.equal(r1.incidente_aberto, true);
  let inc = db.sqlite.prepare('SELECT * FROM incidentes').all();
  assert.equal(inc.length, 1);
  assert.equal(inc[0].aberto_em, '2026-09-13T23:32:00.000Z', 'às 23:30 corre o Search Console, que é leve');
  const d = descreverIncidente(inc[0], em(inicio, 126));
  assert.equal(d.aberto, true);
  assert.equal(d.por_estado.EM_FALTA, 0);
  assert.ok(d.por_estado.INTERROMPIDA > 20);
  assert.match(d.causa_provavel, /cortadas a meio/);
  assert.equal((await incidentesParaHoje(db, em(inicio, 126))).length, 1, 'aberto: aparece no «Hoje»');

  /* voltou ao normal às 01:00; o vigia seguinte só olha para o que ainda não viu */
  for (const e of execucoesEntre(em(inicio, 120), 40)) ins.run(e.vez, e.inicio, e.ok, e.erro);
  const r2 = await executarVigia(db, { agora: em(inicio, 166) });
  assert.equal(r2.problemas, 0);
  assert.ok(r2.verificadas <= 20, 'retoma onde ficou em vez de rever tudo');
  inc = db.sqlite.prepare('SELECT * FROM incidentes').all();
  assert.equal(inc.length, 1);
  assert.equal(inc[0].fechado_em, '2026-09-14T01:00:00.000Z');
  const hoje = await incidentesParaHoje(db, em(inicio, 166));
  assert.equal(hoje.length, 1, 'fechado há pouco e durou mais de 30 minutos: continua no «Hoje»');
  assert.equal(hoje[0].aberto, false);
  assert.equal((await incidentesParaHoje(db, '2026-09-15T02:00:00.000Z')).length, 0, 'passadas 24 h sai do «Hoje»');
});

test('vigia: a tarefa agendada parou por completo → o buraco é apanhado quando volta', async () => {
  const db = await d1Falsa();
  const ins = db.sqlite.prepare('INSERT INTO execucoes (vez, inicio, ok, erro) VALUES (?, ?, ?, ?)');
  const inicio = '2026-09-14T10:00:00.000Z';
  for (const e of execucoesEntre(inicio, 20)) ins.run(e.vez, e.inicio, e.ok, e.erro);
  await executarVigia(db, { agora: em(inicio, 26) });
  /* nada entre 10:20 e 12:00 */
  for (const e of execucoesEntre(em(inicio, 120), 30)) ins.run(e.vez, e.inicio, e.ok, e.erro);
  await executarVigia(db, { agora: em(inicio, 150) });
  const [inc] = db.sqlite.prepare('SELECT * FROM incidentes').all();
  assert.ok(inc, 'incidente registado');
  assert.equal(inc.aberto_em, '2026-09-14T10:20:00.000Z');
  assert.equal(inc.fechado_em, '2026-09-14T12:00:00.000Z');
  const d = descreverIncidente(inc);
  assert.equal(d.por_estado.EM_FALTA, 50);
  assert.match(d.causa_provavel, /não chegou a correr/);
});

test('operação: cortadas a meio e em falta nas últimas 24 h, e a lista de incidentes', async () => {
  const db = await d1Falsa();
  const ins = db.sqlite.prepare('INSERT INTO execucoes (vez, inicio, ok, erro) VALUES (?, ?, ?, ?)');
  const inicio = '2026-09-14T10:00:00.000Z';
  const cortar = s => s.vez === 'publicacoes' && s.em < '2026-09-14T10:20';
  const faltar = s => s.vez === 'decisoes';
  for (const e of execucoesEntre(inicio, 60, { cortar, faltar })) ins.run(e.vez, e.inicio, e.ok, e.erro);
  db.sqlite.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('vigia_verificado_ate', ?)").run(inicio);
  await executarVigia(db, { agora: em(inicio, 66) });
  const op = await lerOperacao({ DB: db }, { agora: em(inicio, 66) });
  const T = Object.fromEntries(op.tarefas.map(x => [x.vez, x.ultimas_24h]));
  assert.equal(T.publicacoes.interrompidas, 4, '10:02, 10:06, 10:12 e 10:16');
  assert.equal(T.decisoes.em_falta, 2);
  assert.equal(T.search_console.em_falta, 0);
  assert.equal(op.incidentes.length, 1);
  assert.equal(op.tarefas.find(x => x.vez === 'publicacoes').ultima.estado, 'OK');
});

test('o incidente real de 13–14/09 vem na migração e aparece no «Hoje» nas 24 h seguintes (enquanto não está resolvido)', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const sq = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) sq.exec(fs.readFileSync(f, 'utf8'));
  /* a 0012 marca-o como resolvido; aqui volta-se ao estado de antes para testar a regra das 24 h */
  sq.exec('UPDATE incidentes SET causa_confirmada = NULL, resolucao = NULL, resolvido_em = NULL');
  const db = { prepare: sql => ({ bind: (...p) => ({ all: async () => ({ results: sq.prepare(sql).all(...p).map(r => ({ ...r })) }) }) }) };
  const [i] = await incidentesParaHoje(db, '2026-09-14T12:00:00.000Z');
  assert.equal(i.execucoes_perdidas, 159);
  assert.equal(i.duracao_min, 558);
  assert.deepEqual(i.tarefas.map(x => x.vez), ['publicacoes', 'assuntos', 'decisoes']);
  assert.match(i.causa_provavel, /cortadas a meio/);
  assert.equal((await incidentesParaHoje(db, '2026-09-15T12:00:00.000Z')).length, 0);
});
