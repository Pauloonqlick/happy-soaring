/* Custos e limites da conta Cloudflare (pedido do Paulo, 14/09/2026).

   O QUE FAZ
     1. De hora a hora lê os consumos da conta na API GraphQL de analytics da Cloudflare
        e guarda-os por dia (consumos_dia). Os limites do Workers Paid são da CONTA:
        entram todos os Workers, bases, buckets e namespaces, também os que não são do site.
     2. Compara com o que o plano inclui, no ciclo de faturação (de renovação a renovação),
        projecta até ao fim do ciclo e estima o custo.
     3. Avisa antes de passar do incluído: no «Hoje» e, se os avisos estiverem
        configurados, por email — no máximo uma vez por métrica, por nível e por ciclo.

   O TOKEN
     CF_ANALYTICS_TOKEN, segredo do Worker, com permissão só de leitura: «Account
     Analytics: Read» (obrigatória) e «D1: Read» (só para mostrar o nome das bases).
     Nunca aparece em registos nem em respostas.

   DATAFORSEO
     O saldo pré-pago da DataForSEO lê-se na mesma hora (segredos DATAFORSEO_LOGIN e
     DATAFORSEO_PASSWORD; a chamada é gratuita). O gasto calcula-se pela descida do saldo.

   ESTIMATIVA, NÃO FATURA
     Os valores incluídos e os preços estão em TARIFAS, confirmados nas páginas oficiais
     da Cloudflare a 14/09/2026. Se a Cloudflare mudar preços, muda-se aqui. */
import { avisosConfigurados, enviarEmail } from './avisos.js';

export const TARIFAS = {
  confirmadas_em: '2026-09-14',
  fontes: [
    'https://developers.cloudflare.com/workers/platform/pricing/',
    'https://developers.cloudflare.com/d1/platform/pricing/',
    'https://developers.cloudflare.com/r2/pricing/'
  ],
  base_usd: 5,
  metricas: [
    { id: 'workers.pedidos', produto: 'workers', metrica: 'pedidos', titulo: 'Pedidos aos Workers', unidade: 'pedidos', incluido: 10e6, preco: 0.30, por: 1e6, precoTexto: '0,30 USD por milhão' },
    { id: 'workers.cpu_ms', produto: 'workers', metrica: 'cpu_ms', titulo: 'Tempo de processamento dos Workers', unidade: 'ms de CPU', incluido: 30e6, preco: 0.02, por: 1e6, precoTexto: '0,02 USD por milhão de ms' },
    { id: 'd1.linhas_lidas', produto: 'd1', metrica: 'linhas_lidas', titulo: 'Linhas lidas nas bases D1', unidade: 'linhas', incluido: 25e9, preco: 0.001, por: 1e6, precoTexto: '0,001 USD por milhão' },
    { id: 'd1.linhas_escritas', produto: 'd1', metrica: 'linhas_escritas', titulo: 'Linhas escritas nas bases D1', unidade: 'linhas', incluido: 50e6, preco: 1.00, por: 1e6, precoTexto: '1,00 USD por milhão' },
    { id: 'd1.armazenamento_bytes', produto: 'd1', metrica: 'armazenamento_bytes', titulo: 'Armazenamento das bases D1', unidade: 'GB', incluido: 5e9, preco: 0.75, por: 1e9, armazenamento: true, precoTexto: '0,75 USD por GB-mês' },
    { id: 'r2.armazenamento_bytes', produto: 'r2', metrica: 'armazenamento_bytes', titulo: 'Armazenamento R2', unidade: 'GB', incluido: 10e9, preco: 0.015, por: 1e9, armazenamento: true, precoTexto: '0,015 USD por GB-mês' },
    { id: 'r2.classe_a', produto: 'r2', metrica: 'classe_a', titulo: 'Operações R2 de classe A (escritas e listagens)', unidade: 'operações', incluido: 1e6, preco: 4.50, por: 1e6, precoTexto: '4,50 USD por milhão' },
    { id: 'r2.classe_b', produto: 'r2', metrica: 'classe_b', titulo: 'Operações R2 de classe B (leituras)', unidade: 'operações', incluido: 10e6, preco: 0.36, por: 1e6, precoTexto: '0,36 USD por milhão' },
    { id: 'kv.leituras', produto: 'kv', metrica: 'leituras', titulo: 'Leituras KV', unidade: 'leituras', incluido: 10e6, preco: 0.50, por: 1e6, precoTexto: '0,50 USD por milhão' },
    { id: 'kv.escritas', produto: 'kv', metrica: 'escritas', titulo: 'Escritas KV', unidade: 'escritas', incluido: 1e6, preco: 5.00, por: 1e6, precoTexto: '5,00 USD por milhão' },
    { id: 'kv.eliminacoes', produto: 'kv', metrica: 'eliminacoes', titulo: 'Eliminações KV', unidade: 'eliminações', incluido: 1e6, preco: 5.00, por: 1e6, precoTexto: '5,00 USD por milhão' },
    { id: 'kv.listagens', produto: 'kv', metrica: 'listagens', titulo: 'Listagens KV', unidade: 'listagens', incluido: 1e6, preco: 5.00, por: 1e6, precoTexto: '5,00 USD por milhão' },
    { id: 'kv.armazenamento_bytes', produto: 'kv', metrica: 'armazenamento_bytes', titulo: 'Armazenamento KV', unidade: 'GB', incluido: 1e9, preco: 0.50, por: 1e9, armazenamento: true, precoTexto: '0,50 USD por GB-mês' }
  ]
};
export const PRODUTOS = { workers: 'Workers', d1: 'Bases de dados D1', r2: 'Armazenamento R2', kv: 'Workers KV' };

/* Os níveis. «atencao» e «alerta» avisam ANTES de começar a pagar a mais. */
export const LIMIARES = { atencao_usado: 0.7, atencao_projeccao: 0.9, alerta_usado: 0.9, alerta_projeccao: 1.0 };
export const NIVEIS = ['ok', 'atencao', 'alerta', 'excedido'];

/* As operações R2 de classe A e B (páginas de preços da Cloudflare). As gratuitas não contam;
   uma operação desconhecida conta como classe A — a mais cara, para o aviso nunca chegar tarde. */
const R2_CLASSE_B = new Set(['HeadBucket', 'HeadObject', 'GetObject', 'UsageSummary', 'GetBucketEncryption', 'GetBucketLocation',
  'GetBucketCors', 'GetBucketLifecycleConfiguration']);
const R2_GRATIS = new Set(['DeleteObject', 'DeleteBucket', 'AbortMultipartUpload']);
export const classeR2 = accao => R2_GRATIS.has(accao) ? null : R2_CLASSE_B.has(accao) ? 'classe_b' : 'classe_a';
const KV_ACCAO = { read: 'leituras', write: 'escritas', delete: 'eliminacoes', list: 'listagens' };

const DIA = 864e5;
const t = s => Date.parse(s);
const somarDias = (d, n) => new Date(t(d + 'T12:00:00Z') + n * DIA).toISOString().slice(0, 10);

/* ---- o ciclo de faturação ------------------------------------------------ */
function dataDoMes(ano, mes0, dia) {
  const ultimo = new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes0, Math.min(dia, ultimo))).toISOString().slice(0, 10);
}
/* O ciclo que contém `hoje` (AAAA-MM-DD, UTC), recuado `atras` ciclos. [inicio, fim) em datas. Puro. */
export function ciclo(hoje, diaRenovacao, atras = 0) {
  const [a, m, d] = hoje.split('-').map(Number);
  let mes0 = m - 1 - (d >= Math.min(diaRenovacao, new Date(Date.UTC(a, m, 0)).getUTCDate()) ? 0 : 1) - atras;
  const ano = a + Math.floor(mes0 / 12);
  mes0 = ((mes0 % 12) + 12) % 12;
  const inicio = dataDoMes(ano, mes0, diaRenovacao);
  const fim = dataDoMes(ano + (mes0 === 11 ? 1 : 0), (mes0 + 1) % 12, diaRenovacao);
  return { inicio, fim };
}

/* ---- a recolha ----------------------------------------------------------- */
const CONSULTAS = {
  workers: `query($a:String!,$t0:Time!,$t1:Time!){ viewer { accounts(filter:{accountTag:$a}) {
    x: workersInvocationsAdaptive(limit:10000, filter:{datetime_geq:$t0, datetime_lt:$t1}) { sum { requests cpuTimeUs } dimensions { date scriptName } } } } }`,
  d1: `query($a:String!,$d0:Date!,$d1:Date!){ viewer { accounts(filter:{accountTag:$a}) {
    x: d1AnalyticsAdaptiveGroups(limit:10000, filter:{date_geq:$d0, date_leq:$d1}) { sum { rowsRead rowsWritten } dimensions { date databaseId } }
    y: d1StorageAdaptiveGroups(limit:10000, filter:{date_geq:$d0, date_leq:$d1}) { max { databaseSizeBytes } dimensions { date databaseId } } } } }`,
  r2: `query($a:String!,$t0:Time!,$t1:Time!){ viewer { accounts(filter:{accountTag:$a}) {
    x: r2OperationsAdaptiveGroups(limit:10000, filter:{datetime_geq:$t0, datetime_lt:$t1}) { sum { requests } dimensions { date actionType bucketName } }
    y: r2StorageAdaptiveGroups(limit:10000, filter:{datetime_geq:$t0, datetime_lt:$t1}) { max { payloadSize metadataSize } dimensions { date bucketName } } } } }`,
  kv: `query($a:String!,$d0:Date!,$d1:Date!){ viewer { accounts(filter:{accountTag:$a}) {
    x: kvOperationsAdaptiveGroups(limit:10000, filter:{date_geq:$d0, date_leq:$d1}) { sum { requests } dimensions { date actionType namespaceId } }
    y: kvStorageAdaptiveGroups(limit:10000, filter:{date_geq:$d0, date_leq:$d1}) { max { byteCount } dimensions { date namespaceId } } } } }`
};

/* Transforma as respostas GraphQL em linhas {dia, produto, metrica, recurso, valor}. Puro. */
export function linhasDeConsumo(produto, dados) {
  const out = new Map();
  const somar = (dia, metrica, recurso, v) => {
    if (!dia || !Number.isFinite(v)) return;
    const k = [dia, produto, metrica, recurso || ''].join('|');
    out.set(k, (out.get(k) || 0) + v);
  };
  const maximo = (dia, metrica, recurso, v) => {
    if (!dia || !Number.isFinite(v)) return;
    const k = [dia, produto, metrica, recurso || ''].join('|');
    out.set(k, Math.max(out.get(k) || 0, v));
  };
  const x = dados?.x || [], y = dados?.y || [];
  if (produto === 'workers') for (const r of x) {
    somar(r.dimensions.date, 'pedidos', r.dimensions.scriptName, Number(r.sum.requests));
    somar(r.dimensions.date, 'cpu_ms', r.dimensions.scriptName, Number(r.sum.cpuTimeUs) / 1000);
  }
  if (produto === 'd1') {
    for (const r of x) {
      somar(r.dimensions.date, 'linhas_lidas', r.dimensions.databaseId, Number(r.sum.rowsRead));
      somar(r.dimensions.date, 'linhas_escritas', r.dimensions.databaseId, Number(r.sum.rowsWritten));
    }
    for (const r of y) maximo(r.dimensions.date, 'armazenamento_bytes', r.dimensions.databaseId, Number(r.max.databaseSizeBytes));
  }
  if (produto === 'r2') {
    for (const r of x) { const c = classeR2(r.dimensions.actionType); if (c) somar(r.dimensions.date, c, r.dimensions.bucketName, Number(r.sum.requests)); }
    for (const r of y) maximo(r.dimensions.date, 'armazenamento_bytes', r.dimensions.bucketName, Number(r.max.payloadSize) + Number(r.max.metadataSize || 0));
  }
  if (produto === 'kv') {
    for (const r of x) { const m = KV_ACCAO[r.dimensions.actionType]; if (m) somar(r.dimensions.date, m, r.dimensions.namespaceId, Number(r.sum.requests)); }
    for (const r of y) maximo(r.dimensions.date, 'armazenamento_bytes', r.dimensions.namespaceId, Number(r.max.byteCount));
  }
  return [...out].map(([k, valor]) => { const [dia, p, metrica, recurso] = k.split('|'); return { dia, produto: p, metrica, recurso, valor }; });
}

const lerMeta = async (db, chaves) => Object.fromEntries((await db.prepare(`SELECT chave, valor FROM esquema_meta WHERE chave IN (${chaves.map(() => '?').join(', ')})`)
  .bind(...chaves).all()).results.map(r => [r.chave, r.valor]));
const json = (s, d) => { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };

/* Lê a Cloudflare e grava. `token` só é passado pelo script local (sessão do wrangler);
   no Worker vem do segredo. Devolve um relatório sem nada do token. */
export async function recolherConsumos(env, { agora = new Date().toISOString(), fetchImpl = fetch, token = null } = {}) {
  /* a DataForSEO não depende do token da Cloudflare */
  let dataforseo;
  try { dataforseo = await recolherDataForSeo(env, { agora, fetchImpl }); } catch (e) { dataforseo = { erro: String(e && e.message || e).slice(0, 120) }; }
  const cf = await recolherCloudflare(env, { agora, fetchImpl, token });
  const relatorio = { ...cf, dataforseo };
  if (!token) {
    try { relatorio.aviso = await avisarConsumo(env, { agora, fetchImpl }); } catch (e) { relatorio.aviso = { erro: String(e && e.message || e).slice(0, 120) }; }
  }
  return relatorio;
}

async function recolherCloudflare(env, { agora, fetchImpl, token }) {
  const chave = token || String(env.CF_ANALYTICS_TOKEN || '').trim();
  const db = env.DB;
  if (!chave) return { motivo: 'SEM_TOKEN' };
  const conta = String(env.CF_ACCOUNT_ID || '').trim();
  const meta = await lerMeta(db, ['faturacao_renovacao_dia', 'consumos_nomes']);
  const hoje = agora.slice(0, 10);
  /* do início do ciclo anterior até hoje (a API guarda cerca de um mês); se já há dados, só ontem e hoje */
  const renov = Number(meta.faturacao_renovacao_dia) || 14;
  const temDados = await db.prepare('SELECT MIN(dia) AS dia FROM consumos_dia').first();
  let d0 = temDados?.dia ? somarDias(hoje, -1) : ciclo(hoje, renov, 1).inicio;
  if (d0 < somarDias(hoje, -30)) d0 = somarDias(hoje, -30);
  const vars = { a: conta, d0, d1: hoje, t0: d0 + 'T00:00:00Z', t1: somarDias(hoje, 1) + 'T00:00:00Z' };

  const erros = [], linhas = [];
  for (const produto of Object.keys(CONSULTAS)) {
    try {
      const r = await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST', headers: { authorization: 'Bearer ' + chave, 'content-type': 'application/json', 'user-agent': 'hs-inteligencia' },
        body: JSON.stringify({ query: CONSULTAS[produto], variables: vars })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.errors?.length || !j.data?.viewer?.accounts?.[0]) {
        erros.push(produto + ': ' + (j.errors?.[0]?.message ? String(j.errors[0].message).slice(0, 120) : 'HTTP ' + r.status));
        continue;
      }
      linhas.push(...linhasDeConsumo(produto, j.data.viewer.accounts[0]));
    } catch (e) { erros.push(produto + ': ' + String(e && e.message || e).slice(0, 120)); }
  }
  /* os nomes das bases D1 (só se o token tiver «D1: Read»); os ids ficam se não tiver */
  const nomes = json(meta.consumos_nomes, {});
  try {
    const r = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${conta}/d1/database?per_page=100`, { headers: { authorization: 'Bearer ' + chave } });
    const j = await r.json().catch(() => ({}));
    if (j.success) nomes.d1 = Object.fromEntries((j.result || []).map(x => [x.uuid, x.name]));
  } catch (e) { /* sem nomes: não faz mal */ }

  const stmts = linhas.map(l => db.prepare('INSERT OR REPLACE INTO consumos_dia (dia, produto, metrica, recurso, valor, actualizado_em) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(l.dia, l.produto, l.metrica, l.recurso, l.valor, agora));
  const relatorio = { linhas: linhas.length, desde: d0, erros };
  stmts.push(db.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('consumos_nomes', ?)").bind(JSON.stringify(nomes)));
  stmts.push(db.prepare("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('consumos_ultima_recolha', ?)")
    .bind(JSON.stringify({ em: agora, ok: erros.length === 0, erros })));
  await db.batch(stmts);
  return relatorio;
}

/* ---- o cálculo ----------------------------------------------------------- */
/* Puro. `linhas` do ciclo; `fraccao` do ciclo decorrida (1 para ciclos acabados). */
export function calcularCiclo(linhas, { fraccao, diasCiclo, planoPago = true }) {
  const metricas = TARIFAS.metricas.map(m => {
    const minhas = linhas.filter(l => l.produto === m.produto && l.metrica === m.metrica);
    const porRecurso = new Map();
    let usado, actual = null;
    if (m.armazenamento) {
      const porDia = new Map();
      for (const l of minhas) {
        porDia.set(l.dia, (porDia.get(l.dia) || 0) + l.valor);
        porRecurso.set(l.recurso, Math.max(porRecurso.get(l.recurso) || 0, l.valor));
      }
      const dias = [...porDia.keys()].sort();
      /* GB-mês: a média diária do que esteve guardado, ao longo do ciclo */
      usado = dias.length ? [...porDia.values()].reduce((a, b) => a + b, 0) / dias.length : 0;
      actual = dias.length ? porDia.get(dias[dias.length - 1]) : 0;
    } else {
      usado = 0;
      for (const l of minhas) { usado += l.valor; porRecurso.set(l.recurso, (porRecurso.get(l.recurso) || 0) + l.valor); }
    }
    const projeccao = m.armazenamento ? usado : (fraccao > 0 ? usado / fraccao : usado);
    const custo = v => planoPago ? Math.max(0, v - m.incluido) / m.por * m.preco : null;
    const pct = usado / m.incluido, pctProj = projeccao / m.incluido;
    let nivel = 'ok';
    if (pct > 1) nivel = 'excedido';
    else if (pct >= LIMIARES.alerta_usado || (fraccao >= 1 / diasCiclo * 2 && pctProj >= LIMIARES.alerta_projeccao)) nivel = 'alerta';
    else if (pct >= LIMIARES.atencao_usado || (fraccao >= 1 / diasCiclo * 2 && pctProj >= LIMIARES.atencao_projeccao)) nivel = 'atencao';
    return {
      id: m.id, produto: m.produto, titulo: m.titulo, unidade: m.unidade, incluido: m.incluido, preco_texto: m.precoTexto,
      armazenamento: !!m.armazenamento, usado, actual, projeccao, pct, pct_projeccao: pctProj, nivel,
      custo_actual: custo(usado), custo_projectado: custo(projeccao),
      recursos: [...porRecurso].map(([recurso, valor]) => ({ recurso, valor })).sort((a, b) => b.valor - a.valor),
      com_dados: minhas.length > 0
    };
  });
  const extra = a => metricas.reduce((s, m) => s + (m[a] || 0), 0);
  return {
    metricas,
    base_usd: planoPago ? TARIFAS.base_usd : 0,
    excesso_actual_usd: planoPago ? extra('custo_actual') : null,
    excesso_projectado_usd: planoPago ? extra('custo_projectado') : null,
    total_projectado_usd: planoPago ? TARIFAS.base_usd + extra('custo_projectado') : null,
    nivel: metricas.reduce((n, m) => NIVEIS.indexOf(m.nivel) > NIVEIS.indexOf(n) ? m.nivel : n, 'ok')
  };
}

async function linhasEntre(db, inicio, fim) {
  return (await db.prepare('SELECT dia, produto, metrica, recurso, valor FROM consumos_dia WHERE dia >= ? AND dia < ?').bind(inicio, fim).all()).results;
}

/* ---- DataForSEO: saldo pré-pago ------------------------------------------ */
/* Os níveis do saldo: em USD e em dias que o saldo dura ao ritmo dos últimos 30 dias. */
export const DATAFORSEO = { atencao_saldo: 10, alerta_saldo: 3, atencao_dias: 60, alerta_dias: 14 };
export const dataforseoConfigurada = env => !!(String(env.DATAFORSEO_LOGIN || '').trim() && String(env.DATAFORSEO_PASSWORD || '').trim());
const base64 = s => { const b = new TextEncoder().encode(s); let x = ''; for (const c of b) x += String.fromCharCode(c); return btoa(x); };

/* Lê o saldo (a chamada «user_data» é gratuita) e guarda uma leitura. Nada das credenciais sai daqui. */
export async function recolherDataForSeo(env, { agora = new Date().toISOString(), fetchImpl = fetch } = {}) {
  if (!dataforseoConfigurada(env)) return { motivo: 'SEM_CREDENCIAIS' };
  const auth = 'Basic ' + base64(String(env.DATAFORSEO_LOGIN).trim() + ':' + String(env.DATAFORSEO_PASSWORD).trim());
  const r = await fetchImpl('https://api.dataforseo.com/v3/appendix/user_data', { headers: { authorization: auth, 'user-agent': 'hs-inteligencia' } });
  const j = await r.json().catch(() => ({}));
  const m = j?.tasks?.[0]?.result?.[0]?.money;
  if (!r.ok || !m || !Number.isFinite(Number(m.balance)) || !Number.isFinite(Number(m.total))) {
    return { erro: 'HTTP ' + r.status + (j?.status_code ? ' · código ' + j.status_code : '') };
  }
  const hoje = m.statistics?.day?.total;
  await env.DB.prepare('INSERT OR REPLACE INTO dataforseo_saldos (em, saldo, total, gasto_hoje) VALUES (?, ?, ?, ?)')
    .bind(agora, Number(m.balance), Number(m.total), hoje == null ? null : Number(hoje)).run();
  return { saldo: Number(m.balance) };
}

/* Puro. Leituras por ordem → gasto por dia (UTC) e carregamentos. O gasto é a descida
   do saldo entre duas leituras, somando o que foi carregado entretanto. */
export function gastosDataForSeo(leituras) {
  const porDia = new Map(), cargas = [];
  for (let i = 1; i < leituras.length; i++) {
    const a = leituras[i - 1], b = leituras[i];
    const carga = Math.max(0, b.total - a.total);
    if (carga > 0) cargas.push({ em: b.em, usd: carga });
    const gasto = Math.max(0, a.saldo + carga - b.saldo);
    const d = b.em.slice(0, 10);
    porDia.set(d, (porDia.get(d) || 0) + gasto);
  }
  return { porDia, cargas };
}

/* Puro. O estado do saldo. */
export function estadoDataForSeo(leituras, { agora, ciclo: c, fraccao }) {
  if (!leituras.length) return null;
  const { porDia, cargas } = gastosDataForSeo(leituras);
  const ultima = leituras[leituras.length - 1];
  const soma = (desde, ate) => [...porDia].filter(([d]) => d >= desde && d < ate).reduce((s, [, v]) => s + v, 0);
  const hoje = agora.slice(0, 10);
  const desde30 = new Date(t(agora) - 30 * DIA).toISOString();
  const primeira30 = leituras.find(l => l.em >= desde30) || leituras[0];
  const diasObservados = Math.max(0, (t(ultima.em) - t(primeira30.em)) / DIA);
  const gasto30 = soma(desde30.slice(0, 10), somarDias(hoje, 1));
  /* o ritmo só se diz com pelo menos um dia de leituras */
  const ritmo = diasObservados >= 1 ? gasto30 / diasObservados : null;
  const diasRestantes = ritmo && ritmo > 0 ? ultima.saldo / ritmo : null;
  const gastoCiclo = soma(c.inicio, c.fim);
  let nivel = 'ok';
  if (ultima.saldo <= 0) nivel = 'excedido';
  else if (ultima.saldo < DATAFORSEO.alerta_saldo || (diasRestantes != null && diasRestantes < DATAFORSEO.alerta_dias)) nivel = 'alerta';
  else if (ultima.saldo < DATAFORSEO.atencao_saldo || (diasRestantes != null && diasRestantes < DATAFORSEO.atencao_dias)) nivel = 'atencao';
  return {
    ultima_leitura: ultima.em, saldo: ultima.saldo, total_carregado: ultima.total,
    gasto_desde_abertura: Math.max(0, ultima.total - ultima.saldo),
    gasto_ciclo: gastoCiclo, gasto_ciclo_projectado: fraccao > 0 ? gastoCiclo / fraccao : gastoCiclo,
    gasto_30_dias: gasto30, dias_observados: diasObservados, ritmo_diario: ritmo, dias_restantes: diasRestantes,
    nivel, cargas: cargas.slice(-10),
    dias: [...porDia].filter(([d]) => d >= desde30.slice(0, 10)).map(([dia, usd]) => ({ dia, usd })).sort((a, b) => a.dia < b.dia ? 1 : -1)
  };
}

async function leiturasDataForSeo(db, agora) {
  return (await db.prepare('SELECT em, saldo, total FROM dataforseo_saldos WHERE em >= ? ORDER BY em')
    .bind(new Date(t(agora) - 400 * DIA).toISOString()).all()).results;
}

/* ---- a leitura do painel ------------------------------------------------ */
export async function lerCustos(env, { agora = new Date().toISOString(), atras = 0 } = {}) {
  const db = env.DB;
  const meta = await lerMeta(db, ['faturacao_renovacao_dia', 'faturacao_plano_desde', 'consumos_nomes', 'consumos_ultima_recolha']);
  const renov = Number(meta.faturacao_renovacao_dia) || 14;
  const planoDesde = meta.faturacao_plano_desde || '2026-09-14';
  const hoje = agora.slice(0, 10);
  const nomes = json(meta.consumos_nomes, {});
  const c = ciclo(hoje, renov, Math.max(0, Math.min(24, atras)));
  const diasCiclo = Math.round((t(c.fim) - t(c.inicio)) / DIA);
  const fraccao = Math.min(1, Math.max(1 / 24 / diasCiclo, (t(agora) - t(c.inicio + 'T00:00:00Z')) / (t(c.fim + 'T00:00:00Z') - t(c.inicio + 'T00:00:00Z'))));
  const calc = calcularCiclo(await linhasEntre(db, c.inicio, c.fim), { fraccao, diasCiclo, planoPago: c.inicio >= planoDesde });
  const nome = (produto, id) => produto === 'd1' ? (nomes.d1?.[id] || (id ? 'base ' + id.slice(0, 8) : '—'))
    : produto === 'workers' && id === '__unknown__' ? 'sem nome (pré-visualizações)' : (id || '—');
  for (const m of calc.metricas) m.recursos = m.recursos.map(r => ({ ...r, nome: nome(m.produto, r.recurso) }));

  const leituras = await leiturasDataForSeo(db, agora);
  const dfs = estadoDataForSeo(leituras, { agora, ciclo: c, fraccao });
  const gastosDfs = gastosDataForSeo(leituras).porDia;
  const dfsEntre = (a, b) => [...gastosDfs].filter(([d]) => d >= a && d < b).reduce((s, [, v]) => s + v, 0);

  /* os ciclos anteriores com dados, para a evolução */
  const primeiroCf = (await db.prepare('SELECT MIN(dia) AS dia FROM consumos_dia').first())?.dia;
  const primeiro = [primeiroCf, leituras[0]?.em.slice(0, 10)].filter(Boolean).sort()[0];
  const historico = [];
  if (primeiro) {
    for (let k = 0; k < 12; k++) {
      const h = ciclo(hoje, renov, k);
      if (h.fim <= primeiro) break;
      const dias = Math.round((t(h.fim) - t(h.inicio)) / DIA);
      const fr = k === 0 ? fraccao : 1;
      const r = calcularCiclo(await linhasEntre(db, h.inicio, h.fim), { fraccao: fr, diasCiclo: dias, planoPago: h.inicio >= planoDesde });
      historico.push({ inicio: h.inicio, fim: h.fim, actual: k === 0, plano_pago: h.inicio >= planoDesde,
        total_usd: r.base_usd + (r.excesso_actual_usd || 0), total_projectado_usd: r.total_projectado_usd, nivel: r.nivel,
        /* antes da primeira leitura do saldo não se sabe o que se gastou: fica vazio, não a zero */
        dataforseo_usd: leituras.length && h.fim > leituras[0].em.slice(0, 10) ? dfsEntre(h.inicio, h.fim) : null,
        metricas: Object.fromEntries(r.metricas.map(m => [m.id, m.usado])) });
    }
  }
  return {
    agora, token_configurado: !!String(env.CF_ANALYTICS_TOKEN || '').trim(),
    dataforseo_configurada: dataforseoConfigurada(env),
    ultima_recolha: json(meta.consumos_ultima_recolha, null),
    tarifas: { confirmadas_em: TARIFAS.confirmadas_em, fontes: TARIFAS.fontes, base_usd: TARIFAS.base_usd },
    limiares: LIMIARES, limiares_dataforseo: DATAFORSEO, produtos: PRODUTOS, plano_desde: planoDesde, renovacao_dia: renov,
    ciclo: { ...c, dias: diasCiclo, fraccao, actual: atras === 0, anterior: atras + 1, seguinte: atras > 0 ? atras - 1 : null,
      plano_pago: c.inicio >= planoDesde },
    ...calc,
    dataforseo: dfs,
    /* o mês todo: Cloudflare (estimado no fim do ciclo) + DataForSEO (ao ritmo do ciclo, ou o que se gastou nos ciclos acabados) */
    total_geral_projectado_usd: (calc.total_projectado_usd ?? 0) + (dfs ? (atras === 0 ? dfs.gasto_ciclo_projectado : dfsEntre(c.inicio, c.fim)) : 0),
    historico
  };
}

/* Para o «Hoje»: as métricas do ciclo actual em atenção, alerta ou excedidas, e o saldo DataForSEO. */
export async function limitesParaHoje(env, agora = new Date().toISOString()) {
  const [cf, dfs] = await Promise.all([
    env.DB.prepare('SELECT 1 AS x FROM consumos_dia LIMIT 1').first(),
    env.DB.prepare('SELECT 1 AS x FROM dataforseo_saldos LIMIT 1').first()
  ]);
  if (!cf && !dfs) return [];
  const c = await lerCustos(env, { agora });
  const out = c.metricas.filter(m => m.nivel !== 'ok').map(m => ({
    id: m.id, titulo: m.titulo, nivel: m.nivel, pct: m.pct, pct_projeccao: m.pct_projeccao, custo_projectado: m.custo_projectado, ciclo_fim: c.ciclo.fim
  }));
  if (c.dataforseo && c.dataforseo.nivel !== 'ok') {
    out.push({ id: 'dataforseo.saldo', titulo: 'Saldo DataForSEO', nivel: c.dataforseo.nivel, saldo: c.dataforseo.saldo, dias_restantes: c.dataforseo.dias_restantes });
  }
  return out;
}

/* ---- o aviso por email ---------------------------------------------------- */
const pctTexto = x => (x * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + '%';
export function comporAvisoConsumo(novos, c) {
  const soDfs = novos.every(n => n.id === 'dataforseo.saldo');
  const pior = novos.some(n => n.nivel === 'excedido');
  const assunto = 'Happy Soaring — ' + (soDfs ? (pior ? 'o saldo DataForSEO acabou' : 'o saldo DataForSEO está a acabar')
    : 'a conta Cloudflare ' + (pior ? 'já passou do incluído' : 'está perto do limite'));
  const linhas = novos.map(n => n.id === 'dataforseo.saldo'
    ? '• Saldo DataForSEO: ' + n.saldo.toFixed(2) + ' USD' + (n.dias_restantes != null ? '; ao ritmo dos últimos 30 dias dura cerca de ' + Math.round(n.dias_restantes) + ' dias' : '') + '.'
    : '• ' + n.titulo + ': ' + pctTexto(n.pct) + ' do incluído usado; a este ritmo chega a ' + pctTexto(n.pct_projeccao) +
      ' no fim do ciclo (' + c.ciclo.fim + ')' + (n.custo_projectado > 0 ? ' — custo extra estimado ' + n.custo_projectado.toFixed(2) + ' USD' : '') + '.');
  const texto = 'Custos no ciclo de ' + c.ciclo.inicio + ' a ' + c.ciclo.fim + ':\n\n' + linhas.join('\n') +
    '\n\nVer o painel de custos: https://happysoaring.com/inteligencia/custos/\n\n—\nEstimativa a partir das estatísticas da Cloudflare e do saldo da DataForSEO; as faturas oficiais são as delas. ' +
    'Cada métrica só é avisada uma vez por nível em cada ciclo.';
  return { assunto, texto };
}

export async function avisarConsumo(env, { agora = new Date().toISOString(), fetchImpl = fetch } = {}) {
  if (!avisosConfigurados(env)) return { enviado: false, motivo: 'SEM_CONFIGURACAO' };
  const c = await lerCustos(env, { agora });
  const graves = c.metricas.filter(m => m.nivel === 'alerta' || m.nivel === 'excedido');
  if (c.dataforseo && (c.dataforseo.nivel === 'alerta' || c.dataforseo.nivel === 'excedido')) {
    graves.push({ id: 'dataforseo.saldo', titulo: 'Saldo DataForSEO', nivel: c.dataforseo.nivel, saldo: c.dataforseo.saldo, dias_restantes: c.dataforseo.dias_restantes });
  }
  if (!graves.length) return { enviado: false, motivo: 'SEM_ALERTAS' };
  const { results } = await env.DB.prepare("SELECT assuntos FROM avisos WHERE motivo = 'CONSUMO' AND estado = 'ENVIADO' AND criado_em >= ?")
    .bind(c.ciclo.inicio).all();
  const ja = new Set();
  for (const r of results) for (const a of json(r.assuntos, [])) ja.add(a.metrica + '@' + a.nivel + '@' + a.ciclo);
  const novos = graves.filter(m => !ja.has(m.id + '@' + m.nivel + '@' + c.ciclo.inicio));
  if (!novos.length) return { enviado: false, motivo: 'JA_AVISADO' };
  const { assunto, texto } = comporAvisoConsumo(novos, c);
  const r = await enviarEmail(env, fetchImpl, { assunto, texto, idempotencia: 'consumo-' + c.ciclo.inicio + '-' + novos.map(n => n.id + n.nivel).join('-') });
  await env.DB.prepare("INSERT INTO avisos (criado_em, motivo, assuntos, estado, id_fornecedor, erro) VALUES (?, 'CONSUMO', ?, ?, ?, ?)")
    .bind(agora, JSON.stringify(novos.map(n => ({ metrica: n.id, nivel: n.nivel, ciclo: c.ciclo.inicio }))), r.ok ? 'ENVIADO' : 'FALHOU', r.id ?? null, r.erro ?? null).run();
  return { enviado: r.ok, metricas: novos.length };
}
