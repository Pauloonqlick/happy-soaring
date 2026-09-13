/* CONHECIMENTO, ORIGEM DOS CONTACTOS E CONFIGURAÇÃO EDITÁVEL

   Decisões activas, factos do negócio e hipóteses eliminadas editam-se na
   interface; cada versão fica inteira em conhecimento_historico. Os valores
   concretos são dados do Paulo — nada aqui é pré-preenchido.

   Contactos: como encontrou, país e o que procurava. Sem nomes, emails ou
   telefones — nem campo de texto livre onde possam cair. */
import { TIPOS } from './assuntos.js';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const PAIS = /^[A-Z]{2}$/;
const texto = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '');
const opcional = (s, max) => texto(s, max) || null;
const erro = m => ({ estado: 400, erro: m });

const TABELAS = {
  decisoes_activas: {
    colunas: ['titulo', 'tipo', 'razao', 'ambito', 'objectivo_id', 'bloqueia_tipo', 'bloqueia_caminho',
      'decidida_em', 'revisao_em', 'condicao_revisao', 'estado'],
    validar(c, objectivos) {
      const v = {
        titulo: texto(c.titulo, 200), tipo: String(c.tipo || ''), razao: texto(c.razao, 2000), ambito: opcional(c.ambito, 500),
        objectivo_id: opcional(c.objectivo_id, 40), bloqueia_tipo: opcional(c.bloqueia_tipo, 60),
        bloqueia_caminho: opcional(c.bloqueia_caminho, 250), decidida_em: String(c.decidida_em || ''),
        revisao_em: opcional(c.revisao_em, 10), condicao_revisao: opcional(c.condicao_revisao, 500), estado: String(c.estado || 'ACTIVA')
      };
      if (!v.titulo) return 'Falta o título.';
      if (!['COMERCIAL', 'ESTRATEGICA', 'MARCA'].includes(v.tipo)) return 'Tipo inválido.';
      if (!v.razao) return 'Uma decisão activa precisa da razão.';
      if (!DATA.test(v.decidida_em)) return 'Data da decisão inválida.';
      if (v.revisao_em && !DATA.test(v.revisao_em)) return 'Data de revisão inválida.';
      if (!['ACTIVA', 'REVOGADA'].includes(v.estado)) return 'Estado inválido.';
      if (v.bloqueia_tipo && !TIPOS[v.bloqueia_tipo]) return 'Tipo de assunto desconhecido.';
      if (v.bloqueia_caminho && !/^\/[a-z0-9\/._-]*$/i.test(v.bloqueia_caminho)) return 'Caminho inválido.';
      if (v.objectivo_id && !objectivos.has(v.objectivo_id)) return 'Objectivo desconhecido.';
      return v;
    }
  },
  factos_negocio: {
    colunas: ['afirmacao', 'estado', 'fonte', 'data_fonte', 'objectivo_id', 'notas'],
    validar(c, objectivos) {
      const v = {
        afirmacao: texto(c.afirmacao, 1000), estado: String(c.estado || ''), fonte: opcional(c.fonte, 500),
        data_fonte: opcional(c.data_fonte, 10), objectivo_id: opcional(c.objectivo_id, 40), notas: opcional(c.notas, 1000)
      };
      if (!v.afirmacao) return 'Falta a afirmação.';
      if (!['VERIFICADO', 'POR_CONFIRMAR', 'PROIBIDO'].includes(v.estado)) return 'Estado inválido.';
      if (v.estado === 'VERIFICADO' && (!v.fonte || !v.data_fonte)) return 'Um facto verificado precisa de fonte e data.';
      if (v.data_fonte && !DATA.test(v.data_fonte)) return 'Data da fonte inválida.';
      if (v.objectivo_id && !objectivos.has(v.objectivo_id)) return 'Objectivo desconhecido.';
      return v;
    }
  },
  hipoteses_eliminadas: {
    colunas: ['hipotese', 'evidencia', 'eliminada_em', 'tipo_assunto', 'caminho', 'objectivo_id', 'estado'],
    validar(c, objectivos) {
      const v = {
        hipotese: texto(c.hipotese, 1000), evidencia: texto(c.evidencia, 2000), eliminada_em: String(c.eliminada_em || ''),
        tipo_assunto: opcional(c.tipo_assunto, 60), caminho: opcional(c.caminho, 250), objectivo_id: opcional(c.objectivo_id, 40),
        estado: String(c.estado || 'ELIMINADA')
      };
      if (!v.hipotese) return 'Falta a hipótese.';
      if (!v.evidencia) return 'Uma hipótese eliminada precisa da evidência que a eliminou.';
      if (!DATA.test(v.eliminada_em)) return 'Data inválida.';
      if (v.tipo_assunto && !TIPOS[v.tipo_assunto]) return 'Tipo de assunto desconhecido.';
      if (v.caminho && !/^\/[a-z0-9\/._-]*$/i.test(v.caminho)) return 'Caminho inválido.';
      if (!['ELIMINADA', 'REABERTA'].includes(v.estado)) return 'Estado inválido.';
      if (v.objectivo_id && !objectivos.has(v.objectivo_id)) return 'Objectivo desconhecido.';
      return v;
    }
  }
};
export const TABELAS_CONHECIMENTO = Object.keys(TABELAS);

async function idsObjectivos(db) {
  return new Set((await db.prepare('SELECT id FROM objectivos_negocio').all()).results.map(o => o.id));
}

export async function lerConhecimento(db) {
  const [d, f, h, o, hist] = await Promise.all([
    db.prepare('SELECT * FROM decisoes_activas ORDER BY estado, decidida_em DESC').all(),
    db.prepare("SELECT * FROM factos_negocio ORDER BY CASE estado WHEN 'POR_CONFIRMAR' THEN 0 WHEN 'PROIBIDO' THEN 1 ELSE 2 END, id DESC").all(),
    db.prepare('SELECT * FROM hipoteses_eliminadas ORDER BY estado, eliminada_em DESC').all(),
    db.prepare('SELECT id, nome FROM objectivos_negocio ORDER BY ordem_ecra').all(),
    db.prepare('SELECT tabela, registo_id, COUNT(*) AS versoes FROM conhecimento_historico GROUP BY tabela, registo_id').all()
  ]);
  const versoes = new Map(hist.results.map(x => [x.tabela + ':' + x.registo_id, x.versoes]));
  const comVersoes = (tabela, rows) => rows.map(r => ({ ...r, versoes: versoes.get(tabela + ':' + r.id) || 0 }));
  return {
    decisoes_activas: comVersoes('decisoes_activas', d.results),
    factos_negocio: comVersoes('factos_negocio', f.results),
    hipoteses_eliminadas: comVersoes('hipoteses_eliminadas', h.results),
    objectivos: o.results,
    tipos_assunto: Object.entries(TIPOS).map(([id, x]) => ({ id, titulo: x.titulo }))
  };
}

export async function historicoConhecimento(db, tabela, id) {
  if (!TABELAS[tabela]) return null;
  const { results } = await db.prepare('SELECT versao, dados, gravado_em FROM conhecimento_historico WHERE tabela = ? AND registo_id = ? ORDER BY versao DESC')
    .bind(tabela, id).all();
  return results.map(r => ({ versao: r.versao, gravado_em: r.gravado_em, dados: JSON.parse(r.dados) }));
}

/* Criar (sem id) ou alterar (com id e a versão que se editou). Cada versão fica no histórico. */
export async function gravarConhecimento(db, tabela, corpo, { agora = new Date().toISOString() } = {}) {
  const T = TABELAS[tabela];
  if (!T) return { estado: 404, erro: 'Registo desconhecido.' };
  const v = T.validar(corpo || {}, await idsObjectivos(db));
  if (typeof v === 'string') return erro(v);
  const cols = T.colunas;
  const json = "json_object('id', id, 'versao', versao, 'alterado_em', alterado_em, " + cols.map(k => `'${k}', ${k}`).join(', ') + ')';

  if (corpo.id == null) {
    await db.batch([
      db.prepare(`INSERT INTO ${tabela} (${cols.join(', ')}, alterado_em) VALUES (${cols.map(() => '?').join(', ')}, ?)`)
        .bind(...cols.map(k => v[k]), agora),
      db.prepare(`INSERT INTO conhecimento_historico (tabela, registo_id, versao, dados, gravado_em)
        SELECT ?, id, versao, ${json}, ? FROM ${tabela} WHERE id = last_insert_rowid()`).bind(tabela, agora)
    ]);
    return { estado: 200, valor: await lerConhecimento(db) };
  }

  const id = Number(corpo.id), versao = Number(corpo.versao);
  if (!Number.isInteger(id) || !Number.isInteger(versao)) return erro('Falta a versão que foi editada.');
  const actual = await db.prepare(`SELECT versao FROM ${tabela} WHERE id = ?`).bind(id).first();
  if (!actual) return { estado: 404, erro: 'Registo desconhecido.' };
  if (actual.versao !== versao) return { estado: 409, erro: 'Este registo foi alterado entretanto. Recarrega a página.' };
  await db.batch([
    db.prepare(`UPDATE ${tabela} SET ${cols.map(k => k + ' = ?').join(', ')}, versao = versao + 1, alterado_em = ? WHERE id = ? AND versao = ?`)
      .bind(...cols.map(k => v[k]), agora, id, versao),
    db.prepare(`INSERT INTO conhecimento_historico (tabela, registo_id, versao, dados, gravado_em)
      SELECT ?, id, versao, ${json}, ? FROM ${tabela} WHERE id = ? AND versao = ?`).bind(tabela, agora, id, versao + 1)
  ]);
  return { estado: 200, valor: await lerConhecimento(db) };
}

/* ------------------------------------------------------------ contactos -- */

export const COMO_ENCONTROU = {
  PESQUISA_GOOGLE: 'Pesquisa no Google', GOOGLE_MAPS: 'Google Maps', RESPOSTA_IA: 'Resposta de IA',
  REDES_SOCIAIS: 'Redes sociais', YOUTUBE: 'YouTube', RECOMENDACAO: 'Recomendação', JA_CLIENTE: 'Já era cliente',
  PARCEIRO: 'Parceiro', EVENTO: 'Evento', OUTRO: 'Outro', NAO_SABE: 'Não se sabe'
};

export async function lerContactos(db) {
  const [lista, porComo, porObjectivo, porPais, objs] = await Promise.all([
    db.prepare('SELECT id, recebido_em, como_encontrou, pais, objectivo_id, registado_em FROM contactos ORDER BY recebido_em DESC, id DESC LIMIT 100').all(),
    db.prepare("SELECT como_encontrou AS chave, COUNT(*) AS n FROM contactos WHERE recebido_em >= date('now', '-90 days') GROUP BY como_encontrou ORDER BY n DESC").all(),
    db.prepare("SELECT COALESCE(objectivo_id, '') AS chave, COUNT(*) AS n FROM contactos WHERE recebido_em >= date('now', '-90 days') GROUP BY objectivo_id ORDER BY n DESC").all(),
    db.prepare("SELECT COALESCE(pais, '') AS chave, COUNT(*) AS n FROM contactos WHERE recebido_em >= date('now', '-90 days') GROUP BY pais ORDER BY n DESC").all(),
    db.prepare('SELECT id, nome FROM objectivos_negocio ORDER BY ordem_ecra').all()
  ]);
  return {
    como_encontrou: COMO_ENCONTROU, objectivos: objs.results, contactos: lista.results,
    ultimos_90_dias: { por_origem: porComo.results, por_objectivo: porObjectivo.results, por_pais: porPais.results }
  };
}

export async function registarContacto(db, corpo, { agora = new Date().toISOString() } = {}) {
  const recebido = String(corpo?.recebido_em || '');
  const como = String(corpo?.como_encontrou || '');
  const pais = corpo?.pais ? String(corpo.pais).trim().toUpperCase() : null;
  const objectivo = corpo?.objectivo_id ? String(corpo.objectivo_id) : null;
  if (!DATA.test(recebido) || recebido > agora.slice(0, 10)) return erro('Data inválida.');
  if (!COMO_ENCONTROU[como]) return erro('Indica como encontrou a Happy Soaring.');
  if (pais && !PAIS.test(pais)) return erro('País: código de duas letras (PT, ES, DE…).');
  if (objectivo && !(await idsObjectivos(db)).has(objectivo)) return erro('Objectivo desconhecido.');
  await db.prepare('INSERT INTO contactos (recebido_em, como_encontrou, pais, objectivo_id, registado_em) VALUES (?, ?, ?, ?, ?)')
    .bind(recebido, como, pais, objectivo, agora).run();
  return { estado: 200, valor: await lerContactos(db) };
}

/* --------------------------------------------------------- configuração -- */

export async function lerConfiguracao(db) {
  const [objs, niveis, pobj, paginas] = await Promise.all([
    db.prepare('SELECT id, nome, descricao, importancia, activo FROM objectivos_negocio ORDER BY ordem_ecra').all(),
    db.prepare('SELECT caminho, nivel FROM niveis_pagina').all(),
    db.prepare('SELECT caminho, objectivo_id FROM pagina_objectivo').all(),
    db.prepare(`SELECT caminho FROM paginas_google UNION SELECT caminho FROM paginas_alteracao
                UNION SELECT caminho FROM niveis_pagina UNION SELECT caminho FROM pagina_objectivo ORDER BY caminho`).all()
  ]);
  const N = new Map(niveis.results.map(n => [n.caminho, n.nivel]));
  const P = new Map();
  for (const r of pobj.results) { if (!P.has(r.caminho)) P.set(r.caminho, []); P.get(r.caminho).push(r.objectivo_id); }
  return {
    objectivos: objs.results,
    paginas: paginas.results.map(p => ({ caminho: p.caminho, nivel: N.get(p.caminho) ?? null, objectivos: P.get(p.caminho) || [] }))
  };
}

export async function gravarImportancia(db, corpo) {
  const id = String(corpo?.id || '');
  const imp = corpo?.importancia == null || corpo.importancia === '' ? null : String(corpo.importancia);
  if (imp !== null && !['ALTA', 'MEDIA', 'BAIXA'].includes(imp)) return erro('Importância inválida.');
  const r = await db.prepare('UPDATE objectivos_negocio SET importancia = ? WHERE id = ?').bind(imp, id).run();
  if (!r.meta.changes) return { estado: 404, erro: 'Objectivo desconhecido.' };
  return { estado: 200, valor: await lerConfiguracao(db) };
}

export async function gravarPagina(db, corpo) {
  const caminho = String(corpo?.caminho || '');
  if (!/^\/[a-z0-9\/._-]{0,250}$/i.test(caminho) || caminho.includes('..')) return erro('Caminho inválido.');
  const nivel = corpo?.nivel == null || corpo.nivel === '' ? null : Number(corpo.nivel);
  if (nivel !== null && ![1, 2, 3].includes(nivel)) return erro('Nível inválido.');
  const objectivos = Array.isArray(corpo?.objectivos) ? [...new Set(corpo.objectivos.map(String))] : [];
  const conhecidos = await idsObjectivos(db);
  if (objectivos.some(o => !conhecidos.has(o))) return erro('Objectivo desconhecido.');
  const stmts = [
    nivel === null ? db.prepare('DELETE FROM niveis_pagina WHERE caminho = ?').bind(caminho)
      : db.prepare('INSERT INTO niveis_pagina (caminho, nivel) VALUES (?, ?) ON CONFLICT(caminho) DO UPDATE SET nivel = excluded.nivel').bind(caminho, nivel),
    db.prepare('DELETE FROM pagina_objectivo WHERE caminho = ?').bind(caminho)
  ];
  if (objectivos.length) {
    stmts.push(db.prepare('INSERT INTO pagina_objectivo (caminho, objectivo_id) VALUES ' + objectivos.map(() => '(?, ?)').join(', '))
      .bind(...objectivos.flatMap(o => [caminho, o])));
  }
  await db.batch(stmts);
  return { estado: 200, valor: await lerConfiguracao(db) };
}
