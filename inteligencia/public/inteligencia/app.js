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
      if (pub && pub.processadas) $('aviso').textContent =
        'O módulo observa as publicações do site. Search Console e inspecção ainda não estão ligados.';

      return mostrarMudancas();
    })
    .catch(e => mostrarErro('Não foi possível ler o estado (' + e.message + ').'));
})();
