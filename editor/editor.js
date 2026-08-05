/* ============================================================
   Editor de Músicas — Happy Soaring
   Lê e escreve content/slides/music.json diretamente no disco,
   pela File System Access API (Chrome/Edge). Sem servidor.
   Edita apenas: nome, género, grátis, duplicado.
   Todos os outros campos das faixas são preservados tal como estão.
   ============================================================ */
(function () {
  'use strict';

  var dirHandle = null;      // pasta do projeto
  var jsonHandle = null;     // content/slides/music.json
  var doc = null;            // JSON completo (preservado)
  var musicEl = null;        // o elemento role:"music"
  var tracks = null;         // referência para o array de faixas
  var vocab = [];            // vocabulário de géneros (inclui os ainda não usados)
  var finals = [];           // nome final por faixa (coluna editável)
  var dirty = false;
  var wavIndex = new Map();  // slug normalizado -> handle do WAV em masters/

  var $ = function (id) { return document.getElementById(id); };
  var elOpen = $('ed-open'), elSave = $('ed-save'), elFolder = $('ed-folder');
  var elIntro = $('ed-intro'), elMain = $('ed-main'), elRows = $('ed-rows');
  var elStats = $('ed-stats'), elSearch = $('ed-search'), elGenres = $('ed-genres');
  var audio = $('ed-audio');
  var playingBtn = null;

  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  /* o cabeçalho da tabela cola-se por baixo do cabeçalho da página.
     Medimos a altura real (muda com a largura da janela) para nenhuma linha
     ficar escondida por trás dele. */
  function medeTopo() {
    var h = document.querySelector('.ed-top').offsetHeight;
    document.documentElement.style.setProperty('--edtop', h + 'px');
  }
  window.addEventListener('resize', medeTopo);
  window.addEventListener('load', medeTopo);
  medeTopo();

  function toast(msg, kind, ms) {
    var t = $('ed-toast');
    t.textContent = msg;
    t.className = 'ed-toast' + (kind ? ' ' + kind : '');
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, ms || 4200);
  }

  function setDirty(v) {
    dirty = v;
    elSave.disabled = !v;
    elSave.classList.toggle('dirty', v);
  }

  /* ---------- abrir pasta ---------- */
  elOpen.addEventListener('click', async function () {
    if (!window.showDirectoryPicker) {
      toast('Este browser não suporta edição de ficheiros locais.\nUsa o Chrome ou o Edge.', 'err', 8000);
      return;
    }
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (e) { return; }              // utilizador cancelou

    try {
      var content = await dirHandle.getDirectoryHandle('content');
      var slides = await content.getDirectoryHandle('slides');
      jsonHandle = await slides.getFileHandle('music.json');
    } catch (e) {
      toast('Não encontrei content/slides/music.json nessa pasta.\nEscolheste a pasta HappySoaring?', 'err', 8000);
      return;
    }

    try {
      var file = await jsonHandle.getFile();
      doc = JSON.parse(await file.text());
    } catch (e) {
      toast('Não consegui ler o music.json: ' + e.message, 'err', 8000);
      return;
    }

    var music = (doc.elements || []).filter(function (x) { return x.role === 'music'; })[0];
    if (!music || !Array.isArray(music.tracks)) {
      toast('Não encontrei a lista de faixas dentro do music.json.', 'err', 8000);
      return;
    }
    musicEl = music;
    tracks = music.tracks;
    /* vocabulário: o que estiver guardado + o que as faixas já usam */
    vocab = Array.isArray(music.genreList) ? music.genreList.slice() : [];
    tracks.forEach(function (t) {
      if (t.genre && vocab.indexOf(t.genre) < 0) vocab.push(t.genre);
    });
    vocab.sort();

    /* o "nome final" parte sempre do nome atual */
    finals = tracks.map(function (t) { return t.name || ''; });
    /* indexa os masters (WAV) para o leitor */
    await indexaMasters();

    elFolder.textContent = dirHandle.name + '  ·  ' + tracks.length + ' faixas';
    elIntro.hidden = true;
    elMain.hidden = false;
    render();
    setDirty(false);
    toast('Carregadas ' + tracks.length + ' faixas.', 'ok');
  });

  /* ---------- masters (WAV) ----------
     Percorre masters/ (e subpastas) e indexa os .wav pelo nome normalizado.
     A ligação faixa->WAV é feita pelo "slug" do ficheiro de preview, que não
     muda quando renomeias a faixa. */
  function norm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function slugDoPreview(file) {
    var b = String(file || '').split('/').pop();
    var m = b.match(/^happy-soaring_(.+?)_total-/);
    return m ? norm(m[1]) : null;
  }
  async function indexaMasters() {
    wavIndex = new Map();
    var masters;
    try { masters = await dirHandle.getDirectoryHandle('masters'); } catch (e) { return; }
    async function walk(dir, depth) {
      if (depth > 3) return;
      for await (var entry of dir.values()) {
        if (entry.kind === 'directory') await walk(entry, depth + 1);
        else if (/\.wav$/i.test(entry.name)) {
          wavIndex.set(norm(entry.name.replace(/\.wav$/i, '')), entry);
        }
      }
    }
    try { await walk(masters, 0); } catch (e) { }
  }
  function wavPara(t) {
    var s = slugDoPreview(t.file);
    return (s && wavIndex.get(s)) || wavIndex.get(norm(t.name)) || null;
  }

  /* ---------- render ---------- */
  function knownGenres() {
    var s = {};
    vocab.forEach(function (g) { if (g) s[g] = 1; });
    tracks.forEach(function (t) { if (t.genre) s[t.genre] = 1; });
    return Object.keys(s).sort();
  }
  function countFor(g) {
    return tracks.filter(function (t) { return t.genre === g; }).length;
  }

  function refreshDatalist() {
    elGenres.innerHTML = '';
    knownGenres().forEach(function (g) {
      var o = document.createElement('option'); o.value = g; elGenres.appendChild(o);
    });
  }

  /* ---------- painel de géneros ---------- */
  function renderGenres() {
    var list = knownGenres();
    $('ed-gcount').textContent = '(' + list.length + ')';
    var box = $('ed-glist');
    box.innerHTML = '';
    if (!list.length) {
      box.innerHTML = '<p class="ed-ghelp">Ainda não há géneros. Cria um em baixo, ou escreve direto na tabela.</p>';
      return;
    }
    list.forEach(function (g) {
      var n = countFor(g);
      var r = document.createElement('div'); r.className = 'ed-grow';

      var inp = document.createElement('input');
      inp.className = 'ed-in'; inp.type = 'text'; inp.value = g;
      /* renomear só quando sai do campo, para não reescrever a cada tecla */
      inp.addEventListener('change', function () {
        var novo = inp.value.trim();
        if (novo === g) return;
        if (!novo) { inp.value = g; toast('O género não pode ficar sem nome. Usa "Remover" para o tirar.', 'err'); return; }
        if (knownGenres().indexOf(novo) >= 0) {
          if (!confirm('Já existe o género "' + novo + '".\n\nJuntar "' + g + '" (' + n + ' faixas) a "' + novo + '"?')) { inp.value = g; return; }
        }
        tracks.forEach(function (t) { if (t.genre === g) t.genre = novo; });
        vocab = vocab.filter(function (x) { return x !== g; });
        if (vocab.indexOf(novo) < 0) vocab.push(novo);
        setDirty(true); render();
        toast('Género "' + g + '" passou a "' + novo + '" em ' + n + ' faixa(s).', 'ok');
      });

      var cnt = document.createElement('span');
      cnt.className = 'ed-gnum';
      cnt.textContent = n === 1 ? '1 faixa' : n + ' faixas';

      var del = document.createElement('button');
      del.className = 'ed-gdel'; del.type = 'button'; del.textContent = 'Remover';
      del.addEventListener('click', function () {
        if (n && !confirm('Remover o género "' + g + '"?\n\n' + n + ' faixa(s) ficam sem género.\nAs faixas e os ficheiros não são apagados.')) return;
        tracks.forEach(function (t) { if (t.genre === g) t.genre = ''; });
        vocab = vocab.filter(function (x) { return x !== g; });
        setDirty(true); render();
        toast('Género "' + g + '" removido.', 'ok');
      });

      r.appendChild(inp); r.appendChild(cnt); r.appendChild(del);
      box.appendChild(r);
    });
  }

  $('ed-gnew-add').addEventListener('click', addGenre);
  $('ed-gnew-in').addEventListener('keydown', function (e) { if (e.key === 'Enter') addGenre(); });
  function addGenre() {
    var inp = $('ed-gnew-in');
    var g = inp.value.trim();
    if (!g) return;
    if (knownGenres().indexOf(g) >= 0) { toast('O género "' + g + '" já existe.', 'err'); return; }
    vocab.push(g); inp.value = '';
    setDirty(true); render();
    toast('Género "' + g + '" criado. Já aparece nas sugestões da tabela.', 'ok');
  }

  function render() {
    refreshDatalist();
    renderGenres();
    elRows.innerHTML = '';
    tracks.forEach(function (t, i) { elRows.appendChild(row(t, i)); });
    markNames();
    stats();
    applyFilter();
  }

  function row(t, i) {
    var tr = document.createElement('tr');
    tr.dataset.i = i;
    tr.classList.toggle('dup', t.duplicate === true);

    /* ouvir */
    var tdP = document.createElement('td'); tdP.className = 'c-play';
    var play = document.createElement('button');
    play.className = 'ed-play'; play.type = 'button'; play.innerHTML = ICON_PLAY;
    var temWav = !!wavPara(t);
    play.title = temWav ? 'Tocar o WAV (master)' : (t.file ? 'Sem WAV — toca o excerto MP3' : 'sem ficheiro');
    play.disabled = !t.file && !temWav;
    if (!temWav) play.classList.add('nowav');
    play.addEventListener('click', function () { toggle(t, play); });
    tdP.appendChild(play); tr.appendChild(tdP);

    /* nº */
    var tdN = document.createElement('td'); tdN.className = 'c-num';
    tdN.innerHTML = '<span class="ed-num">' + (i + 1) + '</span>'; tr.appendChild(tdN);

    /* nome atual — referência, não editável */
    var tdOld = document.createElement('td'); tdOld.className = 'c-oldname';
    var sOld = document.createElement('span');
    sOld.className = 'ed-old'; sOld.textContent = t.name || '—'; sOld.title = t.name || '';
    tdOld.appendChild(sOld); tr.appendChild(tdOld);

    /* nome final — é aqui que se escreve */
    var tdName = document.createElement('td');
    var inName = document.createElement('input');
    inName.className = 'ed-in final'; inName.type = 'text'; inName.value = finals[i] || '';
    inName.placeholder = 'nome final…';
    if ((finals[i] || '') !== (t.name || '')) inName.classList.add('sug');
    inName.addEventListener('input', function () {
      finals[i] = inName.value;
      inName.classList.toggle('sug', inName.value !== (t.name || ''));
      setDirty(true); markNames(); stats();
    });
    tdName.appendChild(inName); tr.appendChild(tdName);

    /* género */
    var tdG = document.createElement('td');
    var inG = document.createElement('input');
    inG.className = 'ed-in genre'; inG.type = 'text'; inG.value = t.genre || '';
    inG.setAttribute('list', 'ed-genres');
    inG.placeholder = 'sem género';
    inG.addEventListener('input', function () {
      t.genre = inG.value.trim(); setDirty(true); stats();
    });
    /* ao sair do campo: se for um género novo, entra no vocabulário/sugestões */
    inG.addEventListener('change', function () {
      var g = inG.value.trim();
      if (g && vocab.indexOf(g) < 0) { vocab.push(g); refreshDatalist(); renderGenres(); }
      else { renderGenres(); }
    });
    tdG.appendChild(inG); tr.appendChild(tdG);

    /* grátis */
    tr.appendChild(swCell(t.free === true, function (on) {
      t.free = on; setDirty(true); stats();
    }, false, 'Marcar como gratuita'));

    /* duplicado */
    tr.appendChild(swCell(t.duplicate === true, function (on) {
      t.duplicate = on; tr.classList.toggle('dup', on); setDirty(true); stats();
    }, true, 'Marcar como duplicado (para remoção posterior)'));

    /* idioma (editável) */
    var tdL = document.createElement('td'); tdL.className = 'c-lang';
    var selL = document.createElement('select');
    selL.className = 'ed-in lang';
    /* instrumental não tem idioma: fica em branco */
    [['pt', 'PT'], ['en', 'EN'], ['inst', '']].forEach(function (o) {
      var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1];
      selL.appendChild(op);
    });
    selL.title = 'Idioma da letra. Em branco = instrumental (alimenta o filtro Instrumental no site).';
    selL.value = (t.lang === 'pt' || t.lang === 'en' || t.lang === 'inst') ? t.lang : 'en';
    if (selL.value !== t.lang) { t.lang = selL.value; }
    selL.addEventListener('change', function () {
      t.lang = selL.value; setDirty(true); stats();
    });
    tdL.appendChild(selL); tr.appendChild(tdL);
    var tdD = document.createElement('td'); tdD.className = 'c-meta';
    tdD.innerHTML = '<span class="ed-meta">' + (t.duration || '—') + '</span>';
    tr.appendChild(tdD);

    return tr;
  }

  function swCell(checked, onChange, danger, title) {
    var td = document.createElement('td'); td.className = 'c-flag';
    var lab = document.createElement('label');
    lab.className = 'ed-sw' + (danger ? ' danger' : '');
    lab.title = title || '';
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!checked;
    var sp = document.createElement('span');
    cb.addEventListener('change', function () { onChange(cb.checked); });
    lab.appendChild(cb); lab.appendChild(sp); td.appendChild(lab);
    return td;
  }

  /* nomes vazios ou repetidos ficam assinalados */
  function markNames() {
    var count = {};
    finals.forEach(function (n) {
      var k = (n || '').trim().toLowerCase();
      count[k] = (count[k] || 0) + 1;
    });
    [].forEach.call(elRows.children, function (tr) {
      var i = +tr.dataset.i;
      var inp = tr.querySelector('.ed-in.final');
      if (!inp) return;
      var v = (finals[i] || '').trim();
      inp.classList.toggle('empty', !v);
      inp.classList.toggle('bad', !!v && count[v.toLowerCase()] > 1);
    });
  }

  function stats() {
    var semNome = finals.filter(function (n) { return !(n || '').trim(); }).length;
    var semGen = tracks.filter(function (t) { return !(t.genre || '').trim(); }).length;
    var free = tracks.filter(function (t) { return t.free === true; }).length;
    var dup = tracks.filter(function (t) { return t.duplicate === true; }).length;

    var seen = {}, repet = 0;
    tracks.forEach(function (t) {
      var k = (t.name || '').trim().toLowerCase();
      if (!k) return;
      if (seen[k]) repet++; else seen[k] = 1;
    });

    var pt = tracks.filter(function (t) { return t.lang === 'pt'; }).length;
    var en = tracks.filter(function (t) { return t.lang === 'en'; }).length;
    var inst = tracks.filter(function (t) { return t.lang === 'inst'; }).length;

    var porRever = finals.filter(function (n, i) { return (n || '') !== (tracks[i].name || ''); }).length;

    var html = '';
    html += chip(tracks.length, 'faixas');
    if (porRever) html += chip(porRever, 'nome por gravar', true);
    if (semNome) html += chip(semNome, 'sem nome', true);
    if (repet) html += chip(repet, 'nome repetido', true);
    var semWav = tracks.filter(function (t) { return !wavPara(t); }).length;
    if (semWav) html += chip(semWav, 'sem WAV', true);
    html += chip(pt, 'PT') + chip(en, 'EN');
    if (inst) html += chip(inst, 'instrumental');
    html += chip(semGen, 'sem género', semGen > 0);
    html += chip(free, 'grátis');
    html += chip(dup, 'duplicado', dup > 0);
    elStats.innerHTML = html;
  }
  function chip(n, label, alert) {
    return '<span class="ed-chip' + (alert ? ' alert' : '') + '"><b>' + n + '</b> ' + label + '</span>';
  }

  /* ---------- filtro ---------- */
  elSearch.addEventListener('input', applyFilter);
  function applyFilter() {
    var q = elSearch.value.toLowerCase().trim();
    [].forEach.call(elRows.children, function (tr) {
      var t = tracks[+tr.dataset.i];
      var hit = !q ||
        (t.name || '').toLowerCase().indexOf(q) >= 0 ||
        (finals[+tr.dataset.i] || '').toLowerCase().indexOf(q) >= 0 ||
        (t.genre || '').toLowerCase().indexOf(q) >= 0;
      tr.hidden = !hit;
    });
  }

  /* ---------- leitor ----------
     Toca o WAV (master). Se não houver, cai para o preview em MP3 e avisa. */
  var elPlayer = $('ed-player'), elPlBtn = $('ed-pl-btn'), elPlName = $('ed-pl-name');
  var elPlSrc = $('ed-pl-src'), elSeek = $('ed-seek'), elCur = $('ed-pl-cur'), elDur = $('ed-pl-dur');
  var seeking = false;

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  async function toggle(t, btn) {
    if (playingBtn === btn && audio.src) {
      if (audio.paused) { audio.play().catch(function () { }); } else { audio.pause(); }
      return;
    }
    if (playingBtn && playingBtn !== btn) { playingBtn.innerHTML = ICON_PLAY; playingBtn.classList.remove('on'); }
    playingBtn = btn;

    var handle = wavPara(t), tipo = 'wav';
    if (!handle) {                                   /* sem master: usa o preview */
      tipo = 'mp3';
      try {
        var parts = String(t.file).split('/');
        var h = dirHandle;
        for (var i = 0; i < parts.length - 1; i++) h = await h.getDirectoryHandle(parts[i]);
        handle = await h.getFileHandle(parts[parts.length - 1]);
      } catch (e) {
        toast('Não encontrei nem o WAV nem o preview desta faixa.', 'err');
        return;
      }
    }
    try {
      var f = await handle.getFile();
      if (audio.src) URL.revokeObjectURL(audio.src);
      audio.src = URL.createObjectURL(f);
      elPlayer.hidden = false;
      elPlName.textContent = t.name || '—';
      elPlSrc.textContent = tipo === 'wav'
        ? 'WAV · master · ' + Math.round(f.size / 1048576) + ' MB'
        : 'MP3 · só excerto (sem WAV)';
      elPlSrc.className = 'ed-pl-src ' + tipo;
      elSeek.value = 0; elCur.textContent = '0:00'; elDur.textContent = '0:00';
      await audio.play();
    } catch (e) {
      toast('Não consegui abrir o ficheiro.\n' + (e.message || ''), 'err');
    }
  }

  elPlBtn.addEventListener('click', function () {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(function () { }); else audio.pause();
  });
  $('ed-pl-close').addEventListener('click', function () {
    audio.pause(); elPlayer.hidden = true;
    if (playingBtn) { playingBtn.innerHTML = ICON_PLAY; playingBtn.classList.remove('on'); }
    playingBtn = null;
  });

  elSeek.addEventListener('input', function () { seeking = true; });
  elSeek.addEventListener('change', function () {
    if (audio.duration) audio.currentTime = (elSeek.value / 1000) * audio.duration;
    seeking = false;
  });
  audio.addEventListener('loadedmetadata', function () { elDur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    elCur.textContent = fmt(audio.currentTime);
    if (!seeking && audio.duration) elSeek.value = Math.round(audio.currentTime / audio.duration * 1000);
  });

  function icons(playing) {
    var ic = playing ? ICON_PAUSE : ICON_PLAY;
    elPlBtn.innerHTML = ic;
    if (playingBtn) { playingBtn.innerHTML = ic; playingBtn.classList.toggle('on', playing); }
  }
  audio.addEventListener('play', function () { icons(true); });
  audio.addEventListener('pause', function () { icons(false); });
  audio.addEventListener('ended', function () { icons(false); elSeek.value = 0; });

  /* ---------- gravar ---------- */
  elSave.addEventListener('click', async function () {
    var vazios = [], repetidos = [];
    var seen = {};
    finals.forEach(function (n, i) {
      var v = (n || '').trim();
      if (!v) { vazios.push(i + 1); return; }
      var k = v.toLowerCase();
      if (seen[k]) repetidos.push(v); else seen[k] = 1;
    });
    if (vazios.length) {
      toast('Há ' + vazios.length + ' faixa(s) sem nome (linhas ' + vazios.join(', ') + ').\nO nome identifica a faixa no carrinho — não pode ficar vazio.', 'err', 9000);
      return;
    }
    if (repetidos.length) {
      toast('Nomes repetidos: ' + repetidos.join(', ') + '\nCada faixa tem de ter um nome único.', 'err', 9000);
      return;
    }

    /* aplica os nomes finais + normaliza e limpa flags falsas */
    var renomeadas = 0;
    tracks.forEach(function (t, i) {
      var novo = (finals[i] || '').trim();
      if (novo && novo !== t.name) { t.name = novo; renomeadas++; }
      t.name = (t.name || '').trim();
      t.genre = (t.genre || '').trim();
      t.free = t.free === true;
      if (t.duplicate === true) t.duplicate = true; else delete t.duplicate;
    });
    /* guarda o vocabulário de géneros (para os criados ainda sem faixas não se perderem) */
    var usados = {};
    tracks.forEach(function (t) { if (t.genre) usados[t.genre] = 1; });
    vocab.forEach(function (g) { if (g) usados[g] = 1; });
    musicEl.genreList = Object.keys(usados).sort();

    try {
      var w = await jsonHandle.createWritable();
      await w.write(JSON.stringify(doc, null, 2) + '\n');
      await w.close();
    } catch (e) {
      toast('Erro ao gravar: ' + e.message, 'err', 9000);
      return;
    }

    setDirty(false);
    finals = tracks.map(function (t) { return t.name; });   /* passam a ser o novo ponto de partida */
    render();

    /* avisos que não bloqueiam */
    var av = [];
    var byLower = {};
    tracks.forEach(function (t) {
      if (!t.genre) return;
      var k = t.genre.toLowerCase();
      (byLower[k] = byLower[k] || {})[t.genre] = 1;
    });
    Object.keys(byLower).forEach(function (k) {
      var vars = Object.keys(byLower[k]);
      if (vars.length > 1) av.push('géneros que só diferem em maiúsculas: ' + vars.join(' / '));
    });
    var dup = tracks.filter(function (t) { return t.duplicate; }).length;
    if (dup) av.push(dup + ' faixa(s) marcadas como duplicado — nada foi apagado. Diz-me "limpar duplicados" quando quiseres remover.');

    toast('Gravado.' + (renomeadas ? ' ' + renomeadas + ' faixa(s) renomeada(s).' : '') +
      (av.length ? '\n\n⚠ ' + av.join('\n⚠ ') : ''), 'ok', av.length ? 11000 : 4000);
  });

  /* aviso ao sair com alterações por gravar */
  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

})();
