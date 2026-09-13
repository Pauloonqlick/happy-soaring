/* Painel «Evolução»: operação, indexação, página × língua e visão geral.
   Tudo o que vem da API é escrito com textContent — nunca como HTML. */
(function () {
  'use strict';
  const { $, el, obter, data, dia, quem } = window.HS;
  const { barras, linhas } = window.HSG;
  quem();
  const API = '/inteligencia/api/evolucao/';
  const num = n => n == null ? '—' : new Intl.NumberFormat('pt-PT').format(n);
  const hora = s => s ? new Date(s).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—';
  const LINGUAS = ['pt', 'en', 'es', 'fr', 'de'];
  const FAMILIAS = { inicial: 'Inicial', asas: 'Asas', spots: 'Spots', paginas: 'Páginas principais' };
  const TENDENCIA = {
    HISTORICO_INSUFICIENTE: ['histórico insuficiente', 'chip'], AMOSTRA_INSUFICIENTE: ['amostra insuficiente', 'chip'],
    ESTAVEL: ['estável', 'chip'], A_OBSERVAR: ['a observar', 'chip chip-conteudo'],
    QUEDA_CONFIRMADA: ['queda confirmada', 'chip chip-sujo'], SUBIDA_CONFIRMADA: ['subida confirmada', 'chip chip-ok']
  };
  const SINAIS = {
    NAO_INDEXADA: ['não indexada', 'chip chip-sujo'], ATRAS_DAS_IRMAS: ['atrás das irmãs', 'chip chip-conteudo'],
    INDEXADA_SEM_IMPRESSOES: ['sem impressões', 'chip'], QUEDA_CONFIRMADA: ['queda', 'chip chip-sujo'], SUBIDA_CONFIRMADA: ['subida', 'chip chip-ok']
  };
  const semanaCurta = s => s.slice(8, 10) + '/' + s.slice(5, 7);

  function tabela(cabecalhos, linhasDados, classe = '') {
    const cx = el('div', null, 'tabela-cx');
    const tb = el('table', null, 'tabela ' + classe);
    const tr = el('tr');
    for (const h of cabecalhos) { const th = el('th', h); th.scope = 'col'; tr.appendChild(th); }
    const thead = el('thead'); thead.appendChild(tr); tb.appendChild(thead);
    const tbody = el('tbody');
    for (const l of linhasDados) {
      const r = el('tr');
      for (const c of l) {
        const td = el('td');
        if (c instanceof Node) td.appendChild(c); else td.textContent = c == null ? '—' : String(c);
        r.appendChild(td);
      }
      tbody.appendChild(r);
    }
    tb.appendChild(tbody);
    cx.appendChild(tb);
    return cx;
  }
  const chip = ([t, c]) => el('span', t, c);
  const erro = (id, e) => { $(id).textContent = 'Não foi possível ler (' + e.message + ').'; };

  /* ---------------------------------------------------------- 1. operação -- */
  function operacao() {
    return obter(API + 'operacao').then(d => {
      const raiz = $('op');
      raiz.textContent = '';
      raiz.appendChild(el('h3', 'Tarefas'));
      raiz.appendChild(tabela(['Tarefa', 'Quando corre', 'Última execução', 'Últimas 24 h', 'Próxima'], d.tarefas.map(t => {
        const ult = el('span');
        if (!t.ultima) ult.textContent = 'ainda sem registo';
        else {
          ult.appendChild(el('span', hora(t.ultima.inicio) + ' · ' + num(t.ultima.duracao_ms) + ' ms '));
          ult.appendChild(chip(t.ultima.ok ? ['ok', 'chip chip-ok'] : ['falhou', 'chip chip-sujo']));
          if (t.ultima.erro) ult.appendChild(el('div', t.ultima.erro, 'sub'));
        }
        return [t.titulo, t.regra, ult, num(t.ultimas_24h.execucoes) + ' execuções · ' + num(t.ultimas_24h.falhas) + ' falhas', hora(t.proxima)];
      })));

      const f = d.filas;
      const cartao = (titulo, pares) => {
        const s = el('section', null, 'painel cartao');
        s.appendChild(el('h3', titulo));
        const dl = el('dl', null, 'pares');
        for (const [k, v, estado] of pares) { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v, estado)); }
        s.appendChild(dl);
        return s;
      };
      const grelha = el('div', null, 'cartoes');
      const p = f.publicacoes;
      grelha.appendChild(cartao('Publicações do site', [
        ['Em fila', num(p.pendentes), p.pendentes ? 'falha' : 'ok'], ['Processadas', num(p.processadas)], ['Sem leitura possível', num(p.sem_leitura)],
        ['Ritmo (últimas 6 h)', num(p.por_hora_ultimas_6h) + ' por hora'],
        ['Fim estimado', p.pendentes ? (p.horas_para_acabar != null ? 'daqui a ~' + num(p.horas_para_acabar) + ' h' : 'sem ritmo medido') : 'em dia']
      ]));
      const g = f.search_console;
      grelha.appendChild(cartao('Search Console', [
        ['Dias recolhidos', num(g.dias) + (g.por_completar ? ' (' + g.por_completar + ' por completar)' : ' (todos completos)')],
        ['Dados', g.primeiro ? dia(g.primeiro) + ' a ' + dia(g.ultimo) : '—'], ['Última recolha', data(g.ultima_recolha)]
      ]));
      const i = f.inspeccao;
      grelha.appendChild(cartao('Inspecção de URL', [
        ['Páginas inspeccionadas', num(i.paginas)], ['Inspecções nas últimas 24 h', num(i.inspeccoes_24h) + ' de ' + num(i.quota_diaria_partilhada) + ' (quota partilhada)'],
        ['Inspecção com mais de 7 dias', num(i.com_mais_de_7_dias)], ['Nunca rastreadas', num(i.nunca_rastreadas)],
        ['Pausa por quota', i.em_pausa_ate ? 'até ' + hora(i.em_pausa_ate) : 'não', i.em_pausa_ate ? 'falha' : 'ok']
      ]));
      const a = f.assuntos;
      grelha.appendChild(cartao('Problemas e decisões', [
        ['Activos', num(a.activos)], ['Críticos', num(a.criticos), a.criticos ? 'falha' : 'ok'],
        ['Por decidir', num(a.por_decidir) + (a.por_decidir ? ' (~' + a.execucoes_de_decisao_em_falta + ' execução/ões)' : '')],
        ['Última detecção', a.ultimo_ciclo ? data(a.ultimo_ciclo.em) : '—'],
        ['Decisões nas últimas 24 h', f.decisoes_24h.map(x => x.n + ' ' + x.decisao.toLowerCase().replace('_', ' ')).join(' · ') || 'nenhuma']
      ]));
      const k = f.pacotes;
      grelha.appendChild(cartao('Trabalho do Claude', [
        ['Por implementar', num(k.por_implementar)], ['Implementados, por publicar', num(k.implementados_por_publicar)],
        ['Publicados, à espera de avaliação', num(k.publicados_por_avaliar)], ['Avaliados', num(k.avaliados)]
      ]));
      const av = f.avisos;
      grelha.appendChild(cartao('Avisos por email', [
        ['Estado', !av ? '—' : av.configurado ? 'ligados' : 'por ligar', av && av.configurado ? 'ok' : 'falha'],
        ['Último envio', av && av.ultimo_envio ? data(av.ultimo_envio.em) : '—'],
        ['Última falha', av && av.ultima_falha ? data(av.ultima_falha.em) + ' (' + av.ultima_falha.erro + ')' : '—']
      ]));
      raiz.appendChild(grelha);

      raiz.appendChild(el('h3', 'Limitações registadas nas últimas 24 h'));
      const ul = el('ul', null, 'lista');
      if (!d.eventos_24h.length) ul.appendChild(el('li', 'Nenhuma.'));
      for (const e of d.eventos_24h) ul.appendChild(el('li', e.tipo.toLowerCase().replace(/_/g, ' ') + ' — ' + e.n + '× (última às ' + hora(e.ultimo) + ')'));
      raiz.appendChild(ul);
    }).catch(e => erro('op', e));
  }

  /* --------------------------------------------------------- 2. indexação -- */
  function indexacao() {
    return obter(API + 'indexacao').then(d => {
      const raiz = $('ix');
      raiz.textContent = '';
      const linhaEstado = (nome, v) => [nome, num(v.paginas), v.percentagem_indexada == null ? '—' : v.percentagem_indexada + '%', num(v.nao_indexadas),
        num(v.nunca_rastreadas), v.mediana_dias_desde_rastreio == null ? '—' : num(v.mediana_dias_desde_rastreio) + ' dias',
        [v.faixas.ate_7, v.faixas.de_8_a_30, v.faixas.de_31_a_90, v.faixas.mais_de_90].join(' · '), num(v.rastreios_por_pagina_60d)];
      const cab = ['', 'Páginas', 'Indexadas', 'Não indexadas', 'Nunca rastreadas', 'Desde o último rastreio (mediana)', 'Rastreio há ≤7 · 8–30 · 31–90 · >90 dias', 'Rastreios por página (60 dias)'];
      raiz.appendChild(el('h3', 'Por língua da página'));
      raiz.appendChild(tabela(cab, LINGUAS.map(l => linhaEstado(l.toUpperCase(), d.por_lingua[l]))));
      raiz.appendChild(el('h3', 'Por família'));
      raiz.appendChild(tabela(cab, Object.entries(FAMILIAS).map(([k, n]) => linhaEstado(n, d.por_familia[k]))));

      raiz.appendChild(el('h3', 'Percentagem indexada por semana'));
      if (d.semanas.length < 2) raiz.appendChild(el('p', 'Só há ' + d.semanas.length + ' semana de inspecções: a evolução aparece a partir da segunda.', 'nota'));
      raiz.appendChild(linhas(d.semanas.map(s => ({ rotulo: semanaCurta(s.semana), valores: s.por_lingua })),
        LINGUAS.map(l => ({ chave: l, nome: l.toUpperCase(), classe: 'g-' + l })), { titulo: 'Percentagem indexada por língua', max: 100, sufixo: '%' }));

      raiz.appendChild(el('h3', 'Tempo entre a alteração e o rastreio posterior'));
      const at = (nome, v) => [nome, num(v.rastreadas), v.mediana_dias == null ? '—' : num(v.mediana_dias) + ' dias', v.p75_dias == null ? '—' : num(v.p75_dias) + ' dias',
        num(v.pendentes), v.mediana_idade_pendentes_dias == null ? '—' : num(v.mediana_idade_pendentes_dias) + ' dias'];
      const cabA = ['', 'Já rastreadas', 'Mediana', '75% até', 'Ainda à espera', 'À espera há (mediana)'];
      raiz.appendChild(tabela(cabA, Object.entries(d.atraso_ate_rastreio.por_lingua).sort().map(([k, v]) => at(k.toUpperCase(), v))));
      raiz.appendChild(tabela(cabA, Object.entries(d.atraso_ate_rastreio.por_nivel).sort().map(([k, v]) => at(k, v))));
      raiz.appendChild(el('p', 'Medido com o último rastreio que o Google devolve: é o tempo máximo, o primeiro rastreio pode ter sido antes. ' +
        'Um rastreio posterior confirma que o Google voltou à página; não confirma que a nova versão já foi indexada.', 'nota'));

      raiz.appendChild(el('h3', 'Problemas por semana'));
      raiz.appendChild(barras(d.problemas.por_semana.map(s => ({ rotulo: semanaCurta(s.semana), valores: { detectados: s.detectados, resolvidos: s.resolvidos } })),
        [{ chave: 'detectados', nome: 'detectados', classe: 'g-detectados' }, { chave: 'resolvidos', nome: 'resolvidos', classe: 'g-resolvidos' }], { titulo: 'Problemas por semana' }));
      const ul = el('ul', null, 'lista');
      for (const [tipo, n] of Object.entries(d.problemas.activos_por_tipo).sort((a, b) => b[1] - a[1])) ul.appendChild(el('li', tipo.toLowerCase().replace(/_/g, ' ') + ': ' + n));
      ul.appendChild(el('li', 'Regressões (problemas que voltaram): ' + d.problemas.regressoes));
      raiz.appendChild(ul);
    }).catch(e => erro('ix', e));
  }

  /* -------------------------------------------------- 3. página × língua -- */
  let paginasDados = null;
  function desenharPaginas() {
    const d = paginasDados;
    const raiz = $('pg');
    raiz.textContent = '';
    const familia = $('filtro-familia').value, soSinais = $('filtro-sinais').checked;
    raiz.appendChild(el('p', 'Período: ' + dia(d.periodo.inicio) + ' a ' + dia(d.periodo.fim) + ' · ' + d.periodo.dias_com_dados + ' dias com dados · ' +
      num(d.periodo.impressoes) + ' impressões e ' + num(d.periodo.cliques) + ' cliques no site.' +
      (d.agrupamento_por_hreflang ? '' : ' As versões linguísticas ainda não estão agrupadas: o agrupamento vem do hreflang das publicações, que está a ser lido.'), 'nota'));

    const resumo = (nome, v, totalImp) => [nome, num(v.paginas), num(v.indexadas), num(v.com_impressoes), num(v.impressoes), num(v.cliques),
      totalImp ? Math.round(v.impressoes / totalImp * 100) + '%' : '—'];
    const totalImp = LINGUAS.reduce((s, l) => s + d.por_lingua[l].impressoes, 0);
    const cabR = ['', 'Páginas', 'Indexadas', 'Com impressões', 'Impressões', 'Cliques', 'Parte das impressões'];
    const duas = el('div', null, 'duas');
    const a = el('div'); a.appendChild(el('h3', 'Por língua')); a.appendChild(tabela(cabR, LINGUAS.map(l => resumo(l.toUpperCase(), d.por_lingua[l], totalImp)), 'tabela-estreita'));
    const b = el('div'); b.appendChild(el('h3', 'Por família')); b.appendChild(tabela(cabR, Object.entries(FAMILIAS).map(([k, n]) => resumo(n, d.por_familia[k], totalImp)), 'tabela-estreita'));
    duas.appendChild(a); duas.appendChild(b);
    raiz.appendChild(duas);

    const grupos = d.grupos.filter(g => (!familia || g.familia === familia) &&
      (!soSinais || Object.values(g.versoes).some(v => v.sinais.length)));
    raiz.appendChild(el('h3', 'Páginas conceptuais (' + grupos.length + ')'));
    const celula = v => {
      if (!v) return el('span', 'não existe', 'fraco-claro');
      const c = el('div', null, 'celula-versao');
      c.appendChild(el('div', num(v.impressoes) + ' impr. · ' + num(v.cliques) + ' cl.' + (v.posicao ? ' · pos. ' + v.posicao : '')));
      const chips = el('div');
      for (const s of v.sinais) chips.appendChild(chip(SINAIS[s] || [s, 'chip']));
      if (v.google && v.google.ultimo_rastreio) chips.appendChild(el('span', ' rastreio ' + dia(v.google.ultimo_rastreio), 'sub'));
      c.appendChild(chips);
      return c;
    };
    if (!d.agrupamento_por_hreflang) {
      /* sem hreflang lido ainda: uma linha por página, com a língua ao lado */
      const todas = grupos.flatMap(g => Object.entries(g.versoes).map(([l, v]) => ({ ...v, lingua: l.slice(0, 2), familia: g.familia })))
        .sort((x, y) => y.impressoes - x.impressoes);
      raiz.appendChild(tabela(['Página', 'Língua', 'Família', 'Impressões · cliques · posição', 'Sinais'], todas.map(v => {
        const link = el('a', v.caminho);
        link.href = 'https://happysoaring.com' + v.caminho; link.target = '_blank'; link.rel = 'noopener';
        const c = celula(v);
        return [link, v.lingua.toUpperCase(), FAMILIAS[v.familia] || v.familia, c.firstChild, c.lastChild];
      }), 'tabela-paginas'));
    } else raiz.appendChild(tabela(['Página', 'Família', ...LINGUAS.map(l => l.toUpperCase()), 'Total'], grupos.map(g => {
      const nome = el('div');
      const link = el('a', g.grupo);
      link.href = 'https://happysoaring.com' + g.grupo; link.target = '_blank'; link.rel = 'noopener';
      nome.appendChild(link);
      return [nome, FAMILIAS[g.familia] || g.familia, ...LINGUAS.map(l => celula(g.versoes[l])), num(g.impressoes) + ' impr. · ' + num(g.cliques) + ' cl.'];
    }), 'tabela-paginas'));

    if (d.outras_urls.length) {
      raiz.appendChild(el('h3', 'URLs fora das páginas conhecidas com impressões'));
      raiz.appendChild(tabela(['URL', 'Impressões', 'Cliques'], d.outras_urls.map(o => [o.url, num(o.impressoes), num(o.cliques)]), 'tabela-estreita'));
    }
    raiz.appendChild(el('p', d.nota, 'nota'));
  }
  function paginas() {
    return obter(API + 'paginas?dias=' + $('filtro-periodo').value).then(d => { paginasDados = d; desenharPaginas(); }).catch(e => erro('pg', e));
  }
  $('filtro-periodo').addEventListener('change', paginas);
  $('filtro-familia').addEventListener('change', () => paginasDados && desenharPaginas());
  $('filtro-sinais').addEventListener('change', () => paginasDados && desenharPaginas());

  /* ------------------------------------------------------ 4. visão geral -- */
  function geral() {
    return obter(API + 'geral').then(d => {
      const raiz = $('vg');
      raiz.textContent = '';
      const tend = el('p', null, 'tendencias');
      for (const [k, nome] of [['impressoes', 'Impressões'], ['cliques', 'Cliques'], ['impressoes_nao_marca', 'Impressões sem marca'], ['impressoes_marca', 'Impressões de marca']]) {
        tend.appendChild(el('span', nome + ': ', 'fraco'));
        tend.appendChild(chip(TENDENCIA[d.tendencias[k]] || [d.tendencias[k], 'chip']));
        tend.appendChild(document.createTextNode('  '));
      }
      raiz.appendChild(tend);
      const sem = d.semanas.map(s => ({ ...s, rotulo: semanaCurta(s.semana) + (s.completa ? '' : '*'), parcial: !s.completa }));
      raiz.appendChild(el('h3', 'Impressões por semana — marca, sem marca e desconhecido'));
      raiz.appendChild(barras(sem.map(s => ({ rotulo: s.rotulo, parcial: s.parcial,
        valores: { marca: s.marca.impressoes, nao: s.nao_marca.impressoes, desc: s.desconhecido.impressoes } })),
        [{ chave: 'marca', nome: 'marca', classe: 'g-marca' }, { chave: 'nao', nome: 'sem marca', classe: 'g-nao' }, { chave: 'desc', nome: 'desconhecido', classe: 'g-desc' }],
        { titulo: 'Impressões por semana' }));
      raiz.appendChild(el('h3', 'Cliques por semana'));
      raiz.appendChild(barras(sem.map(s => ({ rotulo: s.rotulo, parcial: s.parcial, valores: { marca: s.marca.cliques, nao: s.nao_marca.cliques, desc: s.desconhecido.cliques } })),
        [{ chave: 'marca', nome: 'marca', classe: 'g-marca' }, { chave: 'nao', nome: 'sem marca', classe: 'g-nao' }, { chave: 'desc', nome: 'desconhecido', classe: 'g-desc' }],
        { titulo: 'Cliques por semana' }));
      raiz.appendChild(el('h3', 'Semana a semana'));
      raiz.appendChild(tabela(['Semana', 'Dias', 'Cliques', 'Impressões', 'CTR', 'Posição média', 'Visível por pesquisa', 'Publicações', 'Rastreios observados', 'Correcções publicadas'],
        sem.slice().reverse().map(s => [dia(s.semana) + (s.completa ? '' : ' (incompleta)'), s.dias, num(s.cliques), num(s.impressoes),
          s.ctr == null ? '—' : s.ctr + '%', s.posicao ?? '—', s.cobertura_visivel == null ? '—' : s.cobertura_visivel + '%',
          num(s.anotacoes.publicacoes), num(s.anotacoes.rastreios_observados), num(s.anotacoes.correccoes_publicadas)])));
      raiz.appendChild(el('h3', 'Últimos dias'));
      raiz.appendChild(linhas(d.diario.map(x => ({ rotulo: x.data.slice(8, 10) + '/' + x.data.slice(5, 7), valores: { imp: x.impressoes, cl: x.cliques } })),
        [{ chave: 'imp', nome: 'impressões', classe: 'g-nao' }, { chave: 'cl', nome: 'cliques', classe: 'g-marca' }], { titulo: 'Impressões e cliques por dia' }));
      raiz.appendChild(el('p', d.nota + ' * semana incompleta.', 'nota'));
    }).catch(e => erro('vg', e));
  }

  operacao(); indexacao(); paginas(); geral();
  setInterval(operacao, 60000);
})();
