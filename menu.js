/* A navegação global — abrir e fechar
   ===================================

   O QUE ESTE FICHEIRO NAO FAZ
     Não constrói o menu. Os seis links já vêm escritos no documento, pelo
     gerador, a partir do regras/navegacao.js. Não há aqui nenhuma lista de
     rótulos nem de endereços, e é de propósito: no dia em que o menu mudar
     no CMS, muda num sítio só.

     Se este ficheiro não chegar a correr, o `data-ng` nunca é escrito, a
     menu.css nunca esconde nada e a navegação fica visível como barra. O
     site não fica pior sem JavaScript — fica só menos arrumado.

   PORQUE E QUE O TECLADO PRECISA DE CODIGO
     Um botão que mostra e esconde coisas tem obrigações que um link não
     tem. Sem `aria-expanded`, quem usa leitor de ecrã ouve "botão" e não
     sabe se está aberto. Sem mandar o foco para dentro, quem abre pelo
     teclado continua com o foco no botão e o Tab seguinte leva-o para o
     seletor de idiomas — passando ao lado do menu que acabou de abrir. E
     sem devolver o foco ao fechar, o foco cai no início do documento.

     São quatro coisas pequenas e são sempre as mesmas quatro. */
(function () {
  'use strict';

  var botao = document.querySelector('.ng-btn');
  var menu = document.getElementById('ng-menu');
  if (!botao || !menu) return;

  /* o header é quem guarda o estado: é o antepassado comum do botão e do
     menu, e é a ele que a menu.css se agarra */
  var topo = botao.parentNode;
  var aberto = false;

  function compacto() {
    /* a decisão de mostrar o botão é da folha de estilo, não daqui: há dois
       pontos de quebra diferentes e não os quero repetidos em JavaScript.
       Perguntar se o botão está visível é perguntar o que a CSS decidiu.

       Lê-se o `display` e não o `offsetParent`: o offsetParent é null em
       tudo o que seja `position:fixed`, e a gaveta é fixa. Aqui trata-se do
       botão, que não é — mas a sonda errada num sítio destes é o género de
       coisa que passa despercebida até deixar de passar. */
    return getComputedStyle(botao).display !== 'none';
  }

  /* No Reflex Lab o botão não muda de desenho — os três riscos ficam, para
     que o X daquele header continue a querer dizer só "fechar o simulador".
     Quem não vê o desenho nunca dependeu dele: depende deste nome. Os dois
     textos vêm do HTML, já traduzidos, e não há aqui nenhuma string. */
  function nome(qual) {
    var t = botao.getAttribute(qual === 'fechar' ? 'data-fechar' : 'data-abrir');
    if (t) botao.setAttribute('aria-label', t);
  }

  function abrir() {
    /* só o browser sabe onde acaba o header — e não tem a mesma altura nas
       páginas geradas e no Reflex Lab */
    menu.style.setProperty('--ng-topo', Math.round(topo.getBoundingClientRect().bottom) + 'px');
    topo.setAttribute('data-ng', 'aberto');
    botao.setAttribute('aria-expanded', 'true');
    nome('fechar');
    document.documentElement.classList.add('ng-travado');
    aberto = true;

    var primeiro = menu.querySelector('a');
    if (primeiro) primeiro.focus();
  }

  function fechar(devolverFoco) {
    topo.setAttribute('data-ng', 'fechado');
    botao.setAttribute('aria-expanded', 'false');
    nome('abrir');
    document.documentElement.classList.remove('ng-travado');
    menu.style.removeProperty('--ng-topo');
    aberto = false;

    /* só quando o utilizador fechou de propósito. Se saiu num link, a
       página já vai a caminho e roubar-lhe o foco não ajuda ninguém. */
    if (devolverFoco) botao.focus();
  }

  /* o estado inicial. É isto que diz à folha de estilo que há JavaScript. */
  topo.setAttribute('data-ng', 'fechado');
  botao.setAttribute('aria-expanded', 'false');
  nome('abrir');

  botao.addEventListener('click', function () {
    if (aberto) fechar(true); else abrir();
  });

  document.addEventListener('keydown', function (e) {
    if (aberto && (e.key === 'Escape' || e.key === 'Esc')) {
      e.preventDefault();
      fechar(true);
    }
  });

  /* clicar fora fecha — mas não no próprio botão, que já tem o seu clique */
  document.addEventListener('click', function (e) {
    if (!aberto) return;
    if (menu.contains(e.target) || botao.contains(e.target)) return;
    fechar(false);
  });

  /* A ALTURA DO CABECALHO, PUBLICADA PARA O CSS
     O cabecalho passou a acompanhar o scroll. Isso cria um problema que
     nao existia: uma ligacao para #aprender leva a seccao ao topo da
     janela, e o cabecalho fica por cima dela — o visitante clica e chega a
     um sitio onde o titulo esta tapado.

     O CSS resolve isso com `scroll-padding-top`, mas precisa de saber
     quanto o cabecalho mede. E nao ha numero: sao 67px a 1440, 110 em
     espanhol a essa mesma largura, 152 a 360. Depende da largura E da
     lingua, porque o menu quebra em sitios diferentes.

     Medi-lo aqui e escreve-lo numa variavel e a unica forma de a conta
     estar sempre certa. Sem JavaScript o CSS usa 96px, que e o valor mais
     comum — as ancoras ficam um pouco fora do sitio e mais nada. */
  function alturaDoTopo() {
    document.documentElement.style.setProperty('--h-topo', topo.offsetHeight + 'px');
  }
  alturaDoTopo();
  window.addEventListener('load', alturaDoTopo);

  /* rodar o telemóvel ou alargar a janela pode fazer o botão desaparecer.
     Se isso acontecer com a gaveta aberta, ficava um painel fixo por cima
     de uma barra que já estava visível. */
  window.addEventListener('resize', function () {
    alturaDoTopo();
    if (aberto && !compacto()) fechar(false);
  });
})();


/* =======================================================================
   MANTER A POSICAO AO MUDAR DE IDIOMA
   =======================================================================
   Mudar de idioma e mudar de endereco, e o browser aterra sempre no topo.
   Quem estava a ler a meio da pagina voltava ao principio e tinha de
   procurar outra vez onde ia.

   Guarda-se a SECCAO e a distancia ao topo dela, e nao o scrollY: o mesmo
   texto em alemao e mais comprido que em portugues, e os pixeis deixavam
   de bater certo — aterrava-se ao lado.

   A homepage ja fazia isto no app.js. Aqui usa-se a MESMA chave e o mesmo
   formato, de proposito: sao duas execucoes da mesma convencao e nao duas
   convencoes. O campo "via" diz de que pagina se saiu, sem o prefixo de
   lingua, para uma posicao guardada numa pagina nunca ser reposta noutra.

   Nao ha aqui expressao regular nenhuma a desmontar o caminho. Ja me
   partiu um endereco neste ficheiro uma vez; uma lista de prefixos faz o
   mesmo e nao tem como se partir. */
(function () {
  var CHAVE = 'hs-scroll';
  var PREFIXOS = ['en', 'es', 'fr', 'de'];

  function familia() {
    var p = location.pathname;
    for (var i = 0; i < PREFIXOS.length; i++) {
      var pre = '/' + PREFIXOS[i];
      if (p === pre) return '/';
      if (p.indexOf(pre + '/') === 0) return p.slice(pre.length);
    }
    return p || '/';
  }

  function guarda() {
    try {
      var meio = window.scrollY + window.innerHeight / 2;
      var todas = document.querySelectorAll('section[id]');
      var alvo = null;
      for (var i = 0; i < todas.length; i++) {
        if (todas[i].offsetTop <= meio) alvo = todas[i];
      }
      if (!alvo) return;
      sessionStorage.setItem(CHAVE, JSON.stringify({
        id: alvo.id,
        off: Math.round(window.scrollY - alvo.offsetTop),
        via: familia()
      }));
    } catch (e) {}
  }

  /* SALTAR SEM ANIMACAO, MESMO COM scroll-behavior:smooth
     O CSS desta pagina pede rolagem suave, e isso e bom quando alguem
     carrega numa ancora. Aqui nao: estamos a repor uma posicao que a
     pessoa ja tinha, e ve-la a ser percorrida do topo ate la e um efeito
     que ninguem pediu.
     scrollTo({behavior:'auto'}) NAO resolve — 'auto' quer dizer "usa o que
     o CSS disser", que aqui e suave. Desligar a propriedade durante o
     salto e o unico jeito que funciona em todos os browsers. */
  function salta(y) {
    var de = document.documentElement;
    var antes = de.style.scrollBehavior;
    de.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, y));
    de.style.scrollBehavior = antes;
  }

  /* PERSEGUIR A PAGINA ENQUANTO ELA AINDA MEXE
     Repor a posicao uma vez nao chega. Assim que se salta, as imagens
     marcadas lazy que passam a estar no ecra comecam a carregar e empurram
     tudo para baixo — e o evento load nao espera por elas, por isso a
     ultima correccao acontecia cedo de mais e aterrava-se ao lado.

     RELOGIO SO NAO CHEGA
     Um ciclo de setTimeout parece resolver e nao resolve: num separador que
     nao esta a ser visto o browser trava os temporizadores para uma volta por
     segundo, e a pagina tambem assenta mais devagar. Medi 4 voltas em 2,5
     segundos — o prazo esgotava-se antes de a pagina parar de mexer e a
     posicao ficava a 350px do sitio.

     Por isso alem do relogio ouve-se o que CAUSA o movimento: cada imagem que
     acaba de carregar, a pagina a mudar de tamanho, e o separador a vir para a
     frente — ai comeca uma janela nova, porque so agora e que alguem esta
     mesmo a olhar.

     Para-se assim que a pessoa rolar, tocar ou carregar numa tecla: arrastar
     alguem que decidiu ir para outro sitio seria pior do que o defeito que
     isto veio resolver. Nao se ouve o pointerdown — e um clique, nao e vontade
     de rolar, e o proprio clique que nos trouxe aqui chega a pingar no
     documento novo e cancelava tudo antes de comecar. */
  function persegue(ondeDevia) {
    var parado = false, fim = Date.now() + 4000, agendado = false, ro = null;

    function corrige() {
      if (parado || Date.now() > fim) return;
      var y = ondeDevia();
      if (y !== null && Math.abs(window.scrollY - y) > 2) salta(y);
    }
    function agenda() {
      if (agendado || parado) return;
      agendado = true;
      setTimeout(function () {
        agendado = false;
        corrige();
        if (Date.now() < fim) agenda();
      }, 100);
    }
    function desiste() {
      parado = true;
      document.removeEventListener('load', corrige, true);
      document.removeEventListener('visibilitychange', acorda);
      if (ro) ro.disconnect();
    }
    function acorda() {
      if (document.hidden || parado) return;
      fim = Date.now() + 1500;
      corrige(); agenda();
    }

    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, desiste, { once: true, passive: true });
    });
    document.addEventListener('load', corrige, true);
    document.addEventListener('visibilitychange', acorda);
    /* A JANELA CONTA-SE A PARTIR DO LOAD, NAO DE AGORA.
       Este codigo corre mal o HTML acaba de ser lido — com as imagens e os
       tipos de letra ainda a caminho. Se o prazo comecasse aqui, numa ligacao
       lenta esgotava-se antes de a pagina estar montada, e era exatamente
       nesse caso que a posicao ficava ao lado. */
    window.addEventListener('load', function () {
      fim = Math.max(fim, Date.now() + 1500); corrige(); agenda();
    });
    /* trocar o tipo de letra muda a altura de todos os paragrafos */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () {
        fim = Math.max(fim, Date.now() + 800); corrige(); agenda();
      });
    }
    if (window.ResizeObserver) { ro = new ResizeObserver(corrige); ro.observe(document.body); }

    corrige();
    agenda();
  }

  function repoe() {
    var p = null;
    try {
      p = JSON.parse(sessionStorage.getItem(CHAVE) || 'null');
      sessionStorage.removeItem(CHAVE);
    } catch (e) { return; }
    /* uma ancora escrita no endereco manda mais do que a memoria */
    if (!p || !p.id || p.via !== familia() || location.hash) return;
    persegue(function () {
      var s = document.getElementById(p.id);
      return s ? Math.max(0, s.offsetTop + (p.off || 0)) : null;
    });
  }

  var nav = document.querySelector('.pg-idiomas');
  if (nav) nav.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a[hreflang]')) guarda();
  });
  repoe();
})();
