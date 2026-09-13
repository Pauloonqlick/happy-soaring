/* PAINEL «EVOLUÇÃO» — só leitura.

   1. Operação: o que está a correr, o que está em fila, falhas.
   2. Indexação: estado no Google por língua e família, tempo até ao rastreio, problemas por semana.
   3. Página × língua: as versões linguísticas de cada página conceptual lado a lado.
   4. Visão geral: semanas de cliques, impressões, CTR e posição; marca, não-marca e desconhecido.

   Regras que o painel respeita: nunca só a média global; país ≠ língua; semanas
   completas; queda ou subida só com confirmação em 2 semanas seguidas e amostra
   suficiente; «observado depois de», nunca «causou». As agregações pesadas
   fazem-se em SQL, para caber no tempo de processador do plano gratuito. */
import { proximasExecucoes } from './agenda.js';
import { estadoAvisos } from './avisos.js';

const DIA = 864e5;
const t = s => (s ? Date.parse(s) : NaN);
const r1 = n => Math.round(n * 10) / 10;

export const LINGUAS = ['pt', 'en', 'es', 'fr', 'de'];
export const FAMILIAS = { inicial: 'Inicial', asas: 'Asas', spots: 'Spots', paginas: 'Páginas principais' };
const ASAS = new Set(['asas', 'wings', 'alas', 'ailes', 'schirme']);

export function linguaDoCaminho(c) {
  const m = /^\/(en|es|fr|de)(\/|$)/.exec(c);
  return m ? m[1] : 'pt';
}

export function familiaDoCaminho(c) {
  const partes = String(c).split('/').filter(Boolean);
  if (['en', 'es', 'fr', 'de'].includes(partes[0])) partes.shift();
  if (!partes.length) return 'inicial';
  if (ASAS.has(partes[0])) return 'asas';
  if (partes[0] === 'parakite-portugal' && partes.length > 1) return 'spots';
  return 'paginas';
}

/* A página conceptual de cada caminho, a partir do hreflang que a página publica. */
export function gruposDasVersoes(linhas) {
  const out = new Map();
  for (const l of linhas) {
    let v = null;
    try { v = l.versoes ? JSON.parse(l.versoes) : null; } catch (e) { v = null; }
    if (!v) continue;
    const propria = Object.entries(v).find(([k, p]) => k !== 'x-default' && p === l.caminho);
    out.set(l.caminho, { grupo: v.pt || v.en || l.caminho, lingua: propria ? propria[0] : linguaDoCaminho(l.caminho) });
  }
  return out;
}

export function inicioSemana(data) {
  const d = new Date(String(data).slice(0, 10) + 'T00:00:00Z');
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DIA).toISOString().slice(0, 10);
}

/* Queda ou subida só confirmada: as 2 últimas semanas completas ambas ≥ limiar
   abaixo (ou acima) da média das 2 anteriores, com amostra mínima. Puro. */
export function tendenciaConfirmada(valores, { minimo = 20, limiar = 0.2 } = {}) {
  if (valores.length < 4) return 'HISTORICO_INSUFICIENTE';
  const [a, b, c, d] = valores.slice(-4);
  const base = (a + b) / 2;
  if (base < minimo && Math.max(c, d) < minimo) return 'AMOSTRA_INSUFICIENTE';
  const baixo = base * (1 - limiar), alto = base * (1 + limiar);
  if (c < baixo && d < baixo) return 'QUEDA_CONFIRMADA';
  if (c > alto && d > alto) return 'SUBIDA_CONFIRMADA';
  if (c < baixo || d < baixo || c > alto || d > alto) return 'A_OBSERVAR';
  return 'ESTAVEL';
}

function mediana(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentil(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

const SQL_VERSOES = `SELECT caminho, versoes FROM deployment_paginas WHERE versoes IS NOT NULL AND deployment_id = (
  SELECT d.id FROM deployments d WHERE d.processamento = 'PROCESSADO'
    AND EXISTS (SELECT 1 FROM deployment_paginas p WHERE p.deployment_id = d.id AND p.versoes IS NOT NULL)
  ORDER BY d.criado_em_cf DESC LIMIT 1)`;

/* ------------------------------------------------------------ 1. operação -- */

export async function lerOperacao(env, { agora = new Date().toISOString() } = {}) {
  const db = env.DB;
  const h6 = new Date(t(agora) - 6 * 36e5).toISOString(), h24 = new Date(t(agora) - DIA).toISOString();
  const [pubs, pubsRecentes, gsc, google, insp24, meta, assuntos, decisoes24, pacotes, execs, falhas, eventos, avisos] = await Promise.all([
    db.prepare("SELECT processamento, COUNT(*) AS n, MIN(criado_em_cf) AS mais_antiga FROM deployments GROUP BY processamento").all(),
    db.prepare("SELECT COUNT(*) AS n FROM deployments WHERE processamento IN ('PROCESSADO', 'FALHOU') AND processado_em > ?").bind(h6).first(),
    db.prepare('SELECT COUNT(*) AS dias, SUM(completo) AS completos, MIN(data) AS primeiro, MAX(data) AS ultimo, MAX(recolhido_em) AS recolhido FROM gsc_dias').first(),
    db.prepare(`SELECT COUNT(*) AS paginas, MAX(ultima_inspeccao_em) AS ultima,
        SUM(ultima_inspeccao_em < ?) AS com_mais_de_7_dias, SUM(ultimo_rastreio IS NULL) AS nunca_rastreadas FROM paginas_google`)
      .bind(new Date(t(agora) - 7 * DIA).toISOString()).first(),
    db.prepare('SELECT COUNT(*) AS n FROM inspecoes WHERE inspeccionado_em > ?').bind(h24).first(),
    db.prepare("SELECT chave, valor FROM esquema_meta WHERE chave IN ('inspeccao_pausa_ate', 'assuntos_ultimo_ciclo')").all(),
    db.prepare(`SELECT COUNT(*) AS activos, SUM(critico) AS criticos,
        SUM((confirmado = 1 OR critico = 1) AND NOT EXISTS (SELECT 1 FROM assunto_decisoes d WHERE d.assunto_chave = a.chave
          AND d.decidido_em >= a.detectado_em AND (d.decisao <> 'ADIAR' OR d.adiar_ate >= ?))) AS por_decidir
      FROM assuntos a WHERE resolvido_em IS NULL`).bind(agora.slice(0, 10)).first(),
    db.prepare('SELECT decidido_por, decisao, COUNT(*) AS n FROM assunto_decisoes WHERE decidido_em > ? GROUP BY decidido_por, decisao').bind(h24).all(),
    db.prepare(`SELECT SUM(p.publicado_em IS NULL AND p.implementacao IS NULL) AS por_implementar,
        SUM(p.publicado_em IS NULL AND p.implementacao IS NOT NULL) AS implementados_por_publicar,
        SUM(p.publicado_em IS NOT NULL AND v.id IS NULL) AS publicados_por_avaliar, COUNT(v.id) AS avaliados
      FROM pacotes_trabalho p LEFT JOIN avaliacoes v ON v.pacote_id = p.id`).first(),
    db.prepare(`SELECT e.vez, e.inicio, e.duracao_ms, e.ok, e.resumo, e.erro FROM execucoes e
      JOIN (SELECT vez, MAX(inicio) AS inicio FROM execucoes GROUP BY vez) u ON u.vez = e.vez AND u.inicio = e.inicio`).all(),
    db.prepare('SELECT vez, COUNT(*) AS execucoes, SUM(ok = 0) AS falhas, ROUND(AVG(duracao_ms)) AS duracao_media FROM execucoes WHERE inicio > ? GROUP BY vez').bind(h24).all(),
    db.prepare('SELECT tipo, COUNT(*) AS n, MAX(criado_em) AS ultimo FROM eventos_operacionais WHERE criado_em > ? GROUP BY tipo ORDER BY ultimo DESC').bind(h24).all(),
    estadoAvisos(db, env).catch(() => null)
  ]);

  const P = Object.fromEntries(pubs.results.map(x => [x.processamento, x]));
  const pendentes = P.PENDENTE?.n ?? 0;
  const porHora = (pubsRecentes?.n ?? 0) / 6;
  const M = Object.fromEntries(meta.results.map(x => [x.chave, x.valor]));
  let ultimoCiclo = null;
  try { ultimoCiclo = M.assuntos_ultimo_ciclo ? JSON.parse(M.assuntos_ultimo_ciclo) : null; } catch (e) { ultimoCiclo = null; }
  const E = new Map(execs.results.map(x => [x.vez, x]));
  const F = new Map(falhas.results.map(x => [x.vez, x]));

  return {
    agora,
    tarefas: proximasExecucoes(agora).map(a => {
      const u = E.get(a.vez), f = F.get(a.vez);
      let resumo = null;
      try { resumo = u?.resumo ? JSON.parse(u.resumo) : null; } catch (e) { resumo = null; }
      return {
        ...a,
        ultima: u ? { inicio: u.inicio, duracao_ms: u.duracao_ms, ok: !!u.ok, resumo, erro: u.erro } : null,
        ultimas_24h: f ? { execucoes: f.execucoes, falhas: f.falhas, duracao_media_ms: f.duracao_media } : { execucoes: 0, falhas: 0, duracao_media_ms: null }
      };
    }),
    filas: {
      publicacoes: {
        processadas: P.PROCESSADO?.n ?? 0, pendentes, sem_leitura: P.FALHOU?.n ?? 0, ignoradas: P.IGNORADO?.n ?? 0,
        por_hora_ultimas_6h: r1(porHora), horas_para_acabar: pendentes ? (porHora ? r1(pendentes / porHora) : null) : 0
      },
      search_console: {
        dias: gsc?.dias ?? 0, completos: gsc?.completos ?? 0, por_completar: (gsc?.dias ?? 0) - (gsc?.completos ?? 0),
        primeiro: gsc?.primeiro ?? null, ultimo: gsc?.ultimo ?? null, ultima_recolha: gsc?.recolhido ?? null
      },
      inspeccao: {
        paginas: google?.paginas ?? 0, ultima: google?.ultima ?? null, com_mais_de_7_dias: google?.com_mais_de_7_dias ?? 0,
        nunca_rastreadas: google?.nunca_rastreadas ?? 0, inspeccoes_24h: insp24?.n ?? 0, quota_diaria_partilhada: 2000,
        em_pausa_ate: M.inspeccao_pausa_ate && t(M.inspeccao_pausa_ate) > t(agora) ? M.inspeccao_pausa_ate : null
      },
      assuntos: {
        activos: assuntos?.activos ?? 0, criticos: assuntos?.criticos ?? 0, por_decidir: assuntos?.por_decidir ?? 0,
        execucoes_de_decisao_em_falta: Math.ceil((assuntos?.por_decidir ?? 0) / 60), ultimo_ciclo: ultimoCiclo
      },
      decisoes_24h: decisoes24.results,
      pacotes: {
        por_implementar: pacotes?.por_implementar ?? 0, implementados_por_publicar: pacotes?.implementados_por_publicar ?? 0,
        publicados_por_avaliar: pacotes?.publicados_por_avaliar ?? 0, avaliados: pacotes?.avaliados ?? 0
      },
      avisos
    },
    eventos_24h: eventos.results
  };
}

/* ----------------------------------------------------------- 2. indexação -- */

export async function lerIndexacaoEvolucao(db, { agora = new Date().toISOString() } = {}) {
  const d120 = new Date(t(agora) - 120 * DIA).toISOString(), d60 = new Date(t(agora) - 60 * DIA).toISOString();
  const [google, alteracoes, insp, assuntos, niveis, frequencia] = await Promise.all([
    db.prepare('SELECT caminho, veredicto, ultimo_rastreio, ultima_inspeccao_em FROM paginas_google').all(),
    db.prepare('SELECT caminho, ultima_alteracao_em, tipo FROM paginas_alteracao').all(),
    db.prepare('SELECT caminho, inspeccionado_em, veredicto, ultimo_rastreio FROM inspecoes WHERE erro IS NULL AND inspeccionado_em > ? ORDER BY inspeccionado_em').bind(d120).all(),
    db.prepare('SELECT tipo, critico, detectado_em, resolvido_em, regressoes FROM assuntos').all(),
    db.prepare('SELECT caminho, nivel FROM niveis_pagina').all(),
    db.prepare(`SELECT caminho, COUNT(DISTINCT ultimo_rastreio) AS rastreios FROM inspecoes
      WHERE erro IS NULL AND ultimo_rastreio IS NOT NULL AND ultimo_rastreio > ? GROUP BY caminho`).bind(d60).all()
  ]);
  const N = new Map(niveis.results.map(n => [n.caminho, n.nivel]));
  const FR = new Map(frequencia.results.map(f => [f.caminho, f.rastreios]));
  const agoraMs = t(agora);

  /* estado actual por língua e por família */
  const vazio = () => ({ paginas: 0, indexadas: 0, nao_indexadas: 0, nunca_rastreadas: 0, dias_desde_rastreio: [], rastreios_60d: 0,
    faixas: { ate_7: 0, de_8_a_30: 0, de_31_a_90: 0, mais_de_90: 0, nunca: 0 } });
  const porLingua = Object.fromEntries(LINGUAS.map(l => [l, vazio()]));
  const porFamilia = Object.fromEntries(Object.keys(FAMILIAS).map(f => [f, vazio()]));
  for (const g of google.results) {
    for (const alvo of [porLingua[linguaDoCaminho(g.caminho)], porFamilia[familiaDoCaminho(g.caminho)]]) {
      alvo.paginas++;
      if (g.veredicto === 'PASS') alvo.indexadas++; else alvo.nao_indexadas++;
      alvo.rastreios_60d += FR.get(g.caminho) || 0;
      if (!g.ultimo_rastreio) { alvo.nunca_rastreadas++; alvo.faixas.nunca++; continue; }
      const dias = Math.floor((agoraMs - t(g.ultimo_rastreio)) / DIA);
      alvo.dias_desde_rastreio.push(dias);
      alvo.faixas[dias <= 7 ? 'ate_7' : dias <= 30 ? 'de_8_a_30' : dias <= 90 ? 'de_31_a_90' : 'mais_de_90']++;
    }
  }
  const fechar = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, {
    paginas: v.paginas, indexadas: v.indexadas, nao_indexadas: v.nao_indexadas, nunca_rastreadas: v.nunca_rastreadas,
    percentagem_indexada: v.paginas ? r1(v.indexadas / v.paginas * 100) : null,
    mediana_dias_desde_rastreio: mediana(v.dias_desde_rastreio), faixas: v.faixas,
    rastreios_por_pagina_60d: v.paginas ? r1(v.rastreios_60d / v.paginas) : null
  }]));

  /* evolução semanal: a última inspecção de cada página até ao fim de cada semana */
  const semanas = [];
  if (insp.results.length) {
    const primeira = inicioSemana(insp.results[0].inspeccionado_em);
    const estado = new Map();
    let i = 0;
    for (let s = t(primeira + 'T00:00:00Z'); s <= agoraMs; s += 7 * DIA) {
      const fim = s + 7 * DIA;
      const rastreios = new Set();
      while (i < insp.results.length && t(insp.results[i].inspeccionado_em) < fim) {
        const x = insp.results[i++];
        estado.set(x.caminho, x.veredicto === 'PASS');
        if (x.ultimo_rastreio && t(x.ultimo_rastreio) >= s && t(x.ultimo_rastreio) < fim) rastreios.add(x.caminho + x.ultimo_rastreio);
      }
      const linha = { semana: new Date(s).toISOString().slice(0, 10), parcial: fim > agoraMs, rastreios_observados: rastreios.size, por_lingua: {} };
      let tot = 0, idx = 0;
      for (const l of LINGUAS) {
        let n = 0, k = 0;
        for (const [c, ok] of estado) if (linguaDoCaminho(c) === l) { n++; if (ok) k++; }
        linha.por_lingua[l] = n ? r1(k / n * 100) : null;
        tot += n; idx += k;
      }
      linha.percentagem_indexada = tot ? r1(idx / tot * 100) : null;
      linha.paginas_conhecidas = tot;
      semanas.push(linha);
    }
  }

  /* tempo entre a alteração e o rastreio posterior */
  const G = new Map(google.results.map(g => [g.caminho, g]));
  const atraso = { por_lingua: {}, por_nivel: {} };
  const juntar = (mapa, chave, campo, v) => {
    if (!mapa[chave]) mapa[chave] = { rastreadas: [], pendentes: [] };
    mapa[chave][campo].push(v);
  };
  for (const a of alteracoes.results) {
    const g = G.get(a.caminho);
    if (!g) continue;
    const nivel = N.get(a.caminho) ? 'nível ' + N.get(a.caminho) : 'sem nível';
    if (g.ultimo_rastreio && t(g.ultimo_rastreio) > t(a.ultima_alteracao_em)) {
      const dias = r1((t(g.ultimo_rastreio) - t(a.ultima_alteracao_em)) / DIA);
      juntar(atraso.por_lingua, linguaDoCaminho(a.caminho), 'rastreadas', dias);
      juntar(atraso.por_nivel, nivel, 'rastreadas', dias);
    } else {
      const idade = r1((agoraMs - t(a.ultima_alteracao_em)) / DIA);
      juntar(atraso.por_lingua, linguaDoCaminho(a.caminho), 'pendentes', idade);
      juntar(atraso.por_nivel, nivel, 'pendentes', idade);
    }
  }
  const resumirAtraso = m => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, {
    rastreadas: v.rastreadas.length, mediana_dias: mediana(v.rastreadas), p75_dias: percentil(v.rastreadas, 0.75),
    pendentes: v.pendentes.length, mediana_idade_pendentes_dias: mediana(v.pendentes)
  }]));

  /* problemas por semana */
  const prob = new Map();
  const semana = k => { if (!prob.has(k)) prob.set(k, { semana: k, detectados: 0, criticos: 0, resolvidos: 0 }); return prob.get(k); };
  const activosPorTipo = {};
  let regressoes = 0;
  for (const a of assuntos.results) {
    const s = semana(inicioSemana(a.detectado_em));
    s.detectados++;
    if (a.critico) s.criticos++;
    if (a.resolvido_em) semana(inicioSemana(a.resolvido_em)).resolvidos++;
    else activosPorTipo[a.tipo] = (activosPorTipo[a.tipo] || 0) + 1;
    regressoes += a.regressoes || 0;
  }

  return {
    agora,
    por_lingua: fechar(porLingua),
    por_familia: fechar(porFamilia),
    semanas,
    atraso_ate_rastreio: { por_lingua: resumirAtraso(atraso.por_lingua), por_nivel: resumirAtraso(atraso.por_nivel) },
    problemas: { por_semana: [...prob.values()].sort((a, b) => a.semana.localeCompare(b.semana)), activos_por_tipo: activosPorTipo, regressoes }
  };
}

/* ------------------------------------------------------- 3. página × língua -- */

export function sinaisDoGrupo(versoes, { diasComDados }) {
  const lista = Object.values(versoes);
  const melhor = Math.max(0, ...lista.map(v => v.impressoes));
  for (const v of lista) {
    v.sinais = [];
    if (v.google && v.google.indexada === false) v.sinais.push('NAO_INDEXADA');
    if (lista.length > 1 && melhor >= 30 && v.impressoes < melhor * 0.1) v.sinais.push('ATRAS_DAS_IRMAS');
    if (v.google && v.google.indexada && v.impressoes === 0 && diasComDados >= 14) v.sinais.push('INDEXADA_SEM_IMPRESSOES');
    if (v.tendencia === 'QUEDA_CONFIRMADA') v.sinais.push('QUEDA_CONFIRMADA');
    if (v.tendencia === 'SUBIDA_CONFIRMADA') v.sinais.push('SUBIDA_CONFIRMADA');
  }
  return versoes;
}

export async function lerPaginas(db, { dias = 28 } = {}) {
  const ultima = (await db.prepare('SELECT MAX(data) AS d FROM gsc_dias WHERE completo = 1').first())?.d;
  const inicio = ultima ? new Date(t(ultima + 'T00:00:00Z') - (dias - 1) * DIA).toISOString().slice(0, 10) : null;
  const inicioSemanas = ultima ? new Date(t(ultima + 'T00:00:00Z') - 42 * DIA).toISOString().slice(0, 10) : null;
  const [periodo, porUrl, porSemana, semanasCompletas, google, versoes, niveis, pobj, objs] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS dias, SUM(cliques) AS cliques, SUM(impressoes) AS impressoes FROM gsc_dias WHERE completo = 1 AND data BETWEEN ? AND ?').bind(inicio, ultima).first(),
    db.prepare(`SELECT json_extract(j.value, '$[0]') AS url, SUM(json_extract(j.value, '$[1]')) AS cliques, SUM(json_extract(j.value, '$[2]')) AS impressoes,
        SUM(json_extract(j.value, '$[4]') * json_extract(j.value, '$[2]')) AS pos_imp
      FROM gsc_conjuntos c JOIN gsc_dias g ON g.data = c.data AND g.completo = 1, json_each(c.json) j
      WHERE c.conjunto = 'page' AND c.data BETWEEN ? AND ? GROUP BY url`).bind(inicio, ultima).all(),
    db.prepare(`SELECT json_extract(j.value, '$[0]') AS url, date(c.data, 'weekday 0', '-6 days') AS semana, SUM(json_extract(j.value, '$[2]')) AS impressoes
      FROM gsc_conjuntos c JOIN gsc_dias g ON g.data = c.data AND g.completo = 1, json_each(c.json) j
      WHERE c.conjunto = 'page' AND c.data >= ? GROUP BY url, semana`).bind(inicioSemanas).all(),
    db.prepare("SELECT date(data, 'weekday 0', '-6 days') AS semana, COUNT(*) AS dias FROM gsc_dias WHERE completo = 1 AND data >= ? GROUP BY semana ORDER BY semana").bind(inicioSemanas).all(),
    db.prepare('SELECT caminho, veredicto, cobertura, ultimo_rastreio, ultima_inspeccao_em FROM paginas_google').all(),
    db.prepare(SQL_VERSOES).all(),
    db.prepare('SELECT caminho, nivel FROM niveis_pagina').all(),
    db.prepare('SELECT caminho, objectivo_id FROM pagina_objectivo').all(),
    db.prepare('SELECT id, nome FROM objectivos_negocio').all()
  ]);
  const diasComDados = periodo?.dias ?? 0;
  const GR = gruposDasVersoes(versoes.results);
  const N = new Map(niveis.results.map(n => [n.caminho, n.nivel]));
  const O = new Map(objs.results.map(o => [o.id, o.nome]));
  const PO = new Map();
  for (const r of pobj.results) { if (!PO.has(r.caminho)) PO.set(r.caminho, []); if (O.has(r.objectivo_id)) PO.get(r.caminho).push(O.get(r.objectivo_id)); }
  const completas = semanasCompletas.results.filter(s => s.dias === 7).map(s => s.semana);

  const paginas = new Map();
  const pagina = c => {
    if (!paginas.has(c)) {
      const g = GR.get(c);
      paginas.set(c, { caminho: c, lingua: g ? g.lingua : linguaDoCaminho(c), grupo: g ? g.grupo : c, familia: familiaDoCaminho(c),
        nivel: N.get(c) ?? null, objectivos: PO.get(c) || [], google: null, cliques: 0, impressoes: 0, pos_imp: 0, semanas: {} });
    }
    return paginas.get(c);
  };
  for (const g of google.results) {
    pagina(g.caminho).google = { indexada: g.veredicto === 'PASS', veredicto: g.veredicto, cobertura: g.cobertura, ultimo_rastreio: g.ultimo_rastreio };
  }
  const outras = [];
  const caminhoApex = url => { try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'happysoaring.com' && !u.search ? u.pathname : null; } catch (e) { return null; } };
  for (const r of porUrl.results) {
    const c = caminhoApex(r.url);
    if (!c || !paginas.has(c)) { outras.push({ url: r.url, cliques: r.cliques, impressoes: r.impressoes }); continue; }
    const p = pagina(c);
    p.cliques += r.cliques; p.impressoes += r.impressoes; p.pos_imp += r.pos_imp || 0;
  }
  for (const r of porSemana.results) {
    const c = caminhoApex(r.url);
    if (c && paginas.has(c)) paginas.get(c).semanas[r.semana] = (paginas.get(c).semanas[r.semana] || 0) + r.impressoes;
  }

  const grupos = new Map();
  const porLingua = Object.fromEntries(LINGUAS.map(l => [l, { paginas: 0, indexadas: 0, com_impressoes: 0, cliques: 0, impressoes: 0 }]));
  const porFamilia = Object.fromEntries(Object.keys(FAMILIAS).map(f => [f, { paginas: 0, indexadas: 0, com_impressoes: 0, cliques: 0, impressoes: 0 }]));
  for (const p of paginas.values()) {
    const v = {
      caminho: p.caminho, cliques: p.cliques, impressoes: p.impressoes,
      ctr: p.impressoes ? r1(p.cliques / p.impressoes * 100) : null, posicao: p.impressoes ? r1(p.pos_imp / p.impressoes) : null,
      google: p.google, nivel: p.nivel, objectivos: p.objectivos,
      tendencia: tendenciaConfirmada(completas.map(s => p.semanas[s] || 0))
    };
    if (!grupos.has(p.grupo)) grupos.set(p.grupo, { grupo: p.grupo, familia: p.familia, versoes: {}, cliques: 0, impressoes: 0 });
    const g = grupos.get(p.grupo);
    const chave = g.versoes[p.lingua] ? p.lingua + ':' + p.caminho : p.lingua;
    g.versoes[chave] = v;
    g.cliques += p.cliques; g.impressoes += p.impressoes;
    for (const alvo of [porLingua[p.lingua], porFamilia[p.familia]]) {
      if (!alvo) continue;
      alvo.paginas++; alvo.cliques += p.cliques; alvo.impressoes += p.impressoes;
      if (p.google && p.google.indexada) alvo.indexadas++;
      if (p.impressoes > 0) alvo.com_impressoes++;
    }
  }
  const listaGrupos = [...grupos.values()].map(g => ({ ...g, versoes: sinaisDoGrupo(g.versoes, { diasComDados }) }))
    .sort((a, b) => b.impressoes - a.impressoes || a.grupo.localeCompare(b.grupo));

  return {
    periodo: { dias, inicio, fim: ultima, dias_com_dados: diasComDados, cliques: periodo?.cliques ?? 0, impressoes: periodo?.impressoes ?? 0 },
    semanas_completas: completas,
    agrupamento_por_hreflang: GR.size > 0,
    por_lingua: porLingua,
    por_familia: porFamilia,
    grupos: listaGrupos,
    outras_urls: outras.sort((a, b) => b.impressoes - a.impressoes).slice(0, 20),
    nota: 'As impressões por página só contam o que o Google mostra por página; o total do site vem dos totais diários. ' +
      'Uma queda ou subida só aparece confirmada com 4 semanas completas de dados.'
  };
}

/* ----------------------------------------------------------- 4. visão geral -- */

export async function lerGeral(db) {
  const [semanas, marca, publicacoes, rastreios, pacotes, diario] = await Promise.all([
    db.prepare(`SELECT date(data, 'weekday 0', '-6 days') AS semana, COUNT(*) AS dias, SUM(cliques) AS cliques, SUM(impressoes) AS impressoes,
        SUM(posicao * impressoes) AS pos_imp FROM gsc_dias WHERE completo = 1 GROUP BY semana ORDER BY semana`).all(),
    db.prepare(`SELECT semana, SUM(marca * cl) AS cliques_marca, SUM(marca * im) AS impressoes_marca,
        SUM((1 - marca) * cl) AS cliques_nao_marca, SUM((1 - marca) * im) AS impressoes_nao_marca FROM (
        SELECT date(c.data, 'weekday 0', '-6 days') AS semana, json_extract(j.value, '$[1]') AS cl, json_extract(j.value, '$[2]') AS im,
          EXISTS (SELECT 1 FROM termos_marca tm WHERE instr(lower(json_extract(j.value, '$[0]')), tm.termo) > 0
            OR instr(replace(lower(json_extract(j.value, '$[0]')), ' ', ''), replace(tm.termo, ' ', '')) > 0) AS marca
        FROM gsc_conjuntos c JOIN gsc_dias g ON g.data = c.data AND g.completo = 1, json_each(c.json) j
        WHERE c.conjunto = 'query') GROUP BY semana`).all(),
    db.prepare("SELECT date(substr(criado_em_cf, 1, 10), 'weekday 0', '-6 days') AS semana, COUNT(*) AS n, group_concat(substr(criado_em_cf, 1, 10)) AS datas FROM deployments WHERE processamento = 'PROCESSADO' GROUP BY semana").all(),
    db.prepare("SELECT date(substr(ultimo_rastreio, 1, 10), 'weekday 0', '-6 days') AS semana, COUNT(DISTINCT caminho || ultimo_rastreio) AS n FROM inspecoes WHERE erro IS NULL AND ultimo_rastreio IS NOT NULL GROUP BY semana").all(),
    db.prepare("SELECT date(substr(publicado_em, 1, 10), 'weekday 0', '-6 days') AS semana, COUNT(*) AS n FROM pacotes_trabalho WHERE publicado_em IS NOT NULL GROUP BY semana").all(),
    db.prepare('SELECT data, cliques, impressoes, posicao FROM gsc_dias WHERE completo = 1 ORDER BY data DESC LIMIT 35').all()
  ]);
  const M = new Map(marca.results.map(m => [m.semana, m]));
  const A = (rows) => new Map(rows.results.map(x => [x.semana, x]));
  const PU = A(publicacoes), RA = A(rastreios), PA = A(pacotes);
  const linhas = semanas.results.map(s => {
    const m = M.get(s.semana) || {};
    const visI = (m.impressoes_marca || 0) + (m.impressoes_nao_marca || 0), visC = (m.cliques_marca || 0) + (m.cliques_nao_marca || 0);
    return {
      semana: s.semana, dias: s.dias, completa: s.dias === 7,
      cliques: s.cliques, impressoes: s.impressoes,
      ctr: s.impressoes ? r1(s.cliques / s.impressoes * 100) : null,
      posicao: s.impressoes ? r1(s.pos_imp / s.impressoes) : null,
      marca: { cliques: m.cliques_marca || 0, impressoes: m.impressoes_marca || 0 },
      nao_marca: { cliques: m.cliques_nao_marca || 0, impressoes: m.impressoes_nao_marca || 0 },
      desconhecido: { cliques: Math.max(0, s.cliques - visC), impressoes: Math.max(0, s.impressoes - visI) },
      cobertura_visivel: s.impressoes ? r1(visI / s.impressoes * 100) : null,
      anotacoes: {
        publicacoes: PU.get(s.semana)?.n || 0, datas_publicacoes: PU.get(s.semana)?.datas ? [...new Set(PU.get(s.semana).datas.split(','))] : [],
        rastreios_observados: RA.get(s.semana)?.n || 0, correccoes_publicadas: PA.get(s.semana)?.n || 0
      }
    };
  });
  const completas = linhas.filter(l => l.completa);
  return {
    semanas: linhas,
    tendencias: {
      impressoes: tendenciaConfirmada(completas.map(l => l.impressoes), { minimo: 100 }),
      cliques: tendenciaConfirmada(completas.map(l => l.cliques), { minimo: 20 }),
      impressoes_nao_marca: tendenciaConfirmada(completas.map(l => l.nao_marca.impressoes), { minimo: 100 }),
      impressoes_marca: tendenciaConfirmada(completas.map(l => l.marca.impressoes), { minimo: 50 })
    },
    diario: diario.results.reverse(),
    nota: 'Semanas de segunda a domingo, nas datas do Search Console (hora do Pacífico). Uma semana incompleta não entra nas tendências. ' +
      '«Desconhecido» é o que o Google conta mas não mostra por pesquisa.'
  };
}
