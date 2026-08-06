/* Motor do site orientado por content.json.
   Nada de conteúdo escrito à mão aqui — tudo vem do ficheiro de dados,
   que é o que o CMS (Sveltia) vai editar. */

const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const px = v => (typeof v === 'number' ? v + 'px' : v);

/* ---- idioma (i18n) ----
   Um campo de texto pode ser uma string simples (uma língua) ou um objeto
   { pt: "...", en: "...", ... }. t() escolhe o idioma atual, com fallback. */
const DEFAULT_LOCALE = 'pt';
let LOCALE = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || DEFAULT_LOCALE;
function t(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[LOCALE] || v[DEFAULT_LOCALE] || Object.values(v).find(Boolean) || '';
}

/* ---- textos da interface ----
   Aquilo que é mecânica do site (botões, colunas, avisos) vive aqui e não no
   CMS: são textos técnicos que não se editam no dia-a-dia e que têm de existir
   nos 5 idiomas. O conteúdo editorial continua no CMS.
   ui('chave', {var: valor}) substitui {var} no texto. */
const UI = {
  /* filtros */
  fAll:   { pt: 'Todas', en: 'All', es: 'Todas', fr: 'Toutes', de: 'Alle' },
  fPt:    { pt: 'Português', en: 'Portuguese', es: 'Portugués', fr: 'Portugais', de: 'Portugiesisch' },
  fEn:    { pt: 'Inglês', en: 'English', es: 'Inglés', fr: 'Anglais', de: 'Englisch' },
  fInst:  { pt: 'Instrumental', en: 'Instrumental', es: 'Instrumental', fr: 'Instrumental', de: 'Instrumental' },
  /* controlos */
  allGenres:  { pt: 'Todos os géneros', en: 'All genres', es: 'Todos los géneros', fr: 'Tous les genres', de: 'Alle Genres' },
  filterGenre:{ pt: 'Filtrar por género', en: 'Filter by genre', es: 'Filtrar por género', fr: 'Filtrer par genre', de: 'Nach Genre filtern' },
  search:     { pt: 'Pesquisar música…', en: 'Search music…', es: 'Buscar música…', fr: 'Rechercher…', de: 'Musik suchen…' },
  searchAria: { pt: 'Pesquisar música', en: 'Search music', es: 'Buscar música', fr: 'Rechercher une musique', de: 'Musik suchen' },
  selectAll:  { pt: 'Marcar todas', en: 'Select all', es: 'Seleccionar todas', fr: 'Tout sélectionner', de: 'Alle auswählen' },
  deselectAll:{ pt: 'Desmarcar todas', en: 'Deselect all', es: 'Deseleccionar todas', fr: 'Tout désélectionner', de: 'Alle abwählen' },
  /* colunas */
  colTrack:  { pt: 'Música', en: 'Track', es: 'Música', fr: 'Titre', de: 'Titel' },
  colLang:   { pt: 'Idioma', en: 'Language', es: 'Idioma', fr: 'Langue', de: 'Sprache' },
  colGenre:  { pt: 'Género', en: 'Genre', es: 'Género', fr: 'Genre', de: 'Genre' },
  colLength: { pt: 'Duração', en: 'Length', es: 'Duración', fr: 'Durée', de: 'Dauer' },
  /* faixas */
  free:      { pt: 'GRÁTIS', en: 'FREE', es: 'GRATIS', fr: 'GRATUIT', de: 'GRATIS' },
  excerpt:   { pt: 'excerto {e}', en: 'excerpt {e}', es: 'extracto {e}', fr: 'extrait {e}', de: 'Auszug {e}' },
  excerptTip:{ pt: 'Ouves um excerto de {e}. A compra inclui a música completa ({t}).',
               en: 'You are hearing a {e} excerpt. Your purchase includes the full track ({t}).',
               es: 'Escuchas un extracto de {e}. La compra incluye la canción completa ({t}).',
               fr: 'Vous écoutez un extrait de {e}. L’achat inclut le morceau complet ({t}).',
               de: 'Du hörst einen Auszug von {e}. Der Kauf enthält den vollständigen Titel ({t}).' },
  play:      { pt: 'Tocar {n}', en: 'Play {n}', es: 'Reproducir {n}', fr: 'Écouter {n}', de: '{n} abspielen' },
  markFree:  { pt: 'Marcar faixa grátis {n}', en: 'Select free track {n}', es: 'Seleccionar pista gratis {n}', fr: 'Sélectionner le titre gratuit {n}', de: 'Gratis-Titel {n} auswählen' },
  markBuy:   { pt: 'Marcar para comprar {n}', en: 'Select {n} to buy', es: 'Seleccionar {n} para comprar', fr: 'Sélectionner {n} pour acheter', de: '{n} zum Kauf auswählen' },
  playPause: { pt: 'Tocar/Pausar', en: 'Play/Pause', es: 'Reproducir/Pausar', fr: 'Lecture/Pause', de: 'Abspielen/Pause' },
  /* carrinho */
  nTrack:    { pt: '{n} música', en: '{n} track', es: '{n} canción', fr: '{n} morceau', de: '{n} Titel' },
  nTracks:   { pt: '{n} músicas', en: '{n} tracks', es: '{n} canciones', fr: '{n} morceaux', de: '{n} Titel' },
  nFreeOne:  { pt: '{n} música grátis', en: '{n} free track', es: '{n} canción gratis', fr: '{n} morceau gratuit', de: '{n} Gratis-Titel' },
  nFreeMany: { pt: '{n} músicas grátis', en: '{n} free tracks', es: '{n} canciones gratis', fr: '{n} morceaux gratuits', de: '{n} Gratis-Titel' },
  mixed:     { pt: '{n} músicas ({c} {pag} + {f} grátis)', en: '{n} tracks ({c} {pag} + {f} free)',
               es: '{n} canciones ({c} {pag} + {f} gratis)', fr: '{n} morceaux ({c} {pag} + {f} gratuits)',
               de: '{n} Titel ({c} {pag} + {f} gratis)' },
  paidOne:   { pt: 'paga', en: 'paid', es: 'pagada', fr: 'payant', de: 'bezahlt' },
  paidMany:  { pt: 'pagas', en: 'paid', es: 'pagadas', fr: 'payants', de: 'bezahlt' },
  freeSuffix:{ pt: '(grátis)', en: '(free)', es: '(gratis)', fr: '(gratuit)', de: '(gratis)' },
  freeCount: { pt: '{n} grátis', en: '{n} free', es: '{n} gratis', fr: '{n} gratuits', de: '{n} gratis' },
  perTrack:  { pt: 'a {p}/música', en: '{p} per track', es: 'a {p}/canción', fr: '{p} par morceau', de: '{p} pro Titel' },
  bestPrice: { pt: 'melhor preço aplicado', en: 'best price applied', es: 'mejor precio aplicado', fr: 'meilleur prix appliqué', de: 'bester Preis angewendet' },
  /* frases com número: cada idioma escreve o substantivo na posição certa —
     encaixar "2 morceaux" numa frase feita dá gramática errada */
  takeMoreOne: { pt: 'podes levar mais {n} música pelo mesmo preço', en: 'you can add {n} more track for the same price',
                 es: 'puedes llevar {n} canción más al mismo precio', fr: 'vous pouvez ajouter {n} morceau de plus au même prix',
                 de: 'du kannst {n} weiteren Titel zum gleichen Preis mitnehmen' },
  takeMoreMany:{ pt: 'podes levar mais {n} músicas pelo mesmo preço', en: 'you can add {n} more tracks for the same price',
                 es: 'puedes llevar {n} canciones más al mismo precio', fr: 'vous pouvez ajouter {n} morceaux de plus au même prix',
                 de: 'du kannst {n} weitere Titel zum gleichen Preis mitnehmen' },
  missingFor:{ pt: 'faltam {n} para {p}/música', en: '{n} more for {p} per track', es: 'faltan {n} para {p}/canción',
               fr: 'encore {n} pour {p} par morceau', de: 'noch {n} für {p} pro Titel' },
  clearSel:  { pt: 'Limpar seleção', en: 'Clear selection', es: 'Limpiar selección', fr: 'Vider la sélection', de: 'Auswahl leeren' },
  buyWa:     { pt: 'Comprar no WhatsApp', en: 'Buy on WhatsApp', es: 'Comprar por WhatsApp', fr: 'Acheter sur WhatsApp', de: 'Über WhatsApp kaufen' },
  introMsg:  { pt: 'Olá! Quero comprar estas faixas:', en: 'Hi! I want to buy these tracks:',
               es: '¡Hola! Quiero comprar estas canciones:', fr: 'Bonjour ! Je souhaite acheter ces morceaux :',
               de: 'Hallo! Ich möchte diese Titel kaufen:' },
  totalWord: { pt: 'Total', en: 'Total', es: 'Total', fr: 'Total', de: 'Gesamt' },
  refWord:   { pt: 'Ref', en: 'Ref', es: 'Ref', fr: 'Réf', de: 'Ref' },
  refLabel:  { pt: 'Ref. {r}', en: 'Ref. {r}', es: 'Ref. {r}', fr: 'Réf. {r}', de: 'Ref. {r}' },
  sentAsk:   { pt: 'Enviaste a encomenda {r}?', en: 'Did you send order {r}?', es: '¿Enviaste el pedido {r}?',
               fr: 'Avez-vous envoyé la commande {r} ?', de: 'Hast du die Bestellung {r} gesendet?' },
  sentYes:   { pt: 'Sim, limpar', en: 'Yes, clear', es: 'Sí, limpiar', fr: 'Oui, vider', de: 'Ja, leeren' },
  sentNo:    { pt: 'Ainda não', en: 'Not yet', es: 'Todavía no', fr: 'Pas encore', de: 'Noch nicht' },
  /* preços */
  pricesTitle:{ pt: 'Preços', en: 'Prices', es: 'Precios', fr: 'Tarifs', de: 'Preise' },
  perTrackUnit:{ pt: '/ música', en: '/ track', es: '/ canción', fr: '/ morceau', de: '/ Titel' },
  tierOne:   { pt: '1 música', en: '1 track', es: '1 canción', fr: '1 morceau', de: '1 Titel' },
  tierFrom:  { pt: 'A partir de {n} músicas', en: 'From {n} tracks', es: 'A partir de {n} canciones',
               fr: 'À partir de {n} morceaux', de: 'Ab {n} Titeln' },

  /* ---- secção Flow ---- */
  flowHomologacao:{ pt:'Homologação', en:'Certification', es:'Homologación', fr:'Homologation', de:'Zulassung' },
  flowTipo:       { pt:'Tipo', en:'Type', es:'Tipo', fr:'Type', de:'Typ' },
  flowListaSimples:{ pt:'Esta família não se divide por níveis — é uma lista simples.',
                     en:'This family is not split by level — it is a simple list.',
                     es:'Esta familia no se divide por niveles — es una lista simple.',
                     fr:'Cette famille ne se divise pas par niveaux — c’est une liste simple.',
                     de:'Diese Familie ist nicht nach Stufen unterteilt — es ist eine einfache Liste.' },
  flowCores:      { pt:'Cores disponíveis', en:'Available colours', es:'Colores disponibles', fr:'Couleurs disponibles', de:'Verfügbare Farben' },
  flowTamanhos:   { pt:'Tamanhos', en:'Sizes', es:'Tallas', fr:'Tailles', de:'Größen' },
  flowVerDetalhes:{ pt:'Ver detalhes', en:'View details', es:'Ver detalles', fr:'Voir les détails', de:'Details ansehen' },
  flowFechar:     { pt:'Fechar', en:'Close', es:'Cerrar', fr:'Fermer', de:'Schließen' },
  flowPedirPreco: { pt:'Pedir preço', en:'Ask for a price', es:'Pedir precio', fr:'Demander le prix', de:'Preis anfragen' },
  flowPedirPrecoWa:{ pt:'Pedir preço no WhatsApp', en:'Ask for a price on WhatsApp', es:'Pedir precio por WhatsApp',
                     fr:'Demander le prix sur WhatsApp', de:'Preis über WhatsApp anfragen' },
  flowPersonalizar:{ pt:'Personalizar cores', en:'Custom colours', es:'Personalizar colores',
                     fr:'Couleurs sur mesure', de:'Farben anpassen' },
  flowMsgCores:   { pt:'Olá! Queria saber sobre cores personalizadas para a {n}.',
                    en:'Hi! I would like to know about custom colours for the {n}.',
                    es:'¡Hola! Quería saber sobre colores personalizados para la {n}.',
                    fr:'Bonjour ! Je voudrais des informations sur les couleurs sur mesure pour la {n}.',
                    de:'Hallo! Ich hätte gerne Informationen zu Sonderfarben für die {n}.' },
  flowMsgPreco:   { pt:'Olá! Queria pedir preço para a {n}.', en:'Hi! I would like a price for the {n}.',
                    es:'¡Hola! Quería pedir precio para la {n}.', fr:'Bonjour ! Je voudrais le prix de la {n}.',
                    de:'Hallo! Ich hätte gerne einen Preis für die {n}.' },
  flowParaQuem:   { pt:'Para quem é', en:'Who it is for', es:'Para quién es', fr:'Pour qui', de:'Für wen' },
  flowPontosFortes:{ pt:'Pontos fortes', en:'Strengths', es:'Puntos fuertes', fr:'Points forts', de:'Stärken' },
  flowIncluido:   { pt:'Vem incluído', en:'Included', es:'Incluido', fr:'Inclus', de:'Im Lieferumfang' },
  flowSpecs:      { pt:'Tamanhos e especificações', en:'Sizes and specifications', es:'Tallas y especificaciones',
                    fr:'Tailles et spécifications', de:'Größen und technische Daten' },
  flowPaginaOficial:{ pt:'Página oficial Flow', en:'Official Flow page', es:'Página oficial Flow',
                      fr:'Page officielle Flow', de:'Offizielle Flow-Seite' },
  /* cabeçalhos da tabela de especificações */
  sTam:      { pt:'Tam.', en:'Size', es:'Talla', fr:'Taille', de:'Größe' },
  sArea:     { pt:'Área plana', en:'Flat area', es:'Área plana', fr:'Surface à plat', de:'Fläche' },
  sAreaProj: { pt:'Área proj.', en:'Proj. area', es:'Área proy.', fr:'Surface proj.', de:'Proj. Fläche' },
  sEnv:      { pt:'Envergadura', en:'Wingspan', es:'Envergadura', fr:'Envergure', de:'Spannweite' },
  sCelulas:  { pt:'Células', en:'Cells', es:'Celdas', fr:'Caissons', de:'Zellen' },
  sAlong:    { pt:'Along.', en:'Aspect ratio', es:'Alarg.', fr:'Allongement', de:'Streckung' },
  sAlongProj:{ pt:'Along. proj.', en:'Proj. AR', es:'Alarg. proy.', fr:'Allong. proj.', de:'Proj. Streckung' },
  sPeso:     { pt:'Peso', en:'Weight', es:'Peso', fr:'Poids', de:'Gewicht' },
  sPtv:      { pt:'PTV', en:'Weight range', es:'PTV', fr:'PTV', de:'Startgewicht' },
  sCarga:    { pt:'Carga máx.', en:'Max load', es:'Carga máx.', fr:'Charge max.', de:'Max. Last' },
  sQueda:    { pt:'Taxa de queda', en:'Descent rate', es:'Tasa de caída', fr:'Taux de chute', de:'Sinkrate' },
  sSusp:     { pt:'Alt. susp.', en:'Susp. height', es:'Alt. susp.', fr:'Haut. susp.', de:'Aufhängung' },
  sAssento:  { pt:'Assento', en:'Seat board', es:'Asiento', fr:'Planchette', de:'Sitzbrett' },
  sPaineis:  { pt:'Painéis', en:'Panels', es:'Paneles', fr:'Panneaux', de:'Bahnen' },
  sHomol:    { pt:'Homologação', en:'Certification', es:'Homologación', fr:'Homologation', de:'Zulassung' }
};
function ui(k, vars) {
  const e = UI[k];
  if (!e) return '';
  let s = e[LOCALE] || e[DEFAULT_LOCALE] || '';
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
}
/* "{n} música/músicas" conforme o número */
function nTracks(n) { return ui(n === 1 ? 'nTrack' : 'nTracks', { n: n }); }

/* hex (#rgb ou #rrggbb) -> {r,g,b}, para alimentar variáveis CSS do scrim */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/* a foto de fundo está ativa se existir E o interruptor "Mostrar foto de fundo"
   não estiver desligado (bgImageVisible !== false) */
function photoActive(sec) {
  return !!sec.bgImage && sec.bgImageVisible !== false;
}

/* fundo fotográfico de secção: foto a preto-e-branco + duotone (camada azul).
   A cor/intensidade do duotone vêm de sec.overlay (editável no CMS); se não
   houver overlay, usa as cores do céu para se manter coerente com o resto.
   overlay.visible === false esconde o duotone (foto fica só a cinzento). */
function buildSectionBg(sec, sky) {
  if (!photoActive(sec)) return null;
  const wrap = el('div', 'section-bg');

  /* escurecer a foto de fundo (0-100%) — útil para igualar o tom do azul
     entre secções cujas fotos têm brilhos diferentes */
  if (typeof sec.bgDarken === 'number' && sec.bgDarken > 0) {
    const dk = Math.max(0, Math.min(100, sec.bgDarken));
    wrap.style.setProperty('--bg-bright', (1.05 * (1 - dk / 100)).toFixed(3));
  }

  const imgD = el('img', 'hide-mobile');
  imgD.src = sec.bgImage; imgD.alt = '';
  wrap.appendChild(imgD);

  const imgM = el('img', 'hide-desktop');
  imgM.src = sec.bgImageMobile || sec.bgImage; imgM.alt = '';
  wrap.appendChild(imgM);

  const ov = sec.overlay;
  if (!ov || ov.visible !== false) {
    const tint = el('div', 'section-bg-tint');
    const top = (ov && ov.color) || (sky && sky[0]) || '#0a3d7a';
    const mid = (ov && ov.color2) || (sky && sky[Math.min(1, sky.length - 1)]) || top;
    tint.style.background = `linear-gradient(180deg, ${top} 0%, ${mid} 100%)`;
    if (ov && typeof ov.intensity === 'number') tint.style.opacity = Math.max(0, Math.min(100, ov.intensity)) / 100;
    wrap.appendChild(tint);
  }
  return wrap;
}

/* faixa de cor sólida no topo de uma secção, que desvanece para transparente —
   garante que a secção "começa" numa cor exata, sem depender do scroll do céu */
function buildTopTint(sec) {
  if (!sec.topTint) return null;
  const d = el('div', 'top-tint');
  d.style.background = `linear-gradient(180deg, ${sec.topTint} 0%, transparent 100%)`;
  return d;
}

/* camada azul em secções SEM foto de fundo: um tom translúcido por cima do céu.
   Usa a mesma cor/intensidade do overlay que comanda o duotone/scrim nas secções
   com foto — assim a "Camada azul" do CMS controla todas as secções de igual modo. */
function buildOverlayTint(sec) {
  const ov = sec.overlay;
  if (!ov || ov.visible === false || photoActive(sec)) return null; // secções com foto tratam-no no duotone
  const c1 = ov.color || '#0a3d7a';
  const c2 = ov.color2 || c1;
  const d = el('div', 'overlay-tint');
  d.style.background = `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
  if (typeof ov.intensity === 'number') d.style.opacity = Math.max(0, Math.min(100, ov.intensity)) / 100;
  return d;
}

function visibilityClass(item) {
  let c = '';
  if (item.showMobile === false) c += ' hide-mobile';
  if (item.showDesktop === false) c += ' hide-desktop';
  return c;
}

/* aplica formatação partilhada (herdada por todos os idiomas) a um texto */
function applyTextFormat(node, fmt) {
  if (!fmt) return;
  if (fmt.bold) node.style.fontWeight = '700';
  if (fmt.italic) node.style.fontStyle = 'italic';
  if (fmt.uppercase) node.style.textTransform = 'uppercase';
  if (typeof fmt.size === 'number' && fmt.size > 0) node.style.fontSize = fmt.size + 'px';
  if (typeof fmt.letterSpacing === 'number') node.style.letterSpacing = fmt.letterSpacing + 'px';
  if (fmt.color && fmt.color !== 'default') {
    const map = { orange: 'var(--orange)', white: '#ffffff', black: 'var(--black)' };
    node.style.color = map[fmt.color] || fmt.color;
  }
}

function buildText(item) {
  let cls = 'content';
  if (item.align === 'right') cls += ' right';
  else if (item.align === 'center') cls += ' center';
  if (item.valign === 'top') cls += ' vtop';
  else if (item.valign === 'bottom') cls += ' vbottom';
  else if (item.valign === 'center') cls += ' vcenter';
  const c = el('div', cls + visibilityClass(item));
  const kicker = t(item.kicker), title1 = t(item.title), title2 = t(item.title2), subtitle = t(item.subtitle);
  if (kicker) { const k = el('span', 'kicker'); k.textContent = kicker; c.appendChild(k); }
  const tag = item.titleTag === 'h1' ? 'h1' : 'h2';
  const title = el(tag, tag === 'h1' ? 'wordmark' : 'title');
  if (title1) title.appendChild(document.createTextNode(title1));
  if (title2) {
    title.appendChild(el('br'));
    if (item.accent2) { const s = el('span'); s.textContent = title2; title.appendChild(s); }
    else title.appendChild(document.createTextNode(title2));
  }
  c.appendChild(title);
  if (subtitle) {
    const p = el('p', 'lead');
    p.textContent = subtitle;
    applyTextFormat(p, item.subtitleFormat);
    c.appendChild(p);
  }

  const trust = t(item.trust);
  if (trust || item.badgeImage) {
    const isLink = !!item.trustHref;
    const tr = el(isLink ? 'a' : 'div', 'trust');
    if (isLink) { tr.href = item.trustHref; tr.target = '_blank'; tr.rel = 'noopener'; }
    if (item.badgeImage) { const bi = el('img'); bi.src = item.badgeImage; bi.alt = ''; tr.appendChild(bi); }
    if (trust) { const sp = el('span'); sp.textContent = trust; tr.appendChild(sp); }
    c.appendChild(tr);
  }

  const buttons = (item.buttons || []).filter(b => b && t(b.label));
  if (buttons.length) {
    const row = el('div', 'btn-row');
    buttons.forEach(b => {
      const a = el('a', 'btn' + (b.variant === 'secondary' ? ' secondary' : ''));
      a.href = b.href || '#'; a.textContent = t(b.label);
      row.appendChild(a);
    });
    c.appendChild(row);
  }
  return c;
}

function applyCommon(wrap, img, item) {
  if (item.rotation) wrap.style.setProperty('--rot', item.rotation + 'deg');
  if (item.floatSpeed) wrap.style.setProperty('--float-speed', item.floatSpeed + 's');
  if (typeof item.opacity === 'number' && item.opacity !== 100) img.style.opacity = item.opacity / 100;
  if (item.shadow === false) img.style.filter = 'none';
  if (item.dim) img.style.filter = 'drop-shadow(0 18px 22px rgba(0,0,0,.4)) brightness(.92)';
  if (typeof item.zIndex === 'number') wrap.style.zIndex = item.zIndex;
  if (typeof item.parallax === 'number' && item.parallax > 0) wrap.dataset.speed = (item.parallax / 100).toFixed(2);
}

function buildCard(card) {
  const d = el('div', 'card');
  const pre = t(card.pre), strong = t(card.strong), sub = t(card.sub);
  if (pre) d.appendChild(document.createTextNode(pre));
  if (strong) { const b = el('b'); b.textContent = strong; d.appendChild(b); }
  if (sub) { const s = el('small'); s.textContent = sub; d.appendChild(s); }
  return d;
}

/* ---- overrides responsivos (mobile) por elemento ----
   item.mobile pode ter { x, y, anchorX, widthVW, widthMax } que só se
   aplicam a ≤760px. Gera-se uma regra CSS com !important para vencer os
   estilos inline do desktop. Deixar vazio = herda o desktop. */
let posSeq = 0;
let responsiveRules = [];
function mobileRule(cls, item, isGround) {
  const m = item.mobile;
  if (!m) return '';
  const d = [];
  if (m.x != null || m.anchorX != null) {
    const anchor = m.anchorX || item.anchorX || (isGround ? 'right' : 'left');
    const x = m.x != null ? m.x : (item.x ?? 0);
    if (anchor === 'right') d.push('right:' + x + '% !important', 'left:auto !important');
    else d.push('left:' + x + '% !important', 'right:auto !important');
  }
  if (!isGround && m.y != null) d.push('top:' + m.y + '% !important');
  if (m.widthVW != null || m.widthMax != null) {
    const vw = m.widthVW != null ? m.widthVW : (item.widthVW || (isGround ? 24 : 30));
    const mx = m.widthMax != null ? m.widthMax : (item.widthMax || (isGround ? 320 : 360));
    d.push('width:min(' + vw + 'vw,' + mx + 'px) !important');
  }
  return d.length ? '@media(max-width:760px){.' + cls + '{' + d.join(';') + '}}' : '';
}

function buildFloatImage(item) {
  const cls = 'm' + (++posSeq);
  const wrap = el('div', 'pilot floaty ' + cls + visibilityClass(item));
  wrap.style.top = (item.y ?? 0) + '%';
  if (item.anchorX === 'right') wrap.style.right = (item.x ?? 0) + '%';
  else wrap.style.left = (item.x ?? 0) + '%';
  wrap.style.width = 'min(' + (item.widthVW || 30) + 'vw,' + px(item.widthMax || 360) + ')';
  const img = el('img'); img.src = item.src; img.alt = t(item.alt); img.style.width = '100%';
  applyCommon(wrap, img, item);
  wrap.appendChild(img);
  if (item.card && item.card.enabled) wrap.appendChild(buildCard(item.card));
  const r = mobileRule(cls, item, false); if (r) responsiveRules.push(r);
  return wrap;
}

function buildGroundImage(item) {
  const cls = 'm' + (++posSeq);
  const wrap = el('div', 'pilot grounded ' + cls + visibilityClass(item));
  if (item.anchorX === 'right') wrap.style.right = (item.x ?? 0) + '%';
  else wrap.style.left = (item.x ?? 0) + '%';
  wrap.style.width = 'min(' + (item.widthVW || 24) + 'vw,' + px(item.widthMax || 320) + ')';
  const img = el('img'); img.src = item.src; img.alt = t(item.alt); img.style.width = '100%';
  applyCommon(wrap, img, item);
  wrap.appendChild(img);
  if (item.card && item.card.enabled) wrap.appendChild(buildCard(item.card));
  const r = mobileRule(cls, item, true); if (r) responsiveRules.push(r);
  return wrap;
}

function buildHeroImage(item) {
  const wrap = el('div', 'hero-pilot floaty' + visibilityClass(item));
  if (typeof item.heightPct === 'number') wrap.style.setProperty('--h', item.heightPct + '%');
  if (typeof item.heightPctMobile === 'number') wrap.style.setProperty('--hm', item.heightPctMobile + '%');
  if (item.floatSpeed) wrap.style.setProperty('--float-speed', item.floatSpeed + 's');
  if (typeof item.parallax === 'number' && item.parallax > 0) wrap.dataset.speed = (item.parallax / 100).toFixed(2);
  const img = el('img'); img.src = item.src; img.alt = t(item.alt);
  if (typeof item.opacity === 'number' && item.opacity !== 100) img.style.opacity = item.opacity / 100;
  wrap.appendChild(img);
  return wrap;
}

/* ---- secção de música (Happy Soaring Music) ----
   Leitor de MP3 próprios, listas verticais por género (com scroll), tabela de
   licenças, aviso legal e CTA de WhatsApp. Tudo vem de content.json / CMS. */
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

function waLink(number, msg) {
  const n = String(number || '').replace(/[^0-9]/g, '');
  const base = 'https://wa.me/' + n;
  const m = t(msg);
  return m ? base + '?text=' + encodeURIComponent(m) : base;
}

function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

function buildMusic(item) {
  const wrap = el('div', 'music' + visibilityClass(item));
  const panel = el('div', 'music-panel');
  wrap.appendChild(panel);
  const num = item.whatsapp;

  /* ---- preços por volume + seleção ("carrinho" leve, sem backend) ---- */
  const pr = item.pricing || {};
  const cur = pr.currency || '€';
  const eur = n => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + cur;
  const tiers = (pr.tiers || []).filter(x => x && typeof x.price === 'number').slice().sort((a, b) => (a.minQty || 0) - (b.minQty || 0));
  const unitFor = c => { let u = tiers.length ? tiers[0].price : 0; tiers.forEach(x => { if (c >= (x.minQty || 1)) u = x.price; }); return c > 0 ? u : 0; };

  /* Preço a pagar por c músicas.
     Como o desconto de escalão se aplica a TODAS as unidades, há quantidades
     em que levar menos sairia mais caro (ex: 13 a 0,75€ = 9,75€, mas 14 a
     0,50€ = 7,00€). Aqui espreitamos as quantidades seguintes e nunca cobramos
     mais do que uma encomenda maior custaria. Assim o preço nunca desce
     quando se acrescenta uma música. */
  function totalFor(c) {
    if (c <= 0) return 0;
    let melhor = c * unitFor(c);
    /* basta olhar até ao maior minQty: daí para a frente o preço só sobe */
    const topo = tiers.reduce((mx, x) => Math.max(mx, x.minQty || 1), 1);
    for (let n = c + 1; n <= topo; n++) melhor = Math.min(melhor, n * unitFor(n));
    return melhor;
  }

  const SELKEY = 'hs-music-sel';
  const sel = { paid: new Set(), free: new Set() };
  let orderCode = null;
  try {
    const s = JSON.parse(localStorage.getItem(SELKEY) || '{}');
    (s.paid || []).forEach(x => sel.paid.add(x)); (s.free || []).forEach(x => sel.free.add(x));
    if (typeof s.code === 'string') orderCode = s.code;
  } catch (e) { }
  const saveSel = () => { try { localStorage.setItem(SELKEY, JSON.stringify({ paid: [...sel.paid], free: [...sel.free], code: orderCode })); } catch (e) { } };

  /* referência da encomenda: HS-AAAAMMDD-XXXX.
     Nasce quando a primeira faixa é marcada e mantém-se até limpar a seleção,
     para que a mensagem de WhatsApp e o ZIP entregue partilhem a mesma ref. */
  function newOrderCode() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    /* alfabeto sem I, O, 0 e 1 — a ref é lida e escrita por pessoas */
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = ''; for (let i = 0; i < 4; i++) r += A[Math.floor(Math.random() * A.length)];
    return 'HS-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
  }

  const PLUS = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
  const TRASH = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 8l1 12h10l1-12"/></svg>';
  const WA_SMALL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.7 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.3.5.4.1.2.1.6-.1 1.3z"/></svg>';

  const availNames = new Set();
  const selCount = el('span');
  let mode = 'all', genreSel = 'all', searchQ = '';
  let flatBody = null;
  let refreshSelAll = () => { };   /* atribuído quando os controlos são criados */

  /* barra de total (fixa em baixo, só aparece quando há seleção) */
  const cart = el('div', 'music-cart');
  const cInfo = el('div', 'music-cart-info');
  const cTotal = el('div', 'music-cart-total');
  const cSub = el('div', 'music-cart-sub');
  const cRef = el('div', 'music-cart-ref');
  cInfo.appendChild(cTotal); cInfo.appendChild(cSub); cInfo.appendChild(cRef);
  const cNudge = el('div', 'music-cart-nudge');
  const cBuy = el('a', 'music-cart-buy'); cBuy.target = '_blank'; cBuy.rel = 'noopener';
  cBuy.innerHTML = WA_SMALL; const cBuyLbl = el('span'); cBuyLbl.textContent = t(pr.buyLabel) || ui('buyWa'); cBuy.appendChild(cBuyLbl);
  const cClear = el('button', 'music-cart-clear'); cClear.type = 'button'; cClear.setAttribute('aria-label', ui('clearSel')); cClear.innerHTML = TRASH;
  /* depois de abrir o WhatsApp não há forma de saber se a mensagem foi mesmo
     enviada — o site não tem acesso a isso. Por isso perguntamos ao regressar,
     em vez de limpar às cegas e arriscar deitar fora a seleção de quem desistiu. */
  const cAsk = el('div', 'music-cart-ask');
  const cAskTxt = el('span', 'music-cart-ask-txt');
  const cYes = el('button', 'music-cart-yes'); cYes.type = 'button'; cYes.textContent = ui('sentYes');
  const cNo = el('button', 'music-cart-no'); cNo.type = 'button'; cNo.textContent = ui('sentNo');
  cAsk.appendChild(cAskTxt); cAsk.appendChild(cYes); cAsk.appendChild(cNo);
  cart.appendChild(cInfo); cart.appendChild(cNudge); cart.appendChild(cBuy); cart.appendChild(cClear);
  cart.appendChild(cAsk);
  panel.appendChild(cart);

  let aguardaEnvio = null;
  cBuy.addEventListener('click', () => { aguardaEnvio = orderCode || '—'; });
  function perguntaSeEnviou() {
    if (!aguardaEnvio) return;
    if (sel.paid.size + sel.free.size === 0) { aguardaEnvio = null; return; }
    cAskTxt.textContent = ui('sentAsk', { r: aguardaEnvio });
    cart.classList.add('asking');
  }
  window.addEventListener('focus', perguntaSeEnviou);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) perguntaSeEnviou(); });
  cYes.addEventListener('click', () => {
    aguardaEnvio = null; cart.classList.remove('asking');
    sel.paid.clear(); sel.free.clear(); orderCode = null; saveSel();
    syncRows(); refresh(); applyFilter();
  });
  cNo.addEventListener('click', () => { aguardaEnvio = null; cart.classList.remove('asking'); });

  function refresh() {
    const c = sel.paid.size, f = sel.free.size;
    const total = totalFor(c);
    /* preço unitário efetivo: pode ser melhor que o do escalão, quando o total
       ficou limitado pelo preço de uma encomenda maior */
    const u = c ? total / c : 0;
    const n = c + f;
    /* gera a ref quando a encomenda começa; apaga-a quando o carrinho esvazia */
    if (n > 0 && !orderCode) { orderCode = newOrderCode(); saveSel(); }
    else if (n === 0 && orderCode) { orderCode = null; saveSel(); }

    cart.classList.toggle('show', n > 0);
    cTotal.textContent = nTracks(n) + ' · ' + eur(total);
    const limitado = c > 0 && total < c * unitFor(c) - 0.001;   /* preço travado por uma encomenda maior */
    cSub.textContent = c
      ? ((limitado ? ui('bestPrice') : ui('perTrack', { p: eur(u) })) + (f ? (' · ' + ui('freeCount', { n: f })) : ''))
      : (f ? ui('freeCount', { n: f }) : '');
    cRef.textContent = orderCode ? ui('refLabel', { r: orderCode }) : '';

    /* incentivo: se o preço está travado, o cliente pode levar mais faixas
       sem pagar nada a mais — é a informação mais útil que lhe podemos dar */
    let nudge = '';
    if (limitado) {
      let extra = 0;
      while (totalFor(c + extra + 1) <= total + 0.001) extra++;
      if (extra > 0) nudge = ui(extra === 1 ? 'takeMoreOne' : 'takeMoreMany', { n: extra });
    } else {
      for (const x of tiers) { if (c > 0 && c < (x.minQty || 0)) { nudge = ui('missingFor', { n: x.minQty - c, p: eur(x.price) }); break; } }
    }
    cNudge.textContent = nudge; cNudge.style.display = nudge ? '' : 'none';

    /* mensagem: uma faixa por linha (legível no WhatsApp e sem ambiguidade a ler,
       mesmo que um nome tenha vírgulas) */
    const lines = [...sel.paid].map(x => '• ' + x)
      .concat([...sel.free].map(x => '• ' + x + ' ' + ui('freeSuffix')));
    const intro = t(pr.intro) || ui('introMsg');
    /* o total tem de bater certo com o nº de linhas listadas: se disser
       "3 músicas" mas listar 5, quem recebe a encomenda fica sem saber o que enviar */
    let resumo;
    if (!f) resumo = nTracks(n);
    else if (!c) resumo = ui(n === 1 ? 'nFreeOne' : 'nFreeMany', { n: n });
    else resumo = ui('mixed', { n: n, c: c, f: f, pag: ui(c === 1 ? 'paidOne' : 'paidMany') });
    const msg = intro + '\n' + lines.join('\n') +
      '\n\n' + ui('totalWord') + ': ' + resumo + ' · ' + eur(total) +
      (orderCode ? ('\n' + ui('refWord') + ': ' + orderCode) : '');
    cBuy.href = waLink(num, msg);
    selCount.textContent = '(' + n + ')';
  }
  function applyFilter() {
    if (!flatBody) return;
    flatBody.querySelectorAll('.music-track').forEach(r => {
      const okL = mode === 'all' || (mode === 'sel' ? r.classList.contains('sel') : r.dataset.lang === mode);
      const okG = genreSel === 'all' || r.dataset.genre === genreSel;
      const okQ = !searchQ || (r.dataset.nm || '').indexOf(searchQ) >= 0;
      r.classList.toggle('mfhide', !(okL && okG && okQ));
    });
    refreshSelAll();
  }
  /* põe todas as linhas de acordo com a seleção guardada */
  function syncRows() {
    if (!flatBody) return;
    flatBody.querySelectorAll('.music-track').forEach(r => {
      const b = r.querySelector('.music-add');
      if (!b) return;
      const on = (b.dataset.free === '1' ? sel.free : sel.paid).has(r.dataset.id);
      r.classList.toggle('sel', on);
      b.innerHTML = on ? CHECK : PLUS;
    });
  }
  cClear.addEventListener('click', () => {
    sel.paid.clear(); sel.free.clear(); saveSel();
    syncRows(); refresh(); applyFilter();
  });

  /* botões no topo da área das listas (laranja) — contacto por WhatsApp */
  if (item.buttons && item.buttons.length) {
    const tb = el('div', 'music-topbtns');
    item.buttons.forEach(b => {
      if (!b || !t(b.label)) return;
      const a = el('a', 'music-btn primary');
      a.textContent = t(b.label);
      a.href = b.href ? b.href : waLink(num, b.waMessage);
      a.target = '_blank'; a.rel = 'noopener';
      tb.appendChild(a);
    });
    if (tb.children.length) panel.appendChild(tb);
  }

  /* áudio partilhado + barra "a tocar agora" */
  const audio = el('audio'); audio.preload = 'none';
  const np = el('div', 'music-np');
  const npThumb = el('div', 'music-np-thumb'); npThumb.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3z"/></svg>';
  const npBtn = el('button', 'music-np-btn'); npBtn.type = 'button'; npBtn.setAttribute('aria-label', ui('playPause')); npBtn.innerHTML = ICON_PLAY;
  const npMid = el('div', 'music-np-mid');
  const npTitle = el('div', 'music-np-title'); npTitle.textContent = '—';
  const npBar = el('div', 'music-np-bar'); const npFill = el('div', 'music-np-fill'); npBar.appendChild(npFill);
  npMid.appendChild(npTitle); npMid.appendChild(npBar);
  const npTime = el('span', 'music-np-time'); npTime.textContent = '0:00 / 0:00';
  np.appendChild(npThumb); np.appendChild(npBtn); np.appendChild(npMid); np.appendChild(npTime);
  np.appendChild(audio);
  panel.appendChild(np);

  const state = { btn: null };
  function setIcon(btn, playing) { if (btn) btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; }
  audio.addEventListener('play', () => { setIcon(state.btn, true); setIcon(npBtn, true); });
  audio.addEventListener('pause', () => { setIcon(state.btn, false); setIcon(npBtn, false); });
  audio.addEventListener('timeupdate', () => {
    const d = audio.duration;
    npFill.style.width = (d ? (audio.currentTime / d * 100) : 0) + '%';
    npTime.textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(d || 0);
  });
  /* ao acabar, passa à faixa seguinte VISÍVEL (respeita os filtros ativos),
     para se poder explorar a lista sem estar sempre a clicar */
  audio.addEventListener('ended', () => {
    setIcon(state.btn, false); npFill.style.width = '0%';
    if (!flatBody || !state.btn) return;
    const linhas = [...flatBody.querySelectorAll('.music-track:not(.mfhide)')];
    const atual = state.btn.closest('.music-track');
    const i = linhas.indexOf(atual);
    if (i < 0 || i + 1 >= linhas.length) return;      /* era a última: pára */
    const prox = linhas[i + 1].querySelector('.music-pl');
    if (prox) { prox.click(); linhas[i + 1].scrollIntoView({ block: 'nearest' }); }
  });
  npBtn.addEventListener('click', () => { if (!audio.src) return; audio.paused ? audio.play().catch(() => {}) : audio.pause(); });
  npBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = npBar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
  });

  function playTrack(track, genreName, btn, name) {
    if (state.btn === btn) { audio.paused ? audio.play().catch(() => {}) : audio.pause(); return; }
    setIcon(state.btn, false);
    state.btn = btn;
    audio.src = track.file || '';
    npTitle.innerHTML = '';
    npTitle.appendChild(document.createTextNode(name + ' '));
    const g = el('span'); g.textContent = '· ' + genreName; npTitle.appendChild(g);
    audio.play().catch(() => {});
  }

  /* filtro por idioma: Todas / Português / Inglês */
  const filter = el('div', 'music-filter');
  const fdefs = [['all', ui('fAll')], ['pt', ui('fPt')], ['en', ui('fEn')], ['inst', ui('fInst')]];
  const fbtns = [];
  fdefs.forEach(([f, label]) => {
    const b = el('button', 'music-fbtn' + (f === 'all' ? ' on' : '')); b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => { mode = f; fbtns.forEach(x => x.classList.remove('on')); b.classList.add('on'); applyFilter(); });
    fbtns.push(b); filter.appendChild(b);
  });
  panel.appendChild(filter);

  /* lista única de faixas (cada uma com o seu género) */
  const allTracks = (item.tracks || []).filter(tr => tr && tr.name && tr.file);

  /* controlos: combo de géneros (antes) + pesquisa */
  const controls = el('div', 'music-controls');
  const gsel = el('select', 'music-gsel'); gsel.setAttribute('aria-label', ui('filterGenre'));
  const optAll = el('option'); optAll.value = 'all'; optAll.textContent = ui('allGenres'); gsel.appendChild(optAll);
  const genreNames = [];
  allTracks.forEach(tr => { const g = (tr.genre || '').trim(); if (g && genreNames.indexOf(g) < 0) genreNames.push(g); });
  genreNames.forEach(g => { const o = el('option'); o.value = g; o.textContent = g; gsel.appendChild(o); });
  gsel.addEventListener('change', () => { genreSel = gsel.value; applyFilter(); });
  const search = el('input', 'music-search'); search.type = 'text'; search.placeholder = ui('search'); search.setAttribute('aria-label', ui('searchAria'));
  search.addEventListener('input', () => { searchQ = search.value.toLowerCase().trim(); applyFilter(); });
  /* marcar / desmarcar todas as faixas visíveis (respeita os filtros ativos) */
  const selAll = el('button', 'music-selall'); selAll.type = 'button';
  const setSelAllLabel = () => {
    const rows = flatBody ? [...flatBody.querySelectorAll('.music-track:not(.mfhide)')] : [];
    const allOn = rows.length > 0 && rows.every(r => r.classList.contains('sel'));
    selAll.textContent = allOn ? ui('deselectAll') : ui('selectAll');
    selAll.dataset.on = allOn ? '1' : '0';
  };
  selAll.addEventListener('click', () => {
    const rows = [...flatBody.querySelectorAll('.music-track:not(.mfhide)')];
    const turnOn = selAll.dataset.on !== '1';
    rows.forEach(r => {
      const b = r.querySelector('.music-add');
      const s = b.dataset.free === '1' ? sel.free : sel.paid;
      if (turnOn) s.add(r.dataset.id); else s.delete(r.dataset.id);
    });
    saveSel(); syncRows(); refresh(); applyFilter();
  });
  refreshSelAll = setSelAllLabel;
  controls.appendChild(gsel); controls.appendChild(search); controls.appendChild(selAll);
  panel.appendChild(controls);

  /* uma lista única com todas as faixas DISPONÍVEIS (com ficheiro), altura fixa + scroll */
  const listbox = el('div', 'music-listbox music-flat');
  const colhead = el('div', 'music-colhead');
  ['', ui('colTrack'), ui('colLang'), ui('colGenre'), ui('colLength'), ''].forEach((h, i) => {
    const c = el('span'); c.textContent = h;
    if (i === 2 || i === 3) c.style.textAlign = 'center';
    if (i === 4) c.style.textAlign = 'right';
    colhead.appendChild(c);
  });
  listbox.appendChild(colhead);
  flatBody = el('div', 'music-flatbody');
  if (typeof item.listHeight === 'number' && item.listHeight > 0) flatBody.style.maxHeight = 'min(' + item.listHeight + 'px, 62vh)';
  allTracks.forEach(track => {
    const id = track.name || '';
    availNames.add(id);
    const isFree = track.free === true;
    const lang = track.lang || 'inst';
    const genre = (track.genre || '').trim();
    const row = el('div', 'music-track');
    row.dataset.lang = lang; row.dataset.genre = genre; row.dataset.nm = id.toLowerCase(); row.dataset.id = id;
    const b = el('button', 'music-pl'); b.type = 'button'; b.setAttribute('aria-label', ui('play', { n: id })); b.innerHTML = ICON_PLAY;
    const nm = el('span', 'music-nm'); nm.textContent = id;
    if (isFree) { const fb = el('span', 'music-free'); fb.textContent = ui('free'); nm.appendChild(fb); }
    const lg = el('span', 'music-lang ' + lang); lg.textContent = ({ pt: 'PT', en: 'EN', inst: 'INST' })[lang] || lang;
    const gn = el('span', genre ? 'music-gen' : ''); gn.textContent = genre;
    /* duração: o que se ouve é um excerto; o que se compra é a música completa.
       A duração do excerto vem do nome do ficheiro (…preview-00m32s.mp3). */
    const du = el('span', 'music-dur');
    const pm = String(track.file || '').match(/preview-(?:com-voz-|instrumental-)?(\d+)m(\d+)s/);
    const tot = el('span', 'music-dur-tot'); tot.textContent = track.duration || '';
    du.appendChild(tot);
    if (pm) {
      const exc = el('span', 'music-dur-exc');
      exc.textContent = ui('excerpt', { e: parseInt(pm[1], 10) + ':' + pm[2] });
      du.appendChild(exc);
      du.title = ui('excerptTip', { e: parseInt(pm[1], 10) + ':' + pm[2], t: track.duration || '' });
    }
    const add = el('button', 'music-add'); add.type = 'button'; add.dataset.free = isFree ? '1' : '0';
    add.setAttribute('aria-label', ui(isFree ? 'markFree' : 'markBuy', { n: id }));
    const setAdd = () => { const on = (isFree ? sel.free : sel.paid).has(id); add.innerHTML = on ? CHECK : PLUS; row.classList.toggle('sel', on); };
    add.addEventListener('click', () => { const s = isFree ? sel.free : sel.paid; if (s.has(id)) s.delete(id); else s.add(id); setAdd(); saveSel(); refresh(); applyFilter(); });
    setAdd();
    b.addEventListener('click', () => playTrack(track, genre, b, id));
    row.appendChild(b); row.appendChild(nm); row.appendChild(lg); row.appendChild(gn); row.appendChild(du); row.appendChild(add);
    flatBody.appendChild(row);
  });
  listbox.appendChild(flatBody);
  panel.appendChild(listbox);
  applyFilter();

  /* limpa da seleção guardada as faixas que já não estão disponíveis */
  [...sel.paid].forEach(id => { if (!availNames.has(id)) sel.paid.delete(id); });
  [...sel.free].forEach(id => { if (!availNames.has(id)) sel.free.delete(id); });
  saveSel();

  /* rodapé compacto: preços (esquerda) + CTA WhatsApp (direita), aviso legal por baixo */
  const foot = el('div', 'music-foot');

  /* escalões de preço — chips inline para poupar altura */
  if (tiers.length) {
    const pcol = el('div', 'music-foot-prices');
    const lt = el('span', 'music-foot-title'); lt.textContent = t(pr.title) || ui('pricesTitle'); pcol.appendChild(lt);
    tiers.forEach(x => {
      const chip = el('span', 'music-pchip');
      const lb = el('span', 'music-pchip-q'); lb.textContent = (x.minQty <= 1 ? '1' : x.minQty + '+');
      const price = el('span', 'music-pchip-p'); price.textContent = eur(x.price);
      if (x.price === 0) price.classList.add('is-free');
      chip.appendChild(lb); chip.appendChild(price);
      pcol.appendChild(chip);
    });
    const unit = el('span', 'music-foot-unit'); unit.textContent = ui('perTrackUnit'); pcol.appendChild(unit);
    foot.appendChild(pcol);
  }

  /* CTA + WhatsApp (compacto, à direita) */
  if (item.cta && (t(item.cta.title) || t(item.cta.buttonLabel))) {
    const cta = el('div', 'music-cta');
    const ct = el('div', 'music-cta-txt');
    if (t(item.cta.title)) { const c1 = el('div', 'music-cta-title'); c1.textContent = t(item.cta.title); ct.appendChild(c1); }
    if (t(item.cta.text)) { const c2 = el('div', 'music-cta-text'); c2.textContent = t(item.cta.text); ct.appendChild(c2); }
    cta.appendChild(ct);
    const wa = el('a', 'music-wa'); wa.href = waLink(num, item.cta.waMessage); wa.target = '_blank'; wa.rel = 'noopener';
    wa.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.7 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.3.5.4.1.2.1.6-.1 1.3z"/></svg>';
    const label = el('span'); label.textContent = t(item.cta.buttonLabel) || 'WhatsApp'; wa.appendChild(label);
    cta.appendChild(wa);
    foot.appendChild(cta);
  }
  panel.appendChild(foot);

  /* aviso legal — linha fina por baixo do rodapé */
  const legal = t(item.legal);
  if (legal) { const lp = el('p', 'music-legal'); lp.textContent = legal; panel.appendChild(lp); }

  refresh();
  return wrap;
}

/* ---- secção Flow Paragliders ----
   Uma lista única de produtos. Cada família escolhe o seu próprio eixo de
   classificação (os parapentes usam a escada EN, os parakites não), e só
   ganha filtros quando tem mais do que uma classificação.
   O detalhe abre dentro da grelha, a toda a largura, por baixo da linha do
   cartão — em vez de uma gaveta que tapava o catálogo. */
const ICON_EXT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 14 20 4M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.7 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.3.5.4.1.2.1.6-.1 1.3z"/></svg>';

/* cores do desenho de recurso, para modelos ainda sem foto */
const FLOW_COLORS = ['#2b6cff', '#ff7a1a', '#22c55e', '#c026d3', '#eab308', '#0ea5e9', '#ef4444', '#38bdf8', '#a3e635', '#7c3aed', '#e11d48', '#14b8a6'];
const FOTO_CORES = {
  azul: '#1f6fc0', laranja: '#ff7a1a', vermelho: '#e03131', lima: '#a3e635', roxo: '#7c3aed',
  teal: '#17a2a2', preto: '#22262b', branco: '#e8eef5', amarelo: '#facc15', rosa: '#ec4899',
  lilac: '#7c3aed', lime: '#a3e635', yellow: '#facc15', maui: '#17a2a2', sunrise: '#ff7a1a',
  blue: '#1f6fc0', red: '#e03131', white: '#e8eef5', pink: '#ec4899', orange: '#ff7a1a'
};
const corHex = c => FOTO_CORES[String(c).toLowerCase()] || '#9bb4cf';
const slugProd = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const chaveFoto = n => String(n).toLowerCase().replace(/[^a-z0-9]/g, '');
const fotoSrc = (nome, cor, card) =>
  'images/asas/' + chaveFoto(nome) + '__' + cor + (card ? '-card' : '') + '.webp';

/* desenho de recurso para quem ainda não tem foto */
function asaPlaceholder(i) {
  const c = k => FLOW_COLORS[(i * 3 + k) % FLOW_COLORS.length];
  return '<svg viewBox="0 0 300 150" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M18 96 Q150 20 282 96 Q150 62 18 96Z" fill="' + c(0) + '"/>' +
    '<path d="M40 108 Q150 44 260 108 Q150 80 40 108Z" fill="' + c(1) + '" opacity=".95"/>' +
    '<path d="M64 120 Q150 66 236 120 Q150 98 64 120Z" fill="' + c(2) + '" opacity=".9"/></svg>';
}

function buildFlow(item) {
  const wrap = el('div', 'flow' + visibilityClass(item));
  const num = item.whatsapp;
  const produtos = (item.produtos || []).filter(p => p && p.nome && p.visible !== false);

  /* cabeçalho */
  const head = el('div', 'flow-head');
  const dl = t(item.dealerLabel);
  if (dl) { const d = el('div', 'flow-dealer'); d.textContent = dl; head.appendChild(d); }
  if (item.logoImage) { const img = el('img', 'flow-logo'); img.src = item.logoImage; img.alt = 'Flow Paragliders'; head.appendChild(img); }
  const titulo = t(item.title);
  if (titulo) { const h = el('h2', 'flow-title'); h.textContent = titulo; head.appendChild(h); }
  const desc = t(item.description);
  if (desc) { const p = el('p', 'flow-desc'); p.textContent = desc; head.appendChild(p); }
  wrap.appendChild(head);

  if (!produtos.length) return wrap;

  /* famílias, pela ordem em que aparecem; eixo só se houver >1 classificação */
  const familias = [];
  produtos.forEach(p => { if (familias.indexOf(p.familia) < 0) familias.push(p.familia); });
  const eixoDe = fam => {
    const cls = [];
    produtos.filter(p => p.familia === fam).forEach(p => {
      if (p.classificacao && cls.indexOf(p.classificacao) < 0) cls.push(p.classificacao);
    });
    return cls.length > 1 ? cls : null;
  };

  let famAtiva = familias[0], filtro = null, aberto = null;

  const barraFam = el('div', 'flow-fams');
  const barraFiltros = el('div', 'flow-filters');
  const grelha = el('div', 'flow-grid');
  wrap.appendChild(barraFam); wrap.appendChild(barraFiltros); wrap.appendChild(grelha);

  /* link partilhável: #produtos/<asa> abre já nessa asa */
  const m = (location.hash || '').match(/^#produtos\/(.+)$/);
  if (m) {
    const p = produtos.filter(x => slugProd(x.nome) === m[1])[0];
    if (p) { aberto = p; famAtiva = p.familia; }
  }

  function visiveis() {
    return produtos.filter(p => p.familia === famAtiva && (!filtro || p.classificacao === filtro));
  }

  function renderFams() {
    barraFam.innerHTML = '';
    familias.forEach(f => {
      const b = el('button', 'flow-fam' + (f === famAtiva ? ' on' : '')); b.type = 'button';
      b.appendChild(document.createTextNode(f + ' '));
      const n = el('span', 'flow-fam-n'); n.textContent = produtos.filter(p => p.familia === f).length;
      b.appendChild(n);
      b.addEventListener('click', () => {
        famAtiva = f; filtro = null; aberto = null; limparHash(); render();
      });
      barraFam.appendChild(b);
    });
  }
  function renderFiltros() {
    barraFiltros.innerHTML = '';
    const cls = eixoDe(famAtiva);
    if (!cls) {
      const s = el('span', 'flow-filters-none'); s.textContent = ui('flowListaSimples');
      barraFiltros.appendChild(s); return;
    }
    const lab = el('span', 'flow-filters-label');
    lab.textContent = famAtiva === 'Parapentes' ? ui('flowHomologacao') : ui('flowTipo');
    barraFiltros.appendChild(lab);
    [[null, ui('fAll')]].concat(cls.map(c => [c, c])).forEach(([v, txt]) => {
      const b = el('button', 'flow-chip' + (filtro === v ? ' on' : '')); b.type = 'button';
      b.textContent = txt;
      b.addEventListener('click', () => { filtro = v; aberto = null; limparHash(); render(); });
      barraFiltros.appendChild(b);
    });
  }

  function cartao(p, i) {
    const c = el('article', 'flow-card' + (p === aberto ? ' aberta' : ''));
    const shot = el('div', 'flow-shot');
    const img = el('div', 'flow-shot-img');
    img.innerHTML = p.cores && p.cores.length ? imgTag(p, p.cores[0], true) : asaPlaceholder(i);
    shot.appendChild(img); c.appendChild(shot);

    const body = el('div', 'flow-body');
    const nome = el('div', 'flow-name'); nome.textContent = p.nome; body.appendChild(nome);
    if (p.classificacao) { const cl = el('div', 'flow-clas'); cl.textContent = p.classificacao; body.appendChild(cl); }
    const tag = t(p.tagline);
    if (tag) { const tl = el('div', 'flow-tagline'); tl.textContent = tag; body.appendChild(tl); }

    if (p.cores && p.cores.length) {
      const box = el('div');
      const l = el('div', 'flow-lbl'); l.textContent = ui('flowCores'); box.appendChild(l);
      const sws = el('div', 'flow-swatches');
      p.cores.forEach((cor, j) => {
        const b = el('button', 'flow-sw' + (j === 0 ? ' on' : '')); b.type = 'button';
        b.style.background = corHex(cor); b.title = cor;
        b.setAttribute('aria-label', cor);
        b.addEventListener('click', ev => {
          ev.stopPropagation();
          sws.querySelectorAll('.flow-sw').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          img.innerHTML = imgTag(p, cor, true);
        });
        sws.appendChild(b);
      });
      box.appendChild(sws); body.appendChild(box);
    }
    if ((p.tamanhos || []).length) {
      const box = el('div');
      const l = el('div', 'flow-lbl'); l.textContent = ui('flowTamanhos'); box.appendChild(l);
      const ts = el('div', 'flow-sizes');
      p.tamanhos.forEach(s => { const x = el('span', 'flow-size'); x.textContent = s; ts.appendChild(x); });
      box.appendChild(ts); body.appendChild(box);
    }

    const acoes = el('div', 'flow-actions');
    const ver = el('button', 'flow-btn'); ver.type = 'button';
    ver.textContent = p === aberto ? ui('flowFechar') : ui('flowVerDetalhes');
    const preco = el('a', 'flow-btn primary'); preco.target = '_blank'; preco.rel = 'noopener';
    preco.textContent = ui('flowPedirPreco');
    preco.href = waLink(num, ui('flowMsgPreco', { n: p.nome }));
    preco.addEventListener('click', ev => ev.stopPropagation());
    acoes.appendChild(ver); acoes.appendChild(preco);
    body.appendChild(acoes);
    c.appendChild(body);

    c.addEventListener('click', () => {
      const abriuAgora = p !== aberto;
      aberto = abriuAgora ? p : null;
      sincronizaHash(); render();
      if (abriuAgora) irParaDetalhe();
    });
    return c;
  }
  function imgTag(p, cor, card) {
    return '<img src="' + fotoSrc(p.nome, cor, card) + '" alt="' + p.nome + ' ' + cor + '" loading="lazy">';
  }

  function detalhe(p) {
    /* div, não section: o site tem uma regra global para <section>
       (display:flex, min-height:100vh) que destruiria este layout */
    const d = el('div', 'flow-det'); d.id = 'flow-det';
    const top = el('div', 'flow-det-top');
    const tit = el('div');
    const n = el('div', 'flow-det-name'); n.textContent = p.nome;
    const s = el('div', 'flow-det-sub'); s.textContent = p.familia + (p.classificacao ? ' · ' + p.classificacao : '');
    tit.appendChild(n); tit.appendChild(s);
    const x = el('button', 'flow-det-x'); x.type = 'button'; x.innerHTML = '&#10005;';
    x.setAttribute('aria-label', ui('flowFechar'));
    x.addEventListener('click', ev => { ev.stopPropagation(); aberto = null; sincronizaHash(); render(); });
    top.appendChild(tit); top.appendChild(x); d.appendChild(top);

    const cols = el('div', 'flow-det-cols');

    /* coluna esquerda: foto, cores, especificações */
    const esq = el('div');
    const foto = el('div', 'flow-det-foto');
    foto.innerHTML = p.cores && p.cores.length ? imgTag(p, p.cores[0], false) : asaPlaceholder(produtos.indexOf(p));
    esq.appendChild(foto);
    if (p.cores && p.cores.length) {
      const box = el('div', 'flow-det-cores');
      const l = el('div', 'flow-lbl'); l.textContent = ui('flowCores'); box.appendChild(l);
      const sws = el('div', 'flow-swatches');
      p.cores.forEach((cor, j) => {
        const b = el('button', 'flow-sw' + (j === 0 ? ' on' : '')); b.type = 'button';
        b.style.background = corHex(cor); b.title = cor; b.setAttribute('aria-label', cor);
        b.addEventListener('click', ev => {
          ev.stopPropagation();
          sws.querySelectorAll('.flow-sw').forEach(y => y.classList.remove('on'));
          b.classList.add('on');
          foto.innerHTML = imgTag(p, cor, false);
        });
        sws.appendChild(b);
      });
      box.appendChild(sws); esq.appendChild(box);
    }
    if ((p.specs || []).length) {
      const h = el('div', 'flow-det-h'); h.textContent = ui('flowSpecs'); esq.appendChild(h);
      const chaves = [['areaPlana', ui('sArea')], ['areaProjetada', ui('sAreaProj')], ['envergadura', ui('sEnv')],
        ['celulas', ui('sCelulas')], ['alongamento', ui('sAlong')], ['alongamentoProjetado', ui('sAlongProj')],
        ['pesoAsa', ui('sPeso')], ['ptv', ui('sPtv')], ['cargaMax', ui('sCarga')], ['taxaQueda', ui('sQueda')],
        ['alturaSuspensao', ui('sSusp')], ['assento', ui('sAssento')], ['paineis', ui('sPaineis')],
        ['homologacao', ui('sHomol')]];
      const usadas = chaves.filter(k => p.specs.some(sp => sp[k[0]] !== undefined));
      const scroll = el('div', 'flow-tablewrap');
      const tb = el('table', 'flow-specs');
      let html = '<thead><tr><th>' + ui('sTam') + '</th>' + usadas.map(k => '<th>' + k[1] + '</th>').join('') + '</tr></thead><tbody>';
      p.specs.forEach(sp => {
        html += '<tr><td><b>' + (sp.tamanho || '') + '</b></td>' +
          usadas.map(k => '<td>' + (sp[k[0]] !== undefined ? sp[k[0]] : '—') + '</td>').join('') + '</tr>';
      });
      tb.innerHTML = html + '</tbody>';
      scroll.appendChild(tb); esq.appendChild(scroll);
    }
    cols.appendChild(esq);

    /* coluna direita: texto e ações */
    const dir = el('div');
    const dsc = t(p.descricao);
    if (dsc) { const q = el('p', 'flow-det-desc'); q.textContent = dsc; dir.appendChild(q); }
    const pq = t(p.paraQuem);
    if (pq) dir.appendChild(feature(ICON_PESSOA, ui('flowParaQuem'), pq));
    const fortes = (p.pontosFortes || []).map(t).filter(Boolean);
    if (fortes.length) dir.appendChild(feature(ICON_ESTRELA, ui('flowPontosFortes'), '· ' + fortes.join('\n· '), true));
    const inc = t(p.incluido);
    if (inc) {
      const h = el('div', 'flow-det-h'); h.textContent = ui('flowIncluido'); dir.appendChild(h);
      const q = el('p', 'flow-det-desc'); q.textContent = inc; dir.appendChild(q);
    }
    const av = t(p.aviso);
    if (av) { const q = el('p', 'flow-aviso'); q.textContent = '⚠ ' + av; dir.appendChild(q); }

    const acoes = el('div', 'flow-det-acoes');
    const wa = el('a', 'flow-big wa'); wa.target = '_blank'; wa.rel = 'noopener';
    wa.href = waLink(num, ui('flowMsgPreco', { n: p.nome }));
    wa.innerHTML = ICON_WA; const wl = el('span'); wl.textContent = ui('flowPedirPrecoWa'); wa.appendChild(wl);
    acoes.appendChild(wa);
    /* cores à medida: até haver editor próprio, abre o WhatsApp com o pedido */
    const cc = el('a', 'flow-big custom'); cc.target = '_blank'; cc.rel = 'noopener';
    cc.href = waLink(num, ui('flowMsgCores', { n: p.nome }));
    cc.innerHTML = ICON_PALETA; const cl = el('span'); cl.textContent = ui('flowPersonalizar'); cc.appendChild(cl);
    acoes.appendChild(cc);
    if (p.flowHref) {
      const of = el('a', 'flow-big'); of.href = p.flowHref; of.target = '_blank'; of.rel = 'noopener';
      of.innerHTML = ICON_EXT; const ol = el('span'); ol.textContent = ui('flowPaginaOficial'); of.appendChild(ol);
      acoes.appendChild(of);
    }
    dir.appendChild(acoes);
    const nota = t(item.customColourNote);
    if (nota) { const q = el('p', 'flow-nota'); q.textContent = nota; dir.appendChild(q); }
    cols.appendChild(dir);

    d.appendChild(cols);
    d.addEventListener('click', ev => ev.stopPropagation());
    return d;
  }
  function feature(icone, titulo, texto, multilinha) {
    const f = el('div', 'flow-feat');
    const i = el('span', 'flow-feat-ico'); i.innerHTML = icone;
    const b = el('div');
    const h = el('b'); h.textContent = titulo;
    const p = el('p'); p.textContent = texto;
    if (multilinha) p.style.whiteSpace = 'pre-line';
    b.appendChild(h); b.appendChild(p);
    f.appendChild(i); f.appendChild(b);
    return f;
  }

  function colunas() {
    const g = getComputedStyle(grelha).gridTemplateColumns;
    return g.split(' ').filter(Boolean).length || 1;
  }
  function renderGrelha() {
    grelha.innerHTML = '';
    const lista = visiveis();
    lista.forEach((p, i) => grelha.appendChild(cartao(p, produtos.indexOf(p))));
    if (aberto && lista.indexOf(aberto) >= 0) {
      const pos = lista.indexOf(aberto), cols = colunas();
      const fim = Math.min(Math.floor(pos / cols) * cols + cols - 1, lista.length - 1);
      grelha.children[fim].insertAdjacentElement('afterend', detalhe(aberto));
    }
  }
  function render() { renderFams(); renderFiltros(); renderGrelha(); }

  /* leva o ecrã ao topo do detalhe: sem isto, ao abrir uma asa de uma linha
     de baixo o painel abre fora do campo de visão */
  function irParaDetalhe() {
    const ir = suave => {
      const d = document.getElementById('flow-det');
      if (!d) return;
      const y = Math.max(0, d.getBoundingClientRect().top + window.scrollY - 16);
      try { window.scrollTo({ top: y, behavior: suave ? 'smooth' : 'auto' }); }
      catch (e) { window.scrollTo(0, y); }        /* browsers sem opções */
    };
    requestAnimationFrame(() => ir(true));
    /* as fotos entram depois (loading=lazy) e empurram a página:
       segunda passagem para corrigir o desvio */
    setTimeout(() => ir(false), 420);
  }

  function sincronizaHash() {
    try {
      if (aberto) history.replaceState(null, '', '#produtos/' + slugProd(aberto.nome));
      else history.replaceState(null, '', location.pathname + location.search);
    } catch (e) { }
  }
  function limparHash() { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } }

  /* o nº de colunas muda com a largura: o detalhe tem de trocar de linha */
  let tr; window.addEventListener('resize', () => {
    if (!aberto) return;
    clearTimeout(tr); tr = setTimeout(renderGrelha, 150);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aberto) { aberto = null; sincronizaHash(); render(); }
  });

  render();
  /* veio de um link partilhado: só dá para rolar depois de a secção estar
     no documento e as fotos terem chegado */
  if (aberto) {
    setTimeout(irParaDetalhe, 300);
    window.addEventListener('load', () => setTimeout(irParaDetalhe, 100), { once: true });
  }
  return wrap;
}
const ICON_PESSOA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>';
const ICON_ESTRELA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8z"/></svg>';
const ICON_PALETA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 005-5c0-3.9-4-7-9-7z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1.1" fill="currentColor" stroke="none"/></svg>';

function buildElement(item) {
  switch (item.role) {
    case 'text': return buildText(item);
    case 'floatImage': return buildFloatImage(item);
    case 'groundImage': return buildGroundImage(item);
    case 'heroImage': return buildHeroImage(item);
    case 'music': return buildMusic(item);
    case 'flow': return buildFlow(item);
    default: return null;
  }
}

function render(data) {
  const root = document.getElementById('app');
  posSeq = 0;
  responsiveRules = [];

  /* marca */
  if (data.brand) {
    if (data.brand.orange) document.documentElement.style.setProperty('--orange', data.brand.orange);
    if (data.brand.black) document.documentElement.style.setProperty('--black', data.brand.black);
    if (data.brand.font) document.body.style.fontFamily = data.brand.font;
  }

  /* céu */
  const sky = document.querySelector('.sky');
  if (data.sky && data.sky.length) {
    const stops = data.sky.map((c, i) => c + ' ' + Math.round((i / (data.sky.length - 1)) * 100) + '%').join(',');
    sky.style.background = 'linear-gradient(180deg,' + stops + ')';
    sky.style.backgroundSize = '100% 320%';
  }

  /* secções */
  (data.sections || []).forEach(sec => {
    if (sec.visible === false) return;
    const s = el('section');
    s.id = sec.id;
    /* animação de vento neste slide (liga/desliga por slide; por defeito ligada) */
    s.dataset.wind = sec.wind === false ? '0' : '1';
    /* altura da secção em nº de ecrãs (1 = normal). Editável no CMS. */
    if (typeof sec.heightScreens === 'number' && sec.heightScreens > 1) {
      s.style.minHeight = (sec.heightScreens * 100) + 'vh';
    }
    if (sec.heroScrim) {
      s.classList.add('has-scrim', 'hero-fill');
      /* o scrim (degradé azul p/ legibilidade do texto) partilha a cor e a
         intensidade da camada azul da secção — controladas por sec.overlay */
      const ov = sec.overlay;
      const rgb = hexToRgb((ov && ov.color) || '#092852');
      if (rgb) {
        s.style.setProperty('--scrim-r', rgb.r);
        s.style.setProperty('--scrim-g', rgb.g);
        s.style.setProperty('--scrim-b', rgb.b);
      }
      const on = !ov || ov.visible !== false;
      const a = (ov && typeof ov.intensity === 'number') ? Math.max(0, Math.min(100, ov.intensity)) / 100 : 1;
      s.style.setProperty('--scrim-a', on ? a : 0);
    }
    const bg = buildSectionBg(sec, data.sky);
    if (bg) s.appendChild(bg);
    const topTint = buildTopTint(sec);
    if (topTint) s.appendChild(topTint);
    const ovTint = buildOverlayTint(sec);
    if (ovTint) s.appendChild(ovTint);
    (sec.elements || []).forEach(item => {
      const node = buildElement(item);
      if (node) s.appendChild(node);
    });
    const hint = t(sec.scrollHint);
    if (hint && sec.scrollHintVisible !== false) {
      const h = el('div', 'scrollhint'); h.textContent = hint; s.appendChild(h);
    }
    root.appendChild(s);
  });

  /* footer */
  if (data.footer) {
    const f = el('footer');
    const big = el('div', 'big');
    big.appendChild(document.createTextNode(t(data.footer.line1) + ' '));
    if (data.footer.accent) { const sp = el('span'); sp.textContent = t(data.footer.accent); big.appendChild(sp); }
    big.appendChild(document.createTextNode(' ' + t(data.footer.line2)));
    f.appendChild(big);
    const note = t(data.footer.note);
    if (note) { const sm = el('small'); sm.textContent = note; f.appendChild(sm); }
    root.appendChild(f);
  }

  if (data.menu && data.menu.length) buildMenu(data.menu);

  const locales = (data.locales && data.locales.length) ? data.locales : [DEFAULT_LOCALE];
  if (locales.length > 1) buildLangSwitcher(locales);

  if (responsiveRules.length) {
    const st = el('style'); st.id = 'mobile-overrides';
    st.textContent = responsiveRules.join('\n');
    document.head.appendChild(st);
  }

  initMotion(data);
  reporPosicao();      /* volta à secção onde se estava, se veio de mudança de idioma */
}

/* ---- seletor de idioma (bandeiras) ---- */
const FLAGS = {
  pt: '<svg viewBox="0 0 30 20"><rect width="12" height="20" fill="#006600"/><rect x="12" width="18" height="20" fill="#FF0000"/><circle cx="12" cy="10" r="4.2" fill="#FFCC00" stroke="#fff" stroke-width=".6"/></svg>',
  en: '<svg viewBox="0 0 19 10"><rect width="19" height="10" fill="#fff"/><g fill="#B22234"><rect width="19" height="1" y="0"/><rect width="19" height="1" y="2"/><rect width="19" height="1" y="4"/><rect width="19" height="1" y="6"/><rect width="19" height="1" y="8"/></g><rect width="8" height="5" fill="#3C3B6E"/></svg>',
  es: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#AA151B"/><rect width="30" height="10" y="5" fill="#F1BF00"/></svg>',
  fr: '<svg viewBox="0 0 9 6"><rect width="3" height="6" fill="#0055A4"/><rect width="3" height="6" x="3" fill="#fff"/><rect width="3" height="6" x="6" fill="#EF4135"/></svg>',
  de: '<svg viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>',
};
/* ---- manter a posição ao mudar de idioma ----
   Mudar de idioma recarrega a página. Guardamos a secção onde o utilizador
   estava e a distância a que estava do topo dela; ao voltar, repomos aí.
   Guardamos a secção (e não só o scrollY) porque os textos traduzidos têm
   comprimentos diferentes e deslocariam a página. */
const POSKEY = 'hs-scroll';
function guardaPosicao() {
  try {
    const meio = window.scrollY + window.innerHeight / 2;
    let alvo = null;
    document.querySelectorAll('section').forEach(s => {
      const topo = s.offsetTop;
      if (topo <= meio) alvo = s;
    });
    if (!alvo) return;
    sessionStorage.setItem(POSKEY, JSON.stringify({ id: alvo.id, off: Math.round(window.scrollY - alvo.offsetTop) }));
  } catch (e) { }
}
function reporPosicao() {
  let p;
  try { p = JSON.parse(sessionStorage.getItem(POSKEY) || 'null'); sessionStorage.removeItem(POSKEY); } catch (e) { }
  if (!p || !p.id) return;
  const ir = () => {
    const s = document.getElementById(p.id);
    if (!s) return;
    window.scrollTo({ top: Math.max(0, s.offsetTop + (p.off || 0)), behavior: 'instant' in window ? 'instant' : 'auto' });
  };
  ir();
  requestAnimationFrame(ir);
  /* as imagens ainda podem estar a carregar e a mudar a altura da página */
  window.addEventListener('load', ir, { once: true });
  setTimeout(ir, 250);
}

function buildLangSwitcher(locales) {
  const bar = el('div', 'lang-switcher');
  const current = el('button', 'lang current');
  current.type = 'button';
  current.setAttribute('aria-label', 'Mudar idioma (atual: ' + LOCALE + ')');
  current.innerHTML = FLAGS[LOCALE] || LOCALE;

  const list = el('div', 'lang-list');
  locales.filter(code => code !== LOCALE).forEach(code => {
    const b = el('button', 'lang');
    b.type = 'button';
    b.setAttribute('aria-label', code);
    b.innerHTML = FLAGS[code] || code;
    b.addEventListener('click', () => {
      guardaPosicao();                 /* para voltar ao mesmo sítio depois do reload */
      localStorage.setItem('lang', code);
      location.reload();
    });
    list.appendChild(b);
  });

  current.addEventListener('click', () => bar.classList.toggle('open'));
  document.addEventListener('click', e => { if (!bar.contains(e.target)) bar.classList.remove('open'); });

  bar.appendChild(current);
  bar.appendChild(list);
  document.body.appendChild(bar);
}

/* ---- menu burger + âncoras ---- */
function buildMenu(items) {
  const burger = el('button', 'burger');
  burger.setAttribute('aria-label', 'Abrir menu');
  burger.innerHTML = '<span></span><span></span><span></span>';

  const backdrop = el('div', 'menu-backdrop');
  const drawer = el('nav', 'menu-drawer');
  drawer.setAttribute('aria-hidden', 'true');
  const ul = el('ul');
  items.forEach(mi => {
    const li = el('li');
    const a = el('a');
    const target = String(mi.target || '');
    a.href = /^https?:\/\//.test(target) ? target : '#' + target;
    a.textContent = t(mi.label);
    li.appendChild(a);
    ul.appendChild(li);
  });
  drawer.appendChild(ul);

  function setOpen(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  burger.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
  drawer.addEventListener('click', e => { if (e.target.tagName === 'A') setOpen(false); });
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  document.body.appendChild(burger);
  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

/* ---- parallax + céu que sobe + vento ---- */
function initMotion(data) {
  const floaties = [...document.querySelectorAll('[data-speed]')];
  const sky = document.querySelector('.sky');
  let gust = 0;

  function onScroll() {
    const y = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    const frac = max > 0 ? y / max : 0;
    sky.style.backgroundPositionY = (frac * 100) + '%';
    floaties.forEach(elm => {
      const sp = parseFloat(elm.dataset.speed);
      elm.style.transform = `translateY(${y * sp * -1}px)`;
    });
    gust = Math.min(gust + 0.22, 2.5);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  const canvas = document.getElementById('wind');
  const enabled = !data.wind || data.wind.enabled !== false;
  if (enabled) {
    const ctx = canvas.getContext('2d');
    let W, H, DPR;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = innerWidth * DPR; H = canvas.height = innerHeight * DPR;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    }
    resize(); window.addEventListener('resize', resize);
    const newP = spread => ({
      x: spread ? Math.random() * W : -Math.random() * 220 * DPR,
      y: Math.random() * H,
      len: (70 + Math.random() * 180) * DPR,
      v: (0.5 + Math.random() * 1.7) * DPR,
      a: 0.09 + Math.random() * 0.2,
      amp: (3 + Math.random() * 13) * DPR,
      ph: Math.random() * Math.PI * 2
    });
    const N = (data.wind && data.wind.density) || 90, P = [];
    for (let i = 0; i < N; i++) P.push(newP(true));
    let t = 0;
    (function tick() {
      t += 0.016;
      const base = 1 + Math.sin(t * 0.6) * 0.35 + gust;
      gust *= 0.95;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineWidth = 1.5 * DPR;
      for (const p of P) {
        p.x += p.v * base;
        const yy = p.y + Math.sin(t * 1.2 + p.ph) * p.amp;
        ctx.strokeStyle = 'rgba(255,255,255,' + p.a + ')';
        ctx.beginPath();
        ctx.moveTo(p.x - p.len, yy);
        ctx.quadraticCurveTo(p.x - p.len * 0.5, yy - p.amp * 0.5, p.x, yy);
        ctx.stroke();
        if (p.x - p.len > W) Object.assign(p, newP(false));
      }
      requestAnimationFrame(tick);
    })();

    /* liga/desliga o vento por slide: faz fade conforme o slide mais visível */
    const secs = [...document.querySelectorAll('section')];
    if (secs.length) {
      const ratios = new Map();
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => ratios.set(e.target, e.intersectionRatio));
        let top = null, best = -1;
        ratios.forEach((r, sec) => { if (r > best) { best = r; top = sec; } });
        canvas.style.opacity = (top && top.dataset.wind === '0') ? '0' : '1';
      }, { threshold: [0, 0.15, 0.35, 0.55, 0.75, 1] });
      secs.forEach(s => io.observe(s));
    }
  } else {
    canvas.style.display = 'none';
  }
  onScroll();
}

/* carrega settings.json (global + ordem dos slides) e depois cada slide
   individual (content/slides/<id>.json), juntando tudo na estrutura que o
   render() espera. Assim cada slide é um ficheiro/entrada própria no CMS. */
async function loadSite() {
  const settings = await fetch('content/settings.json').then(r => r.json());
  const ids = Array.isArray(settings.slides) ? settings.slides : [];
  const slides = await Promise.all(ids.map(id =>
    fetch('content/slides/' + id + '.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  ));
  return Object.assign({}, settings, { sections: slides.filter(Boolean) });
}

loadSite()
  .then(render)
  .catch(err => {
    document.getElementById('app').innerHTML =
      '<p style="padding:40px;color:#fff">Erro a carregar o conteúdo: ' + err.message + '</p>';
  });
