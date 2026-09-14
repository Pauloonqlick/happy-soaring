/* DECISÕES AUTOMÁTICAS, LIÇÕES E MANUAL DE BOAS PRÁTICAS

   O módulo decide por regras; o Claude implementa; o Paulo pode contrariar.
   As regras nunca decidem sobre o que ainda não está confirmado, nem sobre o
   que uma decisão activa bloqueia ou uma hipótese eliminada retirou.

   APRENDER: uma lição reconhece um tipo de erro na evidência. Cada pacote
   aprovado leva a lição que reconheceu; os resultados contam-se das avaliações
   e dos assuntos resolvidos. Uma lição confirmada reforça a decisão; uma
   refutada deixa de ser aplicada sozinha e o caso passa para análise. */
import { carregarContexto, verAssunto, textosDe, regrasAplicaveis, conteudoPacote, TIPOS } from './assuntos.js';
import { descreverIncidente } from './vigia.js';

const DIA = 864e5;
const t = s => (s ? Date.parse(s) : NaN);
const somarDias = (iso, d) => new Date(t(iso) + d * DIA).toISOString().slice(0, 10);
export const DIAS_AGUARDAR_RASTREIO = 14;
const MAX_DECISOES_POR_EXECUCAO = 60;

/* ---------------------------------------------------------------- lições -- */

export function licaoDe(v, licoes) {
  const ev = JSON.stringify(v.evidencia || {});
  return licoes.filter(l => l.tipo_assunto === v.tipo)
    .sort((a, b) => a.prioridade - b.prioridade || a.chave.localeCompare(b.chave))
    .find(l => { if (!l.padrao) return true; try { return new RegExp(l.padrao, 'i').test(ev); } catch (e) { return false; } }) || null;
}

/* Resultados e estado de cada lição, a partir das observações. Puro. */
export function resultadosDasLicoes(licoes, { assuntos, pacotes, avaliacoes }) {
  const porChave = new Map(licoes.map(l => [l.chave, {
    casos: 0, activos: 0, resolvidos: 0, melhorias: 0, sem_efeito: 0, pioraram: 0, inconclusivos: 0, pacotes: 0, paginas: []
  }]));
  for (const a of assuntos) {
    const l = licaoDe(a, licoes);
    if (!l) continue;
    const r = porChave.get(l.chave);
    r.casos++;
    if (a.resolvido_em) r.resolvidos++; else r.activos++;
    if (r.paginas.length < 12) r.paginas.push(a.caminho);
  }
  const AV = new Map(avaliacoes.map(v => [v.pacote_id, v]));
  for (const p of pacotes) {
    const r = p.licao_chave && porChave.get(p.licao_chave);
    if (!r) continue;
    r.pacotes++;
    const v = AV.get(p.id);
    if (!v) continue;
    if (v.resultado === 'MELHORIA_OBSERVADA') r.melhorias++;
    else if (v.resultado === 'SEM_EFEITO_CLARO') r.sem_efeito++;
    else if (v.resultado === 'PIOROU') r.pioraram++;
    else r.inconclusivos++;
  }
  return licoes.map(l => {
    const r = porChave.get(l.chave);
    /* uma regra de trabalho nascida de um caso real: está em vigor desde que existe (0014) */
    if (l.natureza === 'PROCESSO') return { ...l, resultados: r, estado: 'EM_VIGOR' };
    const confirmacoes = r.melhorias + (r.pacotes ? 0 : r.resolvidos);   /* sem acção, conta o caso que se resolveu como previsto */
    const estado = r.pioraram > 0 || (r.sem_efeito >= 2 && r.melhorias === 0) ? 'REFUTADA'
      : confirmacoes >= 2 ? 'CONFIRMADA' : 'EM_TESTE';
    return { ...l, resultados: r, estado };
  });
}

/* ----------------------------------------------------------------- regras -- */

/* A decisão que o módulo toma sozinho, ou null quando não há regra segura. Puro. */
export function politica(v, licao, agora, { adiamentos = 0 } = {}) {
  if (!v.critico && !v.confirmado) return null;
  if (licao && licao.estado === 'REFUTADA') {
    return { decisao: 'PEDIR_EVIDENCIA', razao: 'A correcção conhecida («' + licao.titulo + '») não resultou antes: o Claude revê a abordagem.' };
  }
  const reforco = licao ? ' Lição aplicada: «' + licao.titulo + '»' + (licao.estado === 'CONFIRMADA' ? ' (confirmada).' : ' (em teste).') : '';
  switch (v.tipo) {
    case 'NUNCA_RASTREADA':
    case 'ALTERACAO_SEM_RASTREIO':
      /* depois de duas esperas sem rastreio, o pedido de indexação passa para o Paulo */
      if (adiamentos >= 2) return null;
      return { decisao: 'ADIAR', adiar_ate: somarDias(agora, DIAS_AGUARDAR_RASTREIO),
        razao: 'Aguardar o rastreio natural: o sitemap indica a data da alteração. Pedidos manuais em massa não compensam.' + reforco };
    case 'URL_FORA_DO_SITEMAP': {
      const h = v.evidencia && v.evidencia.http;
      if (h == null) return null;
      if (h === 301 || h === 308) {
        return { decisao: 'IGNORAR', razao: 'Já redirecciona permanentemente para ' + (v.evidencia.destino || 'a página certa') + '; o Google actualiza sozinho.' + reforco };
      }
      return { decisao: 'APROVAR', razao: 'A URL responde ' + h + ' fora do sitemap: correcção técnica.' + reforco };
    }
    case 'RASTREADA_NAO_INDEXADA':
      return { decisao: 'PEDIR_EVIDENCIA', razao: 'O Claude compara a página com as que o Google indexa antes de decidir mexer no conteúdo.' + reforco };
    default:
      if (!TIPOS[v.tipo]) return null;
      return { decisao: 'APROVAR', razao: 'Correcção técnica aprovada pelo módulo; o Claude implementa.' + reforco };
  }
}

const decisaoEmVigor = (v, hoje) => v.decisao && !(v.decisao.decisao === 'ADIAR' && v.decisao.adiar_ate < hoje);

export async function lerLicoes(db) {
  return (await db.prepare('SELECT * FROM licoes ORDER BY categoria, prioridade, chave').all()).results;
}

export async function executarCicloDecisoes(env, { agora = new Date().toISOString() } = {}) {
  const db = env.DB;
  const relatorio = { decididos: 0, pacotes: 0, por_decisao: {} };
  const [ctx, licoesBase] = await Promise.all([carregarContexto(db, agora), lerLicoes(db)]);
  const licoes = resultadosDasLicoes(licoesBase, { assuntos: ctx.assuntos.map(a => ({ ...a, evidencia: JSON.parse(a.evidencia || '{}') })),
    pacotes: ctx.pacotes, avaliacoes: [...ctx.avaliacaoPorPacote.values()] });
  const hoje = agora.slice(0, 10);

  const decisoes = [], pacotes = [];
  for (const a of ctx.assuntos) {
    if (a.resolvido_em) continue;
    if (decisoes.length >= MAX_DECISOES_POR_EXECUCAO) break;
    const v = verAssunto(a, ctx);
    if (v.estado === 'RETIRADO' || v.estado === 'BLOQUEADO' || decisaoEmVigor(v, hoje)) continue;
    if (v.decisao && v.decisao.decisao === 'APROVAR') continue;
    const licao = licaoDe(v, licoes);
    const adiamentos = (ctx.decisoesPorChave.get(a.chave) || [])
      .filter(x => x.decisao === 'ADIAR' && x.decidido_por === 'MODULO' && t(x.decidido_em) >= t(a.detectado_em)).length;
    const d = politica(v, licao, agora, { adiamentos });
    if (!d) continue;
    decisoes.push({ chave: a.chave, ...d });
    relatorio.por_decisao[d.decisao] = (relatorio.por_decisao[d.decisao] || 0) + 1;
    if (d.decisao === 'APROVAR') {
      const ficha = { ...v, ficha: textosDe(v), regras: regrasAplicaveis(v, ctx) };
      const conteudo = conteudoPacote(ficha, null);
      if (licao) conteudo.licao = { chave: licao.chave, titulo: licao.titulo, estado: licao.estado, causa: licao.causa, correccao: licao.correccao };
      pacotes.push({ chave: a.chave, caminho: a.caminho, conteudo: JSON.stringify(conteudo), licao: licao ? licao.chave : null });
    }
  }
  if (!decisoes.length) return relatorio;

  const stmts = [];
  for (let i = 0; i < decisoes.length; i += 14) {                                  /* 14 × 5 < 100 */
    const parte = decisoes.slice(i, i + 14);
    stmts.push(db.prepare(`INSERT INTO assunto_decisoes (assunto_chave, decisao, razao, adiar_ate, decidido_em, decidido_por) VALUES ` +
      parte.map(() => "(?, ?, ?, ?, ?, 'MODULO')").join(', ')).bind(...parte.flatMap(d => [d.chave, d.decisao, d.razao, d.adiar_ate || null, agora])));
  }
  for (let i = 0; i < pacotes.length; i += 10) {                                   /* 10 × 7 < 100 */
    const parte = pacotes.slice(i, i + 10);
    stmts.push(db.prepare(`INSERT INTO pacotes_trabalho (assunto_chave, decisao_id, caminho, conteudo, criado_em, licao_chave) VALUES ` +
      parte.map(() => "(?, (SELECT id FROM assunto_decisoes WHERE assunto_chave = ? AND decidido_em = ? AND decisao = 'APROVAR' ORDER BY id DESC LIMIT 1), ?, ?, ?, ?)").join(', '))
      .bind(...parte.flatMap(p => [p.chave, p.chave, agora, p.caminho, p.conteudo, agora, p.licao])));
  }
  await db.batch(stmts);
  relatorio.decididos = decisoes.length;
  relatorio.pacotes = pacotes.length;
  return relatorio;
}

/* ---------------------------------------------------------------- leitura -- */

const ESTADO_LICAO = { CONFIRMADA: 'Confirmada', EM_VIGOR: 'Em vigor', EM_TESTE: 'Em teste', REFUTADA: 'Não resultou' };

export async function lerAprendizagem(db, { agora = new Date().toISOString() } = {}) {
  const [licoesBase, { results: assuntos }, { results: pacotes }, { results: avaliacoes }] = await Promise.all([
    lerLicoes(db),
    db.prepare('SELECT chave, tipo, caminho, evidencia, resolvido_em FROM assuntos').all(),
    db.prepare('SELECT id, licao_chave, implementacao, publicado_em FROM pacotes_trabalho').all(),
    db.prepare('SELECT pacote_id, resultado FROM avaliacoes').all()
  ]);
  const licoes = resultadosDasLicoes(licoesBase, {
    assuntos: assuntos.map(a => { let ev = {}; try { ev = JSON.parse(a.evidencia); } catch (e) { ev = {}; } return { ...a, evidencia: ev }; }),
    pacotes, avaliacoes
  });
  return { agora, licoes, manual: gerarManual(licoes, agora), falta_aprender: await lerFaltaAprender(db, { agora, licoes: licoesBase }) };
}

/* O manual: o que resultou, o que está em teste e o que não resultou. */
export function gerarManual(licoes, agora = new Date().toISOString()) {
  const L = [];
  L.push('# Manual de boas práticas — SEO técnico, publicação e operação', '');
  L.push('Gerado pelo módulo de inteligência da Happy Soaring a partir de erros reais detectados e do resultado das correcções.');
  L.push('Actualizado em ' + agora.slice(0, 10) + '. Uma prática só aparece como confirmada depois de resultados observados; não se atribui causa.', '');
  const grupos = [['CONFIRMADA', 'Práticas confirmadas'], ['EM_VIGOR', 'Regras de trabalho em vigor'], ['EM_TESTE', 'Práticas em teste'], ['REFUTADA', 'O que não resultou']];
  for (const [estado, titulo] of grupos) {
    const doEstado = licoes.filter(l => l.estado === estado);
    if (!doEstado.length) continue;
    L.push('## ' + titulo, '');
    const categorias = [...new Set(doEstado.map(l => l.categoria))];
    for (const c of categorias) {
      L.push('### ' + c, '');
      for (const l of doEstado.filter(x => x.categoria === c)) {
        const r = l.resultados;
        L.push('#### ' + l.titulo + (l.generica ? '' : ' (específico deste site)'), '');
        L.push('- **Boa prática:** ' + l.prevencao);
        L.push('- **Sintoma:** ' + l.sintoma);
        L.push('- **Causa:** ' + l.causa);
        L.push('- **Correcção:** ' + l.correccao);
        if (l.natureza === 'PROCESSO') { L.push('- **Nasceu de:** ' + (referenciasDe(l).join('; ') || 'caso não registado') + '. Estado: em vigor.', ''); continue; }
        L.push('- **Evidência:** ' + r.casos + ' caso(s) detectado(s), ' + r.resolvidos + ' resolvido(s)' +
          (r.pacotes ? '; avaliações: ' + r.melhorias + ' melhoria(s) observada(s), ' + r.sem_efeito + ' sem efeito claro, ' +
            r.pioraram + ' pioraram, ' + r.inconclusivos + ' inconclusiva(s)' : '') + '. Estado: ' + ESTADO_LICAO[l.estado].toLowerCase() + '.', '');
      }
    }
  }
  if (!licoes.length) L.push('Ainda não há lições registadas.', '');
  return L.join('\n');
}

/* ----------------------------------------------------------------- escrita -- */

const texto = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

/* Criar ou actualizar uma lição (usado pelo Claude e pelo Paulo). Cada versão fica no histórico. */
export async function gravarLicao(db, corpo, { agora = new Date().toISOString(), origem = 'PAULO' } = {}) {
  const v = {
    chave: texto(corpo?.chave, 120), tipo_assunto: String(corpo?.tipo_assunto || ''), categoria: texto(corpo?.categoria, 80),
    titulo: texto(corpo?.titulo, 200), padrao: texto(corpo?.padrao, 300) || null, prioridade: Number(corpo?.prioridade ?? 100),
    sintoma: texto(corpo?.sintoma, 1000), causa: texto(corpo?.causa, 1000), correccao: texto(corpo?.correccao, 1000),
    prevencao: texto(corpo?.prevencao, 1000), generica: corpo?.generica === false || corpo?.generica === 0 ? 0 : 1,
    natureza: corpo?.natureza === 'PROCESSO' ? 'PROCESSO' : 'MEDIDA',
    referencias: Array.isArray(corpo?.referencias) ? JSON.stringify(corpo.referencias.map(x => texto(String(x), 200)).filter(Boolean).slice(0, 20)) : null
  };
  if (!/^[a-z0-9][a-z0-9/_-]{2,119}$/.test(v.chave)) return { estado: 400, erro: 'Chave inválida.' };
  if (v.natureza === 'MEDIDA' && !TIPOS[v.tipo_assunto]) return { estado: 400, erro: 'Tipo de assunto desconhecido.' };
  if (v.natureza === 'PROCESSO') { v.tipo_assunto = null; v.padrao = null; }
  for (const k of ['categoria', 'titulo', 'sintoma', 'causa', 'correccao', 'prevencao']) if (!v[k]) return { estado: 400, erro: 'Falta: ' + k + '.' };
  if (v.padrao) { try { new RegExp(v.padrao, 'i'); } catch (e) { return { estado: 400, erro: 'Padrão inválido.' }; } }
  if (!Number.isInteger(v.prioridade)) return { estado: 400, erro: 'Prioridade inválida.' };
  const cols = ['natureza', 'tipo_assunto', 'categoria', 'titulo', 'padrao', 'prioridade', 'sintoma', 'causa', 'correccao', 'prevencao', 'generica', 'referencias'];
  await db.batch([
    db.prepare(`INSERT INTO licoes (chave, ${cols.join(', ')}, origem, criada_em, alterada_em) VALUES (?, ${cols.map(() => '?').join(', ')}, ?, ?, ?)
      ON CONFLICT(chave) DO UPDATE SET ${cols.map(k => k + ' = excluded.' + k).join(', ')}, versao = licoes.versao + 1, alterada_em = excluded.alterada_em`)
      .bind(v.chave, ...cols.map(k => v[k]), origem, agora, agora),
    db.prepare(`INSERT INTO licoes_historico (chave, versao, dados, gravado_em)
      SELECT chave, versao, json_object('chave', chave, 'versao', versao, ${cols.map(k => `'${k}', ${k}`).join(', ')}, 'origem', origem), ? FROM licoes WHERE chave = ?`)
      .bind(agora, v.chave)
  ]);
  return { estado: 200, valor: await lerAprendizagem(db, { agora }) };
}

/* ------------------------------------------------------ o que falta aprender -- */

export const referenciasDe = l => { try { const r = l.referencias ? JSON.parse(l.referencias) : []; return Array.isArray(r) ? r : []; } catch (e) { return []; } };

/* O que aconteceu e ainda não deixou lição (14/09/2026). Nada se perde por esquecimento:
     · um problema detectado que nenhuma lição reconhece — «falta lição», ou «causa por
       descobrir» se já há hipóteses eliminadas para aquela página;
     · um incidente do módulo (fechado, com peso) que nenhuma lição refere — «falta lição»
       se já está resolvido, «causa por confirmar» se ainda não.
   Um caso sai daqui quando uma lição o reconhece ou refere, ou quando é dispensado com um
   motivo escrito (aprendizagem_dispensas). */
export async function lerFaltaAprender(db, { agora = new Date().toISOString(), licoes = null } = {}) {
  const [L, { results: assuntos }, { results: hipoteses }, { results: incidentes }, { results: dispensas }] = await Promise.all([
    licoes ? Promise.resolve(licoes) : lerLicoes(db),
    db.prepare('SELECT chave, tipo, caminho, evidencia, detectado_em, resolvido_em FROM assuntos').all(),
    db.prepare("SELECT caminho, tipo_assunto FROM hipoteses_eliminadas WHERE estado = 'ELIMINADA'").all(),
    db.prepare('SELECT * FROM incidentes WHERE fechado_em IS NOT NULL ORDER BY aberto_em DESC LIMIT 50').all(),
    db.prepare('SELECT referencia FROM aprendizagem_dispensas').all()
  ]);
  const dispensado = new Set(dispensas.map(d => d.referencia));
  const referidas = new Set(L.flatMap(referenciasDe));
  const out = [];
  const porCaso = new Map();
  for (const a of assuntos) {
    if (dispensado.has('assunto:' + a.chave)) continue;
    let ev = {}; try { ev = JSON.parse(a.evidencia || '{}'); } catch (e) { ev = {}; }
    if (licaoDe({ ...a, evidencia: ev }, L)) continue;
    const hip = hipoteses.filter(h => h.caminho && a.caminho.startsWith(h.caminho) && (!h.tipo_assunto || h.tipo_assunto === a.tipo)).length;
    const k = a.tipo + '|' + a.caminho;
    if (porCaso.has(k)) continue;
    porCaso.set(k, true);
    out.push({ referencia: 'assunto:' + a.chave, origem: 'problema', titulo: (TIPOS[a.tipo]?.titulo || a.tipo), detalhe: a.caminho,
      desde: a.detectado_em, activo: !a.resolvido_em,
      estado: hip ? 'CAUSA_POR_DESCOBRIR' : 'FALTA_LICAO', hipoteses_eliminadas: hip });
  }
  for (const i of incidentes) {
    const ref = 'incidente:' + i.aberto_em;
    if (dispensado.has(ref) || referidas.has(ref)) continue;
    const d = descreverIncidente(i, agora);
    if (!(d.duracao_min >= 30 || d.execucoes_perdidas >= 5)) continue;
    out.push({ referencia: ref, origem: 'incidente', titulo: 'Incidente do módulo', detalhe: d.execucoes_perdidas + ' execuções perdidas em ' + d.duracao_min + ' min',
      desde: i.aberto_em, activo: false, estado: d.resolvido ? 'FALTA_LICAO' : 'CAUSA_POR_CONFIRMAR' });
  }
  return out.sort((a, b) => (a.desde < b.desde ? 1 : -1));
}
