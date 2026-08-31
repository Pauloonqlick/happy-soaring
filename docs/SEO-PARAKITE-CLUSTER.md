# Mapa de autoridade temática — Parakite

Arquitetura de conteúdo para a Happy Soaring dominar o tema «parakite».
Escrito em 29/08/2026, **antes** de qualquer página ser feita.

Isto não é uma lista de keywords. É o mapa de que páginas devem existir, o que
cada uma responde, e por que ordem. Uma keyword não é uma página: trinta e três
pesquisas agrupam-se em **treze intenções**, e nem todas merecem endereço.

> **Estado: APROVADA em 29/08/2026.** Nada aqui foi implementado.
> `/parakite-portugal/` não foi alterada, não há JSON-LD novo e não há traduções.
>
> Revisão 2 (29/08/2026): endereço traduzido em vez de `/parakite/` na raiz;
> fim dos silos rígidos; condição editorial para o Reflex Lab; e o curso deixa
> de estar bloqueado — só duas afirmações dentro dele é que estão.

---

## Correções aos dados

Duas, registadas antes do mapa porque o mapa depende delas.

### 1 · Primeira inspeção de segurança

**Estado: CONFIRMADA como oferta — e só para a Mullet 2.**

O aviso `content/avisos/oferta-parakites-2026.json` tem
`abrange.produtos: ["Mullet 2"]` e diz, nos cinco idiomas: «primeira inspeção
de segurança… feita pela FelloFly, escola parceira».

- **Não generalizar** à restante gama Flow. Nem aos outros três parakites.
- O termo é **inspeção de segurança**, nunca «inspeção de trim». A trimagem é
  um serviço do preçário da FELLOFLY ASSIST — coisa diferente.
- A oferta continua com `ativo: false`. Enquanto estiver desligada, é uma
  característica da oferta, não uma campanha a decorrer.

### 2 · Variantes de nome como a mesma entidade

Estas grafias são **a mesma asa**. Nunca geram URL, canonical nem página
próprias.

| Forma canónica | Variantes a tratar como iguais |
|---|---|
| `Mullet 2` | Mullet2 |
| `MulletX` | Mullet X |
| `AlbatroXX` | Albatroxx · AlbatroxX · Albatrox X |

**Onde a forma canónica é obrigatória:** URL, `<h1>`, `<title>`, `canonical`,
`name` do JSON-LD, migalhas, e o campo `nome` em `produtos.json`.

**Onde as variantes podem viver naturalmente:** texto corrente, `description`,
perguntas frequentes, e `alternateName` do JSON-LD — que existe precisamente
para isto.

**O `alt` fica de fora.** O atributo `alt` descreve a imagem para quem não a
vê. Enfiar-lhe variantes de nome é escrever para o motor de busca em vez de
escrever para a pessoa, e estraga a única coisa que o `alt` serve para fazer.
Se a variante couber naturalmente na descrição da imagem, entra; se for preciso
forçá-la, não entra.

**Porque isto não parte nada hoje:** o gerador constrói o endereço com
`slug(p.nome)` a partir de um único campo. Não há caminho pelo qual uma
variante crie um segundo endereço — a não ser que alguém a acrescente como
produto. É essa a única forma de partir a regra.

**Por fazer, quando implementarmos:** um campo `variantes: []` por produto, em
`content/slides/produtos.json`, lido pelo gerador. Fica registado aqui; não foi
criado.

---

## Como agrupei

Três regras, aplicadas por esta ordem.

1. **A mesma intenção é uma página.** «Parakite training», «parakite lessons» e
   «parakite course» são a mesma pergunta com três palavras diferentes.
2. **Intenções diferentes separam-se, mesmo com palavras parecidas.**
   «Parakite wings» quer ver a lista; «how to choose a parakite» quer decidir.
   Duas páginas.
3. **Se duas páginas iriam dizer o mesmo argumento, é uma página.** É por isso
   que as três comparações são duas, e não três.

Sobre o **idioma prioritário**: todas as páginas nascem nas cinco línguas, como
tudo o resto. «Prioritário» quer dizer em que língua se escreve primeiro e onde
se investe o conteúdo forte. A regra que segui: o tema é global e a comunidade
escreve em inglês; o serviço é local e vende-se em português.

---

## G1 · O que é um parakite

| | |
|---|---|
| **Pesquisas** | Parakite · Parakites · What is a Parakite · How does a Parakite work · Parakite flying |
| **Intenção** | Informacional, topo de funil. Ouviu a palavra e quer perceber. Não quer comprar nem aprender ainda |
| **Página atual** | Nenhuma. A homepage menciona parakite no H1 mas é sobre a Happy Soaring; `/pilot2wing/` é sobre o método; as páginas de asa são sobre modelos |
| **Suficiente?** | **Não.** Não existe uma única página cujo assunto seja «o que é um parakite» |
| **Gap** | A definição, o mecanismo, e a distinção face a uma asa pequena qualquer |
| **Página recomendada** | `/o-que-e-um-parakite/` · `/en/what-is-a-parakite/` |
| **Keyword principal** | `parakite` |
| **Secundárias** | parakites, what is a parakite, how does a parakite work, parakite flying, parakite wing |
| **Tipo** | Pilar educativo |
| **Prioridade** | **P1** |
| **Canibalização** | **Média com `/parakite-portugal/`** — era alta enquanto o endereço era `/parakite/`; o slug traduzido baixou-a. Ver a secção de riscos |
| **Links de entrada** | Homepage (menu + bloco estático), `/parakite-portugal/`, as 4 asas, `/pilot2wing/` |
| **Links de saída** | `/parakite-portugal/`, `/asas/parakites/`, `/parakite-vs-parapente/`, `/reflex-lab/`, `/pilot2wing/` |
| **Conteúdo original HS** | A tese «não é simplesmente um parapente pequeno»; os quatro eixos — velocidade, trajetória, altura, energia; 23 anos de voo, 4 dedicados ao parakite; e o Reflex Lab como demonstração interativa, que nenhum concorrente tem |
| **Idioma prioritário** | **EN** escreve-se primeiro, PT a seguir |

### O endereço, em cinco línguas

Não é uma página inglesa na raiz. É a mesma página nas cinco línguas, com o
**slug traduzido** — que é a regra que o site já tem para tudo o que não é nome
próprio.

| | Endereço | Estado |
|---|---|---|
| PT | `/o-que-e-um-parakite/` | Proposto |
| EN | `/en/what-is-a-parakite/` | Proposto |
| ES | `/es/que-es-un-parakite/` | Provisório — fecha-se na fase de tradução |
| FR | `/fr/qu-est-ce-qu-un-parakite/` | Provisório |
| DE | `/de/was-ist-ein-parakite/` | Provisório |

**Porque traduz.** O `URLS.md` diz: «a categoria traduz-se, o nome do produto
não». Isto não é um nome próprio — é uma pergunta em prosa. Traduz, como
`/asas/` é `/en/wings/`.

**O que isto obriga no gerador.** Hoje há dois padrões de endereço: o das asas,
com o segmento traduzido e o nome fixo (`caminho()`), e o dos hubs de nome
próprio, só com prefixo de língua (`caminhoSG`, `caminhoFlow`). Esta página
precisa de um **terceiro**: slug diferente por língua. É pouco código, mas é
mecanismo novo — fica registado para a fase de implementação.

---

## G2 · Gestão de energia

| | |
|---|---|
| **Pesquisas** | Parakite energy management · Parakite glide · Parakite speed |
| **Intenção** | Informacional técnica. Já sabe o que é; quer perceber como se voa |
| **Página atual** | Nenhuma. A frase existe na maqueta do pilar, como declaração |
| **Suficiente?** | Não — uma declaração não é uma explicação |
| **Gap** | O que é gerir energia na prática; como se ganha e se gasta altura; porque é que velocidade e planeio não são a mesma variável |
| **Página recomendada** | `/parakite-energy-management/` |
| **Keyword principal** | `parakite energy management` |
| **Secundárias** | parakite glide, parakite speed, parakite flying technique, energy management |
| **Tipo** | Artigo técnico |
| **Prioridade** | **P2** |
| **Canibalização** | Baixa. Nenhuma outra página trata disto |
| **Links de entrada** | `/o-que-e-um-parakite/`, `/parakite-portugal/` (a banda dos quatro eixos), `/pilot2wing/` |
| **Links de saída** | `/reflex-lab/`, `/parakite-control-system/`, `/asas/parakites/` |
| **Conteúdo original HS** | É a frase-assinatura. «Parakite flying is energy management» é da Happy Soaring, não é um termo da indústria — e os quatro eixos são um modelo próprio |
| **Idioma prioritário** | **EN** — o termo é inglês |

---

## G3 · Sistema de controlo e risers

| | |
|---|---|
| **Pesquisas** | Parakite control system · Parakite risers |
| **Intenção** | Informacional técnica, alta especificidade. Quem procura isto quer a mecânica |
| **Página atual** | As páginas de asa têm especificações, não explicação |
| **Suficiente?** | Não |
| **Gap** | O que é o sistema de controlo, o que os risers fazem, porque é que isso muda a asa em voo |
| **Página recomendada** | `/parakite-control-system/` |
| **Keyword principal** | `parakite control system` |
| **Secundárias** | parakite risers, parakite trimmers, how parakite risers work, parakite brakes |
| **Tipo** | Artigo técnico |
| **Prioridade** | **P2** |
| **Canibalização** | Baixa. Cuidado só com `/reflex-lab/`, que é sobre o perfil e não sobre o controlo |
| **Links de entrada** | `/o-que-e-um-parakite/`, `/parakite-energy-management/`, as 4 asas |
| **Links de saída** | `/reflex-lab/`, `/asas/parakites/`, `/escolher-parakite/` |
| **Conteúdo original HS** | A definição já escrita na copy do pilar: «o que distingue um Parakite é o sistema de controlo — e a capacidade do piloto de alterar significativamente a configuração da asa em voo» |
| **Idioma prioritário** | **EN** |

---

## G4 · Perfil reflex

| | |
|---|---|
| **Pesquisas** | Parakite reflex |
| **Intenção** | Informacional técnica |
| **Página atual** | **`/reflex-lab/` já existe** — «simulador aerodinâmico conceptual de uma asa parakite com perfil reflex» |
| **Suficiente?** | **Parcialmente.** O ativo é único; o texto é quase nulo. Uma página que é só um simulador não é indexável pelo que ensina |
| **Gap** | Texto a sério. Não uma legenda do simulador — uma página editorial completa |
| **Página recomendada** | **Transformar `/reflex-lab/`.** Não criar nada — mas também não basta legendar |
| **Keyword principal** | `parakite reflex` |
| **Secundárias** | reflex profile, reflex airfoil, what is a reflex wing, perfil reflex |
| **Tipo** | Ferramenta + artigo |
| **Prioridade** | **P1** — é a única P1 cujo custo é só escrever |
| **Canibalização** | Nenhuma |
| **Links de entrada** | `/o-que-e-um-parakite/`, `/parakite-control-system/`, `/parakite-energy-management/`, secção de produtos da homepage |
| **Links de saída** | `/asas/parakites/`, `/o-que-e-um-parakite/` |
| **Conteúdo original HS** | **O simulador.** É o ativo mais defensável do site inteiro numa pesquisa técnica — nenhum concorrente tem um |
| **Idioma prioritário** | **EN** |

### A condição

`/reflex-lab/` só se mantém como destino de `parakite reflex` **se passar a ser
uma página editorial forte**. Um simulador com duas linhas de legenda não ganha
esta pesquisa a ninguém. Tem de responder, por esta ordem:

1. **Definição** — o que é um perfil reflex, em linguagem que um piloto entenda
2. **Funcionamento** — o que a geometria faz ao centro de pressão
3. **Estabilidade** — porque é que isso resiste a fechos
4. **Pitch** — o comportamento em cabeceio, que é onde o reflex se nota primeiro
5. **Velocidade** — o que se ganha, e à custa de quê
6. **Limitações** — o que custa ter um perfil reflex. Os compromissos, em
   arrasto e em comportamento, que se aceitam em troca da estabilidade
7. **O que o reflex não faz** — secção própria, e não uma nota de rodapé das
   limitações. São coisas diferentes: as limitações são o preço do perfil; isto
   são as **atribuições erradas** que circulam. Um perfil reflex não dispensa
   pilotagem, não impede todos os fechos, não substitui o sistema de controlo e
   não torna a asa adequada a qualquer piloto. É a secção que impede a página
   de ser uma simplificação técnica
8. **Reflex ≠ sistema de controlo** — a confusão mais comum, e a fronteira com
   `/parakite-control-system/`
9. **O simulador** — no fim, como demonstração do que se acabou de ler, e não
   como substituto

Sem estas nove, o destino de `parakite reflex` passa a ser uma secção dentro de
`/o-que-e-um-parakite/`, e o Reflex Lab fica a ser o que é hoje: uma ferramenta
gira sem tema próprio.

> **Atenção.** O Reflex Lab sai do menu na reorganização do hub. Sem as ligações
> contextuais fica órfão — com página, sitemap e nenhuma porta.

---

## G5 · Formação

| | |
|---|---|
| **Pesquisas** | Parakite training · Parakite lessons · Parakite course |
| **Intenção** | Transacional. Quer aprender e procura quem ensina |
| **Página atual** | `/pilot2wing/` responde ao **método**, não ao curso. O CTA pede informações por WhatsApp precisamente porque a página do curso não existe |
| **Suficiente?** | Não |
| **Gap** | A página do curso |
| **Página recomendada** | `/curso-parakite-portugal/` |
| **Keyword principal** | `curso de parakite` · `parakite course` |
| **Secundárias** | parakite training, parakite lessons, aprender parakite, parakite school portugal |
| **Tipo** | Página de serviço |
| **Prioridade** | **P1 — escrevível já.** Não é a página que está bloqueada; são duas afirmações dentro dela |
| **Canibalização** | Média com `/pilot2wing/`. A fronteira já está escrita: o Pilot2Wing diz «aqui acaba o Pilot2Wing» e passa a palavra ao Curso de Parakite |
| **Links de entrada** | `/parakite-portugal/` (CTA 01), `/pilot2wing/`, `/o-que-e-um-parakite/`, homepage |
| **Links de saída** | `/pilot2wing/`, `/asas/mullet-2/`, `/licenca-parakite-portugal/` |
| **Conteúdo original HS** | O método Pilot2Wing, que nenhuma escola tem; a parceria FelloFly; as cinco etapas já publicadas |
| **Idioma prioritário** | **PT** — é um serviço local. EN a seguir, para turismo de voo |

### O que já se pode escrever, e o que fica marcado

A página não espera pelas credenciais. **O serviço descreve-se com o que já está
confirmado**, e só as afirmações sobre titulação ficam por preencher.

**Escrevível hoje** — tudo isto está publicado, nas cinco línguas, ou no
protocolo:

- A formação é realizada através da escola parceira FelloFly
- O método Pilot2Wing e as suas cinco etapas
- O Curso de Parakite faz-se com a Mullet 2
- As etapas do curso: descolagem · voo · controlo · aterragem
- As mini-wings de 8, 10 e 12 m² na quarta etapa do método
- Que se pode começar **sem experiência prévia de parapente**
- Que quem já voa de parapente tem uma base, mas precisa de formação específica
- Que a Happy Soaring não é escola: acompanha a escolha, a venda e o pós-venda

**Fica marcado, não inventado:**

- Que titulação o curso dá, se dá alguma
- Sob que credenciais e que unidade de formação a FelloFly opera
- O que exatamente exigem a inscrição na FPVL e o seguro

A página existe e é útil sem estas três. Quem procura «curso de parakite» quer
saber quem ensina, com que asa, e como se começa — e a isso já se responde.

---

## G6 · Groundhandling e competências

| | |
|---|---|
| **Pesquisas** | Parakite ground handling · Parakite skills |
| **Intenção** | Informacional. Piloto ativo que quer treinar |
| **Página atual** | `/pilot2wing/` toca no assunto nas etapas 2 a 4, mas o assunto dela é o método |
| **Suficiente?** | Parcialmente |
| **Gap** | Uma página cujo assunto **seja** groundhandling |
| **Página recomendada** | `/groundhandling-parakite/` |
| **Keyword principal** | `parakite ground handling` |
| **Secundárias** | parakite skills, kiting, treino de solo, groundhandling parapente |
| **Tipo** | Guia |
| **Prioridade** | **P2** |
| **Canibalização** | **Média-alta com `/pilot2wing/`.** Groundhandling é a prática; Pilot2Wing é o método que a organiza. Se a distinção não se aguentar na escrita, isto é secção e não página |
| **Links de entrada** | `/pilot2wing/`, `/o-que-e-um-parakite/`, `/curso-parakite-portugal/` |
| **Links de saída** | `/pilot2wing/`, `/asas/parakites/` |
| **Conteúdo original HS** | A filosofia que o `PLANO.md` diz já estar escrita na plataforma; o Quick Response Game; as mini-wings de 8, 10 e 12 m² |
| **Idioma prioritário** | **EN**, PT a seguir |

---

## G7 · Comparações

| | |
|---|---|
| **Pesquisas** | Parakite vs Paraglider · Parakite vs Speedwing · Parakite vs Miniwing |
| **Intenção** | Investigação comercial. Conhece as categorias e quer saber qual escolher |
| **Página atual** | Nenhuma |
| **Suficiente?** | Não |
| **Gap** | Total |
| **Páginas recomendadas** | **Duas, não três:** `/parakite-vs-parapente/` (P2) e `/parakite-vs-speedwing-miniwing/` (P3) |
| **Keyword principal** | `parakite vs paraglider` · `parakite vs speedwing` |
| **Secundárias** | diferença entre parakite e parapente, parakite ou parapente, miniwing vs parakite, speedwing vs parakite |
| **Tipo** | Comparação |
| **Prioridade** | **P2** e **P3** |
| **Canibalização** | **Alta entre elas se forem três** — é exatamente por isso que são duas. Contra o parapente a comparação é de categoria; contra speedwing e mini-wing o argumento é o mesmo (sistema de controlo), e duas páginas a dizê-lo competiriam uma com a outra |
| **Links de entrada** | `/o-que-e-um-parakite/`, `/escolher-parakite/`, `/asas/parakites/`, homepage |
| **Links de saída** | `/asas/parakites/`, `/asas/mohawk/`, `/asas/yoti-3/`, `/parakite-portugal/` |
| **Conteúdo original HS** | A tese «não é simplesmente um parapente pequeno». E um facto raro: a Happy Soaring vende **as três categorias** — parakite, speed flying (Mohawk) e mini-wing (Yoti 3). Quase nenhum comparador tem as três |
| **Idioma prioritário** | **EN** |

---

## G8 · Gama e escolha

Duas intenções diferentes dentro do mesmo tema. **Duas páginas.**

| | `/asas/parakites/` | `/escolher-parakite/` |
|---|---|---|
| **Pesquisas** | Parakite wings | Parakite size · How to choose a Parakite |
| **Intenção** | Navegacional / comercial: quer ver a lista | Investigação comercial: quer decidir |
| **Página atual** | A grelha da homepage e as 4 páginas de asa | O modo descoberta — que **não tem endereço** e por isso não é indexável |
| **Suficiente?** | Não. Não há endereço para «a gama de parakites» | Não |
| **Gap** | A página de família | O guia de decisão: peso, tamanho, condições, nível |
| **Keyword principal** | `parakite wings` | `how to choose a parakite` |
| **Secundárias** | flow parakites, parakite models, parakites à venda | parakite size, parakite size chart, que tamanho de parakite, parakite weight range |
| **Tipo** | Página de família | Guia de decisão |
| **Prioridade** | **P1** | **P1** |
| **Canibalização** | Baixa com as 4 asas — é a relação normal categoria/produto | Nenhuma. O modo descoberta não tem URL para competir |
| **Entrada** | Homepage, `/o-que-e-um-parakite/`, `/parakite-portugal/`, `/flow-paragliders-portugal/`, as 4 asas | `/asas/parakites/`, `/o-que-e-um-parakite/`, as 4 asas, `/parakite-portugal/` |
| **Saída** | As 4 asas, `/escolher-parakite/`, `/parakite-vs-parapente/` | As 4 asas, `/demo-parakite/`, `/parakite-vs-parapente/` |
| **Original HS** | Um parágrafo a sério sobre a família — que era exatamente a condição posta em 24/08/2026 para esta página existir | Os seis tamanhos da Mullet 2 e as gamas dos outros três; e o «porquê esta para ti» por asa, que o `PENDENTES.md` já identifica como a peça que falta |
| **Idioma** | **EN** | **PT + EN** |

> **Nota histórica.** O `URLS.md` diz, em 24/08/2026: as páginas de família
> «ficaram de fora de propósito — uma lista de asas sem texto próprio é
> conteúdo fraco. Ficam para quando houver um parágrafo a sério a escrever
> sobre cada família». Este mapa é a ocasião de o escrever. A decisão não está
> a ser contrariada; está a ser cumprida a condição dela.

### A fronteira entre as duas — regra fixa

Duas páginas próximas precisam de uma fronteira escrita, ou canibalizam-se
sozinhas dentro de seis meses.

| | Responde a | Não responde a |
|---|---|---|
| `/asas/parakites/` | **Que asas existem, e como diferem** | Qual é a certa para ti |
| `/escolher-parakite/` | **Qual é adequada para mim** | O catálogo da categoria |

**A ordem dentro de `/asas/parakites/`.** Primeiro a **categoria** — o que é um
Parakite enquanto tipo de asa, e que critérios distinguem uns dos outros:
tamanho, nível, terreno, sistema de controlo, perfil. Só depois **os Parakites
disponíveis através da Happy Soaring**, já com esses critérios a servir de
grelha de leitura.

Uma lista que comece pela lista é um catálogo. Uma lista que comece pelos
critérios é uma página que ensina — e é essa que ganha `parakite wings`.

**Não duplicar o hub da Flow.** O `/flow-paragliders-portugal/` é sobre a
**marca** e a gama toda: 22 asas, arneses, reservas, o estatuto de revendedor.
O `/asas/parakites/` é sobre uma **categoria de asa**, e só sobre ela. Se a
página de família começar a explicar quem é a Flow ou a listar arneses, está a
escrever o hub outra vez.

---

## G9 · Demo e aluguer

| | |
|---|---|
| **Pesquisas** | Parakite demo · Parakite rental |
| **Intenção** | Transacional. Quer experimentar ou alugar |
| **Página atual** | Nenhuma. Vão ser secções do pilar |
| **Suficiente?** | Como secções, sim, para já |
| **Gap** | Endereço próprio quando os serviços estabilizarem |
| **Página recomendada** | **Nenhuma agora.** `#demo` e `#voar-em-portugal` dentro de `/parakite-portugal/`. Graduar depois para `/demo-parakite/` (P2) e `/rental-parakite/` (P3, **só quando operacional**) |
| **Keyword principal** | `parakite demo` · `parakite rental portugal` |
| **Secundárias** | try a parakite, parakite test flight, alugar parakite, parakite hire |
| **Tipo** | Secção → página de serviço |
| **Prioridade** | **P2** (demo) · **P3** (rental) |
| **Canibalização** | Nenhuma agora. Média com o pilar quando se autonomizarem — o pilar terá de encolher essas secções para um resumo com link |
| **Links de entrada** | `/parakite-portugal/`, `/escolher-parakite/`, `/flow-paragliders-portugal/` |
| **Links de saída** | `/asas/parakites/`, `/parakite-portugal/` |
| **Conteúdo original HS** | As Demo Sessions com asas identificadas; e «rent the day, not the wing», que é uma ideia própria e não uma descrição de serviço |
| **Idioma prioritário** | **EN** — é procura de turismo de voo. PT a seguir |

---

## G10 · Inspeção, trimagem e reparação

| | |
|---|---|
| **Pesquisas** | Parakite trim · Parakite inspection · Parakite repair |
| **Intenção** | Transacional de serviço. **`parakite trim` é ambíguo** — pode ser o acerto (técnica) ou a trimagem (serviço). Trato como serviço, que é onde há prova documental |
| **Página atual** | Nenhuma. Só a menção à inspeção de segurança dentro da oferta |
| **Suficiente?** | Não |
| **Gap** | Total |
| **Página recomendada** | `/inspecao-e-reparacao-parakite/` |
| **Keyword principal** | `parakite inspection` |
| **Secundárias** | parakite repair, parakite trim, trimagem, inspeção de asa, substituição de linhas |
| **Tipo** | Página de serviço |
| **Prioridade** | **P2** |
| **Canibalização** | Baixa |
| **Links de entrada** | `/parakite-portugal/` (secção pós-venda), `/asas/parakites/`, as 4 asas |
| **Links de saída** | `/parakite-portugal/`, `/asas/parakites/` |
| **Conteúdo original HS** | A FELLOFLY ASSIST tem serviços listados e confirmados: inspeções completas e parciais, trimagem, manufatura e substituição de linhas, reparação de tecido e células, substituição de cone de linhas |
| **Idioma prioritário** | **PT** — serviço local. EN a seguir |

> **Duas travas.** Não usar «Centro Técnico Oficial Flow» nem «Reparações
> Oficiais Flow»: o departamento é da FelloFly, não um estatuto conferido pela
> Flow. E o **Preçário 2026 não vai para o site** — vale-lhe a regra do PDF de
> revendedor.

---

## G11 · Licença e seguro

| | |
|---|---|
| **Pesquisas** | Parakite licence / license · Parakite insurance |
| **Intenção** | Informacional regulamentar: «o que preciso para voar legalmente» |
| **Página atual** | Nenhuma |
| **Suficiente?** | Não |
| **Gap** | Total, e **bloqueado** |
| **Página recomendada** | `/licenca-parakite-portugal/` |
| **Keyword principal** | `licença de parakite` |
| **Secundárias** | parakite licence portugal, FPVL parakite, titulação parakite, seguro de voo livre, parakite insurance |
| **Tipo** | Página informativa regulamentar |
| **Prioridade** | **P2 — bloqueada** até estarem fechados os requisitos oficiais do ParaKite e a unidade de formação da FelloFly |
| **Canibalização** | Média com `/curso-parakite-portugal/`. A licença é o **enquadramento**; o curso é o **serviço**. Se a página do curso explicar a licença em detalhe, esta deixa de fazer sentido |
| **Links de entrada** | `/curso-parakite-portugal/`, `/parakite-portugal/`, `/o-que-e-um-parakite/` |
| **Links de saída** | `/curso-parakite-portugal/`, `/pilot2wing/` |
| **Conteúdo original HS** | O Protocolo com a FelloFly descreve quatro percursos distintos; os Procedimentos FPVL 2026 têm Ficha de Praticante (ParaKite) própria. **É informação que quase ninguém tem escrita em português** |
| **Idioma prioritário** | **PT.** Uma licença é nacional — a pesquisa genérica em inglês não tem resposta útil vinda de Portugal |

---

## G12 · Preço

| | |
|---|---|
| **Pesquisas** | Parakite price |
| **Intenção** | Transacional |
| **Página atual** | Nenhuma, **por decisão**. O `URLS.md` diz: «Sem `offers`, de propósito. Não há preços no site» |
| **Suficiente?** | Não, e não vai ser |
| **Gap** | Irreconciliável com a política de preços |
| **Página recomendada** | **Nenhuma.** Trata-se como secção em `/escolher-parakite/` e nas páginas de asa: como se pede orçamento e o que faz variar o preço, sem números |
| **Keyword principal** | Não perseguir `parakite price` como principal em nenhuma página |
| **Prioridade** | **P3** |
| **Conteúdo original HS** | O aconselhamento antes do preço — é o argumento comercial, e é honesto |
| **Idioma prioritário** | — |

> Uma página «parakite price» sem preços é exatamente o resultado que frustra
> quem pesquisa, e o Google aprende isso depressa. Não a faças.

---

## G13 · Reviews

| | |
|---|---|
| **Pesquisas** | Parakite review · e por modelo: Mullet 2 review, MulletX review, AlbatroXX review, Mohawk review |
| **Intenção** | Investigação comercial. Quer a opinião de quem voou, não a ficha |
| **Página atual** | As páginas de asa — mas 19 das 22 ainda usam o texto do fabricante |
| **Suficiente?** | Não. Texto do fabricante não é review |
| **Página recomendada** | Uma por modelo: `/mullet-2-review/`, `/mulletx-review/`, `/albatroxx-review/`, `/mohawk-review/` |
| **Keyword principal** | `mullet 2 review` (long-tail, por modelo) |
| **Secundárias** | flow mullet 2 review, albatroxx review, parakite review, mullet2 review |
| **Tipo** | Artigo de opinião, assinado e datado |
| **Prioridade** | **P3** |
| **Canibalização** | **Média-alta com a página da asa.** A página da asa é a ficha; a review é a experiência. Se não houver voo real por trás, não se faz — e uma review falsa é pior do que nenhuma |
| **Links de entrada** | A página da asa correspondente, `/asas/parakites/`, `/escolher-parakite/` |
| **Links de saída** | A página da asa, `/demo-parakite/` |
| **Conteúdo original HS** | **O mais defensável de tudo.** 23 anos a voar, 4 dedicados ao parakite, muitas horas em várias asas. Nenhum site de revendedor tem isto |
| **Idioma prioritário** | **EN** |

---

## Variantes de produto

Não geram páginas. São a mesma entidade, tratada no conteúdo.

| Asa | Página | Variantes no texto e na metadata |
|---|---|---|
| Mullet 2 | `/asas/mullet-2/` | Mullet2 |
| MulletX | `/asas/mulletx/` | Mullet X |
| AlbatroXX | `/asas/albatroxx/` | Albatroxx · AlbatroxX · Albatrox X |
| Mohawk | `/asas/mohawk/` | — |

**Onde entram:** primeira menção no corpo do texto («a Mullet 2 — também escrita
Mullet2 —»), uma pergunta frequente, e `alternateName` no JSON-LD.
**Nunca** no H1, no título, no URL nem no canonical. **E nunca no `alt`** só
por SEO: o `alt` descreve a imagem.

**Prioridade:** P2. Não é uma página, é uma passagem por quatro páginas
existentes mais o gerador.

---

## Arquitetura visual

```
                          PARAKITE HAPPY SOARING
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────┴──────┐             ┌──────┴──────┐            ┌───────┴───────┐
   │/o-que-e-  │             │  /parakite- │            │/flow-paraglid-│
   │um-parakite│             │  portugal/  │            │ers-portugal/  │
   │  O TEMA   │◄───────────►│  O MERCADO  │◄──────────►│   A MARCA     │
   │  (5 idm)  │             │  (PT + EN)  │            │   (PT + EN)   │
   └────┬──────┘             └──────┬──────┘            └───────┬───────┘
        │                            │                          │
        │  ENTENDER                  │  AGIR EM PORTUGAL        │  COMPRAR
        │                            │                          │
   ┌────┴──────────────┐    ┌────────┴──────────┐      ┌────────┴────────┐
   │ /parakite-energy- │    │ /curso-parakite-  │      │ /asas/parakites/│
   │  management/      │    │  portugal/   [P1] │      │            [P1] │
   │              [P2] │    │  ~ 2 marcações    │      └────────┬────────┘
   ├───────────────────┤    ├───────────────────┤               │
   │ /parakite-control-│    │ /pilot2wing/     │      ┌────────┴────────┐
   │  system/     [P2] │    │  ✓ existe         │      │  Mullet 2       │
   ├───────────────────┤    ├───────────────────┤      │  MulletX        │
   │ /reflex-lab/      │    │ /groundhandling-  │      │  AlbatroXX      │
   │  ✓ existe    [P1] │    │  parakite/   [P2] │      │  Mohawk         │
   │  falta texto      │    ├───────────────────┤      │  ✓ existem      │
   ├───────────────────┤    │ /licenca-parakite-│      └────────┬────────┘
   │ /parakite-vs-     │    │  portugal/   [P2] │               │
   │  parapente/  [P2] │    │  ↕ bloqueada      │      ┌────────┴────────┐
   ├───────────────────┤    ├───────────────────┤      │ /escolher-      │
   │ /parakite-vs-     │    │ /inspecao-e-      │      │  parakite/  [P1]│
   │  speedwing-       │    │  reparacao-       │      ├─────────────────┤
   │  miniwing/   [P3] │    │  parakite/   [P2] │      │ /demo-parakite/ │
   └───────────────────┘    ├───────────────────┤      │             [P2]│
                            │ /rental-parakite/ │      ├─────────────────┤
                            │  [P3] só quando   │      │ reviews × 4     │
                            │  for operacional  │      │             [P3]│
                            └───────────────────┘      └─────────────────┘

   Legenda   ✓ existe hoje   ↕ bloqueada em ti   ~ parcialmente marcada
             [P1..P3] fase

   As setas do diagrama são a pertença, não o limite: qualquer página liga a
   qualquer outra quando isso poupa uma pesquisa a quem lê.
```

**Os três hubs, e porque são três.** `/o-que-e-um-parakite/` responde *o que é*
— sem geografia, para quem chega de qualquer lado. `/parakite-portugal/`
responde *onde e com quem, cá* — é o hub do mercado.
`/flow-paragliders-portugal/` responde *o que se compra* — já existe.

**Cada página tem um hub principal, mas não é um silo.** O hub principal define
a quem a página pertence na arquitetura, o que herda de contexto e para onde
volta. Não define com quem pode falar.

Sempre que for útil a quem lê, uma página liga a conteúdos de outros ramos.
Alguns cruzamentos que já se vêem daqui:

- `/escolher-parakite/` (comprar) → `/parakite-control-system/` (entender),
  porque o sistema de controlo é metade da decisão
- `/reflex-lab/` (entender) → `/asas/parakites/` (comprar), porque quem percebeu
  o perfil quer ver que asas o têm
- `/curso-parakite-portugal/` (agir) → `/o-que-e-um-parakite/` (entender), para
  quem chega ao curso sem saber ainda o que é
- `/inspecao-e-reparacao-parakite/` (agir) → as fichas das 4 asas (comprar)
- `/parakite-vs-parapente/` (entender) → `/curso-parakite-portugal/` (agir),
  porque quem se decidiu quer aprender

A regra de ouro é a do leitor, não a do diagrama: **se a ligação poupa uma
pesquisa a quem está a ler, faz-se.** O que não se faz é ligar por ligar — cada
link tem de responder a uma pergunta que o texto acabou de levantar.

---

## Riscos de canibalização

Por ordem de gravidade.

### 1 · `/o-que-e-um-parakite/` contra `/parakite-portugal/` — **médio**

Era o risco alto desta arquitetura enquanto a página se chamava `/parakite/`.
**O endereço traduzido baixou-o**: os dois já não competem pela mesma cadeia de
caracteres, e cada slug anuncia a sua intenção antes de a página abrir — um
pergunta o que é, o outro diz onde.

Fica risco médio porque as duas continuam a tratar a mesma entidade.

**Mitigação:** a distinção tem de estar no título, no H1 e na primeira frase.

- `/o-que-e-um-parakite/` → «O que é um Parakite». Sem Portugal em lado nenhum.
  Sem CTA de venda acima da dobra.
- `/parakite-portugal/` → «Parakite em Portugal». Aprender, testar, alugar e
  comprar **cá**.

**Sinal de que correu mal:** o Google mostrar `/parakite-portugal/` para «what
is a parakite», ou alternar entre as duas para a mesma pesquisa.

**Plano B:** fundir. `/o-que-e-um-parakite/` redireciona para
`/parakite-portugal/`, que absorve a parte educativa. Decidir com dados.

### 2 · `/groundhandling-parakite/` contra `/pilot2wing/` — **média-alta**

Ambas falam de treino de solo. A distinção — prática contra método — é real mas
fina.

**Mitigação:** o groundhandling é para quem já voa e quer treinar; o Pilot2Wing
é o método de quem está a aprender. Se, ao escrever, o texto começar a repetir o
Pilot2Wing, isto é uma secção e não uma página.

### 3 · Reviews contra páginas de asa — **média-alta**

**Mitigação:** a página da asa é a ficha, com especificações e pedido. A review
é assinada, datada e em primeira pessoa. Se a review não tiver voo real por
trás, não se escreve.

### 4 · `/licenca-parakite-portugal/` contra `/curso-parakite-portugal/` — **média**

**Mitigação:** a licença é o enquadramento, o curso é o serviço. Se a página do
curso explicar a licença em detalhe, esta segunda deixa de ter razão de ser.

### 5 · As três comparações entre si — **resolvida por desenho**

Duas páginas em vez de três. Contra o parapente, a comparação é de categoria;
contra speedwing e mini-wing, o argumento é o mesmo.

---

## Fase 1 — as seis prioritárias

O objetivo é ter um cluster que se sustente: um hub do tema, um hub do mercado,
a gama, e a decisão de compra.

**Ordem prática, fixada em 29/08/2026:**

| | Página | Porquê nesta posição | Estado |
|---|---|---|---|
| 1 | `/parakite-portugal/` | Design aprovado e copy escrita. É o hub do mercado e a porta de tudo o resto | Pronta a implementar |
| 2 | `/o-que-e-um-parakite/` | Sem ela não há resposta à pesquisa mais ampla e genérica do tema | A escrever |
| 3 | `/curso-parakite-portugal/` | Sobe: é o destino do primeiro CTA do pilar, e a procura por formação é a mais transacional do cluster | A escrever, com duas marcações |
| 4 | `/asas/parakites/` | A condição posta em 24/08/2026 — «um parágrafo a sério por família» — cumpre-se aqui | A escrever |
| 5 | `/escolher-parakite/` | Depende de `/asas/parakites/` para não repetir a categoria | A escrever |
| 6 | `/reflex-lab/` | Já existe e não bloqueia ninguém. Fecha a fase | A transformar |

**As seis são a mesma fase.** Não é uma fila de espera: não é preciso esperar
que uma seja indexada para trabalhar na seguinte. A ordem é de arranque, não de
dependência — a única dependência real é a 5 depois da 4, para a página de
escolha não repetir a categoria.

**As duas marcações da 6** são a titulação que o curso dá e as credenciais da
FelloFly. Nenhuma impede a página: descreve-se o serviço com o que está
confirmado e deixa-se o resto marcado, como já se fez na copy do pilar.

## Fase 2 — expansão técnica e comercial

Só depois de a fase 1 estar publicada e indexada.

- `/parakite-control-system/` — o diferenciador técnico
- `/parakite-energy-management/` — a frase-assinatura, desenvolvida
- `/parakite-vs-parapente/` — a comparação que traz tráfego de investigação
- `/groundhandling-parakite/` — se a distinção face ao Pilot2Wing se aguentar
- `/inspecao-e-reparacao-parakite/` — serviço confirmado, sem preços
- `/demo-parakite/` — quando a secção do pilar der sinais de procura própria
- `/licenca-parakite-portugal/` — **quando desbloquear**
- Variantes de nome nas 4 páginas de asa e no gerador

## Fase 3 — reviews, long-tail e especializados

- Reviews por modelo: Mullet 2, MulletX, AlbatroXX, Mohawk
- `/parakite-vs-speedwing-miniwing/`
- `/rental-parakite/` — **só quando o serviço for operacional**
- Técnica: flare, stall, planeio — artigos individuais, um de cada vez
- Preço: secção em `/escolher-parakite/`, nunca página

---

## O que recomendo não fazer

- **Página de preço.** Contraria a política e frustra quem chega.
- **Três páginas de comparação.** Competem entre si com o mesmo argumento.
- **`/rental-parakite/` antes do serviço existir.** Uma página *coming soon*
  indexada é uma promessa que o Google guarda.
- **Reviews sem voo por trás.** É o único conteúdo aqui que não se pode fingir.
- **Páginas por variante de nome.** `Mullet2` não é uma página; é uma palavra
  dentro da página da Mullet 2.

---

## O que isto depende de ti

| | |
|---|---|
| **Credenciais FelloFly** | Bloqueia `/licenca-parakite-portugal/` (P2) inteira, e duas afirmações dentro de `/curso-parakite-portugal/` |
| **«Porquê esta para ti»** | Uma frase por asa. É a peça que faz `/escolher-parakite/` valer a pena |
| **Nível e terreno por asa** | Sem isto, `/escolher-parakite/` não filtra nada |
| **Rental operacional** | Bloqueia a fase 3 |
| **Texto do groundhandling** | O `PLANO.md` diz que já o tens escrito na plataforma |

---

*Escrito em 29/08/2026. Nenhuma página foi criada, nenhum ficheiro do site foi
alterado, e `/parakite-portugal/` está exatamente como estava.*
