/* Decisões automáticas, lições e manual de boas práticas. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { politica, licaoDe, resultadosDasLicoes, executarCicloDecisoes, lerAprendizagem, gerarManual, gravarLicao } from '../src/aprendizagem.js';
import { executarCicloAssuntos, lerAssunto, lerHoje, decidirAssunto } from '../src/assuntos.js';
import { gravarConhecimento } from '../src/conhecimento.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const cont = { consultas: 0 };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { cont.consultas++; const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => { cont.consultas++; return { results: db.prepare(sql).all(...params).map(r => ({ ...r })) }; },
    run: async () => { cont.consultas++; const r = db.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
    executar: () => {
      if ((sql.match(/\?/g) || []).length > 100) throw new Error('D1: mais de 100 parâmetros');
      db.prepare(sql).run(...params);
    }
  });
  return {
    prepare: sql => stmt(sql),
    batch: async st => { db.exec('BEGIN'); try { st.forEach(x => { cont.consultas++; x.executar(); }); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; },
    sqlite: db, cont
  };
}

const O = 'https://happysoaring.com';
const site = paginas => async u => String(u).endsWith('/sitemap.xml')
  ? new Response('<urlset>' + paginas.map(p => `<loc>${O}${p}</loc>`).join('') + '</urlset>') : new Response(null, { status: 404 });
function inspeccionar(db, caminho, em, x = {}) {
  const i = { veredicto: 'PASS', estado_indexacao: 'INDEXING_ALLOWED', estado_robots: 'ALLOWED', estado_obtencao: 'SUCCESSFUL',
    ultimo_rastreio: '2026-09-01T00:00:00Z', canonico_google: O + caminho, canonico_declarado: O + caminho, resultados_ricos: null, ...x };
  db.sqlite.prepare(`INSERT INTO inspecoes (caminho, inspeccionado_em, veredicto, estado_indexacao, estado_robots, estado_obtencao, ultimo_rastreio,
    canonico_google, canonico_declarado, resultados_ricos) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(caminho, em, i.veredicto, i.estado_indexacao, i.estado_robots, i.estado_obtencao, i.ultimo_rastreio, i.canonico_google, i.canonico_declarado, i.resultados_ricos);
  db.sqlite.prepare(`INSERT OR REPLACE INTO paginas_google (caminho, ultima_inspeccao_em, ultimo_rastreio, veredicto) VALUES (?, ?, ?, ?)`)
    .run(caminho, em, i.ultimo_rastreio, i.veredicto);
}
const PRODUTO = JSON.stringify({ veredicto: 'FAIL', tipos: ['Fragmentos do produto'], problemas: ['Fragmentos do produto: Deve ser especificada a propriedade "offers", "review" ou "aggregateRating".'] });
const LICAO = {
  chave: 'dados-estruturados/product-sem-preco', tipo_assunto: 'DADOS_ESTRUTURADOS_INVALIDOS', categoria: 'Dados estruturados',
  titulo: 'Produto sem preço marcado como Product', padrao: 'offers|Fragmentos do produto', prioridade: 10,
  sintoma: 'Erro «offers, review ou aggregateRating».', causa: 'Product sem preço nem avaliações.',
  correccao: 'Retirar o Product do JSON-LD.', prevencao: 'Só marcar Product com preço visível ou avaliações reais.'
};
const AGORA = '2026-09-13T12:00:00.000Z';

test('regras: cada tipo tem a decisão certa; nada se decide sem confirmação; lição refutada passa para análise', () => {
  const v = (tipo, x = {}) => ({ tipo, critico: 0, confirmado: 1, evidencia: {}, ...x });
  assert.equal(politica(v('CANONICO_DIFERENTE', { confirmado: 0 }), null, AGORA), null);
  assert.equal(politica(v('BLOQUEADA_NOINDEX', { critico: 1, confirmado: 1 }), null, AGORA).decisao, 'APROVAR');
  const adiar = politica(v('ALTERACAO_SEM_RASTREIO'), null, AGORA);
  assert.deepEqual([adiar.decisao, adiar.adiar_ate], ['ADIAR', '2026-09-27']);
  assert.equal(politica(v('URL_FORA_DO_SITEMAP', { evidencia: { http: 301, destino: '/x/' } }), null, AGORA).decisao, 'IGNORAR');
  assert.equal(politica(v('URL_FORA_DO_SITEMAP', { evidencia: { http: 404 } }), null, AGORA).decisao, 'APROVAR');
  assert.equal(politica(v('URL_FORA_DO_SITEMAP', { evidencia: { http: null } }), null, AGORA), null, 'sem verificação não se decide');
  assert.equal(politica(v('RASTREADA_NAO_INDEXADA'), null, AGORA).decisao, 'PEDIR_EVIDENCIA');
  const conf = politica(v('DADOS_ESTRUTURADOS_INVALIDOS'), { titulo: 'X', estado: 'CONFIRMADA' }, AGORA);
  assert.match(conf.razao, /Lição aplicada: «X» \(confirmada\)/);
  assert.equal(politica(v('DADOS_ESTRUTURADOS_INVALIDOS'), { titulo: 'X', estado: 'REFUTADA' }, AGORA).decisao, 'PEDIR_EVIDENCIA');
});

test('lições: reconhecem o caso pela evidência; o estado vem só dos resultados observados', () => {
  const licoes = [{ ...LICAO }, { ...LICAO, chave: 'dados-estruturados/video-sem-data', padrao: 'uploadDate|Vídeos', prioridade: 20, titulo: 'Vídeo sem data' }];
  const produto = { tipo: 'DADOS_ESTRUTURADOS_INVALIDOS', evidencia: { erros_dados_estruturados: ['Fragmentos do produto: offers'] } };
  const video = { tipo: 'DADOS_ESTRUTURADOS_INVALIDOS', evidencia: { tipos_resultado: ['Vídeos'] } };
  assert.equal(licaoDe(produto, licoes).chave, LICAO.chave);
  assert.equal(licaoDe(video, licoes).chave, 'dados-estruturados/video-sem-data');
  assert.equal(licaoDe({ tipo: 'CANONICO_DIFERENTE', evidencia: {} }, licoes), null);

  const estado = (avaliacoes, assuntos = []) => resultadosDasLicoes([LICAO], {
    assuntos, pacotes: avaliacoes.map((_, i) => ({ id: i + 1, licao_chave: LICAO.chave })),
    avaliacoes: avaliacoes.map((r, i) => ({ pacote_id: i + 1, resultado: r }))
  })[0].estado;
  assert.equal(estado([]), 'EM_TESTE');
  assert.equal(estado(['MELHORIA_OBSERVADA']), 'EM_TESTE', 'um caso não chega');
  assert.equal(estado(['MELHORIA_OBSERVADA', 'MELHORIA_OBSERVADA']), 'CONFIRMADA');
  assert.equal(estado(['MELHORIA_OBSERVADA', 'MELHORIA_OBSERVADA', 'PIOROU']), 'REFUTADA');
  assert.equal(estado(['SEM_EFEITO_CLARO', 'SEM_EFEITO_CLARO']), 'REFUTADA');
  const semAccao = resultadosDasLicoes([{ ...LICAO, tipo_assunto: 'URL_FORA_DO_SITEMAP', padrao: '"http":301' }], {
    assuntos: [{ tipo: 'URL_FORA_DO_SITEMAP', evidencia: { http: 301 }, resolvido_em: 'x', caminho: '/a/' },
      { tipo: 'URL_FORA_DO_SITEMAP', evidencia: { http: 301 }, resolvido_em: 'y', caminho: '/b/' }], pacotes: [], avaliacoes: []
  })[0];
  assert.equal(semAccao.estado, 'CONFIRMADA', 'lição de «não fazer nada»: confirma-se quando os casos se resolvem sozinhos');
});

test('ciclo de decisões: decide o que tem regra, cria pacotes com a lição, respeita bloqueios e decisões do Paulo', async () => {
  const db = await d1Falsa();
  const paginas = ['/asa-1/', '/asa-2/', '/nova/', '/canon/', '/bloqueada/', '/paulo/'];
  inspeccionar(db, '/asa-1/', '2026-09-12T00:00:00Z', { resultados_ricos: PRODUTO });
  inspeccionar(db, '/asa-2/', '2026-09-12T00:00:00Z', { resultados_ricos: PRODUTO });
  inspeccionar(db, '/nova/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', ultimo_rastreio: null });
  inspeccionar(db, '/canon/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', canonico_google: O + '/outra/' });
  inspeccionar(db, '/bloqueada/', '2026-09-12T00:00:00Z', { resultados_ricos: PRODUTO });
  inspeccionar(db, '/paulo/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG' });
  assert.equal((await gravarLicao(db, LICAO, { agora: AGORA, origem: 'CLAUDE' })).estado, 200);
  await gravarConhecimento(db, 'decisoes_activas', { titulo: 'Não mexer nesta', tipo: 'ESTRATEGICA', razao: 'teste', decidida_em: '2026-09-01',
    bloqueia_tipo: 'DADOS_ESTRUTURADOS_INVALIDOS', bloqueia_caminho: '/bloqueada/' });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site(paginas), agora: AGORA });
  const idPaulo = db.sqlite.prepare("SELECT id FROM assuntos WHERE caminho = '/paulo/'").get().id;
  await decidirAssunto(db, idPaulo, { decisao: 'IGNORAR', razao: 'é intencional' }, { agora: AGORA });

  const antes = db.cont.consultas;
  const r = await executarCicloDecisoes({ DB: db }, { agora: '2026-09-13T12:28:00.000Z' });
  assert.ok(db.cont.consultas - antes <= 45, 'consultas: ' + (db.cont.consultas - antes));
  const d = Object.fromEntries(db.sqlite.prepare('SELECT a.caminho, d.decisao, d.decidido_por FROM assunto_decisoes d JOIN assuntos a ON a.chave = d.assunto_chave').all()
    .map(x => [x.caminho, x.decisao + '/' + x.decidido_por]));
  assert.deepEqual(d, { '/asa-1/': 'APROVAR/MODULO', '/asa-2/': 'APROVAR/MODULO', '/nova/': 'ADIAR/MODULO', '/paulo/': 'IGNORAR/PAULO' },
    'canónico por confirmar e página bloqueada ficam sem decisão; a decisão do Paulo não se sobrepõe');
  assert.equal(r.pacotes, 2);
  const pacotes = db.sqlite.prepare('SELECT p.licao_chave, p.decisao_id, d.decisao, p.conteudo FROM pacotes_trabalho p JOIN assunto_decisoes d ON d.id = p.decisao_id').all();
  assert.ok(pacotes.every(p => p.licao_chave === LICAO.chave && p.decisao === 'APROVAR'));
  assert.equal(JSON.parse(pacotes[0].conteudo).licao.correccao, LICAO.correccao, 'o pacote leva a correcção que a lição conhece');
  assert.equal((await lerAssunto(db, db.sqlite.prepare("SELECT id FROM assuntos WHERE caminho = '/asa-1/'").get().id, { agora: AGORA })).estado, 'DECIDIDO');

  const r2 = await executarCicloDecisoes({ DB: db }, { agora: '2026-09-13T12:48:00.000Z' });
  assert.equal(r2.decididos, 0, 'o que já está decidido não se decide outra vez');
  const r3 = await executarCicloDecisoes({ DB: db }, { agora: '2026-09-28T12:28:00.000Z' });
  assert.equal(r3.por_decisao.ADIAR, 1, 'adiamento vencido: decide-se de novo');

  const hoje = await lerHoje(db, { agora: '2026-09-13T14:00:00.000Z' });
  assert.deepEqual(hoje.bloco4.trabalho_claude, [{ grupo: LICAO.chave, titulo: 'Dados estruturados com erros', paginas: 2 }]);
  assert.deepEqual(hoje.bloco3.accoes, [], 'nada precisa do Paulo');
});

test('lição: validação, versões e manual gerado só com o que foi observado', async () => {
  const db = await d1Falsa();
  assert.equal((await gravarLicao(db, { ...LICAO, chave: 'Chave Inválida' })).estado, 400);
  assert.equal((await gravarLicao(db, { ...LICAO, tipo_assunto: 'INVENTADO' })).estado, 400);
  assert.equal((await gravarLicao(db, { ...LICAO, padrao: '(' })).estado, 400);
  assert.equal((await gravarLicao(db, { ...LICAO, prevencao: '' })).estado, 400);
  await gravarLicao(db, LICAO, { agora: AGORA });
  await gravarLicao(db, { ...LICAO, titulo: 'Título revisto' }, { agora: AGORA });
  assert.deepEqual(db.sqlite.prepare('SELECT versao FROM licoes_historico WHERE chave = ? ORDER BY versao').all(LICAO.chave).map(x => x.versao), [1, 2]);
  const a = await lerAprendizagem(db, { agora: AGORA });
  assert.equal(a.licoes[0].estado, 'EM_TESTE');
  assert.match(a.manual, /## Práticas em teste/);
  assert.match(a.manual, /\*\*Boa prática:\*\* Só marcar Product/);
  assert.doesNotMatch(a.manual, /Práticas confirmadas/, 'sem resultados, nada aparece como confirmado');
  assert.match(gerarManual([], AGORA), /Ainda não há lições/);
});

test('pacote aprovado depois de a correcção já estar publicada: liga-se pela implementação registada com o commit', async () => {
  const { SQL_ALTERACOES_DE_UMA_PUBLICACAO, SQL_PACOTES_DE_UMA_PUBLICACAO } = await import('../src/publicacoes.js');
  const { DatabaseSync } = await import('node:sqlite');
  const s = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) s.exec(fs.readFileSync(f, 'utf8'));
  s.exec(`INSERT INTO deployments (id, url, criado_em_cf, processamento, meta_commit) VALUES
      ('d0', 'x', '2026-09-01T00:00:00Z', 'PROCESSADO', 'aaaaaaa0000000000000000000000000000000000'),
      ('d1', 'x', '2026-09-13T18:15:00Z', 'PROCESSADO', '1d2ddcb0000000000000000000000000000000000');
    UPDATE deployments SET anterior_id = 'd0' WHERE id = 'd1';
    INSERT INTO deployment_paginas (deployment_id, caminho, estado, resumo_conteudo) VALUES
      ('d0', '/a/', 'LIDA', 'x'), ('d1', '/a/', 'LIDA', 'y'), ('d0', '/b/', 'LIDA', 'x'), ('d1', '/b/', 'LIDA', 'y'), ('d0', '/c/', 'LIDA', 'x'), ('d1', '/c/', 'LIDA', 'y');
    INSERT INTO assunto_decisoes (id, assunto_chave, decisao, decidido_em) VALUES (1, 'X /a/', 'APROVAR', '2026-09-13T18:28:00Z'), (2, 'X /b/', 'APROVAR', '2026-09-13T18:28:00Z'), (3, 'X /c/', 'APROVAR', '2026-09-13T18:00:00Z');
    INSERT INTO pacotes_trabalho (assunto_chave, decisao_id, caminho, conteudo, criado_em, implementacao) VALUES
      ('X /a/', 1, '/a/', '{}', '2026-09-13T18:28:00Z', '{"commit":"1d2ddcb"}'),
      ('X /b/', 2, '/b/', '{}', '2026-09-13T18:28:00Z', NULL),
      ('X /c/', 3, '/c/', '{}', '2026-09-13T18:00:00Z', NULL);`);
  s.prepare(SQL_ALTERACOES_DE_UMA_PUBLICACAO).run('d1');
  s.prepare(SQL_PACOTES_DE_UMA_PUBLICACAO).run('d1');
  const r = Object.fromEntries(s.prepare('SELECT caminho, deployment_id FROM pacotes_trabalho').all().map(x => [x.caminho, x.deployment_id]));
  assert.deepEqual(r, { '/a/': 'd1', '/b/': null, '/c/': 'd1' }, 'pelo commit registado, ou por ter sido aprovado antes; sem nenhum dos dois, não se liga');
});

test('quando pedir indexação: só depois de duas esperas de 14 dias sem rastreio; até lá a fila diz «aguardar» e até quando', async () => {
  const { accaoDaPagina } = await import('../src/inspeccao.js');
  const agora = '2026-10-20T12:00:00.000Z';
  assert.equal(accaoDaPagina('RASTREADO_SEM_PEDIDO', null, null, agora).accao, null);
  assert.equal(accaoDaPagina('PENDENTE', null, '2026-10-18T00:00:00Z', agora).accao_razao.startsWith('Alteração recente'), true);
  const esperar = accaoDaPagina('PENDENTE', { vigente: true, adiar_ate: '2026-10-27', adiamentos: 1, decidido: true }, '2026-09-01T00:00:00Z', agora);
  assert.deepEqual([esperar.accao, esperar.aguardar_ate], ['AGUARDAR', '2026-10-27']);
  assert.equal(accaoDaPagina('PENDENTE', { vigente: false, adiar_ate: '2026-10-13', adiamentos: 1, decidido: true }, '2026-09-01T00:00:00Z', agora).accao, 'AGUARDAR');
  assert.equal(accaoDaPagina('PENDENTE', { vigente: false, adiar_ate: '2026-10-13', adiamentos: 2, decidido: true }, '2026-09-01T00:00:00Z', agora).accao, 'PEDIR');
  const v = { tipo: 'NUNCA_RASTREADA', critico: 0, confirmado: 1, evidencia: {} };
  assert.equal(politica(v, null, agora, { adiamentos: 1 }).decisao, 'ADIAR');
  assert.equal(politica(v, null, agora, { adiamentos: 2 }), null, 'à terceira não há regra: passa para o Paulo');

  /* percurso: duas esperas do módulo, e o «Hoje» pede ao Paulo */
  const db = await d1Falsa();
  inspeccionar(db, '/nova/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', ultimo_rastreio: null });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site(['/nova/']), agora: '2026-09-13T12:00:00.000Z' });
  await executarCicloDecisoes({ DB: db }, { agora: '2026-09-13T12:28:00.000Z' });
  let h = await lerHoje(db, { agora: '2026-09-14T12:00:00.000Z' });
  assert.equal(h.bloco3.accoes.length, 0, 'primeira espera: nada para o Paulo');
  assert.equal(h.ctx, undefined);
  await executarCicloDecisoes({ DB: db }, { agora: '2026-09-28T12:28:00.000Z' });
  h = await lerHoje(db, { agora: '2026-09-29T12:00:00.000Z' });
  assert.equal(h.bloco3.accoes.length, 0, 'segunda espera: ainda nada');
  const r = await executarCicloDecisoes({ DB: db }, { agora: '2026-10-13T12:28:00.000Z' });
  assert.equal(r.decididos, 0, 'depois de duas esperas o módulo já não adia');
  h = await lerHoje(db, { agora: '2026-10-13T13:00:00.000Z' });
  assert.deepEqual(h.bloco3.accoes.map(a => [a.tipo, a.total, a.hoje]), [['PEDIR_INDEXACAO', 1, ['/nova/']]]);
});

test('nada se perde: lições de processo, «o que falta aprender» e dispensas', async () => {
  const { lerFaltaAprender, lerAprendizagem, gravarLicao, resultadosDasLicoes, gerarManual } = await import('../src/aprendizagem.js');
  const { DatabaseSync } = await import('node:sqlite');
  const fsm = await import('node:fs'), pathm = await import('node:path'), urlm = await import('node:url');
  const MOD = pathm.join(pathm.dirname(urlm.fileURLToPath(import.meta.url)), '..');
  const sq = new DatabaseSync(':memory:');
  for (const f of fsm.readdirSync(pathm.join(MOD, 'migrations')).filter(f => f.endsWith('.sql')).sort()) sq.exec(fsm.readFileSync(pathm.join(MOD, 'migrations', f), 'utf8'));
  const stmt = (sql, params = []) => ({ sql, params, bind: (...p) => stmt(sql, p),
    first: async () => { const r = sq.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: sq.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { sq.prepare(sql).run(...params); return {}; } });
  const db = { prepare: s => stmt(s), batch: async ss => { for (const s of ss) sq.prepare(s.sql).run(...s.params); return []; } };
  const agora = '2026-09-15T10:00:00.000Z';

  /* a migração traz as duas lições de processo e o incidente real, que já tem lição */
  const proc = sq.prepare("SELECT chave FROM licoes WHERE natureza = 'PROCESSO' ORDER BY chave").all().map(x => x.chave);
  assert.deepEqual(proc, ['operacao/frequencia-das-tarefas', 'operacao/limite-processamento-tarefas-agendadas']);
  assert.equal((await lerFaltaAprender(db, { agora })).length, 0);

  /* um problema sem lição → falta lição; com hipóteses eliminadas → causa por descobrir */
  const ins = (chave, tipo, caminho) => sq.prepare("INSERT INTO assuntos (chave, tipo, caminho, evidencia, detectado_em, visto_em) VALUES (?, ?, ?, '{}', ?, ?)").run(chave, tipo, caminho, agora, agora);
  try { ins('RASTREADA_NAO_INDEXADA /fr/ailes/yoti-3/', 'RASTREADA_NAO_INDEXADA', '/fr/ailes/yoti-3/'); }
  catch (e) { /* o esquema de assuntos pode pedir mais colunas: o teste usa o mínimo que o módulo grava */ throw e; }
  let f = await lerFaltaAprender(db, { agora });
  assert.equal(f.length, 1);
  assert.equal(f[0].estado, 'FALTA_LICAO');
  sq.prepare("INSERT INTO hipoteses_eliminadas (hipotese, evidencia, eliminada_em, caminho) VALUES ('diferença técnica', 'igual às irmãs', '2026-09-14', '/fr/ailes/yoti-3/')").run();
  f = await lerFaltaAprender(db, { agora });
  assert.equal(f[0].estado, 'CAUSA_POR_DESCOBRIR');
  assert.equal(f[0].hipoteses_eliminadas, 1);

  /* um incidente fechado sem lição → falta lição; dispensado → sai */
  sq.prepare(`INSERT INTO incidentes (aberto_em, ultimo_problema_em, fechado_em, contagens, causa_confirmada, resolucao, resolvido_em)
    VALUES ('2026-09-15T01:00:00.000Z', '2026-09-15T02:00:00.000Z', '2026-09-15T02:02:00.000Z', '{"assuntos":{"EM_FALTA":30}}', 'causa x', 'resolução y', '2026-09-15T03:00:00.000Z')`).run();
  f = await lerFaltaAprender(db, { agora });
  assert.equal(f.find(x => x.origem === 'incidente').estado, 'FALTA_LICAO');
  sq.prepare("INSERT INTO aprendizagem_dispensas (referencia, motivo) VALUES ('incidente:2026-09-15T01:00:00.000Z', 'teste: sem nada a aprender')").run();
  assert.equal((await lerFaltaAprender(db, { agora })).filter(x => x.origem === 'incidente').length, 0);

  /* uma lição de processo grava-se sem tipo de problema, e está em vigor */
  const r = await gravarLicao(db, { chave: 'processo/teste', natureza: 'PROCESSO', categoria: 'Como se publica', titulo: 'T', sintoma: 's', causa: 'c',
    correccao: 'x', prevencao: 'p', referencias: ['incidente:2026-09-15T01:00:00.000Z'] }, { agora, origem: 'CLAUDE' });
  assert.equal(r.estado, 200);
  const a = await lerAprendizagem(db, { agora });
  assert.equal(a.licoes.find(l => l.chave === 'processo/teste').estado, 'EM_VIGOR');
  assert.match(a.manual, /Regras de trabalho em vigor/);
  assert.match(a.manual, /Nasceu de:/);
  assert.equal(a.falta_aprender.length, 1);
  /* uma lição MEDIDA continua a precisar de um tipo de problema válido */
  assert.equal((await gravarLicao(db, { chave: 'x/sem-tipo', categoria: 'c', titulo: 't', sintoma: 's', causa: 'c', correccao: 'x', prevencao: 'p' })).estado, 400);
});
