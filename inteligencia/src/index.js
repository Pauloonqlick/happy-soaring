/* hs-inteligencia
   Ordem fixa para TODOS os pedidos HTTP:
     1. só o prefixo /inteligencia
     2. identidade do Access validada aqui dentro — falha fechado
     3. só depois: API ou ficheiros da interface
   A interface só lê. A recolha corre na tarefa agendada, que não passa por
   HTTP e não expõe nada. */
import { validarAcesso } from './acesso.js';
import { comSeguranca, json, paginaRecusa } from './seguranca.js';
import { lerEstado } from './estado.js';
import { executarCiclo, listarPublicacoes, detalhePublicacao } from './publicacoes.js';

export const PREFIXO = '/inteligencia';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p !== PREFIXO && !p.startsWith(PREFIXO + '/')) {
      return comSeguranca(new Response('Não encontrado', { status: 404 }));
    }

    const acesso = await validarAcesso(request, env);
    if (!acesso.ok) {
      console.log(JSON.stringify({ evento: 'acesso_recusado', motivo: acesso.motivo, caminho: p }));
      return paginaRecusa(acesso.estado);
    }

    if (p === PREFIXO) {
      return comSeguranca(new Response(null, { status: 308, headers: { location: PREFIXO + '/' } }));
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ erro: 'Método não permitido.' }, 405);
    }

    if (p === PREFIXO + '/api/estado') return json(await lerEstado(env, acesso.email));

    if (p === PREFIXO + '/api/alteracoes') {
      return json({ publicacoes: await listarPublicacoes(env.DB) });
    }
    const m = p.match(/^\/inteligencia\/api\/alteracoes\/([0-9a-f-]{8,36})$/);
    if (m) {
      const d = await detalhePublicacao(env.DB, m[1]);
      return d ? json(d) : json({ erro: 'Publicação desconhecida' }, 404);
    }

    if (p.startsWith(PREFIXO + '/api/')) return json({ erro: 'Não encontrado' }, 404);

    return comSeguranca(await env.ASSETS.fetch(request));
  },

  async scheduled(evento, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const r = await executarCiclo(env);
        console.log(JSON.stringify({ evento: 'ciclo_publicacoes', ...r }));
      } catch (e) {
        console.log(JSON.stringify({ evento: 'ciclo_publicacoes_falhou', erro: String(e && e.message || e).slice(0, 300) }));
      }
    })());
  }
};
