# Módulo de Inteligência Happy Soaring

Worker próprio (`hs-inteligencia`), separado do site público. Serve a interface
e a API em `happysoaring.com/admin/inteligencia/`, atrás do Cloudflare Access.

- **O site continua estático** no Cloudflare Pages. Esta pasta nunca entra na
  publicação do site (`inteligencia` está nas `PROIBIDAS` do `scripts/publicar.mjs`).
- **O CMS** (`/admin/`) é outra coisa e não é tocado por este módulo.

## Estrutura

```
wrangler.toml                 Worker, rotas, D1, R2 — sem workers.dev nem pré-visualizações
src/index.js                  ordem fixa: prefixo → Access → API ou interface
src/acesso.js                 validação do token do Access em todos os pedidos (falha fechado)
src/seguranca.js              cabeçalhos de segurança de todas as respostas
src/estado.js                 estado do módulo e configuração base
public/admin/inteligencia/    interface (sem código de terceiros)
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
Cloudflare Access para `happysoaring.com/admin/inteligencia`. Enquanto estiverem vazios,
o Worker responde 503 a tudo. Não são segredos.
