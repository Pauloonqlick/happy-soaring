-- «Semana em revista»: o texto de cada semana fica guardado tal como foi escrito.
--
-- Gera-se quando o Search Console fecha os 7 dias da semana (segunda a domingo), o que
-- costuma acontecer à terça ou à quarta. Guardar em vez de recalcular: o que o Paulo leu
-- numa semana não muda depois, mesmo que os dados de origem sejam limpos (14 dias de
-- execuções, por exemplo).

CREATE TABLE semanas_revista (
  semana     TEXT PRIMARY KEY,                   -- AAAA-MM-DD, a segunda-feira
  fim        TEXT NOT NULL,                      -- AAAA-MM-DD, o domingo
  gerada_em  TEXT NOT NULL,
  conteudo   TEXT NOT NULL                       -- JSON: secções e frases
);

UPDATE esquema_meta SET valor = '10' WHERE chave = 'versao_esquema';
