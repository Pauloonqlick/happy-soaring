# Módulo de Inteligência Happy Soaring

Worker próprio (`hs-inteligencia`), separado do site público. Serve a interface
e a API em `happysoaring.com/inteligencia/`, atrás do Cloudflare Access.

- **O site continua estático** no Cloudflare Pages. Esta pasta nunca entra na
  publicação do site (`inteligencia` está nas `PROIBIDAS` do `scripts/publicar.mjs`).
- **O CMS** (`/admin/`) é um sistema independente. O módulo não usa o seu código, o seu
  login nem as suas rotas, e o desenvolvimento do módulo não mexe no CMS.

## Estrutura

```
wrangler.toml                 Worker, rotas, D1, R2 — sem workers.dev nem pré-visualizações
src/index.js                  ordem fixa: prefixo → Access → API ou interface
src/acesso.js                 validação do token do Access em todos os pedidos (falha fechado)
src/seguranca.js              cabeçalhos de segurança de todas as respostas
src/estado.js                 estado do módulo e configuração base
src/publicacoes.js            observação das publicações do site (Fase 2)
src/google.js                 acesso só de leitura à API do Google
src/search-console.js         recolha e resumo do Search Console (Fase 3)
src/linguas.js                marca/não-marca e língua inferida (ou UNKNOWN)
src/inspeccao.js              inspecção de URL, rastreios e fila de indexação (Fase 4)
public/inteligencia/          interface (sem código de terceiros)
migrations/                   esquema D1, só se acrescenta
test/                         testes sem rede
scripts/publicar.mjs          publicação do módulo, com --publicar
```

## Testar e publicar

```
node --test "inteligencia/test/*.test.mjs"
node inteligencia/scripts/publicar.mjs              # valida, não publica
node inteligencia/scripts/publicar.mjs --publicar   # migrações + publicação
```

## Acesso

`ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` (em `wrangler.toml`) vêm da aplicação criada no
Cloudflare Access para `happysoaring.com/inteligencia`. Enquanto estiverem vazios,
o Worker responde 503 a tudo. Não são segredos.

## Publicações do site (Fase 2)

Fonte de verdade: a **API de Deployments do Cloudflare Pages**. Cada deployment de
produção é lido no **seu** endereço (`https://<id>.happy-soaring.pages.dev`), que
serve o conteúdo exacto dessa publicação — nunca a produção actual.

Por página guarda-se o resumo de conteúdo (SHA-1 do HTML sem os carimbos `?v=`,
igual ao `sitemap-datas.json`) e o resumo publicado (SHA-256 dos bytes). As
alterações face à publicação anterior — conteúdo, dados do CMS, novas, retiradas,
técnicas — calculam-se sempre a partir destas observações.

A tarefa agendada corre de 2 em 2 minutos e respeita os limites do plano gratuito
(50 pedidos e 50 consultas por execução): cada publicação é processada em passos
que retomam onde ficaram.

**Segredo necessário:** `CF_API_TOKEN_PAGES` — token da Cloudflare só com
permissão *Account › Cloudflare Pages › Read*. Configura-se no painel do Worker
(*Settings › Variables and Secrets*), nunca no `wrangler.toml` nem no git.
Sem ele, a tarefa regista a limitação uma vez por hora e não faz mais nada.

## Search Console (Fase 3)

Pesquisa Web da propriedade `sc-domain:happysoaring.com`, **só dados finais**: cada
dia é gravado uma vez e nunca é reescrito. Por dia guardam-se os totais sem
dimensões e os conjuntos `query`, `page`, `country`, `device` e o combinado.

A soma das linhas **não é** o total: o Google esconde pesquisas anónimas. Por isso
o resumo mostra marca, não-marca e **desconhecido** (= total − visível), e a
percentagem visível. A língua da pesquisa é inferida do texto só com evidência;
sem ela é `UNKNOWN`. Nunca se deduz do país.

A tarefa agendada é a mesma: aos minutos terminados em 0 é a vez do Search
Console, aos terminados em 4 a da inspecção de URL, nos outros das publicações.

**Segredos necessários** (guardados por `scripts/autorizar-google.mjs`, que nunca
mostra os valores): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GSC_REFRESH_TOKEN` — cliente OAuth dedicado a este Worker, âmbito
`webmasters.readonly`.

## Inspecção de URL e fila de indexação (Fase 4)

A pergunta: **houve um rastreio do Google posterior à última alteração da página?**
Responde-se cruzando a última alteração observada nas publicações (conteúdo, dados
do CMS ou página nova — nunca alterações só técnicas) com o último rastreio que a
inspecção de URL devolve. Um rastreio posterior confirma que o Google voltou à
página; **não** confirma que a nova versão já foi processada ou indexada.

- De 10 em 10 minutos (minuto terminado em 4), no máximo 30 inspecções: primeiro as
  páginas alteradas ainda sem rastreio posterior (no máximo uma vez por dia cada),
  depois as nunca inspeccionadas, depois as de há mais de uma semana.
- A quota (2 000/dia) é partilhada com o Search Console e outros clientes. Um 429
  pausa a inspecção 60 minutos e fica registado como limitação — nunca é problema SEO.
- A resposta original vai para o R2 (`inspecoes/`); as observações ficam em
  `inspecoes` e `pedidos_indexacao`. `paginas_google` e `paginas_alteracao` são
  estado derivado, reconstruível (a migração 0004 reconstrói o segundo).
- `/inteligencia/indexacao/` mostra a fila. O pedido de indexação continua a ser feito
  à mão no Search Console; o botão «Já pedi» só regista que foi feito
  (`POST /inteligencia/api/indexacao/pedido` — exige Access, JSON, o cabeçalho
  `X-HS-Inteligencia: 1` e a mesma origem). É a única escrita da interface.

Usa os mesmos segredos Google da Fase 3; o âmbito `webmasters.readonly` basta.
