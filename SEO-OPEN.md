# SEO — o que está em aberto

Estado. As regras do processo estão no `SEO-WORKFLOW.md`.

Última reconciliação: **08/09/2026**, contra a exportação de Cobertura do
Search Console (motivo "Detetada – atualmente não indexada", **dados até
04/09**) cruzada com o repositório e com produção.

O site está publicado em `929fba7` desde 06/09 às 21:31. **A exportação é
anterior a isso:** não viu as 15 páginas de spot, nem o sitemap sem `lastmod`,
nem os ícones da marca. Nada aqui mede o site actual.

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
