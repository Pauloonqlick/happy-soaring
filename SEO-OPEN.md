# SEO — o que está em aberto

Estado. As regras do processo estão no `SEO-WORKFLOW.md`.

Última reconciliação: **08/09/2026**, contra a exportação de Cobertura do
Search Console (motivo "Detetada – atualmente não indexada", **dados até
04/09**) cruzada com o repositório e com produção.

O site está publicado no deploy **`a2015d7b`** desde **11/09 às 08:51**, sobre
o commit **`58a033f`**, com `sujo: false` — o `meta.json` regista-o, e a
árvore, o GitHub e o site estão os três no mesmo ponto.

**Seis deploys em 10 e 11/09**, por esta ordem:

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
aberto: 2026-09-06 · auditado: 2026-09-08 · rever depois de: 2026-09-13

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
