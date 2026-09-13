/* PUBLICAÇÕES DO SITE — observação pela API de Deployments do Cloudflare Pages.

   DEPLOYMENTS DE PRODUÇÃO → IDs AINDA NÃO PROCESSADOS → PROCESSAR CADA UM
   → LER O SEU /meta.json E CONTEÚDO → GUARDAR OBSERVAÇÃO

   Plano gratuito do Workers: 50 pedidos externos e 50 consultas D1 por
   execução, 10 ms de CPU. O trabalho de cada deployment divide-se em passos
   (META → SITEMAP → PAGINAS → DADOS → FIM) e cada execução avança o que o
   orçamento deixar. Nada se perde se uma execução for interrompida: o passo
   e as páginas por ler ficam na base. */

export const ORCAMENTO = { pedidos: 42, consultas: 42 };
const PAGINAS_POR_LOTE = 16;          /* pedidos por execução ao ler páginas */

/* ---------------------------------------------------------------- puro -- */

/* O carimbo que o publicar.mjs acrescenta a app.js, CSS, etc. Retirado, o HTML
   fica igual à fonte — e o SHA-1 igual ao `resumo` do sitemap-datas.json. */
export function normalizarHtml(html) {
  return html.replace(/\?v=[0-9a-f]{8}(?=")/g, '');
}

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export async function sha1(texto) {
  return hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texto)));
}
export async function sha256(bytes) {
  const b = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  return hex(await crypto.subtle.digest('SHA-256', b));
}

export function caminhosDoSitemap(xml) {
  const out = [];
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    try { out.push(new URL(m[1]).pathname); } catch (e) { /* entrada inválida: ignorada */ }
  }
  return [...new Set(out)];
}

export const eSpa = html => /<script[^>]+src="\/?app\.js/i.test(html);

/* Os ficheiros de dados que a inicial carrega em execução, pela mesma ordem
   que o loadSite() e o carregaCatalogo() do app.js. Um teste de contrato
   falha se o app.js deixar de os carregar assim. */
export function ficheirosDeDados(settings) {
  const f = ['/content/settings.json', '/content/tema.json', '/content/cores/flow-tecidos.json'];
  const seguro = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/i.test(id);
  for (const id of Array.isArray(settings?.slides) ? settings.slides : []) if (seguro(id)) f.push('/content/slides/' + id + '.json');
  for (const id of Array.isArray(settings?.avisos) ? settings.avisos : []) if (seguro(id)) f.push('/content/avisos/' + id + '.json');
  return [...new Set(f)];
}

/* Compara duas publicações. `anterior` e `actual`:
   { paginas: Map(caminho -> {resumo_conteudo, resumo_publicado, spa, estado}), dados: Map(ficheiro -> resumo) } */
export function classificarAlteracoes(anterior, actual) {
  const r = { nova: [], retirada: [], conteudo: [], dados: [], tecnica: [], igual: [], sem_leitura: [] };
  if (!anterior) return null;
  const dadosMudaram = (() => {
    const chaves = new Set([...anterior.dados.keys(), ...actual.dados.keys()]);
    for (const k of chaves) if (anterior.dados.get(k) !== actual.dados.get(k)) return true;
    return false;
  })();
  for (const [c, p] of actual.paginas) {
    const a = anterior.paginas.get(c);
    if (!a) { r.nova.push(c); continue; }
    if (p.estado !== 'LIDA' || a.estado !== 'LIDA') { r.sem_leitura.push(c); continue; }
    if (p.resumo_conteudo !== a.resumo_conteudo) r.conteudo.push(c);
    else if (p.spa && dadosMudaram) r.dados.push(c);
    else if (p.resumo_publicado !== a.resumo_publicado) r.tecnica.push(c);
    else r.igual.push(c);
  }
  for (const c of anterior.paginas.keys()) if (!actual.paginas.has(c)) r.retirada.push(c);
  for (const k of Object.keys(r)) r[k].sort();
  return r;
}

/* ------------------------------------------------------------ recursos -- */

function contador(env, fetchImpl) {
  const c = { pedidos: 0, consultas: 0 };
  const buscar = (url, init) => { c.pedidos++; return fetchImpl(url, init); };
  const q = sql => { c.consultas++; return env.DB.prepare(sql); };
  const lote = stmts => { c.consultas += stmts.length; return env.DB.batch(stmts); };
  const sobra = () => c.pedidos < ORCAMENTO.pedidos && c.consultas < ORCAMENTO.consultas;
  return { c, buscar, q, lote, sobra };
}

/* A tarefa corre de 2 em 2 minutos: a mesma limitação repetida não se grava
   mais do que uma vez por hora, para não encher a base de avisos iguais. */
async function evento(r, tipo, detalhe) {
  const recente = await r.q(`SELECT 1 AS x FROM eventos_operacionais WHERE tipo = ?
      AND criado_em > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour') LIMIT 1`).bind(tipo).first();
  if (recente) return;
  await r.q('INSERT INTO eventos_operacionais (tipo, detalhe) VALUES (?, ?)')
    .bind(tipo, String(detalhe ?? '').slice(0, 500)).run();
}

/* ------------------------------------------------------- 1. descobrir -- */

async function listarDeployments(env, r, todas) {
  const conta = String(env.CF_ACCOUNT_ID || '').trim();
  const projecto = String(env.CF_PAGES_PROJECT || '').trim();
  const token = String(env.CF_API_TOKEN_PAGES || '').trim();
  if (!conta || !projecto || !token) return { ok: false, motivo: 'SEM_CREDENCIAL_PAGES' };

  /* A primeira página vai só com `env`, como faz o próprio wrangler: com
     `page=1` a API responde 400 (verificado em produção a 13/09/2026).
     `page` só se acrescenta para as páginas seguintes, se a API disser que existem. */
  const lista = [];
  const base = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(conta) +
    '/pages/projects/' + encodeURIComponent(projecto) + '/deployments?env=production';
  for (let pagina = 1; pagina <= (todas ? 20 : 1); pagina++) {
    const u = pagina === 1 ? base : base + '&page=' + pagina;
    const resp = await r.buscar(u, { headers: { authorization: 'Bearer ' + token, accept: 'application/json' } });
    if (!resp.ok) {
      let detalhe = '';
      try { const e = await resp.json(); detalhe = (e.errors || []).map(x => x.code + ' ' + x.message).join('; '); } catch (e) { detalhe = ''; }
      if (pagina === 1) return { ok: false, motivo: 'API_PAGES_HTTP_' + resp.status, detalhe };
      return { ok: true, lista, parcial: 'PAGINA_' + pagina + '_HTTP_' + resp.status + (detalhe ? ' ' + detalhe : '') };
    }
    const j = await resp.json();
    if (!j.success || !Array.isArray(j.result)) return { ok: false, motivo: 'API_PAGES_RESPOSTA_INVALIDA' };
    lista.push(...j.result);
    const info = j.result_info || {};
    if (!j.result.length || !info.total_pages || pagina >= info.total_pages) break;
  }
  return { ok: true, lista };
}

/* A primeira descoberta lista todas as páginas da API. Só depois de TODOS
   os deployments dessa lista estarem gravados passa a ler apenas a primeira
   página (onde aparecem os novos) — assim uma primeira execução interrompida
   não deixa deployments antigos por descobrir. */
async function descobrir(env, r) {
  const completa = (await r.q("SELECT valor FROM esquema_meta WHERE chave='publicacoes_descoberta_completa'").first())?.valor === '1';
  const res = await listarDeployments(env, r, !completa);
  if (!res.ok) { await evento(r, 'PUBLICACOES_' + res.motivo, res.detalhe); return { novos: 0, motivo: res.motivo, detalhe: res.detalhe || null }; }
  if (res.parcial) await evento(r, 'PUBLICACOES_LISTAGEM_PARCIAL', res.parcial);

  /* Uma só consulta para saber o que já é conhecido. Gravar de novo, uma a
     uma, publicações já registadas esgotava o orçamento de consultas em
     cada execução e nada chegava a ser processado (visto em produção a
     13/09/2026, com 41 publicações). */
  const { results: jaConhecidos } = await r.q('SELECT id FROM deployments').all();
  const conhecidos = new Set(jaConhecidos.map(x => x.id));

  let novos = 0, interrompida = false;
  for (const d of res.lista) {
    if (!d || !d.id || !d.url || conhecidos.has(d.id)) continue;
    if (!r.sobra()) { interrompida = true; break; }
    const sucesso = d.latest_stage?.status === 'success';
    const prod = (d.environment || 'production') === 'production';
    const chave = sucesso && prod && env.BRUTO ? 'deployments/' + d.id + '.json' : null;
    const ins = await r.q(`INSERT OR IGNORE INTO deployments
        (id, short_id, url, ambiente, ramo, commit_cf, criado_em_cf, modificado_em_cf, fase_cf, estado_cf,
         resposta_bruta, processamento, passo)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(d.id, d.short_id ?? null, d.url, d.environment ?? null,
        d.deployment_trigger?.metadata?.branch ?? null, d.deployment_trigger?.metadata?.commit_hash ?? null,
        d.created_on, d.modified_on ?? null, d.latest_stage?.name ?? null, d.latest_stage?.status ?? null,
        chave, sucesso && prod ? 'PENDENTE' : 'IGNORADO', sucesso && prod ? 'META' : 'FIM').run();
    if (ins.meta?.changes) {
      novos++;
      if (chave) { r.c.pedidos++; await env.BRUTO.put(chave, JSON.stringify(d), { httpMetadata: { contentType: 'application/json' } }); }
    }
  }
  if (!completa && !interrompida && !res.parcial) {
    await r.q("INSERT OR REPLACE INTO esquema_meta (chave, valor) VALUES ('publicacoes_descoberta_completa', '1')").run();
  }
  return { novos };
}

/* ------------------------------------------------------- 2. processar -- */

async function passoMeta(env, r, d) {
  const resp = await r.buscar(d.url + '/meta.json', { headers: { accept: 'application/json' } });
  /* O Pages responde 200 com uma página HTML a caminhos que não existem.
     As publicações anteriores ao meta.json (julho de 2026) caem aqui:
     é AUSENTE, não ERRO. */
  let estado = 'ERRO', m = {};
  if (resp.status === 404) estado = 'AUSENTE';
  else if (resp.ok) {
    const texto = await resp.text();
    if (/^\s*</.test(texto)) estado = 'AUSENTE';
    else { try { m = JSON.parse(texto); estado = m && typeof m === 'object' ? 'OK' : 'ERRO'; } catch (e) { estado = 'ERRO'; } }
  }
  await r.q(`UPDATE deployments SET meta_estado=?, meta_commit=?, meta_sujo=?, meta_publicado=?, meta_impressao=?, passo='SITEMAP'
             WHERE id=?`)
    .bind(estado, m.commit ?? null, typeof m.sujo === 'boolean' ? (m.sujo ? 1 : 0) : null,
      m.publicado ?? null, m.impressao ?? null, d.id).run();
  return 'SITEMAP';
}

async function passoSitemap(env, r, d) {
  const resp = await r.buscar(d.url + '/sitemap.xml');
  const texto = resp.ok ? await resp.text() : '';
  const caminhos = resp.ok && /<urlset[\s>]/i.test(texto) ? caminhosDoSitemap(texto) : [];
  /* Sem sitemap verdadeiro não se sabe que páginas a publicação tinha. Fica
     como limitação e NUNCA entra nas comparações: se entrasse com 0 páginas,
     a publicação seguinte mostraria o site inteiro como «novo». */
  if (!caminhos.length) {
    const erro = !resp.ok ? 'SITEMAP_HTTP_' + resp.status : 'SEM_SITEMAP';
    await r.q(`UPDATE deployments SET processamento='FALHOU', passo='FIM', erro=? WHERE id=?`).bind(erro, d.id).run();
    return 'FIM';
  }
  const stmts = [];
  for (let i = 0; i < caminhos.length; i += 40) {             /* 40 × 2 parâmetros < 100 (limite D1) */
    const parte = caminhos.slice(i, i + 40);
    stmts.push(env.DB.prepare('INSERT OR IGNORE INTO deployment_paginas (deployment_id, caminho) VALUES ' +
      parte.map(() => '(?, ?)').join(', ')).bind(...parte.flatMap(c => [d.id, c])));
  }
  stmts.push(env.DB.prepare(`UPDATE deployments SET paginas_total=?, passo='PAGINAS' WHERE id=?`).bind(caminhos.length, d.id));
  await r.lote(stmts);
  return 'PAGINAS';
}

async function passoPaginas(env, r, d) {
  const livres = Math.min(PAGINAS_POR_LOTE, ORCAMENTO.pedidos - r.c.pedidos - 1, ORCAMENTO.consultas - r.c.consultas - 3);
  if (livres <= 0) return 'PAGINAS';
  const { results: porLer } = await r.q(
    `SELECT caminho FROM deployment_paginas WHERE deployment_id=? AND estado='POR_LER' ORDER BY caminho LIMIT ?`)
    .bind(d.id, livres).all();
  if (!porLer.length) {
    await r.q(`UPDATE deployments SET passo='DADOS' WHERE id=?`).bind(d.id).run();
    return 'DADOS';
  }
  const agora = new Date().toISOString();
  const stmts = [];
  for (const { caminho } of porLer) {
    let http = null, rc = null, rp = null, spa = 0, estado = 'ERRO';
    try {
      const resp = await r.buscar(d.url + caminho);
      http = resp.status;
      if (resp.ok) {
        const bytes = new Uint8Array(await resp.arrayBuffer());
        const html = new TextDecoder().decode(bytes);
        rc = await sha1(normalizarHtml(html));
        rp = await sha256(bytes);
        spa = eSpa(html) ? 1 : 0;
        estado = 'LIDA';
      }
    } catch (e) { http = null; }
    stmts.push(env.DB.prepare(`UPDATE deployment_paginas SET estado=?, http=?, resumo_conteudo=?, resumo_publicado=?, spa=?, lida_em=?
                               WHERE deployment_id=? AND caminho=?`)
      .bind(estado, http, rc, rp, spa, agora, d.id, caminho));
  }
  await r.lote(stmts);
  return 'PAGINAS';
}

async function passoDados(env, r, d) {
  const resp = await r.buscar(d.url + '/content/settings.json');
  let settings = null;
  const linhas = [];
  if (resp.ok) {
    const bytes = new Uint8Array(await resp.arrayBuffer());
    linhas.push(['/content/settings.json', resp.status, await sha256(bytes)]);
    try { settings = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { settings = null; }
  } else linhas.push(['/content/settings.json', resp.status, null]);

  for (const f of ficheirosDeDados(settings).filter(f => f !== '/content/settings.json')) {
    if (r.c.pedidos >= ORCAMENTO.pedidos) return 'DADOS';        /* retoma na próxima execução */
    const x = await r.buscar(d.url + f);
    linhas.push([f, x.status, x.ok ? await sha256(new Uint8Array(await x.arrayBuffer())) : null]);
  }

  /* a publicação anterior é a última já processada antes desta */
  const ant = await r.q(`SELECT id FROM deployments WHERE processamento='PROCESSADO' AND criado_em_cf < ?
                         ORDER BY criado_em_cf DESC LIMIT 1`).bind(d.criado_em_cf).first();
  const stmts = [env.DB.prepare('DELETE FROM deployment_dados WHERE deployment_id=?').bind(d.id)];
  for (let i = 0; i < linhas.length; i += 20) {               /* 20 × 4 parâmetros < 100 */
    const parte = linhas.slice(i, i + 20);
    stmts.push(env.DB.prepare('INSERT INTO deployment_dados (deployment_id, ficheiro, http, resumo) VALUES ' +
      parte.map(() => '(?, ?, ?, ?)').join(', ')).bind(...parte.flatMap(l => [d.id, ...l])));
  }
  stmts.push(env.DB.prepare(`UPDATE deployments SET processamento='PROCESSADO', passo='FIM', anterior_id=?, processado_em=? WHERE id=?`)
    .bind(ant?.id ?? null, new Date().toISOString(), d.id));
  /* a última alteração de cada página que ESTA publicação mudou (Fase 4) */
  stmts.push(env.DB.prepare(SQL_ALTERACOES_DE_UMA_PUBLICACAO).bind(d.id));
  await r.lote(stmts);
  return 'FIM';
}

/* As páginas que uma publicação alterou face à anterior — conteúdo, dados do
   CMS (páginas SPA) ou página nova; nunca as só técnicas — gravadas como
   última alteração se forem mais recentes. A mesma regra da migração 0004. */
export const SQL_ALTERACOES_DE_UMA_PUBLICACAO = `
INSERT INTO paginas_alteracao (caminho, ultima_alteracao_em, deployment_id, tipo)
SELECT caminho, criado_em_cf, id, tipo FROM (
  SELECT p.caminho, d.criado_em_cf, d.id,
    CASE
      WHEN a.caminho IS NULL THEN 'nova'
      WHEN a.estado <> 'LIDA' THEN NULL
      WHEN p.resumo_conteudo <> a.resumo_conteudo THEN 'conteudo'
      WHEN p.spa = 1 AND (
        EXISTS (SELECT 1 FROM deployment_dados x
                LEFT JOIN deployment_dados y ON y.deployment_id = d.anterior_id AND y.ficheiro = x.ficheiro
                WHERE x.deployment_id = d.id AND (y.ficheiro IS NULL OR COALESCE(x.resumo, '') <> COALESCE(y.resumo, '')))
        OR EXISTS (SELECT 1 FROM deployment_dados y
                   WHERE y.deployment_id = d.anterior_id
                     AND NOT EXISTS (SELECT 1 FROM deployment_dados x WHERE x.deployment_id = d.id AND x.ficheiro = y.ficheiro))
      ) THEN 'dados'
    END AS tipo
  FROM deployments d
  JOIN deployment_paginas p ON p.deployment_id = d.id AND p.estado = 'LIDA'
  LEFT JOIN deployment_paginas a ON a.deployment_id = d.anterior_id AND a.caminho = p.caminho
  WHERE d.id = ? AND d.processamento = 'PROCESSADO' AND d.anterior_id IS NOT NULL
)
WHERE tipo IS NOT NULL
ON CONFLICT(caminho) DO UPDATE SET
  ultima_alteracao_em = excluded.ultima_alteracao_em, deployment_id = excluded.deployment_id, tipo = excluded.tipo
WHERE excluded.ultima_alteracao_em > paginas_alteracao.ultima_alteracao_em`;

const PASSOS = { META: passoMeta, SITEMAP: passoSitemap, PAGINAS: passoPaginas, DADOS: passoDados };

/* Uma execução: descobre e avança o deployment pendente mais antigo.
   Mais antigo primeiro — assim a «publicação anterior» já está processada. */
export async function executarCiclo(env, { fetchImpl = fetch, descobrirAgora = true } = {}) {
  const r = contador(env, fetchImpl);
  const relatorio = { descobertos: 0, processados: [], motivo: null };
  if (descobrirAgora) {
    const d = await descobrir(env, r);
    relatorio.descobertos = d.novos;
    relatorio.motivo = d.motivo ?? null;
    if (d.detalhe) relatorio.detalhe = d.detalhe;   /* a mensagem da API; nunca contém o token */
  }
  while (r.sobra()) {
    const d = await r.q(`SELECT id, url, criado_em_cf, passo FROM deployments WHERE processamento='PENDENTE'
                         ORDER BY criado_em_cf ASC LIMIT 1`).first();
    if (!d) break;
    const gastoAntes = r.c.pedidos;
    const depois = await PASSOS[d.passo](env, r, d);
    if (depois === 'FIM') relatorio.processados.push(d.id);
    /* sem nenhum pedido externo feito, não houve progresso possível nesta execução */
    if (depois === d.passo && r.c.pedidos === gastoAntes) break;
  }
  relatorio.orcamento = { ...r.c };
  return relatorio;
}

/* --------------------------------------------------------------- leitura -- */

async function lerPublicacao(db, id) {
  const [{ results: paginas }, { results: dados }] = await Promise.all([
    db.prepare('SELECT caminho, estado, resumo_conteudo, resumo_publicado, spa FROM deployment_paginas WHERE deployment_id=?').bind(id).all(),
    db.prepare('SELECT ficheiro, resumo FROM deployment_dados WHERE deployment_id=?').bind(id).all()
  ]);
  return {
    paginas: new Map(paginas.map(p => [p.caminho, p])),
    dados: new Map(dados.map(x => [x.ficheiro, x.resumo]))
  };
}

const RESUMO_COLUNAS = `id, short_id, url, criado_em_cf, processamento, passo, meta_estado, meta_commit, meta_sujo,
  meta_publicado, meta_impressao, paginas_total, anterior_id, processado_em, erro`;

export async function listarPublicacoes(db, limite = 60) {
  const { results } = await db.prepare(`SELECT ${RESUMO_COLUNAS},
      (SELECT COUNT(*) FROM deployment_paginas p WHERE p.deployment_id = d.id AND p.estado <> 'POR_LER') AS paginas_lidas
      FROM deployments d WHERE processamento <> 'IGNORADO' ORDER BY criado_em_cf DESC LIMIT ?`).bind(limite).all();
  return results;
}

export async function detalhePublicacao(db, id) {
  const d = await db.prepare(`SELECT ${RESUMO_COLUNAS} FROM deployments WHERE id=?`).bind(id).first();
  if (!d) return null;
  if (d.processamento !== 'PROCESSADO') return { publicacao: d, alteracoes: null };
  const actual = await lerPublicacao(db, id);
  const anterior = d.anterior_id ? await lerPublicacao(db, d.anterior_id) : null;
  return { publicacao: d, alteracoes: classificarAlteracoes(anterior, actual) };
}

export async function estadoPublicacoes(db, env) {
  const linha = await db.prepare(`SELECT
      SUM(processamento='PROCESSADO') AS processadas,
      SUM(processamento='PENDENTE') AS pendentes,
      SUM(processamento='FALHOU') AS falhadas,
      MAX(CASE WHEN processamento='PROCESSADO' THEN criado_em_cf END) AS ultima
    FROM deployments WHERE processamento <> 'IGNORADO'`).first();
  const ultimoEvento = await db.prepare(`SELECT tipo, criado_em FROM eventos_operacionais
      WHERE tipo LIKE 'PUBLICACOES_%' ORDER BY id DESC LIMIT 1`).first();
  return {
    credencial: Boolean(String(env.CF_API_TOKEN_PAGES || '').trim()),
    processadas: linha?.processadas ?? 0,
    pendentes: linha?.pendentes ?? 0,
    falhadas: linha?.falhadas ?? 0,
    ultima: linha?.ultima ?? null,
    ultimo_problema: ultimoEvento ?? null
  };
}
