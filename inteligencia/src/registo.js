/* Registo de tarefas — o que está agendado, o que está a correr e o que aconteceu,
   por dia, semana e mês (pedido do Paulo, 14/09/2026).

   DUAS FONTES
     execucoes       cada execução, com o resumo do que fez (limpa-se aos 14 dias)
     execucoes_dia   o resumo de cada dia por tarefa, que fica para sempre
   O dia é o de Lisboa. Os estados são os do vigia (vigia.js). O «o que fez» sai do
   resumo JSON que cada tarefa já devolvia — nada novo é recolhido para isto. */
import { TAREFAS as AGENDA, proximasExecucoes } from './agenda.js';
import { slotsEsperados, classificarSlots, descreverIncidente, MARGEM_MIN, INTERROMPIDA_APOS_MIN } from './vigia.js';

export const ZONA = 'Europe/Lisbon';
export const DIAS_DETALHE = 14;                 /* o mesmo que a limpeza de `execucoes` em index.js */
const MIN = 60000, DIA = 864e5;
const t = s => Date.parse(s);
const iso = ms => new Date(ms).toISOString();
const TITULO = Object.fromEntries(AGENDA.map(a => [a.vez, a.titulo]));
const PROBLEMAS = ['FALHOU', 'INTERROMPIDA', 'EM_FALTA'];

/* ---- datas de Lisboa ------------------------------------------------------ */
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function partes(ms) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return p;
}
export function diaLisboa(instante) {
  const p = partes(t(instante));
  return `${p.year}-${p.month}-${p.day}`;
}
/* minutos que Lisboa está à frente de UTC nesse instante (0 ou 60) */
function desvioMin(ms) {
  const p = partes(ms);
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((local - Math.floor(ms / MIN) * MIN) / MIN);
}
/* a meia-noite de Lisboa do dia que começa em `base` (meia-noite UTC), em UTC: o desvio
   certo é o que está em vigor NESSE instante — nos dias de mudança de hora o do meio-dia
   já é outro. Experimenta os dois candidatos e fica com o que bate certo. */
function meiaNoite(base) {
  for (const off of [desvioMin(base - 3 * 36e5), desvioMin(base + 3 * 36e5)]) {
    if (desvioMin(base - off * MIN) === off) return base - off * MIN;
  }
  return base - desvioMin(base) * MIN;
}
/* [início, fim) do dia de Lisboa em UTC */
export function limitesDia(dia) {
  const base = t(dia + 'T00:00:00Z');
  return [iso(meiaNoite(base)), iso(meiaNoite(base + DIA))];
}
export const somarDias = (dia, n) => iso(t(dia + 'T12:00:00Z') + n * DIA).slice(0, 10);
export function segundaDe(dia) {
  const d = new Date(dia + 'T12:00:00Z').getUTCDay();
  return somarDias(dia, -((d + 6) % 7));
}

/* ---- o que cada execução fez, dito por palavras ------------------------------ */
const pl = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
/* Devolve { texto, novidade, contagens }. `novidade` diz se fez alguma coisa além de verificar. Puro. */
export function trabalhoDe(vez, r) {
  if (!r || typeof r !== 'object') return { texto: null, novidade: false, contagens: {} };
  const c = {}, frases = [];
  const conta = (k, n, um, varios) => { n = Number(n) || 0; if (n > 0) { c[k] = n; frases.push(pl(n, um, varios)); } };
  if (vez === 'search_console') {
    conta('dias_novos', r.dias_novos, 'dia novo do Search Console', 'dias novos do Search Console');
    if (r.semana && r.semana.gerada) { c.semanas = 1; frases.push('escreveu a semana em revista'); }
    if (r.vigia && r.vigia.problemas) frases.push('o vigia viu ' + pl(r.vigia.problemas, 'problema', 'problemas'));
  } else if (vez === 'inspeccao') {
    conta('inspeccionadas', r.inspeccionadas, 'página inspeccionada', 'páginas inspeccionadas');
    conta('rastreios_novos', r.rastreios_novos, 'rastreio novo do Google', 'rastreios novos do Google');
    conta('inspeccoes_com_erro', r.com_erro, 'inspecção com erro', 'inspecções com erro');
  } else if (vez === 'assuntos') {
    conta('assuntos_novos', r.novos, 'problema novo detectado', 'problemas novos detectados');
    conta('assuntos_resolvidos', r.resolvidos, 'problema resolvido', 'problemas resolvidos');
    conta('avaliados', r.avaliados, 'correcção avaliada', 'correcções avaliadas');
  } else if (vez === 'avisos') {
    if (r.enviado) { c.avisos = 1; frases.push('enviou um aviso por email'); }
    if (r.consumos && r.consumos.aviso && r.consumos.aviso.enviado) { c.avisos = (c.avisos || 0) + 1; frases.push('avisou por email que a conta Cloudflare está perto do limite'); }
    const doc = r.documentacao;
    if (doc && doc.lida && !doc.primeira) {
      conta('documentacao_novas', doc.novas, 'mudança nova na documentação do Google', 'mudanças novas na documentação do Google');
      conta('documentacao_por_rever', doc.por_rever, 'lição a rever por mudança do Google', 'lições a rever por mudanças do Google');
    }
  } else if (vez === 'decisoes') {
    conta('decididos', r.decididos, 'decisão automática', 'decisões automáticas');
    conta('pacotes', r.pacotes, 'pacote de correcção criado', 'pacotes de correcção criados');
  } else if (vez === 'publicacoes') {
    conta('publicacoes_descobertas', r.descobertos, 'publicação nova do site', 'publicações novas do site');
    conta('publicacoes_lidas', Array.isArray(r.processados) ? r.processados.length : 0, 'publicação lida', 'publicações lidas');
  }
  const novidade = frases.length > 0;
  let texto = novidade ? frases.join(' · ') : 'verificou, sem novidades';
  if (vez === 'avisos' && !novidade) {
    const partes = [];
    if (r.consumos) partes.push(r.consumos.motivo === 'SEM_TOKEN' ? 'consumos por ler (falta o token da Cloudflare)'
      : r.consumos.erro || (r.consumos.erros && r.consumos.erros.length) ? 'consumos lidos com erros' : 'leu os consumos da Cloudflare');
    if (r.documentacao) partes.push(r.documentacao.erro ? 'documentação do Google por ler (erro)' : r.documentacao.lida ? 'leu a documentação do Google' : null);
    if (!r.enviado && r.motivo === 'SEM_CONFIGURACAO') partes.push('email em pausa (não configurado)');
    if (partes.filter(Boolean).length) texto = partes.filter(Boolean).join(' · ');
  }
  else if (r.motivo && !novidade) texto = 'não fez nada: ' + String(r.motivo).toLowerCase().replace(/_/g, ' ');
  return { texto, novidade, contagens: c };
}

/* ---- as linhas de um intervalo: o que devia correr + o que correu ------------ */
function lerResumo(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

/* Puro. `execs` são linhas de `execucoes` (com resumo). Devolve uma linha por minuto esperado,
   e mais as execuções recentes que ainda não entram na verificação (a correr). */
export function linhasDoIntervalo(desde, ate, execs, agora) {
  const limite = Math.min(t(ate), Math.floor((t(agora) - MARGEM_MIN * MIN) / MIN) * MIN);
  const slots = limite > t(desde) ? slotsEsperados(desde, iso(limite)) : [];
  const classificados = classificarSlots(slots, execs, agora);
  const porVez = new Map();
  for (const e of execs) { if (!porVez.has(e.vez)) porVez.set(e.vez, []); porVez.get(e.vez).push(e); }
  const usadas = new Set();
  const linhas = classificados.map(s => {
    const ini = t(s.em);
    const cand = (porVez.get(s.vez) || []).filter(e => t(e.inicio) >= ini && t(e.inicio) < ini + 2 * MIN);
    const e = cand.find(x => x.ok === 1) || cand.find(x => x.ok === 0) || cand[0] || null;
    if (e) usadas.add(e);
    const trab = s.estado === 'OK' ? trabalhoDe(s.vez, lerResumo(e && e.resumo)) : { texto: null, novidade: false, contagens: {} };
    return { em: s.em, vez: s.vez, titulo: TITULO[s.vez] || s.vez, estado: s.estado, inicio: e ? e.inicio : null,
      duracao_ms: e ? e.duracao_ms : null, o_que_fez: trab.texto, novidade: trab.novidade, contagens: trab.contagens,
      erro: s.estado === 'FALHOU' ? (s.erro || (e && e.erro) || null) : null };
  });
  /* as mais recentes (dentro da margem do vigia): mostram-se como estão */
  for (const e of execs) {
    if (usadas.has(e) || t(e.inicio) < limite || t(e.inicio) >= t(ate)) continue;
    const estado = e.ok === 1 ? 'OK' : e.ok === 0 ? 'FALHOU' : (t(agora) - t(e.inicio) < INTERROMPIDA_APOS_MIN * MIN ? 'A_CORRER' : 'INTERROMPIDA');
    const trab = estado === 'OK' ? trabalhoDe(e.vez, lerResumo(e.resumo)) : { texto: null, novidade: false, contagens: {} };
    linhas.push({ em: e.inicio, vez: e.vez, titulo: TITULO[e.vez] || e.vez, estado, inicio: e.inicio, duracao_ms: e.duracao_ms,
      o_que_fez: trab.texto, novidade: trab.novidade, contagens: trab.contagens, erro: estado === 'FALHOU' ? e.erro : null });
  }
  return linhas.sort((a, b) => t(b.em) - t(a.em));
}

/* Puro. Resume linhas por tarefa, no formato de `execucoes_dia`. */
export function resumirPorTarefa(linhas) {
  const out = Object.fromEntries(AGENDA.map(a => [a.vez, { vez: a.vez, titulo: a.titulo, esperadas: 0, ok: 0, falhou: 0, interrompidas: 0, em_falta: 0,
    a_correr: 0, duracao_media_ms: null, duracao_max_ms: null, trabalho: {} }]));
  const dur = {};
  for (const l of linhas) {
    const r = out[l.vez]; if (!r) continue;
    if (l.estado === 'A_CORRER') { r.a_correr++; continue; }
    r.esperadas++;
    if (l.estado === 'OK') r.ok++; else if (l.estado === 'FALHOU') r.falhou++; else if (l.estado === 'INTERROMPIDA') r.interrompidas++; else if (l.estado === 'EM_FALTA') r.em_falta++;
    if (l.duracao_ms != null) (dur[l.vez] || (dur[l.vez] = [])).push(l.duracao_ms);
    for (const [k, n] of Object.entries(l.contagens || {})) r.trabalho[k] = (r.trabalho[k] || 0) + n;
  }
  for (const [vez, ds] of Object.entries(dur)) {
    out[vez].duracao_media_ms = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
    out[vez].duracao_max_ms = Math.max(...ds);
  }
  return Object.values(out);
}

/* ---- a escrita: o resumo do dia, na execução do Search Console --------------- */
export async function executarAgregacao(db, { agora = new Date().toISOString() } = {}) {
  const primeira = await db.prepare('SELECT MIN(inicio) AS inicio FROM execucoes').first();
  if (!primeira?.inicio) return { dias: 0 };
  const hoje = diaLisboa(agora);
  const maisAntigo = [diaLisboa(primeira.inicio), somarDias(hoje, -(DIAS_DETALHE - 1))].sort()[1];
  const { results: feitos } = await db.prepare('SELECT DISTINCT dia FROM execucoes_dia WHERE completo = 1 AND dia >= ?').bind(maisAntigo).all();
  const completos = new Set(feitos.map(x => x.dia));
  const dias = [];
  for (let d = maisAntigo; d <= hoje; d = somarDias(d, 1)) if (!completos.has(d) || d >= somarDias(hoje, -1)) dias.push(d);
  if (!dias.length) return { dias: 0 };

  const [desde] = limitesDia(dias[0]);
  const [, ate] = limitesDia(hoje);
  const { results: execs } = await db.prepare('SELECT vez, inicio, duracao_ms, ok, resumo, erro FROM execucoes WHERE inicio >= ? AND inicio < ?')
    .bind(iso(t(desde) - 2 * MIN), ate).all();
  const verificadoAte = t(agora) - MARGEM_MIN * MIN;
  const stmts = [];
  for (const d of dias) {
    const [ini, fim] = limitesDia(d);
    /* o primeiro dia só conta a partir da primeira execução registada */
    const inicioReal = t(primeira.inicio) > t(ini) ? iso(Math.floor(t(primeira.inicio) / (2 * MIN)) * 2 * MIN) : ini;
    const doDia = execs.filter(e => t(e.inicio) >= t(ini) - 2 * MIN && t(e.inicio) < t(fim));
    const resumo = resumirPorTarefa(linhasDoIntervalo(inicioReal, fim, doDia, agora).filter(l => l.estado !== 'A_CORRER'));
    const completo = t(fim) <= verificadoAte ? 1 : 0;
    for (const r of resumo) {
      stmts.push(db.prepare(`INSERT OR REPLACE INTO execucoes_dia (dia, vez, esperadas, ok, falhou, interrompidas, em_falta,
          duracao_media_ms, duracao_max_ms, trabalho, completo, actualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(d, r.vez, r.esperadas, r.ok, r.falhou, r.interrompidas, r.em_falta, r.duracao_media_ms, r.duracao_max_ms,
          JSON.stringify(r.trabalho), completo, agora));
    }
  }
  if (stmts.length) await db.batch(stmts);
  return { dias: dias.length };
}

/* ---- a leitura: agora, datas marcadas e a vista pedida ---------------------- */
async function lerAgora(db, agora) {
  const [ultimas, aCorrer, incidente, meta, adiar] = await Promise.all([
    db.prepare(`SELECT e.vez, e.inicio, e.duracao_ms, e.ok, e.resumo, e.erro FROM execucoes e
      JOIN (SELECT vez, MAX(inicio) AS inicio FROM execucoes GROUP BY vez) u ON u.vez = e.vez AND u.inicio = e.inicio`).all(),
    db.prepare('SELECT vez, inicio FROM execucoes WHERE ok IS NULL AND inicio > ? ORDER BY inicio DESC').bind(iso(t(agora) - INTERROMPIDA_APOS_MIN * MIN)).all(),
    db.prepare('SELECT * FROM incidentes WHERE fechado_em IS NULL ORDER BY id DESC LIMIT 1').first(),
    db.prepare("SELECT chave, valor FROM esquema_meta WHERE chave IN ('inspeccao_pausa_ate', 'vigia_verificado_ate')").all(),
    db.prepare(`SELECT d.adiar_ate AS data, COUNT(*) AS n FROM assunto_decisoes d JOIN assuntos a ON a.chave = d.assunto_chave
      WHERE a.resolvido_em IS NULL AND d.decisao = 'ADIAR' AND d.adiar_ate >= ?
        AND d.id = (SELECT MAX(x.id) FROM assunto_decisoes x WHERE x.assunto_chave = d.assunto_chave)
      GROUP BY d.adiar_ate ORDER BY d.adiar_ate LIMIT 5`).bind(agora.slice(0, 10)).all()
  ]);
  const U = new Map(ultimas.results.map(x => [x.vez, x]));
  const M = Object.fromEntries(meta.results.map(x => [x.chave, x.valor]));
  const tarefas = proximasExecucoes(agora).map(a => {
    const u = U.get(a.vez);
    const estado = !u ? null : u.ok === 1 ? 'OK' : u.ok === 0 ? 'FALHOU' : (t(agora) - t(u.inicio) < INTERROMPIDA_APOS_MIN * MIN ? 'A_CORRER' : 'INTERROMPIDA');
    const trab = u && u.ok === 1 ? trabalhoDe(a.vez, lerResumo(u.resumo)) : null;
    let pausa = null;
    if (a.vez === 'avisos' && trab && /em pausa/.test(trab.texto)) pausa = 'O email de avisos não está configurado: a tarefa corre, mas não envia nada.';
    if (a.vez === 'inspeccao' && M.inspeccao_pausa_ate && t(M.inspeccao_pausa_ate) > t(agora)) pausa = 'Em pausa até ' + M.inspeccao_pausa_ate + ' (quota do Google).';
    return { ...a, ultima: u ? { inicio: u.inicio, duracao_ms: u.duracao_ms, estado, o_que_fez: trab ? trab.texto : null, erro: u.ok === 0 ? u.erro : null } : null, pausa };
  });
  const datas = [];
  for (const x of adiar.results) datas.push({ data: x.data, texto: 'Acaba a espera de ' + pl(x.n, 'problema adiado', 'problemas adiados') + '; o módulo volta a decidir.' });
  if (M.inspeccao_pausa_ate && t(M.inspeccao_pausa_ate) > t(agora)) datas.push({ data: M.inspeccao_pausa_ate, texto: 'A inspecção de URL volta a correr.' });
  return {
    tarefas,
    a_correr: aCorrer.results.map(x => ({ vez: x.vez, titulo: TITULO[x.vez] || x.vez, inicio: x.inicio })),
    incidente_aberto: incidente ? descreverIncidente(incidente, agora) : null,
    vigia_verificado_ate: M.vigia_verificado_ate || null,
    datas_marcadas: datas.sort((a, b) => a.data < b.data ? -1 : 1)
  };
}

const juntarTrabalho = (a, b) => { for (const [k, n] of Object.entries(b || {})) a[k] = (a[k] || 0) + n; return a; };
const trabalhoJson = s => { try { return s ? JSON.parse(s) : {}; } catch (e) { return {}; } };

async function incidentesEntre(db, desde, ate, agora) {
  const { results } = await db.prepare('SELECT * FROM incidentes WHERE aberto_em < ? AND (fechado_em IS NULL OR fechado_em >= ?) ORDER BY aberto_em DESC')
    .bind(ate, desde).all();
  return results.map(i => descreverIncidente(i, agora));
}

/* dias (hora de Lisboa) de `dias[]`, com totais do dia e por tarefa. Hoje e ontem calculam-se na hora. */
async function resumosDosDias(db, dias, agora) {
  const hoje = diaLisboa(agora);
  const { results } = await db.prepare(`SELECT * FROM execucoes_dia WHERE dia >= ? AND dia <= ?`).bind(dias[0], dias[dias.length - 1]).all();
  const porDia = new Map();
  for (const r of results) { if (!porDia.has(r.dia)) porDia.set(r.dia, []); porDia.get(r.dia).push({ ...r, trabalho: trabalhoJson(r.trabalho) }); }
  const vivos = dias.filter(d => d >= somarDias(hoje, -1) && d <= hoje);
  if (vivos.length) {
    const [ini] = limitesDia(vivos[0]), [, fim] = limitesDia(vivos[vivos.length - 1]);
    const primeira = await db.prepare('SELECT MIN(inicio) AS inicio FROM execucoes').first();
    const { results: execs } = await db.prepare('SELECT vez, inicio, duracao_ms, ok, resumo, erro FROM execucoes WHERE inicio >= ? AND inicio < ?')
      .bind(iso(t(ini) - 2 * MIN), fim).all();
    for (const d of vivos) {
      const [a, b] = limitesDia(d);
      if (!primeira?.inicio || t(primeira.inicio) >= t(b)) continue;
      const desde = t(primeira.inicio) > t(a) ? iso(Math.floor(t(primeira.inicio) / (2 * MIN)) * 2 * MIN) : a;
      const linhas = linhasDoIntervalo(desde, b, execs.filter(e => t(e.inicio) >= t(a) - 2 * MIN && t(e.inicio) < t(b)), agora);
      porDia.set(d, resumirPorTarefa(linhas).map(r => ({ ...r, dia: d, completo: d < hoje ? 1 : 0 })));
    }
  }
  return dias.map(d => {
    const tarefas = porDia.get(d) || [];
    const tot = { esperadas: 0, ok: 0, falhou: 0, interrompidas: 0, em_falta: 0 };
    const trabalho = {};
    for (const r of tarefas) { for (const k of Object.keys(tot)) tot[k] += r[k] || 0; juntarTrabalho(trabalho, r.trabalho); }
    return {
      dia: d, com_registo: tarefas.length > 0, futuro: d > hoje, hoje: d === hoje, ...tot, trabalho,
      tarefas: AGENDA.map(a => {
        const r = tarefas.find(x => x.vez === a.vez);
        return { vez: a.vez, titulo: a.titulo, esperadas: r?.esperadas || 0, ok: r?.ok || 0, falhou: r?.falhou || 0, interrompidas: r?.interrompidas || 0,
          em_falta: r?.em_falta || 0, duracao_media_ms: r?.duracao_media_ms ?? null, trabalho: r?.trabalho || {} };
      })
    };
  });
}

export async function lerRegisto(env, { vista = 'dia', data = null, agora = new Date().toISOString() } = {}) {
  const db = env.DB;
  const hoje = diaLisboa(agora);
  const base = { agora, hoje, vista, ...(await lerAgora(db, agora)) };

  if (vista === 'mes') {
    const mes = /^\d{4}-\d{2}$/.test(data || '') ? data : hoje.slice(0, 7);
    const dias = [];
    for (let d = mes + '-01'; d.slice(0, 7) === mes; d = somarDias(d, 1)) dias.push(d);
    const resumo = await resumosDosDias(db, dias, agora);
    const [ini] = limitesDia(dias[0]), [, fim] = limitesDia(dias[dias.length - 1]);
    return { ...base, mes, anterior: somarDias(mes + '-01', -1).slice(0, 7), seguinte: somarDias(dias[dias.length - 1], 1).slice(0, 7),
      dias: resumo, incidentes: await incidentesEntre(db, ini, fim, agora) };
  }
  if (vista === 'semana') {
    const seg = segundaDe(/^\d{4}-\d{2}-\d{2}$/.test(data || '') ? data : hoje);
    const dias = Array.from({ length: 7 }, (_, i) => somarDias(seg, i));
    const resumo = await resumosDosDias(db, dias, agora);
    const [ini] = limitesDia(dias[0]), [, fim] = limitesDia(dias[6]);
    return { ...base, semana: seg, fim: dias[6], anterior: somarDias(seg, -7), seguinte: somarDias(seg, 7),
      dias: resumo, incidentes: await incidentesEntre(db, ini, fim, agora) };
  }
  /* dia */
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(data || '') ? data : hoje;
  const [ini, fim] = limitesDia(dia);
  const primeira = await db.prepare('SELECT MIN(inicio) AS inicio FROM execucoes').first();
  const comDetalhe = !!primeira?.inicio && dia >= somarDias(hoje, -(DIAS_DETALHE - 1)) && t(primeira.inicio) < t(fim);
  let linhas = [], tarefas = [];
  if (comDetalhe) {
    const desde = t(primeira.inicio) > t(ini) ? iso(Math.floor(t(primeira.inicio) / (2 * MIN)) * 2 * MIN) : ini;
    const { results: execs } = await db.prepare('SELECT vez, inicio, duracao_ms, ok, resumo, erro FROM execucoes WHERE inicio >= ? AND inicio < ?')
      .bind(iso(t(ini) - 2 * MIN), fim).all();
    linhas = linhasDoIntervalo(desde, fim, execs, agora);
    tarefas = resumirPorTarefa(linhas);
  } else {
    tarefas = (await resumosDosDias(db, [dia], agora))[0].tarefas;
  }
  return { ...base, dia, anterior: somarDias(dia, -1), seguinte: somarDias(dia, 1), com_detalhe: comDetalhe,
    dias_detalhe: DIAS_DETALHE, tarefas_do_dia: tarefas, linhas, incidentes: await incidentesEntre(db, ini, fim, agora) };
}
