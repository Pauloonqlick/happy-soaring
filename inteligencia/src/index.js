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
import { executarCicloGsc, resumoSearchConsole } from './search-console.js';

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

    if (p === PREFIXO + '/api/search-console') return json(await resumoSearchConsole(env.DB));

    if (p.startsWith(PREFIXO + '/api/')) return json({ erro: 'Não encontrado' }, 404);

    return comSeguranca(await env.ASSETS.fetch(request));
  },

  /* UMA tarefa agendada (o limite de 5 é da conta), repartida por minuto:
     aos minutos múltiplos de 10 é a vez do Search Console; nos outros, das
     publicações. Cada uma tem o orçamento inteiro da sua execução. */
  async scheduled(evento, env, ctx) {
    const minuto = new Date(evento.scheduledTime || Date.now()).getUTCMinutes();
    const vezDoGsc = minuto % 10 === 0;
    ctx.waitUntil((async () => {
      const nome = vezDoGsc ? 'ciclo_search_console' : 'ciclo_publicacoes';
      try {
        const r = vezDoGsc ? await executarCicloGsc(env) : await executarCiclo(env);
        console.log(JSON.stringify({ evento: nome, ...r }));
      } catch (e) {
        console.log(JSON.stringify({ evento: nome + '_falhou', erro: String(e && e.message || e).slice(0, 300) }));
      }
    })());
  }
};
