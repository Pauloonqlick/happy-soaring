# Como trabalhar neste projeto

## Como verificar o trabalho

Verificar antes de dizer que está feito. Uma verificação que nunca acusou nada
não está provada: quando se escreve uma regra nova, alimentá-la com casos que
**têm** de falhar e casos que **têm** de passar. Foi assim que se descobriu que
a proteção da ANAC estava a acusar texto correcto, e que um bloco de YAML
inválido teria feito o CMS deixar de carregar em silêncio.

Duas notas práticas sobre o painel do browser, que se pagaram caro uma vez:

- Num painel **escondido** o Chrome trava os temporizadores para uma volta por
  segundo, não renderiza, e o `ResizeObserver` nunca dispara. Se o
  `innerHeight` der 0, o que se está a medir não é o site — é o painel. Dizer
  isso e medir de outra maneira.
- Medir com JavaScript dá números; capturas de ecrã dão impressões. Preferir os
  números, e guardar as capturas para quando a pergunta for mesmo visual.

## Como alterar ficheiros

**Usar as ferramentas de edição, não Python dentro do Bash.**

O heredoc do Bash come as barras invertidas mesmo com o delimitador entre
plicas — `"\s"` chega ao ficheiro como `"s"` e parte expressões regulares em
silêncio. Isto já aconteceu três vezes numa só sessão. A indentação copiada à
mão para dentro de uma string de Python é a segunda fonte de remendos falhados,
e cada falha é uma ida e volta inteira desperdiçada.

## Respostas

Curtas. Tabelas e secções só quando há mesmo várias coisas a comparar.

## Como se faz uma página de spot

Fechado a 05/09/2026 com a Praia das Bicas. Quando o Paulo entregar o texto de
outro spot, é isto — não voltar a decidir nada disto do zero.

**Onde vive.** Tudo em `content/spots.json`, editável no CMS em "Onde se voa
(galeria)". O gerador lê de lá. Nada de conteúdo de spot em ficheiros `.mjs`.

**Os campos, e o que cada um é:**

| campo | o que é |
|---|---|
| `titulo` | uma linha só, com travessão: `Praia das Bicas — Parakite e parapente` |
| `descricao` | a abertura, um ou dois parágrafos. Também é o que o popup do hub mostra |
| `ficha` | `concelho` (só para o schema) e `linhas`: uma lista livre de rótulo/valor, pela ordem que estiver |
| `seccoes` | o texto por assuntos, cada uma com título e texto. A ordem aqui é a ordem na página |
| `aviso` | a parte que diz que a página não decide nada. Obrigatória |
| `publicar` | `false` enquanto se escreve; `true` só quando está inteiro |

**O título parte-se no travessão, mas só na página.** Guarda-se uma linha; o
gerador corta no `—` e faz duas linhas centradas. Na aba do browser e no Google
fica a linha inteira, porque aí o travessão separa o sítio do assunto. Nunca
criar um segundo campo para a segunda linha: dois campos podem discordar.

**Português primeiro, traduções depois.** Com `publicar:false` pode estar só em
português — é rascunho e a verificação 15 não se queixa. Ao pôr `true` exige as
cinco línguas, a ficha e o aviso. E é a sério: o gerador recusa uma página sem
cinco `hreflang`, portanto ou existe nas cinco ou não existe.

**Nas traduções, a força das afirmações mantém-se.** Uma referência não vira
recomendação, um "pode" não vira "deve", um valor observado não vira limite.

**A ficha é uma lista livre, e tem de ser.** Começou com campos fixos — local,
distância, tipo de voo — e ao segundo spot já faltavam quatro: descolagem,
ambiente, outras atividades, acesso à praia. Ao terceiro faltariam outros
quatro. Cada sítio tem o que tem para dizer, e quem sabe isso é quem lá voa,
não quem escreve o gerador. Nunca voltar a acrescentar campos fixos à ficha.

**Um número cuja origem não se saiba dizer é melhor não estar.** Isto já foi
uma regra do código — a altitude só aparecia com a fonte preenchida — e deixou
de ser: a ficha livre não sabe quais das linhas são números. Passou a ser
julgamento de quem escreve, e é por isso que fica aqui escrito. Se um valor
precisa de uma fonte para se sustentar, ou a fonte se cita à vista na página,
ou o valor não entra. Nunca esconder a fonte nos dados estruturados: uma fonte
que só existe em dados que ninguém lê não é uma fonte, é um álibi.

**Listas escrevem-se com um traço.** Uma linha começada por `- ` dentro do
texto de uma secção vira um ponto de lista. Não é preciso saber HTML para
separar oito factores.

**Ligações escrevem-se `[texto](/caminho/)`**, com o caminho português e sem
domínio. O gerador põe-lhe o prefixo da língua, portanto escreve-se uma vez e
as cinco páginas apontam cada uma para a sua. Um endereço com domínio lá dentro
faz a publicação parar — já veio um colado do sítio onde o texto foi redigido, e
a verificação das ligações internas não o via, porque para ela um `https://` é o
site de outra pessoa.

**Sem fotografias nem vídeo na página.** A galeria vive no popup do hub. A
página é para ler; repetir lá as imagens era duplicar o mesmo conteúdo em dois
endereços.

**O endereço** é `/parakite-portugal/<id>/` — debaixo do hub, que existe, para
quem corta o URL a meio não cair num 404. As cinco línguas levam o prefixo
normal. Os endereços já registados em `ROTAS` para `/regras-…/` e `/spots-…/`
ainda não têm página.

**A forma da página** sai dos tokens `--doc-titulos`, `--doc-goteira` e
`--doc-largura`, que também mandam nas 110 fichas de asa. Não voltar a escrever
230px nem 48px à mão em lado nenhum.

O que faz a página parecer arrumada não é tudo ter a mesma largura — é tudo
acabar na mesma margem direita. A abertura encosta à esquerda e corre a largura
toda; o texto das secções começa depois da coluna dos títulos e corre o que
sobra. Larguras diferentes, mesma margem.

**A superfície é clara**, com `body.spot.papel` a trocar os tokens `--papel`,
`--tinta`, `--tinta-fraca` e `--linha` pelos do painel. Sobre claro o laranja da
marca não se lê (2,3:1) — usa-se `--laranja-tinta`. E o `.pg-topo` precisa de
fundo próprio, senão fica cinzento claro com letras brancas.

**Cuidado com `.pg.tema`.** Tem duas classes e ganha a quase tudo o que se
escreva com uma. Já apagou, nesta página, a medida da linha, a largura e o
tamanho dos `h2`. Ao estilar uma página de leitura, prefixar com
`body.spot.papel`.

## Regras do conteúdo que não se negoceiam

- **Nunca abrir o terminal para o Paulo fazer.** Fazer por ele.
- **Nunca commitar nem publicar sem pedido explícito.**
- Tudo o que é dito ao Paulo é em **português**.
- **"Happy Soaring" nunca se traduz**, nem se abrevia, nem se declina.
- A Flow: **"dealer oficial"** e mais nada. Nunca importador, representante
  exclusivo, distribuidor nacional nem exclusividade territorial. Em espanhol,
  "punto de venta oficial". Nunca "Centro Técnico Oficial Flow" nem "Reparações
  Oficiais Flow".
- **Não inventar dados.** Não sacrificar a veracidade para agradar ao Search
  Console.
- Cor personalizada e 1.ª inspeção de segurança são benefícios **só** da oferta
  Mullet 2.
- Não dizer quem emite a licença nem o que o curso dá, enquanto as credenciais
  FelloFly não estiverem fechadas.
- Os spots são referências de onde se voa, não disponibilidade garantida.
- **Nunca chegam ao repositório nem ao site:** a tabela de preços de dealer da
  Flow, a Tabela de Serviços · Preçário 2026 · FELLOFLY ASSIST, e as pastas
  `masters/`, `entregas/`, `catalogo-flow/`, `mockups/`, `_arquivo/`,
  `music/_apagados/`.

## O projeto em três linhas

Site estático sem build. `index.html` → `app.js` (módulo) → `content/*.json`.
As 140 páginas geradas nascem de `scripts/gerar-paginas.mjs` na publicação e não
se versionam. `npm run check` tem de passar antes de publicar; `node
scripts/publicar.mjs` ensaia, `--publicar` publica.
