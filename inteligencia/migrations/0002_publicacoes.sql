-- Fase 2 — publicações do site observadas pela API de Deployments do Pages.
--
-- A FONTE DE VERDADE É A CLOUDFLARE, NÃO O /meta.json
-- Cada deployment de produção listado pela API é processado, pelo seu ID
-- real, no SEU próprio endereço (https://<id>.happy-soaring.pages.dev), que
-- serve o conteúdo exacto dessa publicação. Dois deploys seguidos nunca se
-- perdem, mesmo que sejam processados horas depois.
--
-- O que se guarda de cada página:
--   resumo_conteudo  SHA-1 do HTML sem os carimbos ?v= — é o mesmo valor que
--                    o sitemap-datas.json regista para a página;
--   resumo_publicado SHA-256 dos bytes tal como servidos;
-- e de cada ficheiro de dados que as páginas SPA carregam, o seu SHA-256.
--
-- As alterações entre publicações NÃO se guardam: calculam-se sempre a partir
-- destas observações, e por isso nunca ficam desactualizadas.

CREATE TABLE deployments (
  id                TEXT PRIMARY KEY,                -- ID real da Cloudflare
  short_id          TEXT,
  url               TEXT NOT NULL,                   -- https://<short_id>.happy-soaring.pages.dev
  ambiente          TEXT,
  ramo              TEXT,
  commit_cf         TEXT,                            -- o que a Cloudflare regista, quando regista
  criado_em_cf      TEXT NOT NULL,
  modificado_em_cf  TEXT,
  fase_cf           TEXT,                            -- latest_stage.name
  estado_cf         TEXT,                            -- latest_stage.status
  resposta_bruta    TEXT,                            -- chave no R2 da resposta original
  descoberto_em     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  processamento     TEXT NOT NULL DEFAULT 'PENDENTE'
                    CHECK (processamento IN ('PENDENTE', 'PROCESSADO', 'IGNORADO', 'FALHOU')),
  passo             TEXT NOT NULL DEFAULT 'META'
                    CHECK (passo IN ('META', 'SITEMAP', 'PAGINAS', 'DADOS', 'FIM')),

  meta_estado       TEXT CHECK (meta_estado IS NULL OR meta_estado IN ('OK', 'AUSENTE', 'ERRO')),
  meta_commit       TEXT,
  meta_sujo         INTEGER CHECK (meta_sujo IS NULL OR meta_sujo IN (0, 1)),
  meta_publicado    TEXT,
  meta_impressao    TEXT,

  paginas_total     INTEGER,
  anterior_id       TEXT REFERENCES deployments(id),  -- a publicação processada imediatamente antes
  processado_em     TEXT,
  erro              TEXT
);
CREATE INDEX deployments_por_data ON deployments (criado_em_cf);
CREATE INDEX deployments_por_estado ON deployments (processamento, criado_em_cf);

CREATE TABLE deployment_paginas (
  deployment_id     TEXT NOT NULL REFERENCES deployments(id),
  caminho           TEXT NOT NULL,                   -- ex. /o-que-e-um-parakite/
  estado            TEXT NOT NULL DEFAULT 'POR_LER' CHECK (estado IN ('POR_LER', 'LIDA', 'ERRO')),
  http              INTEGER,
  resumo_conteudo   TEXT,
  resumo_publicado  TEXT,
  spa               INTEGER NOT NULL DEFAULT 0 CHECK (spa IN (0, 1)),
  lida_em           TEXT,
  PRIMARY KEY (deployment_id, caminho)
);
CREATE INDEX deployment_paginas_por_ler ON deployment_paginas (deployment_id, estado);

CREATE TABLE deployment_dados (
  deployment_id     TEXT NOT NULL REFERENCES deployments(id),
  ficheiro          TEXT NOT NULL,                   -- ex. /content/settings.json
  http              INTEGER,
  resumo            TEXT,
  PRIMARY KEY (deployment_id, ficheiro)
);

-- Limitações de evidência e falhas de processo. Nunca são problemas SEO.
CREATE TABLE eventos_operacionais (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL,
  detalhe    TEXT,
  criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX eventos_por_data ON eventos_operacionais (criado_em);

UPDATE esquema_meta SET valor = '2' WHERE chave = 'versao_esquema';
