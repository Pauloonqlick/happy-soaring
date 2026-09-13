/* A agenda da tarefa agendada: UMA cron de 2 em 2 minutos (o plano gratuito tem
   5 por conta), repartida por minuto. É a mesma regra para correr e para mostrar. */
export const AGENDA = [
  { vez: 'search_console', titulo: 'Search Console', regra: 'minutos terminados em 0', corre: m => m % 10 === 0 },
  { vez: 'inspeccao', titulo: 'Inspecção de URL', regra: 'minutos terminados em 4', corre: m => m % 10 === 4 },
  { vez: 'assuntos', titulo: 'Detecção de problemas', regra: 'minutos 18, 38 e 58', corre: m => m % 20 === 18 },
  { vez: 'avisos', titulo: 'Avisos por email', regra: 'minuto 08 de cada hora', corre: m => m === 8 },
  { vez: 'decisoes', titulo: 'Decisões automáticas', regra: 'minutos 28 e 48', corre: m => m === 28 || m === 48 },
  { vez: 'publicacoes', titulo: 'Publicações do site', regra: 'restantes minutos pares', corre: () => true }
];

export function vezDoMinuto(minuto) {
  return AGENDA.find(a => a.corre(minuto)).vez;
}

/* A próxima execução de cada tarefa a partir de agora (a cron corre nos minutos pares). */
export function proximasExecucoes(agora = new Date().toISOString()) {
  const base = new Date(agora);
  base.setUTCSeconds(0, 0);
  const out = {};
  for (let i = 1; i <= 130 && Object.keys(out).length < AGENDA.length; i++) {
    const d = new Date(base.getTime() + i * 60000);
    const m = d.getUTCMinutes();
    if (m % 2) continue;
    const vez = vezDoMinuto(m);
    if (!out[vez]) out[vez] = d.toISOString();
  }
  return AGENDA.map(a => ({ vez: a.vez, titulo: a.titulo, regra: a.regra, proxima: out[a.vez] || null }));
}
