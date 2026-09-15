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
    /* dentro do percurso já se está num ecrã próprio: não abre outro por cima */
    var ecra = movel() && !lg.closest('.pk-perc');
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

/* O PERCURSO «QUERO FAZER O CURSO» (15/09/2026)
   Cinco ecrãs por cima da página: para quem é, como se progride, onde e com
   quem, o curso e o preço, e falar — este com o assistente de cima dentro.
   Os textos vêm do JSON do `#pk-perc`; aqui só há o desenho.

   O BOTÃO «VOLTAR» DO TELEMÓVEL recua um passo e só fecha no primeiro. Abrir
   acrescenta uma entrada ao histórico; recuar um passo volta a pô-la. Fechar
   pelo botão tira-a, para o «voltar» seguinte não abrir nada. */
(function () {
  'use strict';
  var P = document.getElementById('pk-perc');
  if (!P) return;
  var D;
  try { D = JSON.parse(P.getAttribute('data-perc')); } catch (e) { return; }

  var N = D.passos.length, passo = 0, aberto = false, ignorarPop = false, origem = null;
  var caixa = P.querySelector('.pk-perc-caixa'), rolo = P.querySelector('.pk-perc-rolo');
  var passosEl = P.querySelector('.pk-perc-passos'), corpo = P.querySelector('.pk-perc-corpo');
  var falar = P.querySelector('.pk-perc-falar'), pe = P.querySelector('.pk-perc-pe');

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

  /* os separadores dos passos: tocar num salta para ele */
  var tabs = D.passos.map(function (p, k) {
    var li = el('li');
    var b = botao('pk-perc-tab', null, function () { passo = k; desenha(); });
    b.appendChild(el('span', 'pk-perc-tab-n', String(k + 1)));
    b.appendChild(el('span', 'pk-perc-tab-t', p.t));
    li.appendChild(b);
    passosEl.appendChild(li);
    return b;
  });

  function rotulo(pai, txt) { if (txt) pai.appendChild(el('p', 'pk-perc-rot', txt)); }
  function lista(cls, itens, fn) {
    var ul = el(cls.indexOf('fases') >= 0 ? 'ol' : 'ul', cls);
    itens.forEach(function (x) { var li = el('li'); fn(li, x); ul.appendChild(li); });
    return ul;
  }
  function bloco(b) {
    var d = el('div', 'pk-perc-b pk-perc-b-' + b.tipo);
    rotulo(d, b.rot);
    if (b.tipo === 'texto') d.appendChild(el('p', 'pk-perc-tx', b.tx));
    else if (b.tipo === 'nota') d.appendChild(el('p', 'pk-perc-nota', b.tx));
    else if (b.tipo === 'lista') d.appendChild(lista('pk-perc-lista', b.itens, function (li, x) { li.textContent = x; }));
    else if (b.tipo === 'fases') d.appendChild(lista('pk-perc-fases', b.itens, function (li, x) { li.textContent = x; }));
    else if (b.tipo === 'factos' || b.tipo === 'locais') {
      d.appendChild(lista('pk-perc-' + b.tipo, b.itens, function (li, x) {
        li.appendChild(el('b', null, x.v));
        li.appendChild(document.createTextNode(' '));
        li.appendChild(el('span', null, x.n));
      }));
    } else if (b.tipo === 'equipa') {
      b.grupos.forEach(function (g) {
        var gr = el('div', 'pk-perc-grupo');
        rotulo(gr, g.t);
        gr.appendChild(lista('pk-perc-pessoas', g.pessoas, function (li, p) {
          var img = el('img');
          img.src = p.foto;
          img.alt = '';
          img.width = 96;
          img.height = 96;
          img.loading = 'lazy';
          li.appendChild(img);
          li.appendChild(el('span', null, p.nome));
        }));
        d.appendChild(gr);
      });
    } else if (b.tipo === 'opcoes') {
      b.itens.forEach(function (o) {
        var c = el('div', 'pk-perc-opcao');
        c.appendChild(el('p', 'pk-perc-rot', o.rot));
        c.appendChild(el('p', 'pk-perc-preco', o.preco));
        c.appendChild(lista('pk-perc-lista', o.itens, function (li, x) { li.textContent = x; }));
        d.appendChild(c);
      });
    }
    return d;
  }

  function desenha() {
    var p = D.passos[passo];
    tabs.forEach(function (b, k) {
      b.classList.toggle('feito', k < passo);
      if (k === passo) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    corpo.textContent = '';
    corpo.appendChild(el('p', 'pk-perc-n', D.ui.passo.replace('{n}', passo + 1).replace('{t}', N)));
    var h = el('p', 'pk-perc-h', p.t);
    h.setAttribute('role', 'heading');
    h.setAttribute('aria-level', '2');
    corpo.appendChild(h);
    p.blocos.forEach(function (b) { corpo.appendChild(bloco(b)); });
    falar.hidden = p.id !== 'falar';

    pe.textContent = '';
    if (passo > 0) pe.appendChild(botao('pk-perc-link pk-perc-voltar', D.ui.voltar, function () { passo--; desenha(); }));
    var det = el('a', 'pk-perc-link pk-perc-detalhe', D.ui.detalhe);
    det.href = '#' + p.id;
    det.addEventListener('click', function (e) {
      e.preventDefault();
      var alvo = document.getElementById(p.id);
      fecha(true);
      try { history.replaceState(null, '', '#' + p.id); } catch (x) { /* ficheiro local */ }
      if (alvo) alvo.scrollIntoView({ block: 'start' });
    });
    pe.appendChild(det);
    if (passo < N - 1) pe.appendChild(botao('pk-b pk-perc-seguinte', D.ui.seguinte, function () { passo++; desenha(); }));

    rolo.scrollTop = 0;
    h.setAttribute('tabindex', '-1');
    try { h.focus({ preventScroll: true }); } catch (x) { h.focus(); }
  }

  function abre() {
    if (aberto) return;
    aberto = true;
    origem = document.activeElement;
    passo = 0;
    P.hidden = false;
    document.documentElement.classList.add('pk-perc-bloqueio');
    desenha();
    try { history.pushState({ pkPerc: 1 }, ''); } catch (x) { /* ficheiro local */ }
  }
  /* semHistorico: quando quem fecha já mexeu no histórico (o «voltar», o «ler em detalhe») */
  function fecha(semHistorico) {
    if (!aberto) return;
    aberto = false;
    P.hidden = true;
    document.documentElement.classList.remove('pk-perc-bloqueio');
    if (!semHistorico && history.state && history.state.pkPerc) { ignorarPop = true; history.back(); }
    if (origem && origem.focus) try { origem.focus({ preventScroll: true }); } catch (x) { /* nada */ }
  }

  addEventListener('popstate', function () {
    if (ignorarPop) { ignorarPop = false; return; }
    if (!aberto) return;
    if (passo > 0) {
      passo--;
      desenha();
      try { history.pushState({ pkPerc: 1 }, ''); } catch (x) { /* nada */ }
    } else fecha(true);
  });

  P.querySelector('.pk-perc-fechar').addEventListener('click', function () { fecha(false); });
  P.addEventListener('click', function (e) { if (e.target === P) fecha(false); });
  document.addEventListener('keydown', function (e) {
    if (!aberto) return;
    if (e.key === 'Escape') { fecha(false); return; }
    if (e.key !== 'Tab') return;
    /* o foco não sai do percurso enquanto está aberto */
    var f = [].filter.call(caixa.querySelectorAll('button, a[href], input, textarea, [tabindex="-1"]'), function (x) {
      return x.offsetParent !== null && x.getAttribute('tabindex') !== '-1';
    });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  [].forEach.call(document.querySelectorAll('[data-percurso]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); abre(); });
  });
})();
