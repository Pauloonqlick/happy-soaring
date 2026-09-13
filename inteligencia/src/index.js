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
import { executarCicloInspeccao, lerIndexacao, registarPedido } from './inspeccao.js';

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

    /* A ÚNICA ESCRITA: registar que o Paulo pediu indexação no Search Console.
       Além do Access, exige JSON, o cabeçalho próprio do módulo e — se o browser
       o enviar — a mesma origem. Um formulário de outro site não passa. */
    if (p === PREFIXO + '/api/indexacao/pedido') {
      if (request.method !== 'POST') return json({ erro: 'Método não permitido.' }, 405);
      const origem = request.headers.get('Origin');
      if (request.headers.get('X-HS-Inteligencia') !== '1' || (origem && origem !== url.origin) ||
          !String(request.headers.get('Content-Type') || '').startsWith('application/json')) {
        return json({ erro: 'Pedido recusado.' }, 403);
      }
      let corpo;
      try { corpo = await request.json(); } catch (e) { return json({ erro: 'JSON inválido.' }, 400); }
      const caminho = String(corpo?.caminho || '');
      if (!/^\/[a-z0-9\/._-]{0,250}$/i.test(caminho) || caminho.includes('..')) return json({ erro: 'Caminho inválido.' }, 400);
      const agora = Date.now();
      const pedidoEm = corpo?.pedido_em ? Date.parse(corpo.pedido_em) : agora;
      if (Number.isNaN(pedidoEm) || pedidoEm > agora + 5 * 60000 || pedidoEm < agora - 14 * 864e5) {
        return json({ erro: 'Data do pedido inválida: tem de ser dos últimos 14 dias.' }, 400);
      }
      await registarPedido(env.DB, caminho, new Date(pedidoEm).toISOString());
      return json(await lerIndexacao(env.DB));
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
    if (p === PREFIXO + '/api/indexacao') return json(await lerIndexacao(env.DB));

    if (p.startsWith(PREFIXO + '/api/')) return json({ erro: 'Não encontrado' }, 404);

    return comSeguranca(await env.ASSETS.fetch(request));
  },

  /* UMA tarefa agendada (o limite de 5 é da conta), repartida por minuto:
       minuto terminado em 0  → Search Console
       minuto terminado em 4  → inspecção de URL
       os outros              → publicações
     Cada uma tem o orçamento inteiro da sua execução. */
  async scheduled(evento, env, ctx) {
    const minuto = new Date(evento.scheduledTime || Date.now()).getUTCMinutes();
    const vez = minuto % 10 === 0 ? 'search_console' : minuto % 10 === 4 ? 'inspeccao' : 'publicacoes';
    ctx.waitUntil((async () => {
      const nome = 'ciclo_' + vez;
      try {
        const r = vez === 'search_console' ? await executarCicloGsc(env)
          : vez === 'inspeccao' ? await executarCicloInspeccao(env) : await executarCiclo(env);
        console.log(JSON.stringify({ evento: nome, ...r }));
      } catch (e) {
        console.log(JSON.stringify({ evento: nome + '_falhou', erro: String(e && e.message || e).slice(0, 300) }));
      }
    })());
  }
};
