/**
 * Regras dos avisos — partilhadas pelo site e pelo gerador de páginas
 * ===================================================================
 *
 * PORQUE EXISTE ESTE FICHEIRO
 *   Estas perguntas — "a oferta está a decorrer?" e "abrange esta asa?" —
 *   são feitas em dois sítios: o app.js desenha a faixa e os selos na página
 *   inicial, e o gerador escreve o selo nas 110 páginas das asas.
 *
 *   Se cada um tivesse a sua cópia da regra, mais tarde ou mais cedo
 *   discordavam, e ficava uma oferta visível num sítio e invisível no outro.
 *   O pior tipo de bug: ninguém dá por ele até um cliente perguntar.
 *
 * O QUE NAO ESTA AQUI, DE PROPOSITO
 *   A memória de "já fechei isto" (sessionStorage/localStorage, o campo
 *   `repetir`). Isso é estado do browser de cada pessoa e não tem significado
 *   nenhum numa página escrita de antemão. Fica no app.js, que é quem o usa.
 *
 *   Aqui só entram funções puras: mesma entrada, mesma saída, sem tocar em
 *   nada de fora. É o que as torna seguras de partilhar.
 */

/** A data de hoje em AAAA-MM-DD, no fuso de quem está a ver.
 *  De propósito local e não UTC: o dia de quem visita é o dia dele, e é isso
 *  que interessa quando uma oferta acaba à meia-noite. */
export function hojeISO(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' +
    String(x.getMonth() + 1).padStart(2, '0') + '-' +
    String(x.getDate()).padStart(2, '0');
}

/** O aviso está ligado e dentro das datas? */
export function dentroDoPrazo(a, hoje) {
  if (!a || a.ativo === false) return false;
  const d = hoje || hojeISO();
  if (a.inicio && d < String(a.inicio).slice(0, 10)) return false;
  if (a.fim && d > String(a.fim).slice(0, 10)) return false;
  return true;
}

/** O aviso abrange esta asa?
 *
 *  `abrange` é campo à parte do destino dos botões, e tem de ser: o botão
 *  pode levar à gama toda dos parakites enquanto a oferta é só da Mullet 2.
 *  Foi exactamente o que aconteceu em Agosto de 2026.
 *
 *  Sem `abrange`, ou com ele vazio, a resposta é NÃO. Uma campanha geral
 *  mostra a faixa no topo e não põe selos nas asas — dizer "esta asa está em
 *  oferta" sem alguém o ter escrito seria inventar. */
export function abrangeProduto(a, p) {
  if (!a || !p) return false;
  const ab = a.abrange;
  if (!ab) return false;
  const familias = ab.familias || [];
  const produtos = ab.produtos || [];
  if (produtos.length && produtos.indexOf(p.nome) >= 0) return true;
  if (familias.length && familias.indexOf(p.familia) >= 0) return true;
  return false;
}

/** Os avisos que hoje se aplicam a esta asa, por ordem de entrada. */
export function ofertasDaAsa(lista, p, hoje) {
  return (lista || []).filter(a => dentroDoPrazo(a, hoje) && abrangeProduto(a, p));
}
