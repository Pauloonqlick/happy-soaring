/* VALIDAÇÃO DA IDENTIDADE DO CLOUDFLARE ACCESS
   O Access fica à frente da rota e só deixa passar o Paulo. Este módulo
   verifica outra vez, dentro do Worker, em TODOS os pedidos: se a rota
   ficar mal configurada ou o Access for desligado, o Worker recusa na
   mesma. Falha fechado — sem configuração, ninguém entra.

   O token (JWT RS256) chega no cabeçalho Cf-Access-Jwt-Assertion. As
   chaves públicas estão em https://<equipa>/cdn-cgi/access/certs. */

const TTL_CHAVES_MS = 10 * 60 * 1000;
const FOLGA_RELOGIO_S = 60;
const cacheChaves = new Map();   /* por isolate: domínio -> { chaves, em } */

function b64urlParaBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function lerJson(parte) {
  return JSON.parse(new TextDecoder().decode(b64urlParaBytes(parte)));
}

export function origemDaEquipa(dominio) {
  const d = String(dominio || '').trim().replace(/\/+$/, '');
  if (!d) return '';
  return /^https:\/\//.test(d) ? d : 'https://' + d;
}

function tokenDoPedido(request) {
  const h = request.headers.get('Cf-Access-Jwt-Assertion');
  if (h) return h.trim();
  const c = request.headers.get('Cookie') || '';
  const m = c.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? m[1] : '';
}

async function chavesDaEquipa(origem, forcar) {
  const guardado = cacheChaves.get(origem);
  if (!forcar && guardado && Date.now() - guardado.em < TTL_CHAVES_MS) return guardado.chaves;
  const r = await fetch(origem + '/cdn-cgi/access/certs', { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('certs HTTP ' + r.status);
  const j = await r.json();
  const chaves = Array.isArray(j.keys) ? j.keys : [];
  cacheChaves.set(origem, { chaves, em: Date.now() });
  return chaves;
}

export function limparCacheChaves() { cacheChaves.clear(); }

/* Devolve { ok:true, email } ou { ok:false, estado, motivo }.
   O motivo é para registo interno; a resposta ao browser não o detalha. */
export async function validarAcesso(request, env, agoraS = Math.floor(Date.now() / 1000)) {
  const origem = origemDaEquipa(env.ACCESS_TEAM_DOMAIN);
  const aud = String(env.ACCESS_AUD || '').trim();
  const autorizados = String(env.EMAILS_AUTORIZADOS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!origem || !aud || !autorizados.length) {
    return { ok: false, estado: 503, motivo: 'NAO_CONFIGURADO' };
  }

  const token = tokenDoPedido(request);
  if (!token) return { ok: false, estado: 403, motivo: 'SEM_TOKEN' };

  const partes = token.split('.');
  if (partes.length !== 3) return { ok: false, estado: 403, motivo: 'FORMATO' };

  let cab, carga;
  try { cab = lerJson(partes[0]); carga = lerJson(partes[1]); }
  catch (e) { return { ok: false, estado: 403, motivo: 'FORMATO' }; }
  if (cab.alg !== 'RS256' || !cab.kid) return { ok: false, estado: 403, motivo: 'ALGORITMO' };

  let chaves;
  try {
    chaves = await chavesDaEquipa(origem, false);
    if (!chaves.some(k => k.kid === cab.kid)) chaves = await chavesDaEquipa(origem, true);
  } catch (e) {
    return { ok: false, estado: 503, motivo: 'CHAVES_INDISPONIVEIS' };
  }
  const jwk = chaves.find(k => k.kid === cab.kid);
  if (!jwk) return { ok: false, estado: 403, motivo: 'CHAVE_DESCONHECIDA' };

  let valido = false;
  try {
    const chave = await crypto.subtle.importKey(
      'jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    valido = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chave,
      b64urlParaBytes(partes[2]), new TextEncoder().encode(partes[0] + '.' + partes[1]));
  } catch (e) { valido = false; }
  if (!valido) return { ok: false, estado: 403, motivo: 'ASSINATURA' };

  const auds = Array.isArray(carga.aud) ? carga.aud : [carga.aud];
  if (!auds.includes(aud)) return { ok: false, estado: 403, motivo: 'AUDIENCIA' };
  if (carga.iss !== origem) return { ok: false, estado: 403, motivo: 'EMISSOR' };
  if (typeof carga.exp !== 'number' || carga.exp + FOLGA_RELOGIO_S < agoraS) {
    return { ok: false, estado: 403, motivo: 'EXPIRADO' };
  }
  if (typeof carga.nbf === 'number' && carga.nbf - FOLGA_RELOGIO_S > agoraS) {
    return { ok: false, estado: 403, motivo: 'AINDA_NAO_VALIDO' };
  }
  const email = String(carga.email || '').toLowerCase();
  if (!email || !autorizados.includes(email)) return { ok: false, estado: 403, motivo: 'EMAIL' };

  return { ok: true, email };
}
