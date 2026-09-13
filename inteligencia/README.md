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
