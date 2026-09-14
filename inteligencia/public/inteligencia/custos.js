/* «Custos»: consumo da conta Cloudflare contra o que o plano inclui, projecção até ao fim
   do ciclo e custo estimado. Só leitura. Tudo o que vem da API é escrito com textContent. */
(function () {
  'use strict';
  const { $, el, obter, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/custos';

  const NIVEL = {
    ok: ['dentro do incluído', 'chip chip-ok'], atencao: ['atenção', 'chip custos-atencao'],
    alerta: ['perto do limite', 'chip chip-sujo'], excedido: ['já a pagar a mais', 'chip chip-critico']
  };
  const usd = v => v == null ? '—' : v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  const pct = x => x == null ? '—' : (x * 100).toLocaleString('pt-PT', { maximumFractionDigits: x < 0.001 ? 4 : x < 0.1 ? 2 : 1 }) + '%';
  const dia = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const menosUmDia = d => new Date(Date.parse(d + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
  const quantidade = (v, m) => {
    if (v == null) return '—';
    if (m.unidade === 'GB') {
      const gb = v / 1e9;
      return gb < 0.01 ? (v / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + ' MB' : gb.toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' GB';
    }
    const suf = m.unidade === 'ms de CPU' ? ' ms' : '';
    const abs = Math.abs(v);
    if (abs >= 1e9) return (v / 1e9).toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' mil milhões' + suf;
    if (abs >= 1e6) return (v / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' milhões' + suf;
    return Math.round(v).toLocaleString('pt-PT') + suf;
  };
  const numero = (valor, rotulo, classe) => { const d = el('div', null, 'resumo-n' + (classe ? ' ' + classe : '')); d.appendChild(el('b', valor)); d.appendChild(el('span', rotulo)); return d; };

  function tabela(cab, linhas, classe = '') {
    const cx = el('div', null, 'tabela-cx');
    const tb = el('table', null, 'tabela ' + classe);
    const tr = el('tr'); for (const h of cab) { const th = el('th', h); th.scope = 'col'; tr.appendChild(th); }
    const th = el('thead'); th.appendChild(tr); tb.appendChild(th);
    const tbody = el('tbody');
    for (const l of linhas) {
      const r = el('tr'); if (l.classe) r.className = l.classe;
      for (const c of (l.celulas || l)) { const td = el('td'); if (c instanceof Node) td.appendChild(c); else td.textContent = c == null ? '—' : String(c); r.appendChild(td); }
      tbody.appendChild(r);
    }
    tb.appendChild(tbody); cx.appendChild(tb); return cx;
  }

  /* a barra: o que se usou (cheio), a projecção até ao fim do ciclo (tracejado) e o limite */
  function barra(m) {
    const cx = el('div', null, 'custos-barra');
    cx.setAttribute('role', 'img');
    cx.setAttribute('aria-label', pct(m.pct) + ' do incluído usado' + (m.armazenamento ? '' : '; projecção ' + pct(m.pct_projeccao)));
    const proj = el('span', null, 'custos-barra-proj'); proj.style.width = Math.min(100, m.pct_projeccao * 100) + '%';
    const uso = el('span', null, 'custos-barra-uso custos-' + m.nivel); uso.style.width = Math.max(m.usado > 0 ? 0.6 : 0, Math.min(100, m.pct * 100)) + '%';
    cx.appendChild(proj); cx.appendChild(uso);
    return cx;
  }

  let atras = Number(new URLSearchParams(location.search).get('ciclo')) || 0;

  function desenhar(d) {
    $('estado').hidden = true;
    const r = d.ultima_recolha;
    $('recolha').textContent = r ? 'Última leitura: ' + new Date(r.em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) + (r.ok ? '' : ' (com erros)') : 'Ainda sem leituras';
    $('sem-token').hidden = d.token_configurado;
    const temDados = d.historico.length > 0;
    if (!temDados) {
      $('conteudo').hidden = true;
      $('estado').hidden = false;
      $('estado').textContent = d.token_configurado ? 'O token está ligado; a primeira leitura acontece ao minuto 08 da próxima hora.' : 'Ainda não há consumos lidos.';
      return;
    }
    $('conteudo').hidden = false;
    const c = d.ciclo;
    $('periodo').textContent = 'Ciclo de ' + dia(c.inicio) + ' a ' + dia(menosUmDia(c.fim)) + (c.actual ? ' (actual)' : '');
    $('seguinte').disabled = c.seguinte == null;
    $('actual').hidden = c.actual;

    const nums = $('numeros'); nums.textContent = '';
    if (!c.plano_pago) {
      nums.appendChild(numero('Plano gratuito', 'neste ciclo a conta ainda não tinha o Workers Paid'));
    } else {
      nums.appendChild(numero(usd(d.base_usd), 'plano Workers Paid'));
      nums.appendChild(numero(usd(d.excesso_actual_usd), 'a mais até agora', d.excesso_actual_usd > 0 ? 'registo-mal' : ''));
      nums.appendChild(numero(usd(d.total_projectado_usd), c.actual ? 'total estimado no fim do ciclo' : 'total do ciclo', d.excesso_projectado_usd > 0 ? 'registo-mal' : 'registo-bem'));
    }
    if (d.dataforseo) nums.appendChild(numero(usd(d.total_geral_projectado_usd), c.actual ? 'Cloudflare + DataForSEO, estimado no fim do ciclo' : 'Cloudflare + DataForSEO no ciclo'));
    if (c.actual) nums.appendChild(numero(Math.max(1, Math.ceil(c.dias * (1 - c.fraccao))) + ' dias', 'até o incluído renovar (' + dia(c.fim) + ')'));
    const niv = NIVEL[d.nivel];
    const cartaoNivel = numero(niv[0], d.nivel === 'ok' ? 'todas as métricas' : 'pelo menos uma métrica', d.nivel === 'ok' ? 'registo-bem' : 'registo-mal');
    nums.appendChild(cartaoNivel);
    $('aviso-geral').textContent = 'Os níveis: «atenção» a partir de ' + pct(d.limiares.atencao_usado) + ' do incluído usado ou ' + pct(d.limiares.atencao_projeccao) +
      ' projectado; «perto do limite» a partir de ' + pct(d.limiares.alerta_usado) + ' usado ou ' + pct(d.limiares.alerta_projeccao) +
      ' projectado. A projecção só conta a partir do 2.º dia do ciclo. «Perto do limite» e «já a pagar a mais» também chegam por email, quando os avisos estiverem ligados.';

    const semDados = d.metricas.filter(m => !m.com_dados).map(m => m.titulo);
    const visiveis = d.metricas.filter(m => m.com_dados);
    $('metricas').textContent = '';
    $('metricas').appendChild(tabela(['Métrica', 'Usado', 'Incluído', 'Uso', c.actual ? 'No fim do ciclo, a este ritmo' : 'No fim do ciclo', 'A mais', 'Estado'], visiveis.map(m => {
      const nome = el('span'); nome.appendChild(el('strong', m.titulo)); nome.appendChild(el('div', d.produtos[m.produto] + ' · ' + m.preco_texto + ' acima do incluído', 'sub'));
      const uso = el('span'); uso.appendChild(barra(m)); uso.appendChild(el('div', pct(m.pct), 'sub'));
      const fim = m.armazenamento ? el('span', 'média ' + quantidade(m.usado, m) + (m.actual != null ? ' · hoje ' + quantidade(m.actual, m) : ''))
        : el('span', quantidade(m.projeccao, m) + ' · ' + pct(m.pct_projeccao));
      return { classe: m.nivel === 'ok' ? '' : 'registo-linha-mal', celulas: [nome, quantidade(m.usado, m), quantidade(m.incluido, m), uso, fim,
        c.plano_pago ? usd(m.custo_projectado) : '—', el('span', NIVEL[m.nivel][0], NIVEL[m.nivel][1])] };
    }), 'custos-tabela'));
    if (!c.plano_pago) $('metricas').appendChild(el('p', 'Neste ciclo a conta estava no plano gratuito, que tem limites diários e 10 ms de processamento por execução. A comparação com o que o Workers Paid inclui fica só como referência.', 'sub registo-contagem'));
    if (semDados.length) $('metricas').appendChild(el('p', 'Sem consumo neste ciclo: ' + semDados.join(', ') + '.', 'sub registo-contagem'));

    const dfs = $('dataforseo'); dfs.textContent = '';
    if (!d.dataforseo) {
      dfs.appendChild(el('p', d.dataforseo_configurada ? 'As credenciais estão ligadas; a primeira leitura do saldo acontece ao minuto 08 da próxima hora.' : 'O módulo ainda não tem as credenciais da DataForSEO.', 'nota'));
    } else {
      const x = d.dataforseo, L = d.limiares_dataforseo;
      const f = el('div', null, 'resumo-fila');
      f.appendChild(numero(usd(x.saldo), 'saldo', x.nivel === 'ok' ? 'registo-bem' : 'registo-mal'));
      f.appendChild(numero(usd(x.gasto_ciclo), 'gasto neste ciclo'));
      f.appendChild(numero(usd(x.gasto_30_dias), 'gasto nos últimos 30 dias'));
      f.appendChild(numero(x.dias_restantes == null ? '—' : x.dias_restantes > 999 ? 'mais de 999 dias' : Math.round(x.dias_restantes) + ' dias',
        x.dias_restantes == null ? (x.ritmo_diario === 0 ? 'quanto dura o saldo: sem gastos desde que se lê' : 'quanto dura o saldo: falta um dia de leituras') : 'quanto dura o saldo, a este ritmo'));
      f.appendChild(numero(usd(x.gasto_desde_abertura), 'gasto desde a abertura da conta'));
      dfs.appendChild(f);
      const estado = el('p', null, 'sub custos-aviso');
      estado.appendChild(x.nivel === 'ok' ? el('span', 'saldo suficiente', 'chip chip-ok') : el('span', { atencao: 'atenção', alerta: 'a acabar', excedido: 'acabou' }[x.nivel], NIVEL[x.nivel][1]));
      estado.appendChild(document.createTextNode(' Última leitura a ' + new Date(x.ultima_leitura).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) +
        '. «Atenção» abaixo de ' + usd(L.atencao_saldo) + ' ou quando o saldo dura menos de ' + L.atencao_dias + ' dias; «perto do limite» abaixo de ' + usd(L.alerta_saldo) +
        ' ou menos de ' + L.alerta_dias + ' dias. Os carregamentos de saldo não contam como gasto.'));
      dfs.appendChild(estado);
      const linhas = x.dias.filter(y => y.usd > 0).map(y => [dia(y.dia), usd(y.usd)]);
      for (const cg of x.cargas) linhas.push([new Date(cg.em).toLocaleDateString('pt-PT'), 'carregamento de ' + usd(cg.usd)]);
      if (linhas.length) dfs.appendChild(tabela(['Dia', 'Gasto'], linhas, 'tabela-estreita'));
    }

    const rec = $('recursos'); rec.textContent = '';
    for (const m of visiveis.filter(x => x.recursos.length)) {
      const cartao = el('div', null, 'painel cartao');
      cartao.appendChild(el('h3', m.titulo));
      /* 14/09/2026 · o Paulo leu os 94% como «perto de um limite». Por isso a percentagem
         do limite vem primeiro e diz-se de que é, e a de cada recurso diz «parte do total». */
      const limite = el('p', null, 'custos-limite');
      limite.appendChild(el('strong', 'Do limite do plano: ' + pct(m.pct)));
      limite.appendChild(document.createTextNode(' · ' + quantidade(m.usado, m) + ' de ' + quantidade(m.incluido, m) + (m.armazenamento ? '' : ' incluídos por mês')));
      cartao.appendChild(limite);
      cartao.appendChild(el('p', 'Quem gasta, em parte do total usado:', 'sub custos-limite-sub'));
      const total = m.recursos.reduce((a, r) => a + r.valor, 0) || 1;
      const ul = el('ul', null, 'custos-recursos');
      for (const r of m.recursos.slice(0, 8)) {
        const li = el('li');
        li.appendChild(el('span', r.nome, 'custos-recurso-nome'));
        li.appendChild(el('span', quantidade(r.valor, m) + ' · ' + pct(r.valor / total) + ' do total', 'fraco'));
        const b = el('span', null, 'custos-recurso-barra'); const f = el('span'); f.style.width = (r.valor / total * 100) + '%'; b.appendChild(f); li.appendChild(b);
        ul.appendChild(li);
      }
      cartao.appendChild(ul);
      rec.appendChild(cartao);
    }

    $('historico').textContent = '';
    $('historico').appendChild(tabela(['Ciclo', 'Plano', 'Cloudflare', 'DataForSEO', 'Pedidos', 'CPU', 'Linhas lidas', 'Linhas escritas', 'Estado'], d.historico.map((h, k) => {
      const ver = el('button', dia(h.inicio) + ' a ' + dia(menosUmDia(h.fim)) + (h.actual ? ' (actual)' : ''), 'registo-link');
      ver.type = 'button'; ver.addEventListener('click', () => { atras = k; carregar(); });
      const M = d.metricas.reduce((o, m) => (o[m.id] = m, o), {});
      return [ver, h.plano_pago ? 'Workers Paid' : 'gratuito',
        h.plano_pago ? usd(h.actual ? h.total_projectado_usd : h.total_usd) + (h.actual ? ' (estimado)' : '') : '—',
        h.dataforseo_usd == null ? '—' : usd(h.dataforseo_usd) + (h.actual ? ' até agora' : ''),
        quantidade(h.metricas['workers.pedidos'], M['workers.pedidos']), quantidade(h.metricas['workers.cpu_ms'], M['workers.cpu_ms']),
        quantidade(h.metricas['d1.linhas_lidas'], M['d1.linhas_lidas']), quantidade(h.metricas['d1.linhas_escritas'], M['d1.linhas_escritas']),
        h.plano_pago ? el('span', NIVEL[h.nivel][0], NIVEL[h.nivel][1]) : el('span', 'plano gratuito (limites diários)', 'fraco')];
    })));

    $('fontes').textContent = 'Incluído e preços confirmados nas páginas oficiais da Cloudflare a ' + dia(d.tarifas.confirmadas_em) + ': ' + d.tarifas.fontes.join(' · ') +
      '. As estatísticas da Cloudflare são amostradas e chegam com algum atraso; valores de hoje ainda podem subir.';
    try { history.replaceState(null, '', atras ? '?ciclo=' + atras : location.pathname); } catch (e) { /* sem história: não faz mal */ }
  }

  function carregar() {
    return obter(API + '?ciclo=' + atras).then(desenhar).catch(e => { $('estado').hidden = false; $('estado').textContent = 'Não foi possível ler os custos (' + e.message + ').'; });
  }
  $('anterior').addEventListener('click', () => { atras++; carregar(); });
  $('seguinte').addEventListener('click', () => { if (atras > 0) { atras--; carregar(); } });
  $('actual').addEventListener('click', () => { atras = 0; carregar(); });
  carregar();
})();
