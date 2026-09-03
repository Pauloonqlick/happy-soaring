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
