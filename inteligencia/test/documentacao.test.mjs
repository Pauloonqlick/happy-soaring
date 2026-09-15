/* A documentação do Google vigiada, as fontes das lições e as definições oficiais. Sem rede. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerFeed, paginaDoc, licoesTocadas, executarDocumentacao, lerDocumentacao, FEED_DOCUMENTACAO } from '../src/documentacao.js';
import { gravarLicao, lerFaltaAprender, lerAprendizagem } from '../src/aprendizagem.js';
import { definicaoDaCobertura } from '../src/definicoes-google.js';
import { trabalhoDe } from '../src/registo.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACOES = fs.readdirSync(path.join(MODULO, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  .map(f => path.join(MODULO, 'migrations', f));

async function d1Falsa() {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  for (const f of MIGRACOES) db.exec(fs.readFileSync(f, 'utf8'));
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => { const r = db.prepare(sql).get(...params); return r ? { ...r } : null; },
    all: async () => ({ results: db.prepare(sql).all(...params).map(r => ({ ...r })) }),
    run: async () => { db.prepare(sql).run(...params); return { meta: {} }; },
    executar: () => db.prepare(sql).run(...params)
  });
  return {
    prepare: sql => stmt(sql),
    batch: async st => { db.exec('BEGIN'); try { st.forEach(x => x.executar()); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; },
    sqlite: db
  };
}

const item = (guid, titulo, data, href) => `<item>
  <title>${titulo}</title>
  <link>https://developers.google.com/search/updates#x</link>
  <description>&lt;p&gt;&lt;b&gt;What&lt;/b&gt;: Updated the &lt;a href=&quot;${href}&quot;&gt;page&lt;/a&gt;.&lt;/p&gt;&lt;p&gt;&lt;b&gt;Why&lt;/b&gt;: Google&#39;s reasons.&lt;/p&gt;</description>
  <pubDate>${data}</pubDate>
  <guid isPermaLink="false">${guid}</guid>
</item>`;
const feed = itens => `<?xml version="1.0"?><rss version="2.0"><channel><title>Updates</title>${itens.join('')}</channel></rss>`;
const servir = xml => async url => { assert.equal(url, FEED_DOCUMENTACAO); return new Response(xml, { status: 200 }); };

const LICAO = {
  chave: 'dados-estruturados/product-sem-preco', tipo_assunto: 'DADOS_ESTRUTURADOS_INVALIDOS', categoria: 'Dados estruturados',
  titulo: 'Produto sem preço marcado como Product', padrao: 'offers', prioridade: 10,
  sintoma: 'Erro offers.', causa: 'Product sem preço.', correccao: 'Retirar o Product.', prevencao: 'Só Product com preço visível.'
};
const FONTE_PRODUTO = { titulo: 'Fragmento de produto', url: 'https://developers.google.com/search/docs/appearance/structured-data/product-snippet' };

test('o feed: entradas com título, data, resumo sem HTML e páginas citadas; entidades descodificadas', () => {
  const e = lerFeed(feed([
    item('2026-09-08-a', 'Updated the favicon documentation', 'Tue, 08 Sep 2026 00:00:00 +0000', 'https://developers.google.com/search/docs/appearance/favicon-in-search'),
    item('2026-06-15-b', 'Removing FAQ', 'Mon, 15 Jun 2026 00:00:00 +0000', '/search/docs/appearance/structured-data/faqpage?hl=en#x'),
    '<item><title>sem data</title><guid>c</guid></item>'
  ]));
  assert.equal(e.length, 2, 'a entrada sem data fica de fora');
  assert.equal(e[0].publicada_em, '2026-09-08T00:00:00.000Z');
  assert.match(e[0].resumo, /What: Updated the page\. Why: Google's reasons\./);
  assert.doesNotMatch(e[0].resumo, /<|&lt;/);
  assert.deepEqual(e[1].ligacoes, ['https://developers.google.com/search/docs/appearance/structured-data/faqpage?hl=en'], 'endereço relativo fica absoluto e perde a âncora');
  assert.equal(paginaDoc('https://developers.google.com/search/docs/appearance/video/?hl=pt-br#watch-page'), 'developers.google.com/search/docs/appearance/video');
});

test('uma mudança toca na lição quando cita a página da fonte, ou uma página dentro dela — mas uma página geral não arrasta tudo', () => {
  const licoes = [{ chave: 'p', fontes: JSON.stringify([FONTE_PRODUTO]) }, { chave: 'sem-fontes', fontes: null }, { chave: 'lixo', fontes: 'x' }];
  const toca = href => licoesTocadas({ ligacoes: [href] }, licoes);
  assert.deepEqual(toca('https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=en'), ['p']);
  assert.deepEqual(toca('https://developers.google.com/search/docs/appearance/structured-data/product-snippet/detalhe'), ['p']);
  assert.deepEqual(toca('https://developers.google.com/search/docs/appearance/structured-data'), ['p'], 'a secção dos dados estruturados muda: rever');
  assert.deepEqual(toca('https://developers.google.com/search/docs'), [], 'a raiz da documentação não toca em nada');
  assert.deepEqual(toca('https://developers.google.com/search/docs/appearance/structured-data/product-variants'), [], 'outra página com nome parecido não toca');
});

test('a leitura semanal: a primeira marca o que já existia; depois só de 7 em 7 dias; a mudança que toca numa lição fica por rever até se registar', async () => {
  const db = await d1Falsa();
  const env = { DB: db };
  const r0 = await gravarLicao(db, { ...LICAO, fontes: [FONTE_PRODUTO] }, { agora: '2026-09-15T08:00:00.000Z', origem: 'CLAUDE' });
  assert.equal(r0.estado, 200);

  const antigo = item('2026-05-08-faq', 'Clarified Product snippet', 'Fri, 08 May 2026 00:00:00 +0000', FONTE_PRODUTO.url);
  const r1 = await executarDocumentacao(env, { agora: '2026-09-15T09:08:00.000Z', buscar: servir(feed([antigo])) });
  assert.deepEqual({ lida: r1.lida, primeira: r1.primeira, novas: r1.novas, por_rever: r1.por_rever }, { lida: true, primeira: true, novas: 1, por_rever: 0 });
  assert.equal((await lerFaltaAprender(db, { agora: '2026-09-15T10:00:00.000Z' })).filter(x => x.estado === 'REVER_LICAO').length, 0,
    'o que já existia antes da vigilância não fica por rever');

  let chamadas = 0;
  const r2 = await executarDocumentacao(env, { agora: '2026-09-21T09:08:00.000Z', buscar: async () => { chamadas++; return new Response(''); } });
  assert.equal(r2.lida, false);
  assert.equal(chamadas, 0, 'antes de 7 dias não vai à rede');

  const novo = item('2026-09-20-produto', 'Updated Product snippet requirements', 'Sun, 20 Sep 2026 00:00:00 +0000', FONTE_PRODUTO.url + '?hl=en');
  const favicon = item('2026-09-19-favicon', 'Updated favicon', 'Sat, 19 Sep 2026 00:00:00 +0000', 'https://developers.google.com/search/docs/appearance/favicon-in-search');
  const r3 = await executarDocumentacao(env, { agora: '2026-09-22T09:08:00.000Z', buscar: servir(feed([novo, favicon, antigo])) });
  assert.deepEqual({ lida: r3.lida, primeira: r3.primeira, novas: r3.novas, por_rever: r3.por_rever }, { lida: true, primeira: false, novas: 2, por_rever: 1 });
  assert.match(trabalhoDe('avisos', { documentacao: r3 }).texto, /2 mudanças novas na documentação do Google · 1 lição a rever/);

  let falta = await lerFaltaAprender(db, { agora: '2026-09-22T10:00:00.000Z' });
  const rever = falta.filter(x => x.estado === 'REVER_LICAO');
  assert.equal(rever.length, 1);
  assert.equal(rever[0].referencia, 'documentacao:2026-09-20-produto');
  assert.match(rever[0].detalhe, /Updated Product snippet requirements — toca em: «Produto sem preço marcado como Product»/);

  const d = await lerDocumentacao(db);
  assert.equal(d.lida_em, '2026-09-22T09:08:00.000Z');
  assert.deepEqual(d.entradas.map(e => [e.guid, e.estado]), [
    ['2026-09-20-produto', 'POR_REVER'], ['2026-09-19-favicon', 'SEM_LICOES'], ['2026-05-08-faq', 'REVISTA']]);

  /* o que o registar.mjs rever faz */
  db.sqlite.prepare("UPDATE documentacao_google SET revista_em = ?, revisao = ?, revista_por = 'CLAUDE' WHERE guid = ? AND revista_em IS NULL")
    .run('2026-09-22T11:00:00.000Z', 'Lida: os requisitos não mudaram para páginas sem preço.', '2026-09-20-produto');
  falta = await lerFaltaAprender(db, { agora: '2026-09-22T12:00:00.000Z' });
  assert.equal(falta.filter(x => x.estado === 'REVER_LICAO').length, 0);

  /* uma leitura falhada não conta como feita */
  await assert.rejects(executarDocumentacao(env, { agora: '2026-09-30T09:08:00.000Z', buscar: async () => new Response('', { status: 503 }) }), /HTTP 503/);
  assert.equal((await lerDocumentacao(db)).lida_em, '2026-09-22T09:08:00.000Z');
});

test('fontes das lições: validadas, guardadas, mantidas quando se actualiza sem elas; lição de SEO sem fonte fica em «o que falta aprender»', async () => {
  const db = await d1Falsa();
  const agora = '2026-09-15T08:00:00.000Z';
  assert.equal((await gravarLicao(db, { ...LICAO, fontes: [{ titulo: 'x', url: 'http://inseguro.com/a' }] }, { agora })).estado, 400);
  assert.equal((await gravarLicao(db, { ...LICAO, fontes: [{ titulo: '', url: FONTE_PRODUTO.url }] }, { agora })).estado, 400);

  await gravarLicao(db, { ...LICAO }, { agora });
  let falta = await lerFaltaAprender(db, { agora });
  assert.deepEqual(falta.filter(x => x.estado === 'SEM_FONTE').map(x => x.referencia), ['licao:' + LICAO.chave]);

  await gravarLicao(db, { ...LICAO, fontes: [FONTE_PRODUTO] }, { agora });
  await gravarLicao(db, { ...LICAO, sintoma: 'Erro offers, outra vez.' }, { agora });
  const l = db.sqlite.prepare('SELECT fontes, versao FROM licoes WHERE chave = ?').get(LICAO.chave);
  assert.deepEqual(JSON.parse(l.fontes), [FONTE_PRODUTO], 'actualizar sem fontes não apaga as que havia');
  assert.equal(l.versao, 3);
  falta = await lerFaltaAprender(db, { agora });
  assert.equal(falta.filter(x => x.estado === 'SEM_FONTE').length, 0);

  const ap = await lerAprendizagem(db, { agora });
  assert.match(ap.manual, /\*\*Fonte oficial:\*\* Fragmento de produto \(https:\/\/developers\.google\.com\/search\/docs\/appearance\/structured-data\/product-snippet\)/);
  assert.ok(ap.documentacao && Array.isArray(ap.documentacao.entradas));
  const hist = db.sqlite.prepare('SELECT dados FROM licoes_historico WHERE chave = ? ORDER BY versao DESC LIMIT 1').get(LICAO.chave);
  assert.deepEqual(JSON.parse(JSON.parse(hist.dados).fontes), [FONTE_PRODUTO], 'o histórico guarda as fontes');

  /* a lição de processo do limite de processamento já traz fonte na migração 0015 */
  const proc = db.sqlite.prepare("SELECT fontes, versao FROM licoes WHERE chave = 'operacao/limite-processamento-tarefas-agendadas'").get();
  assert.match(proc.fontes, /developers\.cloudflare\.com\/workers\/platform\/limits/);
  assert.equal(proc.versao, 2);
});

test('os estados do Google explicam-se com a definição oficial', () => {
  for (const [cobertura, estado, fonte] of [
    ['Detetada – atualmente não indexada', 'Detetada – atualmente não indexada', /7440203/],
    ['Rastreada – atualmente não indexada', 'Rastreada – atualmente não indexada', /7440203/],
    ['A Google não reconhece o URL', 'A Google não reconhece o URL', /9012289/],
    ['Enviada e indexada', 'Enviada e indexada', /7440203/],
    ['Página com redirecionamento', 'Página com redirecionamento', /7440203/]
  ]) {
    const d = definicaoDaCobertura(cobertura);
    assert.equal(d.estado, estado, cobertura);
    assert.match(d.fonte, fonte);
  }
  assert.match(definicaoDaCobertura('Detetada – atualmente não indexada').definicao, /não sobrecarregar o site/);
  assert.equal(definicaoDaCobertura(null), null);
  assert.equal(definicaoDaCobertura('Estado que ainda não existe'), null);
});
