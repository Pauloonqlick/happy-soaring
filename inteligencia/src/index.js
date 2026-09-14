/* hs-inteligencia
   Ordem fixa para TODOS os pedidos HTTP:
     1. só o prefixo /inteligencia
     2. identidade do Access validada aqui dentro — falha fechado
     3. só depois: API ou ficheiros da interface
   A recolha corre na tarefa agendada, que não passa por HTTP e não expõe nada.
   As escritas da interface são só trabalho humano e conhecimento: decisões,
   pedidos de indexação marcados, factos, contactos, configuração. */
import { validarAcesso } from './acesso.js';
import { comSeguranca, json, paginaRecusa } from './seguranca.js';
import { lerEstado } from './estado.js';
import { executarCiclo, listarPublicacoes, detalhePublicacao } from './publicacoes.js';
import { executarCicloGsc, resumoSearchConsole } from './search-console.js';
import { executarCicloInspeccao, lerIndexacao, registarPedido } from './inspeccao.js';
import { executarCicloAssuntos, lerHoje, lerAssunto, decidirAssunto, lerPacote } from './assuntos.js';
import { executarCicloAvisos, enviarAvisoTeste } from './avisos.js';
import { executarCicloDecisoes, lerAprendizagem, gravarLicao } from './aprendizagem.js';
import { vezDoMinuto } from './agenda.js';
import { executarVigia } from './vigia.js';
import { executarCicloSemana, listarSemanas, lerSemana } from './leitura.js';
import { lerOperacao, lerIndexacaoEvolucao, lerPaginas, lerGeral } from './evolucao.js';
import {
  lerConhecimento, gravarConhecimento, historicoConhecimento, TABELAS_CONHECIMENTO,
  lerContactos, registarContacto, lerConfiguracao, gravarImportancia, gravarPagina
} from './conhecimento.js';

export const PREFIXO = '/inteligencia';
const API = PREFIXO + '/api';

/* Uma escrita só passa com JSON, o cabeçalho próprio do módulo e — se o
   browser a enviar — a mesma origem. Um formulário de outro site não passa. */
function escritaRecusada(request, url) {
  const origem = request.headers.get('Origin');
  return request.headers.get('X-HS-Inteligencia') !== '1' || (origem && origem !== url.origin) ||
    !String(request.headers.get('Content-Type') || '').startsWith('application/json');
}

const resposta = r => r.estado === 200 ? json(r.valor) : json({ erro: r.erro }, r.estado);

async function escrita(request, env, p) {
  let corpo;
  try { corpo = await request.json(); } catch (e) { return json({ erro: 'JSON inválido.' }, 400); }
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return json({ erro: 'JSON inválido.' }, 400);

  if (p === API + '/indexacao/pedido') {
    const caminho = String(corpo.caminho || '');
    if (!/^\/[a-z0-9\/._-]{0,250}$/i.test(caminho) || caminho.includes('..')) return json({ erro: 'Caminho inválido.' }, 400);
    const agora = Date.now();
    const pedidoEm = corpo.pedido_em ? Date.parse(corpo.pedido_em) : agora;
    if (Number.isNaN(pedidoEm) || pedidoEm > agora + 5 * 60000 || pedidoEm < agora - 14 * 864e5) {
      return json({ erro: 'Data do pedido inválida: tem de ser dos últimos 14 dias.' }, 400);
    }
    await registarPedido(env.DB, caminho, new Date(pedidoEm).toISOString());
    return json(await lerIndexacao(env.DB));
  }
  const d = p.match(/^\/inteligencia\/api\/assuntos\/(\d{1,9})\/decisao$/);
  if (d) return resposta(await decidirAssunto(env.DB, Number(d[1]), corpo));
  const k = p.match(/^\/inteligencia\/api\/conhecimento\/([a-z_]+)$/);
  if (k && TABELAS_CONHECIMENTO.includes(k[1])) return resposta(await gravarConhecimento(env.DB, k[1], corpo));
  if (p === API + '/contactos') return resposta(await registarContacto(env.DB, corpo));
  if (p === API + '/configuracao/objectivo') return resposta(await gravarImportancia(env.DB, corpo));
  if (p === API + '/configuracao/pagina') return resposta(await gravarPagina(env.DB, corpo));
  if (p === API + '/avisos/teste') return resposta(await enviarAvisoTeste(env));
  if (p === API + '/aprendizagem/licao') return resposta(await gravarLicao(env.DB, corpo, { origem: 'PAULO' }));
  return json({ erro: 'Não encontrado' }, 404);
}

async function leitura(env, p, url, email) {
  if (p === API + '/estado') return json(await lerEstado(env, email));
  if (p === API + '/alteracoes') return json({ publicacoes: await listarPublicacoes(env.DB) });
  const m = p.match(/^\/inteligencia\/api\/alteracoes\/([0-9a-f-]{8,36})$/);
  if (m) {
    const d = await detalhePublicacao(env.DB, m[1]);
    return d ? json(d) : json({ erro: 'Publicação desconhecida' }, 404);
  }
  if (p === API + '/search-console') return json(await resumoSearchConsole(env.DB));
  if (p === API + '/indexacao') return json(await lerIndexacao(env.DB));
  if (p === API + '/hoje') {
    const desde = url.searchParams.get('desde');
    return json(await lerHoje(env.DB, { desde: desde && !Number.isNaN(Date.parse(desde)) ? new Date(desde).toISOString() : null }));
  }
  const a = p.match(/^\/inteligencia\/api\/assuntos\/(\d{1,9})$/);
  if (a) {
    const v = await lerAssunto(env.DB, Number(a[1]));
    return v ? json(v) : json({ erro: 'Assunto desconhecido' }, 404);
  }
  const pc = p.match(/^\/inteligencia\/api\/pacotes\/(\d{1,9})$/);
  if (pc) {
    const v = await lerPacote(env.DB, Number(pc[1]));
    return v ? json(v) : json({ erro: 'Pacote desconhecido' }, 404);
  }
  if (p === API + '/conhecimento') return json(await lerConhecimento(env.DB));
  const h = p.match(/^\/inteligencia\/api\/conhecimento\/([a-z_]+)\/(\d{1,9})\/historico$/);
  if (h) {
    const v = await historicoConhecimento(env.DB, h[1], Number(h[2]));
    return v ? json({ versoes: v }) : json({ erro: 'Registo desconhecido' }, 404);
  }
  if (p === API + '/contactos') return json(await lerContactos(env.DB));
  if (p === API + '/configuracao') return json(await lerConfiguracao(env.DB));
  if (p === API + '/aprendizagem') return json(await lerAprendizagem(env.DB));
  if (p === API + '/evolucao/operacao') return json(await lerOperacao(env));
  if (p === API + '/evolucao/indexacao') return json(await lerIndexacaoEvolucao(env.DB));
  if (p === API + '/evolucao/paginas') return json(await lerPaginas(env.DB, { dias: [7, 28, 90].includes(Number(url.searchParams.get('dias'))) ? Number(url.searchParams.get('dias')) : 28 }));
  if (p === API + '/evolucao/geral') return json(await lerGeral(env.DB));
  if (p === API + '/semanas') return json({ semanas: await listarSemanas(env.DB) });
  const sm = p.match(/^\/inteligencia\/api\/semanas\/(\d{4}-\d{2}-\d{2})$/);
  if (sm) {
    const v = await lerSemana(env.DB, sm[1]);
    return v ? json(v) : json({ erro: 'Semana sem revista' }, 404);
  }
  return null;
}

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

    if (request.method === 'POST' && p.startsWith(API + '/')) {
      if (escritaRecusada(request, url)) return json({ erro: 'Pedido recusado.' }, 403);
      return escrita(request, env, p);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ erro: 'Método não permitido.' }, 405);
    }

    if (p.startsWith(API + '/')) {
      return (await leitura(env, p, url, acesso.email)) || json({ erro: 'Não encontrado' }, 404);
    }

    return comSeguranca(await env.ASSETS.fetch(request));
  },

  /* UMA tarefa agendada (o limite de 5 é da conta), repartida por minuto:
       minuto terminado em 0          → Search Console
       minuto terminado em 4          → inspecção de URL
       minutos 18, 38 e 58            → assuntos (detecção e avaliações)
       minuto 08 de cada hora         → avisos críticos por email
       minutos 28 e 48                → decisões automáticas
       os outros                      → publicações
     Cada uma tem o orçamento inteiro da sua execução. */
  async scheduled(evento, env, ctx) {
    const minuto = new Date(evento.scheduledTime || Date.now()).getUTCMinutes();
    const vez = vezDoMinuto(minuto);
    ctx.waitUntil((async () => {
      const nome = 'ciclo_' + vez;
      const inicio = new Date();
      /* Cada execução regista-se ANTES de começar e fecha o registo no fim (14 dias).
         Se for cortada a meio, o registo fica aberto e o vigia dá por isso.
         O registo nunca impede a tarefa. */
      let id = null;
      try {
        const r = await env.DB.prepare('INSERT INTO execucoes (vez, inicio) VALUES (?, ?) RETURNING id').bind(vez, inicio.toISOString()).first();
        id = r?.id ?? null;
      } catch (e) { id = null; }
      const registar = async (ok, resumo, erro) => {
        try {
          const valores = [Date.now() - inicio.getTime(), ok ? 1 : 0, resumo ? JSON.stringify(resumo).slice(0, 1000) : null, erro];
          const stmts = [id != null
            ? env.DB.prepare('UPDATE execucoes SET duracao_ms = ?, ok = ?, resumo = ?, erro = ? WHERE id = ?').bind(...valores, id)
            : env.DB.prepare('INSERT INTO execucoes (duracao_ms, ok, resumo, erro, vez, inicio) VALUES (?, ?, ?, ?, ?, ?)').bind(...valores, vez, inicio.toISOString())];
          if (vez === 'search_console') {
            stmts.push(env.DB.prepare("DELETE FROM execucoes WHERE inicio < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days')"));
          }
          await env.DB.batch(stmts);
        } catch (e) { /* sem registo: não faz mal */ }
      };
      try {
        const r = vez === 'search_console' ? await executarCicloGsc(env)
          : vez === 'inspeccao' ? await executarCicloInspeccao(env)
          : vez === 'assuntos' ? await executarCicloAssuntos(env)
          : vez === 'avisos' ? await executarCicloAvisos(env)
          : vez === 'decisoes' ? await executarCicloDecisoes(env) : await executarCiclo(env);
        if (vez === 'search_console') {
          /* o vigia vai na execução mais leve; se falhar, o Search Console não fica por registar */
          try { r.vigia = await executarVigia(env.DB); } catch (e) { r.vigia = { erro: String(e && e.message || e).slice(0, 200) }; }
          try { r.semana = await executarCicloSemana(env.DB); } catch (e) { r.semana = { erro: String(e && e.message || e).slice(0, 200) }; }
        }
        console.log(JSON.stringify({ evento: nome, ...r }));
        await registar(true, r, null);
      } catch (e) {
        const erro = String(e && e.message || e).slice(0, 300);
        console.log(JSON.stringify({ evento: nome + '_falhou', erro }));
        await registar(false, null, erro);
      }
    })());
  }
};
