/**
 * Unidade de velocidade do vento — regra partilhada
 * ================================================
 *
 * Os dados do fabricante estão em nós. O visitante lê numa unidade só, a que
 * lhe é natural, e pode trocar. Esta decisão tem de ser a mesma no catálogo
 * (app.js) e nas páginas de detalhe geradas (scripts/gerar-paginas.mjs), por
 * isso a lista de países e o nome da chave vivem aqui.
 *
 * As páginas geradas não importam este ficheiro em runtime: o gerador lê-o na
 * geração e escreve os valores dentro do script da página. Assim continua a
 * haver uma só fonte, sem custar um pedido extra a cada página nem obrigar a
 * carimbar mais um módulo no HTML.
 */

export const KN_PARA_KMH = 1.852;

/* Onde o vento se fala em nós no dia a dia. No resto da Europa — incluindo
   Portugal, Espanha, França e Alemanha, que são as línguas do site — os
   boletins e os anemómetros de praia estão em km/h. */
export const PAISES_NOS = ['US', 'GB', 'IE', 'CA', 'AU', 'NZ', 'ZA'];

export const CHAVE_UNIDADE = 'hs-vento-unidade';

/** 'kn' ou 'kmh' a partir do código de país (ISO 3166-1 alfa-2, ou vazio). */
export function unidadeDoPais(pais) {
  return PAISES_NOS.indexOf(String(pais || '').toUpperCase()) >= 0 ? 'kn' : 'kmh';
}
