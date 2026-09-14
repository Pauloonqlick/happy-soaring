/* Aprendizagem: o que falta aprender, as lições e o manual de boas práticas. Só leitura. */
(function () {
  'use strict';
  const { $, el, obter, quem } = window.HS;
  quem();
  const ESTADO = { CONFIRMADA: 'confirmada', EM_VIGOR: 'em vigor', EM_TESTE: 'em teste', REFUTADA: 'não resultou' };
  const FALTA = {
    FALTA_LICAO: ['falta lição', 'chip chip-sujo'],
    CAUSA_POR_DESCOBRIR: ['causa por descobrir', 'chip'],
    CAUSA_POR_CONFIRMAR: ['causa por confirmar', 'chip chip-sujo']
  };
  const referencias = l => { try { const r = l.referencias ? JSON.parse(l.referencias) : []; return Array.isArray(r) ? r : []; } catch (e) { return []; } };

  function faltaAprender(lista) {
    const raiz = $('falta');
    raiz.textContent = '';
    if (!lista || !lista.length) {
      raiz.appendChild(el('p', 'Nada: todos os problemas detectados e todos os incidentes já deixaram lição, ou foram dispensados com o motivo escrito.', 'nota'));
      return;
    }
    const ul = el('ul', null, 'lista falta-lista');
    for (const x of lista) {
      const li = el('li', null, 'linha-assunto');
      li.appendChild(el('span', FALTA[x.estado][0], FALTA[x.estado][1]));
      li.appendChild(document.createTextNode(' '));
      li.appendChild(el('strong', x.titulo));
      li.appendChild(el('span', ' · ' + x.detalhe, 'fraco'));
      const sub = [];
      if (x.hipoteses_eliminadas) sub.push(x.hipoteses_eliminadas + ' hipótese(s) já eliminada(s) — ver Conhecimento');
      if (x.activo) sub.push('ainda por resolver');
      sub.push('desde ' + new Date(x.desde).toLocaleDateString('pt-PT'));
      li.appendChild(el('div', sub.join(' · '), 'sub'));
      ul.appendChild(li);
    }
    raiz.appendChild(ul);
  }

  obter('/inteligencia/api/aprendizagem').then(d => {
    faltaAprender(d.falta_aprender);
    $('estado').hidden = d.licoes.length > 0;
    $('estado').textContent = 'Ainda não há lições registadas.';
    const raiz = $('licoes');
    raiz.textContent = '';
    for (const l of d.licoes) {
      const s = el('section', null, 'painel');
      const h = el('h2', l.categoria);
      s.appendChild(h);
      const t = el('h3', l.titulo);
      t.appendChild(el('span', ESTADO[l.estado] || l.estado, 'chip licao-estado' + (l.estado === 'CONFIRMADA' || l.estado === 'EM_VIGOR' ? ' chip-ok' : l.estado === 'REFUTADA' ? ' chip-sujo' : '')));
      s.appendChild(t);
      const dl = el('dl', null, 'pares');
      const par = (k, v) => { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); };
      par('Boa prática', l.prevencao);
      par('Sintoma', l.sintoma);
      par('Causa', l.causa);
      par('Correcção', l.correccao);
      if (l.natureza === 'PROCESSO') {
        par('Tipo', 'regra de trabalho — está em vigor desde que foi registada');
        par('Nasceu de', referencias(l).join('; ') || '—');
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
