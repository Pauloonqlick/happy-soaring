/**
 * A navegação principal — partilhada pelo site e pelo gerador
 * ==========================================================
 *
 * PORQUE EXISTE
 *   O menu vivia só no `buildMenu()` do app.js, e por isso só existia na
 *   página inicial. As 131 páginas geradas — as 110 asas, o Pilot2Wing, o
 *   hub da Flow e o pilar — não tinham navegação nenhuma: quem chegasse a
 *   uma delas por uma pesquisa só podia voltar à raiz ou mudar de língua.
 *
 *   Escrever um segundo menu dentro do gerador resolvia o sintoma e criava
 *   o problema a sério: duas listas para manter, que um dia dizem coisas
 *   diferentes. Foi exactamente o que aconteceu com os rótulos de família
 *   antes de irem para a taxonomia.js — as páginas alemãs mostravam
 *   "Parapentes" porque a tradução vivia só do lado do browser.
 *
 *   Por isso este ficheiro é como os irmãos `avisos.js`, `taxonomia.js` e
 *   `unidades.js`: importado pelos DOIS lados, do mesmo sítio. A fonte
 *   continua a ser o `content/settings.json`, que é o que o CMS edita.
 *
 * O QUE NAO ESTA AQUI, E PORQUE
 *   O filtro que esconde do menu uma secção desligada no CMS
 *   (`document.getElementById`) fica no app.js. É uma pergunta sobre o DOM
 *   da página inicial, e numa página gerada as secções `#produtos` e
 *   `#music` nunca existem — se a pergunta subisse para aqui, as páginas
 *   geradas perdiam duas entradas do menu.
 *
 *   Regra geral: aqui dentro não há `document`, `location` nem `fetch`.
 *   São funções puras, e é isso que as deixa correr em Node.
 */

export const IDIOMAS = ['pt', 'en', 'es', 'fr', 'de'];
export const OMISSAO = 'pt';

/* o rótulo na língua pedida, com o português como rede */
export function rotulo(label, lingua) {
  if (label == null) return '';
  if (typeof label === 'string') return label;
  return label[lingua] || label[OMISSAO] || Object.values(label).find(Boolean) || '';
}

/**
 * O prefixo de língua num endereço interno.
 *
 * Veio do `local()` do app.js — não foi copiado, foi mudado de casa, e o
 * app.js passou a chamá-lo. Os três casos que ele já tratava têm de
 * continuar cá, porque cada um deles partiria ligações se desaparecesse:
 *
 *   - português é a raiz, e não leva prefixo nenhum;
 *   - um endereço externo (ou //algo) fica como está;
 *   - um caminho que JÁ traz prefixo não leva um segundo.
 */
/**
 * As paginas cujo ENDERECO muda de lingua.
 *
 * A regra geral do site e simples: um endereco interno escreve-se uma vez,
 * em portugues, e ganha o prefixo da lingua. Funciona porque a maioria dos
 * enderecos sao nomes proprios — /pilot2wing/ e /pilot2wing/ em alemao.
 *
 * Nao funciona quando o endereco e uma palavra comum. "Musica" e "musik",
 * "o que e um parakite" e "was ist ein parakite". Sem esta tabela, o menu
 * alemao apontava para /de/musica/ e dava 404.
 *
 * A chave e sempre a versao portuguesa, que e a que se escreve no CMS.
 * O gerador usa a mesma tabela para decidir onde escrever os ficheiros, e e
 * por isso que ela vive aqui e nao la: uma so lista, dois leitores.
 */
export const ROTAS = {
  '/musica/': { pt: '/musica/', en: '/en/music/', es: '/es/musica/',
                fr: '/fr/musique/', de: '/de/musik/' },
  '/o-que-e-um-parakite/': { pt: '/o-que-e-um-parakite/', en: '/en/what-is-a-parakite/',
                             es: '/es/que-es-un-parakite/', fr: '/fr/qu-est-ce-qu-un-parakite/',
                             de: '/de/was-ist-ein-parakite/' },

  /* AS DUAS SEGUINTES AINDA NAO TEM PAGINA.
     Estao aqui desde 05/09/2026 porque um endereco decide-se ANTES de
     existir: depois de publicado, muda-lo custa um redireccionamento e a
     indexacao que se perde pelo caminho. Sem pagina, isto nao faz mal
     nenhum — ninguem lhes aponta.

     "Parakite" nao traduz em nenhuma delas, pela mesma razao por que nao
     traduz na de cima: e o nome da coisa, nao uma palavra comum. O que
     traduz e "regras" e "spots".

     Em alemao a ordem inverte-se — "Parakite Regeln", nao "Regeln
     Parakite" — porque e assim que um alemao escreve e procura. */
  '/regras-parakite-portugal/': { pt: '/regras-parakite-portugal/',
                                  en: '/en/parakite-rules-portugal/',
                                  es: '/es/reglas-parakite-portugal/',
                                  fr: '/fr/regles-parakite-portugal/',
                                  de: '/de/parakite-regeln-portugal/' },
  '/spots-parakite-portugal/': { pt: '/spots-parakite-portugal/',
                                 en: '/en/parakite-spots-portugal/',
                                 es: '/es/spots-parakite-portugal/',
                                 fr: '/fr/spots-parakite-portugal/',
                                 de: '/de/parakite-spots-portugal/' }
};

export function comIdioma(href, lingua) {
  const h = String(href || '');
  if (!h) return h;
  /* primeiro a tabela: um endereco que traduz nao leva prefixo, leva outro
     endereco. E o fragmento, se houver, viaja com ele. */
  const corte = h.indexOf('#');
  const base = corte < 0 ? h : h.slice(0, corte);
  const ancora = corte < 0 ? '' : h.slice(corte);
  const traduzida = ROTAS[base];
  if (traduzida) return (traduzida[lingua] || traduzida[OMISSAO]) + ancora;

  if (lingua === OMISSAO) return h;
  if (h.charAt(0) !== '/' || h.charAt(1) === '/') return h;
  if (/^\/(pt|en|es|fr|de)(\/|$)/.test(h)) return h;
  return '/' + lingua + h;
}

/* a página inicial de cada língua */
export function inicioDe(lingua) {
  return lingua === OMISSAO ? '/' : '/' + lingua + '/';
}

/**
 * Uma secção da página inicial, vista de fora dela.
 *
 * É este o ponto que fazia falta. Na página inicial, `produtos` é
 * `#produtos` e o browser desce. Numa página de asa, `#produtos` aponta
 * para uma secção que não existe ali — e o clique não faz nada. Tem de ser
 * o endereço completo da página inicial DAQUELA língua, com a âncora.
 */
export function ancoraInicial(lingua, id) {
  return inicioDe(lingua) + '#' + id;
}

const EXTERNA = /^https?:\/\//;

/**
 * Ancoras que, vistas de fora da pagina inicial, SAO a pagina inicial.
 *
 * O `hero` e a primeira seccao do documento. Fora da homepage, resolver
 * `hero` para `/en/#hero` dava um endereco que aponta para o topo de uma
 * pagina onde o browser ja aterra de qualquer maneira: o fragmento nao faz
 * nada e a ligacao passa a parecer um atalho para uma seccao especifica.
 *
 * Pior: passavam a existir dois enderecos para a mesma pagina — `/en/` e
 * `/en/#hero` — e o canonical do site diz que o certo e o primeiro.
 *
 * `#produtos` e `#music` nao estao aqui e nao podem estar: sao seccoes a
 * meio da homepage, e sem o fragmento a ligacao deixava de as encontrar.
 */
export const ANCORAS_DA_RAIZ = ['hero'];

/**
 * O menu resolvido para um contexto.
 *
 * `naInicial` é a única coisa que muda entre os dois lados: dentro da
 * página inicial as âncoras ficam curtas, fora dela ficam absolutas.
 *
 * Devolve `tipo` para quem precisar de distinguir — o app.js usa-o para
 * saber a que entradas deve aplicar o filtro do DOM.
 */
export function entradasDoMenu(itens, lingua, opcoes) {
  const naInicial = !!(opcoes && opcoes.naInicial);
  return (Array.isArray(itens) ? itens : []).map(item => {
    const alvo = String((item && item.target) || '');
    if (!alvo) return null;

    let tipo, href;
    if (EXTERNA.test(alvo)) {
      tipo = 'externa';
      href = alvo;
    } else if (alvo.charAt(0) === '/') {
      tipo = 'pagina';
      href = comIdioma(alvo, lingua);
    } else if (!naInicial && ANCORAS_DA_RAIZ.indexOf(alvo) !== -1) {
      /* fora da homepage isto deixa de ser uma ancora e passa a ser uma
         pagina — e o app.js, que so corre na homepage, nunca chega aqui */
      tipo = 'pagina';
      href = inicioDe(lingua);
    } else {
      tipo = 'ancora';
      href = naInicial ? '#' + alvo : ancoraInicial(lingua, alvo);
    }

    return { alvo, tipo, href, rotulo: rotulo(item && item.label, lingua) };
  }).filter(Boolean);
}
