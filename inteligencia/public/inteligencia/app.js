/* Ecrã «Hoje»: os seis blocos, sempre pela mesma ordem. Cada um pode dizer «nada».
   Tudo o que vem da API é escrito com textContent — nunca como HTML. */
(function () {
  'use strict';
  const { $, el, obter, enviar, data, dia, RESULTADOS, linhaAssunto } = window.HS;

  $('data').textContent = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'full' }).format(new Date());

  const IMPORTANCIA = { ALTA: 'importância alta', MEDIA: 'importância média', BAIXA: 'importância baixa' };
  const TIPO_TERMO = { MARCA: 'marca', METODO: 'método', NOME_ANTIGO: 'nome antigo' };
  const num = n => new Intl.NumberFormat('pt-PT').format(n);
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);

  function par(dl, rotulo, valor, estado) {
    dl.appendChild(el('dt', rotulo));
    dl.appendChild(el('dd', valor, estado));
  }
  function mostrarLista(ul, itens) {
    ul.textContent = '';
    for (const i of itens) ul.appendChild(i);
    ul.hidden = !itens.length;
  }

  /* «desde a última visita» é deste browser: guarda-se aqui, e só aqui */
  const CHAVE_VISITA = 'hs-inteligencia-ultima-visita';
  let ultimaVisita = null;
  try { ultimaVisita = localStorage.getItem(CHAVE_VISITA); } catch (e) { ultimaVisita = null; }

  /* bloco 2 — publicações */
  function mostrarMudancas() {
    return obter('api/alteracoes')
      .then(j => {
        const feitas = j.publicacoes.filter(x => x.processamento === 'PROCESSADO');
        const novas = ultimaVisita ? feitas.filter(x => x.criado_em_cf > ultimaVisita) : [];
        const p = $('mudou');
        if (!ultimaVisita) {
          p.textContent = 'Primeira visita neste browser. A partir de agora, este bloco mostra o que mudou entre visitas.';
        } else if (!novas.length) {
          p.textContent = 'Nenhuma publicação nova desde ' + new Date(ultimaVisita).toLocaleString('pt-PT') + '.';
        } else {
          p.textContent = novas.length === 1 ? '1 publicação nova do site:' : novas.length + ' publicações novas do site:';
          mostrarLista($('mudou-lista'), novas.slice(0, 5).map(x => {
            const li = el('li');
            const a = el('a', (x.short_id || x.id.slice(0, 8)) + ' · ' + new Date(x.criado_em_cf).toLocaleString('pt-PT'));
            a.href = 'alteracoes/#' + x.id;
            li.appendChild(a);
            return li;
          }));
        }
        try { localStorage.setItem(CHAVE_VISITA, new Date().toISOString()); } catch (e) { /* sem armazenamento: não faz mal */ }
      })
      .catch(() => { $('mudou').textContent = 'Não foi possível ler as publicações.'; });
  }

  function mostrarHoje() {
    return obter('api/hoje' + (ultimaVisita ? '?desde=' + encodeURIComponent(ultimaVisita) : ''))
      .then(h => {
        /* a leitura de hoje: só o que é novo, em frases */
        const lt = h.leitura;
        const quando = s => new Date(s).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' às');
        if (!lt) {
          $('leitura-desde').textContent = '';
          $('leitura-vazio').textContent = 'Não foi possível escrever a leitura de hoje.';
        } else {
          $('leitura-desde').textContent = lt.primeira_visita ? 'Nas últimas 24 horas' : 'Desde a tua última visita, ' + quando(lt.desde);
          $('leitura-vazio').textContent = lt.primeira_visita ? 'Nada de novo nas últimas 24 horas.' : 'Nada de novo desde a tua última visita.';
          mostrarLista($('leitura-frases'), lt.frases.map(f => {
            const li = el('li', null, 'frase frase-' + f.tom);
            li.appendChild(el('span', f.texto));
            if (f.ligacao) {
              const a = el('a', f.ligacao.rotulo);
              a.href = f.ligacao.href;
              li.appendChild(a);
            }
            return li;
          }));
        }
        $('leitura-vazio').hidden = !!(lt && lt.frases.length);

        /* a semana em revista: fica aqui até ser lida */
        const sm = h.semana;
        let lida = null;
        try { lida = localStorage.getItem('hs-inteligencia-semana-lida'); } catch (e) { lida = null; }
        $('semana-cartao').hidden = !sm || lida === sm.semana;
        if (sm) {
          $('semana-datas').textContent = dia(sm.semana) + ' a ' + dia(sm.fim);
          $('semana-destaque').textContent = sm.destaque || '';
          $('semana-ler').href = 'semana/?s=' + encodeURIComponent(sm.semana);
        }

        /* 1 */
        const c = h.bloco1.criticos;
        if (!h.ultimo_ciclo) $('b1').textContent = 'Ainda não verificado: a detecção de problemas ainda não correu.';
        else if (!c.length) $('b1').textContent = 'Nenhum problema crítico — com base na inspecção de ' + plural(h.bloco1.verificadas, 'página', 'páginas') + '.';
        else $('b1').textContent = plural(c.length, 'problema crítico:', 'problemas críticos:');
        /* o próprio módulo: tarefas que não correram ou foram cortadas */
        const inc = (h.bloco1.incidentes || []).map(i => {
          const hh = s => new Date(s).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          const tarefas = i.tarefas.map(x => x.titulo).join(', ');
          const li = el('li', null, 'linha-assunto');
          li.appendChild(el('strong', i.aberto
            ? 'O módulo tem tarefas a falhar desde ' + hh(i.aberto_em)
            : 'O módulo esteve com tarefas a falhar entre ' + hh(i.aberto_em) + ' e ' + hh(i.fechado_em) + ' — já voltou ao normal'));
          li.appendChild(el('div', plural(i.execucoes_perdidas, 'execução perdida', 'execuções perdidas') + ' (' + tarefas + '). ' + i.causa_provavel, 'sub'));
          const a = el('a', 'Ver na operação');
          a.href = 'evolucao/';
          li.appendChild(a);
          return li;
        });
        if (inc.some((x, k) => h.bloco1.incidentes[k].aberto) && !c.length) $('b1').textContent = 'O módulo não está a trabalhar como devia:';
        mostrarLista($('b1-lista'), inc.concat(c.map(a => linhaAssunto(a, ''))));
        $('bloco1').classList.toggle('bloco-critico', c.length > 0 || (h.bloco1.incidentes || []).some(i => i.aberto));

        /* 2 — assuntos e rastreios desde a última visita */
        const m = h.bloco2, extra = [];
        if (m) {
          for (const a of m.assuntos_novos.slice(0, 5)) { const li = linhaAssunto(a, ''); li.prepend(el('span', 'Novo: ', 'fraco')); extra.push(li); }
          for (const a of m.resolvidos.slice(0, 5)) { const li = linhaAssunto(a, ''); li.prepend(el('span', 'Resolvido: ', 'fraco')); extra.push(li); }
          const QUEM = { MODULO: 'pelo módulo', CLAUDE: 'pelo Claude', PAULO: 'por ti' };
          const DEC = { APROVAR: 'aprovado(s) para corrigir', IGNORAR: 'arquivado(s)', ADIAR: 'em espera', PEDIR_EVIDENCIA: 'em análise' };
          const tomadas = m.decisoes_tomadas.map(d => d.n + ' ' + (DEC[d.decisao] || d.decisao) + ' ' + (QUEM[d.por] || ''));
          if (tomadas.length) extra.push(el('li', 'Decisões: ' + tomadas.join(' · ') + '.'));
          if (m.rastreios.length) {
            extra.push(el('li', plural(m.rastreios.length, 'página rastreada', 'páginas rastreadas') + ' pelo Google: ' +
              m.rastreios.slice(0, 4).map(r => r.caminho).join(', ') + (m.rastreios.length > 4 ? '…' : '')));
          }
        }
        mostrarLista($('mudou-assuntos'), extra);

        /* 3 */
        const accoes = h.bloco3.accoes.map(a => {
          if (a.tipo !== 'PEDIR_INDEXACAO') return linhaAssunto(a, '');
          const li = el('li', null, 'linha-assunto');
          const l = el('a', 'Pedir indexação de ' + plural(a.hoje.length, 'página', 'páginas') + ' hoje' +
            (a.total > a.hoje.length ? ' (de ' + a.total + ')' : ''));
          l.href = 'indexacao/';
          li.appendChild(l);
          li.appendChild(el('div', 'O Google não voltou a estas páginas em 28 dias: ' + a.hoje.join(', '), 'sub'));
          return li;
        });
        for (const d of h.bloco3.decisoes_a_rever) {
          const li = el('li');
          const a = el('a', 'Rever a decisão activa «' + d.titulo + '» (data de revisão: ' + dia(d.revisao_em) + ')');
          a.href = 'conhecimento/';
          li.appendChild(a);
          accoes.push(li);
        }
        $('accoes').hidden = accoes.length > 0;
        $('accoes').textContent = 'Nada precisa de ti. O módulo decide e o Claude implementa.';
        mostrarLista($('accoes-lista'), accoes);

        /* 4 */
        const obs = h.bloco4.episodios, emObs = h.bloco4.em_observacao;
        const itens4 = [];
        for (const a of emObs) {
          const li = linhaAssunto(a, '');
          li.appendChild(el('div', 'Publicado em ' + dia(a.publicado_em) + ' · rastreio posterior: ' +
            (a.rastreio_posterior ? 'sim, ' + dia(a.rastreio_posterior) + ' · avaliação prevista a partir de ' + dia(a.avaliacao_prevista) : 'ainda não'), 'sub'));
          itens4.push(li);
        }
        for (const p of obs.slice(0, 5)) {
          const dias = Math.max(0, Math.floor((Date.now() - Date.parse(p.alterada_em)) / 864e5));
          itens4.push(el('li', p.caminho + ' · alterada há ' + plural(dias, 'dia', 'dias') + ' · rastreio posterior: ' +
            (p.rastreio_posterior === 'SIM' ? 'sim, ' + dia(p.ultimo_rastreio) : 'ainda não')));
        }
        if (obs.length > 5) {
          const li = el('li');
          const a = el('a', 'mais ' + (obs.length - 5) + ' na fila de indexação');
          a.href = 'indexacao/';
          li.appendChild(a);
          itens4.push(li);
        }
        $('observacao').textContent = itens4.length ? 'Episódios abertos:' : 'Nenhum episódio.';
        const trab = h.bloco4.trabalho_claude.map(g => el('li', g.titulo + ' — ' + plural(g.paginas, 'página', 'páginas') + ' por corrigir'));
        mostrarLista($('trabalho-claude'), trab);
        $('t-trabalho').hidden = !trab.length;
        mostrarLista($('observacao-lista'), itens4);
        $('nota-rastreio').textContent = h.nota_rastreio;
        $('nota-rastreio').hidden = !itens4.length;

        /* 5 */
        const res = h.bloco5.resultados;
        $('resultados').textContent = res.length ? 'Avaliações concluídas:' : 'Nenhum resultado' + (ultimaVisita ? ' desde a última visita.' : ' nos últimos 30 dias.');
        mostrarLista($('resultados-lista'), res.map(r => {
          const li = linhaAssunto(r, '');
          li.appendChild(el('div', (RESULTADOS[r.resultado] || r.resultado) + (r.razao ? ' — ' + r.razao : ''), 'sub'));
          return li;
        }));

        /* 6 */
        const b6 = h.bloco6;
        const lim = b6.limitacoes.map(t => el('li', t));
        if (b6.factos_por_confirmar) {
          const li = el('li');
          const a = el('a', plural(b6.factos_por_confirmar, 'facto por confirmar', 'factos por confirmar'));
          a.href = 'conhecimento/';
          li.appendChild(a);
          lim.push(li);
        }
        mostrarLista($('limitacoes'), lim);
        $('limitacoes').hidden = false;
        const hip = b6.hipoteses_em_teste.slice(0, 5).map(a => linhaAssunto(a, ''));
        if (b6.hipoteses_em_teste.length > 5) hip.push(el('li', 'e mais ' + (b6.hipoteses_em_teste.length - 5) + '.'));
        mostrarLista($('hipoteses'), hip);
        $('t-hipoteses').hidden = !b6.hipoteses_em_teste.length;
        const pend = b6.decisoes_pendentes.slice(0, 5).map(a => linhaAssunto(a, ''));
        if (b6.decisoes_pendentes.length > 5) pend.push(el('li', 'e mais ' + (b6.decisoes_pendentes.length - 5) + ' à espera de lugar nas acções de hoje.'));
        mostrarLista($('pendentes'), pend);
        $('t-pendentes').hidden = !b6.decisoes_pendentes.length;
        $('nao-verificado').textContent = 'O módulo ainda não verifica: ' + b6.ainda_nao_verificado.join('; ') + '.';
      })
      .catch(e => {
        for (const id of ['b1', 'accoes', 'observacao', 'resultados']) $(id).textContent = 'Não foi possível ler (' + e.message + ').';
      });
  }

  function mostrarSearchConsole() {
    return obter('api/search-console')
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

  obter('api/estado')
    .then(d => {
      $('quem').textContent = d.identidade ? 'Sessão: ' + d.identidade : '';

      const dl = $('estado');
      dl.textContent = '';
      par(dl, 'Fase', String(d.fase));
      const base = d.sistema.base, bruto = d.sistema.armazenamento_bruto;
      par(dl, 'Base de dados', base.ok ? 'ligada · esquema ' + base.versao_esquema : 'indisponível', base.ok ? 'ok' : 'falha');
      par(dl, 'Armazenamento bruto', bruto.ok ? 'ligado' : 'indisponível', bruto.ok ? 'ok' : 'falha');
      const av = d.fontes && d.fontes.avisos;
      par(dl, 'Avisos por email', !av ? 'não foi possível ler'
        : !av.configurado ? 'por ligar'
        : av.ultima_falha ? 'falhou em ' + data(av.ultima_falha.em) + ' (' + av.ultima_falha.erro + ')'
        : 'ligados · ' + av.destino + (av.ultimo_envio ? ' · último em ' + data(av.ultimo_envio.em) : ''),
        !av ? 'falha' : !av.configurado || av.ultima_falha ? 'falha' : 'ok');
      $('teste-aviso').hidden = !(av && av.configurado);
      par(dl, 'Lido em', new Date(d.agora).toLocaleString('pt-PT'));

      const c = d.configuracao;
      const ul = $('objectivos');
      ul.textContent = '';
      if (!c.objectivos) ul.appendChild(el('li', 'Não foi possível ler.'));
      else for (const o of c.objectivos) {
        ul.appendChild(el('li', o.nome + ' — ' + (IMPORTANCIA[o.importancia] || 'importância por definir') + (o.activo ? '' : ' (inactivo)')));
      }
      const marca = $('marca');
      marca.textContent = '';
      for (const t of c.termos_marca || []) {
        const li = el('li', t.termo);
        li.appendChild(el('em', TIPO_TERMO[t.tipo] || t.tipo));
        marca.appendChild(li);
      }
      $('mercados').textContent = !c.mercados ? 'Não foi possível ler.' : c.mercados.length ? c.mercados.length + ' configurados' : 'Por configurar.';
      $('concorrentes').textContent = c.concorrentes == null ? 'Não foi possível ler.' : c.concorrentes ? c.concorrentes + ' configurados' : 'Por configurar.';

      /* bloco 6 — o estado das fontes, dito como é */
      const pub = d.fontes && d.fontes.publicacoes;
      $('ns-publicacoes').textContent = !pub ? 'Publicações do site — não foi possível ler o estado.'
        : !pub.credencial ? 'Publicações do site — falta a credencial de leitura do Cloudflare Pages.'
        : pub.pendentes ? 'Publicações do site — ' + pub.pendentes + ' por processar (' + pub.processadas + ' já observadas).'
        : pub.processadas ? 'Publicações do site — ligado · ' + pub.processadas + ' observadas.'
        : 'Publicações do site — ligado, à espera da primeira observação.';
      $('ns-publicacoes').hidden = !!(pub && pub.credencial && !pub.pendentes && pub.processadas);

      const g = d.fontes && d.fontes.search_console;
      $('ns-gsc').textContent = !g ? 'Search Console — não foi possível ler o estado.'
        : !g.credencial ? 'Search Console — falta a autorização Google (só leitura).'
        : g.dias && g.completos < g.dias ? 'Search Console — a recolher o histórico: ' + g.completos + ' de ' + g.dias + ' dias.'
        : g.dias ? 'Search Console — ligado · dados até ' + g.ultima + '.'
        : 'Search Console — ligado, à espera da primeira recolha.';
      $('ns-gsc').hidden = !!(g && g.credencial && g.dias && g.completos === g.dias);

      /* o aviso do topo diz o que está mesmo ligado */
      const ligadas = [], porLigar = [];
      (pub && pub.credencial ? ligadas : porLigar).push('as publicações do site');
      (g && g.credencial ? ligadas : porLigar).push('o Search Console (com a inspecção de URL)');
      const juntar = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1] : l.join('');
      $('aviso').textContent = (ligadas.length ? 'O módulo recolhe ' + juntar(ligadas) + ' e detecta problemas de indexação e técnicos. ' : '') +
        (porLigar.length ? 'Ainda por ligar: ' + juntar(porLigar) + '. ' : '') +
        (av && av.configurado ? 'Os problemas críticos também chegam por email.' : 'Avisos por email ainda não ligados.');
    })
    .catch(e => { const dl = $('estado'); dl.textContent = ''; par(dl, 'Estado', 'Não foi possível ler o estado (' + e.message + ').', 'falha'); });

  $('teste-aviso').addEventListener('click', () => {
    const b = $('teste-aviso');
    b.disabled = true;
    $('teste-resultado').textContent = 'A enviar…';
    enviar('api/avisos/teste', {})
      .then(() => { $('teste-resultado').textContent = 'Enviado. Confirma se chegou ao teu email.'; })
      .catch(e => { $('teste-resultado').textContent = e.message; })
      .finally(() => { b.disabled = false; });
  });

  /* o «Hoje» lê a última visita antes de a mudança de publicações a actualizar */
  mostrarHoje().then(mostrarMudancas);
  mostrarSearchConsole();
})();
