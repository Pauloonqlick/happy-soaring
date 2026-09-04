/**
 * Verificações antes de publicar — Happy Soaring
 * =============================================
 *
 * NASCE PEQUENO, DE PROPOSITO
 *   Não tenta validar tudo o que é validável. Valida as quatro classes de
 *   erro que JA ACONTECERAM neste projecto e que foram apanhadas por
 *   alguém a reparar, não por uma máquina:
 *
 *     1. uma pasta gerada fora da lista de autorizados
 *        — o /pilot2wing/ português esteve 404 no ar por causa disto
 *     2. ligações internas para páginas que não existem
 *        — 196 ligações para /en/, /es/, /fr/ e /de/ antes de essas
 *          páginas existirem
 *     3. mais do que um h1, ou nenhum
 *        — o h1 já foi o wordmark, já foi o bloco estático, já foi os dois
 *     4. campos obrigatórios sem tradução
 *        — o t() cai para português sem se queixar, e uma página alemã
 *          fica com texto português sem ninguém dar por isso
 *
 *   Cada vez que aparecer uma classe nova de regressão, acrescenta-se uma
 *   verificação. É assim que isto deve crescer: por cicatriz, não por
 *   catálogo de boas práticas.
 *
 * USO
 *   npm run check                    corre o gerador e verifica
 *   import { verifica } from ...     verifica o que já está gerado
 *
 * PORQUE EXPORTA UMA FUNCAO
 *   A publicação chama-a. De outro modo os quatro testes eram opcionais —
 *   bastava correr o publicar.mjs directamente para os saltar, que é
 *   exactamente o que uma barreira não pode permitir. E como o publicar.mjs
 *   já gera as páginas, chama a verificação sem as mandar gerar outra vez.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { QUALIFICADORES, protegeNomes, semPontoFinal } from '../regras/textos.js';
import { tokensDoTema } from '../regras/tema.js';

const RAIZ = process.cwd();
const IDIOMAS = ['pt', 'en', 'es', 'fr', 'de'];

export function verifica({ silencioso = false } = {}) {
const problemas = [];
const falha = m => problemas.push(m);

const titulo = t => { if (!silencioso) console.log('\n▸ ' + t); };
const ok = m => { if (!silencioso) console.log('  ✓ ' + m); };


/* ---- as páginas do site são as que o sitemap promete ----------------
   E não "todas as pastas com um index.html". O /admin/ é o painel do CMS e
   o /editor/ é uma ferramenta interna que nunca sai daqui — nenhum dos dois
   é uma página do site, e tratá-los como tal só produzia ruído.

   Prender isto ao sitemap tem outra vantagem: o sitemap é a lista do que
   prometemos ao Google. Verificar essa lista é verificar a promessa. */
const DOMINIO = 'https://happysoaring.com';
const sitemap = fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8');
const paginas = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => {
  const url = m[1].replace(DOMINIO, '') || '/';
  return { url, ficheiro: path.join(RAIZ, url.replace(/^\//, ''), 'index.html') };
});
for (const p of paginas) {
  if (!fs.existsSync(p.ficheiro)) falha('o sitemap promete ' + p.url + ' e o ficheiro não existe');
}
/* as que faltam já foram acusadas; as verificações seguintes trabalham
   sobre as que existem, para falharem com uma lista e não com um ENOENT */
const vivas = paginas.filter(p => fs.existsSync(p.ficheiro));

/* ------------------------------------------------------------------ */
titulo('1. As pastas geradas estão na lista de autorizados da publicação');
{
  /* toda a pasta que o sitemap promete tem de estar autorizada a sair, ou
     em FICHEIROS/PASTAS. O /pilot2wing/ português esteve 404 no ar
     precisamente por faltar uma linha aqui. */
  const pub = fs.readFileSync(path.join(RAIZ, 'scripts', 'publicar.mjs'), 'utf8');
  const nomes = l => {
    const i = pub.indexOf('const ' + l + ' = [');
    if (i < 0) return [];
    return [...pub.slice(i, pub.indexOf(']', i)).matchAll(/'([^']+)'/g)].map(m => m[1]);
  };
  const autorizadas = [...nomes('PASTAS_GERADAS'), ...nomes('PASTAS')];
  const raiz = [...new Set(paginas.map(p => p.url.split('/')[1]).filter(Boolean))];
  for (const d of raiz) {
    if (!autorizadas.includes(d)) falha('/' + d + '/ está no sitemap mas não sai na publicação');
  }
  ok(raiz.length + ' pastas no sitemap, todas autorizadas a publicar');
}

/* ------------------------------------------------------------------ */
titulo('2. As ligações internas resolvem');
{
  const existe = new Set(paginas.map(p => p.url));
  let n = 0, mortas = 0;
  for (const p of vivas) {
    const html = fs.readFileSync(p.ficheiro, 'utf8');
    /* O FRAGMENTO NAO FAZ PARTE DO FICHEIRO
       O menu das páginas geradas aponta para secções da página inicial —
       /en/#produtos. O regex excluía o '#' e por isso nem sequer via estas
       ligações: não dava falsos mortos, mas também não validava nada.

       Agora apanha-as e descarta o fragmento: o que tem de existir é a
       página, e a âncora é assunto do browser. */
    for (const m of html.matchAll(/href="(\/[^"?]*)"/g)) {
      let u = m[1].split('#')[0];
      if (!u) continue;                    /* href="/#algo" na própria raiz */
      n++;
      if (/\.(css|js|json|xml|txt|webp|jpg|jpeg|png|svg|webm|mp3|ico)$/i.test(u)) {
        if (!fs.existsSync(path.join(RAIZ, u.replace(/^\//, '')))) {
          falha(p.url + ' → ' + u + ' (ficheiro não existe)'); mortas++;
        }
        continue;
      }
      if (!u.endsWith('/')) u += '/';
      if (!existe.has(u)) { falha(p.url + ' → ' + u + ' (página não existe)'); mortas++; }
    }
  }
  ok(n + ' ligações internas verificadas em ' + vivas.length + ' páginas, ' + mortas + ' mortas');
}

/* ------------------------------------------------------------------ */
titulo('3. Exactamente um h1 por página');
{
  let mau = 0;
  for (const p of vivas) {
    const html = fs.readFileSync(p.ficheiro, 'utf8');
    const n = (html.match(/<h1[\s>]/g) || []).length;
    if (n !== 1) { falha(p.url + ' tem ' + n + ' h1'); mau++; }
  }
  ok(vivas.length + ' páginas, ' + mau + ' com problema');
}

/* ------------------------------------------------------------------ */
titulo('4. Campos obrigatórios traduzidos nas cinco línguas');
{
  /* o t() cai para português quando falta uma tradução, e não se queixa.
     Estes são os campos onde isso se vê a olho numa página estrangeira. */
  const OBRIGATORIOS = ['tagline', 'descricao'];
  const doc = JSON.parse(fs.readFileSync(path.join(RAIZ, 'content/slides/produtos.json'), 'utf8'));
  const flow = doc.elements.find(e => e.role === 'flow');
  const produtos = (flow.produtos || []).filter(p => p && p.nome && p.visible !== false);
  let faltam = 0;
  for (const p of produtos) {
    for (const campo of OBRIGATORIOS) {
      const v = p[campo];
      if (!v || typeof v !== 'object') continue;
      const semTraducao = IDIOMAS.filter(l => !String(v[l] || '').trim());
      if (semTraducao.length) { faltam++; falha(p.nome + ': ' + campo + ' sem ' + semTraducao.join(', ')); }
    }
  }
  ok(produtos.length + ' produtos, ' + faltam + ' campos por traduzir');
}

/* ==================================================================
   FERRAMENTAS PARA AS VERIFICAÇÕES 5 E 6

   Ler CSS com expressões regulares é frágil e sabemo-lo. O que salva
   isto é o alvo ser estreito: só interessam regras planas com uma
   declaração de `color` ou de `background`. Nada de aninhamento, nada de
   cascata completa. Quando uma regra não é decidível, não se inventa —
   ignora-se, e a verificação diz quantas ignorou.
   ================================================================== */
const CSS_FICHEIROS = ['styles.css', 'pagina.css', 'musica.css', 'menu.css',
  'reflex-lab/reflex-lab.css'];

const semComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* As regras de um ficheiro, por ordem de aparição. O regex não entra em
   blocos aninhados, e é isso que faz com que salte o `@media(...)` e
   apanhe directamente as regras lá de dentro — que é o que queremos. */
function regrasDe(css) {
  const out = [];
  let ordem = 0;
  for (const m of semComentarios(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (!sel || sel.charAt(0) === '@' || sel.indexOf('%') === 0) continue;
    out.push({ sel, corpo: m[2], ordem: ordem++ });
  }
  return out;
}

/* (ids, classes+atributos+pseudo-classes, elementos+pseudo-elementos) */
function especificidade(sel) {
  let s = ' ' + sel + ' ';
  const pe = (s.match(/::[a-z-]+/g) || []).length;
  s = s.replace(/::[a-z-]+/g, ' ');
  const id = (s.match(/#[\w-]+/g) || []).length;
  s = s.replace(/#[\w-]+/g, ' ');
  const pc = (s.match(/:[a-z-]+(\([^)]*\))?/g) || []).length;
  s = s.replace(/:[a-z-]+(\([^)]*\))?/g, ' ');
  const at = (s.match(/\[[^\]]*\]/g) || []).length;
  s = s.replace(/\[[^\]]*\]/g, ' ');
  const cl = (s.match(/\.[\w-]+/g) || []).length;
  s = s.replace(/\.[\w-]+/g, ' ');
  const el = (s.match(/[a-z][\w-]*/g) || []).length;
  return [id, cl + at + pc, el + pe];
}

/* a ganha a b? empate de especificidade decide-se pela ordem no ficheiro */
function ganha(a, b) {
  for (let i = 0; i < 3; i++) if (a.esp[i] !== b.esp[i]) return a.esp[i] > b.esp[i];
  return a.ordem > b.ordem;
}

/* ---- cor ---- */
const NOMES = { white: '#ffffff', black: '#000000', transparent: 'rgba(0,0,0,0)' };

function lerTokens() {
  const t = {};
  for (const f of CSS_FICHEIROS) {
    const p = path.join(RAIZ, f);
    if (!fs.existsSync(p)) continue;
    const css = semComentarios(fs.readFileSync(p, 'utf8'));
    for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
      if (!(m[1] in t)) t[m[1]] = m[2].trim();
    }
  }
  return t;
}

function cor(v, toks, prof) {
  if (prof > 6 || v == null) return null;
  let s = String(v).trim().toLowerCase();
  if (s in NOMES) s = NOMES[s];
  const mv = s.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (mv) {
    if (mv[1] in toks) return cor(toks[mv[1]], toks, (prof || 0) + 1);
    return mv[2] ? cor(mv[2], toks, (prof || 0) + 1) : null;
  }
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return { r: parseInt(m[1][0] + m[1][0], 16), g: parseInt(m[1][1] + m[1][1], 16),
                  b: parseInt(m[1][2] + m[1][2], 16), a: 1 };
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16),
                  b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length < 3 || p.slice(0, 3).some(isNaN)) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
  }
  return null;
}

function luz(c) {
  const g = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  return 0.2126 * g(c.r) + 0.7152 * g(c.g) + 0.0722 * g(c.b);
}
function razao(a, b) {
  const l1 = luz(a), l2 = luz(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* a última parte de um selector descendente: `.pg a.pk-b` -> `a.pk-b` */
const ultimoComposto = sel => sel.trim().split(/[\s>+~]+/).pop();
/* as classes desse composto, como fichas inteiras.
   Comparar por substring dava `.sg-cta` como parte de `.sg-cta-2`, e a
   defesa do segundo escondia a falta de defesa do primeiro: a verificação
   passava a verde com o defeito outra vez no ficheiro. Soube-se por se ter
   partido esta verificação de propósito, não por se ter lido o código. */
const classesDoComposto = comp => (comp.match(/\.[\w\-]+/g) || []).map(x => x.slice(1));
const temPseudo = sel => /:/.test(sel);

/* as classes que a <body> de uma página traz */
function classesDaBody(html) {
  const m = html.match(/<body[^>]*\bclass="([^"]*)"/);
  return new Set(m ? m[1].split(/\s+/).filter(Boolean) : []);
}

/* ------------------------------------------------------------------ */
titulo('5. Nenhum link perde a cor da sua classe para uma regra de raiz');
{
  /* A CICATRIZ
     `.pg a{color:var(--orange)}` tem especificidade (0,1,1). Uma regra de
     uma só classe — `.pg-wa`, `.pk-b`, `.music-wa`, `.music-cart-buy`,
     `.sg-cta`, `.sg-cta-2`, `.pg-marca` — tem (0,1,0) e PERDE, por muito
     abaixo que esteja escrita.

     Apanhou sete elementos. O `.sg-cta` ficou laranja sobre laranja: o
     botão do Pilot2Wing esteve no ar com o texto invisível, e só se via ao
     passar o rato, porque o `:hover` é (0,2,0) e esse ganha. Num telemóvel
     não há hover nenhum.

     A defesa é sempre a mesma: escrever `.pg a.classe`, que é (0,2,1).
     Esta verificação existe para não ser preciso lembrar-se dela.

     PORQUE E POR PAGINA, E NAO POR FICHEIRO
     A primeira versão desta verificação acusou quatro coisas que não eram
     verdade. Uma regra `X a` só é uma armadilha se o X for mesmo a raiz da
     página — se estiver na <body>. O `.pg-migalhas a` também é `X a`, mas
     só apanha os links das migalhas, e acusava o `.pg-marca` sem razão. E o
     `body.sg a` só existe na página do Pilot2Wing: acusava o `.fl-cor-a`,
     que vive noutra página onde essa regra nunca chega a aplicar-se.
     Por isso: abre-se cada página, lê-se a <body>, e só as regras cuja raiz
     a <body> satisfaz é que contam ali.

     LIMITE, DITO A DIREITO
     Lê o HTML servido, como o resto deste ficheiro. Links que só nascem
     em JavaScript — a loja da música — não passam por aqui. */
  const css = fs.readFileSync(path.join(RAIZ, 'pagina.css'), 'utf8');
  const regras = regrasDe(css).map(r => ({
    sel: r.sel, corpo: r.corpo, ordem: r.ordem, esp: especificidade(r.sel)
  }));
  const defineCor = r => /(^|[;{\s])color\s*:/.test(r.corpo);

  /* toda a regra `X a{color:...}` com um só ancestral — candidata a
     armadilha, se o X for a raiz da página em causa */
  const candidatas = [];
  for (const r of regras) {
    if (!defineCor(r)) continue;
    for (const parte of r.sel.split(',')) {
      const p = parte.trim();
      if (temPseudo(p)) continue;
      const bits = p.split(/\s+/);
      if (bits.length !== 2 || bits[1] !== 'a') continue;
      candidatas.push({ raiz: bits[0], sel: p, esp: especificidade(p), ordem: r.ordem });
    }
  }

  /* `body.sg` e `.pg` servem se a <body> tiver essas classes; `.pg-migalhas`
     não serve nunca, porque nenhuma <body> a tem */
  function eRaiz(comp, daBody) {
    const el = comp.replace(/[.#][\w-]+/g, '').trim();
    if (el && el !== 'body') return false;
    const cls = (comp.match(/\.[\w-]+/g) || []).map(x => x.slice(1));
    if (!cls.length) return el === 'body';
    return cls.every(c => daBody.has(c));
  }

  /* quem tenta dar cor a uma classe, no estado normal */
  const memoria = {};
  function defensorDe(c) {
    if (c in memoria) return memoria[c];
    let melhor = null;
    for (const r of regras) {
      if (!defineCor(r)) continue;
      for (const parte of r.sel.split(',')) {
        const p = parte.trim();
        if (temPseudo(p)) continue;
        if (!classesDoComposto(ultimoComposto(p)).includes(c)) continue;
        const cand = { sel: p, esp: especificidade(p), ordem: r.ordem };
        if (!melhor || ganha(cand, melhor)) melhor = cand;
      }
    }
    memoria[c] = melhor;
    return melhor;
  }

  const classes = new Set();
  const acusadas = new Set();
  let armadilhasVistas = 0;
  for (const p of vivas) {
    const html = fs.readFileSync(p.ficheiro, 'utf8');
    const daBody = classesDaBody(html);
    if (!daBody.has('pg')) continue;
    const armadilhas = candidatas.filter(c => eRaiz(c.raiz, daBody));
    armadilhasVistas = Math.max(armadilhasVistas, armadilhas.length);
    for (const m of html.matchAll(/<a\b[^>]*\bclass="([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/)) {
        if (!c) continue;
        classes.add(c);
        if (acusadas.has(c)) continue;
        const melhor = defensorDe(c);
        if (!melhor) continue;             /* ninguém tentou: nada a defender */
        for (const arm of armadilhas) {
          if (ganha(arm, melhor)) {
            falha(p.url + ' .' + c + ': `' + melhor.sel + '` perde para `' +
              arm.sel + '` — escreve `' + arm.sel.replace(/\s+a$/, ' a.' + c) + '`');
            acusadas.add(c);
            break;
          }
        }
      }
    }
  }
  ok(classes.size + ' classes em <a>, até ' + armadilhasVistas +
    ' regra(s) de raiz por página, ' + acusadas.size + ' derrotada(s)');
}

/* ------------------------------------------------------------------ */
titulo('6. Contraste das regras que declaram fundo e texto juntos');
{
  /* A CICATRIZ
     Branco sobre o laranja da marca dá 2,87:1 — abaixo dos 4,5 do WCAG.
     Não era um botão: era a cor de todos os botões primários do site, em
     cinco ficheiros diferentes, durante meses.

     Só se pronuncia sobre pares decidíveis: fundo opaco e cor de texto na
     MESMA regra. Fundo translúcido ou em gradiente depende do que está por
     baixo e não se decide aqui — conta-se quantos ficaram por decidir, para
     que o silêncio não passe por aprovação.

     O ESTADO DESATIVADO NAO CONTA
     O critério 1.4.3 do WCAG isenta expressamente os componentes inactivos,
     e é de propósito que um botão desligado se lê pior: é assim que se vê
     que está desligado. Sem esta isenção a verificação acusava o
     `.pg-wa.desativado` e o `.flow-modal-enviar.desativado`, que estão
     ambos certos. */
  const DESATIVADO = /\.desativado|:disabled|\[disabled\]|aria-disabled/;
  const toks = lerTokens();
  let vistos = 0, indecidiveis = 0, isentos = 0, mau = 0;
  for (const f of CSS_FICHEIROS) {
    const p = path.join(RAIZ, f);
    if (!fs.existsSync(p)) continue;
    for (const r of regrasDe(fs.readFileSync(p, 'utf8'))) {
      const mf = r.corpo.match(/(?:^|[;{\s])background(?:-color)?\s*:\s*([^;}]+)/);
      const mc = r.corpo.match(/(?:^|[;{\s])color\s*:\s*([^;}]+)/);
      if (!mf || !mc) continue;
      if (DESATIVADO.test(r.sel)) { isentos++; continue; }
      const fundo = cor(mf[1], toks, 0), tinta = cor(mc[1], toks, 0);
      if (!fundo || !tinta || fundo.a < 1 || tinta.a < 1) { indecidiveis++; continue; }
      vistos++;
      const tam = r.corpo.match(/font-size\s*:\s*([\d.]+)px/);
      const peso = r.corpo.match(/font-weight\s*:\s*(\d+)/);
      const px = tam ? parseFloat(tam[1]) : 15;
      const pw = peso ? parseInt(peso[1], 10) : 400;
      const min = (px >= 24 || (px >= 18.66 && pw >= 700)) ? 3 : 4.5;
      const rz = razao(tinta, fundo);
      if (rz < min) {
        falha(f + ' :: ' + r.sel.split(',')[0].trim() + ' — ' +
          (Math.round(rz * 100) / 100) + ':1, mínimo ' + min);
        mau++;
      }
    }
  }
  ok(vistos + ' pares decidíveis, ' + mau + ' abaixo do mínimo, ' +
    indecidiveis + ' por decidir, ' + isentos + ' desactivados');
}

/* ------------------------------------------------------------------ */
titulo('7. Os títulos descem um nível de cada vez');
{
  /* A CICATRIZ
     Os <h2> da página da música desapareciam quando o JavaScript corria:
     estavam dentro do contentor que o musica.js esvaziava. A verificação 3
     não dava por nada — conta h1, e o h1 ficava lá.

     Esta lê o HTML servido, e por isso também não veria esse caso. Vê o
     outro: saltos de nível e títulos sem nome. Um <h3> com uma imagem lá
     dentro TEM nome se a imagem tiver alt — foi por confundir isso que
     acusei um falso positivo na página inicial. */
  let mau = 0;
  for (const p of vivas) {
    /* SEM COMENTÁRIOS PRIMEIRO
       O gerador escreve comentários que falam dos próprios títulos. O
       regex atravessava-os e apanhava texto de dentro de um comentário
       como se fosse um <h2> — e, pior, ficava a consumir HTML a mais e
       deixava de ver os títulos verdadeiros. Esta verificação chegou a dar
       verde a ver dois títulos numa página que tem quatro. */
    const html = fs.readFileSync(p.ficheiro, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    const hs = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(m => ({
      n: +m[1],
      nome: m[2].replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g, ' $1 ')
                .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
                .replace(/\s+/g, ' ').trim()
    }));
    let ant = 0;
    for (const h of hs) {
      if (!h.nome) { falha(p.url + ': h' + h.n + ' sem nome acessível'); mau++; }
      if (ant && h.n > ant + 1) {
        falha(p.url + ': salta de h' + ant + ' para h' + h.n +
          ' em "' + h.nome.slice(0, 40) + '"');
        mau++;
      }
      ant = h.n;
    }
  }
  ok(vivas.length + ' páginas, ' + mau + ' problema(s) de estrutura');
}

/* ------------------------------------------------------------------ */
titulo('8. O nome da casa aparece sempre inteiro');
{
  /* A REGRA
       "Happy Soaring" nao se traduz, nao se abrevia, nao se declina e nao
       se junta a outra palavra com hifen. E o unico nome do site que nao
       admite sequer uma alteracao de forma.

     PORQUE E QUE PRECISA DE UM TESTE
       Porque a maneira como se partiu nao foi um erro de tradutor: foi
       ortografia CORRECTA. O alemao compoe substantivos com hifen, e por
       isso "Die Happy-Soaring-Methode" saiu de uma traducao bem feita.
       Uma regra que so se quebra quando alguem escreve mal defende-se com
       atencao; esta quebra-se quando alguem escreve BEM, e por isso tem de
       se defender com uma verificacao.

     O QUE PROCURA
       Qualquer sitio onde as duas palavras aparecam separadas por outra
       coisa que nao um espaco — hifen, hifen longo, sublinhado, barra —
       e qualquer sitio onde "Soaring" apareca sem "Happy" antes.
       O `happysoaring.com` e o `happy-soaring` de um nome de ficheiro nao
       contam: sao enderecos, e um endereco nao e o nome. */
  const PARTIDO = /Happy[-–—_/]+Soaring|Happy\s+Soaring[-–—_]+\w/g;
  let mau = 0, visto = 0;
  for (const p of vivas) {
    let h = fs.readFileSync(p.ficheiro, 'utf8');
    h = h.replace(/<!--[\s\S]*?-->/g, ' ');
    /* fora os enderecos: href, src, content de url, e o dominio */
    h = h.replace(/(?:href|src|content)="[^"]*"/g, m =>
      /https?:|^"?\//.test(m.slice(m.indexOf('"') + 1)) ? ' ' : m);
    h = h.replace(/happysoaring\.com/gi, ' ');
    visto++;
    for (const m of h.match(PARTIDO) || []) {
      falha('o nome partido em ' + p.url + ': "' + m + '"');
      mau++;
    }
  }
  ok(visto + ' páginas, ' + mau + ' ocorrência(s) do nome partido');
}

/* ------------------------------------------------------------------ */
titulo('9. Nenhuma ligação atira o visitante para outra língua sem o dizer');
{
  /* O QUE ISTO APANHA, E COMO SE SOUBE QUE ERA PRECISO
       O /reflex-lab/ era a unica pagina so em portugues, e as paginas
       traduzidas apontavam-lhe na lingua do visitante: um frances carregava
       em "Explorer le Reflex Lab" e aterrava numa pagina portuguesa. Nao
       havia nada partido — o botao estava certo, o destino e que nao tinha
       traducao. Nenhuma das oito verificacoes anteriores podia ver isso,
       porque a ligacao resolvia e a pagina existia.

     A REGRA, E PORQUE E ESTA
       Sair da lingua nao e proibido: o proprio selector de idiomas faz
       exactamente isso, e tem de o fazer. O que nao pode acontecer e sair
       em silencio. E por isso a regra nao e "nao saias" — e "se sais,
       declara-o", com o `hreflang` que o selector ja usa em todas as suas
       ligacoes. Assim a excepcao legitima documenta-se a si propria e nao
       precisa de uma lista de perdoados aqui dentro, que era o que um dia
       deixaria passar a proxima.

     SO PAGINAS
       Um href que nao acabe em barra e uma imagem, um PDF ou uma ancora —
       nao e uma pagina, e nao tem lingua para trair. */
  const lingua = u => {
    const p = String(u).split('#')[0].split('?')[0].replace(/^\//, '').split('/');
    return IDIOMAS.indexOf(p[0]) > 0 ? p[0] : 'pt';
  };
  let mau = 0;
  for (const p of vivas) {
    const daPagina = lingua(p.url);
    let h = fs.readFileSync(p.ficheiro, 'utf8').replace(/<!--[\s\S]*?-->/g, ' ');
    for (const m of h.matchAll(/<a\b([^>]*)href="(\/[^"]*\/)"([^>]*)>/g)) {
      const atrib = m[1] + m[3];
      if (/\bhreflang=/.test(atrib)) continue;      /* diz que sai: e legitimo */
      const destino = lingua(m[2]);
      if (destino === daPagina) continue;
      falha('em ' + p.url + ' uma ligação sai para ' + destino
            + ' sem hreflang: ' + m[2]);
      mau++;
    }
  }
  ok(vivas.length + ' páginas, ' + mau + ' ligação(ões) que saem da língua em silêncio');
}

/* ------------------------------------------------------------------ */
titulo('10. A página de erro fala as cinco línguas');
{
  /* PORQUE E QUE ISTO E FACIL DE ESQUECER
       O 404.html nao passa pelo gerador — nao ha cinco versoes dele, ha
       uma. Por isso nao entra em nenhuma das contagens acima: nao esta no
       sitemap, nao e uma "pagina viva", e durante muito tempo esteve so
       em portugues sem que nada se queixasse. Um visitante frances que
       escrevesse mal um endereco recebia portugues e um botao que o
       levava para a inicial portuguesa.

     O QUE SE VERIFICA
       Que a tabela de traducoes la dentro cobre TODAS as linguas do site
       menos a base, e que cada uma leva a sua propria inicial. No dia em
       que o site ganhar uma sexta lingua, e esta linha que avisa — em vez
       de a pagina de erro ficar caladamente em portugues para ela. */
  const h = fs.readFileSync(path.join(RAIZ, '404.html'), 'utf8');
  let mau = 0;
  /* Sem expressao regular de proposito. A primeira versao desta linha
     construia uma com `new RegExp` e escapes, e os escapes chegaram ca
     comidos: `"\s"` em JavaScript nao e `\s`, e uma escapatoria mal
     escrita e a barra a mais — o teste passava a procurar outra coisa e
     dizia que estava tudo bem. Duas buscas de texto nao tem como mentir. */
  for (const l of IDIOMAS) {
    if (l === 'pt') continue;                 /* a base esta escrita no HTML */
    const i = h.indexOf(l + ': {');
    const fim = i < 0 ? -1 : h.indexOf('}', i);
    const bloco = i < 0 ? '' : h.slice(i, fim);
    if (i < 0 || bloco.indexOf("h: '/" + l + "/'") < 0) {
      falha('o 404.html não tem texto nem destino próprios para ' + l);
      mau++;
    }
  }
  /* e a base tem de estar mesmo no documento, para quem chega sem JS */
  if (!/<html lang="pt"/.test(h)) { falha('o 404.html não traz o português no documento'); mau++; }
  ok((IDIOMAS.length - 1) + ' línguas + a base, ' + mau + ' em falta');
}

/* ------------------------------------------------------------------ */
titulo('11. Os valores das tabelas não escondem palavras por traduzir');
{
  /* A METADE QUE FALTAVA
       O `regras/textos.js` traduz um vocabulario fechado de qualificadores
       — "intermédio", "avançado", "tamanho único" — que aparecem dentro de
       campos de especificacao. Uma lista fechada resolve o que esta la
       hoje e nao resolve nada do que la for posto amanha: basta alguem
       escrever "iniciante" no CMS e volta a haver portugues nas cinco
       linguas, em silencio.

       Por isso a lista nao se defende com memoria, defende-se com esta
       linha: qualquer palavra nestes campos que nao esteja no vocabulario
       conhecido faz o `npm run check` parar, e quem a escreveu fica a
       saber no momento em que a escreve.

     O QUE E "PALAVRA CONHECIDA"
       As unidades e os codigos que se leem igual em qualquer lingua (kg,
       cm, EN, LTF, EP, XS, ML) e tudo o que o vocabulario ja traduz — as
       chaves portuguesas e as cinco traducoes de cada uma. Numeros nao
       contam: nao ha numero por traduzir. */
  const NEUTRAS = new Set(['kg', 'cm', 'mm', 'm', 'km', 'en', 'ltf', 'ep', 'dgac',
    'xs', 's', 'ml', 'l', 'xl', 'xxl', 'xxs']);
  const conhecidas = new Set(NEUTRAS);
  for (const [chave, trad] of Object.entries(QUALIFICADORES)) {
    for (const parte of chave.split(/\s+/)) conhecidas.add(parte.toLowerCase());
    for (const v of Object.values(trad)) {
      for (const parte of String(v).split(/\s+/)) conhecidas.add(parte.toLowerCase());
    }
  }

  const cat = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'content', 'slides', 'produtos.json'), 'utf8'));
  let mau = 0, vistos = 0;
  for (const e of cat.elements || []) {
    for (const p of e.produtos || []) {
      const valores = (p.tamanhos || []).map(x => ['tamanhos', String(x)]);
      for (const s of p.specs || []) {
        for (const [k, v] of Object.entries(s)) {
          if (typeof v === 'string') valores.push([k, v]);
        }
      }
      for (const [campo, v] of valores) {
        vistos++;
        for (const w of v.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ]+/g) || []) {
          if (conhecidas.has(w.toLowerCase())) continue;
          falha('"' + w + '" em ' + p.nome + ' · ' + campo
                + ' sai igual nas cinco línguas e não está no vocabulário');
          mau++;
        }
      }
    }
  }
  ok(vistos + ' valores de tabela, ' + mau + ' palavra(s) por traduzir');
}

/* ------------------------------------------------------------------ */
titulo('12. Os nomes próprios estão ao abrigo do tradutor');
{
  /* O QUE ACONTECEU
       Um visitante com o Chrome em portugues abriu a /fr/ e mandou traduzir.
       O tradutor fez o que se lhe pediu, e o cabecalho passou a dizer
       "FELIZ VOO" onde diz Happy Soaring; "Parakite" virou "Paraquito".
       Curiosamente "Flow Paragliders" e "FelloFly" sobreviveram — o
       tradutor reconheceu-os como nomes e nao reconheceu os outros dois.
       Nao ha aqui defeito de traducao: ha um site que nunca disse quais
       pedacos nao sao texto. `translate="no"` di-lo, e e norma HTML.

     DUAS MEDIDAS, E PORQUE NAO CHEGA UMA
       A primeira e a idempotencia: a funcao salta o que ja esta protegido,
       logo aplicada a uma pagina tratada nao muda um caracter. Se mudar,
       encontrou um nome a descoberto.

       Isso parecia elegante e era cego. Uma verificacao que usa a
       ferramenta contra o seu proprio resultado so ve o que a ferramenta
       ve — e quando a `protegeNomes` entrava num `<script>`, apanhava um
       `x<0` como etiqueta, engolia o `</script>` e desistia do resto do
       documento, ela era perfeitamente consistente consigo propria: saltava
       a mesma metade nas duas passagens. A idempotencia dizia "tudo bem"
       com dez nomes por proteger na /asas/mullet-2/.

       A segunda medida nao usa a `protegeNomes` para nada, e e por isso que
       serve: tira os comentarios e os elementos de texto cru com uma
       expressao regular, achata o resto a texto simples, e conta os nomes.
       Depois conta os que estao DENTRO de marcacao de proteccao. Se o
       primeiro numero for maior que o segundo, ha nomes a descoberto —
       e isto sabe-o sem partilhar uma linha de codigo com o que verifica.

       Duas implementacoes independentes falham de maneiras diferentes. E
       essa a unica razao para haver duas. */
  const cat = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'content', 'slides', 'produtos.json'), 'utf8'));
  const asas = (cat.elements || []).flatMap(e => (e.produtos || []).map(p => p && p.nome))
    .filter(Boolean);
  const NOMES = ['Happy Soaring', 'Flow Paragliders', 'Pilot2Wing', 'FelloFly',
    'Parakites', 'Parakite', 'Parawing'].concat(asas);

  /* conta quantas vezes um nome aparece num texto, sem apanhar palavras
     maiores que o contenham */
  const conta = (txt, nome) => {
    let n = 0, i = 0;
    const letra = c => c !== undefined && /[0-9A-Za-zÀ-ÿ]/.test(c);
    while ((i = txt.indexOf(nome, i)) >= 0) {
      if (!letra(txt[i - 1]) && !letra(txt[i + nome.length])) n++;
      i += nome.length;
    }
    return n;
  };

  let mau = 0;
  for (const p of vivas) {
    const h = fs.readFileSync(p.ficheiro, 'utf8');
    if (protegeNomes(h, asas) !== h) {
      falha('em ' + p.url + ' há nome(s) próprio(s) sem translate="no"');
      mau++;
    }

    /* ---- a segunda medida, independente da primeira ---- */
    const ini = h.indexOf('<body');
    const corpo = ini < 0 ? '' : h.slice(h.indexOf('>', ini), h.lastIndexOf('</body>'));
    const limpo = corpo
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
    const planoTodo = limpo.replace(/<[^>]*>/g, ' ');
    /* o conteudo de tudo o que declara `translate="no"` */
    const protegidos = (limpo.match(
      /<([a-z0-9-]+)[^>]*\btranslate="no"[^>]*>[\s\S]*?<\/\1>/gi) || [])
      .join(' ').replace(/<[^>]*>/g, ' ');
    for (const nome of NOMES) {
      const todos = conta(planoTodo, nome);
      if (!todos) continue;
      const cobertos = conta(protegidos, nome);
      if (todos > cobertos) {
        falha('em ' + p.url + ': "' + nome + '" aparece ' + todos
              + 'x e só ' + cobertos + 'x está protegido');
        mau++;
      }
    }
    /* O PONTO CEGO DA MEDIDA DE CIMA, E PORQUE PRECISA DE LINHA PROPRIA
       O wordmark escreve-se `HAPPY <span>SOARING</span>`: o nome esta
       partido por uma etiqueta, e por isso nenhuma busca de texto o
       encontra — nem a `protegeNomes`. Tirar-lhe o `translate="no"` nao
       muda nada no teste de idempotencia, e mesmo assim e o elemento mais
       visivel da pagina: foi este que apareceu como "FELIZ VOO".
       Aqui protege-se o elemento, e aqui verifica-se o elemento. */
    for (const m of h.matchAll(/<a\b[^>]*class="pg-marca"[^>]*>/g)) {
      if (!/\btranslate\s*=\s*"no"/.test(m[0])) {
        falha('em ' + p.url + ' o wordmark não tem translate="no"');
        mau++;
      }
    }
  }
  ok(vivas.length + ' páginas, ' + mau + ' com nomes a descoberto');
}

/* ------------------------------------------------------------------ */
titulo('13. Todo o token do tema chega mesmo a uma folha');
{
  /* O RISCO PROPRIO DE POR O DESENHO NUM FORMULARIO
       O CMS passou a ter uma seccao Tema. O perigo nao e escrever um valor
       mau — isso ve-se e desfaz-se. O perigo e escrever um valor BOM num
       campo que nao esta ligado a nada: mexe-se no numero, guarda-se,
       publica-se, e a pagina fica exactamente igual. Nao ha erro, nao ha
       aviso, e a conclusao natural de quem la mexeu e que o site esta
       avariado.

       Isso acontece de duas maneiras: o gerador deixar de escrever um
       token, ou as folhas deixarem de o usar depois de alguem renomear uma
       variavel. As duas se apanham aqui.

     O QUE SE VERIFICA
       1. o tema.css existe e traz TODOS os tokens que a composicao produz;
       2. cada um deles e MESMO usado, com `var(--x)`, nalguma folha —
          senao e um campo no CMS que nao manda em nada;
       3. o tema.css e carregado por todas as paginas, e em ultimo, senao
          ha paginas onde o CMS nao chega. */
  const tema = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'content', 'tema.json'), 'utf8')); }
    catch (e) { return {}; }
  })();
  const tk = tokensDoTema(tema);

  const caminhoTema = path.join(RAIZ, 'tema.css');
  let mau = 0;
  if (!fs.existsSync(caminhoTema)) {
    falha('o tema.css não existe — o gerador não o escreveu');
    mau++;
  } else {
    const folha = fs.readFileSync(caminhoTema, 'utf8');
    /* as folhas onde os tokens podem ser consumidos */
    const usos = CSS_FICHEIROS.concat(['tema.css'])
      .filter(x => fs.existsSync(path.join(RAIZ, x)))
      .map(x => fs.readFileSync(path.join(RAIZ, x), 'utf8')).join('\n')
      + '\n' + fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8');
    /* o `tema.css` conta como consumidor porque e la que o `--fonte` e
       usado: `body{font-family:var(--fonte)}`. Sem esta linha a
       verificacao acusava-o de nao mandar em nada, e mandava. */

    for (const nome of Object.keys(tk)) {
      if (folha.indexOf(nome + ':') < 0) {
        falha('o tema.css não escreve ' + nome);
        mau++;
      } else if (usos.indexOf('var(' + nome + ')') < 0) {
        falha(nome + ' é escrito mas nenhuma folha o usa — é um campo do CMS que não manda em nada');
        mau++;
      }
    }
  }

  let semLigacao = 0;
  for (const p of vivas) {
    const h = fs.readFileSync(p.ficheiro, 'utf8');
    const i = h.indexOf('href="/tema.css"');
    if (i < 0) { falha(p.url + ' não carrega o tema.css'); semLigacao++; continue; }
    /* tem de vir depois das outras folhas, senao nao ganha */
    const ultima = h.lastIndexOf('rel="stylesheet"', h.indexOf('</head>'));
    if (h.lastIndexOf('rel="stylesheet"', i) !== ultima) {
      falha(p.url + ' carrega o tema.css antes de outra folha — não ganha');
      semLigacao++;
    }
  }
  mau += semLigacao;
  ok(Object.keys(tk).length + ' tokens, ' + vivas.length + ' páginas, ' + mau + ' problema(s)');
}

/* ------------------------------------------------------------------ */
titulo('14. Nenhum título acaba em ponto final');
{
  /* A REGRA
       Um título nomeia, não afirma. O ponto fecha uma frase, e um título
       não é uma frase.

     PORQUE E QUE PRECISA DE VERIFICACAO
       A regra existia desde 03/09 mas vivia numa funcao chamada a mao em
       catorze titulos de UMA pagina. As outras 139 nunca a viram, e o h1
       do /pilot2wing/ andou publicado com dois pontos finais — um em cada
       linha. Ninguem estava distraido: a regra e que nunca tinha chegado
       la.

       Agora e uma passagem unica no `escrevePagina` e um observador no
       app.js. Esta linha e o que garante que continua a ser verdade em
       todas, incluindo nas que ainda nao existem.

     LINHA A LINHA, E NAO TITULO A TITULO
       Um <br> comeca uma linha nova, e cada linha e um titulo por direito
       proprio para quem le. O h1 do /pilot2wing/ tem duas, e as duas
       tinham ponto. */
  let mau = 0, vistos = 0;
  for (const p of vivas) {
    const h = fs.readFileSync(p.ficheiro, 'utf8').replace(/<!--[\s\S]*?-->/g, ' ');
    for (const m of h.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      for (const parte of m[2].split(/<br\s*\/?>/i)) {
        const txt = parte.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/gi, ' ').trim();
        if (!txt) continue;
        vistos++;
        if (semPontoFinal(txt) !== txt) {
          falha('em ' + p.url + ' um ' + m[1] + ' acaba em ponto: "' + txt.slice(0, 52) + '"');
          mau++;
        }
      }
    }
  }
  ok(vistos + ' linhas de título em ' + vivas.length + ' páginas, ' + mau + ' com ponto final');
}

/* ------------------------------------------------------------------ */
return problemas;
}

/* ------------------------------------------------------------------ */
/* Corrido à mão (npm run check): gera primeiro, verifica depois, e sai com
   código 1 se alguma coisa falhar — para poder entrar num CI um dia. */
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  console.log('\n▸ Gerar as páginas');
  execFileSync(process.execPath, [path.join('scripts', 'gerar-paginas.mjs')],
    { cwd: RAIZ, stdio: 'inherit' });
  const problemas = verifica();
  console.log('');
  if (problemas.length) {
    console.log('✖ ' + problemas.length + ' problema(s):');
    for (const p of problemas.slice(0, 40)) console.log('    ' + p);
    if (problemas.length > 40) console.log('    … e mais ' + (problemas.length - 40));
    console.log('');
    process.exit(1);
  }
  console.log('✓ tudo passou');
}
