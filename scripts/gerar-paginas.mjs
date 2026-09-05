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

const etiquetasAlt = alts =>
  alts.map(a => '<link rel="alternate" hreflang="' + a.lang + '" href="' + DOMINIO + a.url + '" />')
    .concat('<link rel="alternate" hreflang="x-default" href="' +
      DOMINIO + alts.find(a => a.lang === OMISSAO).url + '" />').join('\n');

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
    /* sem offers de propósito: não há preços no site, e inventá-los é
       exactamente o que não se deve fazer */
    { '@type': 'Product', name: p.nome, url,
      description: t(p.tagline, l) || t(p.descricao, l),
      category: rotuloFamilia(p.familia, l), image: foto,
      brand: { '@type': 'Brand', name: 'Flow Paragliders' },
      ...(p.classificacao ? { additionalProperty: {
        '@type': 'PropertyValue', name: 'Classificação', value: p.classificacao } } : {}),
      offers: undefined }
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }, (k, v) => v === undefined ? undefined : v);
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
  <p><a class="pg-metodo-a" href="${l === OMISSAO ? '' : '/' + l}/pilot2wing/">${esc(t(P2W.conhecer, l))}</a></p>
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
<footer class="pg-rodape">${o.rodape}</footer>
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
        return `<li><a href="${esc(caminho(l, p))}">${esc(p.nome)}${
          cls ? `<span>${esc(cls)}</span>` : ''}</a></li>`;
      }).join('')}</ul>
    </div>`).join('');

  /* ItemList com as 22 asas: diz ao Google e ao Gemini que esta página é o
     centro de um conjunto real de produtos, cada um com endereço próprio.
     Sem offers, sem preços, sem stock — não existem. */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
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
    ]
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
      <p class="pg-eyebrow">${esc(t(FL.kicker, l))}</p>
      <h1>${esc(t(FL.h1, l))}</h1>
      <p class="fl-entrada">${esc(t(FL.entrada, l))}</p>
      <p><a class="pg-wa" href="${wa}" rel="noopener" target="_blank">${esc(t(FL.cta, l))}</a></p>
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
    '@graph': [
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
    ]
  });

  const cartoes = P2W.etapas.map((e, i) => {
    const ultimo = i === 4, quarto = i === 3;
    const fundo = ultimo ? 'background:rgba(255,106,19,0.14);border:2px solid #ff6a13'
      : quarto ? 'background:rgba(255,201,166,0.09);border:1px solid rgba(255,201,166,0.34)'
      : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12)';
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
    const numCor = ultimo ? 'rgba(255,106,19,0.76)' : quarto ? 'rgba(255,201,166,0.49)' : 'rgba(255,255,255,0.37)';
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
        <a class="sg-cta" href="${wa}" rel="noopener" target="_blank">${esc(t(P2W.cta, l))}</a>
        <a class="sg-cta-2" href="${caminho(l, { nome: 'Mullet 2' })}">${esc(t(P2W.verAsa, l))}</a>
        <a class="sg-cta-2" href="${caminhoPK(l)}">${esc(t(PK.asaCta, l))}</a>
      </p>
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
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(PK.migalha, l), item: url }
      ]},
      { '@type': 'WebPage',
        '@id': url,
        url,
        name: t(PK.h1, l),
        description: t(PK.descricao, l),
        inLanguage: l,
        isPartOf: { '@id': DOMINIO + '/#site' },
        publisher: ORGANIZACAO,
        author: { '@type': 'Person', name: P2W.autorNome, worksFor: ORGANIZACAO },
        primaryImageOfPage: { '@type': 'ImageObject', url: foto, width: 1200, height: 630 }
      }
    ]
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

  /* 11 — o FAQ, HTML normal e não dados estruturados */
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
     Cada peca e um sitio. A que tem fotografia abre um popup com o album;
     a que nao tem fica caixa de texto, porque o nome do sitio conta na
     mesma. E a mesma grelha para as duas. */
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
  const spots = SPOTS.map((s, i) => {
    const album = (s.album || []).filter(m => m && (m.imagem || m.videoId));
    const capa = capaDe(album[0]);
    const nome = esc(s.nome);
    if (!capa) return '<li class="pk-spot pk-spot-so-nome"><span>' + nome + '</span></li>';
    const alt = esc(t(album[0].alt, l));
    const rede = album[0].videoId && !album[0].imagem
      ? ' onerror="this.onerror=null;this.src=\'https://img.youtube.com/vi/'
        + encodeURIComponent(album[0].videoId) + '/maxresdefault.jpg\'"'
      : '';
    return `<li class="pk-spot"><button type="button" class="pk-spot-b" data-spot="${i}"
        aria-haspopup="dialog">
        <img src="${esc(capa)}" alt="${alt}" loading="lazy" decoding="async"${rede} />
        ${album[0].videoId ? '<span class="pk-play" aria-hidden="true"><i></i></span>' : ''}
        <span class="pk-spot-n">${nome}</span>
      </button></li>`;
  }).join('');

  /* os dados do album viajam num <script type="application/json">: é texto
     inerte para o browser, e o popup lê-o quando alguém abre um spot. Assim
     nada disto ocupa o HTML visível nem entra no que os motores de busca
     leem como conteúdo. */
  const dadosSpots = JSON.stringify(SPOTS.map(s => ({
    id: s.id || '',
    nome: s.nome,
    desc: t(s.descricao, l) || '',
    /* o endereço da página própria, quando existe. Sem isto a página do
       spot ficava escrita e sem ninguém lá chegar: o popup é o único
       sítio do site onde alguém está a olhar para aquele spot. */
    pagina: (s.publicar === true && s.id) ? caminhoSpot(l, s) : '',
    media: (s.album || []).filter(m => m && (m.imagem || m.videoId)).map(m => ({
      img: m.imagem || capaDe(m),
      alt: t(m.alt, l) || '',
      leg: t(m.legenda, l) || '',
      video: m.videoId || ''
    }))
  }))).replace(/</g, '\\u003c');
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
    <img class="pk-heroi-piloto" src="/images/hero-pilot.png" alt="" width="844" height="1500" />
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
      <p><a class="pk-b pk-b2" href="${esc(caminhoP2W(l))}">${esc(t(PK.s5MetodoCta, l))}</a></p>
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

<div class="pk-pop" id="pk-pop" role="dialog" aria-modal="true" aria-labelledby="pk-pop-tit" hidden>
  <button class="pk-pop-x" id="pk-pop-x" aria-label="${esc(t(T.fechar, l))}">&#10005;</button>
  <div class="pk-pop-cx">
    <div class="pk-pop-img">
      <div class="pk-pop-media" id="pk-pop-media">
        <img id="pk-pop-img" src="" alt="" />
        <button type="button" class="pk-play pk-pop-play" id="pk-pop-play" hidden
                aria-label="${esc(t(T.verVideo, l))}"><i></i></button>
      </div>
    </div>
    <div class="pk-pop-tx">
      <p class="pg-eyebrow">${esc(t(PK.spotsTit, l))}</p>
      <p class="pk-pop-tit" id="pk-pop-tit"></p>
      <p class="pk-pop-desc" id="pk-pop-desc"></p>
      <p class="pk-pop-mais"><a id="pk-pop-pag" href="">${esc(t(T.maisSpot, l))} &rarr;</a></p>
      <p class="pk-pop-conta" id="pk-pop-conta" hidden></p>
      <p class="pk-pop-leg" id="pk-pop-leg" hidden></p>
      <div class="pk-pop-minis" id="pk-pop-minis" hidden></div>
      <div class="pk-pop-nav" id="pk-pop-nav" hidden>
        <button type="button" id="pk-pop-ant">&#8592; ${esc(t(T.anterior, l))}</button>
        <button type="button" id="pk-pop-seg">${esc(t(T.seguinte, l))} &#8594;</button>
      </div>
      <p class="pk-pop-nota">${esc(t(PK.spotsNota, l))}</p>
    </div>
  </div>
</div>
<script type="application/json" id="pk-spots-dados">${dadosSpots}</script>
<script>
(function(){
  var el=function(id){return document.getElementById(id)};
  var fonte=el('pk-spots-dados'); if(!fonte) return;
  var spots; try{ spots=JSON.parse(fonte.textContent) }catch(e){ return }

  var pop=el('pk-pop'), img=el('pk-pop-img'), caixa=pop.querySelector('.pk-pop-img'),
      tit=el('pk-pop-tit'), desc=el('pk-pop-desc'), conta=el('pk-pop-conta'),
      leg=el('pk-pop-leg'), minis=el('pk-pop-minis'), nav=el('pk-pop-nav'),
      play=el('pk-pop-play'), media=el('pk-pop-media'), pag=el('pk-pop-pag'),
      fechar=el('pk-pop-x'), ant=el('pk-pop-ant'), seg=el('pk-pop-seg');
  var iS=0, iV=0, veioDe=null;

  function adianta(){
    var m=spots[iS].media; if(m.length<2) return;
    var p=new Image(); p.src=m[(iV+1)%m.length].img;
  }
  function desenhaMinis(){
    var m=spots[iS].media;
    minis.innerHTML='';
    minis.hidden = m.length<2;
    if(m.length<2) return;
    m.forEach(function(x,i){
      var b=document.createElement('button');
      b.type='button';
      b.setAttribute('aria-label',(i+1)+' / '+m.length);
      b.setAttribute('aria-current', i===iV?'true':'false');
      var t=document.createElement('img'); t.src=x.img; t.alt=''; t.loading='lazy';
      b.appendChild(t);
      b.addEventListener('click',function(){ mostra(i) });
      minis.appendChild(b);
    });
  }
  function mostra(i){
    var s=spots[iS], m=s.media;
    iV=(i+m.length)%m.length;
    var x=m[iV];
    tit.textContent=s.nome;
    desc.textContent=s.desc||'';
    /* a ligacao para a pagina do spot so aparece quando ela existe */
    pag.parentNode.hidden=!s.pagina; if(s.pagina) pag.href=s.pagina;
    desc.hidden=!s.desc;
    leg.textContent=x.leg||''; leg.hidden=!x.leg;
    conta.textContent=m.length>1 ? (iV+1)+' / '+m.length : '';
    conta.hidden=m.length<2; nav.hidden=m.length<2;
    var f=media.querySelector('iframe'); if(f) f.remove();
    img.alt=x.alt||''; img.src=x.img;
    /* O VIDEO SO ARRANCA QUANDO ALGUEM MANDA.
       A capa fica sempre por baixo do player: e ela que da a forma a caixa
       (nao ha racio nenhum escrito no CSS) e e ela que se ve enquanto o
       video nao foi pedido. O YouTube so e contactado ao clique. */
    play.hidden=!x.video;
    Array.prototype.forEach.call(minis.children,function(b,k){
      b.setAttribute('aria-current', k===iV?'true':'false');
    });
    adianta();
  }
  function abreVideo(){
    var x=spots[iS].media[iV]; if(!x.video) return;
    var f=document.createElement('iframe');
    /* o autoplay aqui nao comeca nada sozinho: o iframe so nasce depois de
       alguem carregar no play, e serve para o video nao exigir um segundo
       clique. Com som, porque foi pedido. O playsinline evita que o iPhone
       atire o video para ecra inteiro sem ninguem mandar. */
    f.src='https://www.youtube-nocookie.com/embed/'+x.video
         +'?autoplay=1&playsinline=1&rel=0';
    f.title=spots[iS].nome;
    f.allow='accelerometer; autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen=true;
    play.hidden=true;
    media.appendChild(f);
  }
  function abrir(i,origem){
    iS=i; iV=0; veioDe=origem||null;
    desenhaMinis(); mostra(0);
    pop.hidden=false; document.body.style.overflow='hidden';
    fechar.focus();
    /* o id do spots.json ja e um slug — nao ha nada a normalizar aqui, e
       por isso nao ha expressao regular nenhuma para se partir a caminho */
    if(spots[i].id){ try{ history.pushState({pk:i},'','#'+spots[i].id) }catch(e){} }
  }
  function fecha(voltar){
    if(pop.hidden) return;
    var f=media.querySelector('iframe'); if(f) f.remove();
    pop.hidden=true; document.body.style.overflow='';
    if(veioDe) veioDe.focus();
    if(voltar!==false){ try{ history.back() }catch(e){} }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.pk-spot-b'),function(b){
    b.addEventListener('click',function(){ abrir(+b.dataset.spot,b) });
  });
  fechar.addEventListener('click',function(){ fecha() });
  ant.addEventListener('click',function(){ mostra(iV-1) });
  seg.addEventListener('click',function(){ mostra(iV+1) });
  play.addEventListener('click',abreVideo);
  pop.addEventListener('click',function(e){ if(e.target===pop) fecha() });
  window.addEventListener('popstate',function(){ fecha(false) });
  document.addEventListener('keydown',function(e){
    if(pop.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); fecha(); }
    if(e.key==='ArrowLeft') mostra(iV-1);
    if(e.key==='ArrowRight') mostra(iV+1);
    if(e.key==='Tab'){
      var f=Array.prototype.filter.call(pop.querySelectorAll('button'),
        function(b){ return b.offsetParent!==null });
      if(!f.length) return;
      var pri=f[0], ult=f[f.length-1];
      if(e.shiftKey && document.activeElement===pri){ e.preventDefault(); ult.focus() }
      else if(!e.shiftKey && document.activeElement===ult){ e.preventDefault(); pri.focus() }
    }
  });
  var x0=null;
  caixa.addEventListener('touchstart',function(e){ x0=e.changedTouches[0].clientX },{passive:true});
  caixa.addEventListener('touchend',function(e){
    if(x0===null) return;
    var dx=e.changedTouches[0].clientX-x0; x0=null;
    if(Math.abs(dx)>44) mostra(iV+(dx<0?1:-1));
  },{passive:true});
})();
<\/script>
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
  const titulo = p.nome + ' — ' + (rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l)) +
    ' Flow Paragliders | Happy Soaring';
  const desc = (t(p.tagline, l) || t(p.descricao, l) || '').slice(0, 155);

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
        /* só nas asas que o catálogo classifica como Parakite. O Mohawk é
           "Speed flying" e a D-Wing "Parawing": não entram. */
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
  const primeiraFrase = resumo.split(/\n/)[0].trim();
  const f = s.ficha || {};

  const capa = (s.album || []).find(m => m.imagem);
  const foto = capa ? DOMINIO + capa.imagem : DOMINIO + '/images/og-happysoaring.jpg';

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
    '@graph': [
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
      /* sem primaryImageOfPage: a pagina deixou de mostrar fotografias, e
         prometer uma no schema seria descrever conteudo que nao esta la.
         A og:image fica — essa e o cartao de partilha, e nao uma afirmacao
         sobre o que a pagina contem. */
      { '@type': 'WebPage', url, inLanguage: l, name: h1,
        description: primeiraFrase, about: { '@id': url + '#local' } },
    ],
  });

  return moldeDaPagina({
    lingua: l, url, alts, alt, foto, ld,
    classe: 'pg spot papel tema',
    titulo: h1 + ' | Happy Soaring',
    descricao: primeiraFrase,
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
  </div>

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
</main>`,
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
function escrevePagina(caminho, html) {
  /* A REGRA DOS TITULOS APLICA-SE AQUI, E NAO NOS QUARENTA SITIOS
     Ha mais de quarenta pontos no ficheiro a emitir um <h1>, <h2> ou <h3>.
     Chamar a regra em cada um deles e chama-la em trinta e nove: o
     quadragesimo esquece-se, e essa pagina fica com um ponto que as outras
     nao tem. Aqui e um sitio so, e cobre tambem os titulos que ainda nao
     existem. */
  let h = tiraPontosDosTitulos(protegeNomes(html, NOMES_ASAS));
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

   Schema: WebPage + BreadcrumbList, com a Organization por referência.
   Sem FAQPage, mesmo havendo FAQ: foi decisão do Paulo. */

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
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: t(QP.migalha, l), item: url }
      ]},
      { '@type': 'WebPage',
        '@id': url,
        url,
        name: t(QP.h1, l),
        headline: t(QP.h1, l),
        description: t(QP.desc, l),
        inLanguage: l,
        isPartOf: { '@id': DOMINIO + '/#organizacao' },
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
    ]
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

  const comps = arr('s8Blocos').map(b =>
    '<article class="qp-comp"><h3>' + esc(b[0]) + '</h3>'
    + '<p>' + esc(b[1]) + '</p><p class="qp-vs">' + esc(b[2]) + '</p></article>').join('');

  const variam = arr('s9Varia').map(v =>
    '<div class="qp-varia-it"><b>' + esc(v[0]) + '</b><span>' + esc(v[1]) + '</span></div>').join('');

  const destinos = [A('/parakite-portugal/'), A('/pilot2wing/')];
  const links = arr('s10Links').map((x, i) =>
    '<a class="qp-link" href="' + destinos[i] + '"><b>' + esc(x[0]) + '</b>'
    + '<span>' + esc(x[1]) + '</span></a>').join('');

  const faq = arr('faq').map(f =>
    '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
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

  <section class="qp-sec">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s1Kicker, l))}</p>
      <h2>${esc(t(QP.s1H2, l))}</h2>
      ${paras('s1P')}
      <p class="qp-frase">${esc(t(QP.s1Frase, l))}</p>
      <div class="qp-cards">${cartoes}</div>
    </div>
  </section>

  <section class="qp-sec">
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

  <section class="qp-sec">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s3Kicker, l))}</p>
      <h2>${esc(t(QP.s3H2, l))}</h2>
      ${paras('s3P')}
      <div class="qp-destaque">${esc(t(QP.s3Aviso, l))}</div>
    </div>
  </section>

  <section class="qp-sec">
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

  <section class="qp-sec">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s6Kicker, l))}</p>
      <h2>${esc(t(QP.s6H2, l))}</h2>
      <p class="qp-frase"><em>${esc(t(QP.s6Frase, l))}</em></p>
      <div class="qp-tri">${tri}</div>
      ${paras('s6P')}
      <div class="qp-rigor">${esc(t(QP.s6Rigor, l))}</div>
    </div>
  </section>

  <section class="qp-sec" id="reflex">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s7Kicker, l))}</p>
      <h2>${esc(t(QP.s7H2, l))}</h2>
      <p class="qp-frase">${esc(t(QP.s7Frase, l))}</p>
      ${paras('s7P')}
      <div class="qp-destaque">${esc(t(QP.s7Limite, l))}</div>
    </div>
  </section>

  <section class="qp-sec">
    <div class="qp-cx">
      <p class="qp-kicker">${esc(t(QP.s8Kicker, l))}</p>
      <h2>${esc(t(QP.s8H2, l))}</h2>
      <p class="qp-p">${esc(t(QP.s8Intro, l))}</p>
      <div class="qp-comps">${comps}</div>
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
    </div>
  </section>

  <section class="qp-sec">
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

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}</footer>
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
    '@graph': [
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
    ]
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

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}</footer>
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
  const hoje = new Date().toISOString().slice(0, 10);
  /* as cinco iniciais têm a mesma prioridade: nenhuma é a tradução das
     outras, são cinco portas de entrada para cinco mercados */
  const fixas = IDIOMAS.map(l => ({ loc: DOMINIO + inicioHref(l), freq: 'weekly', pri: '1.0' }));
  const entrada = (loc, freq, pri) => [
    '  <url>',
    '    <loc>' + loc + '</loc>',
    '    <lastmod>' + hoje + '</lastmod>',
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
