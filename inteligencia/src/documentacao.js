/* A DOCUMENTAÇÃO OFICIAL DO GOOGLE, VIGIADA (15/09/2026)

   As lições do módulo apoiam-se em páginas da documentação da Pesquisa Google (campo
   `fontes` de cada lição). Quando o Google muda uma dessas páginas, a lição pode ficar
   errada de um dia para o outro — como aconteceu ao resultado rico das FAQ, retirado em
   Maio de 2026.

   Uma vez por semana, na execução dos avisos, o módulo lê o feed oficial das
   actualizações da documentação. Cada entrada nova fica guardada; se citar uma página
   que uma lição usa como fonte, fica «por rever» em «O que falta aprender» até alguém
   registar o que fez (scripts/registar.mjs rever). Na primeira leitura, as entradas que
   já existiam ficam marcadas como anteriores: as fontes das lições foram lidas depois
   delas.

   Uma leitura falhada não conta como feita: tenta-se outra vez na hora seguinte. */

export const FEED_DOCUMENTACAO = 'https://developers.google.com/search/updates/search_docs_updates.rss';
export const PAGINA_ACTUALIZACOES = 'https://developers.google.com/search/updates';
export const DIAS_ENTRE_LEITURAS = 7;
const DIA = 864e5;
const META = 'documentacao_lida_em';

const ENTIDADES = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&amp;': '&' };
const descodificar = s => String(s || '')
  .replace(/&(lt|gt|quot|#39|apos|amp);/g, m => ENTIDADES[m])
  .replace(/&#(\d{1,6});/g, (_, n) => String.fromCodePoint(Number(n)));
/* as etiquetas de texto (b, a, code…) somem sem espaço; as de bloco (p, li…) separam */
const semEtiquetas = s => String(s || '')
  .replace(/<\/?(?:a|b|i|em|strong|code|span)(?:\s[^>]*)?>/gi, '')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* anfitrião + caminho, sem barra final, consulta nem âncora: a forma de comparar páginas */
export function paginaDoc(url) {
  try {
    const u = new URL(url, 'https://developers.google.com');
    return (u.hostname + u.pathname).replace(/\/+$/, '').toLowerCase();
  } catch (e) { return null; }
}

/* O feed RSS em entradas. Puro. */
export function lerFeed(xml) {
  return [...String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const campo = n => {
      const r = m[1].match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>'));
      return r ? r[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '') : '';
    };
    const descricao = descodificar(campo('description'));
    const ligacoes = [...new Set([...descricao.matchAll(/href="([^"]+)"/g)]
      .map(x => x[1]).filter(h => !h.startsWith('#'))
      .map(h => { try { const u = new URL(h, 'https://developers.google.com'); u.hash = ''; return u.href; } catch (e) { return null; } })
      .filter(Boolean))];
    const data = Date.parse(campo('pubDate'));
    return {
      guid: semEtiquetas(descodificar(campo('guid'))).slice(0, 300),
      titulo: semEtiquetas(descodificar(campo('title'))).slice(0, 300),
      publicada_em: Number.isNaN(data) ? null : new Date(data).toISOString(),
      resumo: semEtiquetas(descricao).slice(0, 1200),
      ligacoes: ligacoes.slice(0, 20)
    };
  }).filter(e => e.guid && e.titulo && e.publicada_em);
}

export const fontesDe = l => {
  try {
    const f = l && l.fontes ? JSON.parse(l.fontes) : [];
    return Array.isArray(f) ? f.filter(x => x && typeof x.url === 'string') : [];
  } catch (e) { return []; }
};

/* As lições cujas fontes uma entrada toca. A mesma página, ou uma dentro da outra — mas
   uma página muito geral (/search/docs) não arrasta todas as lições atrás de si. Puro. */
export function licoesTocadas(entrada, licoes) {
  const citadas = entrada.ligacoes.map(paginaDoc).filter(Boolean);
  const funda = p => p.split('/').length >= 4;       /* anfitrião + pelo menos 3 segmentos */
  return licoes.filter(l => fontesDe(l).some(f => {
    const fonte = paginaDoc(f.url);
    return fonte && citadas.some(c => c === fonte || (funda(c) && fonte.startsWith(c + '/')) || c.startsWith(fonte + '/'));
  })).map(l => l.chave);
}

export async function executarDocumentacao(env, { agora = new Date().toISOString(), buscar = fetch } = {}) {
  const db = env.DB;
  const meta = await db.prepare('SELECT valor FROM esquema_meta WHERE chave = ?').bind(META).first();
  if (meta && Date.parse(agora) - Date.parse(meta.valor) < DIAS_ENTRE_LEITURAS * DIA) {
    return { lida: false, proxima: new Date(Date.parse(meta.valor) + DIAS_ENTRE_LEITURAS * DIA).toISOString() };
  }
  const opcoes = { headers: { 'user-agent': 'hs-inteligencia (+https://happysoaring.com)' } };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) opcoes.signal = AbortSignal.timeout(15000);
  const r = await buscar(FEED_DOCUMENTACAO, opcoes);
  if (!r.ok) throw new Error('documentação do Google: HTTP ' + r.status);
  const entradas = lerFeed(await r.text());
  if (!entradas.length) throw new Error('documentação do Google: o feed veio sem entradas');

  const [{ results: conhecidas }, { results: licoes }] = await Promise.all([
    db.prepare('SELECT guid FROM documentacao_google').all(),
    db.prepare('SELECT chave, fontes FROM licoes WHERE fontes IS NOT NULL').all()
  ]);
  const ja = new Set(conhecidas.map(x => x.guid));
  const primeira = !meta;
  const novas = entradas.filter(e => !ja.has(e.guid)).map(e => ({ ...e, licoes: licoesTocadas(e, licoes) }));
  const stmts = novas.map(e => db.prepare(`INSERT OR IGNORE INTO documentacao_google
      (guid, titulo, publicada_em, resumo, ligacoes, licoes, visto_em, revista_em, revisao, revista_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(e.guid, e.titulo, e.publicada_em, e.resumo, JSON.stringify(e.ligacoes), JSON.stringify(e.licoes), agora,
      primeira ? agora : null,
      primeira ? 'Anterior ao início da vigilância: as fontes das lições foram lidas depois desta entrada (15/09/2026).' : null,
      primeira ? 'MODULO' : null));
  stmts.push(db.prepare('INSERT INTO esquema_meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor').bind(META, agora));
  await db.batch(stmts);
  return { lida: true, primeira, entradas: entradas.length, novas: novas.length, por_rever: primeira ? 0 : novas.filter(e => e.licoes.length).length };
}

/* Para a página «Aprendizagem»: as entradas mais recentes e o estado de cada uma. */
export async function lerDocumentacao(db, { limite = 15 } = {}) {
  const [meta, { results }] = await Promise.all([
    db.prepare('SELECT valor FROM esquema_meta WHERE chave = ?').bind(META).first(),
    db.prepare('SELECT * FROM documentacao_google ORDER BY publicada_em DESC, guid LIMIT ?').bind(limite).all()
  ]);
  const lista = v => { try { const x = JSON.parse(v || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; } };
  return {
    lida_em: meta ? meta.valor : null,
    proxima: meta ? new Date(Date.parse(meta.valor) + DIAS_ENTRE_LEITURAS * DIA).toISOString() : null,
    pagina: PAGINA_ACTUALIZACOES,
    entradas: results.map(e => ({
      guid: e.guid, titulo: e.titulo, publicada_em: e.publicada_em, resumo: e.resumo, ligacoes: lista(e.ligacoes), licoes: lista(e.licoes),
      estado: e.revista_em ? 'REVISTA' : lista(e.licoes).length ? 'POR_REVER' : 'SEM_LICOES',
      revista_em: e.revista_em, revisao: e.revisao, revista_por: e.revista_por
    }))
  };
}
