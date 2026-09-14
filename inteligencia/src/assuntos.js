/* ASSUNTOS, PORTA «VALE A PENA AGIR AGORA?» E O ECRÃ «HOJE»

   DETETAR → PORTA → PROPOSTO → DECIDIDO → PUBLICADO → RASTREIO POSTERIOR
   → EM OBSERVAÇÃO → AVALIADO → FECHADO

   A detecção (tarefa agendada) lê só observações — inspecções do Google, o
   sitemap de produção, o Search Console — e grava os assuntos activos. A
   porta, a prioridade e o «Hoje» calculam-se ao ler: uma decisão do Paulo, um
   facto ou uma decisão activa nova contam logo, sem esperar pela tarefa.

   Esta fase cobre os sinais fortes: indexação, rastreio e estado técnico que
   o Google reporta. O que o módulo ainda não verifica diz-se às claras.
   Uma limitação de evidência nunca é um assunto. */
import { caminhosDoSitemap } from './publicacoes.js';
import { lerIndexacao, NOTA_RASTREIO } from './inspeccao.js';
import { incidentesParaHoje } from './vigia.js';
import { frasesDoDia, lerDadosDoDia, lerSemana } from './leitura.js';
import { resultadosDasLicoes } from './aprendizagem.js';

export const ORCAMENTO_ASSUNTOS = { pedidos: 20, consultas: 30 };
export const DIAS_RASTREIO_ESPERADO = 7;       /* referência: alteração sem rastreio posterior */
export const DIAS_OBSERVACAO_TECNICA = 14;     /* referência, não regra rígida */
const MAX_VERIFICACOES_HTTP = 10;
const DIA = 864e5;
const t = s => (s ? Date.parse(s) : NaN);
const depois = (a, b) => t(a) > t(b);
const somar = (iso, dias) => new Date(t(iso) + dias * DIA).toISOString();

export const AINDA_NAO_VERIFICADO = [
  'títulos e descrições das páginas',
  'hreflang e diferenças entre versões linguísticas',
  'ligações internas',
  'ganhos, perdas e pesquisas novas no Search Console',
  'SERP, concorrência e respostas de IA'
];

/* ------------------------------------------------------ tipos de assunto -- */

const ERROS_CRITICOS = new Set(['SERVER_ERROR', 'ACCESS_DENIED', 'ACCESS_FORBIDDEN', 'BLOCKED_4XX']);
const ERROS_OBTENCAO = {
  SERVER_ERROR: 'o servidor respondeu com erro quando o Google tentou ler a página',
  ACCESS_DENIED: 'o acesso foi recusado ao Google (401)',
  ACCESS_FORBIDDEN: 'o acesso foi proibido ao Google (403)',
  BLOCKED_4XX: 'a página respondeu ao Google com um erro 4xx',
  NOT_FOUND: 'o Google recebeu «página não encontrada» (404)',
  SOFT_404: 'o Google considera a página vazia ou de erro, apesar de responder normalmente',
  REDIRECT_ERROR: 'o redireccionamento tem um erro ou está em cadeia',
  INTERNAL_CRAWL_ERROR: 'houve um erro interno do Google ao rastrear',
  INVALID_URL: 'o Google considera a URL inválida'
};

export const TIPOS = {
  BLOQUEADA_ROBOTS: {
    titulo: 'Página bloqueada pelo robots.txt', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['ALTA', 'estado técnico confirmado pela inspecção do Google'],
    diagnostico: () => 'Hipótese: uma regra do robots.txt impede o Google de ler a página. Falta confirmar se é intencional.',
    solucao: () => 'Correcção técnica: retirar a regra do robots.txt que bloqueia esta página, se ela deve aparecer na pesquisa.',
    nao_fazer: ['Não pedir indexação antes de a correcção estar publicada.'],
    riscos: ['Se o bloqueio for intencional, retirá-lo expõe a página na pesquisa.'],
    medicao: 'Estado do robots.txt na primeira inspecção depois de um rastreio posterior à publicação.'
  },
  BLOQUEADA_NOINDEX: {
    titulo: 'Página marcada para não ser indexada', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['ALTA', 'estado técnico confirmado pela inspecção do Google'],
    diagnostico: ev => 'Hipótese: a página tem uma indicação «noindex» ' +
      (ev.estado_indexacao === 'BLOCKED_BY_HTTP_HEADER' ? 'no cabeçalho HTTP' : 'no próprio HTML') + '. Falta confirmar se é intencional.',
    solucao: () => 'Correcção técnica: retirar o «noindex», se a página deve aparecer na pesquisa.',
    nao_fazer: ['Não pedir indexação antes de a correcção estar publicada.'],
    riscos: ['Se a página devia estar fora da pesquisa, retirar o «noindex» expõe-na.'],
    medicao: 'Estado de indexação na primeira inspecção depois de um rastreio posterior à publicação.'
  },
  ERRO_OBTENCAO: {
    titulo: 'O Google não conseguiu obter a página', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['ALTA', 'resposta registada pela inspecção do Google; a causa ainda não'],
    diagnostico: ev => 'Observado: ' + (ERROS_OBTENCAO[ev.estado_obtencao] || 'estado ' + ev.estado_obtencao) + '. A causa está por confirmar.',
    solucao: () => 'Correcção técnica: verificar a resposta da página em produção e corrigir a causa.',
    nao_fazer: ['Não pedir indexação enquanto a página não responder correctamente.'],
    riscos: ['Um erro intermitente pode já não se repetir: confirmar antes de mexer.'],
    medicao: 'Estado da obtenção na primeira inspecção depois de um rastreio posterior à publicação.'
  },
  DESINDEXADA: {
    titulo: 'Página deixou de estar indexada', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'MEDIO',
    confianca: ['MEDIA', 'a mudança de estado está confirmada pela inspecção; a causa não'],
    diagnostico: () => 'Observado: numa inspecção anterior a página estava indexada e na última já não está. ' +
      'A causa não está confirmada — ver cobertura, canónico e alterações recentes.',
    solucao: () => 'Investigar a causa com a evidência desta ficha e, depois de a perceber, corrigir e pedir indexação.',
    nao_fazer: ['Não fazer várias alterações ao mesmo tempo: o resultado deixaria de se poder avaliar.'],
    riscos: ['Pode ser uma oscilação do Google: a inspecção seguinte confirma ou desmente.'],
    medicao: 'Estado de indexação nas inspecções seguintes a um rastreio posterior.'
  },
  CANONICO_DIFERENTE: {
    titulo: 'O Google escolheu outro canónico', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['MEDIA', 'escolha do Google confirmada pela inspecção; a razão não'],
    diagnostico: ev => 'Hipótese: o Google considera ' + ev.canonico_google + ' a versão principal desta página, ' +
      'em vez do canónico declarado. Pode ser duplicado ou uma questão de versões linguísticas.',
    solucao: () => 'Correcção técnica: rever o canónico declarado, as ligações internas e o sitemap, para que apontem todos para a mesma versão.',
    nao_fazer: ['Não mudar o canónico sem confirmar qual é a versão certa.',
      'Duas versões linguísticas diferentes não são duplicado por si só.'],
    riscos: ['Apontar o canónico para a versão errada retira a página certa da pesquisa.'],
    medicao: 'Canónico escolhido pelo Google na primeira inspecção depois de um rastreio posterior.'
  },
  NUNCA_RASTREADA: {
    titulo: 'Página que o Google ainda não rastreou', categoria: 'Indexação e rastreio', acao: 'OPERACIONAL', esforco: 'BAIXO',
    confianca: ['ALTA', 'estado confirmado pela inspecção do Google'],
    diagnostico: ev => 'Observado: o Google ainda não leu esta página' + (ev.pagina_nova ? ' (página nova).' : '.'),
    solucao: () => 'Pedir indexação no Search Console.',
    nao_fazer: ['Não repetir o pedido antes de uma inspecção nova.'],
    riscos: [],
    medicao: 'Data do primeiro rastreio.'
  },
  RASTREADA_NAO_INDEXADA: {
    titulo: 'Página rastreada e não indexada', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'MEDIO',
    confianca: ['BAIXA', 'o estado está confirmado; a razão do Google não é conhecida'],
    diagnostico: () => 'Hipótese: o Google leu a página e decidiu não a incluir, por a considerar pouco distinta ou pouco útil face a outras. Não está confirmado.',
    solucao: () => 'Rever a página: comparar com as páginas do site que o Google indexa para o mesmo assunto e decidir se vale a pena melhorar, consolidar ou deixar como está.',
    falta: 'perceber que página o Google prefere para as mesmas pesquisas',
    nao_fazer: ['Não pedir indexação repetidamente — não muda a decisão do Google.', 'Não criar páginas novas para compensar.'],
    riscos: ['Alterar o conteúdo sem hipótese clara torna o resultado impossível de avaliar.'],
    medicao: 'Estado de indexação nas inspecções seguintes a um rastreio posterior.'
  },
  DADOS_ESTRUTURADOS_INVALIDOS: {
    titulo: 'Dados estruturados com erros', categoria: 'Apresentação e técnica', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['ALTA', 'erro reportado pela validação do Google'],
    diagnostico: ev => 'Observado: o Google reporta erros nos dados estruturados' +
      (ev.erros_dados_estruturados ? ': ' + ev.erros_dados_estruturados.join('; ')
        : (ev.tipos_resultado && ev.tipos_resultado.length ? ' (' + ev.tipos_resultado.join(', ') + '); o detalhe chega na próxima inspecção' : '')) +
      '. O resultado enriquecido pode não aparecer.',
    solucao: () => 'Correcção técnica: corrigir os dados estruturados que o Google indica — ou retirar o tipo, se o campo em falta não puder ser preenchido com informação verdadeira.',
    nao_fazer: ['Não acrescentar tipos novos de dados estruturados na mesma alteração.',
      'Não preencher campos em falta com informação inventada (preços, avaliações, datas).'],
    riscos: [],
    medicao: 'Veredicto dos resultados enriquecidos depois de um rastreio posterior.'
  },
  ALTERACAO_SEM_RASTREIO: {
    titulo: 'Alteração sem rastreio posterior', categoria: 'Indexação e rastreio', acao: 'OPERACIONAL', esforco: 'BAIXO',
    confianca: ['ALTA', 'datas da publicação e do último rastreio conhecidas'],
    diagnostico: ev => 'Observado: a página mudou em ' + (ev.alteracao_em || '').slice(0, 10) +
      ' e o Google ainda não a voltou a rastrear, mais de ' + DIAS_RASTREIO_ESPERADO + ' dias depois.',
    solucao: () => 'Pedir indexação no Search Console.',
    nao_fazer: ['Não começar a medir o efeito da alteração antes do rastreio posterior.'],
    riscos: [],
    medicao: 'Data do rastreio posterior.'
  },
  URL_FORA_DO_SITEMAP: {
    titulo: 'URL fora do sitemap a receber impressões', categoria: 'Indexação e rastreio', acao: 'DECISAO', esforco: 'BAIXO',
    confianca: ['MEDIA', 'impressões confirmadas no Search Console; o motivo por confirmar'],
    diagnostico: ev => ev.http == null ? 'O estado actual desta URL ainda não foi verificado.'
      : [301, 308].includes(ev.http) ? 'Observado: já redirecciona permanentemente para ' + (ev.destino || '?') + '. O Google costuma actualizar sozinho.'
      : [302, 303, 307].includes(ev.http) ? 'Observado: redirecciona temporariamente (' + ev.http + ') para ' + (ev.destino || '?') + '.'
      : ev.http === 200 ? 'Hipótese: a URL continua publicada e indexada sem estar no sitemap.'
      : [404, 410].includes(ev.http) ? 'Hipótese: é uma URL antiga que deixou de existir e não redirecciona.'
      : 'Observado: a URL responde ' + ev.http + '.',
    solucao: ev => [301, 308].includes(ev.http) ? 'Não fazer nada agora; rever dentro de 28 dias.'
      : ev.http === 200 ? 'Decidir: acrescentar ao sitemap, redireccionar para a página certa, ou retirar.'
      : 'Correcção técnica: redireccionar (301) para a página actual equivalente, se existir.',
    nao_fazer: ['Não redireccionar para a página inicial só para aproveitar as impressões.'],
    riscos: ['Um redireccionamento para uma página com outra intenção perde as pesquisas que a URL tinha.'],
    medicao: 'Impressões da URL antiga e da página de destino no Search Console, nas semanas seguintes.'
  }
};

/* ------------------------------------------------------------- detecção -- */

const naoIndexada = i => !!(i && i.veredicto && i.veredicto !== 'PASS' && i.veredicto !== 'VERDICT_UNSPECIFIED');
const bloqueioRobots = i => i && (i.estado_robots === 'DISALLOWED' || i.estado_obtencao === 'BLOCKED_ROBOTS_TXT' || i.estado_indexacao === 'BLOCKED_BY_ROBOTS_TXT');
const bloqueioNoindex = i => i && (i.estado_indexacao === 'BLOCKED_BY_META_TAG' || i.estado_indexacao === 'BLOCKED_BY_HTTP_HEADER');
const erroObtencao = i => i && i.estado_obtencao && ERROS_OBTENCAO[i.estado_obtencao];
const canonicoDiferente = i => !!(i && i.canonico_google && i.canonico_declarado && i.canonico_google !== i.canonico_declarado);
const ricosComErro = i => { try { return JSON.parse(i.resultados_ricos || 'null')?.veredicto === 'FAIL'; } catch (e) { return false; } };

function resumoInspeccao(i) {
  if (!i) return null;
  let tipos = null, problemas = null;
  try {
    const r = JSON.parse(i.resultados_ricos || 'null');
    tipos = r?.tipos || null;
    problemas = r?.problemas?.length ? r.problemas : null;
  } catch (e) { tipos = null; }
  return {
    inspeccionado_em: i.inspeccionado_em, veredicto: i.veredicto, cobertura: i.cobertura, estado_obtencao: i.estado_obtencao,
    estado_indexacao: i.estado_indexacao, estado_robots: i.estado_robots, ultimo_rastreio: i.ultimo_rastreio,
    canonico_google: i.canonico_google, canonico_declarado: i.canonico_declarado, tipos_resultado: tipos,
    ...(problemas ? { erros_dados_estruturados: problemas } : {})
  };
}

/* Os assuntos que as observações mostram agora. Puro.
     universo        caminhos do sitemap de produção
     inspecoes       Map caminho → [última, anterior] inspecções sem erro
     fila            páginas da fila de indexação (lerIndexacao)
     urlsGsc         [{url, impressoes, semanas}] das páginas com impressões nos últimos 28 dias
     http            Map url → {http, destino} das URLs verificadas agora              */
export function detectarAssuntos({ universo, inspecoes, fila = [], urlsGsc = [], http = new Map(), agora }) {
  const out = [];
  const pôr = (tipo, caminho, critico, confirmado, evidencia, chave = tipo + ' ' + caminho) =>
    out.push({ chave, tipo, caminho, critico: critico ? 1 : 0, confirmado: confirmado ? 1 : 0, evidencia });
  const noUniverso = new Set(universo);
  const F = new Map(fila.map(p => [p.caminho, p]));

  for (const c of universo) {
    const [u, p] = inspecoes.get(c) || [];
    if (!u) continue;                                       /* sem inspecção: limitação, não assunto */
    const ev = { ...resumoInspeccao(u), anterior: resumoInspeccao(p) };
    const repetido = teste => !!(p && teste(p));
    let criticoNaPagina = false;

    if (bloqueioRobots(u)) { pôr('BLOQUEADA_ROBOTS', c, true, true, ev); criticoNaPagina = true; }
    else if (bloqueioNoindex(u)) { pôr('BLOQUEADA_NOINDEX', c, true, true, ev); criticoNaPagina = true; }
    else if (erroObtencao(u)) {
      const critico = ERROS_CRITICOS.has(u.estado_obtencao);
      pôr('ERRO_OBTENCAO', c, critico, critico || repetido(erroObtencao), ev);
      criticoNaPagina = critico;
    }

    if (!criticoNaPagina && naoIndexada(u)) {
      if (p && p.veredicto === 'PASS') pôr('DESINDEXADA', c, true, true, ev);
      else if (canonicoDiferente(u)) pôr('CANONICO_DIFERENTE', c, false, repetido(canonicoDiferente), ev);
      else if (!u.ultimo_rastreio) {
        pôr('NUNCA_RASTREADA', c, false, true, { ...ev, pagina_nova: F.get(c)?.ultima_alteracao?.tipo === 'nova' });
      } else if (!erroObtencao(u)) {
        pôr('RASTREADA_NAO_INDEXADA', c, false, repetido(i => naoIndexada(i) && !!i.ultimo_rastreio), ev);
      }
    } else if (criticoNaPagina && p && p.veredicto === 'PASS' && naoIndexada(u)) {
      out[out.length - 1].evidencia.deixou_de_estar_indexada = true;
    }

    if (ricosComErro(u)) pôr('DADOS_ESTRUTURADOS_INVALIDOS', c, false, true, ev);

    const f = F.get(c);
    if (f && f.ultima_alteracao && (f.estado === 'PENDENTE' || f.estado === 'ULTRAPASSADO') &&
        t(agora) - t(f.ultima_alteracao.em) > DIAS_RASTREIO_ESPERADO * DIA) {
      pôr('ALTERACAO_SEM_RASTREIO', c, false, true, {
        alteracao_em: f.ultima_alteracao.em, tipo_alteracao: f.ultima_alteracao.tipo, publicacao: f.ultima_alteracao.publicacao,
        ultimo_rastreio: f.ultimo_rastreio, ultima_inspeccao: f.ultima_inspeccao, pedido_em: f.pedido_em
      });
    }
  }

  for (const g of urlsGsc) {
    let u;
    try { u = new URL(g.url); } catch (e) { continue; }
    if (!/(^|\.)happysoaring\.com$/i.test(u.hostname)) continue;
    const apex = u.hostname.toLowerCase() === 'happysoaring.com' && u.protocol === 'https:';
    if (apex && noUniverso.has(u.pathname) && !u.search) continue;
    const caminho = apex ? u.pathname + u.search : g.url;
    const h = http.get(g.url) || {};
    pôr('URL_FORA_DO_SITEMAP', caminho, false, g.semanas >= 2, {
      url: g.url, impressoes_28d: g.impressoes, semanas_com_impressoes: g.semanas,
      http: h.http ?? null, destino: h.destino ?? null, verificado_em: h.http != null ? String(agora).slice(0, 10) : null
    }, 'URL_FORA_DO_SITEMAP ' + g.url);
  }
  return out;
}

/* Um pacote publicado, com rastreio posterior, avaliado pela mudança de estado.
   Nunca se atribui causa: diz-se «melhoria observada depois da alteração». */
export function avaliarPacote(p, agora, { criticoDepois = false } = {}) {
  const pub = t(p.publicado_em), R = t(p.ultimo_rastreio), I = t(p.ultima_inspeccao_em), res = t(p.resolvido_em);
  if (Number.isNaN(pub)) return null;
  const confusao = !!(p.alt_deployment_id && p.alt_deployment_id !== p.deployment_id && t(p.ultima_alteracao_em) > pub);
  const ev = {
    publicado_em: p.publicado_em, rastreio_posterior: R > pub ? p.ultimo_rastreio : null, ultima_inspeccao: p.ultima_inspeccao_em,
    resolvido_em: p.resolvido_em || null, alteracao_nova_durante_observacao: confusao ? p.ultima_alteracao_em : null
  };
  if (!Number.isNaN(res) && res <= pub) {
    return { resultado: 'INCONCLUSIVO', evidencia: { ...ev, razao: 'O problema já tinha desaparecido antes de a alteração ser publicada.' } };
  }
  if (!(R > pub)) return null;                            /* sem rastreio posterior ainda não se avalia */
  if (criticoDepois) {
    return { resultado: 'PIOROU', evidencia: { ...ev, razao: 'Apareceu um problema crítico nesta página depois da publicação.' } };
  }
  if (!Number.isNaN(res) && res > pub) {
    return confusao
      ? { resultado: 'INCONCLUSIVO', evidencia: { ...ev, razao: 'O problema desapareceu, mas houve outra alteração durante a observação.' } }
      : { resultado: 'MELHORIA_OBSERVADA', evidencia: { ...ev, razao: 'Depois do rastreio posterior, a inspecção já não mostra o problema. Melhoria observada depois da alteração — não se atribui causa.' } };
  }
  if (t(agora) - R > DIAS_OBSERVACAO_TECNICA * DIA && I > R) {
    return confusao
      ? { resultado: 'INCONCLUSIVO', evidencia: { ...ev, razao: 'O problema mantém-se e houve outra alteração durante a observação.' } }
      : { resultado: 'SEM_EFEITO_CLARO', evidencia: { ...ev, razao: 'Mais de ' + DIAS_OBSERVACAO_TECNICA + ' dias depois do rastreio posterior, a inspecção ainda mostra o problema.' } };
  }
  return null;
}

/* ---------------------------------------------------------------- porta -- */

const prefixo = (caminho, p) => !p || String(caminho).startsWith(p);

/* As seis perguntas, por ordem. A primeira que trava decide a saída. Puro. */
export function aplicarPorta(a, c) {
  const def = TIPOS[a.tipo];
  const passos = [];
  let saida = null, razao = null, revisao = null;
  const travar = (s, r, rev = null) => { if (!saida) { saida = s; razao = r; revisao = rev; } };

  /* 1 */
  if (a.critico || a.confirmado) passos.push(['Há evidência suficiente?', a.critico ? 'Sim — evento técnico grave, não espera confirmação.' : 'Sim — confirmado.']);
  else {
    const r = a.tipo === 'URL_FORA_DO_SITEMAP' ? 'Ainda não — falta ver impressões em pelo menos 2 semanas.' : 'Ainda não — falta confirmar na próxima inspecção.';
    passos.push(['Há evidência suficiente?', r]);
    travar('AGUARDAR', r);
  }

  /* 2 */
  if (a.tipo === 'ALTERACAO_SEM_RASTREIO' || a.tipo === 'NUNCA_RASTREADA') passos.push(['Houve rastreio posterior à última alteração?', 'É esta a pergunta do assunto.']);
  else if (c.episodio) {
    const r = 'Não — a página mudou em ' + String(c.episodio.em).slice(0, 10) + ' e o Google ainda não a rastreou; o estado observado pode ser da versão anterior.';
    passos.push(['Houve rastreio posterior à última alteração?', a.critico ? r + ' É grave: não espera.' : r]);
    if (!a.critico) travar('AGUARDAR', 'À espera do rastreio posterior à alteração de ' + String(c.episodio.em).slice(0, 10) + '.');
  } else passos.push(['Houve rastreio posterior à última alteração?', 'Sim, ou a página não mudou desde a última inspecção.']);

  /* 3 */
  if (c.emObservacao) {
    passos.push(['Já está em observação?', 'Sim — ' + c.emObservacao + '.']);
    travar('AGUARDAR', 'Esta página já está em observação: ' + c.emObservacao + '.');
  } else passos.push(['Já está em observação?', 'Não.']);

  /* 4 */
  if (c.hipotese) {
    passos.push(['Há bloqueio ou decisão anterior?', 'Hipótese eliminada: ' + c.hipotese.hipotese]);
    travar('NAO_AGIR', 'Retirado — hipótese eliminada: ' + c.hipotese.hipotese);
  } else if (c.bloqueio) {
    passos.push(['Há bloqueio ou decisão anterior?', 'Decisão activa: ' + c.bloqueio.titulo]);
    travar('NAO_AGIR', 'Bloqueado pela decisão activa «' + c.bloqueio.titulo + '».');
  } else if (c.decisao && c.decisao.decisao === 'IGNORAR') {
    passos.push(['Há bloqueio ou decisão anterior?', 'Ignorado pelo Paulo: ' + (c.decisao.razao || '')]);
    travar('NAO_AGIR', 'Ignorado: ' + (c.decisao.razao || ''));
  } else if (c.decisao && c.decisao.decisao === 'ADIAR' && c.decisao.adiar_ate >= String(c.agora).slice(0, 10)) {
    passos.push(['Há bloqueio ou decisão anterior?', 'Adiado até ' + c.decisao.adiar_ate + '.']);
    travar('AGUARDAR', 'Adiado até ' + c.decisao.adiar_ate + '.', c.decisao.adiar_ate);
  } else if (c.decisao && c.decisao.decisao === 'PEDIR_EVIDENCIA') {
    passos.push(['Há bloqueio ou decisão anterior?', 'Foi pedida mais evidência.']);
    travar('INVESTIGAR', 'Pedida mais evidência' + (c.decisao.razao ? ': ' + c.decisao.razao : '.'));
  } else passos.push(['Há bloqueio ou decisão anterior?', 'Não.']);

  /* 5 */
  if (!a.critico && c.criticoNaPagina) {
    passos.push(['Há algo mais importante nesta página ou objectivo?', 'Sim — há um problema crítico nesta página.']);
    travar('AGUARDAR', 'Há um problema crítico nesta página, que vem primeiro.');
  } else passos.push(['Há algo mais importante nesta página ou objectivo?', 'Não.']);

  /* 6 */
  const ev = a.evidencia || {};
  if (a.tipo === 'URL_FORA_DO_SITEMAP' && [301, 308].includes(ev.http)) {
    passos.push(['O ganho provável justifica o esforço?', 'Não é preciso esforço: já redirecciona.']);
    travar('AGUARDAR', 'Já redirecciona; rever dentro de 28 dias.', somar(ev.verificado_em || c.agora, 28).slice(0, 10));
  } else if (!a.critico && def.confianca[0] === 'BAIXA' && c.nivel !== 1) {
    passos.push(['O ganho provável justifica o esforço?', 'Ainda não se sabe — falta ' + (def.falta || 'evidência') + '.']);
    travar('INVESTIGAR', 'Falta ' + (def.falta || 'evidência') + '. Esforço ' + ({ BAIXO: 'baixo', MEDIO: 'médio', ALTO: 'alto' })[def.esforco] + ', sem custo financeiro.');
  } else if (!a.critico && c.nivel === 3 && c.impressoes === 0 && def.esforco !== 'BAIXO') {
    passos.push(['O ganho provável justifica o esforço?', 'Não — página de nível restante, sem impressões nos últimos 28 dias.']);
    travar('NAO_AGIR', 'Página de nível restante e sem impressões: o ganho provável não justifica o esforço agora.', somar(c.agora, 30).slice(0, 10));
  } else passos.push(['O ganho provável justifica o esforço?', 'Sim.']);

  return { saida: saida || 'AGIR_AGORA', razao, revisao, passos };
}

const IMPORTANCIA = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
export function compararPrioridade(x, y) {
  const imp = v => Math.min(...(v.objectivos.length ? v.objectivos.map(o => IMPORTANCIA[o.importancia] ?? 3) : [3]));
  return (y.critico - x.critico) || (imp(x) - imp(y)) || ((x.nivel ?? 4) - (y.nivel ?? 4)) ||
    ((y.impressoes_28d ?? 0) - (x.impressoes_28d ?? 0)) || String(x.detectado_em).localeCompare(String(y.detectado_em));
}

/* ------------------------------------------------------------- contexto -- */

const SQL_IMPRESSOES_POR_URL = `
SELECT json_extract(j.value, '$[0]') AS url, SUM(json_extract(j.value, '$[2]')) AS impressoes,
       COUNT(DISTINCT strftime('%Y-%W', c.data)) AS semanas
FROM gsc_conjuntos c, json_each(c.json) j
WHERE c.conjunto = 'page' AND c.data > date((SELECT MAX(data) FROM gsc_dias WHERE completo = 1), '-28 days')
GROUP BY url`;

function caminhoDeUrl(url) {
  try { const u = new URL(url); return u.hostname.toLowerCase() === 'happysoaring.com' ? u.pathname : null; } catch (e) { return null; }
}

export async function carregarContexto(db, agora) {
  const antes60 = new Date(t(agora) - 60 * DIA).toISOString();
  const [ass, dec, pac, ava, decAct, hip, factos, niveis, pobj, objs, termos, meta, fila, imp] = await Promise.all([
    db.prepare('SELECT * FROM assuntos WHERE resolvido_em IS NULL OR resolvido_em > ?').bind(antes60).all(),
    db.prepare('SELECT * FROM assunto_decisoes ORDER BY decidido_em, id').all(),
    db.prepare('SELECT id, assunto_chave, decisao_id, caminho, criado_em, deployment_id, publicado_em, licao_chave, implementacao FROM pacotes_trabalho ORDER BY id').all(),
    db.prepare('SELECT * FROM avaliacoes').all(),
    db.prepare("SELECT * FROM decisoes_activas WHERE estado = 'ACTIVA'").all(),
    db.prepare("SELECT * FROM hipoteses_eliminadas WHERE estado = 'ELIMINADA'").all(),
    db.prepare('SELECT id, afirmacao, estado, fonte, data_fonte, objectivo_id FROM factos_negocio').all(),
    db.prepare('SELECT caminho, nivel FROM niveis_pagina').all(),
    db.prepare('SELECT caminho, objectivo_id FROM pagina_objectivo').all(),
    db.prepare('SELECT id, nome, importancia, activo FROM objectivos_negocio ORDER BY ordem_ecra').all(),
    db.prepare('SELECT termo, tipo FROM termos_marca ORDER BY termo').all(),
    db.prepare("SELECT valor FROM esquema_meta WHERE chave = 'assuntos_ultimo_ciclo'").first(),
    lerIndexacao(db, { agora }),
    db.prepare(SQL_IMPRESSOES_POR_URL).all()
  ]);
  const O = new Map(objs.results.map(o => [o.id, o]));
  const objPorPagina = new Map();
  for (const r of pobj.results) {
    if (!O.get(r.objectivo_id)) continue;
    if (!objPorPagina.has(r.caminho)) objPorPagina.set(r.caminho, []);
    objPorPagina.get(r.caminho).push(O.get(r.objectivo_id));
  }
  const impressoes = new Map();
  for (const r of imp.results) {
    const c = caminhoDeUrl(r.url);
    if (c) impressoes.set(c, (impressoes.get(c) || 0) + (r.impressoes || 0));
  }
  const decisoesPorChave = new Map();
  for (const d of dec.results) {
    if (!decisoesPorChave.has(d.assunto_chave)) decisoesPorChave.set(d.assunto_chave, []);
    decisoesPorChave.get(d.assunto_chave).push(d);
  }
  let ultimoCiclo = null;
  try { ultimoCiclo = meta?.valor ? JSON.parse(meta.valor) : null; } catch (e) { ultimoCiclo = null; }
  return {
    agora, assuntos: ass.results, decisoesPorChave,
    pacotes: pac.results, avaliacaoPorPacote: new Map(ava.results.map(v => [v.pacote_id, v])),
    decisoesActivas: decAct.results, hipoteses: hip.results, factos: factos.results, termos: termos.results,
    nivel: new Map(niveis.results.map(n => [n.caminho, n.nivel])), objPorPagina, objectivos: objs.results,
    ultimoCiclo, fila, impressoes, temGsc: imp.results.length > 0,
    filaPorCaminho: new Map(fila.paginas.map(p => [p.caminho, p]))
  };
}

/* Um assunto como o Paulo o vê: estado no ciclo de vida, porta e prioridade. */
export function verAssunto(a, ctx, todos = ctx.assuntos) {
  const def = TIPOS[a.tipo];
  let ev = {};
  try { ev = JSON.parse(a.evidencia); } catch (e) { ev = {}; }
  const objectivos = (ctx.objPorPagina.get(a.caminho) || []).map(o => ({ id: o.id, nome: o.nome, importancia: o.importancia }));
  const nivel = ctx.nivel.get(a.caminho) ?? null;
  const impressoes = ctx.temGsc ? (a.tipo === 'URL_FORA_DO_SITEMAP' ? ev.impressoes_28d ?? 0 : ctx.impressoes.get(a.caminho) ?? 0) : null;
  const decisoes = ctx.decisoesPorChave.get(a.chave) || [];
  const validas = decisoes.filter(d => t(d.decidido_em) >= t(a.detectado_em));
  const decisao = validas[validas.length - 1] || null;
  const pacotes = ctx.pacotes.filter(p => p.assunto_chave === a.chave);
  const pacote = decisao && decisao.decisao === 'APROVAR' ? pacotes.find(p => p.decisao_id === decisao.id) || null : null;
  const ultimoPacote = pacotes[pacotes.length - 1] || null;
  const avaliacao = (pacote || ultimoPacote) ? ctx.avaliacaoPorPacote.get((pacote || ultimoPacote).id) || null : null;
  const pagina = ctx.filaPorCaminho.get(a.caminho) || null;

  const base = {
    id: a.id, chave: a.chave, tipo: a.tipo, titulo: def ? def.titulo : a.tipo, categoria: def?.categoria ?? null,
    acao: def?.acao ?? 'DECISAO', caminho: a.caminho, critico: a.critico, confirmado: a.confirmado,
    detectado_em: a.detectado_em, resolvido_em: a.resolvido_em, regressoes: a.regressoes,
    objectivos, nivel, impressoes_28d: impressoes, evidencia: ev, decisao, pacote: pacote || ultimoPacote, avaliacao
  };

  if (a.resolvido_em) {
    return { ...base, estado: avaliacao ? 'AVALIADO' : 'FECHADO', porta: null };
  }

  const activosPagina = todos.filter(x => !x.resolvido_em && x.caminho === a.caminho && x.chave !== a.chave);
  const episodio = pagina && pagina.ultima_alteracao && ['PENDENTE', 'ULTRAPASSADO', 'PEDIDO'].includes(pagina.estado) ? pagina.ultima_alteracao : null;
  const outrosEmObservacao = ctx.pacotes.filter(p => p.caminho === a.caminho && p.assunto_chave !== a.chave && p.publicado_em &&
    !ctx.avaliacaoPorPacote.get(p.id));
  const hipotese = ctx.hipoteses.find(h => h.tipo_assunto === a.tipo && prefixo(a.caminho, h.caminho) &&
    (!h.objectivo_id || objectivos.some(o => o.id === h.objectivo_id))) || null;
  const bloqueio = ctx.decisoesActivas.find(d => (d.bloqueia_tipo || d.bloqueia_caminho) &&
    (!d.bloqueia_tipo || d.bloqueia_tipo === a.tipo) && prefixo(a.caminho, d.bloqueia_caminho) &&
    (!d.objectivo_id || objectivos.some(o => o.id === d.objectivo_id))) || null;

  const porta = aplicarPorta({ ...a, evidencia: ev }, {
    agora: ctx.agora, nivel, impressoes, episodio,
    emObservacao: outrosEmObservacao.length ? 'alteração publicada em ' + String(outrosEmObservacao[0].publicado_em).slice(0, 10) : null,
    criticoNaPagina: activosPagina.some(x => x.critico), hipotese, bloqueio,
    decisao: decisao && decisao.decisao !== 'APROVAR' ? decisao : null
  });

  let estado;
  if (hipotese) estado = 'RETIRADO';
  else if (bloqueio) estado = 'BLOQUEADO';
  else if (pacote) {
    const R = pagina?.ultimo_rastreio;
    estado = !pacote.publicado_em ? 'DECIDIDO' : depois(R, pacote.publicado_em) ? 'EM_OBSERVACAO' : 'PUBLICADO';
  } else if (decisao) estado = 'DECIDIDO';
  else if (a.regressoes > 0) estado = 'REGRESSAO';
  else estado = porta.saida === 'AGIR_AGORA' ? 'PROPOSTO' : 'DETETADO';

  return { ...base, estado, porta };
}

/* ----------------------------------------------------------- tarefa agendada -- */

export async function executarCicloAssuntos(env, { fetchImpl = fetch, agora = new Date().toISOString() } = {}) {
  const c = { pedidos: 0, consultas: 0 };
  const buscar = (u, i) => { c.pedidos++; return fetchImpl(u, i); };
  const relatorio = { detectados: 0, novos: 0, resolvidos: 0, avaliados: 0, motivo: null };
  const fim = () => { relatorio.orcamento = { ...c }; return relatorio; };
  const db = env.DB;

  const origem = String(env.SITE_ORIGEM || 'https://happysoaring.com').replace(/\/+$/, '');
  let universo = [];
  try {
    const sm = await buscar(origem + '/sitemap.xml');
    const xml = sm.ok ? await sm.text() : '';
    universo = /<urlset[\s>]/i.test(xml) ? caminhosDoSitemap(xml) : [];
  } catch (e) { universo = []; }
  if (!universo.length) {
    /* sem o universo não se pode dizer que um problema desapareceu: nada muda */
    c.consultas++;
    await db.prepare(`INSERT INTO eventos_operacionais (tipo, detalhe)
      SELECT 'ASSUNTOS_SEM_SITEMAP_PRODUCAO', NULL WHERE NOT EXISTS (SELECT 1 FROM eventos_operacionais
      WHERE tipo = 'ASSUNTOS_SEM_SITEMAP_PRODUCAO' AND criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour'))`).run();
    relatorio.motivo = 'SEM_SITEMAP_PRODUCAO';
    return fim();
  }

  const antes60 = new Date(t(agora) - 60 * DIA).toISOString();
  c.consultas += 3 + 7;
  const [{ results: insp }, { results: existentes }, { results: gsc }, fila] = await Promise.all([
    db.prepare(`SELECT * FROM (SELECT caminho, inspeccionado_em, veredicto, cobertura, estado_indexacao, estado_robots, estado_obtencao,
        ultimo_rastreio, canonico_google, canonico_declarado, resultados_ricos,
        ROW_NUMBER() OVER (PARTITION BY caminho ORDER BY inspeccionado_em DESC) AS n
      FROM inspecoes WHERE erro IS NULL AND inspeccionado_em > ?) WHERE n <= 2`).bind(antes60).all(),
    db.prepare('SELECT chave, critico, confirmado, evidencia, resolvido_em FROM assuntos').all(),
    db.prepare(SQL_IMPRESSOES_POR_URL).all(),
    lerIndexacao(db, { agora })
  ]);

  const inspecoes = new Map();
  for (const r of insp) {
    if (!inspecoes.has(r.caminho)) inspecoes.set(r.caminho, []);
    inspecoes.get(r.caminho)[r.n - 1] = r;
  }

  /* o estado actual das URLs fora do sitemap com mais impressões */
  const noUniverso = new Set(universo);
  const fora = gsc.filter(g => { const cm = caminhoDeUrl(g.url); return !(cm && noUniverso.has(cm) && !String(g.url).includes('?')); })
    .sort((x, y) => y.impressoes - x.impressoes);
  const http = new Map();
  for (const g of fora.slice(0, MAX_VERIFICACOES_HTTP)) {
    if (c.pedidos >= ORCAMENTO_ASSUNTOS.pedidos) break;
    try {
      const u = new URL(g.url);
      if (!/(^|\.)happysoaring\.com$/i.test(u.hostname)) continue;
      const r = await buscar(g.url, { method: 'HEAD', redirect: 'manual' });
      http.set(g.url, { http: r.status, destino: r.headers.get('location') });
    } catch (e) { /* sem resposta: fica por verificar */ }
  }

  const detectados = detectarAssuntos({ universo, inspecoes, fila: fila.paginas, urlsGsc: gsc, http, agora });
  relatorio.detectados = detectados.length;

  const E = new Map(existentes.map(e => [e.chave, e]));
  const vistos = new Set();
  const escrever = [];
  for (const d of detectados) {
    vistos.add(d.chave);
    const e = E.get(d.chave);
    const ev = JSON.stringify(d.evidencia);
    if (!e || e.resolvido_em) relatorio.novos++;
    if (!e || e.resolvido_em || e.critico !== d.critico || e.confirmado !== d.confirmado || e.evidencia !== ev) escrever.push({ ...d, ev });
  }
  const resolver = existentes.filter(e => !e.resolvido_em && !vistos.has(e.chave)).map(e => e.chave);
  relatorio.resolvidos = resolver.length;

  const stmts = [];
  for (let i = 0; i < escrever.length; i += 12) {                               /* 12 × 8 < 100 */
    const parte = escrever.slice(i, i + 12);
    stmts.push(db.prepare(`INSERT INTO assuntos (chave, tipo, caminho, critico, confirmado, evidencia, detectado_em, visto_em)
      VALUES ` + parte.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ') + `
      ON CONFLICT(chave) DO UPDATE SET critico = excluded.critico, confirmado = excluded.confirmado,
        evidencia = excluded.evidencia, visto_em = excluded.visto_em,
        detectado_em = CASE WHEN assuntos.resolvido_em IS NOT NULL THEN excluded.detectado_em ELSE assuntos.detectado_em END,
        regressoes = assuntos.regressoes + (assuntos.resolvido_em IS NOT NULL),
        resolvido_em = NULL`)
      .bind(...parte.flatMap(d => [d.chave, d.tipo, d.caminho, d.critico, d.confirmado, d.ev, agora, agora])));
  }
  for (let i = 0; i < resolver.length; i += 90) {
    const parte = resolver.slice(i, i + 90);
    stmts.push(db.prepare('UPDATE assuntos SET resolvido_em = ? WHERE resolvido_em IS NULL AND chave IN (' + parte.map(() => '?').join(', ') + ')')
      .bind(agora, ...parte));
  }

  /* avaliações dos pacotes publicados */
  c.consultas++;
  const { results: porAvaliar } = await db.prepare(`SELECT p.id, p.assunto_chave, p.caminho, p.publicado_em, p.deployment_id,
      g.ultimo_rastreio, g.ultima_inspeccao_em, al.ultima_alteracao_em, al.deployment_id AS alt_deployment_id
    FROM pacotes_trabalho p
    LEFT JOIN avaliacoes v ON v.pacote_id = p.id
    LEFT JOIN paginas_google g ON g.caminho = p.caminho
    LEFT JOIN paginas_alteracao al ON al.caminho = p.caminho
    WHERE p.publicado_em IS NOT NULL AND v.id IS NULL`).all();
  const detectadoPorChave = new Map(detectados.map(d => [d.chave, d]));
  for (const p of porAvaliar) {
    const e = E.get(p.assunto_chave);
    const activo = detectadoPorChave.has(p.assunto_chave);
    const resolvido_em = activo ? null : (e && !e.resolvido_em ? agora : e?.resolvido_em ?? null);
    const criticoDepois = detectados.some(d => d.caminho === p.caminho && d.critico && d.chave !== p.assunto_chave &&
      (!E.get(d.chave) || E.get(d.chave).resolvido_em));
    const r = avaliarPacote({ ...p, resolvido_em }, agora, { criticoDepois });
    if (!r) continue;
    relatorio.avaliados++;
    stmts.push(db.prepare('INSERT OR IGNORE INTO avaliacoes (assunto_chave, pacote_id, resultado, evidencia, avaliado_em) VALUES (?, ?, ?, ?, ?)')
      .bind(p.assunto_chave, p.id, r.resultado, JSON.stringify(r.evidencia), agora));
  }

  const inspeccionadas = universo.filter(cm => inspecoes.has(cm)).length;
  stmts.push(db.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('assuntos_ultimo_ciclo', ?)")
    .bind(JSON.stringify({ em: agora, paginas_sitemap: universo.length, inspeccionadas, sem_inspeccao: universo.length - inspeccionadas })));
  c.consultas += stmts.length;
  await db.batch(stmts);
  return fim();
}

/* --------------------------------------------------------------- leitura -- */

const MAX_ACCOES = 3;

export async function lerHoje(db, { agora = new Date().toISOString(), desde = null } = {}) {
  const ctx = await carregarContexto(db, agora);
  /* «A leitura de hoje»: o que é novo desde a última visita; na primeira visita, as últimas 24 h */
  const desdeLeitura = desde || new Date(t(agora) - DIA).toISOString();
  const [pubs, eventos, incidentes, extra, semana] = await Promise.all([
    db.prepare(`SELECT SUM(meta_sujo = 1 AND criado_em_cf > ?) AS sujas FROM deployments WHERE processamento = 'PROCESSADO'`)
      .bind(new Date(t(agora) - 30 * DIA).toISOString()).first(),
    db.prepare(`SELECT tipo, MAX(criado_em) AS em, COUNT(*) AS n FROM eventos_operacionais
      WHERE criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day') GROUP BY tipo ORDER BY em DESC`).all(),
    incidentesParaHoje(db, agora).catch(() => []),
    lerDadosDoDia(db, { desde: desdeLeitura, agora }).catch(() => null),
    lerSemana(db).catch(() => null)
  ]);
  const vistos = ctx.assuntos.map(a => verAssunto(a, ctx));
  const activos = vistos.filter(v => !v.resolvido_em).sort(compararPrioridade);
  const linha = v => ({
    id: v.id, titulo: v.titulo, caminho: v.caminho, critico: v.critico, estado: v.estado,
    objectivos: v.objectivos.map(o => o.nome), porta: v.porta ? { saida: v.porta.saida, razao: v.porta.razao } : null
  });

  /* 1 */
  const criticos = activos.filter(v => v.critico && v.estado !== 'RETIRADO' && v.estado !== 'BLOQUEADO');

  /* 3 — O QUE PRECISA DO PAULO. O módulo decide por regras e o Claude implementa;
     aqui só fica o que nenhuma regra decide há mais de uma hora, e as decisões
     activas cuja data de revisão chegou. */
  const semRegra = activos.filter(v => v.estado === 'PROPOSTO' && v.acao === 'DECISAO' && t(agora) - t(v.detectado_em) > 36e5);
  const accoes = semRegra.map(v => ({ tipo: 'DECISAO', ...linha(v) }));
  const aPedir = ctx.fila.paginas.filter(p => p.accao === 'PEDIR')
    .sort((x, y) => (x.nivel ?? 9) - (y.nivel ?? 9) || (ctx.impressoes.get(y.caminho) || 0) - (ctx.impressoes.get(x.caminho) || 0));
  if (aPedir.length) {
    /* no máximo 10 por dia: é a quota manual do Search Console */
    accoes.unshift({ tipo: 'PEDIR_INDEXACAO', total: aPedir.length, hoje: aPedir.slice(0, 10).map(p => p.caminho) });
  }
  const accoesHoje = accoes.slice(0, MAX_ACCOES);
  const decisoesPendentes = accoes.slice(MAX_ACCOES);

  /* trabalho do Claude: pacotes aprovados por implementar, agrupados pela lição ou pelo tipo */
  const porImplementar = new Map();
  for (const v of activos) {
    if (!v.pacote || v.pacote.publicado_em || v.estado !== 'DECIDIDO') continue;
    const g = v.pacote.licao_chave || v.tipo;
    if (!porImplementar.has(g)) porImplementar.set(g, { grupo: g, titulo: v.titulo, paginas: 0 });
    porImplementar.get(g).paginas++;
  }

  /* 2 */
  const mudou = desde ? {
    desde,
    assuntos_novos: vistos.filter(v => !v.resolvido_em && depois(v.detectado_em, desde)).map(linha),
    resolvidos: vistos.filter(v => v.resolvido_em && depois(v.resolvido_em, desde) && v.estado === 'FECHADO').map(linha),
    decisoes_tomadas: (() => {
      const c = {};
      for (const lista of ctx.decisoesPorChave.values()) {
        for (const d of lista) {
          if (!depois(d.decidido_em, desde)) continue;
          const k = (d.decidido_por || 'PAULO') + ' ' + d.decisao;
          c[k] = (c[k] || 0) + 1;
        }
      }
      return Object.entries(c).map(([k, n]) => ({ por: k.split(' ')[0], decisao: k.split(' ')[1], n }));
    })(),
    rastreios: ctx.fila.paginas.filter(p => depois(p.ultimo_rastreio, desde))
      .sort((x, y) => String(y.ultimo_rastreio).localeCompare(String(x.ultimo_rastreio)))
      .map(p => ({ caminho: p.caminho, ultimo_rastreio: p.ultimo_rastreio }))
  } : null;

  /* 4 */
  const episodios = ctx.fila.paginas.filter(p => p.ultima_alteracao && p.estado && p.estado !== 'SEM_INSPECCAO')
    .map(p => ({
      caminho: p.caminho, alterada_em: p.ultima_alteracao.em, rastreio_posterior: p.rastreio_posterior,
      ultimo_rastreio: p.ultimo_rastreio, estado: p.estado
    }))
    .sort((x, y) => String(y.alterada_em).localeCompare(String(x.alterada_em)));
  const emObservacao = activos.filter(v => v.estado === 'PUBLICADO' || v.estado === 'EM_OBSERVACAO').map(v => {
    const R = ctx.filaPorCaminho.get(v.caminho)?.ultimo_rastreio;
    const rastreio = depois(R, v.pacote.publicado_em) ? R : null;
    return {
      ...linha(v), publicado_em: v.pacote.publicado_em, rastreio_posterior: rastreio,
      avaliacao_prevista: rastreio ? somar(rastreio, DIAS_OBSERVACAO_TECNICA).slice(0, 10) : null
    };
  });

  /* 5 */
  const limiteResultados = desde || new Date(t(agora) - 30 * DIA).toISOString();
  const resultados = vistos.filter(v => v.avaliacao && depois(v.avaliacao.avaliado_em, limiteResultados)).map(v => ({
    ...linha(v), resultado: v.avaliacao.resultado, avaliado_em: v.avaliacao.avaliado_em,
    razao: (() => { try { return JSON.parse(v.avaliacao.evidencia).razao; } catch (e) { return null; } })()
  }));

  const leitura = extra ? {
    desde: desdeLeitura, primeira_visita: !desde,
    frases: frasesDoDia(entradaDoDia(ctx, vistos, extra, { desde: desdeLeitura, pedir: accoes.find(a => a.tipo === 'PEDIR_INDEXACAO') }))
  } : null;

  /* 6 — limitações de evidência, hipóteses em teste, factos por confirmar, decisões pendentes */
  const limitacoes = [];
  const L = ctx.fila.limitacoes;
  if (!ctx.ultimoCiclo) limitacoes.push('A detecção de problemas ainda não correu.');
  else if (ctx.ultimoCiclo.sem_inspeccao) limitacoes.push(ctx.ultimoCiclo.sem_inspeccao + ' de ' + ctx.ultimoCiclo.paginas_sitemap + ' páginas do sitemap ainda sem inspecção: sobre elas nada se sabe.');
  if (L.historico_publicacoes_em_curso) limitacoes.push('Histórico de publicações ainda a processar (' + L.publicacoes_por_processar + '): algumas alterações ainda não são conhecidas.');
  if (L.quota_esgotada_hoje) limitacoes.push('A quota da inspecção de URL esgotou nas últimas 24 horas; retoma sozinha.');
  const pedidosSemRastreio = ctx.fila.paginas.filter(p => p.estado === 'PEDIDO' && t(agora) - t(p.pedido_em) > DIAS_RASTREIO_ESPERADO * DIA);
  if (pedidosSemRastreio.length) limitacoes.push(pedidosSemRastreio.length + ' pedido(s) de indexação há mais de ' + DIAS_RASTREIO_ESPERADO + ' dias sem rastreio posterior.');
  if (pubs?.sujas) limitacoes.push(pubs.sujas + ' publicação(ões) nos últimos 30 dias com alterações por registar no git.');
  for (const e of eventos.results) {
    if (e.tipo === 'INSPECCAO_QUOTA_ESGOTADA') continue;
    limitacoes.push('Limitação registada: ' + e.tipo.toLowerCase().replace(/_/g, ' ') + ' (última às ' +
      new Date(e.em).toISOString().slice(11, 16) + ' UTC).');
  }
  const porConfirmar = activos.filter(v => v.porta && v.porta.saida === 'AGUARDAR' && !v.confirmado && !v.critico);
  if (porConfirmar.length) limitacoes.push(porConfirmar.length + ' possível(eis) problema(s) à espera de confirmação.');

  return {
    agora,
    nota_rastreio: NOTA_RASTREIO,
    ultimo_ciclo: ctx.ultimoCiclo,
    leitura,
    semana: semana ? { semana: semana.semana, fim: semana.fim, gerada_em: semana.gerada_em, destaque: semana.destaque } : null,
    bloco1: { criticos: criticos.map(linha), verificadas: ctx.ultimoCiclo ? ctx.ultimoCiclo.inspeccionadas : 0, incidentes },
    bloco2: mudou,
    bloco3: {
      accoes: accoesHoje, maximo: MAX_ACCOES,
      decisoes_a_rever: ctx.decisoesActivas.filter(d => d.revisao_em && d.revisao_em <= agora.slice(0, 10))
        .map(d => ({ id: d.id, titulo: d.titulo, revisao_em: d.revisao_em }))
    },
    bloco4: { episodios, em_observacao: emObservacao, trabalho_claude: [...porImplementar.values()] },
    bloco5: { resultados, desde: limiteResultados },
    bloco6: {
      limitacoes,
      hipoteses_em_teste: activos.filter(v => v.porta && v.porta.saida === 'INVESTIGAR').map(linha),
      factos_por_confirmar: ctx.factos.filter(f => f.estado === 'POR_CONFIRMAR').length,
      decisoes_pendentes: decisoesPendentes,
      ainda_nao_verificado: AINDA_NAO_VERIFICADO
    }
  };
}

/* A entrada das frases do dia, a partir do que o «Hoje» já carregou. Puro. */
export function entradaDoDia(ctx, vistos, extra, { desde, pedir = null }) {
  const L = new Map(extra.licoes.map(l => [l.chave, l.titulo]));
  const tituloLicao = (k, tipo) => L.get(k) || (TIPOS[tipo] ? TIPOS[tipo].titulo : 'outras correcções');
  const tipoDoAssunto = new Map(ctx.assuntos.map(a => [a.chave, a.tipo]));
  const agrupar = (lista) => {
    const g = new Map();
    for (const v of lista) {
      if (!g.has(v.titulo)) g.set(v.titulo, { titulo: v.titulo, caminhos: [], aprovados: 0 });
      g.get(v.titulo).caminhos.push(v.caminho);
      if (v.decisao && v.decisao.decisao === 'APROVAR') g.get(v.titulo).aprovados++;
    }
    return [...g.values()];
  };
  const problema = v => v.acao === 'DECISAO' && (v.critico || v.confirmado);

  /* correcções publicadas e ainda por avaliar: o Google já voltou? */
  const regresso = new Map();
  for (const p of ctx.pacotes) {
    if (!p.publicado_em || ctx.avaliacaoPorPacote.get(p.id)) continue;
    const k = p.licao_chave || tipoDoAssunto.get(p.assunto_chave) || '?';
    if (!regresso.has(k)) regresso.set(k, { titulo: tituloLicao(p.licao_chave, tipoDoAssunto.get(p.assunto_chave)), total: 0, com_rastreio: 0, novos: 0, proxima_avaliacao: null });
    const r = regresso.get(k);
    r.total++;
    const R = ctx.filaPorCaminho.get(p.caminho)?.ultimo_rastreio;
    if (!depois(R, p.publicado_em)) continue;
    r.com_rastreio++;
    if (depois(R, desde)) r.novos++;
    const av = somar(R, DIAS_OBSERVACAO_TECNICA).slice(0, 10);
    if (!r.proxima_avaliacao || av < r.proxima_avaliacao) r.proxima_avaliacao = av;
  }

  const pacotePorId = new Map(ctx.pacotes.map(p => [p.id, p]));
  const avaliacoes = new Map();
  for (const v of ctx.avaliacaoPorPacote.values()) {
    if (!depois(v.avaliado_em, desde)) continue;
    const p = pacotePorId.get(v.pacote_id);
    const k = (p && p.licao_chave) || (p && tipoDoAssunto.get(p.assunto_chave)) || '?';
    if (!avaliacoes.has(k)) avaliacoes.set(k, { titulo: tituloLicao(p && p.licao_chave, p && tipoDoAssunto.get(p.assunto_chave)) });
    const a = avaliacoes.get(k);
    a[v.resultado] = (a[v.resultado] || 0) + 1;
  }

  /* lições que mudaram de estado: o estado de agora contra o que se sabia na visita anterior */
  const comEvidencia = ctx.assuntos.map(a => { let ev = {}; try { ev = JSON.parse(a.evidencia); } catch (e) { ev = {}; } return { ...a, evidencia: ev }; });
  const todasAv = [...ctx.avaliacaoPorPacote.values()];
  const agoraL = resultadosDasLicoes(extra.licoes, { assuntos: comEvidencia, pacotes: ctx.pacotes, avaliacoes: todasAv });
  const antesL = resultadosDasLicoes(extra.licoes, {
    assuntos: comEvidencia.filter(a => !depois(a.detectado_em, desde)).map(a => ({ ...a, resolvido_em: a.resolvido_em && !depois(a.resolvido_em, desde) ? a.resolvido_em : null })),
    pacotes: ctx.pacotes.filter(p => !depois(p.criado_em, desde)),
    avaliacoes: todasAv.filter(v => !depois(v.avaliado_em, desde))
  });
  const antesPorChave = new Map(antesL.map(l => [l.chave, l.estado]));

  return {
    incidentes: extra.incidentes,
    pedir: pedir ? { total: pedir.total, hoje: pedir.hoje } : null,
    problemas: {
      novos: agrupar(vistos.filter(v => !v.resolvido_em && depois(v.detectado_em, desde) && problema(v) &&
        v.estado !== 'RETIRADO' && !(v.decisao && v.decisao.decisao === 'IGNORAR'))),
      resolvidos: agrupar(vistos.filter(v => v.resolvido_em && depois(v.resolvido_em, desde) && v.acao === 'DECISAO' && v.estado === 'FECHADO'))
    },
    indexacao: extra.indexacao,
    correccoes: extra.correccoesPorLicao.map(c => ({ titulo: tituloLicao(c.licao_chave, c.tipo), paginas: c.paginas })),
    regresso: [...regresso.values()],
    avaliacoes: [...avaliacoes.values()],
    licoes: agoraL.filter(l => l.estado !== 'EM_TESTE' && antesPorChave.get(l.chave) !== l.estado)
      .map(l => ({ titulo: l.titulo, antes: antesPorChave.get(l.chave), agora: l.estado }))
  };
}

export function regrasAplicaveis(v, ctx) {
  const ids = new Set(v.objectivos.map(o => o.id));
  const relevante = x => !x.objectivo_id || ids.has(x.objectivo_id);
  return {
    decisoes_activas: ctx.decisoesActivas.filter(d => relevante(d) && prefixo(v.caminho, d.bloqueia_caminho))
      .map(d => ({ id: d.id, titulo: d.titulo, tipo: d.tipo, razao: d.razao, ambito: d.ambito })),
    factos_verificados: ctx.factos.filter(f => relevante(f) && f.estado === 'VERIFICADO').map(f => f.afirmacao),
    afirmacoes_proibidas: ctx.factos.filter(f => relevante(f) && f.estado === 'PROIBIDO').map(f => f.afirmacao),
    factos_por_confirmar: ctx.factos.filter(f => relevante(f) && f.estado === 'POR_CONFIRMAR').map(f => f.afirmacao),
    termos_de_marca: ctx.termos.map(x => x.termo)
  };
}

export function textosDe(v) {
  const def = TIPOS[v.tipo];
  if (!def) return null;
  return {
    diagnostico: def.diagnostico(v.evidencia), solucao: def.solucao(v.evidencia), nao_fazer: def.nao_fazer,
    riscos: def.riscos, medicao: def.medicao, confianca: { nivel: def.confianca[0], justificacao: def.confianca[1] },
    esforco: def.esforco, custo_financeiro: null
  };
}

export async function lerAssunto(db, id, { agora = new Date().toISOString() } = {}) {
  const a = await db.prepare('SELECT * FROM assuntos WHERE id = ?').bind(id).first();
  if (!a) return null;
  const ctx = await carregarContexto(db, agora);
  if (!ctx.assuntos.some(x => x.id === a.id)) ctx.assuntos.push(a);
  const v = verAssunto(a, ctx);
  const pagina = ctx.filaPorCaminho.get(a.caminho) || null;
  return {
    ...v,
    ficha: textosDe(v),
    regras: regrasAplicaveis(v, ctx),
    historico_decisoes: ctx.decisoesPorChave.get(a.chave) || [],
    pacotes: ctx.pacotes.filter(p => p.assunto_chave === a.chave),
    pagina: pagina && {
      estado_indexacao: pagina.estado, ultimo_rastreio: pagina.ultimo_rastreio, ultima_inspeccao: pagina.ultima_inspeccao,
      cobertura: pagina.cobertura, ultima_alteracao: pagina.ultima_alteracao, pedido_em: pagina.pedido_em
    },
    nota_rastreio: NOTA_RASTREIO
  };
}

export async function lerPacote(db, id) {
  const p = await db.prepare('SELECT * FROM pacotes_trabalho WHERE id = ?').bind(id).first();
  if (!p) return null;
  try { p.conteudo = JSON.parse(p.conteudo); } catch (e) { /* fica como texto */ }
  return p;
}

/* O pacote de trabalho para o Claude: o que alterar, porquê, o que respeitar, o que não tocar. */
export function conteudoPacote(ficha, nota) {
  const f = ficha.ficha;
  return {
    versao: 1,
    assunto: ficha.titulo,
    pagina: ficha.caminho.startsWith('/') ? 'https://happysoaring.com' + ficha.caminho : ficha.caminho,
    objectivos: ficha.objectivos.map(o => o.nome),
    o_que_alterar: f.solucao,
    porque: { diagnostico: f.diagnostico, evidencia: ficha.evidencia },
    nao_tocar: f.nao_fazer,
    riscos: f.riscos,
    medicao: f.medicao,
    respeitar: ficha.regras,
    nota_do_paulo: nota
  };
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const texto = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

/* A decisão do Paulo sobre um assunto. Aprovar gera o pacote de trabalho. */
export async function decidirAssunto(db, id, corpo, { agora = new Date().toISOString() } = {}) {
  const ficha = await lerAssunto(db, id, { agora });
  if (!ficha) return { estado: 404, erro: 'Assunto desconhecido.' };
  if (ficha.resolvido_em) return { estado: 409, erro: 'Este assunto já está fechado.' };
  const decisao = String(corpo?.decisao || '');
  if (!['APROVAR', 'IGNORAR', 'ADIAR', 'PEDIR_EVIDENCIA'].includes(decisao)) return { estado: 400, erro: 'Decisão inválida.' };
  const razao = texto(corpo?.razao, 1000) || null;
  const nota = texto(corpo?.nota, 2000) || null;
  let adiar = null;
  if (decisao === 'IGNORAR' && (!razao || razao.length < 3)) return { estado: 400, erro: 'Para ignorar, escreve a razão.' };
  if (decisao === 'ADIAR') {
    adiar = String(corpo?.adiar_ate || '');
    const hoje = agora.slice(0, 10), max = somar(agora, 366).slice(0, 10);
    if (!DATA.test(adiar) || adiar <= hoje || adiar > max) return { estado: 400, erro: 'Para adiar, indica uma data futura (até um ano).' };
  }
  if (decisao === 'APROVAR') {
    if (ficha.acao === 'OPERACIONAL') return { estado: 400, erro: 'É uma acção operacional: faz-se na fila de indexação.' };
    if (ficha.estado === 'RETIRADO' || ficha.estado === 'BLOQUEADO') return { estado: 409, erro: 'Bloqueado por uma decisão activa ou hipótese eliminada.' };
    if (ficha.pacote && !ficha.avaliacao && ficha.decisao?.decisao === 'APROVAR') return { estado: 409, erro: 'Já está aprovado.' };
  }

  const stmts = [db.prepare("INSERT INTO assunto_decisoes (assunto_chave, decisao, razao, adiar_ate, nota, decidido_em, decidido_por) VALUES (?, ?, ?, ?, ?, ?, 'PAULO')")
    .bind(ficha.chave, decisao, razao, adiar, nota, agora)];
  if (decisao === 'APROVAR') {
    const conteudo = conteudoPacote(ficha, nota);
    stmts.push(db.prepare(`INSERT INTO pacotes_trabalho (assunto_chave, decisao_id, caminho, conteudo, criado_em)
      VALUES (?, last_insert_rowid(), ?, ?, ?)`).bind(ficha.chave, ficha.caminho, JSON.stringify(conteudo), agora));
  }
  await db.batch(stmts);
  /* a ficha relê-se num pedido novo: um só pedido não passa das 50 consultas do plano gratuito */
  return { estado: 200, valor: { registado: true, id } };
}
