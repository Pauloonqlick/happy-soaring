# Como trabalhar neste projeto

## Como verificar o trabalho

**O Paulo tem um browser a sério, o Claude tem um painel que muitas vezes está
escondido.** Num painel escondido o Chrome trava os temporizadores para uma
volta por segundo, não renderiza, e o `ResizeObserver` nunca dispara — medir aí
é medir um ambiente que nenhum visitante tem.

Por isso:

- Fazer a alteração e dizer em duas linhas **o que olhar e onde**. O Paulo olha.
- Ir ao browser só quando ele pedir, ou quando for uma medição que ele não pode
  fazer à mão: contraste, tamanhos, rácios, geometria.
- **Uma tentativa de verificação, não quatro.** Se a primeira não concluir,
  dizer o que se viu e passar a bola. Repetir o mesmo teste à espera de outro
  resultado é desperdício.
- Se o `innerHeight` der 0 ou o painel disser que está escondido: **parar já**.
  Não há nada a medir.
- Capturas de ecrã só quando a pergunta é mesmo visual, nunca em série, e nunca
  à escala cheia. Medir com JavaScript custa uma fracção e dá números em vez de
  impressões.

Isto significa que fica mais coisa por confirmar do meu lado. É deliberado: é o
preço de um pedido custar um quinto.

## Como alterar ficheiros

**Usar as ferramentas de edição, não Python dentro do Bash.**

O heredoc do Bash come as barras invertidas mesmo com o delimitador entre
plicas — `"\s"` chega ao ficheiro como `"s"` e parte expressões regulares em
silêncio. Isto já aconteceu três vezes numa só sessão. A indentação copiada à
mão para dentro de uma string de Python é a segunda fonte de remendos falhados,
e cada falha é uma ida e volta inteira desperdiçada.

## Respostas

Curtas. Tabelas e secções só quando há mesmo várias coisas a comparar.

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
