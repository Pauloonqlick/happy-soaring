/**
 * A secção de música — partilhada pela página inicial e por /musica/
 * =================================================================
 *
 * PORQUE SAIU DO APP.JS
 *   Isto nunca foi "um leitor". São 384 linhas de loja: preços por escalão
 *   com garantia de melhor preço, uma selecção guardada no localStorage,
 *   referência de encomenda, o fluxo de WhatsApp com a pergunta de regresso
 *   ("chegaste a enviar?"), filtros por género, pesquisa, e só então o
 *   áudio. Mais 93 linhas de biografia.
 *
 *   Enquanto viveu dentro do app.js, só existia na página inicial — e uma
 *   secção com preço, termos de utilização e botão de compra que não tem
 *   endereço próprio não se partilha, não se mede e não se anuncia. Para a
 *   música passar a ter página, este código tinha de poder correr em dois
 *   sítios.
 *
 *   Foi mudado de casa, não reescrito. O corpo das duas funções está aqui
 *   tal como estava, linha por linha. Reescrever uma máquina de preços e um
 *   carrinho que funcionam, só para os pôr noutra página, seria trocar um
 *   problema de arquitectura por um risco comercial.
 *
 * COMO SE USA
 *   O módulo não conhece o app.js. Recebe os ajudantes que precisa e
 *   devolve as duas funções:
 *
 *     const { buildMusic, buildBio } = criarMusica({ el, t, ui, ... });
 *
 *   São nove, todos pequenos, e é essa lista que define a fronteira: se um
 *   dia isto precisar de um décimo, é sinal de que está a crescer para fora
 *   do que lhe compete.
 */
import { el, fmtTime, criarWaLink, visibilityClass, paragrafos,
  ICON_PLAY, ICON_PAUSE } from './dom.js';

/* Só três entram por parâmetro, e são os três que dependem da língua da
   página: traduzir um campo do CMS, ir buscar uma etiqueta da interface, e
   pôr o prefixo de idioma num endereço. Tudo o resto é igual em qualquer
   sítio e vem do dom.js. */
export function criarMusica(ajudas) {
  const { t, ui, local } = ajudas;
  /* Na página inicial a biografia é um bloco longo dentro de um slide e por
     isso abre-se a pedido. Na /musica/ é a resposta a "quem fez isto?" numa
     página que vende música — esconder a credibilidade atrás de um clique é
     o contrário do que se quer. Quem chama diz em que caso está. */
  const bioAberta = !!ajudas.bioAberta;
  const waLink = criarWaLink(t);

  /* Vieram com as funções, do app.js, porque só elas os usavam. O bioSeq é
     um contador de instâncias: dá identificadores únicos aos blocos da
     biografia quando há mais do que um na mesma página. */
  const nTracks = n => ui(n === 1 ? 'nTrack' : 'nTracks', { n: n });
  let bioSeq = 0;

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
        a.href = b.href ? local(b.href) : waLink(num, b.waMessage);
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
    /* O BOTAO DA BARRA COM NADA ESCOLHIDO
       Antes daqui saía um `return` silencioso: o botão tinha cursor de mão,
       recebia foco e anunciava-se como "reproduzir" a um leitor de ecrã — e
       não fazia nada. Quem carrega em play num leitor está a dizer "toca", não
       "toca a faixa que eu escolhi há pouco".

       Agora começa pela primeira faixa da lista. Da lista VISIVEL, não das 42:
       se o filtro está em Instrumental, arrancar com um reggae era responder a
       outra pergunta. É o mesmo critério que o fim de faixa já usava para
       passar à seguinte.

       Reaproveita-se o clique do botão da própria linha em vez de duplicar o
       playTrack: assim o ícone, o título e o estado ficam certos sem haver
       dois caminhos para pôr música a tocar. */
    npBtn.addEventListener('click', () => {
      if (!audio.src) {
        if (!flatBody) return;
        const linha = flatBody.querySelector('.music-track:not(.mfhide)');
        const play = linha && linha.querySelector('.music-pl');
        if (play) { play.click(); linha.scrollIntoView({ block: 'nearest' }); }
        return;
      }
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    });
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

  function buildBio(item) {
    const caixa = el('div', 'bio-caixa' + visibilityClass(item));
    const wrap = el('article', 'bio');

    if (item.imagem) {
      const fig = el('figure', 'bio-faixa');
      const pic = el('picture');
      /* o banner é largo (2.33:1); numa caixa alta de telemóvel cortava as
         figuras pelo meio, por isso abaixo dos 820 entra um recorte fechado */
      if (item.imagemMobile) {
        const src = el('source');
        src.media = '(max-width:820px)';
        src.srcset = item.imagemMobile;
        pic.appendChild(src);
      }
      const im = el('img');
      im.src = item.imagem;
      im.alt = t(item.alt) || '';
      im.loading = 'lazy';
      pic.appendChild(im);
      fig.appendChild(pic);
      const leg = t(item.legenda);
      if (leg) { const fc = el('figcaption'); fc.textContent = leg; fig.appendChild(fc); }
      wrap.appendChild(fig);
    }

    const corpo = el('div', 'bio-corpo');

    if (item.nome) { const h = el('h3', 'bio-nome'); h.textContent = t(item.nome); corpo.appendChild(h); }

    if ((item.credenciais || []).length) {
      const ul = el('ul', 'bio-cred');
      item.credenciais.forEach(c => { const li = el('li'); li.textContent = t(c); ul.appendChild(li); });
      corpo.appendChild(ul);
    }

    const abre = t(item.abertura);
    if (abre) paragrafos(abre).forEach(p => { p.classList.add('bio-abre'); corpo.appendChild(p); });

    if ((item.marcos || []).length) {
      const ul = el('ul', 'bio-linha');
      item.marcos.forEach(m => {
        const li = el('li');
        const ano = t(m.ano);
        if (ano) { const s = el('span', 'bio-ano'); s.textContent = ano; li.appendChild(s); }
        const facto = t(m.facto);
        if (facto) { const s = el('span', 'bio-facto'); s.textContent = facto; li.appendChild(s); }
        const nota = t(m.nota);
        if (nota) { const s = el('span', 'bio-nota'); s.textContent = nota; li.appendChild(s); }
        ul.appendChild(li);
      });
      corpo.appendChild(ul);
    }

    const remate = t(item.remate), lema = t(item.lema);
    if (remate || lema) {
      const bloco = el('div', 'bio-remate');
      if (remate) paragrafos(remate).forEach(p => bloco.appendChild(p));
      if (lema) { const s = el('span'); s.textContent = lema; bloco.appendChild(s); }
      corpo.appendChild(bloco);
    }

    wrap.appendChild(corpo);

    /* A biografia só aparece por acção: sem clique fica um texto e mais nada.
       É uma divulgação (disclosure), não um link — não muda de página, mostra o
       que já está aqui. Por isso <button> com aria-expanded e aria-controls, que
       é o que um leitor de ecrã precisa para anunciar "recolhido/expandido". */
    const id = 'bio-' + (++bioSeq);
    wrap.id = id;
    wrap.hidden = !bioAberta;

    const abrir = el('button', 'bio-abrir');
    abrir.type = 'button';
    abrir.setAttribute('aria-expanded', bioAberta ? 'true' : 'false');
    abrir.setAttribute('aria-controls', id);
    const rot = el('span');
    rot.textContent = t(item.gatilho) || t(item.nome) || '';
    abrir.appendChild(rot);
    abrir.insertAdjacentHTML('beforeend',
      '<svg width="14" height="9" viewBox="0 0 14 9" fill="none" aria-hidden="true">' +
      '<path d="M1 1.5 7 7.5l6-6" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>');
    abrir.addEventListener('click', () => {
      const aberto = abrir.getAttribute('aria-expanded') === 'true';
      abrir.setAttribute('aria-expanded', aberto ? 'false' : 'true');
      wrap.hidden = aberto;
    });

    caixa.appendChild(abrir);
    caixa.appendChild(wrap);
    return caixa;
  }

  return { buildMusic, buildBio };
}
