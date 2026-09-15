-- 0015 · As lições apoiadas na documentação oficial, e a documentação vigiada (15/09/2026)
--
-- 1. FONTES. Cada lição diz em que secção da documentação oficial se apoia
--    (JSON: [{"titulo": …, "url": …}]). Uma prática que ninguém sabe onde o Google a
--    escreve é uma opinião; com a fonte, sabe-se o que rever quando a fonte muda.
--    As fontes das cinco lições de SEO e da lição do limite de processamento foram lidas
--    a 15/09/2026. As outras lições de processo são regras deste projecto e não têm fonte
--    externa.
--
-- 2. A DOCUMENTAÇÃO DO GOOGLE, VIGIADA. Uma vez por semana o módulo lê o feed oficial
--    das actualizações da documentação da Pesquisa Google. Cada entrada nova que toque
--    numa página citada por uma lição fica «por rever» em «O que falta aprender» até
--    alguém dizer o que fez (registar.mjs rever). As outras ficam só à vista.

ALTER TABLE licoes ADD COLUMN fontes TEXT;

CREATE TABLE documentacao_google (
  guid          TEXT PRIMARY KEY,                 -- o identificador da entrada no feed
  titulo        TEXT NOT NULL,
  publicada_em  TEXT NOT NULL,
  resumo        TEXT NOT NULL,                    -- o «What» e o «Why», sem HTML
  ligacoes      TEXT NOT NULL,                    -- JSON: páginas da documentação citadas na entrada
  licoes        TEXT NOT NULL DEFAULT '[]',       -- JSON: chaves das lições cujas fontes a entrada toca
  visto_em      TEXT NOT NULL,
  revista_em    TEXT,
  revisao       TEXT,
  revista_por   TEXT CHECK (revista_por IS NULL OR revista_por IN ('CLAUDE', 'PAULO', 'MODULO'))
);
CREATE INDEX documentacao_google_publicada ON documentacao_google (publicada_em);

UPDATE licoes SET fontes = '[{"titulo":"Criar e enviar um sitemap (o lastmod só conta se for exacto)","url":"https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"},{"titulo":"Pedir ao Google para voltar a rastrear URLs (quota e prazos)","url":"https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl"}]'
  WHERE chave = 'rastreio/aguardar-rastreio-natural';
UPDATE licoes SET fontes = '[{"titulo":"Boas práticas de ligações (cada página ligada a partir de outra)","url":"https://developers.google.com/search/docs/crawling-indexing/links-crawlable"},{"titulo":"Criar e enviar um sitemap","url":"https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"},{"titulo":"Versões localizadas das páginas (hreflang recíproco)","url":"https://developers.google.com/search/docs/specialty/international/localized-versions"},{"titulo":"Relatório de indexação de páginas — «Detetada, não indexada»","url":"https://support.google.com/webmasters/answer/7440203"}]'
  WHERE chave = 'rastreio/pagina-nova-nao-descoberta';
UPDATE licoes SET fontes = '[{"titulo":"Redireccionamentos e a Pesquisa Google (301 e 308)","url":"https://developers.google.com/search/docs/crawling-indexing/301-redirects"}]'
  WHERE chave = 'redireccionamentos/url-antiga-com-301';
UPDATE licoes SET fontes = '[{"titulo":"Dados estruturados de fragmento de produto (offers, review ou aggregateRating)","url":"https://developers.google.com/search/docs/appearance/structured-data/product-snippet"},{"titulo":"Directrizes gerais de dados estruturados (só marcar o que se vê)","url":"https://developers.google.com/search/docs/appearance/structured-data/sd-policies"}]'
  WHERE chave = 'dados-estruturados/product-sem-preco';
UPDATE licoes SET fontes = '[{"titulo":"Boas práticas de vídeo — página de exibição e uploadDate","url":"https://developers.google.com/search/docs/appearance/video"}]'
  WHERE chave = 'dados-estruturados/video-sem-data';
UPDATE licoes SET fontes = '[{"titulo":"Limites da plataforma Workers — tempo de processamento","url":"https://developers.cloudflare.com/workers/platform/limits/"}]'
  WHERE chave = 'operacao/limite-processamento-tarefas-agendadas';

-- cada lição que ganhou fonte é uma versão nova, com o histórico completo
UPDATE licoes SET versao = versao + 1, alterada_em = '2026-09-15T12:00:00.000Z' WHERE fontes IS NOT NULL;
INSERT INTO licoes_historico (chave, versao, dados, gravado_em)
  SELECT chave, versao, json_object('chave', chave, 'versao', versao, 'natureza', natureza, 'tipo_assunto', tipo_assunto, 'categoria', categoria,
    'titulo', titulo, 'padrao', padrao, 'prioridade', prioridade, 'sintoma', sintoma, 'causa', causa, 'correccao', correccao, 'prevencao', prevencao,
    'generica', generica, 'referencias', referencias, 'fontes', fontes, 'origem', origem), '2026-09-15T12:00:00.000Z'
  FROM licoes WHERE fontes IS NOT NULL;

UPDATE esquema_meta SET valor = '15' WHERE chave = 'versao_esquema';
