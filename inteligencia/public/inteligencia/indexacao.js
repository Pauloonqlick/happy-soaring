/* Fila de indexação: o que o Google ainda não rastreou depois da última alteração.
   O pedido continua a ser feito à mão no Search Console; aqui regista-se que foi feito.
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
  const quando = s => s ? new Date(s).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const PROPRIEDADE = 'sc-domain:happysoaring.com';

  const ESTADOS = {
    PENDENTE: ['Por pedir', 'chip chip-conteudo'],
    ULTRAPASSADO: ['Pedido ultrapassado', 'chip chip-conteudo'],
    PEDIDO: ['Pedido — à espera de rastreio', 'chip'],
    SEM_INSPECCAO: ['Ainda sem inspecção', 'chip'],
    RASTREADO_DEPOIS_DO_PEDIDO: ['Rastreado depois do pedido', 'chip chip-ok'],
    RASTREADO_SEM_PEDIDO: ['Rastreado sem pedido', 'chip chip-ok']
  };
  const TIPOS = { conteudo: 'conteúdo', dados: 'dados do CMS', nova: 'página nova' };

  function linkInspeccao(caminho) {
    return 'https://search.google.com/search-console/inspect?resource_id=' + encodeURIComponent(PROPRIEDADE) +
      '&id=' + encodeURIComponent('https://happysoaring.com' + caminho);
  }

  function mostrar(d) {
    $('nota').textContent = d.nota;

    const lim = $('limitacoes');
    lim.textContent = '';
    if (d.limitacoes.historico_publicacoes_em_curso) {
      lim.appendChild(el('li', 'O histórico de publicações ainda está a ser processado (' + d.limitacoes.publicacoes_por_processar +
        ' por processar): algumas alterações recentes ainda não aparecem aqui.'));
    }
    if (d.limitacoes.quota_esgotada_hoje) lim.appendChild(el('li', 'A quota de inspecção esgotou hoje — a inspecção retoma sozinha. É uma limitação, não um problema.'));
    if (d.limitacoes.inspeccao_em_pausa_ate) lim.appendChild(el('li', 'Inspecção em pausa até ' + quando(d.limitacoes.inspeccao_em_pausa_ate) + '.'));

    const r = d.resumo, cx = $('resumo');
    cx.textContent = '';
    for (const [n, rotulo] of [[r.por_pedir, 'por pedir'], [r.pedidos, 'pedidas, à espera'], [r.sem_inspeccao, 'sem inspecção ainda'],
      [r.rastreados_depois_do_pedido + r.rastreados_sem_pedido, 'rastreadas depois da alteração'], [r.inspeccionadas, 'inspeccionadas']]) {
      const b = el('div', null, 'resumo-n');
      b.appendChild(el('b', String(n)));
      b.appendChild(el('span', rotulo));
      cx.appendChild(b);
    }

    const tbody = $('linhas');
    tbody.textContent = '';
    const comEstado = d.paginas.filter(p => p.estado);
    if (!comEstado.length) {
      $('estado').hidden = false;
      $('estado').textContent = d.resumo.inspeccionadas
        ? 'Nenhuma página com alteração observada. A fila enche quando uma publicação alterar páginas.'
        : 'Ainda sem dados: a inspecção corre sozinha de 10 em 10 minutos.';
      $('caixa').hidden = true;
      return;
    }
    $('estado').hidden = true;
    $('caixa').hidden = false;

    for (const p of comEstado) {
      const tr = el('tr');
      const tdP = el('td');
      const a = el('a', p.caminho);
      a.href = 'https://happysoaring.com' + p.caminho; a.target = '_blank'; a.rel = 'noopener';
      tdP.appendChild(a);
      if (p.canonico_divergente) { tdP.appendChild(document.createTextNode(' ')); tdP.appendChild(el('span', 'canónico diferente', 'chip chip-sujo')); }
      tr.appendChild(tdP);

      const [rotulo, classe] = ESTADOS[p.estado] || [p.estado, 'chip'];
      const tdE = el('td');
      tdE.appendChild(el('span', rotulo, classe));
      if (p.atraso_horas != null) tdE.appendChild(el('div', 'rastreado ' + p.atraso_horas + ' h depois do pedido', 'sub'));
      tr.appendChild(tdE);

      tr.appendChild(el('td', p.ultima_alteracao
        ? quando(p.ultima_alteracao.em) + ' · ' + (TIPOS[p.ultima_alteracao.tipo] || p.ultima_alteracao.tipo) : '—'));
      tr.appendChild(el('td', quando(p.ultimo_rastreio)));
      tr.appendChild(el('td', p.ultima_inspeccao ? quando(p.ultima_inspeccao) + (p.cobertura ? ' · ' + p.cobertura : '') : '—'));
      tr.appendChild(el('td', quando(p.pedido_em)));

      const tdA = el('td');
      if (p.estado === 'PENDENTE' || p.estado === 'ULTRAPASSADO' || p.estado === 'SEM_INSPECCAO') {
        const abrir = el('a', 'Abrir no Search Console', 'botao-link');
        abrir.href = linkInspeccao(p.caminho); abrir.target = '_blank'; abrir.rel = 'noopener';
        tdA.appendChild(abrir);
        const b = el('button', 'Já pedi', 'abrir');
        b.type = 'button';
        b.addEventListener('click', () => registar(p.caminho, b));
        tdA.appendChild(b);
      }
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    }
  }

  function registar(caminho, botao) {
    botao.disabled = true;
    botao.textContent = 'A registar…';
    fetch('/inteligencia/api/indexacao/pedido', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-hs-inteligencia': '1', accept: 'application/json' },
      body: JSON.stringify({ caminho })
    })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(mostrar)
      .catch(e => { botao.disabled = false; botao.textContent = 'Falhou (' + e.message + ') — tentar outra vez'; });
  }

  fetch('/inteligencia/api/indexacao', { credentials: 'same-origin', headers: { accept: 'application/json' } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(mostrar)
    .catch(e => { $('estado').textContent = 'Não foi possível ler a fila (' + e.message + ').'; });

  fetch('/inteligencia/api/estado', { credentials: 'same-origin' }).then(r => r.json())
    .then(d => { $('quem').textContent = d.identidade ? 'Sessão: ' + d.identidade : ''; }).catch(() => {});
})();
