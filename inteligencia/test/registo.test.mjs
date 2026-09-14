/* Registo de tarefas: dias de Lisboa, o «o que fez», as linhas e os resumos. Base SQLite real, sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slotsEsperados } from '../src/vigia.js';
import {
  diaLisboa, limitesDia, segundaDe, trabalhoDe, linhasDoIntervalo, resumirPorTarefa, executarAgregacao, lerRegisto
} from '../src/registo.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  db.exec("DELETE FROM incidentes; DELETE FROM esquema_meta WHERE chave = 'vigia_verificado_ate'");
  const stmt = (sql, params = []) => ({
    sql, params,
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return { meta: {} }; }
  });
  return { prepare: sql => stmt(sql), batch: async ss => { for (const s of ss) db.prepare(s.sql).run(...s.params); return []; }, sqlite: db };
}

const MIN = 60000;
const em = (base, min) => new Date(Date.parse(base) + min * MIN).toISOString();
const RESUMOS = {
  search_console: { dias_novos: 0, vigia: { problemas: 0 }, semana: { gerada: null } },
  inspeccao: { inspeccionadas: 2, rastreios_novos: 1, com_erro: 0 },
  assuntos: { detectados: 129, novos: 0, resolvidos: 0, avaliados: 0 },
  avisos: { enviado: false, motivo: 'SEM_CONFIGURACAO' },
  decisoes: { decididos: 0, pacotes: 0 },
  publicacoes: { descobertos: 0, processados: [] }
};

test('os dias são os de Lisboa, com a mudança de hora', () => {
  assert.deepEqual(limitesDia('2026-09-14'), ['2026-09-13T23:00:00.000Z', '2026-09-14T23:00:00.000Z']);
  assert.deepEqual(limitesDia('2026-12-01'), ['2026-12-01T00:00:00.000Z', '2026-12-02T00:00:00.000Z']);
  /* 25/10/2026: o relógio atrasa — o dia tem 25 horas */
  assert.deepEqual(limitesDia('2026-10-25'), ['2026-10-24T23:00:00.000Z', '2026-10-26T00:00:00.000Z']);
  assert.equal(diaLisboa('2026-09-14T23:30:00Z'), '2026-09-15');
  assert.equal(diaLisboa('2026-12-01T23:30:00Z'), '2026-12-01');
  assert.equal(segundaDe('2026-09-14'), '2026-09-14');
  assert.equal(segundaDe('2026-09-20'), '2026-09-14');
});

test('o «o que fez» diz o trabalho por palavras e separa o que é novidade', () => {
  assert.equal(trabalhoDe('inspeccao', RESUMOS.inspeccao).texto, '2 páginas inspeccionadas · 1 rastreio novo do Google');
  assert.equal(trabalhoDe('inspeccao', RESUMOS.inspeccao).novidade, true);
  assert.deepEqual(trabalhoDe('inspeccao', RESUMOS.inspeccao).contagens, { inspeccionadas: 2, rastreios_novos: 1 });
  assert.equal(trabalhoDe('assuntos', RESUMOS.assuntos).texto, 'verificou, sem novidades');
  assert.equal(trabalhoDe('assuntos', RESUMOS.assuntos).novidade, false);
  assert.match(trabalhoDe('avisos', RESUMOS.avisos).texto, /em pausa/);
  assert.equal(trabalhoDe('publicacoes', { descobertos: 1, processados: ['a', 'b'] }).texto, '1 publicação nova do site · 2 publicações lidas');
  assert.equal(trabalhoDe('search_console', { dias_novos: 1, semana: { gerada: '2026-09-07' }, vigia: { problemas: 0 } }).texto,
    '1 dia novo do Search Console · escreveu a semana em revista');
});

test('as linhas mostram cada minuto esperado: feito, falhado, cortado, em falta e a correr', () => {
  const desde = '2026-09-14T10:00:00.000Z', agora = em(desde, 40);
  const slots = slotsEsperados(desde, em(desde, 40));
  const execs = slots.filter(s => s.em !== em(desde, 2)).map(s => ({
    vez: s.vez, inicio: em(s.em, 0.03), duracao_ms: 1200, erro: s.em === em(desde, 4) ? 'boom' : null,
    ok: s.em === em(desde, 4) ? 0 : s.em === em(desde, 6) ? null : s.em >= em(desde, 38) ? null : 1,
    resumo: JSON.stringify(RESUMOS[s.vez])
  }));
  const linhas = linhasDoIntervalo(desde, em(desde, 60), execs, agora);
  const por = m => linhas.find(l => l.em === em(desde, m) || (l.inicio && l.inicio === em(em(desde, m), 0.03)));
  assert.equal(por(0).estado, 'OK');
  assert.equal(por(2).estado, 'EM_FALTA');
  assert.equal(por(4).estado, 'FALHOU');
  assert.equal(por(4).erro, 'boom');
  assert.equal(por(6).estado, 'INTERROMPIDA');
  assert.equal(por(38).estado, 'A_CORRER');
  assert.equal(por(4).titulo, 'Inspecção de URL');
  /* mais recente primeiro */
  assert.ok(Date.parse(linhas[0].em) >= Date.parse(linhas[linhas.length - 1].em));
  const r = Object.fromEntries(resumirPorTarefa(linhas).map(x => [x.vez, x]));
  assert.equal(r.inspeccao.falhou, 1);
  assert.equal(r.publicacoes.em_falta, 1);
  assert.equal(r.publicacoes.interrompidas, 1);
  assert.equal(r.search_console.a_correr, 0);
});

test('a agregação guarda o dia por tarefa e a leitura dá dia, semana e mês', async () => {
  const db = await d1Falsa();
  const inicio = '2026-09-14T08:00:00.000Z', agora = '2026-09-15T09:00:00.000Z';
  const slots = slotsEsperados(inicio, '2026-09-15T08:50:00.000Z');
  const falta = new Set([em(inicio, 120), em(inicio, 122)]);
  for (const s of slots) {
    if (falta.has(s.em)) continue;
    db.sqlite.prepare('INSERT INTO execucoes (vez, inicio, duracao_ms, ok, resumo, erro) VALUES (?, ?, ?, ?, ?, ?)')
      .run(s.vez, em(s.em, 0.03), 900, 1, JSON.stringify(RESUMOS[s.vez]), null);
  }
  const r = await executarAgregacao(db, { agora });
  assert.equal(r.dias, 2);
  const linhas = db.sqlite.prepare("SELECT * FROM execucoes_dia WHERE dia = '2026-09-14'").all();
  assert.equal(linhas.length, 6);
  const tot = linhas.reduce((a, x) => ({ esperadas: a.esperadas + x.esperadas, em_falta: a.em_falta + x.em_falta }), { esperadas: 0, em_falta: 0 });
  assert.equal(tot.em_falta, 2);
  /* 14/09 em Lisboa acaba às 23:00 UTC: de 08:00 a 23:00 são 15 h = 450 minutos pares */
  assert.equal(tot.esperadas, 450);
  assert.equal(linhas[0].completo, 1);
  const insp = linhas.find(x => x.vez === 'inspeccao');
  assert.equal(JSON.parse(insp.trabalho).inspeccionadas, 2 * insp.ok);

  const env = { DB: db };
  const dia = await lerRegisto(env, { vista: 'dia', data: '2026-09-14', agora });
  assert.equal(dia.com_detalhe, true);
  assert.equal(dia.linhas.filter(l => l.estado === 'EM_FALTA').length, 2);
  assert.equal(dia.tarefas.length, 6);
  assert.ok(dia.tarefas.every(x => x.proxima));
  assert.equal(dia.anterior, '2026-09-13');

  const semana = await lerRegisto(env, { vista: 'semana', data: '2026-09-16', agora });
  assert.equal(semana.semana, '2026-09-14');
  assert.equal(semana.dias.length, 7);
  assert.equal(semana.dias[0].em_falta, 2);
  assert.equal(semana.dias[0].com_registo, true);
  assert.equal(semana.dias[3].futuro, true);

  const mes = await lerRegisto(env, { vista: 'mes', data: '2026-09', agora });
  assert.equal(mes.dias.length, 30);
  assert.equal(mes.dias.find(d => d.dia === '2026-09-14').esperadas, 450);
  assert.equal(mes.dias.find(d => d.dia === '2026-09-10').com_registo, false);
  assert.equal(mes.anterior, '2026-08');
  assert.equal(mes.seguinte, '2026-10');
});

test('um incidente resolvido deixa de ser notícia, mas continua na operação com a causa confirmada', async () => {
  const { incidentesParaHoje, descreverIncidente } = await import('../src/vigia.js');
  const { DatabaseSync } = await import('node:sqlite');
  /* sem apagar nada: a migração 0012 resolve o incidente real de 13–14/09 */
  const bruta = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) bruta.exec(fs.readFileSync(f, 'utf8'));
  const real = bruta.prepare("SELECT * FROM incidentes WHERE aberto_em = '2026-09-13T23:36:00.000Z'").get();
  assert.match(real.causa_confirmada, /10 ms/);
  assert.match(real.resolucao, /Workers Paid/);
  assert.ok(Number(bruta.prepare("SELECT valor FROM esquema_meta WHERE chave='versao_esquema'").get().valor) >= 12);
  const d = descreverIncidente({ ...real });
  assert.equal(d.resolvido, true);
  assert.equal(d.causa, real.causa_confirmada);

  const db = await d1Falsa();
  const agora = '2026-09-14T12:00:00.000Z';
  db.sqlite.prepare(`INSERT INTO incidentes (aberto_em, ultimo_problema_em, fechado_em, contagens, ultimo_erro, causa_confirmada, resolucao, resolvido_em)
    VALUES ('2026-09-14T01:00:00.000Z', '2026-09-14T08:00:00.000Z', '2026-09-14T08:02:00.000Z', '{"publicacoes":{"INTERROMPIDA":50}}', null, 'Causa confirmada com uma frase.', 'Resolvido com outra frase qualquer.', '2026-09-14T11:00:00.000Z')`).run();
  assert.equal((await incidentesParaHoje(db, agora)).length, 0);
  db.sqlite.prepare(`INSERT INTO incidentes (aberto_em, ultimo_problema_em, fechado_em, contagens, ultimo_erro)
    VALUES ('2026-09-14T09:00:00.000Z', '2026-09-14T10:00:00.000Z', '2026-09-14T10:02:00.000Z', '{"assuntos":{"EM_FALTA":20}}', null)`).run();
  const hoje = await incidentesParaHoje(db, agora);
  assert.equal(hoje.length, 1);
  assert.equal(hoje[0].resolvido, false);
  const reg = await lerRegisto({ DB: db }, { vista: 'dia', data: '2026-09-14', agora });
  assert.equal(reg.incidentes.length, 2);
  assert.equal(reg.incidentes.filter(i => i.resolvido).length, 1);
});
