/* AVISOS CRÍTICOS POR EMAIL

   Só acontecimentos críticos. No máximo um aviso agregado por dia, salvo uma
   situação excepcional que exija atenção imediata: um problema crítico numa
   página prioritária (nível 1) ou três ou mais problemas críticos novos ao
   mesmo tempo. Nunca mais de 3 envios em 24 horas. Tudo o resto aparece no «Hoje».

   Não se avisa o que o Paulo já decidiu, adiou, bloqueou ou retirou. Um
   problema que volta depois de resolvido é novo e volta a ser avisado.

   Envio pelo Resend. A chave (RESEND_API_KEY) é um segredo do Worker; o
   endereço de envio (AVISOS_DE) e o destino (AVISOS_PARA) são variáveis. */
import { carregarContexto, verAssunto } from './assuntos.js';

const RESEND = 'https://api.resend.com/emails';
const SITE = 'https://happysoaring.com';
export const MAX_ENVIOS_24H = 3;
const INTERVALO_TESTE_MIN = 10;
const DIA = 864e5;
const t = s => (s ? Date.parse(s) : NaN);

export const avisosConfigurados = env =>
  !!(String(env.RESEND_API_KEY || '').trim() && String(env.AVISOS_DE || '').trim() && String(env.AVISOS_PARA || '').trim());

/* Puro: o que avisar agora, e porquê — ou nada. */
export function escolherAviso({ criticos, avisados, ultimoEnvio, enviados24h, agora }) {
  const novos = criticos.filter(c => !avisados.has(c.chave + '@' + c.detectado_em));
  if (!novos.length || enviados24h >= MAX_ENVIOS_24H) return null;
  if (!ultimoEnvio || t(agora) - t(ultimoEnvio) >= DIA) return { motivo: 'DIARIO', assuntos: novos };
  if (novos.some(c => c.nivel === 1) || novos.length >= 3) return { motivo: 'EXCEPCIONAL', assuntos: novos };
  return null;
}

const quando = iso => new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

export function compor(aviso) {
  const n = aviso.assuntos.length;
  const assunto = 'Happy Soaring — ' + n + (n === 1 ? ' problema crítico' : ' problemas críticos') +
    (aviso.motivo === 'EXCEPCIONAL' ? ' (atenção imediata)' : '');
  const linhas = aviso.assuntos.map(a =>
    '• ' + a.titulo + ' — ' + a.caminho + (a.objectivos.length ? ' (' + a.objectivos.join(', ') + ')' : '') + '\n' +
    '  detectado em ' + quando(a.detectado_em) + '\n' +
    '  ' + SITE + '/inteligencia/assunto/?id=' + a.id);
  const texto = 'O módulo de inteligência detectou ' + (n === 1 ? 'um problema crítico' : n + ' problemas críticos') + ':\n\n' +
    linhas.join('\n\n') + '\n\n' +
    'Abrir o «Hoje»: ' + SITE + '/inteligencia/\n\n' +
    '—\nSó se avisam acontecimentos críticos, no máximo um aviso agregado por dia, salvo situação excepcional. Tudo o resto aparece no «Hoje».';
  return { assunto, texto };
}

async function enviar(env, buscar, { assunto, texto, idempotencia }) {
  const resp = await buscar(RESEND, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + String(env.RESEND_API_KEY).trim(), 'content-type': 'application/json',
      'user-agent': 'hs-inteligencia', 'idempotency-key': idempotencia
    },
    body: JSON.stringify({
      from: String(env.AVISOS_DE).trim(),
      to: String(env.AVISOS_PARA).split(',').map(s => s.trim()).filter(Boolean),
      subject: assunto, text: texto
    })
  });
  let j = {};
  try { j = await resp.json(); } catch (e) { j = {}; }
  if (resp.ok && j.id) return { ok: true, id: String(j.id) };
  /* só o código e o nome do erro: nunca a chave nem o corpo inteiro */
  return { ok: false, erro: 'HTTP_' + resp.status + (j.name ? ' ' + String(j.name).slice(0, 60) : '') };
}

async function historico(db, agora) {
  const desde90 = new Date(t(agora) - 90 * DIA).toISOString();
  const desde24 = new Date(t(agora) - DIA).toISOString();
  const [{ results }, conta] = await Promise.all([
    db.prepare("SELECT criado_em, assuntos FROM avisos WHERE estado = 'ENVIADO' AND motivo <> 'TESTE' AND criado_em > ? ORDER BY criado_em").bind(desde90).all(),
    db.prepare("SELECT COUNT(*) AS n FROM avisos WHERE estado = 'ENVIADO' AND motivo <> 'TESTE' AND criado_em > ?").bind(desde24).first()
  ]);
  const avisados = new Set();
  for (const r of results) {
    try { for (const a of JSON.parse(r.assuntos)) avisados.add(a.chave + '@' + a.detectado_em); } catch (e) { /* linha ilegível: ignora */ }
  }
  return { avisados, ultimoEnvio: results.length ? results[results.length - 1].criado_em : null, enviados24h: conta?.n ?? 0 };
}

const AVISAVEIS = new Set(['PROPOSTO', 'DETETADO', 'REGRESSAO']);

export async function executarCicloAvisos(env, { fetchImpl = fetch, agora = new Date().toISOString() } = {}) {
  const relatorio = { enviado: false, motivo: null, assuntos: 0 };
  if (!avisosConfigurados(env)) { relatorio.motivo = 'SEM_CONFIGURACAO'; return relatorio; }
  const db = env.DB;
  const ctx = await carregarContexto(db, agora);
  const criticos = ctx.assuntos.filter(a => !a.resolvido_em && a.critico)
    .map(a => verAssunto(a, ctx))
    .filter(v => AVISAVEIS.has(v.estado))
    .map(v => ({ id: v.id, chave: v.chave, titulo: v.titulo, caminho: v.caminho, detectado_em: v.detectado_em,
      nivel: v.nivel, objectivos: v.objectivos.map(o => o.nome) }));
  const h = await historico(db, agora);
  const aviso = escolherAviso({ criticos, ...h, agora });
  if (!aviso) { relatorio.motivo = criticos.length ? 'NADA_DE_NOVO_OU_LIMITE' : 'SEM_CRITICOS'; return relatorio; }

  const { assunto, texto } = compor(aviso);
  const chaves = aviso.assuntos.map(a => ({ chave: a.chave, detectado_em: a.detectado_em }));
  const r = await enviar(env, fetchImpl, { assunto, texto, idempotencia: 'aviso-' + agora.slice(0, 13) + '-' + chaves.length });
  await db.prepare('INSERT INTO avisos (criado_em, motivo, assuntos, estado, id_fornecedor, erro) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(agora, aviso.motivo, JSON.stringify(chaves), r.ok ? 'ENVIADO' : 'FALHOU', r.id ?? null, r.erro ?? null).run();
  relatorio.enviado = r.ok;
  relatorio.motivo = r.ok ? aviso.motivo : r.erro;
  relatorio.assuntos = chaves.length;
  return relatorio;
}

/* Um aviso de teste pedido na interface, para confirmar que o email chega. */
export async function enviarAvisoTeste(env, { fetchImpl = fetch, agora = new Date().toISOString() } = {}) {
  if (!avisosConfigurados(env)) return { estado: 409, erro: 'Os avisos por email ainda não estão configurados.' };
  const recente = await env.DB.prepare("SELECT 1 AS x FROM avisos WHERE motivo = 'TESTE' AND criado_em > ? LIMIT 1")
    .bind(new Date(t(agora) - INTERVALO_TESTE_MIN * 60000).toISOString()).first();
  if (recente) return { estado: 429, erro: 'Já foi enviado um teste há menos de ' + INTERVALO_TESTE_MIN + ' minutos.' };
  const r = await enviar(env, fetchImpl, {
    assunto: 'Happy Soaring — aviso de teste',
    texto: 'Este é um aviso de teste do módulo de inteligência, pedido em ' + quando(agora) + '.\n\n' +
      'Se o recebeu, os avisos críticos estão ligados.\n\nAbrir o «Hoje»: ' + SITE + '/inteligencia/',
    idempotencia: 'teste-' + agora
  });
  await env.DB.prepare("INSERT INTO avisos (criado_em, motivo, assuntos, estado, id_fornecedor, erro) VALUES (?, 'TESTE', '[]', ?, ?, ?)")
    .bind(agora, r.ok ? 'ENVIADO' : 'FALHOU', r.id ?? null, r.erro ?? null).run();
  return r.ok ? { estado: 200, valor: await estadoAvisos(env.DB, env) } : { estado: 502, erro: 'O envio falhou (' + r.erro + ').' };
}

export async function estadoAvisos(db, env) {
  const [ultimo, falha] = await Promise.all([
    db.prepare("SELECT criado_em, motivo FROM avisos WHERE estado = 'ENVIADO' ORDER BY criado_em DESC LIMIT 1").first(),
    db.prepare("SELECT criado_em, erro FROM avisos WHERE estado = 'FALHOU' ORDER BY criado_em DESC LIMIT 1").first()
  ]);
  return {
    configurado: avisosConfigurados(env),
    destino: avisosConfigurados(env) ? String(env.AVISOS_PARA).trim() : null,
    ultimo_envio: ultimo ? { em: ultimo.criado_em, motivo: ultimo.motivo } : null,
    ultima_falha: falha && (!ultimo || falha.criado_em > ultimo.criado_em) ? { em: falha.criado_em, erro: falha.erro } : null
  };
}
