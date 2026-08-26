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
import { SG } from './conteudo-smartground.mjs';

const RAIZ = process.cwd();   /* corre-se a partir da raiz do projecto */
const DOMINIO = 'https://happysoaring.com';
const IDIOMAS = ['pt', 'en', 'es', 'fr', 'de'];
const OMISSAO = 'pt';

/* a categoria traduz-se — quem procura "parakite wings" clica mais depressa
   num endereço que diga wings. O nome do produto não: a Mullet 2 é Mullet 2 */
const SEGMENTO = { pt: 'asas', en: 'wings', es: 'alas', fr: 'ailes', de: 'schirme' };

const T = {
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
               es:'Distribuidor oficial Flow Paragliders en Portugal',
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
      { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + (l === OMISSAO ? '/' : '/' + l + '/') },
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
  <p class="pg-metodo-et">${esc(t(SG.asaKicker, l))}</p>
  <p class="pg-metodo-tx">${esc(t(SG.asaDoCurso, l))}</p>
  <p><a class="pg-metodo-a" href="${l === OMISSAO ? '' : '/' + l}/smartground/">${esc(t(SG.conhecer, l))}</a></p>
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
    /* a classe vai DENTRO da ligação: assim a caixa toda é clicável, em vez
       de só o nome, e o rótulo não fica órfão por baixo */
    return `<li><a href="${esc(caminho(l, x))}">${esc(x.nome)}${
      cls ? `<span>${esc(cls)}</span>` : ''}</a></li>`;
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
function corpoInicial() {
  const l = OMISSAO;
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

  return `<div class="hs-estatico">
    <h1>Happy Soaring — Parakite e Parapente em Portugal</h1>
    <p>Cursos de parakite em Portugal e revendedor oficial da
    <strong>Flow Paragliders</strong>. Aconselhamento a sério, primeira
    inspeção de segurança incluída e cor à tua escolha.</p>

    <h2>${esc(t(SG.h1a, l))} ${esc(t(SG.h1b, l))}</h2>
    <p>${esc(t(SG.descricao, l))}
    <a href="/smartground/">${esc(t(SG.conhecer, l))}</a></p>

    <h2>Catálogo Flow Paragliders</h2>
    <p>${produtos.length} asas, arneses e reservas, cada uma com a sua página:</p>
${listas}
  </div>`;
}

/* Escreve o corpo estático dentro do index.html, entre marcas, para poder
   ser reescrito em cada publicação sem tocar no resto do ficheiro. */
function escreveInicial() {
  const f = path.join(RAIZ, 'index.html');
  const abre = '<!-- INICIO CONTEUDO ESTATICO (gerado) -->';
  const fecha = '<!-- FIM CONTEUDO ESTATICO -->';
  let h = fs.readFileSync(f, 'utf8');
  const bloco = abre + '\n' + corpoInicial() + '\n' + fecha;

  if (h.includes(abre) && h.includes(fecha)) {
    h = h.slice(0, h.indexOf(abre)) + bloco + h.slice(h.indexOf(fecha) + fecha.length);
  } else {
    const alvo = '<main id="app"></main>';
    if (!h.includes(alvo)) { console.log('  ! index.html sem <main id="app"></main>'); return; }
    h = h.replace(alvo, '<main id="app">\n' + bloco + '\n</main>');
  }
  fs.writeFileSync(f, h);
  const txt = corpoInicial().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('  index.html: ' + txt.length + ' caracteres de texto, ' +
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
function blocoPedido(p, l, num) {
  const k = chave(p.nome);
  const esquemas = (p.cores || []).map(String);
  const tams = (p.tamanhos || []).map(String);
  const custom = p.coresCustom ? TECIDOS : [];
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
  return x ? '<p class="pg-aviso" role="note">' + esc(x) + '</p>' : '';
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
  return `<section class="pg-sec"><h2>${esc(t(T.video, l))}</h2>
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
   Os valores guardados são em nós, como o fabricante os publica. Aqui
   mostram-se os DOIS — nós e km/h — em vez do alternador que o site tem:
   num documento não há razão para esconder metade da informação atrás de
   um clique, e assim também aparece nos resultados de pesquisa. */
const KN_PARA_KMH = 1.852;
function blocoVento(p, l) {
  const wr = p.windRange;
  if (!wr || !(wr.groups || []).length) return '';

  /* mesma escala do site, para os dois gráficos serem comparáveis */
  let maxKn = 0;
  wr.groups.forEach(g => (g.rows || []).forEach(r => { maxKn = Math.max(maxKn, +r.max || 0); }));
  maxKn = Math.ceil((maxKn + 2) / 5) * 5;
  if (!maxKn) return '';

  const marcas = [];
  for (let v = 0; v <= maxKn; v += 5) marcas.push(v);

  const grupos = wr.groups.map(g => {
    const rot = t(g.label, l);
    const linhas = (g.rows || []).map(r => {
      const min = +r.min, max = +r.max;
      const ini = (min / maxKn) * 100, fim = (max / maxKn) * 100;
      const kmh = Math.round(min * KN_PARA_KMH) + '–' + Math.round(max * KN_PARA_KMH);
      return `<tr>
        <th scope="row">${esc(r.tamanho)}</th>
        <td class="pg-vento-barra"><span class="pg-vento-trilho"><span class="pg-vento-b"
          style="left:${ini.toFixed(1)}%;width:${Math.max(0, fim - ini).toFixed(1)}%"></span></span></td>
        <td class="pg-vento-val">${min}–${max}&nbsp;${esc(t(T.kn, l))}<br><small>${kmh}&nbsp;km/h</small></td>
      </tr>`;
    }).join('');
    /* O eixo e uma LINHA DA TABELA, nao um div por baixo: so assim as marcas
       caem na mesma coluna que as barras. Fora da tabela, a largura da coluna
       dos valores muda com o idioma e o eixo deixa de bater certo. */
    const eixo = `<tr class="pg-vento-eixo"><td></td><td class="pg-vento-marcas"><span class="pg-vento-reg">${
      marcas.map(v => '<span style="left:' + ((v / maxKn) * 100).toFixed(1) + '%">' + v +
        '</span>').join('')}</span></td><td class="pg-vento-un">${esc(t(T.kn, l))}</td></tr>`;
    return `<div class="pg-vento-g">
      ${rot ? '<h3>' + esc(rot) + '</h3>' : ''}
      <table class="pg-vento-t"><tbody>${linhas}${eixo}</tbody></table>
    </div>`;
  }).join('');

  const nota = t(wr.note, l);
  return `<section class="pg-sec"><h2>${esc(t(T.vento, l))}</h2>
    ${grupos}
    ${nota ? '<p class="pg-nota">' + esc(nota) + '</p>' : ''}</section>`;
}

/* ---- a página /smartground/ -------------------------------------------
   O SmartGround é o método com que o Curso de Parakite é dado. Tem página
   própria e não uma secção dentro do curso por uma razão prática: é um
   termo ambíguo — há um projecto europeu com nome parecido — e para o
   reclamar é preciso uma página que SEJA sobre ele, com o nome no
   endereço, no título e no h1.

   O nome não se traduz, por isso o endereço é /smartground/ em todos os
   idiomas, só com o prefixo de língua à frente. */
const caminhoSG = l => (l === OMISSAO ? '' : '/' + l) + '/smartground/';

function paginaSmartGround(l, num) {
  const url = DOMINIO + caminhoSG(l);
  const foto = DOMINIO + '/images/og-happysoaring.jpg';
  const alt = IDIOMAS.map(x =>
    '<link rel="alternate" hreflang="' + x + '" href="' + DOMINIO + caminhoSG(x) + '" />').join('\n');
  const wa = 'https://wa.me/' + num + '?text=' + encodeURIComponent(t(SG.ctaMsg, l));
  const cad = SG.cadeia[l] || SG.cadeia[OMISSAO];
  const fases = SG.fases[l] || SG.fases[OMISSAO];
  const etapasCurso = SG.cursoEtapas[l] || SG.cursoEtapas[OMISSAO];
  const inicio = (l === OMISSAO ? '/' : '/' + l + '/');

  /* HowTo descreve exactamente o que isto é: um método por etapas. Sem
     duração nem custo — não os temos, e inventá-los é o que não se faz. */
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(T.inicio, l), item: DOMINIO + inicio },
        { '@type': 'ListItem', position: 2, name: 'SmartGround', item: url }
      ]},
      { '@type': 'HowTo',
        name: 'SmartGround',
        description: t(SG.descricao, l),
        url,
        inLanguage: l,
        author: { '@type': 'Person', name: SG.autorNome, worksFor: { '@type': 'Organization', name: 'Happy Soaring' } },
        step: SG.etapas.map((e, i) => ({
          '@type': 'HowToStep', position: i + 1, name: t(e.nome, l), text: t(e.texto, l)
        }))
      }
    ]
  });

  const cartoes = SG.etapas.map((e, i) => {
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
<title>${esc(t(SG.titulo, l))}</title>
<meta name="description" content="${esc(t(SG.descricao, l))}" />
<link rel="canonical" href="${url}" />
${alt}
<link rel="alternate" hreflang="x-default" href="${DOMINIO + caminhoSG(OMISSAO)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(t(SG.h1a, l) + ' ' + t(SG.h1b, l))}" />
<meta property="og:description" content="${esc(t(SG.descricao, l))}" />
<meta property="og:image" content="${foto}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/pagina.css" />
<script type="application/ld+json">${ld}</script>
</head>
<body class="pg sg">

<header class="pg-topo">
  <a class="pg-marca" href="${inicio}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
</header>

<main>

  <section class="sg-heroi">
    <div class="sg-heroi-txt">
      <p class="pg-eyebrow">${esc(t(SG.kicker, l))}</p>
      <h1>${esc(t(SG.h1a, l))}<br><span>${esc(t(SG.h1b, l))}</span></h1>
      <p class="sg-tese">${esc(t(SG.tese, l))}</p>
    </div>
    <div class="sg-heroi-fig">
      <video src="/images/smartground/movimento-left.webm" autoplay loop muted playsinline
        aria-label="${esc(t(SG.legendaVideo, l))}" width="557" height="952"></video>
    </div>
  </section>

  <section class="sg-abordagens">
    <p class="pg-eyebrow">${esc(t(SG.abordagens, l))}</p>
    <div class="sg-duas">
      <div class="sg-abord">
        <p class="sg-abord-et">${esc(t(SG.convLabel, l))}</p>
        <p class="sg-abord-tx">${esc(t(SG.convTexto, l))}</p>
      </div>
      <div class="sg-abord sg-abord-nossa">
        <p class="sg-abord-et">SmartGround</p>
        <p class="sg-abord-tx">${esc(t(SG.sgTexto, l))}</p>
      </div>
    </div>
  </section>

  <section class="sg-espinha">
    <div class="sg-espinha-cab">
      <div>
        <p class="pg-eyebrow">${esc(t(SG.espinhaKicker, l))}</p>
        <h2>${esc(t(SG.espinhaA, l))}<br>${esc(t(SG.espinhaB, l))}</h2>
      </div>
      <div class="sg-espinha-dir">
        <p>${esc(t(SG.espinhaSub, l))}</p>
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
      <span class="sg-trans-et">${esc(t(SG.transAcaba, l))}</span>
      <i>&rarr;</i>
      <strong>${esc(t(SG.curso, l))}</strong>
      <span class="sg-trans-lista">${etapasCurso.map(x => `<b>${esc(x)}</b>`).join('')}</span>
    </div>
  </section>

  <section class="sg-duplo">
    <div class="sg-perigo">
      <p class="pg-eyebrow">${esc(t(SG.perigoKicker, l))}</p>
      <h2>${esc(t(SG.perigoTitulo, l))}</h2>
      <p>${esc(t(SG.perigoTexto, l))}</p>
    </div>
    <div class="sg-parapente">
      <h2>${esc(t(SG.parapenteTitulo, l))}</h2>
      <p>${esc(t(SG.parapenteTexto, l))}</p>
    </div>
  </section>

  <section class="sg-principio">
    <div>
      <p class="pg-eyebrow">${esc(t(SG.principioKicker, l))}</p>
      <p class="sg-principio-tx">${esc(t(SG.principio, l))}</p>
    </div>
    <div class="sg-autor">
      <p class="sg-autor-et">${esc(t(SG.autorKicker, l))}</p>
      <p class="sg-autor-n">${esc(SG.autorNome)}</p>
      <p>${esc(t(SG.autorTexto, l))}</p>
    </div>
  </section>

  <section class="sg-asa">
    <div class="sg-asa-txt">
      <p class="pg-eyebrow">${esc(t(SG.asaKicker, l))}</p>
      <h2>${esc(t(SG.asaA, l))}<br>${esc(t(SG.asaB, l))}</h2>
      <p>${esc(t(SG.asaTexto, l))}</p>
      <p class="sg-acoes">
        <a class="sg-cta" href="${wa}" rel="noopener" target="_blank">${esc(t(SG.cta, l))}</a>
        <a class="sg-cta-2" href="${caminho(l, { nome: 'Mullet 2' })}">${esc(t(SG.verAsa, l))}</a>
      </p>
    </div>
    <img src="/images/asas/mullet2__maui.webp" alt="Mullet 2" width="1200" height="794" loading="lazy" />
  </section>

  <p class="pg-voltar"><a href="${inicio}">${esc(t(SG.voltar, l))}</a></p>

</main>

<footer class="pg-rodape">Happy Soaring &middot; ${esc(t(T.dealer, l))}</footer>
</body>
</html>`;
}

function pagina(p, l, num) {
  const url = DOMINIO + caminho(l, p);
  const cor = (p.cores || [])[0];
  const foto = cor ? DOMINIO + '/images/asas/' + chave(p.nome) + '__' + cor + '.webp' : DOMINIO + '/images/og-happysoaring.jpg';
  const titulo = p.nome + ' — ' + (rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l)) +
    ' Flow Paragliders | Happy Soaring';
  const desc = (t(p.tagline, l) || t(p.descricao, l) || '').slice(0, 155);

  const alt = IDIOMAS.map(x =>
    '<link rel="alternate" hreflang="' + x + '" href="' + DOMINIO + caminho(x, p) + '" />').join('\n');

  const secs = (p.seccoes || []).map(s => {
    const tt = t(s.titulo, l), tx = t(s.texto, l);
    const fich = (s.ficheiros || []).map(f =>
      '<li><a href="' + esc(f.url) + '" rel="noopener nofollow" target="_blank">'
      + esc(typeof f.nome === 'object' ? t(f.nome, l) : f.nome || f.url) + '</a></li>').join('');
    if (!tt && !tx && !fich) return '';
    return '<section class="pg-sec"><h2>' + esc(tt) + '</h2>' + corpo(tx)
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
<link rel="alternate" hreflang="x-default" href="${DOMINIO + caminho(OMISSAO, p)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Happy Soaring" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(p.nome + ' — Flow Paragliders')}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${foto}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="${l === OMISSAO ? '/' : '/'}pagina.css" />
<script type="application/ld+json">${jsonld(p, l, url, foto)}</script>
</head>
<body class="pg">
<header class="pg-topo">
  <a class="pg-marca" href="${l === OMISSAO ? '/' : '/' + l + '/'}">HAPPY <span>SOARING</span></a>
  <span class="pg-dealer">${esc(t(T.dealer, l))}</span>
</header>

<main class="pg-cx">
  <nav class="pg-migalhas" aria-label="breadcrumb">
    <a href="${l === OMISSAO ? '/' : '/' + l + '/'}">${esc(t(T.inicio, l))}</a> ›
    <span>${esc(rotuloFamilia(p.familia, l))}</span> › <span aria-current="page">${esc(p.nome)}</span>
  </nav>

  <div class="pg-cab">
    <div class="pg-cab-txt">
      <p class="pg-eyebrow">${esc(rotuloClasse(p.classificacao, l) || rotuloFamilia(p.familia, l))}</p>
      <h1>${esc(p.nome)}</h1>
      ${t(p.tagline, l) ? '<p class="pg-tagline">' + esc(t(p.tagline, l)) + '</p>' : ''}
      ${blocoOferta(p, l)}
      <a class="pg-wa" href="#pedir">${esc(t(T.pedir, l))}</a>
    </div>
    ${cor ? `<img class="pg-foto" id="pg-foto" src="/images/asas/${chave(p.nome)}__${cor}.webp"
      alt="${esc(p.nome + ' — Flow Paragliders')}" width="1200" height="794" />` : ''}
  </div>

  ${blocoPedido(p, l, num)}

  ${t(p.descricao, l) ? '<section class="pg-sec">' + corpo(t(p.descricao, l)) + '</section>' : ''}

  ${t(p.paraQuem, l) ? `<section class="pg-sec"><h2>${esc(t(T.paraQuem, l))}</h2>${corpo(t(p.paraQuem, l))}</section>` : ''}

  ${fortes.length ? `<section class="pg-sec"><h2>${esc(t(T.fortes, l))}</h2><ul>${
    fortes.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></section>` : ''}

  ${blocoIncluido(p, l)}

  ${blocoAviso(p, l)}

  ${blocoVideo(p, l)}

  ${blocoVento(p, l)}

  ${(p.specs || []).length ? `<section class="pg-sec"><h2>${esc(t(T.specs, l))}</h2>
    ${tabelaSpecs(p, l)}</section>` : ''}

  ${t(p.descricaoLonga, l) ? '<section class="pg-sec">' + corpo(t(p.descricaoLonga, l)) + '</section>' : ''}

  ${secs}

  ${blocoMetodo(p, l)}

  ${blocoIrmas(p, l)}

  <p class="pg-voltar"><a href="${l === OMISSAO ? '/' : '/' + l + '/'}#produtos">${esc(t(T.voltar, l))}</a></p>
</main>

<footer class="pg-rodape">Happy Soaring · ${esc(t(T.dealer, l))}</footer>
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
    fs.writeFileSync(path.join(dir, 'index.html'), pagina(p, l, num));
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
  escreveInicial();
  for (const l of IDIOMAS) {
    const rel = caminhoSG(l);
    const dir = path.join(destino, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), paginaSmartGround(l, num));
    urls.push(DOMINIO + rel);
  }
  console.log('  SmartGround: ' + IDIOMAS.length + ' páginas');
}


if (!so && !soIdioma) {
  const hoje = new Date().toISOString().slice(0, 10);
  const fixas = [
    { loc: DOMINIO + '/', freq: 'weekly', pri: '1.0' },
    { loc: DOMINIO + '/reflex-lab/', freq: 'monthly', pri: '0.5' }
  ];
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
