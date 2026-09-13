/* AUTORIZAÇÃO DO SEARCH CONSOLE — corre-se UMA vez.
   Fluxo OAuth de aplicação instalada (loopback + PKCE), âmbito só de leitura.

   Lê:      C:\Users\Paulo Pereira\credenciais\gsc-oauth-client.json
   Escreve: C:\Users\Paulo Pereira\credenciais\gsc-token.json

   NADA DE SEGREDOS NO ECRÃ: nem o client_id, nem a chave, nem o token.
   O endereço de autorização contém o client_id, por isso também não se
   imprime — abre-se directamente no browser. */
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const PASTA = 'C:/Users/Paulo Pereira/credenciais';
const CLIENTE = PASTA + '/gsc-oauth-client.json';
const TOKEN = PASTA + '/gsc-token.json';
const AMBITO = 'https://www.googleapis.com/auth/webmasters.readonly';

const { installed: c } = JSON.parse(fs.readFileSync(CLIENTE, 'utf8'));
const b64url = (b) => b.toString('base64url');
const verificador = b64url(crypto.randomBytes(48));
const desafio = b64url(crypto.createHash('sha256').update(verificador).digest());
const estado = b64url(crypto.randomBytes(16));

const servidor = http.createServer();
servidor.listen(0, '127.0.0.1', () => {
  const porta = servidor.address().port;
  const retorno = 'http://127.0.0.1:' + porta;
  const url = c.auth_uri + '?' + new URLSearchParams({
    client_id: c.client_id, redirect_uri: retorno, response_type: 'code',
    scope: AMBITO, access_type: 'offline', prompt: 'consent',
    code_challenge: desafio, code_challenge_method: 'S256', state: estado,
    login_hint: 'paulo.pereira@happysoaring.com'
  });
  spawn('rundll32', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' }).unref();
  console.log('Browser aberto. À espera do clique em «Permitir»…');

  servidor.on('request', async (req, res) => {
    const q = new URL(req.url, retorno).searchParams;
    if (!q.has('code') && !q.has('error')) { res.writeHead(204).end(); return; }
    const acaba = (ok, txt) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        .end('<p style="font:18px system-ui;margin:3em">' + txt + '</p>');
      servidor.close();
      if (!ok) process.exitCode = 1;
    };
    if (q.get('error')) { console.log('Recusado: ' + q.get('error')); return acaba(false, 'Autorização recusada.'); }
    if (q.get('state') !== estado) { console.log('state não bate — ignorado'); return acaba(false, 'Pedido inválido.'); }

    const r = await fetch(c.token_uri, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: q.get('code'), client_id: c.client_id, client_secret: c.client_secret,
        redirect_uri: retorno, grant_type: 'authorization_code', code_verifier: verificador
      })
    });
    const t = await r.json();
    if (!r.ok || !t.refresh_token) {
      console.log('Troca falhou: HTTP ' + r.status + ' ' + (t.error || '') + ' ' + (t.error_description || ''));
      return acaba(false, 'Falhou — pode fechar esta janela.');
    }
    fs.writeFileSync(TOKEN, JSON.stringify({
      refresh_token: t.refresh_token, scope: t.scope, obtido: new Date().toISOString()
    }, null, 2));
    console.log('Autorizado. Âmbito: ' + t.scope);
    acaba(true, 'Autorizado. Pode fechar esta janela e voltar à conversa.');
  });
});
setTimeout(() => { console.log('Tempo esgotado (10 min).'); process.exit(2); }, 600000).unref();
