/* Painel «Evolução». Base SQLite real, sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  linguaDoCaminho, familiaDoCaminho, gruposDasVersoes, inicioSemana, tendenciaConfirmada, sinaisDoGrupo,
  lerOperacao, lerIndexacaoEvolucao, lerPaginas, lerGeral
} from '../src/evolucao.js';
import { vezDoMinuto, proximasExecucoes } from '../src/agenda.js';
import { versoesDaPagina } from '../src/publicacoes.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const cont = { consultas: 0 };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { cont.consultas++; const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => { cont.consultas++; return { results: db.prepare(sql).all(...params).map(r => ({ ...r })) }; },
    run: async () => { cont.consultas++; db.prepare(sql).run(...params); return { meta: {} }; }
  });
  return { prepare: sql => stmt(sql), batch: async () => [], sqlite: db, cont };
}

test('língua, família e página conceptual: o hreflang da própria página manda', () => {
  assert.equal(linguaDoCaminho('/en/wings/x/'), 'en');
  assert.equal(linguaDoCaminho('/asas/x/'), 'pt');
  assert.equal(linguaDoCaminho('/english/'), 'pt');
  assert.equal(familiaDoCaminho('/de/schirme/mohawk/'), 'asas');
  assert.equal(familiaDoCaminho('/fr/parakite-portugal/meco/'), 'spots');
  assert.equal(familiaDoCaminho('/parakite-portugal/'), 'paginas');
  assert.equal(familiaDoCaminho('/es/'), 'inicial');
  const html = '<link rel="alternate" hreflang="pt" href="https://happysoaring.com/asas/x/" />' +
    '<link rel="alternate" hreflang="en" href="https://happysoaring.com/en/wings/x/" />' +
    '<link rel="alternate" hreflang="x-default" href="https://happysoaring.com/en/wings/x/" />' +
    '<link rel="alternate" hreflang="de" href="https://outro-site.example/x/" />';
  const v = versoesDaPagina(html);
  assert.deepEqual(v, { pt: '/asas/x/', en: '/en/wings/x/', 'x-default': '/en/wings/x/' });
  assert.equal(versoesDaPagina('<html></html>'), null);
  const g = gruposDasVersoes([{ caminho: '/en/wings/x/', versoes: JSON.stringify(v) }, { caminho: '/asas/x/', versoes: JSON.stringify(v) }]);
  assert.deepEqual(g.get('/en/wings/x/'), { grupo: '/asas/x/', lingua: 'en' });
  assert.deepEqual(g.get('/asas/x/'), { grupo: '/asas/x/', lingua: 'pt' });
});

test('semanas e tendências: só confirmadas com 4 semanas completas e amostra', () => {
  assert.equal(inicioSemana('2026-09-13'), '2026-09-07', 'domingo pertence à semana que começou segunda');
  assert.equal(inicioSemana('2026-09-07'), '2026-09-07');
  assert.equal(tendenciaConfirmada([100, 100, 100]), 'HISTORICO_INSUFICIENTE');
  assert.equal(tendenciaConfirmada([100, 100, 60, 70]), 'QUEDA_CONFIRMADA');
  assert.equal(tendenciaConfirmada([100, 100, 60, 95]), 'A_OBSERVAR', 'uma semana só não confirma');
  assert.equal(tendenciaConfirmada([100, 100, 130, 125]), 'SUBIDA_CONFIRMADA');
  assert.equal(tendenciaConfirmada([100, 100, 95, 105]), 'ESTAVEL');
  assert.equal(tendenciaConfirmada([4, 6, 1, 0]), 'AMOSTRA_INSUFICIENTE');
});

test('sinais do grupo: versão atrás das irmãs, indexada sem impressões, não indexada', () => {
  const v = sinaisDoGrupo({
    pt: { impressoes: 200, google: { indexada: true } },
    en: { impressoes: 5, google: { indexada: true } },
    de: { impressoes: 0, google: { indexada: false } }
  }, { diasComDados: 28 });
  assert.deepEqual(v.pt.sinais, []);
  assert.deepEqual(v.en.sinais, ['ATRAS_DAS_IRMAS']);
  assert.deepEqual(v.de.sinais, ['NAO_INDEXADA', 'ATRAS_DAS_IRMAS']);
  const pouco = sinaisDoGrupo({ pt: { impressoes: 0, google: { indexada: true } } }, { diasComDados: 10 });
  assert.deepEqual(pouco.pt.sinais, [], 'sem 14 dias de dados não se diz «sem impressões»');
});

test('agenda: a mesma regra decide o que corre e mostra a próxima execução de cada tarefa', () => {
  assert.deepEqual([0, 2, 4, 8, 18, 28, 38, 48, 58].map(vezDoMinuto),
    ['search_console', 'publicacoes', 'inspeccao', 'avisos', 'assuntos', 'decisoes', 'assuntos', 'decisoes', 'assuntos']);
  const p = Object.fromEntries(proximasExecucoes('2026-09-13T17:45:30Z').map(x => [x.vez, x.proxima]));
  assert.equal(p.decisoes, '2026-09-13T17:48:00.000Z');
  assert.equal(p.search_console, '2026-09-13T17:50:00.000Z');
  assert.equal(p.avisos, '2026-09-13T18:08:00.000Z');
  assert.equal(p.publicacoes, '2026-09-13T17:46:00.000Z');
});

function semear(s) {
  const dias = [];
  for (let i = 0; i < 35; i++) dias.push(new Date(Date.UTC(2026, 7, 8) + i * 864e5).toISOString().slice(0, 10));
  for (const [i, d] of dias.entries()) {
    const imp = i < 21 ? 100 : 50;
    s.prepare("INSERT INTO gsc_dias (data, propriedade, cliques, impressoes, posicao, completo) VALUES (?, 'sc', 5, ?, 8, 1)").run(d, imp);
    s.prepare("INSERT INTO gsc_conjuntos (data, conjunto, linhas, cliques_visiveis, impressoes_visiveis, json) VALUES (?, 'query', 2, 4, 60, ?)")
      .run(d, JSON.stringify([['happy soaring', 3, 20, 0.15, 1], ['parakite portugal', 1, 40, 0.02, 9]]));
    s.prepare("INSERT INTO gsc_conjuntos (data, conjunto, linhas, cliques_visiveis, impressoes_visiveis, json) VALUES (?, 'page', 3, 5, 90, ?)")
      .run(d, JSON.stringify([['https://happysoaring.com/asas/x/', 4, i < 21 ? 80 : 20, 0.05, 6], ['https://happysoaring.com/en/wings/x/', 1, 2, 0.5, 30],
        ['https://www.happysoaring.com/', 0, 8, 0, 3]]));
  }
  const v = JSON.stringify({ pt: '/asas/x/', en: '/en/wings/x/', de: '/de/schirme/x/' });
  s.exec(`INSERT INTO deployments (id, url, criado_em_cf, processamento, processado_em, meta_sujo) VALUES ('d1', 'x', '2026-09-01T10:00:00Z', 'PROCESSADO', '2026-09-13T17:00:00Z', 0),
      ('d2', 'x', '2026-09-02T10:00:00Z', 'PENDENTE', NULL, 0);
    INSERT INTO deployment_paginas (deployment_id, caminho, estado, versoes) VALUES ('d1', '/asas/x/', 'LIDA', '${v}'), ('d1', '/en/wings/x/', 'LIDA', '${v}'), ('d1', '/de/schirme/x/', 'LIDA', '${v}');
    INSERT INTO paginas_google (caminho, ultima_inspeccao_em, ultimo_rastreio, veredicto) VALUES
      ('/asas/x/', '2026-09-12T00:00:00Z', '2026-09-10T00:00:00Z', 'PASS'), ('/en/wings/x/', '2026-09-12T00:00:00Z', '2026-08-01T00:00:00Z', 'PASS'),
      ('/de/schirme/x/', '2026-09-12T00:00:00Z', NULL, 'NEUTRAL');
    INSERT INTO inspecoes (caminho, inspeccionado_em, veredicto, ultimo_rastreio) VALUES
      ('/asas/x/', '2026-09-05T00:00:00Z', 'NEUTRAL', '2026-09-04T00:00:00Z'), ('/asas/x/', '2026-09-12T00:00:00Z', 'PASS', '2026-09-10T00:00:00Z'),
      ('/en/wings/x/', '2026-09-12T00:00:00Z', 'PASS', '2026-08-01T00:00:00Z'), ('/de/schirme/x/', '2026-09-12T00:00:00Z', 'NEUTRAL', NULL);
    INSERT INTO paginas_alteracao VALUES ('/asas/x/', '2026-09-01T10:00:00Z', 'd1', 'conteudo'), ('/en/wings/x/', '2026-09-01T10:00:00Z', 'd1', 'conteudo');
    INSERT INTO assuntos (chave, tipo, caminho, critico, confirmado, evidencia, detectado_em, visto_em) VALUES ('NUNCA_RASTREADA /de/schirme/x/', 'NUNCA_RASTREADA', '/de/schirme/x/', 0, 1, '{}', '2026-09-12T00:00:00Z', '2026-09-12T00:00:00Z');
    INSERT INTO execucoes (vez, inicio, duracao_ms, ok, resumo) VALUES ('inspeccao', '2026-09-13T17:44:00Z', 900, 1, '{"inspeccionadas":30}'), ('publicacoes', '2026-09-13T17:46:00Z', 1200, 0, NULL);`);
}

test('as quatro análises respondem com dados coerentes e dentro do limite de consultas', async () => {
  const db = await d1Falsa();
  semear(db.sqlite);
  const agora = '2026-09-13T17:47:00.000Z';

  let antes = db.cont.consultas;
  const op = await lerOperacao({ DB: db }, { agora });
  assert.ok(db.cont.consultas - antes <= 20, 'operação: ' + (db.cont.consultas - antes));
  assert.equal(op.filas.publicacoes.pendentes, 1);
  assert.equal(op.filas.assuntos.por_decidir, 1);
  const insp = op.tarefas.find(x => x.vez === 'inspeccao');
  assert.deepEqual([insp.ultima.ok, insp.ultima.resumo.inspeccionadas, insp.proxima], [true, 30, '2026-09-13T17:54:00.000Z']);
  assert.equal(op.tarefas.find(x => x.vez === 'publicacoes').ultimas_24h.falhas, 1);

  antes = db.cont.consultas;
  const ix = await lerIndexacaoEvolucao(db, { agora });
  assert.ok(db.cont.consultas - antes <= 10);
  assert.deepEqual([ix.por_lingua.pt.percentagem_indexada, ix.por_lingua.de.nunca_rastreadas, ix.por_familia.asas.paginas], [100, 1, 3]);
  assert.deepEqual(ix.semanas.map(s => [s.semana, s.por_lingua.pt]), [['2026-08-31', 0], ['2026-09-07', 100]], 'evolução semanal da indexação');
  assert.equal(ix.atraso_ate_rastreio.por_lingua.pt.mediana_dias, 8.6);
  assert.equal(ix.atraso_ate_rastreio.por_lingua.en.pendentes, 1);

  antes = db.cont.consultas;
  const pg = await lerPaginas(db, { dias: 28 });
  assert.ok(db.cont.consultas - antes <= 12);
  assert.equal(pg.agrupamento_por_hreflang, true);
  const g = pg.grupos[0];
  assert.equal(g.grupo, '/asas/x/');
  assert.deepEqual(Object.keys(g.versoes).sort(), ['de', 'en', 'pt']);
  assert.ok(g.versoes.en.sinais.includes('ATRAS_DAS_IRMAS'));
  assert.ok(g.versoes.de.sinais.includes('NAO_INDEXADA'));
  assert.equal(g.versoes.pt.tendencia, 'QUEDA_CONFIRMADA', 'de 80/dia para 20/dia nas 2 últimas semanas completas');
  assert.deepEqual(pg.outras_urls.map(o => o.url), ['https://www.happysoaring.com/']);
  assert.equal(pg.por_lingua.pt.impressoes > 0, true);

  antes = db.cont.consultas;
  const ge = await lerGeral(db);
  assert.ok(db.cont.consultas - antes <= 8);
  const s = ge.semanas.find(x => x.semana === '2026-08-10');
  assert.deepEqual([s.completa, s.impressoes, s.marca.impressoes, s.nao_marca.impressoes, s.desconhecido.impressoes], [true, 700, 140, 280, 280]);
  assert.equal(ge.tendencias.impressoes, 'A_OBSERVAR', 'no total só a última semana ficou abaixo do limiar');
  assert.equal(ge.semanas.find(x => x.semana === '2026-08-31').anotacoes.publicacoes, 1);
});
