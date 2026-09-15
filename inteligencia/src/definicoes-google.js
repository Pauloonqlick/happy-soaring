/* OS ESTADOS DO GOOGLE, COM A DEFINIÇÃO OFICIAL (15/09/2026)

   A inspecção de URL devolve a «cobertura» como o Google a escreve. O que cada estado quer
   dizer explica-se com a definição da ajuda do Search Console, não com interpretações —
   «Detetada – não indexada» não é «falta de orçamento de rastreio» nem «conteúdo fraco»,
   é o que o Google diz que é. Lidas a 15/09/2026:
     · relatório de indexação de páginas  https://support.google.com/webmasters/answer/7440203
     · ferramenta de inspecção de URL     https://support.google.com/webmasters/answer/9012289
   Quando o Google mudar estas páginas, muda-se aqui. */

const RELATORIO = 'https://support.google.com/webmasters/answer/7440203';
const INSPECCAO = 'https://support.google.com/webmasters/answer/9012289';

/* por esta ordem: os estados «não indexada» antes do «indexada» */
export const DEFINICOES_COBERTURA = [
  { padrao: /detetada|detectada|discovered/i, estado: 'Detetada – atualmente não indexada', fonte: RELATORIO,
    definicao: 'O Google já conhece o endereço mas ainda não o rastreou. Segundo o Google, normalmente quis rastrear e adiou para não sobrecarregar o site; volta a tentar mais tarde.' },
  { padrao: /rastreada|crawled/i, estado: 'Rastreada – atualmente não indexada', fonte: RELATORIO,
    definicao: 'O Google rastreou a página e não a indexou. Pode vir a indexá-la ou não, e não é preciso voltar a enviar o endereço.' },
  { padrao: /não reconhece|desconhecid|unknown/i, estado: 'A Google não reconhece o URL', fonte: INSPECCAO,
    definicao: 'O Google ainda não tinha visto este endereço. A ajuda do Google sugere pedir a indexação ou enviar um sitemap; normalmente leva alguns dias.' },
  { padrao: /redirecionamento|redireccionamento|redirect/i, estado: 'Página com redirecionamento', fonte: RELATORIO,
    definicao: 'É um endereço que redirecciona para outra página e, por isso, não é indexado. Num endereço antigo com 301 é o esperado.' },
  { padrao: /404|não encontrad|not found/i, estado: 'Não encontrado (404)', fonte: RELATORIO,
    definicao: 'A página respondeu com erro 404. O Google descobriu o endereço sem o site o ter enviado — por exemplo, por uma ligação.' },
  { padrao: /enviada e indexada|submitted and indexed/i, estado: 'Enviada e indexada', fonte: RELATORIO,
    definicao: 'A página foi enviada no sitemap e está no índice do Google.' }
];

export function definicaoDaCobertura(cobertura) {
  if (!cobertura) return null;
  const d = DEFINICOES_COBERTURA.find(x => x.padrao.test(String(cobertura)));
  return d ? { estado: d.estado, definicao: d.definicao, fonte: d.fonte } : null;
}
