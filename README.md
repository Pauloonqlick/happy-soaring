# Happy Soaring

Site da Happy Soaring — cursos de parakite em Portugal e revenda oficial
Flow Paragliders. [happysoaring.com](https://happysoaring.com)

## O que isto é

HTML, CSS e JavaScript sem build. Não há framework, não há bundler, não há
passo de compilação: o que está no repositório é o que corre no browser.

- **`index.html` + `app.js` + `styles.css`** — a página inicial, montada em
  runtime a partir do conteúdo em `content/`.
- **`content/`** — todo o conteúdo, em JSON, editado pelo Sveltia CMS.
- **`scripts/gerar-paginas.mjs`** — gera 120 páginas estáticas (110 de
  produto, 5 do SmartGround, 5 do hub da Flow), as cinco páginas iniciais e
  o sitemap, a partir do mesmo JSON que o site lê.
- **`regras/`** — as regras que o site e o gerador têm de partilhar: avisos,
  taxonomia, unidades. Estão à parte porque estar em duplicado já as fez
  divergir.
- **`scripts/publicar.mjs`** — monta a pasta de publicação e envia para o
  Cloudflare Pages.

## Correr localmente

```
npm run dev
```

Serve a raiz do projecto em `http://localhost:5173`. Os endereços locais são
os mesmos da produção (`/asas/mullet-2/`), por isso não há surpresas ao
publicar.

Para regenerar as páginas sem publicar:

```
node scripts/gerar-paginas.mjs
```

## Publicar

```
node scripts/publicar.mjs              # prepara e verifica, NÃO publica
node scripts/publicar.mjs --publicar    # prepara, verifica e publica
```

Sem a bandeira não sai nada para o ar. Publicar é sempre uma decisão
explícita, nunca um efeito secundário de correr o script.

## O que nunca é publicado

A publicação usa uma **lista de autorizados**, não uma lista de excluídos:
só sai o que está explicitamente nomeado em `scripts/publicar.mjs`. Na pasta
do projecto vivem masters de música, a tabela de preços de revendedor da
Flow e entregas de clientes. Numa lista de excluídos, esquecer uma linha
publica isso para o mundo; numa lista de autorizados, esquecer uma linha só
faz faltar um ficheiro no site — e isso vê-se.

Nunca são publicados: `masters/`, `entregas/`, `catalogo-flow/`, `mockups/`,
`_arquivo/`, `scripts/`, `docs/`, `.env` e qualquer `.wav`, `.pdf` ou `.xlsx`.
O script pára se algum deles aparecer na pasta de publicação.

## Idiomas

Cinco: pt, en, es, fr, de. **A URL manda no idioma** — `/` é português,
`/en/`, `/es/`, `/fr/` e `/de/` são o resto. Cada uma é uma página a sério,
com o seu title, canonical e hreflang.

A categoria traduz-se, o nome do produto não:

```
/asas/mullet-2/          /en/wings/mullet-2/      /de/schirme/mullet-2/
```

O `/smartground/` e o `/flow-paragliders-portugal/` mantêm o mesmo slug nas
cinco — são nomes próprios.

## Gerado ou versionado

As pastas `asas/`, `en/`, `es/`, `fr/`, `de/`, `smartground/` e
`flow-paragliders-portugal/` **são geradas** e estão no `.gitignore`. Não se
editam à mão: qualquer alteração perde-se na geração seguinte. O mesmo vale
para o `sitemap.xml`, embora esse seja versionado.

O que se edita é o `content/` (pelo CMS ou à mão) e o código.

## Conteúdo

O CMS é o [Sveltia](https://github.com/sveltia/sveltia-cms), em `/admin/`,
com a configuração em `admin/config.yml`. Escreve directamente no `master`
do repositório; como a publicação é manual, um erro no CMS não chega ao ar
sozinho.

Regra que atravessa o projecto todo: **não se inventam dados.** Sem preços,
prazos, certificações, avaliações, moradas ou stock que não estejam
confirmados. Os dados estruturados descrevem só o que está na página.

## Documentação

- `docs/URLS.md` — a arquitectura de endereços e porquê.
- `docs/PLANO.md` — o plano de trabalho.
- `docs/PENDENTES.md` — o que está à espera de decisão ou de confirmação.
