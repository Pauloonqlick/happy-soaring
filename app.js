import { dentroDoPrazo, abrangeProduto, ofertasDaAsa, hojeISO }
  from './regras/avisos.js';
import { rotuloFamilia as rotFamilia, rotuloClasse as rotClasse }
  from './regras/taxonomia.js';
import { KN_PARA_KMH, PAISES_NOS, CHAVE_UNIDADE, unidadeDoPais }
  from './regras/unidades.js';
import { comIdioma, entradasDoMenu }
  from './regras/navegacao.js';
import { criarMusica } from './regras/musica.js';
import { UI } from './regras/textos.js';
import { el, fmtTime, criarWaLink, visibilityClass, paragrafos,
  ICON_PLAY, ICON_PAUSE } from './regras/dom.js';

/* Motor do site orientado pelo conteúdo em content/.
   Nada de conteúdo escrito à mão aqui — tudo vem de content/settings.json e
   de content/slides/*.json, que é o que o CMS (Sveltia) edita. */

const px = v => (typeof v === 'number' ? v + 'px' : v);

/* ---- idioma (i18n) ----
   Um campo de texto pode ser uma string simples (uma língua) ou um objeto
   { pt: "...", en: "...", ... }. t() escolhe o idioma atual, com fallback. */
const DEFAULT_LOCALE = 'pt';

/* O IDIOMA VEM DO ENDEREÇO, E DE MAIS LADO NENHUM.
   / é português, /en/ é inglês, /es/, /fr/ e /de/ o resto. Cada uma é uma
   página a sério, com o seu title, o seu canonical e o seu hreflang.

   Antes vinha do localStorage, e isso partia a promessa que o endereço faz:
   o Google a abrir /de/ tinha de receber alemão, e um leitor que tivesse
   escolhido português noutro dia receberia português numa URL alemã. Um
   endereço tem de servir sempre a mesma coisa a toda a gente. */
const LOCALE = (location.pathname.match(/^\/(en|es|fr|de)(?:\/|$)/) || [])[1] || DEFAULT_LOCALE;
/* Uma ligação interna escrita no CMS vem sempre em português — /pilot2wing/,
   /flow-paragliders-portugal/ — porque é assim que se escreve uma vez só. Na
   página alemã tem de apontar para /de/pilot2wing/, senão o visitante salta
   de língua a meio da visita e o cluster alemão perde as ligações internas.

   Endereços externos, âncoras e caminhos que já trazem prefixo ficam como
   estão. */
/* a regra mudou-se para regras/navegacao.js, que o gerador também usa —
   era a única forma de o menu das páginas geradas não ser uma segunda
   implementação desta mesma conta */
function local(href) {
  return comIdioma(href, LOCALE);
}

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
function ui(k, vars) {
  const e = UI[k];
  if (!e) return '';
  let s = e[LOCALE] || e[DEFAULT_LOCALE] || '';
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
}
/* "{n} música/músicas" conforme o número */

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

  /* UMA IMAGEM, NAO DUAS ESCONDIDAS UMA DA OUTRA
     Aqui criavam-se dois <img> — o de desktop e o de telemóvel — e o CSS
     escondia um com display:none. Só que display:none não impede o
     download: o browser ia buscar os dois e usava um.

     Medido em produção: um telemóvel descarregava hero-bg.jpg (370 KB) e
     hero-bg-mobile.jpg (277 KB), deitando 370 KB fora. No desktop, 277 KB.
     E esses bytes competem pela largura de banda exactamente na altura em
     que a maior imagem da página está a tentar aparecer.

     Com <picture>, o browser avalia o media query ANTES de pedir seja o que
     for, e pede um ficheiro só.

     O 760px não é escolhido ao acaso: é o mesmo ponto de corte das regras
     .hide-mobile e .hide-desktop no styles.css. Um valor diferente abria uma
     faixa de larguras onde o layout muda e a imagem não. */
  const pic = el('picture');
  const mob = sec.bgImageMobile && sec.bgImageMobile !== sec.bgImage ? sec.bgImageMobile : '';
  if (mob) {
    const src = el('source');
    src.media = '(max-width: 760px)';
    src.srcset = mob;
    pic.appendChild(src);
  }
  /* O src E O ULTIMO A SER POSTO, E ISSO NAO E ESTILO
     Pôr o src num <img> ainda solto começa o download nesse instante — do
     ficheiro de desktop, porque não há <picture> nenhum à volta dele para
     consultar. Ao inserir a seguir dentro do <picture>, o browser refaz a
     escolha e vai buscar o de telemóvel. Resultado: os dois, que era
     exactamente o que isto veio corrigir.

     Medido: as duas imagens pedidas no mesmo milissegundo, 370 + 277 KB.
     Com o img já dentro do <picture> antes de ter src, o browser avalia o
     media query primeiro e pede um ficheiro só. */
  const img = el('img');
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  pic.appendChild(img);
  wrap.appendChild(pic);
  img.src = sec.bgImage;

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
  /* "marca" é o wordmark do hero. Continua do mesmo tamanho, mas deixou de
     ser o h1: duas palavras que só dizem o nome não são o assunto da página.
     O h1 é a frase a seguir, no campo h1. O valor antigo "h1" continua a ser
     aceite para o caso de sobrar num JSON por actualizar. */
  const eMarca = item.titleTag === 'marca' || item.titleTag === 'h1';
  /* O tamanho do título vem do CMS. A lista fechada é de propósito: um valor
     escrito à mão que não exista aqui cairia numa classe sem regra nenhuma e
     o título ficava com o tamanho do browser. Assim, o que não se reconhece
     é "normal", que é o que já lá estava. */
  const TAMANHOS = ['pequeno', 'normal', 'grande', 'enorme', 'marca'];
  const tam = TAMANHOS.indexOf(String(item.titleSize || '')) >= 0
    ? item.titleSize : 'normal';
  const title = el(eMarca ? 'div' : 'h2',
    (eMarca ? 'wordmark' : 'title') + ' tam-' + tam);
  if (title1) title.appendChild(document.createTextNode(title1));
  if (title2) {
    title.appendChild(el('br'));
    if (item.accent2) { const s = el('span'); s.textContent = title2; title.appendChild(s); }
    else title.appendChild(document.createTextNode(title2));
  }
  c.appendChild(title);
  const oH1 = t(item.h1);
  if (oH1) { const h = el('h1', 'hero-h1'); h.textContent = oH1; c.appendChild(h); }
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

  /* visible:false esconde o botão sem perder o texto nem as traduções — serve
     para os que apontam a secções ainda por fazer */
  const buttons = (item.buttons || []).filter(b => b && b.visible !== false && t(b.label));
  if (buttons.length) {
    const row = el('div', 'btn-row');
    buttons.forEach(b => {
      const a = el('a', 'btn' + (b.variant === 'secondary' ? ' secondary' : ''));
      a.href = local(b.href) || '#'; a.textContent = t(b.label);
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
   licenças, aviso legal e CTA de WhatsApp. Tudo vem de content/ pelo CMS. */

/* A música mudou-se para regras/musica.js, para poder correr também na
   página /musica/. O que fica aqui é a ligação: os ajudantes que o módulo
   precisa saem todos do app.js e entram por parâmetro. */
const waLink = criarWaLink(t);
const { buildMusic, buildBio } = criarMusica({ t, ui, local });

/* ---- secção Flow Paragliders ----
   Uma lista única de produtos. Cada família escolhe o seu próprio eixo de
   classificação (os parapentes usam a escada EN, os parakites não), e só
   ganha filtros quando tem mais do que uma classificação.
   O detalhe abre dentro da grelha, a toda a largura, por baixo da linha do
   cartão — em vez de uma gaveta que tapava o catálogo. */
const ICON_OLHO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm5.7 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.9.9c.3.2.5.3.5.4.1.2.1.6-.1 1.3z"/></svg>';

/* cores do desenho de recurso, para modelos ainda sem foto */
const FLOW_COLORS = ['#2b6cff', '#ff7a1a', '#22c55e', '#c026d3', '#eab308', '#0ea5e9', '#ef4444', '#38bdf8', '#a3e635', '#7c3aed', '#e11d48', '#14b8a6'];
const FOTO_CORES = {
  azul: '#1f6fc0', laranja: '#ff7a1a', vermelho: '#e03131', lima: '#a3e635', roxo: '#7c3aed',
  teal: '#17a2a2', preto: '#22262b', branco: '#e8eef5', amarelo: '#facc15', rosa: '#ec4899',
  lilac: '#7c3aed', lime: '#a3e635', yellow: '#facc15', /* amostradas das proprias fotos: a maui e magenta e a sunrise turquesa —
     estavam ambas erradas, e a laranja da sunrise e so um pormenor */
  maui: '#a61a87', sunrise: '#1b988c',
  blue: '#1f6fc0', red: '#e03131', white: '#e8eef5', pink: '#ec4899', orange: '#ff7a1a',
  black: '#22262b', green: '#22c55e', purple: '#7c3aed', grey: '#c9d1d9', gray: '#c9d1d9',
  ice: '#dbeafe', sand: '#e8d5a8', navy: '#0a3d7a', turquoise: '#17a2a2',
  fire: '#ef6820', ocean: '#0a63b8'
};
/* Alguns fabricantes dão nome próprio às combinações (a Freedom 2 vende-se em
   Disco, Jazz e Sky). A bola mostra só a cor base — a cor de fundo da vela —
   e não todas as cores do esquema, que ficam à vista na própria foto. */
const COR_BASE = { disco: 'lime', jazz: 'red', sky: 'blue' };
const corHex = c => FOTO_CORES[String(c).toLowerCase()] || '#9bb4cf';
/* Uma cor pode ser composta ("black-blue-white"): nesse caso a amostra é um
   gradiente com as cores reais, em vez de um cinzento sem significado. */
function corAmostra(c) {
  const chave = String(c).toLowerCase();
  if (FOTO_CORES[chave]) return FOTO_CORES[chave];
  if (COR_BASE[chave]) return FOTO_CORES[COR_BASE[chave]];
  /* nomes compostos ("black-blue-pink"): a primeira é a cor base */
  const partes = chave.split('-').filter(x => FOTO_CORES[x]);
  return partes.length ? FOTO_CORES[partes[0]] : corHex(chave);
}
function pintaAmostra(botao, cor) {
  botao.style.backgroundImage = 'none';
  botao.style.background = corAmostra(cor);
}
const slugProd = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/* O endereço da página da asa. Tem de dar exactamente o mesmo que o
   `caminho()` do scripts/gerar-paginas.mjs — se os dois discordarem, os
   cartões apontam para páginas que não existem. O slug é o mesmo `slugProd`
   que já se usava no #produtos/<slug>, por isso só falta o segmento. */
const SEGMENTO_ASA = { pt:'asas', en:'wings', es:'alas', fr:'ailes', de:'schirme' };
const caminhoAsa = p =>
  (LOCALE === DEFAULT_LOCALE ? '' : '/' + LOCALE) +
  '/' + (SEGMENTO_ASA[LOCALE] || SEGMENTO_ASA[DEFAULT_LOCALE]) +
  '/' + slugProd(p.nome) + '/';

/* A escolha viaja para a página da asa no FRAGMENTO, não em query string:
   um `?cor=744` cria endereços novos que o Google indexa como páginas à parte,
   e a seguir há que os desdizer com canonical. O fragmento nunca chega ao
   servidor nem aos motores de busca — e é exactamente o que queremos, porque
   isto é estado da pessoa, não conteúdo. */
function fragmentoEscolha(e) {
  const ps = [];
  if (e.esq)  ps.push('esq=' + encodeURIComponent(e.esq));
  if (e.cor)  ps.push('cor=' + encodeURIComponent(e.cor));
  if (e.tams && e.tams.length) ps.push('tam=' + e.tams.map(encodeURIComponent).join(','));
  return ps.length ? '#' + ps.join('&') : '';
}

/* Selo de oferta.
   O botão da oferta leva à gama toda dos parakites, mas a oferta pode ser só
   de uma asa — foi o caso em Agosto de 2026. Sem o selo, quem chega à lista
   não tem como saber qual delas é. Quem decide é o campo `abrange` do aviso,
   lido pela regra partilhada com o gerador das páginas. */
function ofertasDe(p) { return ofertasDaAsa(AVISOS, p); }
function seloOferta(p, classe) {
  const oferta = ofertasDe(p)[0];
  if (!oferta) return null;
  const rot = t(oferta.etiqueta);
  if (!rot) return null;
  const sp = el('span', 'selo-oferta t-' + (oferta.tipo || 'oferta') + (classe ? ' ' + classe : ''));
  sp.textContent = rot;
  return sp;
}

const chaveFoto = n => String(n).toLowerCase().replace(/[^a-z0-9]/g, '');
const fotoSrc = (nome, cor, card) =>
  '/images/asas/' + chaveFoto(nome) + '__' + cor + (card ? '-card' : '') + '.webp';

/* desenho de recurso para quem ainda não tem foto */
function asaPlaceholder(i) {
  const c = k => FLOW_COLORS[(i * 3 + k) % FLOW_COLORS.length];
  return '<svg viewBox="0 0 300 150" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M18 96 Q150 20 282 96 Q150 62 18 96Z" fill="' + c(0) + '"/>' +
    '<path d="M40 108 Q150 44 260 108 Q150 80 40 108Z" fill="' + c(1) + '" opacity=".95"/>' +
    '<path d="M64 120 Q150 66 236 120 Q150 98 64 120Z" fill="' + c(2) + '" opacity=".9"/></svg>';
}

/* ---- nomes de famílias e de tipos ----
   Ficam aqui e não nos dados de propósito: a família é a CHAVE por que os
   produtos se agrupam e por que o botão de um aviso a escolhe. Se o nome fosse
   traduzido no ficheiro, mudar de idioma partia o agrupamento. Traduz-se só o
   que se lê; a chave nunca muda.
   O que não está na tabela mostra-se tal e qual — uma família nova criada no
   CMS aparece, por traduzir, em vez de desaparecer. */
/* Os rótulos vivem em regras/taxonomia.js, partilhados com o gerador das
   páginas: estando só aqui, as 110 páginas mostravam a chave em bruto. */
const rotuloFamilia = f => rotFamilia(f, LOCALE);
const rotuloClasse = c => rotClasse(c, LOCALE);

function buildFlow(item) {
  const wrap = el('div', 'flow' + visibilityClass(item));
  const num = item.whatsapp;
  const produtos = (item.produtos || []).filter(p => p && p.nome && p.visible !== false);

  /* cabeçalho */
  const head = el('div', 'flow-head');
  /* o logótipo vem primeiro: é a marca que se anuncia, e o texto por baixo é
     que a explica. O nome escrito continua no alt, por isso não se perde para
     leitores de ecrã nem para pesquisa, mesmo com o título desligado. */
  if (item.logoImage) { const img = el('img', 'flow-logo'); img.src = item.logoImage; img.alt = t(item.title) || 'Flow Paragliders'; head.appendChild(img); }
  const dl = t(item.dealerLabel);
  if (dl) {
    /* a etiqueta de revendedor leva à página que o explica: são as palavras
       certas no sítio certo, e evita mais uma entrada no menu */
    const alvo = item.dealerHref;
    const d = el(alvo ? 'a' : 'div', 'flow-dealer');
    if (alvo) d.href = local(alvo);
    d.textContent = dl;
    head.appendChild(d);
  }
  const titulo = t(item.title);
  if (titulo && item.titleVisible !== false) { const h = el('h2', 'flow-title'); h.textContent = titulo; head.appendChild(h); }
  const desc = t(item.description);
  if (desc && item.descriptionVisible !== false) { const p = el('p', 'flow-desc'); p.textContent = desc; head.appendChild(p); }
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
  /* modo DESCOBERTA: uma asa em palco, com perguntas. A grelha fica de fora e o
     interruptor está no CMS, para se poder voltar atrás sem mexer no código. */
  const descoberta = item.apresentacao === 'descoberta';
  if (!descoberta) {
    wrap.appendChild(barraFam); wrap.appendChild(barraFiltros); wrap.appendChild(grelha);
  }

  /* link partilhável: #produtos/<asa> abre já nessa asa */
  const m = (location.hash || '').match(/^#produtos\/(.+)$/);
  if (m) {
    const p = produtos.filter(x => slugProd(x.nome) === m[1])[0];
    if (p) { aberto = p; famAtiva = p.familia; }
  }

  function visiveis() {
    return produtos.filter(p => p.familia === famAtiva && (!filtro || p.classificacao === filtro));
  }

  /* Separadores de família — os mesmos na grelha e na descoberta.
     São a única forma de chegar às 8 famílias: sem eles, a descoberta prendia
     quem entrasse na família da primeira asa e escondia as outras 18. */
  function poeFamilias(caixa, cfg) {
    caixa.innerHTML = '';
    familias.forEach(f => {
      const activa = cfg.activa(f);
      const vazia = cfg.vazia ? cfg.vazia(f) : false;
      const b = el('button', 'flow-fam' + (activa ? ' on' : '') + (vazia ? ' sem' : ''));
      b.type = 'button';
      b.dataset.familia = f;                     /* a chave, para quem precise dela */
      b.setAttribute('aria-pressed', activa ? 'true' : 'false');
      b.appendChild(document.createTextNode(rotuloFamilia(f) + ' '));
      const n = el('span', 'flow-fam-n'); n.textContent = cfg.conta(f);
      b.appendChild(n);
      /* as esbatidas continuam a funcionar: esbatido diz "nenhuma destas
         corresponde", não "não podes ver". Sem isso, responder às perguntas
         voltava a prender a pessoa numa família só */
      b.addEventListener('click', () => cfg.aoClicar(f));
      caixa.appendChild(b);
    });
  }
  function renderFams() {
    poeFamilias(barraFam, {
      activa: f => f === famAtiva,
      conta:  f => produtos.filter(p => p.familia === f).length,
      aoClicar: f => { famAtiva = f; filtro = null; aberto = null; limparHash(); render(); }
    });
  }
  /* Chips de classe — os mesmos na grelha e na descoberta.
     O rótulo muda com a família porque o eixo muda: nos parapentes é a
     homologação, nos arneses é o feitio. `eixoDe` devolve null quando a
     família só tem um valor, e então não há fila nenhuma — um filtro com um
     chip só não é um filtro. */
  function poeFiltros(caixa, fam, cfg) {
    caixa.innerHTML = '';
    const cls = eixoDe(fam);
    if (!cls) {
      if (cfg.semEixo) {
        const s = el('span', 'flow-filters-none'); s.textContent = ui('flowListaSimples');
        caixa.appendChild(s);
      }
      return false;
    }
    const lab = el('span', 'flow-filters-label');
    lab.textContent = fam === 'Parapentes' ? ui('flowHomologacao') : ui('flowTipo');
    caixa.appendChild(lab);
    [[null, ui('fAll')]].concat(cls.map(c => [c, rotuloClasse(c)])).forEach(([v, txt]) => {
      const activo = cfg.activo(v);
      const vazio = cfg.vazio ? cfg.vazio(v) : false;
      const b = el('button', 'flow-chip' + (activo ? ' on' : '') + (vazio ? ' sem' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      b.appendChild(document.createTextNode(txt));
      if (cfg.conta) {
        const n = el('span', 'flow-chip-n'); n.textContent = cfg.conta(v); b.appendChild(n);
      }
      b.addEventListener('click', () => cfg.aoClicar(v));
      caixa.appendChild(b);
    });
    return true;
  }
  function renderFiltros() {
    poeFiltros(barraFiltros, famAtiva, {
      semEixo: true,
      activo: v => filtro === v,
      aoClicar: v => { filtro = v; aberto = null; limparHash(); render(); }
    });
  }

  /* ---- bloco das cores ----
     Gerado a partir das cores da própria asa: mostra-as todas de uma vez, em
     vez do seletor que obrigava a clicar uma a uma. Nada para preencher à mão —
     acrescentar uma cor à asa faz a foto aparecer aqui. */
  function blocoCores(p, faixaTitulo) {
    const bloco = el('div', 'flow-det-cores-bloco');
    bloco.appendChild(faixaTitulo(ui('flowCores')));
    const corpo = el('div', 'flow-bloco-corpo');
    const grelha = el('div', 'flow-cores-grelha');
    p.cores.forEach(cor => {
      const cx = el('figure', 'flow-cor');
      const im = el('img');
      im.src = fotoSrc(p.nome, cor, false);
      im.alt = p.nome + ' — ' + cor;
      im.loading = 'lazy';
      im.addEventListener('error', () => cx.remove());
      const leg = el('figcaption', 'flow-cor-nome');
      const bola = el('span', 'flow-cor-bola');
      bola.style.background = corAmostra(cor);
      leg.appendChild(bola);
      leg.appendChild(document.createTextNode(cor.replace(/-/g, ' ')));
      cx.appendChild(im); cx.appendChild(leg);
      grelha.appendChild(cx);
    });
    corpo.appendChild(grelha); bloco.appendChild(corpo);
    return bloco;
  }

  /* ---- configurador de cor ----
     As imagens são geradas antes (scripts/recolorir-asa.py), uma por cor: as
     cores são 18, não infinitas, por isso não há nada a calcular no browser.
     Trocar de cor é trocar o src — instantâneo em qualquer telemóvel.

     A cor escolhida fica guardada no produto e viaja na mensagem de WhatsApp:
     um configurador que não chega ao pedido é um brinquedo. */
  const fotoCustomDe = (p, esquema, c) =>
    '/images/asas-cores/' + chaveFoto(p.nome) + '__' + esquema + '__' + c.ref + '.webp';

  function blocoCorCustom(p, faixaTitulo) {
    const refs = Array.isArray(p.coresCustom) && p.coresCustom.length
      ? TECIDOS.filter(c => p.coresCustom.indexOf(c.ref) >= 0)
      : TECIDOS;
    if (!refs.length) return null;

    const bloco = el('div', 'flow-det-custom');
    bloco.appendChild(faixaTitulo(ui('corMedida')));
    const corpo = el('div', 'flow-bloco-corpo');

    const palco = el('div', 'flow-custom-palco');
    const im = el('img', 'flow-custom-img');
    im.alt = p.nome;
    im.loading = 'lazy';
    im.addEventListener('error', () => { im.style.visibility = 'hidden'; });
    im.addEventListener('load', () => { im.style.visibility = 'visible'; });
    palco.appendChild(im);
    corpo.appendChild(palco);

    const nome = el('div', 'flow-custom-nome');
    corpo.appendChild(nome);

    /* cada esquema standard tem o seu conjunto de custom: a cor troca so a BASE
       e as riscas do esquema mantem-se. Sem escolher, parte-se do primeiro. */
    let esquema = (p.cores || [])[0] || 'base';
    let ultima = null;

    if ((p.cores || []).length > 1) {
      const linha = el('div', 'flow-custom-esq');
      const lb = el('span', 'flow-lbl'); lb.textContent = ui('flowCores');
      linha.appendChild(lb);
      p.cores.forEach((cor, i) => {
        const b = el('button', 'flow-sw' + (i === 0 ? ' on' : '')); b.type = 'button';
        b.style.background = corAmostra(cor);
        const rot = String(cor).replace(/-/g, ' ');
        b.title = rot; b.setAttribute('aria-label', rot);
        b.addEventListener('click', () => {
          esquema = cor;
          linha.querySelectorAll('.flow-sw').forEach(o => o.classList.remove('on'));
          b.classList.add('on');
          if (ultima) im.src = fotoCustomDe(p, esquema, ultima);
        });
        linha.appendChild(b);
      });
      corpo.appendChild(linha);
    }

    const fila = el('div', 'flow-custom-fila');
    fila.setAttribute('role', 'radiogroup');
    fila.setAttribute('aria-label', ui('corMedida'));

    const escolhe = (c, botao) => {
      ultima = c;
      im.src = fotoCustomDe(p, esquema, c);
      nome.textContent = c.nome;
      p.corEscolhida = c.nome;
      fila.querySelectorAll('.flow-custom-sw').forEach(b => {
        b.classList.remove('on');
        b.setAttribute('aria-checked', 'false');
      });
      botao.classList.add('on');
      botao.setAttribute('aria-checked', 'true');
    };

    refs.forEach((c, i) => {
      const b = el('button', 'flow-custom-sw');
      b.type = 'button';
      b.style.background = c.hex;
      b.title = c.nome;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', c.nome);
      b.addEventListener('click', () => escolhe(c, b));
      fila.appendChild(b);
      if (i === 0) escolhe(c, b);
    });
    corpo.appendChild(fila);

    /* o aviso não é decorativo: a cor à medida custa dinheiro e o tecido real
       nunca é exactamente o que se vê num ecrã */
    const nota = el('p', 'flow-custom-nota');
    nota.textContent = ui('corIndicativa');
    corpo.appendChild(nota);

    bloco.appendChild(corpo);
    return bloco;
  }

  /* ---- escolha do tamanho antes de pedir preço ----
     Sem isto chegava-te uma mensagem sem tamanho e tinhas de perguntar sempre.
     O envio é um <a>, não um window.open: os bloqueadores de popups deixam
     passar a ligação e o WhatsApp abre à primeira. */
  function pedirPreco(p, num, tamsPre, fotoUrl) {
    const fecha = () => { document.removeEventListener('keydown', tecla); fundo.remove(); };
    const tecla = ev => { if (ev.key === 'Escape') fecha(); };

    const fundo = el('div', 'flow-modal-fundo');
    const cx = el('div', 'flow-modal');
    cx.setAttribute('role', 'dialog');
    cx.setAttribute('aria-modal', 'true');
    cx.setAttribute('aria-label', ui('flowEscolheTam'));

    const tit = el('div', 'flow-modal-tit'); tit.textContent = p.nome;
    cx.appendChild(tit);

    /* a foto com a cor escolhida: confirma sem palavras o que vai ser pedido */
    if (fotoUrl) {
      const fig = el('div', 'flow-modal-foto');
      const im = el('img'); im.src = fotoUrl; im.alt = p.nome;
      im.addEventListener('error', () => fig.remove());
      fig.appendChild(im);
      cx.appendChild(fig);
    }
    if (p.corEscolhida) {
      const c = el('div', 'flow-modal-cor'); c.textContent = p.corEscolhida;
      cx.appendChild(c);
    }
    if ((p.tamanhos || []).length) {
      const sub = el('div', 'flow-modal-sub'); sub.textContent = ui('flowEscolheTams');
      cx.appendChild(sub);
    }

    const disp = (p.tamanhos || []).map(String);
    let escolhidos = (tamsPre || []).map(String).filter(t2 => disp.indexOf(t2) >= 0);
    const enviar = el('a', 'flow-btn wa flow-modal-enviar');
    enviar.target = '_blank'; enviar.rel = 'noopener';
    enviar.innerHTML = ICON_WA;
    const et = el('span'); et.textContent = ui('flowEnviarWa'); enviar.appendChild(et);
    /* o país é obrigatório: sem ele o <a> fica sem href, por isso não é
       clicável nem focável — não há botão morto a fingir que funciona */
    const refresca = () => {
      const pais = campoPais.value.trim();
      /* tamanho e país são ambos obrigatórios */
      const valido = pais.length >= 2 && (!disp.length || escolhidos.length > 0);
      enviar.classList.toggle('desativado', !valido);
      enviar.setAttribute('aria-disabled', valido ? 'false' : 'true');
      if (!valido) { enviar.removeAttribute('href'); return; }
      const linhas = [ui('msgAbre', { n: p.nome })];
      if (escolhidos.length === 1) linhas.push(ui('msgTam', { t: escolhidos[0] }));
      else if (escolhidos.length > 1) linhas.push(ui('msgTams', { t: escolhidos.join(', ') }));
      if (p.corEscolhida) linhas.push(ui('msgCor', { c: p.corEscolhida }));
      linhas.push(ui('msgPais', { p: pais }));
      enviar.href = waLink(num, linhas.join('\n'));
    };

    const lista = el('div', 'flow-modal-tams');
    (p.tamanhos || []).forEach(tam => {
      const dentro = escolhidos.indexOf(String(tam)) >= 0;
      const b = el('button', 'flow-modal-tam' + (dentro ? ' on' : '')); b.type = 'button';
      b.textContent = tam;
      b.setAttribute('aria-pressed', dentro ? 'true' : 'false');
      /* varios tamanhos de uma vez: quem hesita entre dois pergunta pelos dois
         em vez de mandar duas mensagens */
      b.addEventListener('click', () => {
        const i = escolhidos.indexOf(String(tam));
        if (i >= 0) escolhidos.splice(i, 1); else escolhidos.push(String(tam));
        const on = escolhidos.indexOf(String(tam)) >= 0;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        refresca();
      });
      lista.appendChild(b);
    });
    cx.appendChild(lista);

    const cxPais = el('div', 'flow-modal-pais');
    const lbl = el('label', 'flow-modal-lbl');
    lbl.textContent = ui('flowPais');
    lbl.htmlFor = 'flow-pais';
    const campoPais = el('input', 'flow-modal-input');
    campoPais.id = 'flow-pais';
    campoPais.type = 'text';
    campoPais.required = true;
    campoPais.autocomplete = 'country-name';
    const dica = el('div', 'flow-modal-dica'); dica.textContent = ui('flowPaisDica');
    cxPais.appendChild(lbl); cxPais.appendChild(campoPais); cxPais.appendChild(dica);
    cx.appendChild(cxPais);
    campoPais.addEventListener('input', refresca);
    campoPais.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && enviar.hasAttribute('href')) enviar.click();
    });

    refresca();

    const rodape = el('div', 'flow-modal-acoes');
    const cancelar = el('button', 'flow-btn'); cancelar.type = 'button';
    cancelar.textContent = ui('flowFechar');
    cancelar.addEventListener('click', fecha);
    enviar.addEventListener('click', () => setTimeout(fecha, 60));
    rodape.appendChild(cancelar); rodape.appendChild(enviar);
    cx.appendChild(rodape);

    fundo.appendChild(cx);
    fundo.addEventListener('click', ev => { if (ev.target === fundo) fecha(); });
    document.addEventListener('keydown', tecla);
    document.body.appendChild(fundo);
    const primeiro = lista.querySelector('.flow-modal-tam');
    if (primeiro) primeiro.focus();
  }

  function cartao(p, i) {
    const c = el('article', 'flow-card' + (p === aberto ? ' aberta' : ''));
    const shot = el('div', 'flow-shot');
    const img = el('div', 'flow-shot-img');
    img.innerHTML = p.cores && p.cores.length ? imgTag(p, p.cores[0], true) : asaPlaceholder(i);
    shot.appendChild(img); c.appendChild(shot);

    const body = el('div', 'flow-body');
    /* O logótipo da Flow substitui o nome escrito, quando existe. O nome
       continua a ser lido por leitores de ecrã através do alt. */
    const nome = el('div', 'flow-name' + (p.logo ? ' com-logo' : ''));
    if (p.logo) {
      const lg = el('img', 'flow-name-logo');
      lg.src = '/images/logos/' + p.logo + '.webp';
      lg.alt = p.nome;
      lg.loading = 'lazy';
      /* se o ficheiro faltar, volta ao nome escrito em vez de deixar buraco */
      lg.addEventListener('error', () => { nome.classList.remove('com-logo'); nome.textContent = p.nome; });
      nome.appendChild(lg);
    } else {
      nome.textContent = p.nome;
    }
    body.appendChild(nome);
    const seloC = seloOferta(p); if (seloC) body.appendChild(seloC);
    if (p.classificacao) { const cl = el('div', 'flow-clas'); cl.textContent = rotuloClasse(p.classificacao); body.appendChild(cl); }
    const tag = t(p.tagline);
    if (tag) { const tl = el('div', 'flow-tagline'); tl.textContent = tag; body.appendChild(tl); }

    let corCartao = null;
    let sincronizaCartao = () => {};
    if (p.cores && p.cores.length) {
      const box = el('div');
      const l = el('div', 'flow-lbl'); l.textContent = ui('flowCores'); box.appendChild(l);
      const sws = el('div', 'flow-swatches');
      p.cores.forEach((cor, j) => {
        const b = el('button', 'flow-sw' + (j === 0 ? ' on' : '')); b.type = 'button';
        pintaAmostra(b, cor); b.title = cor;
        b.setAttribute('aria-label', cor);
        b.addEventListener('click', ev => {
          ev.stopPropagation();
          sws.querySelectorAll('.flow-sw').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          img.innerHTML = imgTag(p, cor, true);
          /* a cor escolhida no cartão viaja para a página, tal como no palco */
          corCartao = cor; sincronizaCartao();
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
    /* Detalhes é uma LIGAÇÃO para a página da asa, não um botão que abre um
       painel aqui. Assim há um sítio só para cada asa — que se pode enviar a
       alguém, partilhar com foto própria, e que o Google encontra.
       Excepção: se o painel já estiver aberto (só acontece por #produtos/<slug>,
       que se mantém para os links antigos não partirem), o botão fecha-o. */
    const ver = p === aberto ? el('button', 'flow-btn') : el('a', 'flow-btn');
    if (p === aberto) { ver.type = 'button'; }
    else {
      sincronizaCartao = () => { ver.href = caminhoAsa(p) + fragmentoEscolha({ esq: corCartao }); };
      sincronizaCartao();
    }
    /* o verbo vive no ícone; a palavra fica só com o substantivo, para o botão
       não partir em duas linhas nos idiomas mais compridos */
    ver.innerHTML = p === aberto ? ICON_X : ICON_OLHO;
    const vl = el('span'); vl.textContent = p === aberto ? ui('flowFechar') : ui('flowVerDetalhes');
    ver.appendChild(vl);
    if (p !== aberto) ver.addEventListener('click', ev => ev.stopPropagation());
    /* abre sempre a escolha: o país é obrigatório, por isso nunca há caminho
       que vá direto ao WhatsApp. Se a asa não tiver tamanhos, a janela pede
       só o país. */
    /* uma asa marcada como histórica descreve uma versão que já não se
       vende: não se pede preço a partir dela. Ver eHistorico no gerador —
       a página de produto faz o mesmo. */
    acoes.appendChild(ver);
    if (p.historico === true) {
      const marca = el('span', 'flow-hist'); marca.textContent = ui('flowHistorico');
      acoes.appendChild(marca);
    } else {
      const preco = el('button', 'flow-btn wa'); preco.type = 'button';
      preco.innerHTML = ICON_WA;
      const pl = el('span'); pl.textContent = ui('flowPedirPreco'); preco.appendChild(pl);
      preco.addEventListener('click', ev => { ev.stopPropagation(); pedirPreco(p, num); });
      acoes.appendChild(preco);
    }
    body.appendChild(acoes);
    c.appendChild(body);

    c.addEventListener('click', () => {
      /* clicar no cartão faz o mesmo que o botão: leva à página da asa */
      if (p === aberto) { aberto = null; sincronizaHash(); render(); return; }
      location.href = caminhoAsa(p) + fragmentoEscolha({ esq: corCartao });
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
    /* faixa azul de título: a mesma para todos os blocos do painel */
    const faixaTitulo = (texto, extra) => {
      const faixa = el('div', 'flow-sec-faixa');
      const h = el('h4', 'flow-det-h'); h.textContent = texto;
      faixa.appendChild(h);
      if (extra) faixa.appendChild(extra);
      return faixa;
    };
    const top = el('div', 'flow-det-top');
    const tit = el('div');
    /* o painel de detalhe tem fundo branco, por isso usa a variante escura do
       logótipo — a clara serve os cartões, que assentam no azul */
    const n = el('div', 'flow-det-name');
    if (p.logo) {
      const lg = el('img', 'flow-det-logo');
      /* o cabeçalho do painel é azul, por isso o logótipo vai na versão branca */
      lg.src = '/images/logos/' + p.logo + '.webp';
      lg.alt = p.nome;
      lg.addEventListener('error', () => { n.classList.remove('com-logo'); n.textContent = p.nome; });
      n.classList.add('com-logo');
      n.appendChild(lg);
    } else {
      n.textContent = p.nome;
    }
    const s = el('div', 'flow-det-sub'); s.textContent = rotuloFamilia(p.familia) + (p.classificacao ? ' · ' + rotuloClasse(p.classificacao) : '');
    tit.appendChild(n); tit.appendChild(s);
    const x = el('button', 'flow-det-x'); x.type = 'button'; x.innerHTML = '&#10005;';
    x.setAttribute('aria-label', ui('flowFechar'));
    x.addEventListener('click', ev => { ev.stopPropagation(); aberto = null; sincronizaHash(); redesenha(); });
    top.appendChild(tit); top.appendChild(x); d.appendChild(top);

    /* Sem foto nem seletor de cor: a foto repetia o cartão que se acabou de
       clicar, e as cores mostram-se muito melhor todas juntas, na secção
       própria. Assim o topo segue o mesmo padrão do resto do painel. */
    const cols = el('div', 'flow-det-cols');
    const dir = el('div', 'flow-det-intro');
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

    cols.appendChild(dir);

    d.appendChild(cols);

    /* cores: montadas a partir das cores da asa, sem precisar de secção à mão */
    if (p.cores && p.cores.length) d.appendChild(blocoCores(p, faixaTitulo));
    /* O configurador de cor aparece num sitio SO — onde a asa se ve grande o
       suficiente para valer a pena muda-la:
         modo grelha      -> aqui, no painel, que e o unico sitio que ha
         modo descoberta  -> no palco, e aqui ficaria a repetir-se
       Tirei-o daqui quando o levei para o palco, e com a grelha ligada ficou
       sem casa nenhuma. */
    if (p.coresCustom && !descoberta) {
      const cc = blocoCorCustom(p, faixaTitulo);
      if (cc) d.appendChild(cc);
    }

    /* vídeo a toda a largura do painel, por baixo das duas colunas:
       numa coluna ficava com metade do tamanho */
    if (p.videoId) {
      const bloco = el('div', 'flow-det-video');
      bloco.appendChild(faixaTitulo(ui('flowVideo')));
      const cxVideo = el('div', 'flow-bloco-corpo');
      cxVideo.appendChild(buildVideo({
        role: 'video', videoId: p.videoId, startAt: p.videoStartAt || 0,
        thumbnail: p.videoThumbnail || '', title: { pt: p.nome }
      }));
      bloco.appendChild(cxVideo);
      d.appendChild(bloco);
    }

    /* gama de vento: barras por tamanho, com alternador nós / km/h */
    if (p.windRange && (p.windRange.groups || []).length) {
      d.appendChild(graficoVento(p));
    }

    if ((p.specs || []).length) {
      const specsBox = el('div', 'flow-det-specs');
      specsBox.appendChild(faixaTitulo(ui('flowSpecs')));
      const cxSpecs = el('div', 'flow-bloco-corpo');
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
      scroll.appendChild(tb); cxSpecs.appendChild(scroll); specsBox.appendChild(cxSpecs);
      d.appendChild(specsBox);
    }

    /* descrição longa do fabricante, no fim */
    const longa = t(p.descricaoLonga);
    if (longa) {
      const bloco = el('div', 'flow-det-longa');
      bloco.appendChild(faixaTitulo(ui('flowDescricao')));
      const cxLonga = el('div', 'flow-bloco-corpo');
      const corpo = el('div', 'flow-longa-txt');
      paragrafos(longa).forEach(n => corpo.appendChild(n));
      cxLonga.appendChild(corpo);
      /* imagem que acompanha a apresentação, quando o fabricante tem uma */
      if (Array.isArray(p.imagensLonga) && p.imagensLonga.length) {
        const fig = el('div', 'flow-det-figs' + (p.imagensLonga.length > 1 ? ' duas' : ''));
        p.imagensLonga.forEach(nome => {
          if (!nome) return;
          const im = el('img');
          im.src = '/images/flow/' + nome + '.webp';
          im.alt = p.nome;
          im.loading = 'lazy';
          im.addEventListener('error', () => im.remove());
          fig.appendChild(im);
        });
        if (fig.childNodes.length) cxLonga.appendChild(fig);
      }
      bloco.appendChild(cxLonga);
      d.appendChild(bloco);
    }

    /* ---- secções extra do fabricante (materiais, perfil, risers…) ----
       Ficam sempre abertas: o acordeão escondia o conteúdo atrás de um clique
       que a maioria não dá. A faixa azul de cada título é que serve de âncora
       para percorrer os temas depressa. */
    (p.seccoes || []).forEach(sx => {
      const corpo = t(sx.texto);
      const temImg = Array.isArray(sx.imagens) && sx.imagens.filter(Boolean).length;
      const temFich = Array.isArray(sx.ficheiros) && sx.ficheiros.filter(x => x && x.url).length;
      /* há secções da Flow que são só diagramas ou só ficheiros, sem texto nenhum */
      if (!corpo && !temImg && !temFich) return;
      const bloco = el('div', 'flow-det-extra');
      const ht = t(sx.titulo);
      /* a faixa azul atravessa o painel de lado a lado; o conteúdo vem por baixo */
      if (ht) {
        const faixa = el('div', 'flow-sec-faixa');
        const h = el('h4', 'flow-det-h'); h.textContent = ht;
        faixa.appendChild(h);
        bloco.appendChild(faixa);
      }
      const caixa = el('div', 'flow-sec-env');
      bloco.appendChild(caixa);

      /* Corpo em duas faixas: texto de um lado, diagramas do outro. Quando só
         há uma das duas coisas, ela ocupa a largura toda. */
      const temTxt = !!corpo;
      const nImg = Array.isArray(sx.imagens) ? sx.imagens.filter(Boolean).length : 0;
      const body = el('div', 'flow-sec-body' + (temTxt && nImg ? ' lado-a-lado' : '') +
        (temTxt && !nImg ? ' so-texto' : ''));

      if (temTxt) {
        const txt = el('div', 'flow-longa-txt');
        paragrafos(corpo).forEach(n => txt.appendChild(n));
        body.appendChild(txt);
      }
      /* diagramas técnicos que acompanham a secção (images/flow/<nome>.webp) */
      if (nImg) {
        const fig = el('div', 'flow-det-figs' + (nImg > 1 && !temTxt ? ' varias' : ''));
        sx.imagens.forEach(nome => {
          if (!nome) return;
          const im = el('img');
          im.src = '/images/flow/' + nome + '.webp';
          im.alt = (t(sx.titulo) || p.nome) + ' — ' + p.nome;
          im.loading = 'lazy';
          im.addEventListener('error', () => im.remove());
          fig.appendChild(im);
        });
        if (fig.childNodes.length) body.appendChild(fig);
      }
      if (body.childNodes.length) caixa.appendChild(body);
      /* manuais, planos de linhas e folhas de trim — apontam para a Flow,
         para estarem sempre na versão mais recente */
      if (Array.isArray(sx.ficheiros) && sx.ficheiros.length) {
        const lista = el('div', 'flow-det-files');
        sx.ficheiros.forEach(fx => {
          if (!fx || !fx.url) return;
          const a = el('a', 'flow-file');
          a.href = fx.url;
          /* o nome pode vir traduzido (objeto pt/en/…) ou como texto simples */
          a.textContent = (fx.nome && typeof fx.nome === 'object' ? t(fx.nome) : fx.nome) || fx.url;
          a.target = '_blank';
          a.rel = 'noopener';
          lista.appendChild(a);
        });
        if (lista.childNodes.length) caixa.appendChild(lista);
      }
      d.appendChild(bloco);
    });

    /* acerta o rótulo do botão com o estado inicial (tudo fechado) */
    if (d.__sincAcord) d.__sincAcord();

    d.addEventListener('click', ev => ev.stopPropagation());
    return d;
  }
  /* ---- gráfico de gama de vento ----
     Os valores são guardados em nós (é como o fabricante os publica); a
     conversão para km/h é feita na apresentação, para não haver dois
     conjuntos de números a divergir.

     A unidade de arranque não é fixa: é a do país do visitante, e passa a
     ser a última que ele escolheu. A mesma chave serve as páginas de
     detalhe geradas, para a escolha o seguir de uma para a outra. */
  function unidadeInicial() {
    try {
      const g = localStorage.getItem(CHAVE_UNIDADE);
      if (g === 'kn' || g === 'kmh') return g;
    } catch (e) {}
    try {
      const ls = navigator.languages || [navigator.language || ''];
      for (const x of ls) {
        const r = String(x).split('-')[1];
        if (r) return unidadeDoPais(r);
      }
    } catch (e) {}
    return 'kmh';
  }
  function guardaUnidade(u) {
    try { localStorage.setItem(CHAVE_UNIDADE, u); } catch (e) {}
  }
  function graficoVento(p) {
    const wr = p.windRange;
    const box = el('div', 'flow-wind');
    let unidade = unidadeInicial();

    /* o alternador nós / km/h vive dentro da faixa, à direita do título */
    const topo = el('div', 'flow-sec-faixa flow-wind-top');
    const h = el('h4', 'flow-det-h'); h.textContent = ui('flowVento'); topo.appendChild(h);
    const sw = el('div', 'flow-wind-units');
    const bKn = el('button', 'flow-unit' + (unidade === 'kn' ? ' on' : ''));
    bKn.type = 'button'; bKn.textContent = ui('unidadeKn');
    const bKm = el('button', 'flow-unit' + (unidade === 'kmh' ? ' on' : ''));
    bKm.type = 'button'; bKm.textContent = ui('unidadeKmh');
    sw.appendChild(bKn); sw.appendChild(bKm); topo.appendChild(sw);
    box.appendChild(topo);
    const cxVento = el('div', 'flow-bloco-corpo');

    const grupos = el('div', 'flow-wind-groups');
    cxVento.appendChild(grupos); box.appendChild(cxVento);

    /* escala: arredonda o máximo para cima, para as barras não tocarem no fim */
    let maxKn = 0;
    wr.groups.forEach(g => (g.rows || []).forEach(r => { maxKn = Math.max(maxKn, +r.max || 0); }));
    maxKn = Math.ceil((maxKn + 2) / 5) * 5;

    function desenha() {
      const fator = unidade === 'kn' ? 1 : KN_PARA_KMH;
      const maxU = maxKn * fator;
      /* marcas de 5 em 5 em nós, de 10 em 10 em km/h */
      const passo = unidade === 'kn' ? 5 : 10;
      grupos.innerHTML = '';
      wr.groups.forEach(g => {
        const gd = el('div', 'flow-wind-group');
        const lb = t(g.label);
        if (lb) { const l = el('div', 'flow-wind-glabel'); l.textContent = lb; gd.appendChild(l); }
        const chart = el('div', 'flow-wind-chart');
        (g.rows || []).forEach(r => {
          const linha = el('div', 'flow-wind-row');
          const tam = el('span', 'flow-wind-size'); tam.textContent = r.tamanho;
          const track = el('span', 'flow-wind-track');
          const ini = (+r.min * fator) / maxU * 100;
          const fim = (+r.max * fator) / maxU * 100;
          const bar = el('span', 'flow-wind-bar');
          bar.style.left = ini + '%';
          bar.style.width = Math.max(0, fim - ini) + '%';
          bar.title = Math.round(+r.min * fator) + '–' + Math.round(+r.max * fator) + ' ' +
            (unidade === 'kn' ? ui('unidadeKn') : ui('unidadeKmh'));
          track.appendChild(bar);
          const val = el('span', 'flow-wind-val');
          val.textContent = Math.round(+r.min * fator) + '–' + Math.round(+r.max * fator);
          linha.appendChild(tam); linha.appendChild(track); linha.appendChild(val);
          chart.appendChild(linha);
        });
        /* eixo */
        const eixo = el('div', 'flow-wind-row flow-wind-axis');
        eixo.appendChild(el('span', 'flow-wind-size'));
        const et = el('span', 'flow-wind-track');
        for (let v = 0; v <= maxU + 0.001; v += passo) {
          const m = el('span', 'flow-wind-tick');
          m.style.left = (v / maxU * 100) + '%';
          const n = el('i'); n.textContent = Math.round(v);
          m.appendChild(n); et.appendChild(m);
        }
        eixo.appendChild(et);
        const u = el('span', 'flow-wind-val'); u.textContent = unidade === 'kn' ? ui('unidadeKn') : ui('unidadeKmh');
        eixo.appendChild(u);
        chart.appendChild(eixo);
        gd.appendChild(chart);
        grupos.appendChild(gd);
      });
    }
    bKn.addEventListener('click', ev => { ev.stopPropagation(); unidade = 'kn'; bKn.classList.add('on'); bKm.classList.remove('on'); guardaUnidade('kn'); desenha(); });
    bKm.addEventListener('click', ev => { ev.stopPropagation(); unidade = 'kmh'; bKm.classList.add('on'); bKn.classList.remove('on'); guardaUnidade('kmh'); desenha(); });
    desenha();

    const nota = t(wr.note);
    if (nota) { const n = el('p', 'flow-wind-note'); n.textContent = nota; box.appendChild(n); }
    return box;
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
  /* ================= modo DESCOBERTA =================
     Uma asa em palco de cada vez, em vez de uma grelha de cartões. As perguntas
     não roubam o palco: são uma tira fina antes, uma janela enquanto se
     responde, e uma linha de respostas depois. A asa nunca deixa de ser a coisa
     maior no ecrã — foi essa a regra que decidiu o desenho todo.

     Vive dentro de buildFlow de propósito, para reaproveitar detalhe(),
     pedirPreco() e o resto sem duplicar nada. */
  function buildDescoberta() {
    const TERRENOS = ['praia', 'montanha', 'termica'];
    const NIVEIS = ['iniciado', 'avancado', 'experiente'];
    const rotNivel = n => ui('descNivel' + (NIVEIS.indexOf(n) + 1));
    const rotTerreno = t2 => ui('descTerr' + (TERRENOS.indexOf(t2) + 1));

    let resp = null;                 /* null = ainda não respondeu */
    let aPerguntar = false;
    let emPalco = produtos[0];
    let corCustom = null;            /* {ref, nome, hex} escolhida no palco */
    let corStd = null;               /* cor standard escolhida (nome no catalogo) */
    let tamsSel = [];                /* tamanhos escolhidos, viajam para o WhatsApp */
    let filtroCls = null;            /* homologação / tipo, dentro da família */

    const zona = el('div', 'desc');
    wrap.appendChild(zona);

    /* --- quem corresponde ao que foi respondido --------------------------- */
    function pontua(p) {
      if (!resp) return 0;
      let n = 0;
      if (resp.categoria && p.familia === resp.categoria) n += 4;
      if (resp.nivel && (p.nivel || []).indexOf(resp.nivel) >= 0) n += 3;
      if (resp.terreno && (p.terreno || []).indexOf(resp.terreno) >= 0) n += 2;
      if (resp.peso && tamanhoParaPeso(p, resp.peso)) n += 1;
      return n;
    }
    function correspondem() {
      if (!resp) return [];
      const max = Math.max.apply(null, produtos.map(pontua));
      if (max <= 0) return [];
      return produtos.filter(p => pontua(p) === max);
    }

    /* O tamanho certo sai do PTV que já está nas especificações — não é preciso
       campo novo nenhum.
       Duas armadilhas que os dados reais revelaram:
       - As faixas SOBREPÕEM-SE. Devolver a primeira que serve dava a mais
         pequena de todas: 88 kg na Mullet 2 acendia o 13.
       - Em muitas asas TODAS as faixas são iguais (a Mullet 2 e a Yoti 3 dizem
         o mesmo em todos os tamanhos, porque ali o tamanho escolhe-se pelo
         vento e pela perícia, não pelo peso).
       Por isso: escolhe-se o tamanho que põe o piloto mais perto do MEIO da
       faixa, e só se afirma quando há um vencedor único. Havendo empate, não
       se diz nada — é melhor calar do que apontar o tamanho errado. */
    function tamanhoParaPeso(p, kg) {
      const cand = [];
      (p.specs || []).forEach(x => {
        if (!x || !x.ptv || x.tamanho == null) return;
        const m = String(x.ptv).match(/(\d+)\s*[–—-]\s*(\d+)/);
        if (!m) return;
        const lo = +m[1], hi = +m[2];
        if (kg < lo || kg > hi) return;
        cand.push({ tam: String(x.tamanho), dist: Math.abs(kg - (lo + hi) / 2) });
      });
      if (!cand.length) return null;
      const min = Math.min.apply(null, cand.map(c => c.dist));
      const vencedores = cand.filter(c => c.dist === min);
      return vencedores.length === 1 ? vencedores[0].tam : null;
    }

    /* --- 1 · a tira do convite ------------------------------------------- */
    function tira() {
      const t2 = el('div', 'desc-tira');
      const ic = el('div', 'desc-tira-ic');
      ic.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M9.1 9a3 3 0 1 1 4.2 2.8c-.8.4-1.3 1.1-1.3 2v.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="12" cy="18.5" r="1.3" fill="currentColor"/></svg>';
      const txt = el('div', 'desc-tira-txt');
      const h = el('div', 'desc-tira-h'); h.textContent = ui('descTitulo');
      const sub = el('div', 'desc-tira-sub');
      sub.textContent = ui('descSub', { n: 4, t: produtos.length });
      txt.appendChild(h); txt.appendChild(sub);
      const b = el('button', 'flow-btn primary desc-tira-btn'); b.type = 'button';
      b.textContent = ui('descResponder');
      b.addEventListener('click', () => { aPerguntar = true; pinta(); });
      t2.appendChild(ic); t2.appendChild(txt); t2.appendChild(b);
      return t2;
    }

    /* --- 2 · as perguntas ------------------------------------------------- */
    function perguntas() {
      const r = Object.assign({ categoria: null, nivel: null, terreno: null, peso: 85 }, resp || {});
      const cx = el('div', 'desc-perg');

      const topo = el('div', 'desc-perg-topo');
      const tt = el('div');
      const h = el('div', 'desc-perg-h'); h.textContent = ui('descPergTit');
      const sub = el('div', 'desc-perg-sub'); sub.textContent = ui('descPergSub');
      tt.appendChild(h); tt.appendChild(sub);
      const x = el('button', 'desc-perg-x'); x.type = 'button';
      x.setAttribute('aria-label', ui('flowFechar')); x.innerHTML = '&times;';
      x.addEventListener('click', () => { aPerguntar = false; pinta(); });
      topo.appendChild(tt); topo.appendChild(x);
      cx.appendChild(topo);

      const conta = el('span', 'desc-perg-conta');
      const refresca = () => {
        const antes = resp; resp = r;
        conta.textContent = ui('descContam', { n: correspondem().length, t: produtos.length });
        resp = antes;
      };

      /* 1 · categoria — a linha toda, porque é o corte maior */
      const g1 = el('div', 'desc-grupo');
      const l1 = el('div', 'desc-lbl'); l1.textContent = ui('descQ1');
      const f1 = el('div', 'desc-cats');
      familias.forEach(fam => {
        const b = el('button', 'desc-cat'); b.type = 'button';
        b.appendChild(document.createTextNode(rotuloFamilia(fam) + ' '));
        const n = el('span'); n.textContent = produtos.filter(p => p.familia === fam).length;
        b.appendChild(n);
        if (r.categoria === fam) b.classList.add('on');
        b.addEventListener('click', () => {
          r.categoria = r.categoria === fam ? null : fam;
          f1.querySelectorAll('.desc-cat').forEach(o => o.classList.remove('on'));
          if (r.categoria) b.classList.add('on');
          livre.classList.toggle('on', !r.categoria);
          refresca();
        });
        f1.appendChild(b);
      });
      const livre = el('button', 'desc-cat livre' + (r.categoria ? '' : ' on')); livre.type = 'button';
      livre.textContent = ui('descNaoSei');
      livre.addEventListener('click', () => {
        r.categoria = null;
        f1.querySelectorAll('.desc-cat').forEach(o => o.classList.remove('on'));
        livre.classList.add('on'); refresca();
      });
      f1.appendChild(livre);
      g1.appendChild(l1); g1.appendChild(f1); cx.appendChild(g1);

      cx.appendChild(el('div', 'desc-risco'));

      /* 2, 3, 4 — em três colunas */
      const tres = el('div', 'desc-tres');

      const chips = (rot, lista, valor, rotulo, ao) => {
        const g = el('div', 'desc-grupo');
        const l = el('div', 'desc-lbl'); l.textContent = rot;
        const f = el('div', 'desc-chips');
        lista.forEach(v => {
          const b = el('button', 'desc-chip' + (valor() === v ? ' on' : '')); b.type = 'button';
          b.textContent = rotulo(v);
          b.addEventListener('click', () => {
            ao(valor() === v ? null : v);
            f.querySelectorAll('.desc-chip').forEach(o => o.classList.remove('on'));
            if (valor() === v) b.classList.add('on');
            refresca();
          });
          f.appendChild(b);
        });
        g.appendChild(l); g.appendChild(f);
        return g;
      };

      tres.appendChild(chips(ui('descQ2'), NIVEIS, () => r.nivel, rotNivel, v => { r.nivel = v; }));
      tres.appendChild(chips(ui('descQ3'), TERRENOS, () => r.terreno, rotTerreno, v => { r.terreno = v; }));

      const g4 = el('div', 'desc-grupo');
      const l4 = el('div', 'desc-lbl'); l4.textContent = ui('descQ4');
      const linha = el('div', 'desc-peso');
      const sl = el('input', 'desc-peso-sl');
      sl.type = 'range'; sl.min = '45'; sl.max = '135'; sl.step = '1'; sl.value = String(r.peso);
      sl.setAttribute('aria-label', ui('descQ4'));
      const kg = el('div', 'desc-peso-kg'); kg.textContent = r.peso + ' kg';
      sl.addEventListener('input', () => { r.peso = +sl.value; kg.textContent = r.peso + ' kg'; refresca(); });
      linha.appendChild(sl); linha.appendChild(kg);
      g4.appendChild(l4); g4.appendChild(linha);
      tres.appendChild(g4);
      cx.appendChild(tres);

      const rodape = el('div', 'desc-perg-rodape');
      const ok = el('button', 'flow-btn primary'); ok.type = 'button';
      ok.textContent = ui('descMostra');
      ok.addEventListener('click', () => {
        resp = r; aPerguntar = false;
        /* respostas novas, contexto novo: o filtro de classe da família
           anterior não sobrevive. Se sobrevivesse, alguém que tinha "EN-D"
           escolhido e respondesse "sou principiante" via uma lista vazia e
           não percebia porquê. */
        filtroCls = null;
        const lista = correspondem();
        if (lista.length) emPalco = lista[0];
        corCustom = null;
        pinta();
      });
      rodape.appendChild(ok); rodape.appendChild(conta);
      cx.appendChild(rodape);
      refresca();
      return cx;
    }

    /* --- 3 · a linha das respostas --------------------------------------- */
    function linhaRespostas() {
      const l = el('div', 'desc-resps');
      const et = el('span', 'desc-resps-lbl'); et.textContent = ui('descFiltrado');
      l.appendChild(et);
      const poe = txt => { const c = el('span', 'desc-resp'); c.textContent = txt; l.appendChild(c); };
      if (resp.categoria) poe(rotuloFamilia(resp.categoria));
      if (resp.nivel) poe(rotNivel(resp.nivel));
      if (resp.terreno) poe(rotTerreno(resp.terreno));
      if (resp.peso) poe(resp.peso + ' kg');
      const alt = el('button', 'desc-lig'); alt.type = 'button';
      alt.textContent = ui('descAlterar');
      alt.addEventListener('click', () => { aPerguntar = true; pinta(); });
      l.appendChild(alt);
      const fim = el('span', 'desc-resps-fim');
      const n = correspondem().length;
      fim.appendChild(document.createTextNode(n + ' / ' + produtos.length));
      l.appendChild(fim);
      /* apagar as respostas era uma ligação em texto miudinho no fim da linha,
         a dizer "ver a gama toda" — que descreve o efeito e não a acção.
         Agora é um botão com um × e diz o que faz. */
      const limpa = el('button', 'desc-limpar'); limpa.type = 'button';
      limpa.setAttribute('aria-label', ui('descApagar'));
      const lt = el('span'); lt.textContent = ui('descApagar');
      limpa.appendChild(lt);
      limpa.appendChild(el('span', 'desc-limpar-x')).textContent = '×';
      limpa.addEventListener('click', () => { resp = null; filtroCls = null; corCustom = null; pinta(); });
      l.appendChild(limpa);
      return l;
    }

    /* --- 4 · o palco ------------------------------------------------------ */
    function palco() {
      const p = emPalco;
      const cx = el('div', 'desc-palco');
      const esq = el('div', 'desc-esq');

      const lista = correspondem();
      const eMelhor = resp && lista.length && lista[0] === p;
      if (eMelhor) {
        const topo = el('div', 'desc-selo-linha');
        const selo = el('span', 'desc-selo'); selo.textContent = ui('descMelhor');
        topo.appendChild(selo);
        if (lista.length > 1) {
          const q = el('span', 'desc-quantas');
          q.textContent = '1 / ' + lista.length;
          topo.appendChild(q);
        }
        esq.appendChild(topo);
      }

      /* logotipo em vez do nome escrito. O nome fica no alt, por isso nao se
         perde para leitores de ecra nem para pesquisa; sem logotipo, volta
         sozinho ao nome escrito (a MulletX e a Vissta ainda nao o tem). */
      if (p.logo) {
        const cxl = el('h3', 'desc-nome-logo');
        /* o campo guarda a chave, nao o caminho — como no cartao da grelha */
        const li = el('img'); li.src = '/images/logos/' + p.logo + '.webp'; li.alt = p.nome;
        li.addEventListener('error', () => {
          const h2 = el('h3', 'desc-nome'); h2.textContent = p.nome;
          cxl.replaceWith(h2);
        });
        cxl.appendChild(li); esq.appendChild(cxl);
      } else {
        const h = el('h3', 'desc-nome'); h.textContent = p.nome; esq.appendChild(h);
      }
      const eb = el('div', 'desc-eyebrow');
      eb.textContent = rotuloClasse(p.classificacao || '') || rotuloFamilia(p.familia);
      /* o selo entra na mesma linha da categoria: é a linha que se lê logo a
         seguir ao nome, e é ali que a informação vale alguma coisa */
      const seloP = seloOferta(p);
      if (seloP) { const lin = el('div', 'desc-linha-cat'); lin.appendChild(eb); lin.appendChild(seloP); esq.appendChild(lin); }
      else esq.appendChild(eb);

      const tl = t(p.tagline);
      if (tl) { const d = el('p', 'desc-tagline'); d.textContent = tl; esq.appendChild(d); }

      /* a voz do revendedor: só aparece se houver respostas e texto escrito */
      const porque = t(p.porque);
      if (resp && porque) {
        const b = el('div', 'desc-porque');
        const s2 = el('b'); s2.textContent = ui('descPorque');
        b.appendChild(s2); b.appendChild(document.createTextNode(' ' + porque));
        esq.appendChild(b);
      }

      /* tamanhos + cores standard */
      /* declarados antes dos botoes que lhes mexem */
      const img = el('img', 'desc-img');
      img.alt = p.nome;
      const nomeCor = el('div', 'desc-custom-nome');

      /* atribuída mais abaixo, quando o botão existir; os handlers das
         amostras são construídos antes dele e fecham sobre a variável */
      let sincronizaVer = () => {};
      const dados = el('div', 'desc-dados');
      if ((p.tamanhos || []).length) {
        const g = el('div');
        const lb = el('div', 'desc-lbl');
        const certo = resp && resp.peso ? tamanhoParaPeso(p, resp.peso) : null;
        lb.appendChild(document.createTextNode(ui('flowTamanhos') + ' '));
        if (certo) { const s3 = el('span', 'desc-lbl-hi'); s3.textContent = ui('descTeuTam', { t: certo }); lb.appendChild(s3); }
        const f = el('div', 'flow-sizes');
        p.tamanhos.forEach(tm => {
          /* botao, nao span: aqui o tamanho escolhe-se, e a escolha viaja para
             a mensagem de WhatsApp */
          const dentro = tamsSel.indexOf(String(tm)) >= 0;
          const c = el('button', 'flow-size desc-size'
            + (certo && String(tm) === certo ? ' desc-size-hi' : '')
            + (dentro ? ' on' : ''));
          c.type = 'button';
          c.setAttribute('aria-pressed', dentro ? 'true' : 'false');
          c.textContent = tm;
          /* varios de uma vez: quem hesita entre dois pergunta pelos dois */
          c.addEventListener('click', () => {
            const i = tamsSel.indexOf(String(tm));
            if (i >= 0) tamsSel.splice(i, 1); else tamsSel.push(String(tm));
            const on = tamsSel.indexOf(String(tm)) >= 0;
            c.classList.toggle('on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
            sincronizaVer();
          });
          f.appendChild(c);
        });
        g.appendChild(lb); g.appendChild(f); dados.appendChild(g);
      }
      if ((p.cores || []).length) {
        const g = el('div');
        const lb = el('div', 'desc-lbl'); lb.textContent = ui('flowCores');
        const f = el('div', 'flow-swatches');
        p.cores.forEach(cor => {
          const b = el('button', 'flow-sw' + (corStd === cor ? ' on' : ''));
          b.type = 'button';
          b.style.background = corAmostra(cor);
          const rot = String(cor).replace(/-/g, ' ');
          b.title = rot;
          b.setAttribute('aria-label', rot);
          b.setAttribute('aria-pressed', corStd === cor ? 'true' : 'false');
          b.addEventListener('click', () => {
            /* escolher uma cor standard mostra ESSA cor, tal como e de fabrica.
               Herdar a custom escolhida antes escondia o que se pediu para ver. */
            corStd = cor; corCustom = null;
            img.src = fotoSrc(p.nome, cor, false);
            nomeCor.textContent = rot;
            esq.querySelectorAll('.desc-custom .flow-custom-sw').forEach(o => {
              o.classList.remove('on'); o.setAttribute('aria-checked', 'false');
            });
            f.querySelectorAll('.flow-sw').forEach(o => {
              o.classList.remove('on'); o.setAttribute('aria-pressed', 'false');
            });
            b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
            sincronizaVer();
          });
          f.appendChild(b);
        });
        g.appendChild(lb); g.appendChild(f); dados.appendChild(g);
      }
      esq.appendChild(dados);

      /* acções */
      const acoes = el('div', 'desc-acoes');
      /* também aqui: a página da asa em vez do painel */
      const ver = el('a', 'flow-btn primary');
      ver.textContent = ui('flowVerDetalhes');
      /* o link acompanha o que a pessoa já escolheu aqui: quem passou dez
         segundos a experimentar cores não pode aterrar numa página em branco */
      sincronizaVer = () => {
        ver.href = caminhoAsa(p) + fragmentoEscolha({
          esq: corStd, cor: corCustom ? corCustom.ref : '', tams: tamsSel
        });
      };
      sincronizaVer();
      const wa = el('button', 'flow-btn wa'); wa.type = 'button';
      wa.innerHTML = ICON_WA;
      const wl = el('span'); wl.textContent = ui('flowPedirPreco'); wa.appendChild(wl);
      if (p.historico === true) wa.hidden = true;   /* não se pede preço de uma versão antiga */
      wa.addEventListener('click', () => {
        p.corEscolhida = corCustom ? corCustom.nome
          : (corStd ? String(corStd).replace(/-/g, ' ') : null);
        pedirPreco(p, num, tamsSel, img.getAttribute('src'));
      });
      acoes.appendChild(ver); acoes.appendChild(wa);
      esq.appendChild(acoes);

      /* cor à medida, por baixo dos botões */
      const esquema = () => corStd || (p.cores || [])[0] || 'base';
      /* cada esquema standard tem o seu conjunto de custom: a cor custom troca
         so a BASE, e as riscas de cada esquema mantem-se. Sem isto, escolher a
         sunrise e depois uma cor devolvia a asa maui recolorida — perdia-se-lhe
         o laranja e o amarelo. */
      const fotoCustom = c => '/images/asas-cores/' + chaveFoto(p.nome) + '__' + esquema() + '__' + c.ref + '.webp';
      const fotoBase = () => (p.cores || []).length ? fotoSrc(p.nome, esquema(), false) : '';
      img.src = corCustom ? fotoCustom(corCustom) : fotoBase();
      /* nunca mostrar o icone de imagem partida: se faltar o ficheiro, volta a
         primeira cor da asa; se essa tambem faltar, esconde-se */
      img.addEventListener('error', () => {
        const primeira = (p.cores || [])[0];
        const recurso = primeira ? fotoSrc(p.nome, primeira, false) : '';
        if (recurso && img.getAttribute('src') !== recurso) { img.src = recurso; return; }
        img.style.visibility = 'hidden';
      });

      if (p.coresCustom && TECIDOS.length) {
        const cores = Array.isArray(p.coresCustom)
          ? TECIDOS.filter(c => p.coresCustom.indexOf(c.ref) >= 0) : TECIDOS;
        const bl = el('div', 'desc-custom');
        const cab = el('div', 'desc-custom-cab');
        const lb = el('div', 'desc-lbl'); lb.textContent = ui('corMedida');
        nomeCor.textContent = corCustom ? corCustom.nome : (corStd ? String(corStd).replace(/-/g,' ') : '');
        cab.appendChild(lb); cab.appendChild(nomeCor);
        const fila = el('div', 'desc-custom-fila');
        fila.setAttribute('role', 'radiogroup');
        fila.setAttribute('aria-label', ui('corMedida'));
        cores.forEach(c => {
          const b = el('button', 'flow-custom-sw' + (corCustom && corCustom.ref === c.ref ? ' on' : ''));
          b.type = 'button'; b.style.background = c.hex; b.title = c.nome;
          b.setAttribute('role', 'radio');
          b.setAttribute('aria-checked', corCustom && corCustom.ref === c.ref ? 'true' : 'false');
          b.setAttribute('aria-label', c.nome);
          b.addEventListener('click', () => {
            corCustom = c;
            img.src = fotoCustom(c);
            esq.querySelectorAll('.desc-esq .flow-sw, .flow-sw').forEach(o => {
              if (o.closest('.desc-custom')) return;
              o.classList.remove('on'); o.setAttribute('aria-pressed', 'false');
            });
            nomeCor.textContent = c.nome;
            fila.querySelectorAll('.flow-custom-sw').forEach(o => {
              o.classList.remove('on'); o.setAttribute('aria-checked', 'false');
            });
            b.classList.add('on'); b.setAttribute('aria-checked', 'true');
            sincronizaVer();
          });
          fila.appendChild(b);
        });
        const nota = el('p', 'desc-custom-nota'); nota.textContent = ui('corIndicativa');
        bl.appendChild(cab); bl.appendChild(fila); bl.appendChild(nota);
        esq.appendChild(bl);
      }

      const dir = el('div', 'desc-dir');
      dir.appendChild(img);

      cx.appendChild(esq); cx.appendChild(dir);
      return cx;
    }

    /* --- 5 · o carril ----------------------------------------------------- */
    function carril() {
      const lista = correspondem();
      const naFam = daFamilia();   /* família + filtro de classe */
      /* O carril é da FAMÍLIA que está escolhida em cima, sempre.
         Antes juntava as correspondências de todas as famílias — fazia sentido
         quando responder às perguntas era a única forma de sair de uma família.
         Com os separadores, dava isto: escolher Tandem punha um tandem em palco
         e oito parapentes no carril. Agora quem diz onde estão as
         correspondências são os números dos separadores. */
      const boas = lista.filter(p => naFam.indexOf(p) >= 0);
      const ordem = boas.length ? boas.concat(naFam.filter(p => boas.indexOf(p) < 0)) : naFam;

      const cx = el('div', 'desc-carril');
      const cab = el('div', 'desc-carril-cab');
      const a = el('div', 'desc-lbl desc-lbl-forte');
      a.textContent = !resp || !boas.length ? rotuloFamilia(emPalco.familia)
        : boas.length === 1 ? ui('descATua') : ui('descAsTuas', { n: boas.length });
      cab.appendChild(a);
      cab.appendChild(el('div', 'desc-carril-risco'));
      if (resp && boas.length && boas.length < naFam.length) {
        const b = el('div', 'desc-lbl'); b.textContent = ui('descRestoFam'); cab.appendChild(b);
      }
      cx.appendChild(cab);

      const fila = el('div', 'desc-carril-fila');
      ordem.forEach(p => {
        const eDelas = resp && boas.indexOf(p) >= 0;
        const b = el('button', 'desc-mini' + (p === emPalco ? ' on' : '') + (resp && !eDelas ? ' fora' : ''));
        b.type = 'button';
        const im = el('img');
        im.src = (p.cores || []).length ? fotoSrc(p.nome, p.cores[0], true) : '';
        im.alt = ''; im.loading = 'lazy';
        im.addEventListener('error', () => { im.style.visibility = 'hidden'; });
        const tx = el('div');
        const n = el('div', 'desc-mini-nome'); n.textContent = p.nome;
        const c = el('div', 'desc-mini-cls');
        c.textContent = p === emPalco ? ui('descAVer') : (rotuloClasse(p.classificacao || '') || '');
        tx.appendChild(n); tx.appendChild(c);
        const seloM = seloOferta(p, 'selo-mini'); if (seloM) tx.appendChild(seloM);
        b.appendChild(im); b.appendChild(tx);
        b.addEventListener('click', () => {
          /* limpa tudo: os nomes das cores sao proprios de cada asa (a Mullet 2
             tem maui/sunrise, a AlbatroXX lilac/lime/yellow), e arrastar a
             escolha da anterior pedia um ficheiro que nao existe */
          emPalco = p; corStd = null; corCustom = null; tamsSel = []; aberto = null;
          pinta();
        });
        fila.appendChild(b);
      });
      cx.appendChild(fila);
      return cx;
    }

    /* --- desenha tudo ----------------------------------------------------- */
    /* quantas das melhores correspondências caem em cada família. Com a
       pergunta da categoria a valer 4 pontos, responder "parakites" põe as
       outras sete a zero — e é verdade: se ela disse que quer um parakite,
       um parapente não corresponde. Esbatem-se, mas continuam a abrir. */
    function contaFamilia(f) {
      if (!resp) return produtos.filter(p => p.familia === f).length;
      return correspondem().filter(p => p.familia === f).length;
    }
    /* as asas da família em palco que passam o filtro de classe */
    function daFamilia(f) {
      const todas = produtos.filter(p => p.familia === (f || emPalco.familia));
      return filtroCls ? todas.filter(p => p.classificacao === filtroCls) : todas;
    }
    function barraFamilias() {
      const cx = el('div', 'flow-fams desc-fams');
      poeFamilias(cx, {
        activa: f => f === emPalco.familia,
        vazia:  f => !!resp && contaFamilia(f) === 0,
        conta:  contaFamilia,
        aoClicar: f => {
          /* mantém as respostas: entra na família pela asa que melhor
             corresponde, ou pela primeira se nenhuma corresponder */
          const boas = correspondem().filter(p => p.familia === f);
          const naFam = produtos.filter(p => p.familia === f);
          const destino = boas[0] || naFam[0];
          if (!destino) return;
          /* limpa a cor e os tamanhos: os nomes das cores são próprios de
             cada asa e arrastá-los pedia ficheiros que não existem.
             E limpa o FILTRO: um "EN-B" pendurado ao saltar para os arneses
             não quer dizer nada. */
          emPalco = destino; filtroCls = null;
          corStd = null; corCustom = null; tamsSel = []; aberto = null;
          pinta();
        }
      });
      return cx;
    }

    function contaClasse(v) {
      const naFam = produtos.filter(p => p.familia === emPalco.familia);
      const base = resp ? naFam.filter(p => correspondem().indexOf(p) >= 0) : naFam;
      return v ? base.filter(p => p.classificacao === v).length : base.length;
    }
    function barraFiltros() {
      const cx = el('div', 'flow-filters desc-filtros');
      const houve = poeFiltros(cx, emPalco.familia, {
        activo: v => filtroCls === v,
        vazio:  v => !!resp && contaClasse(v) === 0,
        conta:  contaClasse,
        aoClicar: v => {
          filtroCls = v;
          /* se a asa em palco não passa o novo filtro, entra a melhor que passe */
          const dentro = daFamilia();
          if (dentro.indexOf(emPalco) < 0) {
            const boas = correspondem().filter(p => dentro.indexOf(p) >= 0);
            const destino = boas[0] || dentro[0];
            if (destino) {
              emPalco = destino; corStd = null; corCustom = null; tamsSel = []; aberto = null;
            }
          }
          pinta();
        }
      });
      return houve ? cx : null;
    }

    function pinta() {
      zona.innerHTML = '';
      zona.appendChild(aPerguntar ? perguntas() : (resp ? linhaRespostas() : tira()));
      const p = el('div', 'desc-corpo' + (aPerguntar ? ' esbatido' : ''));
      p.appendChild(barraFamilias());
      const bf = barraFiltros(); if (bf) p.appendChild(bf);
      if (resp && !correspondem().length) {
        const av = el('p', 'desc-nenhuma'); av.textContent = ui('descNenhuma');
        p.appendChild(av);
      }
      p.appendChild(palco());
      p.appendChild(carril());
      zona.appendChild(p);
      if (aberto) zona.appendChild(detalhe(aberto));
    }

    redesenha = pinta;
    pinta();
  }

  function render() { renderFams(); renderFiltros(); renderGrelha(); }
  /* o painel de detalhe e partilhado pelos dois modos, mas cada um redesenha-se
     de maneira diferente. Sem este desvio o X do detalhe nao fazia nada no modo
     descoberta: chamava o render da grelha, que ali nao existe. */
  let redesenha = render;

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
    if (e.key === 'Escape' && aberto) { aberto = null; sincronizaHash(); redesenha(); }
  });

  if (descoberta) buildDescoberta(); else render();
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

/* ---- vídeo do YouTube ----
   Mostra só a miniatura; o iframe do YouTube entra apenas quando se carrega
   no play. Assim a página não carrega os scripts nem os cookies do YouTube
   a quem nunca vê o vídeo — e poupa muito peso no telemóvel. */
function buildVideo(item) {
  const id = String(item.videoId || '').trim();
  const wrap = el('div', 'hs-video' + visibilityClass(item));
  if (!id) return wrap;

  const box = el('button', 'hs-video-box');   /* botão: acessível por teclado */
  box.type = 'button';
  const titulo = t(item.title);
  box.setAttribute('aria-label', ui('videoPlay', { n: titulo || 'YouTube' }));

  const img = el('img', 'hs-video-thumb');
  /* nem todos os vídeos têm maxresdefault; se faltar, cai para hqdefault */
  img.src = item.thumbnail || ('https://img.youtube.com/vi/' + id + '/maxresdefault.jpg');
  img.alt = '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.src = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
  }, { once: false });
  box.appendChild(img);

  box.appendChild(el('span', 'hs-video-scrim'));

  const kicker = t(item.kicker);
  if (kicker || titulo) {
    const cap = el('span', 'hs-video-cap');
    if (kicker) { const k = el('span', 'hs-video-kicker'); k.textContent = kicker; cap.appendChild(k); }
    if (titulo) { const h = el('span', 'hs-video-title'); h.textContent = titulo; cap.appendChild(h); }
    box.appendChild(cap);
  }

  const play = el('span', 'hs-play');
  play.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  box.appendChild(play);

  box.addEventListener('click', () => {
    const start = parseInt(item.startAt, 10);
    const src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0' + (start > 0 ? '&start=' + start : '');
    const frame = el('iframe', 'hs-video-frame');
    frame.src = src;
    frame.title = titulo || 'YouTube';
    frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    wrap.innerHTML = '';
    wrap.appendChild(frame);
  });

  wrap.appendChild(box);
  return wrap;
}

/* Texto em vários parágrafos, com **negrito**. Construído com nós de texto
   e não com innerHTML: o conteúdo vem do CMS e não deve poder injetar HTML.
   Estava aninhada dentro de buildFlow; passou para aqui quando a biografia
   também precisou dela. Só usa el() e o document, não fechava sobre nada. */

/* ---- biografia ----
   Faixa de imagem, credenciais, abertura em prosa e o percurso em linha de
   tempo. Os anos vêm dos dados e não do código, porque um marco novo tem de se
   poder acrescentar no CMS sem tocar aqui.
   Nomes de bandas, discos, músicas e locais são texto simples de propósito:
   não se traduzem, e t() devolve as strings tal e qual. */
let TECIDOS = [];   /* carta de cores da Flow, carregada com o conteúdo */
let ioVento = null; /* observador que liga/desliga o vento por secção */
let AVISOS = [];    /* avisos e ofertas, para saber que asas trazem selo */


/* ================= Avisos e ofertas =================
   Um tipo de conteúdo só, com duas apresentações: faixa no topo (não interrompe,
   fica dias) e janela (interrompe, usa-se pouco). Tudo o resto é partilhado —
   datas, idiomas, memória do que já foi fechado e a regra de um de cada vez. */

const AVISO_MEM = 'hs-avisos';

function leMem(loja) {
  try { return JSON.parse(loja.getItem(AVISO_MEM)) || {}; } catch (e) { return {}; }
}
function avisosFechados() { return leMem(localStorage); }
function avisosFechadosSessao() { return leMem(sessionStorage); }

/* Fechar guarda-se nos dois sítios: a sessão serve o "fica fechado enquanto cá
   estou", o localStorage serve o "não voltes durante N dias". Qual deles conta
   depende do que o aviso pedir. */
function marcaFechado(id) {
  [localStorage, sessionStorage].forEach(loja => {
    const m = leMem(loja);
    m[id] = Date.now();
    try { loja.setItem(AVISO_MEM, JSON.stringify(m)); } catch (e) {}
  });
}


function avisoElegivel(a, fechados) {
  /* datas e "está ligado" vêm de regras/avisos.mjs, partilhado com o gerador
     das páginas das asas: se cada um tivesse a sua cópia, mais tarde ou mais
     cedo mostravam ofertas diferentes */
  if (!dentroDoPrazo(a)) return false;

  /* daqui para baixo é memória deste browser, que só existe aqui */
  /* três políticas:
       sessao — volta em cada visita nova, mas fica fechado nesta
       nunca  — fechou uma vez, não volta mais
       <n>    — volta ao fim de n dias
     A faixa não tapa nada, por isso a omissão dela é "sessao"; a janela
     interrompe, e uma janela que salta a cada visita é uma armadilha. */
  const politica = a.repetir || (a.forma === 'faixa' ? 'sessao' : 'nunca');

  if (politica === 'sessao') return !avisosFechadosSessao()[a.id];
  if (politica === 'nunca') return !fechados[a.id];

  const quando = fechados[a.id];
  const dias = Number(politica) || 0;
  if (quando && (!dias || Date.now() - quando < dias * 86400000)) return false;
  return true;
}

/* O prazo é escrito a partir da data de fim, para a data existir num sítio só:
   estica-se a oferta uma semana e não há cinco textos para corrigir. */
function prazoAviso(a) {
  if (!a.fim || a.prazo === 'nenhum') return '';
  const fim = new Date(String(a.fim).slice(0, 10) + 'T23:59:59');
  if (isNaN(fim)) return '';
  if (a.prazo === 'contagem') {
    const dias = Math.ceil((fim - Date.now()) / 86400000);
    if (dias < 0) return '';
    if (dias === 0) return ui('avisoUltimoDia');
    if (dias === 1) return ui('avisoFaltaUm');
    return ui('avisoFaltam', { n: dias });
  }
  let d;
  try { d = fim.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' }); }
  catch (e) { d = String(a.fim).slice(0, 10); }
  return ui('avisoAte', { d: d });
}

/* O botão faz uma de quatro coisas. Nada de endereços à mão: o que existe está
   aqui, e o que não existe não se pode escolher no CMS. */
function acaoAviso(botao, aviso, num, fecha) {
  const alvo = String(botao.alvo || '');
  switch (botao.acao) {
    /* leva à secção dos produtos E escolhe a família: sem isto quem clica cai
       nos Parapentes, que é a família que abre por omissão, e não vê um
       parakite sequer */
    case 'familia': {
      const b = el('button'); b.type = 'button';
      b.addEventListener('click', () => {
        fecha();
        const sec = document.getElementById('produtos');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        /* compara com a CHAVE e não com o que se lê: em alemão o separador diz
           "Gleitschirme" e a comparação por texto deixaria de encontrar nada */
        const alvoNorm = alvo.trim().toLowerCase();
        const tab = [...document.querySelectorAll('.flow-fam')]
          .find(x => String(x.dataset.familia || '').toLowerCase() === alvoNorm);
        if (tab) tab.click();
      });
      return b;
    }
    case 'seccao': {
      const a = el('a'); a.href = '#' + alvo.replace(/^#/, '');
      a.addEventListener('click', fecha);
      return a;
    }
    case 'whatsapp': {
      const a = el('a');
      /* a referência viaja na mensagem: é assim que sabes de onde veio o contacto */
      const msg = (t(botao.mensagem) || '') + (aviso.id ? '\n\n[' + aviso.id + ']' : '');
      a.href = waLink(num, msg);
      a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', fecha);
      return a;
    }
    case 'url': {
      const a = el('a'); a.href = local(alvo);
      a.target = '_blank'; a.rel = 'noopener';
      return a;
    }
    default: {
      const b = el('button'); b.type = 'button';
      b.addEventListener('click', fecha);
      return b;
    }
  }
}

function faixaAviso(a, num) {
  const faixa = el('div', 'av-faixa t-' + (a.tipo || 'aviso'));
  faixa.setAttribute('role', 'status');
  const fecha = () => { faixa.remove(); marcaFechado(a.id); };

  const etiqueta = t(a.etiqueta);
  if (etiqueta) { const s = el('span', 'av-tag'); s.textContent = etiqueta; faixa.appendChild(s); }

  const txt = el('span', 'av-txt'); txt.textContent = t(a.texto) || t(a.titulo);
  faixa.appendChild(txt);

  /* as ofertas saem dos pontos que já preencheste para a janela — não se
     reescrevem. No estreito desaparecem: uma faixa de três linhas num telemóvel
     deixa de ser uma faixa e passa a ser uma parede. */
  if (a.ofertasNaFaixa !== false && (a.pontos || []).length) {
    const g = el('span', 'av-ofertas');
    /* só os pontos marcados como oferta: entre eles há slogans, e um slogan
       na faixa ocupa o lugar de uma coisa que se recebe */
    a.pontos.filter(p => p.naFaixa !== false).slice(0, 3).forEach(p => {
      const nome = t(p.titulo);
      if (!nome) return;
      const c = el('span', 'av-oferta');
      c.textContent = nome;
      g.appendChild(c);
    });
    if (g.children.length) faixa.appendChild(g);
  }

  const prazo = prazoAviso(a);
  if (prazo) { const s = el('span', 'av-prazo'); s.textContent = prazo; faixa.appendChild(s); }

  const b1 = a.botao1;
  if (b1 && b1.visivel !== false && t(b1.texto)) {
    const n = acaoAviso(b1, a, num, fecha);
    n.className = 'av-btn';
    n.textContent = t(b1.texto);
    faixa.appendChild(n);
  }

  const x = el('button', 'av-x'); x.type = 'button';
  x.setAttribute('aria-label', ui('flowFechar'));
  x.innerHTML = '&times;';
  x.addEventListener('click', fecha);
  faixa.appendChild(x);
  return faixa;
}

/* Enquadra o título sobre a arte. Tudo o que é medida vai em percentagem da
   LARGURA DA IMAGEM e não em pixels: um "48px" fica bem no ecrã de quem o
   escreveu e enorme ou minúsculo em todos os outros. Assim o texto acompanha a
   imagem em qualquer tamanho, que é a única forma de isto ser fiável. */
const TIT_ENTRELINHA = { apertada: '.95', normal: '1.15', solta: '1.4' };
const TIT_ESPACAMENTO = { apertado: '-.03em', normal: '0', solto: '.08em' };

function aplicaFormatoTitulo(no, f) {
  const anc = String(f.ancora || 'cima-esquerda').split('-');
  no.classList.add('v-' + (anc[0] || 'cima'), 'h-' + (anc[1] || 'esquerda'));
  if (f.alinhar) no.classList.add('al-' + f.alinhar);
  if (f.cor) no.classList.add('cor-' + f.cor);
  if (f.maiusculas) no.classList.add('maius');
  if (f.sombra === false) no.classList.add('sem-sombra');
  if (f.saiNoTelemovel) no.classList.add('sai-tele');

  const n = (v, omissao) => (typeof v === 'number' ? v : omissao);
  no.style.setProperty('--x', n(f.x, 5) + '%');
  no.style.setProperty('--y', n(f.y, 16) + '%');
  no.style.setProperty('--w', n(f.largura, 52) + '%');
  no.style.setProperty('--fs', n(f.tamanho, 6) + 'cqw');
  no.style.setProperty('--lh', TIT_ENTRELINHA[f.entrelinha] || TIT_ENTRELINHA.apertada);
  no.style.setProperty('--ls', TIT_ESPACAMENTO[f.espacamento] || '-.02em');
  no.style.setProperty('--peso', n(f.peso, 900));
}

/* chave: a faixa e a janela do mesmo aviso não podem partilhar a memória do
   "fechado". Se partilharem, fechar a janela fecha também a faixa — e como
   mudar de idioma recarrega a página, a faixa desaparecia sem ninguém lhe ter
   tocado. */
function janelaAviso(a, num, chave) {
  const fundo = el('div', 'av-fundo');
  const cx = el('div', 'av-janela');
  cx.setAttribute('role', 'dialog');
  cx.setAttribute('aria-modal', 'true');

  const tecla = ev => { if (ev.key === 'Escape') fecha(); };
  const fecha = () => {
    document.removeEventListener('keydown', tecla);
    fundo.remove();
    marcaFechado(chave || a.id);
  };
  document.addEventListener('keydown', tecla);
  fundo.addEventListener('click', ev => { if (ev.target === fundo) fecha(); });

  const x = el('button', 'av-fechar'); x.type = 'button';
  x.setAttribute('aria-label', ui('flowFechar'));
  x.innerHTML = '&times;';
  x.addEventListener('click', fecha);
  cx.appendChild(x);

  if (a.imagem) {
    const arte = el('div', 'av-arte');
    const pic = el('picture');
    if (a.imagemMobile) {
      const s = el('source');
      s.media = '(max-width:640px)';
      s.srcset = a.imagemMobile;
      pic.appendChild(s);
    }
    const im = el('img');
    im.src = a.imagem;
    im.alt = t(a.alt) || '';
    pic.appendChild(im);
    arte.appendChild(pic);
    /* a etiqueta fica fixa no canto da arte — não se move com o título, para
       não haver duas coisas soltas a alinhar uma com a outra */
    const etq = t(a.etiqueta);
    if (etq) {
      const s = el('span', 'av-etiqueta t-' + (a.tipo || 'aviso'));
      s.textContent = etq;
      arte.appendChild(s);
    }
    /* o título assenta no vazio da arte e mede-se em cqw, por isso encolhe com a
       janela em vez de sair de cima da imagem */
    const tit = t(a.titulo);
    if (tit) {
      const h = el('h2', 'av-titulo');
      h.textContent = tit;
      aplicaFormatoTitulo(h, a.tituloFormato || {});
      arte.appendChild(h);
    }
    cx.appendChild(arte);
  }

  const corpo = el('div', 'av-corpo');
  /* sem imagem não há onde assentar: etiqueta e título vão para o corpo */
  if (!a.imagem) {
    const etq = t(a.etiqueta);
    if (etq) { const s = el('span', 'av-etiqueta t-' + (a.tipo || 'aviso')); s.textContent = etq; corpo.appendChild(s); }
    const tit = t(a.titulo);
    if (tit) { const h = el('h2', 'av-titulo-so'); h.textContent = tit; corpo.appendChild(h); }
  }

  const sub = t(a.subtitulo);
  if (sub) { const p = el('p', 'av-sub'); p.textContent = sub; corpo.appendChild(p); }

  const texto = t(a.texto);
  if (texto) { const d = el('div', 'av-texto'); paragrafos(texto).forEach(n => d.appendChild(n)); corpo.appendChild(d); }

  if ((a.pontos || []).length) {
    const g = el('div', 'av-pontos');
    a.pontos.forEach(p => {
      const c = el('div', 'av-ponto');
      if (p.icone) { const im = el('img'); im.src = p.icone; im.alt = ''; c.appendChild(im); }
      const d = el('div');
      const b = el('b'); b.textContent = t(p.titulo); d.appendChild(b);
      const nota = t(p.nota);
      if (nota) { const s = el('span'); s.textContent = nota; d.appendChild(s); }
      c.appendChild(d);
      g.appendChild(c);
    });
    corpo.appendChild(g);
  }

  const acoes = el('div', 'av-acoes');
  [[a.botao1, 'av-p'], [a.botao2, 'av-s'], [a.botao3, 'av-s']].forEach(([b, cls]) => {
    if (!b || b.visivel === false || !t(b.texto)) return;
    const n = acaoAviso(b, a, num, fecha);
    n.className = cls;
    n.textContent = t(b.texto);
    acoes.appendChild(n);
  });
  if (acoes.children.length) corpo.appendChild(acoes);

  const mini = t(a.letraPequena);
  if (mini) { const p = el('p', 'av-mini'); p.textContent = mini; corpo.appendChild(p); }

  cx.appendChild(corpo);
  fundo.appendChild(cx);
  return { fundo: fundo, foco: x };
}

/* A faixa empurra o que está fixo no topo — o botão do menu e o selector de
   idioma. A altura não pode ser um número escrito à mão: no telemóvel a faixa
   parte em três linhas e passa dos 130px. Mede-se e publica-se, e o CSS conta a
   partir daí. */
function poeFaixa(a, num) {
  const faixa = faixaAviso(a, num);
  document.body.insertBefore(faixa, document.body.firstChild);
  document.body.classList.add('tem-faixa');

  const mede = () => {
    const h = faixa.isConnected ? Math.round(faixa.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--faixa-h', h + 'px');
    if (!h) document.body.classList.remove('tem-faixa');
  };
  mede();
  addEventListener('resize', mede);
  /* ao fechar, o que estava empurrado volta ao lugar */
  new MutationObserver(mede).observe(document.body, { childList: true });
  return faixa;
}

function iniciaAvisos(lista, num) {
  if (!Array.isArray(lista) || !lista.length) return;
  const fechados = avisosFechados();
  /* um de cada vez: a ordem da lista é a prioridade */
  const a = lista.find(x => avisoElegivel(x, fechados));
  if (!a) return;

  /* "faixa-janela": a janela aparece uma vez, a faixa fica. É o que uma
     campanha quer — impressão à chegada, lembrete depois. */
  if (a.forma === 'faixa-janela') {
    poeFaixa(a, num);
    const chaveJanela = a.id + '#janela';
    if (!avisosFechados()[chaveJanela]) {
      setTimeout(() => {
        if (document.querySelector('.flow-modal-fundo, .av-fundo')) return;
        const r = janelaAviso(a, num, chaveJanela);
        document.body.appendChild(r.fundo);
        r.foco.focus();
      }, Math.max(0, Number(a.esperaSegundos) || 0) * 1000);
    }
    return;
  }

  if (a.forma === 'janela') {
    const espera = Math.max(0, Number(a.esperaSegundos) || 0) * 1000;
    setTimeout(() => {
      /* cala-se se o visitante já estiver a meio de outra coisa — pedir preço,
         ou qualquer janela que esteja aberta */
      if (document.querySelector('.flow-modal-fundo, .av-fundo')) return;
      const { fundo, foco } = janelaAviso(a, num);
      document.body.appendChild(fundo);
      foco.focus();
    }, espera);
    return;
  }

  poeFaixa(a, num);
}

function buildElement(item) {
  /* Elementos marcados no CMS como "só na página própria". A loja de música
     e a biografia são disso: vivem em /musica/ e a página inicial fica com o
     convite. O JSON continua a ser um só — o que muda é quem o desenha. */
  if (item.soNaPagina) return null;
  switch (item.role) {
    case 'video': return buildVideo(item);
    case 'text': return buildText(item);
    case 'floatImage': return buildFloatImage(item);
    case 'groundImage': return buildGroundImage(item);
    case 'heroImage': return buildHeroImage(item);
    case 'music': return buildMusic(item);
    case 'flow': return buildFlow(item);
    case 'bio': return buildBio(item);
    default: return null;
  }
}

/* ---- uma secção -------------------------------------------------------
   Saiu do meio do render() para poder ser chamada duas vezes: uma no
   primeiro desenho, outra quando o catálogo chega depois. É o mesmo código
   que estava no ciclo, sem uma linha alterada — só passou a ter nome. */
function buildSection(sec, sky) {
  if (sec.visible === false) return null;

  /* o catálogo ainda não chegou: fica um lugar guardado com o id certo, para
     o menu e as âncoras (#produtos) continuarem a encontrá-lo, e para a
     página não saltar quando ele entrar. */
  if (sec.adiado) {
    const vazia = el('section', 'a-carregar');
    vazia.id = sec.id;
    vazia.dataset.wind = sec.wind === false ? '0' : '1';
    return vazia;
  }

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
    const bg = buildSectionBg(sec, sky);
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
  return s;
}

function render(data) {
  const root = document.getElementById('app');
  /* o corpo estático que o gerador escreveu sai daqui: é o mesmo material,
     e a partir de agora quem o monta é este renderizador. Sem isto, ficava
     duplicado por baixo do site. */
  root.innerHTML = '';
  /* a carta de cores tem de estar pronta ANTES das secções: com o link directo
     (#produtos/<asa>) o painel de detalhe é construído durante o render, e se
     isto viesse depois o configurador não aparecia. Ao clicar à mão o render já
     tinha acabado, por isso o erro só se via pelo link. */
  TECIDOS = data.tecidos || [];
  AVISOS = data.listaAvisos || [];
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
    const s = buildSection(sec, data.sky);
    if (s) root.appendChild(s);
  });

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

  /* avisos: o número do WhatsApp é o que já está no conteúdo, para não haver
     dois sítios a dizer o mesmo número e um deles ficar desactualizado */
  const numWa = (data.sections || []).reduce((n, s) =>
    n || ((s.elements || []).find(e => e.whatsapp) || {}).whatsapp, null);
  iniciaAvisos(data.listaAvisos, numWa);

  const locales = (data.locales && data.locales.length) ? data.locales : [DEFAULT_LOCALE];
  if (locales.length > 1) { buildLangSwitcher(locales); sugereIdioma(locales); }

  if (responsiveRules.length) {
    const st = el('style'); st.id = 'mobile-overrides';
    st.textContent = responsiveRules.join('\n');
    document.head.appendChild(st);
  }

  initMotion(data);
  /* a âncora manda: se o endereço pede uma secção, é para lá que se vai.
     Só depois é que a reposição de posição tem palavra a dizer. */
  if (!irParaAncora()) reporPosicao();
}

/* ---- preferência de idioma -------------------------------------------
   A URL manda no que se serve; isto manda só no que se sugere.

   hs-idioma          a língua que a pessoa ESCOLHEU — carregando numa
                      bandeira ou aceitando a sugestão. É a única coisa que
                      autoriza o encaminhamento a partir de /.
   hs-idioma-nao      a sugestão que já foi dispensada, guardada pela língua
                      sugerida. Fechar a caixa é dizer "não a esta", não é
                      escolher a língua em que se está — se guardasse
                      preferência, quem só quis fechar passava a ser
                      encaminhado para sempre.

   O encaminhamento vive no <head> do index.html, antes da pintura. Aqui só
   se guarda a preferência e se faz a pergunta. */
const CHAVE_IDIOMA = 'hs-idioma';
const CHAVE_IDIOMA_NAO = 'hs-idioma-nao';

function guardaIdioma(code) {
  try { localStorage.setItem(CHAVE_IDIOMA, code); } catch (e) {}
}

/* o que o browser diz, reduzido às cinco línguas do site. Quem vier de
   qualquer outra recebe inglês — não porque seja a língua dele, mas porque é
   a que mais gente lê fora destas quatro. */
function idiomaDoBrowser(locales) {
  let bruto = [];
  try { bruto = navigator.languages && navigator.languages.length
    ? navigator.languages : [navigator.language || '']; } catch (e) { return null; }
  for (const x of bruto) {
    const base = String(x).toLowerCase().split('-')[0];
    if (locales.indexOf(base) >= 0) return base;
  }
  return locales.indexOf('en') >= 0 ? 'en' : null;
}

const SUGESTAO = {
  pt: { q: 'Ver a Happy Soaring em português?', sim: 'Mudar para português', nao: 'Não, obrigado' },
  en: { q: 'View Happy Soaring in English?',    sim: 'Switch to English',    nao: 'No, thanks' },
  es: { q: '¿Ver Happy Soaring en español?',    sim: 'Cambiar a español',    nao: 'No, gracias' },
  fr: { q: 'Voir Happy Soaring en français ?',  sim: 'Passer au français',   nao: 'Non, merci' },
  de: { q: 'Happy Soaring auf Deutsch ansehen?', sim: 'Auf Deutsch wechseln', nao: 'Nein, danke' }
};

function sugereIdioma(locales) {
  /* SÓ EM /. Quem escreveu /de/, ou clicou num resultado alemão, ou seguiu
     uma ligação alemã, já disse em que língua quer ler — perguntar-lhe outra
     vez é não acreditar nele. A língua do browser só tem voto quando o
     endereço não disse nada, e o único endereço que não diz nada é a raiz.

     A regra fica assim numa frase, que é o que a torna testável: a sugestão
     existe em / e mais em lado nenhum. */
  if (location.pathname !== '/') return;

  let escolhido = null, dispensado = null;
  try {
    escolhido = localStorage.getItem(CHAVE_IDIOMA);
    dispensado = localStorage.getItem(CHAVE_IDIOMA_NAO);
  } catch (e) { return; }         /* sem armazenamento não se pergunta nada */

  if (escolhido) return;                       /* já escolheu: não se insiste */
  const alvo = idiomaDoBrowser(locales);
  if (!alvo || alvo === LOCALE) return;        /* já está na língua dele */
  if (dispensado === alvo) return;             /* já disse que não a esta */
  const txt = SUGESTAO[alvo];
  if (!txt) return;

  const cx = el('div', 'sug');
  /* data-nosnippet: isto é um controlo, não é texto da página. Sem ele o
     Google pode ir buscar "View Happy Soaring in English?" para o resumo do
     resultado, e o resumo passa a ser um botão. */
  cx.setAttribute('data-nosnippet', '');
  cx.setAttribute('role', 'dialog');
  cx.setAttribute('aria-label', txt.q);
  cx.lang = alvo;

  const q = el('p', 'sug-q'); q.textContent = txt.q; cx.appendChild(q);
  const bs = el('div', 'sug-b');
  const sim = el('button', 'sug-sim'); sim.type = 'button'; sim.textContent = txt.sim;
  const nao = el('button', 'sug-nao'); nao.type = 'button'; nao.textContent = txt.nao;
  bs.appendChild(sim); bs.appendChild(nao); cx.appendChild(bs);
  document.body.appendChild(cx);

  function fecha() {
    cx.classList.remove('on');
    setTimeout(() => cx.remove(), 300);
    document.removeEventListener('keydown', aoTeclado);
    document.removeEventListener('click', aoClicarFora, true);
  }
  function aoTeclado(e) { if (e.key === 'Escape') fecha(); }
  function aoClicarFora(e) { if (!cx.contains(e.target)) fecha(); }

  sim.addEventListener('click', () => {
    guardaIdioma(alvo);
    location.href = (alvo === DEFAULT_LOCALE ? '/' : '/' + alvo + '/');
  });
  nao.addEventListener('click', () => {
    /* guarda-se a sugestão recusada, não a língua atual */
    try { localStorage.setItem(CHAVE_IDIOMA_NAO, alvo); } catch (e) {}
    fecha();
  });
  /* Esc e clique fora fecham sem guardar nada: quem não respondeu não
     respondeu, e a pergunta volta na visita seguinte. Os dois só passam a
     valer quando a caixa aparece — senão um clique dado no primeiro segundo
     fechava-a antes de alguém a ter visto.

     900 ms: primeiro vê-se o hero, só depois é que se pergunta alguma coisa. */
  setTimeout(() => {
    cx.classList.add('on');
    document.addEventListener('keydown', aoTeclado);
    document.addEventListener('click', aoClicarFora, true);
  }, 900);
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
/* ---- ir para a secção pedida no endereço ----
   As secções da página inicial só existem depois de o app.js as desenhar, e
   nessa altura o salto que o browser faz sozinho para a âncora já aconteceu
   há muito — por isso `/#produtos` aterrava sempre no topo. Fazemos o salto
   à mão quando há mesmo lá alguma coisa para onde saltar.

   Repete-se como na reposição de posição: as imagens ainda estão a carregar
   e continuam a mudar a altura da página por baixo dos pés. */
function irParaAncora() {
  const id = (location.hash || '').replace(/^#/, '');
  if (!id || /\//.test(id)) return false;      /* #produtos/asa abre a ficha, não é âncora */
  const alvo = document.getElementById(id);
  if (!alvo) return false;
  const ir = () => window.scrollTo({ top: Math.max(0, alvo.offsetTop), behavior: 'auto' });
  ir();
  requestAnimationFrame(ir);
  window.addEventListener('load', ir, { once: true });
  setTimeout(ir, 250);
  return true;
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
      /* mudar de idioma é mudar de endereço: cada língua tem a sua página
         inicial. A posição continua guardada, para aterrar na mesma secção.
         E carregar numa bandeira é uma escolha explícita — fica guardada. */
      guardaPosicao();
      guardaIdioma(code);
      location.href = (code === DEFAULT_LOCALE ? '/' : '/' + code + '/');
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
  /* só entram as secções que estão mesmo na página: uma secção escondida no CMS
     não é desenhada, e a entrada de menu ficava a apontar para uma âncora que
     não existe — clicava-se e não acontecia nada. As ligações externas passam
     sempre, porque não dependem de nenhuma secção daqui. */
  /* O QUE VEM DO MODULO, E O QUE FICA AQUI
     Os endereços e os rótulos saem do regras/navegacao.js, partilhado com o
     gerador — é o que garante que o menu desta página e o das 131 geradas
     dizem a mesma coisa.

     O filtro fica aqui de propósito: perguntar ao DOM se a secção existe só
     faz sentido nesta página. Numa página gerada, #produtos e #music nunca
     existem, e se esta pergunta subisse para o módulo essas duas entradas
     desapareciam de lá. */
  const vivos = entradasDoMenu(items, LOCALE, { naInicial: true })
    .filter(e => e.tipo !== 'ancora' || !!document.getElementById(e.alvo));
  if (!vivos.length) return;

  const burger = el('button', 'burger');
  burger.setAttribute('aria-label', 'Abrir menu');
  burger.innerHTML = '<span></span><span></span><span></span>';

  const backdrop = el('div', 'menu-backdrop');
  const drawer = el('nav', 'menu-drawer');
  drawer.setAttribute('aria-hidden', 'true');
  const ul = el('ul');
  vivos.forEach(e => {
    const li = el('li');
    const a = el('a');
    a.href = e.href;
    a.textContent = e.rotulo;
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
      /* fica guardado porque há uma secção que chega depois disto: a do
         catálogo. Sem a observar, o vento não sabia que ela existe. */
      ioVento = io;
    }
  } else {
    canvas.style.display = 'none';
  }
  onScroll();
}

/* carrega settings.json (global + ordem dos slides) e depois cada slide
   individual (content/slides/<id>.json), juntando tudo na estrutura que o
   render() espera. Assim cada slide é um ficheiro/entrada própria no CMS. */
/* O CATALOGO NAO ENTRA NO PRIMEIRO DESENHO
   Medido em produção: o produtos.json são 132 KB comprimidos (472 KB em
   bruto) e demorava 151 ms, enquanto os outros sete slides estavam todos
   prontos em 54 ms. Como se esperava por todos com um Promise.all, o hero
   ficava à espera de um catálogo que não usa — e as vagas seguintes
   herdavam esse atraso.

   Agora não. Sai da primeira vaga, e com ele sai a carta de tecidos, que só
   existe por causa do configurador de cor do catálogo. No lugar dele fica
   um marcador com o id certo, para o menu e a âncora #produtos continuarem
   a funcionar e para a página não saltar quando ele entrar.

   Não se divide o ficheiro nem se lhe toca na estrutura: só se muda QUANDO
   é pedido. Se a medição depois disto disser que vale a pena dividi-lo,
   divide-se então. */
const SLIDE_ADIADO = 'produtos';

async function loadSite() {
  const settings = await fetch('/content/settings.json').then(r => r.json());
  const ids = Array.isArray(settings.slides) ? settings.slides : [];
  const slides = await Promise.all(ids.map(id =>
    id === SLIDE_ADIADO
      ? Promise.resolve({ id, adiado: true })
      : fetch('/content/slides/' + id + '.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  ));

  const avisosIds = Array.isArray(settings.avisos) ? settings.avisos : [];
  const avisos = await Promise.all(avisosIds.map(id =>
    fetch('/content/avisos/' + id + '.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  ));
  return Object.assign({}, settings, {
    sections: slides.filter(Boolean),
    listaAvisos: avisos.filter(Boolean),
    tecidos: []
  });
}

/* ---- o catálogo, depois de a página estar de pé ------------------------
   Corre a seguir ao primeiro render(). Substitui o marcador pela secção a
   sério, no mesmo sítio da ordem, e diz ao observador do vento que ela
   passou a existir. */
async function carregaCatalogo(data) {
  const [slide, tecidos] = await Promise.all([
    fetch('/content/slides/' + SLIDE_ADIADO + '.json').then(r => (r.ok ? r.json() : null)).catch(() => null),
    fetch('/content/cores/flow-tecidos.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
  ]);
  if (!slide) return;                       /* falhou: o marcador fica, vazio */

  TECIDOS = (tecidos && tecidos.cores) || [];
  const lugar = document.getElementById(slide.id);
  const s = buildSection(slide, data.sky);
  if (!s) { if (lugar) lugar.remove(); return; }
  if (lugar) lugar.replaceWith(s); else document.getElementById('app').appendChild(s);
  if (ioVento) ioVento.observe(s);

  /* o endereço podia estar a pedir uma asa concreta (#produtos/<slug>): a
     secção só agora existe, por isso é agora que se salta para ela */
  irParaAncora();
}

/* O FALLBACK NAO SE APAGA A SI PROPRIO
   Dentro do #app está um bloco estático — identidade, método, catálogo com
   as 22 asas ligadas — escrito de propósito para a página valer alguma coisa
   sem JavaScript. E isto apagava-o precisamente quando o JavaScript falhava,
   substituindo-o por uma linha de erro. A rede de segurança desaparecia no
   momento em que era precisa.

   Agora não se toca no que está lá. Regista-se o erro para quem estiver a
   depurar, e acrescenta-se um aviso pequeno POR CIMA do conteúdo — que
   continua a ser lido, e continua a ligar às páginas todas. */
loadSite()
  .then(dados => { render(dados); return carregaCatalogo(dados); })
  .catch(err => {
    console.error('Happy Soaring: falhou o carregamento do conteúdo.', err);
    const app = document.getElementById('app');
    if (!app) return;
    const estatico = app.querySelector('.hs-estatico');
    if (!estatico) {
      /* sem bloco estático não há nada a preservar: aí sim, diz-se */
      app.innerHTML = '<p style="padding:40px;color:#fff">Erro a carregar o conteúdo.</p>';
      return;
    }
    const nota = el('p', 'hs-degradado');
    nota.textContent = ui('erroParcial');
    estatico.insertBefore(nota, estatico.firstChild);
  });
