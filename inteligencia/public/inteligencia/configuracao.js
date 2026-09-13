/* Configuração: importância dos objectivos; nível e objectivos de cada página. */
(function () {
  'use strict';
  const { $, el, obter, enviar, opcoes, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/configuracao';
  const IMPORTANCIAS = [['ALTA', 'Alta'], ['MEDIA', 'Média'], ['BAIXA', 'Baixa']];
  const NIVEIS = [['1', '1 — prioritária'], ['2', '2 — secundária'], ['3', '3 — restante']];

  function estadoGravacao(td, promessa) {
    td.textContent = 'a gravar…';
    return promessa.then(d => { td.textContent = 'gravado'; return d; }).catch(e => { td.textContent = e.message; });
  }

  function mostrar(d) {
    const tbo = $('objectivos');
    tbo.textContent = '';
    for (const o of d.objectivos) {
      const tr = el('tr');
      tr.appendChild(el('td', o.nome));
      const td = el('td');
      const s = el('select');
      s.setAttribute('aria-label', 'Importância de ' + o.nome);
      opcoes(s, IMPORTANCIAS, 'por definir', o.importancia);
      td.appendChild(s);
      tr.appendChild(td);
      const saida = el('td', null, 'sub');
      tr.appendChild(saida);
      s.addEventListener('change', () => estadoGravacao(saida, enviar(API + '/objectivo', { id: o.id, importancia: s.value })));
      tbo.appendChild(tr);
    }

    const cab = $('cab-paginas');
    cab.textContent = '';
    const trc = el('tr');
    trc.appendChild(el('th', 'Página'));
    trc.appendChild(el('th', 'Nível'));
    for (const o of d.objectivos) trc.appendChild(el('th', o.nome));
    trc.appendChild(el('th', ''));
    for (const th of trc.children) th.scope = 'col';
    cab.appendChild(trc);

    const tbp = $('paginas');
    tbp.textContent = '';
    $('estado').hidden = d.paginas.length > 0;
    $('estado').textContent = 'Ainda não há páginas conhecidas.';
    $('caixa').hidden = !d.paginas.length;
    for (const p of d.paginas) {
      const tr = el('tr');
      tr.appendChild(el('td', p.caminho));
      const tdN = el('td');
      const s = el('select');
      s.setAttribute('aria-label', 'Nível de ' + p.caminho);
      opcoes(s, NIVEIS, '—', p.nivel);
      tdN.appendChild(s);
      tr.appendChild(tdN);
      const caixas = [];
      for (const o of d.objectivos) {
        const td = el('td');
        const c = el('input');
        c.type = 'checkbox';
        c.value = o.id;
        c.checked = p.objectivos.includes(o.id);
        c.setAttribute('aria-label', o.nome + ' em ' + p.caminho);
        caixas.push(c);
        td.appendChild(c);
        tr.appendChild(td);
      }
      const saida = el('td', null, 'sub');
      tr.appendChild(saida);
      const gravar = () => estadoGravacao(saida, enviar(API + '/pagina', {
        caminho: p.caminho, nivel: s.value || null, objectivos: caixas.filter(c => c.checked).map(c => c.value)
      }));
      s.addEventListener('change', gravar);
      for (const c of caixas) c.addEventListener('change', gravar);
      tbp.appendChild(tr);
    }
  }

  obter(API).then(mostrar).catch(e => { $('estado').textContent = 'Não foi possível ler (' + e.message + ').'; });
})();
