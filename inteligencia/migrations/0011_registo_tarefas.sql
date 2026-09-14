-- «Registo de tarefas»: o resumo de cada dia, por tarefa, guardado para sempre.
--
-- O Paulo pediu um registo das tarefas agendadas, das que estão a correr e dos outros
-- estados, por dia, semana e mês (14/09/2026). O detalhe execução a execução vive em
-- `execucoes`, que se limpa aos 14 dias; para a semana e o mês é preciso um resumo que
-- fique. Uma linha por dia (hora de Lisboa) e por tarefa: seis linhas por dia.
--
-- Escreve-se na execução do Search Console (de 10 em 10 minutos), para hoje e ontem, e
-- para qualquer dia ainda dentro dos 14 dias que não tenha resumo. Os estados são os do
-- vigia: OK, FALHOU, INTERROMPIDA, EM_FALTA.

CREATE TABLE execucoes_dia (
  dia               TEXT NOT NULL,               -- AAAA-MM-DD, dia de Lisboa
  vez               TEXT NOT NULL,               -- a tarefa (agenda.js)
  esperadas         INTEGER NOT NULL DEFAULT 0,  -- minutos em que devia ter corrido (até agora, se for hoje)
  ok                INTEGER NOT NULL DEFAULT 0,
  falhou            INTEGER NOT NULL DEFAULT 0,
  interrompidas     INTEGER NOT NULL DEFAULT 0,
  em_falta          INTEGER NOT NULL DEFAULT 0,
  duracao_media_ms  INTEGER,
  duracao_max_ms    INTEGER,
  trabalho          TEXT,                        -- JSON: contagens do que a tarefa fez (páginas, dias, …)
  completo          INTEGER NOT NULL DEFAULT 0,  -- 1 quando o dia já acabou e foi verificado
  actualizado_em    TEXT NOT NULL,
  PRIMARY KEY (dia, vez)
);

UPDATE esquema_meta SET valor = '11' WHERE chave = 'versao_esquema';
