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
