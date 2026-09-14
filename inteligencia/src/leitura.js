/* «A leitura de hoje» e «Semana em revista»: frases-modelo preenchidas pelo módulo.

   Regras das frases (combinadas com o Paulo a 14/09/2026):
   - cada frase só existe se o dado que a sustenta existir e tiver amostra suficiente;
     quando falta, a frase não aparece — nunca se enfeita;
   - cada frase liga ao sítio onde está o detalhe;
   - nunca «porque» entre uma correcção e um resultado: «depois de»;
   - a leitura do dia só aparece quando há algo novo; os números de visibilidade ficam
     para a semana (o dia-a-dia é ruído e o Search Console tem 2 a 3 dias de atraso).
   As frases puras (frasesDoDia, frasesDaSemana) não tocam na base: são testadas à parte. */
import { descreverIncidente } from './vigia.js';
import { TIPOS } from './assuntos.js';   /* só usado ao chamar: o ciclo de imports não pesa */

/* as mesmas regras do painel «Evolução» (sem o importar, para não criar ciclos) */
const LINGUAS = ['pt', 'en', 'es', 'fr', 'de'];
const linguaDoCaminho = c => { const m = /^\/(en|es|fr|de)(\/|$)/.exec(c); return m ? m[1] : 'pt'; };

const DIA = 864e5;
const t = s => Date.parse(s);
const num = n => new Intl.NumberFormat('pt-PT').format(n);
const plural = (n, um, varios) => num(n) + ' ' + (n === 1 ? um : varios);
const dm = s => String(s).slice(8, 10) + '/' + String(s).slice(5, 7);
const somarDias = (s, d) => new Date(t(s) + d * DIA).toISOString();
const listar = (xs, max = 3) => xs.slice(0, max).join(', ') + (xs.length > max ? ' e mais ' + (xs.length - max) : '');
const HORA_LISBOA = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const quando = s => HORA_LISBOA.format(new Date(s)).replace(',', ' às');
const duracao = m => m < 60 ? plural(m, 'minuto', 'minutos') : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') + ' min' : '');
const RESULTADO = { MELHORIA_OBSERVADA: 'melhoria', SEM_EFEITO_CLARO: 'sem efeito claro', PIOROU: 'piorou', INCONCLUSIVO: 'inconclusiva' };
export const DIAS_ATE_AVALIAR = 14;                 /* o mesmo que DIAS_OBSERVACAO_TECNICA */
export const REGISTO_EXECUCOES_DESDE = '2026-09-13';
const frase = (tema, tom, texto, rotulo, href) => ({ tema, tom, texto, ligacao: href ? { rotulo, href } : null });

/* ------------------------------------------------------------ o dia -- */

/* As frases do dia, pela ordem em que interessam. Puro.
   entrada: { incidentes, pedir, problemas, indexacao, correccoes, regresso, avaliacoes, licoes } */
export function frasesDoDia(e) {
  const out = [];
  const inc = e.incidentes || [];

  for (const i of inc.filter(x => x.aberto)) {
    out.push(frase('modulo', 'alerta', 'O módulo tem tarefas a falhar desde ' + quando(i.aberto_em) + ': ' +
      plural(i.execucoes_perdidas, 'execução perdida', 'execuções perdidas') + ' (' + i.tarefas.map(x => x.titulo).join(', ') + '). ' +
      i.causa_provavel, 'Ver a operação', 'evolucao/#s-op'));
  }

  if (e.pedir && e.pedir.total) {
    out.push(frase('pedir', 'accao', 'Há ' + plural(e.pedir.hoje.length, 'página', 'páginas') + ' para pedires indexação hoje' +
      (e.pedir.total > e.pedir.hoje.length ? ' (de ' + num(e.pedir.total) + ' à espera)' : '') +
      ': o Google não voltou a elas depois de o módulo esperar 28 dias.', 'Abrir a fila', 'indexacao/'));
  }

  const P = e.problemas || { novos: [], resolvidos: [] };
  if (P.novos.length) {
    const total = P.novos.reduce((n, g) => n + g.caminhos.length, 0);
    const todosAprovados = P.novos.every(g => (g.aprovados || 0) === g.caminhos.length);
    out.push(frase('problemas', todosAprovados ? 'info' : 'alerta', (total === 1 ? 'Apareceu 1 problema novo: ' : 'Apareceram ' + num(total) + ' problemas novos: ') +
      P.novos.map(g => g.titulo.charAt(0).toLowerCase() + g.titulo.slice(1) + (g.caminhos.length <= 2 ? ' (' + g.caminhos.join(', ') + ')' : ' (' + num(g.caminhos.length) + ' páginas)')).join('; ') +
      '. ' + (() => {
        const aprovados = P.novos.reduce((n, g) => n + (g.aprovados || 0), 0);
        return aprovados === total ? 'O módulo já aprovou a correcção.'
          : aprovados ? 'O módulo já aprovou a correcção de ' + num(aprovados) + '; o resto está a ser decidido.'
            : 'O módulo decide o que fazer.';
      })(), 'Ver no «Hoje»', '#bloco1'));
  }

  const X = e.indexacao || { entraram: [], sairam: [] };
  if (X.sairam.length) {
    out.push(frase('indexacao', 'alerta', plural(X.sairam.length, 'página saiu', 'páginas saíram') + ' do índice do Google: ' + listar(X.sairam) + '.',
      'Abrir a fila', 'indexacao/'));
  }

  for (const c of e.correccoes || []) {
    out.push(frase('correccoes', 'info', 'Foram publicadas correcções em ' + plural(c.paginas, 'página', 'páginas') + ': «' + c.titulo + '». ' +
      'Agora é esperar que o Google volte a ' + (c.paginas === 1 ? 'ela' : 'elas') + '.', 'Ver em observação', '#observacao'));
  }

  for (const r of e.regresso || []) {
    if (!r.novos) continue;
    out.push(frase('regresso', 'info', 'O Google já voltou a ' + num(r.com_rastreio) + ' de ' + plural(r.total, 'página corrigida', 'páginas corrigidas') +
      ' («' + r.titulo + '»)' + (r.novos < r.com_rastreio ? ', ' + num(r.novos) + ' desde a tua última visita' : '') + '.' +
      (r.proxima_avaliacao ? ' A avaliação começa a ' + dm(r.proxima_avaliacao) + '.' : ''), 'Ver em observação', '#observacao'));
  }

  for (const a of e.avaliacoes || []) {
    const partes = Object.entries(RESULTADO).filter(([k]) => a[k]).map(([k, rot]) => num(a[k]) + ' ' + rot);
    const n = Object.keys(RESULTADO).reduce((s, k) => s + (a[k] || 0), 0);
    out.push(frase('avaliacoes', a.PIOROU ? 'alerta' : a.MELHORIA_OBSERVADA ? 'bom' : 'info',
      'Avaliação de «' + a.titulo + '» em ' + plural(n, 'página', 'páginas') + ': ' + partes.join(', ') + '. ' +
      'O resultado é o que se observou depois da correcção, não prova que a correcção o causou.', 'Ver resultados', '#resultados'));
  }

  if (X.entraram.length) {
    out.push(frase('indexacao', 'bom', 'O Google indexou ' + plural(X.entraram.length, 'página', 'páginas') + ': ' + listar(X.entraram) + '.',
      'Ver a indexação', 'evolucao/#s-ix'));
  }

  if (P.resolvidos.length) {
    const total = P.resolvidos.reduce((n, g) => n + g.caminhos.length, 0);
    out.push(frase('problemas', 'bom', (total === 1 ? 'Ficou resolvido 1 problema: ' : 'Ficaram resolvidos ' + num(total) + ' problemas: ') +
      P.resolvidos.map(g => g.titulo.charAt(0).toLowerCase() + g.titulo.slice(1) + ' (' + (g.caminhos.length <= 2 ? g.caminhos.join(', ') : num(g.caminhos.length) + ' páginas') + ')').join('; ') + '.',
      'Ver resultados', '#resultados'));
  }

  for (const l of e.licoes || []) {
    out.push(frase('licoes', l.agora === 'REFUTADA' ? 'alerta' : 'bom', l.agora === 'CONFIRMADA'
      ? 'Lição confirmada: «' + l.titulo + '». Passa a ser boa prática no manual.'
      : 'Lição que não resultou: «' + l.titulo + '». O módulo deixa de a aplicar sozinho e pede mais evidência.', 'Ver a aprendizagem', 'aprendizagem/'));
  }

  for (const i of inc.filter(x => !x.aberto)) {
    out.push(frase('modulo', 'info', 'Entre ' + quando(i.aberto_em) + ' e ' + quando(i.fechado_em) + ' o módulo esteve com tarefas a falhar (' +
      duracao(i.duracao_min) + ', ' + plural(i.execucoes_perdidas, 'execução perdida', 'execuções perdidas') + '). Já voltou ao normal.',
      'Ver a operação', 'evolucao/#s-op'));
  }
  return out;
}

/* Os dados do dia que o «Hoje» ainda não tinha. Só leitura. */
export async function lerDadosDoDia(db, { desde, agora }) {
  const [inc, idx, cor, licoes] = await Promise.all([
    db.prepare('SELECT * FROM incidentes WHERE aberto_em > ? OR fechado_em > ? OR fechado_em IS NULL ORDER BY aberto_em').bind(desde, desde).all(),
    db.prepare(`SELECT g.caminho, g.veredicto AS agora,
        (SELECT i.veredicto FROM inspecoes i WHERE i.caminho = g.caminho AND i.erro IS NULL AND i.veredicto IS NOT NULL
          AND i.inspeccionado_em <= ? ORDER BY i.inspeccionado_em DESC LIMIT 1) AS antes
      FROM paginas_google g`).bind(desde).all(),
    /* correcções que o módulo ficou a conhecer desde a visita: a publicação foi processada depois */
    db.prepare(`SELECT p.licao_chave, a.tipo, COUNT(*) AS paginas FROM pacotes_trabalho p JOIN deployments d ON d.id = p.deployment_id
      LEFT JOIN assuntos a ON a.chave = p.assunto_chave
      WHERE d.processado_em > ? GROUP BY COALESCE(p.licao_chave, a.tipo)`).bind(desde).all(),
    db.prepare('SELECT * FROM licoes').all()
  ]);
  /* só mudanças de estado: uma página vista pela primeira vez já indexada não «entrou» — soube-se agora */
  const entraram = [], sairam = [];
  for (const r of idx.results) {
    if (!r.antes || !r.agora) continue;
    if (r.antes === 'PASS' && r.agora !== 'PASS') sairam.push(r.caminho);
    else if (r.antes !== 'PASS' && r.agora === 'PASS') entraram.push(r.caminho);
  }
  return {
    incidentes: inc.results.map(i => descreverIncidente(i, agora)).filter(i => i.aberto || i.duracao_min >= 30 || i.execucoes_perdidas >= 5),
    indexacao: { entraram: entraram.sort(), sairam: sairam.sort() },
    correccoesPorLicao: cor.results,
    licoes: licoes.results
  };
}

/* -------------------------------------------------------- a semana -- */

const MIN_COMPARAR = 50;         /* impressões mínimas numa semana para comparar com a outra */
const MIN_PAGINA = 20;           /* impressões mínimas de uma página para ser destaque */

function comparacao(agora, antes, minimo = MIN_COMPARAR) {
  if (antes == null || antes < minimo || agora < minimo / 2) return null;
  const p = Math.round((agora - antes) / antes * 100);
  if (Math.abs(p) < 10) return 'praticamente igual à semana anterior';
  return (p > 0 ? 'mais ' : 'menos ') + Math.abs(p) + '% do que na semana anterior';
}

/* As frases da semana. Puro. d: ver gerarSemana. */
export function frasesDaSemana(d) {
  const secoes = [];
  const W = d.semana, P = d.anterior;

  /* 1. visibilidade */
  const vis = [];
  const c1 = P ? comparacao(W.impressoes, P.impressoes) : null;
  vis.push(frase('visibilidade', 'info', 'O site apareceu ' + plural(W.impressoes, 'vez', 'vezes') + ' nas pesquisas do Google e recebeu ' +
    plural(W.cliques, 'clique', 'cliques') + '.' + (!P ? ' É a primeira semana completa com dados: ainda não há com que comparar.'
      : c1 ? ' Nas impressões, ' + c1 + ' (' + num(P.impressoes) + ').' : ' A semana anterior tem poucos dados: ainda é cedo para comparar.'),
    'Ver a visão geral', 'evolucao/#s-vg'));
  const visiveis = W.marca.impressoes + W.nao_marca.impressoes;
  if (visiveis > 0) {
    /* «marca» são todos os termos da configuração: a marca, os métodos próprios e os nomes antigos.
       O Google esconde as pesquisas raras: com menos de metade visível, a divisão é parcial e não se compara. */
    const parcial = visiveis < W.impressoes / 2;
    const cm = P && !parcial ? comparacao(W.nao_marca.impressoes, P.nao_marca.impressoes) : null;
    vis.push(frase('visibilidade', 'info', 'Das pesquisas que o Google mostra (' + num(visiveis) + ' de ' + plural(W.impressoes, 'impressão', 'impressões') + '): ' +
      plural(W.marca.impressoes, 'impressão', 'impressões') + ' e ' + plural(W.marca.cliques, 'clique', 'cliques') + ' com a marca ou os métodos próprios (como Happy Soaring ou Pilot2Wing); ' +
      plural(W.nao_marca.impressoes, 'impressão', 'impressões') + ' e ' + plural(W.nao_marca.cliques, 'clique', 'cliques') + ' sobre o assunto, sem esses nomes' + (cm ? ' — ' + cm : '') + '.' +
      (parcial ? ' As outras ' + num(W.desconhecido) + ' são pesquisas raras que o Google não mostra: esta divisão é só parcial.'
        : W.desconhecido > 0 ? ' As outras ' + num(W.desconhecido) + ' são pesquisas raras que o Google não mostra.' : ''),
    'Ver a visão geral', 'evolucao/#s-vg'));
  }
  secoes.push({ id: 'visibilidade', titulo: 'Visibilidade no Google', frases: vis });

  /* 2. destaques */
  const des = [];
  const pags = d.paginas;
  const subiu = pags.filter(p => p.imp >= MIN_PAGINA && p.imp - p.imp_antes >= 10).sort((a, b) => (b.imp - b.imp_antes) - (a.imp - a.imp_antes))[0];
  const desceu = pags.filter(p => p.imp_antes >= MIN_PAGINA && p.imp_antes - p.imp >= 10).sort((a, b) => (b.imp_antes - b.imp) - (a.imp_antes - a.imp))[0];
  if (P && subiu) des.push(frase('destaques', 'bom', 'A página que mais subiu: ' + subiu.caminho + ', de ' + num(subiu.imp_antes) + ' para ' + num(subiu.imp) + ' impressões.', 'Ver páginas × língua', 'evolucao/#s-pg'));
  if (P && desceu) des.push(frase('destaques', 'alerta', 'A página que mais desceu: ' + desceu.caminho + ', de ' + num(desceu.imp_antes) + ' para ' + num(desceu.imp) + ' impressões.', 'Ver páginas × língua', 'evolucao/#s-pg'));
  const porLingua = LINGUAS.map(l => ({ l, imp: pags.filter(p => p.lingua === l).reduce((s, p) => s + p.imp, 0), antes: pags.filter(p => p.lingua === l).reduce((s, p) => s + p.imp_antes, 0) }));
  if (porLingua.some(x => x.imp > 0)) {
    des.push(frase('destaques', 'info', 'Impressões por língua da página: ' + porLingua.map(x => {
      const p = P && x.antes >= MIN_PAGINA ? Math.round((x.imp - x.antes) / x.antes * 100) : null;
      return x.l.toUpperCase() + ' ' + num(x.imp) + (p == null ? '' : ' (' + (p >= 0 ? '+' : '−') + Math.abs(p) + '%)');
    }).join(' · ') + '.', 'Ver páginas × língua', 'evolucao/#s-pg'));
  }
  secoes.push({ id: 'destaques', titulo: 'Destaques', frases: des, vazio: 'Nenhuma página mudou o suficiente para ser destaque.' });

  /* 3. oportunidade */
  const op = pags.filter(p => p.imp >= MIN_PAGINA && p.posicao >= 8.5 && p.posicao <= 20).sort((a, b) => b.imp - a.imp)[0];
  secoes.push({ id: 'oportunidade', titulo: 'Oportunidade da semana', vazio: 'Nenhuma página com pesquisas suficientes à beira da primeira página.', frases: op ? [frase('oportunidade', 'accao',
    op.caminho + ' apareceu ' + plural(op.imp, 'vez', 'vezes') + ' na posição média ' + String(op.posicao).replace('.', ',') + ' — ' +
    (op.posicao <= 10 ? 'no fundo da primeira página do Google' : 'na segunda página do Google') + ', onde poucas pessoas clicam. ' +
    'É a página com mais pesquisas à espera de ser vista.', 'Ver páginas × língua', 'evolucao/#s-pg')] : [] });

  /* 4. indexação */
  const X = d.indexacao, ix = [];
  if (X.total) {
    const dif = X.indexadas_antes == null ? null : X.indexadas - X.indexadas_antes;
    ix.push(frase('indexacao', 'info', 'No fim da semana, o Google tinha ' + num(X.indexadas) + ' de ' + plural(X.total, 'página', 'páginas') + ' indexadas' +
      (dif == null ? '.' : dif === 0 ? ', as mesmas da semana anterior.' : ' (' + (dif > 0 ? '+' : '−') + Math.abs(dif) + ' face à semana anterior).') +
      (X.nunca ? ' ' + plural(X.nunca, 'página ainda não foi visitada', 'páginas ainda não foram visitadas') + ' pelo Google.' : ''), 'Ver a indexação', 'evolucao/#s-ix'));
  }
  secoes.push({ id: 'indexacao', titulo: 'Indexação', frases: ix, vazio: 'Ainda sem inspecções para esta semana.' });

  /* 5. correcções e resultados */
  const cr = [];
  for (const c of d.correccoes) cr.push(frase('correccoes', 'info', 'Publicadas correcções em ' + plural(c.paginas, 'página', 'páginas') + ': «' + c.titulo + '».', 'Ver a aprendizagem', 'aprendizagem/'));
  for (const a of d.avaliacoes) {
    const partes = Object.entries(RESULTADO).filter(([k]) => a[k]).map(([k, rot]) => num(a[k]) + ' ' + rot);
    cr.push(frase('avaliacoes', a.PIOROU ? 'alerta' : 'info', 'Avaliadas as correcções «' + a.titulo + '»: ' + partes.join(', ') + ' (observado depois da correcção).', 'Ver a aprendizagem', 'aprendizagem/'));
  }
  secoes.push({ id: 'correccoes', titulo: 'Correcções e resultados', frases: cr, vazio: 'Nenhuma correcção publicada nem avaliada nesta semana.' });

  /* 6. o próprio módulo */
  const mod = d.incidentes.map(i => frase('modulo', 'alerta', 'A ' + quando(i.aberto_em) + ' o módulo teve tarefas a falhar durante ' + duracao(i.duracao_min) +
    ' (' + plural(i.execucoes_perdidas, 'execução perdida', 'execuções perdidas') + ': ' + i.tarefas.map(x => x.titulo).join(', ') + '). ' + i.causa_provavel,
    'Ver a operação', 'evolucao/#s-op'));
  secoes.push({ id: 'modulo', titulo: 'O módulo', frases: mod,
    vazio: d.fim < REGISTO_EXECUCOES_DESDE ? 'Nesta semana o módulo ainda não registava as suas execuções.' : 'O módulo trabalhou sem paragens.' });

  /* 7. próximas datas */
  const px = [];
  if (d.proximas.espera) px.push(frase('datas', 'info', 'A ' + dm(d.proximas.espera.data) + ' acaba a espera de ' + plural(d.proximas.espera.paginas, 'página', 'páginas') +
    ' que o Google ainda não visitou. Se continuarem sem visita, o módulo volta a decidir — e à segunda espera passam para ti.', 'Abrir a fila', 'indexacao/'));
  if (d.proximas.avaliacao) px.push(frase('datas', 'info', 'A partir de ' + dm(d.proximas.avaliacao.data) + ' começam as avaliações das correcções (' +
    plural(d.proximas.avaliacao.paginas, 'página já visitada', 'páginas já visitadas') + ' pelo Google).', 'Ver em observação', '#observacao'));
  if (d.proximas.a_espera_do_google) px.push(frase('datas', 'info', plural(d.proximas.a_espera_do_google, 'página corrigida continua', 'páginas corrigidas continuam') +
    ' à espera de que o Google volte; só depois se pode avaliar.', 'Ver em observação', '#observacao'));
  if (d.proximas.semanas_completas < 4) px.push(frase('datas', 'info', 'Subidas e descidas confirmadas só com 4 semanas completas de dados: ' +
    (4 - d.proximas.semanas_completas === 1 ? 'falta 1.' : 'faltam ' + (4 - d.proximas.semanas_completas) + '.'), 'Ver a visão geral', 'evolucao/#s-vg'));
  secoes.push({ id: 'datas', titulo: 'Próximas datas', frases: px, vazio: 'Nada marcado.' });

  return secoes;
}

const caminhoApex = url => { try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'happysoaring.com' && !u.search ? u.pathname : null; } catch (e) { return null; } };

/* Junta os dados de uma semana (segunda-feira `semana`) e escreve as frases. Só leitura. */
export async function gerarSemana(db, semana, { agora = new Date().toISOString() } = {}) {
  const fim = somarDias(semana + 'T00:00:00Z', 6).slice(0, 10);
  const antes = somarDias(semana + 'T00:00:00Z', -7).slice(0, 10);
  const fimW = fim + 'T23:59:59.999Z', fimP = somarDias(semana + 'T00:00:00Z', -1).slice(0, 10) + 'T23:59:59.999Z';
  const hoje = agora.slice(0, 10);
  const [dias, marca, paginas, idx, cor, ava, inc, licoes, espera, pendentes, completas] = await Promise.all([
    db.prepare(`SELECT date(data, 'weekday 0', '-6 days') AS semana, COUNT(*) AS dias, SUM(cliques) AS cliques, SUM(impressoes) AS impressoes
      FROM gsc_dias WHERE completo = 1 AND data BETWEEN ? AND ? GROUP BY semana`).bind(antes, fim).all(),
    db.prepare(`SELECT semana, SUM(marca * cl) AS cliques_marca, SUM(marca * im) AS impressoes_marca,
        SUM((1 - marca) * cl) AS cliques_nao_marca, SUM((1 - marca) * im) AS impressoes_nao_marca FROM (
        SELECT date(c.data, 'weekday 0', '-6 days') AS semana, json_extract(j.value, '$[1]') AS cl, json_extract(j.value, '$[2]') AS im,
          EXISTS (SELECT 1 FROM termos_marca tm WHERE instr(lower(json_extract(j.value, '$[0]')), tm.termo) > 0
            OR instr(replace(lower(json_extract(j.value, '$[0]')), ' ', ''), replace(tm.termo, ' ', '')) > 0) AS marca
        FROM gsc_conjuntos c JOIN gsc_dias g ON g.data = c.data AND g.completo = 1, json_each(c.json) j
        WHERE c.conjunto = 'query' AND c.data BETWEEN ? AND ?) GROUP BY semana`).bind(antes, fim).all(),
    db.prepare(`SELECT date(c.data, 'weekday 0', '-6 days') AS semana, json_extract(j.value, '$[0]') AS url,
        SUM(json_extract(j.value, '$[1]')) AS cliques, SUM(json_extract(j.value, '$[2]')) AS impressoes,
        SUM(json_extract(j.value, '$[4]') * json_extract(j.value, '$[2]')) AS pos_imp
      FROM gsc_conjuntos c JOIN gsc_dias g ON g.data = c.data AND g.completo = 1, json_each(c.json) j
      WHERE c.conjunto = 'page' AND c.data BETWEEN ? AND ? GROUP BY semana, url`).bind(antes, fim).all(),
    db.prepare(`SELECT g.caminho,
        (SELECT i.veredicto FROM inspecoes i WHERE i.caminho = g.caminho AND i.erro IS NULL AND i.veredicto IS NOT NULL AND i.inspeccionado_em <= ?1 ORDER BY i.inspeccionado_em DESC LIMIT 1) AS fim_w,
        (SELECT i.veredicto FROM inspecoes i WHERE i.caminho = g.caminho AND i.erro IS NULL AND i.veredicto IS NOT NULL AND i.inspeccionado_em <= ?2 ORDER BY i.inspeccionado_em DESC LIMIT 1) AS fim_p,
        (SELECT i.ultimo_rastreio IS NULL FROM inspecoes i WHERE i.caminho = g.caminho AND i.erro IS NULL AND i.inspeccionado_em <= ?1 ORDER BY i.inspeccionado_em DESC LIMIT 1) AS nunca
      FROM paginas_google g`).bind(fimW, fimP).all(),
    db.prepare(`SELECT p.licao_chave, a.tipo, COUNT(*) AS paginas FROM pacotes_trabalho p LEFT JOIN assuntos a ON a.chave = p.assunto_chave
      WHERE p.publicado_em BETWEEN ? AND ? GROUP BY COALESCE(p.licao_chave, a.tipo)`).bind(semana, fimW).all(),
    db.prepare(`SELECT p.licao_chave, a.tipo, v.resultado, COUNT(*) AS n FROM avaliacoes v JOIN pacotes_trabalho p ON p.id = v.pacote_id
      LEFT JOIN assuntos a ON a.chave = p.assunto_chave
      WHERE v.avaliado_em BETWEEN ? AND ? GROUP BY COALESCE(p.licao_chave, a.tipo), v.resultado`).bind(semana, fimW).all(),
    db.prepare('SELECT * FROM incidentes WHERE aberto_em BETWEEN ? AND ? ORDER BY aberto_em').bind(semana, fimW).all(),
    db.prepare('SELECT chave, titulo FROM licoes').all(),
    db.prepare(`SELECT d.adiar_ate AS data, COUNT(*) AS paginas FROM assunto_decisoes d JOIN assuntos a ON a.chave = d.assunto_chave
      WHERE a.resolvido_em IS NULL AND d.decisao = 'ADIAR' AND d.adiar_ate >= ?
        AND d.id = (SELECT MAX(x.id) FROM assunto_decisoes x WHERE x.assunto_chave = d.assunto_chave)
      GROUP BY d.adiar_ate ORDER BY d.adiar_ate LIMIT 1`).bind(hoje).all(),
    db.prepare(`SELECT p.publicado_em, g.ultimo_rastreio FROM pacotes_trabalho p LEFT JOIN avaliacoes v ON v.pacote_id = p.id
      LEFT JOIN paginas_google g ON g.caminho = p.caminho WHERE p.publicado_em IS NOT NULL AND v.id IS NULL`).all(),
    db.prepare(`SELECT COUNT(*) AS n FROM (SELECT date(data, 'weekday 0', '-6 days') AS s FROM gsc_dias WHERE completo = 1 GROUP BY s HAVING COUNT(*) = 7)`).first()
  ]);

  const L = new Map(licoes.results.map(l => [l.chave, l.titulo]));
  const titulo = (k, tipo) => L.get(k) || (TIPOS[tipo] ? TIPOS[tipo].titulo : 'outras correcções');
  const D = new Map(dias.results.map(x => [x.semana, x]));
  const M = new Map(marca.results.map(x => [x.semana, x]));
  const resumo = s => {
    const x = D.get(s);
    if (!x || x.dias !== 7) return null;
    const m = M.get(s) || {};
    const visI = (m.impressoes_marca || 0) + (m.impressoes_nao_marca || 0);
    return {
      cliques: x.cliques, impressoes: x.impressoes,
      marca: { cliques: m.cliques_marca || 0, impressoes: m.impressoes_marca || 0 },
      nao_marca: { cliques: m.cliques_nao_marca || 0, impressoes: m.impressoes_nao_marca || 0 },
      desconhecido: Math.max(0, x.impressoes - visI)
    };
  };
  const W = resumo(semana);
  if (!W) return null;

  const porCaminho = new Map();
  for (const r of paginas.results) {
    const c = caminhoApex(r.url);
    if (!c) continue;
    if (!porCaminho.has(c)) porCaminho.set(c, { caminho: c, lingua: linguaDoCaminho(c), imp: 0, imp_antes: 0, pos_imp: 0 });
    const p = porCaminho.get(c);
    if (r.semana === semana) { p.imp += r.impressoes; p.pos_imp += r.pos_imp; } else if (r.semana === antes) p.imp_antes += r.impressoes;
  }
  const pags = [...porCaminho.values()].map(p => ({ ...p, posicao: p.imp ? Math.round(p.pos_imp / p.imp * 10) / 10 : null }));

  const avaPorLicao = new Map();
  for (const a of ava.results) {
    const k = a.licao_chave || a.tipo;
    if (!avaPorLicao.has(k)) avaPorLicao.set(k, { titulo: titulo(a.licao_chave, a.tipo) });
    avaPorLicao.get(k)[a.resultado] = a.n;
  }
  const visitadas = pendentes.results.filter(p => p.ultimo_rastreio && p.ultimo_rastreio > p.publicado_em);
  const primeiraAvaliacao = visitadas.map(p => somarDias(p.ultimo_rastreio, DIAS_ATE_AVALIAR)).sort()[0];
  const comP = idx.results.filter(r => r.fim_p);

  const dados = {
    fim,
    semana: W,
    anterior: resumo(antes),
    paginas: pags,
    indexacao: {
      total: idx.results.filter(r => r.fim_w).length,
      indexadas: idx.results.filter(r => r.fim_w === 'PASS').length,
      indexadas_antes: comP.length ? comP.filter(r => r.fim_p === 'PASS').length : null,
      nunca: idx.results.filter(r => r.fim_w && r.nunca === 1).length
    },
    correccoes: cor.results.map(c => ({ titulo: titulo(c.licao_chave, c.tipo), paginas: c.paginas })),
    avaliacoes: [...avaPorLicao.values()],
    incidentes: inc.results.map(i => descreverIncidente(i, agora)),
    proximas: {
      espera: espera.results[0] || null,
      avaliacao: primeiraAvaliacao ? { data: primeiraAvaliacao.slice(0, 10), paginas: visitadas.length } : null,
      a_espera_do_google: pendentes.results.length - visitadas.length,
      semanas_completas: completas?.n ?? 0
    }
  };
  const secoes = frasesDaSemana(dados);
  return { semana, fim, gerada_em: agora, secoes, destaque: secoes[0].frases[0]?.texto ?? null };
}

/* Na execução do Search Console: se a última semana completa ainda não tem revista, escreve-a. */
export async function executarCicloSemana(db, { agora = new Date().toISOString() } = {}) {
  const ultima = await db.prepare(`SELECT s.semana FROM (SELECT date(data, 'weekday 0', '-6 days') AS semana, COUNT(*) AS dias
      FROM gsc_dias WHERE completo = 1 GROUP BY semana) s
    WHERE s.dias = 7 AND NOT EXISTS (SELECT 1 FROM semanas_revista r WHERE r.semana = s.semana)
      AND s.semana > COALESCE((SELECT MAX(semana) FROM semanas_revista), '')
    ORDER BY s.semana DESC LIMIT 1`).first();
  if (!ultima) return { gerada: null };
  const r = await gerarSemana(db, ultima.semana, { agora });
  if (!r) return { gerada: null };
  await db.prepare('INSERT OR IGNORE INTO semanas_revista (semana, fim, gerada_em, conteudo) VALUES (?, ?, ?, ?)')
    .bind(r.semana, r.fim, r.gerada_em, JSON.stringify({ secoes: r.secoes, destaque: r.destaque })).run();
  return { gerada: r.semana };
}

export async function listarSemanas(db) {
  const { results } = await db.prepare('SELECT semana, fim, gerada_em, json_extract(conteudo, \'$.destaque\') AS destaque FROM semanas_revista ORDER BY semana DESC LIMIT 60').all();
  return results;
}

export async function lerSemana(db, semana) {
  const r = semana
    ? await db.prepare('SELECT * FROM semanas_revista WHERE semana = ?').bind(semana).first()
    : await db.prepare('SELECT * FROM semanas_revista ORDER BY semana DESC LIMIT 1').first();
  if (!r) return null;
  let c = {};
  try { c = JSON.parse(r.conteudo); } catch (e) { c = {}; }
  return { semana: r.semana, fim: r.fim, gerada_em: r.gerada_em, secoes: c.secoes || [], destaque: c.destaque || null };
}
