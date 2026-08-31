# Plano de desenvolvimento

Mapa do documento de recomendações contra o que o site tem de facto,
em 24/08/2026. Verificado, não de memória.

O `PENDENTES.md` continua a ser a lista operacional do dia-a-dia. Isto é o
mapa grande: o que existe, o que falta, e por que ordem.

---

## O que já existe, e está bom

| | estado |
|---|---|
| **Catálogo Flow** | 22 asas × 5 idiomas = 110 páginas próprias, com especificações, cores, tamanhos, vídeo e gama de vento onde há dados |
| **Modo descoberta** | 4 perguntas que filtram as 22 asas; separadores de família e homologação |
| **Cor à medida** | 18 cores da carta Flow na Mullet 2, com a escolha a viajar para o WhatsApp |
| **Pedido por WhatsApp** | tamanhos, cor e país compostos na mensagem, igual no palco e nas páginas |
| **SEO técnico** | robots, sitemap com 112 URLs (submetido e lido), canonical, hreflang, Open Graph com a foto de cada asa, JSON-LD, 404 a sério, 301 do `/coming-soon/` |
| **5 idiomas** | pt/en/es/fr/de, com os rótulos de família e classe traduzidos |
| **Sistema de avisos** | ofertas com datas, âmbito por asa e selo na grelha, no carril, no palco e na página |
| **Publicação** | lista de autorizados, verificações que param se algo privado entrar, carimbo de versão |
| **Reflex Lab** | existe em `/reflex-lab/` |
| **Música** | secção com faixas, entrega por R2 e biografia |

O documento pede em §8 "cada modelo com página própria". **Está feito.**
O que não está: o §8 também pede *"conteúdo original e não apenas texto
copiado do fabricante"* — 19 das 22 asas usam o texto da Flow.

---

## O que existe mas está desligado

Estas secções estão no CMS, com **título e uma linha cada**. Não têm prosa.

- `sobre` — "CURSOS · Da soft-acro ao freestyle…"
- `comunidade` — "Não vendemos velas…"
- `dealer` — "Flow Paragliders · Representantes oficiais em Portugal…"
- `reflex-lab` — a secção da página inicial (a página existe)

Ligá-las sem lhes escrever texto não resolve nada. São recipientes vazios.

---

## O que não existe

Dezanove das vinte e sete secções do documento. Não é mau sinal — é um
roteiro, não uma auditoria.

### Precisa só de escrita tua

- **§16 Paulo & Bea** — a Bea não é mencionada em lado nenhum do site
- **§18 FAQ** — as respostas são coisas que dizes todas as semanas
- **§4 Groundhandling** — a filosofia, que já tens escrita na plataforma
- **§13 Responsible Parakite** — proteger as dunas, respeito pelos spots
- **§12 Spots** — sem revelar o que não deve ser revelado

### Precisa de escrita e de decisões

- **§2 Parakite** — a área educativa. É o maior bloco de trabalho do documento
- **§3 Formação** + **§17 FelloFly** — ver bloqueios
- **§6 Demo center** — depende de que asas tens mesmo disponíveis
- **§7 Escolher o tamanho** — cruza com o modo descoberta, que já faz metade
- **§9 Pós-venda** e **§10 Inspeções** — depende do que está operacional
- **§19 Artigos** — o cluster técnico
- **§22 Contacto** — formulário com motivo

### Precisa de trabalho técnico antes

- **§5 Pilot2Wing** — a plataforma existe e funciona, mas tem 2 skills, o
  áudio inglês aponta para o WordPress morto, e os editores de autoria
  ficariam à vista de todos
- **§11 ParaKiteLog** — **a Mocha vai encerrar**. Autenticação, ficheiros e
  base de dados param. Precisa de casa nova antes de ter página
- **§15 ParakiteSpirit** — não há projecto no computador; existe só como conta

---

## Bloqueios: o que não avança sem ti

| | o que preciso |
|---|---|
| **Credenciais** | O que a FelloFly está credenciada para emitir, por que federação, e se "qualificação de parakite" existe formalmente. Sem isto não escrevo a página de formação |
| **A Bea** | Que papel público quer ter. Não invento uma pessoa |
| **Serviços** | Quais estão operacionais **hoje**: inspecção, trim, reparação. O documento avisa, e bem, para não anunciar o que ainda não existe |
| **Demos** | Que asas e tamanhos tens mesmo para emprestar |
| **A música** | Fica no site de parakite? É uma decisão de posicionamento, não de código |
| **Pilot2Wing** | Público como protótipo, ou página sem link por agora |

---

## A ordem que eu faria

Diferente da do documento (§27) em dois pontos, com razões.

### Primeiro — barato, teu, e destrava o resto

1. **Paulo & Bea** — o documento põe em 9.º. Todos os consultores disseram
   que autoria e pessoas reais são críticas, é a página mais fácil de
   escrever, e é ela que dá credibilidade a todas as outras
2. **FAQ** — o documento põe em 10.º. É a peça de maior alavanca para
   pesquisa por IA: responde a perguntas no formato exacto que esses
   sistemas consomem, e tu já sabes as respostas de cor
3. **Página inicial** — dizer quem és em vez de mostrar só o catálogo

### Depois — o território

4. **Parakite em Portugal** — a página pilar
5. **Curso de parakite em Portugal** — com a FelloFly como credibilidade lá
   dentro, e não como assunto da página (ver `docs/FORMACAO.md` quando existir)
6. **Groundhandling** → liga ao Pilot2Wing
7. **Pilot2Wing**

### Depois — o comercial

8. **Escolher o tamanho** — aproveita o modo descoberta
9. **Demo / experimentar**
10. **Pós-venda, inspecções**

### Por fim

11. Artigos técnicos, um a um
12. Spots · Responsible Parakite · Eventos
13. **ParaKiteLog** — só depois de ter casa nova
14. ParakiteSpirit

---

## Onde discordo do documento

**A música não é mencionada uma única vez.** O site tem uma loja de música
com biografia. Ou faz parte da identidade e tem de aparecer no plano, ou não
faz e devia sair do site de parakite. Não pode ficar a existir sem estar
pensada.

**§11 ParaKiteLog está cedo demais.** O documento não sabe que a plataforma
vai encerrar.

**§27 põe o Pilot2Wing em 12.º.** É o activo mais distintivo que tens —
nenhum concorrente tem uma plataforma de treino com Vision. Mas também é o
menos pronto. Mantenho-o a meio: depois do groundhandling, antes do
comercial.

**O documento acerta em cheio numa frase**, e é a que deve governar tudo:

> O mais importante é que o site represente aquilo que já existe hoje e
> apresente claramente como "coming soon" aquilo que ainda está a ser
> desenvolvido.
