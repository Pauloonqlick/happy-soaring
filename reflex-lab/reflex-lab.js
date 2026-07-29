/* ============================================================
   Reflex Lab — Happy Soaring
   Simulador aerodinâmico CONCEPTUAL de uma asa parakite reflex.
   100% no browser. Sem backend, sem APIs, sem build.
   Modelo simplificado para fins educativos (não é CFD real).
   ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'hs-reflex-lab';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- Definição dos controlos ---------- */
  var CONTROLS = [
    { key: 'aoa',       label: 'Ângulo de ataque', min: -10, max: 30, step: 0.5, def: -2,  cls: '',      fmt: function (v) { return v.toFixed(1) + '°'; } },
    { key: 'brake',     label: 'Travão',           min: 0,   max: 100, step: 1,  def: 0,   cls: 'brake', fmt: function (v) { return Math.round(v) + '%'; } },
    { key: 'lineA',     label: 'Linha A',          min: 80,  max: 120, step: 1,  def: 100, cls: 'a',     fmt: function (v) { return Math.round(v) + '%'; } },
    { key: 'lineB',     label: 'Linha B',          min: 80,  max: 120, step: 1,  def: 100, cls: 'b',     fmt: function (v) { return Math.round(v) + '%'; } },
    { key: 'lineC',     label: 'Linha C',          min: 80,  max: 120, step: 1,  def: 100, cls: 'c',     fmt: function (v) { return Math.round(v) + '%'; } },
    { key: 'brakeLine', label: 'Linha de travão',  min: 80,  max: 120, step: 1,  def: 100, cls: 'brake', fmt: function (v) { return Math.round(v) + '%'; } },
    { key: 'airspeed',  label: 'Velocidade do ar', min: 20,  max: 60,  step: 1,  def: 38,  cls: '',      fmt: function (v) { return Math.round(v) + ' km/h'; } }
  ];
  var PULLEYS = [1.4, 1.5, 1.6];
  var PULLEY_DEF = 1.5;

  /* ---------- Presets (cada um = valores dos controlos) ---------- */
  var PRESETS = [
    { name: 'Reflex ativo',            state: { aoa: -2, brake: 0,  lineA: 100, lineB: 100, lineC: 100, brakeLine: 100, pulley: 1.5, airspeed: 38 } },
    { name: 'Voo neutro',              state: { aoa: 4,  brake: 12, lineA: 100, lineB: 100, lineC: 100, brakeLine: 100, pulley: 1.5, airspeed: 32 } },
    { name: 'Travagem moderada',       state: { aoa: 8,  brake: 45, lineA: 100, lineB: 100, lineC: 100, brakeLine: 100, pulley: 1.5, airspeed: 28 } },
    { name: 'Travagem máxima',         state: { aoa: 12, brake: 92, lineA: 100, lineB: 100, lineC: 100, brakeLine: 100, pulley: 1.5, airspeed: 23 } },
    { name: 'Travões demasiado curtos', warn: true, state: { aoa: 2, brake: 0, lineA: 100, lineB: 100, lineC: 100, brakeLine: 82, pulley: 1.5, airspeed: 44 } },
    { name: 'Linha A alongada',        state: { aoa: 3,  brake: 0,  lineA: 116, lineB: 100, lineC: 100, brakeLine: 100, pulley: 1.5, airspeed: 40 } },
    { name: 'B e C fora de trim',      warn: true, state: { aoa: 5, brake: 10, lineA: 100, lineB: 88, lineC: 113, brakeLine: 100, pulley: 1.5, airspeed: 34 } }
  ];

  function defaultState() {
    var s = { pulley: PULLEY_DEF };
    CONTROLS.forEach(function (c) { s[c.key] = c.def; });
    return s;
  }

  /* ---------- Estado + persistência ---------- */
  var state = defaultState();
  var activePreset = 'Reflex ativo';
  try {
    var saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (saved && saved.state) {
      Object.keys(state).forEach(function (k) { if (typeof saved.state[k] === 'number') state[k] = saved.state[k]; });
      if (saved.activePreset) activePreset = saved.activePreset;
    } else {
      applyPreset('Reflex ativo', false);
    }
  } catch (e) { }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ state: state, activePreset: activePreset })); } catch (e) { }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================================
     MODELO AERODINÂMICO (conceptual)
     ============================================================ */
  function compute() {
    var s = state;

    /* Flap efetivo (deflexão do bordo de fuga, em %):
       - travão empurra o bordo de fuga para baixo
       - linha de travão curta => deflexão residual mesmo com travão a 0
       - relação das roldanas amplia/reduz o curso do travão */
    var residual = Math.max(0, 100 - s.brakeLine) * 0.7;           // linha curta => flap sempre puxado
    var pulleyGain = s.pulley / PULLEY_DEF;                          // 1.4->0.93, 1.6->1.07
    var effFlap = clamp(s.brake * pulleyGain + residual, 0, 130);

    /* Trim de pitch pelas linhas:
       - Linha A mais longa levanta o nariz (aumenta AoA)
       - assimetria B/C deforma o perfil e desloca o CoP */
    var aTrim = (s.lineA - 100) * 0.28;
    var bcAsym = (s.lineC - s.lineB);                               // >0: C longa / B curta
    var bcMag = Math.abs(s.lineB - 100) + Math.abs(s.lineC - 100);  // desregulação total B/C
    var aoaEff = s.aoa + aTrim + bcAsym * 0.05;

    /* Reflex: quanto o bordo de fuga está levantado (perfil auto-estável).
       Alto com pouco flap e trim limpo; some com travão/desregulação. */
    var reflexAmount = clamp((16 - effFlap) / 16, 0, 1) * clamp(1 - bcMag / 45, 0, 1);
    var reflexActive = reflexAmount > 0.45 && effFlap < 14;

    /* Camber adicional pelo flap */
    var camber = effFlap / 100;                                     // 0..1.3

    /* Ângulo de perda (baixa com mais camber/flap) */
    var aoaStall = 15 - camber * 5.5;

    /* Separação estimada (0..1): cresce perto/acima da perda e com flap alto */
    var sepFrac = 0;
    if (aoaEff > aoaStall - 4) sepFrac += (aoaEff - (aoaStall - 4)) / 8;
    sepFrac += Math.max(0, camber - 0.75) * 0.7;
    sepFrac = clamp(sepFrac, 0, 1);

    /* Coeficiente de sustentação */
    var CL = 0.50 + 0.05 * aoaEff + camber * 0.55;
    if (aoaEff > aoaStall) CL -= (aoaEff - aoaStall) * 0.10;         // queda pós-perda
    CL *= (1 - sepFrac * 0.35);
    CL = clamp(CL, -0.1, 1.6);

    /* Coeficiente de arrasto */
    var AR = 5.2, e = 0.9;
    var CDi = (CL * CL) / (Math.PI * AR * e);
    var CD = 0.025 + CDi + Math.pow(camber, 2) * 0.045 + sepFrac * sepFrac * 0.16 + bcMag * 0.0006;
    CD = clamp(CD, 0.012, 1);

    var LD = CD > 0 ? CL / CD : 0;

    /* Momento de pitch (Cm ~ 1/4 corda): reflex => positivo (nariz p/ cima),
       flap/camber => negativo; desregulação adiciona ruído */
    var Cm = 0.02 + reflexAmount * 0.11 - camber * 0.14 - bcMag * 0.002;

    /* Centro de pressão (fração da corda a partir do bordo de ataque).
       Reflex empurra o CoP para trás (estável); camber/CL puxam-no p/ a frente. */
    var cop = 0.30 - camber * 0.11 + reflexAmount * 0.14 - Math.max(0, aoaEff) * 0.002 + bcAsym * 0.0015;
    cop = clamp(cop, 0.14, 0.52);

    /* Margem de estabilidade (0..100): CoP atrás + reflex - desregulação - perda */
    var stab = 45 + (cop - 0.28) * 260 + reflexAmount * 22 - bcMag * 0.8 - sepFrac * 30;
    stab = clamp(stab, 3, 98);

    /* Avisos */
    var warn = null;
    if (residual > 6 && s.brake < 8) warn = 'Bordo de fuga acionado com o comando solto — risco de colapso em velocidade.';
    else if (sepFrac > 0.6) warn = 'Fluxo largamente separado — perda iminente.';
    else if (bcMag > 18) warn = 'Perfil deformado (B/C fora de trim) — estabilidade reduzida.';

    return {
      effFlap: effFlap, aoaEff: aoaEff, reflexAmount: reflexAmount, reflexActive: reflexActive,
      camber: camber, sepFrac: sepFrac, CL: CL, CD: CD, LD: LD, Cm: Cm, cop: cop,
      stab: stab, warn: warn
    };
  }

  /* ============================================================
     GEOMETRIA DA ASA (coordenadas locais, corda ao longo de X)
     ============================================================ */
  var CHORD = 430;      // comprimento da corda em px
  var LEx = 0;          // bordo de ataque (local)

  /* devolve pontos da linha de corda / superfícies conforme flap e reflex */
  function wingPath(m) {
    var C = CHORD;
    // bordo de fuga: sobe (reflex) quando flap baixo, desce quando flap alto
    var teY = -22 + (m.effFlap / 100) * 78;                // <0 = para cima
    // "chute" reflex extra na zona traseira da extradorso
    var rk = m.reflexAmount * 26;
    var th = 58;                                            // espessura máx.

    // extradorso (upper): LE -> crista -> BF
    var upper =
      'M ' + LEx + ',0 ' +
      'C ' + (0.05 * C) + ',' + (-th * 0.72) + ' ' + (0.16 * C) + ',' + (-th) + ' ' + (0.30 * C) + ',' + (-th * 0.96) + ' ' +
      'C ' + (0.52 * C) + ',' + (-th * 0.86 - rk * 0.4) + ' ' + (0.74 * C) + ',' + (-th * 0.5 - rk) + ' ' + (0.88 * C) + ',' + (teY - 10 - rk * 0.7) + ' ' +
      'L ' + C + ',' + teY + ' ';
    // intradorso (lower): BF -> ventre -> LE
    var lower =
      'C ' + (0.80 * C) + ',' + (teY + 8) + ' ' + (0.5 * C) + ',' + (th * 0.42) + ' ' + (0.30 * C) + ',' + (th * 0.40) + ' ' +
      'C ' + (0.16 * C) + ',' + (th * 0.34) + ' ' + (0.05 * C) + ',' + (th * 0.18) + ' ' + LEx + ',0 Z';

    return { d: upper + lower, teY: teY };
  }

  /* pontos de fixação das linhas ao longo da corda (fração -> ponto local) */
  function chordPoint(frac, m) {
    var C = CHORD;
    var x = frac * C;
    // y aproximado da linha média nesse ponto (para as fixações ficarem "coladas")
    var teY = -22 + (m.effFlap / 100) * 78;
    var y;
    if (frac < 0.3) y = 8 + frac * 18;
    else y = 14 + (teY - 14) * ((frac - 0.3) / 0.7);       // interpola até ao BF
    return { x: x, y: y };
  }

  /* ============================================================
     CONSTRUÇÃO / ATUALIZAÇÃO DO SVG
     ============================================================ */
  var scene = document.getElementById('rl-scene');
  var scenebuilt = false;
  var els = {};

  function svg(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // pivô do palco e do piloto
  var PIVOT = { x: 380, y: 300 };   // onde assenta ~1/4 de corda
  var PILOT = { x: 520, y: 600 };

  function buildScene() {
    scene.innerHTML = '';

    // defs: gradiente da asa
    var defs = svg('defs');
    var grad = svg('linearGradient', { id: 'rl-wing-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(svg('stop', { offset: '0', 'stop-color': '#ffffff' }));
    grad.appendChild(svg('stop', { offset: '1', 'stop-color': '#c3ccd6' }));
    defs.appendChild(grad);
    scene.appendChild(defs);

    // grupo das linhas de corrente (fundo)
    els.flowGroup = svg('g', { class: 'flow-group' });
    scene.appendChild(els.flowGroup);

    // grupo de separação
    els.sepGroup = svg('g', { class: 'sep-group' });
    scene.appendChild(els.sepGroup);

    // risers / linhas (piloto -> asa) — desenhadas antes da asa
    els.lineEls = {};
    ['a', 'b', 'c', 'brake'].forEach(function (k) {
      var ln = svg('path', { class: 'riser line-' + k });
      scene.appendChild(ln);
      els.lineEls[k] = ln;
    });
    // etiquetas das linhas
    els.lineLbls = {};
    [['a', 'A'], ['b', 'B'], ['c', 'C']].forEach(function (p) {
      var tx = svg('text', { class: 'lbl-line line-' + p[0], fill: 'currentColor', 'text-anchor': 'middle' });
      tx.textContent = p[1];
      // cor via classe não aplica a fill em SVG text por currentColor; definimos fill direto
      scene.appendChild(tx);
      els.lineLbls[p[0]] = tx;
    });

    // grupo da asa (roda com o AoA)
    els.wingGroup = svg('g');
    els.wing = svg('path', { class: 'wing-fill' });
    els.chordLine = svg('line', { class: 'chord' });
    els.copDot = svg('circle', { class: 'cop-dot', r: '8' });
    els.wingGroup.appendChild(els.chordLine);
    els.wingGroup.appendChild(els.wing);
    // pontos de fixação
    els.attach = {};
    ['a', 'b', 'c', 'brake'].forEach(function (k) {
      var c = svg('circle', { class: 'attach', r: '4' });
      els.wingGroup.appendChild(c);
      els.attach[k] = c;
    });
    els.wingGroup.appendChild(els.copDot);
    scene.appendChild(els.wingGroup);

    // etiquetas fixas (bordo ataque/fuga, reflex, cop, travão)
    els.lblLE = svg('text', { class: 'lbl', 'text-anchor': 'end' }); els.lblLE.textContent = 'Bordo de ataque';
    els.lblTE = svg('text', { class: 'lbl', 'text-anchor': 'start' }); els.lblTE.textContent = 'Bordo de fuga';
    els.lblReflex = svg('text', { class: 'lbl-reflex', 'text-anchor': 'middle' }); els.lblReflex.textContent = 'REFLEX ATIVO';
    els.lblCoP = svg('text', { class: 'lbl-cop', 'text-anchor': 'middle' }); els.lblCoP.textContent = 'CoP';
    els.lblBrake = svg('text', { class: 'lbl', fill: 'var(--orange)', 'text-anchor': 'middle' }); els.lblBrake.textContent = 'TRAVÃO';
    [els.lblLE, els.lblTE, els.lblReflex, els.lblCoP, els.lblBrake].forEach(function (e) { scene.appendChild(e); });

    // piloto
    els.pilot = svg('g');
    els.pilot.appendChild(svg('line', { x1: PILOT.x, y1: PILOT.y - 26, x2: PILOT.x, y2: PILOT.y - 8, stroke: '#5f6772', 'stroke-width': '3' }));
    els.pilot.appendChild(svg('circle', { class: 'pilot-body', cx: PILOT.x, cy: PILOT.y, r: '16' }));
    scene.appendChild(els.pilot);

    // linhas de corrente estáticas (animadas por CSS)
    buildFlowLines();

    scenebuilt = true;
  }

  var FLOW_YS = [-150, -110, -74, -42, -14, 24, 60, 98, 140];
  function buildFlowLines() {
    els.flowGroup.innerHTML = '';
    els.flowPaths = [];
    FLOW_YS.forEach(function (offY, i) {
      var p = svg('path', { class: 'flow anim', style: 'animation-delay:' + (-i * 0.22) + 's' });
      els.flowGroup.appendChild(p);
      els.flowPaths.push({ el: p, offY: offY });
    });
  }

  /* transforma um ponto local da asa (corda) para coordenadas do palco,
     aplicando rotação do AoA em torno do PIVOT (~1/4 de corda) */
  function toStage(px, py, aoaDeg) {
    var rad = -aoaDeg * Math.PI / 180;            // AoA + => nariz sobe => rotação anti-horária no ecrã
    var ox = px - CHORD * 0.25;                    // origem no ~1/4 de corda
    var oy = py;
    var rx = ox * Math.cos(rad) - oy * Math.sin(rad);
    var ry = ox * Math.sin(rad) + oy * Math.cos(rad);
    return { x: PIVOT.x + rx, y: PIVOT.y + ry };
  }

  function updateScene(m) {
    if (!scenebuilt) buildScene();
    var aoa = m.aoaEff;

    // asa
    var wp = wingPath(m);
    els.wing.setAttribute('d', wp.d);
    // corda (LE->TE local)
    els.chordLine.setAttribute('x1', LEx); els.chordLine.setAttribute('y1', 0);
    els.chordLine.setAttribute('x2', CHORD); els.chordLine.setAttribute('y2', wp.teY);
    // rotação do grupo da asa
    var rot = 'rotate(' + (-aoa) + ' ' + (CHORD * 0.25) + ' 0)';
    var trans = 'translate(' + (PIVOT.x - CHORD * 0.25) + ' ' + PIVOT.y + ')';
    els.wingGroup.setAttribute('transform', trans + ' ' + rot);

    // CoP (local -> dentro do grupo já transformado)
    var copX = m.cop * CHORD;
    var copFrac = m.cop;
    var copY = copFrac < 0.3 ? (8 + copFrac * 18) : (14 + (wp.teY - 14) * ((copFrac - 0.3) / 0.7));
    els.copDot.setAttribute('cx', copX); els.copDot.setAttribute('cy', copY - 30);
    // haste do CoP até à corda
    // (desenhada como parte do grupo — atualizamos via linha simples reutilizando chordLine? mantemos dot)

    // fixações + linhas até ao piloto
    var fr = { a: 0.10, b: 0.42, c: 0.72, brake: 1.0 };
    ['a', 'b', 'c', 'brake'].forEach(function (k) {
      var cp = chordPoint(fr[k], m);
      els.attach[k].setAttribute('cx', cp.x);
      els.attach[k].setAttribute('cy', cp.y);
      var stg = toStage(cp.x, cp.y, aoa);
      var d = 'M ' + stg.x + ',' + stg.y + ' L ' + PILOT.x + ',' + (PILOT.y - 12);
      els.lineEls[k].setAttribute('d', d);
      // etiqueta da linha a meio
      if (els.lineLbls[k]) {
        var mx = (stg.x + PILOT.x) / 2, my = (stg.y + (PILOT.y - 12)) / 2;
        els.lineLbls[k].setAttribute('x', mx - 12);
        els.lineLbls[k].setAttribute('y', my);
      }
    });
    // cores das etiquetas de linha
    els.lineLbls.a.setAttribute('fill', 'var(--rl-a)');
    els.lineLbls.b.setAttribute('fill', 'var(--rl-b)');
    els.lineLbls.c.setAttribute('fill', 'var(--rl-c)');

    // etiquetas LE / TE / reflex / cop / travão em coordenadas do palco
    var leP = toStage(LEx, 4, aoa), teP = toStage(CHORD, wp.teY, aoa);
    els.lblLE.setAttribute('x', leP.x - 26); els.lblLE.setAttribute('y', leP.y - 14);
    els.lblTE.setAttribute('x', teP.x + 20); els.lblTE.setAttribute('y', teP.y - 6);
    els.lblBrake.setAttribute('x', PILOT.x - 8); els.lblBrake.setAttribute('y', PILOT.y - 70);
    var topP = toStage(CHORD * 0.55, -70, aoa);
    els.lblReflex.setAttribute('x', topP.x); els.lblReflex.setAttribute('y', topP.y - 8);
    els.lblReflex.setAttribute('opacity', m.reflexActive ? '1' : '0');
    var copStage = toStage(copX, copY - 32, aoa);
    els.lblCoP.setAttribute('x', copStage.x + 22); els.lblCoP.setAttribute('y', copStage.y - 2);

    // linhas de corrente — recalcula curvas em função do AoA
    updateFlow(m);
    updateSeparation(m);
  }

  function updateFlow(m) {
    var deflect = 26 + m.camber * 40 + Math.max(0, m.aoaEff) * 1.4;   // quanto o fluxo desvia sobre a asa
    els.flowPaths.forEach(function (fp) {
      var y0 = PIVOT.y + fp.offY;
      var bend = fp.offY < 0 ? -deflect * (1 - Math.min(1, Math.abs(fp.offY) / 170)) : deflect * 0.25 * (1 - Math.min(1, Math.abs(fp.offY) / 170));
      var x0 = 60, x1 = 940, midx = PIVOT.x;
      var d = 'M ' + x0 + ',' + y0 +
        ' C ' + (midx - 200) + ',' + y0 + ' ' + (midx - 120) + ',' + (y0 + bend) + ' ' + midx + ',' + (y0 + bend) +
        ' C ' + (midx + 140) + ',' + (y0 + bend) + ' ' + (midx + 220) + ',' + y0 + ' ' + x1 + ',' + y0;
      fp.el.setAttribute('d', d);
      // esconde as de cima quando muito separado (fluxo desorganizado)
      var hide = m.sepFrac > 0.5 && fp.offY < 0 && fp.offY > -80;
      fp.el.setAttribute('opacity', hide ? (0.5 - m.sepFrac * 0.4) : '');
    });
  }

  function updateSeparation(m) {
    els.sepGroup.innerHTML = '';
    if (m.sepFrac < 0.12) return;
    // ponto de separação sobe pela extradorso conforme sepFrac; dispersa a jusante do BF
    var teP = toStage(CHORD, -22 + (m.effFlap / 100) * 78, m.aoaEff);
    var n = Math.round(6 + m.sepFrac * 26);
    for (var i = 0; i < n; i++) {
      var t = i / n;
      var x = teP.x + 10 + t * (120 + m.sepFrac * 140) + (Math.random() * 14 - 7);
      var y = teP.y - 6 - Math.random() * (10 + m.sepFrac * 60);
      var r = 1.4 + Math.random() * 1.8;
      els.sepGroup.appendChild(svg('circle', { class: 'sep-dot', cx: x, cy: y, r: r, opacity: (0.25 + m.sepFrac * 0.6).toFixed(2) }));
    }
  }

  /* ============================================================
     PAINÉIS DE UI (leitura, dados, estabilidade, controlos, presets)
     ============================================================ */
  function buildReadout() {
    var r = document.getElementById('rl-readout');
    r.innerHTML =
      roBox('AOA', 'ro-aoa') + roBox('Velocidade', 'ro-spd') + roBox('Travão', 'ro-brake') +
      '<div class="ro flag"><div><div class="ro-label">Estado</div>' +
      '<div class="ro-flag" id="ro-flag"><span id="ro-flag-txt">Reflex</span></div></div></div>';
  }
  function roBox(label, id) {
    return '<div class="ro"><div class="ro-label">' + label + '</div><div class="ro-value" id="' + id + '">—</div></div>';
  }

  function buildMetrics() {
    var m = document.getElementById('rl-metrics');
    m.innerHTML =
      metric('CL', 'm-cl') + metric('CD', 'm-cd') + metric('L / D', 'm-ld') + metric('Momento (Cm)', 'm-cm');
  }
  function metric(label, id) {
    return '<div class="rl-metric"><span class="m-label">' + label + '</span><span class="m-value" id="' + id + '">—</span></div>';
  }

  function buildStab() {
    var s = document.getElementById('rl-stab');
    s.innerHTML =
      '<div class="rl-stab-top"><span class="rl-stab-label">Margem</span><span class="rl-stab-val" id="stab-val">—</span></div>' +
      '<div class="rl-stab-bar"><div class="rl-stab-knob" id="stab-knob"></div></div>' +
      '<div class="rl-stab-scale"><span>Baixa</span><span>Alta</span></div>' +
      '<div id="stab-warn" style="font-size:11.5px;line-height:1.4;color:var(--warn);margin-top:4px;min-height:0"></div>';
  }

  function buildLegend() {
    var l = document.getElementById('rl-legend');
    l.innerHTML =
      '<span class="lg flow"><i></i>Linhas de corrente</span>' +
      '<span class="lg sep"><i></i>Separação do fluxo</span>' +
      '<span class="lg cop"><i></i>Centro de pressão (CoP)</span>';
  }

  function buildControls() {
    var wrap = document.getElementById('rl-controls');
    wrap.innerHTML = '';
    CONTROLS.forEach(function (c) {
      var col = document.createElement('div'); col.className = 'rl-ctrl';
      col.innerHTML =
        '<div class="rl-ctrl-head"><span class="rl-ctrl-label">' + c.label + '</span>' +
        '<span class="rl-ctrl-value ' + (c.cls ? 'c-' + c.cls : '') + '" id="v-' + c.key + '"></span></div>' +
        '<input type="range" class="rl-slider ' + (c.cls ? 'c-' + c.cls : '') + '" id="s-' + c.key + '" ' +
        'min="' + c.min + '" max="' + c.max + '" step="' + c.step + '">' +
        '<div class="rl-ctrl-minmax"><span>' + c.fmt(c.min) + '</span><span>' + c.fmt(c.max) + '</span></div>';
      wrap.appendChild(col);
      var input = col.querySelector('input');
      input.value = state[c.key];
      input.addEventListener('input', function () {
        state[c.key] = parseFloat(input.value);
        setActivePreset(null);
        update();
      });
    });
    // roldanas (segmentado)
    var col = document.createElement('div'); col.className = 'rl-ctrl';
    var seg = '<div class="rl-ctrl-head"><span class="rl-ctrl-label">Roldanas</span>' +
      '<span class="rl-ctrl-value" id="v-pulley"></span></div><div class="rl-seg" id="seg-pulley">';
    PULLEYS.forEach(function (p) { seg += '<button type="button" data-p="' + p + '">' + p.toFixed(1) + '</button>'; });
    seg += '</div>';
    col.innerHTML = seg;
    wrap.appendChild(col);
    col.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.pulley = parseFloat(b.getAttribute('data-p'));
        setActivePreset(null);
        update();
      });
    });
  }

  function buildPresets() {
    var list = document.getElementById('rl-preset-list');
    list.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'rl-preset' + (p.warn ? ' warn' : '');
      b.setAttribute('data-name', p.name);
      b.innerHTML =
        '<svg class="pi" viewBox="0 0 44 20" aria-hidden="true"><path d="M2 12 C 12 3, 30 3, 42 8 C 32 7, 14 9, 2 12 Z"/></svg>' +
        '<span>' + p.name + '</span>';
      b.addEventListener('click', function () { applyPreset(p.name, true); update(); });
      list.appendChild(b);
    });
  }

  /* ---------- Presets ---------- */
  function applyPreset(name, markActive) {
    var p = PRESETS.filter(function (x) { return x.name === name; })[0];
    if (!p) return;
    Object.keys(p.state).forEach(function (k) { state[k] = p.state[k]; });
    if (markActive !== false) activePreset = name;
    syncInputs();
  }
  function setActivePreset(name) {
    activePreset = name;
    document.querySelectorAll('.rl-preset').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-name') === name);
    });
  }
  function syncInputs() {
    CONTROLS.forEach(function (c) {
      var el = document.getElementById('s-' + c.key);
      if (el) el.value = state[c.key];
    });
    var seg = document.getElementById('seg-pulley');
    if (seg) seg.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', parseFloat(b.getAttribute('data-p')) === state.pulley);
    });
  }

  /* ============================================================
     UPDATE GLOBAL
     ============================================================ */
  function update() {
    var m = compute();

    // valores dos controlos
    CONTROLS.forEach(function (c) {
      var v = document.getElementById('v-' + c.key);
      if (v) v.textContent = c.fmt(state[c.key]);
    });
    var vp = document.getElementById('v-pulley'); if (vp) vp.textContent = state.pulley.toFixed(1);

    // leitura rápida
    setTxt('ro-aoa', state.aoa.toFixed(1) + '°');
    setTxt('ro-spd', Math.round(state.airspeed) + ' km/h');
    setTxt('ro-brake', Math.round(state.brake) + '%');
    var flag = document.getElementById('ro-flag');
    var flagTxt = document.getElementById('ro-flag-txt');
    if (m.warn) { flag.className = 'ro-flag warn'; flagTxt.textContent = 'Atenção'; }
    else if (m.reflexActive) { flag.className = 'ro-flag on'; flagTxt.textContent = 'Reflex ativo'; }
    else { flag.className = 'ro-flag'; flagTxt.textContent = m.effFlap > 40 ? 'Travagem' : 'Voo neutro'; }

    // métricas
    setTxt('m-cl', m.CL.toFixed(2));
    setTxt('m-cd', m.CD.toFixed(3));
    setTxt('m-ld', m.LD.toFixed(1));
    setTxt('m-cm', (m.Cm >= 0 ? '+' : '') + m.Cm.toFixed(2));

    // estabilidade
    setTxt('stab-val', Math.round(m.stab));
    var knob = document.getElementById('stab-knob'); if (knob) knob.style.left = m.stab + '%';
    var sw = document.getElementById('stab-warn'); if (sw) sw.textContent = m.warn || '';

    // cena
    updateScene(m);

    save();
  }
  function setTxt(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  /* ---------- Reset ---------- */
  document.getElementById('rl-reset').addEventListener('click', function () {
    applyPreset('Reflex ativo', true);
    setActivePreset('Reflex ativo');
    update();
  });

  /* ---------- Arranque ---------- */
  buildReadout();
  buildMetrics();
  buildStab();
  buildLegend();
  buildControls();
  buildPresets();
  buildScene();
  syncInputs();
  setActivePreset(activePreset);
  update();

  // reflow das linhas/etiquetas ao redimensionar (o SVG usa viewBox, mas garantimos update)
  window.addEventListener('resize', function () { update(); });

})();
