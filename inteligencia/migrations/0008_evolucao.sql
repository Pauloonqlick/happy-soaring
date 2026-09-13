-- Painel «Evolução» — dados que faltavam para as análises de operação, indexação e página × língua.
--
-- versoes: as ligações hreflang que a própria página publica ({"pt": "/asas/x/", "en": "/en/wings/x/", …}).
--   É o site que diz quais são as versões linguísticas de uma página conceptual;
--   o módulo não as adivinha pelo nome do endereço.
-- execucoes: cada execução da tarefa agendada, para se ver o que correu, quando, quanto
--   demorou e se falhou. Guardam-se 14 dias.

ALTER TABLE deployment_paginas ADD COLUMN versoes TEXT;

CREATE TABLE execucoes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  vez         TEXT NOT NULL,                     -- publicacoes, search_console, inspeccao, assuntos, decisoes, avisos
  inicio      TEXT NOT NULL,
  duracao_ms  INTEGER,
  ok          INTEGER NOT NULL CHECK (ok IN (0, 1)),
  resumo      TEXT,                              -- JSON curto do relatório
  erro        TEXT
);
CREATE INDEX execucoes_por_vez ON execucoes (vez, inicio);

UPDATE esquema_meta SET valor = '8' WHERE chave = 'versao_esquema';
