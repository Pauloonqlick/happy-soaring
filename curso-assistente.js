/* O ASSISTENTE DA PÁGINA DO CURSO — «Curso completo ou à hora?»
   ==============================================================
   Um só assistente para a página /curso-parakite-portugal/ nas cinco línguas.
   Junta o simulador «curso ou hora» e as quatro perguntas de WhatsApp que o
   Paulo validou: ninguém responde duas vezes às mesmas coisas.

   O FLUXO
     6 perguntas (um toque cada, ou «Outra» com texto) → a sugestão e o porquê
     → a mensagem, que se vê antes de enviar e aceita um acrescento → WhatsApp.
     As respostas já dadas ficam por cima como etiquetas: tocar numa volta a
     essa pergunta sem recomeçar. No telemóvel ocupa o ecrã inteiro.

   O QUE NÃO FAZ
     Não guarda nada (nem localStorage, nem cookies) e não envia nada para
     lado nenhum: a única saída é o endereço do WhatsApp que a própria pessoa
     abre. Os textos vêm do JSON que o gerador escreve no `#pk-assist`, a
     partir do scripts/conteudo-curso-parakite.mjs — aqui não há texto.

   AS REGRAS (aprovadas pelo Paulo a 14/09/2026) estão em `decide()`. Mudar uma
   regra é mudar aqui e dizer-lhe; as frases de porquê estão no conteúdo.

   E O ÍNDICE DA PÁGINA
   O cabeçalho do site também é fixo e muda de altura ao descer (no telemóvel
   fica meio escondido). O índice cola-se ao FUNDO VISÍVEL dele: mede-se no
   scroll, que é barato, e não num requestAnimationFrame, que não corre em
   iframes escondidos. */
(function () {
  var topo = document.querySelector('.pg-topo');
  if (!topo || !document.querySelector('.pk-indice')) return;
  function mede() {
    var fundo = Math.max(0, Math.round(topo.getBoundingClientRect().bottom));
    document.documentElement.style.setProperty('--pk-topo', fundo + 'px');
  }
  mede();
  addEventListener('resize', mede);
  addEventListener('scroll', mede, { passive: true });
})();
(function () {
  'use strict';
  var A = document.getElementById('pk-assist');
  if (!A) return;
  var D;
  try { D = JSON.parse(A.getAttribute('data-assist')); } catch (e) { return; }

  var N = D.perguntas.length;
  var respostas = [];          /* por pergunta: { k: índice da resposta } ou { k: -1, texto } para «Outra» */
  var passo = 0;               /* 0..N-1: perguntas · N: sugestão · N+1: mensagem */
  var extra = '';
  var lugarActual = null;
  var POS = {};
  D.perguntas.forEach(function (q, k) { POS[q.id] = k; });

  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var movel = function () { return mq('(max-width: 720px)'); };
  var semMovimento = function () { return mq('(prefers-reduced-motion: reduce)'); };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function botao(cls, txt, fn) {
    var b = el('button', cls, txt);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  /* ---- a moldura: título, fechar, respostas dadas, corpo ---- */
  var topo = el('div', 'pk-assist-topo');
  topo.appendChild(el('p', 'pk-assist-titulo', D.ui.titulo));
  topo.appendChild(botao('pk-assist-link pk-assist-fechar', D.ui.fechar, fecha));
  var feitas = el('div', 'pk-assist-feitas');
  var corpo = el('div', 'pk-assist-corpo');
  corpo.setAttribute('aria-live', 'polite');
  A.appendChild(topo);
  A.appendChild(feitas);
  A.appendChild(corpo);
  A.setAttribute('role', 'region');
  A.setAttribute('aria-label', D.ui.titulo);

  /* ---- os pontos de entrada ---- */
  [].forEach.call(document.querySelectorAll('.pk-assist-lugar'), function (lg) {
    var ent = lg.querySelector('.pk-assist-entrada');
    if (!ent) return;
    ent.hidden = false;
    ent.querySelector('.pk-assist-abre').addEventListener('click', function () { abre(lg); });
  });
  /* as ligações para #falar (o botão do topo, o do fim da conversão) abrem-no no fim da página */
  [].forEach.call(document.querySelectorAll('a[href="#falar"]'), function (a) {
    a.addEventListener('click', function (e) {
      var lg = document.querySelector('.pk-assist-lugar[data-lugar="falar"]');
      if (!lg) return;
      e.preventDefault();
      abre(lg);
    });
  });

  function abre(lg) {
    if (lugarActual && lugarActual !== lg) lugarActual.querySelector('.pk-assist-entrada').hidden = false;
    lugarActual = lg;
    lg.querySelector('.pk-assist-entrada').hidden = true;
    lg.appendChild(A);
    A.hidden = false;
    var ecra = movel();
    A.classList.toggle('pk-assist-ecra', ecra);
    document.documentElement.classList.toggle('pk-assist-bloqueio', ecra);
    desenha();
    if (!ecra) A.scrollIntoView({ block: 'start', behavior: semMovimento() ? 'auto' : 'smooth' });
  }
  function fecha() {
    A.hidden = true;
    A.classList.remove('pk-assist-ecra');
    document.documentElement.classList.remove('pk-assist-bloqueio');
    if (lugarActual) {
      var ent = lugarActual.querySelector('.pk-assist-entrada');
      ent.hidden = false;
      ent.querySelector('.pk-assist-abre').focus();
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !A.hidden && A.classList.contains('pk-assist-ecra')) fecha();
  });

  function foca(e) {
    e.setAttribute('tabindex', '-1');
    try { e.focus({ preventScroll: true }); } catch (x) { e.focus(); }
    if (A.classList.contains('pk-assist-ecra')) { A.scrollTop = 0; return; }
    var r = A.getBoundingClientRect();
    if (r.top < 0) A.scrollIntoView({ block: 'start', behavior: semMovimento() ? 'auto' : 'smooth' });
  }

  /* ---- respostas ---- */
  function textoDe(k) {
    var r = respostas[k];
    if (!r) return null;
    return r.k === -1 ? r.texto : D.perguntas[k].op[r.k].t;
  }
  function nivel(id) {
    var k = POS[id], r = respostas[k];
    if (!r) return null;
    return r.k === -1 ? 'outra' : D.perguntas[k].op[r.k].n;
  }
  function seguinte(de) {
    for (var k = de; k < N; k++) if (!respostas[k]) return k;
    for (k = 0; k < N; k++) if (!respostas[k]) return k;
    return N;
  }
  function avanca() { passo = seguinte(passo + 1); desenha(); }

  /* AS REGRAS — por esta ordem; a primeira que servir decide */
  function decide() {
    var voo = nivel('voo'), gh = nivel('gh'), mw = nivel('mw'), obj = nivel('obj'), fmt = nivel('fmt');
    if (voo === 'formacao') return ['falar', 'r8'];                        /* o curso é para pilotos de parapente */
    if (gh === 'outra' || mw === 'outra' || obj === 'outra') return ['falar', 'r9'];
    if (obj === 'pontos' && (gh === 'g2' || mw === 'm2')) return ['hora', 'r1'];
    if (obj === 'base') return [fmt === 'soltas' ? 'medida' : 'curso', 'r2']; /* base completa: sempre o curso */
    if (obj === 'pontos') return ['falar', 'r4'];
    if (obj === 'naosei' && (gh === 'g1' || mw === 'm1')) return ['falar', 'r5'];
    if (obj === 'naosei' && gh === 'g0' && mw === 'm0') return ['curso', 'r6'];
    return ['falar', 'r7'];
  }
  function marcaCartao(chave) {
    [].forEach.call(document.querySelectorAll('.pk-opcao'), function (c) {
      var o = c.getAttribute('data-opcao');
      c.classList.toggle('pk-opcao-sugerida', chave === 'hora' ? o === 'hora' : (chave === 'curso' || chave === 'medida') && o === 'curso');
    });
  }

  /* ---- desenho ---- */
  function desenha() {
    desenhaFeitas();
    corpo.textContent = '';
    if (passo < N) pergunta();
    else if (passo === N) sugestao();
    else mensagem();
  }

  function desenhaFeitas() {
    feitas.textContent = '';
    var ul = el('ul', 'pk-assist-feitas-l');
    D.perguntas.forEach(function (q, k) {
      var t = textoDe(k);
      if (t == null) return;
      var li = el('li');
      var b = botao('pk-assist-feita' + (k === passo ? ' on' : ''), t, function () { passo = k; desenha(); });
      b.setAttribute('aria-label', q.rot + ': ' + t);
      li.appendChild(b);
      ul.appendChild(li);
    });
    if (ul.children.length) {
      feitas.appendChild(el('p', 'pk-assist-feitas-t', D.ui.respostas));
      feitas.appendChild(ul);
    }
  }

  function pergunta() {
    var q = D.perguntas[passo], r = respostas[passo];
    corpo.appendChild(el('p', 'pk-assist-passo', D.ui.passo.replace('{n}', passo + 1).replace('{t}', N)));
    var barra = el('div', 'pk-assist-barra'), feito = el('span');
    feito.style.width = (passo / N * 100) + '%';
    barra.appendChild(feito);
    corpo.appendChild(barra);
    var t = el('p', 'pk-assist-q', q.t);
    t.id = 'pk-assist-q';
    corpo.appendChild(t);

    var ops = el('div', 'pk-assist-ops');
    ops.setAttribute('role', 'group');
    ops.setAttribute('aria-labelledby', 'pk-assist-q');
    var todos = [];
    function marca(b) {
      todos.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on');
      b.setAttribute('aria-pressed', 'true');
    }
    q.op.forEach(function (o, k) {
      var b = botao('pk-assist-op', o.t, function () {
        marca(b);
        respostas[passo] = { k: k };
        setTimeout(avanca, semMovimento() ? 0 : 220);
      });
      todos.push(b);
      ops.appendChild(b);
    });
    var outra = botao('pk-assist-op pk-assist-op-outra', D.ui.outra, function () {
      marca(outra);
      caixa.hidden = false;
      inp.focus();
    });
    todos.push(outra);
    ops.appendChild(outra);
    todos.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (r) marca(r.k === -1 ? outra : todos[r.k]);
    corpo.appendChild(ops);

    var caixa = el('div', 'pk-assist-outra');
    caixa.hidden = !(r && r.k === -1);
    var inp = el('input');
    inp.type = 'text';
    inp.maxLength = 200;
    inp.placeholder = D.ui.escreve;
    inp.setAttribute('aria-label', q.t + ' (' + D.ui.outra + ')');
    if (r && r.k === -1) inp.value = r.texto;
    var seg = botao('pk-b pk-assist-seguinte', D.ui.seguinte, confirma);
    var valida = function () { seg.disabled = inp.value.trim().length < 2; };
    inp.addEventListener('input', valida);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); confirma(); } });
    valida();
    caixa.appendChild(inp);
    caixa.appendChild(seg);
    corpo.appendChild(caixa);
    function confirma() {
      var v = inp.value.trim();
      if (v.length < 2) { inp.focus(); return; }
      respostas[passo] = { k: -1, texto: v };
      avanca();
    }

    if (passo > 0) corpo.appendChild(botao('pk-assist-link', D.ui.voltar, function () { passo--; desenha(); }));
    foca(t);
  }

  function porqueDe(d) {
    var p = D.porque[d[1]];
    /* curso para quem prefere sessões soltas: diz-se que os dias se marcam à medida */
    if ((d[0] === 'curso' || d[0] === 'medida') && nivel('fmt') === 'soltas') p += ' ' + D.porque.r3;
    return p;
  }

  function sugestao() {
    var d = decide();
    marcaCartao(d[0]);
    corpo.appendChild(el('p', 'pk-assist-rot', D.ui.sugestao));
    var t = el('p', 'pk-assist-res pk-assist-res-' + d[0], D.res[d[0]]);
    corpo.appendChild(t);
    corpo.appendChild(el('p', 'pk-assist-porque', porqueDe(d)));
    corpo.appendChild(el('p', 'pk-assist-aviso', D.ui.aviso));
    var fim = el('div', 'pk-assist-fim');
    fim.appendChild(botao('pk-b pk-assist-seguinte', D.ui.verMensagem, function () { passo = N + 1; desenha(); }));
    fim.appendChild(botao('pk-assist-link', D.ui.recomecar, function () {
      respostas = [];
      extra = '';
      passo = 0;
      marcaCartao(null);
      desenha();
    }));
    corpo.appendChild(fim);
    foca(t);
  }

  function montaMensagem() {
    var d = decide();
    var linhas = [D.abre, ''];
    D.perguntas.forEach(function (q, k) {
      var t = textoDe(k);
      if (t != null) linhas.push(q.rot + ': ' + t);
    });
    linhas.push('', D.ui.rotuloMsg + ': ' + D.res[d[0]]);
    if (extra.trim()) linhas.push('', extra.trim());
    linhas.push('', D.fecho);
    return linhas.join('\n');
  }

  function mensagem() {
    var titulo = el('p', 'pk-assist-rot', D.ui.mensagemTitulo);
    corpo.appendChild(titulo);
    var caixaMsg = el('p', 'pk-assist-msg');
    corpo.appendChild(caixaMsg);
    var lab = el('label', 'pk-assist-extra');
    lab.appendChild(el('span', null, D.ui.acrescentar));
    var ta = el('textarea');
    ta.rows = 3;
    ta.maxLength = 500;
    ta.value = extra;
    lab.appendChild(ta);
    corpo.appendChild(lab);
    corpo.appendChild(el('p', 'pk-assist-aviso', D.ui.mensagemNota));
    var fim = el('div', 'pk-assist-fim');
    var a = el('a', 'pk-b pk-assist-enviar', D.ui.enviar);
    a.target = '_blank';
    a.rel = 'noopener';
    function actualiza() {
      extra = ta.value;
      var m = montaMensagem();
      caixaMsg.textContent = m;
      a.href = 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(m);
    }
    ta.addEventListener('input', actualiza);
    actualiza();
    fim.appendChild(a);
    fim.appendChild(botao('pk-assist-link', D.ui.voltarSugestao, function () { passo = N; desenha(); }));
    corpo.appendChild(fim);
    foca(titulo);
  }
})();
