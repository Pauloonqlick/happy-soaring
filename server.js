// Servidor estático mínimo para desenvolvimento local (zero dependências).
// Inclui "live reload": vigia os ficheiros e manda o site recarregar sozinho
// quando gravas no CMS. Em produção o site é servido pela Cloudflare Pages —
// nada disto vai para o site publicado (é injetado só por este servidor).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = process.env.PORT || 5173;
const ROOT = process.cwd();

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

// ---- live reload (só dev) ----
const clients = new Set();
const LIVE_RELOAD = `<script>
(function(){ try { var es = new EventSource('/__livereload');
  es.onmessage = function(){ location.reload(); }; } catch(e){} })();
</script>`;

let timer;
function broadcast() {
  clearTimeout(timer);
  timer = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 80);
}
for (const f of ['app.js', 'styles.css', 'index.html']) {
  try { watch(join(ROOT, f), broadcast); } catch {}
}
// vigia a pasta content/ (settings.json + slides/*.json), recursivamente
try { watch(join(ROOT, 'content'), { recursive: true }, broadcast); } catch {}

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);

  if (path === '/__livereload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  try {
    if (path.endsWith('/')) path += 'index.html';
    const filePath = normalize(join(ROOT, path));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

    // injeta o live-reload apenas na página principal do site (não no /admin)
    if (path === '/index.html') {
      let html = await readFile(filePath, 'utf8');
      html = html.replace('</body>', LIVE_RELOAD + '</body>');
      res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache' });
      return res.end(html);
    }

    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
});

server.listen(PORT, () => console.log(`Preview em http://localhost:${PORT}`));
