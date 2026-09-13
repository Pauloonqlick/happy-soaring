/* INSPECÇÃO DE URL, RASTREIOS, EPISÓDIOS E FILA DE INDEXAÇÃO

   A pergunta: «houve um rastreio do Google posterior à última alteração?»
   Um rastreio posterior confirma que o Google voltou à página. NÃO confirma
   que a nova versão já tenha sido processada ou indexada.

   Quota da inspecção: 2 000 por dia por propriedade, PARTILHADA com a app
   antiga, os scripts locais e o próprio Search Console. A carga deste módulo é
   conservadora: inspecciona só o que precisa, e uma quota esgotada é uma
   limitação — pausa, retoma depois, nunca é problema SEO. */
import { tokenDeAcesso, temCredencialGoogle } from './google.js';
import { caminhosDoSitemap } from './publicacoes.js';

export const ORCAMENTO_INSPECCAO = { pedidos: 40, consultas: 40 };
const POR_EXECUCAO = 30;
const REINSPECCIONAR_EPISODIO_H = 20;      /* página com alteração por rastrear: no máximo 1 vez por dia */
const REINSPECCIONAR_TODAS_DIAS = 7;       /* todas as páginas: uma vez por semana */
const PAUSA_QUOTA_MIN = 60;

export const NOTA_RASTREIO = 'Um rastreio posterior confirma que o Google voltou à página. ' +
  'Não confirma que a nova versão já tenha sido processada ou indexada.';

const t = s => (s ? Date.parse(s) : NaN);

/* ----------------------------------------------------------------- puro -- */

/* O estado de uma página, a partir de quatro observações.
     alteracao  quando a publicação que a alterou foi criada (ou null)
     rastreio   o último rastreio que o Google conhece (ou null)
     inspeccao  quando foi inspeccionada pela última vez (ou null)
     pedido     o último pedido de indexação registado (ou null)            */
export function derivarEstado({ alteracao, rastreio, inspeccao, pedido }) {
  const A = t(alteracao), R = t(rastreio), I = t(inspeccao), P = t(pedido);
  const base = { atraso_horas: null };
  if (!alteracao) return { ...base, estado: null, rastreio_posterior: null };
  if (Number.isNaN(I)) return { ...base, estado: 'SEM_INSPECCAO', rastreio_posterior: 'DESCONHECIDO' };
  if (!Number.isNaN(R) && R > A) {
    const pediuNoEpisodio = !Number.isNaN(P) && P > A && P <= R;
    return {
      estado: pediuNoEpisodio ? 'RASTREADO_DEPOIS_DO_PEDIDO' : 'RASTREADO_SEM_PEDIDO',
      rastreio_posterior: 'SIM',
      atraso_horas: pediuNoEpisodio ? Math.round((R - P) / 36e5 * 10) / 10 : null
    };
  }
  if (!Number.isNaN(P) && P > A) return { ...base, estado: 'PEDIDO', rastreio_posterior: 'NAO' };
  /* pedido feito, mas houve uma publicação nova depois dele e antes de um rastreio */
  if (!Number.isNaN(P) && P < A && (Number.isNaN(R) || P > R)) return { ...base, estado: 'ULTRAPASSADO', rastreio_posterior: 'NAO' };
  return { ...base, estado: 'PENDENTE', rastreio_posterior: 'NAO' };
}

/* Quais inspeccionar nesta execução, por esta ordem:
   1. páginas com alteração ainda sem rastreio posterior (as mais antigas primeiro);
   2. páginas nunca inspeccionadas;
   3. páginas cuja última inspecção tem mais de uma semana. */
export function escolherParaInspeccionar(universo, google, alteracoes, agora, limite = POR_EXECUCAO) {
  const G = new Map(google.map(g => [g.caminho, g]));
  const Al = new Map(alteracoes.map(a => [a.caminho, a]));
  const agoraMs = t(agora);
  const aberto = [], nunca = [], antigas = [];
  for (const c of universo) {
    const g = G.get(c), a = Al.get(c);
    const ultInsp = t(g?.ultima_inspeccao_em);
    if (a && !(t(g?.ultimo_rastreio) > t(a.ultima_alteracao_em))) {
      if (Number.isNaN(ultInsp) || agoraMs - ultInsp > REINSPECCIONAR_EPISODIO_H * 36e5) aberto.push([t(a.ultima_alteracao_em), c]);
      continue;
    }
    if (!g) nunca.push(c);
    else if (agoraMs - ultInsp > REINSPECCIONAR_TODAS_DIAS * 864e5) antigas.push([ultInsp, c]);
  }
  aberto.sort((x, y) => x[0] - y[0]);
  antigas.sort((x, y) => x[0] - y[0]);
  return [...aberto.map(x => x[1]), ...nunca.sort(), ...antigas.map(x => x[1])].slice(0, limite);
}

export function lerResultado(caminho, j, agora) {
  const i = j?.inspectionResult || {};
  const s = i.indexStatusResult || {};
  const ricos = i.richResultsResult
    ? { veredicto: i.richResultsResult.verdict || null, tipos: (i.richResultsResult.detectedItems || []).map(x => x.richResultType) }
    : null;
  return {
    caminho, inspeccionado_em: agora,
    veredicto: s.verdict || null, cobertura: s.coverageState || null, estado_indexacao: s.indexingState || null,
    estado_robots: s.robotsTxtState || null, estado_obtencao: s.pageFetchState || null, rastreado_como: s.crawledAs || null,
    ultimo_rastreio: s.lastCrawlTime || null, canonico_google: s.googleCanonical || null, canonico_declarado: s.userCanonical || null,
    sitemaps: s.sitemap ? JSON.stringify(s.sitemap) : null,
    referencias: s.referringUrls ? JSON.stringify(s.referringUrls.slice(0, 20)) : null,
    resultados_ricos: ricos ? JSON.stringify(ricos) : null, erro: null
  };
}

/* ------------------------------------------------------------ execução -- */

const COLUNAS = ['caminho', 'inspeccionado_em', 'veredicto', 'cobertura', 'estado_indexacao', 'estado_robots', 'estado_obtencao',
  'rastreado_como', 'ultimo_rastreio', 'canonico_google', 'canonico_declarado', 'sitemaps', 'referencias', 'resultados_ricos', 'erro'];

export async function executarCicloInspeccao(env, { fetchImpl = fetch, agora = new Date().toISOString() } = {}) {
  const c = { pedidos: 0, consultas: 0 };
  const buscar = (u, i) => { c.pedidos++; return fetchImpl(u, i); };
  const q = sql => { c.consultas++; return env.DB.prepare(sql); };
  const relatorio = { inspeccionadas: 0, rastreios_novos: 0, motivo: null };
  const fim = () => { relatorio.orcamento = { ...c }; return relatorio; };

  const evento = async (tipo, detalhe) => {
    const recente = await q(`SELECT 1 AS x FROM eventos_operacionais WHERE tipo = ?
        AND criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour') LIMIT 1`).bind(tipo).first();
    if (!recente) await q('INSERT INTO eventos_operacionais (tipo, detalhe) VALUES (?, ?)').bind(tipo, detalhe ?? null).run();
  };

  const pausa = (await q("SELECT valor FROM esquema_meta WHERE chave = 'inspeccao_pausa_ate'").first())?.valor;
  if (pausa && t(pausa) > t(agora)) { relatorio.motivo = 'PAUSA_QUOTA'; return fim(); }

  if (!temCredencialGoogle(env) || !String(env.GSC_PROPRIEDADE || '').trim()) {
    relatorio.motivo = 'SEM_CREDENCIAL_GOOGLE'; await evento('INSPECCAO_SEM_CREDENCIAL_GOOGLE'); return fim();
  }
  const token = await tokenDeAcesso(env, buscar);
  if (!token.ok) { relatorio.motivo = token.motivo; await evento('INSPECCAO_' + token.motivo, token.detalhe); return fim(); }

  const origem = String(env.SITE_ORIGEM || 'https://happysoaring.com').replace(/\/+$/, '');
  const sm = await buscar(origem + '/sitemap.xml');
  const xml = sm.ok ? await sm.text() : '';
  const universo = /<urlset[\s>]/i.test(xml) ? caminhosDoSitemap(xml) : [];
  if (!universo.length) { relatorio.motivo = 'SEM_SITEMAP_PRODUCAO'; await evento('INSPECCAO_SEM_SITEMAP_PRODUCAO', 'HTTP ' + sm.status); return fim(); }

  const [{ results: google }, { results: alteracoes }] = [
    await q('SELECT caminho, ultima_inspeccao_em, ultimo_rastreio FROM paginas_google').all(),
    await q('SELECT caminho, ultima_alteracao_em FROM paginas_alteracao').all()
  ];
  const limite = Math.min(POR_EXECUCAO, ORCAMENTO_INSPECCAO.pedidos - c.pedidos - 1);
  const escolhidas = escolherParaInspeccionar(universo, google, alteracoes, agora, limite);
  const anterior = new Map(google.map(g => [g.caminho, g.ultimo_rastreio]));

  const linhas = [], brutos = [];
  const propriedade = String(env.GSC_PROPRIEDADE).trim();
  for (const caminho of escolhidas) {
    const url = origem + caminho;
    const resp = await buscar('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token.token, 'content-type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: propriedade, languageCode: 'pt-PT' })
    });
    let j = {};
    try { j = await resp.json(); } catch (e) { j = {}; }
    if (resp.status === 429) {
      const ate = new Date(t(agora) + PAUSA_QUOTA_MIN * 60000).toISOString();
      await q("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('inspeccao_pausa_ate', ?)").bind(ate).run();
      await evento('INSPECCAO_QUOTA_ESGOTADA', 'pausa até ' + ate);
      relatorio.motivo = 'QUOTA_ESGOTADA';
      break;
    }
    if (!resp.ok) {
      linhas.push({ caminho, inspeccionado_em: agora, erro: 'HTTP_' + resp.status + (j?.error?.status ? ' ' + j.error.status : '') });
      continue;
    }
    brutos.push({ caminho, resposta: j });
    const l = lerResultado(caminho, j, agora);
    if (l.ultimo_rastreio && l.ultimo_rastreio !== anterior.get(caminho)) relatorio.rastreios_novos++;
    linhas.push(l);
  }

  if (brutos.length && env.BRUTO) {
    c.pedidos++;
    await env.BRUTO.put('inspecoes/' + agora.replace(/[:.]/g, '-') + '.json', JSON.stringify(brutos),
      { httpMetadata: { contentType: 'application/json' } });
  }

  const stmts = [];
  for (let i = 0; i < linhas.length; i += 6) {                                   /* 6 × 15 < 100 parâmetros */
    const parte = linhas.slice(i, i + 6);
    stmts.push(env.DB.prepare('INSERT INTO inspecoes (' + COLUNAS.join(', ') + ') VALUES ' +
      parte.map(() => '(' + COLUNAS.map(() => '?').join(', ') + ')').join(', '))
      .bind(...parte.flatMap(l => COLUNAS.map(k => l[k] ?? null))));
  }
  const boas = linhas.filter(l => !l.erro);
  for (let i = 0; i < boas.length; i += 10) {                                    /* 10 × 9 < 100 */
    const parte = boas.slice(i, i + 10);
    stmts.push(env.DB.prepare(`INSERT INTO paginas_google
        (caminho, ultima_inspeccao_em, ultimo_rastreio, veredicto, cobertura, estado_obtencao, estado_robots, canonico_google, canonico_declarado)
        VALUES ` + parte.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ') + `
        ON CONFLICT(caminho) DO UPDATE SET ultima_inspeccao_em = excluded.ultima_inspeccao_em,
          ultimo_rastreio = COALESCE(excluded.ultimo_rastreio, paginas_google.ultimo_rastreio),
          veredicto = excluded.veredicto, cobertura = excluded.cobertura, estado_obtencao = excluded.estado_obtencao,
          estado_robots = excluded.estado_robots, canonico_google = excluded.canonico_google,
          canonico_declarado = excluded.canonico_declarado`)
      .bind(...parte.flatMap(l => [l.caminho, l.inspeccionado_em, l.ultimo_rastreio, l.veredicto, l.cobertura,
        l.estado_obtencao, l.estado_robots, l.canonico_google, l.canonico_declarado])));
  }
  if (stmts.length) { c.consultas += stmts.length; await env.DB.batch(stmts); }
  relatorio.inspeccionadas = boas.length;
  relatorio.com_erro = linhas.length - boas.length;
  return fim();
}

/* --------------------------------------------------------------- leitura -- */

const ESTADOS_ACCAO = new Set(['PENDENTE', 'ULTRAPASSADO']);

export async function lerIndexacao(db, { agora = new Date().toISOString() } = {}) {
  const [{ results: alt }, { results: goo }, { results: ped }, nivel, pausa, quota, pubs] = await Promise.all([
    db.prepare(`SELECT a.caminho, a.ultima_alteracao_em, a.tipo, d.short_id FROM paginas_alteracao a
                LEFT JOIN deployments d ON d.id = a.deployment_id`).all(),
    db.prepare('SELECT * FROM paginas_google').all(),
    db.prepare('SELECT caminho, MAX(pedido_em) AS pedido_em FROM pedidos_indexacao GROUP BY caminho').all(),
    db.prepare('SELECT caminho, nivel FROM niveis_pagina').all(),
    db.prepare("SELECT valor FROM esquema_meta WHERE chave = 'inspeccao_pausa_ate'").first(),
    db.prepare(`SELECT criado_em, detalhe FROM eventos_operacionais WHERE tipo = 'INSPECCAO_QUOTA_ESGOTADA'
                AND criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day') ORDER BY id DESC LIMIT 1`).first(),
    db.prepare("SELECT SUM(processamento = 'PENDENTE') AS pendentes FROM deployments").first()
  ]);
  const G = new Map(goo.map(g => [g.caminho, g]));
  const P = new Map(ped.map(p => [p.caminho, p.pedido_em]));
  const N = new Map(nivel.results.map(n => [n.caminho, n.nivel]));
  const caminhos = new Set([...alt.map(a => a.caminho), ...goo.map(g => g.caminho)]);
  const A = new Map(alt.map(a => [a.caminho, a]));

  const paginas = [...caminhos].map(c => {
    const a = A.get(c), g = G.get(c);
    const e = derivarEstado({ alteracao: a?.ultima_alteracao_em, rastreio: g?.ultimo_rastreio, inspeccao: g?.ultima_inspeccao_em, pedido: P.get(c) });
    return {
      caminho: c, nivel: N.get(c) ?? null,
      ultima_alteracao: a ? { em: a.ultima_alteracao_em, tipo: a.tipo, publicacao: a.short_id } : null,
      ultimo_rastreio: g?.ultimo_rastreio ?? null, ultima_inspeccao: g?.ultima_inspeccao_em ?? null,
      veredicto: g?.veredicto ?? null, cobertura: g?.cobertura ?? null,
      canonico_divergente: g && g.canonico_google && g.canonico_declarado ? g.canonico_google !== g.canonico_declarado : null,
      pedido_em: P.get(c) ?? null, ...e
    };
  });

  const ordemEstado = { ULTRAPASSADO: 0, PENDENTE: 1, PEDIDO: 2, SEM_INSPECCAO: 3, RASTREADO_DEPOIS_DO_PEDIDO: 4, RASTREADO_SEM_PEDIDO: 5 };
  paginas.sort((x, y) => (ordemEstado[x.estado] ?? 9) - (ordemEstado[y.estado] ?? 9) ||
    (x.nivel ?? 9) - (y.nivel ?? 9) || String(x.ultima_alteracao?.em || '').localeCompare(String(y.ultima_alteracao?.em || '')));

  const contar = e => paginas.filter(p => p.estado === e).length;
  return {
    agora,
    nota: NOTA_RASTREIO,
    resumo: {
      por_pedir: paginas.filter(p => ESTADOS_ACCAO.has(p.estado)).length,
      pendentes: contar('PENDENTE'), ultrapassados: contar('ULTRAPASSADO'), pedidos: contar('PEDIDO'),
      sem_inspeccao: contar('SEM_INSPECCAO'),
      rastreados_depois_do_pedido: contar('RASTREADO_DEPOIS_DO_PEDIDO'), rastreados_sem_pedido: contar('RASTREADO_SEM_PEDIDO'),
      inspeccionadas: goo.length
    },
    limitacoes: {
      historico_publicacoes_em_curso: (pubs?.pendentes ?? 0) > 0,
      publicacoes_por_processar: pubs?.pendentes ?? 0,
      quota_esgotada_hoje: quota ? { em: quota.criado_em, detalhe: quota.detalhe } : null,
      inspeccao_em_pausa_ate: pausa?.valor && t(pausa.valor) > t(agora) ? pausa.valor : null
    },
    paginas
  };
}

export async function registarPedido(db, caminho, pedidoEm) {
  await db.prepare('INSERT INTO pedidos_indexacao (caminho, pedido_em) VALUES (?, ?)').bind(caminho, pedidoEm).run();
}
