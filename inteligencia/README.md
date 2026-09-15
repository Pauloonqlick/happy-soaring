# Módulo de Inteligência Happy Soaring

Worker próprio (`hs-inteligencia`), separado do site público. Serve a interface
e a API em `happysoaring.com/inteligencia/`, atrás do Cloudflare Access.

- **O site continua estático** no Cloudflare Pages. Esta pasta nunca entra na
  publicação do site (`inteligencia` está nas `PROIBIDAS` do `scripts/publicar.mjs`).
- **O CMS** (`/admin/`) é um sistema independente. O módulo não usa o seu código, o seu
  login nem as suas rotas, e o desenvolvimento do módulo não mexe no CMS.

## Estrutura

```
wrangler.toml                 Worker, rotas, D1, R2 — sem workers.dev nem pré-visualizações
src/index.js                  ordem fixa: prefixo → Access → API ou interface
src/acesso.js                 validação do token do Access em todos os pedidos (falha fechado)
src/seguranca.js              cabeçalhos de segurança de todas as respostas
src/estado.js                 estado do módulo e configuração base
src/publicacoes.js            observação das publicações do site (Fase 2)
src/google.js                 acesso só de leitura à API do Google
src/search-console.js         recolha e resumo do Search Console (Fase 3)
src/linguas.js                marca/não-marca e língua inferida (ou UNKNOWN)
src/inspeccao.js              inspecção de URL, rastreios e fila de indexação (Fase 4)
src/assuntos.js               assuntos, porta «Vale a pena agir agora?», «Hoje», pacotes (Fase 5)
src/conhecimento.js           decisões activas, factos, hipóteses, contactos, configuração (Fase 5)
src/avisos.js                 avisos críticos por email, pelo Resend (Fase 5)
src/aprendizagem.js           decisões automáticas, lições e manual de boas práticas
src/agenda.js                 a repartição da tarefa agendada por minuto (corre e mostra-se)
src/evolucao.js               painel «Evolução»: operação, indexação, página × língua, visão geral
public/inteligencia/          interface (sem código de terceiros)
migrations/                   esquema D1, só se acrescenta
test/                         testes sem rede
scripts/publicar.mjs          publicação do módulo, com --publicar
scripts/pacotes.mjs           pacotes de trabalho aprovados, só leitura (para o Claude implementar)
scripts/registar.mjs          o Claude regista lições, implementações e hipóteses eliminadas
scripts/manual.mjs            mostra o manual de boas práticas lido das lições (não guarda cópia)
```

## Testar e publicar

```
node --test "inteligencia/test/*.test.mjs"
node inteligencia/scripts/publicar.mjs              # valida, não publica
node inteligencia/scripts/publicar.mjs --publicar   # migrações + publicação
```

## Acesso

`ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` (em `wrangler.toml`) vêm da aplicação criada no
Cloudflare Access para `happysoaring.com/inteligencia`. Enquanto estiverem vazios,
o Worker responde 503 a tudo. Não são segredos.

## Publicações do site (Fase 2)

Fonte de verdade: a **API de Deployments do Cloudflare Pages**. Cada deployment de
produção é lido no **seu** endereço (`https://<id>.happy-soaring.pages.dev`), que
serve o conteúdo exacto dessa publicação — nunca a produção actual.

Por página guarda-se o resumo de conteúdo (SHA-1 do HTML sem os carimbos `?v=`,
igual ao `sitemap-datas.json`) e o resumo publicado (SHA-256 dos bytes). As
alterações face à publicação anterior — conteúdo, dados do CMS, novas, retiradas,
técnicas — calculam-se sempre a partir destas observações.

A tarefa agendada corre de 2 em 2 minutos e respeita os limites do plano gratuito
(50 pedidos e 50 consultas por execução): cada publicação é processada em passos
que retomam onde ficaram.

**Segredo necessário:** `CF_API_TOKEN_PAGES` — token da Cloudflare só com
permissão *Account › Cloudflare Pages › Read*. Configura-se no painel do Worker
(*Settings › Variables and Secrets*), nunca no `wrangler.toml` nem no git.
Sem ele, a tarefa regista a limitação uma vez por hora e não faz mais nada.

## Search Console (Fase 3)

Pesquisa Web da propriedade `sc-domain:happysoaring.com`, **só dados finais**: cada
dia é gravado uma vez e nunca é reescrito. Por dia guardam-se os totais sem
dimensões e os conjuntos `query`, `page`, `country`, `device` e o combinado.

A soma das linhas **não é** o total: o Google esconde pesquisas anónimas. Por isso
o resumo mostra marca, não-marca e **desconhecido** (= total − visível), e a
percentagem visível. A língua da pesquisa é inferida do texto só com evidência;
sem ela é `UNKNOWN`. Nunca se deduz do país.

A tarefa agendada é a mesma e acorda de 2 em 2 minutos. Desde 15/09/2026 (ver
`src/agenda.js`): ao minuto 00 de cada hora é a vez do Search Console (com o vigia,
a semana em revista e o resumo do dia), aos minutos terminados em 4 a da inspecção de
URL, aos 18, 38 e 58 a dos assuntos, ao 08 a dos avisos e consumos, aos 28 e 48 a das
decisões e aos terminados em 2 a das publicações. Nos outros minutos pares não faz
nada. Antes de 15/09 o Search Console corria de 10 em 10 minutos e as publicações em
todos os minutos que sobravam.

**Segredos necessários** (guardados por `scripts/autorizar-google.mjs`, que nunca
mostra os valores): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GSC_REFRESH_TOKEN` — cliente OAuth dedicado a este Worker, âmbito
`webmasters.readonly`.

## Inspecção de URL e fila de indexação (Fase 4)

A pergunta: **houve um rastreio do Google posterior à última alteração da página?**
Responde-se cruzando a última alteração observada nas publicações (conteúdo, dados
do CMS ou página nova — nunca alterações só técnicas) com o último rastreio que a
inspecção de URL devolve. Um rastreio posterior confirma que o Google voltou à
página; **não** confirma que a nova versão já foi processada ou indexada.

- De 10 em 10 minutos (minuto terminado em 4), no máximo 30 inspecções: primeiro as
  páginas alteradas ainda sem rastreio posterior (no máximo uma vez por dia cada),
  depois as nunca inspeccionadas, depois as de há mais de uma semana.
- A quota (2 000/dia) é partilhada com o Search Console e outros clientes. Um 429
  pausa a inspecção 60 minutos e fica registado como limitação — nunca é problema SEO.
- A resposta original vai para o R2 (`inspecoes/`); as observações ficam em
  `inspecoes` e `pedidos_indexacao`. `paginas_google` e `paginas_alteracao` são
  estado derivado, reconstruível (a migração 0004 reconstrói o segundo).
- `/inteligencia/indexacao/` mostra a fila. O pedido de indexação continua a ser feito
  à mão no Search Console; o botão «Já pedi» só regista que foi feito
  (`POST /inteligencia/api/indexacao/pedido` — exige Access, JSON, o cabeçalho
  `X-HS-Inteligencia: 1` e a mesma origem). Na Fase 4 era a única escrita da interface.

Usa os mesmos segredos Google da Fase 3; o âmbito `webmasters.readonly` basta.

## Assuntos, porta e «Hoje» (Fase 5)

**Detecção** (minutos 18, 38 e 58): lê só observações — as duas últimas inspecções
de cada página do sitemap de produção, a fila de indexação e as URLs com impressões
no Search Console — e grava os assuntos activos. Sinais fortes desta fase:

| Tipo | Crítico | Confirmação |
|---|---|---|
| bloqueio por robots.txt ou «noindex», erro de servidor ou acesso recusado | sim | não espera |
| deixou de estar indexada | sim | não espera |
| outros erros de obtenção (404, soft 404, redireccionamento) | não | 2 inspecções |
| canónico escolhido pelo Google diferente do declarado | não | 2 inspecções |
| rastreada e não indexada | não | 2 inspecções |
| nunca rastreada; alteração sem rastreio posterior há mais de 7 dias | não | acção operacional |
| dados estruturados com erros | não | validação do Google |
| URL fora do sitemap com impressões (verifica a resposta HTTP) | não | 2 semanas |

Sem sitemap de produção nada é dado como resolvido. Uma página sem inspecção é
limitação, nunca assunto. O que ainda não se verifica (títulos, hreflang, ligações
internas, ganhos e perdas, SERP) diz-se no bloco 6.

**Porta e estado** calculam-se ao ler, a partir dos assuntos, das decisões do Paulo,
das decisões activas, das hipóteses eliminadas e da configuração (importância dos
objectivos, nível e objectivos de cada página). Uma decisão conta logo.

**Pacotes de trabalho.** Aprovar gera um pacote com o que alterar, porquê, o que não
tocar, riscos, medição e as regras a respeitar. `node inteligencia/scripts/pacotes.mjs`
lista-os (só leitura). Quando a tarefa das publicações processa a primeira
publicação posterior que alterou a página, liga-a ao pacote. Depois do rastreio
posterior, a detecção avalia pela mudança de estado: melhoria observada, sem efeito
claro, piorou ou inconclusivo — nunca atribui causa.

**Escritas da interface** (todas com Access, JSON, `X-HS-Inteligencia: 1` e a mesma
origem): pedido de indexação marcado, decisão sobre um assunto, conhecimento (cada
versão guardada em `conhecimento_historico`), contacto (sem dados pessoais) e
configuração.

## Avisos críticos por email (fim da Fase 5)

Minuto 08 de cada hora. Só problemas críticos ainda por decidir (propostos,
detectados ou regressões); nunca o que foi ignorado, adiado, aprovado, bloqueado ou
retirado. No máximo um aviso agregado por dia; excepção imediata para um crítico numa
página de nível 1 ou três ou mais críticos novos; nunca mais de 3 envios em 24 horas.
Cada envio (ou falha, só com o código) fica em `avisos`.

Envio pelo **Resend**, a partir do subdomínio `avisos.happysoaring.com` — o email
Google do domínio principal não é tocado. Variáveis: `AVISOS_DE`, `AVISOS_PARA`.
**Segredo:** `RESEND_API_KEY` (chave só de envio, limitada a esse domínio), posto no
painel do Worker. Sem ele nada é enviado. O botão «Enviar aviso de teste» no «Hoje»
confirma a ligação (no máximo um a cada 10 minutos).

## Decisões automáticas e aprendizagem

**O Paulo não gere assuntos.** Desde 13/09/2026, o módulo decide por regras e o Claude
implementa; o Paulo pode contrariar qualquer decisão na ficha («Mudar a decisão»).
O bloco 3 do «Hoje» passou a «O que precisa de ti»: só o que nenhuma regra decide há
mais de uma hora e as decisões activas a rever.

| Assunto (confirmado ou crítico) | Decisão do módulo |
|---|---|
| correcções técnicas (bloqueios, erros, canónico, dados estruturados, desindexação) | aprovar → pacote para o Claude |
| nunca rastreada, alteração sem rastreio | aguardar 14 dias o rastreio natural, duas vezes; ao fim de 28 dias sem rastreio, o pedido de indexação vai para «O que precisa de ti» (no máximo 10 por dia) |
| URL fora do sitemap que já redirecciona 301/308 | arquivar |
| rastreada e não indexada | análise pelo Claude |
| lição que não resultou | análise pelo Claude, nunca a mesma correcção sozinha |

Nunca decide o que está por confirmar, bloqueado por decisão activa, retirado por
hipótese eliminada, ou decidido pelo Paulo. Cada decisão guarda quem a tomou.
O Claude publica sozinho **correcções técnicas** do site (autorização do Paulo de
13/09/2026); o que muda texto, preços ou afirmações sobre o negócio precisa do «publica».

**Lições.** Cada lição (`licoes`) descreve um erro real — sintoma, causa, correcção e a
boa prática que o evita — e reconhece-o na evidência por uma expressão regular. O pacote
aprovado leva a lição. Os resultados não se escrevem à mão: contam-se das avaliações dos
pacotes (e, para lições de «não fazer nada», dos casos que se resolveram sozinhos).
Estado: **confirmada** com 2 ou mais resultados positivos e nenhum pior; **não resultou**
com uma piora ou duas avaliações sem efeito; **em teste** no resto.

**Lições de processo e «o que falta aprender»** (0014, 14/09/2026). Uma lição pode ser
`PROCESSO`: uma regra de trabalho (como se publica, como o módulo opera) sem tipo de
problema, nascida de um caso real que fica em `referencias`, e **em vigor** desde que existe.
Para nada se perder, `lerFaltaAprender` lista os problemas que nenhuma lição reconhece e os
incidentes que nenhuma lição refere — «falta lição», «causa por descobrir» (já há hipóteses
eliminadas) ou «causa por confirmar». Sai-se da lista registando a lição, as hipóteses, ou
dispensando com motivo (`registar.mjs dispensar`, tabela `aprendizagem_dispensas`). Aparece
na página «Aprendizagem», na leitura de 2 em 2 dias (`leitura.mjs`), em
`scripts/falta-aprender.mjs` e no fim das duas publicações (site e módulo), sem as bloquear.

**Fontes oficiais e a documentação do Google vigiada** (0015, 15/09/2026). Cada lição guarda
em `fontes` as páginas oficiais em que se apoia (lidas antes de citar); uma lição de SEO sem
fonte fica «sem fonte oficial» em «o que falta aprender». Uma vez por semana, na execução dos
avisos, `src/documentacao.js` lê o feed oficial das actualizações da documentação da Pesquisa
Google (tabela `documentacao_google`). Uma entrada nova que cite uma página usada como fonte
fica «rever lição» até se registar o que se fez (`registar.mjs rever <guid> <nota>`); as
outras ficam à vista na página «Aprendizagem». Uma leitura falhada tenta-se na hora seguinte.
Os estados de cobertura do Google (Detetada, Rastreada, …) explicam-se com a definição da
ajuda oficial do Search Console (`src/definicoes-google.js`), na ficha do assunto e na fila de
indexação — nunca com interpretações de terceiros.

**Manual — uma só fonte de verdade.** As boas práticas vivem **só** nas lições do módulo
(tabela `licoes`). A página «Aprendizagem» e `node inteligencia/scripts/manual.mjs` mostram-nas
(confirmadas, em teste e as que não resultaram) — para este site e para os próximos. Não há
cópia no repositório: quando for preciso levar o manual para outro lado, gera-se nesse dia
com `--ficheiro`, e a cópia diz de quando é. Uma prática nova entra por `registar.mjs licao`,
nunca escrita num .md, no `CLAUDE.md` ou numa memória.

Fluxo do Claude: `pacotes.mjs` → corrigir no site → commit → `registar.mjs implementacao
<lição> <commit>` → publicar → o módulo liga a publicação, espera o rastreio posterior,
avalia e actualiza a lição → `manual.mjs`.

Quando uma análise descarta uma explicação (por exemplo, «a página não está indexada por
ter pouco texto»), o Claude regista-a com `registar.mjs hipotese <ficheiro.json>` e ela
aparece em «Conhecimento». **Sem `tipo_assunto` fica só como conhecimento**; com ele, os
assuntos desse tipo nesse caminho passam a retirados — só se usa quando a hipótese
eliminada é mesmo a razão para não agir.

## Painel «Evolução»

`/inteligencia/evolucao/`, só leitura, quatro secções (cada uma com o seu pedido à API,
para caber no limite de consultas por pedido):

1. **Operação** — cada tarefa agendada: regra, última execução (duração, ok ou falhou),
   execuções e falhas em 24 h, próxima execução; filas (publicações e ritmo, Search
   Console, inspecção e quota partilhada, problemas por decidir, trabalho do Claude,
   avisos); limitações das últimas 24 h. As execuções ficam em `execucoes` (14 dias).
2. **Indexação** — por língua e por família: indexadas, nunca rastreadas, dias desde o
   último rastreio, rastreios por página; percentagem indexada por semana; tempo entre a
   alteração e o rastreio posterior (por língua e nível); problemas por semana e regressões.
3. **Página × língua** — as versões linguísticas de cada página conceptual lado a lado
   (impressões, cliques, posição, estado no Google), com os sinais: não indexada, atrás
   das irmãs, indexada sem impressões, queda ou subida confirmadas. O agrupamento vem do
   **hreflang que cada página publica** (lido pelas publicações para `deployment_paginas.versoes`);
   até haver uma publicação lida com hreflang, a tabela mostra uma linha por página.
4. **Visão geral** — semanas completas de cliques, impressões, CTR e posição; marca, sem
   marca e desconhecido; publicações, rastreios e correcções publicadas como anotações.

Tendências só confirmadas com 4 semanas completas: as 2 últimas ambas 20% abaixo (ou
acima) da média das 2 anteriores, com amostra mínima. Com menos, diz «histórico insuficiente».

## Vigia da tarefa agendada e incidentes

Na noite de 13 para 14/09/2026 a Cloudflare cortou a meio, durante 9 h 18 min, 159
execuções de publicações, assuntos e decisões: gastavam 20 a 65 ms de processamento e o
plano gratuito permite 10 ms. Uma execução cortada não chegava a escrever o seu registo,
e ninguém deu por isso. Desde então:

- **Plano Workers Paid** (desde 14/09/2026) com um tecto de **1 s por execução**
  (`[limits] cpu_ms` no `wrangler.toml`): folga para as tarefas, sem deixar que um erro
  no código se transforme em custo. Os orçamentos de pedidos e consultas por execução
  continuam os do plano gratuito.
- **Registo antes e depois:** cada execução escreve-se em `execucoes` **antes** de começar
  (`ok` vazio) e fecha o registo no fim. Aberta há mais de 5 minutos = **cortada a meio**.
- **Vigia** (`src/vigia.js`), na execução do Search Console (a mais leve): compara a
  agenda com o que correu, minuto a minuto, desde onde ficou da última vez (até 24 h):
  `OK`, `FALHOU`, `INTERROMPIDA` ou `EM_FALTA`. Dois problemas a menos de 20 minutos um do
  outro abrem um **incidente** (`incidentes`); 20 minutos sem problemas fecham-no. Um
  problema isolado (por exemplo durante uma publicação do módulo) fica só nas contagens.
- **Onde se vê:** no «Hoje», bloco 1, enquanto houver um incidente aberto ou nas 24 h
  seguintes a um que tenha durado 30 minutos ou mais; em «Evolução → Operação», a lista
  de incidentes e, por tarefa, as execuções cortadas a meio e as que não correram nas
  últimas 24 h; no resumo de 2 em 2 dias.
- **Registos da Cloudflare** (`[observability]`): guardam a causa exacta de cada
  execução cortada.

Limite conhecido: se a tarefa agendada parar por completo, o vigia pára com ela. O buraco
fica registado quando a tarefa volta; até lá, quem dá por isso é o resumo de 2 em 2 dias
(corre no computador do Paulo e vê a hora da última execução).

## «A leitura de hoje» e «Semana em revista»

Frases-modelo preenchidas pelo módulo (`src/leitura.js`), sem IA: cada frase só aparece
quando o dado que a sustenta existe e tem amostra suficiente, liga ao detalhe e nunca diz
que uma correcção causou um resultado — só o que se observou depois.

- **A leitura de hoje** (topo do «Hoje»): só o que é novo desde a última visita deste
  browser (na primeira visita, as últimas 24 h). Por ordem: módulo com tarefas a falhar,
  páginas para pedir indexação, problemas novos, páginas que saíram do índice, correcções
  publicadas, o Google a voltar a páginas corrigidas, avaliações, páginas que entraram no
  índice (só mudanças de estado), problemas resolvidos, lições confirmadas ou refutadas,
  incidentes já fechados. Sem novidades: «Nada de novo desde a tua última visita.»
  Visibilidade (impressões e cliques) não entra: o dia-a-dia é ruído.
- **Semana em revista** (`/inteligencia/semana/`): escrita e guardada em `semanas_revista`
  quando o Search Console fecha os 7 dias de uma semana (segunda a domingo) — na execução do
  Search Console. Secções: visibilidade (com a semana anterior só acima de 50 impressões;
  marca/assunto dita parcial quando o Google esconde mais de metade das pesquisas),
  destaques (páginas com pelo menos 20 impressões), oportunidade (posição média 8,5–20),
  indexação, correcções e resultados, o módulo, próximas datas. Fica no «Hoje» até ser lida.
- **Resumo de 2 em 2 dias:** `node inteligencia/scripts/leitura.mjs --horas 48` imprime as
  mesmas frases (só leitura, pela API do D1 com a sessão do wrangler).
  `--simular-semana` mostra como ficaria a última semana completa, sem gravar.
