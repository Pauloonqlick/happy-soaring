/**
 * Pacotes de trabalho aprovados no módulo de inteligência — só leitura.
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/pacotes.mjs          os pacotes à espera de implementação
 *   node inteligencia/scripts/pacotes.mjs 12       o pacote n.º 12, completo
 *
 * Lê a base remota pelo wrangler já autenticado neste computador. Não escreve
 * nada: a ligação do pacote à publicação faz-a o próprio módulo, quando
 * observa a publicação que alterou a página.
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const id = process.argv[2];
if (id !== undefined && !/^\d{1,9}$/.test(id)) { console.error('Uso: node inteligencia/scripts/pacotes.mjs [número]'); process.exit(1); }

const sql = id
  ? `SELECT id, assunto_chave, caminho, criado_em, deployment_id, publicado_em, conteudo FROM pacotes_trabalho WHERE id = ${Number(id)}`
  : 'SELECT id, assunto_chave, caminho, criado_em, conteudo FROM pacotes_trabalho WHERE deployment_id IS NULL ORDER BY id';
const saida = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'hs-inteligencia', '--remote', '--json', '--command', sql],
  { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const linhas = JSON.parse(saida)[0]?.results || [];

if (!linhas.length) {
  console.log(id ? 'Pacote desconhecido.' : 'Nenhum pacote à espera de implementação.');
  process.exit(0);
}
for (const p of linhas) {
  const c = JSON.parse(p.conteudo);
  console.log(`\n══ Pacote ${p.id} — ${c.assunto}`);
  console.log(`Página: ${c.pagina}   Objectivos: ${c.objectivos.join(', ') || 'sem objectivo configurado'}   Aprovado: ${p.criado_em}`);
  if (p.publicado_em) console.log(`Publicado: ${p.publicado_em} (${p.deployment_id})`);
  console.log(`\nO que alterar: ${c.o_que_alterar}`);
  console.log(`Porquê: ${c.porque.diagnostico}`);
  console.log('Evidência: ' + JSON.stringify(c.porque.evidencia));
  console.log('\nNão tocar:\n' + c.nao_tocar.map(x => '  - ' + x).join('\n'));
  if (c.riscos.length) console.log('Riscos:\n' + c.riscos.map(x => '  - ' + x).join('\n'));
  console.log(`Medição: ${c.medicao}`);
  const r = c.respeitar;
  console.log('\nRespeitar:');
  console.log('  Decisões activas: ' + (r.decisoes_activas.map(d => d.titulo + ' (' + d.razao + ')').join('; ') || 'nenhuma'));
  console.log('  Factos verificados: ' + (r.factos_verificados.join('; ') || 'nenhum'));
  console.log('  Afirmações proibidas: ' + (r.afirmacoes_proibidas.join('; ') || 'nenhuma'));
  console.log('  Por confirmar (não usar): ' + (r.factos_por_confirmar.join('; ') || 'nenhum'));
  console.log('  Termos de marca: ' + r.termos_de_marca.join(', '));
  if (c.nota_do_paulo) console.log(`\nNota do Paulo: ${c.nota_do_paulo}`);
}
