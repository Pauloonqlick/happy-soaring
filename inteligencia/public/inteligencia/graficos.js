/* Gráficos pequenos em SVG, sem bibliotecas: barras empilhadas e linhas.
   Tudo construído com createElementNS e textContent. */
window.HSG = (function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}, texto) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if (texto != null) e.textContent = texto;
    return e;
  };
  const num = n => new Intl.NumberFormat('pt-PT').format(n);
  const L = 640, A = 190, ESQ = 44, BAIXO = 26, TOPO = 10;

  function legenda(series) {
    const ul = document.createElement('ul');
    ul.className = 'g-legenda';
    for (const s of series) {
      const li = document.createElement('li');
      const q = document.createElement('span');
      q.className = 'g-quadrado ' + s.classe;
      li.appendChild(q);
      li.appendChild(document.createTextNode(s.nome));
      ul.appendChild(li);
    }
    return ul;
  }

  function eixo(g, max, sufixo) {
    for (const f of [0, 0.5, 1]) {
      const y = TOPO + (A - TOPO - BAIXO) * (1 - f);
      g.appendChild(svg('line', { x1: ESQ, x2: L, y1: y, y2: y, class: 'g-grelha' }));
      g.appendChild(svg('text', { x: ESQ - 6, y: y + 4, class: 'g-eixo', 'text-anchor': 'end' }, num(Math.round(max * f)) + (sufixo || '')));
    }
  }

  /* dados: [{rotulo, valores: {chave: n}, parcial}] */
  function barras(dados, series, { titulo = '' } = {}) {
    const caixa = document.createElement('figure');
    caixa.className = 'g-caixa';
    const max = Math.max(1, ...dados.map(d => series.reduce((s, x) => s + (d.valores[x.chave] || 0), 0)));
    const el = svg('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': titulo, class: 'g-svg' });
    eixo(el, max);
    const passo = (L - ESQ) / Math.max(1, dados.length);
    const largura = Math.max(4, Math.min(40, passo * 0.7));
    dados.forEach((d, i) => {
      let base = A - BAIXO;
      const x = ESQ + i * passo + (passo - largura) / 2;
      for (const s of series) {
        const v = d.valores[s.chave] || 0;
        const h = (A - TOPO - BAIXO) * v / max;
        if (h > 0) {
          const r = svg('rect', { x, y: base - h, width: largura, height: h, class: s.classe + (d.parcial ? ' g-parcial' : '') });
          r.appendChild(svg('title', {}, d.rotulo + ' · ' + s.nome + ': ' + num(v) + (d.parcial ? ' (semana incompleta)' : '')));
          el.appendChild(r);
        }
        base -= h;
      }
      if (dados.length <= 16 || i % Math.ceil(dados.length / 12) === 0) {
        el.appendChild(svg('text', { x: x + largura / 2, y: A - 8, class: 'g-eixo', 'text-anchor': 'middle' }, d.rotulo));
      }
    });
    caixa.appendChild(el);
    caixa.appendChild(legenda(series));
    return caixa;
  }

  /* dados: [{rotulo, valores: {chave: n|null}}] — null interrompe a linha */
  function linhas(dados, series, { titulo = '', max = null, sufixo = '' } = {}) {
    const caixa = document.createElement('figure');
    caixa.className = 'g-caixa';
    const topo = max ?? Math.max(1, ...dados.flatMap(d => series.map(s => d.valores[s.chave] || 0)));
    const el = svg('svg', { viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': titulo, class: 'g-svg' });
    eixo(el, topo, sufixo);
    const passo = dados.length > 1 ? (L - ESQ - 12) / (dados.length - 1) : 0;
    const xy = (i, v) => [ESQ + 6 + i * passo, TOPO + (A - TOPO - BAIXO) * (1 - v / topo)];
    for (const s of series) {
      let d = '';
      dados.forEach((p, i) => {
        const v = p.valores[s.chave];
        if (v == null) { d += ' '; return; }
        const [x, y] = xy(i, v);
        d += (d.trim() === '' || d.endsWith(' ') ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
        const c = svg('circle', { cx: x, cy: y, r: 3, class: 'g-ponto ' + s.classe });
        c.appendChild(svg('title', {}, p.rotulo + ' · ' + s.nome + ': ' + num(v) + sufixo));
        el.appendChild(c);
      });
      el.insertBefore(svg('path', { d: d.trim(), class: 'g-linha ' + s.classe }), el.firstChild.nextSibling);
    }
    dados.forEach((p, i) => {
      if (dados.length <= 16 || i % Math.ceil(dados.length / 12) === 0) {
        el.appendChild(svg('text', { x: xy(i, 0)[0], y: A - 8, class: 'g-eixo', 'text-anchor': 'middle' }, p.rotulo));
      }
    });
    caixa.appendChild(el);
    caixa.appendChild(legenda(series));
    return caixa;
  }

  return { barras, linhas };
})();
