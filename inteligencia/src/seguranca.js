/* Cabeçalhos de todas as respostas do módulo.
   A interface não carrega nada de terceiros: só do próprio domínio
   (incluindo o /tema.css do site, para a identidade ficar sincronizada). */
export const CABECALHOS_SEGURANCA = {
  'Content-Security-Policy': [
    "default-src 'self'", "script-src 'self'", "style-src 'self'",
    "img-src 'self' data:", "font-src 'self'", "connect-src 'self'",
    "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store'
};

export function comSeguranca(resposta) {
  const r = new Response(resposta.body, resposta);
  for (const [k, v] of Object.entries(CABECALHOS_SEGURANCA)) r.headers.set(k, v);
  return r;
}

export function json(dados, estado = 200) {
  return comSeguranca(new Response(JSON.stringify(dados, null, 2), {
    status: estado, headers: { 'content-type': 'application/json; charset=utf-8' }
  }));
}

export function paginaRecusa(estado) {
  const titulo = estado === 503 ? 'Módulo por configurar' : 'Acesso recusado';
  const texto = estado === 503
    ? 'O acesso privado ainda não está configurado. Nada é servido até estar.'
    : 'Esta área é privada.';
  return comSeguranca(new Response(
    '<!doctype html><html lang="pt"><meta charset="utf-8"><title>' + titulo +
    '</title><p>' + texto + '</p></html>',
    { status: estado, headers: { 'content-type': 'text/html; charset=utf-8' } }));
}
