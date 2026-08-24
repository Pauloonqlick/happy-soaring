/**
 * Nomes das famílias e das classes — partilhados pelo site e pelo gerador
 * ======================================================================
 *
 * PORQUE ESTAO AQUI E NAO NO CONTEUDO
 *   A `familia` é a CHAVE por que as asas se agrupam. Se fosse traduzida no
 *   CMS, mudar uma palavra partia o agrupamento. Fica a chave nos dados e a
 *   tradução aqui.
 *
 * PORQUE ESTAO NUM FICHEIRO A PARTE
 *   O app.js precisa delas para os separadores e para as perguntas; o gerador
 *   precisa delas para as migalhas, o título e a categoria das 110 páginas.
 *   Estavam só no app.js, e por isso as páginas mostravam a chave em bruto —
 *   uma página alemã com "Parapentes" nas migalhas.
 *
 * O QUE NAO SE TRADUZ, E PORQUE
 *   As normas (EN-A, EN 926-1) são códigos: traduzi-las tornava-as erradas.
 *   Os termos técnicos que a indústria usa em inglês em toda a parte
 *   (Full reflex, Speed flying) ficam como estão — um piloto alemão procura
 *   "speed flying", não a tradução dele.
 */

const escolhe = (v, l) => (v && (v[l] || v.pt)) || '';

export const FAMILIA_ROTULOS = {
  'Parapentes': { pt:'Parapentes', en:'Paragliders', es:'Parapentes', fr:'Parapentes', de:'Gleitschirme' },
  'Paramotor':  { pt:'Paramotor', en:'Paramotor', es:'Paramotor', fr:'Paramoteur', de:'Motorschirm' },
  'Tandem':     { pt:'Tandem', en:'Tandem', es:'Biplaza', fr:'Biplace', de:'Tandem' },
  'Arneses':    { pt:'Arneses', en:'Harnesses', es:'Arneses', fr:'Sellettes', de:'Gurtzeuge' },
  'Reservas':   { pt:'Reservas', en:'Reserves', es:'Reservas', fr:'Secours', de:'Rettungsschirme' },

  /* Parakite e Parawing são os nomes que a Flow dá às categorias dela e usa
     em inglês em todo o lado. Ficam escritos aqui em vez de caírem pela
     chave, para a tabela ser completa e nada passar despercebido. */
  'Parakites':  { pt:'Parakites', en:'Parakites', es:'Parakites', fr:'Parakites', de:'Parakites' },
  'Parawing':   { pt:'Parawing', en:'Parawing', es:'Parawing', fr:'Parawing', de:'Parawing' },

  /* Mini-wing é o único destes três com nome próprio noutra língua:
     "mini-voile" é o termo corrente em França. O alemão usa o inglês sem
     hífen. */
  'Mini-wings': { pt:'Mini-wings', en:'Mini-wings', es:'Mini-wings', fr:'Mini-voiles', de:'Miniwings' }
};

export const CLASSE_ROTULOS = {
  'Arnês aberto':          { pt:'Arnês aberto', en:'Open harness', es:'Arnés abierto', fr:'Sellette ouverte', de:'Offenes Gurtzeug' },
  'Arnês pod':             { pt:'Arnês pod', en:'Pod harness', es:'Arnés pod', fr:'Sellette cocon', de:'Pod-Gurtzeug' },
  'Reserva quadrada':      { pt:'Reserva quadrada', en:'Square reserve', es:'Reserva cuadrada', fr:'Secours carré', de:'Quadratischer Rettungsschirm' },
  'Paraquedas de arrasto': { pt:'Paraquedas de arrasto', en:'Drogue chute', es:'Paracaídas de arrastre', fr:'Parachute de traînée', de:'Bremsschirm' },

  /* Categorias da Flow e termos da indústria: iguais nos cinco idiomas.
     Escritos, e não deixados a cair pela chave, para se ver que foram
     pensados e não esquecidos. */
  'Parakite':             { pt:'Parakite', en:'Parakite', es:'Parakite', fr:'Parakite', de:'Parakite' },
  'Performance Parakite': { pt:'Performance Parakite', en:'Performance Parakite', es:'Performance Parakite', fr:'Performance Parakite', de:'Performance Parakite' },
  'Parawing':             { pt:'Parawing', en:'Parawing', es:'Parawing', fr:'Parawing', de:'Parawing' },
  'Speed flying':         { pt:'Speed flying', en:'Speed flying', es:'Speed flying', fr:'Speed flying', de:'Speed flying' },
  'Full reflex':          { pt:'Full reflex', en:'Full reflex', es:'Full reflex', fr:'Full reflex', de:'Full reflex' },
  'Semi-reflex':          { pt:'Semi-reflex', en:'Semi-reflex', es:'Semi-reflex', fr:'Semi-reflex', de:'Semi-reflex' }
  /* As normas (EN-A, EN-B, EN-C, EN-D, EN 926-1, EN-B / EN 926-1) não entram:
     são códigos e escrevem-se sempre da mesma maneira. Caem pela chave. */
};

export function rotuloFamilia(f, l) { return escolhe(FAMILIA_ROTULOS[f], l) || f || ''; }
export function rotuloClasse(c, l) { return escolhe(CLASSE_ROTULOS[c], l) || c || ''; }
