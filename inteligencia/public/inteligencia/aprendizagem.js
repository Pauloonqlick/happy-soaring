/* Aprendizagem: o que falta aprender, as lições (com as fontes oficiais), as mudanças na
   documentação do Google e o manual de boas práticas. Só leitura. */
(function () {
  'use strict';
  const { $, el, obter, quem } = window.HS;
  quem();
  const ESTADO = { CONFIRMADA: 'confirmada', EM_VIGOR: 'em vigor', EM_TESTE: 'em teste', REFUTADA: 'não resultou' };
  const FALTA = {
    FALTA_LICAO: ['falta lição', 'chip chip-sujo'],
    CAUSA_POR_DESCOBRIR: ['causa por descobrir', 'chip'],
    CAUSA_POR_CONFIRMAR: ['causa por confirmar', 'chip chip-sujo'],
    REVER_LICAO: ['rever lição', 'chip chip-sujo'],
    SEM_FONTE: ['sem fonte oficial', 'chip']
  };
  const DOC = {
    POR_REVER: ['toca numa lição — por rever', 'chip chip-sujo'],
    REVISTA: ['revista', 'chip chip-ok'],
    SEM_LICOES: ['não toca nas lições', 'chip']
  };
  const json = v => { try { const r = v ? JSON.parse(v) : []; return Array.isArray(r) ? r : []; } catch (e) { return []; } };
  const dia = s => s ? new Date(s).toLocaleDateString('pt-PT') : '—';
  const ligacao = (texto, url) => { const a = el('a', texto); a.href = url; a.target = '_blank'; a.rel = 'noopener'; return a; };

  function faltaAprender(lista) {
    const raiz = $('falta');
    raiz.textContent = '';
    if (!lista || !lista.length) {
      raiz.appendChild(el('p', 'Nada: todos os problemas e incidentes deixaram lição, todas as lições têm fonte oficial e nenhuma mudança do Google está por rever.', 'nota'));
      return;
    }
    const ul = el('ul', null, 'lista falta-lista');
    for (const x of lista) {
      const li = el('li', null, 'linha-assunto');
      const [rot, cls] = FALTA[x.estado] || [x.estado, 'chip'];
      li.appendChild(el('span', rot, cls));
      li.appendChild(document.createTextNode(' '));
      li.appendChild(el('strong', x.titulo));
      li.appendChild(el('span', ' · ' + x.detalhe, 'fraco'));
      const sub = [];
      if (x.hipoteses_eliminadas) sub.push(x.hipoteses_eliminadas + ' hipótese(s) já eliminada(s) — ver Conhecimento');
      if (x.activo && x.origem !== 'documentacao') sub.push('ainda por resolver');
      sub.push('desde ' + dia(x.desde));
      li.appendChild(el('div', sub.join(' · '), 'sub'));
      ul.appendChild(li);
    }
    raiz.appendChild(ul);
  }

  function documentacao(d, licoes) {
    const raiz = $('documentacao');
    raiz.textContent = '';
    const cab = el('p', null, 'nota');
    cab.appendChild(document.createTextNode(d && d.lida_em
      ? 'Última leitura: ' + dia(d.lida_em) + ' · próxima: ' + dia(d.proxima) + '. '
      : 'Ainda não foi lida: a primeira leitura faz-se na próxima execução dos avisos. '));
    cab.appendChild(ligacao('Página oficial das actualizações', (d && d.pagina) || 'https://developers.google.com/search/updates'));
    raiz.appendChild(cab);
    if (!d || !d.entradas.length) return;
    const titulo = new Map(licoes.map(l => [l.chave, l.titulo]));
    const ul = el('ul', null, 'lista falta-lista');
    for (const e of d.entradas) {
      const li = el('li', null, 'linha-assunto');
      const anterior = e.estado === 'REVISTA' && e.revista_por === 'MODULO';
      const [rot, cls] = anterior ? ['anterior à vigilância', 'chip'] : DOC[e.estado] || [e.estado, 'chip'];
      li.appendChild(el('span', rot, cls));
      li.appendChild(document.createTextNode(' '));
      li.appendChild(el('strong', e.titulo));
      li.appendChild(el('span', ' · ' + dia(e.publicada_em), 'fraco'));
      li.appendChild(el('div', e.resumo, 'sub'));
      const sub = el('div', null, 'sub');
      if (e.licoes.length) sub.appendChild(document.createTextNode('Toca em: ' + e.licoes.map(k => '«' + (titulo.get(k) || k) + '»').join(', ') + '. '));
      if (e.revisao && !anterior) sub.appendChild(document.createTextNode('Revisão: ' + e.revisao + ' '));
      e.ligacoes.slice(0, 3).forEach((u, i) => { if (i) sub.appendChild(document.createTextNode(' · ')); sub.appendChild(ligacao(i ? 'outra página' : 'página alterada', u)); });
      if (sub.childNodes.length) li.appendChild(sub);
      ul.appendChild(li);
    }
    raiz.appendChild(ul);
  }

  obter('/inteligencia/api/aprendizagem').then(d => {
    faltaAprender(d.falta_aprender);
    documentacao(d.documentacao, d.licoes);
    $('estado').hidden = d.licoes.length > 0;
    $('estado').textContent = 'Ainda não há lições registadas.';
    const raiz = $('licoes');
    raiz.textContent = '';
    for (const l of d.licoes) {
      const s = el('section', null, 'painel');
      s.appendChild(el('h2', l.categoria));
      const t = el('h3', l.titulo);
      t.appendChild(el('span', ESTADO[l.estado] || l.estado, 'chip licao-estado' + (l.estado === 'CONFIRMADA' || l.estado === 'EM_VIGOR' ? ' chip-ok' : l.estado === 'REFUTADA' ? ' chip-sujo' : '')));
      s.appendChild(t);
      const dl = el('dl', null, 'pares');
      const par = (k, v) => { dl.appendChild(el('dt', k)); dl.appendChild(typeof v === 'string' ? el('dd', v) : v); };
      par('Boa prática', l.prevencao);
      par('Sintoma', l.sintoma);
      par('Causa', l.causa);
      par('Correcção', l.correccao);
      const fontes = json(l.fontes);
      if (fontes.length) {
        const dd = el('dd');
        fontes.forEach((f, i) => { if (i) dd.appendChild(document.createTextNode(' · ')); dd.appendChild(ligacao(f.titulo, f.url)); });
        par('Fonte oficial', dd);
      } else if (l.natureza !== 'PROCESSO') {
        par('Fonte oficial', 'ainda por indicar');
      }
      if (l.natureza === 'PROCESSO') {
        par('Tipo', 'regra de trabalho — está em vigor desde que foi registada');
        par('Nasceu de', json(l.referencias).join('; ') || '—');
      } else {
        const r = l.resultados;
        par('Casos', r.casos + ' detectado(s) · ' + r.activos + ' por resolver · ' + r.resolvidos + ' resolvido(s)');
        par('Avaliações', r.pacotes ? r.melhorias + ' melhoria(s) · ' + r.sem_efeito + ' sem efeito claro · ' + r.pioraram + ' pioraram · ' + r.inconclusivos + ' inconclusiva(s)' : 'ainda nenhuma');
        if (r.paginas.length) par('Páginas', r.paginas.join(', ') + (r.casos > r.paginas.length ? '…' : ''));
      }
      par('Vale para', l.generica ? 'qualquer site' : 'só este site');
      s.appendChild(dl);
      raiz.appendChild(s);
    }
    $('manual').textContent = d.manual;
  }).catch(e => { $('estado').textContent = 'Não foi possível ler (' + e.message + ').'; });
})();
