/**
 * O tema, com números em vez de CSS
 * =================================
 *
 * PORQUE E QUE ISTO EXISTE
 *   O tema nasceu dentro do `pagina.css`, escrito à mão. Funciona, mas para
 *   mudar um tamanho é preciso abrir uma folha de estilo — e isso põe o
 *   desenho fora do alcance de quem escreve o site. Passa a sair do CMS.
 *
 * PORQUE E QUE O CMS NAO EDITA CSS
 *   A tentação era um campo de texto por token, e lá dentro
 *   `clamp(30px,4.4vw,50px)`. Uma vírgula trocada nesse campo não dá erro
 *   nenhum: dá uma declaração inválida que o browser deita fora em
 *   silêncio, e a página inteira fica sem escala de títulos sem que nada
 *   se queixe. Um formulário que aceita uma linguagem é um formulário que
 *   aceita erros dessa linguagem.
 *
 *   Por isso o CMS guarda NÚMEROS — mínimo, ideal, máximo — e é aqui que
 *   se compõe o `clamp`. O pior que uma edição pode fazer é um título
 *   grande demais, que se vê e se desfaz. Não pode partir a folha.
 *
 * PORQUE E QUE VIVE NA PASTA `regras`
 *   Pela mesma razão que os irmãos: tem dois leitores. O gerador escreve
 *   com isto o `tema.css` que as 140 páginas carregam, e o `app.js` aplica
 *   os mesmos valores na página inicial, que se monta no browser. Uma
 *   segunda composição seria uma segunda folha de estilo, e um dia diriam
 *   coisas diferentes.
 *
 * O QUE NAO ESTA AQUI
 *   As redefinições por família — o /pilot2wing/ e a Flow baixam a escala
 *   porque os títulos dessas páginas são mais longos. Ficam no CSS, onde a
 *   razão delas está escrita ao lado. Se subissem, o CMS ficava com quatro
 *   blocos parecidos e seria fácil desafinar uma página sem dar por isso.
 */

/* Os valores actuais do site, e é isto que vale quando o `tema.json` não
   existe ou vem com um campo em branco. Nenhuma edição pode deixar o site
   sem tema: o pior que faz é voltar a isto. */
export const OMISSAO = {
  marca: {
    laranja: '#ff6a13',
    preto: '#141414',
    fonte: "'Segoe UI', system-ui, -apple-system, sans-serif",
    /* As duas tintas do mesmo laranja. Não são cores novas: são o laranja
       escurecido até passar sobre branco (6,3:1) e aclarado até passar
       sobre o azul do painel do método (4,6:1). Ficam editáveis porque
       quem mudar o laranja da marca tem de as poder acompanhar. */
    laranjaTinta: '#a63f00',
    laranjaPainel: '#ff842d'
  },
  escala: {
    /* três números, não uma expressão: mínimo em px, ideal em vw, máximo em px */
    d1: { min: 30, ideal: 4.4, max: 50 },
    d2: { min: 22, ideal: 3.1, max: 41 },
    dLateral: { min: 15, ideal: 1.5, max: 23 },
    d3: 19,
    corpo: 17,
    nota: 14,
    /* 11,5 e nao 12: e o valor que a `.pg-eyebrow` usa desde sempre.
       O token tinha sido escrito a olho e a folha nunca o usou, por
       isso ninguem reparou na diferenca. Liga-lo com 12 mudava o site
       de repente e sem razao — a passagem para o CMS nao e altura de
       redesenhar nada. */
    rotulo: 11.5
  },
  pesos: { display: 800, forte: 700, medio: 600, corpo: 400 },
  /* 0,139em sao os 1,6px que a `.pg-eyebrow` tem a 11,5px. O valor
     redondo (0,13) dava 1,49px e encolhia todos os rotulos do site. */
  tracking: { display: 0, h1: 0.004, rotulo: 0.139 },
  alturaLinha: { display: 1.02, corpo: 1.6 },
  raio: 0
};

/* Um número que veio de um formulário pode ser texto, pode ser vazio, pode
   ser lixo. Nada disso pode chegar a uma folha de estilo. */
function num(v, omissao) {
  const n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(',', '.'));
  return Number.isFinite(n) ? n : omissao;
}

/* Uma cor tem de ser uma cor. `#fff`, `#ff6a13` ou `#ff6a13ff`. Qualquer
   outra coisa — um nome, uma função, uma chaveta — volta ao valor de
   omissão, porque um campo de cor é a porta mais fácil para meter CSS
   dentro de uma folha sem ser por acidente. */
function cor(v, omissao) {
  const s = String(v == null ? '' : v).trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ? s : omissao;
}

/* A família tipográfica não é um número nem uma cor, e é o único campo que
   deixa passar texto livre. Corta-se o que fecha uma declaração ou abre um
   bloco: sem `;`, `{`, `}` e `<`, o pior que se lá escreve é um nome de
   fonte que não existe, e o browser passa ao seguinte da lista. */
function fonte(v, omissao) {
  const s = String(v == null ? '' : v).replace(/[;{}<>]/g, '').trim();
  return s || omissao;
}

const clamp = (o, p) => 'clamp(' + num(o && o.min, p.min) + 'px,'
  + num(o && o.ideal, p.ideal) + 'vw,' + num(o && o.max, p.max) + 'px)';

/**
 * Os tokens, prontos a aplicar. Devolve pares nome→valor e mais nada: quem
 * chama é que decide se os escreve num ficheiro ou os põe no elemento.
 */
export function tokensDoTema(tema) {
  const t = tema && typeof tema === 'object' ? tema : {};
  const m = t.marca || {}, e = t.escala || {}, p = t.pesos || {},
        r = t.tracking || {}, a = t.alturaLinha || {};
  const O = OMISSAO;
  return {
    '--orange': cor(m.laranja, O.marca.laranja),
    '--black': cor(m.preto, O.marca.preto),
    '--laranja-tinta': cor(m.laranjaTinta, O.marca.laranjaTinta),
    '--laranja-painel': cor(m.laranjaPainel, O.marca.laranjaPainel),

    '--d1': clamp(e.d1, O.escala.d1),
    '--d2': clamp(e.d2, O.escala.d2),
    '--d-lateral': clamp(e.dLateral, O.escala.dLateral),
    '--d3': num(e.d3, O.escala.d3) + 'px',
    '--corpo': num(e.corpo, O.escala.corpo) + 'px',
    '--nota': num(e.nota, O.escala.nota) + 'px',
    '--rotulo': num(e.rotulo, O.escala.rotulo) + 'px',

    '--peso-display': String(num(p.display, O.pesos.display)),
    '--peso-forte': String(num(p.forte, O.pesos.forte)),
    '--peso-medio': String(num(p.medio, O.pesos.medio)),
    '--peso-corpo': String(num(p.corpo, O.pesos.corpo)),

    '--tr-display': num(r.display, O.tracking.display) + 'em',
    '--tr-h1': num(r.h1, O.tracking.h1) + 'em',
    '--tr-rotulo': num(r.rotulo, O.tracking.rotulo) + 'em',

    '--lh-display': String(num(a.display, O.alturaLinha.display)),
    '--lh-corpo': String(num(a.corpo, O.alturaLinha.corpo)),

    '--raio': num(t.raio, O.raio) + 'px',

    '--fonte': fonte(m.fonte, O.marca.fonte)
  };
}

/**
 * A folha que o gerador escreve.
 *
 * Carrega-se DEPOIS da folha principal, e não em vez dela. As folhas
 * mantêm os valores de hoje escritos lá dentro: se este ficheiro faltar,
 * ou vier vazio, o site continua exactamente igual em vez de ficar sem
 * tipografia. Uma folha gerada nunca deve ser um ponto único de falha.
 */
export function folhaDoTema(tema) {
  const tk = tokensDoTema(tema);
  const linhas = Object.entries(tk)
    .filter(([k]) => k !== '--fonte')
    .map(([k, v]) => '  ' + k + ':' + v + ';');
  return [
    '/* ESCRITO PELO GERADOR A PARTIR DE content/tema.json — NAO EDITAR */',
    '/* Para mudar qualquer destes valores: CMS -> Tema. */',
    ':root{',
    ...linhas,
    '  --fonte:' + tk['--fonte'] + ';',
    '}',
    '/* `body.pg` e (0,1,1) nas paginas geradas: para a familia do tema',
    '   ganhar, precisa da mesma especificidade e de vir depois. */',
    'body, body.pg{font-family:var(--fonte)}',
    ''
  ].join('\n');
}
