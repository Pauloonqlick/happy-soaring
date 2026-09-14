-- «Custos»: o que a conta Cloudflare consome por dia, para o painel de custos e para
-- avisar antes de passar do que o plano inclui (pedido do Paulo, 14/09/2026).
--
-- Os limites do Workers Paid são da CONTA inteira: entram todos os Workers, bases D1,
-- buckets R2 e namespaces KV da conta — também os que não são do site. Por isso cada
-- linha guarda o recurso (script, base, bucket, namespace) e o painel soma-os.
--
-- Recolhe-se de hora a hora (execução dos avisos) pela API GraphQL de analytics da
-- Cloudflare, com um token só de leitura (segredo CF_ANALYTICS_TOKEN). Os valores são
-- os da própria Cloudflare, por dia UTC. Os de armazenamento são o máximo do dia.
--
--   produto   metrica                recurso
--   workers   pedidos, cpu_ms        nome do script
--   d1        linhas_lidas,
--             linhas_escritas,
--             armazenamento_bytes    id da base
--   r2        classe_a, classe_b,
--             armazenamento_bytes    nome do bucket
--   kv        leituras, escritas,
--             eliminacoes, listagens,
--             armazenamento_bytes    id do namespace

CREATE TABLE consumos_dia (
  dia             TEXT NOT NULL,                 -- AAAA-MM-DD (UTC, como a Cloudflare conta)
  produto         TEXT NOT NULL,
  metrica         TEXT NOT NULL,
  recurso         TEXT NOT NULL DEFAULT '',
  valor           REAL NOT NULL,
  actualizado_em  TEXT NOT NULL,
  PRIMARY KEY (dia, produto, metrica, recurso)
);

-- DataForSEO: saldo pré-pago. A API só diz o saldo, o total carregado e o gasto do
-- dia; o histórico faz-se aqui, com uma leitura por hora. O gasto é a descida do saldo,
-- descontando os carregamentos (que se reconhecem pela subida do total carregado).
-- As credenciais são os segredos DATAFORSEO_LOGIN e DATAFORSEO_PASSWORD do Worker.
CREATE TABLE dataforseo_saldos (
  em            TEXT PRIMARY KEY,                -- instante da leitura
  saldo         REAL NOT NULL,                   -- USD
  total         REAL NOT NULL,                   -- USD carregados desde a abertura da conta
  gasto_hoje    REAL                             -- USD, o «statistics.day.total» da própria API
);

-- O plano renova-se no dia do mês em que foi subscrito: 14/09/2026. O que está
-- incluído conta de renovação a renovação, não por mês de calendário.
INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('faturacao_renovacao_dia', '14');
INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('faturacao_plano_desde', '2026-09-14');

-- Os avisos de consumo vão pelo mesmo email e ficam na mesma tabela, com motivo
-- 'CONSUMO'. A tabela tinha os motivos fechados num CHECK, que o SQLite não deixa
-- alterar: reconstrói-se com o mesmo conteúdo.
CREATE TABLE avisos_nova (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  motivo         TEXT NOT NULL CHECK (motivo IN ('DIARIO', 'EXCEPCIONAL', 'TESTE', 'CONSUMO')),
  assuntos       TEXT NOT NULL,                  -- JSON: [{chave, detectado_em}] ou, no consumo, [{metrica, nivel, ciclo}]
  estado         TEXT NOT NULL CHECK (estado IN ('ENVIADO', 'FALHOU')),
  id_fornecedor  TEXT,
  erro           TEXT                            -- só o código devolvido; nunca credenciais
);
INSERT INTO avisos_nova (id, criado_em, motivo, assuntos, estado, id_fornecedor, erro)
  SELECT id, criado_em, motivo, assuntos, estado, id_fornecedor, erro FROM avisos;
DROP TABLE avisos;
ALTER TABLE avisos_nova RENAME TO avisos;
CREATE INDEX avisos_por_data ON avisos (estado, criado_em);

UPDATE esquema_meta SET valor = '13' WHERE chave = 'versao_esquema';
