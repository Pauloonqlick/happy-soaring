# Endereços do site

Decidido em 24/08/2026. Ficou registado porque é a decisão de que o resto do
SEO depende, e porque daqui a seis meses ninguém se lembra do porquê.

## O que foi decidido

**O site passa a ter páginas.** A razão principal não é sequer SEO: hoje não se
pode enviar a ninguém o link de uma asa. Envia-se o site inteiro. E cada
partilha nas redes aponta para a mesma coisa, sem foto nem descrição da asa —
sendo as redes o melhor canal da Happy Soaring, isso custa dinheiro.

**Páginas a sério, não a página única a abrir numa asa.** Quem chega de uma
pesquisa aterra na asa, não numa página que depois salta. HTML estático, sem
duplicação de conteúdo e sem o piscar de quem renderiza duas vezes.

## A forma dos endereços

```
/asas/mullet-2/            pt   (a raiz não leva prefixo)
/en/wings/mullet-2/
/es/alas/mullet-2/
/fr/ailes/mullet-2/
/de/schirme/mullet-2/
```

**A categoria traduz-se, o nome do produto não.** A Mullet 2 é Mullet 2 em toda
a parte; quem procura "parakite wings" clica mais depressa num endereço que diga
`wings`. Traduzir também o nome multiplicava a manutenção sem ganho.

**Português na raiz**, para os endereços que já existem não mudarem.

## Como se fazem

`scripts/gerar-paginas.mjs`, na publicação, a partir do mesmo JSON que o site
usa. Sem servidor e sem base de dados: 22 asas × 5 idiomas = 110 ficheiros
estáticos.

**Não reaproveita o renderizador do site.** O `app.js` constrói uma interface;
uma página que se quer encontrada é um documento — títulos encadeados,
parágrafos, uma tabela de especificações. Forçar um a servir o outro dava pior
nos dois.

## O que cada página leva

Título e descrição próprios, canonical, `hreflang` para as outras quatro
versões, Open Graph com **a foto da asa** (hoje todas as partilhas mostram a
mesma imagem), e JSON-LD `Product` + `BreadcrumbList`.

**Sem `offers`, de propósito.** Não há preços no site, e um `Product` com preços
inventados é exactamente o que não se deve fazer.

## O que muda para quem usa o site

O botão **Detalhes** dos cartões passa a levar à página da asa em vez de abrir o
painel ali. Fica um sítio só para cada asa em vez de dois. É a alteração de
comportamento mais visível.

## O que ficou de fora, e porquê

**Páginas de família** (`/asas/parakites/`) — uma lista de asas sem texto
próprio é conteúdo fraco. Ficam para quando houver um parágrafo a sério a
escrever sobre cada família.

**A música e a biografia** continuam na página única. Ainda não há procura que
justifique endereço próprio.
