/* O que tem de ser verdade na configuração e no repositório, sempre. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MODULO = path.join(AQUI, '..');
const RAIZ = path.join(MODULO, '..');
const ler = f => fs.readFileSync(f, 'utf8');

test('wrangler.toml: sem workers.dev, sem pré-visualizações, só as duas rotas e uma tarefa agendada', () => {
  const t = ler(path.join(MODULO, 'wrangler.toml'));
  assert.match(t, /^workers_dev\s*=\s*false\s*$/m);
  assert.match(t, /^preview_urls\s*=\s*false\s*$/m);
  const padroes = [...t.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(padroes.sort(), ['happysoaring.com/inteligencia', 'happysoaring.com/inteligencia/*']);
  assert.match(t, /run_worker_first\s*=\s*true/);
  const crons = [...t.matchAll(/crons\s*=\s*\[([^\]]*)\]/g)].map(m => m[1]);
  assert.equal(crons.length, 1, 'uma só declaração de tarefas agendadas');
  assert.deepEqual([...crons[0].matchAll(/"([^"]+)"/g)].map(m => m[1]), ['*/2 * * * *'], 'uma só tarefa agendada — o limite de 5 é partilhado pela conta');
});

test('wrangler.toml: tecto de processamento por execução e registos da Cloudflare ligados', () => {
  const t = ler(path.join(MODULO, 'wrangler.toml'));
  const cpu = /\[limits\][^[]*?cpu_ms\s*=\s*(\d+)/.exec(t);
  assert.ok(cpu, 'há um tecto de processamento: um erro no código não se pode transformar em custo');
  assert.ok(Number(cpu[1]) >= 200 && Number(cpu[1]) <= 5000, 'tecto com folga para as execuções (até ~65 ms) mas baixo');
  assert.match(t, /\[observability\][^[]*?enabled\s*=\s*true/, 'a Cloudflare guarda a causa de cada execução cortada');
});

test('wrangler.toml: nenhum segredo escrito no ficheiro', () => {
  const t = ler(path.join(MODULO, 'wrangler.toml'));
  const semComentarios = t.replace(/^\s*#.*$/gm, '');
  assert.doesNotMatch(t, /GOCSPX|1\/\/0[0-9A-Za-z_-]{20,}/, 'valores com a forma de uma chave ou refresh token Google');
  assert.doesNotMatch(semComentarios, /^\s*(GOOGLE_OAUTH_CLIENT_ID|GOOGLE_OAUTH_CLIENT_SECRET|GSC_REFRESH_TOKEN|DATAFORSEO_LOGIN|DATAFORSEO_PASSWORD|RESEND_API_KEY)\s*=/m,
    'credenciais são segredos do Worker, nunca variáveis no ficheiro');
  assert.doesNotMatch(semComentarios, /refresh_token|client_secret/i);
  assert.doesNotMatch(t, /\bre_[A-Za-z0-9]{20,}/, 'valores com a forma de uma chave do Resend');
  assert.doesNotMatch(t, /^\s*CF_API_TOKEN_PAGES\s*=/m, 'o token do Pages é segredo, não variável');
});

test('publicar.mjs do site: `inteligencia` está nas PROIBIDAS e fora das listas de autorizados', () => {
  const p = ler(path.join(RAIZ, 'scripts', 'publicar.mjs'));
  const lista = nome => {
    const m = p.match(new RegExp('const ' + nome + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
    assert.ok(m, 'lista ' + nome + ' não encontrada');
    return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  };
  assert.ok(lista('PROIBIDAS').includes('inteligencia'));
  for (const nome of ['FICHEIROS', 'PASTAS', 'PASTAS_GERADAS']) {
    assert.ok(!lista(nome).some(x => x === 'inteligencia' || x.startsWith('inteligencia/')), nome);
  }
});

test('migração 0001: concorrentes e mercados começam vazios; importância por definir', () => {
  const sql = ler(path.join(MODULO, 'migrations', '0001_configuracao_base.sql'));
  assert.doesNotMatch(sql, /INSERT INTO concorrentes/i, 'concorrentes concretos são dados, não código');
  assert.doesNotMatch(sql, /INSERT INTO mercados/i);
  const objectivos = sql.match(/INSERT INTO objectivos_negocio[\s\S]*?;/i)[0];
  assert.doesNotMatch(objectivos, /'(ALTA|MEDIA|BAIXA)'/, 'sem ordem permanente de importância');
  assert.match(sql, /lingua_pesquisa\s+TEXT NOT NULL DEFAULT 'UNKNOWN'/);
  assert.match(sql, /lingua_interface\s+TEXT NOT NULL DEFAULT 'UNKNOWN'/);
});

test('migração 0001: aplica-se do zero numa base SQLite limpa', async (t) => {
  let sqlite;
  try { sqlite = await import('node:sqlite'); }
  catch (e) { t.skip('node:sqlite indisponível nesta versão do Node'); return; }
  const db = new sqlite.DatabaseSync(':memory:');
  db.exec(ler(path.join(MODULO, 'migrations', '0001_configuracao_base.sql')));
  assert.equal(db.prepare("SELECT valor FROM esquema_meta WHERE chave='versao_esquema'").get().valor, '1');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM objectivos_negocio').get().n, 5);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM concorrentes').get().n, 0);
  assert.throws(() => db.exec("INSERT INTO mercados (id, pais, dispositivo) VALUES ('x','PT','tablet')"));
  assert.throws(() => db.exec("INSERT INTO concorrentes (id, dominio, tipo) VALUES ('x','x.com','INVENTADO')"));
  db.exec("INSERT INTO mercados (id, pais) VALUES ('pt','PT')");
  const m = db.prepare("SELECT lingua_pesquisa, lingua_interface FROM mercados WHERE id='pt'").get();
  assert.deepEqual({ ...m }, { lingua_pesquisa: 'UNKNOWN', lingua_interface: 'UNKNOWN' }, 'país ≠ língua: nada se deduz');
});

test('interface: sem scripts nem estilos em linha, sem recursos de terceiros', () => {
  const PAGINAS = [['index.html'], ['alteracoes', 'index.html'], ['indexacao', 'index.html'], ['assunto', 'index.html'],
    ['conhecimento', 'index.html'], ['contactos', 'index.html'], ['configuracao', 'index.html'], ['aprendizagem', 'index.html'], ['evolucao', 'index.html']];
  for (const h of PAGINAS) {
    const html = ler(path.join(MODULO, 'public', 'inteligencia', ...h));
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'script em linha violaria a CSP');
    assert.doesNotMatch(html, /<style|style="/i);
    assert.doesNotMatch(html, /(src|href)="https?:\/\//i);
  }
  for (const f of fs.readdirSync(path.join(MODULO, 'public', 'inteligencia')).filter(f => f.endsWith('.js'))) {
    const js = ler(path.join(MODULO, 'public', 'inteligencia', f));
    assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|document\.write/, f);
  }
});

test('o módulo não depende do CMS: nenhuma rota, ligação, script ou login do /admin/', () => {
  const fontes = [
    path.join(MODULO, 'wrangler.toml'),
    ...fs.readdirSync(path.join(MODULO, 'src')).map(f => path.join(MODULO, 'src', f)),
    ...fs.readdirSync(path.join(MODULO, 'public', 'inteligencia'), { recursive: true })
      .filter(f => /\.(html|js|css)$/.test(f)).map(f => path.join(MODULO, 'public', 'inteligencia', f))
  ];
  for (const f of fontes) {
    const s = ler(f).replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|^\s*#.*$/gm, '');
    assert.doesNotMatch(s, /\/admin\b/, f + ' refere /admin');
    assert.doesNotMatch(s, /sveltia|decap|netlify-cms/i, f + ' refere o CMS');
  }
  assert.ok(!fs.existsSync(path.join(MODULO, 'public', 'admin')), 'não pode haver ficheiros do módulo debaixo de /admin');
});
