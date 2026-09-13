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

test('wrangler.toml: sem workers.dev, sem pré-visualizações, só as duas rotas do prefixo', () => {
  const t = ler(path.join(MODULO, 'wrangler.toml'));
  assert.match(t, /^workers_dev\s*=\s*false\s*$/m);
  assert.match(t, /^preview_urls\s*=\s*false\s*$/m);
  const padroes = [...t.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(padroes.sort(), ['happysoaring.com/admin/inteligencia', 'happysoaring.com/admin/inteligencia/*']);
  assert.match(t, /run_worker_first\s*=\s*true/);
  assert.doesNotMatch(t, /crons|\[triggers\]/, 'a Fase 1 não tem tarefas agendadas');
});

test('wrangler.toml: nenhum segredo escrito no ficheiro', () => {
  const t = ler(path.join(MODULO, 'wrangler.toml'));
  assert.doesNotMatch(t, /GOCSPX|refresh_token|DATAFORSEO_PASSWORD\s*=|client_secret/i);
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
  const html = ler(path.join(MODULO, 'public', 'admin', 'inteligencia', 'index.html'));
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'script em linha violaria a CSP');
  assert.doesNotMatch(html, /<style|style="/i);
  assert.doesNotMatch(html, /(src|href)="https?:\/\//i);
  const js = ler(path.join(MODULO, 'public', 'admin', 'inteligencia', 'app.js'));
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|document\.write/);
});
