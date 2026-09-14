/**
 * Registos do Claude no módulo de inteligência — lições e implementações.
 *
 * USO (a partir da raiz do repositório)
 *   node inteligencia/scripts/registar.mjs licao <ficheiro.json>
 *       cria ou actualiza uma lição (chave, natureza MEDIDA|PROCESSO, tipo_assunto (só MEDIDA),
 *       categoria, titulo, padrao, prioridade, sintoma, causa, correccao, prevencao, generica,
 *       referencias — obrigatórias numa PROCESSO: ["incidente:<aberto_em>", …])
 *   node inteligencia/scripts/registar.mjs implementacao <licao-ou-tipo> <commit> [nota]
 *       marca como implementados os pacotes ainda por publicar dessa lição ou tipo
 *   node inteligencia/scripts/registar.mjs dispensar <assunto:chave|incidente:aberto_em> <motivo>
 *       um caso que não deixa lição (fica o motivo; sai de «O que falta aprender»)
 *   node inteligencia/scripts/registar.mjs incidente <id> <ficheiro.json>
 *       marca um incidente já fechado como resolvido (causa_confirmada, resolucao)
 *   node inteligencia/scripts/registar.mjs hipotese <ficheiro.json>
 *       regista uma hipótese eliminada (hipotese, evidencia, eliminada_em, caminho,
 *       tipo_assunto). ATENÇÃO: com tipo_assunto, os assuntos desse tipo nesse caminho
 *       ficam RETIRADOS; sem ele, fica só como conhecimento — o normal numa análise.
 *
 * Escreve na base remota pelo wrangler já autenticado. Nunca mexe em
 * observações: a ligação à publicação e a avaliação fazem-nas as tarefas do
 * próprio módulo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const [, , accao, ...args] = process.argv;
const q = v => v == null ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const erro = m => { console.error('✖ ' + m); process.exit(1); };

function executar(sql) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hs-registar-')), 'registo.sql');
  fs.writeFileSync(f, sql);
  try {
    return execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'hs-inteligencia', '--remote', '--file', f],
      { cwd: MODULO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  } finally { fs.rmSync(path.dirname(f), { recursive: true, force: true }); }
}

const agora = new Date().toISOString();

if (accao === 'licao') {
  if (!args[0]) erro('falta o ficheiro JSON da lição');
  const l = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  const processo = l.natureza === 'PROCESSO';
  for (const k of ['chave', 'categoria', 'titulo', 'sintoma', 'causa', 'correccao', 'prevencao'].concat(processo ? [] : ['tipo_assunto'])) if (!l[k]) erro('falta ' + k);
  if (processo && !(Array.isArray(l.referencias) && l.referencias.length)) erro('uma lição de processo diz de que caso nasceu: referencias ["incidente:…", …]');
  if (!/^[a-z0-9][a-z0-9/_-]{2,119}$/.test(l.chave)) erro('chave inválida');
  if (l.padrao) new RegExp(l.padrao, 'i');
  const cols = ['natureza', 'tipo_assunto', 'categoria', 'titulo', 'padrao', 'prioridade', 'sintoma', 'causa', 'correccao', 'prevencao', 'generica', 'referencias'];
  const val = { ...l, natureza: processo ? 'PROCESSO' : 'MEDIDA', tipo_assunto: processo ? null : l.tipo_assunto, prioridade: Number(l.prioridade ?? 100),
    generica: l.generica === false ? 0 : 1, padrao: processo ? null : (l.padrao || null), referencias: Array.isArray(l.referencias) ? JSON.stringify(l.referencias) : null };
  executar(`INSERT INTO licoes (chave, ${cols.join(', ')}, origem, criada_em, alterada_em)
VALUES (${q(l.chave)}, ${cols.map(k => q(val[k])).join(', ')}, 'CLAUDE', ${q(agora)}, ${q(agora)})
ON CONFLICT(chave) DO UPDATE SET ${cols.map(k => k + ' = excluded.' + k).join(', ')}, versao = licoes.versao + 1, alterada_em = excluded.alterada_em;
INSERT INTO licoes_historico (chave, versao, dados, gravado_em)
SELECT chave, versao, json_object('chave', chave, 'versao', versao, ${cols.map(k => `'${k}', ${k}`).join(', ')}, 'origem', origem), ${q(agora)}
FROM licoes WHERE chave = ${q(l.chave)};`);
  console.log('✔ lição registada: ' + l.chave);
} else if (accao === 'implementacao') {
  const [grupo, commit, ...nota] = args;
  if (!grupo || !/^[0-9a-f]{7,40}$/.test(commit || '')) erro('uso: implementacao <licao-ou-tipo> <commit> [nota]');
  const impl = JSON.stringify({ commit, em: agora, nota: nota.join(' ') || null });
  executar(`UPDATE pacotes_trabalho SET implementacao = ${q(impl)}
WHERE publicado_em IS NULL AND implementacao IS NULL
  AND (licao_chave = ${q(grupo)} OR assunto_chave LIKE ${q(grupo + ' %')});`);
  console.log('✔ pacotes marcados como implementados: ' + grupo + ' @ ' + commit);
} else if (accao === 'hipotese') {
  if (!args[0]) erro('falta o ficheiro JSON da hipótese');
  const h = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  for (const k of ['hipotese', 'evidencia', 'eliminada_em']) if (!h[k]) erro('falta ' + k);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h.eliminada_em)) erro('eliminada_em tem de ser AAAA-MM-DD');
  if (h.caminho && !/^\/[a-z0-9\/._-]*$/i.test(h.caminho)) erro('caminho inválido');
  if (h.tipo_assunto && !/^[A-Z_]{3,60}$/.test(h.tipo_assunto)) erro('tipo_assunto inválido');
  const cols = ['hipotese', 'evidencia', 'eliminada_em', 'tipo_assunto', 'caminho', 'objectivo_id', 'estado'];
  const val = { ...h, tipo_assunto: h.tipo_assunto || null, caminho: h.caminho || null, objectivo_id: h.objectivo_id || null, estado: 'ELIMINADA' };
  /* o mesmo registo e o mesmo histórico que a página «Conhecimento» escreve (src/conhecimento.js) */
  executar(`INSERT INTO hipoteses_eliminadas (${cols.join(', ')}, alterado_em) VALUES (${cols.map(k => q(val[k])).join(', ')}, ${q(agora)});
INSERT INTO conhecimento_historico (tabela, registo_id, versao, dados, gravado_em)
SELECT 'hipoteses_eliminadas', id, versao, json_object('id', id, 'versao', versao, 'alterado_em', alterado_em, ${cols.map(k => `'${k}', ${k}`).join(', ')}), ${q(agora)}
FROM hipoteses_eliminadas WHERE id = (SELECT MAX(id) FROM hipoteses_eliminadas);`);
  console.log('✔ hipótese eliminada registada' + (val.tipo_assunto ? ' — RETIRA assuntos ' + val.tipo_assunto + ' em ' + (val.caminho || 'todo o site') : ' (só conhecimento)'));
} else if (accao === 'dispensar') {
  /* um caso que não deixa lição: fica escrito porquê e sai de «O que falta aprender» */
  const [referencia, ...motivo] = args;
  if (!/^(assunto|incidente):.{3,200}$/.test(referencia || '') || motivo.join(' ').trim().length < 20) erro('uso: dispensar <assunto:chave|incidente:aberto_em> <motivo, uma frase a sério>');
  executar(`INSERT OR REPLACE INTO aprendizagem_dispensas (referencia, motivo, dispensada_em, por) VALUES (${q(referencia)}, ${q(motivo.join(' ').trim())}, ${q(agora)}, 'CLAUDE');`);
  console.log('✔ dispensado: ' + referencia);
} else if (accao === 'incidente') {
  /* marca um incidente FECHADO como resolvido: deixa de ser notícia no «Hoje» e na leitura */
  const id = Number(args[0]);
  if (!Number.isInteger(id) || id < 1 || !args[1]) erro('uso: incidente <id> <ficheiro.json com causa_confirmada e resolucao>');
  const r = JSON.parse(fs.readFileSync(args[1], 'utf8'));
  for (const k of ['causa_confirmada', 'resolucao']) if (!r[k] || String(r[k]).length < 20) erro('falta ' + k + ' (uma frase a sério)');
  executar(`UPDATE incidentes SET causa_confirmada = ${q(r.causa_confirmada)}, resolucao = ${q(r.resolucao)}, resolvido_em = ${q(agora)}
WHERE id = ${id} AND fechado_em IS NOT NULL;`);
  console.log('✔ incidente ' + id + ' marcado como resolvido (só se já estava fechado)');
} else {
  erro('acção desconhecida — usa «licao», «implementacao», «hipotese», «incidente» ou «dispensar»');
}
