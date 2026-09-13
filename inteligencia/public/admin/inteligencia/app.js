/* Interface da Fase 1: lê o estado e a configuração base.
   Tudo o que vem da API é escrito com textContent — nunca como HTML. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, texto, classe) => {
    const e = document.createElement(tag);
    if (texto != null) e.textContent = texto;
    if (classe) e.className = classe;
    return e;
  };

  $('data').textContent = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'full' }).format(new Date());

  const IMPORTANCIA = { ALTA: 'importância alta', MEDIA: 'importância média', BAIXA: 'importância baixa' };
  const TIPO_TERMO = { MARCA: 'marca', METODO: 'método', NOME_ANTIGO: 'nome antigo' };

  function par(dl, rotulo, valor, estado) {
    dl.appendChild(el('dt', rotulo));
    dl.appendChild(el('dd', valor, estado));
  }

  function mostrarErro(texto) {
    const dl = $('estado');
    dl.textContent = '';
    par(dl, 'Estado', texto, 'falha');
  }

  fetch('api/estado', { credentials: 'same-origin', headers: { accept: 'application/json' } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      $('quem').textContent = d.identidade ? 'Sessão: ' + d.identidade : '';

      const dl = $('estado');
      dl.textContent = '';
      par(dl, 'Fase', String(d.fase));
      const base = d.sistema.base, bruto = d.sistema.armazenamento_bruto;
      par(dl, 'Base de dados', base.ok ? 'ligada · esquema ' + base.versao_esquema : 'indisponível', base.ok ? 'ok' : 'falha');
      par(dl, 'Armazenamento bruto', bruto.ok ? 'ligado' : 'indisponível', bruto.ok ? 'ok' : 'falha');
      par(dl, 'Lido em', new Date(d.agora).toLocaleString('pt-PT'));

      const c = d.configuracao;
      const ul = $('objectivos');
      ul.textContent = '';
      if (!c.objectivos) ul.appendChild(el('li', 'Não foi possível ler.'));
      else for (const o of c.objectivos) {
        ul.appendChild(el('li', o.nome + ' — ' + (IMPORTANCIA[o.importancia] || 'importância por definir') +
          (o.activo ? '' : ' (inactivo)')));
      }

      const marca = $('marca');
      marca.textContent = '';
      for (const t of c.termos_marca || []) {
        const li = el('li', t.termo);
        li.appendChild(el('em', TIPO_TERMO[t.tipo] || t.tipo));
        marca.appendChild(li);
      }

      $('mercados').textContent = !c.mercados ? 'Não foi possível ler.'
        : c.mercados.length ? c.mercados.length + ' configurados' : 'Por configurar.';
      $('concorrentes').textContent = c.concorrentes == null ? 'Não foi possível ler.'
        : c.concorrentes ? c.concorrentes + ' configurados' : 'Por configurar.';
    })
    .catch(e => mostrarErro('Não foi possível ler o estado (' + e.message + ').'));
})();
