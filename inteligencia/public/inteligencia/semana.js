/* «Semana em revista»: o texto de cada semana, tal como foi escrito quando o Search
   Console fechou os 7 dias. Só leitura. Tudo o que vem da API é escrito com textContent. */
(function () {
  'use strict';
  const { $, el, obter, dia, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/semanas';
  /* as ligações das frases são relativas ao «Hoje» */
  const destino = href => '/inteligencia/' + href;

  function mostrar(semana) {
    return obter(API + '/' + encodeURIComponent(semana)).then(w => {
      $('semana-titulo').textContent = 'Semana de ' + dia(w.semana) + ' a ' + dia(w.fim);
      $('semana-gerada').textContent = 'Escrita a ' + new Date(w.gerada_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) +
        ', quando o Search Console fechou os 7 dias. O que se lê aqui não muda depois.';
      const raiz = $('semana-secoes');
      raiz.textContent = '';
      for (const s of w.secoes) {
        const sec = el('section', null, 'bloco semana-seccao');
        sec.appendChild(el('h2', s.titulo));
        if (!s.frases.length) sec.appendChild(el('p', s.vazio || 'Nada a dizer.', 'vazio'));
        else {
          const ul = el('ul', null, 'leitura-frases');
          for (const f of s.frases) {
            const li = el('li', null, 'frase frase-' + f.tom);
            li.appendChild(el('span', f.texto));
            if (f.ligacao) {
              const a = el('a', f.ligacao.rotulo);
              a.href = destino(f.ligacao.href);
              li.appendChild(a);
            }
            ul.appendChild(li);
          }
          sec.appendChild(ul);
        }
        raiz.appendChild(sec);
      }
      try { localStorage.setItem('hs-inteligencia-semana-lida', w.semana); } catch (e) { /* sem armazenamento: não faz mal */ }
    });
  }

  obter(API).then(({ semanas }) => {
    const estado = $('estado');
    if (!semanas.length) {
      estado.textContent = 'Ainda não há nenhuma semana escrita. A primeira aparece quando o Search Console fechar os 7 dias de uma semana (normalmente à terça ou quarta-feira).';
      return;
    }
    estado.hidden = true;
    const sel = $('semana-escolha');
    for (const s of semanas) {
      const o = el('option', dia(s.semana) + ' a ' + dia(s.fim));
      o.value = s.semana;
      sel.appendChild(o);
    }
    const pedida = new URLSearchParams(location.search).get('s');
    sel.value = semanas.some(s => s.semana === pedida) ? pedida : semanas[0].semana;
    $('escolha').hidden = semanas.length < 2;
    sel.addEventListener('change', () => {
      history.replaceState(null, '', '?s=' + sel.value);
      mostrar(sel.value).catch(e => { estado.hidden = false; estado.textContent = 'Não foi possível ler a semana (' + e.message + ').'; });
    });
    return mostrar(sel.value);
  }).catch(e => { $('estado').textContent = 'Não foi possível ler as semanas (' + e.message + ').'; });
})();
