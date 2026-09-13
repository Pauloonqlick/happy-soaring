/**
 * Autorização Google do Worker — corre-se UMA vez, no computador do Paulo.
 *
 *   node inteligencia/scripts/autorizar-google.mjs [caminho-do-json-do-cliente]
 *
 * 1. Lê o cliente OAuth (tipo «App para computador») transferido do Google Cloud.
 * 2. Abre o browser: o Paulo escolhe a conta e clica «Permitir». Âmbito só de
 *    leitura do Search Console (webmasters.readonly), acesso offline.
 * 3. Confirma que a autorização vê a propriedade sc-domain:happysoaring.com.
 * 4. Guarda três segredos no Worker hs-inteligencia, passando os valores ao
 *    wrangler pela entrada padrão:
 *      GOOGLE_OAUTH_CLIENT_ID · GOOGLE_OAUTH_CLIENT_SECRET · GSC_REFRESH_TOKEN
 *
 * NENHUM VALOR É ESCRITO NO ECRÃ, EM FICHEIROS OU EM REGISTOS.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MODULO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = path.join(MODULO, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const CLIENTE = process.argv[2] || 'C:/Users/Paulo Pereira/credenciais/hs-inteligencia-worker-oauth.json';
const AMBITO = 'https://www.googleapis.com/auth/webmasters.readonly';
const PROPRIEDADE = 'sc-domain:happysoaring.com';

const erro = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };

if (!fs.existsSync(CLIENTE)) erro('não encontro o ficheiro do cliente OAuth: ' + CLIENTE);
if (!fs.existsSync(WRANGLER)) erro('falta o wrangler do projecto — corre `npm ci` na raiz');
const bruto = JSON.parse(fs.readFileSync(CLIENTE, 'utf8'));
const c = bruto.installed;
if (!c) erro('o cliente tem de ser do tipo «App para computador» (installed)');

const b64url = b => b.toString('base64url');
const verificador = b64url(crypto.randomBytes(48));
const desafio = b64url(crypto.createHash('sha256').update(verificador).digest());
const estado = b64url(crypto.randomBytes(16));

function guardarSegredo(nome, valor) {
  const r = spawnSync(process.execPath, [WRANGLER, 'secret', 'put', nome], {
    cwd: MODULO, input: valor, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
  });
  const ok = r.status === 0;
  console.log('  ' + (ok ? '✔' : '✖') + ' segredo ' + nome + (ok ? ' guardado no Worker' : ' NÃO foi guardado'));
  return ok;
}

const servidor = http.createServer();
servidor.listen(0, '127.0.0.1', () => {
  const retorno = 'http://127.0.0.1:' + servidor.address().port;
  const url = c.auth_uri + '?' + new URLSearchParams({
    client_id: c.client_id, redirect_uri: retorno, response_type: 'code', scope: AMBITO,
    access_type: 'offline', prompt: 'consent', code_challenge: desafio, code_challenge_method: 'S256',
    state: estado, login_hint: 'paulo.pereira@happysoaring.com'
  });
  spawn('rundll32', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' }).unref();
  console.log('Browser aberto. À espera do clique em «Permitir»…');

  servidor.on('request', async (req, res) => {
    const q = new URL(req.url, retorno).searchParams;
    if (!q.has('code') && !q.has('error')) { res.writeHead(204).end(); return; }
    const acabar = (ok, texto) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        .end('<p style="font:18px system-ui;margin:3em">' + texto + '</p>');
      servidor.close();
      if (!ok) process.exitCode = 1;
    };
    if (q.get('error')) { console.log('Recusado: ' + q.get('error')); return acabar(false, 'Autorização recusada.'); }
    if (q.get('state') !== estado) return acabar(false, 'Pedido inválido.');

    const t = await (await fetch(c.token_uri, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: q.get('code'), client_id: c.client_id, client_secret: c.client_secret,
        redirect_uri: retorno, grant_type: 'authorization_code', code_verifier: verificador })
    })).json();
    if (!t.refresh_token || !t.access_token) {
      console.log('Troca falhou: ' + (t.error || 'sem refresh token'));
      return acabar(false, 'Falhou — pode fechar esta janela.');
    }
    const ambitos = String(t.scope || '').split(/\s+/);
    if (!ambitos.includes(AMBITO) || ambitos.includes('https://www.googleapis.com/auth/webmasters')) {
      console.log('Âmbito inesperado: ' + t.scope);
      return acabar(false, 'Âmbito inesperado — nada foi guardado.');
    }

    const sites = await (await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { authorization: 'Bearer ' + t.access_token } })).json();
    const prop = (sites.siteEntry || []).find(s => s.siteUrl === PROPRIEDADE);
    if (!prop) {
      console.log('A conta autorizada não vê ' + PROPRIEDADE + ' — nada foi guardado.');
      return acabar(false, 'A conta não tem acesso à propriedade.');
    }
    console.log('Propriedade visível: ' + prop.siteUrl + ' (' + prop.permissionLevel + ')');

    const ok = [
      guardarSegredo('GOOGLE_OAUTH_CLIENT_ID', c.client_id),
      guardarSegredo('GOOGLE_OAUTH_CLIENT_SECRET', c.client_secret),
      guardarSegredo('GSC_REFRESH_TOKEN', t.refresh_token)
    ].every(Boolean);
    acabar(ok, ok ? 'Autorizado e guardado no Worker. Pode fechar esta janela.' : 'Autorizado, mas um segredo falhou — veja o terminal.');
  });
});
setTimeout(() => { console.log('Tempo esgotado (10 min).'); process.exit(2); }, 600000).unref();
