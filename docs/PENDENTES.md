# Pendentes

O que está por fazer e o que está por decidir. Vai sendo actualizado à medida
que as coisas aparecem — o que se decide sai daqui e passa a estar escrito nas
regras ou no código.

Última actualização: 24/08/2026

---

## PRIORITÁRIO · Navegação global das páginas geradas

Descoberto em 30/08/2026, durante a revisão visual do pilar.

**As 131 páginas geradas não têm menu.** Nem `/parakite-portugal/`, nem
`/smartground/`, nem `/flow-paragliders-portugal/`, nem nenhuma das 110 páginas
de asa. Verificado uma a uma: `class="burger"` aparece **zero** vezes em todas.

O menu é construído pelo `buildMenu()` do `app.js`, que só corre na página
inicial. As páginas geradas têm `.pg-topo` — marca, linha de dealer e seletor
de idiomas — e mais nada. Quem aterra numa asa vinda do Google só pode voltar à
raiz ou mudar de língua.

**O que se quer:** que as páginas geradas tenham acesso à navegação principal —

    Início · Parakite · SmartGround · Flow Paragliders · Produtos · Música

**As duas condições que tornam isto não-trivial:**

1. **Sem duplicar a lógica.** O menu vive em `content/settings.json` e é lido
   pelo `app.js`. Se o gerador escrever um segundo menu à mão, passam a existir
   duas fontes de verdade — e um dia dizem coisas diferentes. Foi exactamente
   isso que aconteceu com os rótulos de família antes de irem para
   `regras/taxonomia.js`.

2. **As cinco línguas.** Metade das entradas são âncoras da página inicial
   (`#produtos`, `#music`) e metade são páginas próprias. Numa página gerada,
   uma âncora não existe: tem de virar `/en/#produtos`. O `local()` do `app.js`
   já resolve isto no browser; o gerador precisa do equivalente.

**Não implementar sem analisar primeiro.** A solução tem de sair do mesmo
`settings.json`, provavelmente por um módulo partilhado em `regras/`, como já
aconteceu com a taxonomia e as unidades.

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

- **Teste completo** do processo de compra, de ponta a ponta
- **Playlist diária** — a ideia ficou por implementar
- **Plataforma de pagamento** que trate do IVA europeu — a venda a 1€ não é
  viável com taxas fixas por transacção

## SEO

Feito: robots.txt, canonical, Open Graph, JSON-LD, 404 a sério, **endereços
próprios para as 22 asas** (110 páginas, 5 idiomas), **sitemap gerado** com as
112 URLs e **hreflang** entre as cinco versões de cada asa.

Por fazer:

1. **Conteúdo** — as páginas que querias (/parakite/, /smartground/,
   comparações) não existem. SEO num site sem conteúdo não optimiza nada
2. **Páginas de família** (/asas/parakites/) — ficaram de fora de propósito:
   uma lista de asas sem texto próprio é conteúdo fraco. Entram quando houver
   um parágrafo a sério sobre cada família
3. **Search Console** — submeter o sitemap depois da primeira publicação com
   as páginas
