# SEO — o que está em aberto

Estado. As regras do processo estão no `SEO-WORKFLOW.md`.

Última reconciliação: **06/09/2026**, contra `hs-seo-2026-09-06T162417Z.json`
(recheck dirigido, 4/4, sem erros, site na versão `20a5b60`) e, antes dele,
`hs-seo-2026-09-06T135516Z.json` (corrida completa, 160/160).

---

## AGUARDAR GOOGLE

### 7 fichas de asa por indexar
```
/de/schirme/fusion/          não reconhece    8 ligações de entrada
/en/wings/rpm-3/             não reconhece    4
/en/wings/vissta-xc/         detetada         3
/es/alas/albatroxx/          detetada         6
/fr/ailes/mohawk/            não reconhece    6
/fr/ailes/rpm-3/             não reconhece    4
/fr/ailes/yoti-3/            não reconhece    3
```
aberto: 2026-09-06 · rever depois de: 2026-09-13

**Sem alteração recomendada.** Auditado a 06/09 com as 160 URLs: nenhuma lacuna
técnica, nenhuma lacuna de descoberta interna, paridade estrutural e de conteúdo
com as versões indexadas. A hipótese das ligações internas foi testada com
controlos e rejeitada — a `/de/schirme/fusion/` tem 8 ligações de entrada, o
máximo do site, e não está indexada; há 39 fichas indexadas com as mesmas 8.

As sete estavam todas na exportação de 28/08, que tinha doze. Cinco deixaram de
aparecer como não indexadas em nove dias, sem intervenção, e nenhuma nova
apareceu.

Sobre a língua: as listas parciais de 06/09 de manhã eram 100% alemãs, o que
sugeria sobre-representação. **A corrida completa das 13:55 não suporta essa
leitura** — das sete, `fr` 3, `en` 2, `de` 1, `es` 1. Não é o mesmo que dizer
que o alemão está descartado: é uma corrida, e a distribuição de 28/08 era
outra (`de` 6 de 12). Fica por observar em corridas seguintes.

Acção manual disponível: pedir indexação no Search Console.

### 15 páginas de spot publicadas a 06/09
```
/parakite-portugal/fonte-da-telha/     e as 4 traduções
/parakite-portugal/praia-da-gralha/    e as 4 traduções
/parakite-portugal/praia-do-meco/      e as 4 traduções
```
aberto: 2026-09-06 · rever depois de: 2026-09-13

Publicadas no próprio dia. "Não reconhece" é o esperado.

---

## DECISÃO PAULO

### O `lastmod` do sitemap diz que tudo mudou, sempre
aberto: 2026-09-06

O sitemap escreve a data de hoje nas 160 URLs em cada publicação. É falso para
quase todas, e um sinal que diz sempre "mudou tudo" é um sinal que se aprende a
ignorar. Não é causa provada de nada, mas é o único mecanismo que controlamos
que toca no agendamento de rastreio.

### "Estacionamento: geralmente fácil na zona", na Fonte da Telha
aberto: 2026-09-06

A mesma página diz três parágrafos acima que é "uma praia muito frequentada,
particularmente durante a época balnear". Publicado como escrito, por ser texto
do Paulo.

### O wordmark da página inicial, e só ele
aberto: 2026-09-05 · medido outra vez: 2026-09-06

O herói do Parakite foi corrigido e sai deste ficheiro. Na inicial mediram-se
os cinco elementos a 1440px e a 375px: o `h1`, o `lead` e o `kicker` passam
nos dois tamanhos. Reprova só o `HAPPY SOARING` — 2,28:1 e 1:1 em desktop,
2,76:1 e 1,01:1 em mobile.

Duas coisas que esta medição mostrou e a de 05/09 não tinha mostrado.

**O laranja não é o problema.** Sobre o azul-marinho do scrim mede 5,11:1. O
que falha é o scrim afinar por baixo da segunda metade da palavra: o
`SOARING` chega aos 45% da largura, e aí a banda escura já vai em .30.

**E não há correcção barata.** Com o scrim *totalmente opaco* à esquerda o
`SOARING` só sobe a 2,66:1 — continua abaixo dos 3:1 exigidos a texto
grande. Para passar era preciso azul quase opaco sobre os primeiros 45% do
herói, que é exactamente o que se tirou do herói do Parakite por tapar a
fotografia — está contado em `pagina.css`, no comentário acima do
`.pk-heroi::after`.

O `.wordmark` é um `<div>` com o nome da marca, e o `<h1>` é outro elemento,
por baixo. A norma isenta logótipos e nomes de marca de requisito de
contraste (WCAG 1.4.3), portanto isto não é uma falha numa auditoria. Fica
aqui por ser escolha de desenho e não facto técnico: aceitar a isenção, ou
pagar a fotografia pelo contraste.

### O cliente OAuth abandonado no Google Cloud
aberto: 2026-09-06

Ficou por usar quando se abandonou o OAuth, e tem uma Client Secret viva. Um
cliente abandonado com segredo activo é uma porta que ninguém vigia. Um minuto
no Google Cloud, e não depende de mais nada avançar.

---

## PENDENTE

(nada)
