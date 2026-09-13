-- Fase 3 — Search Console (pesquisa Web), recolhido directamente do Google.
--
-- SÓ DADOS FINAIS
-- A API devolve por omissão apenas dias já fechados pelo Google. Um dia
-- guardado nunca muda depois — por isso cada dia é gravado uma vez e nunca
-- é reescrito.
--
-- O QUE SE GUARDA POR DIA
--   totais         sem dimensões: a verdade do dia, incluindo o que o Google
--                  esconde por privacidade;
--   query, page, country, device
--                  cada dimensão sozinha;
--   combinado      query × page × country × device.
-- As linhas guardam-se como JSON compacto, uma linha da tabela por dia e
-- conjunto: cabe no plano gratuito (uma escrita em vez de centenas) e
-- consulta-se em SQL com json_each.
--
-- A SOMA DAS LINHAS NÃO É O TOTAL
-- O Google omite consultas anónimas nas linhas, mas conta-as nos totais. A
-- cobertura visível de cada conjunto fica gravada para que nunca se leia uma
-- soma de linhas como se fosse o total.
--
-- Marca/não-marca e língua da pesquisa NÃO se gravam: calculam-se ao ler, a
-- partir da configuração, e nunca ficam desactualizadas.

CREATE TABLE gsc_dias (
  data            TEXT PRIMARY KEY,                -- AAAA-MM-DD, fuso do Search Console (Pacífico)
  propriedade     TEXT NOT NULL,
  cliques         INTEGER NOT NULL,
  impressoes      INTEGER NOT NULL,
  ctr             REAL,
  posicao         REAL,
  recolhido_em    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completo        INTEGER NOT NULL DEFAULT 0 CHECK (completo IN (0, 1))  -- 1 quando os 5 conjuntos estão gravados
);

CREATE TABLE gsc_conjuntos (
  data              TEXT NOT NULL REFERENCES gsc_dias(data),
  conjunto          TEXT NOT NULL CHECK (conjunto IN ('query', 'page', 'country', 'device', 'combinado')),
  linhas            INTEGER NOT NULL,
  cliques_visiveis  INTEGER NOT NULL,
  impressoes_visiveis INTEGER NOT NULL,
  -- [valor, cliques, impressoes, ctr, posicao] por dimensão;
  -- [query, page, country, device, cliques, impressoes, ctr, posicao] no combinado
  json              TEXT NOT NULL,
  recolhido_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (data, conjunto)
);

UPDATE esquema_meta SET valor = '3' WHERE chave = 'versao_esquema';
