/**
 * Publicação do módulo de inteligência — separada da publicação do site.
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/publicar.mjs               testa e valida, NÃO publica
 *   node inteligencia/scripts/publicar.mjs --publicar    testa, aplica migrações, publica
 *
 * Sem a bandeira não sai nada para o ar, como no scripts/publicar.mjs.
 * Usa o wrangler fixado no package.json da raiz, nunca o que o npx trouxer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(MODULO, '..');
const WRANGLER = path.join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const PUBLICAR = process.argv.includes('--publicar');

const passo = t => console.log('\n▸ ' + t);
const erro = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };
const corre = (args, cwd = MODULO) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' });

if (!fs.existsSync(WRANGLER)) erro('falta o wrangler do projecto — corre `npm ci` na raiz');

const toml = fs.readFileSync(path.join(MODULO, 'wrangler.toml'), 'utf8');

/* 15/09/2026 · os testes só correm o Worker; um erro de sintaxe no JavaScript das
   páginas passou-lhes ao lado e deixou a página Hoje toda em «A carregar…» */
passo('JavaScript das páginas do painel');
const pastaPublica = path.join(MODULO, 'public', 'inteligencia');
const scriptsPublicos = fs.readdirSync(pastaPublica, { recursive: true }).map(String).filter(f => f.endsWith('.js'));
for (const f of scriptsPublicos) {
  try { execFileSync(process.execPath, ['--check', path.join(pastaPublica, f)], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) { erro('erro de sintaxe em public/inteligencia/' + f + ' — nada foi publicado\n' + String(e.stderr || '').split('\n').slice(0, 5).join('\n')); }
}
console.log('  ✓ ' + scriptsPublicos.length + ' ficheiros sem erros de sintaxe');

passo('Testes do módulo');
const testes = fs.readdirSync(path.join(MODULO, 'test')).filter(f => f.endsWith('.test.mjs'))
  .map(f => path.join('inteligencia', 'test', f));
try { corre(['--test', ...testes], RAIZ); }
catch (e) { erro('testes falharam — nada foi publicado'); }

passo('Validar a configuração e o pacote (sem publicar)');
const saida = path.join(MODULO, 'dist');
corre([WRANGLER, 'deploy', '--dry-run', '--outdir', saida]);
fs.rmSync(saida, { recursive: true, force: true });

if (!PUBLICAR) {
  console.log('\nValidado. NÃO foi publicado.');
  console.log('Para publicar: node inteligencia/scripts/publicar.mjs --publicar\n');
  process.exit(0);
}

passo('Verificações antes de publicar');
if (/database_id\s*=\s*"0{8}-/.test(toml)) erro('database_id ainda é o marcador — cria a base D1 primeiro');

passo('Migrações pendentes na base remota');
corre([WRANGLER, 'd1', 'migrations', 'apply', 'hs-inteligencia', '--remote']);

passo('Publicar o Worker');
corre([WRANGLER, 'deploy']);
console.log('\n✔ https://happysoaring.com/inteligencia/\n');

/* 14/09/2026 · nada se aprende e se perde: o que ainda não deixou lição (nunca bloqueia) */
passo('O que falta aprender');
try { corre([path.join(MODULO, 'scripts', 'falta-aprender.mjs'), '--aviso']); } catch (e) { console.log('  (não foi possível ler)'); }
