-- Fase 1 — configuração base do módulo de inteligência.
-- Só configuração. Observações, assuntos e decisões entram em migrações
-- próprias nas fases seguintes.
--
-- Regras da especificação que este esquema respeita:
--   * objectivos de negócio acrescentam-se sem redesenhar; a importância
--     é configurável e começa POR DEFINIR (NULL), sem ordem permanente;
--   * país ≠ língua: o mercado guarda o país e as línguas em separado,
--     e o que não se sabe fica 'UNKNOWN' — nunca deduzido do país;
--   * concorrentes concretos são dados, não código: a tabela começa vazia.

CREATE TABLE esquema_meta (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE objectivos_negocio (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  importancia TEXT CHECK (importancia IS NULL OR importancia IN ('ALTA', 'MEDIA', 'BAIXA')),
  ordem_ecra  INTEGER NOT NULL DEFAULT 100,   -- só a ordem de apresentação, não prioridade
  activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE mercados (
  id               TEXT PRIMARY KEY,
  pais             TEXT NOT NULL,                      -- país de onde se pesquisa (ISO 3166-1 alfa-2)
  lingua_pesquisa  TEXT NOT NULL DEFAULT 'UNKNOWN',    -- BCP 47, ou UNKNOWN
  lingua_interface TEXT NOT NULL DEFAULT 'UNKNOWN',    -- língua da interface do Google, ou UNKNOWN
  dispositivo      TEXT NOT NULL DEFAULT 'desktop' CHECK (dispositivo IN ('desktop', 'mobile')),
  notas            TEXT,
  activo           INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  criado_em        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE mercado_objectivo (
  mercado_id   TEXT NOT NULL REFERENCES mercados(id),
  objectivo_id TEXT NOT NULL REFERENCES objectivos_negocio(id),
  PRIMARY KEY (mercado_id, objectivo_id)
);

CREATE TABLE termos_marca (
  termo     TEXT PRIMARY KEY,                -- em minúsculas
  tipo      TEXT NOT NULL CHECK (tipo IN ('MARCA', 'METODO', 'NOME_ANTIGO')),
  notas     TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE concorrentes (
  id        TEXT PRIMARY KEY,
  dominio   TEXT NOT NULL,
  nome      TEXT,
  tipo      TEXT NOT NULL CHECK (tipo IN ('DIRECTO', 'COMERCIAL', 'FABRICANTE', 'PARCEIRO',
                                          'EDITORIAL', 'COMUNIDADE', 'PLATAFORMA', 'AGREGADOR')),
  notas     TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE concorrente_objectivo (
  concorrente_id TEXT NOT NULL REFERENCES concorrentes(id),
  objectivo_id   TEXT NOT NULL REFERENCES objectivos_negocio(id),
  directo        INTEGER NOT NULL DEFAULT 0 CHECK (directo IN (0, 1)),
  PRIMARY KEY (concorrente_id, objectivo_id)
);

CREATE TABLE niveis_pagina (
  caminho TEXT PRIMARY KEY,                  -- caminho da página conceptual, ex. /o-que-e-um-parakite/
  nivel   INTEGER NOT NULL CHECK (nivel IN (1, 2, 3)),
  notas   TEXT
);

INSERT INTO esquema_meta (chave, valor) VALUES ('versao_esquema', '1');

-- Os objectivos que o Paulo definiu. Importância por definir.
INSERT INTO objectivos_negocio (id, nome, descricao, ordem_ecra) VALUES
  ('voos',     'Voos de parapente',                 NULL, 10),
  ('cursos',   'Cursos e formação',                 NULL, 20),
  ('parakite', 'Parakite',                          NULL, 30),
  ('flow',     'Venda de asas e equipamento Flow',  NULL, 40),
  ('conteudo', 'Conteúdo técnico e spots',          'Só quando contribui para autoridade, procura ou negócio.', 50);

-- Marca: a Happy Soaring e os nomes próprios do seu método.
-- O nome de um fabricante ou parceiro NÃO é marca.
INSERT INTO termos_marca (termo, tipo, notas) VALUES
  ('happy soaring',    'MARCA',       NULL),
  ('happysoaring',     'MARCA',       NULL),
  ('happysoaring.com', 'MARCA',       NULL),
  ('pilot2wing',       'METODO',      NULL),
  ('body first',       'METODO',      NULL),
  ('smartground',      'NOME_ANTIGO', 'Nome anterior do Pilot2Wing.');
