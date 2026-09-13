/* SEARCH CONSOLE — recolha do histórico e dos dias novos (pesquisa Web).

   Uma execução:
     1. uma consulta por data, dos últimos 16 meses → os totais de cada dia
        com dados (a verdade, incluindo o que o Google esconde);
     2. para os dias ainda não completos, mais antigos primeiro: query, page,
        country, device e o combinado, um pedido cada.
   Só dados finais: um dia gravado nunca muda, e nunca é reescrito.

   Plano gratuito: cada dia custa 5 pedidos e 6 consultas; a execução pára
   antes dos limites e a seguinte continua. */
import { tokenDeAcesso, consultarAnalitica, temCredencialGoogle } from './google.js';
import { classificarMarca, inferirLingua } from './linguas.js';

export const ORCAMENTO_GSC = { pedidos: 40, consultas: 40 };
const CONJUNTOS = ['query', 'page', 'country', 'device', 'combinado'];
const LIMITE_LINHAS = 25000;

const dia = d => d.toISOString().slice(0, 10);

function contadorGsc(env, fetchImpl) {
  const c = { pedidos: 0, consultas: 0 };
  return {
    c,
    buscar: (u, i) => { c.pedidos++; return fetchImpl(u, i); },
    q: sql => { c.consultas++; return env.DB.prepare(sql); },
    lote: stmts => { c.consultas += stmts.length; return env.DB.batch(stmts); }
  };
}

async function evento(r, tipo, detalhe) {
  const recente = await r.q(`SELECT 1 AS x FROM eventos_operacionais WHERE tipo = ?
      AND criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour') LIMIT 1`).bind(tipo).first();
  if (recente) return;
  await r.q('INSERT INTO eventos_operacionais (tipo, detalhe) VALUES (?, ?)').bind(tipo, detalhe ?? null).run();
}

/* uma dimensão → [valor, cliques, impressoes, ctr, posicao]; combinado → 4 chaves + métricas */
function compactar(linhas) {
  return linhas.map(l => [...(l.keys || []), l.clicks ?? 0, l.impressions ?? 0,
    Math.round((l.ctr ?? 0) * 1e6) / 1e6, Math.round((l.position ?? 0) * 100) / 100]);
}

async function lerConjunto(env, r, token, data, conjunto) {
  const dimensoes = conjunto === 'combinado' ? ['query', 'page', 'country', 'device'] : [conjunto];
  const todas = [];
  for (let inicio = 0; ; inicio += LIMITE_LINHAS) {
    const res = await consultarAnalitica(env, r.buscar, token, {
      startDate: data, endDate: data, dimensions: dimensoes, type: 'web',
      rowLimit: LIMITE_LINHAS, startRow: inicio, dataState: 'final'
    });
    if (!res.ok) return res;
    todas.push(...res.linhas);
    if (res.linhas.length < LIMITE_LINHAS) break;
    if (r.c.pedidos >= ORCAMENTO_GSC.pedidos) return { ok: false, motivo: 'ORCAMENTO' };
  }
  return { ok: true, linhas: todas };
}

export async function executarCicloGsc(env, { fetchImpl = fetch, hoje = new Date() } = {}) {
  const r = contadorGsc(env, fetchImpl);
  const relatorio = { dias_novos: 0, dias_completos: [], motivo: null };

  if (!temCredencialGoogle(env) || !String(env.GSC_PROPRIEDADE || '').trim()) {
    relatorio.motivo = 'SEM_CREDENCIAL_GOOGLE';
    await evento(r, 'GSC_SEM_CREDENCIAL_GOOGLE', null);
    relatorio.orcamento = { ...r.c };
    return relatorio;
  }
  const t = await tokenDeAcesso(env, r.buscar);
  if (!t.ok) {
    relatorio.motivo = t.motivo; relatorio.detalhe = t.detalhe ?? null;
    await evento(r, 'GSC_' + t.motivo, t.detalhe);
    relatorio.orcamento = { ...r.c };
    return relatorio;
  }

  /* 1 — os totais por dia (uma consulta cobre 16 meses) */
  const fim = new Date(hoje.getTime() - 2 * 864e5);
  const inicio = new Date(hoje.getTime() - 486 * 864e5);
  const totais = await consultarAnalitica(env, r.buscar, t.token, {
    startDate: dia(inicio), endDate: dia(fim), dimensions: ['date'], type: 'web', rowLimit: 1000, dataState: 'final'
  });
  if (!totais.ok) {
    relatorio.motivo = totais.motivo;
    await evento(r, 'GSC_' + totais.motivo, totais.detalhe);
    relatorio.orcamento = { ...r.c };
    return relatorio;
  }
  const { results: conhecidos } = await r.q('SELECT data FROM gsc_dias').all();
  const jaTem = new Set(conhecidos.map(x => x.data));
  const novos = totais.linhas.filter(l => l.keys?.[0] && !jaTem.has(l.keys[0]));
  const propriedade = String(env.GSC_PROPRIEDADE).trim();
  for (let i = 0; i < novos.length; i += 12) {                       /* 12 × 6 parâmetros < 100 */
    const parte = novos.slice(i, i + 12);
    await r.q('INSERT OR IGNORE INTO gsc_dias (data, propriedade, cliques, impressoes, ctr, posicao) VALUES ' +
      parte.map(() => '(?, ?, ?, ?, ?, ?)').join(', '))
      .bind(...parte.flatMap(l => [l.keys[0], propriedade, l.clicks ?? 0, l.impressions ?? 0, l.ctr ?? null, l.position ?? null])).run();
  }
  relatorio.dias_novos = novos.length;

  /* 2 — os conjuntos dos dias incompletos, mais antigos primeiro */
  const { results: porCompletar } = await r.q(
    'SELECT data, impressoes, cliques FROM gsc_dias WHERE completo = 0 ORDER BY data ASC LIMIT 10').all();
  for (const d of porCompletar) {
    if (r.c.pedidos + CONJUNTOS.length > ORCAMENTO_GSC.pedidos || r.c.consultas + 7 > ORCAMENTO_GSC.consultas) break;
    const { results: feitos } = await r.q('SELECT conjunto FROM gsc_conjuntos WHERE data = ?').bind(d.data).all();
    const falta = CONJUNTOS.filter(c => !feitos.some(f => f.conjunto === c));
    const stmts = [];
    let falhou = null;
    for (const conjunto of falta) {
      const res = await lerConjunto(env, r, t.token, d.data, conjunto);
      if (!res.ok) { falhou = res; break; }
      const visC = res.linhas.reduce((s, l) => s + (l.clicks ?? 0), 0);
      const visI = res.linhas.reduce((s, l) => s + (l.impressions ?? 0), 0);
      stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO gsc_conjuntos
          (data, conjunto, linhas, cliques_visiveis, impressoes_visiveis, json) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(d.data, conjunto, res.linhas.length, visC, visI, JSON.stringify(compactar(res.linhas))));
    }
    if (!falhou) stmts.push(env.DB.prepare('UPDATE gsc_dias SET completo = 1 WHERE data = ?').bind(d.data));
    if (stmts.length) await r.lote(stmts);
    if (falhou) {
      if (falhou.motivo !== 'ORCAMENTO') await evento(r, 'GSC_' + falhou.motivo, falhou.detalhe);
      relatorio.motivo = falhou.motivo;
      break;
    }
    relatorio.dias_completos.push(d.data);
  }
  relatorio.orcamento = { ...r.c };
  return relatorio;
}

/* ------------------------------------------------------------- leitura -- */

export async function estadoSearchConsole(db, env) {
  const l = await db.prepare(`SELECT COUNT(*) AS dias, SUM(completo) AS completos, MIN(data) AS primeira, MAX(data) AS ultima
    FROM gsc_dias`).first();
  const ultimoEvento = await db.prepare(`SELECT tipo, detalhe, criado_em FROM eventos_operacionais
    WHERE tipo LIKE 'GSC_%' ORDER BY id DESC LIMIT 1`).first();
  return {
    credencial: temCredencialGoogle(env),
    dias: l?.dias ?? 0,
    completos: l?.completos ?? 0,
    primeira: l?.primeira ?? null,
    ultima: l?.ultima ?? null,
    ultimo_problema: ultimoEvento ?? null
  };
}

/* Um resumo de um período: totais verdadeiros, a parte visível, e a marca.
   «Desconhecido» = total − visível: o que o Google não mostra por linha. */
export async function resumoSearchConsole(db, { dias = 28 } = {}) {
  const ultima = (await db.prepare('SELECT MAX(data) AS d FROM gsc_dias WHERE completo = 1').first())?.d;
  if (!ultima) return { periodo: null };
  const inicio = new Date(Date.parse(ultima + 'T00:00:00Z') - (dias - 1) * 864e5).toISOString().slice(0, 10);

  const tot = await db.prepare(`SELECT COUNT(*) AS dias, SUM(cliques) AS cliques, SUM(impressoes) AS impressoes
    FROM gsc_dias WHERE completo = 1 AND data BETWEEN ? AND ?`).bind(inicio, ultima).first();
  const { results: termosLinhas } = await db.prepare('SELECT termo FROM termos_marca').all();
  const termos = termosLinhas.map(t => t.termo);

  const { results: blocos } = await db.prepare(`SELECT conjunto, json FROM gsc_conjuntos
    WHERE conjunto IN ('query', 'country') AND data BETWEEN ? AND ?`).bind(inicio, ultima).all();

  const marca = { BRANDED: { cliques: 0, impressoes: 0 }, NON_BRANDED: { cliques: 0, impressoes: 0 } };
  const linguas = {};
  const paises = {};
  let visQ = { cliques: 0, impressoes: 0 };
  for (const b of blocos) {
    for (const [valor, cliques, impressoes] of JSON.parse(b.json)) {
      if (b.conjunto === 'query') {
        const m = classificarMarca(valor, termos);
        marca[m].cliques += cliques; marca[m].impressoes += impressoes;
        visQ.cliques += cliques; visQ.impressoes += impressoes;
        const { lingua } = inferirLingua(valor);
        linguas[lingua] = (linguas[lingua] || 0) + impressoes;
      } else {
        paises[valor] = paises[valor] || { cliques: 0, impressoes: 0 };
        paises[valor].cliques += cliques; paises[valor].impressoes += impressoes;
      }
    }
  }
  const total = { cliques: tot?.cliques ?? 0, impressoes: tot?.impressoes ?? 0 };
  return {
    periodo: { inicio, fim: ultima, dias_com_dados: tot?.dias ?? 0 },
    totais: total,
    marca: {
      marca: marca.BRANDED,
      nao_marca: marca.NON_BRANDED,
      desconhecido: {
        cliques: Math.max(0, total.cliques - visQ.cliques),
        impressoes: Math.max(0, total.impressoes - visQ.impressoes)
      }
    },
    cobertura_queries: total.impressoes ? Math.round(visQ.impressoes / total.impressoes * 1000) / 10 : null,
    linguas_da_pesquisa_impressoes: linguas,
    paises: Object.entries(paises).sort((a, b) => b[1].impressoes - a[1].impressoes).slice(0, 12)
      .map(([pais, v]) => ({ pais, ...v }))
  };
}
