/* hs-inteligencia — o esqueleto seguro (Fase 1).
   Ordem fixa para TODOS os pedidos:
     1. só o prefixo /admin/inteligencia
     2. identidade do Access validada aqui dentro — falha fechado
     3. só depois: API ou ficheiros da interface
   Não há recolha, nem tarefas agendadas, nem escrita nesta fase. */
import { validarAcesso } from './acesso.js';
import { comSeguranca, json, paginaRecusa } from './seguranca.js';
import { lerEstado } from './estado.js';

export const PREFIXO = '/admin/inteligencia';

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
      return json({ erro: 'Método não permitido nesta fase.' }, 405);
    }

    if (p === PREFIXO + '/api/estado') return json(await lerEstado(env, acesso.email));
    if (p.startsWith(PREFIXO + '/api/')) return json({ erro: 'Não encontrado' }, 404);

    return comSeguranca(await env.ASSETS.fetch(request));
  }
};
