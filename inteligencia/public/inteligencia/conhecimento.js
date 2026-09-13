/* Conhecimento: decisões activas, factos do negócio e hipóteses eliminadas.
   Criar, editar (sobre a versão que se leu) e ver as versões anteriores. */
(function () {
  'use strict';
  const { $, el, obter, enviar, dia, data, opcoes, quem } = window.HS;
  quem();
  const API = '/inteligencia/api/conhecimento';
  let dados = null;

  const objectivos = () => dados.objectivos.map(o => [o.id, o.nome]);
  const tipos = () => dados.tipos_assunto.map(t => [t.id, t.titulo]);
  const nomeObjectivo = id => (dados.objectivos.find(o => o.id === id) || {}).nome || id;

  const SECOES = [
    {
      tabela: 'decisoes_activas', titulo: 'Decisões activas', novo: 'Nova decisão',
      explica: 'Decisões comerciais, estratégicas ou de marca. Com «bloqueia», o tipo de assunto nessa página deixa de ser recomendado.',
      resumo: d => [d.titulo, (d.estado === 'ACTIVA' ? 'activa' : 'revogada') + ' · ' + d.tipo.toLowerCase() + ' · decidida em ' + dia(d.decidida_em) +
        (d.revisao_em ? ' · rever em ' + dia(d.revisao_em) : '') + (d.objectivo_id ? ' · ' + nomeObjectivo(d.objectivo_id) : ''), d.razao],
      campos: [
        { nome: 'titulo', rotulo: 'Título', tipo: 'texto' },
        { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: () => [['COMERCIAL', 'Comercial'], ['ESTRATEGICA', 'Estratégica'], ['MARCA', 'Marca']] },
        { nome: 'razao', rotulo: 'Razão', tipo: 'area' },
        { nome: 'ambito', rotulo: 'Âmbito', tipo: 'texto' },
        { nome: 'objectivo_id', rotulo: 'Objectivo de negócio', tipo: 'select', opcoes: objectivos, vazio: 'todos' },
        { nome: 'bloqueia_tipo', rotulo: 'Bloqueia o tipo de assunto', tipo: 'select', opcoes: tipos, vazio: 'nenhum em particular' },
        { nome: 'bloqueia_caminho', rotulo: 'Nas páginas começadas por', tipo: 'texto', ajuda: 'ex.: /parakite/' },
        { nome: 'decidida_em', rotulo: 'Decidida em', tipo: 'data' },
        { nome: 'revisao_em', rotulo: 'Rever em', tipo: 'data' },
        { nome: 'condicao_revisao', rotulo: 'Condição de revisão', tipo: 'texto' },
        { nome: 'estado', rotulo: 'Estado', tipo: 'select', opcoes: () => [['ACTIVA', 'Activa'], ['REVOGADA', 'Revogada']] }
      ]
    },
    {
      tabela: 'factos_negocio', titulo: 'Factos do negócio', novo: 'Novo facto',
      explica: 'Nenhuma proposta de conteúdo usa um facto que não esteja verificado. Um facto verificado precisa de fonte e data.',
      resumo: f => [f.afirmacao, ({ VERIFICADO: 'verificado', POR_CONFIRMAR: 'por confirmar', PROIBIDO: 'proibido de afirmar' })[f.estado] +
        (f.fonte ? ' · fonte: ' + f.fonte : '') + (f.data_fonte ? ' · ' + dia(f.data_fonte) : '') + (f.objectivo_id ? ' · ' + nomeObjectivo(f.objectivo_id) : ''), f.notas],
      campos: [
        { nome: 'afirmacao', rotulo: 'Afirmação', tipo: 'area' },
        { nome: 'estado', rotulo: 'Estado', tipo: 'select', opcoes: () => [['POR_CONFIRMAR', 'Por confirmar'], ['VERIFICADO', 'Verificado'], ['PROIBIDO', 'Proibido de afirmar']] },
        { nome: 'fonte', rotulo: 'Fonte', tipo: 'texto' },
        { nome: 'data_fonte', rotulo: 'Data da fonte', tipo: 'data' },
        { nome: 'objectivo_id', rotulo: 'Objectivo de negócio', tipo: 'select', opcoes: objectivos, vazio: 'todos' },
        { nome: 'notas', rotulo: 'Notas', tipo: 'area' }
      ]
    },
    {
      tabela: 'hipoteses_eliminadas', titulo: 'Hipóteses eliminadas', novo: 'Nova hipótese eliminada',
      explica: 'Cada uma com a evidência que a eliminou. Com tipo de assunto, esse assunto nessas páginas passa a «retirado».',
      resumo: h => [h.hipotese, (h.estado === 'ELIMINADA' ? 'eliminada' : 'reaberta') + ' em ' + dia(h.eliminada_em) +
        (h.caminho ? ' · ' + h.caminho : '') + (h.objectivo_id ? ' · ' + nomeObjectivo(h.objectivo_id) : ''), 'Evidência: ' + h.evidencia],
      campos: [
        { nome: 'hipotese', rotulo: 'Hipótese', tipo: 'area' },
        { nome: 'evidencia', rotulo: 'Evidência que a eliminou', tipo: 'area' },
        { nome: 'eliminada_em', rotulo: 'Eliminada em', tipo: 'data' },
        { nome: 'tipo_assunto', rotulo: 'Tipo de assunto que retira', tipo: 'select', opcoes: tipos, vazio: 'nenhum em particular' },
        { nome: 'caminho', rotulo: 'Nas páginas começadas por', tipo: 'texto', ajuda: 'ex.: /cursos/' },
        { nome: 'objectivo_id', rotulo: 'Objectivo de negócio', tipo: 'select', opcoes: objectivos, vazio: 'todos' },
        { nome: 'estado', rotulo: 'Estado', tipo: 'select', opcoes: () => [['ELIMINADA', 'Eliminada'], ['REABERTA', 'Reaberta']] }
      ]
    }
  ];

  function formulario(sec, registo) {
    const f = el('form', null, 'formulario');
    f.noValidate = true;
    for (const c of sec.campos) {
      const l = el('label', c.rotulo + ' ', 'campo');
      let i;
      if (c.tipo === 'area') { i = el('textarea'); i.rows = 2; }
      else if (c.tipo === 'select') { i = el('select'); opcoes(i, c.opcoes(), c.vazio ?? null, registo ? registo[c.nome] : null); }
      else { i = el('input'); i.type = c.tipo === 'data' ? 'date' : 'text'; if (c.ajuda) i.placeholder = c.ajuda; }
      i.name = c.nome;
      if (registo && c.tipo !== 'select' && registo[c.nome] != null) i.value = registo[c.nome];
      l.appendChild(i);
      f.appendChild(l);
    }
    const botoes = el('div', null, 'botoes');
    const gravar = el('button', registo ? 'Gravar nova versão' : 'Gravar', 'botao');
    gravar.type = 'submit';
    const cancelar = el('button', 'Cancelar', 'botao botao-secundario');
    cancelar.type = 'button';
    cancelar.addEventListener('click', () => f.remove());
    botoes.appendChild(gravar); botoes.appendChild(cancelar);
    f.appendChild(botoes);
    const saida = el('p', null, 'sub');
    saida.setAttribute('role', 'status');
    f.appendChild(saida);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const corpo = {};
      for (const c of sec.campos) corpo[c.nome] = f.elements[c.nome].value;
      if (registo) { corpo.id = registo.id; corpo.versao = registo.versao; }
      gravar.disabled = true;
      saida.textContent = 'A gravar…';
      enviar(API + '/' + sec.tabela, corpo).then(d => { dados = d; desenhar(); }).catch(e => { saida.textContent = e.message; gravar.disabled = false; });
    });
    return f;
  }

  function desenhar() {
    const raiz = $('secoes');
    raiz.textContent = '';
    for (const sec of SECOES) {
      const s = el('section', null, 'painel secao-conhecimento');
      s.appendChild(el('h2', sec.titulo));
      s.appendChild(el('p', sec.explica, 'nota-painel'));
      const novo = el('button', sec.novo, 'botao');
      novo.type = 'button';
      const zona = el('div');
      novo.addEventListener('click', () => { zona.textContent = ''; zona.appendChild(formulario(sec, null)); });
      s.appendChild(novo);
      s.appendChild(zona);
      const ul = el('ul', null, 'registos');
      const regs = dados[sec.tabela];
      if (!regs.length) ul.appendChild(el('li', 'Nenhum registo.', 'vazio-claro'));
      for (const r of regs) {
        const li = el('li');
        const [t, meta, detalhe] = sec.resumo(r);
        li.appendChild(el('b', t));
        li.appendChild(el('div', meta + ' · versão ' + r.versao, 'sub'));
        if (detalhe) li.appendChild(el('div', detalhe));
        const editar = el('button', 'Editar', 'botao-link');
        editar.type = 'button';
        const versoes = el('button', 'Versões', 'botao-link');
        versoes.type = 'button';
        const extra = el('div');
        editar.addEventListener('click', () => { extra.textContent = ''; extra.appendChild(formulario(sec, r)); });
        versoes.addEventListener('click', () => {
          extra.textContent = 'A carregar…';
          obter(API + '/' + sec.tabela + '/' + r.id + '/historico').then(h => {
            extra.textContent = '';
            const ol = el('ol', null, 'lista');
            for (const v of h.versoes) ol.appendChild(el('li', 'Versão ' + v.versao + ' · ' + data(v.gravado_em) + ' · ' + sec.resumo(v.dados)[0] + ' — ' + sec.resumo(v.dados)[1]));
            extra.appendChild(ol);
          }).catch(e => { extra.textContent = e.message; });
        });
        li.appendChild(editar); li.appendChild(versoes); li.appendChild(extra);
        ul.appendChild(li);
      }
      s.appendChild(ul);
      raiz.appendChild(s);
    }
  }

  obter(API).then(d => { dados = d; $('estado').hidden = true; desenhar(); })
    .catch(e => { $('estado').textContent = 'Não foi possível ler (' + e.message + ').'; });
})();
