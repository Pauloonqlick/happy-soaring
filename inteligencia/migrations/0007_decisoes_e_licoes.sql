-- Decisões automáticas e aprendizagem.
--
-- O Paulo deixa de gerir assuntos: o módulo decide por regras e o Claude
-- implementa; o Paulo pode contrariar qualquer decisão. Cada decisão guarda
-- quem a tomou.
--
-- LIÇÕES — o que o site ensinou. Cada lição descreve um tipo de erro (sintoma,
-- causa, correcção, prevenção) e reconhece-o na evidência de um assunto. Os
-- resultados NÃO se escrevem à mão: contam-se das avaliações dos pacotes e dos
-- assuntos que ela reconheceu. Uma lição só passa a confirmada com resultados;
-- a que não resultou fica refutada e deixa de ser aplicada sozinha.
-- As lições confirmadas e em teste formam o manual de boas práticas.

ALTER TABLE assunto_decisoes ADD COLUMN decidido_por TEXT NOT NULL DEFAULT 'PAULO'
  CHECK (decidido_por IN ('PAULO', 'MODULO', 'CLAUDE'));

ALTER TABLE pacotes_trabalho ADD COLUMN licao_chave TEXT;
ALTER TABLE pacotes_trabalho ADD COLUMN implementacao TEXT;   -- JSON: commit, em, notas

CREATE TABLE licoes (
  chave        TEXT PRIMARY KEY,                -- ex.: dados-estruturados/product-sem-preco
  tipo_assunto TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  titulo       TEXT NOT NULL,
  padrao       TEXT,                            -- expressão regular sobre a evidência; vazio = todo o tipo
  prioridade   INTEGER NOT NULL DEFAULT 100,    -- menor primeiro, quando várias reconhecem o mesmo caso
  sintoma      TEXT NOT NULL,
  causa        TEXT NOT NULL,
  correccao    TEXT NOT NULL,
  prevencao    TEXT NOT NULL,                   -- a boa prática, para este e para outros sites
  generica     INTEGER NOT NULL DEFAULT 1 CHECK (generica IN (0, 1)),
  origem       TEXT NOT NULL DEFAULT 'CLAUDE' CHECK (origem IN ('CLAUDE', 'PAULO', 'MODULO')),
  versao       INTEGER NOT NULL DEFAULT 1,
  criada_em    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  alterada_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE licoes_historico (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chave      TEXT NOT NULL,
  versao     INTEGER NOT NULL,
  dados      TEXT NOT NULL,
  gravado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (chave, versao)
);

UPDATE esquema_meta SET valor = '7' WHERE chave = 'versao_esquema';
