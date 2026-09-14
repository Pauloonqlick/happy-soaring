/* Vigia da tarefa agendada: garante que, se o módulo deixar de trabalhar, fica escrito.

   Cada execução regista-se ANTES de começar (ok vazio) e fecha o registo no fim.
   A agenda diz que tarefa devia ter corrido em cada minuto par; o vigia compara:
     OK            — correu e acabou
     FALHOU        — correu e deu erro
     INTERROMPIDA  — começou e nunca acabou (cortada a meio, p. ex. pela Cloudflare)
     EM_FALTA      — nem sequer começou
   Dois problemas a menos de 20 minutos um do outro abrem um incidente; 20 minutos
   seguidos sem problemas fecham-no. Um problema isolado (p. ex. durante uma
   publicação do módulo) fica nas contagens da operação, mas não é incidente.

   O vigia corre na execução do Search Console (a mais leve). Se a tarefa agendada
   parar por completo, o vigia pára com ela: o buraco é apanhado quando volta, porque
   o vigia verifica sempre desde o ponto onde ficou (até 24 h para trás). */
import { vezDoMinuto, AGENDA } from './agenda.js';

const MIN = 60000;
const t = s => Date.parse(s);
const iso = ms => new Date(ms).toISOString();

export const MARGEM_MIN = 6;               /* as execuções mais recentes ainda podem estar a correr */
export const INTERROMPIDA_APOS_MIN = 5;
export const ENTRE_PROBLEMAS_MIN = 20;
export const JANELA_MAX_H = 24;
const ESTADOS_PROBLEMA = ['INTERROMPIDA', 'FALHOU', 'EM_FALTA'];

/* Os minutos pares em [desde, ate) e a tarefa que devia ter corrido em cada um. Puro. */
export function slotsEsperados(desde, ate) {
  const out = [];
  for (let s = Math.ceil(t(desde) / (2 * MIN)) * 2 * MIN; s < t(ate); s += 2 * MIN) {
    out.push({ em: iso(s), vez: vezDoMinuto(new Date(s).getUTCMinutes()) });
  }
  return out;
}

/* O que aconteceu em cada minuto esperado, a partir das linhas de `execucoes`. Puro. */
export function classificarSlots(slots, execucoes, agora) {
  const porVez = new Map();
  for (const e of execucoes) {
    if (!porVez.has(e.vez)) porVez.set(e.vez, []);
    porVez.get(e.vez).push(e);
  }
  return slots.map(s => {
    const ini = t(s.em);
    const candidatas = (porVez.get(s.vez) || []).filter(e => t(e.inicio) >= ini && t(e.inicio) < ini + 2 * MIN);
    if (!candidatas.length) return { ...s, estado: 'EM_FALTA' };
    if (candidatas.some(e => e.ok === 1)) return { ...s, estado: 'OK' };
    const falhou = candidatas.find(e => e.ok === 0);
    if (falhou) return { ...s, estado: 'FALHOU', erro: falhou.erro || null };
    const recente = candidatas.some(e => t(agora) - t(e.inicio) < INTERROMPIDA_APOS_MIN * MIN);
    return { ...s, estado: recente ? 'A_CORRER' : 'INTERROMPIDA' };
  });
}

/* Abre, prolonga e fecha incidentes percorrendo os minutos por ordem. Puro.
   Devolve os incidentes que mudaram (com id: actualizar; sem id: inserir). */
export function planearIncidentes(aberto, classificados, verificadoAte) {
  const mudaram = [];
  let actual = aberto ? { ...aberto, contagens: typeof aberto.contagens === 'string' ? JSON.parse(aberto.contagens) : aberto.contagens } : null;
  let candidato = null;
  const somar = (inc, s) => {
    const c = inc.contagens[s.vez] || (inc.contagens[s.vez] = {});
    c[s.estado] = (c[s.estado] || 0) + 1;
    inc.ultimo_problema_em = s.em;
    if (s.erro) inc.ultimo_erro = s.erro;
  };
  const fecharSeCalmo = ate => {
    if (actual && t(ate) - t(actual.ultimo_problema_em) >= ENTRE_PROBLEMAS_MIN * MIN) {
      actual.fechado_em = iso(t(actual.ultimo_problema_em) + 2 * MIN);
      mudaram.push(actual);
      actual = null;
    }
  };
  for (const s of classificados) {
    if (!ESTADOS_PROBLEMA.includes(s.estado)) { fecharSeCalmo(s.em); continue; }
    fecharSeCalmo(s.em);
    if (actual) { somar(actual, s); continue; }
    if (candidato && t(s.em) - t(candidato.em) < ENTRE_PROBLEMAS_MIN * MIN) {
      actual = { aberto_em: candidato.em, fechado_em: null, contagens: {}, ultimo_erro: null, ultimo_problema_em: candidato.em };
      somar(actual, candidato);
      somar(actual, s);
      candidato = null;
    } else {
      candidato = s;
    }
  }
  fecharSeCalmo(verificadoAte);
  if (actual) mudaram.push(actual);
  return mudaram;
}

export async function executarVigia(db, { agora = new Date().toISOString() } = {}) {
  const ate = iso(Math.floor((t(agora) - MARGEM_MIN * MIN) / MIN) * MIN);
  const [meta, primeira, aberto] = await Promise.all([
    db.prepare("SELECT valor FROM esquema_meta WHERE chave = 'vigia_verificado_ate'").first(),
    db.prepare('SELECT MIN(inicio) AS inicio FROM execucoes').first(),
    db.prepare('SELECT * FROM incidentes WHERE fechado_em IS NULL ORDER BY id DESC LIMIT 1').first()
  ]);
  let desde = meta?.valor || iso(t(agora) - 30 * MIN);
  if (t(desde) < t(agora) - JANELA_MAX_H * 36e5) desde = iso(t(agora) - JANELA_MAX_H * 36e5);
  /* antes do primeiro registo não há como saber o que correu */
  if (!primeira?.inicio) return { verificadas: 0, problemas: 0, incidentes_alterados: 0 };
  if (t(desde) < t(primeira.inicio)) desde = primeira.inicio;
  if (t(desde) >= t(ate)) return { verificadas: 0, problemas: 0, incidentes_alterados: 0 };

  const { results: execs } = await db.prepare('SELECT vez, inicio, ok, erro FROM execucoes WHERE inicio >= ? AND inicio < ?')
    .bind(desde, iso(t(ate) + 2 * MIN)).all();
  let classificados = classificarSlots(slotsEsperados(desde, ate), execs, agora);
  /* uma execução ainda a correr: verifica-se outra vez na próxima volta */
  const aCorrer = classificados.findIndex(s => s.estado === 'A_CORRER');
  const verificadoAte = aCorrer >= 0 ? classificados[aCorrer].em : ate;
  if (aCorrer >= 0) classificados = classificados.slice(0, aCorrer);

  const mudaram = planearIncidentes(aberto, classificados, verificadoAte);
  const stmts = mudaram.map(i => i.id
    ? db.prepare('UPDATE incidentes SET ultimo_problema_em = ?, fechado_em = ?, contagens = ?, ultimo_erro = ? WHERE id = ?')
      .bind(i.ultimo_problema_em, i.fechado_em, JSON.stringify(i.contagens), i.ultimo_erro, i.id)
    : db.prepare('INSERT INTO incidentes (aberto_em, ultimo_problema_em, fechado_em, contagens, ultimo_erro) VALUES (?, ?, ?, ?, ?)')
      .bind(i.aberto_em, i.ultimo_problema_em, i.fechado_em, JSON.stringify(i.contagens), i.ultimo_erro));
  stmts.push(db.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('vigia_verificado_ate', ?)").bind(verificadoAte));
  await db.batch(stmts);
  return {
    verificadas: classificados.length,
    problemas: classificados.filter(s => ESTADOS_PROBLEMA.includes(s.estado)).length,
    incidentes_alterados: mudaram.length,
    incidente_aberto: mudaram.some(i => !i.fechado_em)
  };
}

const TITULO = Object.fromEntries(AGENDA.map(a => [a.vez, a.titulo]));

/* Um incidente em linguagem de pessoa. Puro. */
export function descreverIncidente(i, agora = new Date().toISOString()) {
  const contagens = typeof i.contagens === 'string' ? JSON.parse(i.contagens) : i.contagens;
  const total = { INTERROMPIDA: 0, FALHOU: 0, EM_FALTA: 0 };
  const tarefas = [];
  for (const [vez, c] of Object.entries(contagens)) {
    let n = 0;
    for (const k of ESTADOS_PROBLEMA) { total[k] += c[k] || 0; n += c[k] || 0; }
    tarefas.push({ vez, titulo: TITULO[vez] || vez, execucoes: n });
  }
  tarefas.sort((a, b) => b.execucoes - a.execucoes);
  const perdidas = total.INTERROMPIDA + total.FALHOU + total.EM_FALTA;
  const maior = Object.entries(total).sort((a, b) => b[1] - a[1])[0][0];
  const causa = maior === 'INTERROMPIDA'
    ? 'Execuções cortadas a meio antes de acabarem — normalmente a Cloudflare a travar por tempo de processamento ou memória.'
    : maior === 'FALHOU'
      ? 'A própria tarefa deu erro' + (i.ultimo_erro ? ': ' + i.ultimo_erro : '.')
      : 'A tarefa agendada não chegou a correr (a Cloudflare não a lançou).';
  const fim = i.fechado_em || agora;
  return {
    id: i.id, aberto: !i.fechado_em, aberto_em: i.aberto_em, fechado_em: i.fechado_em || null,
    ultimo_problema_em: i.ultimo_problema_em, duracao_min: Math.round((t(fim) - t(i.aberto_em)) / MIN),
    execucoes_perdidas: perdidas, por_estado: total, tarefas, causa_provavel: causa, ultimo_erro: i.ultimo_erro || null,
    /* resolvido: fechado, com a causa confirmada e o que se fez (0012) */
    resolvido: !!(i.fechado_em && i.resolucao), causa_confirmada: i.causa_confirmada || null,
    resolucao: i.resolucao || null, resolvido_em: i.resolvido_em || null,
    causa: i.causa_confirmada || causa
  };
}

/* Para o «Hoje»: o incidente aberto, ou um que tenha fechado há menos de 24 h e durado
   pelo menos 30 minutos (os soluços curtos ficam só na página de operação). Um incidente
   já RESOLVIDO (causa confirmada e corrigida) deixa de ser notícia. */
export async function incidentesParaHoje(db, agora = new Date().toISOString()) {
  const { results } = await db.prepare('SELECT * FROM incidentes WHERE fechado_em IS NULL OR fechado_em > ? ORDER BY aberto_em DESC LIMIT 5')
    .bind(iso(t(agora) - 24 * 36e5)).all();
  return results.map(i => descreverIncidente(i, agora)).filter(i => !i.resolvido && (i.aberto || i.duracao_min >= 30));
}
