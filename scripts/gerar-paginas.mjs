/**
 * Gerador de páginas das asas — Happy Soaring
 * ===========================================
 *
 * Escreve uma página HTML por asa e por idioma, a partir do mesmo JSON que o
 * site já usa. Corre na publicação; não há servidor nem base de dados.
 *
 * PORQUE NAO REAPROVEITO O RENDERIZADOR DO SITE
 *   O app.js constrói uma INTERFACE — painéis, botões, faixas. Uma página que
 *   se quer encontrada precisa de ser um DOCUMENTO: títulos encadeados,
 *   parágrafos, uma tabela de especificações. São dois meios diferentes com
 *   necessidades diferentes, e forçar um a servir o outro dava pior nos dois.
 *
 * O QUE CADA PAGINA LEVA
 *   título e descrição próprios, canonical, hreflang para as outras quatro
 *   versões, Open Graph com a FOTO DA ASA (hoje todas as partilhas mostram a
 *   mesma imagem), e JSON-LD Product ligado à Organization do site.
 *
 * O QUE NAO LEVA, DE PROPOSITO
 *   offers. Não há preços no site, e um Product com preços inventados é
 *   exactamente o que nos mandaram não fazer.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';   /* o resumo de cada página, para o lastmod */
import { ofertasDaAsa } from '../regras/avisos.js';
import { rotuloFamilia, rotuloClasse } from '../regras/taxonomia.js';
import { KN_PARA_KMH, PAISES_NOS, CHAVE_UNIDADE } from '../regras/unidades.js';
import { P2W } from './conteudo-pilot2wing.mjs';
import { QP } from './conteudo-o-que-e-um-parakite.mjs';
import { MU } from './conteudo-musica.mjs';
import { FL } from './conteudo-flow.mjs';
import { IN } from './conteudo-inicial.mjs';
import { PK } from './conteudo-parakite.mjs';
import { entradasDoMenu, ROTAS, comIdioma } from '../regras/navegacao.js';
import { comQualificadores, protegeNomes, tiraPontosDosTitulos } from '../regras/textos.js';
import { CURSO, PRECOS } from './conteudo-curso-parakite.mjs';
import { folhaDoTema } from '../regras/tema.js';

const RAIZ = process.cwd();   /* corre-se a partir da raiz do projecto */
const DOMINIO = 'https://happysoaring.com';
const IDIOMAS = ['pt', 'en', 'es', 'fr', 'de'];
const OMISSAO = 'pt';

/* ---- a Happy Soaring é uma só -----------------------------------------
   O index.html declara a Organization com @id próprio, igual nas cinco
   línguas. Quem precisar dela nas páginas geradas REFERENCIA esse @id em
   vez de a declarar outra vez.

   Estava a ser declarada inline em dois sítios — no `author.worksFor` do
   Pilot2Wing e no `publisher` do hub da Flow. Para um motor de busca isso
   são três Happy Soaring diferentes, nenhuma ligada às outras, e é o
   oposto do que os dados estruturados servem para fazer: dizer que a
   entidade é a mesma esteja onde estiver. */
const ORGANIZACAO = { '@id': DOMINIO + '/#organizacao' };

/* ---- ...e por isso passou a ir declarada em todas ---------------------
   10/09/2026. A referencia acima resolveu o problema certo — tres Happy
   Soaring diferentes — mas deixou outro: 24 paginas geradas apontavam para
   um `@id` que nao estava declarado no grafo delas. Referenciar um no que
   ninguem declara ali nao diz nada a quem le so aquela pagina, e um
   rastreador de IA que leia uma ficha de asa sem ter lido a inicial nao
   fica a saber quem a publica.

   O `@id` continua a ser um so, que e o que faz a entidade ser a mesma
   esteja onde estiver. O que muda e que o no vai declarado, e declarado
   IGUAL: estas constantes sao copia exacta do que o index.html serve,
   incluindo a descricao em portugues nas cinco linguas — o index.html
   tambem a serve assim nas cinco, e um no com o mesmo `@id` e propriedades
   diferentes por lingua era voltar ao problema de origem.

   Se o index.html mudar a Organization, isto muda com ele. */
const ORG_NO = {
  '@type': 'Organization',
  '@id': DOMINIO + '/#organizacao',
  name: 'Happy Soaring',
  url: DOMINIO + '/',
  logo: {
    '@type': 'ImageObject',
    url: DOMINIO + '/images/marca/happy-soaring-logo-512.png',
    width: 512, height: 512, caption: 'Happy Soaring'
  },
  description: 'Revendedor oficial Flow Paragliders em Portugal, com formação através da escola parceira FelloFly.',
  /* 11/09/2026 · O SAMEAS LIGA AS TRES IDENTIDADES QUE ANDAVAM SOLTAS
     Medida a SERP de `flow mullet 2` na Alemanha, a Happy Soaring aparece
     tres vezes e o Google nao sabe que sao a mesma coisa:

       #4   um video no Facebook do Paulo
       #15  esta pagina, a do site
       #20  um reel do Instagram pessoal

     O video pessoal esta ONZE lugares acima da pagina do proprio produto. O
     `sameAs` e a etiqueta que diz "esta conta E esta entidade" — sem ela, a
     autoridade de uma nao chega a outra.

     SO ENTRA A CONTA DA EMPRESA, e isso e deliberado. As contas pessoais
     `paulo.reggae` ficam de fora: declarar uma conta pessoal como `sameAs`
     da Organizacao e afirmar "este Instagram E a Happy Soaring", e nao e
     verdade. O modelo correcto para essas e um `Person` ligado por
     `founder` — e essa decisao ainda nao foi tomada.

     E O SAMEAS AQUI DESAMBIGUA, NAO SO DECLARA
     Ha dois canais de YouTube com nome confundivel, e foi verificado a
     11/09 qual e qual:

       @HappySoaringPortugal  UCKcceKOInEt7dw6SDBgrwlw  "Happy Soaring"
                              "Parakite & Paragliding in Portugal..."
       @happysoaring          UCCGdaV_S320U0F68EgWgrsA  "Happysoaring"
                              descricao vazia — NAO e nosso

     Sem esta etiqueta, quem tem de decidir qual dos dois e a Happy Soaring
     e o Google, por conta propria. Com ela, decidimos nos. */
  sameAs: [
    'https://www.instagram.com/happysoaring/',
    'https://www.youtube.com/@HappySoaringPortugal'
  ],
  /* 10/09/2026. O contacto entra na entidade e nao so no rodape: assim o
     Google e os motores de resposta leem-no sem terem de o extrair de prosa.
     O telefone e o mesmo numero do WhatsApp — e um canal, dois protocolos. */
  email: 'paulo.pereira@happysoaring.com',
  telephone: '+351927187912',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'paulo.pereira@happysoaring.com',
    telephone: '+351927187912',
    areaServed: 'PT',
    availableLanguage: IDIOMAS
  },
  areaServed: { '@type': 'Country', name: 'Portugal' },
  knowsLanguage: IDIOMAS
};
const SITE_NO = {
  '@type': 'WebSite',
  '@id': DOMINIO + '/#site',
  url: DOMINIO + '/',
  name: 'Happy Soaring',
  publisher: ORGANIZACAO,
  inLanguage: IDIOMAS
};
/* Os dois entram em todo o grafo gerado. Espalhados por sete sitios ficava
   sempre um por esquecer; assim ha um sitio so. */
const comEntidade = (nos) => [ORG_NO, SITE_NO, ...nos];

/* datas reais de publicação dos vídeos do YouTube (ver o VideoObject dos spots) */
const VIDEOS_YOUTUBE = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts/dados/videos-youtube.json'), 'utf8'));

/* ---- as FAQ, agora tambem em dados estruturados ----------------------
   10/09/2026. Estava aqui, e por escrito, que nao havia FAQPage «mesmo
   havendo FAQ: foi decisao do Paulo». Passou a haver, e vale registar com
   que informacao a decisao mudou, porque nao mudou o que se pensava saber:

   Desde agosto de 2023 o Google so mostra o resultado rico de FAQ a sites
   de saude e de entidades governamentais reconhecidas. Para este site a
   marcacao NAO produz resultado rico nenhum — nesse ponto a decisao
   anterior estava certa e continua certa.

   O que mudou e o outro leitor. Pergunta e resposta ja emparelhadas sao o
   formato mais facil de levantar por um motor de resposta, e a FAQ deste
   site responde a perguntas que sao exactamente as que se fazem sobre a
   categoria. O ganho e de AI Search, nao de SERP.

   A marcacao le o MESMO conteudo que o HTML visivel, da mesma fonte: se as
   duas divergirem e porque alguem duplicou o texto, e ai o Google ignora a
   marcacao — e com razao. */
const semNegrito = (x) => String(x).replace(/\*\*(.+?)\*\*/g, '$1');

/* ---- a description das 110 fichas de asa -----------------------------
   10/09/2026. A description saia de «tagline OU descricao», cortada a 155.

   O «OU» nunca chegava ao segundo operando, porque as 22 asas tem todas
   tagline. E as taglines medem 18 a 71 caracteres: 106 das 110 fichas
   serviam uma description abaixo de 70 quando o Google mostra ~155. Tres
   quartos do espaco por usar, em todas as linguas.

   O texto nunca faltou. Cada asa tem `descricao` com 146 a 303 caracteres,
   escrita nas cinco linguas — nao estava a ser servida a ninguem. Isto nao
   escreve nada: compoe o que ja existe.

   FRASES INTEIRAS, e nao `slice`. O slice cortava a meio da palavra.
   Enche-se com frases completas ate 160; se o resultado ficar abaixo de 100
   e ainda houver texto, entra um pedaco da frase seguinte cortado numa
   fronteira de oracao — virgula, ponto e virgula, dois pontos ou travessao
   — que e a unica fronteira que existe nas cinco linguas sem ter de saber
   gramatica de nenhuma. Sem fronteira de oracao util, corta na palavra e
   deixa cair palavras de tres letras ou menos penduradas no fim.

   Medido nas 110: minimo 90, media 133, maximo 160. Nenhuma abaixo de 70,
   nenhuma acima de 160. */
const emFrases = (x) => String(x || '').trim()
  .split(/(?<=[.!?])\s+/).map(f => f.trim()).filter(Boolean);

function pedacoDe(frase, espaco, minimoUtil = 40) {
  let ped = frase.slice(0, espaco);
  const oracao = Math.max(ped.lastIndexOf(','), ped.lastIndexOf(';'),
                          ped.lastIndexOf(':'), ped.lastIndexOf(' — '));
  if (oracao >= minimoUtil) return ped.slice(0, oracao).replace(/[\s,;:—-]+$/, '');
  if (ped.includes(' ')) ped = ped.slice(0, ped.lastIndexOf(' '));
  ped = ped.replace(/[\s,;:—-]+$/, '');
  for (let i = 0; i < 2; i++) {
    const m = ped.match(/\s\S{1,3}$/);
    if (!m) break;
    ped = ped.slice(0, m.index).replace(/[\s,;:—-]+$/, '');
  }
  return ped;
}

/* Recebe partes de texto e nao um produto: as fichas de asa dao-lhe
   tagline + descricao, as paginas de spot dao-lhe o resumo. O problema era o
   mesmo nos dois lados e a resposta tambem — o que mudava era so a origem. */
function compoeDescricao(partes, lim = 160, minimo = 100) {
  const todas = partes.filter(Boolean).flatMap(emFrases);
  let saida = '';
  for (const f of todas) {
    const cand = (saida + ' ' + f).trim();
    if (cand.length <= lim) { saida = cand; continue; }
    if (saida.length < minimo) {
      const espaco = lim - saida.length - 2;   /* o espaco e a reticencia */
      if (espaco > 30) {
        const ped = pedacoDe(f, espaco);
        if (ped) saida = (saida + ' ' + ped + '…').trim();
      }
    }
    break;
  }
  return saida;
}

const descricaoDoProduto = (p, l) =>
  compoeDescricao([t(p.tagline, l), t(p.descricao, l)]);
const perguntas = (pares) => pares
  .filter(([q, r]) => q && r)
  .map(([q, r]) => ({
    '@type': 'Question',
    name: semNegrito(q),
    acceptedAnswer: { '@type': 'Answer', text: semNegrito(r) }
  }));

/* a categoria traduz-se — quem procura "parakite wings" clica mais depressa
   num endereço que diga wings. O nome do produto não: a Mullet 2 é Mullet 2 */
const SEGMENTO = { pt: 'asas', en: 'wings', es: 'alas', fr: 'ailes', de: 'schirme' };

const T = {
  /* o botão tem dois nomes porque tem dois estados. Vão os dois no HTML:
     a menu.js troca entre eles e não guarda texto nenhum. */
  navAbrir:  { pt:'Abrir menu', en:'Open menu', es:'Abrir menú',
               fr:'Ouvrir le menu', de:'Menü öffnen' },
  navFechar: { pt:'Fechar menu', en:'Close menu', es:'Cerrar menú',
               fr:'Fermer le menu', de:'Menü schließen' },
  navGlobal: { pt:'Navegação principal', en:'Main navigation',
               es:'Navegación principal', fr:'Navigation principale',
               de:'Hauptnavigation' },
  tamanhos:  { pt:'Tamanhos', en:'Sizes', es:'Tallas', fr:'Tailles', de:'Größen' },
  cores:     { pt:'Cores disponíveis', en:'Available colours', es:'Colores disponibles',
               fr:'Couleurs disponibles', de:'Verfügbare Farben' },
  specs:     { pt:'Especificações', en:'Specifications', es:'Especificaciones',
               fr:'Caractéristiques', de:'Technische Daten' },
  paraQuem:  { pt:'Para quem é', en:'Who it is for', es:'Para quién es',
               fr:'Pour qui', de:'Für wen' },
  fortes:    { pt:'Pontos fortes', en:'Strong points', es:'Puntos fuertes',
               fr:'Points forts', de:'Stärken' },
  pedir:     { pt:'Pedir preço no WhatsApp', en:'Ask for a price on WhatsApp',
               es:'Pedir precio por WhatsApp', fr:'Demander le prix sur WhatsApp',
               de:'Preis über WhatsApp anfragen' },
  voltar:    { pt:'Ver a gama completa', en:'See the whole range', es:'Ver toda la gama',
               fr:'Voir toute la gamme', de:'Die ganze Reihe ansehen' },
  dealer:    { pt:'Dealer oficial Flow Paragliders em Portugal',
               en:'Official Flow Paragliders dealer in Portugal',
               es:'Punto de venta oficial Flow Paragliders en Portugal',
               fr:'Revendeur officiel Flow Paragliders au Portugal',
               de:'Offizieller Flow-Paragliders-Händler in Portugal' },
  inicio:    { pt:'Início', en:'Home', es:'Inicio', fr:'Accueil', de:'Start' },
  migalhas:  { pt:'Onde estás', en:'Breadcrumb', es:'Dónde estás',
               fr:'Fil d’Ariane', de:'Brotkrumen' },
  /* Estas frases são copiadas à letra do dicionário do app.js. Se as
     reescrevesse por minhas palavras, a mesma pergunta apareceria de duas
     maneiras conforme a pessoa entrasse pelo palco ou pela página. */
  outras:    { pt:'Outras {f}', en:'Other {f}', es:'Otras {f}',
               fr:'Autres {f}', de:'Weitere {f}' },
  ate:       { pt:'até', en:'until', es:'hasta', fr:'jusqu’au', de:'bis' },
  pedirTit:  { pt:'Escolhe e pede preço', en:'Choose and ask for a price',
               es:'Elige y pide precio', fr:'Choisis et demande le prix',
               de:'Wählen und Preis anfragen' },
  corMedida: { pt:'Escolhe a tua cor', en:'Choose your colour', es:'Elige tu color',
               fr:'Choisis ta couleur', de:'Wähl deine Farbe' },
  corIndic:  { pt:'As cores no ecrã são indicativas. O tecido pode ser diferente do que vês — confirma connosco antes de encomendares.',
               en:'On-screen colours are indicative. The fabric may differ from what you see — check with us before ordering.',
               es:'Los colores en pantalla son indicativos. El tejido puede diferir de lo que ves — confírmalo con nosotros antes de pedir.',
               fr:'Les couleurs à l’écran sont indicatives. Le tissu peut différer de ce que tu vois — confirme avec nous avant de commander.',
               de:'Die Farben am Bildschirm sind Richtwerte. Der Stoff kann abweichen — kläre das vor der Bestellung mit uns ab.' },
  escolheTams:{ pt:'Que tamanhos queres?', en:'Which sizes?', es:'¿Qué tallas quieres?',
               fr:'Quelles tailles veux-tu ?', de:'Welche Größen möchtest du?' },
  pais:      { pt:'De que país és?', en:'Which country are you in?', es:'¿De qué país eres?',
               fr:'De quel pays es-tu ?', de:'Aus welchem Land kommst du?' },
  paisDica:  { pt:'Obrigatório — é o que me diz em que idioma te devo responder.',
               en:'Required — it tells me which language to reply in.',
               es:'Obligatorio: me dice en qué idioma debo responderte.',
               fr:'Obligatoire — cela me dit dans quelle langue te répondre.',
               de:'Pflichtfeld — daran sehe ich, in welcher Sprache ich antworten soll.' },
  enviarWa:  { pt:'Enviar no WhatsApp', en:'Send on WhatsApp', es:'Enviar por WhatsApp',
               fr:'Envoyer sur WhatsApp', de:'Über WhatsApp senden' },
  msgAbre:   { pt:'Olá! Queria pedir preço para a {n}.', en:'Hi! I would like a price for the {n}.',
               es:'¡Hola! Quería pedir precio para la {n}.', fr:'Bonjour ! Je voudrais le prix de la {n}.',
               de:'Hallo! Ich hätte gern den Preis der {n}.' },
  msgTam:    { pt:'Tamanho: {t}', en:'Size: {t}', es:'Talla: {t}', fr:'Taille : {t}', de:'Größe: {t}' },
  msgTams:   { pt:'Tamanhos: {t}', en:'Sizes: {t}', es:'Tallas: {t}', fr:'Tailles : {t}', de:'Größen: {t}' },
  msgCor:    { pt:'Cor: {c}', en:'Colour: {c}', es:'Color: {c}', fr:'Couleur : {c}', de:'Farbe: {c}' },
  msgPais:   { pt:'Estou em {p}.', en:'I am in {p}.', es:'Estoy en {p}.',
               fr:'Je suis en {p}.', de:'Ich bin in {p}.' },
  incluido:  { pt:'O que vem na caixa', en:'What’s in the box', es:'Qué incluye',
               fr:'Ce qui est inclus', de:'Lieferumfang' },
  video:     { pt:'Vídeo', en:'Video', es:'Vídeo', fr:'Vidéo', de:'Video' },
  verNoYt:   { pt:'Ver no YouTube', en:'Watch on YouTube', es:'Ver en YouTube',
               fr:'Voir sur YouTube', de:'Auf YouTube ansehen' },
  /* ---- a galeria dos spots ---- */
  fechar:    { pt:'Fechar', en:'Close', es:'Cerrar', fr:'Fermer', de:'Schliessen' },
  verVideo:  { pt:'Ver o vídeo', en:'Play the video', es:'Ver el vídeo',
               fr:'Voir la vidéo', de:'Video ansehen' },
  maisSpot:  { pt:'Saber mais sobre este spot', en:'More about this site',
               es:'Más sobre este spot', fr:'En savoir plus sur ce spot',
               de:'Mehr über diesen Spot' },
  anterior:  { pt:'Anterior', en:'Previous', es:'Anterior', fr:'Précédent', de:'Zurück' },
  seguinte:  { pt:'Seguinte', en:'Next', es:'Siguiente', fr:'Suivant', de:'Weiter' },
  vento:     { pt:'Gama de vento', en:'Wind range', es:'Rango de viento',
               fr:'Plage de vent', de:'Windbereich' },
  kn:        { pt:'nós', en:'kn', es:'nudos', fr:'nœuds', de:'kn' },
  kmh:       { pt:'km/h', en:'km/h', es:'km/h', fr:'km/h', de:'km/h' },
  idioma:    { pt:'Idioma', en:'Language', es:'Idioma', fr:'Langue', de:'Sprache' },
  historico: { pt:'Dados históricos', en:'Historical data', es:'Datos históricos',
               fr:'Données historiques', de:'Historische Daten' },
  qualVersao:{ pt:'Perguntar qual é a versão actual', en:'Ask which version is current',
               es:'Preguntar cuál es la versión actual', fr:'Demander quelle version est actuelle',
               de:'Nach der aktuellen Version fragen' },
  msgVersao: { pt:'Olá! Vi a página da {n} e queria saber qual é a versão actual.',
               en:'Hi! I saw the {n} page and would like to know which version is current.',
               es:'¡Hola! Vi la página de la {n} y quería saber cuál es la versión actual.',
               fr:'Bonjour ! J’ai vu la page de la {n} et je voudrais savoir quelle version est actuelle.',
               de:'Hallo! Ich habe die Seite der {n} gesehen und möchte wissen, welche Version aktuell ist.' },
  unidade:   { pt:'Unidade de velocidade', en:'Speed unit', es:'Unidad de velocidad',
               fr:'Unité de vitesse', de:'Geschwindigkeitseinheit' },
  msg:       { pt:'Olá! Queria pedir preço para a {n}.', en:'Hi! I would like a price for the {n}.',
               es:'¡Hola! Quería pedir precio para la {n}.', fr:'Bonjour ! Je voudrais le prix de la {n}.',
               de:'Hallo! Ich hätte gern den Preis der {n}.' }
};

const SPEC_ROT = {
  tamanho:{pt:'Tamanho',en:'Size',es:'Talla',fr:'Taille',de:'Größe'},
  areaPlana:{pt:'Área',en:'Area',es:'Área',fr:'Surface',de:'Fläche'},
  areaProjetada:{pt:'Área proj.',en:'Proj. area',es:'Área proy.',fr:'Surface proj.',de:'Proj. Fläche'},
  envergadura:{pt:'Envergadura',en:'Span',es:'Envergadura',fr:'Envergure',de:'Spannweite'},
  celulas:{pt:'Células',en:'Cells',es:'Celdas',fr:'Cellules',de:'Zellen'},
  alongamento:{pt:'Alongamento',en:'Aspect ratio',es:'Alargamiento',fr:'Allongement',de:'Streckung'},
  pesoAsa:{pt:'Peso',en:'Weight',es:'Peso',fr:'Poids',de:'Gewicht'},
  ptv:{pt:'PTV',en:'All-up weight',es:'PTV',fr:'PTV',de:'Startgewicht'},
  homologacao:{pt:'Homologação',en:'Certification',es:'Homologación',fr:'Homologation',de:'Zulassung'}
};

const t = (v, l) => (v && typeof v === 'object' ? (v[l] || v[OMISSAO] || '') : (v || ''));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chave = n => String(n).toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const caminho = (l, p) =>
  (l === OMISSAO ? '' : '/' + l) + '/' + SEGMENTO[l] + '/' + slug(p.nome) + '/';

/* ---- voltar à página inicial ------------------------------------------
   Cada língua tem a sua página inicial, com endereço próprio: / para
   português, /en/, /es/, /fr/ e /de/ para as outras. Quem está a ler uma asa
   em alemão volta a /de/ e continua em alemão — sem truques no fragmento,
   sem depender de JavaScript, e com um endereço que o Google pode indexar.

   Foi isto que substituiu o /#lang=de que aqui viveu pouco tempo: servia
   para o visitante, mas não criava página nenhuma para a pesquisa. */
const inicioHref = l => (l === OMISSAO ? '/' : '/' + l + '/');
const inicioSeccao = (l, id) => inicioHref(l) + '#' + id;

/* ---- as cinco versões de uma página -----------------------------------
   UMA ESTRUTURA, DUAS SAÍDAS.

   O gerador já sabia calcular o endereço de cada língua — era o que fazia
   para escrever os hreflang. Agora calcula-o uma vez e dá o mesmo conjunto
   às duas coisas que precisam dele: as etiquetas que o Google lê e o
   seletor que a pessoa carrega.

   A alternativa era o seletor ler os hreflang no browser. Seria a mesma
   fonte, mas obrigava a JavaScript um controlo que pode ser HTML, e ainda
   tinha a armadilha das SEIS etiquetas: o x-default não é uma língua.

   Isto importa porque as URLs não são um prefixo trocado —
   /asas/mullet-2/ é /en/wings/mullet-2/, com o segmento da categoria
   traduzido. Quem tivesse de refazer isso noutro sítio estava a duplicar a
   caminho() e o SEGMENTO. */
const alternativas = ondeFica => IDIOMAS.map(x => ({ lang: x, url: ondeFica(x) }));

/* O X-DEFAULT APONTA PARA O INGLES, E NAO PARA A LINGUA DA CASA
   ============================================================
   11/09/2026. Apontava para portugues, que e a escolha por omissao de quem
   escreve um site portugues — e estava errada para este negocio.

   O x-default nao e "a lingua principal". E o que o Google serve a quem NAO
   corresponde a nenhuma das cinco: um holandes, um polaco, um sueco, um
   checo. Com ele em portugues, essa pessoa era mandada para a unica lingua
   que quase de certeza nao le.

   95% DOS CLIENTES SAO ESTRANGEIROS, e a medicao de hoje diz o mesmo sobre
   o mercado: "curso parakite" da 5 400 resultados em portugues e 274 000 em
   ingles, e o topico do Reddit onde dois pilotos procuram um curso EM
   PORTUGAL esta escrito em ingles.

   O QUE ISTO NAO MUDA
   Nao muda nada para quem corresponde a uma das cinco: o alemao continua a
   receber /de/, porque a etiqueta `de` e que manda. O x-default so entra em
   cena quando nenhuma bate certo. E nao mexe nos URLs: as paginas
   portuguesas continuam na raiz, e migrar isso seria redireccionar 175
   enderecos por um ganho que o hreflang ja da.

   O OMISSAO continua a ser 'pt' — e a lingua em que o site se escreve e a
   que vive sem prefixo. Sao duas coisas diferentes, e era confundi-las que
   punha aqui o OMISSAO. */
const IDIOMA_SEM_CORRESPONDENCIA = 'en';

const etiquetasAlt = alts =>
  alts.map(a => '<link rel="alternate" hreflang="' + a.lang + '" href="' + DOMINIO + a.url + '" />')
    .concat('<link rel="alternate" hreflang="x-default" href="' +
      DOMINIO + alts.find(a => a.lang === IDIOMA_SEM_CORRESPONDENCIA).url + '" />').join('\n');

/* o nome de cada língua na própria língua: é o nome acessível de cada
   ligação. "FR" não diz nada a quem ouve a página; "Français" diz. */
const NOME_IDIOMA = {
  pt: 'Português', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch'
};

/* O seletor sai em HTML: cinco <a> a sério, separados por pontos. Funciona
   sem JavaScript — e como são ligações reais entre as versões, também
   valem como ligação interna do cluster de cada idioma.

   A língua actual não se distingue só pela cor. Leva aria-current para
   quem ouve, e um traço por baixo mais o peso para quem não distingue o
   laranja do branco. */
const seletorIdiomas = (alts, l) =>
  '<nav class="pg-idiomas" aria-label="' + esc(t(T.idioma, l)) + '">' +
  alts.map(a =>
    '<a href="' + esc(a.url) + '" lang="' + a.lang + '" hreflang="' + a.lang + '"' +
    (a.lang === l ? ' aria-current="page"' : '') +
    ' title="' + esc(NOME_IDIOMA[a.lang]) + '">' +
    '<span class="pg-idiomas-cod" aria-hidden="true">' + a.lang.toUpperCase() + '</span>' +
    '<span class="pg-so-leitor">' + esc(NOME_IDIOMA[a.lang]) + '</span></a>')
    .join('<i aria-hidden="true">·</i>') +
  '</nav>';

/* guardar a preferência é a única coisa que precisa de JavaScript aqui, e
   é acessória: sem ele as ligações continuam a levar a pessoa à página
   certa. A língua vem do atributo hreflang da própria ligação, para não
   haver uma segunda lista a dizer a mesma coisa.

   Guarda a preferência e mais nada. Estas páginas nunca encaminham
   ninguém: um endereço de produto é tão explícito como um de língua, e a
   preferência só serve para quem, mais tarde, entrar em /. */
const scriptIdiomas = () => `<script>
(function () {
  var n = document.querySelector('.pg-idiomas'); if (!n) return;
  n.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[hreflang]') : null;
    if (!a) return;
    try { localStorage.setItem('hs-idioma', a.getAttribute('hreflang')); } catch (err) {}
  });
})();
<\/script>`;

/* ---- a verificação que impede a divergência ---------------------------
   Compara, na página já escrita, os endereços que o Google vai ler com os
   endereços que a pessoa vai carregar. Saem os dois da mesma estrutura, e
   por isso isto nunca devia falhar — é exactamente por isso que vale a
   pena: se um dia falhar, é porque alguém partiu a origem única, e é
   melhor a publicação parar do que descobrir-se num browser. */
function confereAlternativas(html, ondeEstou) {
  const norm = u => (u.startsWith('http') ? u : DOMINIO + u);
  const doHead = [...html.matchAll(/<link rel="alternate" hreflang="(?!x-default)[a-z]{2}" href="([^"]+)"/g)]
    .map(m => m[1]).sort();
  const doSeletor = [...html.matchAll(/<a href="([^"]+)" lang="[a-z]{2}" hreflang="[a-z]{2}"/g)]
    .map(m => norm(m[1])).sort();
  if (doHead.length !== IDIOMAS.length)
    throw new Error(ondeEstou + ': esperava ' + IDIOMAS.length + ' hreflang, encontrei ' + doHead.length);
  if (doHead.join('|') !== doSeletor.join('|'))
    throw new Error('PARADO em ' + ondeEstou + ': o seletor e os hreflang não dizem o mesmo.\n' +
      '  hreflang: ' + doHead.join('\n            ') + '\n' +
      '  seletor:  ' + doSeletor.join('\n            '));
}

/* ---- a navegação principal, nas páginas geradas -----------------------
   AS 131 PAGINAS NAO TINHAM MENU NENHUM.
   O burger é construído pelo buildMenu() do app.js, que só corre na página
   inicial. Quem aterrava numa asa vinda de uma pesquisa só podia voltar à
   raiz ou mudar de língua.

   Aqui não se repete o burger: estas páginas são documentos e já têm um
   header. A navegação entra dentro dele, visível, em HTML servido — um
   clique a menos do que um botão que é preciso descobrir, e nada que
   dependa de JavaScript.

   A lista, os rótulos e os endereços saem de regras/navegacao.js, o mesmo
   módulo que o app.js usa. Não há segunda lista para manter. */
const MENU = (() => {
  try {
    const st = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/settings.json'), 'utf8'));
    return Array.isArray(st.menu) ? st.menu : [];
  } catch (e) { return []; }
})();

function menuGlobal(l, url) {
  if (!MENU.length) return '';
  const aqui = String(url || '').replace(DOMINIO, '');
  const itens = entradasDoMenu(MENU, l, { naInicial: false }).map(e => {
    const actual = e.href === aqui ? ' aria-current="page"' : '';
    const fora = e.tipo === 'externa' ? ' rel="noopener" target="_blank"' : '';
    return '<a class="ng-l" href="' + esc(e.href) + '"' + actual + fora + '>'
      + esc(e.rotulo) + '</a>';
  }).join('');
  /* O botão vem antes do <nav> no documento de propósito: pelo teclado,
     abrir e cair logo dentro do que se abriu é a ordem natural. A menu.css
     esconde-o enquanto a barra couber. */
  return '<button class="ng-btn" type="button" aria-expanded="false"'
    + ' aria-controls="ng-menu" aria-label="' + esc(t(T.navAbrir, l)) + '"'
    + ' data-abrir="' + esc(t(T.navAbrir, l)) + '"'
    + ' data-fechar="' + esc(t(T.navFechar, l)) + '">'
    + '<span class="ng-btn-r" aria-hidden="true"></span>'
    + '<span class="ng-btn-r" aria-hidden="true"></span>'
    + '<span class="ng-btn-r" aria-hidden="true"></span>'
    + '</button>'
    + '<nav class="ng" id="ng-menu" aria-label="' + esc(t(T.navGlobal, l)) + '">'
    + itens + '</nav>';
}

/* parágrafos e listas a partir do texto do CMS, com **negrito** */
function corpo(txt) {
  if (!txt) return '';
  return String(txt).split(/\n\s*\n/).filter(b => b.trim()).map(b => {
    const x = b.trim();
    const neg = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (x.startsWith('- ')) {
      const itens = x.split('\n').filter(l => l.trim().startsWith('- '))
        .map(l => '<li>' + neg(l.trim().slice(2)) + '</li>').join('');
      return '<ul>' + itens + '</ul>';
    }
    return '<p>' + neg(x) + '</p>';
  }).join('\n');
}

function tabelaSpecs(p, l) {
  const linhas = p.specs || [];
  if (!linhas.length) return '';
  const cols = Object.keys(SPEC_ROT).filter(k => linhas.some(s => s && s[k] != null && s[k] !== ''));
  if (!cols.length) return '';
  const th = cols.map(k => '<th scope="col">' + esc(t(SPEC_ROT[k], l)) + '</th>').join('');
  const tr = linhas.map(s =>
    '<tr>' + cols.map((k, i) => (i === 0 ? '<th scope="row">' : '<td>')
      + esc(s[k] == null ? '—' : comQualificadores(s[k], l))
      + (i === 0 ? '</th>' : '</td>')).join('') + '</tr>').join('\n');
  return '<div class="pg-tabela"><table><caption>' + esc(t(T.specs, l)) + ' — ' + esc(p.nome)
    + '</caption><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
}

function jsonld(p, l, url, foto) {
  const g = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicioHref(l) },
      { '@type': 'ListItem', position: 2, name: p.nome, item: url }
    ]},
    /* SEM `Product`, DE PROPÓSITO.
       Um Product sem preço (offers) nem avaliações é inválido para o Google:
       nunca dá resultado enriquecido e fica a dar erro no Search Console
       («Deve ser especificada a propriedade offers, review ou aggregateRating»).
       O site não mostra preços e inventá-los é exactamente o que não se deve
       fazer — por isso a asa não se marca como Product. O que ela é chega ao
       Google pelo próprio conteúdo da página.
       Lição do módulo de inteligência: dados-estruturados/product-sem-preco. */
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': comEntidade(g) },
    (k, v) => v === undefined ? undefined : v);
}

/* ---- a asa do curso ---------------------------------------------------
   Só na Mullet 2, e de propósito: é a asa com que o Curso de Parakite é
   dado. Pôr isto em todas as asas seria inventar uma relação que não
   existe — um arnês ou uma reserva não têm nada a ver com o método. */
const ASA_DO_CURSO = 'Mullet 2';
function blocoMetodo(p, l) {
  if (p.nome !== ASA_DO_CURSO) return '';
  return `<section class="pg-sec pg-metodo">
  <p class="pg-metodo-et">${esc(t(P2W.asaKicker, l))}</p>
  <p class="pg-metodo-tx">${esc(t(P2W.asaDoCurso, l))}</p>
  <p class="pg-metodo-ls">
    <a class="pg-metodo-a" href="${esc(caminhoCurso(l))}">${esc(t(P2W.verCurso, l))}</a>
    <a class="pg-metodo-a" href="${esc(caminhoP2W(l))}">${esc(t(P2W.conhecer, l))}</a>
  </p>
</section>`;
}

/* ---- outras asas da mesma família -------------------------------------
   As 110 páginas eram becos sem saída: só ligavam de volta à raiz, e mais
   nada. Quem lá chegasse — pessoa ou crawler — via uma asa e acabava.

   Sem ligações internas o Google não tem sinal nenhum sobre o que é
   importante, e um crawler que não execute JavaScript vê uma ilha. Estas
   ligações custam nada e ligam o que já existe. */
function blocoIrmas(p, l) {
  const irmas = produtos.filter(x => x.familia === p.familia && x !== p);
  if (!irmas.length) return '';
  const fam = rotuloFamilia(p.familia, l);
  return `<section class="pg-sec pg-irmas">
  <h2>${esc(t(T.outras, l).replace('{f}', fam.toLowerCase()))}</h2>
  <ul class="pg-irmas-l">${irmas.map(x => {
    const cls = rotuloClasse(x.classificacao, l);
    /* com a foto, como no catálogo: quem percorre a lista reconhece a forma
       da asa antes de ler o nome. A imagem de cartão já existe e é a mesma
       que o catálogo usa — nenhum ficheiro novo. */
    const cor = (x.cores || [])[0];
    const foto = cor ? `<img src="/images/asas/${chave(x.nome)}__${esc(cor)}-card.webp"
      alt="" loading="lazy" width="600" height="397" />` : '';
    return `<li><a href="${esc(caminho(l, x))}">${foto}<span class="pg-irmas-tx">
      <b>${esc(x.nome)}</b>${cls ? `<span>${esc(cls)}</span>` : ''}</span></a></li>`;
  }).join('')}</ul>
</section>`;
}

/* ---- corpo estático da página inicial ---------------------------------
   O PROBLEMA
     O index.html tinha <main id="app"></main> e mais nada. Um crawler
     recebia zero caracteres de texto. O Google acaba por executar o
     JavaScript e ver o site montado, mas os crawlers de IA — que são a
     aposta da Happy Soaring — na maioria não executam nada.

   O QUE ISTO RESOLVE, E O QUE NAO RESOLVE
     Resolve a ENTREGA: a identidade e o catálogo passam a estar no HTML.
     Não resolve a FALTA: a página inicial tem meia dúzia de frases, e
     escrevê-las é trabalho de quem sabe voar, não meu.

   PORQUE E SUBSTITUIDO PELO app.js
     É hidratação, não é conteúdo escondido: o mesmo material aparece a
     seguir montado pelo renderizador. Se um dia isto disser uma coisa e o
     site mostrar outra, passa a ser cloaking — por isso sai tudo do mesmo
     JSON que o site lê. */
function corpoInicial(l) {
  const porFamilia = new Map();
  for (const p of produtos) {
    if (!porFamilia.has(p.familia)) porFamilia.set(p.familia, []);
    porFamilia.get(p.familia).push(p);
  }

  const listas = [...porFamilia.entries()].map(([fam, asas]) =>
    `    <h3>${esc(rotuloFamilia(fam, l))}</h3>
    <ul>${asas.map(p => {
      const cls = rotuloClasse(p.classificacao, l);
      return `<li><a href="${esc(caminho(l, p))}">${esc(p.nome)}</a>${
        cls ? ' — ' + esc(cls) : ''}</li>`;
    }).join('')}</ul>`).join('\n');

  /* o h1 e o parágrafo saem do hero.json — os mesmos que o app.js desenha.
     Se saíssem daqui, o bloco estático e a página montada podiam divergir, e
     dizer uma coisa ao Google e outra a quem lê tem nome: cloaking. */
  const h1 = t(HERO.h1, l);
  const entrada = t(HERO.subtitle, l);

  /* as três áreas, tal como a secção do mapa as mostra */
  const areas = !MAPA ? '' : `
    <h2>${esc(t(MAPA.title, l))}</h2>
${(MAPA.cartoes || []).filter(c => c && c.visible !== false).map(c => `    <h3>${esc(t(c.titulo, l))}</h3>
    <p>${esc(t(c.texto, l))}</p>
    <ul>${(c.acessos || []).filter(a => a && a.visible !== false && t(a.label, l))
      .map(a => {
        const d = t(a.descricao, l);
        return `<li><a href="${esc(comIdioma(a.href, l))}">${esc(t(a.label, l))}</a>${
          d ? ' — ' + esc(d) : ''}</li>`;
      }).join('')}</ul>`).join('\n')}`;

  return `<div class="hs-estatico">
    <h1>${esc(h1)}</h1>
    <p>${esc(entrada)}</p>
${areas}

    <h2>${esc(t(FL.gamaTit, l))}</h2>
    <p>${esc(t(FL.gamaSub, l))}
    <a href="${esc(caminhoFlow(l))}">${esc(t(FL.ancoraLink, l))}</a></p>
${listas}
  </div>`;
}

/* ---- as cinco páginas iniciais ----------------------------------------
   O index.html é o molde E a página portuguesa. Para as outras quatro, o
   gerador lê-o, troca as etiquetas do <head> e o bloco estático, e escreve
   /en/index.html, /es/, /fr/, /de/.

   PORQUE E TROCA DE LINHA INTEIRA E NAO DE PALAVRA
     Uma troca de palavra solta acertaria também no JSON-LD, onde o url da
     Organization tem de continuar a ser o mesmo nas cinco — é uma empresa
     só, não cinco. Trocando a etiqueta inteira, o que não é etiqueta fica
     onde está.

   PORQUE FALHA EM VOZ ALTA
     Se o index.html deixar de bater certo com o conteudo-inicial.mjs, isto
     pára em vez de publicar quatro páginas com o texto do molde. O molde e
     a copy têm de dizer a mesma coisa em português, e é aqui que se verifica.  */
const MARCA_ABRE = '<!-- INICIO CONTEUDO ESTATICO (gerado) -->';
const MARCA_FECHA = '<!-- FIM CONTEUDO ESTATICO -->';

function trocaBloco(h, l) {
  const bloco = MARCA_ABRE + '\n' + corpoInicial(l) + '\n' + MARCA_FECHA;
  if (!h.includes(MARCA_ABRE) || !h.includes(MARCA_FECHA))
    throw new Error('index.html sem as marcas do conteúdo estático');
  return h.slice(0, h.indexOf(MARCA_ABRE)) + bloco +
    h.slice(h.indexOf(MARCA_FECHA) + MARCA_FECHA.length);
}

function paginaInicial(molde, l) {
  let h = molde;
  const trocar = (velho, novo) => {
    if (!h.includes(velho))
      throw new Error('index.html não tem a linha esperada:\n    ' + velho.slice(0, 110));
    h = h.split(velho).join(novo);
  };

  trocar('<html lang="pt">', '<html lang="' + l + '">');

  const tit = esc(t(IN.titulo, l)), des = esc(t(IN.descricao, l));
  const cur = esc(t(IN.descricaoCurta, l)), alt = esc(t(IN.ogAlt, l));
  const url = DOMINIO + inicioHref(l);

  trocar('<title>' + esc(t(IN.titulo, OMISSAO)) + '</title>', '<title>' + tit + '</title>');
  trocar('<meta name="description" content="' + esc(t(IN.descricao, OMISSAO)) + '" />',
         '<meta name="description" content="' + des + '" />');
  trocar('<link rel="canonical" href="' + DOMINIO + '/" />',
         '<link rel="canonical" href="' + url + '" />');
  trocar('<meta property="og:locale" content="' + IN.ogLocale[OMISSAO] + '" />',
         '<meta property="og:locale" content="' + IN.ogLocale[l] + '" />');
  trocar('<meta property="og:url" content="' + DOMINIO + '/" />',
         '<meta property="og:url" content="' + url + '" />');
  trocar('<meta property="og:title" content="' + esc(t(IN.titulo, OMISSAO)) + '" />',
         '<meta property="og:title" content="' + tit + '" />');
  trocar('<meta property="og:description" content="' + esc(t(IN.descricao, OMISSAO)) + '" />',
         '<meta property="og:description" content="' + des + '" />');
  trocar('<meta property="og:image:alt" content="' + esc(t(IN.ogAlt, OMISSAO)) + '" />',
         '<meta property="og:image:alt" content="' + alt + '" />');
  trocar('<meta name="twitter:title" content="' + esc(t(IN.titulo, OMISSAO)) + '" />',
         '<meta name="twitter:title" content="' + tit + '" />');
  trocar('<meta name="twitter:description" content="' + esc(t(IN.descricaoCurta, OMISSAO)) + '" />',
         '<meta name="twitter:description" content="' + cur + '" />');

  return trocaBloco(h, l);
}

function escreveIniciais() {
  const f = path.join(RAIZ, 'index.html');
  const molde = fs.readFileSync(f, 'utf8');

  /* o português escreve-se no próprio index.html: só o bloco estático muda */
  escrevePagina(f, trocaBloco(molde, OMISSAO));

  for (const l of IDIOMAS) {
    if (l === OMISSAO) continue;
    const dir = path.join(RAIZ, l);
    fs.mkdirSync(dir, { recursive: true });
    escrevePagina(path.join(dir, 'index.html'), paginaInicial(molde, l));
  }

  const txt = corpoInicial(OMISSAO).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('  páginas iniciais: ' + IDIOMAS.length + ' (/ e ' +
    IDIOMAS.filter(x => x !== OMISSAO).map(x => '/' + x + '/').join(', ') + ')');
  console.log('  bloco estático: ' + txt.length + ' caracteres de texto, ' +
    produtos.length + ' ligações para as asas');
}

/* ---- selo de oferta ---------------------------------------------------
   Leva a data de fim consigo e apaga-se sozinho quando ela passar: é a única
   coisa nesta página que muda sem alguém publicar de novo. */
function blocoOferta(p, l) {
  const a = ofertasDaAsa(AVISOS, p)[0];
  if (!a) return '';
  const rot = t(a.etiqueta, l) || 'Oferta';
  const txt = t(a.texto, l);
  const fim = a.fim ? String(a.fim).slice(0, 10) : '';
  return `<p class="pg-oferta t-${esc(a.tipo || 'oferta')}"${fim ? ` data-fim="${esc(fim)}"` : ''}>
    <span class="pg-oferta-et">${esc(rot)}</span>${txt ? ' ' + esc(txt) : ''}${
      fim ? ` <span class="pg-oferta-fim">${esc(t(T.ate, l))} ${esc(dataCurta(fim, l))}</span>` : ''}</p>
${fim ? `<script>
(function(){
  var o = document.querySelector('.pg-oferta[data-fim]'); if (!o) return;
  var h = new Date(), d = h.getFullYear() + '-' +
    String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  if (d > o.dataset.fim) o.remove();
})();
<` + `/script>` : ''}`;
}

const dataCurta = (iso, l) => {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString(l, { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return iso; }
};

/* ---- escolher e pedir preço ------------------------------------------
   O PORQUE DE ISTO EXISTIR AQUI
     Enquanto a asa só se via dentro da página inicial, esta secção não fazia
     falta: quem chegava já tinha passado pelo palco. Agora quem vem do Google
     ou de um link partilhado aterra nesta página e nunca vê o palco. Se a
     página não deixar escolher a cor e o tamanho, essa pessoa vê uma versão
     pior do produto — e é justamente quem ainda não nos conhece.

   O QUE E COPIADO DO PALCO, DE PROPOSITO
     As mesmas perguntas, pela mesma ordem, com as mesmas palavras, e a
     mensagem de WhatsApp montada com as mesmas peças. A mensagem que chega
     ao Paulo tem de ser igual, venha de onde vier.

   REGRA DO PAIS
     Igual à do palco: sem país (e sem tamanho, quando a asa os tem) o <a>
     fica SEM href — não é clicável nem focável. Um botão morto que finge
     funcionar é pior do que um que se vê que ainda não está pronto. */
/* ---- produto com dados históricos --------------------------------------
   Uma asa cuja página descreve uma versão que já não é a que se vende. A
   página fica — tem texto verdadeiro, vídeo, especificações, e há gente a
   chegar-lhe pelo Google. O que sai é a possibilidade de pedir preço a
   partir dela.

   O aviso sozinho não chegava: dizia "confirma os tamanhos antes de
   encomendares" logo por cima de um seletor de tamanhos e de um botão de
   pedir preço. Quem lê depressa escolhe o 39 e envia. A página tem de
   tornar isso impossível, não desaconselhá-lo.

   A ligação ao WhatsApp não desaparece, muda de pergunta: em vez de pedir
   preço para esta, pergunta qual é a versão actual. */
const eHistorico = p => p.historico === true;

function blocoPedido(p, l, num) {
  const k = chave(p.nome);
  const esquemas = (p.cores || []).map(String);
  const tams = (p.tamanhos || []).map(x => comQualificadores(x, l));
  const custom = p.coresCustom ? TECIDOS : [];
  if (eHistorico(p)) return '';        /* ver eHistorico, mesmo ficheiro */
  if (!esquemas.length && !tams.length) return '';

  const notaCust = p.coresCustom ? t(NOTA_CUSTOM, l) : '';

  const std = esquemas.length ? `
    <h3>${esc(t(T.cores, l))}</h3>
    <div class="pg-esq" role="group" aria-label="${esc(t(T.cores, l))}">${esquemas.map((c, i) =>
      `<button type="button" class="pg-esq-b${i === 0 ? ' on' : ''}" data-esq="${esc(c)}">
        <img src="/images/asas/${k}__${esc(c)}-card.webp" alt="" loading="lazy" width="600" height="397" />
        <span>${esc(String(c).replace(/-/g, ' '))}</span></button>`).join('')}</div>` : '';

  const cust = custom.length ? `
    <h3>${esc(t(T.corMedida, l))}</h3>
    <div class="pg-cust" role="group" aria-label="${esc(t(T.corMedida, l))}">${custom.map(c =>
      `<button type="button" class="pg-cust-b" data-ref="${esc(c.ref)}" data-nome="${esc(c.nome)}"
        style="background:${esc(c.hex)}" title="${esc(c.nome)}" aria-label="${esc(c.nome)}"></button>`).join('')}</div>
    <p class="pg-cor-nome" aria-live="polite"></p>
    <p class="pg-nota">${esc(t(T.corIndic, l))}${notaCust ? ' ' + esc(notaCust) : ''}</p>` : '';

  const cxTams = tams.length ? `
    <h3>${esc(t(T.escolheTams, l))}</h3>
    <div class="pg-tsel" role="group" aria-label="${esc(t(T.escolheTams, l))}">${tams.map(x =>
      `<button type="button" class="pg-tsel-b" data-tam="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div>` : '';

  const dados = {
    k, esquemas, tams, wa: String(num).replace(/[^0-9]/g, ''), nome: p.nome,
    msg: {
      abre: t(T.msgAbre, l), tam: t(T.msgTam, l), tams: t(T.msgTams, l),
      cor: t(T.msgCor, l), pais: t(T.msgPais, l)
    }
  };

  return `<section class="pg-sec pg-pedir" id="pedir">
  <h2>${esc(t(T.pedirTit, l))}</h2>
  ${std}
  ${cust}
  ${cxTams}
  <div class="pg-pais">
    <label for="pg-pais-c">${esc(t(T.pais, l))}</label>
    <input id="pg-pais-c" type="text" autocomplete="country-name" required />
    <p class="pg-dica">${esc(t(T.paisDica, l))}</p>
  </div>
  <a class="pg-wa pg-enviar desativado" aria-disabled="true" rel="noopener"
     target="_blank">${esc(t(T.enviarWa, l))}</a>
  ${contactoAlt()}
</section>
<script type="application/json" id="pg-dados">${JSON.stringify(dados).replace(/</g, '\\u003c')}<` + `/script>
<script>
(function(){
  var no = document.getElementById('pg-dados'); if (!no) return;
  var D = JSON.parse(no.textContent);
  var foto = document.getElementById('pg-foto');
  var enviar = document.querySelector('.pg-enviar');
  var nomeCor = document.querySelector('.pg-cor-nome');
  var campo = document.getElementById('pg-pais-c');
  var esq = D.esquemas[0] || '', ref = null, corNome = null, sel = [];

  function url(){
    return ref ? '/images/asas-cores/' + D.k + '__' + esq + '__' + ref + '.webp'
               : '/images/asas/' + D.k + '__' + esq + '.webp';
  }
  function pinta(){
    if (foto) foto.src = url();
    if (nomeCor) nomeCor.textContent = corNome || '';
  }
  /* se faltar a imagem daquela combinação, mostra-se o esquema standard em
     vez do ícone de imagem partida */
  if (foto) foto.addEventListener('error', function(){
    var base = '/images/asas/' + D.k + '__' + esq + '.webp';
    if (foto.getAttribute('src') !== base) foto.src = base;
  });

  function marca(lista, alvo){
    [].forEach.call(lista, function(b){ b.classList.toggle('on', b === alvo); });
  }
  /* Clicar numa cor standard mostra ESSA cor, não a standard com a custom por
     cima: são duas escolhas diferentes e herdar uma na outra confunde. */
  var bEsq = document.querySelectorAll('.pg-esq-b');
  var bCust = document.querySelectorAll('.pg-cust-b');
  [].forEach.call(bEsq, function(b){
    b.addEventListener('click', function(){
      esq = b.dataset.esq; ref = null; corNome = null;
      marca(bEsq, b);
      [].forEach.call(bCust, function(o){ o.classList.remove('on'); });
      pinta(); refresca();
    });
  });
  [].forEach.call(bCust, function(b){
    b.addEventListener('click', function(){
      ref = b.dataset.ref; corNome = b.dataset.nome;
      marca(bCust, b); pinta(); refresca();
    });
  });
  /* vários tamanhos de uma vez: quem hesita entre dois pergunta pelos dois em
     vez de mandar duas mensagens */
  [].forEach.call(document.querySelectorAll('.pg-tsel-b'), function(b){
    b.addEventListener('click', function(){
      var i = sel.indexOf(b.dataset.tam);
      if (i >= 0) sel.splice(i, 1); else sel.push(b.dataset.tam);
      b.classList.toggle('on', i < 0);
      b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
      refresca();
    });
  });

  function refresca(){
    var pais = (campo.value || '').trim();
    var ok = pais.length >= 2 && (!D.tams.length || sel.length > 0);
    enviar.classList.toggle('desativado', !ok);
    enviar.setAttribute('aria-disabled', ok ? 'false' : 'true');
    if (!ok) { enviar.removeAttribute('href'); return; }
    var ordem = D.tams.filter(function(x){ return sel.indexOf(x) >= 0; });
    var linhas = [D.msg.abre.replace('{n}', D.nome)];
    if (ordem.length === 1) linhas.push(D.msg.tam.replace('{t}', ordem[0]));
    else if (ordem.length > 1) linhas.push(D.msg.tams.replace('{t}', ordem.join(', ')));
    var cor = corNome || (esq ? esq.replace(/-/g, ' ') : '');
    if (cor) linhas.push(D.msg.cor.replace('{c}', cor));
    linhas.push(D.msg.pais.replace('{p}', pais));
    enviar.href = 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(linhas.join('\\n'));
  }
  /* HERDA O QUE VEM DO SITE
     Quem esteve a experimentar cores no palco e carregou em Detalhes não pode
     aterrar aqui numa página em branco, a começar de novo. O fragmento traz
     o esquema, a cor à medida e os tamanhos. Só se aceita o que existe mesmo
     nesta asa — um fragmento escrito à mão não pode pôr a página a pedir uma
     cor que não há. */
  function herda(){
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return false;
    var q = {};
    h.split('&').forEach(function(par){
      var i = par.indexOf('=');
      if (i > 0) q[par.slice(0, i)] = decodeURIComponent(par.slice(i + 1));
    });
    var mexeu = false;

    if (q.esq && D.esquemas.indexOf(q.esq) >= 0) {
      var be = document.querySelector('.pg-esq-b[data-esq="' + q.esq + '"]');
      if (be) { esq = q.esq; marca(bEsq, be); mexeu = true; }
    }
    if (q.cor) {
      var bc = document.querySelector('.pg-cust-b[data-ref="' + q.cor + '"]');
      if (bc) { ref = q.cor; corNome = bc.dataset.nome; marca(bCust, bc); mexeu = true; }
    }
    if (q.tam) q.tam.split(',').forEach(function(x){
      var bt = document.querySelector('.pg-tsel-b[data-tam="' + x + '"]');
      if (bt && sel.indexOf(x) < 0) {
        sel.push(x); bt.classList.add('on'); bt.setAttribute('aria-pressed', 'true'); mexeu = true;
      }
    });
    if (mexeu) pinta();
    return mexeu;
  }
  function aplicaFragmento(rola){
    if (!herda()) return;
    if (!rola) return;
    /* 'nearest' e não 'start': se o bloco já se vê, não se mexe nada. Encostar
       o bloco ao topo escondia a foto da asa que a pessoa acabou de colorir —
       que é justamente o que ela veio ver. */
    var a = document.getElementById('pedir');
    if (a) a.scrollIntoView({ block: 'nearest' });
  }
  aplicaFragmento(true);
  /* voltar atrás no browser traz outro fragmento sem recarregar a página:
     sem isto, a pessoa via a escolha errada e não percebia porquê */
  window.addEventListener('hashchange', function(){ aplicaFragmento(false); });

  campo.addEventListener('input', refresca);
  campo.addEventListener('keydown', function(ev){
    if (ev.key === 'Enter' && enviar.hasAttribute('href')) enviar.click();
  });
  refresca();
})();
<` + `/script>`;
}

/* ---- o que vem na caixa ---------------------------------------------- */
function blocoIncluido(p, l) {
  const x = t(p.incluido, l);
  return x ? '<section class="pg-sec"><h2>' + esc(t(T.incluido, l)) + '</h2>' + corpo(x) + '</section>' : '';
}

/* ---- aviso ------------------------------------------------------------
   Vem do painel, onde já existia. É matéria de segurança — uma asa que
   avisa alguma coisa tem de avisar em todo o lado onde apareça, e não só
   no sítio de onde já ninguém entra. */
function blocoAviso(p, l) {
  const x = t(p.aviso, l);
  if (!x) return '';
  if (!eHistorico(p)) return '<p class="pg-aviso" role="note">' + esc(x) + '</p>';
  return '<div class="pg-aviso pg-aviso-hist" role="note">' +
    '<b>' + esc(t(T.historico, l)) + '</b> ' + esc(x) + '</div>';
}

/* ---- vídeo ------------------------------------------------------------
   Miniatura com uma LIGAÇÃO ao YouTube, não um <iframe>. Assim a página não
   arrasta o leitor do YouTube (e os cookies dele) para quem nem carrega no
   play, e continua a funcionar sem JavaScript. O guião abaixo, se correr,
   troca a miniatura pelo leitor ali mesmo — como no site. */
function blocoVideo(p, l) {
  const id = String(p.videoId || '').trim();
  if (!id) return '';
  const t0 = parseInt(p.videoStartAt, 10) > 0 ? '&start=' + parseInt(p.videoStartAt, 10) : '';
  const capa = p.videoThumbnail || ('https://img.youtube.com/vi/' + encodeURIComponent(id) + '/maxresdefault.jpg');
  return `<section class="pg-sec pg-largo"><h2>${esc(t(T.video, l))}</h2>
    <a class="pg-video" href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}"
       rel="noopener" target="_blank"
       data-id="${esc(id)}" data-extra="${esc(t0)}"
       aria-label="${esc(t(T.verNoYt, l) + ' — ' + p.nome)}">
      <img src="${esc(capa)}" alt="" loading="lazy" width="1280" height="720"
           onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg'" />
      <span class="pg-video-play" aria-hidden="true"></span>
    </a></section>
<script>
(function(){
  var a = document.querySelector('.pg-video'); if (!a) return;
  a.addEventListener('click', function(ev){
    ev.preventDefault();
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + a.dataset.id + '?autoplay=1&rel=0' + a.dataset.extra;
    f.title = ${JSON.stringify(String(p.nome))};
    f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    f.className = 'pg-video';
    a.replaceWith(f);
  });
})();
<\/script>`;
}

/* ---- gama de vento ----------------------------------------------------
   Os valores guardados são em nós, como o fabricante os publica.

   MOSTRA-SE UMA UNIDADE SÓ, e o visitante escolhe qual. Antes apareciam as
   duas em cada linha: enchia a coluna e obrigava a ler duas vezes para
   encontrar o número que interessa. Agora há um alternador, como no
   catálogo, e a escolha fica guardada de página para página.

   O HTML sai escrito em km/h — é a unidade dos países das cinco línguas do
   site e é o que um crawler lê. O script só troca depois, se o visitante
   vier de um país de nós ou se já tiver escolhido antes. Assim a página
   nunca aparece sem números, mesmo sem JavaScript.

   As barras são sempre calculadas em nós: mudar de unidade multiplica todos
   os valores pelo mesmo factor, por isso o desenho é o mesmo. Só mudam os
   números e a régua. */
function blocoVento(p, l) {
  const wr = p.windRange;
  if (!wr || !(wr.groups || []).length) return '';

  /* mesma escala do site, para os dois gráficos serem comparáveis */
  let maxKn = 0;
  wr.groups.forEach(g => (g.rows || []).forEach(r => { maxKn = Math.max(maxKn, +r.max || 0); }));
  maxKn = Math.ceil((maxKn + 2) / 5) * 5;
  if (!maxKn) return '';

  /* duas réguas prontas, uma escondida: de 5 em 5 nós, de 10 em 10 km/h.
     Trocar de unidade não pode reposicionar marcas à mão no browser. */
  const maxKmh = maxKn * KN_PARA_KMH;
  /* `escala` é o fim do trilho na unidade em causa; `passo` é de quanto em
     quanto se marca. Em km/h a última marca redonda cai antes do fim do
     trilho — daí a posição sair sempre de `escala` e não da última marca,
     e daí a classe de encosto só ir a quem está mesmo na ponta. */
  const regua = (passo, escala) => {
    const s = [];
    for (let v = 0; v <= escala + 0.001; v += passo) {
      const pos = (v / escala) * 100;
      const cls = pos <= 0.5 ? ' class="pg-vento-i"' : pos >= 99.5 ? ' class="pg-vento-f"' : '';
      s.push('<span' + cls + ' style="left:' + pos.toFixed(1) + '%">' + v + '</span>');
    }
    return s.join('');
  };
  const reguaKn  = regua(5, maxKn);
  const reguaKmh = regua(10, maxKmh);

  const grupos = wr.groups.map(g => {
    const rot = t(g.label, l);
    const linhas = (g.rows || []).map(r => {
      const min = +r.min, max = +r.max;
      const ini = (min / maxKn) * 100, fim = (max / maxKn) * 100;
      const kn = min + '–' + max;
      const kmh = Math.round(min * KN_PARA_KMH) + '–' + Math.round(max * KN_PARA_KMH);
      return `<tr>
        <th scope="row">${esc(r.tamanho)}</th>
        <td class="pg-vento-barra"><span class="pg-vento-trilho"><span class="pg-vento-b"
          style="left:${ini.toFixed(1)}%;width:${Math.max(0, fim - ini).toFixed(1)}%"></span></span></td>
        <td class="pg-vento-val" data-kn="${kn}" data-kmh="${kmh}">${kmh}</td>
      </tr>`;
    }).join('');
    /* O eixo e uma LINHA DA TABELA, nao um div por baixo: so assim as marcas
       caem na mesma coluna que as barras. Fora da tabela, a largura da coluna
       dos valores muda com o idioma e o eixo deixa de bater certo. */
    const eixo = `<tr class="pg-vento-eixo"><td></td><td class="pg-vento-marcas"><span
      class="pg-vento-reg" data-un="kmh">${reguaKmh}</span><span
      class="pg-vento-reg" data-un="kn" hidden>${reguaKn}</span></td><td
      class="pg-vento-un">${esc(t(T.kmh, l))}</td></tr>`;
    return `<div class="pg-vento-g">
      ${rot ? '<h3>' + esc(rot) + '</h3>' : ''}
      <table class="pg-vento-t"><tbody>${linhas}${eixo}</tbody></table>
    </div>`;
  }).join('');

  const nota = t(wr.note, l);
  return `<section class="pg-sec pg-largo pg-vento">
    <div class="pg-vento-cab">
      <h2>${esc(t(T.vento, l))}</h2>
      <div class="pg-un" role="group" aria-label="${esc(t(T.unidade, l))}">
        <button type="button" class="pg-un-b" data-un="kn" aria-pressed="false">${esc(t(T.kn, l))}</button>
        <button type="button" class="pg-un-b on" data-un="kmh" aria-pressed="true">${esc(t(T.kmh, l))}</button>
      </div>
    </div>
    ${grupos}
    ${nota ? '<p class="pg-nota">' + esc(nota) + '</p>' : ''}
  </section>
<script>
(function(){
  var sec = document.querySelector('.pg-vento'); if (!sec) return;
  var CHAVE = ${JSON.stringify(CHAVE_UNIDADE)};
  var DE_NOS = ${JSON.stringify(PAISES_NOS)};

  /* o país sai da língua do browser; sem região, fica km/h */
  function porOmissao() {
    try {
      var r = '', ls = navigator.languages || [navigator.language || ''];
      for (var i = 0; i < ls.length && !r; i++) r = (String(ls[i]).split('-')[1] || '');
      return DE_NOS.indexOf(r.toUpperCase()) >= 0 ? 'kn' : 'kmh';
    } catch (e) { return 'kmh'; }
  }

  function mostra(un) {
    var rotulo = sec.querySelector('.pg-un-b[data-un="' + un + '"]').textContent;
    sec.querySelectorAll('.pg-vento-val').forEach(function (c) {
      c.textContent = un === 'kn' ? c.getAttribute('data-kn') : c.getAttribute('data-kmh');
    });
    sec.querySelectorAll('.pg-vento-reg').forEach(function (r) {
      r.hidden = r.getAttribute('data-un') !== un;
    });
    sec.querySelectorAll('.pg-vento-un').forEach(function (u) { u.textContent = rotulo; });
    sec.querySelectorAll('.pg-un-b').forEach(function (b) {
      var on = b.getAttribute('data-un') === un;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  var guardada = null;
  try { guardada = localStorage.getItem(CHAVE); } catch (e) {}
  var un = (guardada === 'kn' || guardada === 'kmh') ? guardada : porOmissao();
  if (un !== 'kmh') mostra(un);   /* km/h já está escrito no HTML */

  sec.querySelectorAll('.pg-un-b').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-un');
      mostra(u);
      try { localStorage.setItem(CHAVE, u); } catch (e) {}
    });
  });
})();
<\/script>`;
}

/* ---- a página /flow-paragliders-portugal/ -----------------------------
   O centro da relação Happy Soaring ↔ Flow Paragliders ↔ Portugal. As 22
   páginas de produto ligam-lhe e ela liga-lhes de volta, sempre dentro da
   mesma língua — um cluster fechado por idioma, não um funil que despeja
   tudo na versão portuguesa.

   O slug é igual nas cinco: "Flow Paragliders" é um nome próprio e
   "Portugal" também. É a mesma regra que já se aplica aos nomes das asas —
   traduz-se a categoria, não o nome. */
const caminhoFlow = l => (l === OMISSAO ? '' : '/' + l) + '/flow-paragliders-portugal/';

/* ---- O MOLDE DE UMA PAGINA -------------------------------------------
   O <head>, o <header> e o <footer> eram os mesmos em quatro sitios: nas
   110 paginas de asa, na /flow-paragliders-portugal/, na /pilot2wing/ e na
   /parakite-portugal/. Quatro copias do mesmo cabecalho. A quinta pagina
   que se escrevesse fazia cinco, e a proxima alteracao ao topo passava a
   ter de ser feita cinco vezes — a quinta esquece-se sempre.

   Aqui esta uma vez. O que muda de pagina para pagina entra por parametro.

   SOBRE OS CAPRICHOS QUE ESTAO PRESERVADOS
   As quatro paginas nao eram byte a byte iguais nas partes que ninguem ve:
   tres tinham uma linha em branco a seguir ao <body> e a das asas nao; a
   das asas acabava com quebra de linha depois do </html> e as outras nao;
   tres escrevem o ponto do rodape como &middot; e a das asas escreve-o
   como o caracter ·. Nada disto se ve no ecra, e por isso e que sobreviveu.

   Esta preservado de proposito, nos parametros linhaEmBranco, fim e
   rodape, para que esta mudanca nao altere UM byte do HTML publicado —
   e o Paulo o possa comprovar comparando as somas de verificacao.
   Normalizar estes tres caprichos e uma limpeza para outro commit, onde a
   diferenca seja so essa e se possa ver ao que se esta a dizer que sim. */
/* ---- o contacto, no rodape de todas as paginas geradas ---------------
   10/09/2026. O site tinha 225 ligacoes de WhatsApp e zero de email ou
   telefone: quem nao usa WhatsApp, ou esta num computador de trabalho, nao
   tinha por onde. E um endereco de email em texto e tambem um facto que um
   motor de resposta consegue devolver a quem pergunta como contactar.

   Vai no rodape porque o rodape esta nas 160, e nao em algumas. */
const CONTACTO = { email: 'paulo.pereira@happysoaring.com',
                   tel: '+351927187912', telVis: '+351 927 187 912',
                   instagram: 'https://www.instagram.com/happysoaring/',
                   youtube: 'https://www.youtube.com/@HappySoaringPortugal' };
/* O `email_off` e a saida documentada do Cloudflare ao Email Address
   Obfuscation. Sem ele, o deploy de 10/09 trocou o endereco por
   `[email protected]` com um descodificador em JavaScript: o link morria sem
   JS e o endereco deixava de estar no HTML como texto — que era metade da
   razao de o por aqui. O JSON-LD passou intacto; so o link visivel foi
   atingido. Os comentarios ficam inofensivos se a opcao for desligada. */
/* ---- o segundo canal, ao lado de cada botao de WhatsApp -------------
   10/09/2026. O contacto tinha entrado no rodape e na Organization, mas nao
   onde a decisao se toma: quem chega ao botao de WhatsApp e nao usa WhatsApp
   — ou esta num computador de trabalho — ficava sem alternativa no ponto
   exacto em que ia contactar.

   Sem rotulo de propria: um endereco de email e um numero de telefone dizem
   o que sao em qualquer uma das cinco linguas, e um "ou" traduzido nao
   acrescenta nada que a leitura nao de.

   Vai nos cinco pontos de conversao das paginas, e nao nos sete sitios com
   destino WhatsApp: os `pk-cta` sao cartoes de percurso, e um contacto
   dentro de um cartao nao e uma alternativa, e ruido. */
const contactoAlt = (esq) =>
  '<p class="pg-alt' + (esq ? ' pg-alt-esq' : '') + '">'
  + '<!--email_off-->'
  + '<a href="mailto:' + CONTACTO.email + '">' + CONTACTO.email + '</a>'
  + '<!--email_on-->'
  + '<a href="tel:' + CONTACTO.tel + '">' + CONTACTO.telVis + '</a>'
  + '</p>';

/* O INSTAGRAM ENTRA AO LADO DO EMAIL E DO TELEFONE
   Nao e decoracao: e o terceiro canal, e o unico dos tres onde ha
   fotografias e video. Quem chega a uma ficha de asa e quer ver a asa a
   voar tem ali onde ir.

   `rel="me"` e o par visivel do `sameAs` do schema: diz a mesma coisa em
   HTML. Nao leva `nofollow` — a ligacao e nossa para uma conta nossa, e
   nao ha nada a desautorizar. */
const rodapeContacto = () =>
  '<span class="pg-rodape-c">'
  + '<!--email_off-->'
  + '<a href="mailto:' + CONTACTO.email + '">' + CONTACTO.email + '</a>'
  + '<!--email_on-->'
  + '<a href="tel:' + CONTACTO.tel + '">' + CONTACTO.telVis + '</a>'
  + '<a href="' + CONTACTO.instagram + '" rel="me noopener"'
  + ' target="_blank">Instagram</a>'
  + '<a href="' + CONTACTO.youtube + '" rel="me noopener"'
  + ' target="_blank">YouTube</a>'
  + '</span>';

function moldeDaPagina(o) {
  const lg = o.lingua;
  const ogLocale = o.ogLocale
    ? '\n<meta property="og:locale" content="' + o.ogLocale + '" />' : '';
  const ogImagem = o.ogImagem
    ? '\n<meta property="og:image:width" content="' + o.ogImagem.largura + '" />'
    + '\n<meta property="og:image:height" content="' + o.ogImagem.altura + '" />'
    + '\n<meta property="og:image:alt" content="' + esc(o.ogImagem.alt) + '" />' : '';
  const branco = o.linhaEmBranco === false ? '' : '\n';

  return `<!DOCTYPE html>
<html lang="${lg}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" type="image/png" href="/images/marca/hs-simbolo-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/images/marca/hs-apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<title>${esc(o.titulo)}</title>
<meta name="description" content="${esc(o.descricao)}" />
<link rel="canonical" href="${o.url}" />
${o.alt}
<meta property="og:type" content="${o.ogTipo}" />
<meta property="og:site_name" content="Happy Soaring" />${ogLocale}
<meta property="og:url" content="${o.url}" />
<meta property="og:title" content="${esc(o.ogTitulo)}" />
<meta property="og:description" content="${esc(o.descricao)}" />
<meta property="og:image" content="${o.foto}" />${ogImagem}
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${o.ld}</script>
</head>
<body class="${o.classe}">${branco}
<header class="pg-topo">
  <a class="pg-marca" translate="no" href="${inicioHref(lg)}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, lg))}</span>
  ${menuGlobal(lg, o.url)}
  ${seletorIdiomas(o.alts, lg)}
</header>
${o.corpo}
<footer class="pg-rodape">${o.rodape}${rodapeContacto()}</footer>
${scriptIdiomas()}
</body>
</html>${o.fim || ''}`;
}

function paginaFlow(l, num) {
  const url = DOMINIO + caminhoFlow(l);
  const foto = DOMINIO + '/images/og-happysoaring.jpg';
  const alts = alternativas(x => caminhoFlow(x));
  const alt = etiquetasAlt(alts);
  const wa = 'https://wa.me/' + num + '?text=' + encodeURIComponent(t(FL.ctaMsg, l));
  const inicio = inicioHref(l);

  /* o catálogo sai dos mesmos dados que o site usa; agrupado pelas famílias
     que já existem, sem inventar categorias */
  const porFam = new Map();
  for (const p of produtos) {
    if (!porFam.has(p.familia)) porFam.set(p.familia, []);
    porFam.get(p.familia).push(p);
  }
  const catalogo = [...porFam.entries()].map(([fam, asas]) => `
    <div class="fl-fam">
      <h3>${esc(rotuloFamilia(fam, l))} <span>${asas.length} ${esc(t(FL.modelos, l))}</span></h3>
      <ul class="fl-lista">${asas.map(p => {
        const cls = rotuloClasse(p.classificacao, l);
        /* A MESMA RECEITA DO `pg-irmas`, E O MESMO FICHEIRO
           Quem percorre o catalogo reconhece a forma da asa antes de ler o
           nome. A imagem de cartao ja existe — e a que as fichas e o
           `pg-irmas` usam — por isso isto nao acrescenta um ficheiro nem um
           pedido novo a quem ja visitou uma ficha.

           TRES DAS 22 NAO TEM COR, E PORTANTO NAO TEM IMAGEM: o Vissta XC, a
           Aura 2 Square e a D-Chute. Nao ha ficheiro nenhum para elas, e
           inventar um placeholder era pior do que a falta. O `cor ?` deixa o
           cartao so com texto, que e exactamente o que o `pg-irmas` ja faz
           na ficha do Vissta — o comportamento e precedente, nao excepcao. */
        const cor = (p.cores || [])[0];
        const foto = cor ? `<img src="/images/asas/${chave(p.nome)}__${esc(cor)}-card.webp"
          alt="" loading="lazy" width="600" height="397" />` : '';
        return `<li><a href="${esc(caminho(l, p))}">${foto}<span class="fl-lista-tx">
          <b>${esc(p.nome)}</b>${cls ? `<span>${esc(cls)}</span>` : ''}</span></a></li>`;
      }).join('')}</ul>
    </div>`).join('');

  /* ItemList com as 22 asas: diz ao Google e ao Gemini que esta página é o
     centro de um conjunto real de produtos, cada um com endereço próprio.
     Sem offers, sem preços, sem stock — não existem. */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicioHref(l) },
        { '@type': 'ListItem', position: 2, name: 'Flow Paragliders Portugal', item: url }
      ]},
      { '@type': 'WebPage',
        '@id': url,
        url,
        name: t(FL.h1, l),
        description: t(FL.descricao, l),
        inLanguage: l,
        about: { '@type': 'Brand', name: 'Flow Paragliders' },
        publisher: ORGANIZACAO
      },
      { '@type': 'ItemList',
        name: t(FL.gamaTit, l),
        numberOfItems: produtos.length,
        itemListElement: produtos.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.nome, url: DOMINIO + caminho(l, p)
        }))
      }
    ])
  });

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg fl tema',
    titulo: t(FL.titulo, l),
    descricao: t(FL.descricao, l),
    ogTipo: 'website',
    ogTitulo: t(FL.h1, l),
    rodape: 'Happy Soaring &middot; ' + esc(t(T.dealer, l)),
    corpo: `
<div class="pg-cx fl-cx">

  <nav class="pg-migalhas"><a href="${inicio}">${esc(t(T.inicio, l))}</a> &rsaquo;
    <span aria-current="page">Flow Paragliders Portugal</span></nav>

  <header class="fl-cab">
    <div class="fl-cab-txt">
      <p class="pg-eyebrow">${esc(t(FL.kicker, l))}${
        /* A pagina diz "Parakite" nove vezes e nao explicava o que e.
           Mesma composicao das fichas de asa: o eyebrow leva a pergunta
           ao lado, e o `.pg-eyebrow a.pg-saibamais` ja trata da margem.
           Aqui nao ha condicao a cumprir — esta pagina e da gama toda,
           parakites incluidos, portanto a pergunta cabe sempre. */
        ''} <a class="pg-saibamais" href="${esc(caminhoQP(l))}">${
        esc(t(QP.ancoraOque, l))}</a></p>
      <h1>${esc(t(FL.h1, l))}</h1>
      <p class="fl-entrada">${esc(t(FL.entrada, l))}</p>
      <p><a class="pg-wa" href="${wa}" rel="noopener" target="_blank">${esc(t(FL.cta, l))}</a></p>
      ${contactoAlt(true)}
    </div>
    <div class="fl-cab-marca">
      <img src="/images/flow-marca.webp" alt="Flow Paragliders" width="900" height="179" />
      <span>${esc(t(FL.kicker, l))} &middot; Portugal</span>
    </div>
  </header>

  <section class="pg-sec fl-oficial">
    <h2>${esc(t(FL.dealerTit, l))}</h2>
    <p>${esc(t(FL.dealerTxt, l))}</p>
  </section>

  <section class="pg-sec fl-gama">
    <div class="fl-gama-cab">
      <h2>${esc(t(FL.gamaTit, l))}</h2>
      <p>${esc(t(FL.gamaSub, l))}</p>
    </div>
    <div class="fl-catalogo">${catalogo}</div>
  </section>

  <section class="fl-tres">
    <div class="fl-cartao">
      <h2>${esc(t(FL.escolhaTit, l))}</h2>
      <p>${esc(t(FL.escolhaTxt, l))}</p>
    </div>
    <div class="fl-cartao">
      <h2>${esc(t(FL.testeTit, l))}</h2>
      <p>${esc(t(FL.testeTxt, l))}</p>
    </div>
    <div class="fl-cartao">
      <h2>${esc(t(FL.apoioTit, l))}</h2>
      <p>${esc(t(FL.apoioTxt, l))}</p>
    </div>
  </section>

  <section class="fl-cor">
    <div class="fl-cor-txt">
      <p class="pg-eyebrow">${esc(t(FL.corTit, l))}</p>
      <p class="fl-cor-tx">${esc(t(FL.corTxt, l))}</p>
      <p><a class="fl-cor-a" href="${esc(caminho(l, { nome: 'Mullet 2' }))}">${esc(t(FL.verMullet, l))}</a>
        <a class="fl-cor-a" href="${esc(caminhoPK(l))}">${esc(t(PK.asaCta, l))}</a></p>
    </div>
    <img src="/images/asas/mullet2__maui.webp" alt="Mullet 2" width="1200" height="794" loading="lazy" />
  </section>

  <section class="fl-fecho">
    <p>${esc(t(FL.entrada, l))}</p>
    <a class="pg-wa" href="${wa}" rel="noopener" target="_blank">${esc(t(FL.cta, l))}</a>
    ${contactoAlt()}
  </section>

  <p class="pg-voltar"><a href="${inicio}">${esc(t(FL.voltar, l))}</a></p>

</div>
`,
  });
}

/* a ligação contextual das 22 páginas de produto para o hub, sempre na
   língua da própria página */
function blocoDealer(p, l) {
  return `<p class="pg-dealer-nota">${esc(t(FL.ancora, l))}
    <a href="${esc(caminhoFlow(l))}">${esc(t(FL.ancoraLink, l))}</a></p>`;
}

/* ---- a página /pilot2wing/ -------------------------------------------
   O Pilot2Wing é o método com que o Curso de Parakite é dado. Tem página
   própria e não uma secção dentro do curso por uma razão prática: é um
   termo ambíguo — há um projecto europeu com nome parecido — e para o
   reclamar é preciso uma página que SEJA sobre ele, com o nome no
   endereço, no título e no h1.

   O nome não se traduz, por isso o endereço é /pilot2wing/ em todos os
   idiomas, só com o prefixo de língua à frente. */
const caminhoP2W = l => (l === OMISSAO ? '' : '/' + l) + '/pilot2wing/';

/* a rota do curso vive aqui em cima, e nao ao lado da funcao que desenha a
   pagina: o /pilot2wing/ aponta para o curso, e o ciclo que o escreve corre
   antes. Uma const declarada depois disso e uma const que ainda nao existe. */
const caminhoCurso = l => ROTAS['/curso-parakite-portugal/'][l]
  || ROTAS['/curso-parakite-portugal/'][OMISSAO];

/* As rotas da pagina educativa vivem aqui em cima porque as fichas das asas
   ligam para ela e sao geradas antes: um `const` mais abaixo ficava na zona
   morta temporal e rebentava com "Cannot access before initialization". */
const caminhoQP = l => ROTAS['/o-que-e-um-parakite/'][l]
  || ROTAS['/o-que-e-um-parakite/'][OMISSAO];

function paginaPilot2Wing(l, num) {
  const url = DOMINIO + caminhoP2W(l);
  const foto = DOMINIO + '/images/og-happysoaring.jpg';
  const alts = alternativas(x => caminhoP2W(x));
  const alt = etiquetasAlt(alts);
  const wa = 'https://wa.me/' + num + '?text=' + encodeURIComponent(t(P2W.ctaMsg, l));
  const cad = P2W.cadeia[l] || P2W.cadeia[OMISSAO];
  const fases = P2W.fases[l] || P2W.fases[OMISSAO];
  const etapasCurso = P2W.cursoEtapas[l] || P2W.cursoEtapas[OMISSAO];
  const inicio = inicioHref(l);

  /* HowTo descreve exactamente o que isto é: um método por etapas. Sem
     duração nem custo — não os temos, e inventá-los é o que não se faz. */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicioHref(l) },
        { '@type': 'ListItem', position: 2, name: 'Pilot2Wing', item: url }
      ]},
      { '@type': 'HowTo',
        name: 'Pilot2Wing',
        description: t(P2W.descricao, l),
        url,
        inLanguage: l,
        author: { '@type': 'Person', name: P2W.autorNome, worksFor: ORGANIZACAO },
        step: P2W.etapas.map((e, i) => ({
          '@type': 'HowToStep', position: i + 1, name: t(e.nome, l), text: t(e.texto, l)
        }))
      }
    ])
  });

  const cartoes = P2W.etapas.map((e, i) => {
    const ultimo = i === 4, quarto = i === 3;
    /* 14/09/2026 · azul claro: cartões brancos sobre o chão claro; a quarta
       etapa pêssego e a quinta laranja, como antes, mas em claro */
    const fundo = ultimo ? 'background:#ffeee4;border:2px solid #ff6a13'
      : quarto ? 'background:#fff6ef;border:1px solid #f3c9a8'
      : 'background:#fff;border:1px solid #cbd8e5';
    /* OS NUMEROS TEM DE SE LER, E A RAZAO MUDOU DESDE QUE FORAM ESCRITOS
       Estavam a 1,57:1 (etapas 1-3), 2,24 (a quarta) e 2,02 (a quinta).
       Ficaram assim por se lhes chamar decoracao — e a isencao do WCAG
       para decoracao exige uma coisa que nunca tiveram: estar escondidos
       da tecnologia de apoio. Sem `aria-hidden`, um leitor de ecra
       anuncia "zero um" antes de cada etapa. Ou sao texto, ou sao enfeite;
       nao podem ser as duas coisas conforme convem.

       Sao texto: numeram as cinco etapas de um metodo que E sequencial.
       A 40px o minimo e 3:1 (texto grande), e cada variante subiu ate ao
       primeiro alfa que la chega contra o SEU cartao — que nao e o mesmo
       fundo nos tres casos:
         etapas 1-3  .15 -> .37   (3,03:1)
         etapa 4     .35 -> .49   (3,05:1)
         etapa 5     .50 -> .76   (3,02:1)
       O fantasma fica menos fantasma. E o preco de o numero querer dizer
       alguma coisa. */
    /* em claro (14/09/2026): #7d8ea3 3,35:1 no branco · #b86a33 3,85:1 no pêssego ·
       #a63f00 5,6:1 no laranja claro — todos acima dos 3:1 do texto grande */
    const numCor = ultimo ? '#a63f00' : quarto ? '#b86a33' : '#7d8ea3';
    return `<li class="sg-etapa" style="${fundo}">
      <span class="sg-etapa-n" style="color:${numCor}">0${i + 1}</span>
      <h3>${esc(t(e.nome, l))}</h3>
      <p>${esc(t(e.texto, l))}</p>
    </li>`;
  }).join('');

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg sg tema',
    titulo: t(P2W.titulo, l),
    descricao: t(P2W.descricao, l),
    ogTipo: 'article',
    ogTitulo: t(P2W.h1a, l) + ' ' + t(P2W.h1b, l),
    rodape: 'Happy Soaring &middot; ' + esc(t(T.dealer, l)),
    corpo: `
<main>

  <section class="sg-heroi">
    <div class="sg-heroi-txt">
      <p class="pg-eyebrow">${esc(t(P2W.kicker, l))}</p>
      <h1>${esc(t(P2W.h1a, l))}<br><span>${esc(t(P2W.h1b, l))}</span></h1>
      <p class="sg-tese">${esc(t(P2W.tese, l))}</p>
    </div>
    <div class="sg-heroi-fig">
      <video src="/images/smartground/movimento-left.webm" autoplay loop muted playsinline
        aria-label="${esc(t(P2W.legendaVideo, l))}" width="557" height="952"></video>
    </div>
  </section>

  <section class="sg-abordagens">
    <p class="pg-eyebrow">${esc(t(P2W.abordagens, l))}</p>
    <div class="sg-duas">
      <div class="sg-abord">
        <p class="sg-abord-et">${esc(t(P2W.convLabel, l))}</p>
        <p class="sg-abord-tx">${esc(t(P2W.convTexto, l))}</p>
      </div>
      <div class="sg-abord sg-abord-nossa">
        <p class="sg-abord-et">Pilot2Wing</p>
        <p class="sg-abord-tx">${esc(t(P2W.sgTexto, l))}</p>
      </div>
    </div>
  </section>

  <section class="sg-espinha">
    <div class="sg-espinha-cab">
      <div>
        <p class="pg-eyebrow">${esc(t(P2W.espinhaKicker, l))}</p>
        <h2>${esc(t(P2W.espinhaA, l))}<br>${esc(t(P2W.espinhaB, l))}</h2>
      </div>
      <div class="sg-espinha-dir">
        <p>${esc(t(P2W.espinhaSub, l))}</p>
        <p class="sg-cadeia">${cad.map((x, i) =>
          `<span${i === cad.length - 1 ? ' class="fim"' : ''}>${esc(x)}</span>`).join('<i>&rarr;</i>')}</p>
      </div>
    </div>

    <ol class="sg-etapas">
      <li class="sg-fase sg-fase-1"><span>${esc(fases[0])}</span></li>
      <li class="sg-fase sg-fase-2"><span>${esc(fases[1])}</span></li>
      <li class="sg-fase sg-fase-3"><span>${esc(fases[2])}</span></li>
      ${cartoes}
    </ol>

    <div class="sg-transicao">
      <span class="sg-trans-et">${esc(t(P2W.transAcaba, l))}</span>
      <i>&rarr;</i>
      <strong>${esc(t(P2W.curso, l))}</strong>
      <span class="sg-trans-lista">${etapasCurso.map(x => `<b>${esc(x)}</b>`).join('')}</span>
    </div>
  </section>

  <section class="sg-duplo">
    <div class="sg-perigo">
      <p class="pg-eyebrow">${esc(t(P2W.perigoKicker, l))}</p>
      <h2>${esc(t(P2W.perigoTitulo, l))}</h2>
      <p>${esc(t(P2W.perigoTexto, l))}</p>
    </div>
    <div class="sg-parapente">
      <h2>${esc(t(P2W.parapenteTitulo, l))}</h2>
      <p>${esc(t(P2W.parapenteTexto, l))}
      <a class="pg-saibamais" href="${esc(caminhoQP(l))}">${esc(t(QP.ancoraComo, l))}</a></p>
    </div>
  </section>

  <section class="sg-principio">
    <div>
      <p class="pg-eyebrow">${esc(t(P2W.principioKicker, l))}</p>
      <p class="sg-principio-tx">${esc(t(P2W.principio, l))}</p>
    </div>
    <div class="sg-autor">
      <p class="sg-autor-et">${esc(t(P2W.autorKicker, l))}</p>
      <p class="sg-autor-n">${esc(P2W.autorNome)}</p>
      <p>${esc(t(P2W.autorTexto, l))}</p>
    </div>
  </section>

  <section class="sg-asa">
    <div class="sg-asa-txt">
      <p class="pg-eyebrow">${esc(t(P2W.asaKicker, l))}</p>
      <h2>${esc(t(P2W.asaA, l))}<br>${esc(t(P2W.asaB, l))}</h2>
      <p>${esc(t(P2W.asaTexto, l))}</p>
      <p class="sg-acoes">
        <a class="sg-cta" href="${esc(caminhoCurso(l))}">${esc(t(P2W.verCurso, l))}</a>
        <a class="sg-cta-2" href="${caminho(l, { nome: 'Mullet 2' })}">${esc(t(P2W.verAsa, l))}</a>
        <a class="sg-cta-2" href="${caminhoPK(l)}">${esc(t(PK.asaCta, l))}</a>
      </p>
      ${contactoAlt(true)}
    </div>
    <img src="/images/asas/mullet2__maui.webp" alt="Mullet 2" width="1200" height="794" loading="lazy" />
  </section>

  <p class="pg-voltar"><a href="${inicio}">${esc(t(P2W.voltar, l))}</a></p>

</main>
`,
  });
}

/* ---- a página /parakite-portugal/ --------------------------------------
   O pilar. Não é o catálogo nem o método: é a página que responde «o que é
   isto em Portugal, e por onde começo».

   O nome não se traduz — é a mesma regra do /pilot2wing/ e do hub da Flow.
   O que muda por língua é só o prefixo.

   AS QUATRO SAÍDAS DO FIM
   Cada CTA tem UM destino. Os dois primeiros abrem WhatsApp, o terceiro
   desce à secção de onde se voa (que tem lá dentro o contacto) e o quarto
   vai à gama da Flow. Nenhum leva a uma página que ainda não existe: o
   curso, a página do «o que é» e a da gama entram na fase seguinte, e é aí
   que se acrescentam as ligações. */
const caminhoPK = l => (l === OMISSAO ? '' : '/' + l) + '/parakite-portugal/';

/* negrito em linha, sem embrulhar em <p> como o corpo() faz */
const forte = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

function paginaParakite(l, num) {
  const rel = caminhoPK(l);
  const url = DOMINIO + rel;
  const alts = alternativas(caminhoPK);
  const alt = etiquetasAlt(alts);
  const inicio = inicioHref(l);
  const foto = DOMINIO + '/images/og-parakite-portugal.jpg';
  const wa = m => 'https://wa.me/' + num + '?text=' + encodeURIComponent(t(m, l));

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(PK.migalha, l), item: url }
      ]},
      { /* WebPage e FAQPage ao mesmo tempo, no mesmo no: a pagina e uma
           coisa so, e um segundo no com outro `@id` seria uma FAQ que nao
           pertence a pagina nenhuma. */
        '@type': ['WebPage', 'FAQPage'],
        '@id': url,
        url,
        name: t(PK.h1, l),
        description: t(PK.descricao, l),
        inLanguage: l,
        mainEntity: perguntas(PK.faq.map(q => [t(q.p, l), t(q.r, l)])),
        isPartOf: { '@id': DOMINIO + '/#site' },
        publisher: ORGANIZACAO,
        author: { '@type': 'Person', name: P2W.autorNome, worksFor: ORGANIZACAO },
        primaryImageOfPage: { '@type': 'ImageObject', url: foto, width: 1200, height: 630 }
      }
    ])
  });

  /* 04 — os quatro percursos */
  const percursos = PK.percursos.map((c, i) => {
    const etapas = (c.etapas[l] || c.etapas[OMISSAO]).map((e, j) =>
      '<li' + (c.soon === j ? ' class="pk-soon"' : '') + '>' + esc(e) + '</li>').join('');
    return `<li class="pk-percurso">
      <p class="pk-percurso-et">${esc(t(c.rotulo, l))}</p>
      <h3>${esc(t(c.titulo, l))}</h3>
      <p class="pk-percurso-tx">${esc(t(c.texto, l))}</p>
      <ol class="pk-etapas">${etapas}</ol>
    </li>`;
  }).join('');

  /* 03 — os quatro eixos */
  const eixos = PK.eixos.map(e => `<li>
      <b>${esc(t(e.nome, l))}</b>
      <span>${esc(t(e.legenda, l))}</span>
    </li>`).join('');

  /* 08 — a cadeia do pós-venda */
  const cadeia = PK.cadeia.map(c =>
    '<li' + (c.oferta ? ' class="pk-oferta"' : '') + '>' + esc(t(c, l)) + '</li>').join('');
  const casas = PK.casas.map(c => `<div class="pk-casa">
      <h3>${esc(c.nome)}</h3>
      <p>${esc((c.servicos[l] || c.servicos[OMISSAO]).join(' · '))}</p>
    </div>`).join('');

  /* 10 — os nove pontos */
  const eco = PK.ecossistema.map(p => `<li${p.soon ? ' class="pk-soon-li"' : ''}>
      <b>${esc(t(p.t, l))}</b>
      <span>${esc(typeof p.s === 'string' ? p.s : t(p.s, l))}</span>
    </li>`).join('');

  /* 11 — o FAQ. O HTML e o `mainEntity` do FAQPage saem os dois de
     PK.faq: uma fonte, dois leitores. */
  const faq = PK.faq.map(q => `<div class="pk-faq-q">
      <h3>${esc(t(q.p, l))}</h3>
      <p>${forte(t(q.r, l))}</p>
    </div>`).join('');

  /* 12 — um destino por botão */
  const ctas = PK.ctas.map(c => {
    const href = c.ancora ? '#' + c.ancora
      : c.flow ? esc(caminhoFlow(l))
      : esc(wa(c.msg));
    const fora = (!c.ancora && !c.flow) ? ' rel="noopener" target="_blank"' : '';
    return `<a class="pk-cta" href="${href}"${fora}>
      <span class="pk-cta-et">${esc(t(c.et, l))}</span>
      <span class="pk-cta-tit">${esc(t(c.tit, l))}</span>
    </a>`;
  }).join('');

  /* as quatro fichas de produto, se existirem no catálogo */
  const quatro = produtos.filter(p => p.familia === 'Parakites');
  const asas = quatro.map(p =>
    `<a href="${esc(caminho(l, p))}">${esc(p.nome)}</a>`).join('');

  const incluido = PK.incluido.map(i => '<li>' + esc(t(i, l)) + '</li>').join('');
  const colunas = PK.s5Colunas.map(c => '<li>' + esc(t(c, l)) + '</li>').join('');
  const demoVars = PK.demoVars.map(v => '<li>' + esc(t(v, l)) + '</li>').join('');
  /* A GALERIA DOS SPOTS
     Cada peca e um sitio. A que tem fotografia mostra-a; a que nao tem fica
     caixa de texto, porque o nome do sitio conta na mesma. E a mesma grelha
     para as duas.

     O POPUP SAIU A 11/09/2026, E ESTA GRELHA FICOU
     O popup mostrava uma fotografia e um resumo — e o resumo era literalmente
     a abertura da pagina para onde ele proprio ligava. Cinco dos seis spots
     tinham UMA peca de media, por isso o carrossel tambem nao existia: as
     setas e as miniaturas estavam escondidas em cinco dos seis casos.

     A grelha nao saiu porque e ela que faz o trabalho — seis fotografias com
     nomes percorrem-se, seis linhas de texto leem-se. O que saiu foi a
     interceptacao do clique. Os mosaicos JA ERAM <a href> para as paginas;
     agora vao mesmo la. */
  const capaDe = m => {
    if (!m) return '';
    if (m.imagem) return m.imagem;
    /* Um Short e vertical, e a capa que o YouTube da por omissao
       (maxresdefault) e 16:9 — ficaria com tarjas num molde ao alto. O
       `oar2` e o fotograma vertical verdadeiro. Nao esta documentado, e por
       isso leva rede no onerror. E o CMS pode sempre por uma capa propria,
       que e o que faz sentido quando se quer escolher o fotograma. */
    if (m.videoId) return 'https://i.ytimg.com/vi/' + encodeURIComponent(m.videoId) + '/oar2.jpg';
    return '';
  };
  /* UMA GRELHA DE BOTÕES NÃO É UMA GRELHA DE LIGAÇÕES
     As páginas da Praia das Bicas e da Lagoa de Albufeira estiveram
     publicadas sem um único <a href> a apontar-lhes em todo o site: o
     endereço existia só dentro do JSON do popup, que é JavaScript. Chegavam
     ao Google pelo sitemap, e o Google executa JavaScript — mas uma ligação
     a sério vale muito mais do que um endereço encontrado num sitemap, e um
     sistema de IA que leia o HTML sem o executar não encontrava nada.

     Agora o mosaico de um spot com página é um <a> com o endereço lá dentro.
     O clique continua a abrir o popup — o JavaScript trava a navegação — mas
     o ctrl+clique abre a página noutro separador, como qualquer pessoa
     espera de uma ligação, e sem JavaScript o mosaico leva à página em vez
     de não fazer nada. O aria-haspopup diz a quem ouve que aquilo abre uma
     caixa e não muda de página. */
  const spots = SPOTS.map((s) => {
    const album = (s.album || []).filter(m => m && (m.imagem || m.videoId));
    const capa = capaDe(album[0]);
    const nome = esc(s.nome);
    const pagina = (s.publicar === true && s.id) ? esc(caminhoSpot(l, s)) : '';
    if (!capa) {
      /* sem álbum não há popup para abrir: se tem página, é ligação simples */
      const dentro = '<span>' + nome + '</span>';
      return '<li class="pk-spot pk-spot-so-nome">'
        + (pagina ? '<a class="pk-spot-so-link" href="' + pagina + '">' + dentro + '</a>' : dentro)
        + '</li>';
    }
    const alt = esc(t(album[0].alt, l));
    const rede = album[0].videoId && !album[0].imagem
      ? ' onerror="this.onerror=null;this.src=\'https://img.youtube.com/vi/'
        + encodeURIComponent(album[0].videoId) + '/maxresdefault.jpg\'"'
      : '';
    /* SEM POPUP, UM MOSAICO SEM PAGINA NAO E CLICAVEL
       Era um <button> que abria o album. Sem album para abrir, um botao que
       nao faz nada e pior do que uma imagem: promete e falha. Fica `div`.

       E o simbolo do play so aparece quando ha pagina, porque e la que o
       video toca. Num mosaico sem destino era uma promessa falsa. Hoje nao
       existe nenhum spot neste estado — mas o CMS pode criar um, e e para
       isso que a condicao esta escrita. */
    const etiqueta = pagina ? 'a' : 'div';
    const abre = pagina ? ' href="' + pagina + '"' : '';
    return `<li class="pk-spot"><${etiqueta}${abre} class="pk-spot-b">
        <img src="${esc(capa)}" alt="${alt}" loading="lazy" decoding="async"${rede} />
        ${(album[0].videoId && pagina) ? '<span class="pk-play" aria-hidden="true"><i></i></span>' : ''}
        <span class="pk-spot-n">${nome}</span>
      </${etiqueta}></li>`;
  }).join('');

  const palavras = PK.s9Palavras.map(p => '<li>' + esc(p) + '</li>').join('');

  const html = moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg pk tema',
    titulo: t(PK.titulo, l),
    descricao: t(PK.descricao, l),
    ogTipo: 'website',
    ogLocale: IN.ogLocale[l],
    ogTitulo: t(PK.h1, l),
    ogImagem: { largura: 1200, altura: 630, alt: t(PK.ogAlt, l) },
    rodape: esc(t(PK.rodape, l)),
    corpo: `
<main>

  <!-- AS MIGALHAS VIVEM DENTRO DO HEROI
       A foto comeca logo a seguir ao menu, como devia. Antes nao comecava:
       entre os dois havia uma faixa escura de 42px, que era esta linha de
       navegacao — "Inicio > Parakite em Portugal" — sentada no fundo da
       pagina em vez de estar sobre a foto.

       Poe-las aqui dentro resolve isso sem contas: a foto encosta ao menu,
       e a linha passa a ler-se por cima dela, no canto onde a mascara do
       heroi e opaca. Nao se perdem — sao o que diz ao visitante onde esta e
       o que diz ao Google a hierarquia do site. -->
  <section class="pk-heroi" id="topo">

    <!-- A FOTO EM TRES CAMADAS, COMO NA PAGINA INICIAL
         Era um background-image na seccao com uma mascara opaca por
         cima. Agora e o mesmo que a inicial faz: a fotografia num <img>
         que se pode filtrar, uma camada de cor por cima em
         mix-blend-mode:color, e o scrim no ::after da seccao.

         Nao e enfeite: e o que torna a mascara leve possivel. Dessaturar
         e tingir de azul achata a foto o suficiente para o texto branco
         se ler sobre ela sem ser preciso tapa-la. Com a foto em cor
         natural e a mesma mascara, o h1 media 1,31:1. -->
    <div class="pk-heroi-fundo" aria-hidden="true">
      <img src="/images/hero-bg.jpg" alt="" decoding="async" />
      <div class="pk-heroi-tinta"></div>
    </div>

    <nav class="pg-migalhas"><a href="${inicio}">${esc(t(T.inicio, l))}</a> &rsaquo;
      <span>${esc(t(PK.migalha, l))}</span></nav>

    <div class="pk-heroi-tx">
      <p class="pg-eyebrow">${esc(t(PK.kicker, l))}</p>
      <h1>${esc(t(PK.h1, l))}</h1>
      <p class="pk-citacao">${esc(t(PK.heroCitacao, l))}</p>
      <p class="pk-tese">${esc(t(PK.heroTese, l))}</p>
      <p class="pk-botoes">
        <a class="pk-b" href="#aprender">${esc(t(PK.heroCta1, l))}</a>
        <a class="pk-b pk-b2" href="#voar-em-portugal">${esc(t(PK.heroCta2, l))}</a>
      </p>
    </div>
    <img class="pk-heroi-piloto" src="/images/hero-pilot.webp" alt="" width="844" height="1500" />
  </section>

  <section class="pk-sec" id="o-que-e">
    <p class="pg-eyebrow">${esc(t(PK.s2Kicker, l))}</p>
    <h2>${esc(t(PK.s2H2, l))}</h2>
    <div class="pk-duas">
      <p class="pk-lead">${esc(t(PK.s2P1, l))}</p>
      <p>${forte(t(PK.s2P2, l))}
      <a class="pg-saibamais" href="${esc(caminhoQP(l))}">${esc(t(QP.ancoraOque, l))}</a></p>
    </div>
  </section>

  <section class="pk-energia" id="energia">
    <h2>${esc(t(PK.s3H2, l))}</h2>
    <ul class="pk-eixos">${eixos}</ul>
    <p class="pk-declaracao" lang="en">${esc(PK.s3Declaracao)}</p>
  </section>

  <section class="pk-sec" id="onde-estas">
    <p class="pg-eyebrow">${esc(t(PK.s4Kicker, l))}</p>
    <h2>${esc(t(PK.s4H2, l))}</h2>
    <p class="pk-lead">${esc(t(PK.s4Texto, l))}</p>
    <!-- <ul> e nao <ol>: sao quatro situacoes alternativas, nao quatro
         passos. Um <ol> promete uma ordem que nao existe, e essa promessa
         chega a quem le a pagina com um leitor de ecra. -->
    <ul class="pk-percursos">${percursos}</ul>
    <p class="pk-remate">${esc(t(PK.s4Remate, l))}</p>
  </section>

  <section class="pk-sec pk-papel" id="aprender">
    <p class="pg-eyebrow">${esc(t(PK.s5Kicker, l))}</p>
    <h2>${esc(t(PK.s5H2, l))}</h2>
    <p class="pk-lead">${forte(t(PK.s5Texto, l))}</p>
    <blockquote class="pk-cit">${esc(t(PK.s5Citacao, l))}</blockquote>
    <div class="pk-trio">
      <ul class="pk-tres">${colunas}</ul>
      <p class="pk-trio-tx">${esc(t(PK.s5Tamanhos, l))}</p>
    </div>
    <div class="pk-metodo">
      <p class="pk-metodo-et">${esc(t(PK.s5MetodoKicker, l))}</p>
      <p class="pk-metodo-tit" lang="en">Body first. Controls after.</p>
      <p class="pk-metodo-tx">${esc(t(PK.s5MetodoTxt, l))}</p>
      <p class="pk-botoes">
        <a class="pk-b" href="${esc(caminhoCurso(l))}">${esc(t(PK.s5CursoCta, l))}</a>
        <a class="pk-b2" href="${esc(caminhoP2W(l))}">${esc(t(PK.s5MetodoCta, l))}</a>
      </p>
    </div>
  </section>

  <!-- DEMO — a primeira das três.
       Guarda o "Já sabes voar?" como cabeçalho: e a pergunta que faz a
       ponte da seccao anterior para este grupo. O titulo do Demo fica
       em <h3> por baixo dela. -->
  <section class="pk-sec pk-tema" id="demo">
    <p class="pg-eyebrow">${esc(t(PK.s6Kicker, l))}</p>
    <h2>${esc(t(PK.s6H2, l))}</h2>
    <p class="pk-sub">${esc(t(PK.s6Sub, l))}</p>

    <div class="pk-demo">
      <p class="pk-et-laranja">${esc(t(PK.demoKicker, l))}</p>
      <h3>${esc(t(PK.demoTit, l))}</h3>
      <p>${forte(t(PK.demoTxt, l))}</p>
      <ul class="pk-vars">${demoVars}</ul>
      <p class="pk-nota">${esc(t(PK.demoNota, l))}</p>
    </div>
  </section>

  <!-- ALUGUER — secção própria.
       Era um cartão ao lado do Demo; passou a secção porque é outro
       assunto: um experimenta-se antes de escolher, o outro aluga-se
       o dia. Ter cada tema com o seu <h2> também dá a cada um um
       endereço e um título próprios para quem chega de uma pesquisa. -->
  <section class="pk-sec pk-tema" id="rental">
    <p class="pg-eyebrow">${esc(t(PK.rentalKicker, l))}
      <span class="pk-soon-selo">${esc(PK.rentalSoon)}</span></p>
    <h2 lang="en">${esc(PK.rentalTit)}</h2>
      <p>${esc(t(PK.rentalTxt, l))}</p>
      <p class="pk-nota">${esc(t(PK.rentalGestao, l))}</p>
      <ul class="pk-exemplo">
        <li><b>20</b><span>${esc(t(PK.rentalManha, l))}</span></li>
        <li class="pk-seta" lang="en"><i aria-hidden="true">&rarr;</i>${esc(PK.rentalVento)}<i aria-hidden="true">&rarr;</i></li>
        <li><b>17.5</b><span>${esc(t(PK.rentalTarde, l))}</span></li>
      </ul>
      <p class="pk-nota">${esc(t(PK.rentalLegenda, l))}</p>
  </section>

  <!-- ONDE SE VOA — a terceira. Guarda o id antigo porque o botão do
       hero aponta para #voar-em-portugal e não se parte um link que já
       está no ar por causa de uma arrumação interna. -->
  <section class="pk-sec pk-tema" id="voar-em-portugal">
    <h2>${esc(t(PK.spotsTit, l))}</h2>
    <div class="pk-spots-cab">
      <p class="pk-nota">${esc(t(PK.spotsNota, l))}</p>
      <p class="pk-spots-cta"><a class="pk-b" href="${esc(wa(PK.s6Msg))}" rel="noopener" target="_blank">${esc(t(PK.s6Cta, l))}</a></p>
      ${contactoAlt()}
    </div>
    <ul class="pk-spots-g">${spots}</ul>
  </section>

  <section class="pk-sec pk-papel" id="escolher">
    <p class="pg-eyebrow">${esc(t(PK.s7Kicker, l))}</p>
    <h2>${esc(t(PK.s7H2, l))}</h2>
    <div class="pk-dealer">
      <p class="pk-dealer-et" lang="en">${esc(t(PK.dealerEt, l))}</p>
      <p class="pk-dealer-nome">Flow Paragliders <span>Portugal</span></p>
      <ul class="pk-incluido">${incluido}</ul>
    </div>
    <div class="pk-cor">
      <p class="pk-et-laranja">Mullet 2</p>
      <h3 lang="en">${esc(PK.corTit)}</h3>
      <p>${esc(t(PK.corTxt, l))}</p>
    </div>
    <p class="pk-asas-et">${esc(t(PK.s7Asas, l))}</p>
    <p class="pk-asas">${asas}</p>
    <p><a class="pk-b" href="${esc(caminhoFlow(l))}">${esc(t(PK.s7Cta, l))}</a></p>
  </section>

  <section class="pk-sec" id="pos-venda">
    <p class="pg-eyebrow">${esc(t(PK.s8Kicker, l))}</p>
    <h2>${esc(t(PK.s8H2, l))}</h2>
    <ul class="pk-cadeia">${cadeia}</ul>
    <p class="pk-nota">${forte(t(PK.cadeiaLegenda, l))}</p>
    <div class="pk-casas">${casas}</div>
  </section>

  <section class="pk-resp" id="responsabilidade">
    <p class="pg-eyebrow">${esc(t(PK.s9Kicker, l))}</p>
    <h2>${esc(t(PK.s9H2, l))}</h2>
    <ul class="pk-palavras" lang="en">${palavras}</ul>
    <p class="pk-lead">${esc(t(PK.s9Texto, l))}</p>
    <blockquote class="pk-cit">${esc(t(PK.s9Citacao, l))}</blockquote>
  </section>

  <section class="pk-sec" id="ecossistema">
    <p class="pg-eyebrow">${esc(t(PK.s10Kicker, l))}</p>
    <h2>${esc(t(PK.s10H2, l))}</h2>
    <p class="pk-sub">${esc(t(PK.s10Sub, l))}</p>
    <p class="pk-lead">${esc(t(PK.s10Texto, l))}</p>
    <ul class="pk-eco">${eco}</ul>
    <p class="pk-remate">${esc(t(PK.s10Remate, l))}</p>
  </section>

  <section class="pk-sec pk-papel" id="faq">
    <p class="pg-eyebrow">${esc(t(PK.faqKicker, l))}</p>
    <h2>${esc(t(PK.faqKicker, l))}</h2>
    <div class="pk-faq">${faq}</div>
  </section>

  <section class="pk-sec" id="comecar">
    <h2 class="pk-h2-grande">${esc(t(PK.s12H2, l))}</h2>
    <div class="pk-ctas">${ctas}</div>
  </section>

  <p class="pg-voltar"><a href="${inicio}">${esc(t(PK.voltar, l))}</a></p>
</main>
`,
  });
  return html;
}

/* ---- a entrada contextual nas quatro páginas de Parakite --------------
   A mesma ideia do blocoMetodo(): só onde faz sentido. A porta é a família,
   e não o nome, porque são quatro asas e não uma. Um arnês ou uma reserva
   não têm nada a ver com isto. */
function blocoParakite(p, l) {
  if (p.familia !== 'Parakites') return '';
  return `<section class="pg-sec pg-metodo pg-pk">
  <p class="pg-metodo-et">${esc(t(PK.asaEt, l))}</p>
  <p class="pg-metodo-tx">${esc(t(PK.asaTxt, l))}</p>
  <p><a class="pg-metodo-a" href="${esc(caminhoPK(l))}">${esc(t(PK.asaCta, l))}</a></p>
</section>`;
}

function pagina(p, l, num) {
  const url = DOMINIO + caminho(l, p);
  const cor = (p.cores || [])[0];
  const foto = cor ? DOMINIO + '/images/asas/' + chave(p.nome) + '__' + cor + '.webp' : DOMINIO + '/images/og-happysoaring.jpg';
  /* SEM ` | Happy Soaring`. Saiu a 10/09/2026, e a razao e a mesma para as
     159 paginas onde estava: desde outubro de 2022 o Google mostra o nome do
     site ACIMA do titulo nos resultados, e tira-o do `WebSite` dos dados
     estruturados, do `og:site_name` ou do titulo da inicial — os tres estao
     servidos em todas as paginas. O sufixo era duplicacao, e era a parte que
     o corte aos ~60 caracteres levava primeiro: custava 15 caracteres e
     muitas vezes nao chegava a aparecer.

     A pergunta que o fez cair foi mais simples do que isso: porque e que a
     Happy Soaring tem de aparecer no titulo de uma asa que e da Flow? Nao
     tem. A pagina e de um revendedor, e isso diz-se no conteudo, no rodape e
     na Organization — nao nos 60 caracteres que decidem o clique.

     A inicial mantem o nome, porque la faz parte da frase e nao e sufixo. */
  const titulo = p.nome + ' — ' + (rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l)) +
    ' Flow Paragliders';
  const desc = descricaoDoProduto(p, l);

  const alts = alternativas(x => caminho(x, p));
  const alt = etiquetasAlt(alts);

  const secs = (p.seccoes || []).map(s => {
    const tt = t(s.titulo, l), tx = t(s.texto, l);
    const fich = (s.ficheiros || []).map(f =>
      '<li><a href="' + esc(f.url) + '" rel="noopener nofollow" target="_blank">'
      + esc(typeof f.nome === 'object' ? t(f.nome, l) : f.nome || f.url) + '</a></li>').join('');
    if (!tt && !tx && !fich) return '';
    return '<section class="pg-sec' + (tt ? '' : ' sem-titulo') + '">'
      + (tt ? '<h2>' + esc(tt) + '</h2>' : '') + corpo(tx)
      + (fich ? '<ul class="pg-fich">' + fich + '</ul>' : '') + '</section>';
  }).join('\n');

  const fortes = (p.pontosFortes || []).map(x => t(x, l)).filter(Boolean);
  const wa = 'https://wa.me/' + num + '?text=' + encodeURIComponent(t(T.msg, l).replace('{n}', p.nome));

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto,
    ld: jsonld(p, l, url, foto),
    classe: 'pg asa tema',
    titulo,
    descricao: desc,
    ogTipo: 'product',
    ogTitulo: p.nome + ' — Flow Paragliders',
    rodape: 'Happy Soaring · ' + esc(t(T.dealer, l)),
    linhaEmBranco: false,
    fim: '\n',
    corpo: `
<main class="pg-cx">
  <nav class="pg-migalhas" aria-label="breadcrumb">
    <a href="${inicioHref(l)}">${esc(t(T.inicio, l))}</a> ›
    <span>${esc(rotuloFamilia(p.familia, l))}</span> › <span aria-current="page">${esc(p.nome)}</span>
  </nav>

  <div class="pg-cab">
    <div class="pg-cab-txt">
      <p class="pg-eyebrow">${esc(rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l))}${
        /* Só nas asas que o catálogo classifica como Parakite. Medido a
           12/09/2026, dá quatro das vinte e duas:

             Mullet 2, MulletX    "Parakite"
             AlbatroXX            "Performance Parakite"
             Mohawk               "Parakite speed flying"

           O Mohawk ENTRA, e este comentário dizia o contrário: dizia que
           era "Speed flying" e ficava de fora. A classificação dele no
           catálogo tem "Parakite" no início, portanto o teste apanha-o.
           A D-Wing V2, essa, é "Parawing" e fica de fora — essa metade
           estava certa. As outras dezoito são parapentes (EN-A a EN-D),
           arneses, uma reserva e um paraquedas de arrasto. */
        /Parakite/.test(String(p.classificacao || ''))
          ? ` <a class="pg-saibamais" href="${esc(caminhoQP(l))}">${esc(t(QP.ancoraOque, l))}</a>`
          : ''}</p>
      <h1>${esc(p.nome)}</h1>
      ${t(p.tagline, l) ? '<p class="pg-tagline">' + esc(t(p.tagline, l)) + '</p>' : ''}
      ${blocoOferta(p, l)}
      ${eHistorico(p)
        ? `<a class="pg-wa" rel="noopener" target="_blank" href="https://wa.me/${num}?text=${
            encodeURIComponent(t(T.msgVersao, l).replace('{n}', p.nome))
          }">${esc(t(T.qualVersao, l))}</a>`
        : `<a class="pg-wa" href="#pedir">${esc(t(T.pedir, l))}</a>`}
    </div>
    ${cor ? `<img class="pg-foto" id="pg-foto" src="/images/asas/${chave(p.nome)}__${cor}.webp"
      alt="${esc(p.nome + ' — Flow Paragliders')}" width="1200" height="794" />` : ''}
  </div>

  ${blocoPedido(p, l, num)}

  <div class="pg-papel">
  ${t(p.descricao, l) ? '<section class="pg-sec sem-titulo">' + corpo(t(p.descricao, l)) + '</section>' : ''}

  ${t(p.paraQuem, l) ? `<section class="pg-sec"><h2>${esc(t(T.paraQuem, l))}</h2>${corpo(t(p.paraQuem, l))}</section>` : ''}

  ${fortes.length ? `<section class="pg-sec"><h2>${esc(t(T.fortes, l))}</h2><ul>${
    fortes.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></section>` : ''}

  ${blocoIncluido(p, l)}

  ${blocoAviso(p, l)}
  </div>

  ${blocoVideo(p, l)}

  ${blocoVento(p, l)}

  ${(p.specs || []).length ? `<section class="pg-sec pg-largo"><h2>${esc(t(T.specs, l))}</h2>
    ${tabelaSpecs(p, l)}</section>` : ''}

  <div class="pg-papel">
  ${t(p.descricaoLonga, l) ? '<section class="pg-sec sem-titulo">' + corpo(t(p.descricaoLonga, l)) + '</section>' : ''}

  ${secs}
  </div>

  ${blocoDealer(p, l)}

  ${blocoParakite(p, l)}

  ${blocoMetodo(p, l)}

  ${blocoIrmas(p, l)}

  <p class="pg-voltar"><a href="${esc(inicioSeccao(l, 'produtos'))}">${esc(t(T.voltar, l))}</a></p>
</main>
`,
  });
}

/* ---------------------------------------------------------------- */
/* Os avisos entram na página ESCRITOS, não buscados por JavaScript. O site
   está em upload directo — nada do CMS chega ao ar sem publicar — por isso
   uma oferta escrita aqui é tão fresca como o resto do site, e ainda por
   cima o Google vê-a e a partilha no WhatsApp mostra-a. */
const AVISOS = (() => {
  try {
    const st = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/settings.json'), 'utf8'));
    return (st.avisos || []).map(id => {
      try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/avisos/' + id + '.json'), 'utf8')); }
      catch (e) { return null; }
    }).filter(Boolean);
  } catch (e) { return []; }
})();

const TECIDOS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/cores/flow-tecidos.json'), 'utf8')).cores || []; }
  catch (e) { return []; }
})();

const NOTA_CUSTOM = (() => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/produtos.json'), 'utf8'));
    return (d.elements || []).filter(e => e.role === 'flow')[0].customColourNote || {};
  } catch (e) { return {}; }
})();

const doc = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/produtos.json'), 'utf8'));
const flow = doc.elements.find(e => e.role === 'flow');
const num = flow.whatsapp;
const produtos = (flow.produtos || []).filter(p => p && p.nome && p.visible !== false);

/* TODAS AS PAGINAS SAEM POR AQUI
   Nao e um embrulho por embrulhar. Havia oito chamadas a `fs.writeFileSync`
   espalhadas pelo ficheiro, e proteger sete era o mesmo que nao proteger
   nenhuma: bastava a oitava para quem traduz a pagina ler "FELIZ VOO" onde
   diz Happy Soaring. Um sitio so e a unica forma de a garantia valer.

   Os nomes das asas vem do catalogo, e nao de uma lista escrita a mao: sao
   22, mudam quando a Flow muda a gama, e uma segunda lista e uma lista que
   um dia diz outra coisa. "Freedom 2" traduzido da "Liberdade 2", que nao e
   nenhuma asa. */
const NOMES_ASAS = produtos.map(p => p.nome).filter(Boolean);

/* OS SPOTS SAIRAM DO .mjs PARA O CMS
   Viviam no conteudo-parakite.mjs, que e JavaScript e que a pasta scripts/
   nem sequer publica. O CMS so le JSON dentro de content/ — por isso, para
   se poderem acrescentar fotos e videos sem abrir codigo, tinham de mudar
   de casa. Foi so a lista de spots: o resto da pagina fica onde estava. */
const SPOTS = (() => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/spots.json'), 'utf8'));
    return (d.spots || []).filter(s => s && s.nome);
  } catch (e) { return []; }
})();

/* ---- a página de um spot --------------------------------------------
   SÓ EXISTE PARA OS SPOTS QUE TÊM MESMO ALGUMA COISA A DIZER
   Os sete spots aparecem todos na grelha da /parakite-portugal/. Página
   própria tem só quem estiver marcado `publicar` — e a verificação 15
   não deixa marcar sem o texto nas cinco línguas, sem ficha e sem o
   aviso de segurança.

   Não é escrúpulo: sete páginas construídas à volta de um nome e uma
   fotografia não trazem visitas nenhumas e tiram força às que estão
   feitas. Uma página é a consequência de haver conteúdo, não a maneira
   de arranjar um endereço.

   MORA DEBAIXO DO HUB, e não numa pasta /spots/ que ainda não existe.
   /parakite-portugal/praia-das-bicas/ tem um pai que existe hoje: quem
   corta o endereço a meio aterra no hub, e não num 404. */
const caminhoSpot = (l, s) =>
  (l === OMISSAO ? '' : '/' + l) + '/parakite-portugal/' + s.id + '/';

const SP = {
  hub:        { pt:'Parakite em Portugal', en:'Parakite in Portugal',
                es:'Parakite en Portugal', fr:'Parakite au Portugal',
                de:'Parakite in Portugal' },
  referencia: { pt:'Informação de referência', en:'Reference information',
                es:'Información de referencia', fr:'Informations de référence',
                de:'Referenzangaben' },
  seguranca:  { pt:'Segurança', en:'Safety', es:'Seguridad',
                fr:'Sécurité', de:'Sicherheit' },
  voltar:     { pt:'Voltar a Parakite em Portugal', en:'Back to Parakite in Portugal',
                es:'Volver a Parakite en Portugal', fr:'Retour à Parakite au Portugal',
                de:'Zurück zu Parakite in Portugal' },
  verVideo:   { pt:'Ver o vídeo', en:'Play the video', es:'Ver el vídeo',
                fr:'Voir la vidéo', de:'Video ansehen' },
};
/* uma linha em branco no CMS é um parágrafo novo na página. É a única
   formatação que estes campos têm, e é de propósito: quem escreve não
   devia ter de saber HTML para separar dois parágrafos. */
/* UMA LIGAÇÃO ESCREVE-SE COMO TODA A GENTE A ESCREVE
   [Praia das Bicas](/parakite-portugal/praia-das-bicas/) — a convenção que
   qualquer pessoa já usa, sem ter de saber HTML. É o mesmo espírito do traço
   que faz listas.

   O ENDEREÇO ESCREVE-SE UMA VEZ, EM PORTUGUÊS.
   Passa pelo comIdioma(), que lhe põe o prefixo da língua: na página alemã
   o link vai dar a /de/parakite-portugal/... Sem isto, o leitor alemão caía
   numa página em português a meio de uma frase em alemão — e ninguém ia
   escrever o mesmo endereço cinco vezes só para evitar isso. */
const LIGACAO = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const comLigacoes = (jaEscapado, l) =>
  jaEscapado.replace(LIGACAO, (_, rotulo, destino) =>
    '<a href="' + esc(comIdioma(destino, l)) + '">' + rotulo + '</a>');

const paragrafos = (txt, l) => String(txt || '').split(/\n\s*\n/)
  .map(p => p.trim()).filter(Boolean)
  .map(bloco => {
    /* UM BLOCO DE LINHAS COMECADAS POR TRACO E UMA LISTA.
       O texto "Qual a intensidade de vento necessaria?" tem oito factores,
       e como paragrafo corrido eles perdem-se. Quem escreve no CMS escreve
       como se escreve em qualquer sitio — um traco a abrir a linha — e nao
       tem de saber HTML nenhum. Nao e magia: e a convencao que toda a gente
       ja usa quando faz uma lista a mao. */
    const linhas = bloco.split('\n').map(x => x.trim()).filter(Boolean);
    const eLista = linhas.length > 1 && linhas.every(x => /^[-*]\s+/.test(x));
    if (eLista) {
      return '<ul class="spot-lista">'
        + linhas.map(x => '<li>' + comLigacoes(esc(x.replace(/^[-*]\s+/, '')), l) + '</li>').join('')
        + '</ul>';
    }
    return '<p>' + comLigacoes(esc(bloco).replace(/\n/g, '<br />'), l) + '</p>';
  }).join('\n      ');

function paginaSpot(s, l, num) {
  const url = DOMINIO + caminhoSpot(l, s);
  const alts = alternativas(x => caminhoSpot(x, s));
  const alt = etiquetasAlt(alts);
  const hub = comIdioma('/parakite-portugal/', l);
  const h1 = t(s.titulo, l) || s.nome;
  /* O TITULO PARTE-SE NO TRAVESSAO, MAS SO NA PAGINA.
     'Praia das Bicas — Parakite e parapente' e uma linha na aba do
     browser e nos resultados do Google, onde o travessao e o que separa
     o sitio do assunto. No ecra sao duas linhas e o travessao deixa de
     fazer falta: a quebra ja o diz.
     Guarda-se uma vez e o travessao decide onde parte — nao ha um segundo
     campo no CMS a poder discordar do primeiro. */
  const h1Linhas = h1.split(/s*—s*/).filter(Boolean)
    .map(x => esc(x)).join('<br />');
  const resumo = t(s.descricao, l);
  /* Era `resumo.split(/\n/)[0]` — o primeiro PARAGRAFO, e nao a primeira
     frase. Um paragrafo de spot chega aos 319 caracteres, e o Google mostra
     ~155: a descricao da Praia das Bicas em frances tinha metade do texto a
     nao ser lido por ninguem. Passa pelo mesmo compositor das fichas de asa,
     com os paragrafos achatados para as frases se poderem cortar entre eles. */
  const descMeta = compoeDescricao([resumo.replace(/\s*\n+\s*/g, ' ')]);
  const f = s.ficha || {};

  const capa = (s.album || []).find(m => m.imagem);
  const foto = capa ? DOMINIO + capa.imagem : DOMINIO + '/images/og-happysoaring.jpg';

  /* AS FOTOGRAFIAS VOLTAM À PÁGINA, E O POPUP DEIXA DE EXISTIR
     ==========================================================
     11/09/2026. Até hoje as imagens dos spots viviam só num popup do hub, e
     a página própria — 580 palavras no caso do Alfarim — não tinha nenhuma.
     A inversão era o pior dos dois lados: o popup mostrava uma fotografia e
     350 caracteres, a página tinha o texto todo e nada para ver.

     E NÃO HAVIA CARROSSEL. Cinco dos seis spots têm exactamente UMA peça de
     média; só a Praia das Bicas tem duas. As setas, as miniaturas e o
     contador do popup estavam escondidos em cinco dos seis casos — o próprio
     código o dizia, com `nav.hidden = m.length < 2`.

     ONDE ENTRA: logo depois dos parágrafos de abertura e antes do primeiro
     H2, que foi decisão do Paulo — quem chega quer ver o sítio antes de ler
     sobre ele. A abertura corre a largura útil inteira, e este bloco segue-a.

     AS TRÊS COISAS QUE TINHAM DE SOBREVIVER
     1. A `legenda` por imagem, que existe em cinco dos seis: vai em
        `<figcaption>`, que é onde uma legenda pertence.
     2. O vídeo só arranca ao clique. O YouTube não é contactado antes de
        alguém pedir — e agora nem a capa vem de lá, porque as quatro capas
        dos Shorts passaram a ficheiros locais no `spots.json`.
     3. O `width`/`height` declarado. As sete imagens de spot são todas
        1000×1779 — uniformizadas hoje de propósito, para que um par de
        números sirva todas em vez de o código ter casos. */
  const media = (s.album || []).filter(m => m && (m.imagem || m.videoId));
  const blocoMedia = !media.length ? '' : `
  <div class="spot-media">${media.map(m => {
    const src = m.imagem || capaDe(m);
    const altM = esc(t(m.alt, l));
    const leg = esc(t(m.legenda, l) || '');
    const img = `<img src="${esc(src)}" alt="${altM}" width="1000" height="1779"
        loading="lazy" decoding="async" />`;
    const dentro = m.videoId
      ? `<button type="button" class="spot-video" data-video="${esc(m.videoId)}"
        aria-label="${esc(t(SP.verVideo, l))}: ${altM}">${img}
        <span class="pk-play" aria-hidden="true"><i></i></span>
      </button>`
      : img;
    return `<figure class="spot-fig">${dentro}${
      leg ? `\n      <figcaption>${leg}</figcaption>` : ''}</figure>`;
  }).join('\n    ')}
  </div>`;

  /* o `VideoObject` só existe se houver vídeo na página, e descreve o que
     está mesmo lá: a capa é a que se vê, e o embed é o que o clique abre. */
  /* A data de publicação é obrigatória no VideoObject. Vem da própria página
     do vídeo no YouTube, guardada em scripts/dados/videos-youtube.json; sem
     data conhecida, o VideoObject não se escreve — nunca com uma data
     inventada. Lição do módulo de inteligência: dados-estruturados/video-sem-data. */
  const nosVideo = media.filter(m => m.videoId && VIDEOS_YOUTUBE[m.videoId]?.uploadDate).map(m => ({
    '@type': 'VideoObject',
    name: s.nome + (t(m.legenda, l) ? ' — ' + t(m.legenda, l) : ''),
    description: t(m.alt, l) || t(m.legenda, l) || s.nome,
    thumbnailUrl: DOMINIO + (m.imagem || capaDe(m)),
    contentUrl: 'https://www.youtube.com/watch?v=' + m.videoId,
    embedUrl: 'https://www.youtube-nocookie.com/embed/' + m.videoId,
    uploadDate: VIDEOS_YOUTUBE[m.videoId].uploadDate,
    inLanguage: l,
  }));

  /* A FICHA E UMA LISTA LIVRE, E TEM DE SER.
     Comecou com campos fixos — local, distancia, tipo de voo — e ao segundo
     spot ja faltavam quatro: descolagem, ambiente, outras atividades,
     acesso a praia. Ao terceiro faltariam outros quatro. Cada spot tem o
     que tem para dizer, e quem sabe isso e quem la voa, nao quem escreve
     o gerador. Agora a ficha e o que o CMS la puser, pela ordem que la
     estiver. */
  const ficha = (f.linhas || []).map(r => {
    const rot = t(r.rotulo, l), val = t(r.valor, l);
    if (!rot || !val) return '';
    return '<div class="spot-lin"><dt>' + esc(rot) + '</dt><dd>' + esc(val) + '</dd></div>';
  }).filter(Boolean).join('\n        ');

  const seccoes = (s.seccoes || []).map(sec =>
    `  <section class="spot-sec">
      <h2>${esc(t(sec.titulo, l))}</h2>
      ${paragrafos(t(sec.texto, l), l)}
    </section>`).join('\n');

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicioHref(l) },
        { '@type': 'ListItem', position: 2, name: t(SP.hub, l), item: DOMINIO + hub },
        { '@type': 'ListItem', position: 3, name: s.nome, item: url },
      ]},
      /* Place com o que está mesmo visível na ficha, e nada mais. Sem
         coordenadas: não as temos, e inventá-las seria pôr no schema uma
         precisão que a página não tem. */
      /* o concelho vem do ficheiro: estava escrito 'Sesimbra' a mao, e o
         terceiro spot podia nao ser em Sesimbra nenhuma */
      { '@type': 'Place', '@id': url + '#local', name: s.nome,
        address: f.concelho
          ? { '@type': 'PostalAddress', addressLocality: f.concelho, addressCountry: 'PT' }
          : { '@type': 'PostalAddress', addressCountry: 'PT' } },
      /* O PRIMARYIMAGEOFPAGE VOLTOU A 11/09/2026
         Aqui esteve escrito: «sem primaryImageOfPage: a pagina deixou de
         mostrar fotografias, e prometer uma no schema seria descrever
         conteudo que nao esta la». A razao era boa e deixou de se aplicar —
         a pagina voltou a mostrar. Por isso a etiqueta volta, e volta
         CONDICIONADA: só quando ha mesmo uma imagem no album.

         A og:image continua a ser outra coisa: o cartao de partilha, que
         existe mesmo quando a pagina nao mostra nada. */
      { '@type': 'WebPage', url, inLanguage: l, name: h1,
        description: descMeta, about: { '@id': url + '#local' },
        ...(capa ? { primaryImageOfPage: { '@type': 'ImageObject',
          url: DOMINIO + capa.imagem, caption: t(capa.alt, l) || s.nome } } : {}) },
      ...nosVideo,
    ]),
  });

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg spot papel tema',
    titulo: h1,   /* sem sufixo de marca: ver o comentario em `pagina()` */
    descricao: descMeta,
    ogTipo: 'article',
    ogTitulo: h1,
    rodape: 'Happy Soaring &middot; ' + esc(t(T.dealer, l)),
    corpo: `
<main class="pg-cx spot-cx">
  <nav class="pg-migalhas"><a href="${esc(inicioHref(l))}">${esc(t(T.inicio, l))}</a> &rsaquo;
    <a href="${esc(hub)}">${esc(t(SP.hub, l))}</a> &rsaquo; ${esc(s.nome)}</nav>

  <h1 class="spot-h1">${h1Linhas}</h1>
  <div class="spot-abre">
      ${paragrafos(resumo, l)}
      ${/* QUEM CHEGA A UM SPOT POR UMA PESQUISA PODE NAO SABER O QUE E
            A pagina do Alfarim diz "Parakite" nove vezes e nao tinha uma
            saida para a definicao. Entra aqui, depois da abertura e antes
            das fotografias, porque e nesse ponto que a pergunta aparece:
            leu o que se faz no local, ainda nao sabe com o que.

            Sem classe nova: o `.spot-abre p` ja da o tamanho do corpo e
            o `body.spot.papel .spot-cx a` ja da o laranja escuro, que e
            o que se le sobre fundo claro. */
        ''}<p><a class="pg-saibamais" href="${esc(caminhoQP(l))}">${
        esc(t(QP.ancoraOque, l))}</a></p>
  </div>
${blocoMedia}

${seccoes}

  <section class="spot-sec spot-ref">
    <h2>${esc(t(SP.referencia, l))}</h2>
    <dl class="spot-ficha">
        ${ficha}
    </dl>
  </section>

  <aside class="spot-aviso" role="note">
    <h2>${esc(t(SP.seguranca, l))}</h2>
    ${paragrafos(t(s.aviso, l), l)}
  </aside>

  <p class="pg-voltar"><a href="${esc(hub)}">${esc(t(SP.voltar, l))}</a></p>
</main>${media.some(m => m.videoId) ? `
<script>
(function(){
  /* O YOUTUBE SO E CONTACTADO AO CLIQUE, E A CAPA JA NEM VEM DE LA.
     A capa e um ficheiro local declarado com width e height, por isso a
     caixa tem o tamanho certo antes de a imagem chegar e nao ha salto. O
     iframe nasce no lugar do botao quando alguem carrega — o autoplay nao
     comeca nada sozinho, serve para nao exigir um segundo clique. */
  var bs = document.querySelectorAll('.spot-video');
  Array.prototype.forEach.call(bs, function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-video'); if (!id) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
            + '?autoplay=1&playsinline=1&rel=0';
      f.title = b.getAttribute('aria-label') || '';
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      b.parentNode.replaceChild(f, b);
      f.focus();
    });
  });
})();
</script>` : ''}`,
  });
}

/* A LIGACAO A FOLHA DO TEMA ENTRA AQUI, E NAO NOS OITO MOLDES
   Havia seis sitios a escrever `<link href="/pagina.css">` e mais dois
   moldes de pagina inicial. Acrescentar a linha em oito sitios e
   acrescenta-la em sete: o oitavo esquece-se, e essa pagina fica com uma
   escala diferente das outras sem nada que o denuncie.

   Entra imediatamente antes de `</head>`, o que garante que vem DEPOIS de
   todas as outras folhas. E de proposito: as folhas trazem os valores de
   hoje escritos la dentro e o tema passa por cima. Se o `tema.css`
   desaparecer, o site fica exactamente como esta em vez de ficar sem
   tipografia nenhuma.

   So entra se ainda nao la estiver: o `index.html` e lido do disco, e
   sem esta condicao ganhava uma ligacao nova a cada geracao. */
const LIGACAO_TEMA = '<link rel="stylesheet" href="/tema.css" />';
/* AS FRONTEIRAS ONDE O TEXTO COLA
   =================================
   `<b>4 dias</b><span>duração de referência</span>` sem nada pelo meio dá,
   em `textContent`, «4 diasduração de referência». Foi assim que o Google
   mostrou a página do curso na SERP de Portugal a 11/09/2026 — e com a parte
   colada a negrito, por ser o excerto que ele escolheu.

   Varrido o site: **2 573 fronteiras** assim, em 170 páginas e uns quinze
   componentes. Não é um defeito de um sítio, é um hábito de escrita de
   templates — e por isso a correção vive aqui, no mesmo sítio e pela mesma
   razão que a regra dos pontos nos títulos: quarenta chamadas são trinta e
   nove, e a quadragésima é a que fica por fazer.

   PORQUE É QUE ISTO NÃO MEXE NA MAQUETAÇÃO
   Uma mudança de linha é espaço. Entre dois elementos de BLOCO não produz
   caixa nenhuma, e em grelha ou flex um nó de texto só com espaços também
   não gera item. Entre dois elementos EM LINHA produziria um espaço visível
   — e é por isso que a lista abaixo é fechada em vez de aberta.

   O QUE FICA DE FORA, E NÃO É POR TIMIDEZ
   O `<button>` está fora porque foi medido: no `/musica/` o `music-cart-ask`
   tem dois botões irmãos a `inline-block`, e ali um espaço abre um intervalo
   que se vê. O `<a>` está fora porque é em linha por natureza e os únicos
   pares `</a><a>` do site são o menu — que os motores já tratam como
   entidades separadas e nunca colam num snippet.

   O `<b>`, o `<span>` e o `<i>` estão DENTRO apesar de serem em linha por
   omissão, porque neste site são sempre `display:block` por CSS quando
   aparecem colados — verificado no DOM em oito tipos de página, e a prova
   é a geometria: as caixas de todos os elementos, antes e depois, batem. */
const TAGS_SEPARAVEIS = new Set([
  'li', 'dt', 'dd', 'tr', 'td', 'th', 'table', 'thead', 'tbody', 'tfoot',
  'caption', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'article',
  'section', 'details', 'summary', 'figure', 'figcaption', 'blockquote',
  'ul', 'ol', 'dl', 'b', 'span', 'i', 'strong'
]);

const separaFronteiras = (html) => html.replace(
  /<\/([a-z][a-z0-9]*)><([a-z][a-z0-9]*)(?=[\s>])/g,
  (tudo, fim, ini) =>
    (TAGS_SEPARAVEIS.has(fim) && TAGS_SEPARAVEIS.has(ini))
      ? '</' + fim + '>\n<' + ini
      : tudo
);

function escrevePagina(caminho, html) {
  /* A REGRA DOS TITULOS APLICA-SE AQUI, E NAO NOS QUARENTA SITIOS
     Ha mais de quarenta pontos no ficheiro a emitir um <h1>, <h2> ou <h3>.
     Chamar a regra em cada um deles e chama-la em trinta e nove: o
     quadragesimo esquece-se, e essa pagina fica com um ponto que as outras
     nao tem. Aqui e um sitio so, e cobre tambem os titulos que ainda nao
     existem. */
  let h = separaFronteiras(tiraPontosDosTitulos(protegeNomes(html, NOMES_ASAS)));
  if (h.indexOf('href="/tema.css"') < 0) {
    h = h.replace('</head>', LIGACAO_TEMA + '\n</head>');
  }
  fs.writeFileSync(caminho, h);
}

/* o hero é a fonte do h1 e do parágrafo de entrada das cinco iniciais: o
   bloco estático lê de lá, o app.js desenha de lá, e não há dois textos */
/* Um título não leva ponto final. A frase leva, e é por isso que isto
   corta só o ÚLTIMO: "Velocidade, trajetória e altura. A energia liga
   tudo." fica com o ponto do meio e perde o do fim.

   Vive aqui e não no conteúdo porque as mesmas frases servem também de
   `<title>`, de og:description e do bloco estático, onde a pontuação faz
   falta. O que muda é o que se pinta como cabeçalho, não o que se diz. */
/* O `semPonto` vivia aqui e era chamado a mao em catorze titulos da
   /parakite-portugal/. Saiu quando a regra passou a valer para o site
   inteiro: duas implementacoes da mesma regra sao duas regras, e um dia
   dizem coisas diferentes. Agora e o `regras/textos.js`, aplicado de uma
   vez no `escrevePagina`. */

const HERO = (() => {
  const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/hero.json'), 'utf8'));
  const e = (d.elements || []).find(x => x && x.role === 'text' && x.h1);
  if (!e) throw new Error('content/slides/hero.json sem o elemento de texto com h1');
  return e;
})();

/* O mapa, pela mesma razão e da mesma maneira.
   Os slides do Parakite e do Pilot2Wing saíram da página inicial. Se o
   bloco estático continuasse a contá-los, dizia ao Google e às IA uma
   página que ninguém vê — que é exactamente o que o comentário do
   corpoInicial() avisa que não pode acontecer. Agora sai do mesmo JSON
   que o app.js desenha: uma só fonte, dois leitores. */
const MAPA = (() => {
  const p = path.join(RAIZ, 'content/slides/mapa.json');
  if (!fs.existsSync(p)) return null;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (d.visible === false) return null;
  const e = (d.elements || []).find(x => x && x.role === 'mapa');
  return e || null;
})();

const so = process.argv[2];
const soIdioma = process.argv[3];
/* gera para a raiz do projecto: assim o endereco local e o mesmo que o de
   producao (/asas/mullet-2/), e nao ha surpresas ao publicar. As pastas
   geradas estao no .gitignore — geram-se, nao se versionam. */
const destino = RAIZ;

let n = 0;
const urls = [];
for (const p of produtos) {
  if (so && slug(p.nome) !== so) continue;
  for (const l of IDIOMAS) {
    if (soIdioma && l !== soIdioma) continue;
    const rel = caminho(l, p);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = pagina(p, l, num);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
    n++;
  }
}
fs.writeFileSync(path.join(destino, '_urls.txt'), urls.join('\n') + '\n');
/* O SITEMAP GERA-SE AQUI, junto com as páginas, para não poder ficar
   desactualizado: um sitemap escrito à mão passa a mentir na primeira asa
   que se acrescente. Só se escreve numa corrida completa — gerar uma asa
   só, para experimentar, não pode apagar as outras 109 do ficheiro. */
if (!so && !soIdioma) {
  escreveIniciais();
  for (const l of IDIOMAS) {
    const rel = caminhoP2W(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaPilot2Wing(l, num);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Pilot2Wing: ' + IDIOMAS.length + ' páginas');
  for (const l of IDIOMAS) {
    const rel = caminhoFlow(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaFlow(l, num);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Flow Paragliders Portugal: ' + IDIOMAS.length + ' páginas');
  for (const l of IDIOMAS) {
    const rel = caminhoPK(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaParakite(l, num);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Parakite Portugal: ' + IDIOMAS.length + ' páginas');

  /* as páginas de spot: só as dos que estão marcados como prontos */
  const spotsComPagina = SPOTS.filter(s => s.publicar === true && s.id);
  for (const s of spotsComPagina) {
    for (const l of IDIOMAS) {
      const rel = caminhoSpot(l, s);
      const dir = path.join(destino, rel);
      fs.mkdirSync(dir, { recursive: true });
      const html = paginaSpot(s, l, num);
      confereAlternativas(html, rel);
      escrevePagina(path.join(dir, 'index.html'), html);
      urls.push(DOMINIO + rel);
    }
  }
  if (spotsComPagina.length) {
    console.log('  Spots: ' + spotsComPagina.length + ' × ' + IDIOMAS.length + ' páginas ('
      + spotsComPagina.map(s => s.nome).join(', ') + ')');
  }
}


/* ---- a página /o-que-e-um-parakite/ -----------------------------------
   A página educativa sobre a categoria. Ao contrário do /pilot2wing/ e do
   pilar, o endereço TRADUZ-SE: "o que é um parakite" é uma pergunta, e uma
   pergunta escreve-se na língua de quem a faz. Só o nome "parakite" fica
   igual nas cinco, porque é o nome da coisa.

   Não há aqui marcas, modelos nem fabricantes — nem no texto, nem no alt,
   nem no schema. As asas concretas serviram para validar o conteúdo e
   ficaram de fora dele.

   Schema: WebPage + FAQPage + BreadcrumbList, com a Organization e o
   WebSite declarados no próprio grafo. O FAQPage entrou a 10/09/2026 —
   as razões estão junto ao `perguntas()`, no topo. */

function paginaQueParakite(l) {
  const url = DOMINIO + caminhoQP(l);
  const foto = DOMINIO + '/images/og-o-que-e-um-parakite.jpg';
  const alts = alternativas(x => caminhoQP(x));
  const alt = etiquetasAlt(alts);
  const inicio = inicioHref(l);
  const A = x => (l === OMISSAO ? '' : '/' + l) + x;   /* endereço na língua */
  const arr = (campo) => QP[campo][l] || QP[campo][OMISSAO];

  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(QP.migalha, l), item: url }
      ]},
      { '@type': ['WebPage', 'FAQPage'],
        '@id': url,
        url,
        name: t(QP.h1, l),
        headline: t(QP.h1, l),
        description: t(QP.desc, l),
        inLanguage: l,
        mainEntity: perguntas(arr('faq')),
        /* Era `/#organizacao`. Uma WebPage e parte de um WebSite, nao de
           uma Organization — quem publica ja vai no `publisher`. O hub
           Parakite sempre teve `/#site`; esta pagina divergia. */
        isPartOf: { '@id': DOMINIO + '/#site' },
        publisher: ORGANIZACAO,
        /* a imagem principal é a fotografia, não o cartão social: é ela
           que faz sentido no Google Images e como miniatura da página */
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: DOMINIO + '/images/parakite-controlo.jpg',
          width: 1600, height: 900,
          caption: t(QP.fotoAlt, l)
        },
        about: { '@type': 'Thing', name: 'Parakite', description: t(QP.definicao, l) }
      }
    ])
  });

  const paras = (campo) => arr(campo).map(p => '<p class="qp-p">' + esc(p) + '</p>').join('');

  const cartoes = arr('s1Cartoes').map(c =>
    '<div class="qp-card"><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></div>').join('');

  const passos = arr('fluxo').map((p, i) =>
    (i ? '<div class="qp-seta" aria-hidden="true">&#9660;</div>' : '')
    + '<div class="qp-passo"><i>' + (i + 1) + '</i>' + esc(p) + '</div>').join('');

  const maos = arr('maos').map(m =>
    '<div class="qp-mao"><b>' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></div>').join('');

  const defs = arr('s4Defs').map(d =>
    '<div class="qp-def-it"><b>' + esc(d[0]) + '</b><span>' + esc(d[1]) + '</span></div>').join('');

  const naos = arr('s5Nao').map(n =>
    '<div><b>' + esc(n[0]) + '</b><span>' + esc(n[1]) + '</span></div>').join('');

  const tri = arr('s6Tri').map((x, i) =>
    (i ? '<i aria-hidden="true">&#8646;</i>' : '') + '<b>' + esc(x) + '</b>').join('');

  /* A COMPARACAO E A CONSULTA — 12/09/2026
     Seis das fontes citadas pelas AI Overviews medidas sao comparacoes, e o
     #1 organico de `what is a parakite` no Reino Unido e um topico do Reddit
     chamado «Parakite vs. Paraglider». O conteudo do `s8Blocos` ja era
     tabular — categoria, o que ela faz, o que o Parakite faz — e estava em
     prosa dentro de tres `article`.

     Reutiliza o `.pg-tabela` das fichas de asa. O comentario dele diz o que
     se quer aqui: ilha clara sobre o azul, e rola dentro da propria caixa em
     vez de fazer a pagina rolar de lado. Zero CSS novo.

     A legenda e o proprio h2 da seccao: o `.pg-tabela caption` esconde-a do
     ecra e deixa-a para o leitor de ecra, que e onde ela serve. */
  const cab = arr('s8Cab');
  const tabela = '<div class="pg-tabela"><table>'
    + '<caption>' + esc(t(QP.s8H2, l)) + '</caption>'
    + '<thead><tr>'
    + cab.map(x => '<th scope="col">' + esc(x) + '</th>').join('')
    + '</tr></thead><tbody>'
    + arr('s8Blocos').map(b => '\n      <tr><th scope="row">' + esc(b[0]) + '</th>'
      + '<td>' + esc(b[1]) + '</td><td>' + esc(b[2]) + '</td></tr>').join('')
    + '\n    </tbody></table></div>';


  const variam = arr('s9Varia').map(v =>
    '<div class="qp-varia-it"><b>' + esc(v[0]) + '</b><span>' + esc(v[1]) + '</span></div>').join('');

  /* AS ASAS QUE A SECCAO 9 PROMETE E NAO NOMEAVA
     O teste e o MESMO que decide, na ficha de asa, se ela ganha o link
     para esta pagina: `/Parakite/` sobre a classificacao do catalogo. Uma
     regra para as duas direccoes — e se a Flow acrescentar um parakite a
     gama, aparece aqui sozinho, sem lista escrita a mao.

     Hoje sao quatro: Mullet 2 e MulletX ("Parakite"), AlbatroXX
     ("Performance Parakite") e Mohawk ("Parakite speed flying"). Os
     parapentes, os arneses, a reserva, o paraquedas de arrasto e a D-Wing
     ("Parawing") ficam de fora, que e o correcto: uma asa que nao e
     parakite nao deve aparecer numa pagina a explicar o que e um. */
  const asasQP = produtos
    .filter(p => /Parakite/.test(String(p.classificacao || '')))
    .map(p => '<a class="qp-link" href="' + esc(caminho(l, p)) + '">'
      + '<b>' + esc(p.nome) + '</b>'
      + '<span>' + esc(t(p.tagline, l) || rotuloClasse(p.classificacao, l)) + '</span></a>')
    /* O \n NAO E ESTETICA: e o que impede a frase de um cartao de colar ao
       nome do cartao seguinte na extracao de texto. O `separaFronteiras`
       nao chega aqui porque exclui `a`, e exclui-o com razao — ver o
       comentario dele. Estes sao `display:block`, logo a quebra e invisivel
       no ecra e decisiva fora dele. NAO APAGAR. */
    .join('\n');

  /* a ordem tem de bater com a do QP.s10Links, e o curso entra em terceiro:
     o endereço dele traduz-se, por isso vai pelo caminhoCurso() e não pelo
     A(), que só prefixa a língua. */
  const destinos = [A('/parakite-portugal/'), A('/pilot2wing/'), caminhoCurso(l)];
  const links = arr('s10Links').map((x, i) =>
    '<a class="qp-link" href="' + destinos[i] + '"><b>' + esc(x[0]) + '</b>'
    + '<span>' + esc(x[1]) + '</span></a>').join('\n');   /* ver o \n acima */

  /* AS LIGACOES AOS SPOTS ENTRAM ONDE A SECCAO AS PEDE
     Medido a 12/09: a pagina tinha 7 destinos internos e ZERO para
     paginas de spot. Poe-las soltas noutro sitio seria decoracao; aqui
     entregam o que o «para que serve» promete, como as ligacoes as asas
     entregam o que a seccao 9 promete.

     Sai da mesma lista que gera as paginas, com a mesma condicao
     `publicar === true` — se o CMS publicar um spot novo, aparece aqui
     sozinho. */
  const spotsLigados = SPOTS.filter(x => x.publicar === true && x.id)
    .map(x => '<a class="qp-link" href="' + esc(caminhoSpot(l, x)) + '">'
      + '<b>' + esc(x.nome) + '</b></a>')
    .join('\n');

  const faq = arr('faq').map(f =>
    '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" type="image/png" href="/images/marca/hs-simbolo-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/images/marca/hs-apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<title>${esc(t(QP.title, l))}</title>
<meta name="description" content="${esc(t(QP.desc, l))}" />
<meta name="robots" content="max-image-preview:large" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:locale" content="${l}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(QP.h1, l))}" />
<meta property="og:description" content="${esc(t(QP.desc, l))}" />
<meta property="og:image" content="${foto}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(t(QP.ogAlt, l))}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(t(QP.h1, l))}" />
<meta name="twitter:description" content="${esc(t(QP.desc, l))}" />
<meta name="twitter:image" content="${foto}" />
<meta name="twitter:image:alt" content="${esc(t(QP.ogAlt, l))}" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg qp tema">

<header class="pg-topo">
  <a class="pg-marca" translate="no" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

<nav class="pg-migalhas" aria-label="${esc(t(T.migalhas, l))}">
  <div class="qp-cx"><a href="${inicio}">${esc(t(T.inicio, l))}</a> &rsaquo;
  <span>${esc(t(QP.migalha, l))}</span></div>
</nav>

<main>

  <!-- AS FAIXAS: com "qp-claro" e papel, sem classe e azul.
       (Sem acentos e sem plicas invertidas: isto vive dentro de um
       template literal, e uma plica invertida fecharia a string.)
       A alternancia e por registo e nao seccao a seccao: o papel onde se
       le, o azul onde se navega.

         heroi                                          azul
         control system -> reflex   (6 seccoes)          PAPEL
         comparacao e variacao                           azul
         perguntas frequentes                            PAPEL
         learn more                                      azul

       O CSS diz o que uma faixa clara e; esta lista diz quais sao. Trocar
       uma seccao de faixa e acrescentar ou tirar a classe aqui, e o fio
       entre seccoes acerta-se sozinho. -->
  <section class="qp-hero">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.eyebrow, l))}</p>
      <h1>${esc(t(QP.h1, l))}</h1>
      <p class="qp-def">${esc(t(QP.definicao, l))}</p>
      <a class="qp-cta" href="${A('/parakite-portugal/')}">${esc(t(QP.heroCta, l))}</a>
    </div>
  </section>

  <figure class="qp-foto">
    <img src="/images/parakite-controlo.jpg"
      srcset="/images/parakite-controlo-800.jpg 800w, /images/parakite-controlo.jpg 1600w"
      sizes="(max-width:899px) 100vw, 1080px"
      width="1600" height="900" decoding="async"
      loading="eager" fetchpriority="high"
      alt="${esc(t(QP.fotoAlt, l))}" />
  </figure>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s1Kicker, l))}</p>
      <h2>${esc(t(QP.s1H2, l))}</h2>
      ${paras('s1P')}
      <p class="qp-frase">${esc(t(QP.s1Frase, l))}</p>
      <div class="qp-cards">${cartoes}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s2Kicker, l))}</p>
      <h2>${esc(t(QP.s2H2, l))}</h2>
      ${paras('s2P')}
      <div class="qp-fluxo">
        <p class="qp-fluxo-t">${esc(t(QP.fluxoTit, l))}</p>
        <div class="qp-passos">${passos}</div>
      </div>
      <div class="qp-maos">${maos}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s3Kicker, l))}</p>
      <h2>${esc(t(QP.s3H2, l))}</h2>
      ${paras('s3P')}
      <div class="qp-destaque">${esc(t(QP.s3Aviso, l))}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s4Kicker, l))}</p>
      <h2>${esc(t(QP.s4H2, l))}</h2>
      <div class="qp-defs">${defs}</div>
      ${paras('s4P')}
      <h3>${esc(t(QP.s5H3, l))}</h3>
      ${paras('s5P')}
      <div class="qp-nao2">${naos}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s6Kicker, l))}</p>
      <h2>${esc(t(QP.s6H2, l))}</h2>
      <p class="qp-frase"><em>${esc(t(QP.s6Frase, l))}</em></p>
      <div class="qp-tri">${tri}</div>
      ${paras('s6P')}
      <div class="qp-rigor">${esc(t(QP.s6Rigor, l))}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro" id="reflex">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s7Kicker, l))}</p>
      <h2>${esc(t(QP.s7H2, l))}</h2>
      <p class="qp-frase">${esc(t(QP.s7Frase, l))}</p>
      ${paras('s7P')}
      <div class="qp-destaque">${esc(t(QP.s7Limite, l))}</div>
    </div>
  </section>

  <section class="qp-sec" id="comparacao">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s8Kicker, l))}</p>
      <h2>${esc(t(QP.s8H2, l))}</h2>
      <p class="qp-p">${esc(t(QP.s8Intro, l))}</p>
      ${tabela}
      <div class="qp-destaque">${esc(t(QP.s8Speed, l))}</div>
    </div>
  </section>

  <section class="qp-sec">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s9Kicker, l))}</p>
      <h2>${esc(t(QP.s9H2, l))}</h2>
      <p class="qp-frase">${esc(t(QP.s9Frase, l))}</p>
      <p class="qp-p">${esc(t(QP.s9P, l))}</p>
      <p class="qp-varia-t">${esc(t(QP.s9VariaTit, l))}</p>
      <div class="qp-varia">${variam}</div>
      <p class="qp-varia-t">${esc(t(QP.s9Asas, l))}</p>
      <div class="qp-links">${asasQP}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro" id="para-que-serve">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s11Kicker, l))}</p>
      <h2>${esc(t(QP.s11H2, l))}</h2>
      ${paras('s11P')}
      <p class="qp-varia-t">${esc(t(QP.s11Locais, l))}</p>
      <div class="qp-links">${spotsLigados}</div>
    </div>
  </section>

  <section class="qp-sec qp-claro">
    <div class="qp-cx">
      <h2>${esc(t(QP.faqH2, l))}</h2>
      <div class="qp-faq">${faq}</div>
    </div>
  </section>

  <section class="qp-sec">
    <div class="qp-cx">
      <h2>${esc(t(QP.s10H2, l))}</h2>
      <div class="qp-links">${links}</div>
    </div>
  </section>

</main>

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}${rodapeContacto()}</footer>
</body>
</html>
`;
}


/* ---- a página /musica/ -------------------------------------------------
   A música vivia numa secção da página inicial. Uma secção não tem endereço:
   não se partilha, não se anuncia e não se mede — e o cartão que o Facebook
   mostra ao partilhar `/#music` é o da página inicial, com uma fotografia de
   parapente. Para uma página que tem preços e botão de compra, isso não era
   um pormenor.

   O endereço traduz-se, porque "música" é um nome comum e é o que as pessoas
   escrevem. O título continua a ser a marca, "Happy Soaring Music".

   O QUE ESTA AQUI E O QUE VEM DEPOIS
     O gerador escreve a lista das faixas, os termos e a biografia em HTML.
     A seguir, a musica.js substitui esse bloco pela loja a sério — leitor,
     filtros, carrinho — usando o MESMO regras/musica.js que a página inicial
     usa. Sem JavaScript fica a lista; com JavaScript fica a loja. As duas
     dizem o mesmo porque saem do mesmo JSON. */
/* a mesma tabela que o menu usa — ver regras/navegacao.js */
const caminhoMU = l => ROTAS['/musica/'][l] || ROTAS['/musica/'][OMISSAO];

/* o mesmo ficheiro que o CMS edita e que a página inicial lê */
const MUSICA = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/music.json'), 'utf8'));
  } catch (e) { return { elements: [] }; }
})();

function paginaMusica(l) {
  const url = DOMINIO + caminhoMU(l);
  const foto = DOMINIO + '/images/og-musica.jpg';
  const alts = alternativas(x => caminhoMU(x));
  const alt = etiquetasAlt(alts);
  const inicio = inicioHref(l);
  const els = MUSICA.elements || [];
  const txt = els.find(e => e.role === 'text') || {};
  const mus = els.find(e => e.role === 'music') || {};
  const bio = els.find(e => e.role === 'bio') || {};
  /* A GUITARRA, E PORQUE E QUE AS BANDEIRAS DO SLIDE NAO SE APLICAM AQUI
     Usa-se o `src` e o `alt` do elemento do CMS — o alt traduzido é o dele, e
     se um dia lá tirarem a imagem esta sai também.

     O que NAO se usa são o showDesktop/showMobile. Esses governam um
     `floatImage`: uma decoração que flutua sobre a secção da página inicial,
     com x, y, parallax e zIndex, e que a essa escala não cabe num telemóvel.
     Aqui a imagem não flutua — é a figura do hero, a única que a página tem,
     e escondê-la no telemóvel deixava o hero vazio.

     São dois componentes diferentes a partilhar um ficheiro, não a mesma
     coisa em dois sítios. Se um dia isto tiver de ser controlável na página,
     pede campo próprio — como o "só na página própria" da loja. */
  const fig = els.find(e => e.role === 'floatImage') || {};
  const faixas = mus.tracks || [];
  const generos = mus.genreList || [];

  /* MusicPlaylist descreve o que isto e: uma coleccao de gravacoes do mesmo
     autor. O Person leva @id proprio para o dia em que houver pagina dele —
     a entidade ja existe, so ganha morada. */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(MU.migalha, l), item: url }
      ]},
      { '@type': 'MusicPlaylist',
        '@id': url,
        url,
        name: t(txt.title, l) || 'Happy Soaring Music',
        description: t(MU.desc, l),
        inLanguage: l,
        numTracks: faixas.length,
        genre: generos,
        publisher: ORGANIZACAO,
        track: faixas.map(f => ({
          '@type': 'MusicRecording',
          name: f.name,
          genre: f.genre || undefined,
          byArtist: { '@id': DOMINIO + '/#paulo' }
        })),
        byArtist: {
          '@type': 'Person',
          '@id': DOMINIO + '/#paulo',
          name: bio.nome || 'Paulo Pereira',
          description: t(bio.abertura, l) || undefined
        }
      }
    ])
  });

  /* ---- o estático: o que fica sem JavaScript e o que os motores leem ---- */
  const listaFaixas = faixas.map(f =>
    '<li><b>' + esc(f.name) + '</b>'
    + (f.genre ? '<span>' + esc(f.genre) + '</span>' : '')
    + (f.duration ? '<span>' + esc(f.duration) + '</span>' : '')
    + '</li>').join('');

  const marcos = (bio.marcos || []).map(m =>
    '<li><b>' + esc(t(m.ano, l)) + '</b> ' + esc(t(m.facto, l)) + '</li>').join('');

  const bioTxt = [t(bio.abertura, l), t(bio.remate, l)]
    .filter(Boolean).map(p => '<p>' + esc(p) + '</p>').join('');

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" type="image/png" href="/images/marca/hs-simbolo-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/images/marca/hs-apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<title>${esc(t(MU.title, l))}</title>
<meta name="description" content="${esc(t(MU.desc, l))}" />
<meta name="robots" content="max-image-preview:large" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:locale" content="${l}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(txt.title, l) || 'Happy Soaring Music')}" />
<meta property="og:description" content="${esc(t(MU.desc, l))}" />
<meta property="og:image" content="${foto}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(t(MU.ogAlt, l))}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(t(txt.title, l) || 'Happy Soaring Music')}" />
<meta name="twitter:description" content="${esc(t(MU.desc, l))}" />
<meta name="twitter:image" content="${foto}" />
<meta name="twitter:image:alt" content="${esc(t(MU.ogAlt, l))}" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<link rel="stylesheet" href="/musica.css" />
<script src="/menu.js" defer></script>
<script src="/musica.js" type="module"></script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg mu tema">

<header class="pg-topo">
  <a class="pg-marca" translate="no" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

<nav class="pg-migalhas" aria-label="${esc(t(T.migalhas, l))}">
  <div class="mu-cx"><a href="${inicio}">${esc(t(T.inicio, l))}</a> &rsaquo;
  <span>${esc(t(MU.migalha, l))}</span></div>
</nav>

<main>
  <section class="mu-hero">
    <div class="mu-cx mu-hero-in">
      <div class="mu-hero-txt">
        <p class="mu-kicker">${esc(t(txt.kicker, l))}</p>
        <h1>${esc(t(txt.title, l) || 'Happy Soaring Music')}</h1>
        <p class="mu-lead">${esc(t(txt.subtitle, l))}</p>
      </div>
      ${fig.src ? `<img class="mu-foto"
        src="/images/music-guitar.webp"
        srcset="/images/music-guitar-380.webp 380w, /images/music-guitar.webp 760w"
        sizes="(max-width:899px) 46vw, 380px"
        width="760" height="826" decoding="async" loading="eager"
        alt="${esc(t(fig.alt, l))}" />` : ''}
    </div>
  </section>

  <div class="mu-cx">
    <!-- Os <h2> ficam FORA dos contentores. O JavaScript esvazia-os para pôr
         a loja e a biografia, e com os títulos lá dentro a página passava a
         ter só um h1 e um h3 — um salto de nível para quem navega por
         cabeçalhos, e dois títulos de secção a menos para quem indexa.
         O npm run check não apanhava: lê o HTML servido, onde estão. -->
    <h2 class="mu-h2">${esc(t(MU.faixasTit, l))}</h2>
    <div id="musica-loja">
      <p class="mu-nota">${esc(t(MU.semJs, l))}</p>
      <ol class="mu-lista">${listaFaixas}</ol>
      ${t(mus.legal, l) ? '<p class="mu-legal">' + esc(t(mus.legal, l)) + '</p>' : ''}
    </div>

    <h2 class="mu-h2">${esc(t(MU.quemFaz, l))}</h2>
    <div id="musica-bio">
      ${bioTxt}
      ${marcos ? '<ul class="mu-marcos">' + marcos + '</ul>' : ''}
      ${t(bio.lema, l) ? '<p class="mu-lema">' + esc(t(bio.lema, l)) + '</p>' : ''}
    </div>
  </div>
</main>

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}${rodapeContacto()}</footer>
</body>
</html>
`;
}

/* ---- o Reflex Lab, que saiu do site -----------------------------------
   Havia aqui uma rotina que entrava no /reflex-lab/index.html e lhe escrevia
   a navegacao entre dois marcadores, porque era uma pagina escrita a mao e
   ficava a ser a unica sem menu.

   A pagina saiu do site em 04/09/2026. A pasta continua no disco — o
   simulador e o calculo aerodinamico ficam guardados — mas nao e publicada,
   nao esta no sitemap, e nenhuma pagina lhe aponta. O endereco antigo esteve
   publicado, por isso leva 301 no `_redirects` para a seccao #reflex da
   /o-que-e-um-parakite/, que trata do mesmo assunto. Um 404 deitava fora o
   historico do endereco; um 301 transfere-o.

   A rotina foi retirada e nao substituida: o gerador nao volta a escrever
   dentro daquele ficheiro. */


/* ---- a página /curso-parakite-portugal/ -------------------------------
   O curso de conversão, em cinco línguas. O conteúdo vive todo no
   conteudo-curso-parakite.mjs; aqui só se desenha.

   PORQUE OS PRECOS SAO PLACEHOLDERS E NAO NUMEROS
     O texto escreve `{dias}`, `{curso}`, `{hora}` e `{pilotos}`, e o
     `precos()` substitui-os pelo PRECOS do conteudo. Um preco que aparece
     em nove frases e em cinco linguas nao pode estar escrito quarenta e
     cinco vezes: mudava-se em quarenta e quatro e ficava uma errada.

   PORQUE `nomes()` NAO ESTA AQUI
     A previa tinha uma funcao a marcar Parakite, Pilot2Wing e Body First
     com `hs-nome`. Aqui isso e feito uma vez, no `escrevePagina()`, para
     as 165 paginas — e por isso `Body First` entrou na lista de nomes
     intocaveis do regras/textos.js, que e onde os outros ja estavam.

   O QUE FALTA A ESTA PAGINA, E ESTA ESCRITO NO SEO-OPEN.md
     Dois diagramas, dois videos e a fotografia do heroi. Nenhum e
     estrutural: cada bloco onde iam ja carrega o seu proprio visual. A
     `course.jpg` do heroi e emprestada do slide dos produtos da inicial e
     e provisoria — e sai monocromatica azul, como todo o `pk-heroi`. */

function paginaCurso(l, numWa) {
  const rel = caminhoCurso(l);
  const url = DOMINIO + rel;
  /* a fotografia do curso, do Paulo (14/09/2026); a `course.jpg` emprestada sai.
     No herói usa-se desde 14/09/2026 o RECORTE do Paulo (curso-heroi-asa-*.webp: a asa
     amarela vista de baixo com o piloto, com transparência, sobre o azul-claro);
     esta horizontal, da mesma sessão, fica para as partilhas, que cortam mal
     uma imagem vertical. */
  const foto = DOMINIO + '/images/curso/curso-heroi-1600.jpg';
  const alts = alternativas(x => caminhoCurso(x));
  const alt = etiquetasAlt(alts);
  const inicio = inicioHref(l);
  const C = CURSO;

  /* `horasCurso` e `equilibrio` derivam do PRECOS: mudar o preço ou as horas
     muda as frases que os usam, sem ninguém as ir procurar */
  const VALORES = { ...PRECOS, horasCurso: PRECOS.dias * PRECOS.horasDia, equilibrio: Math.round(PRECOS.curso / PRECOS.hora) };
  const precos = s => String(s).replace(/\{(\w+)\}/g, (_, k) =>
    VALORES[k] === undefined ? '{' + k + '}' : VALORES[k]);
  const tx = o => precos(esc(t(o, l)));
  const lista = o => (t(o, l) || []).map(x => precos(esc(x)));

  /* ---- componentes, todos modificadores dos que já existem ---- */
  const sec = (cl, id, corpo) => `\n<section class="${cl}" id="${id}">${corpo}\n</section>\n`;
  const eyebrow = o => `\n  <p class="pg-eyebrow">${tx(o)}</p>`;
  const h2 = o => `\n  <h2>${tx(o)}</h2>`;
  const h3 = o => `\n  <h3>${tx(o)}</h3>`;
  const h4 = o => `\n  <h4>${tx(o)}</h4>`;
  const par = (o, cl) => `\n  <p${cl ? ` class="${cl}"` : ''}>${tx(o)}</p>`;
  const cit = o => `\n  <p class="pk-cit">${tx(o)}</p>`;

  /* 14/09/2026 · OS COMPONENTES DESTA PÁGINA DEIXAM DE SER ETIQUETAS
     `chips` e `cadeia` davam caixas iguais a botões, e na cadeia a seta ficava
     pendurada no fim da linha quando partia. Agora:
       chips  → lista em grelha, com traço (conjuntos sem ordem)
       cadeia → fluxo: a seta vai presa ao passo SEGUINTE, por isso uma linha
                partida começa em «→ passo», que se lê como continuação
     O `sg-trans-lista` continua a existir no /pilot2wing/; aqui já não se usa. */
  const chips = (o, variante) => `\n  <ul class="pk-tags${variante ? ' pk-tags-' + variante : ''}">${
    lista(o).map(x => `<li>${x}</li>`).join('')}</ul>`;
  const cadeia = o => `\n  <ol class="pk-fluxo">${lista(o).map(x => `<li>${x}</li>`).join('')}</ol>`;

  /* 11/09/2026 · O ESPAÇO ENTRE `</b>` E `<span>` NÃO É FORMATAÇÃO
     Sem ele, o `textContent` deste `li` dá «4 diasduração de referência», e
     foi exactamente isso que o Google mostrou na SERP de Portugal a 11/09 —
     com a parte colada a NEGRITO, por ser o excerto que ele escolheu:

       «4 diasduração de referência ; 800 €o curso completo ;
        60 €/horaformação flexível ; Parakite e harnessincluídos»

     Três das quatro fontes que a AI Overview citou nessa mesma SERP dão ao
     Google uma frase em prosa sobre o que o curso ensina. Isto dava-lhe uma
     tabela de preços com as palavras coladas.

     O `<span>` é `display:block` por CSS, logo o espaço no código-fonte não
     muda um pixel — medido a 1440 e a 375. Só muda o texto que sai.

     ERA MAIOR DO QUE ISTO, E EU ESCREVI AQUI QUE NÃO ERA
     Este comentário dizia, antes, que «era só aqui que o `pk-eixos` colava as
     palavras». Varridas as 170 páginas, eram **2 573 fronteiras** em uns
     quinze componentes — as fichas de asa, os spots, a música, os chips do
     Pilot2Wing, os cartões do hub Flow. Não era um sítio: era um hábito.

     Por isso a correção de verdade está no `separaFronteiras`, no
     `escrevePagina`, que é o ponto por onde passam todas as páginas. Este
     espaço aqui ficou: é redundante com a função central, colapsa com a
     mudança de linha dela, e não custa nada. Quem escrever o próximo helper
     não precisa de se lembrar — mas se se lembrar, também não estraga. */
  const eixos = itens => `\n  <ul class="pk-eixos">${itens.map(i =>
    `<li><b>${precos(esc(t(i.nome || i.valor, l)))}</b> <span>${
      precos(esc(t(i.nota, l)))}</span></li>`).join('\n    ')}</ul>`;

  /* A GRELHA DOS LOCAIS
     Reaproveita o `pk-eixos` do bloco 2 — nome a negrito, papel por baixo —
     e o componente já é uma grelha de quatro, que é exactamente o número de
     locais. Zero CSS novo, e nada de `data-cols`: esse atributo pertence ao
     `sg-etapas`, não a este.

     TRÊS DOS QUATRO LEVAM LIGAÇÃO e um não. O Alfarim está no spots.json com
     `publicar: false` e sem uma linha de conteúdo — ligar para uma página
     que não existe era um 404, e inventar-lhe conteúdo era pior. Sai como
     texto, e a decisão fica na própria condição: no dia em que a página do
     Alfarim for escrita, a ligação aparece sozinha e ninguém volta aqui.

     O ESPAÇO ENTRE `</b>` E `<span>` NÃO É DECORATIVO. Sem ele o Google
     extrai «Alfarimgroundhandling», que é o mesmo defeito que hoje põe
     «4 diasduração de referência» a negrito na SERP. O `eixos` acima ainda
     o tem; este não nasce com ele. */
  /* 14/09/2026: passa a cartões com o marcador de mapa (`pk-locais`) */
  const grelhaLocais = () => `\n  <ul class="pk-locais">${
    C.locais.map(x => {
      const s = SPOTS.find(y => y.id === x.id);
      const nome = esc(x.nome);
      const alvo = (s && s.publicar === true)
        ? `<a href="${esc(caminhoSpot(l, s))}">${nome}</a>`
        : nome;
      return `<li><b>${alvo}</b> <span>${esc(t(x.papel, l))}</span></li>`;
    }).join('\n    ')}</ul>`;

  /* as duas colunas comparadas: cartões de cantos vivos, com o fluxo e as
     listas novas lá dentro; `variante` dá a cada par o seu desenho */
  const duas = (cols, variante) => `\n  <div class="sg-duas pk-comparar${variante ? ' pk-comparar-' + variante : ''}">${cols.map(c => `
    <div class="sg-abord${c.destaque ? ' sg-abord-nossa' : ''}${c.evitar ? ' sg-abord-evitar' : ''}">
      <p class="sg-abord-et">${tx(c.rotulo)}</p>
      ${c.subtitulo ? `<p class="sg-abord-tx">${tx(c.subtitulo)}</p>` : ''}
      ${c.itens ? chips(c.itens) : ''}
      ${c.etapas ? cadeia(c.etapas) : ''}
    </div>`).join('')}</div>`;

  /* os passos de um ciclo, numa linha ligada; o último é o objetivo */
  const passos = o => `\n  <ol class="pk-passos">${lista(o).map((x, i) =>
    `<li data-n="${String(i + 1).padStart(2, '0')}">${x}</li>`).join('')}</ol>`;

  const grelha = (itens, cols) => `\n  <ol class="sg-etapas" data-cols="${cols}">${
    itens.map((it, i) => `
    <li class="sg-etapa">
      <span class="sg-etapa-n">${String(i + 1).padStart(2, '0')}</span>
      ${it.h3 ? `<h3>${it.h3}</h3>` : ''}
      ${it.cadeia ? `<div class="sg-trans-lista">${it.cadeia.map((x, j) =>
        `${j ? '<i>&rarr;</i>' : ''}<b>${x}</b>`).join('')}</div>` : ''}
    </li>`).join('')}</ol>`;

  /* 14/09/2026 · A FIGURA DO BODY FIRST PASSA A ESQUEMA COM LEGENDAS
     O Paulo pediu a imagem bem maior e o texto legível. As cinco partes da
     lista são cinco sítios do corpo na fotografia: cada uma ganha um ponto no
     sítio certo e uma linha até à sua legenda, à direita.

     A GEOMETRIA
     A figura tem proporção fixa, 1200 × 830 unidades: a fotografia (900 × 1249)
     ocupa as primeiras 598, as legendas começam nas 740. As linhas são um SVG
     com o mesmo viewBox, por isso nunca se desalinham ao mudar a largura.
     Os pontos estão em % da fotografia, medidos sobre o original: olhos,
     ombro, cintura, calções, joelho. As legendas descem a espaços iguais e a
     linha faz um cotovelo no intervalo — nunca passa por cima de texto.
     Abaixo dos 900px não há linhas: os pontos levam o número e a lista vem
     por baixo, numerada. */
  /* Cada figura diz a sua geometria: tamanho da fotografia, pontos (em % da
     fotografia, pela ordem dos itens), onde as legendas começam e descem. A
     largura da fotografia na figura sai da proporção. A figura tem 1200 de largo e
     `alto` de altura (830 por omissão); o harness é mais alto para o piloto,
     que é estreito na fotografia, sair grande. */
  const FIG_CORPO = {
    classe: 'bf-anot-corpo', w: 900, h: 1249,
    pontos: [[49.5, 14.4], [33.3, 21.6], [40, 37.6], [41.1, 49.6], [60, 65.7]],
    ly0: 100, passo: 130, cotovelo: [640, 690], lx: 740
  };
  /* 14/09/2026 · O HARNESS COM A FOTOGRAFIA DO PAULO (a silhueta em SVG sai)
     Os pontos foram medidos sobre o original de 2160 × 3840: a bacia na anca,
     o joelho, a perneira debaixo da coxa, as costas do harness, o mosquetão
     do ponto de suspensão e a mão no comando. Seis legendas pela ordem do
     conteúdo cruzavam as linhas; a figura mostra-as de cima para baixo, pela
     altura do ponto no corpo, e a lista numerada segue essa ordem para os
     números baterem com os pontos. */
  const FIG_HARNESS = {
    classe: 'bf-anot-harness', w: 900, h: 1600,
    pontos: [[35.6, 53], [65.8, 66], [38.5, 60.5], [21, 43], [48.9, 35], [76.5, 47.8]],
    alto: 1000, ly0: 172, passo: 135, cotovelo: [600, 720], lx: 760
  };
  const figuraLegendada = (src, altTx, itens, g) => {
    const H = g.alto || 830, IW = Math.round(H * g.w / g.h);
    const ordem = itens.map((_, i) => i).sort((a, b) => g.pontos[a][1] - g.pontos[b][1]);
    const ly = k => g.ly0 + k * g.passo;
    const linhas = ordem.map((i, k) => {
      const [x, y] = g.pontos[i];
      const px = +(IW * x / 100).toFixed(1), py = +(H * y / 100).toFixed(1);
      const p = `${px},${py} ${g.cotovelo[0]},${py} ${g.cotovelo[1]},${ly(k)} ${g.lx - 14},${ly(k)}`;
      /* duas vezes: um halo branco por baixo, para a linha se ver sobre o escuro da fotografia */
      return `<polyline class="bf-halo" points="${p}" /><polyline points="${p}" />`;
    }).join('');
    const pct = v => (v / 1200 * 100).toFixed(3) + '%';
    return `
  <figure class="bf-anot ${g.classe}" style="--bf-iw:${pct(IW)};--bf-lx:${pct(g.lx)};--bf-ar:1200/${H}">
    <div class="bf-anot-img"><img src="${src}" alt="${esc(t(altTx, l))}" width="${g.w}" height="${g.h}" loading="lazy" />${
      ordem.map((i, k) => `<span class="bf-ponto" style="left:${g.pontos[i][0]}%;top:${g.pontos[i][1]}%" aria-hidden="true">${k + 1}</span>`).join('')}</div>
    <svg class="bf-anot-linhas" viewBox="0 0 1200 ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${linhas}</svg>
    <ol class="bf-anot-l">${ordem.map((i, k) =>
      `<li style="--y:${(ly(k) / H * 100).toFixed(2)}%"><b>${esc(t(itens[i].nome, l))}</b><span>${esc(t(itens[i].nota, l))}</span></li>`).join('')}</ol>
  </figure>`;
  };

  /* `pk-b2` é uma VARIANTE do `pk-b`: sozinha não tem forma de botão e saía
     como texto sublinhado. Leva as duas, como o resto do site. */
  const botao2 = (o, href) => `\n  <p><a class="pk-b pk-b2" href="${esc(href)}">${tx(o)}</a></p>`;

  /* os endereços das páginas irmãs passam pelos helpers de rota: na página
     alemã o Pilot2Wing é /de/pilot2wing/ e o técnico é
     /de/was-ist-ein-parakite/ */
  const hrefP2W = caminhoP2W(l);
  const hrefQP = caminhoQP(l);
  const hrefPK = caminhoPK(l);
  const hrefAsa = caminho(l, { nome: ASA_DO_CURSO });
  const wa = 'https://wa.me/' + numWa + '?text=' + encodeURIComponent(t(C.ctaMsg, l));

  let corpo = '';

  /* ---- 1 · HERÓI --------------------------------------------------- */
  corpo += `
<section class="pk-heroi pk-heroi-curso" id="topo">
  <div class="pk-heroi-grelha">
  <div class="pk-heroi-tx">
    <nav class="pg-migalhas"><a href="${esc(inicio)}">${esc(t(T.inicio, l))}</a> &rsaquo;
      <a href="${esc(hrefPK)}">${tx(C.verHub)}</a> &rsaquo;
      <span>${tx(C.migalhaCurso)}</span></nav>
    <p class="pg-eyebrow">${tx(C.kicker)}</p>
    <h1>${tx(C.h1)}</h1>
    <p class="pk-citacao cur-ancora">${tx(C.ancora)}</p>
    <p class="cur-ponte">${tx(C.ponte)}</p>
    <p class="pk-tese pk-resposta">${tx(C.resposta)}</p>
    <p class="pk-botoes">
      <a class="pk-b" href="#falar">${tx(C.heroAssistente).replace('{perguntas}', C.sim.perguntas.length)}</a>
      <a class="pk-b pk-b2" href="${esc(hrefP2W)}">${tx(C.metodoBotao)}</a>
    </p>
  </div>
  <figure class="pk-heroi-foto">
    <img src="/images/curso/curso-heroi-asa-1000.webp" srcset="/images/curso/curso-heroi-asa-600.webp 600w, /images/curso/curso-heroi-asa-1000.webp 1000w"
      sizes="(max-width: 900px) 60vw, 360px" width="1000" height="1873" alt="${esc(t(C.ogAlt, l))}" fetchpriority="high" />
    <ul class="pk-factos">${[C.ficha[0], C.ficha[1], C.ficha[2], C.ficha[3], C.local].map(x =>
      `<li><b>${tx(x.valor)}</b> <span>${tx(x.nota)}</span></li>`).join('')}</ul>
  </figure>
  </div>
</section>`;

  /* AS SECÇÕES GUARDAM-SE EM `B` E A ORDEM DA PÁGINA DECIDE-SE NO FIM
     (14/09/2026). Assim o índice, os capítulos e a ordem vivem num sítio só,
     e mudar a ordem não obriga a mover blocos de código. */
  const B = {};

  /* ---- 2 · O CURSO EM RESUMO · ilha clara -------------------------- */
  /* AS DUAS OPÇÕES LADO A LADO, E O SIMULADOR
     O curso e a hora deixam de ser dois números numa grelha: são dois cartões
     com o que cada um inclui, e o ponto de equilíbrio por baixo. O simulador
     só aparece com JavaScript; sem ele fica a secção e o contacto no fim da
     página. Textos no conteudo-curso-parakite.mjs; as regras, no script. */
  const opcoes = () => {
    const cartao = (o, id, preco) => `
    <div class="pk-opcao" data-opcao="${id}" data-sug="${tx(C.sim.sugestao)}"><p class="pk-opcao-rot">${tx(o.rotulo)}</p><p class="pk-opcao-preco">${tx(preco)}</p><ul>${
      lista(o.itens).map(x => `<li>${x}</li>`).join('')}</ul></div>`;
    return `\n  <div class="pk-opcoes">${cartao(C.opcaoCurso, 'curso', C.ficha[1].valor)}${
      cartao(C.opcaoHora, 'hora', C.ficha[2].valor)}</div>
  <p class="pk-equilibrio">${tx(C.equilibrio)}</p>`;
  };
  /* O ASSISTENTE «CURSO COMPLETO OU À HORA?»
     Um só assistente para a página: junta o simulador e as quatro perguntas de
     WhatsApp. Os textos vão num JSON no próprio elemento; o fluxo e as regras
     vivem no /curso-assistente.js, que não tem texto nenhum. Sem JavaScript não
     aparece nada dele: ficam os cartões e, no fim da página, o WhatsApp direto. */
  const txc = o => precos(t(o, l));          /* texto cru: o browser escreve-o com textContent */
  const S = C.sim;
  const UI = ['titulo', 'comecar', 'voltar', 'recomecar', 'passo', 'sugestao', 'aviso', 'rotuloMsg', 'outra', 'escreve',
    'seguinte', 'respostas', 'verMensagem', 'mensagemTitulo', 'mensagemNota', 'acrescentar', 'voltarSugestao', 'fechar'];
  const dadosAssist = {
    wa: numWa, abre: t(C.ctaMsg, l), fecho: t(C.formFecho, l),
    ui: Object.fromEntries(UI.map(k => [k, txc(S[k])]).concat([['enviar', txc(C.formBotao)]])),
    perguntas: S.perguntas.map(q => ({ id: q.id, t: txc(q.t), rot: txc(q.rot), op: q.op.map(o => ({ n: o.n, t: txc(o.t) })) })),
    res: Object.fromEntries(Object.entries(S.resultados).map(([k, o]) => [k, txc(o)])),
    porque: Object.fromEntries(Object.entries(S.porque).map(([k, o]) => [k, txc(o)]))
  };
  /* onde o assistente abre: aqui, junto dos preços, e no fim da página. O
     elemento é um só e muda-se para o lugar onde a pessoa carregou. */
  const lugarAssist = (id, comTitulo) => `\n  <div class="pk-assist-lugar" data-lugar="${id}">
    <div class="pk-assist-entrada" hidden>${comTitulo ? `
      <h3>${tx(S.titulo)}</h3>` : ''}
      <p class="pk-assist-intro">${tx(S.intro)}</p>
      <p class="pk-assist-entrada-b"><button type="button" class="pk-b pk-assist-abre">${tx(S.comecar)}</button></p>
    </div>
  </div>`;
  const assistente = () => lugarAssist('resumo', true) + `
  <div class="pk-assist" id="pk-assist" data-assist="${esc(JSON.stringify(dadosAssist))}" hidden></div>
  <script src="/curso-assistente.js" defer></script>`;

  B['resumo'] = sec('pk-sec pk-papel', 'resumo',
    eyebrow(C.resumoKicker) + h2(C.resumoTitulo) + opcoes() +
    par(C.fichaIndividual, 'pk-lead') + par(C.fichaNota, 'pk-nota') +
    par(C.licenca, 'pk-nota') + assistente());

  /* ---- 3 · O QUE ESTE CURSO É ------------------------------------- */
  /* Os critérios em três grupos com o nono como resultado, e a ponte
     autonomia / experiência a fechar. Textos no conteudo-curso-parakite.mjs. */
  const criterios = () => {
    const todos = lista(C.criterios);
    return `\n  <div class="pk-criterios">${C.criteriosGrupos.map(g => `
    <div class="pk-criterios-g"><h4>${tx(g.titulo)}</h4><ul>${g.itens.map(i => `<li>${todos[i]}</li>`).join('')}</ul></div>`).join('')}
  </div>
  <p class="pk-criterio-fim"><b>${tx(C.criterioResultadoRotulo)}</b> <span>${todos[C.criterioResultado]}</span></p>`;
  };
  const ponte = () => `\n  <div class="pk-ponte">${C.pontes.map((x, i) => `${i ? '<span class="pk-ponte-seta" aria-hidden="true"></span>' : ''}
    <div class="pk-ponte-c${i ? ' pk-ponte-exp' : ''}"><p class="pk-ponte-nome">${tx(x.nome)}</p><p class="pk-ponte-verbo">${tx(x.verbo)}</p><p class="pk-ponte-nota">${tx(x.nota)}</p></div>`).join('')}
  </div>`;
  B['autonomia'] = sec('pk-sec pk-leitura', 'autonomia',
    eyebrow(C.autonomiaKicker) + h2(C.autonomiaTitulo) +
    par(C.autonomiaDef, 'pk-lead') + par(C.autonomiaLimites) +
    h3(C.criteriosTitulo) + criterios() + ponte());

  /* ---- 4 · COMO SE MEDE ------------------------------------------- */
  const sinais = () => `\n  <ul class="pk-sinais">${lista(C.expAtributos).map(x => `<li>${x}</li>`).join('')}</ul>`;
  B['experiencia'] = sec('pk-sec pk-leitura', 'experiencia',
    eyebrow(C.expKicker) + h2(C.expTitulo) + par(C.expManobra) +
    cit(C.expCentral) + h3(C.expAtributosTitulo) + sinais());

  /* ---- 5 · DE ONDE VENS · ilha clara ------------------------------ */
  /* 14/09/2026 · A ENTRADA DO CAPÍTULO EM DUAS COLUNAS
     Os requisitos ocupavam meia largura e deixavam a outra metade vazia; as
     quatro coisas avaliadas eram uma fila de rótulos soltos. Passam a lado a
     lado: à esquerda a resposta (a primeira frase dos requisitos em grande,
     é o que a pesquisa pergunta), à direita o que a avaliação olha, em 2 × 2.
     A frase partida é a mesma do conteúdo: nada de texto novo. */
  const avaliacao = () => `\n  <ul class="pk-avaliar">${lista(C.avaliacaoItens).map(x => `<li>${x}</li>`).join('')}</ul>`;
  const entradaConv = () => {
    const req = tx(C.requisitosTexto);
    const corte = req.indexOf('. ');
    const [lead, resto] = corte > 0 ? [req.slice(0, corte + 1), req.slice(corte + 2)] : [req, ''];
    return `\n  <div class="pk-conv-entrada">
    <div class="pk-requisitos"><p class="pk-requisitos-rot">${tx(C.requisitosRotulo)}</p><p class="pk-requisitos-lead">${lead}</p>${
      resto ? `<p class="pk-requisitos-tx">${resto}</p>` : ''}</div>
    <div class="pk-avaliacao">${h3(C.avaliacaoTitulo)}${par(C.avaliacaoTexto)}${avaliacao()}
    </div>
  </div>`;
  };
  /* O diagrama: os dois cartões partilham as linhas da grelha (subgrid), por
     isso rótulo, título e listas começam à mesma altura dos dois lados. */
  const conversao = () => {
    const [de, para] = C.asasColunas;
    const itensPara = lista(para.itens);
    return `\n  <div class="pk-conv">
    <div class="pk-conv-lado pk-conv-de"><p class="pk-conv-rot">${tx(de.rotulo)}</p><h4>${tx(de.subtitulo)}</h4><ul class="pk-conv-trazes">${
      lista(de.itens).map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="pk-conv-seta" aria-hidden="true"><span>${tx(C.conversaoSeta)}</span></div>
    <div class="pk-conv-lado pk-conv-para"><p class="pk-conv-rot">${tx(para.rotulo)}</p><h4>${tx(para.subtitulo)}</h4><div class="pk-conv-gs">${
      C.adaptarGrupos.map(g => `<div class="pk-conv-g"><p class="pk-conv-g-t">${tx(g.titulo)}</p><ul>${
        g.itens.map(i => `<li>${itensPara[i]}</li>`).join('')}</ul></div>`).join('')}</div></div>
  </div>`;
  };
  /* Os três hábitos: no parapente → no Parakite, uma linha por hábito. Os
     perfis: três colunas e o fecho que diz que não há calendário. */
  const habitos = () => {
    const [ladoA, ladoB] = lista(C.habitosLados);
    return `\n  <p class="pk-nota pk-habitos-nota">${tx(C.habitosNota)}</p>
  <ol class="pk-habitos">${C.habitos.map((x, i) => `
    <li><div class="pk-habito-t"><span class="pk-habito-n">${i + 1}</span><h4>${tx(x.titulo)}</h4></div>
      <div class="pk-habito-a"><p class="pk-habito-rot">${ladoA}</p><p>${tx(x.antes)}</p></div>
      <span class="pk-habito-seta" aria-hidden="true"></span>
      <div class="pk-habito-b"><p class="pk-habito-rot">${ladoB}</p><p>${tx(x.depois)}</p></div></li>`).join('')}</ol>`;
  };
  const perfis = () => `\n  <ul class="pk-perfis">${C.perfis.map(x => `
    <li><h4>${tx(x.nome)}</h4><p>${tx(x.texto)}</p></li>`).join('')}</ul>
  <p class="pk-perfis-fecho">${tx(C.perfisFecho)}</p>`;

  B['conversao'] = sec('pk-sec pk-papel pk-leitura', 'conversao',
    eyebrow(C.convKicker) + h2(C.convTitulo) +
    entradaConv() +
    conversao() + cit(C.asasRemate) +
    h3(C.habitosTitulo) + habitos() +
    h3(C.perfisTitulo) + perfis() +
    `\n  <p class="pk-botoes">
    <a class="pk-b" href="#falar">${tx(C.perfisBotao)}</a>
    <a class="pk-b pk-b2" href="${esc(hrefQP)}">${tx(C.verTecnico)}</a>
  </p>`);

  /* ---- 6 · O MÉTODO ----------------------------------------------- */
  B['metodo'] = sec('pk-sec', 'metodo',
    eyebrow(C.metodoKicker) + h2(C.metodoTitulo) +
    par(C.metodoDistincao, 'pk-lead') +
    passos(C.metodoCadeia) +
    par(C.metodoTexto) +
    h3(C.qualidadeTitulo) + cadeia(C.qualidadeCadeia) + par(C.qualidadeTexto) +
    botao2(C.metodoLigacao, hrefP2W));

  /* ---- 7 · ERRO E AUTOMATISMO ------------------------------------- */
  /* 14/09/2026 · A SECÇÃO DO ERRO GANHA RITMO E AS FOTOGRAFIAS DO INSTRUTOR
     Era uma coluna de títulos, parágrafos e fluxos iguais. Passa a três tempos:
       1. os dois caminhos numa só tabela — cada passo do caminho certo por cima
          do seu par errado, e o resultado final destacado;
       2. «resultado certo, técnica errada» + «o instrutor observa o processo»
          ao lado da fotografia do instrutor a observar, com o ciclo em passos;
       3. «corrigir cedo» ao lado da fotografia da asa já estabilizada, com a
          reação precoce e a tardia empilhadas.
     O texto é o mesmo; só muda a disposição. */
  const caminhos = cols => `\n  <div class="pk-caminhos">${cols.map((c, i) => `
    <div class="pk-caminho ${i ? 'pk-caminho-nao' : 'pk-caminho-sim'}"><p class="pk-caminho-rot">${tx(c.rotulo)}</p><ol>${
      lista(c.etapas).map(x => `<li>${x}</li>`).join('')}</ol></div>`).join('')}
  </div>`;
  const fotoLado = (src, altTx, w, h) => `<figure class="pk-erro-fig"><img src="${src}" alt="${esc(t(altTx, l))}" width="${w}" height="${h}" loading="lazy" /></figure>`;
  B['erro'] = sec('pk-sec', 'erro',
    eyebrow(C.erroKicker) + h2(C.erroTitulo) +
    h3(C.habitoTitulo) + caminhos(C.habitoColunas) +
    par(C.habitoTexto, 'pk-caminhos-nota') +
    `\n  <div class="pk-erro-par">
    <div class="pk-erro-tx">${h3(C.tecnicaTitulo)}${par(C.tecnicaTexto)}${h3(C.processoTitulo)}${par(C.processoTexto)}${passos(C.processoCadeia)}
    </div>
    ${fotoLado('/images/curso/erro-instrutor-observa-640.webp', C.erroFigObservaAlt, 640, 1407)}
  </div>`);

  /* ---- 8 · BODY FIRST · ilha clara -------------------------------- */
  B['body-first'] = sec('pk-sec pk-papel', 'body-first',
    eyebrow(C.bodyKicker) + h2(C.bodyTitulo) + par(C.bodyTexto, 'pk-lead') +
    h3(C.corpoAprendeTitulo) + par(C.corpoAprendeTexto) +
    h3(C.bodyNaoTitulo) + par(C.bodyNaoTexto) + par(C.bodyComandos) +
    par(C.bodyGestos) + cadeia(C.bodyOrdem) +
    figuraLegendada('/images/curso/body-first-treino.webp', C.bodyFiguraAlt, C.corpoElementos, FIG_CORPO));

  /* ---- 9 · O HARNESS E AS PERNAS --------------------------------- */
  B['harness'] = sec('pk-sec', 'harness',
    eyebrow(C.harnessKicker) + h2(C.harnessTitulo) + par(C.harnessTexto) +
    par(C.harnessRefTexto) +
    h3(C.cadeiaTitulo) + cadeia(C.cadeiaElos) + par(C.cadeiaTexto) +
    cit(C.cadeiaFrase) +
    h3(C.sistemaTitulo) + par(C.sistemaTexto) +
    figuraLegendada('/images/curso/harness-piloto-900.webp', C.harnessFiguraAlt, C.harnessElementos, FIG_HARNESS) +
    h3(C.sentirTitulo) + chips(C.sentirItens) +
    h3(C.groundTitulo) + par(C.groundTexto) + chips(C.groundItens, 'curtas') +
    /* O ALT VEM DO QP E NÃO É ESCRITO AQUI — 12/09/2026
       Estava `alt=""`, que diz ao leitor de ecrã «esta imagem é
       decoração». É uma fotografia de conteúdo, a seguir à lista de
       groundhandling, e a irmã dela nesta mesma página tem alt escrito —
       logo era inconsistência e não política.

       É a MESMA fotografia que abre a /o-que-e-um-parakite/, onde já tem
       descrição nas cinco línguas. Reutilizar o `QP.fotoAlt` em vez de
       escrever um segundo texto garante que as duas nunca divergem: uma
       foto, uma descrição. */
    '\n  <p class="cur-foto"><img src="/images/parakite-controlo-800.jpg"' +
    ' alt="' + esc(t(QP.fotoAlt, l)) + '"' +
    ' width="800" height="533" loading="lazy" /></p>');

  /* ---- 10 · CORRECÇÃO -------------------------------------------- */
  /* 14/09/2026: com 75 palavras não era secção — é o fim de «o corpo aprende o que repete» */
  const blocoCorrecao = `\n  <div class="pk-erro-par pk-erro-par-inv">
    ${fotoLado('/images/curso/erro-instrutor-corrige-640.webp', C.erroFigCorrigeAlt, 640, 1269)}
    <div class="pk-erro-tx">${h3(C.corrTitulo)}${h4(C.lerTitulo)}${cadeia(C.lerCadeia)}${par(C.lerTexto)}${
      duas([{ ...C.reacaoColunas[0], destaque: true }, C.reacaoColunas[1]], 'reacao')}
    </div>
  </div>`;

  /* ---- 11 · ENERGIA · curto de propósito ------------------------- */
  /* 14/09/2026: curta de propósito, fecha o capítulo do método depois do harness */
  const blocoEnergia = h3(C.energiaTitulo) + par(C.energiaTexto) +
    `\n  <p class="pk-botoes">
    <a class="pk-b pk-b2" href="${esc(hrefQP)}">${tx(C.energiaLigacao)}</a>
    <a class="pk-b pk-b2" href="${esc(hrefQP)}#reflex">${tx(C.reflexLigacao)}</a>
  </p>`;

  /* ---- 12 · COMO SE PROGRIDE · ilha clara ------------------------ */

  /* OS TRILHOS SÃO DESENHO, A LISTA É O CONTEÚDO
     Os dois trilhos são `aria-hidden` e os nomes das fases entram por CSS
     (`content: attr(data-r)`): não repetem oito palavras duas vezes a quem
     ouve a página, nem ao Google. Tudo o que se lê está na lista por baixo.
     As larguras vivem no CSS (`.pk-trilho-a`, `.pk-trilho-b`) e são
     ilustrativas — a própria página o diz. */
  const trilhos = () => {
    const curtas = lista(C.fasesCurtas), nomes = lista(C.trilhosPilotos);
    return `\n  <div class="pk-trilhos" aria-hidden="true">${['a', 'b'].map((k, i) => `
    <div class="pk-trilho"><span class="pk-trilho-nome">${nomes[i]}</span><div class="pk-trilho-fases pk-trilho-${k}">${
      curtas.map((c, j) => `<span class="pk-f" data-f="${j + 1}" data-r="${c}"></span>`).join('')}</div></div>`).join('')}
  </div>
  <p class="pk-trilhos-legenda">${tx(C.trilhosLegenda)}</p>
  <p class="pk-nota">${tx(C.trilhosNota)}</p>`;
  };
  const fasesLista = () => `\n  <ol class="pk-fases">${lista(C.fases).map((nome, i) => {
    const d = C.fasesDetalhe[i];
    const quando = d.fim ? `<b>${tx(d.fim)}</b>` : `<b>${tx(C.quandoRotulo)}</b> ${tx(d.q)}`;
    return `
    <li data-f="${i + 1}"><span class="pk-fases-n">${String(i + 1).padStart(2, '0')}</span><h4>${nome}</h4><p>${tx(d.o)}</p><p class="pk-fases-quando">${quando}</p></li>`;
  }).join('')}</ol>`;

  /* O CICLO É SVG ESCRITO AQUI, E NÃO UMA IMAGEM
     Leva as palavras de cada língua, e o alemão é mais comprido: a caixa de
     cada passo mede-se pelo número de letras e a área do desenho ajusta-se
     ao que ficou, para nenhuma palavra ser cortada. */
  const ciclo = () => {
    const passos = lista(C.cicloPassos), centro = lista(C.cicloCentro);
    const cx = 160, cy = 160, r = 112, n = passos.length;
    const pos = passos.map((_, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a, w: t(C.cicloPassos, l)[i].length * 8.4 + 26 };
    });
    const f = v => Math.round(v * 10) / 10;
    const arcos = pos.map((p0, i) => {
      const p1 = pos[(i + 1) % n];
      const a1 = p0.a + 0.4, a2 = p1.a - 0.4 + (i === n - 1 ? 2 * Math.PI : 0);
      return `<path d="M${f(cx + r * Math.cos(a1))},${f(cy + r * Math.sin(a1))} A${r},${r} 0 0 1 ${f(cx + r * Math.cos(a2))},${f(cy + r * Math.sin(a2))}"/>`;
    }).join('');
    const nos = pos.map((q, i) => `<g class="pk-ciclo-no${i ? '' : ' pk-ciclo-no-1'}"><rect x="${f(q.x - q.w / 2)}" y="${f(q.y - 15)}" width="${f(q.w)}" height="30"/><text x="${f(q.x)}" y="${f(q.y + 5)}">${passos[i]}</text></g>`).join('');
    const minX = Math.min(...pos.map(q => q.x - q.w / 2)) - 8, maxX = Math.max(...pos.map(q => q.x + q.w / 2)) + 8;
    return `
  <figure class="pk-ciclo">
    <svg viewBox="${f(minX)} 20 ${f(maxX - minX)} 285" role="img" aria-label="${passos.join(' → ')} →">
      <defs><marker id="pk-seta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <g class="pk-ciclo-arcos">${arcos}</g>${nos}
      <text class="pk-ciclo-centro" x="${cx}" y="${cy - 2}">${centro[0]}</text><text class="pk-ciclo-centro2" x="${cx}" y="${cy + 16}">${centro[1]}</text>
    </svg>
    <figcaption><b>${tx(C.cicloDestaque)}</b> ${tx(C.cicloTexto)}</figcaption>
  </figure>`;
  };
  const instrutor = () => {
    const ext = lista(C.instrutorExtremos);
    return `\n  <div class="pk-faixa-cx" aria-hidden="true"><div class="pk-faixa-ext"><span>${ext[0]}</span><span>${ext[1]}</span></div><div class="pk-faixa"><span>1</span><span>2</span><span>3</span></div></div>
  <ol class="pk-momentos">${C.instrutorEtapas.map((e, i) => `
    <li><span class="pk-momento-n">${tx(C.momentoRotulo)} ${i + 1}</span><div class="pk-quem">${
      lista(e.cadeia).map((x, j) => `<b class="pk-quem-${e.quem[j] || 'n'}">${x}</b>`).join('')}</div><p>${tx(e.nota)}</p></li>`).join('')}</ol>` + ciclo();
  };

  B['progressao'] = sec('pk-sec pk-papel', 'progressao',
    eyebrow(C.progKicker) + h2(C.progTitulo) + par(C.progTexto, 'pk-lead') +
    h3(C.fasesTitulo) + trilhos() + fasesLista() +
    h3(C.instrutorEtapasTitulo) + instrutor() +
    h3(C.inesperadoTitulo) + cadeia(C.inesperadoCadeia) + par(C.inesperadoTexto));

  /* ---- 13 · A DECISÃO ------------------------------------------- */
  /* 14/09/2026: a decisão de não voar é o último passo da progressão */
  const blocoDecisao = h3(C.decTitulo) + par(C.decTexto) +
    h4(C.factoresTitulo) + chips(C.factores);

  /* ---- 14 · QUEM ENSINA E ONDE · ilha clara -------------------- */
  /* 14/09/2026 · QUEM ENSINA, ONDE E COM QUÊ, EM TRÊS BLOCOS
     1. o princípio (saber fazer ≠ saber ensinar) com a licença ao lado;
     2. a equipa com os retratos: instrutores e auxiliares, cada grupo com o
        seu título — o nome da função está no título, não em cada cartão;
     3. os locais em cartões com a ligação para a página do spot, e o
        equipamento numa caixa própria com os dois botões. */
  const equipa = () => `\n  <div class="pk-equipa">${C.equipa.map(g => `
    <div class="pk-equipa-g">${h3(g.titulo)}
      <ul>${g.pessoas.map(p => `<li><img src="/images/curso/${p.foto}-480.webp" alt="${esc(p.nome)} — ${tx(g.titulo)}" width="480" height="480" loading="lazy" /><b>${esc(p.nome)}</b></li>`).join('')}</ul>
    </div>`).join('')}
  </div>`;
  B['quem-ensina'] = sec('pk-sec pk-papel', 'quem-ensina',
    eyebrow(C.ensinaKicker) + h2(C.ensinaTitulo) +
    `\n  <div class="pk-ensina-cab">
    <div>${h3(C.saberTitulo)}${par(C.saberTexto)}</div>
    <p class="pk-ensina-licenca">${tx(C.licenca)}</p>
  </div>` +
    equipa() +
    `\n  <div class="pk-ensina-onde">${par(C.locaisTexto)}${grelhaLocais()}
  </div>
  <div class="pk-ensina-equip">${par(C.equipTexto)}
    <p class="pk-botoes">
      <a class="pk-b pk-b2" href="${esc(hrefPK)}">${tx(C.verSpots)}</a>
      <a class="pk-b pk-b2" href="${esc(hrefAsa)}">${tx(C.verAsa)}</a>
    </p>
  </div>`);

  /* ---- 15 · PERGUNTAS · ilha clara ----------------------------- */
  B['perguntas'] = sec('pk-sec pk-papel', 'perguntas',
    eyebrow(C.faqKicker) + h2(C.faqTitulo) +
    '\n  <div class="pk-faq">' + C.faq.map((f, i) =>
      `<details class="pk-faq-q"${i ? '' : ' open'}><summary><h3>${precos(esc(t(f.q, l)))}</h3></summary><p>${
        precos(esc(t(f.a, l)))}</p></details>`).join('') + '</div>' +
    botao2(C.reflexLigacao, hrefQP + '#reflex'));

  /* ---- 16 · FALAR ---------------------------------------------- */
  /* O assistente abre aqui também; quem não quer responder a nada escreve
     diretamente, com a mensagem simples. */
  const waSimples = 'https://wa.me/' + numWa + '?text=' + encodeURIComponent(t(C.ctaMsg, l));
  B['falar'] = sec('pk-sec', 'falar',
    eyebrow(C.ctaKicker) + h2(C.ctaTitulo) + lugarAssist('falar', false) +
    `\n  <p class="pk-botoes">
    <a class="pk-b pk-b2" href="${esc(waSimples)}" rel="noopener" target="_blank">${tx(S.direto)}</a>
    <a class="pk-b pk-b2" href="${esc(hrefPK)}">${tx(C.verHub)}</a>
  </p>` + contactoAlt());


  /* ---- A ORDEM DA PÁGINA (14/09/2026) ------------------------------
     Capítulos em vez de dezasseis secções soltas: o que decide (preço, para
     quem é, onde e com quem) antes do que explica (método, progressão). O
     «onde e com quem» era a 14.ª secção e a AI Overview de «curso parakite»
     responde por requisitos e locais. O índice e as barras de capítulo leem
     os rótulos do conteúdo, pela mesma ordem. */
  const junta = (secao, extra) => secao.replace(/\n<\/section>\n$/, extra + '\n</section>\n');
  B.metodo = junta(B.metodo, cit(C.citacao));
  B.erro = junta(B.erro, blocoCorrecao);
  B.harness = junta(B.harness, blocoEnergia);
  B.progressao = junta(B.progressao, blocoDecisao);
  const CAPITULOS = [['resumo'], ['conversao'], ['quem-ensina'],
    ['autonomia', 'experiencia', 'metodo', 'erro', 'body-first', 'harness'], ['progressao'], ['perguntas'], ['falar']];
  const usados = CAPITULOS.flat();
  for (const id of Object.keys(B)) if (!usados.includes(id)) throw new Error('curso: a secção ' + id + ' ficou fora da ordem');
  const rotulos = lista(C.indice);
  corpo += `\n<nav class="pk-indice" aria-label="${tx(C.indiceRotulo)}"><div>${
    CAPITULOS.map((ids, k) => `<a href="#${ids[0]}">${rotulos[k]}</a>`).join('')}</div></nav>\n`;
  CAPITULOS.forEach((ids, k) => {
    corpo += `\n<div class="pk-cap" aria-hidden="true"><span>${rotulos[k]}</span></div>\n`;
    for (const id of ids) corpo += B[id];
  });
  /* no telemóvel, o contacto fica sempre à mão; abre o assistente */
  corpo += `\n<div class="pk-barra-fixa"><a class="pk-b" href="#falar">${tx(C.ctaKicker)}</a></div>\n`;

  /* ---- os dados estruturados ----------------------------------- */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': comEntidade([
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(C.verHub, l), item: DOMINIO + hrefPK },
        { '@type': 'ListItem', position: 3, name: t(C.migalhaCurso, l), item: url }
      ]},
      { '@type': ['WebPage', 'FAQPage'],
        '@id': url,
        url,
        name: t(C.h1, l),
        description: precos(t(C.descricao, l)),
        inLanguage: l,
        isPartOf: { '@id': DOMINIO + '/#site' },
        publisher: ORGANIZACAO,
        mainEntity: perguntas(C.faq.map(f => [precos(t(f.q, l)), precos(t(f.a, l))])),
        primaryImageOfPage: { '@type': 'ImageObject', url: foto, width: 1600, height: 899 }
      },
      /* 14/09/2026 · OS PREÇOS ENTRAM (`offers`), POR ESTAREM À VISTA
         Os dois cartões do bloco 2 mostram 800 € e 60 €/hora: os dados
         estruturados dizem o mesmo que a página, e nada mais. Continua de
         fora o `courseWorkload`, pela razão escrita abaixo.

         SEM `hasCourseInstance`, SEM `offers` E SEM `courseWorkload` (a nota original)
         O Course pede o nome, a descricao e quem o da, e isso e verdade e
         esta na pagina. O resto nao entra: os quatro dias sao duracao de
         REFERENCIA e nao promessa — esta escrito assim em cinco linguas no
         proprio conteudo —, e o schema.org nao tem forma de dizer
         "referencia". Um `courseWorkload: P4D` endurecia numa garantia o
         que a pagina toda tem cuidado em nao garantir. O preco esta a
         visivel no bloco 2; nao vai para o schema enquanto nao houver
         instancia a que ele pertenca. */
      { '@type': 'Course',
        '@id': url + '#curso',
        name: t(C.h1, l),
        description: precos(t(C.descricao, l)),
        inLanguage: l,
        courseMode: 'onsite',
        provider: ORGANIZACAO,
        teaches: lista(C.metodoCadeia).map(x => x.replace(/&[a-z]+;/g, '')),
        offers: [
          { '@type': 'Offer', category: 'Paid', name: t(C.opcaoCurso.rotulo, l), price: PRECOS.curso, priceCurrency: 'EUR' },
          { '@type': 'Offer', category: 'Paid', name: t(C.opcaoHora.rotulo, l),
            priceSpecification: { '@type': 'UnitPriceSpecification', price: PRECOS.hora, priceCurrency: 'EUR', unitCode: 'HUR' } }
        ]
      }
    ])
  });

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg pk tema pk-curso',
    titulo: precos(t(C.titulo, l)),
    descricao: precos(t(C.descricao, l)),
    ogTipo: 'article',
    ogLocale: C.ogLocale[l],
    ogTitulo: t(C.h1, l),
    rodape: 'Happy Soaring &middot; ' + esc(t(T.dealer, l)),
    corpo
  });
}

if (!so || so === 'o-que-e-um-parakite') {
  for (const l of (soIdioma ? [soIdioma] : IDIOMAS)) {
    const rel = caminhoQP(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaQueParakite(l);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  O que é um Parakite: ' + IDIOMAS.length + ' páginas');
}

if (!so || so === 'curso') {
  for (const l of (soIdioma ? [soIdioma] : IDIOMAS)) {
    const rel = caminhoCurso(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaCurso(l, num);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Curso de Parakite: ' + IDIOMAS.length + ' páginas');
}

if (!so || so === 'musica') {
  for (const l of (soIdioma ? [soIdioma] : IDIOMAS)) {
    const rel = caminhoMU(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaMusica(l);
    confereAlternativas(html, rel);
    escrevePagina(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Música: ' + IDIOMAS.length + ' páginas');
}


if (!so && !soIdioma) {
  /* O `lastmod`, POR PÁGINA E OBSERVADO — 12/09/2026
     Aqui esteve escrito, e com razão, que não havia data fiável. O
     comentário antigo rejeitava duas alternativas:

       1. a data de hoje em todas — falso para quase todas a cada
          publicação, e um sinal que diz sempre "mudou tudo" aprende-se a
          ignorar;
       2. uma data por URL tirada do git — não se sustenta, porque o
          conteúdo está repartido entre o JSON e este gerador, e as
          páginas geradas não se versionam.

     As duas objecções continuam de pé. O que faltava era a terceira via:
     **as páginas geradas não se versionam, mas os seus resumos podem.**
     O `sitemap-datas.json` guarda um SHA-1 por URL; na passagem seguinte,
     comparar diz exactamente quais mudaram, e a data é a do dia em que a
     mudança foi observada. Nenhuma data é inventada.

     O QUE AUTORIZA ISTO É A GERAÇÃO SER DETERMINISTA
     Medido a 12/09: duas passagens seguidas deram 175 de 175 páginas com
     hash idêntico. Se não fosse, o resumo mudava sozinho, o `lastmod`
     mentia a cada publicação, e então não se fazia.

     ATENÇÃO A QUEM MEXER AQUI: introduzir algo variável — uma data, um
     número aleatório, uma ordem de iteração instável — quebra isto sem
     dar por ela, e o sintoma é o sitemap passar a dizer que as 175
     mudaram em cada publicação. A verificação 18 do `verificar.mjs` NÃO
     apanha esse caso: ela confirma que o estado bate com o disco, o que
     é outra coisa. O teste do determinismo é gerar duas vezes seguidas e
     confirmar que a segunda passagem diz «0 mudada(s)».

     A PRIMEIRA PASSAGEM NÃO ESCREVE DATA NENHUMA
     Não há com que comparar, logo não se sabe quando mudou. Fica só o
     resumo, e o `lastmod` aparece a partir da primeira mudança observada.
     É a regra antiga — «sem data fiável, não se inventa» — aplicada por
     página em vez de ao ficheiro todo.

     O `changefreq` e a `priority` ficam: não custam nada e o Google
     ignora-os de qualquer maneira. O `lastmod` é o único dos três que ele
     usa, e era o único que faltava. */

  const FICHEIRO_DATAS = path.join(RAIZ, 'sitemap-datas.json');
  const hoje = new Date().toISOString().slice(0, 10);

  /* o ficheiro de uma URL: / -> index.html, /en/x/ -> en/x/index.html */
  const ficheiroDe = (loc) => {
    const rel = loc.replace(DOMINIO, '').replace(/^\//, '');
    return path.join(RAIZ, rel, 'index.html');
  };

  const estadoAntigo = (() => {
    try { return JSON.parse(fs.readFileSync(FICHEIRO_DATAS, 'utf8')); }
    catch (e) { return null; }          /* primeira passagem */
  })();

  const estadoNovo = {};
  const datas = {};
  let mudadas = 0, novas = 0;

  for (const loc of [...IDIOMAS.map(l => DOMINIO + inicioHref(l)), ...urls]) {
    let resumo;
    try {
      resumo = crypto.createHash('sha1')
        .update(fs.readFileSync(ficheiroDe(loc))).digest('hex');
    } catch (e) { continue; }           /* sem ficheiro, sem entrada */
    const antes = estadoAntigo && estadoAntigo[loc];
    if (!estadoAntigo) {
      estadoNovo[loc] = { resumo, data: null };        /* semeia, sem datar */
    } else if (!antes) {
      estadoNovo[loc] = { resumo, data: hoje }; novas++;
    } else if (antes.resumo !== resumo) {
      estadoNovo[loc] = { resumo, data: hoje }; mudadas++;
    } else {
      estadoNovo[loc] = { resumo, data: antes.data };  /* mantém a que havia */
    }
    if (estadoNovo[loc].data) datas[loc] = estadoNovo[loc].data;
  }

  fs.writeFileSync(FICHEIRO_DATAS, JSON.stringify(estadoNovo, null, 1) + '\n');
  console.log('  sitemap-datas.json: ' + Object.keys(estadoNovo).length + ' URLs, '
    + Object.keys(datas).length + ' com lastmod'
    + (estadoAntigo ? '  (' + mudadas + ' mudada(s), ' + novas + ' nova(s))'
      : '  (primeira passagem: semeado, sem datas)'));

  /* as cinco iniciais têm a mesma prioridade: nenhuma é a tradução das
     outras, são cinco portas de entrada para cinco mercados */
  const fixas = IDIOMAS.map(l => ({ loc: DOMINIO + inicioHref(l), freq: 'weekly', pri: '1.0' }));
  const entrada = (loc, freq, pri) => [
    '  <url>',
    '    <loc>' + loc + '</loc>',
    ...(datas[loc] ? ['    <lastmod>' + datas[loc] + '</lastmod>'] : []),
    '    <changefreq>' + freq + '</changefreq>',
    '    <priority>' + pri + '</priority>',
    '  </url>'
  ].join('\n');
  const corpoMapa = fixas.map(u => entrada(u.loc, u.freq, u.pri))
    .concat(urls.map(u => entrada(u, 'monthly', '0.8')));
  /* ---- a folha do tema, escrita a partir do CMS ---------------------- */
{
  const t = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/tema.json'), 'utf8')); }
    catch (e) { return {}; }      /* sem ficheiro, valem as omissoes */
  })();
  fs.writeFileSync(path.join(RAIZ, 'tema.css'), folhaDoTema(t));
  console.log('  tema.css escrito a partir de content/tema.json');
}

fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Gerado por scripts/gerar-paginas.mjs. Não editar à mão: -->',
    '<!-- qualquer alteração aqui perde-se na publicação seguinte. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    corpoMapa.join('\n'),
    '</urlset>',
    ''
  ].join('\n'));
  console.log('  sitemap.xml com ' + (urls.length + fixas.length) + ' URLs');
}
console.log('  ' + n + ' páginas geradas');
if (n <= 6) urls.forEach(u => console.log('    ' + u));
