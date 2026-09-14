/**
 * Manual de boas práticas — lido das lições do módulo (só leitura).
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/manual.mjs                 mostra o manual no terminal
 *   node inteligencia/scripts/manual.mjs --ficheiro F    escreve uma cópia datada em F
 *
 * UMA SÓ FONTE DE VERDADE (decisão do Paulo, 14/09/2026)
 * As boas práticas vivem só nas lições do módulo (tabela `licoes`, página «Aprendizagem»).
 * Este script LÊ-AS; não as guarda. Deixou de haver uma cópia no repositório
 * (inteligencia/manual/boas-praticas.md): uma cópia commitada desactualiza-se assim que o
 * módulo aprende algo e passa a ser uma segunda verdade. Quando for preciso levar o manual
 * para outro site, gera-se com --ficheiro nesse dia, e o cabeçalho diz de quando é.
 *
 * O Claude corre isto antes de mexer no site. Uma prática nova regista-se no módulo
 * (`registar.mjs licao`), nunca num .md, no CLAUDE.md ou numa memória.
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
const i = process.argv.indexOf('--ficheiro');
if (i > 0 && process.argv[i + 1]) {
  const destino = path.resolve(process.argv[i + 1]);
  const aviso = '> Cópia de ' + new Date().toISOString().slice(0, 10) + '. A fonte é o módulo de inteligência ' +
    '(https://happysoaring.com/inteligencia/aprendizagem/). Não se edita: fica desactualizada assim que o módulo aprende algo novo.\n\n';
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, aviso + texto + '\n');
  console.log('✔ cópia escrita em ' + destino + ' — ' + licoes.length + ' lição(ões)');
} else {
  console.log(texto);
}
