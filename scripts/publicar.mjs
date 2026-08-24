/**
 * Publicação do site — Happy Soaring
 * ==================================
 *
 * Monta uma pasta limpa e manda-a para o Cloudflare Pages.
 *
 * PORQUE E UMA LISTA DE AUTORIZADOS E NAO UMA LISTA DE EXCLUIDOS
 *   Na pasta do projecto vivem 1,4 GB de masters que o Paulo vende, a tabela
 *   de preços de revendedor da Flow (com o IBAN deles) e as entregas dos
 *   clientes. Numa lista de excluídos, esquecer uma linha publica isso para o
 *   mundo. Numa lista de autorizados, esquecer uma linha só faz faltar um
 *   ficheiro no site — e isso vê-se. O erro tem de cair para o lado seguro.
 *
 * PORQUE O GERADOR CORRE AQUI
 *   As 110 páginas das asas e o sitemap saem do mesmo JSON que o site usa. Se
 *   se gerassem à mão, bastava acrescentar uma asa para o sitemap passar a
 *   mentir. Gerando na publicação, não podem ficar desactualizados.
 *
 * USO
 *   node scripts/publicar.mjs               prepara e verifica, NAO publica
 *   node scripts/publicar.mjs --publicar    prepara, verifica e publica
 *
 *   Sem a bandeira não sai nada para o ar — publicar é sempre uma decisão
 *   explícita, nunca um efeito secundário de correr o script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const RAIZ = process.cwd();
const SAIDA = path.join(RAIZ, '_publicar');
const PUBLICAR = process.argv.includes('--publicar');

/* ------------------------------------------------------------------ */
/* O que vai para o ar. Tudo o resto fica.                             */
/* ------------------------------------------------------------------ */
const FICHEIROS = [
  'index.html',
  '404.html',
  'app.js',
  'styles.css',
  'pagina.css',      /* folha das páginas das asas */
  'robots.txt',
  'sitemap.xml'      /* escrito pelo gerador, logo abaixo */
];

const PASTAS = [
  'regras',          /* regras partilhadas: sem isto o app.js não arranca */
  'content',         /* o JSON que o site lê */
  'images',
  'music',
  'admin',           /* CMS: pede sessão do GitHub, e o robots.txt tapa-o */
  'reflex-lab'
];

/* as páginas das asas, geradas: /asas/… em pt e /en|es|fr|de/… nas outras */
const PASTAS_GERADAS = ['asas', 'en', 'es', 'fr', 'de'];

/* Nunca, em circunstância nenhuma. É a rede de segurança: mesmo que uma
   destas apareça por engano numa lista acima, a verificação pára tudo. */
const PROIBIDAS = [
  'masters', 'entregas', 'catalogo-flow', 'mockups', '_arquivo',
  'editor', 'scripts', 'docs', 'node_modules', '__pycache__',
  '.git', 'music/_apagados'
];
const FICHEIROS_PROIBIDOS = [
  '_design.html', 'server.js', 'MODELO-LICENCA.txt',
  'RENOMEAR-MUSICAS.txt', '.env', '.gitignore'
];

/* ------------------------------------------------------------------ */
const passo = t => console.log('\n▸ ' + t);
const erro = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };

function copiaPasta(de, para) {
  fs.mkdirSync(para, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    /* dentro das pastas autorizadas ainda há coisas que não saem daqui */
    if (e.name.startsWith('_') && e.isDirectory()) continue;   /* music/_apagados */
    const o = path.join(de, e.name), d = path.join(para, e.name);
    if (e.isDirectory()) copiaPasta(o, d); else fs.copyFileSync(o, d);
  }
}

function conta(dir) {
  let n = 0, bytes = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { const r = conta(f); n += r.n; bytes += r.bytes; }
    else { n++; bytes += fs.statSync(f).size; }
  }
  return { n, bytes };
}

/* ------------------------------------------------------------------ */
passo('Gerar as páginas das asas e o sitemap');
execFileSync(process.execPath, [path.join('scripts', 'gerar-paginas.mjs')],
  { cwd: RAIZ, stdio: 'inherit' });

passo('Montar a pasta de publicação');
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA);

for (const f of FICHEIROS) {
  if (!fs.existsSync(path.join(RAIZ, f))) erro('falta ' + f);
  fs.copyFileSync(path.join(RAIZ, f), path.join(SAIDA, f));
}
for (const d of PASTAS.concat(PASTAS_GERADAS)) {
  const o = path.join(RAIZ, d);
  if (!fs.existsSync(o)) {
    /* uma pasta de idioma em falta é um gerador que não correu */
    if (PASTAS_GERADAS.includes(d)) erro('falta a pasta gerada /' + d + '/');
    erro('falta a pasta ' + d);
  }
  copiaPasta(o, path.join(SAIDA, d));
}

passo('Verificar que não vai nada privado');
for (const d of PROIBIDAS) {
  if (fs.existsSync(path.join(SAIDA, d))) erro('PARADO: ' + d + ' entrou na pasta de publicação');
}
for (const f of FICHEIROS_PROIBIDOS) {
  if (fs.existsSync(path.join(SAIDA, f))) erro('PARADO: ' + f + ' entrou na pasta de publicação');
}
/* varrimento por extensão: nenhum master nem PDF de preços passa despercebido */
const suspeitos = [];
(function varre(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) varre(f);
    else if (/\.(wav|aiff?|flac|pdf|xlsx?|docx?|key|pem|env)$/i.test(e.name))
      suspeitos.push(path.relative(SAIDA, f));
  }
})(SAIDA);
if (suspeitos.length) erro('ficheiros de tipo suspeito:\n    ' + suspeitos.join('\n    '));

const { n, bytes } = conta(SAIDA);
const paginas = fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8').match(/<loc>/g) || [];
console.log('  ' + n + ' ficheiros, ' + (bytes / 1048576).toFixed(1) + ' MB');
console.log('  sitemap: ' + paginas.length + ' URLs');
console.log('  verificações: passou');

if (!PUBLICAR) {
  console.log('\n_publicar/ está pronta. NÃO foi publicada.');
  console.log('Para publicar: node scripts/publicar.mjs --publicar\n');
  process.exit(0);
}

passo('Publicar no Cloudflare Pages');
execFileSync('npx', ['wrangler', 'pages', 'deploy', '_publicar',
  '--project-name=happy-soaring', '--branch=master'],
  { cwd: RAIZ, stdio: 'inherit', shell: process.platform === 'win32' });
console.log('\n✔ https://happysoaring.com\n');
