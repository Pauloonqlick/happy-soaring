-- Nenhuma aprendizagem se perde (pedido do Paulo, 14/09/2026: «garantes que sempre que haja
-- nova aprendizagem elas são guardadas para no futuro servirem de base?»).
--
-- Três mudanças:
--
-- 1. LIÇÕES DE PROCESSO. Até aqui uma lição tinha de estar ligada a um tipo de problema
--    que o módulo detecta (tipo_assunto NOT NULL). O que se aprende sobre como se publica
--    ou como o módulo opera não tinha onde ficar e acabava em notas soltas — o contrário
--    de uma só fonte de verdade. Uma lição passa a ter uma natureza:
--      MEDIDA    reconhece casos de um tipo de problema; o estado conta-se dos resultados
--      PROCESSO  regra de trabalho nascida de um caso real; está EM VIGOR desde que existe
--    O SQLite não deixa tirar um NOT NULL: a tabela reconstrói-se com o mesmo conteúdo.
--
-- 2. REFERÊNCIAS. Uma lição diz de que casos nasceu (JSON: ["incidente:<aberto_em>", …]).
--    É assim que o módulo sabe que um incidente já deixou lição.
--
-- 3. DISPENSAS. Nem tudo ensina alguma coisa. Quando um caso não deixa lição, fica escrito
--    porquê — e deixa de aparecer em «O que falta aprender».

CREATE TABLE licoes_nova (
  chave        TEXT PRIMARY KEY,
  natureza     TEXT NOT NULL DEFAULT 'MEDIDA' CHECK (natureza IN ('MEDIDA', 'PROCESSO')),
  tipo_assunto TEXT,                             -- obrigatório nas MEDIDA; vazio nas PROCESSO
  categoria    TEXT NOT NULL,
  titulo       TEXT NOT NULL,
  padrao       TEXT,
  prioridade   INTEGER NOT NULL DEFAULT 100,
  sintoma      TEXT NOT NULL,
  causa        TEXT NOT NULL,
  correccao    TEXT NOT NULL,
  prevencao    TEXT NOT NULL,
  generica     INTEGER NOT NULL DEFAULT 1 CHECK (generica IN (0, 1)),
  referencias  TEXT,                             -- JSON: casos de onde a lição nasceu
  origem       TEXT NOT NULL DEFAULT 'CLAUDE' CHECK (origem IN ('CLAUDE', 'PAULO', 'MODULO')),
  versao       INTEGER NOT NULL DEFAULT 1,
  criada_em    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  alterada_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (natureza = 'PROCESSO' OR tipo_assunto IS NOT NULL)
);
INSERT INTO licoes_nova (chave, natureza, tipo_assunto, categoria, titulo, padrao, prioridade, sintoma, causa, correccao, prevencao,
    generica, referencias, origem, versao, criada_em, alterada_em)
  SELECT chave, 'MEDIDA', tipo_assunto, categoria, titulo, padrao, prioridade, sintoma, causa, correccao, prevencao,
    generica, NULL, origem, versao, criada_em, alterada_em FROM licoes;
DROP TABLE licoes;
ALTER TABLE licoes_nova RENAME TO licoes;

CREATE TABLE aprendizagem_dispensas (
  referencia  TEXT PRIMARY KEY,                  -- «assunto:<chave>», «incidente:<aberto_em>»
  motivo      TEXT NOT NULL,
  dispensada_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  por         TEXT NOT NULL DEFAULT 'CLAUDE' CHECK (por IN ('CLAUDE', 'PAULO'))
);

-- As duas lições de processo de 14/09/2026.
INSERT INTO licoes (chave, natureza, tipo_assunto, categoria, titulo, prioridade, sintoma, causa, correccao, prevencao, generica, referencias, origem, criada_em, alterada_em)
VALUES (
  'operacao/limite-processamento-tarefas-agendadas', 'PROCESSO', NULL, 'Operação do módulo',
  'Tarefas agendadas cortadas pelo limite de processamento', 100,
  'Execuções agendadas começam e não acabam durante horas (estado exceededResources no histórico da Cloudflare); sem registo, ninguém dá por isso.',
  'O plano gratuito da Cloudflare dá no máximo 10 ms de processamento por execução. As tarefas que leem e cruzam dados (publicações, detecção de problemas, decisões) passavam desse limite.',
  'Plano Workers Paid com um tecto explícito de 1 s por execução (limits.cpu_ms), cada execução registada antes de começar e um vigia que compara o que devia ter corrido com o que correu.',
  'Num Worker com tarefas agendadas que fazem mais do que um pedido simples: usar o plano pago com um tecto de processamento explícito, registar cada execução antes de começar e ter um vigia que detecte execuções cortadas ou em falta — desde o primeiro dia, não depois da primeira avaria.',
  1, '["incidente:2026-09-13T23:36:00.000Z"]', 'CLAUDE', '2026-09-14T22:00:00.000Z', '2026-09-14T22:00:00.000Z'
);
INSERT INTO licoes (chave, natureza, tipo_assunto, categoria, titulo, prioridade, sintoma, causa, correccao, prevencao, generica, referencias, origem, criada_em, alterada_em)
VALUES (
  'operacao/frequencia-das-tarefas', 'PROCESSO', NULL, 'Operação do módulo',
  'Tarefas agendadas a verificar mais vezes do que os dados mudam', 100,
  'A maior parte das execuções agendadas não encontra nada de novo («verificou, sem novidades»), e a mais frequente é também a que mais processamento gasta.',
  'A frequência foi escolhida pelo que o sistema aguenta e não pelo ritmo a que os dados mudam: publicações vistas de 2 em 2 minutos quando o site se publica poucas vezes por dia, Search Console de 10 em 10 minutos quando o Google actualiza uma vez por dia.',
  'Espaçar cada tarefa ao ritmo da sua fonte (publicações de 10 em 10 minutos, Search Console de hora a hora, a 15/09/2026), mantendo o vigia e o registo coerentes com o horário em vigor em cada minuto.',
  'Antes de agendar uma tarefa, perguntar com que frequência a fonte muda e agendá-la a esse ritmo, não mais depressa. Medir no «Registo» quantas execuções têm novidades e rever o horário quando a maioria não tem.',
  1, '["decisao:2026-09-14 horário das tarefas"]', 'CLAUDE', '2026-09-14T22:00:00.000Z', '2026-09-14T22:00:00.000Z'
);
INSERT INTO licoes_historico (chave, versao, dados, gravado_em)
  SELECT chave, versao, json_object('chave', chave, 'versao', versao, 'natureza', natureza, 'categoria', categoria, 'titulo', titulo,
    'sintoma', sintoma, 'causa', causa, 'correccao', correccao, 'prevencao', prevencao, 'generica', generica, 'referencias', referencias, 'origem', origem),
    '2026-09-14T22:00:00.000Z'
  FROM licoes WHERE natureza = 'PROCESSO';

UPDATE esquema_meta SET valor = '14' WHERE chave = 'versao_esquema';
