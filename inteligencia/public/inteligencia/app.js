/* Ecrã «Hoje»: estado, configuração base e publicações observadas.
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

  /* bloco 2 — «desde a última visita» é deste browser: guarda-se aqui, e só aqui */
  const CHAVE_VISITA = 'hs-inteligencia-ultima-visita';
  let ultimaVisita = null;
  try { ultimaVisita = localStorage.getItem(CHAVE_VISITA); } catch (e) { ultimaVisita = null; }

  function mostrarMudancas() {
    return fetch('api/alteracoes', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => {
        const feitas = j.publicacoes.filter(x => x.processamento === 'PROCESSADO');
        const novas = ultimaVisita ? feitas.filter(x => x.criado_em_cf > ultimaVisita) : [];
        const p = $('mudou'), ul = $('mudou-lista');
        ul.textContent = '';
        if (!ultimaVisita) {
          p.textContent = 'Primeira visita neste browser. A partir de agora, este bloco mostra o que mudou entre visitas.';
        } else if (!novas.length) {
          p.textContent = 'Nenhuma publicação nova desde ' + new Date(ultimaVisita).toLocaleString('pt-PT') + '.';
        } else {
          p.textContent = novas.length === 1 ? '1 publicação nova do site:' : novas.length + ' publicações novas do site:';
          for (const x of novas.slice(0, 5)) {
            const li = el('li');
            const a = el('a', (x.short_id || x.id.slice(0, 8)) + ' · ' + new Date(x.criado_em_cf).toLocaleString('pt-PT'));
            a.href = 'alteracoes/#' + x.id;
            li.appendChild(a);
            ul.appendChild(li);
          }
          ul.hidden = false;
        }
        try { localStorage.setItem(CHAVE_VISITA, new Date().toISOString()); } catch (e) { /* sem armazenamento: não faz mal */ }
      })
      .catch(() => { $('mudou').textContent = 'Não foi possível ler as publicações.'; });
  }

  /* blocos 3 e 4 — a partir da fila de indexação */
  function mostrarIndexacao() {
    return fetch('api/indexacao', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(d => {
        /* bloco 3: os pedidos de indexação agrupam-se numa só acção */
        const ul = $('accoes-lista');
        ul.textContent = '';
        const n = d.resumo.por_pedir;
        if (n) {
          const li = el('li');
          const a = el('a', 'Pedir indexação de ' + n + (n === 1 ? ' página alterada' : ' páginas alteradas') +
            ' que o Google ainda não voltou a rastrear');
          a.href = 'indexacao/';
          li.appendChild(a);
          ul.appendChild(li);
          ul.hidden = false;
          $('accoes').hidden = true;
        }

        /* bloco 4: episódios — páginas alteradas e se houve rastreio depois */
        const obs = d.paginas.filter(p => p.ultima_alteracao && p.estado && p.estado !== 'SEM_INSPECCAO')
          .sort((x, y) => String(y.ultima_alteracao.em).localeCompare(String(x.ultima_alteracao.em)));
        const ol = $('observacao-lista');
        ol.textContent = '';
        if (!obs.length) {
          $('observacao').textContent = d.limitacoes.historico_publicacoes_em_curso
            ? 'Nenhum episódio ainda — o histórico de publicações está a ser processado.'
            : 'Nenhum episódio.';
        } else {
          $('observacao').textContent = obs.length + (obs.length === 1 ? ' página alterada' : ' páginas alteradas') + ' em observação:';
          for (const p of obs.slice(0, 5)) {
            const dias = Math.max(0, Math.floor((Date.now() - Date.parse(p.ultima_alteracao.em)) / 864e5));
            ol.appendChild(el('li', p.caminho + ' · alterada há ' + dias + (dias === 1 ? ' dia' : ' dias') +
              ' · rastreio posterior: ' + (p.rastreio_posterior === 'SIM'
                ? 'sim, ' + new Date(p.ultimo_rastreio).toLocaleDateString('pt-PT') : 'ainda não')));
          }
          if (obs.length > 5) {
            const li = el('li');
            const a = el('a', 'mais ' + (obs.length - 5) + ' na fila de indexação');
            a.href = 'indexacao/';
            li.appendChild(a);
            ol.appendChild(li);
          }
          ol.hidden = false;
          $('nota-rastreio').textContent = d.nota;
          $('nota-rastreio').hidden = false;
        }

        /* bloco 6 */
        const ns = $('ns-inspeccao');
        ns.textContent = d.limitacoes.quota_esgotada_hoje
          ? 'Inspecção de URL — a quota diária esgotou; retoma sozinha.'
          : d.resumo.sem_inspeccao ? 'Inspecção de URL — ' + d.resumo.inspeccionadas + ' páginas inspeccionadas, ' +
            d.resumo.sem_inspeccao + ' alteradas ainda por inspeccionar.'
          : d.resumo.inspeccionadas ? 'Inspecção de URL — ligada · ' + d.resumo.inspeccionadas + ' páginas inspeccionadas.'
          : 'Inspecção de URL — ligada, à espera da primeira execução.';
        if (d.resumo.inspeccionadas && !d.resumo.sem_inspeccao && !d.limitacoes.quota_esgotada_hoje) ns.hidden = true;
      })
      .catch(() => {
        $('observacao').textContent = 'Não foi possível ler a fila de indexação.';
        $('ns-inspeccao').textContent = 'Inspecção de URL — não foi possível ler o estado.';
      });
  }

  const num = n => new Intl.NumberFormat('pt-PT').format(n);
  function mostrarSearchConsole() {
    return fetch('api/search-console', { credentials: 'same-origin', headers: { accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(s => {
        const dl = $('gsc');
        dl.textContent = '';
        if (!s.periodo) { par(dl, 'Estado', 'Ainda sem dias recolhidos.'); return; }
        const dataPt = d => d.split('-').reverse().join('/');
        par(dl, 'Dados', dataPt(s.periodo.primeiro_dia_com_dados) + ' a ' + dataPt(s.periodo.fim) + ' · ' +
          s.periodo.dias_com_dados + (s.periodo.dias_com_dados === 1 ? ' dia completo' : ' dias completos'));
        if (s.periodo.dias_por_completar) par(dl, 'Recolha', 'em curso — faltam ' + s.periodo.dias_por_completar + ' dias', 'falha');
        par(dl, 'Cliques', num(s.totais.cliques));
        par(dl, 'Impressões', num(s.totais.impressoes));
        const m = s.marca;
        par(dl, 'Marca', num(m.marca.impressoes) + ' impr. · ' + num(m.marca.cliques) + ' cl.');
        par(dl, 'Não-marca', num(m.nao_marca.impressoes) + ' impr. · ' + num(m.nao_marca.cliques) + ' cl.');
        par(dl, 'Desconhecido', num(m.desconhecido.impressoes) + ' impr. · ' + num(m.desconhecido.cliques) + ' cl.');
        par(dl, 'Visível por pesquisa', s.cobertura_queries == null ? '—' : s.cobertura_queries + '% das impressões');
        if (s.paises.length) par(dl, 'Países', s.paises.slice(0, 5).map(p => p.pais.toUpperCase() + ' ' + num(p.impressoes)).join(' · '));
      })
      .catch(() => { const dl = $('gsc'); dl.textContent = ''; par(dl, 'Estado', 'Não foi possível ler.', 'falha'); });
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

      /* bloco 6 — o estado da fonte, dito como é */
      const pub = d.fontes && d.fontes.publicacoes;
      $('ns-publicacoes').textContent = !pub ? 'Publicações do site — não foi possível ler o estado.'
        : !pub.credencial ? 'Publicações do site — falta a credencial de leitura do Cloudflare Pages.'
        : pub.pendentes ? 'Publicações do site — ' + pub.pendentes + ' por processar (' + pub.processadas + ' já observadas).'
        : pub.processadas ? 'Publicações do site — ligado · ' + pub.processadas + ' observadas.'
        : 'Publicações do site — ligado, à espera da primeira observação.';
      if (pub && pub.credencial && !pub.pendentes && pub.processadas) $('ns-publicacoes').hidden = true;

      const g = d.fontes && d.fontes.search_console;
      $('ns-gsc').textContent = !g ? 'Search Console — não foi possível ler o estado.'
        : !g.credencial ? 'Search Console — falta a autorização Google (só leitura).'
        : g.dias && g.completos < g.dias ? 'Search Console — a recolher o histórico: ' + g.completos + ' de ' + g.dias + ' dias.'
        : g.dias ? 'Search Console — ligado · dados até ' + g.ultima + '.'
        : 'Search Console — ligado, à espera da primeira recolha.';
      if (g && g.credencial && g.dias && g.completos === g.dias) $('ns-gsc').hidden = true;

      /* o aviso do topo diz o que está mesmo ligado, a partir do estado real das fontes */
      const ligadas = [], porLigar = [];
      (pub && pub.credencial ? ligadas : porLigar).push('as publicações do site');
      (g && g.credencial ? ligadas : porLigar).push('o Search Console');
      ligadas.push('a inspecção de URL');
      const juntar = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : l.join('');
      $('aviso').textContent = (ligadas.length ? 'O módulo recolhe ' + juntar(ligadas) + '. ' : '') +
        (porLigar.length ? 'Ainda por ligar: ' + juntar(porLigar) + '. ' : '') + 'A verificação de problemas vem depois.';

      return Promise.all([mostrarMudancas(), mostrarSearchConsole(), mostrarIndexacao()]);
    })
    .catch(e => mostrarErro('Não foi possível ler o estado (' + e.message + ').'));
})();
