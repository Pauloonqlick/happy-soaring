/**
 * Os ajudantes de DOM — partilhados pelo site e pela página de música
 * ===================================================================
 *
 * A EXCEPCAO DA PASTA
 *   As outras regras/ são puras de propósito: sem `document`, sem
 *   `location`, sem `fetch`, para poderem correr no gerador em Node. Este
 *   ficheiro toca no `document` e não corre lá. Está aqui na mesma porque
 *   o critério que interessa é outro — ser código que dois sítios usam e
 *   que não pode existir em duas versões.
 *
 *   São sete coisas pequenas: criar um elemento, formatar um tempo, montar
 *   um link de WhatsApp, ler as opções de visibilidade do CMS, partir texto
 *   em parágrafos, e os dois ícones do leitor.
 *
 * PORQUE NAO BASTAVA IMPORTAR O APP.JS
 *   O app.js tem 156 KB e arranca a página inicial ao ser carregado. A
 *   página de música precisa de 58 linhas dele. Importá-lo inteiro era
 *   mandar o motor do site todo para uma página que só quer a loja.
 */
export const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };

export function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

/* Único destes que precisa de saber a língua: a mensagem pré-preenchida vem
   do CMS e tem de ser traduzida antes de entrar no endereço. Em vez de
   arrastar o `t` para dentro desta pasta, recebe-o uma vez e devolve a
   função feita — as chamadas do lado de lá não mudam. */
export function criarWaLink(t) {
  return function waLink(number, msg) {
    const n = String(number || '').replace(/[^0-9]/g, '');
    const base = 'https://wa.me/' + n;
    const m = t(msg);
    return m ? base + '?text=' + encodeURIComponent(m) : base;
  };
}

export function visibilityClass(item) {
  let c = '';
  if (item.showMobile === false) c += ' hide-mobile';
  if (item.showDesktop === false) c += ' hide-desktop';
  return c;
}

export function paragrafos(txt) {
  /* preenche um elemento com o texto do bloco, tratando **negrito** */
  const enche = (no, bloco) => {
    bloco.split(/\*\*/).forEach((parte, i) => {
      if (!parte) return;
      if (i % 2) { const b = el('strong'); b.textContent = parte; no.appendChild(b); }
      else no.appendChild(document.createTextNode(parte));
    });
    return no;
  };
  const saida = [];
  let lista = null;
  String(txt).split(/\n\s*\n/).filter(s => s.trim()).forEach(bloco => {
    const b = bloco.trim();
    /* linhas começadas por "- " são itens de lista e agrupam-se num <ul> */
    if (b.startsWith('- ')) {
      if (!lista) { lista = el('ul'); saida.push(lista); }
      lista.appendChild(enche(el('li'), b.slice(2).trim()));
      return;
    }
    lista = null;
    saida.push(enche(el('p'), b));
  });
  return saida;
}

export const ICON_PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

export const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

