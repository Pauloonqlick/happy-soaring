/* «A leitura de hoje» e «Semana em revista». Base SQLite real, sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { frasesDoDia, frasesDaSemana, gerarSemana, executarCicloSemana, lerSemana, listarSemanas, lerDadosDoDia } from '../src/leitura.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  db.exec('DELETE FROM incidentes');
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return { meta: {} }; }
  });
  return { prepare: sql => stmt(sql), sqlite: db };
}

const textos = fs => fs.map(f => f.texto);

test('dia: problemas novos dizem se o módulo já aprovou a correcção', () => {
  const p = novos => frasesDoDia({ problemas: { novos, resolvidos: [] } })[0].texto;
  assert.equal(p([{ titulo: 'Dados estruturados com erros', caminhos: Array(118).fill('/x/'), aprovados: 118 }]),
    'Apareceram 118 problemas novos: dados estruturados com erros (118 páginas). O módulo já aprovou a correcção.');
  assert.equal(p([{ titulo: 'A', caminhos: ['/a/', '/b/'], aprovados: 1 }]), 'Apareceram 2 problemas novos: a (/a/, /b/). O módulo já aprovou a correcção de 1; o resto está a ser decidido.');
  assert.equal(p([{ titulo: 'A', caminhos: ['/a/'], aprovados: 0 }]), 'Apareceu 1 problema novo: a (/a/). O módulo decide o que fazer.');
});

test('dia: nada de novo → nenhuma frase', () => {
  assert.deepEqual(frasesDoDia({}), []);
  assert.deepEqual(frasesDoDia({ problemas: { novos: [], resolvidos: [] }, indexacao: { entraram: [], sairam: [] }, regresso: [{ titulo: 'x', total: 3, com_rastreio: 1, novos: 0 }] }), [],
    'o Google ter voltado antes da última visita já não é novidade');
});

test('dia: a ordem é a do que importa, e cada frase liga ao detalhe', () => {
  const f = frasesDoDia({
    incidentes: [
      { aberto: false, aberto_em: '2026-09-13T23:36:00Z', fechado_em: '2026-09-14T08:54:00Z', duracao_min: 558, execucoes_perdidas: 159, tarefas: [{ titulo: 'Publicações do site' }] },
      { aberto: true, aberto_em: '2026-09-14T10:00:00Z', execucoes_perdidas: 4, tarefas: [{ titulo: 'Decisões automáticas' }], causa_provavel: 'Execuções cortadas a meio.' }
    ],
    pedir: { total: 14, hoje: ['/a/', '/b/', '/c/', '/d/', '/e/', '/f/', '/g/', '/h/', '/i/', '/j/'] },
    indexacao: { entraram: ['/fr/x/', '/fr/y/'], sairam: ['/de/z/'] },
    correccoes: [{ titulo: 'Vídeo sem data', paginas: 14 }],
    licoes: [{ titulo: 'URL antiga com 301', antes: 'EM_TESTE', agora: 'CONFIRMADA' }]
  });
  assert.deepEqual(f.map(x => x.tema), ['modulo', 'pedir', 'indexacao', 'correccoes', 'indexacao', 'licoes', 'modulo']);
  assert.deepEqual(f.map(x => x.tom), ['alerta', 'accao', 'alerta', 'info', 'bom', 'bom', 'info']);
  assert.ok(f.every(x => x.ligacao && x.ligacao.href && x.ligacao.rotulo));
  const t = textos(f);
  assert.equal(t[0], 'O módulo tem tarefas a falhar desde 14/09 às 11:00: 4 execuções perdidas (Decisões automáticas). Execuções cortadas a meio.', 'hora de Lisboa');
  assert.equal(t[1], 'Há 10 páginas para pedires indexação hoje (de 14 à espera): o Google não voltou a elas depois de o módulo esperar 28 dias.');
  assert.equal(t[2], '1 página saiu do índice do Google: /de/z/.');
  assert.equal(t[4], 'O Google indexou 2 páginas: /fr/x/, /fr/y/.');
  assert.equal(t[5], 'Lição confirmada: «URL antiga com 301». Passa a ser boa prática no manual.');
  assert.equal(t[6], 'Entre 14/09 às 00:36 e 14/09 às 09:54 o módulo esteve com tarefas a falhar (9 h 18 min, 159 execuções perdidas). Já voltou ao normal.');
});

const semana = (imp, cl, extra = {}) => ({
  impressoes: imp, cliques: cl, marca: { impressoes: 0, cliques: 0 }, nao_marca: { impressoes: 0, cliques: 0 }, desconhecido: 0, ...extra
});
const basesSemana = over => ({
  fim: '2026-09-13', semana: semana(400, 40), anterior: null, paginas: [],
  indexacao: { total: 0, indexadas: 0, indexadas_antes: null, nunca: 0 }, correccoes: [], avaliacoes: [], incidentes: [],
  proximas: { espera: null, avaliacao: null, a_espera_do_google: 0, semanas_completas: 4 }, ...over
});
const secao = (s, id) => s.find(x => x.id === id);

test('semana: primeira semana, amostra pequena e comparação', () => {
  let s = frasesDaSemana(basesSemana());
  assert.match(secao(s, 'visibilidade').frases[0].texto, /É a primeira semana completa com dados: ainda não há com que comparar\.$/);
  s = frasesDaSemana(basesSemana({ anterior: semana(30, 2) }));
  assert.match(secao(s, 'visibilidade').frases[0].texto, /ainda é cedo para comparar\.$/, 'a semana anterior abaixo da amostra mínima');
  s = frasesDaSemana(basesSemana({ anterior: semana(420, 30) }));
  assert.match(secao(s, 'visibilidade').frases[0].texto, /praticamente igual à semana anterior \(420\)\.$/);
  s = frasesDaSemana(basesSemana({ anterior: semana(300, 30) }));
  assert.match(secao(s, 'visibilidade').frases[0].texto, /^O site apareceu 400 vezes nas pesquisas do Google e recebeu 40 cliques\. Nas impressões, mais 33% do que na semana anterior \(300\)\.$/);
  assert.equal(secao(s, 'destaques').frases.length, 0);
  assert.equal(secao(s, 'destaques').vazio, 'Nenhuma página mudou o suficiente para ser destaque.');
  assert.equal(secao(s, 'modulo').vazio, 'O módulo trabalhou sem paragens.');
  assert.equal(frasesDaSemana(basesSemana({ fim: '2026-09-06' })).find(x => x.id === 'modulo').vazio, 'Nesta semana o módulo ainda não registava as suas execuções.');
});

test('semana: com menos de metade das pesquisas visíveis, a divisão marca/assunto diz-se parcial e não se compara', () => {
  const s = frasesDaSemana(basesSemana({
    semana: semana(336, 55, { marca: { impressoes: 0, cliques: 0 }, nao_marca: { impressoes: 89, cliques: 8 }, desconhecido: 247 }),
    anterior: semana(208, 30, { nao_marca: { impressoes: 52, cliques: 3 } })
  }));
  assert.equal(secao(s, 'visibilidade').frases[1].texto, 'Das pesquisas que o Google mostra (89 de 336 impressões): 0 impressões e 0 cliques com a marca ou os métodos próprios (como Happy Soaring ou Pilot2Wing); ' +
    '89 impressões e 8 cliques sobre o assunto, sem esses nomes. As outras 247 são pesquisas raras que o Google não mostra: esta divisão é só parcial.');
});

test('semana: destaques, oportunidade, indexação e próximas datas', () => {
  const s = frasesDaSemana(basesSemana({
    anterior: semana(300, 30),
    paginas: [
      { caminho: '/o-que-e-um-parakite/', lingua: 'pt', imp: 60, imp_antes: 20, posicao: 14.6 },
      { caminho: '/en/', lingua: 'en', imp: 30, imp_antes: 70, posicao: 1.8 },
      { caminho: '/de/x/', lingua: 'de', imp: 25, imp_antes: 22, posicao: 9 },
      { caminho: '/pequena/', lingua: 'pt', imp: 12, imp_antes: 0, posicao: 12 }
    ],
    indexacao: { total: 175, indexadas: 150, indexadas_antes: 146, nunca: 12 },
    proximas: { espera: { data: '2026-09-27', paginas: 91 }, avaliacao: { data: '2026-09-29', paginas: 34 }, a_espera_do_google: 84, semanas_completas: 2 }
  }));
  const d = textos(secao(s, 'destaques').frases);
  assert.equal(d[0], 'A página que mais subiu: /o-que-e-um-parakite/, de 20 para 60 impressões.');
  assert.equal(d[1], 'A página que mais desceu: /en/, de 70 para 30 impressões.');
  assert.equal(d[2], 'Impressões por língua da página: PT 72 (+260%) · EN 30 (−57%) · ES 0 · FR 0 · DE 25 (+14%).');
  assert.equal(secao(s, 'oportunidade').frases[0].texto,
    '/o-que-e-um-parakite/ apareceu 60 vezes na posição média 14,6 — na segunda página do Google, onde poucas pessoas clicam. É a página com mais pesquisas à espera de ser vista.');
  assert.equal(secao(s, 'indexacao').frases[0].texto, 'No fim da semana, o Google tinha 150 de 175 páginas indexadas (+4 face à semana anterior). 12 páginas ainda não foram visitadas pelo Google.');
  assert.deepEqual(textos(secao(s, 'datas').frases), [
    'A 27/09 acaba a espera de 91 páginas que o Google ainda não visitou. Se continuarem sem visita, o módulo volta a decidir — e à segunda espera passam para ti.',
    'A partir de 29/09 começam as avaliações das correcções (34 páginas já visitadas pelo Google).',
    '84 páginas corrigidas continuam à espera de que o Google volte; só depois se pode avaliar.',
    'Subidas e descidas confirmadas só com 4 semanas completas de dados: faltam 2.'
  ]);
});

function semearGsc(s, desde, dias, { imp = 50, cl = 5, paginas = [], consultas = [] } = {}) {
  const ins = s.prepare('INSERT INTO gsc_dias (data, propriedade, cliques, impressoes, completo) VALUES (?, ?, ?, ?, 1)');
  const conj = s.prepare('INSERT INTO gsc_conjuntos (data, conjunto, linhas, cliques_visiveis, impressoes_visiveis, json) VALUES (?, ?, 0, 0, 0, ?)');
  for (let i = 0; i < dias; i++) {
    const d = new Date(Date.parse(desde + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10);
    ins.run(d, 'sc', cl, imp);
    conj.run(d, 'page', JSON.stringify(paginas));
    conj.run(d, 'query', JSON.stringify(consultas));
  }
}

test('semana com base real: gera-se quando o Search Console fecha os 7 dias, uma só vez, e fica guardada', async () => {
  const db = await d1Falsa();
  const s = db.sqlite;
  const paginas = [['https://happysoaring.com/o-que-e-um-parakite/', 1, 10, 0.1, 14], ['https://happysoaring.com/en/', 3, 5, 0.6, 2]];
  const consultas = [['happy soaring', 3, 5, 0.6, 2], ['what is a parakite', 1, 10, 0.1, 14]];
  semearGsc(s, '2026-08-31', 7, { imp: 20, cl: 2, paginas: [['https://happysoaring.com/o-que-e-um-parakite/', 0, 3, 0, 20]], consultas: [['what is a parakite', 0, 3, 0, 20]] });
  semearGsc(s, '2026-09-07', 6, { imp: 20, cl: 4, paginas, consultas });

  /* domingo ainda não fechado: gera a semana de 31/08, a anterior não existe */
  let r = await executarCicloSemana(db, { agora: '2026-09-14T10:00:00.000Z' });
  assert.equal(r.gerada, '2026-08-31');
  s.prepare('INSERT INTO gsc_dias (data, propriedade, cliques, impressoes, completo) VALUES (?, ?, ?, ?, 0)').run('2026-09-13', 'sc', 4, 20);
  r = await executarCicloSemana(db, { agora: '2026-09-15T10:00:00.000Z' });
  assert.equal(r.gerada, null, 'domingo por completar');

  s.exec("DELETE FROM gsc_dias WHERE data = '2026-09-13'");
  semearGsc(s, '2026-09-13', 1, { imp: 20, cl: 4, paginas, consultas });
  r = await executarCicloSemana(db, { agora: '2026-09-16T10:00:00.000Z' });
  assert.equal(r.gerada, '2026-09-07');
  assert.equal((await executarCicloSemana(db, { agora: '2026-09-16T10:10:00.000Z' })).gerada, null, 'não se gera duas vezes');

  const w = await lerSemana(db);
  assert.equal(w.semana, '2026-09-07');
  assert.equal(w.fim, '2026-09-13');
  const vis = w.secoes.find(x => x.id === 'visibilidade').frases.map(f => f.texto);
  assert.equal(vis[0], 'O site apareceu 140 vezes nas pesquisas do Google e recebeu 28 cliques. Nas impressões, praticamente igual à semana anterior (140).');
  assert.equal(vis[1], 'Das pesquisas que o Google mostra (105 de 140 impressões): 35 impressões e 21 cliques com a marca ou os métodos próprios (como Happy Soaring ou Pilot2Wing); ' +
    '70 impressões e 7 cliques sobre o assunto, sem esses nomes. As outras 35 são pesquisas raras que o Google não mostra.');
  assert.ok(!vis[1].includes('%'), 'sem marca na semana anterior: só 21 impressões, abaixo da amostra para comparar');
  assert.equal(w.destaque, vis[0]);
  assert.match(w.secoes.find(x => x.id === 'oportunidade').frases[0].texto, /^\/o-que-e-um-parakite\/ apareceu 70 vezes na posição média 14 — na segunda página/);
  assert.deepEqual((await listarSemanas(db)).map(x => x.semana), ['2026-09-07', '2026-08-31']);
  assert.equal(await lerSemana(db, '2026-01-05'), null);
});

test('dados do dia: páginas que entraram e saíram do índice desde a visita', async () => {
  const db = await d1Falsa();
  const s = db.sqlite;
  const insp = (c, em, v) => s.prepare('INSERT INTO inspecoes (caminho, inspeccionado_em, veredicto, ultimo_rastreio) VALUES (?, ?, ?, ?)').run(c, em, v, '2026-09-01T00:00:00Z');
  const pg = (c, v) => s.prepare('INSERT INTO paginas_google (caminho, ultima_inspeccao_em, veredicto) VALUES (?, ?, ?)').run(c, '2026-09-14T00:00:00Z', v);
  insp('/entrou/', '2026-09-10T00:00:00Z', 'NEUTRAL'); insp('/entrou/', '2026-09-14T00:00:00Z', 'PASS'); pg('/entrou/', 'PASS');
  insp('/saiu/', '2026-09-10T00:00:00Z', 'PASS'); insp('/saiu/', '2026-09-14T00:00:00Z', 'NEUTRAL'); pg('/saiu/', 'NEUTRAL');
  insp('/igual/', '2026-09-10T00:00:00Z', 'PASS'); insp('/igual/', '2026-09-14T00:00:00Z', 'PASS'); pg('/igual/', 'PASS');
  insp('/nova/', '2026-09-14T00:00:00Z', 'PASS'); pg('/nova/', 'PASS');   /* vista pela primeira vez: não «entrou» */
  insp('/antiga/', '2026-09-01T00:00:00Z', 'PASS'); pg('/antiga/', 'PASS');
  const d = await lerDadosDoDia(db, { desde: '2026-09-12T00:00:00.000Z', agora: '2026-09-14T12:00:00.000Z' });
  assert.deepEqual(d.indexacao, { entraram: ['/entrou/'], sairam: ['/saiu/'] });
  assert.deepEqual(d.incidentes, []);
});
