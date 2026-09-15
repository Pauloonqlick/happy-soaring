/* Ficha de um assunto: evidência → diagnóstico → solução → não fazer →
   regras aplicáveis → medição, e a decisão do Paulo. */
(function () {
  'use strict';
  const { $, el, obter, enviar, data, dia, ESTADOS, PORTA, RESULTADOS, NIVEL, quem } = window.HS;
  quem();

  const id = new URLSearchParams(location.search).get('id');
  const API = '/inteligencia/api/assuntos/' + encodeURIComponent(id || '');

  const ROTULOS = {
    inspeccionado_em: 'Inspeccionada em', veredicto: 'Veredicto do Google', cobertura: 'Cobertura (como o Google escreve)',
    estado_obtencao: 'Obtenção da página', estado_indexacao: 'Indexação', estado_robots: 'robots.txt',
    ultimo_rastreio: 'Último rastreio', canonico_google: 'Canónico escolhido pelo Google', canonico_declarado: 'Canónico declarado',
    tipos_resultado: 'Resultados enriquecidos', deixou_de_estar_indexada: 'Deixou de estar indexada',
    alteracao_em: 'Alterada em', tipo_alteracao: 'Tipo de alteração', publicacao: 'Publicação', pedido_em: 'Pedido de indexação',
    ultima_inspeccao: 'Última inspecção', url: 'URL', impressoes_28d: 'Impressões (28 dias)',
    semanas_com_impressoes: 'Semanas com impressões', http: 'Resposta HTTP agora', destino: 'Redirecciona para',
    verificado_em: 'Verificado em', pagina_nova: 'Página nova', erros_dados_estruturados: 'Erros indicados pelo Google'
  };
  const DATAS = new Set(['inspeccionado_em', 'ultimo_rastreio', 'alteracao_em', 'pedido_em', 'ultima_inspeccao']);
  const DECISOES = { APROVAR: 'Aprovado', IGNORAR: 'Ignorado', ADIAR: 'Adiado', PEDIR_EVIDENCIA: 'Pedida mais evidência' };
  const QUEM = { MODULO: 'pelo módulo', CLAUDE: 'pelo Claude', PAULO: 'por ti' };

  function valor(k, v) {
    if (v === true) return 'sim';
    if (v === false) return 'não';
    if (Array.isArray(v)) return v.join(k === 'erros_dados_estruturados' ? ' · ' : ', ');
    if (DATAS.has(k)) return data(v);
    return String(v);
  }
  function par(dl, rotulo, texto) {
    dl.appendChild(el('dt', rotulo));
    dl.appendChild(el('dd', texto));
  }
  function lista(ul, itens, vazio) {
    ul.textContent = '';
    if (!itens.length) ul.appendChild(el('li', vazio));
    for (const i of itens) ul.appendChild(el('li', i));
  }

  function mostrar(a) {
    document.title = a.titulo + ' — Inteligência Happy Soaring';
    $('t-assunto').textContent = a.titulo;
    const cab = $('cabeca');
    cab.textContent = '';
    const pagina = a.caminho.startsWith('/') ? 'https://happysoaring.com' + a.caminho : a.caminho;
    const link = el('a', a.caminho);
    link.href = pagina; link.target = '_blank'; link.rel = 'noopener';
    cab.appendChild(link);
    cab.appendChild(document.createTextNode(' · ' + (a.objectivos.length ? a.objectivos.map(o => o.nome).join(', ') : 'sem objectivo configurado') +
      ' · nível ' + (a.nivel || 'por definir') + (a.impressoes_28d != null ? ' · ' + a.impressoes_28d + ' impressões em 28 dias' : '') + ' · '));
    cab.appendChild(el('span', ESTADOS[a.estado] || a.estado, 'chip chip-escuro'));
    if (a.critico) { cab.appendChild(document.createTextNode(' ')); cab.appendChild(el('span', 'crítico', 'chip chip-critico')); }
    if (a.regressoes) cab.appendChild(document.createTextNode(' · voltou ' + a.regressoes + (a.regressoes === 1 ? ' vez' : ' vezes') + ' depois de resolvido'));

    /* porta */
    if (a.porta) {
      $('porta').textContent = PORTA[a.porta.saida] + (a.porta.razao ? ' — ' + a.porta.razao : '');
      $('porta').className = 'porta porta-' + a.porta.saida.toLowerCase();
      const ol = $('passos');
      ol.textContent = '';
      for (const [pergunta, resposta] of a.porta.passos) {
        const li = el('li');
        li.appendChild(el('b', pergunta + ' '));
        li.appendChild(document.createTextNode(resposta));
        ol.appendChild(li);
      }
    } else {
      $('porta').textContent = a.estado === 'AVALIADO' ? 'Assunto avaliado.' : 'Assunto fechado em ' + data(a.resolvido_em) + ': a última inspecção já não mostra o problema.';
      $('passos').textContent = '';
    }

    /* evidência */
    const ev = $('evidencia');
    ev.textContent = '';
    for (const [k, v] of Object.entries(a.evidencia)) {
      if (v == null || k === 'anterior') continue;
      par(ev, ROTULOS[k] || k, valor(k, v));
    }
    if (a.evidencia.anterior) {
      const p = a.evidencia.anterior;
      par(ev, 'Inspecção anterior', data(p.inspeccionado_em) + ' · ' + (p.veredicto || '—') + (p.cobertura ? ' · ' + p.cobertura : ''));
    }
    par(ev, 'Detectado em', data(a.detectado_em));
    $('nota-rastreio').textContent = a.nota_rastreio;
    /* o que o estado quer dizer, nas palavras da ajuda oficial do Search Console */
    const def = $('definicao-google');
    def.textContent = '';
    def.hidden = !a.definicao_google;
    if (a.definicao_google) {
      def.appendChild(el('b', '«' + a.definicao_google.estado + '», segundo o Google: '));
      def.appendChild(document.createTextNode(a.definicao_google.definicao + ' '));
      const fonte = el('a', 'Ver a definição oficial');
      fonte.href = a.definicao_google.fonte; fonte.target = '_blank'; fonte.rel = 'noopener';
      def.appendChild(fonte);
    }

    /* ficha */
    const f = a.ficha;
    $('diagnostico').textContent = f.diagnostico;
    $('solucao').textContent = f.solucao;
    lista($('nao-fazer'), f.nao_fazer, '—');
    lista($('riscos'), f.riscos, 'Nenhum identificado.');
    $('medicao').textContent = f.medicao;
    const rf = $('resumo-ficha');
    rf.textContent = '';
    par(rf, 'Confiança', (NIVEL[f.confianca.nivel] || f.confianca.nivel) + ' — ' + f.confianca.justificacao);
    par(rf, 'Esforço estimado', NIVEL[f.esforco] || f.esforco);
    par(rf, 'Custo financeiro', f.custo_financeiro == null ? 'nenhum' : String(f.custo_financeiro));
    par(rf, 'Tipo de acção', a.acao === 'OPERACIONAL' ? 'operacional (agrupada no «Hoje»)' : 'decisão do Paulo');
    par(rf, 'Objectivo de negócio', a.objectivos.length ? a.objectivos.map(o => o.nome).join(', ') : 'sem objectivo configurado');

    /* regras */
    const r = a.regras, caixa = $('regras');
    caixa.textContent = '';
    const grupo = (titulo, itens, vazio) => {
      caixa.appendChild(el('h3', titulo));
      const ul = el('ul', null, 'lista');
      lista(ul, itens, vazio);
      caixa.appendChild(ul);
    };
    grupo('Decisões activas', r.decisoes_activas.map(d => d.titulo + ' — ' + d.razao), 'Nenhuma registada.');
    grupo('Factos verificados', r.factos_verificados, 'Nenhum registado.');
    grupo('Afirmações proibidas', r.afirmacoes_proibidas, 'Nenhuma registada.');
    grupo('Por confirmar — não usar', r.factos_por_confirmar, 'Nenhum.');
    grupo('Termos de marca', r.termos_de_marca, 'Nenhum.');

    /* decisão */
    $('caixa-decisao').hidden = a.resolvido_em || a.estado === 'RETIRADO' || a.estado === 'BLOQUEADO';
    $('decisao-actual').textContent = a.decisao
      ? (DECISOES[a.decisao.decisao] || a.decisao.decisao) + ' ' + (QUEM[a.decisao.decidido_por] || '') + ' em ' + data(a.decisao.decidido_em) +
        (a.decisao.adiar_ate ? ', até ' + dia(a.decisao.adiar_ate) : '') + (a.decisao.razao ? ' — ' + a.decisao.razao : '')
      : 'Ainda sem decisão: o módulo decide quando houver evidência suficiente.';
    $('mudar').hidden = !!a.resolvido_em;
    const operacional = a.acao === 'OPERACIONAL';
    $('rotulo-aprovar').hidden = operacional;
    $('nota-operacional').hidden = !operacional;
    if (operacional) {
      $('nota-operacional').textContent = 'É uma acção operacional: faz-se na ';
      const l = el('a', 'fila de indexação');
      l.href = '/inteligencia/indexacao/';
      $('nota-operacional').appendChild(l);
      $('nota-operacional').appendChild(document.createTextNode('. Aqui só se pode ignorar, adiar ou pedir mais evidência.'));
    }

    /* pacote */
    const p = a.pacote;
    $('caixa-pacote').hidden = !p;
    if (p) {
      const dl = $('pacote');
      dl.textContent = '';
      par(dl, 'Pacote', 'n.º ' + p.id + ', criado em ' + data(p.criado_em));
      par(dl, 'Publicação', p.publicado_em ? 'publicado em ' + data(p.publicado_em) : 'à espera de implementação — pede ao Claude: «implementa o pacote ' + p.id + '»');
      if (a.avaliacao) {
        let razao = '';
        try { razao = JSON.parse(a.avaliacao.evidencia).razao || ''; } catch (e) { razao = ''; }
        par(dl, 'Resultado', (RESULTADOS[a.avaliacao.resultado] || a.avaliacao.resultado) + ' em ' + dia(a.avaliacao.avaliado_em) + (razao ? ' — ' + razao : ''));
      }
    }

    /* histórico */
    const h = a.historico_decisoes;
    $('caixa-historico').hidden = !h.length;
    lista($('historico'), h.slice().reverse().map(d => data(d.decidido_em) + ' · ' + (DECISOES[d.decisao] || d.decisao) + ' ' + (QUEM[d.decidido_por] || '') +
      (d.adiar_ate ? ' até ' + dia(d.adiar_ate) : '') + (d.razao ? ' — ' + d.razao : '') + (d.nota ? ' (nota: ' + d.nota + ')' : '')), '—');

    $('ficha').hidden = false;
  }

  const form = $('decidir');
  form.addEventListener('change', () => {
    const d = form.elements.decisao.value;
    $('campo-data').hidden = d !== 'ADIAR';
    $('lembrete-aprovar').hidden = d !== 'APROVAR';
  });
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const d = form.elements.decisao.value;
    const saida = $('resultado-decisao');
    if (!d) { saida.textContent = 'Escolhe uma decisão.'; return; }
    const botao = form.querySelector('button');
    botao.disabled = true;
    saida.textContent = 'A registar…';
    enviar(API + '/decisao', {
      decisao: d, razao: form.elements.razao.value, adiar_ate: form.elements.adiar_ate.value, nota: form.elements.nota.value
    })
      .then(() => obter(API))
      .then(a => { form.reset(); saida.textContent = 'Decisão registada.'; mostrar(a); })
      .catch(e => { saida.textContent = e.message; })
      .finally(() => { botao.disabled = false; });
  });

  if (!id) {
    $('t-assunto').textContent = 'Assunto';
    $('erro').hidden = false;
    $('erro').textContent = 'Falta o número do assunto.';
    return;
  }
  obter(API).then(mostrar).catch(e => {
    $('t-assunto').textContent = 'Assunto';
    $('erro').hidden = false;
    $('erro').textContent = 'Não foi possível abrir o assunto (' + e.message + ').';
  });
})();
