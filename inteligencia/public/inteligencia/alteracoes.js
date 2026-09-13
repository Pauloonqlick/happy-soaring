/* Página «Alterações»: as publicações observadas e o que mudou em cada uma.
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
  const obter = url => fetch(url, { credentials: 'same-origin', headers: { accept: 'application/json' } })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  const data = s => s ? new Date(s).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  const ESTADO = {
    PROCESSADO: 'observada',
    PENDENTE: 'por processar',
    FALHOU: 'não foi possível ler'
  };
  const GRUPOS = [
    ['conteudo', 'Conteúdo alterado'],
    ['dados', 'Dados do CMS alterados (páginas que os carregam)'],
    ['nova', 'Páginas novas'],
    ['retirada', 'Páginas retiradas'],
    ['tecnica', 'Só alteração técnica'],
    ['sem_leitura', 'Sem leitura possível — limitação, não problema']
  ];

  function resumoContagens(alt) {
    if (!alt) return null;
    return GRUPOS.filter(([k]) => alt[k] && alt[k].length).map(([k, nome]) => [k, alt[k].length, nome]);
  }

  function abrir(p, linha, botao) {
    const seguinte = linha.nextElementSibling;
    if (seguinte && seguinte.classList.contains('linha-detalhe')) {
      seguinte.remove(); linha.classList.remove('aberta'); botao.setAttribute('aria-expanded', 'false');
      return;
    }
    const tr = el('tr', null, 'linha-detalhe');
    const td = el('td'); td.colSpan = 6;
    const caixa = el('div', 'A carregar…', 'detalhe');
    td.appendChild(caixa); tr.appendChild(td);
    linha.after(tr); linha.classList.add('aberta'); botao.setAttribute('aria-expanded', 'true');

    obter('/inteligencia/api/alteracoes/' + encodeURIComponent(p.id)).then(d => {
      caixa.textContent = '';
      if (!d.alteracoes) {
        caixa.appendChild(el('p', d.publicacao.processamento !== 'PROCESSADO'
          ? 'Ainda não há comparação: a publicação não está processada.'
          : 'Primeira publicação observada — não há anterior com que comparar.'));
        return;
      }
      const grupos = resumoContagens(d.alteracoes);
      if (!grupos.length) { caixa.appendChild(el('p', 'Nenhuma página mudou face à publicação anterior.')); return; }
      for (const [k, n, nome] of grupos) {
        caixa.appendChild(el('h4', nome + ' — ' + n));
        const ul = el('ul');
        for (const c of d.alteracoes[k]) ul.appendChild(el('li', c));
        caixa.appendChild(ul);
      }
    }).catch(e => { caixa.textContent = 'Não foi possível ler (' + e.message + ').'; });
  }

  obter('/inteligencia/api/alteracoes').then(j => {
    const lista = j.publicacoes;
    if (!lista.length) {
      $('estado').textContent = 'Ainda nenhuma publicação observada. A recolha corre sozinha de 2 em 2 minutos.';
      return;
    }
    $('estado').hidden = true;
    $('caixa').hidden = false;
    const tbody = $('linhas');
    for (const p of lista) {
      const tr = el('tr');
      tr.id = p.id;

      const tdId = el('td');
      const a = el('a', p.short_id || p.id.slice(0, 8));
      a.href = p.url; a.rel = 'noopener'; a.target = '_blank';
      tdId.appendChild(a);
      tr.appendChild(tdId);

      tr.appendChild(el('td', data(p.meta_publicado || p.criado_em_cf)));

      const tdC = el('td', p.meta_commit ? p.meta_commit.slice(0, 7) : '—');
      if (p.meta_sujo === 1) { tdC.appendChild(document.createTextNode(' ')); tdC.appendChild(el('span', 'árvore suja', 'chip chip-sujo')); }
      tr.appendChild(tdC);

      const est = ESTADO[p.processamento] || p.processamento;
      tr.appendChild(el('td', p.processamento === 'PENDENTE' && p.paginas_total
        ? est + ' · ' + p.paginas_lidas + '/' + p.paginas_total : est));

      tr.appendChild(el('td', p.paginas_total != null ? String(p.paginas_total) : '—', 'num'));

      const tdB = el('td');
      if (p.processamento === 'PROCESSADO') {
        const b = el('button', 'Ver alterações', 'abrir');
        b.type = 'button'; b.setAttribute('aria-expanded', 'false');
        b.addEventListener('click', () => abrir(p, tr, b));
        tdB.appendChild(b);
      }
      tr.appendChild(tdB);
      tbody.appendChild(tr);
    }
    const alvo = location.hash.slice(1);
    if (alvo) {
      const tr = document.getElementById(alvo);
      const b = tr && tr.querySelector('button.abrir');
      if (b) { b.click(); tr.scrollIntoView({ block: 'center' }); }
    }
  }).catch(e => { $('estado').textContent = 'Não foi possível ler as publicações (' + e.message + ').'; });

  obter('/inteligencia/api/estado').then(d => { $('quem').textContent = d.identidade ? 'Sessão: ' + d.identidade : ''; }).catch(() => {});
})();
