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
 *   npm run check                           verifica sem publicar nada
 *   node scripts/publicar.mjs               prepara e verifica, NAO publica
 *   node scripts/publicar.mjs --publicar    prepara, verifica e publica
 *
 *   Sem a bandeira não sai nada para o ar — publicar é sempre uma decisão
 *   explícita, nunca um efeito secundário de correr o script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { verifica } from './verificar.mjs';

const RAIZ = process.cwd();
const SAIDA = path.join(RAIZ, '_publicar');

/* O WRANGLER E O DO PROJECTO, NAO O QUE O npx TROUXER HOJE
   Durante uma sessão de trabalho, um `npx wrangler` trouxe a 4.126.0 de
   manhã e a 4.127.0 à tarde, sem ninguém tocar no projecto. Nesse dia não
   partiu nada. Mas a ferramenta que põe o site no ar não pode mudar de
   versão sozinha entre duas publicações.

   Fica fixo no package.json com a versão exacta e no package-lock.json.
   Chama-se o .js directamente com o node — e não o .cmd pelo npx — para não
   passar por nenhum shell. Foi isso que fez desaparecer o aviso de
   segurança que o node dava em cada publicação. */
const WRANGLER = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
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
  'sitemap.xml',     /* escrito pelo gerador, logo abaixo */
  '_redirects'       /* redireccionamentos do Pages (ver comentários lá dentro) */
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
/* as páginas geradas: as asas em /asas/, o método em /smartground/, o hub da
   marca em /flow-paragliders-portugal/, o pilar em /parakite-portugal/, e as
   quatro traduções de todos dentro do prefixo de cada língua */
const PASTAS_GERADAS = ['asas', 'smartground', 'flow-paragliders-portugal',
  'parakite-portugal', 'en', 'es', 'fr', 'de'];

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
/* Carimbo de versão                                                    */
/*                                                                      */
/* O PROBLEMA                                                           */
/*   O Cloudflare Pages serve o JavaScript e o CSS com max-age=14400 —  */
/*   quatro horas. Quem já visitou o site continua com a versão antiga  */
/*   durante esse tempo, mesmo depois de publicarmos. Já mordeu duas    */
/*   vezes: uma a esconder trabalho que estava no ar, outra a mostrar   */
/*   o bloco estático por cima do site.                                 */
/*                                                                      */
/*   O HTML e o conteúdo do CMS não têm este problema: vêm com          */
/*   max-age=0. É só o JS e o CSS.                                      */
/*                                                                      */
/* A SOLUCAO                                                            */
/*   Acrescentar ?v=<resumo do ficheiro> a cada referência. O endereço  */
/*   muda quando o ficheiro muda, e um endereço novo nunca está em      */
/*   cache. Ficheiros que não mudaram continuam a ser aproveitados.     */
/*                                                                      */
/*   Faz-se AQUI e não no código-fonte: assim o repositório fica limpo  */
/*   de resumos, e o carimbo é sempre o do que está mesmo a ser         */
/*   publicado.                                                         */
/* ------------------------------------------------------------------ */
function carimbar() {
  const resumo = f => crypto.createHash('md5')
    .update(fs.readFileSync(path.join(SAIDA, f))).digest('hex').slice(0, 8);

  /* Os módulos partilhados primeiro: o app.js importa-os, por isso o
     conteúdo dele muda quando as referências forem reescritas — e o
     resumo dele só pode ser calculado depois disso. */
  const mods = ['regras/avisos.js', 'regras/taxonomia.js', 'regras/unidades.js'];
  const vMods = {};
  for (const m of mods) if (fs.existsSync(path.join(SAIDA, m))) vMods[m] = resumo(m);

  const fApp = path.join(SAIDA, 'app.js');
  if (fs.existsSync(fApp)) {
    let js = fs.readFileSync(fApp, 'utf8');
    for (const m of Object.keys(vMods)) {
      const nome = m.replace('regras/', '');
      js = js.replace(new RegExp("(['\"])\\./regras/" + nome + "\\1", 'g'),
        "'./regras/" + nome + "?v=" + vMods[m] + "'");
    }
    fs.writeFileSync(fApp, js);
  }

  const v = {};
  for (const f of ['app.js', 'styles.css', 'pagina.css'])
    if (fs.existsSync(path.join(SAIDA, f))) v[f] = resumo(f);

  /* reescrever as referências em todo o HTML publicado */
  let n = 0;
  (function varre(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { varre(f); continue; }
      if (!/\.html$/i.test(e.name)) continue;
      let h = fs.readFileSync(f, 'utf8'), antes = h;
      for (const nome of Object.keys(v)) {
        /* apanha "app.js" e "/pagina.css", com ou sem barra inicial */
        h = h.replace(new RegExp('((?:src|href)="/?)' + nome.replace('.', '\\.') + '(")', 'g'),
          '$1' + nome + '?v=' + v[nome] + '$2');
      }
      if (h !== antes) { fs.writeFileSync(f, h); n++; }
    }
  })(SAIDA);

  console.log('  carimbado: ' + Object.entries(v).map(([f, x]) => f + '?v=' + x).join(', '));
  console.log('  ' + n + ' páginas HTML actualizadas');
}

/* ---- a identidade do que vai para o ar --------------------------------
   Escreve /meta.json na pasta de publicação: que commit, se a árvore estava
   limpa, quando foi, e uma impressão digital do conteúdo.

   PORQUE E PRECISO
     Uma auditoria a este site concluiu que a produção estava atrasada em
     relação ao GitHub. Não estava — o que ela tinha visto era uma cópia
     antiga em cache. Não havia forma de o confirmar sem ir a olho ao HTML,
     e por isso duas conclusões inteiras saíram erradas.

   PORQUE NAO CHEGA O COMMIT
     Publica-se com alterações por commitar mais vezes do que se admite. Um
     meta.json a dizer "commit X" quando o envio levou trabalho que ainda
     não está no X mente exactamente onde devia esclarecer. Daí o `sujo`.
     E daí o `impressao`: dois envios do mesmo commit com alterações locais
     diferentes têm o mesmo commit e o mesmo `sujo`, e só o resumo do
     conteúdo os distingue.

   O QUE A IMPRESSAO NAO INCLUI
     O próprio meta.json, que ainda não existe quando o resumo é calculado.
     É inevitável — um ficheiro não pode conter o resumo de si mesmo — e não
     é para corrigir. Quem tentar fechar esse ciclo vai encontrá-lo.

   PORQUE E DEPOIS DO CARIMBO
     O carimbar() reescreve as referências a app.js?v=… em 121 ficheiros. Um
     resumo calculado antes disso seria a impressão digital de uma coisa que
     não foi a que subiu. */
function escreveMeta() {
  const git = a => {
    try { return execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8' }).trim(); }
    catch (e) { return ''; }
  };
  const commit = git(['rev-parse', 'HEAD']);
  const sujo = git(['status', '--porcelain']) !== '';

  /* o resumo é dos ficheiros já carimbados, por ordem, caminho e conteúdo */
  const h = crypto.createHash('sha256');
  (function varre(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { varre(f); continue; }
      h.update(path.relative(SAIDA, f).split(path.sep).join('/'));
      h.update(fs.readFileSync(f));
    }
  })(SAIDA);

  const meta = {
    commit,
    commitCurto: commit.slice(0, 7),
    sujo,
    publicado: new Date().toISOString(),
    impressao: h.digest('hex').slice(0, 16)
  };
  fs.writeFileSync(path.join(SAIDA, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log('  commit ' + meta.commitCurto + (sujo ? ' (ÁRVORE SUJA)' : '') +
    ' · impressão ' + meta.impressao);
  if (sujo) {
    console.log('');
    console.log('  ⚠ PUBLICAÇÃO COM ALTERAÇÕES POR COMMITAR');
    console.log('    O meta.json regista-o. Não impede nada — há alturas em que');
    console.log('    faz sentido publicar primeiro e commitar depois — mas fica dito.');
    console.log('');
  }
}

/* ------------------------------------------------------------------ */
passo('Gerar as páginas das asas e o sitemap');
execFileSync(process.execPath, [path.join('scripts', 'gerar-paginas.mjs')],
  { cwd: RAIZ, stdio: 'inherit' });

/* AS VERIFICACOES SAO OBRIGATORIAS AQUI, E NAO UM COMANDO A PARTE
   Um `npm run check` que se pode não correr não é uma barreira, é um
   conselho. Quem escrever `node scripts/publicar.mjs --publicar` passa por
   aqui de qualquer maneira.

   Não se gera duas vezes: as páginas acabaram de sair acima, e o
   verificar.mjs é importado como função justamente para trabalhar sobre o
   que já está no disco. */
passo('Verificar as páginas geradas');
const malParado = verifica();
if (malParado.length) {
  for (const m of malParado.slice(0, 20)) console.log('    ' + m);
  if (malParado.length > 20) console.log('    … e mais ' + (malParado.length - 20));
  erro(malParado.length + ' verificação(ões) falhou/falharam — nada foi publicado');
}

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

passo('Carimbar a versão no JavaScript e no CSS');
carimbar();

passo('Registar o que vai para o ar');
escreveMeta();

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
if (!fs.existsSync(WRANGLER)) erro('falta o wrangler do projecto — corre `npm ci`');
execFileSync(process.execPath, [WRANGLER, 'pages', 'deploy', '_publicar',
  '--project-name=happy-soaring', '--branch=master'],
  { cwd: RAIZ, stdio: 'inherit' });
console.log('\n✔ https://happysoaring.com\n');
