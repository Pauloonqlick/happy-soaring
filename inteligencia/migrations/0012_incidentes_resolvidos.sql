-- Um incidente pode ficar RESOLVIDO: com a causa confirmada e o que se fez.
--
-- O vigia abre e fecha incidentes sozinho, mas «fechado» só quer dizer que as tarefas
-- voltaram a correr — não que se sabe porquê nem que não volta. Até agora, um incidente
-- fechado continuava a aparecer no «Hoje» e na leitura durante 24 h com a causa
-- PROVÁVEL, mesmo depois de a causa estar confirmada e corrigida. O Paulo pediu que o
-- da noite de 13 para 14/09 deixasse de aparecer como ponto em aberto (14/09/2026).
--
-- Resolvido = fechado + causa confirmada + resolução. Um incidente resolvido deixa de
-- ser notícia no «Hoje» e na leitura; continua na operação, no registo e na semana,
-- com a causa e a resolução em vez da causa provável.

ALTER TABLE incidentes ADD COLUMN causa_confirmada TEXT;
ALTER TABLE incidentes ADD COLUMN resolucao TEXT;
ALTER TABLE incidentes ADD COLUMN resolvido_em TEXT;

UPDATE incidentes SET
  causa_confirmada = 'O plano gratuito da Cloudflare dá no máximo 10 ms de processamento por execução. As tarefas mais pesadas (publicações do site, detecção de problemas e decisões automáticas) passavam desse limite e eram cortadas a meio (estado exceededResources no histórico da Cloudflare).',
  resolucao = 'Plano Workers Paid activado a 14/09/2026, com um tecto de 1 s por execução — cerca de 15 vezes a execução mais pesada medida. Desde as 09:54 desse dia nenhuma execução foi cortada nem ficou por correr.',
  resolvido_em = '2026-09-14T19:00:00.000Z'
WHERE aberto_em = '2026-09-13T23:36:00.000Z' AND fechado_em IS NOT NULL;

UPDATE esquema_meta SET valor = '12' WHERE chave = 'versao_esquema';
