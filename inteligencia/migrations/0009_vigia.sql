-- Vigia da tarefa agendada — para nunca mais ficarmos sem saber que o módulo parou.
--
-- Na noite de 13 para 14/09/2026 a Cloudflare cortou a meio, durante 9 horas, as execuções
-- de publicações, assuntos e decisões (limite de processamento do plano gratuito). Uma
-- execução cortada não chegava a escrever o seu registo, e por isso ninguém viu nada.
--
-- execucoes: passa a ser escrita ANTES de a tarefa começar (ok vazio) e fechada no fim.
--   ok vazio há mais de 5 minutos = execução interrompida. (O SQLite não altera a
--   restrição NOT NULL de uma coluna: a tabela é refeita com os mesmos dados.)
-- incidentes: aberto pelo vigia quando há execuções interrompidas, falhadas ou em falta;
--   fechado quando tudo volta a correr. Guarda-se tudo (são poucas linhas).

CREATE TABLE execucoes_nova (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vez         TEXT NOT NULL,                     -- publicacoes, search_console, inspeccao, assuntos, decisoes, avisos
  inicio      TEXT NOT NULL,
  duracao_ms  INTEGER,
  ok          INTEGER CHECK (ok IN (0, 1)),      -- vazio: a correr ou interrompida
  resumo      TEXT,
  erro        TEXT
);
INSERT INTO execucoes_nova (id, vez, inicio, duracao_ms, ok, resumo, erro)
  SELECT id, vez, inicio, duracao_ms, ok, resumo, erro FROM execucoes;
DROP TABLE execucoes;
ALTER TABLE execucoes_nova RENAME TO execucoes;
CREATE INDEX execucoes_por_vez ON execucoes (vez, inicio);
CREATE INDEX execucoes_por_inicio ON execucoes (inicio);

CREATE TABLE incidentes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  aberto_em           TEXT NOT NULL,             -- a primeira execução com problema
  ultimo_problema_em  TEXT NOT NULL,
  fechado_em          TEXT,                      -- vazio: ainda aberto
  contagens           TEXT NOT NULL,             -- JSON {vez: {INTERROMPIDA, FALHOU, EM_FALTA}}
  ultimo_erro         TEXT
);
CREATE INDEX incidentes_abertos ON incidentes (fechado_em, aberto_em);

-- O incidente que deu origem a isto, com os números do histórico de execuções agendadas
-- da Cloudflare (estado exceededResources, minuto a minuto). O vigia começa depois dele.
INSERT INTO incidentes (aberto_em, ultimo_problema_em, fechado_em, contagens, ultimo_erro) VALUES (
  '2026-09-13T23:36:00.000Z', '2026-09-14T08:52:00.000Z', '2026-09-14T08:54:00.000Z',
  '{"publicacoes":{"INTERROMPIDA":112},"assuntos":{"INTERROMPIDA":28},"decisoes":{"INTERROMPIDA":19}}',
  'exceededResources — limite de 10 ms de processamento do plano gratuito (resolvido com o plano Workers Paid)'
);
INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('vigia_verificado_ate', '2026-09-14T09:00:00.000Z');

UPDATE esquema_meta SET valor = '9' WHERE chave = 'versao_esquema';
