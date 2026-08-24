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
      category: p.familia, image: foto,
      brand: { '@type': 'Brand', name: 'Flow Paragliders' },
      ...(p.classificacao ? { additionalProperty: {
        '@type': 'PropertyValue', name: 'Classificação', value: p.classificacao } } : {}),
      offers: undefined }
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }, (k, v) => v === undefined ? undefined : v);
}

function pagina(p, l, num) {
  const url = DOMINIO + caminho(l, p);
  const cor = (p.cores || [])[0];
  const foto = cor ? DOMINIO + '/images/asas/' + chave(p.nome) + '__' + cor + '.webp' : DOMINIO + '/images/og-happysoaring.jpg';
  const titulo = p.nome + ' — ' + (p.classificacao || p.familia) + ' Flow Paragliders | Happy Soaring';
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
    <span>${esc(p.familia)}</span> › <span aria-current="page">${esc(p.nome)}</span>
  </nav>

  <div class="pg-cab">
    <div class="pg-cab-txt">
      <p class="pg-eyebrow">${esc(p.classificacao || p.familia)}</p>
      <h1>${esc(p.nome)}</h1>
      ${t(p.tagline, l) ? '<p class="pg-tagline">' + esc(t(p.tagline, l)) + '</p>' : ''}
      <a class="pg-wa" href="${wa}" rel="noopener" target="_blank">${esc(t(T.pedir, l))}</a>
    </div>
    ${cor ? `<img class="pg-foto" src="/images/asas/${chave(p.nome)}__${cor}.webp"
      alt="${esc(p.nome + ' — Flow Paragliders')}" width="1200" height="794" />` : ''}
  </div>

  ${t(p.descricao, l) ? '<section class="pg-sec">' + corpo(t(p.descricao, l)) + '</section>' : ''}

  ${t(p.paraQuem, l) ? `<section class="pg-sec"><h2>${esc(t(T.paraQuem, l))}</h2>${corpo(t(p.paraQuem, l))}</section>` : ''}

  ${fortes.length ? `<section class="pg-sec"><h2>${esc(t(T.fortes, l))}</h2><ul>${
    fortes.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></section>` : ''}

  ${(p.cores || []).length ? `<section class="pg-sec"><h2>${esc(t(T.cores, l))}</h2>
    <div class="pg-cores">${p.cores.map(c => `<figure><img loading="lazy" src="/images/asas/${chave(p.nome)}__${c}-card.webp"
      alt="${esc(p.nome + ' — ' + String(c).replace(/-/g, ' '))}" width="600" height="397" />
      <figcaption>${esc(String(c).replace(/-/g, ' '))}</figcaption></figure>`).join('')}</div></section>` : ''}

  ${(p.tamanhos || []).length ? `<section class="pg-sec"><h2>${esc(t(T.tamanhos, l))}</h2>
    <p class="pg-tams">${p.tamanhos.map(x => '<span>' + esc(x) + '</span>').join('')}</p>
    ${tabelaSpecs(p, l)}</section>` : ''}

  ${t(p.descricaoLonga, l) ? '<section class="pg-sec">' + corpo(t(p.descricaoLonga, l)) + '</section>' : ''}

  ${secs}

  <p class="pg-voltar"><a href="${l === OMISSAO ? '/' : '/' + l + '/'}#produtos">${esc(t(T.voltar, l))}</a></p>
</main>

<footer class="pg-rodape">Happy Soaring · ${esc(t(T.dealer, l))}</footer>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- */
const doc = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/produtos.json'), 'utf8'));
const flow = doc.elements.find(e => e.role === 'flow');
const num = flow.whatsapp;
const produtos = (flow.produtos || []).filter(p => p && p.nome && p.visible !== false);

const so = process.argv[2];
const soIdioma = process.argv[3];
const destino = path.join(RAIZ, '_paginas');

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
console.log('  ' + n + ' páginas em _paginas/');
if (n <= 6) urls.forEach(u => console.log('    ' + u));
