/* Aprendizagem: as lições e o manual de boas práticas. Só leitura. */
(function () {
  'use strict';
  const { $, el, obter, quem } = window.HS;
  quem();
  const ESTADO = { CONFIRMADA: 'confirmada', EM_TESTE: 'em teste', REFUTADA: 'não resultou' };

  obter('/inteligencia/api/aprendizagem').then(d => {
    $('estado').hidden = d.licoes.length > 0;
    $('estado').textContent = 'Ainda não há lições registadas.';
    const raiz = $('licoes');
    raiz.textContent = '';
    for (const l of d.licoes) {
      const s = el('section', null, 'painel');
      const h = el('h2', l.categoria);
      s.appendChild(h);
      const t = el('h3', l.titulo);
      t.appendChild(el('span', ESTADO[l.estado] || l.estado, 'chip licao-estado' + (l.estado === 'CONFIRMADA' ? ' chip-ok' : l.estado === 'REFUTADA' ? ' chip-sujo' : '')));
      s.appendChild(t);
      const dl = el('dl', null, 'pares');
      const par = (k, v) => { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); };
      par('Boa prática', l.prevencao);
      par('Sintoma', l.sintoma);
      par('Causa', l.causa);
      par('Correcção', l.correccao);
      const r = l.resultados;
      par('Casos', r.casos + ' detectado(s) · ' + r.activos + ' por resolver · ' + r.resolvidos + ' resolvido(s)');
      par('Avaliações', r.pacotes ? r.melhorias + ' melhoria(s) · ' + r.sem_efeito + ' sem efeito claro · ' + r.pioraram + ' pioraram · ' + r.inconclusivos + ' inconclusiva(s)' : 'ainda nenhuma');
      if (r.paginas.length) par('Páginas', r.paginas.join(', ') + (r.casos > r.paginas.length ? '…' : ''));
      par('Vale para', l.generica ? 'qualquer site' : 'só este site');
      s.appendChild(dl);
      raiz.appendChild(s);
    }
    $('manual').textContent = d.manual;
  }).catch(e => { $('estado').textContent = 'Não foi possível ler (' + e.message + ').'; });
})();
