/* ACESSO À API DO GOOGLE — só leitura (webmasters.readonly).

   Três segredos do Worker, cada um com uma só finalidade:
     GOOGLE_OAUTH_CLIENT_ID      o cliente OAuth dedicado a este Worker
     GOOGLE_OAUTH_CLIENT_SECRET  a chave desse cliente
     GSC_REFRESH_TOKEN           a autorização do Paulo, só de leitura
   Nada disto vai para a base, para o R2, para registos ou para respostas.
   O token de acesso vive apenas em memória, e só até expirar. */

let acessoEmMemoria = null;   /* { token, expira } — por isolate */

export function temCredencialGoogle(env) {
  return Boolean(String(env.GOOGLE_OAUTH_CLIENT_ID || '').trim() &&
    String(env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim() &&
    String(env.GSC_REFRESH_TOKEN || '').trim());
}

export function esquecerAcessoGoogle() { acessoEmMemoria = null; }

export async function tokenDeAcesso(env, buscar) {
  if (acessoEmMemoria && Date.now() < acessoEmMemoria.expira - 60000) return { ok: true, token: acessoEmMemoria.token };
  if (!temCredencialGoogle(env)) return { ok: false, motivo: 'SEM_CREDENCIAL_GOOGLE' };
  const resp = await buscar('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: String(env.GOOGLE_OAUTH_CLIENT_ID).trim(),
      client_secret: String(env.GOOGLE_OAUTH_CLIENT_SECRET).trim(),
      refresh_token: String(env.GSC_REFRESH_TOKEN).trim(),
      grant_type: 'refresh_token'
    })
  });
  let j = {};
  try { j = await resp.json(); } catch (e) { j = {}; }
  if (!resp.ok || !j.access_token) {
    /* só o código de erro do Google — nunca o corpo inteiro, que pode ecoar parâmetros */
    return { ok: false, motivo: 'GOOGLE_TOKEN_HTTP_' + resp.status, detalhe: typeof j.error === 'string' ? j.error : null };
  }
  acessoEmMemoria = { token: j.access_token, expira: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return { ok: true, token: j.access_token };
}

export async function consultarAnalitica(env, buscar, token, corpo) {
  const propriedade = String(env.GSC_PROPRIEDADE || '').trim();
  const u = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(propriedade) + '/searchAnalytics/query';
  const resp = await buscar(u, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  let j = {};
  try { j = await resp.json(); } catch (e) { j = {}; }
  if (!resp.ok) {
    if (resp.status === 401) esquecerAcessoGoogle();
    return { ok: false, motivo: 'GSC_HTTP_' + resp.status, detalhe: j?.error?.status || null };
  }
  return { ok: true, linhas: Array.isArray(j.rows) ? j.rows : [] };
}
