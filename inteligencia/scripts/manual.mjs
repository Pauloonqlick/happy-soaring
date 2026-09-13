/**
 * Manual de boas práticas — gerado a partir das lições do módulo (só leitura).
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/manual.mjs     escreve inteligencia/manual/boas-praticas.md
 *
 * O manual serve para este site e para os próximos. É o mesmo texto que a
 * página «Aprendizagem» mostra; guardá-lo no repositório deixa-o disponível
 * mesmo sem o módulo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resultadosDasLicoes, gerarManual } from '../src/aprendizagem.js';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const ler = sql => JSON.parse(execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'hs-inteligencia', '--remote', '--json', '--command', sql],
  { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }))[0].results;

const licoes = ler('SELECT * FROM licoes ORDER BY categoria, prioridade, chave');
const assuntos = ler('SELECT chave, tipo, caminho, evidencia, resolvido_em FROM assuntos')
  .map(a => { let ev = {}; try { ev = JSON.parse(a.evidencia); } catch (e) { ev = {}; } return { ...a, evidencia: ev }; });
const pacotes = ler('SELECT id, licao_chave FROM pacotes_trabalho');
const avaliacoes = ler('SELECT pacote_id, resultado FROM avaliacoes');

const texto = gerarManual(resultadosDasLicoes(licoes, { assuntos, pacotes, avaliacoes }));
const destino = path.join(MODULO, 'manual', 'boas-praticas.md');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, texto + '\n');
console.log('✔ ' + path.relative(path.join(MODULO, '..'), destino) + ' — ' + licoes.length + ' lição(ões)');
