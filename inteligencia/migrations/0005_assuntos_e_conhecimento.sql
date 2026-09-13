-- Fase 5 — assuntos, porta «Vale a pena agir agora?», «Hoje», conhecimento,
-- origem dos contactos e pacotes de trabalho.
--
-- Os cinco grupos de dados da arquitectura:
--   configuração     pagina_objectivo (com niveis_pagina e objectivos_negocio)
--   estado derivado  assuntos — reconstruível a partir das inspecções e do
--                    Search Console; a porta e o «Hoje» calculam-se ao ler
--   trabalho humano  assunto_decisoes, pacotes_trabalho, avaliacoes, contactos
--                    (só acrescentos; o pacote só ganha a publicação que o levou ao ar)
--   conhecimento     decisoes_activas, factos_negocio, hipoteses_eliminadas —
--                    editáveis, com todas as versões em conhecimento_historico
--
-- As limitações de evidência NÃO são assuntos: nunca aparecem como problema.

CREATE TABLE pagina_objectivo (
  caminho      TEXT NOT NULL,
  objectivo_id TEXT NOT NULL REFERENCES objectivos_negocio(id),
  PRIMARY KEY (caminho, objectivo_id)
);

CREATE TABLE assuntos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chave           TEXT NOT NULL UNIQUE,          -- tipo + caminho
  tipo            TEXT NOT NULL,
  caminho         TEXT NOT NULL,
  critico         INTEGER NOT NULL DEFAULT 0 CHECK (critico IN (0, 1)),
  confirmado      INTEGER NOT NULL DEFAULT 0 CHECK (confirmado IN (0, 1)),
  evidencia       TEXT NOT NULL,                 -- JSON: só o que foi observado, com datas
  detectado_em    TEXT NOT NULL,                 -- início deste aparecimento
  visto_em        TEXT NOT NULL,                 -- última detecção
  resolvido_em    TEXT,                          -- NULL enquanto está activo
  regressoes      INTEGER NOT NULL DEFAULT 0     -- quantas vezes voltou depois de resolvido
);
CREATE INDEX assuntos_activos ON assuntos (resolvido_em, caminho);

CREATE TABLE assunto_decisoes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  assunto_chave TEXT NOT NULL,
  decisao       TEXT NOT NULL CHECK (decisao IN ('APROVAR', 'IGNORAR', 'ADIAR', 'PEDIR_EVIDENCIA')),
  razao         TEXT,
  adiar_ate     TEXT,                            -- AAAA-MM-DD
  nota          TEXT,
  decidido_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX decisoes_por_assunto ON assunto_decisoes (assunto_chave, decidido_em);

CREATE TABLE pacotes_trabalho (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  assunto_chave TEXT NOT NULL,
  decisao_id    INTEGER NOT NULL REFERENCES assunto_decisoes(id),
  caminho       TEXT NOT NULL,
  conteudo      TEXT NOT NULL,                   -- JSON: o que alterar, porquê, o que respeitar, o que não tocar
  criado_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deployment_id TEXT REFERENCES deployments(id), -- a primeira publicação depois da aprovação que alterou a página
  publicado_em  TEXT
);
CREATE INDEX pacotes_por_publicar ON pacotes_trabalho (deployment_id, caminho);

CREATE TABLE avaliacoes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  assunto_chave TEXT NOT NULL,
  pacote_id     INTEGER NOT NULL UNIQUE REFERENCES pacotes_trabalho(id),
  resultado     TEXT NOT NULL CHECK (resultado IN ('MELHORIA_OBSERVADA', 'SEM_EFEITO_CLARO', 'PIOROU', 'INCONCLUSIVO')),
  evidencia     TEXT NOT NULL,                   -- JSON
  avaliado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Origem dos contactos: como encontrou, país e o que procurava. SEM dados pessoais.
CREATE TABLE contactos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  recebido_em    TEXT NOT NULL,                  -- AAAA-MM-DD
  como_encontrou TEXT NOT NULL CHECK (como_encontrou IN ('PESQUISA_GOOGLE', 'GOOGLE_MAPS', 'RESPOSTA_IA', 'REDES_SOCIAIS',
                   'YOUTUBE', 'RECOMENDACAO', 'JA_CLIENTE', 'PARCEIRO', 'EVENTO', 'OUTRO', 'NAO_SABE')),
  pais           TEXT,                           -- ISO 3166-1 alfa-2, ou NULL se não se sabe
  objectivo_id   TEXT REFERENCES objectivos_negocio(id),  -- o que procurava; NULL = outro ou não se sabe
  registado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE decisoes_activas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo           TEXT NOT NULL,
  tipo             TEXT NOT NULL CHECK (tipo IN ('COMERCIAL', 'ESTRATEGICA', 'MARCA')),
  razao            TEXT NOT NULL,
  ambito           TEXT,
  objectivo_id     TEXT REFERENCES objectivos_negocio(id),
  bloqueia_tipo    TEXT,                         -- tipo de assunto que não volta a ser recomendado (NULL = qualquer)
  bloqueia_caminho TEXT,                         -- prefixo de caminho (NULL = qualquer página)
  decidida_em      TEXT NOT NULL,
  revisao_em       TEXT,
  condicao_revisao TEXT,
  estado           TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'REVOGADA')),
  versao           INTEGER NOT NULL DEFAULT 1,
  alterado_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE factos_negocio (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  afirmacao    TEXT NOT NULL,
  estado       TEXT NOT NULL CHECK (estado IN ('VERIFICADO', 'POR_CONFIRMAR', 'PROIBIDO')),
  fonte        TEXT,
  data_fonte   TEXT,
  objectivo_id TEXT REFERENCES objectivos_negocio(id),
  notas        TEXT,
  versao       INTEGER NOT NULL DEFAULT 1,
  alterado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE hipoteses_eliminadas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  hipotese     TEXT NOT NULL,
  evidencia    TEXT NOT NULL,
  eliminada_em TEXT NOT NULL,
  tipo_assunto TEXT,                             -- NULL = não retira nenhum tipo automaticamente
  caminho      TEXT,                             -- prefixo de caminho
  objectivo_id TEXT REFERENCES objectivos_negocio(id),
  estado       TEXT NOT NULL DEFAULT 'ELIMINADA' CHECK (estado IN ('ELIMINADA', 'REABERTA')),
  versao       INTEGER NOT NULL DEFAULT 1,
  alterado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE conhecimento_historico (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tabela      TEXT NOT NULL CHECK (tabela IN ('decisoes_activas', 'factos_negocio', 'hipoteses_eliminadas')),
  registo_id  INTEGER NOT NULL,
  versao      INTEGER NOT NULL,
  dados       TEXT NOT NULL,                     -- JSON da versão completa
  gravado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tabela, registo_id, versao)
);

UPDATE esquema_meta SET valor = '5' WHERE chave = 'versao_esquema';
