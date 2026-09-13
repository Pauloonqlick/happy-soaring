/* O estado do módulo e a configuração base, tal como estão na base.
   Nada aqui é inventado: o que não está configurado diz-se que não está. */

async function tentar(fn) {
  try { return { ok: true, valor: await fn() }; }
  catch (e) { return { ok: false, erro: String(e && e.message || e).slice(0, 200) }; }
}

export async function lerEstado(env, email) {
  const db = env.DB, r2 = env.BRUTO;

  const esquema = await tentar(async () =>
    (await db.prepare("SELECT valor FROM esquema_meta WHERE chave = 'versao_esquema'").first())?.valor ?? null);

  const objectivos = await tentar(async () => (await db.prepare(
    'SELECT id, nome, descricao, importancia, activo FROM objectivos_negocio ORDER BY ordem_ecra, nome').all()).results);
  const termos = await tentar(async () => (await db.prepare(
    'SELECT termo, tipo FROM termos_marca ORDER BY tipo, termo').all()).results);
  const mercados = await tentar(async () => (await db.prepare(
    'SELECT id, pais, lingua_pesquisa, lingua_interface, dispositivo FROM mercados WHERE activo = 1 ORDER BY pais').all()).results);
  const concorrentes = await tentar(async () => (await db.prepare(
    'SELECT COUNT(*) AS n FROM concorrentes').first())?.n ?? 0);

  const bruto = await tentar(async () => { await r2.list({ limit: 1 }); return true; });

  return {
    modulo: 'hs-inteligencia',
    fase: 1,
    identidade: email,
    agora: new Date().toISOString(),
    sistema: {
      base: esquema.ok ? { ok: true, versao_esquema: esquema.valor } : { ok: false },
      armazenamento_bruto: { ok: bruto.ok }
    },
    configuracao: {
      objectivos: objectivos.ok ? objectivos.valor : null,
      termos_marca: termos.ok ? termos.valor : null,
      mercados: mercados.ok ? mercados.valor : null,
      concorrentes: concorrentes.ok ? concorrentes.valor : null
    }
  };
}
