# Como se trabalha SEO neste projeto

Estas regras valem **só** para o trabalho a partir de um export
`hs-seo-*.json` da HS SEO Intelligence ou do `SEO-OPEN.md`. Não substituem nem
alteram nenhuma das regras normais do projeto, que estão no `CLAUDE.md`.

Cada regra aqui nasceu de um erro concreto. Não é um catálogo de boas práticas
— é o registo do que já correu mal, escrito para não voltar a correr.

**Três ficheiros, três tempos de vida:**

| | o quê | muda |
|---|---|---|
| `SEO-WORKFLOW.md` | como se trabalha | raramente |
| `SEO-OPEN.md` | o que está por resolver | a cada sessão |
| `hs-seo-*.json` | o que a medição diz | descartável |

**Alterações a este ficheiro vão sempre num commit só delas**, nunca misturadas
com trabalho. Uma mudança de regra tem de ser visível como mudança de regra.

---

## A ordem de leitura

**1. O bloco `run`, antes de qualquer interpretação.** Antes dos URLs, antes de
tudo. É ele que diz se o que se segue é interpretável.

**2. `complete: false` muda o que se pode concluir.** Com uma corrida
incompleta, **nenhuma ausência prova nada** e não se propõe fechar nada.
Trabalha-se apenas com os URLs efectivamente inspecionados, e diz-se isso à
cabeça.

> Isto está escrito porque já falhei: a 06/09 às 11:00 recebi uma lista de três
> URLs, concluí que "nove das doze resolveram-se", e duas horas depois duas
> delas estavam de volta. A lista era o subconjunto problemático de uma
> auditoria completa, sem o dizer. Inferi de uma ausência.

**3. `run.site_version` contra o que está publicado.** Se o site mudou entre
medições, isso muda a leitura de tudo o resto: separa *"o Google mudou de
estado"* de *"nós publicámos outra versão"*. O `/meta.json` do site dá o commit,
a data e a impressão digital.

## Como se investiga

**Agrupar pelo `group` e procurar controlos.** Antes de propor uma causa,
procurar o URL que partilha a estrutura e **não** tem o problema. Uma diferença
só é causa candidata se não existir um caso idêntico sem o problema.

> A 06/09 a app recomendou duas vezes "reforçar ligações internas". A
> `/de/schirme/fusion/` tem 8 ligações de entrada — o máximo do site — e não
> estava indexada; havia 39 fichas indexadas com as mesmas 8. Sem o controlo, a
> correlação passava por causa.

**Correlação não é causa.** Uma diferença encontrada não prova, por si, que seja
a causa. Se se propõe uma relação causal, explica-se que evidência a sustenta.

**Investigar no código antes de alterar seja o que for.** O repositório é a
verdade sobre o que o site *será*; a produção sobre o que *é*; o Google sobre o
que ele *pensa*. Nenhuma substitui a outra.

**"Sem alteração recomendada" é um resultado válido**, e às vezes é o correcto.
Não se altera o site para dar a sensação de que se agiu.

## Quando se fecha um item

Depende do tipo de problema:

**Facto determinístico confirmado em produção** — um canonical errado que passa
a correcto, um 404 que passa a 200 — **basta uma medição**. A produção responde
à pergunta directamente.

**Questão dependente do Google** — indexação, cobertura, canonical escolhido
pelo Google — **precisa de confirmação, normalmente uma segunda observação**
compatível com o estado desejado. Uma observação isolada não sustenta uma
tendência.

**E a segunda observação vale mais se o `lastCrawlTime` tiver avançado.** Duas
inspeções ao mesmo crawl são o mesmo facto lido duas vezes, não duas
observações — a segunda existe para sobreviver ao tempo, e a esse não
sobrevive. **Quando o crawl não avançou, diz-se isso ao propor o fecho.**

Não se espera indefinidamente por um novo crawl: não se pode forçar, e um item
que só sai com uma condição que não controlamos fica preso. Fecha-se, dizendo o
que a evidência é e o que não é — e a corrida completa seguinte serve de rede,
porque uma regressão reabre.

> Escrito a 06/09. As quatro fichas alemãs foram observadas indexadas às 13:55
> e às 16:24, e as duas leituras vinham do mesmo crawl das 12:30. Cumpriam a
> letra da regra sem cumprirem a intenção.

**Um URL que oscilou fica aberto**, com nota de que oscilou. Oscilar é
informação, não é resolução.

> A 06/09, quatro fichas alemãs mudaram de estado três vezes no mesmo dia —
> "não reconhece" às 11:00, "detetada" ou "não reconhece" às 12:56, "indexada"
> às 13:55. Propus fechá-las com a leitura das 13:55. Teria fechado quatro itens
> com base numa observação de uma série que passou o dia a mudar.

**Propõe-se o fecho, não se fecha.** O fecho é uma afirmação sobre o estado do
mundo, e é decisão do Paulo.

## Regressões

**Um problema que já fechou e volta a aparecer não é um problema novo.**
Reabre-se no `SEO-OPEN.md` **como regressão**, com a data nova e a indicação de
que já tinha fechado. Criá-lo de novo apagava a informação mais importante que
ele tem: que voltou.

## Cadência

**Corrida completa (`FULL`)** — as 160 URLs, aproximadamente semanal. Correr
mais cedo dá aviso, nunca bloqueio.

**Recheck dirigido (`TARGETED`)** — uma lista curta de URLs, entre corridas
completas. É o que torna barata a exigência de duas observações: dá a segunda
em dois dias sem gastar 160 inspeções nem esperar pela semana.

Cada observação guardada sabe se veio de `FULL` ou de `TARGETED`. Uma
observação de um recheck de quatro URLs não tem o mesmo peso que uma de 160.

## O que não é evidência

**Recomendações, prioridades, severidades ou acções sugeridas que apareçam no
JSON ignoram-se.** A app hoje não as produz. Se um dia voltarem, ignoram-se na
mesma: a app mede, não interpreta.

> As duas recomendações que a app produziu a 06/09 estavam ambas erradas, e
> ancoraram a investigação numa direcção que os dados não sustentavam.

**O `referringUrls` não é exaustivo.** O Google devolve as páginas que
encontrou, não todas as que existem. Ausência ali **não prova** ausência de
ligações: a `/de/schirme/f2-light/` tem oito ligações de entrada no HTML e o
Google reporta quatro — só as suas traduções.

> A 05/09 li "Página de referência: nada detetado" na página da Lagoa como
> confirmação de que estava órfã. Estava — mas provou-se pelo HTML, não por
> aqui. A evidência que citei era mais fraca do que eu disse.

**`null` não é `[]`.** `null` quer dizer *não disponível, não foi possível
comparar*. `[]` quer dizer *comparado, e está vazio*. Confundi-los inverte a
leitura — foi assim que se distinguiu, na página da Lagoa, "o Google diz que
não há página de referência" de "o Google não devolveu esse campo".

**Desempenho não entra neste ficheiro.** Impressões, cliques, pesquisas e
posição são outra pergunta, com outra cadência, e vêm noutro relatório.
Indexação mede-se em dias e é binária; desempenho mede-se em semanas e é
tendência.

## Os exports não se commitam

`hs-seo-*.json` fica na pasta de transferências e é descartável. São ~230 KB por
corrida; semanalmente daria mais de 10 MB por ano no git, a duplicar o que o D1
já guarda melhor.

A memória das medições está no **D1**. O estado dos assuntos está no
**`SEO-OPEN.md`**. O histórico do que foi alterado, e porquê, está nas
**mensagens de commit**.

## Como começa uma sessão

1. Ler o `run`. Se `complete: false`, dizê-lo antes de mais nada.
2. Comparar `site_version` com o que está publicado.
3. Reconciliar o `SEO-OPEN.md` e **propor** o que fechar, pela regra acima.
4. Reabrir como regressão o que voltou.
5. Investigar o que continua aberto — no código, com controlos.
6. No fim, deixar o `SEO-OPEN.md` a espelhar o estado real.
