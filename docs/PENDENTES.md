# Pendentes

O que está por fazer e o que está por decidir. Vai sendo actualizado à medida
que as coisas aparecem — o que se decide sai daqui e passa a estar escrito nas
regras ou no código.

Última actualização: 03/09/2026

---

## Feito, à espera de publicação · Navegação global

Descoberto em 30/08/2026, resolvido no mesmo dia. **Ainda não publicado.**

As 131 páginas geradas não tinham menu nenhum: quem aterrava numa asa vinda de
uma pesquisa só podia voltar à raiz ou mudar de língua. O `buildMenu()` do
`app.js` só corre na página inicial.

**O que se fez.** Uma barra no header em desktop; em ecrãs estreitos, um botão
e uma gaveta. Os seis links estão sempre escritos no documento — o JavaScript
só abre e fecha. Sem JavaScript a barra fica visível e quebra em duas filas,
que era o comportamento anterior.

A lista, os rótulos e os endereços saem de `regras/navegacao.js`, o mesmo módulo
que o `app.js` passou a usar. Não há segunda fonte de verdade: o `local()` do
`app.js` foi mudado para delegar em `comIdioma()` em vez de ter a sua própria
cópia da conta dos idiomas. O filtro que pergunta ao DOM se a secção existe
ficou no `app.js` de propósito — numa página gerada `#produtos` e `#music`
nunca existem, e se essa pergunta subisse para o módulo as duas entradas
desapareciam de lá.

O componente vive em `menu.css` e `menu.js`, fora da `pagina.css`, porque tem
dois consumidores que não partilham folha de estilo: as páginas geradas e o
Reflex Lab.

**O Reflex Lab.** É uma página escrita à mão e ficava a ser a única sem
navegação. Não leva menu escrito à mão: o gerador entra no ficheiro e escreve
entre `<!-- ng:inicio -->` e `<!-- ng:fim -->`, da mesma fonte. É idempotente.
Só em português — a página não tem traduções declaradas e inventar-lhe cinco
não era trabalho desta tarefa.

**`Início` aponta para a raiz da língua** (`/`, `/en/`, …) e não para `/#hero`.
O fragmento levava ao topo de uma página onde o browser já aterra, e criava um
segundo endereço para uma página que já tem canonical. Na homepage, onde a
âncora serve mesmo para descer, continua `#hero`.

**Efeito lateral que valeu a pena:** o `verificar.mjs` excluía o `#` do regex e
por isso nunca chegava a ver ligações com fragmento — não dava falsos mortos,
mas também não validava nada. Corrigido: 1775 → 2767 ligações verificadas.

---

## Acessibilidade do burger da página inicial

Registado em 30/08/2026. O burger da homepage é outro botão, construído pelo
`buildMenu()` do `app.js`, e continua exactamente como estava.

O que lhe falta:

- **`aria-expanded`** — o botão não diz se o menu está aberto ou fechado. Para
  quem usa leitor de ecrã é um botão sem estado.
- **Gestão de foco** — ao abrir, o foco não entra no menu.
- **Devolução do foco** — ao fechar, o foco não volta ao botão que o abriu.
  Quem navega por teclado é despejado no início do documento.
- **Escape** — não fecha o menu.

Já não é preciso desenhar isto do zero: são as mesmas quatro coisas que a
`menu.js` faz, e o mais provável é que a solução certa seja a homepage passar a
usar o mesmo componente em vez de ter um botão só dela.

---

## Precisa de decisão tua

Nada disto avança sem ti. Não são tarefas, são escolhas.

| | O que está em causa |
|---|---|
| **Ligações à ficha da Flow** | Em Agosto decidiste não ter links para o site do fabricante. O briefing do catálogo pede o contrário. As duas coisas não podem estar certas |
| **Janela da oferta** | A arte diz MULLET 2 e agora o texto também. Falta o design novo antes de a ligares |
| **Rodapé** | Ficou só "HAPPY × FLOW" desde que tirei a frase de demonstração |
| **Nível de piloto por asa** | É matéria de segurança. Posso propor, mas tens de rever antes de ir para o ar |
| **Botão da janela da oferta** | Para onde leva |

## Guardado para a página do curso

Locais onde a formação decorre, conforme as condições (25/08/2026). **Não há
sede nem local fixo** — não inventar uma, e não usar estes nomes noutras
páginas só para SEO local.

Lagoa de Albufeira · Praia do Meco · Fonte da Telha · Praia de Alfarim ·
Peniche · Praia da Gralha

## Precisa de dados teus

Coisas que eu não posso inventar.

- **Nível e terreno** nas 22 asas — sem isto, duas das quatro perguntas da
  descoberta não filtram nada
- **"Porquê esta para ti"** — uma frase por asa, nos 5 idiomas. É a voz do
  revendedor e é a peça que faz a descoberta valer a pena
- **HEX oficiais da Flow** — os actuais foram amostrados do teu screenshot da
  carta, por isso são indicativos
- **Anos do Kussondulola** — a biografia diz "três anos" sem datas
- **Gama de vento da Mullet 2** — lida de uma imagem a olho, por confirmar
- **Confirmar com a Flow:** tamanhos da Panorama e faixas de peso da Future
  Power (as páginas descrevem as 1.ªs versões; a lista de 2026 tem a 2)

## Imagens em falta

- **Logótipos:** MulletX, Vissta
- **Fotos:** Aura 2 Square, D-Chute, Vissta XC — no modo descoberta a foto é o
  ecrã inteiro, por isso estas três não podem sequer entrar

## Catálogo

- **19 asas no formato antigo** — falta o tratamento completo que a Future 2, a
  Freedom 2 e a F2 Light já têm
- **Traduzir** para es/fr/de o texto do fabricante nessas 19
- **Cor à medida** só existe na Mullet 2, na página inicial e na página da asa.
  A oferta da cor à medida é **só para a Mullet 2** (decidido 24/08/2026) e o
  texto da oferta já foi corrigido nos 5 idiomas. Estender aos outros três
  parakites continua em aberto — cada um precisa de ser visto, não é só correr
  o script
- **Preços e prazos fora do site** (24/08/2026). O `customColourNote` está
  vazio nos 5 idiomas. O campo continua no CMS: se voltares a escrever lá
  alguma coisa, volta a aparecer na página da asa
- **Paramotor mistura dois eixos** na `classificacao`: `Full reflex` e
  `Semi-reflex` são o perfil da asa, `EN-A` é uma homologação. Na fila de
  chips lêem-se como três alternativas do mesmo tipo, e não são — uma asa
  full reflex também tem (ou não) homologação. Ou se escolhe um eixo só para
  o paramotor, ou se separa em dois campos
- **Modo descoberta** está ligado. Os separadores de família (24/08/2026)
  resolveram o problema de só se poder chegar a 4 das 22 asas — o carril era
  só da família em palco e não havia forma de sair dela sem responder às
  perguntas. Agora os separadores contam quantas correspondem por família,
  esbatem as que dão zero (mas continuam a abrir), e há um botão **Apagar
  respostas**. A fila de **homologação / tipo** dentro da família veio a
  seguir, com as mesmas regras. O filtro limpa-se sempre que se muda de
  família, se responde de novo ou se apagam as respostas
- **Rótulos das famílias e das classes** passaram para `regras/taxonomia.js`,
  partilhado com o gerador (24/08/2026). Antes as 110 páginas mostravam a
  chave em bruto — uma página alemã dizia "Parapentes" nas migalhas.
  `Mini-wings` ficou **Mini-voiles** em francês e **Miniwings** em alemão;
  `Parakites` e `Parawing` ficam iguais nos cinco idiomas, por serem os nomes
  que a Flow usa em toda a parte. Diz se preferes outra coisa

## Oferta

Resolvido em 24/08/2026: o texto passou a falar só da **Mullet 2** nos 5
idiomas, o campo **`abrange`** diz que asas levam o selo, e o selo aparece na
grelha, no carril, no palco e na página da asa. O botão continua a levar à
gama toda dos parakites — foi decidido assim.

- **Ligar a oferta** quando o design da janela estiver feito. Está pronta,
  testada e **desligada**
- Falta a **data de fim** ser confirmada (pus 31/12/2026)
- A palavra é **Oferta**, não promoção. O tipo `promocao` (framboesa) continua
  a existir no CMS como categoria à parte — diz se o queres fora

## Música

A secção passou a ter página própria em 03/09/2026 — `/musica/` e as quatro
traduções. A loja é a mesma nos dois sítios: o código vive em
`regras/musica.js` e a página inicial ficou com um convite.

**Decidido em 03/09/2026 — o pagamento fica fora do site.** Tudo se trata por
WhatsApp. A razão é a que já estava escrita aqui: a 1€ por faixa, qualquer
plataforma com taxa fixa por transacção come a venda inteira. Isto deixa de
ser uma falta e passa a ser uma escolha; se um dia o preço médio subir, volta
a valer a pena pensar nisso.

Duas peças do código passaram a ser load-bearing por causa desta decisão, e
não são decoração:

- a **referência de encomenda** (`HS-AAAAMMDD-XXXX`) é a única coisa que liga
  a selecção feita no site à conversa que chega ao WhatsApp
- a **pergunta de regresso** («chegaste a enviar?») é o único mecanismo de
  reconciliação que existe

A factura sai desta lista: seja qual for o canal, é contabilidade e não tem
que ver com o código.

Duas decisões fechadas em 03/09/2026, para não voltarem a aparecer como
dúvida:

- **A guitarra aparece no telemóvel da página**, apesar de o elemento no CMS
  ter `showMobile: false`. Essa bandeira governa um `floatImage` — uma
  decoração que flutua sobre a secção da página inicial. Na página não flutua:
  é a figura do hero, a única imagem que lá está. São dois componentes a
  partilhar um ficheiro. Se um dia tiver de ser controlável na página, leva
  campo próprio.
- **O botão da barra desliga-se quando a lista está vazia.** Com uma pesquisa
  sem resultados não há o que arrancar, e um botão vivo que não faz nada é o
  defeito que estávamos a corrigir. Não se limpa o filtro que a pessoa pôs —
  isso responderia a outra pergunta. Se já houver música a tocar, o botão
  continua vivo, senão não havia como pausar.

Por fazer:

- **Teste completo** do processo de compra, de ponta a ponta
- **Playlist diária** — a ideia ficou por implementar

## SEO

Feito: robots.txt, canonical, Open Graph, JSON-LD, 404 a sério, **endereços
próprios para as 22 asas** (110 páginas, 5 idiomas), **sitemap gerado** com as
112 URLs e **hreflang** entre as cinco versões de cada asa.

Por fazer:

1. **Conteúdo** — as páginas que querias (/parakite/, /pilot2wing/,
   comparações) não existem. SEO num site sem conteúdo não optimiza nada
2. **Páginas de família** (/asas/parakites/) — ficaram de fora de propósito:
   uma lista de asas sem texto próprio é conteúdo fraco. Entram quando houver
   um parágrafo a sério sobre cada família
3. **Search Console** — submeter o sitemap depois da primeira publicação com
   as páginas
