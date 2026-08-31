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
