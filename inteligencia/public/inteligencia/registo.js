/* «Registo de tarefas»: agora, datas marcadas e o histórico por dia, semana e mês.
   Só leitura. Tudo o que vem da API é escrito com textContent. */
(function () {
  'use strict';
  const { $, el, obter, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/registo';
  const ZONA = 'Europe/Lisbon';

  const ESTADO = {
    OK: ['feita', 'chip chip-ok'], FALHOU: ['falhou', 'chip chip-sujo'], INTERROMPIDA: ['cortada a meio', 'chip chip-sujo'],
    EM_FALTA: ['não correu', 'chip chip-sujo'], A_CORRER: ['a correr', 'chip registo-a-correr']
  };
  const TRABALHO = {
    dias_novos: ['dia novo do Search Console', 'dias novos do Search Console'], semanas: ['semana em revista', 'semanas em revista'],
    inspeccionadas: ['página inspeccionada', 'páginas inspeccionadas'], rastreios_novos: ['rastreio novo', 'rastreios novos'],
    inspeccoes_com_erro: ['inspecção com erro', 'inspecções com erro'], assuntos_novos: ['problema novo', 'problemas novos'],
    assuntos_resolvidos: ['problema resolvido', 'problemas resolvidos'], avaliados: ['correcção avaliada', 'correcções avaliadas'],
    avisos: ['aviso enviado', 'avisos enviados'], decididos: ['decisão automática', 'decisões automáticas'],
    pacotes: ['pacote de correcção', 'pacotes de correcção'], publicacoes_descobertas: ['publicação nova do site', 'publicações novas do site'],
    publicacoes_lidas: ['publicação lida', 'publicações lidas']
  };
  const num = n => n == null ? '—' : Number(n).toLocaleString('pt-PT');
  const hora = s => new Date(s).toLocaleTimeString('pt-PT', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' });
  const diaHora = s => new Date(s).toLocaleString('pt-PT', { timeZone: ZONA, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const diaCurto = d => d.slice(8, 10) + '/' + d.slice(5, 7);
  const diaLongo = d => new Date(d + 'T12:00:00Z').toLocaleDateString('pt-PT', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const semanaDia = d => new Date(d + 'T12:00:00Z').toLocaleDateString('pt-PT', { timeZone: 'UTC', weekday: 'short' }).replace('.', '');
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const duracao = ms => ms == null ? '—' : ms < 1000 ? ms + ' ms' : (ms / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + ' s';
  const duracaoMin = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min';
  const chip = estado => el('span', (ESTADO[estado] || [estado])[0], (ESTADO[estado] || [0, 'chip'])[1]);
  const textoTrabalho = t => {
    const partes = Object.entries(t || {}).filter(([, n]) => n > 0).map(([k, n]) => num(n) + ' ' + (TRABALHO[k] ? TRABALHO[k][n === 1 ? 0 : 1] : k));
    return partes.length ? partes.join(' · ') : 'sem novidades';
  };

  function tabela(cabecalhos, linhas, classe = '') {
    const cx = el('div', null, 'tabela-cx');
    const tb = el('table', null, 'tabela ' + classe);
    const tr = el('tr');
    for (const h of cabecalhos) { const th = el('th', h); th.scope = 'col'; tr.appendChild(th); }
    const thead = el('thead'); thead.appendChild(tr); tb.appendChild(thead);
    const tbody = el('tbody');
    for (const l of linhas) {
      const r = el('tr');
      if (l.classe) r.className = l.classe;
      for (const c of (l.celulas || l)) {
        const td = el('td');
        if (c instanceof Node) td.appendChild(c); else td.textContent = c == null ? '—' : String(c);
        r.appendChild(td);
      }
      tbody.appendChild(r);
    }
    tb.appendChild(tbody); cx.appendChild(tb);
    return cx;
  }
  const numero = (valor, rotulo, classe) => { const d = el('div', null, 'resumo-n' + (classe ? ' ' + classe : '')); d.appendChild(el('b', valor)); d.appendChild(el('span', rotulo)); return d; };

  /* ---- estado da página: vista e data na URL ---- */
  const q = new URLSearchParams(location.search);
  let vista = ['dia', 'semana', 'mes'].includes(q.get('vista')) ? q.get('vista') : 'dia';
  let data = q.get('data') || null;
  let ultimo = null;
  let filtro = { tarefa: '', mostrar: 'relevante' };

  function url() { return API + '?vista=' + vista + (data ? '&data=' + encodeURIComponent(data) : ''); }
  function guardarUrl() { history.replaceState(null, '', '?vista=' + vista + (data ? '&data=' + data : '')); }

  /* ---- agora ---- */
  function agora(d) {
    $('actualizado').textContent = 'Actualizado às ' + hora(d.agora);
    const nums = $('agora-numeros'); nums.textContent = '';
    if (d.incidente_aberto) {
      const i = d.incidente_aberto;
      nums.appendChild(numero('Incidente aberto', 'desde ' + diaHora(i.aberto_em) + ' · ' + num(i.execucoes_perdidas) + ' execuções perdidas', 'registo-mal'));
    } else nums.appendChild(numero('A funcionar', 'nenhum incidente aberto', 'registo-bem'));
    nums.appendChild(numero(String(d.a_correr.length), d.a_correr.length ? 'a correr agora: ' + d.a_correr.map(x => x.titulo).join(', ') : 'a correr agora'));
    if (d.vigia_verificado_ate) nums.appendChild(numero(hora(d.vigia_verificado_ate), 'vigia verificou até'));

    $('agora-tarefas').textContent = '';
    $('agora-tarefas').appendChild(tabela(['Tarefa', 'Quando corre', 'Última execução', 'O que fez', 'Próxima'], d.tarefas.map(t => {
      const nome = el('span'); nome.appendChild(el('strong', t.titulo));
      if (t.pausa) nome.appendChild(el('div', t.pausa, 'sub'));
      const ult = el('span');
      if (!t.ultima) ult.textContent = 'ainda sem registo';
      else { ult.appendChild(el('span', hora(t.ultima.inicio) + ' · ' + duracao(t.ultima.duracao_ms) + ' ')); ult.appendChild(chip(t.ultima.estado)); }
      const fez = el('span', t.ultima ? (t.ultima.erro || t.ultima.o_que_fez || '—') : '—');
      return [nome, t.regra, ult, fez, t.proxima ? hora(t.proxima) : '—'];
    })));

    const datas = $('agora-datas'); datas.textContent = '';
    if (!d.datas_marcadas.length) datas.appendChild(el('li', 'Nada marcado.', 'vazio'));
    for (const x of d.datas_marcadas) {
      const li = el('li');
      li.appendChild(el('strong', new Date(x.data.length === 10 ? x.data + 'T12:00:00Z' : x.data).toLocaleDateString('pt-PT', { timeZone: x.data.length === 10 ? 'UTC' : ZONA, day: '2-digit', month: '2-digit', year: 'numeric' })));
      li.appendChild(document.createTextNode(' — ' + x.texto));
      datas.appendChild(li);
    }
    $('agora').hidden = false;
  }

  /* ---- incidentes do período ---- */
  function incidentes(lista, raiz) {
    raiz.appendChild(el('h3', 'Incidentes', 'registo-h3'));
    if (!lista.length) { raiz.appendChild(el('p', 'Nenhum incidente neste período.', 'nota')); return; }
    raiz.appendChild(tabela(['Início', 'Fim', 'Duração', 'Tarefas afectadas', 'Execuções perdidas', 'Causa'], lista.map(i => {
      const fim = el('span');
      if (i.aberto) fim.appendChild(el('span', 'a decorrer', 'chip chip-sujo')); else fim.textContent = diaHora(i.fechado_em);
      const causa = el('span');
      if (i.resolvido) { causa.appendChild(el('span', 'resolvido', 'chip chip-ok')); causa.appendChild(el('div', i.causa_confirmada)); causa.appendChild(el('div', i.resolucao, 'sub')); }
      else causa.textContent = 'Provável: ' + i.causa_provavel;
      return [diaHora(i.aberto_em), fim, duracaoMin(i.duracao_min), i.tarefas.map(x => x.titulo + ' (' + x.execucoes + ')').join(', '), num(i.execucoes_perdidas), causa];
    })));
  }
  const problemas = r => (r.falhou || 0) + (r.interrompidas || 0) + (r.em_falta || 0);
  const irPara = (v, d) => { vista = v; data = d; carregar(); };

  /* ---- dia ---- */
  function vistaDia(d, raiz) {
    $('periodo').textContent = diaLongo(d.dia) + (d.dia === d.hoje ? ' (hoje)' : '');
    const tot = d.tarefas_do_dia.reduce((a, r) => ({ esperadas: a.esperadas + r.esperadas, ok: a.ok + r.ok, prob: a.prob + problemas(r) }), { esperadas: 0, ok: 0, prob: 0 });
    const nums = el('div', null, 'resumo-fila');
    nums.appendChild(numero(num(tot.esperadas), 'execuções esperadas' + (d.dia === d.hoje ? ' até agora' : '')));
    nums.appendChild(numero(num(tot.ok), 'feitas'));
    nums.appendChild(numero(num(tot.prob), 'com problema', tot.prob ? 'registo-mal' : ''));
    if (d.com_detalhe) nums.appendChild(numero(num(d.linhas.filter(l => l.novidade).length), 'com novidades'));
    raiz.appendChild(nums);
    if (d.com_detalhe && tot.prob) {
      const perdidas = d.linhas.filter(l => l.estado !== 'OK' && l.estado !== 'A_CORRER');
      const dentro = perdidas.filter(l => d.incidentes.some(i => i.resolvido && l.em >= i.aberto_em && l.em <= i.fechado_em));
      if (dentro.length === perdidas.length) raiz.appendChild(el('p', 'Todas as execuções com problema deste dia foram perdidas num incidente que já está resolvido — a causa e a resolução estão em «Incidentes», no fim.', 'sub registo-contagem'));
      else if (dentro.length) raiz.appendChild(el('p', num(dentro.length) + ' das ' + num(perdidas.length) + ' execuções com problema foram perdidas num incidente já resolvido; as outras ' + num(perdidas.length - dentro.length) + ' não.', 'sub registo-contagem'));
    }

    raiz.appendChild(el('h3', 'Por tarefa', 'registo-h3'));
    raiz.appendChild(tabela(['Tarefa', 'Esperadas', 'Feitas', 'Falharam', 'Cortadas a meio', 'Não correram', 'Duração média', 'O que se fez'], d.tarefas_do_dia.map(r => ({
      classe: problemas(r) ? 'registo-linha-mal' : '',
      celulas: [r.titulo, num(r.esperadas), num(r.ok), num(r.falhou), num(r.interrompidas), num(r.em_falta), duracao(r.duracao_media_ms), textoTrabalho(r.trabalho)]
    }))));

    raiz.appendChild(el('h3', 'Execução a execução', 'registo-h3'));
    if (!d.com_detalhe) {
      raiz.appendChild(el('p', d.dia > d.hoje ? 'Este dia ainda não chegou.' :
        'O detalhe de cada execução só se guarda ' + d.dias_detalhe + ' dias (ou este dia é anterior ao início do registo, a 13/09/2026). O resumo por tarefa, acima, fica para sempre.', 'nota'));
      incidentes(d.incidentes, raiz);
      return;
    }
    const filtros = el('div', null, 'filtros');
    const campoT = el('label', null, 'campo campo-escuro'); campoT.appendChild(el('span', 'Tarefa'));
    const selT = el('select'); [['', 'Todas']].concat(d.tarefas.map(t => [t.vez, t.titulo])).forEach(([v, n]) => { const o = el('option', n); o.value = v; selT.appendChild(o); });
    selT.value = filtro.tarefa; campoT.appendChild(selT); filtros.appendChild(campoT);
    const campoM = el('label', null, 'campo campo-escuro'); campoM.appendChild(el('span', 'Mostrar'));
    const selM = el('select');
    [['relevante', 'Com novidades ou problemas'], ['problemas', 'Só problemas'], ['todas', 'Todas as execuções']].forEach(([v, n]) => { const o = el('option', n); o.value = v; selM.appendChild(o); });
    selM.value = filtro.mostrar; campoM.appendChild(selM); filtros.appendChild(campoM);
    raiz.appendChild(filtros);
    const alvo = el('div'); raiz.appendChild(alvo);
    /* uma execução perdida dentro de um incidente diz a que incidente pertence */
    const duranteIncidente = l => {
      if (l.estado === 'OK' || l.estado === 'A_CORRER') return null;
      const i = d.incidentes.find(x => l.em >= x.aberto_em && l.em <= (x.fechado_em || d.agora));
      if (!i) return null;
      return 'Perdida no incidente de ' + diaHora(i.aberto_em) + ' a ' + (i.fechado_em ? diaHora(i.fechado_em) : 'agora') + (i.resolvido ? ' — já resolvido (ver Incidentes, abaixo).' : ' — ver Incidentes, abaixo.');
    };
    const desenhar = () => {
      filtro = { tarefa: selT.value, mostrar: selM.value };
      const linhas = d.linhas.filter(l => (!filtro.tarefa || l.vez === filtro.tarefa) && (
        filtro.mostrar === 'todas' || l.estado === 'A_CORRER' ||
        (filtro.mostrar === 'problemas' ? l.estado !== 'OK' : (l.estado !== 'OK' || l.novidade))));
      alvo.textContent = '';
      const escondidas = d.linhas.filter(l => !filtro.tarefa || l.vez === filtro.tarefa).length - linhas.length;
      alvo.appendChild(el('p', num(linhas.length) + ' execuções' + (escondidas > 0 ? ' · ' + num(escondidas) + ' escondidas (verificaram e não havia novidades)' : '') + '.', 'sub registo-contagem'));
      if (!linhas.length) { alvo.appendChild(el('p', 'Nada a mostrar com este filtro.', 'nota')); return; }
      alvo.appendChild(tabela(['Hora', 'Tarefa', 'Estado', 'Duração', 'O que fez'], linhas.slice(0, 800).map(l => ({
        classe: l.estado !== 'OK' && l.estado !== 'A_CORRER' ? 'registo-linha-mal' : '',
        celulas: [hora(l.inicio || l.em), l.titulo, chip(l.estado), duracao(l.duracao_ms),
          l.erro || l.o_que_fez || duranteIncidente(l) || (l.estado === 'EM_FALTA' ? 'Sem registo desta execução: não chegou a correr, ou foi cortada antes de se registar.' : l.estado === 'INTERROMPIDA' ? 'Começou e não chegou ao fim.' : '—')]
      })), 'registo-log'));
    };
    selT.addEventListener('change', desenhar); selM.addEventListener('change', desenhar);
    desenhar();
    incidentes(d.incidentes, raiz);
  }

  /* ---- semana ---- */
  function vistaSemana(d, raiz) {
    $('periodo').textContent = 'Semana de ' + diaCurto(d.semana) + ' a ' + diaCurto(d.fim) + '/' + d.fim.slice(0, 4);
    const cab = ['Tarefa'].concat(d.dias.map(x => semanaDia(x.dia) + ' ' + diaCurto(x.dia)));
    const celula = (x, r) => {
      const s = el('span');
      if (x.futuro) { s.textContent = '—'; return s; }
      if (!x.com_registo) { s.textContent = 'sem registo'; s.className = 'fraco-claro'; return s; }
      s.appendChild(el('span', num(r.ok) + '/' + num(r.esperadas) + ' '));
      const p = problemas(r);
      s.appendChild(p ? el('span', p + ' com problema', 'chip chip-sujo') : el('span', 'ok', 'chip chip-ok'));
      return s;
    };
    const linhas = d.dias[0].tarefas.map((t, i) => [t.titulo].concat(d.dias.map(x => celula(x, x.tarefas[i]))));
    const botoesDia = d.dias.map(x => {
      if (x.futuro || !x.com_registo) return '—';
      const b = el('button', 'ver o dia', 'registo-link'); b.type = 'button'; b.addEventListener('click', () => irPara('dia', x.dia)); return b;
    });
    const trabalho = d.dias.map(x => x.futuro || !x.com_registo ? '—' : textoTrabalho(x.trabalho));
    linhas.push({ classe: 'registo-linha-total', celulas: ['O que se fez'].concat(trabalho) });
    linhas.push(['Detalhe'].concat(botoesDia));
    raiz.appendChild(tabela(cab, linhas, 'registo-semana'));
    raiz.appendChild(el('p', 'Cada célula: execuções feitas / esperadas. «Com problema» junta as que falharam, foram cortadas a meio ou não chegaram a correr.', 'sub registo-contagem'));
    incidentes(d.incidentes, raiz);
  }

  /* ---- mês ---- */
  function vistaMes(d, raiz) {
    $('periodo').textContent = MESES[Number(d.mes.slice(5, 7)) - 1] + ' de ' + d.mes.slice(0, 4);
    const com = d.dias.filter(x => x.com_registo);
    const tot = com.reduce((a, x) => ({ esperadas: a.esperadas + x.esperadas, ok: a.ok + x.ok, prob: a.prob + problemas(x) }), { esperadas: 0, ok: 0, prob: 0 });
    const nums = el('div', null, 'resumo-fila');
    nums.appendChild(numero(num(com.length), 'dias com registo'));
    nums.appendChild(numero(num(tot.esperadas), 'execuções esperadas'));
    nums.appendChild(numero(tot.esperadas ? (tot.ok / tot.esperadas * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + '%' : '—', 'feitas'));
    nums.appendChild(numero(num(tot.prob), 'com problema', tot.prob ? 'registo-mal' : ''));
    raiz.appendChild(nums);
    const linhas = d.dias.filter(x => !x.futuro).reverse().map(x => {
      const estado = el('span');
      if (!x.com_registo) estado.appendChild(el('span', 'sem registo', 'fraco-claro'));
      else estado.appendChild(problemas(x) ? el('span', problemas(x) + ' com problema', 'chip chip-sujo') : el('span', 'ok', 'chip chip-ok'));
      let ver = '—';
      if (x.com_registo) { ver = el('button', 'ver o dia', 'registo-link'); ver.type = 'button'; ver.addEventListener('click', () => irPara('dia', x.dia)); }
      return { classe: problemas(x) ? 'registo-linha-mal' : '',
        celulas: [semanaDia(x.dia) + ' ' + diaCurto(x.dia), x.com_registo ? num(x.ok) + '/' + num(x.esperadas) : '—', estado, x.com_registo ? textoTrabalho(x.trabalho) : '—', ver] };
    });
    if (!linhas.length) raiz.appendChild(el('p', 'Este mês ainda não começou.', 'nota'));
    else raiz.appendChild(tabela(['Dia', 'Feitas / esperadas', 'Estado', 'O que se fez', ''], linhas));
    incidentes(d.incidentes, raiz);
  }

  function desenhar(d) {
    ultimo = d;
    agora(d);
    document.querySelectorAll('.registo-vistas button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
    const raiz = $('vista'); raiz.textContent = '';
    if (vista === 'semana') vistaSemana(d, raiz); else if (vista === 'mes') vistaMes(d, raiz); else vistaDia(d, raiz);
    $('historico').hidden = false;
    $('estado').hidden = true;
  }

  function carregar() {
    guardarUrl();
    return obter(url()).then(desenhar).catch(e => { $('estado').hidden = false; $('estado').textContent = 'Não foi possível ler o registo (' + e.message + ').'; });
  }

  document.querySelectorAll('.registo-vistas button').forEach(b => b.addEventListener('click', () => {
    vista = b.dataset.vista;
    const h = ultimo ? ultimo.hoje : null;
    data = vista === 'mes' ? (h ? h.slice(0, 7) : null) : null;
    carregar();
  }));
  $('anterior').addEventListener('click', () => { if (ultimo) { data = ultimo.anterior; carregar(); } });
  $('seguinte').addEventListener('click', () => { if (ultimo) { data = ultimo.seguinte; carregar(); } });
  $('hoje').addEventListener('click', () => { data = null; carregar(); });

  carregar();
  /* de minuto a minuto, só quando se está a ver hoje e a página está visível */
  setInterval(() => {
    if (document.hidden || !ultimo) return;
    const hoje = ultimo.hoje;
    const aVerHoje = !data || data === hoje || (vista === 'mes' && data === hoje.slice(0, 7)) || (vista === 'semana' && ultimo.semana && hoje >= ultimo.semana && hoje <= ultimo.fim);
    if (aVerHoje) obter(url()).then(desenhar).catch(() => {});
  }, 60000);
})();
