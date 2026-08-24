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

`scripts/gerar-paginas.mjs`, a partir do mesmo JSON que o site usa. Sem
servidor e sem base de dados: 22 asas × 5 idiomas = 110 ficheiros estáticos.

Corre dentro do `scripts/publicar.mjs`, antes de a pasta ser montada. **Não se
corre à mão nem se versiona o resultado** — as pastas `/asas/`, `/en/`, `/es/`,
`/fr/` e `/de/` estão no `.gitignore`. Gerar na publicação é o que garante que
uma asa nova aparece nas páginas e no sitemap sem ninguém se lembrar disso.

O **sitemap sai do mesmo sítio**, pela mesma razão: escrito à mão, passava a
mentir na primeira asa acrescentada. São 112 URLs — as 110 asas, a página
inicial e o /reflex-lab/.

Gera para a raiz do projecto, não para uma pasta à parte, para o endereço local
(`localhost:5173/asas/mullet-2/`) ser exactamente o de produção. Endereços que
só se comportam bem depois de publicados descobrem-se tarde de mais.

**Não reaproveita o renderizador do site.** O `app.js` constrói uma interface;
uma página que se quer encontrada é um documento — títulos encadeados,
parágrafos, uma tabela de especificações. Forçar um a servir o outro dava pior
nos dois.

## O que cada página leva

Título e descrição próprios, canonical, `hreflang` para as outras quatro
versões, Open Graph com **a foto da asa** (antes todas as partilhas mostravam a
mesma imagem), e JSON-LD `Product` + `BreadcrumbList`.

De conteúdo: descrição, para quem é, pontos fortes, o que vem na caixa, aviso,
cores, vídeo, gama de vento, tamanhos, tabela de especificações, texto completo
do fabricante e documentos. **Cada bloco só aparece se a asa tiver o campo
preenchido** — hoje só a Mullet 2 tem gama de vento e só o D-Wing V2 tem o que
vem na caixa. À medida que preencheres o CMS, os blocos aparecem sozinhos.

**A página escolhe e pede preço, não só descreve.** Tem as mesmas perguntas do
palco, pela mesma ordem e com as mesmas palavras: cores standard, cor à medida
(só na Mullet 2), tamanhos e país. A mensagem de WhatsApp monta-se com as
mesmas peças, para chegar igual venha de onde vier. A regra do país é a do
palco — sem país e sem tamanho o botão fica **sem `href`**, por isso não é
clicável nem focável; um botão morto que finge funcionar é pior do que um que
se vê que ainda não está pronto.

**O selo da oferta é escrito na página, não buscado por JavaScript.** O site
está em upload directo — nada do CMS chega ao ar sem publicar — por isso uma
oferta escrita na página é tão fresca como o resto do site, e ainda por cima o
Google vê-a e a partilha no WhatsApp mostra-a. Leva a data de fim consigo e
apaga-se sozinho quando ela passar: é a única coisa na página que muda sem
alguém publicar de novo.

Quem decide que asas levam selo é o campo `abrange` do aviso, lido por
`regras/avisos.js` — o mesmo ficheiro que o `app.js` usa para a faixa e para os
selos da página inicial. Duas cópias da regra acabariam a mostrar ofertas
diferentes em sítios diferentes, e ninguém dava por isso até um cliente
perguntar.

**A página herda o que vem do site.** Quem esteve a experimentar cores no palco
e carregou em Detalhes não pode aterrar aqui numa página em branco. A escolha
viaja no **fragmento** — `/asas/mullet-2/#esq=sunrise&cor=744&tam=15,20` — e não
em query string: um `?cor=744` cria endereços que o Google indexa como páginas
à parte, que depois há que desdizer com canonical. O fragmento nunca chega ao
servidor nem aos motores de busca, e isto é estado da pessoa, não conteúdo.

A página só aceita o que existe mesmo naquela asa: um fragmento escrito à mão
não a põe a pedir uma cor que não há.

O botão do topo deixou de abrir o WhatsApp com uma mensagem genérica: leva a
`#pedir`. Passou a haver **um sítio só** onde o pedido se compõe.

Duas diferenças em relação ao painel do site, de propósito:

- **A gama de vento mostra nós E km/h**, em vez do alternador. Num documento
  não há razão para esconder metade dos números atrás de um clique — e assim
  também aparecem nos resultados de pesquisa
- **O vídeo é uma miniatura com ligação**, não um `<iframe>`. A página não
  arrasta o leitor do YouTube nem os cookies dele para quem nem carrega no
  play; quem carrega vê o vídeo ali mesmo. Sem JavaScript, abre no YouTube

**Sem `offers`, de propósito.** Não há preços no site, e um `Product` com preços
inventados é exactamente o que não se deve fazer.

## O que muda para quem usa o site

O botão **Detalhes** — e o cartão inteiro — passa a levar à página da asa em vez
de abrir o painel ali. Vale para os dois modos: a grelha e o palco da
descoberta. Fica um sítio só para cada asa em vez de dois.

**O configurador de cor não se mexeu.** Vive no palco da descoberta, ao lado da
foto, e não dependia do painel para nada.

Os links antigos `#produtos/<slug>` continuam a abrir o painel, para não
partirem. É a única forma de lá chegar.

## O que ficou de fora, e porquê

**Páginas de família** (`/asas/parakites/`) — uma lista de asas sem texto
próprio é conteúdo fraco. Ficam para quando houver um parágrafo a sério a
escrever sobre cada família.

**A música e a biografia** continuam na página única. Ainda não há procura que
justifique endereço próprio.
