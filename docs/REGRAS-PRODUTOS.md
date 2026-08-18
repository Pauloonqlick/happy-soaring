# Secção de produtos Flow — regras e funcionamento

Como está construída a secção das asas: o que o site faz sozinho, o que vem dos
dados, e as decisões que já foram tomadas. Serve para não se voltar a discutir o
que já ficou decidido, e para preparar uma asa nova sem ter de adivinhar nada.

Ficheiros envolvidos:

| Onde | O quê |
|---|---|
| `content/slides/produtos.json` | os dados de todas as asas |
| `app.js` | `buildFlow`, `cartao`, `blocoCores`, `pedirPreco` |
| `styles.css` | bloco `.flow-*` |
| `admin/config.yml` | os mesmos campos, para editar no CMS |
| `images/asas/` | fotos das asas, por cor |
| `images/logos/` | logótipos, duas versões cada |
| `images/flow/` | imagens que acompanham textos |

---

## 1. Os cartões

Um cartão por asa, agrupados por família. Os filtros de homologação só aparecem
quando a família tem mais do que uma — não vale a pena um filtro com uma opção.

- **Nome ou logótipo.** Com logótipo, o nome escrito dá lugar à imagem, centrada.
  O nome vai no `alt`, por isso não se perde para leitores de ecrã nem para
  pesquisa. Se o ficheiro faltar, o cartão volta sozinho ao nome escrito.
- **Foto** da primeira cor, limitada a 84% da largura da caixa. É esse limite que
  trava as asas mais achatadas, que de outra forma encostavam às margens e
  pareciam maiores que as vizinhas.
- **Bolas de cor**, uma por cor disponível.
- **Tamanhos**, só para leitura.
- **Dois botões:** ver detalhe e pedir preço.

Os cartões da mesma linha têm sempre a mesma altura.

## 2. Pedir preço

O botão é verde WhatsApp com o ícone da aplicação.

Ao clicar **abre sempre uma janela** — nunca vai direto à conversa. Dentro pede
duas coisas, ambas obrigatórias:

1. **Tamanho** — os da asa, sem opção de escape
2. **País** — campo de escrita livre, mínimo duas letras

Enquanto faltar alguma, o botão de enviar **fica sem ligação**: não é clicável
nem alcançável por teclado, e mostra-se apagado. Preferiu-se isto a deixar
clicar e depois avisar — não há botão morto a fingir que funciona.

A mensagem é montada no idioma em que o visitante está a ver o site, o que diz
logo em que língua responder.

> Olá! Queria pedir preço para a Future 2, tamanho M. Estou em Portugal.

O envio é uma **ligação normal**, não `window.open`: assim os bloqueadores de
popups deixam passar e o WhatsApp abre à primeira.

A janela fecha com **Esc**, com clique fora ou no botão Fechar. Tem
`role="dialog"` e `aria-modal`, e o foco começa no primeiro tamanho.

## 3. O painel de detalhe

Abre dentro da grelha, ocupando a linha toda, e rola para o topo do painel.

### Cabeçalho
Faixa azul com o **logótipo e o subtítulo centrados** como bloco. O botão de
fechar está fora do fluxo, no canto — se estivesse na mesma linha, o logótipo
centrar-se-ia no espaço que sobra e não no painel.

O logótipo usa aqui a **versão branca**, porque o fundo é azul.

### Ordem dos blocos
```
Cabeçalho          logótipo + família · homologação
Apresentação       descrição, para quem é, pontos fortes
Cores disponíveis  uma foto por cor
Vídeo              se a asa tiver
Gama de vento      se a asa tiver
Tamanhos e especificações
Descrição          texto longo do fabricante
Secções            materiais, perfil, risers…
Documentos         sempre em último
```

### Regras transversais
- **Todos os títulos são faixas azuis de ponta a ponta**, com o mesmo gradiente
  do cabeçalho. Em maiúsculas, peso 500 — nunca bold.
- **Nada é colapsável.** O acordeão foi retirado: escondia o conteúdo atrás de um
  clique que a maioria não dá. As faixas é que servem de âncora.
- **Texto em duas colunas**, abaixo de 820 px passa a uma.
- **Sem botões de ação.** A compra vive nos cartões, onde a decisão é tomada. Não
  há ligações para a página do fabricante — decisão do dono.

## 4. As cores

O bloco **gera-se sozinho** a partir das cores da asa. Não há secção para
preencher: acrescentar uma cor faz a foto aparecer.

Cada foto leva por baixo a bola da cor e o nome que o fabricante lhe dá.

**As bolas mostram uma só cor, a base.** Para nomes compostos (`black-blue-pink`)
usa-se a primeira. Para nomes de fantasia há uma tabela que os liga à cor base —
*disco* → lima, *jazz* → vermelho, *sky* → azul.

## 5. Textos e traduções

Todo o texto visível existe em **cinco idiomas**: pt, en, es, fr, de. Falhando um,
mostra-se o português.

- O **inglês** é o original do fabricante; os outros são tradução, sem acrescentos.
- Os `**negritos**` têm de estar fechados aos pares em todos os idiomas.
- Linhas começadas por `- ` viram lista com marca. Uma lista pode repartir-se
  entre colunas, mas **cada item fica inteiro**.
- Os nomes dos ficheiros para descarregar também são traduzidos — foram texto
  simples durante algum tempo e nunca chegavam ao tradutor.

O espanhol abre perguntas com `¿`. É ortografia obrigatória, não é erro.

## 6. Documentos

Apontam para o **site do fabricante**, não para cópias no nosso servidor: assim
um manual novo é servido sem mexer em nada. Abrem em separador novo, com
`rel="noopener"`.

No telemóvel ficam **um por linha** — em grelha sobravam botões órfãos.

## 7. Imagens

### Fotos das asas — `images/asas/`
```
<nome-sem-espaços-nem-símbolos>__<cor>.webp        1200 px, detalhe
<nome-sem-espaços-nem-símbolos>__<cor>-card.webp    600 px, cartão
```
`Future 2` → `future2`, `F2 Light` → `f2light`.

**Têm de ter transparência** e estar cortadas justas à asa. O script
`scripts/otimizar-asas.py` faz o recorte, as duas medidas e a conversão.

Quando a origem é JPEG ou não tem alfa:
1. Preencher a partir dos **quatro cantos**, não por limiar global — assim o
   branco de dentro da asa não abre buracos
2. **Erodir 2 px**, para cortar a franja de compressão

#### Apagar sempre as legendas de cor
As imagens do fabricante trazem muitas vezes, dentro da própria imagem, as
**bolinhas das cores e o nome do esquema**. Isso tem de sair: o site já mostra a
bola e o nome por baixo da foto, e ficariam a dobrar.

Não se vê ao olho quando a imagem já tem transparência — o recorte automático
mantém a legenda, porque para ele é conteúdo como outro qualquer. Confirmar
sempre visualmente sobre o azul do cartão antes de dar por fechado.

Apagar **por região**, nunca por linha. As legendas ficam à mesma altura das
pontas da asa; um corte horizontal decepa a vela. O método:

1. Localizar o bloco da legenda pelo perfil de opacidade, isolando os grupos de
   colunas com conteúdo naquela faixa de altura
2. Confirmar que a asa não entra nessa zona
3. Pôr o alfa a zero nesse retângulo, com alguma folga
4. Só depois recortar à caixa útil

### Logótipos — `images/logos/`
```
<nome>.webp        branco, 68 px de altura — cartão e cabeçalho
<nome>-dark.webp   escuro, 80 px           — reserva para fundos claros
```
Os logótipos do fabricante vêm a preto e opacos. Recolorir mantendo o alfa como
máscara; se não houver alfa, usar o **inverso da luminância**, o que dá bordas
suaves em vez de serradas.

### Imagens de texto — `images/flow/`
Máximo 1400 px de largura, WebP a 84.

## 8. Preparar uma asa nova

1. Fotos por cor para `images/asas/`, com transparência e recorte justo
2. Logótipo nas duas versões para `images/logos/`
3. Em `produtos.json`: `logo`, `cores`, `tamanhos`, `specs`
4. Secções pela ordem da página do fabricante, texto em cinco idiomas
5. Secção **Documentos** em último, a apontar para o fabricante
6. Verificar: nada por traduzir, negritos fechados, imagens todas a carregar

**Não é preciso** criar a secção das cores — é gerada.

## 9. Decisões tomadas

| Decisão | Porquê |
|---|---|
| Secções sempre abertas | o acordeão escondia tudo atrás de um clique que ninguém dá |
| Sem foto no topo do detalhe | repetia o cartão que se acabou de clicar |
| Sem seletor de cor | mostrava uma cor de cada vez; o bloco mostra todas |
| Cores antes das especificações | vê-se primeiro o aspeto, depois os números |
| Bolas com uma só cor | o esquema completo já se vê na foto |
| Sem ligações à página do fabricante | decisão do dono |
| Documentos a apontar ao fabricante | ficam sempre na versão mais recente |
| Sem embeber a página do fabricante | traria menu, rodapé e cookies deles, e só existe em inglês |
| MP3 em vez de WAV para ouvir na página | quatro vezes menos dados, sem diferença audível |

## 10. Por fazer

- 19 asas ainda no formato antigo — falta o tratamento completo
- Traduzir para es/fr/de o texto trazido do fabricante nessas asas
- Confirmar a gama de vento da Mullet 2, lida de uma imagem a olho
- **Confirmar com a Flow** os tamanhos da Panorama e as faixas de peso da
  Future Power. As páginas descrevem as 1.ªs versões; a lista de preços de
  2026 tem a Panorama 2 e a Future Power 2. O aviso ao cliente já não pede
  a confirmação a ti — pede-lhe a ele que fale connosco antes de encomendar
- Cinco modelos sem página no site do fabricante: Cosmos 2, Mystic +,
  Spectra 3, Vortex, Protégé
