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
import { FL } from './conteudo-flow.mjs';
import { IN } from './conteudo-inicial.mjs';
import { PK } from './conteudo-parakite.mjs';
import { entradasDoMenu } from '../regras/navegacao.js';

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
    '<tr>' + cols.map((k, i) => (i === 0 ? '<th scope="row">' : '<td>') + esc(s[k] == null ? '—' : s[k])
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

  return `<div class="hs-estatico">
    <h1>${esc(h1)}</h1>
    <p>${esc(entrada)}</p>

    <h2>${esc(t(P2W.h1a, l))} ${esc(t(P2W.h1b, l))}</h2>
    <p>${esc(t(P2W.descricao, l))}
    <a href="${esc(caminhoP2W(l))}">${esc(t(P2W.conhecer, l))}</a></p>

    <h2>${esc(t(PK.h1, l))}</h2>
    <p>${esc(t(PK.asaTxt, l))}
    <a href="${esc(caminhoPK(l))}">${esc(t(PK.asaCta, l))}</a></p>

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
  fs.writeFileSync(f, trocaBloco(molde, OMISSAO));

  for (const l of IDIOMAS) {
    if (l === OMISSAO) continue;
    const dir = path.join(RAIZ, l);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), paginaInicial(molde, l));
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
  const tams = (p.tamanhos || []).map(String);
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

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(t(FL.titulo, l))}</title>
<meta name="description" content="${esc(t(FL.descricao, l))}" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(FL.h1, l))}" />
<meta property="og:description" content="${esc(t(FL.descricao, l))}" />
<meta property="og:image" content="${foto}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg">

<header class="pg-topo">
  <a class="pg-marca" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

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

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}</footer>
${scriptIdiomas()}
</body>
</html>`;
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
    const numCor = ultimo ? 'rgba(255,106,19,0.5)' : quarto ? 'rgba(255,201,166,0.35)' : 'rgba(255,255,255,0.15)';
    return `<li class="sg-etapa" style="${fundo}">
      <span class="sg-etapa-n" style="color:${numCor}">0${i + 1}</span>
      <h3>${esc(t(e.nome, l))}</h3>
      <p>${esc(t(e.texto, l))}</p>
    </li>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(t(P2W.titulo, l))}</title>
<meta name="description" content="${esc(t(P2W.descricao, l))}" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(P2W.h1a, l) + ' ' + t(P2W.h1b, l))}" />
<meta property="og:description" content="${esc(t(P2W.descricao, l))}" />
<meta property="og:image" content="${foto}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg sg">

<header class="pg-topo">
  <a class="pg-marca" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

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
      <p>${esc(t(P2W.parapenteTexto, l))}</p>
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

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}</footer>
${scriptIdiomas()}
</body>
</html>`;
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
      <span class="pk-percurso-n">0${i + 1}</span>
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
  const spots = PK.spots.map(s => '<li>' + esc(s) + '</li>').join('');
  const palavras = PK.s9Palavras.map(p => '<li>' + esc(p) + '</li>').join('');

  const html = `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(t(PK.titulo, l))}</title>
<meta name="description" content="${esc(t(PK.descricao, l))}" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:locale" content="${IN.ogLocale[l]}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(PK.h1, l))}" />
<meta property="og:description" content="${esc(t(PK.descricao, l))}" />
<meta property="og:image" content="${foto}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(t(PK.ogAlt, l))}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg pk">

<header class="pg-topo">
  <a class="pg-marca" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

<main>

  <nav class="pg-migalhas"><a href="${inicio}">${esc(t(T.inicio, l))}</a> &rsaquo;
    <span>${esc(t(PK.migalha, l))}</span></nav>

  <section class="pk-heroi" id="topo">
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
      <p>${forte(t(PK.s2P2, l))}</p>
    </div>
  </section>

  <section class="pk-energia" id="energia">
    <h2>${esc(t(PK.s3H2, l))}</h2>
    <ul class="pk-eixos">${eixos}</ul>
    <p class="pk-declaracao" lang="en">${esc(PK.s3Declaracao)}</p>
    <p class="pk-reflex"><a href="/reflex-lab/">${esc(t(PK.s3Reflex, l))}</a></p>
  </section>

  <section class="pk-sec" id="onde-estas">
    <p class="pg-eyebrow">${esc(t(PK.s4Kicker, l))}</p>
    <h2>${esc(t(PK.s4H2, l))}</h2>
    <p class="pk-lead">${esc(t(PK.s4Texto, l))}</p>
    <ol class="pk-percursos">${percursos}</ol>
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

  <section class="pk-sec" id="voar-em-portugal">
    <p class="pg-eyebrow">${esc(t(PK.s6Kicker, l))}</p>
    <h2>${esc(t(PK.s6H2, l))}</h2>
    <p class="pk-sub">${esc(t(PK.s6Sub, l))}</p>

    <div class="pk-duo">
    <div class="pk-demo" id="demo">
      <p class="pk-et-laranja">${esc(t(PK.demoKicker, l))}</p>
      <h3>${esc(t(PK.demoTit, l))}</h3>
      <p>${forte(t(PK.demoTxt, l))}</p>
      <ul class="pk-vars">${demoVars}</ul>
      <p class="pk-nota">${esc(t(PK.demoNota, l))}</p>
    </div>

    <div class="pk-rental" id="rental">
      <p class="pk-et-laranja">${esc(t(PK.rentalKicker, l))}
        <span class="pk-soon-selo">${esc(PK.rentalSoon)}</span></p>
      <h3 lang="en">${esc(PK.rentalTit)}</h3>
      <p>${esc(t(PK.rentalTxt, l))}</p>
      <p class="pk-nota">${esc(t(PK.rentalGestao, l))}</p>
      <ul class="pk-exemplo">
        <li><b>20</b><span>${esc(t(PK.rentalManha, l))}</span></li>
        <li class="pk-seta" lang="en"><i aria-hidden="true">&rarr;</i>${esc(PK.rentalVento)}<i aria-hidden="true">&rarr;</i></li>
        <li><b>17.5</b><span>${esc(t(PK.rentalTarde, l))}</span></li>
      </ul>
      <p class="pk-nota">${esc(t(PK.rentalLegenda, l))}</p>
    </div>
    </div>

    <div class="pk-spots">
      <div class="pk-spots-tx">
        <h3>${esc(t(PK.spotsTit, l))}</h3>
        <p class="pk-nota">${esc(t(PK.spotsNota, l))}</p>
        <p class="pk-spots-cta"><a class="pk-b" href="${esc(wa(PK.s6Msg))}" rel="noopener" target="_blank">${esc(t(PK.s6Cta, l))}</a></p>
      </div>
      <ul class="pk-spots-l">${spots}</ul>
    </div>
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

<footer class="pg-rodape">${esc(t(PK.rodape, l))}</footer>
${scriptIdiomas()}
</body>
</html>`;
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

  return `<!DOCTYPE html>
<html lang="${l}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
${alt}
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(p.nome + ' — Flow Paragliders')}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${foto}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<link rel="stylesheet" href="/menu.css" />
<script src="/menu.js" defer></script>
<script type="application/ld+json">${jsonld(p, l, url, foto)}</script>
</head>
<body class="pg">
<header class="pg-topo">
  <a class="pg-marca" href="${inicioHref(l)}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
  ${menuGlobal(l, url)}
  ${seletorIdiomas(alts, l)}
</header>

<main class="pg-cx">
  <nav class="pg-migalhas" aria-label="breadcrumb">
    <a href="${inicioHref(l)}">${esc(t(T.inicio, l))}</a> ›
    <span>${esc(rotuloFamilia(p.familia, l))}</span> › <span aria-current="page">${esc(p.nome)}</span>
  </nav>

  <div class="pg-cab">
    <div class="pg-cab-txt">
      <p class="pg-eyebrow">${esc(rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l))}</p>
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

<footer class="pg-rodape">Happy Soaring · ${esc(t(T.dealer, l))}</footer>
${scriptIdiomas()}
</body>
</html>
`;
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

/* o hero é a fonte do h1 e do parágrafo de entrada das cinco iniciais: o
   bloco estático lê de lá, o app.js desenha de lá, e não há dois textos */
const HERO = (() => {
  const d = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/hero.json'), 'utf8'));
  const e = (d.elements || []).find(x => x && x.role === 'text' && x.h1);
  if (!e) throw new Error('content/slides/hero.json sem o elemento de texto com h1');
  return e;
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
    fs.writeFileSync(path.join(dir, 'index.html'), html);
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
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Pilot2Wing: ' + IDIOMAS.length + ' páginas');
  for (const l of IDIOMAS) {
    const rel = caminhoFlow(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaFlow(l, num);
    confereAlternativas(html, rel);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Flow Paragliders Portugal: ' + IDIOMAS.length + ' páginas');
  for (const l of IDIOMAS) {
    const rel = caminhoPK(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    const html = paginaParakite(l, num);
    confereAlternativas(html, rel);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    urls.push(DOMINIO + rel);
  }
  console.log('  Parakite Portugal: ' + IDIOMAS.length + ' páginas');
}


/* ---- o Reflex Lab -----------------------------------------------------
   O simulador é uma página escrita à mão: tem folha própria, JavaScript
   próprio e um header próprio, e não passa por nenhum dos moldes acima.
   Ficava a ser a única página do site sem navegação — e publicar uma
   "navegação global" com uma excepção é publicar outra coisa.

   Escrever-lhe o menu à mão resolvia hoje e criava a segunda lista que este
   módulo todo existe para não haver. Por isso o gerador entra lá dentro e
   escreve entre dois marcadores. É idempotente: corre as vezes que forem
   precisas e o resultado é o mesmo.

   Só português. A página não tem traduções nem alternativas declaradas, e
   inventar-lhe cinco não é trabalho desta tarefa. */
function escreverReflexLab() {
  const f = path.join(RAIZ, 'reflex-lab', 'index.html');
  if (!fs.existsSync(f)) return;
  const html = fs.readFileSync(f, 'utf8');
  const ini = '<!-- ng:inicio -->', fim = '<!-- ng:fim -->';
  const i = html.indexOf(ini), j = html.indexOf(fim);
  if (i < 0 || j < 0) {
    console.log('  Reflex Lab: sem marcadores, menu não escrito');
    return;
  }
  const novo = html.slice(0, i + ini.length)
    + menuGlobal('pt', DOMINIO + '/reflex-lab/')
    + html.slice(j);
  if (novo !== html) fs.writeFileSync(f, novo);
  console.log('  Reflex Lab: navegação escrita entre marcadores');
}

if (!so && !soIdioma) escreverReflexLab();

if (!so && !soIdioma) {
  const hoje = new Date().toISOString().slice(0, 10);
  /* as cinco iniciais têm a mesma prioridade: nenhuma é a tradução das
     outras, são cinco portas de entrada para cinco mercados */
  const fixas = IDIOMAS.map(l => ({ loc: DOMINIO + inicioHref(l), freq: 'weekly', pri: '1.0' }))
    .concat([{ loc: DOMINIO + '/reflex-lab/', freq: 'monthly', pri: '0.5' }]);
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
