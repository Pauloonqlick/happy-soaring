/* Fase 5 — assuntos, porta, «Hoje», conhecimento, contactos e pacotes.
   Base SQLite real com as migrações aplicadas. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectarAssuntos, aplicarPorta, avaliarPacote, executarCicloAssuntos, lerHoje, lerAssunto, decidirAssunto,
  TIPOS, ORCAMENTO_ASSUNTOS
} from '../src/assuntos.js';
import { gravarConhecimento, lerConhecimento, historicoConhecimento, registarContacto, gravarPagina, gravarImportancia, lerConfiguracao } from '../src/conhecimento.js';
import { SQL_ALTERACOES_DE_UMA_PUBLICACAO, SQL_PACOTES_DE_UMA_PUBLICACAO } from '../src/publicacoes.js';
import { derivarEstado } from '../src/inspeccao.js';
import { limparCacheChaves } from '../src/acesso.js';
import worker from '../src/index.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
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
const sitemap = caminhos => '<?xml version="1.0"?><urlset>' + caminhos.map(c => `<loc>${ORIGEM}${c}</loc>`).join('') + '</urlset>';
function siteFalso(paginas, http = {}) {
  const log = [];
  const f = async (url, init) => {
    const u = String(url);
    log.push((init?.method || 'GET') + ' ' + u);
    if (u === ORIGEM + '/sitemap.xml') return new Response(sitemap(paginas));
    if (http[u]) return new Response(null, { status: http[u].status, headers: http[u].location ? { location: http[u].location } : {} });
    throw new Error('rede proibida: ' + u);
  };
  f.log = log;
  return f;
}

const BOA = { veredicto: 'PASS', cobertura: 'Enviada e indexada', estado_indexacao: 'INDEXING_ALLOWED', estado_robots: 'ALLOWED', estado_obtencao: 'SUCCESSFUL' };
function inspeccionar(db, caminho, em, campos = {}) {
  const i = { ...BOA, ultimo_rastreio: '2026-09-01T00:00:00Z', canonico_google: ORIGEM + caminho, canonico_declarado: ORIGEM + caminho, ...campos };
  db.sqlite.prepare(`INSERT INTO inspecoes (caminho, inspeccionado_em, veredicto, cobertura, estado_indexacao, estado_robots, estado_obtencao,
    ultimo_rastreio, canonico_google, canonico_declarado, resultados_ricos) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(caminho, em, i.veredicto, i.cobertura, i.estado_indexacao, i.estado_robots, i.estado_obtencao, i.ultimo_rastreio,
      i.canonico_google, i.canonico_declarado, i.resultados_ricos ?? null);
  db.sqlite.prepare(`INSERT INTO paginas_google (caminho, ultima_inspeccao_em, ultimo_rastreio, veredicto, cobertura, estado_obtencao, estado_robots,
    canonico_google, canonico_declarado) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(caminho) DO UPDATE SET ultima_inspeccao_em = excluded.ultima_inspeccao_em,
    ultimo_rastreio = COALESCE(excluded.ultimo_rastreio, paginas_google.ultimo_rastreio), veredicto = excluded.veredicto, cobertura = excluded.cobertura,
    estado_obtencao = excluded.estado_obtencao, estado_robots = excluded.estado_robots, canonico_google = excluded.canonico_google,
    canonico_declarado = excluded.canonico_declarado`)
    .run(caminho, em, i.ultimo_rastreio, i.veredicto, i.cobertura, i.estado_obtencao, i.estado_robots, i.canonico_google, i.canonico_declarado);
}

/* ---------------------------------------------------------------- puro -- */

const AGORA = '2026-09-13T12:00:00.000Z';
const insp = (campos = {}) => ({ ...BOA, inspeccionado_em: '2026-09-12T00:00:00Z', ultimo_rastreio: '2026-09-01T00:00:00Z', ...campos });

test('detecção: cada sinal forte, com a precedência certa e sem duplicar a mesma página', () => {
  const inspecoes = new Map([
    ['/ok/', [insp()]],
    ['/robots/', [insp({ veredicto: 'FAIL', estado_robots: 'DISALLOWED' }), insp({ veredicto: 'PASS' })]],
    ['/noindex/', [insp({ veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG' })]],
    ['/500/', [insp({ veredicto: 'FAIL', estado_obtencao: 'SERVER_ERROR' })]],
    ['/404-uma-vez/', [insp({ veredicto: 'FAIL', estado_obtencao: 'NOT_FOUND' })]],
    ['/desindexada/', [insp({ veredicto: 'NEUTRAL', canonico_google: 'https://happysoaring.com/outra/', canonico_declarado: 'https://happysoaring.com/desindexada/' }), insp()]],
    ['/canonico/', [insp({ veredicto: 'NEUTRAL', canonico_google: 'https://happysoaring.com/x/', canonico_declarado: 'https://happysoaring.com/canonico/' })]],
    ['/nunca/', [insp({ veredicto: 'NEUTRAL', ultimo_rastreio: null })]],
    ['/rastreada/', [insp({ veredicto: 'NEUTRAL' }), insp({ veredicto: 'NEUTRAL' })]],
    ['/ricos/', [insp({ resultados_ricos: JSON.stringify({ veredicto: 'FAIL', tipos: ['FAQ'] }) })]]
  ]);
  const universo = [...inspecoes.keys(), '/sem-inspeccao/', '/alterada/'];
  inspecoes.set('/alterada/', [insp()]);
  const fila = [{ caminho: '/alterada/', estado: 'PENDENTE', ultima_alteracao: { em: '2026-09-01T00:00:00Z', tipo: 'conteudo' } }];
  const urlsGsc = [
    { url: 'https://happysoaring.com/ok/', impressoes: 50, semanas: 4 },
    { url: 'https://happysoaring.com/antiga/', impressoes: 30, semanas: 3 },
    { url: 'https://www.happysoaring.com/ok/', impressoes: 5, semanas: 1 },
    { url: 'https://outro.example/ok/', impressoes: 5, semanas: 4 }
  ];
  const http = new Map([['https://happysoaring.com/antiga/', { http: 301, destino: '/ok/' }]]);
  const d = detectarAssuntos({ universo, inspecoes, fila, urlsGsc, http, agora: AGORA });
  const por = Object.fromEntries(d.map(x => [x.chave, x]));
  const tipos = d.map(x => x.chave).sort();
  assert.deepEqual(tipos, [
    'ALTERACAO_SEM_RASTREIO /alterada/', 'BLOQUEADA_NOINDEX /noindex/', 'BLOQUEADA_ROBOTS /robots/',
    'CANONICO_DIFERENTE /canonico/', 'DADOS_ESTRUTURADOS_INVALIDOS /ricos/', 'DESINDEXADA /desindexada/',
    'ERRO_OBTENCAO /404-uma-vez/', 'ERRO_OBTENCAO /500/', 'NUNCA_RASTREADA /nunca/', 'RASTREADA_NAO_INDEXADA /rastreada/',
    'URL_FORA_DO_SITEMAP https://happysoaring.com/antiga/', 'URL_FORA_DO_SITEMAP https://www.happysoaring.com/ok/'
  ]);
  assert.equal(por['BLOQUEADA_ROBOTS /robots/'].critico, 1);
  assert.equal(por['BLOQUEADA_ROBOTS /robots/'].evidencia.deixou_de_estar_indexada, true, 'a desindexação vai para a evidência, não duplica');
  assert.equal(por['ERRO_OBTENCAO /500/'].critico, 1, 'erro de servidor não espera confirmação');
  assert.deepEqual([por['ERRO_OBTENCAO /404-uma-vez/'].critico, por['ERRO_OBTENCAO /404-uma-vez/'].confirmado], [0, 0]);
  assert.equal(por['DESINDEXADA /desindexada/'].critico, 1, 'deixou de estar indexada: grave, mesmo com canónico diferente');
  assert.equal(por['CANONICO_DIFERENTE /canonico/'].confirmado, 0, 'uma inspecção só: por confirmar');
  assert.equal(por['RASTREADA_NAO_INDEXADA /rastreada/'].confirmado, 1);
  assert.equal(por['URL_FORA_DO_SITEMAP https://happysoaring.com/antiga/'].caminho, '/antiga/');
  assert.equal(por['URL_FORA_DO_SITEMAP https://happysoaring.com/antiga/'].evidencia.http, 301);
  assert.equal(por['URL_FORA_DO_SITEMAP https://www.happysoaring.com/ok/'].confirmado, 0, 'impressões numa só semana');
  assert.ok(!tipos.some(x => x.includes('/sem-inspeccao/')), 'sem inspecção é limitação, nunca assunto');
});

test('porta: as seis perguntas, pela ordem, e cada saída', () => {
  const c = { agora: AGORA, nivel: 2, impressoes: 10 };
  const a = (tipo, extra = {}) => ({ tipo, caminho: '/p/', critico: 0, confirmado: 1, evidencia: {}, ...extra });
  const saida = (x, ctx = {}) => aplicarPorta(x, { ...c, ...ctx });

  assert.equal(saida(a('CANONICO_DIFERENTE')).saida, 'AGIR_AGORA');
  assert.equal(saida(a('CANONICO_DIFERENTE')).passos.length, 6);
  assert.equal(saida(a('CANONICO_DIFERENTE', { confirmado: 0 })).saida, 'AGUARDAR', '1: evidência');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { episodio: { em: '2026-09-10T00:00:00Z' } }).saida, 'AGUARDAR', '2: sem rastreio posterior');
  assert.equal(saida(a('BLOQUEADA_NOINDEX', { critico: 1 }), { episodio: { em: '2026-09-10T00:00:00Z' } }).saida, 'AGIR_AGORA', 'grave não espera');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { emObservacao: 'alteração publicada em 2026-09-01' }).saida, 'AGUARDAR', '3: em observação');
  const ret = saida(a('CANONICO_DIFERENTE'), { hipotese: { hipotese: 'É o hreflang' } });
  assert.deepEqual([ret.saida, /hipótese eliminada/.test(ret.razao)], ['NAO_AGIR', true], '4: hipótese eliminada');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { bloqueio: { titulo: 'Manter as duas páginas' } }).saida, 'NAO_AGIR', '4: decisão activa');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { decisao: { decisao: 'IGNORAR', razao: 'intencional' } }).saida, 'NAO_AGIR');
  const adiado = saida(a('CANONICO_DIFERENTE'), { decisao: { decisao: 'ADIAR', adiar_ate: '2026-10-01' } });
  assert.deepEqual([adiado.saida, adiado.revisao], ['AGUARDAR', '2026-10-01']);
  assert.equal(saida(a('CANONICO_DIFERENTE'), { decisao: { decisao: 'ADIAR', adiar_ate: '2026-09-01' } }).saida, 'AGIR_AGORA', 'adiamento vencido já não trava');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { decisao: { decisao: 'PEDIR_EVIDENCIA' } }).saida, 'INVESTIGAR');
  assert.equal(saida(a('CANONICO_DIFERENTE'), { criticoNaPagina: true }).saida, 'AGUARDAR', '5: há um crítico na página');
  assert.equal(saida(a('RASTREADA_NAO_INDEXADA')).saida, 'INVESTIGAR', '6: confiança baixa numa página que não é prioritária');
  assert.equal(saida(a('RASTREADA_NAO_INDEXADA'), { nivel: 1 }).saida, 'AGIR_AGORA', 'página prioritária não indexada');
  assert.equal(saida(a('DESINDEXADA', { critico: 0 }), { nivel: 3, impressoes: 0 }).saida, 'NAO_AGIR', '6: ganho não justifica');
  const redir = saida(a('URL_FORA_DO_SITEMAP', { evidencia: { http: 301, verificado_em: AGORA } }));
  assert.deepEqual([redir.saida, redir.revisao], ['AGUARDAR', '2026-10-11']);
});

test('avaliação de um pacote: nunca antes do rastreio posterior, e nunca atribui causa', () => {
  const p = { publicado_em: '2026-09-01T00:00:00Z', deployment_id: 'd1', ultimo_rastreio: '2026-09-03T00:00:00Z', ultima_inspeccao_em: '2026-09-04T00:00:00Z' };
  assert.equal(avaliarPacote({ ...p, ultimo_rastreio: '2026-08-30T00:00:00Z' }, AGORA), null);
  const m = avaliarPacote({ ...p, resolvido_em: '2026-09-04T00:00:00Z' }, AGORA);
  assert.equal(m.resultado, 'MELHORIA_OBSERVADA');
  assert.match(m.evidencia.razao, /não se atribui causa/);
  assert.equal(avaliarPacote({ ...p, resolvido_em: '2026-09-04T00:00:00Z', alt_deployment_id: 'd2', ultima_alteracao_em: '2026-09-02T00:00:00Z' }, AGORA).resultado,
    'INCONCLUSIVO', 'outra alteração durante a observação');
  assert.equal(avaliarPacote({ ...p, resolvido_em: '2026-08-31T00:00:00Z' }, AGORA).resultado, 'INCONCLUSIVO');
  assert.equal(avaliarPacote(p, '2026-09-10T00:00:00Z'), null, 'ainda dentro da observação');
  assert.equal(avaliarPacote(p, '2026-09-20T00:00:00Z').resultado, 'SEM_EFEITO_CLARO');
  assert.equal(avaliarPacote(p, AGORA, { criticoDepois: true }).resultado, 'PIOROU');
});

test('fila: página que o Google nunca rastreou entra como por pedir, e sai quando é rastreada depois do pedido', () => {
  assert.deepEqual(derivarEstado({ alteracao: null, rastreio: null, inspeccao: '2026-09-12T00:00:00Z' }).estado, 'PENDENTE');
  assert.equal(derivarEstado({ alteracao: null, rastreio: null, inspeccao: '2026-09-12T00:00:00Z', pedido: '2026-09-12T01:00:00Z' }).estado, 'PEDIDO');
  const r = derivarEstado({ alteracao: null, rastreio: '2026-09-13T01:00:00Z', inspeccao: '2026-09-13T02:00:00Z', pedido: '2026-09-12T01:00:00Z' });
  assert.deepEqual([r.estado, r.atraso_horas], ['RASTREADO_DEPOIS_DO_PEDIDO', 24]);
  assert.equal(derivarEstado({ alteracao: null, rastreio: null, inspeccao: null }).estado, null);
});

/* ------------------------------------------------------------ percurso -- */

test('percurso completo: detectar → porta → aprovar → pacote → publicação → rastreio → avaliação', async () => {
  const db = await d1Falsa();
  const s = db.sqlite;
  const paginas = ['/', '/a/', '/b/', '/c/'];
  inspeccionar(db, '/', '2026-09-10T00:00:00Z');
  inspeccionar(db, '/a/', '2026-09-05T00:00:00Z', { veredicto: 'NEUTRAL', canonico_google: ORIGEM + '/b/' });
  inspeccionar(db, '/a/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', canonico_google: ORIGEM + '/b/' });
  inspeccionar(db, '/b/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG' });
  inspeccionar(db, '/c/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', ultimo_rastreio: null });
  s.exec(`INSERT INTO gsc_dias (data, propriedade, cliques, impressoes, completo) VALUES ('2026-09-10', 'sc', 1, 10, 1), ('2026-09-01', 'sc', 1, 10, 1);
    INSERT INTO gsc_conjuntos (data, conjunto, linhas, cliques_visiveis, impressoes_visiveis, json) VALUES
    ('2026-09-10', 'page', 2, 1, 10, '[["https://happysoaring.com/a/",1,8,0.1,5],["https://happysoaring.com/velha/",0,2,0,9]]'),
    ('2026-09-01', 'page', 1, 0, 3, '[["https://happysoaring.com/velha/",0,3,0,9]]')`);
  s.exec("INSERT INTO niveis_pagina (caminho, nivel) VALUES ('/a/', 1)");
  await gravarPagina(db, { caminho: '/a/', nivel: 1, objectivos: ['cursos'] });
  await gravarImportancia(db, { id: 'cursos', importancia: 'ALTA' });

  const site = siteFalso(paginas, { 'https://happysoaring.com/velha/': { status: 404 } });
  const antes = db.cont.consultas;
  const r = await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: AGORA });
  assert.equal(r.motivo, null);
  assert.ok(db.cont.consultas - antes <= ORCAMENTO_ASSUNTOS.consultas, 'consultas: ' + (db.cont.consultas - antes));
  assert.ok(site.log.includes('HEAD https://happysoaring.com/velha/'), 'a URL fora do sitemap é verificada');
  assert.deepEqual(s.prepare('SELECT chave FROM assuntos ORDER BY chave').all().map(x => x.chave), [
    'BLOQUEADA_NOINDEX /b/', 'CANONICO_DIFERENTE /a/', 'NUNCA_RASTREADA /c/', 'URL_FORA_DO_SITEMAP https://happysoaring.com/velha/'
  ]);

  /* uma segunda execução sem observações novas não reescreve nada */
  const escritas = s.prepare('SELECT SUM(visto_em) AS x FROM assuntos').get();
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: '2026-09-13T12:20:00.000Z' });
  assert.equal(s.prepare("SELECT COUNT(*) AS n FROM assuntos WHERE visto_em <> ?").get(AGORA).n, 0);
  assert.ok(escritas);

  const antesFicha = db.cont.consultas;
  await lerAssunto(db, s.prepare('SELECT id FROM assuntos LIMIT 1').get().id, { agora: AGORA });
  assert.ok(db.cont.consultas - antesFicha <= 25, 'consultas da ficha: ' + (db.cont.consultas - antesFicha));
  const antesHoje = db.cont.consultas;
  const hoje = await lerHoje(db, { agora: AGORA, desde: '2026-09-13T00:00:00.000Z' });
  assert.ok(db.cont.consultas - antesHoje <= 40, 'consultas do «Hoje»: ' + (db.cont.consultas - antesHoje));
  assert.deepEqual(hoje.bloco1.criticos.map(x => x.caminho), ['/b/'], 'só o crítico no bloco 1');
  assert.equal(hoje.bloco3.accoes.length, 0, 'acabado de detectar: primeiro decide o módulo');
  const maisTarde = await lerHoje(db, { agora: '2026-09-13T14:00:00.000Z' });
  assert.deepEqual(maisTarde.bloco3.accoes.map(x => x.caminho), ['/b/', '/a/', '/velha/'], 'sem decisão há mais de uma hora: precisa do Paulo, crítico primeiro');
  assert.deepEqual(maisTarde.bloco3.accoes[1].objectivos, ['Cursos e formação'], 'cada linha mostra o objectivo');
  assert.equal(hoje.bloco2.assuntos_novos.length, 4);
  assert.ok(hoje.bloco6.ainda_nao_verificado.length > 0, 'o que não se verifica diz-se às claras');
  assert.ok(hoje.bloco6.limitacoes.every(l => typeof l === 'string'));

  /* abrir o assunto crítico e aprovar */
  const idB = s.prepare("SELECT id FROM assuntos WHERE chave = 'BLOQUEADA_NOINDEX /b/'").get().id;
  const ficha = await lerAssunto(db, idB, { agora: AGORA });
  for (const k of ['diagnostico', 'solucao', 'nao_fazer', 'riscos', 'medicao', 'confianca', 'esforco']) assert.ok(k in ficha.ficha, k);
  assert.match(ficha.ficha.diagnostico, /^Hipótese/);
  assert.equal(ficha.porta.saida, 'AGIR_AGORA');
  assert.equal((await decidirAssunto(db, idB, { decisao: 'IGNORAR' }, { agora: AGORA })).estado, 400, 'ignorar exige razão');
  assert.equal((await decidirAssunto(db, idB, { decisao: 'ADIAR', adiar_ate: '2026-09-01' }, { agora: AGORA })).estado, 400, 'adiar para o passado');
  const idC = s.prepare("SELECT id FROM assuntos WHERE chave = 'NUNCA_RASTREADA /c/'").get().id;
  assert.equal((await decidirAssunto(db, idC, { decisao: 'APROVAR' }, { agora: AGORA })).estado, 400, 'operacional não se aprova');

  await gravarConhecimento(db, 'factos_negocio', { afirmacao: 'A Happy Soaring é dealer oficial Flow.', estado: 'VERIFICADO', fonte: 'contrato', data_fonte: '2026-01-01' }, { agora: AGORA });
  await gravarConhecimento(db, 'factos_negocio', { afirmacao: 'Centro técnico oficial', estado: 'PROIBIDO' }, { agora: AGORA });
  const ap = await decidirAssunto(db, idB, { decisao: 'APROVAR', nota: 'o noindex veio de um teste' }, { agora: AGORA });
  assert.equal(ap.estado, 200);
  assert.equal((await lerAssunto(db, idB, { agora: AGORA })).estado, 'DECIDIDO');
  const pacote = JSON.parse(s.prepare('SELECT conteudo FROM pacotes_trabalho').get().conteudo);
  assert.equal(pacote.pagina, 'https://happysoaring.com/b/');
  assert.deepEqual(pacote.respeitar.afirmacoes_proibidas, ['Centro técnico oficial']);
  assert.deepEqual(pacote.respeitar.factos_verificados, ['A Happy Soaring é dealer oficial Flow.']);
  assert.ok(pacote.nao_tocar.length && pacote.o_que_alterar && pacote.medicao);
  assert.equal((await decidirAssunto(db, idB, { decisao: 'APROVAR' }, { agora: AGORA })).estado, 409, 'não se aprova duas vezes');
  const hoje2 = await lerHoje(db, { agora: AGORA });
  assert.deepEqual(hoje2.bloco4.trabalho_claude.map(x => [x.grupo, x.paginas]), [['BLOQUEADA_NOINDEX', 1]], 'aprovado passa a trabalho do Claude');
  assert.ok(!hoje2.bloco3.accoes.some(x => x.caminho === '/b/'), 'aprovado sai do que precisa do Paulo');

  /* o Claude implementa; a publicação é observada e liga-se ao pacote */
  s.exec(`INSERT INTO deployments (id, url, criado_em_cf, processamento) VALUES ('d0', 'x', '2026-09-01T00:00:00Z', 'PROCESSADO'),
    ('d1', 'x', '2026-09-14T10:00:00Z', 'PROCESSADO');
    UPDATE deployments SET anterior_id = 'd0' WHERE id = 'd1';
    INSERT INTO deployment_paginas (deployment_id, caminho, estado, resumo_conteudo) VALUES ('d0', '/b/', 'LIDA', 'x1'), ('d1', '/b/', 'LIDA', 'x2')`);
  await db.batch([db.prepare(SQL_ALTERACOES_DE_UMA_PUBLICACAO).bind('d1'), db.prepare(SQL_PACOTES_DE_UMA_PUBLICACAO).bind('d1')]);
  assert.equal(s.prepare('SELECT deployment_id FROM pacotes_trabalho').get().deployment_id, 'd1');
  assert.equal((await lerAssunto(db, idB, { agora: '2026-09-14T12:00:00Z' })).estado, 'PUBLICADO');

  /* o Google rastreia depois da publicação e a inspecção já não mostra o noindex */
  inspeccionar(db, '/b/', '2026-09-16T00:00:00Z', { ultimo_rastreio: '2026-09-15T08:00:00Z' });
  assert.equal((await lerAssunto(db, idB, { agora: '2026-09-15T12:00:00Z' })).estado, 'EM_OBSERVACAO');
  const r3 = await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: '2026-09-16T01:00:00.000Z' });
  assert.equal(r3.avaliados, 1);
  const depois = await lerAssunto(db, idB, { agora: '2026-09-16T02:00:00.000Z' });
  assert.deepEqual([depois.estado, depois.avaliacao.resultado], ['AVALIADO', 'MELHORIA_OBSERVADA']);
  const hoje3 = await lerHoje(db, { agora: '2026-09-16T02:00:00.000Z', desde: '2026-09-15T00:00:00.000Z' });
  assert.deepEqual(hoje3.bloco5.resultados.map(x => [x.caminho, x.resultado]), [['/b/', 'MELHORIA_OBSERVADA']]);
  assert.deepEqual(hoje3.bloco1.criticos, []);

  /* regressão: o problema volta */
  inspeccionar(db, '/b/', '2026-09-20T00:00:00Z', { veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG', ultimo_rastreio: '2026-09-19T00:00:00Z' });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: site, agora: '2026-09-20T01:00:00.000Z' });
  const reg = await lerAssunto(db, idB, { agora: '2026-09-20T02:00:00.000Z' });
  assert.deepEqual([reg.estado, reg.regressoes, reg.resolvido_em], ['REGRESSAO', 1, null]);
  assert.equal(reg.porta.saida, 'AGIR_AGORA', 'a aprovação anterior não conta para o regresso');
});

test('decisões activas e hipóteses eliminadas: a recomendação não volta; o conhecimento guarda todas as versões', async () => {
  const db = await d1Falsa();
  inspeccionar(db, '/a/', '2026-09-05T00:00:00Z', { veredicto: 'NEUTRAL', canonico_google: ORIGEM + '/en/a/' });
  inspeccionar(db, '/a/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', canonico_google: ORIGEM + '/en/a/' });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: siteFalso(['/a/']), agora: AGORA });
  const id = db.sqlite.prepare('SELECT id FROM assuntos').get().id;
  assert.equal((await lerAssunto(db, id, { agora: AGORA })).estado, 'PROPOSTO');

  assert.equal((await gravarConhecimento(db, 'decisoes_activas', { titulo: 'x', tipo: 'COMERCIAL', decidida_em: '2026-09-01' })).estado, 400, 'razão obrigatória');
  assert.equal((await gravarConhecimento(db, 'factos_negocio', { afirmacao: 'x', estado: 'VERIFICADO' })).estado, 400, 'verificado sem fonte');
  assert.equal((await gravarConhecimento(db, 'hipoteses_eliminadas', { hipotese: 'x', eliminada_em: '2026-09-01' })).estado, 400, 'sem evidência');

  const g = await gravarConhecimento(db, 'decisoes_activas', { titulo: 'As versões EN são as principais', tipo: 'ESTRATEGICA',
    razao: 'mercado internacional', decidida_em: '2026-09-01', bloqueia_tipo: 'CANONICO_DIFERENTE', bloqueia_caminho: '/a/' }, { agora: AGORA });
  assert.equal(g.estado, 200);
  const bloq = await lerAssunto(db, id, { agora: AGORA });
  assert.deepEqual([bloq.estado, bloq.porta.saida], ['BLOQUEADO', 'NAO_AGIR']);
  assert.equal((await lerHoje(db, { agora: AGORA })).bloco3.accoes.length, 0, 'bloqueada não é repetida');

  const dec = (await lerConhecimento(db)).decisoes_activas[0];
  assert.equal((await gravarConhecimento(db, 'decisoes_activas', { ...dec, versao: 99 })).estado, 409, 'edição sobre versão antiga');
  assert.equal((await gravarConhecimento(db, 'decisoes_activas', { ...dec, estado: 'REVOGADA' }, { agora: AGORA })).estado, 200);
  const versoes = await historicoConhecimento(db, 'decisoes_activas', dec.id);
  assert.deepEqual(versoes.map(v => [v.versao, v.dados.estado]), [[2, 'REVOGADA'], [1, 'ACTIVA']]);
  assert.equal((await lerAssunto(db, id, { agora: AGORA })).estado, 'PROPOSTO', 'revogada deixa de bloquear');

  await gravarConhecimento(db, 'hipoteses_eliminadas', { hipotese: 'O canónico está mal declarado', evidencia: 'verificado no HTML de 2026-09-10',
    eliminada_em: '2026-09-10', tipo_assunto: 'CANONICO_DIFERENTE', caminho: '/a/' }, { agora: AGORA });
  assert.equal((await lerAssunto(db, id, { agora: AGORA })).estado, 'RETIRADO');
});

test('contactos: sem dados pessoais, só origem, país e o que procurava', async () => {
  const db = await d1Falsa();
  const colunas = db.sqlite.prepare('PRAGMA table_info(contactos)').all().map(c => c.name);
  assert.deepEqual(colunas, ['id', 'recebido_em', 'como_encontrou', 'pais', 'objectivo_id', 'registado_em']);
  assert.equal((await registarContacto(db, { recebido_em: '2026-09-12', como_encontrou: 'PESQUISA_GOOGLE', pais: 'de', objectivo_id: 'parakite' }, { agora: AGORA })).estado, 200);
  assert.equal((await registarContacto(db, { recebido_em: '2026-09-12', como_encontrou: 'INVENTADO' }, { agora: AGORA })).estado, 400);
  assert.equal((await registarContacto(db, { recebido_em: '2026-09-12', como_encontrou: 'OUTRO', pais: 'Alemanha' }, { agora: AGORA })).estado, 400);
  assert.equal((await registarContacto(db, { recebido_em: '2026-12-01', como_encontrou: 'OUTRO' }, { agora: AGORA })).estado, 400, 'data futura');
  assert.equal(db.sqlite.prepare('SELECT pais FROM contactos').get().pais, 'DE');
});

test('configuração: nível e objectivos de uma página; importância do objectivo', async () => {
  const db = await d1Falsa();
  assert.equal((await gravarPagina(db, { caminho: '/a/', nivel: 4 })).estado, 400);
  assert.equal((await gravarPagina(db, { caminho: '/a/', nivel: 1, objectivos: ['inexistente'] })).estado, 400);
  assert.equal((await gravarPagina(db, { caminho: '/a/', nivel: 1, objectivos: ['voos', 'cursos'] })).estado, 200);
  assert.equal((await gravarPagina(db, { caminho: '/a/', nivel: null, objectivos: ['voos'] })).estado, 200);
  const cfg = await lerConfiguracao(db);
  assert.deepEqual(cfg.paginas, [{ caminho: '/a/', nivel: null, objectivos: ['voos'] }]);
  assert.equal((await gravarImportancia(db, { id: 'voos', importancia: 'URGENTE' })).estado, 400);
  assert.equal((await gravarImportancia(db, { id: 'voos', importancia: '' })).estado, 200, 'volta a «por definir»');
});

test('sem sitemap de produção: nada é dado como resolvido', async () => {
  const db = await d1Falsa();
  inspeccionar(db, '/b/', '2026-09-12T00:00:00Z', { veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG' });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: siteFalso(['/b/']), agora: AGORA });
  const falha = async () => new Response('erro', { status: 500 });
  const r = await executarCicloAssuntos({ DB: db }, { fetchImpl: falha, agora: '2026-09-13T13:00:00Z' });
  assert.equal(r.motivo, 'SEM_SITEMAP_PRODUCAO');
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assuntos WHERE resolvido_em IS NULL').get().n, 1);
});

test('todos os tipos de assunto têm as partes da ficha', () => {
  for (const [id, def] of Object.entries(TIPOS)) {
    for (const k of ['titulo', 'categoria', 'acao', 'esforco', 'confianca', 'diagnostico', 'solucao', 'nao_fazer', 'riscos', 'medicao']) assert.ok(k in def, id + '.' + k);
    assert.ok(['ALTA', 'MEDIA', 'BAIXA'].includes(def.confianca[0]) && def.confianca[1], id);
    assert.ok(['BAIXO', 'MEDIO', 'ALTO'].includes(def.esforco), id);
    assert.equal(typeof def.diagnostico({}), 'string');
  }
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

test('API: «Hoje», assuntos, conhecimento, contactos e configuração atrás do Access; todas as escritas protegidas', async () => {
  const db = await d1Falsa();
  inspeccionar(db, '/b/', new Date(Date.now() - 864e5).toISOString(), { veredicto: 'NEUTRAL', estado_indexacao: 'BLOCKED_BY_META_TAG' });
  await executarCicloAssuntos({ DB: db }, { fetchImpl: siteFalso(['/b/']) });
  const id = db.sqlite.prepare('SELECT id FROM assuntos').get().id;
  const { token, chave } = await tokenValido();
  const original = globalThis.fetch;
  globalThis.fetch = async u => String(u) === EQUIPA + '/cdn-cgi/access/certs'
    ? new Response(JSON.stringify({ keys: [chave] })) : new Response('rede proibida', { status: 599 });
  limparCacheChaves();
  try {
    const env = { DB: db, ACCESS_TEAM_DOMAIN: 'equipa-teste.cloudflareaccess.com', ACCESS_AUD: AUD,
      EMAILS_AUTORIZADOS: 'paulo.pereira@happysoaring.com', ASSETS: { fetch: async () => new Response('ui') } };
    const B = 'https://happysoaring.com/inteligencia/api';
    const ler = c => worker.fetch(new Request(B + c, { headers: { 'Cf-Access-Jwt-Assertion': token } }), env);
    const escrever = (c, corpo, cab = {}) => worker.fetch(new Request(B + c, { method: 'POST', body: JSON.stringify(corpo),
      headers: { 'Cf-Access-Jwt-Assertion': token, 'content-type': 'application/json', 'x-hs-inteligencia': '1', ...cab } }), env);

    for (const c of ['/hoje', '/assuntos/' + id, '/conhecimento', '/contactos', '/configuracao']) {
      assert.equal((await worker.fetch(new Request(B + c), env)).status, 403, 'sem Access: ' + c);
      assert.equal((await ler(c)).status, 200, c);
    }
    assert.equal((await ler('/assuntos/999999')).status, 404);
    assert.equal((await ler('/hoje?desde=lixo')).status, 200);

    const escritas = [
      ['/assuntos/' + id + '/decisao', { decisao: 'ADIAR', adiar_ate: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) }],
      ['/conhecimento/factos_negocio', { afirmacao: 'x', estado: 'POR_CONFIRMAR' }],
      ['/contactos', { recebido_em: new Date().toISOString().slice(0, 10), como_encontrou: 'NAO_SABE' }],
      ['/configuracao/objectivo', { id: 'voos', importancia: 'MEDIA' }],
      ['/configuracao/pagina', { caminho: '/b/', nivel: 2, objectivos: [] }]
    ];
    for (const [c, corpo] of escritas) {
      assert.equal((await escrever(c, corpo, { 'x-hs-inteligencia': '' })).status, 403, 'sem cabeçalho: ' + c);
      assert.equal((await escrever(c, corpo, { origin: 'https://outro.example' })).status, 403, 'outra origem: ' + c);
      assert.equal((await escrever(c, corpo, { 'content-type': 'text/plain' })).status, 403, 'formulário simples: ' + c);
    }
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM assunto_decisoes').get().n + db.sqlite.prepare('SELECT COUNT(*) AS n FROM factos_negocio').get().n +
      db.sqlite.prepare('SELECT COUNT(*) AS n FROM contactos').get().n, 0, 'nada recusado foi gravado');
    for (const [c, corpo] of escritas) assert.equal((await escrever(c, corpo)).status, 200, c);
    assert.equal((await escrever('/conhecimento/outra_tabela', {})).status, 404);
    assert.equal((await escrever('/assuntos/' + id + '/decisao', { decisao: 'APAGAR' })).status, 400);
    const r = await ler('/assuntos/' + id);
    assert.equal((await r.json()).porta.saida, 'AGUARDAR');
  } finally {
    globalThis.fetch = original;
  }
});
