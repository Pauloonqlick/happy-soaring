-- Fase 4 — inspecção de URL, rastreios, episódios e fila de indexação.
--
-- «HOUVE UM RASTREIO DO GOOGLE POSTERIOR À ÚLTIMA ALTERAÇÃO?»
-- Responde-se cruzando duas observações:
--   * a última alteração de cada página — das publicações processadas
--     (conteúdo, dados do CMS ou página nova; nunca alterações só técnicas);
--   * o último rastreio que a inspecção de URL do Google devolve.
-- Um rastreio posterior confirma que o Google voltou à página. NÃO confirma
-- que a nova versão já tenha sido processada ou indexada.
--
-- Observações (só se acrescentam): inspecoes, pedidos_indexacao.
-- Estado derivado, reconstruível a partir delas: paginas_google e
-- paginas_alteracao — existem para a tarefa agendada não ler o histórico
-- inteiro a cada 10 minutos (o plano gratuito tem limite de leituras).

CREATE TABLE inspecoes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  caminho            TEXT NOT NULL,
  inspeccionado_em   TEXT NOT NULL,
  veredicto          TEXT,          -- PASS, NEUTRAL, FAIL…
  cobertura          TEXT,          -- «Enviada e indexada», etc., como o Google escreve
  estado_indexacao   TEXT,          -- INDEXING_ALLOWED, BLOCKED_BY_META_TAG…
  estado_robots      TEXT,
  estado_obtencao    TEXT,          -- SUCCESSFUL, SOFT_404, NOT_FOUND…
  rastreado_como     TEXT,
  ultimo_rastreio    TEXT,          -- o último rastreio que o Google conhece
  canonico_google    TEXT,
  canonico_declarado TEXT,
  sitemaps           TEXT,          -- JSON
  referencias        TEXT,          -- JSON
  resultados_ricos   TEXT,          -- JSON: veredicto e tipos detectados
  erro               TEXT           -- limitação de evidência; nunca problema SEO
);
CREATE INDEX inspecoes_por_pagina ON inspecoes (caminho, inspeccionado_em);

CREATE TABLE paginas_google (
  caminho            TEXT PRIMARY KEY,
  ultima_inspeccao_em TEXT NOT NULL,
  ultimo_rastreio    TEXT,
  veredicto          TEXT,
  cobertura          TEXT,
  estado_obtencao    TEXT,
  estado_robots      TEXT,
  canonico_google    TEXT,
  canonico_declarado TEXT
);

CREATE TABLE paginas_alteracao (
  caminho             TEXT PRIMARY KEY,
  ultima_alteracao_em TEXT NOT NULL,   -- quando a publicação que a alterou foi criada na Cloudflare
  deployment_id       TEXT NOT NULL REFERENCES deployments(id),
  tipo                TEXT NOT NULL CHECK (tipo IN ('conteudo', 'dados', 'nova'))
);

CREATE TABLE pedidos_indexacao (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  caminho      TEXT NOT NULL,
  pedido_em    TEXT NOT NULL,           -- quando o Paulo pediu no Search Console
  registado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX pedidos_por_pagina ON pedidos_indexacao (caminho, pedido_em);

-- Reconstrução das últimas alterações a partir das publicações já processadas.
-- A mesma regra que a tarefa agendada aplica a cada publicação nova.
INSERT INTO paginas_alteracao (caminho, ultima_alteracao_em, deployment_id, tipo)
SELECT caminho, criado_em_cf, id, tipo FROM (
  SELECT caminho, criado_em_cf, id, tipo,
         ROW_NUMBER() OVER (PARTITION BY caminho ORDER BY criado_em_cf DESC) AS n
  FROM (
    SELECT p.caminho, d.criado_em_cf, d.id,
      CASE
        WHEN a.caminho IS NULL THEN 'nova'
        WHEN a.estado <> 'LIDA' THEN NULL
        WHEN p.resumo_conteudo <> a.resumo_conteudo THEN 'conteudo'
        WHEN p.spa = 1 AND (
          EXISTS (SELECT 1 FROM deployment_dados x
                  LEFT JOIN deployment_dados y ON y.deployment_id = d.anterior_id AND y.ficheiro = x.ficheiro
                  WHERE x.deployment_id = d.id AND (y.ficheiro IS NULL OR COALESCE(x.resumo, '') <> COALESCE(y.resumo, '')))
          OR EXISTS (SELECT 1 FROM deployment_dados y
                     WHERE y.deployment_id = d.anterior_id
                       AND NOT EXISTS (SELECT 1 FROM deployment_dados x WHERE x.deployment_id = d.id AND x.ficheiro = y.ficheiro))
        ) THEN 'dados'
      END AS tipo
    FROM deployments d
    JOIN deployment_paginas p ON p.deployment_id = d.id AND p.estado = 'LIDA'
    LEFT JOIN deployment_paginas a ON a.deployment_id = d.anterior_id AND a.caminho = p.caminho
    WHERE d.processamento = 'PROCESSADO' AND d.anterior_id IS NOT NULL
  )
  WHERE tipo IS NOT NULL
)
WHERE n = 1;

UPDATE esquema_meta SET valor = '4' WHERE chave = 'versao_esquema';
