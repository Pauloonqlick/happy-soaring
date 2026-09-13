/* CLIENTE DO SEARCH CONSOLE — só leitura.
   Autorização feita uma vez com scripts/gsc-autorizar.mjs.
   Nenhum segredo sai para o ecrã: o access token vive só em memória. */
import fs from 'node:fs';

const PASTA = 'C:/Users/Paulo Pereira/credenciais';
const { installed: c } = JSON.parse(fs.readFileSync(PASTA + '/gsc-oauth-client.json', 'utf8'));
const { refresh_token } = JSON.parse(fs.readFileSync(PASTA + '/gsc-token.json', 'utf8'));

let acesso = null, expira = 0;
async function token() {
  if (acesso && Date.now() < expira - 60000) return acesso;
  const r = await fetch(c.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.client_id, client_secret: c.client_secret,
      refresh_token, grant_type: 'refresh_token'
    })
  });
  const t = await r.json();
  if (!r.ok) throw new Error('token: HTTP ' + r.status + ' ' + (t.error || ''));
  acesso = t.access_token; expira = Date.now() + t.expires_in * 1000;
  return acesso;
}

export async function gsc(caminho, corpo) {
  const base = caminho.startsWith('https://') ? '' : 'https://www.googleapis.com/webmasters/v3/';
  const r = await fetch(base + caminho, {
    method: corpo ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const j = await r.json();
  if (!r.ok) throw new Error(caminho + ': HTTP ' + r.status + ' ' + JSON.stringify(j.error?.message || j));
  return j;
}

export const SITE = 'sc-domain:happysoaring.com';
export const analitica = (corpo) =>
  gsc('sites/' + encodeURIComponent(SITE) + '/searchAnalytics/query', corpo);
export const inspecciona = (url) =>
  gsc('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      { inspectionUrl: url, siteUrl: SITE, languageCode: 'pt-PT' });
