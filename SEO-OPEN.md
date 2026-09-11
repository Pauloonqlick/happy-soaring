# SEO — o que está em aberto

Estado. As regras do processo estão no `SEO-WORKFLOW.md`.

Última reconciliação: **11/09/2026**, e desta vez contra **dados de
desempenho**, não só de cobertura — é a primeira vez que este ficheiro tem
cliques e impressões reais. A secção seguinte é toda nova por isso.

O site está publicado no deploy **`d03577bf`** desde **11/09 às 16:17**, sobre
o commit **`71bc4b5`**, com `sujo: false` — a árvore, o GitHub e o site estão
os três no mesmo ponto.

**Onze deploys em 10 e 11/09**, por esta ordem:

```
4c829982  10/09 19:03  commit 8ec61c6, ÁRVORE SUJA — o schema, as FAQ, as
                       descrições, as imagens e o contacto
9af9b2d7  10/09 19:09  commit aa463ba — o email_off do Cloudflare, e a
                       primeira vez que o meta.json saiu limpo
c3efacc4  10/09 19:33  commit 602f7d9 — os títulos sem sufixo de marca, o
                       contacto ao lado dos botões, as descrições dos spots
135c8f42  10/09 20:11  commit c77986e — a página do curso, 5 línguas
28b85f49  10/09 22:07  commit 546edbf — os acessos à página do curso
a2015d7b  11/09 08:51  commit 58a033f — o cartão do Pilot2Wing
27235924  11/09 10:12  commit eaa546c — as fotografias nos cartões do hub Flow
bdce4f27  11/09 14:34  commit d709615 — os locais do curso, e as 2 573
                       fronteiras de texto que colavam em 170 páginas
e9047eaf  11/09 14:46  commit a7377e8 — o Alfarim passa a página, 175 URLs
502fa63f  11/09 15:47  commit 32f9edc — o x-default para inglês, e os dados
                       de desempenho no SEO-OPEN
d03577bf  11/09 16:17  commit 71bc4b5 — as fotografias dos spots saem do
                       popup e entram nas páginas
```

**A exportação de Cobertura é de 04/09** e portanto anterior a todos: não viu
as 15 páginas de spot, nem o sitemap sem `lastmod`, nem os ícones da marca,
nem nada do que entrou nestes seis deploys. **Nada aqui mede o site actual.**

E há uma razão nova para contar com oscilação na próxima medição: **159
títulos mudaram de uma vez** e entraram **5 páginas novas**. Títulos que mudam
costumam oscilar antes de estabilizar.

Última auditoria completa do site: **10/09/2026**, medida no ficheiro e no
browser. Nota global 7,2 em treze dimensões. Dela saiu quase tudo o que se
segue.

---

## DESEMPENHO — a primeira medição real
exportado a 11/09 · Search Console, pesquisa Web, **últimos 3 meses**

```
TOTAL          88 cliques · 680 impressões · CTR 12,9%

               impressões        cliques          CTR
Portugal       206  (30%)        59  (67%)       28,6%
Estrangeiro    474  (70%)        29  (33%)        6,1%
```

**Setenta por cento das impressões já são estrangeiras.** O Google mostra o
site lá fora, e muito. O que falha é o clique — e essa é a distinção que
muda a estratégia toda.

### O idioma não é a barreira, e são os próprios dados que o dizem

```
Áustria          38 impr   11 cliques   CTR 28,9%   pos 5,5
Alemanha         80 impr    2 cliques   CTR  2,5%   pos 8,4
França           53 impr    3 cliques   CTR  5,7%   pos 9,4
Estados Unidos   42 impr    1 clique    CTR  2,4%   pos 11,9
Espanha          34 impr    0 cliques   CTR  0,0%   pos 9,3
Suíça            27 impr    0 cliques   CTR  0,0%   pos 10,1
```

**A Áustria converte melhor do que Portugal**, em alemão, com exactamente a
mesma arquitectura que a Alemanha tem. Se a língua base fosse o problema, a
Áustria não fazia 28,9%.

Isto responde à pergunta do Paulo — *«95% dos meus clientes são estrangeiros
e eu cometi o erro de ter o idioma base em português»*. **Não foi esse o
erro.** A arquitectura multilingue está certa e mede-se a funcionar.

### O que os estrangeiros estão mesmo a ver

As consultas com mais impressões de fora são todas de catálogo:

```
flow mullet 2  18    albatroxx  12    flow albatroxx   10
flow vissta xc  7    flow yoti 3 7    flow mystic       5
```

E aterram nas fichas, que não convertem:

```
/en/wings/albatroxx/       44 impr   1 clique   2,3%
/de/schirme/mulletx/       20 impr   0 cliques  0%
/en/wings/future-power/    16 impr   0 cliques  0%
/en/wings/yoti-3-light/    15 impr   0 cliques  0%
```

**A procura estrangeira é gente a investigar modelos Flow**, de qualquer
parte do mundo, que aterra na ficha de um revendedor português — e que quer
um revendedor no país dela. Não é procura de curso.

**A procura de curso é minúscula e é portuguesa:**

```
parakite portugal  24 impressões
parakite kurs      14              ← a única estrangeira com volume
parakite lessons    1
parakite course     1
```

Os 95% de clientes estrangeiros e os 67% de cliques portugueses **não se
contradizem**: descrevem dois canais diferentes. A pesquisa traz catálogo
Flow; os clientes de curso vêm do Instagram, da FelloFly e do boca-a-boca.

### O que converte

```
/en/                    20 cliques   66,7% CTR   pos 1,8   ← 23% de tudo
/pilot2wing/             3 cliques   30,0% CTR   pos 2,5
/o-que-e-um-parakite/    5 cliques   22,7% CTR   pos 4,2
/parakite-portugal/      6 cliques   20,0% CTR   pos 5,9
```

**As páginas de conceito e de método convertem. O catálogo não** — e é assim
que tem de ser. O trabalho das 110 fichas é fazer a Happy Soaring existir
para a Flow, que é como um revendedor é encontrado. **Não se julgam por CTR.**

### O que fazer com isto

1. **Não mexer na arquitectura de idiomas.** Migrar 175 URLs seria pagar caro
   por um problema que os dados dizem não existir.
2. **`parakite kurs` é a oportunidade real** — única consulta estrangeira de
   curso com volume, posição 7,79, e a página alemã do curso nasceu a 10/09.
3. **Perceber a Áustria.** 11 dos 29 cliques estrangeiros vêm de lá com o
   melhor CTR do site. Se for um contacto ou um cliente, é o modelo do que
   funciona.

### Duas ressalvas, e a segunda é séria

**88 cliques em três meses são poucos.** A diferença entre a Alemanha a 2,5%
e a Áustria a 28,9% pode ser real ou pode ser ruído a esta escala. Isto é
direcção, não certeza.

**Os dados param a 08/09.** Não incluem os títulos sem sufixo, a página do
curso, os locais, o Alfarim, nem a correcção do snippet. **Nada do que se fez
a 10 e 11/09 está medido aqui.**

### O `www` ainda aparece como página à parte

```
https://www.happysoaring.com/   127 impressões   7 cliques   5,5%   pos 8,2
https://happysoaring.com/        77 impressões  14 cliques  18,2%   pos 5,5
```

O `www` tem **mais impressões do que o apex** e metade do CTR. Verificado a
11/09: **o 301 existe e funciona** (`www` → apex, ao nível do Cloudflare, não
do `_redirects`). Logo isto é consolidação por terminar, não defeito aberto.
Vale a pena reconfirmar na próxima exportação — se as impressões do `www` não
descerem, aí sim há o que investigar.

---

## PUBLICADO A 10/09

### O que entrou no deploy 4c829982
publicado: 2026-09-10 19:03 · 503 ficheiros, 60,6 MB · 180 novos de 502

Verificado em produção: `/`, `/pilot2wing/`, `/parakite-portugal/`,
`/o-que-e-um-parakite/`, `/asas/albatroxx/` e `/de/schirme/albatroxx/` a 200; o
`/reflex-lab/` a 301; o `sitemap.xml` a 200.

```
Organization declarada          5 → 164 páginas
referências penduradas          24 → 0
FAQPage                          0 → 10 páginas, 65 perguntas
descrições das asas             média 40 → 133 caracteres
descrições abaixo de 70          106 → 0 páginas
contacto (email e telefone)      0 → 164 páginas
peso publicado                  63,2 → 60,6 MB
```

**A `Organization` passou a ir declarada e não referenciada.** O desenho
anterior — declarar só no `index.html` e referenciar o `@id` nas geradas —
resolvia o problema certo, que era haver três Happy Soaring diferentes. Mas 24
páginas apontavam para um nó que não estava no grafo delas, e um rastreador de
IA que leia uma ficha de asa sem ter lido a inicial não fica a saber quem a
publica. O `@id` continua a ser um só; o nó é copiado igual em todas, e isso
está verificado — o nó do `index.html` é idêntico ao de uma ficha de asa e ao
da `/de/index.html`.

**As descrições das asas nunca precisaram de texto novo.** O gerador fazia
`t(p.tagline, l) || t(p.descricao, l)`, e o segundo operando nunca era
alcançado porque as 22 asas têm todas tagline. A `descricao`, com 146 a 303
caracteres escritos nas cinco línguas, não estava a ser servida a ninguém.
Passou a compor as duas por frases inteiras até 160 caracteres.

**Indexabilidade verificada, e não estava em risco.** Grafo de ligações,
alcance a partir das cinco iniciais, duas passagens — HTML servido e DOM
renderizado: **164 de 164 alcançáveis nas duas** quando isto se mediu. O
caminho que o garante é o `/flow-paragliders-portugal/`, que liga às 22 asas,
é estático, e está no menu de todas as páginas.

*Actualização de 11/09:* o site tem agora **170 páginas** e a verificação
`17` do `verificar.mjs` confirma **zero órfãs**. As cinco páginas do curso
foram verificadas uma a uma em produção — sem `noindex`, canonical
auto-referencial, no sitemap — e são alcançáveis de **160 das 165** páginas,
porque a entrada entrou no menu. As cinco que faltam são as iniciais, cujo
menu é construído pelo `app.js`: verificado no browser que a versão hidratada
tem a entrada.

---

## AGUARDAR GOOGLE

### Os cinco vídeos dos spots passaram a conteúdo indexável
aberto: 2026-09-11 · **rever depois de: 2026-09-25**

Até hoje os `videoId` dos spots viviam num `<script type="application/json">`
atrás de um popup. Nenhum motor de busca os associava a uma página: não eram
conteúdo, eram dados de um widget.

Agora estão numa `<figure>` na página do spot, com `VideoObject` no JSON-LD —
`thumbnailUrl`, `contentUrl`, `embedUrl` e `inLanguage`. Cinco spots, cinco
línguas.

```
Fonte da Telha     1CAWZKhxcGM
Praia do Meco      m9qO0LaV3t0
Praia da Gralha    XkkG4DAGlK8
Praia das Bicas    nAymp6E4TuA
```

**O que observar:** há uma exportação de *Video indexing* de 10/09 nos
Downloads do Paulo, anterior a isto. Reexportar daqui a duas semanas e
comparar. Se o Google passar a associar os vídeos aos spots, é ganho novo — e
não estava em nenhuma lista até hoje.

**Não é promessa.** Um `VideoObject` correcto é condição necessária e não
suficiente: o Google decide se o vídeo é o conteúdo principal da página, e
aqui não é — é uma figura dentro de um texto. Pode não resultar em nada, e
isso também é informação.

### 7 fichas de asa por rastrear
```
/de/schirme/fusion/          8 ligações de entrada
/en/wings/rpm-3/             4
/en/wings/vissta-xc/         3
/es/alas/albatroxx/          6
/fr/ailes/mohawk/            6
/fr/ailes/rpm-3/             4
/fr/ailes/yoti-3/            3
```
aberto: 2026-09-06 · auditado: 2026-09-08 · **corroborado: 2026-09-11**
rever depois de: 2026-09-25, com a remedição da AI Overview

**Mudou o nome do problema.** Não é "por indexar" — é **por rastrear**. Todas
aparecem na Cobertura com `1970-01-01` em "Último rastreado", que é a época
Unix e portanto ausência de data. O Google conhece os endereços e **nunca os
foi buscar**. Não houve decisão sobre a qualidade das páginas; houve uma fila
em que não chegou a vez delas.

**Sem alteração recomendada.** Auditadas a 08/09 as 40 URLs das oito asas
envolvidas — as afectadas e as irmãs indexadas como controlo. Todas existem,
respondem 200 sem redireccionamento, estão no sitemap, têm canonical
auto-referencial, seis `hreflang` recíprocos, nenhuma `meta robots`, nenhum
`X-Robots-Tag` e o mesmo JSON-LD. **Zero anomalias.** As afectadas são
indistinguíveis das indexadas.

**A hipótese das ligações internas está fechada, agora com controlo por asa e
por língua.** Contando só ligações editoriais, cada asa tem exactamente o mesmo
número de entradas nas cinco línguas: a `/de/schirme/fusion/` tem 8 e não está
rastreada, a `/asas/fusion/` tem as mesmas 8 e está indexada. O mesmo nas oito.

**O padrão é de distribuição, não técnico.** Das 11 URLs neste estado a 04/09:
`de` 5, `fr` 3, `en` 2, `es` 1, **`pt` 0** — e cada língua tem as mesmas 33
URLs no sitemap. O sitemap está intercalado por asa, sempre na ordem
`pt, en, es, fr, de`, e a taxa segue quase a posição no grupo: 0%, 9%, 5%, 14%,
23%. Duas leituras explicam isto igualmente bem — a ordem no sitemap, ou o
orçamento de rastreio seguir a procura por língua. **Estes dados não escolhem
entre as duas**, e o espanhol quebra a série.

Duas coisas mudaram depois do fim destes dados e ainda não foram medidas: o
sitemap deixou de dizer que tudo muda todos os dias, e o site passou a ter
favicon. A primeira é o único mecanismo que controlamos que toca no
agendamento de rastreio.

Acção manual disponível: pedir indexação no Search Console.

**CORROBORADO A 11/09 POR UMA SEGUNDA FONTE, E O CONTROLO É LIMPO**

A exportação de Desempenho (últimos 3 meses, até 08/09) é um relatório
diferente do de Cobertura e foi feito com outro propósito. Cruzadas as duas,
dizem o mesmo:

```
ASA          AFECTADA                impr    IRMÃ DE CONTROLO      impr
fusion       /de/schirme/fusion/        0    /asas/fusion/            6
rpm-3        /en/wings/rpm-3/           0    /asas/rpm-3/            14
vissta-xc    /en/wings/vissta-xc/       0    /asas/vissta-xc/         3
albatroxx    /es/alas/albatroxx/        0    /asas/albatroxx/         4
mohawk       /fr/ailes/mohawk/          0    /asas/mohawk/            6
rpm-3 fr     /fr/ailes/rpm-3/           0    /asas/rpm-3/            14
yoti-3       /fr/ailes/yoti-3/          0    /en/wings/yoti-3/        2
```

**Sete em sete: a afectada a zero, a irmã com impressões.** Uma página não
rastreada não pode ter impressões, por isso isto não é surpresa — o que vale
é a limpeza do controlo. Nenhuma das sete teve **uma única** impressão em três
meses, enquanto todas as irmãs tiveram.

Isto fecha a dúvida sobre se a Cobertura estava a relatar mal: não estava. E
mantém a condição viva até **08/09**, quatro dias depois do que a exportação
de Cobertura via.

**Não muda a recomendação** — continua a não haver alteração a fazer nas
páginas, porque continuam indistinguíveis das irmãs. Muda a confiança no
diagnóstico, que passa a ter duas fontes independentes.

### As quatro fichas alemãs fechadas a 06/09 aparecem nesta exportação
```
/de/schirme/f2-light/   /de/schirme/panorama/
/de/schirme/rpm-3/      /de/schirme/yoti-3/
```
nota: 2026-09-08 · **não é regressão**

Foram fechadas a 06/09 com duas observações da URL Inspection API. Esta
exportação é de **04/09** — anterior à evidência do fecho — e vem da Cobertura,
que é outro método. Ficam fechadas.

Fica escrito para que a próxima corrida completa saiba o que verificar: se
voltarem a aparecer com dados **posteriores a 06/09**, aí é regressão e
reabre-se como tal.

### 15 páginas de spot publicadas a 06/09
```
/parakite-portugal/fonte-da-telha/     e as 4 traduções
/parakite-portugal/praia-da-gralha/    e as 4 traduções
/parakite-portugal/praia-do-meco/      e as 4 traduções
```
aberto: 2026-09-06 · rever depois de: 2026-09-13

Publicadas no próprio dia. Sem medição posterior — a exportação de 04/09 é
anterior a existirem.

---

## PENDENTE

### A AI Overview do Google cita sete fontes, e nenhuma é nossa
medido: 2026-09-11 · **o achado mais importante do dia**

Medição própria, via DataForSEO, da SERP de `curso parakite` em **Portugal,
em português, desktop, profundidade 100**. Três chamadas, $0,06.

**A posição orgânica é boa** — e desmente o que eu tinha escrito antes de
medir:

```
#7   /curso-parakite-portugal/     5.º resultado orgânico
#15  /pilot2wing/
#68  /  (a inicial)
```

Acima dela, só **um concorrente real**: o `flywithbehrooz.com/pt/parakite-week.html`
em #2. Os outros que a antecedem são o Chile e os Pirenéus, que não competem
por um piloto português. E a Happy Soaring **supera as oito escolas** que eu
tinha listado — duas delas nem estão no Top 100.

**Mas a AI Overview está no lugar 1, cita sete fontes, e nenhuma é nossa:**

```
flywithbehrooz.com/pt/parakite-week.html        citada — E COM LIGAÇÃO
                                                dentro da frase
valledebenasque.es/cursos-go-flare-moustache…   citada
paravidaparapente.cl/parakite/                  citada
flyparakite.com/en/parakite-course-dune-du-pilat/ citada
3 vídeos de YouTube (FlySpain, go.FLARE ×2)     citados
──────────────────────────────────────────────────────────
happysoaring.com                                zero
```

Na secção «Requisitos comuns» escreve, em português: *«Em Portugal, existem
opções de formação e adaptação com escolas e instrutores especializados (por
exemplo, em locais como Sesimbra através do **Fly with Behrooz**)»* — com
hiperligação no meio do texto.

**A citação não depende da posição:** o `flyparakite.com` está em #11, abaixo
de nós, e é citado.

**O que as quatro citadas têm e nós não tínhamos:** uma frase em prosa a
dizer o que o curso ensina. O que o Google tinha de nós era a tabela de
preços com as palavras coladas — `«4 diasduração de referência»` — que era o
excerto que ele punha a **negrito** no snippet.

**Duas hipóteses, e nenhuma descartada:**

1. **A extracção partida.** Corrigida a 11/09 no deploy `bdce4f27`.
2. **A idade.** A página tinha 17 horas quando foi medida.

Só uma remedição as separa. **Remedir a 25/09**, com os mesmos parâmetros. Se
a citação aparecer, confirma-se a hipótese 1.

**Uma terceira, contributiva e agora tratada:** a página não dizia onde o
curso acontece — zero locais em 2 905 palavras — e a resposta da IA
organizou-se por *requisitos e locais*. Fechado a 11/09.

### Os quatro visuais que a página do curso não tem
aberto: 2026-09-10

A página foi ligada e gerada a 10/09 **sem** eles, de propósito: nenhum é
estrutural — cada bloco onde iam já carrega o seu próprio visual, e esperar
por eles custava semanas de indexação na página que vende o curso.

```
bloco  7   diagrama · resultado certo com técnica errada e com técnica correta
bloco  9   diagrama · a cadeia perna–bacia–harness–risers–asa
bloco  9   vídeo    · As pernas em groundhandling
bloco  9   vídeo    · As pernas em voo
```

Cada um foi verificado antes de sair. O do bloco 7 ia ilustrar o contraste
que as duas colunas comparadas (`habitoColunas`) já fazem estruturalmente.
O diagrama do 9 ia desenhar a cadeia que o componente `cadeia(C.cadeiaElos)`
já lista, no mesmo bloco que tem ainda a silhueta SVG com seis marcadores,
os chips e uma fotografia. Os dois vídeos ficavam no H3 do groundhandling,
que tem texto, chips e fotografia.

**Retirar do HTML não é decidir que não se fazem.** É decidir que não se
espera por eles.

### A fotografia do herói do curso
aberto: 2026-09-10

A página usa a `/images/course.jpg`, que é o fundo do slide dos produtos da
página inicial. Não é reserva — é uma fotografia real de 1920×1200 —, mas é
a mesma que o visitante pode acabar de ver na inicial.

Foi escolhida por eliminação: o `hero-bg.jpg` é o herói do
`/parakite-portugal/` e colidiria com uma página irmã. Um fundo de slide é a
colisão mais barata das três.

O critério da encomenda está fechado no `FECHADO A 10/09`: **tem de valer em
monocromático azul.** Falta o resto do brief, que é decisão de imagem — um
piloto ou dois, a asa visível e identificável como Parakite, a zona escura à
esquerda até aos 45% da largura, e uma imagem própria para mobile porque o
recorte de `object-fit:cover` a 375px guarda só a faixa central.

### 2 URLs em 404, e faltam-me os endereços
aberto: 2026-09-08

A Cobertura de 04/09 conta 2 páginas em "Não encontrado (404)" com origem
"Website", mas a exportação que tenho traz só a contagem. **Sem os endereços
não se investiga.**

Não são ligações que estejam no site hoje: a verificação 17 e a das ligações
internas passam a zero. Candidatos prováveis são endereços que o Google guardou
de versões antigas.

O que falta: no Search Console, abrir a linha "Não encontrado (404)" e usar o
**Exportar** de dentro da linha.

Na mesma exportação há 1 página em "Página com redireccionamento". **Não é
problema** — o `_redirects` tem 13 regras 301 deliberadas (`/coming-soon/`, as
dez do `smartground` → `pilot2wing`, e o `/reflex-lab/`), e uma página nesse
balde é o resultado esperado dessas decisões.

---

## DECISÃO PAULO

### Seis ficheiros de imagem sem quem lhes aponte, 5 397 KB
aberto: 2026-09-10

```
pilot-walk.png                   1 416 KB
pilot-lines.png                  1 374 KB
smartground/movimento-left.webp  1 015 KB
pilot-stand.png                    826 KB
glider-top.png                     411 KB
glider-fly.png                     353 KB
```

Procurei os cinco primeiros nomes, sem extensão, em todo o `.js`, `.mjs`,
`.json`, `.css` e `.html` do repositório: **zero ocorrências**. O sexto é
referenciado só pelo `_smartground.html`, que não está na lista de autorização
da publicação. E `images` está inteiro nessa lista, por isso os seis vão para
produção em cada deploy.

**Não os apaguei.** Podem ser material guardado de propósito — foi o que
aconteceu com a pasta do `reflex-lab`. São recuperáveis com `git checkout`, mas
apagar é decisão do Paulo.

Ressalva ao número: uma auditoria completa de órfãos não se faz por varredura,
porque as variantes de cor são construídas por concatenação
(`/images/asas/<asa>__<cor>.webp`) e os ícones vêm do `site.webmanifest`. Os
seis acima foram verificados um a um.

### A inicial perde 21 das 22 ligações às asas quando o app.js hidrata
aberto: 2026-09-10

| | HTML servido | depois do `app.js` |
|---|---:|---:|
| ligações para `/asas/` | 22 | **1** |
| H3 | 11 | 4 |

O bloco estático fica dentro do `<main id="app">` e é substituído. O widget
hidratado é um **configurador** — abas de família, tamanhos, cores — que mostra
uma asa de cada vez, e por isso resta a ligação da asa selecionada.

**Não é indexabilidade.** As 164 páginas continuam alcançáveis pelo
`/flow-paragliders-portugal/`, que é estático e liga às 22. É distribuição de
autoridade interna: a página com mais autoridade do site quase não passa nada
ao catálogo — e isso cruza-se com as sete fichas por rastrear no topo deste
ficheiro.

Não é cloaking: o material sai do mesmo JSON, como o comentário do gerador
exige. O que difere é o grafo de ligações.

**Corrigir mexe no `app.js`**, no widget mais complexo da inicial, e muda o que
se vê. Duas saídas: manter as ligações do catálogo na vista hidratada, ou tirar
o bloco estático de dentro do `#app` para sobreviver à hidratação — e aí o
índice do catálogo passa a ser visível na página.

### O wordmark da página inicial, e só ele
aberto: 2026-09-05 · medido outra vez: 2026-09-06

O herói do Parakite foi corrigido e sai deste ficheiro. Na inicial mediram-se
os cinco elementos a 1440px e a 375px: o `h1`, o `lead` e o `kicker` passam nos
dois tamanhos. Reprova só o `HAPPY SOARING` — 2,28:1 e 1:1 em desktop, 2,76:1 e
1,01:1 em mobile.

**O laranja não é o problema.** Sobre o azul-marinho do scrim mede 5,11:1. O
que falha é o scrim afinar por baixo da segunda metade da palavra: o `SOARING`
chega aos 45% da largura, e aí a banda escura já vai em .30.

**E não há correcção barata.** Com o scrim *totalmente opaco* à esquerda o
`SOARING` só sobe a 2,66:1 — continua abaixo dos 3:1 exigidos a texto grande.
Para passar era preciso azul quase opaco sobre os primeiros 45% do herói, que é
exactamente o que se tirou do herói do Parakite por tapar a fotografia — está
contado em `pagina.css`, no comentário acima do `.pk-heroi::after`.

O `.wordmark` é um `<div>` com o nome da marca, e o `<h1>` é outro elemento,
por baixo. A norma isenta logótipos e nomes de marca de requisito de contraste
(WCAG 1.4.3), portanto isto não é uma falha numa auditoria. Fica aqui por ser
escolha de desenho e não facto técnico: aceitar a isenção, ou pagar a
fotografia pelo contraste.

### Os clientes OAuth do Google — são pelo menos dois, e ambos em uso
aberto: 2026-09-06 · corrigido: 2026-09-08

Este item já esteve errado duas vezes. A primeira dizia que havia um cliente
abandonado com segredo vivo, e que se revogava num minuto. A segunda dizia que
havia "um cliente OAuth, um só, e não há um segundo em lado nenhum" — verdade
dentro do `ParakiteLog`, mas eu tinha procurado num repositório só.

**Há pelo menos dois clientes, e os dois estão ligados a código vivo:**

- **ParakiteLog** — `GOOGLE_CLIENT_ID` em `code/wrangler.json`. O
  `services/auth.ts` manda o `client_secret` para o endpoint de token da
  Google; o `routes/auth.ts` chama-o e o `index.ts` monta-o em `/api/auth`.
- **HS SEO Intelligence** — `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
  declarados no `wrangler.toml`, com o fluxo OAuth em
  `src/worker-analyzer-v2.js` e a rota `/oauth/callback`. É por aqui que a app
  fala com a URL Inspection API.

Revogar qualquer um deles parte alguma coisa. **Não se revoga nada às cegas.**

No repositório do site não há nada de OAuth — nem nome de variável, nem
endereço, nem chamada. O site não está em causa.

**Falta o que só o Paulo pode ver.** Na consola do Google Cloud, contar os
clientes do projecto. Se forem exactamente dois, são estes e não se toca. Se
houver um terceiro, é esse o abandonado — e identifica-se por não corresponder
a nenhum dos dois `GOOGLE_CLIENT_ID` acima.

---

## FECHADO A 10 E 11/09

### As fotografias dos spots saem do popup e entram nas páginas
fechado: 2026-09-11 · deploy `d03577bf`

O popup do hub mostrava uma fotografia e um resumo — e **o resumo era
literalmente a abertura da página para onde ele próprio ligava**, o mesmo
campo `descricao`. A página, essa, tinha 580 palavras e nada para ver. A
inversão era o pior dos dois lados.

**E não havia carrossel.** Medido:

```
SPOT                  imagens   vídeos   total
Fonte da Telha           0        1        1
Lagoa de Albufeira       1        0        1
Praia do Meco            0        1        1
Alfarim                  1        0        1
Praia da Gralha          0        1        1
Praia das Bicas          1        1        2   ← o único
```

Cinco dos seis têm **uma** peça de média. O próprio código o dizia, com
`nav.hidden = m.length < 2`: as setas, as miniaturas e o contador estavam
escondidos em cinco dos seis casos. Havia maquinaria de carrossel — navegação
por teclado, pré-carregamento da seguinte, contador — para mostrar uma
fotografia.

**O que entrou:** uma `<figure>` por peça, logo depois dos parágrafos de
abertura e antes do primeiro H2. A coluna tem máximo de 280px porque as sete
imagens são verticais: à largura útil da abertura, que é 1020px, uma delas
teria 1813px de altura — um cartaz, não uma fotografia. Com 280 fica nos 498.

Reaproveita o `.pk-play` do hub em vez de reescrever o símbolo.

**O vídeo arranca ao clique, e a caixa não se move:** o iframe nasce com
280×498, que é exactamente a da capa que substitui. Zero pedidos ao YouTube
antes do clique, um depois.

**As capas dos Shorts vieram para casa.** Eram buscadas ao `i.ytimg.com` por
um endpoint não documentado (`oar2.jpg`) com rede no `onerror`. São agora
quatro ficheiros locais de 1000×1779 declarados no `spots.json` — e o hub
também deixou de chamar o YouTube. As sete imagens de spot ficaram todas com
a mesma medida de propósito, para que um par de números sirva todas em vez de
o código ter casos.

**O que saiu do hub:**

```
HTML do hub    41 071 → 28 933 bytes   (-30%)
pagina.css    138 968 → 136 903 bytes  (27 regras + 1 @media)
JSON de dados   4 672 bytes por página
```

A grelha ficou, porque é ela que faz o trabalho — seis fotografias com nomes
percorrem-se, seis linhas de texto leem-se. **O que saiu foi a interceptação
do clique:** os mosaicos já eram `<a href>` para as páginas.

E um mosaico sem página deixou de ser clicável: era um `<button>` que abria o
álbum, e sem álbum um botão que não faz nada é pior do que uma imagem. Hoje
nenhum spot está nesse estado, mas o CMS pode criar um.

**Medido:** 2 figuras de 280×498 a 1440 e uma coluna das mesmas 280×498 a
375; zero transbordo nas duas; zero falhas de contraste, pior 5,68:1; vídeo
verificado a nascer com a caixa igual à capa; 17/17 verificações; zero erros
de consola.

**Uma correcção ao que eu tinha dito ao Paulo:** contei legendas em cinco dos
seis spots. **Estão todas vazias** — contei chaves do JSON, não valores. O
`<figcaption>` fica no código e aparece no dia em que houver uma.

### O texto colava em 2 573 fronteiras, em 170 páginas
descoberto e resolvido: 2026-09-11 · deploy `bdce4f27`

`<b>4 dias</b><span>duração de referência</span>` sem nada pelo meio dá, em
`textContent`, **«4 diasduração de referência»**. Foi assim que o Google
mostrou a página do curso na SERP de Portugal — com a parte colada a negrito,
por ser o excerto que escolheu.

Varridas as 170 páginas: **2 573 fronteiras**, em uns quinze componentes —
fichas de asa, spots, música, chips do Pilot2Wing, cartões do hub Flow. **Não
era um sítio, era um hábito de escrita de templates.**

Por isso a correcção é uma função no `escrevePagina`, pelo mesmo argumento
que já lá estava para os pontos nos títulos: quinze chamadas são catorze.

A lista de tags é **fechada por medição**. O `<button>` ficou de fora porque
no `/musica/` há dois botões irmãos a `inline-block`, e ali um espaço vê-se.
O `<b>`, o `<span>` e o `<i>` ficaram dentro apesar de serem em linha por
omissão, porque neste site são sempre `display:block` quando aparecem colados.

**Prova de que não mexeu num pixel:** caixa de todos os elementos, antes e
depois, em oito tipos de página — 383, 142, 705, 252, 152, 248, 331 e 492
elementos. Os oito digests batem. Peso: 2,5 KB no site inteiro.

### Os locais da formação entram na página do curso
fechado: 2026-09-11 · deploy `bdce4f27`

A página não tinha **um único nome de lugar** em 2 905 palavras. Dizia «os
spots da zona de Lisboa e da Península de Setúbal», que é verdade e não
responde à pergunta — e foi por aí que a AI Overview respondeu, nomeando um
lugar e o concorrente que o tem no título.

```
menos de 35 minutos de Lisboa, sem local fixo, escolhido pelo vento do
dia e pelo nível do piloto

Alfarim              groundhandling
Fonte da Telha       primeiros voos
Lagoa de Albufeira   voo, conforme as condições
Praia do Meco        voo, conforme as condições
```

A ordem é pedagógica, não geográfica: chão, primeiros voos, voo. É a tese da
página aplicada ao mapa. **Só dois papéis foram dados** — os outros dois
dizem «depende do vento e do nível do piloto», que foi a resposta literal, em
vez de lhes inventar uma função.

Reaproveita o `pk-eixos`, que já é uma grelha de quatro: zero CSS de
maquetação. Precisou de uma regra de cor — os links herdavam o laranja da
página e davam **2,87:1** sobre a ilha branca contra um limiar de 3:1. O
`--laranja-tinta` já existia para isto, documentado na folha com este mesmo
2,87. Passa a **6,3:1**.

### O Alfarim passa a página
fechado: 2026-09-11 · deploy `e9047eaf` · **sitemap 170 → 175 URLs**

Estava no `spots.json` com `publicar: false` e sem uma linha de conteúdo
desde que o ficheiro existe — e é o local do groundhandling, a base do
método, o único dos quatro locais do curso sem página própria.

Texto do Paulo, arrumado no molde do CMS e traduzido: 8 secções, 10 linhas de
ficha, aviso de segurança, ~580 palavras em PT e o equivalente nas outras
quatro. **Sem coordenadas e sem valores de vento** — a própria página explica
porque não os dá, e essa recusa é conteúdo, não lacuna.

Fotografia 1725×3072 → **1000×1779 WebP, 107 KB**, que é a convenção dos
outros spots e mais leve do que os dois existentes.

**A ligação na página do curso apareceu sozinha.** O helper `grelhaLocais`,
escrito nessa manhã, liga só os spots com `publicar: true`, e o comentário
dizia «no dia em que a página do Alfarim for escrita, a ligação aparece
sozinha e ninguém volta aqui». Não se voltou.

### O `x-default` aponta para inglês
fechado: 2026-09-11 · deploy `502fa63f` · verificado em produção

```
antes   x-default → /curso-parakite-portugal/
agora   x-default → /en/parakite-course-portugal/
```

Nas **175 páginas**, cada uma para a sua própria variante inglesa — a alemã
do curso aponta para a inglesa do curso, não para a raiz.

**Não é correcção de bug: é decisão de negócio.** O `x-default` é o que o
Google serve a quem **não corresponde a nenhuma das cinco línguas** — a
Holanda, a Polónia, a Suécia, a Chéquia, que aparecem todas na exportação com
impressões e zero cliques. Com ele em português, essa pessoa era mandada para
a única língua que quase de certeza não lê.

Não muda nada para quem corresponde: o alemão continua a receber `/de/`,
porque é a etiqueta `de` que manda. E não mexeu num único endereço.

Verificado em produção em cada tipo de página: a inicial → `/en/`, a alemã do
curso → `/en/parakite-course-portugal/`, a ficha da Mullet 2 →
`/en/wings/mullet-2/`. **175 de 175.**

### O encaminhamento de idioma na raiz já existia — e eu disse que não
registado: 2026-09-11

Recomendei ao Paulo «corrigir» a falta de negociação de idioma na raiz, com
base num teste de `curl` que devolvia 200 em português para qualquer
`Accept-Language`. **O `curl` não executa JavaScript.**

Testado no browser com o `localStorage` limpo, a caixa aparece:
*«View Happy Soaring in English? · Switch to English · No, thanks»*

E está melhor construída do que o redireccionamento que eu ia propor:

```
sugere, não redirecciona      quem quer ler em PT não é arrastado
só na raiz                    quem escreveu /de/ já disse o que quer
data-nosnippet                o Google não põe o botão no resumo
hs-idioma-nao                 fechar é «não a esta», não é escolher
Googlebot nunca encaminhado   não tem localStorage
```

Fica registado porque é a quarta vez no mesmo dia que **medir através do
instrumento errado** me deu uma conclusão falsa: o `curl` sem JS, a
ferramenta de pesquisa em vez do Google, o iframe em vez do documento, e uma
regex que inseria os espaços que devia estar a procurar. **Sempre que um
número vier por um intermediário, confirmar na fonte.**

### O Cloudflare ofuscava o email do rodapé
descoberto em produção: 2026-09-10 · **resolvido e publicado** no `9af9b2d7`

A opção **Email Address Obfuscation** do Cloudflare reescreveu o link do
rodapé nas 159 páginas:

```
o que se publicou   <a href="mailto:paulo.pereira@happysoaring.com">paulo.pereira@…</a>
o que o Cloudflare  <a href="/cdn-cgi/l/email-protection#c5b5a4…">
serve               <span class="__cf_email__" data-cfemail="…">[email protected]</span>
```

Consequência: sem JavaScript o link morre, e **o endereço deixa de estar no
HTML como texto** — que era metade da razão de o pôr ali, porque um endereço em
texto é um facto que um motor de resposta consegue devolver.

**O que NÃO foi atingido:** o JSON-LD passou intacto. Verificado em produção, a
`Organization` da `/asas/albatroxx/` serve `email`, `telephone` e
`contactPoint.email` corretos. O `tel:` também passou intacto. Portanto a
camada legível por máquina — a que mais conta — está boa desde já.

**Corrigido no gerador** com `<!--email_off-->` / `<!--email_on-->`, que é a
saída documentada do Cloudflare, e fica inofensivo se a opção for desligada.

Publicado no `9af9b2d7` e **verificado em produção**: zero `__cf_email__` em
quatro páginas, incluindo uma traduzida, e o `mailto:` a chegar em texto. A
alternativa — desligar o Email Address Obfuscation no Scrape Shield do
Cloudflare — deixou de ser necessária, mas continua a ser a opção mais robusta
se algum dia se acrescentar outro endereço ao site.

### O cartão do Pilot2Wing na página inicial
fechado: 2026-09-11

Era a versão posterizada em laranja da mesma fotografia que o bloco 8 do curso
usa. Passou à natural, e **não por cópia do ficheiro**: a
`body-first-treino.webp` tinha 18% de margem à esquerda e 13% à direita, e a
laranja estava cortada ao osso — sem cortar ao alfa primeiro, a figura
aparecia 22% mais pequena no mesmo espaço. Cortada dá 615×1223, e o recorte
mede 133×264 no cartão contra os 119×264 de antes. Três KB mais leve.

A figura atravessa duas superfícies — a secção é branca, o cartão é
`rgb(27,34,42)` — e mediu-se em cada banda. Sobre o branco: **5,98:1** contra
os 4,13 da laranja. Dentro do cartão: 4,45:1, com **23% dos pixéis abaixo de
1,6:1** contra 4% da laranja.

**Esse 23% pareceu problema e não é.** Montou-se a composição exacta para ver
em vez de deduzir: os 23% são os calções escuros, e ficam na linha em que a
figura entra no cartão. É ali que o recorte se deve dissolver, e é para isso
que o gradiente do `::before` existe. Lê melhor do que a laranja, que tinha a
camisola e os calções a competir os dois com a cor do cartão.

Não é item de SEO. Fica registado porque mudou um activo publicado.



### A página do curso foi ligada ao site
fechado: 2026-09-10

Existia em prévia desde o início do mês, com o conteúdo editorial fechado nas
cinco línguas, e **nada no site lhe apontava**. Está ligada:

```
paginaCurso() no gerador          5 páginas, uma por língua
sitemap                           165 -> 170 URLs
publicar.mjs                      curso-parakite-portugal autorizado
pagina.css                        as 105 linhas que viviam na prévia
ligações de entrada               10 páginas: Pilot2Wing e hub, nas 5 línguas
```

**O botão do Pilot2Wing cumpriu o que o comentário dele pedia** desde que foi
escrito: «enquanto /curso-parakite-portugal/ não existir, o botão pede
informações por WhatsApp. Trocado pela página quando ela for feita.» Passou a
apontar para a página, que responde antes de haver pergunta. O WhatsApp
continua no bloco 16 da própria página.

**O CSS não precisou de âmbito quase nenhum, e isso foi medido.** Os
`[data-cols]` são a chave: esse atributo só existe nesta página, verificado
antes de mover. E as três secções `pk-papel` do `/parakite-portugal/` não têm
nenhum `sg-abord`, `sg-etapa` nem `sg-trans-lista` dentro. As quatro regras
que tocavam o `.sg-trans-lista` sem qualificação levaram `.pg.pk`, que exclui
o tema do Pilot2Wing — o `<i>` daquele componente nem existe lá, mas apostar
num facto que muda com o próximo parágrafo escrito no CMS é apostar.

**Schema:** `Course` com nome, descrição, `provider`, `inLanguage`,
`courseMode: onsite` e seis `teaches`. Sem `hasCourseInstance`, sem `offers` e
sem `courseWorkload`: os quatro dias são duração de **referência** e não
promessa — está escrito assim nas cinco línguas —, e o schema.org não tem
forma de dizer «referência». Mais `WebPage` + `FAQPage` com 9 perguntas.

**Medido:** 16 secções, 15 H2, 41 H3, 6 ilhas claras, 3 088 palavras. Zero
falhas de contraste a 1440 e a 375, em 300 e 294 elementos medidos, pior 5,30.
As cinco grelhas resolvem 6, 4, 3 e 1 coluna em desktop e todas a 1 em mobile.
Sem transbordo. 170 páginas, zero órfãs.

### O sufixo « | Happy Soaring» sai de 159 títulos
fechado: 2026-09-10

Estava aqui como decisão, com um falso dilema: ou a marca, ou o termo de
pesquisa. **Não havia dilema**, e a pergunta que o desfez foi mais simples do
que a análise: porque é que a Happy Soaring tem de aparecer no título de uma
asa que é da Flow?

Não tem. Três razões, e a primeira decide:

**O Google já mostra o nome do site, acima do título.** Desde outubro de 2022,
e tira-o do `WebSite` dos dados estruturados, do `og:site_name` ou do título
da inicial. Os três estão servidos em todas as 164 páginas — o
`WebSite.name` entrou a 10/09 com a Organization. O sufixo era duplicação de
um sinal que o site já dá.

**Era a parte que o corte levava primeiro.** Custava 15 caracteres e muitas
vezes não chegava a aparecer: pior dos dois mundos.

**E numa página dizia a marca duas vezes:** «Happy Soaring Music — música
original para vídeos de vuelo | Happy Soaring», 74 caracteres.

```
                antes                   agora
fichas de asa   46–77, média 54         30–61, média 38
raiz            49–74, média 61         33–58, média 45
spots           49–63, média 59         33–47, média 43
acima de 60     55 páginas              1
```

A que resta é a alemã da Aura 2 Square, com 61 — um caractere, porque
«Quadratischer Rettungsschirm» é o que a palavra mede em alemão.

**A inicial mantém o nome**, porque lá faz parte da frase e não é sufixo:
«Parakite und Gleitschirmfliegen in Portugal — Happy Soaring». E o `og:title`
das fichas nunca teve sufixo — era já independente.

Que a página é de um revendedor diz-se no conteúdo, no rodapé e na
Organization. Não nos 60 caracteres que decidem o clique.

### As descrições dos spots, e o segundo canal ao lado dos botões
fechado: 2026-09-10

**Os spots.** A description saía de `resumo.split(/\n/)[0]`, que é o primeiro
PARÁGRAFO e não a primeira frase — e um parágrafo de spot chega aos 319
caracteres. Passa pelo mesmo compositor das fichas de asa, agora generalizado
para receber partes de texto em vez de um produto: as asas dão-lhe
tagline + descricao, os spots dão-lhe o resumo com os parágrafos achatados. As
cinco páginas de spot ficam entre 113 e 147 caracteres.

No site inteiro o máximo desceu de **319 para 191**, e as acima de 160 de 22
para 7. As 7 que restam são as `descricao` do `/flow-paragliders-portugal/` e
do `/parakite-portugal/`, escritas à mão nos ficheiros de conteúdo. **Ficam.**
O compositor existe para derivar uma descrição de prosa; onde a descrição foi
escrita *como* descrição, o comprimento é escolha de quem a escreveu.

**O segundo canal ao lado dos botões.** O contacto tinha entrado no rodapé e
na Organization, mas não onde a decisão se toma. Entra nos cinco pontos de
conversão — o botão do formulário das 110 fichas, os dois do hub Flow, o do
Pilot2Wing e o dos spots do hub Parakite — e não nos sete sítios com destino
WhatsApp: os `pk-cta` são cartões de percurso, e um contacto dentro de um
cartão é ruído, não alternativa.

Sem rótulo próprio: um endereço de email e um número de telefone dizem o que
são nas cinco línguas.

Medido nas quatro páginas afectadas, e **falhou em duas à primeira** — 1,02:1
no hub Parakite e 4,24:1 no Pilot2Wing. O 1,02 foi erro de aplicação: pus a
variante clara numa secção escura. O 4,24 foi especificidade — o
`body.sg a{color:#ff6a13}` pintava os links de laranja. Corrigido com cor por
superfície em vez de classe posta à mão, e com `.pg .pg-alt`, que ganha aos
dois. Passa agora a 14,84 · 16,86 · 16,86 · 16,86, e o gradiente do fecho do
hub Flow passa nos dois extremos, 11,26 e 14,02.

### A fotografia do herói do curso é monocromática azul
decidido: 2026-09-10

O componente `pk-heroi` mantém-se como está: `filter:grayscale(1)` seguido de
`mix-blend-mode:color` com o gradiente azul. **Sem exceção para a página do
curso** — a consistência com a `/parakite-portugal/`, que usa o mesmo
componente, ganha à cor da fotografia.

O que isto quer dizer para a encomenda: **a imagem tem de funcionar em
monocromático azul.** O valor dela está na silhueta, no contraste de tons e na
composição, não na cor — e a progressão chão→ar é geometria, por isso sobrevive
bem. Uma hora dourada não sobrevive: é convertida num brilho azul-acinzentado.

Continua em aberto o resto do brief, que é decisão de imagem e não de CSS: um
piloto ou dois, a asa visível e identificável como Parakite, a zona escura à
esquerda até aos 45% da largura, e uma imagem própria para mobile porque o
recorte de `object-fit:cover` a 375px guarda só a faixa central.

---

## RETIRADOS NA AUDITORIA DE 10/09

Três das seis recomendações que essa auditoria fez estavam erradas ou já
resolvidas. Ficam escritas, como o item dos clientes OAuth acima, para não
voltarem a entrar na fila.

### O FAQPage não dá resultado rico a este site
Foi apresentado como o item de maior retorno. **Não é.** Desde agosto de 2023 o
Google só mostra o resultado rico de FAQ a sites de saúde e a entidades
governamentais reconhecidas. A marcação entrou mesmo assim, a 10/09, mas pelo
outro leitor: pergunta e resposta emparelhadas são o formato mais fácil de
levantar por um motor de resposta. **Ganho de AI Search, não de SERP.**

### Os títulos das asas não estão por traduzir
Foram contados 19 grupos de títulos idênticos nas cinco línguas e chamou-se-lhe
defeito, sem se ter lido o `regras/taxonomia.js`. O mecanismo já é sensível à
língua — `rotuloClasse(p.classificacao, l)`. Dos 22 títulos, **5 diferem e 17
são iguais**, e os 17 dividem-se em: 10 normas EN, que são códigos e traduzi-los
tornava-os errados; 4 nomes de categoria da Flow; e 3 níveis de paramotor em
inglês da indústria, já com chave neutra para poderem mudar um dia. Os 5 que
traduzem são exactamente aqueles cujo rótulo é traduzível. **Nada a corrigir.**

### As 40 imagens sem `width`/`height` não são risco de CLS
Foram contadas como deslocamento de layout durante o carregamento. **Não
são.** Testado no browser: das que não declaram dimensões, **nenhuma
participa no layout inicial** — seis são `position:absolute` (o fundo do herói
e as miniaturas dos cartões de spot, que enchem o cartão com `object-fit`) e
uma está dentro de um `[hidden]`, que é o marcador do diálogo. Acrescentar os
atributos seria cosmético. **Nada a fazer.**

### O `/reflex-lab/` não é ponta solta
Foi listado como página gerada sem `noindex`, sem `hreflang` e sem JSON-LD.
Está **retirado do site desde 04/09**, com a razão escrita no gerador: a pasta
fica no disco porque o simulador e o cálculo aerodinâmico ficam guardados, não
é publicada, não está no sitemap, ninguém lhe aponta, e o endereço antigo tem
**301** no `_redirects` para `/o-que-e-um-parakite/#reflex`. **Nada a fazer.**
