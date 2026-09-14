/* A agenda da tarefa agendada: UMA cron de 2 em 2 minutos (o plano gratuito tem
   5 por conta), repartida por minuto. É a mesma regra para correr e para mostrar.

   14/09/2026 · MENOS VERIFICAÇÕES SEM RAZÃO (pedido do Paulo)
   As publicações do site corriam em todos os minutos pares que sobravam (12 por hora) e o
   Search Console de 10 em 10 minutos — o Google só actualiza estes dados uma vez por dia.
   A partir de MUDANCA_AGENDA:
     publicações      minutos terminados em 2            (6 por hora)
     Search Console   minuto 00 de cada hora             (1 por hora; o vigia e o resumo
                                                          do dia vão com ele)
     os outros minutos pares ficam em REPOUSO: a cron acorda, vê que não há nada para
     fazer e sai — sem registo, sem ler a base.
   As outras tarefas ficam iguais.

   PORQUE HÁ DUAS AGENDAS
   O vigia e o «Registo» verificam o passado minuto a minuto: antes da mudança, o que devia
   ter corrido é o da agenda antiga. A nova é um subconjunto da antiga (cada tarefa nova está
   num minuto em que a antiga já corria a mesma tarefa), por isso a hora exacta da
   publicação não cria faltas falsas, seja antes ou depois desta data. */
export const MUDANCA_AGENDA = '2026-09-14T23:00:00.000Z';   /* meia-noite de 15/09 em Lisboa */

export const AGENDA = [
  { vez: 'search_console', titulo: 'Search Console', regra: 'minuto 00 de cada hora', corre: m => m === 0 },
  { vez: 'inspeccao', titulo: 'Inspecção de URL', regra: 'minutos terminados em 4', corre: m => m % 10 === 4 },
  { vez: 'assuntos', titulo: 'Detecção de problemas', regra: 'minutos 18, 38 e 58', corre: m => m % 20 === 18 },
  { vez: 'avisos', titulo: 'Avisos e consumos', regra: 'minuto 08 de cada hora', corre: m => m === 8 },
  { vez: 'decisoes', titulo: 'Decisões automáticas', regra: 'minutos 28 e 48', corre: m => m === 28 || m === 48 },
  { vez: 'publicacoes', titulo: 'Publicações do site', regra: 'minutos terminados em 2', corre: m => m % 10 === 2 },
  { vez: 'repouso', titulo: 'Sem tarefa', regra: 'restantes minutos pares', corre: () => true, repouso: true }
];
/* só as tarefas a sério: o que se mostra e o que se verifica */
export const TAREFAS = AGENDA.filter(a => !a.repouso);

const AGENDA_ANTIGA = [
  { vez: 'search_console', corre: m => m % 10 === 0 },
  { vez: 'inspeccao', corre: m => m % 10 === 4 },
  { vez: 'assuntos', corre: m => m % 20 === 18 },
  { vez: 'avisos', corre: m => m === 8 },
  { vez: 'decisoes', corre: m => m === 28 || m === 48 },
  { vez: 'publicacoes', corre: () => true }
];

/* A tarefa de um minuto par, com a agenda em vigor no `instante` (ISO ou ms; sem ele, agora). */
export function vezDoMinuto(minuto, instante = null) {
  const quando = instante == null ? Date.now() : typeof instante === 'number' ? instante : Date.parse(instante);
  const agenda = quando < Date.parse(MUDANCA_AGENDA) ? AGENDA_ANTIGA : AGENDA;
  return agenda.find(a => a.corre(minuto)).vez;
}

/* A próxima execução de cada tarefa a partir de agora (a cron corre nos minutos pares). */
export function proximasExecucoes(agora = new Date().toISOString()) {
  const base = new Date(agora);
  base.setUTCSeconds(0, 0);
  const out = {};
  for (let i = 1; i <= 130 && Object.keys(out).length < TAREFAS.length; i++) {
    const d = new Date(base.getTime() + i * 60000);
    const m = d.getUTCMinutes();
    if (m % 2) continue;
    const vez = vezDoMinuto(m, d.getTime());
    if (vez !== 'repouso' && !out[vez]) out[vez] = d.toISOString();
  }
  return TAREFAS.map(a => ({ vez: a.vez, titulo: a.titulo, regra: a.regra, proxima: out[a.vez] || null }));
}
