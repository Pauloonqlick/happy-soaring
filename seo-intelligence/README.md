# HS SEO Intelligence — Fase 0

Objetivo desta fase: provar a cadeia completa:

Cloudflare Worker → Google OAuth → Google Search Console API → dados reais da Happy Soaring.

## O que esta fase faz

- `/` mostra o estado básico e o redirect URI.
- `/health` devolve diagnóstico JSON sem expor secrets.
- `/auth/google` inicia OAuth Google com scope read-only da Search Console.
- `/oauth/callback` troca o authorization code por um access token temporário.
- lista as propriedades Search Console acessíveis.
- seleciona a propriedade da Happy Soaring.
- executa uma consulta Search Analytics dos últimos 28 dias disponíveis.
- devolve query, página, cliques, impressões, CTR e posição.

Nesta fase não existe D1 e não são guardados access tokens nem refresh tokens.

## Secrets Cloudflare

Já devem existir no Worker e nunca devem ser colocados no GitHub:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Variáveis opcionais

- `GOOGLE_REDIRECT_URI`: usar se o redirect OAuth tiver de ser fixado explicitamente.
- `GSC_SITE_URL`: propriedade exata da Search Console. Para Domain Property normalmente será `sc-domain:happysoaring.com`.

## Google OAuth

No OAuth Client usado por `GOOGLE_CLIENT_ID`, adicionar aos **Authorized redirect URIs** exatamente o endereço mostrado pela página inicial do Worker, normalmente:

`https://happysoaring-search-console.<workers-subdomain>.workers.dev/oauth/callback`

O valor tem de coincidir exatamente, incluindo protocolo e caminho.

## Publicação

A partir da raiz do repositório:

```bash
npx wrangler deploy --config seo-intelligence/wrangler.toml
```

Se os secrets ainda não estiverem associados ao Worker criado pelo Wrangler, configurá-los na Cloudflare antes do teste OAuth.

## Teste

1. Abrir a URL pública do Worker.
2. Confirmar `OAuth secrets: configurados`.
3. Copiar o redirect URI mostrado e confirmar que está autorizado no Google OAuth Client.
4. Carregar em `Ligar Google Search Console`.
5. Autorizar a conta Google que tem acesso à propriedade da Happy Soaring.
6. O callback deve devolver JSON com `ok: true`, a propriedade e linhas reais de Search Analytics.

## Critério de conclusão da Fase 0

A fase só fica concluída quando uma chamada real devolver pelo menos a estrutura:

```json
{
  "source": "GSC",
  "rows": [
    {
      "query": "...",
      "page": "...",
      "clicks": 0,
      "impressions": 0,
      "ctr": 0,
      "position": 0
    }
  ]
}
```

`rows` pode estar vazio se o período/propriedade não tiver dados; nesse caso a autenticação e API podem estar funcionais, mas deve ser feita uma consulta a um período com dados antes de considerar o marco totalmente validado.
