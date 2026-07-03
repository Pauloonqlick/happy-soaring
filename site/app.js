/* Motor do site orientado por content.json.
   Nada de conteúdo escrito à mão aqui — tudo vem do ficheiro de dados,
   que é o que o CMS (Sveltia) vai editar. */

const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const px = v => (typeof v === 'number' ? v + 'px' : v);

function visibilityClass(item) {
  let c = '';
  if (item.showMobile === false) c += ' hide-mobile';
  if (item.showDesktop === false) c += ' hide-desktop';
  return c;
}

function buildText(item) {
  const c = el('div', 'content' + (item.align === 'right' ? ' right' : '') + visibilityClass(item));
  if (item.kicker) { const k = el('span', 'kicker'); k.textContent = item.kicker; c.appendChild(k); }
  const tag = item.titleTag === 'h1' ? 'h1' : 'h2';
  const title = el(tag, tag === 'h1' ? 'wordmark' : 'title');
  if (item.title) title.appendChild(document.createTextNode(item.title));
  if (item.title2) {
    title.appendChild(el('br'));
    if (item.accent2) { const s = el('span'); s.textContent = item.title2; title.appendChild(s); }
    else title.appendChild(document.createTextNode(item.title2));
  }
  c.appendChild(title);
  if (item.subtitle) { const p = el('p', 'lead'); p.textContent = item.subtitle; c.appendChild(p); }
  if (item.button) {
    const a = el('a', 'btn'); a.href = item.button.href || '#'; a.textContent = item.button.label || '';
    c.appendChild(a);
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
  if (card.pre) d.appendChild(document.createTextNode(card.pre));
  if (card.strong) { const b = el('b'); b.textContent = card.strong; d.appendChild(b); }
  if (card.sub) { const s = el('small'); s.textContent = card.sub; d.appendChild(s); }
  return d;
}

function buildFloatImage(item) {
  const wrap = el('div', 'pilot floaty' + visibilityClass(item));
  wrap.style.top = (item.y ?? 0) + '%';
  if (item.anchorX === 'right') wrap.style.right = (item.x ?? 0) + '%';
  else wrap.style.left = (item.x ?? 0) + '%';
  wrap.style.width = 'min(' + (item.widthVW || 30) + 'vw,' + px(item.widthMax || 360) + ')';
  const img = el('img'); img.src = item.src; img.alt = item.alt || ''; img.style.width = '100%';
  applyCommon(wrap, img, item);
  wrap.appendChild(img);
  if (item.card && item.card.enabled) wrap.appendChild(buildCard(item.card));
  return wrap;
}

function buildGroundImage(item) {
  const wrap = el('div', 'pilot grounded' + visibilityClass(item));
  if (item.anchorX === 'right') wrap.style.right = (item.x ?? 0) + '%';
  else wrap.style.left = (item.x ?? 0) + '%';
  wrap.style.width = 'min(' + (item.widthVW || 24) + 'vw,' + px(item.widthMax || 320) + ')';
  const img = el('img'); img.src = item.src; img.alt = item.alt || ''; img.style.width = '100%';
  applyCommon(wrap, img, item);
  wrap.appendChild(img);
  if (item.card && item.card.enabled) wrap.appendChild(buildCard(item.card));
  return wrap;
}

function buildHeroImage(item) {
  const wrap = el('div', 'hero-pilot floaty' + visibilityClass(item));
  if (typeof item.heightPct === 'number') wrap.style.setProperty('--h', item.heightPct + '%');
  if (typeof item.heightPctMobile === 'number') wrap.style.setProperty('--hm', item.heightPctMobile + '%');
  if (item.floatSpeed) wrap.style.setProperty('--float-speed', item.floatSpeed + 's');
  if (typeof item.parallax === 'number' && item.parallax > 0) wrap.dataset.speed = (item.parallax / 100).toFixed(2);
  const img = el('img'); img.src = item.src; img.alt = item.alt || '';
  if (typeof item.opacity === 'number' && item.opacity !== 100) img.style.opacity = item.opacity / 100;
  wrap.appendChild(img);
  return wrap;
}

function buildElement(item) {
  switch (item.role) {
    case 'text': return buildText(item);
    case 'floatImage': return buildFloatImage(item);
    case 'groundImage': return buildGroundImage(item);
    case 'heroImage': return buildHeroImage(item);
    default: return null;
  }
}

function render(data) {
  const root = document.getElementById('app');

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
    const s = el('section');
    s.id = sec.id;
    if (sec.heroScrim) s.classList.add('has-scrim', 'hero-fill');
    (sec.elements || []).forEach(item => {
      const node = buildElement(item);
      if (node) s.appendChild(node);
    });
    if (sec.scrollHint) { const h = el('div', 'scrollhint'); h.textContent = sec.scrollHint; s.appendChild(h); }
    root.appendChild(s);
  });

  /* footer */
  if (data.footer) {
    const f = el('footer');
    const big = el('div', 'big');
    big.appendChild(document.createTextNode((data.footer.line1 || '') + ' '));
    if (data.footer.accent) { const sp = el('span'); sp.textContent = data.footer.accent; big.appendChild(sp); }
    big.appendChild(document.createTextNode(' ' + (data.footer.line2 || '')));
    f.appendChild(big);
    if (data.footer.note) { const sm = el('small'); sm.textContent = data.footer.note; f.appendChild(sm); }
    root.appendChild(f);
  }

  initMotion(data);
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
      a: 0.04 + Math.random() * 0.13,
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
      ctx.lineCap = 'round'; ctx.lineWidth = 1.2 * DPR;
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
  } else {
    canvas.style.display = 'none';
  }
  onScroll();
}

fetch('content.json')
  .then(r => r.json())
  .then(render)
  .catch(err => {
    document.getElementById('app').innerHTML =
      '<p style="padding:40px;color:#fff">Erro a carregar o conteúdo: ' + err.message + '</p>';
  });
