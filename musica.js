/**
 * A página /musica/ — arranque
 * ============================
 *
 * O QUE ESTE FICHEIRO FAZ, E O QUE NAO FAZ
 *   Não constrói a loja. A loja é a mesma da página inicial e vive em
 *   regras/musica.js. Isto aqui é só a ligação: descobre a língua pelo
 *   endereço, monta os três ajudantes que dependem dela, lê o mesmo JSON
 *   que o CMS edita e manda desenhar.
 *
 *   São menos de sessenta linhas de propósito. No dia em que a loja mudar,
 *   muda num sítio e as duas páginas mudam com ela.
 *
 * PORQUE NAO SE IMPORTA O APP.JS
 *   O app.js tem 156 KB e arranca a página inicial só por ser carregado.
 *   Esta página precisa da loja, não do motor do site.
 *
 * O QUE ACONTECE SEM JAVASCRIPT
 *   Fica a lista que o gerador escreveu no HTML: os nomes das faixas, o
 *   género, a duração, os termos e a biografia. Não há leitor nem carrinho,
 *   mas há conteúdo — e é esse conteúdo que os motores de busca leem.
 */
import { UI } from './regras/textos.js';
import { comIdioma, OMISSAO } from './regras/navegacao.js';
import { criarMusica } from './regras/musica.js';

const LOCALE = (location.pathname.match(/^\/(en|es|fr|de)(?:\/|$)/) || [])[1] || OMISSAO;

/* os mesmos três do app.js, e pela mesma razão: são os únicos que precisam
   de saber em que língua a página está */
function t(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[LOCALE] || v[OMISSAO] || Object.values(v).find(Boolean) || '';
}
function ui(k, vars) {
  const e = UI[k];
  if (!e) return '';
  let s = e[LOCALE] || e[OMISSAO] || '';
  if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
  return s;
}
const local = href => comIdioma(href, LOCALE);

const { buildMusic, buildBio } = criarMusica({ t, ui, local, bioAberta: true });

(async function () {
  const loja = document.getElementById('musica-loja');
  const quemFaz = document.getElementById('musica-bio');
  if (!loja && !quemFaz) return;
  let dados;
  try {
    const r = await fetch('/content/slides/music.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    dados = await r.json();
  } catch (e) {
    /* falhar aqui não pode apagar o que já está no ecrã: a lista estática
       continua a ser melhor do que uma página vazia */
    console.error('Happy Soaring Music: falhou o carregamento das faixas.', e);
    return;
  }

  let aLoja = null, aBio = null;
  for (const el of (dados.elements || [])) {
    if (el.role === 'music') aLoja = buildMusic(el);
    else if (el.role === 'bio') aBio = buildBio(el);
  }

  /* só se substitui o estático depois de haver com quê, e cada bloco no seu
     contentor — os <h2> ficam entre eles e não são tocados */
  if (loja && aLoja) { loja.textContent = ''; loja.appendChild(aLoja); }
  if (quemFaz && aBio) { quemFaz.textContent = ''; quemFaz.appendChild(aBio); }
})();
