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

### A ligação de volta entre a Lagoa e a Fonte da Telha
aberto: 2026-09-06

A página da Fonte da Telha diz que se voa para sul até à Lagoa. A da Lagoa não
diz o inverso. O facto está escrito de um lado só — mas a simetria pode não ser
verdade no vento, e isso é conhecimento do Paulo.

### Os dois heróis reprovam no contraste
aberto: 2026-09-05

Medido: `SOARING` a 1:1 na página inicial, o subtítulo do Parakite a 2,17:1.
Herdado da secção da landscape quando se copiou a receita dela.

### O cliente OAuth abandonado no Google Cloud
aberto: 2026-09-06

Ficou por usar quando se abandonou o OAuth, e tem uma Client Secret viva. Um
cliente abandonado com segredo activo é uma porta que ninguém vigia. Um minuto
no Google Cloud, e não depende de mais nada avançar.

---

## PENDENTE

(nada)
