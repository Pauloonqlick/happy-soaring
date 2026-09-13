/* Origem dos contactos: registo simples, sem dados pessoais. */
(function () {
  'use strict';
  const { $, el, obter, enviar, dia, hojeIso, opcoes, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/contactos';
  const form = $('novo');
  form.elements.recebido_em.value = hojeIso();
  form.elements.recebido_em.max = hojeIso();

  function mostrar(d) {
    const nomeObj = id => id ? ((d.objectivos.find(o => o.id === id) || {}).nome || id) : 'Outro ou não se sabe';
    if (!form.elements.como_encontrou.options.length) {
      opcoes(form.elements.como_encontrou, Object.entries(d.como_encontrou), 'escolher…');
      opcoes(form.elements.objectivo_id, d.objectivos.map(o => [o.id, o.nome]), 'Outro ou não se sabe');
    }
    const r = $('resumo');
    r.textContent = '';
    const grupo = (titulo, linhas, nome) => {
      r.appendChild(el('h3', titulo));
      const ul = el('ul', null, 'lista');
      if (!linhas.length) ul.appendChild(el('li', 'Nenhum contacto.'));
      for (const x of linhas) ul.appendChild(el('li', nome(x.chave) + ': ' + x.n));
      r.appendChild(ul);
    };
    const u = d.ultimos_90_dias;
    grupo('Como encontrou', u.por_origem, k => d.como_encontrou[k] || k);
    grupo('O que procurava', u.por_objectivo, nomeObj);
    grupo('País', u.por_pais, k => k || 'não se sabe');

    const tb = $('linhas');
    tb.textContent = '';
    $('estado').hidden = d.contactos.length > 0;
    $('estado').textContent = 'Nenhum contacto registado.';
    $('caixa').hidden = !d.contactos.length;
    for (const c of d.contactos) {
      const tr = el('tr');
      tr.appendChild(el('td', dia(c.recebido_em)));
      tr.appendChild(el('td', d.como_encontrou[c.como_encontrou] || c.como_encontrou));
      tr.appendChild(el('td', c.pais || '—'));
      tr.appendChild(el('td', nomeObj(c.objectivo_id)));
      tb.appendChild(tr);
    }
  }

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const saida = $('resultado'), botao = form.querySelector('button');
    botao.disabled = true;
    saida.textContent = 'A registar…';
    enviar(API, {
      recebido_em: form.elements.recebido_em.value, como_encontrou: form.elements.como_encontrou.value,
      pais: form.elements.pais.value.trim(), objectivo_id: form.elements.objectivo_id.value
    })
      .then(d => {
        saida.textContent = 'Registado.';
        form.elements.pais.value = '';
        form.elements.como_encontrou.value = '';
        mostrar(d);
      })
      .catch(e => { saida.textContent = e.message; })
      .finally(() => { botao.disabled = false; });
  });

  obter(API).then(mostrar).catch(e => { $('estado').textContent = 'Não foi possível ler (' + e.message + ').'; });
})();
