/* Peças comuns da interface. Tudo o que vem da API é escrito com
   textContent — nunca como HTML. As escritas levam sempre JSON e o
   cabeçalho próprio do módulo. */
window.HS = (function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const el = (tag, texto, classe) => {
    const e = document.createElement(tag);
    if (texto != null) e.textContent = texto;
    if (classe) e.className = classe;
    return e;
  };
  const tratar = r => r.json().catch(() => ({})).then(j => {
    if (!r.ok) throw new Error(j.erro || 'HTTP ' + r.status);
    return j;
  });
  const obter = url => fetch(url, { credentials: 'same-origin', headers: { accept: 'application/json' } }).then(tratar);
  const enviar = (url, corpo) => fetch(url, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'content-type': 'application/json', 'x-hs-inteligencia': '1', accept: 'application/json' },
    body: JSON.stringify(corpo)
  }).then(tratar);
  const data = s => s ? new Date(s).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const dia = s => s ? new Date(s).toLocaleDateString('pt-PT') : '—';
  const hojeIso = () => new Date().toISOString().slice(0, 10);

  const ESTADOS = {
    DETETADO: 'Detectado', PROPOSTO: 'Proposto', DECIDIDO: 'Decidido', PUBLICADO: 'Publicado',
    EM_OBSERVACAO: 'Em observação', AVALIADO: 'Avaliado', FECHADO: 'Fechado',
    BLOQUEADO: 'Bloqueado', RETIRADO: 'Retirado', REGRESSAO: 'Regressão'
  };
  const PORTA = { AGIR_AGORA: 'Agir agora', AGUARDAR: 'Aguardar', INVESTIGAR: 'Investigar', NAO_AGIR: 'Não agir' };
  const RESULTADOS = {
    MELHORIA_OBSERVADA: 'Melhoria observada', SEM_EFEITO_CLARO: 'Sem efeito claro', PIOROU: 'Piorou', INCONCLUSIVO: 'Inconclusivo'
  };
  const NIVEL = { ALTA: 'alta', MEDIA: 'média', BAIXA: 'baixa', BAIXO: 'baixo', MEDIO: 'médio', ALTO: 'alto' };

  /* uma linha de assunto: título, página, objectivo e estado */
  function linhaAssunto(a, raiz) {
    const li = el('li', null, 'linha-assunto');
    const link = el('a', a.titulo);
    link.href = raiz + 'assunto/?id=' + encodeURIComponent(a.id);
    li.appendChild(link);
    li.appendChild(el('span', ' · ' + a.caminho, 'fraco'));
    li.appendChild(el('span', ' · ' + (a.objectivos && a.objectivos.length ? a.objectivos.join(', ') : 'sem objectivo configurado'), 'fraco'));
    if (a.estado && a.estado !== 'PROPOSTO' && a.estado !== 'DETETADO') {
      li.appendChild(document.createTextNode(' '));
      li.appendChild(el('span', ESTADOS[a.estado] || a.estado, 'chip chip-escuro'));
    }
    if (a.porta && a.porta.razao && a.porta.saida !== 'AGIR_AGORA') li.appendChild(el('div', a.porta.razao, 'sub'));
    return li;
  }

  function opcoes(select, lista, vazio, valor) {
    select.textContent = '';
    if (vazio != null) { const o = el('option', vazio); o.value = ''; select.appendChild(o); }
    for (const [v, t] of lista) {
      const o = el('option', t);
      o.value = v;
      if (valor != null && String(valor) === String(v)) o.selected = true;
      select.appendChild(o);
    }
  }

  function quem() {
    obter('/inteligencia/api/estado').then(d => { $('quem').textContent = d.identidade ? 'Sessão: ' + d.identidade : ''; }).catch(() => {});
  }

  return { $, el, obter, enviar, data, dia, hojeIso, ESTADOS, PORTA, RESULTADOS, NIVEL, linhaAssunto, opcoes, quem };
})();
