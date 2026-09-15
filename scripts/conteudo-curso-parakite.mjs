/**
 * Conteúdo da página /curso-parakite-portugal/, nos cinco idiomas.
 * ================================================================
 *
 * Texto num ficheiro à parte, como o `conteudo-pilot2wing.mjs`: texto revê-se,
 * e não se anda a procurá-lo no meio da lógica que constrói o HTML.
 *
 * O português é o original — são as palavras do Paulo. As outras quatro
 * traduzem essas, e nada mais: não há aqui um número, uma data ou uma
 * credencial que ele não tenha dado.
 *
 * "Parakite", "Pilot2Wing", "Happy Soaring", "Body First", "harness",
 * "split-leg", "groundhandling", "reflex", "risers", "mini-wings", "pitch" e
 * "timing" não se traduzem: são os nomes que os pilotos usam nas cinco
 * línguas.
 *
 * SEIS FRASES QUE NAO SE MEXEM SEM O PAULO
 *   1. "Formação ministrada por instrutores licenciados através de escola
 *      parceira." — diz o que se pode dizer e nada mais. Não diz quem emite a
 *      licença nem o que o curso dá, porque isso não está fechado.
 *   2. A frase que separa as CINCO ETAPAS do Pilot2Wing dos SEIS PASSOS do
 *      ciclo de aprendizagem (`metodoDistincao`). Sem ela, as duas páginas
 *      contam números diferentes para o mesmo método e contradizem-se.
 *   3. "A perna não pilota isoladamente..." (`cadeiaFrase`).
 *   4. "Body First não significa substituir os comandos pelo corpo..."
 *      (`bodyNaoTexto`).
 *   5. "A experiência aparece quando o piloto deixa de precisar de pensar
 *      conscientemente em cada pequeno movimento..." (`expCentral`).
 *   6. Os QUATRO DIAS são duração de REFERENCIA. Em nenhum sítio se diz que
 *      quatro dias dão autonomia ou experiência.
 *
 * DUAS COISAS QUE ESTA PAGINA NAO EXPLICA, DE PROPOSITO
 *   O perfil reflex e a mecânica da gestão de energia vivem em
 *   /o-que-e-um-parakite/. Aqui há o contexto mínimo e a ligação. As cinco
 *   etapas práticas do Pilot2Wing vivem em /pilot2wing/.
 */

/* OS VALORES VIVEM AQUI, UMA VEZ SO.
   Um preço repetido em cinco línguas são cinco sítios para esquecer quando
   ele mudar. No texto escreve-se `{dias}`, `{curso}`, `{hora}` ou
   `{pilotos}`, e o gerador substitui.

   `moeda` fica separada porque a posição do símbolo não é igual em todas as
   línguas — "800 €" em português, "€800" em inglês. */
export const PRECOS = {
  dias: 4,
  curso: 800,
  hora: 60,
  horasDia: 4,          /* apoio direto do instrutor por dia de curso — referência do Paulo, não fixa */
  pilotos: 3,
  moeda: '€'
};

export const CURSO = {

  /* ==================================================================
     CABEÇA E PARTILHA
     ================================================================== */

  /* 14/09/2026 · O LOCAL, DITO COMO É: ZONA DE LISBOA E SETÚBAL
     O curso NÃO é em Sesimbra (correção do Paulo). Decorre em spots a menos de
     35 minutos de Lisboa, na Península de Setúbal: Alfarim, Lagoa de Albufeira e
     Praia do Meco no concelho de Sesimbra, Fonte da Telha em Almada, sem local
     fixo (ver `locaisTexto`). Por isso o título e o H1 dizem a zona — Lisboa e
     Setúbal —, e Sesimbra aparece só onde é verdade: como concelho de alguns
     spots, na descrição e no parágrafo de resposta. É também assim que a AI
     Overview pode citar o local sem a página exagerar. */
  titulo: {
    pt: 'Curso de Parakite em Lisboa e Setúbal para pilotos de parapente',
    en: 'Parakite course in Lisbon and Setúbal for paraglider pilots',
    es: 'Curso de Parakite en Lisboa y Setúbal para pilotos de parapente',
    fr: 'Cours de Parakite à Lisbonne et Setúbal pour pilotes de parapente',
    de: 'Parakite-Kurs in Lissabon und Setúbal für Gleitschirmpiloten'
  },
  descricao: {
    pt: 'Conversão de parapente para Parakite em spots a menos de 35 min de Lisboa, em Almada e Sesimbra: método Pilot2Wing, {dias} dias de referência, máximo {pilotos} pilotos.',
    en: 'Paragliding-to-Parakite conversion at sites under 35 min from Lisbon, in Almada and Sesimbra: Pilot2Wing method, {dias} reference days, maximum {pilotos} pilots.',
    es: 'Conversión de parapente a Parakite en spots a menos de 35 min de Lisboa, en Almada y Sesimbra: método Pilot2Wing, {dias} días de referencia, máximo {pilotos} pilotos.',
    fr: 'Conversion du parapente au Parakite sur des sites à moins de 35 min de Lisbonne, à Almada et Sesimbra : méthode Pilot2Wing, {dias} jours de référence, {pilotos} pilotes max.',
    de: 'Umstieg vom Gleitschirm zum Parakite an Spots unter 35 Min. von Lissabon, in Almada und Sesimbra: Pilot2Wing-Methode, {dias} Richttage, maximal {pilotos} Piloten.'
  },
  ogLocale: { pt: 'pt_PT', en: 'en_GB', es: 'es_ES', fr: 'fr_FR', de: 'de_DE' },
  ogAlt: {
    pt: 'Piloto a trabalhar um Parakite junto ao solo, na costa portuguesa',
    en: 'A pilot working a Parakite close to the ground, on the Portuguese coast',
    es: 'Un piloto trabajando un Parakite cerca del suelo, en la costa portuguesa',
    fr: 'Un pilote travaillant un Parakite près du sol, sur la côte portugaise',
    de: 'Ein Pilot arbeitet bodennah mit einem Parakite an der portugiesischen Küste'
  },

  /* ==================================================================
     BLOCO 1 · HERÓI
     ================================================================== */

  /* 14/09/2026 · o local passa para a etiqueta; o H1 fica curto no ecrã */
  kicker: {
    pt: 'CURSO DE CONVERSÃO · LISBOA E SETÚBAL',
    en: 'CONVERSION COURSE · LISBON & SETÚBAL',
    es: 'CURSO DE CONVERSIÓN · LISBOA Y SETÚBAL',
    fr: 'COURS DE CONVERSION · LISBONNE ET SETÚBAL',
    de: 'UMSTIEGSKURS · LISSABON UND SETÚBAL'
  },
  /* O H1 DO ECRÃ É CURTO (14/09/2026)
     Com o local lá dentro ocupava cinco linhas e empurrava os botões para fora
     do primeiro ecrã. O local continua no `titulo` da página, na etiqueta de
     cima, no parágrafo de resposta e na linha de factos. `Parakite` e `para
     pilotos de parapente` ficam, como a hierarquia do herói exige. */
  h1: {
    pt: 'Curso de Parakite para pilotos de parapente',
    en: 'Parakite course for paraglider pilots',
    es: 'Curso de Parakite para pilotos de parapente',
    fr: 'Cours de Parakite pour pilotes de parapente',
    de: 'Parakite-Kurs für Gleitschirmpiloten'
  },
  /* ==== A HIERARQUIA DO HEROI ====
     Sete elementos, por esta ordem, e cada um com uma funcao propria:
       kicker    quem e o publico e de que curso se trata
       h1        o tema exacto da pagina — nao se reduz nem se troca por
                 frase de marca. `Parakite`, `Portugal` e `para pilotos de
                 parapente` sao obrigatorios e ficam todos aqui.
       ancora    a imagem mental, e a legenda do visual chao->ar
       ponte     liga a ancora ao metodo. Cita a definicao do /pilot2wing/
                 em vez de criar uma segunda: e por isso que o texto de cada
                 lingua ecoa o h1b dessa pagina.
       tese      o que a formacao e, objectivamente. A autonomia fica aqui e
                 fica como objectivo, nao como quarto verbo da lista.
       citacao   assinatura pedagogica, no fim. Trocou de lugar: era a
                 primeira frase e passou a ultima.
     A ancora sozinha podia ler-se como uma segunda definicao do metodo
     (`/pilot2wing/` diz `Nos comecamos pelo piloto`). A ponte existe para
     que nao se leia assim. Nao separar as duas. */
  ancora: {
    pt: 'Tudo começa no chão.',
    en: 'It all starts on the ground.',
    es: 'Todo empieza en el suelo.',
    fr: 'Tout commence au sol.',
    de: 'Alles beginnt am Boden.'
  },
  ponte: {
    pt: 'No Pilot2Wing, começamos pelo piloto.',
    en: 'In Pilot2Wing, we start with the pilot.',
    es: 'En Pilot2Wing, empezamos por el piloto.',
    fr: 'Dans le Pilot2Wing, on commence par le pilote.',
    de: 'Beim Pilot2Wing fangen wir beim Piloten an.'
  },
  /* Assinatura pedagogica. Fica no fim do heroi, depois da tese: e um
     fecho, nao um segundo titulo — e por isso nao leva o filete laranja,
     que ja e da ancora. Dois filetes empilhados competiam. */
  citacao: {
    pt: 'Aprender corretamente hoje para reagir naturalmente amanhã.',
    en: 'Learn it right today, so you react naturally tomorrow.',
    es: 'Aprender correctamente hoy para reaccionar con naturalidad mañana.',
    fr: 'Apprendre correctement aujourd’hui pour réagir naturellement demain.',
    de: 'Heute richtig lernen, um morgen natürlich zu reagieren.'
  },
  /* 14/09/2026 · A TESE DÁ LUGAR À RESPOSTA DIRETA
     Um parágrafo que responde, sozinho, a quem pergunta «que curso é este?»:
     para quem, onde, que método, quanto tempo, quantos pilotos, quanto custa.
     As páginas que a AI Overview citou a 11/09 tinham uma frase destas; a nossa
     tinha a informação espalhada. Só factos que a página já dizia. A
     assinatura pedagógica (`citacao`) sai do herói e fecha o capítulo do
     método. */
  resposta: {
    pt: 'Curso de conversão para pilotos de parapente que querem voar Parakite, na zona de Lisboa e Setúbal: os treinos decorrem em spots a menos de 35 minutos de Lisboa, nos concelhos de Almada e Sesimbra. Segue o método Pilot2Wing — compreender a asa, preparar o corpo, gerir energia —, tem {dias} dias de referência, no máximo {pilotos} pilotos, e custa {curso} € com Parakite e harness incluídos. Também há formação à hora, a {hora} €.',
    en: 'A conversion course for paraglider pilots who want to fly the Parakite, in the Lisbon and Setúbal area: training takes place at sites less than 35 minutes from Lisbon, in the municipalities of Almada and Sesimbra. It follows the Pilot2Wing method — understanding the wing, preparing the body, managing energy — with {dias} reference days and a maximum of {pilotos} pilots, and it costs €{curso} with Parakite and harness included. Hourly training is also available, at €{hora}.',
    es: 'Curso de conversión para pilotos de parapente que quieren volar Parakite, en la zona de Lisboa y Setúbal: los entrenamientos se hacen en spots a menos de 35 minutos de Lisboa, en los municipios de Almada y Sesimbra. Sigue el método Pilot2Wing —comprender el ala, preparar el cuerpo, gestionar la energía—, tiene {dias} días de referencia, un máximo de {pilotos} pilotos, y cuesta {curso} € con Parakite y harness incluidos. También hay formación por horas, a {hora} €.',
    fr: 'Cours de conversion pour pilotes de parapente qui veulent voler en Parakite, dans la région de Lisbonne et Setúbal : les séances ont lieu sur des sites à moins de 35 minutes de Lisbonne, dans les communes d’Almada et de Sesimbra. Il suit la méthode Pilot2Wing — comprendre l’aile, préparer le corps, gérer l’énergie —, compte {dias} jours de référence et {pilotos} pilotes au maximum, et coûte {curso} €, Parakite et harness inclus. Une formation à l’heure existe aussi, à {hora} €.',
    de: 'Ein Umstiegskurs für Gleitschirmpiloten, die Parakite fliegen wollen, im Raum Lissabon und Setúbal: Trainiert wird an Spots weniger als 35 Minuten von Lissabon, in den Gemeinden Almada und Sesimbra. Er folgt der Pilot2Wing-Methode — den Schirm verstehen, den Körper vorbereiten, Energie verwalten —, dauert {dias} Richttage mit maximal {pilotos} Piloten und kostet {curso} € inklusive Parakite und Harness. Stundenweise Ausbildung gibt es auch, für {hora} €.'
  },
  /* a quinta coluna da linha de factos do herói; as outras quatro vêm da `ficha` */
  local: {
    valor: { pt: 'Lisboa e Setúbal', en: 'Lisbon & Setúbal', es: 'Lisboa y Setúbal', fr: 'Lisbonne et Setúbal', de: 'Lissabon und Setúbal' },
    nota: { pt: 'spots a menos de 35 min de Lisboa', en: 'sites under 35 min from Lisbon', es: 'spots a menos de 35 min de Lisboa',
            fr: 'sites à moins de 35 min de Lisbonne', de: 'Spots unter 35 Min. von Lissabon' }
  },
  /* O ÍNDICE E OS CAPÍTULOS — a mesma ordem das secções no gerador */
  indiceRotulo: { pt: 'Nesta página', en: 'On this page', es: 'En esta página', fr: 'Sur cette page', de: 'Auf dieser Seite' },
  indice: {
    pt: ['O curso e o preço', 'Para quem é', 'Onde e com quem', 'O método Pilot2Wing', 'Como se progride', 'Perguntas frequentes', 'Falar sobre o curso'],
    en: ['Course and price', 'Who it is for', 'Where and with whom', 'The Pilot2Wing method', 'How you progress', 'FAQ', 'Talk to us'],
    es: ['El curso y el precio', 'Para quién es', 'Dónde y con quién', 'El método Pilot2Wing', 'Cómo se progresa', 'Preguntas frecuentes', 'Hablar del curso'],
    fr: ['Le cours et le prix', 'Pour qui', 'Où et avec qui', 'La méthode Pilot2Wing', 'Comment on progresse', 'Questions fréquentes', 'Parler du cours'],
    de: ['Kurs und Preis', 'Für wen', 'Wo und mit wem', 'Die Pilot2Wing-Methode', 'Wie man vorankommt', 'Häufige Fragen', 'Über den Kurs sprechen']
  },
  /* Rotulo curto, so para as migalhas. O H1 inteiro nao cabe numa migalha,
     e a migalha nao e um titulo: e um sitio. Se preferires outra formulacao,
     e uma linha. */
  migalhaCurso: {
    pt: 'Curso de Parakite',
    en: 'Parakite course',
    es: 'Curso de Parakite',
    fr: 'Cours de Parakite',
    de: 'Parakite-Kurs'
  },
  /* Rotulo proprio do botao do heroi. Chave separada do `cta` de proposito:
     o `cta` fica no bloco 16, onde o botao abre o WhatsApp com o `ctaMsg`
     («queria informacoes sobre o Curso de Parakite») — os dois textos tem de
     dizer a mesma coisa. Este botao salta para `#falar`, e prometer conversa
     e o que o salto entrega. Antes os dois botoes tinham rotulo igual e
     comportamento diferente. */
  heroiBotao: {
    pt: 'Falar sobre a minha conversão',
    en: 'Talk about my conversion',
    es: 'Hablar sobre mi conversión',
    fr: 'Parler de ma conversion',
    de: 'Über meinen Umstieg sprechen'
  },
  /* Rotulo curto, so para o botao do heroi. O longo fica no bloco 6, onde há
     largura para ele: ao lado do botão laranja partia em três linhas. */
  metodoBotao: {
    pt: 'Conhecer o Pilot2Wing', en: 'About Pilot2Wing', es: 'Conocer Pilot2Wing',
    fr: 'Découvrir Pilot2Wing', de: 'Pilot2Wing kennenlernen'
  },
  /* O PERCURSO «QUERO FAZER O CURSO» (15/09/2026)
     Um ecrã por passo, sem scroll pela página inteira. Só estes rótulos são
     novos: os títulos dos passos são os do índice e o conteúdo de cada passo
     são os textos desta página (o gerador escolhe quais). O último passo é o
     assistente «curso completo ou à hora?». Sem JavaScript o botão leva ao
     resumo e preço. */
  percurso: {
    botao: { pt: 'Quero fazer o curso', en: 'I want to take the course', es: 'Quiero hacer el curso',
             fr: 'Je veux suivre le cours', de: 'Ich möchte den Kurs machen' },
    titulo: { pt: 'O curso em {n} passos', en: 'The course in {n} steps', es: 'El curso en {n} pasos',
              fr: 'Le cours en {n} étapes', de: 'Der Kurs in {n} Schritten' },
    passo: { pt: 'Passo {n} de {t}', en: 'Step {n} of {t}', es: 'Paso {n} de {t}',
             fr: 'Étape {n} sur {t}', de: 'Schritt {n} von {t}' },
    detalhe: { pt: 'Ler em detalhe na página', en: 'Read it in full on the page', es: 'Leer en detalle en la página',
               fr: 'Lire en détail sur la page', de: 'Ausführlich auf der Seite lesen' }
  },

  /* ==================================================================
     BLOCO 2 · O CURSO EM RESUMO  (ilha clara)
     ================================================================== */

  resumoKicker: {
    pt: 'O curso em resumo', en: 'The course at a glance', es: 'El curso en resumen',
    fr: 'Le cours en résumé', de: 'Der Kurs im Überblick'
  },
  resumoTitulo: {
    pt: 'Quanto dura, quanto custa e o que está incluído',
    en: 'How long it lasts, what it costs and what is included',
    es: 'Cuánto dura, cuánto cuesta y qué está incluido',
    fr: 'Combien de temps, combien ça coûte et ce qui est inclus',
    de: 'Wie lange, was es kostet und was enthalten ist'
  },
  ficha: [
    {
      valor: { pt: '{dias} dias', en: '{dias} days', es: '{dias} días',
               fr: '{dias} jours', de: '{dias} Tage' },
      nota: { pt: 'duração de referência', en: 'reference duration',
              es: 'duración de referencia', fr: 'durée de référence', de: 'Richtdauer' }
    },
    {
      valor: { pt: '{curso} €', en: '€{curso}', es: '{curso} €',
               fr: '{curso} €', de: '{curso} €' },
      nota: { pt: 'o curso completo', en: 'the full course', es: 'el curso completo',
              fr: 'le cours complet', de: 'der komplette Kurs' }
    },
    {
      valor: { pt: '{hora} €/hora', en: '€{hora}/hour', es: '{hora} €/hora',
               fr: '{hora} €/heure', de: '{hora} €/Stunde' },
      nota: { pt: 'formação flexível', en: 'flexible training', es: 'formación flexible',
              fr: 'formation flexible', de: 'flexible Ausbildung' }
    },
    {
      valor: { pt: 'máximo {pilotos}', en: 'maximum {pilotos}', es: 'máximo {pilotos}',
               fr: 'maximum {pilotos}', de: 'maximal {pilotos}' },
      nota: { pt: 'pilotos por curso', en: 'pilots per course', es: 'pilotos por curso',
              fr: 'pilotes par cours', de: 'Piloten pro Kurs' }
    },
    {
      valor: { pt: 'Parakite e harness', en: 'Parakite and harness', es: 'Parakite y harness',
               fr: 'Parakite et harness', de: 'Parakite und Harness' },
      nota: { pt: 'incluídos', en: 'included', es: 'incluidos', fr: 'inclus', de: 'inklusive' }
    }
  ],
  /* 14/09/2026 · AS DUAS OPÇÕES LADO A LADO, E O SIMULADOR
     Dados do Paulo: cerca de 4 horas por dia de apoio direto do instrutor
     (não é fixo); a formação à hora inclui o material; os 4 dias marcam-se
     conforme a disponibilidade do piloto e as condições meteorológicas.
     `{horasCurso}` e `{equilibrio}` calculam-se no gerador a partir do PRECOS
     — nunca se escrevem à mão.

     O QUE O SIMULADOR NÃO DIZ, DE PROPÓSITO
     Se a formação à hora é individual ou em grupo, se há mínimo de horas, e
     se as horas descontam no curso: o Paulo ainda não respondeu. Enquanto não
     responder, nenhuma frase fala disso. As regras que decidem a sugestão
     estão no curso-assistente.js e foram aprovadas por ele. */
  opcaoCurso: {
    rotulo: { pt: 'Curso completo', en: 'Full course', es: 'Curso completo', fr: 'Cours complet', de: 'Kompletter Kurs' },
    itens: {
      pt: ['{dias} dias de referência', 'Cerca de {horasDia} horas por dia de apoio direto do instrutor (não é fixo)',
           'Dias marcados conforme a tua disponibilidade e as condições', 'Máximo {pilotos} pilotos por curso', 'Parakite e harness incluídos'],
      en: ['{dias} reference days', 'About {horasDia} hours a day of direct instructor support (not fixed)',
           'Days scheduled around your availability and the conditions', 'Maximum {pilotos} pilots per course', 'Parakite and harness included'],
      es: ['{dias} días de referencia', 'Unas {horasDia} horas al día de apoyo directo del instructor (no es fijo)',
           'Días programados según tu disponibilidad y las condiciones', 'Máximo {pilotos} pilotos por curso', 'Parakite y harness incluidos'],
      fr: ['{dias} jours de référence', 'Environ {horasDia} heures par jour d’accompagnement direct de l’instructeur (pas fixe)',
           'Jours planifiés selon ta disponibilité et les conditions', 'Maximum {pilotos} pilotes par cours', 'Parakite et harness inclus'],
      de: ['{dias} Richttage', 'Etwa {horasDia} Stunden pro Tag direkte Betreuung durch den Ausbilder (nicht fix)',
           'Tage nach deiner Verfügbarkeit und den Bedingungen geplant', 'Maximal {pilotos} Piloten pro Kurs', 'Parakite und Harness inklusive']
    }
  },
  opcaoHora: {
    rotulo: { pt: 'Formação à hora', en: 'Hourly training', es: 'Formación por horas', fr: 'Formation à l’heure', de: 'Stundenweise Ausbildung' },
    itens: {
      pt: ['Ao ritmo de cada um', 'Material incluído', 'Pagas as horas de que precisas'],
      en: ['At your own pace', 'Equipment included', 'You pay for the hours you need'],
      es: ['Al ritmo de cada uno', 'Material incluido', 'Pagas las horas que necesitas'],
      fr: ['À ton rythme', 'Matériel inclus', 'Tu paies les heures dont tu as besoin'],
      de: ['In deinem Tempo', 'Ausrüstung inklusive', 'Du zahlst die Stunden, die du brauchst']
    }
  },
  equilibrio: {
    pt: 'Ponto de equilíbrio: cerca de {equilibrio} horas. Com cerca de {horasCurso} horas de apoio direto no curso, a partir daí o curso completo sai mais em conta do que a hora.',
    en: 'Break-even: about {equilibrio} hours. With about {horasCurso} hours of direct support in the course, beyond that the full course works out cheaper than paying by the hour.',
    es: 'Punto de equilibrio: unas {equilibrio} horas. Con unas {horasCurso} horas de apoyo directo en el curso, a partir de ahí el curso completo sale más a cuenta que por horas.',
    fr: 'Seuil de rentabilité : environ {equilibrio} heures. Avec environ {horasCurso} heures d’accompagnement direct dans le cours, au-delà le cours complet revient moins cher que l’heure.',
    de: 'Break-even: etwa {equilibrio} Stunden. Bei etwa {horasCurso} Stunden direkter Betreuung im Kurs ist der komplette Kurs ab dann günstiger als stundenweise.'
  },
  sim: {
    titulo: { pt: 'Curso completo ou à hora?', en: 'Full course or by the hour?', es: '¿Curso completo o por horas?',
              fr: 'Cours complet ou à l’heure ?', de: 'Kompletter Kurs oder stundenweise?' },
    intro: { pt: 'São 6 perguntas, um toque em cada. No fim dizemos-te qual das opções faz mais sentido e deixamos a mensagem pronta para o WhatsApp.',
             en: 'Six questions, one tap each. At the end we tell you which option makes more sense and get the WhatsApp message ready.',
             es: 'Son 6 preguntas, un toque en cada una. Al final te decimos qué opción tiene más sentido y dejamos el mensaje listo para WhatsApp.',
             fr: 'Six questions, un clic chacune. À la fin, on te dit quelle option a le plus de sens et on prépare le message WhatsApp.',
             de: 'Sechs Fragen, je ein Tipp. Am Ende sagen wir dir, welche Option mehr Sinn ergibt, und die WhatsApp-Nachricht ist fertig.' },
    outra: { pt: 'Outra', en: 'Other', es: 'Otra', fr: 'Autre', de: 'Andere' },
    escreve: { pt: 'Escreve aqui', en: 'Type here', es: 'Escribe aquí', fr: 'Écris ici', de: 'Hier schreiben' },
    seguinte: { pt: 'Seguinte', en: 'Next', es: 'Siguiente', fr: 'Suivant', de: 'Weiter' },
    respostas: { pt: 'As tuas respostas', en: 'Your answers', es: 'Tus respuestas', fr: 'Tes réponses', de: 'Deine Antworten' },
    verMensagem: { pt: 'Ver a mensagem', en: 'See the message', es: 'Ver el mensaje', fr: 'Voir le message', de: 'Nachricht ansehen' },
    mensagemTitulo: { pt: 'A tua mensagem', en: 'Your message', es: 'Tu mensaje', fr: 'Ton message', de: 'Deine Nachricht' },
    mensagemNota: { pt: 'É isto que vai para o WhatsApp. Nada fica guardado nesta página.',
                    en: 'This is what goes to WhatsApp. Nothing is stored on this page.',
                    es: 'Esto es lo que va a WhatsApp. Nada se guarda en esta página.',
                    fr: 'C’est ce qui part sur WhatsApp. Rien n’est enregistré sur cette page.',
                    de: 'Das geht an WhatsApp. Auf dieser Seite wird nichts gespeichert.' },
    acrescentar: { pt: 'Queres acrescentar alguma coisa? (opcional)', en: 'Anything to add? (optional)',
                   es: '¿Quieres añadir algo? (opcional)', fr: 'Tu veux ajouter quelque chose ? (facultatif)',
                   de: 'Möchtest du etwas ergänzen? (optional)' },
    voltarSugestao: { pt: 'Voltar à sugestão', en: 'Back to the suggestion', es: 'Volver a la sugerencia',
                      fr: 'Retour à la suggestion', de: 'Zurück zum Vorschlag' },
    fechar: { pt: 'Fechar', en: 'Close', es: 'Cerrar', fr: 'Fermer', de: 'Schließen' },
    direto: { pt: 'Prefiro escrever diretamente', en: 'I’d rather write directly', es: 'Prefiero escribir directamente',
              fr: 'Je préfère écrire directement', de: 'Ich schreibe lieber direkt' },
    comecar: { pt: 'Começar', en: 'Start', es: 'Empezar', fr: 'Commencer', de: 'Starten' },
    voltar: { pt: 'Voltar', en: 'Back', es: 'Volver', fr: 'Retour', de: 'Zurück' },
    recomecar: { pt: 'Responder de novo', en: 'Start again', es: 'Responder de nuevo', fr: 'Recommencer', de: 'Neu beginnen' },
    passo: { pt: 'Pergunta {n} de {t}', en: 'Question {n} of {t}', es: 'Pregunta {n} de {t}', fr: 'Question {n} sur {t}', de: 'Frage {n} von {t}' },
    sugestao: { pt: 'A sugestão', en: 'Our suggestion', es: 'La sugerencia', fr: 'La suggestion', de: 'Unser Vorschlag' },
    aviso: { pt: 'É uma sugestão indicativa. A decisão final vem da avaliação inicial com o instrutor.',
             en: 'This is an indicative suggestion. The final decision comes from the initial assessment with the instructor.',
             es: 'Es una sugerencia orientativa. La decisión final sale de la evaluación inicial con el instructor.',
             fr: 'C’est une suggestion indicative. La décision finale vient de l’évaluation initiale avec l’instructeur.',
             de: 'Das ist ein unverbindlicher Vorschlag. Die endgültige Entscheidung ergibt sich aus der Ersteinschätzung mit dem Ausbilder.' },
    rotuloMsg: { pt: 'Sugestão do simulador', en: 'Simulator suggestion', es: 'Sugerencia del simulador',
                 fr: 'Suggestion du simulateur', de: 'Vorschlag des Simulators' },
    /* 14/09/2026 · O ASSISTENTE: seis perguntas, cinco respostas e «Outra»
       Junta o simulador e as quatro perguntas de WhatsApp (aprovado pelo Paulo):
       ninguém responde duas vezes. Cada resposta tem `n`, o nível que conta
       para as regras (g0/g1/g2, m0/m1/m2, base/pontos/naosei, dias/soltas/
       tantofaz); o tempo de voo e a asa não decidem — vão só na mensagem.
       «Outra» existe em todas: nas perguntas que decidem, leva a «Melhor
       falarmos primeiro», e o texto escrito vai na mensagem. */
    perguntas: [
      { id: 'voo',
        t: { pt: 'Há quanto tempo voas de parapente?', en: 'How long have you been flying paragliders?',
             es: '¿Cuánto tiempo llevas volando en parapente?', fr: 'Depuis combien de temps voles-tu en parapente ?',
             de: 'Wie lange fliegst du schon Gleitschirm?' },
        rot: { pt: 'Tempo de voo', en: 'Flying for', es: 'Tiempo de vuelo', fr: 'Vol depuis', de: 'Fliegt seit' },
        op: [
          { n: 'formacao', t: { pt: 'Ainda estou em formação', en: 'I am still in training', es: 'Todavía estoy en formación', fr: 'Je suis encore en formation', de: 'Ich bin noch in Ausbildung' } },
          { n: 'v', t: { pt: 'Menos de 1 ano', en: 'Less than 1 year', es: 'Menos de 1 año', fr: 'Moins d’1 an', de: 'Weniger als 1 Jahr' } },
          { n: 'v', t: { pt: '1 a 3 anos', en: '1 to 3 years', es: 'De 1 a 3 años', fr: 'De 1 à 3 ans', de: '1 bis 3 Jahre' } },
          { n: 'v', t: { pt: '3 a 5 anos', en: '3 to 5 years', es: 'De 3 a 5 años', fr: 'De 3 à 5 ans', de: '3 bis 5 Jahre' } },
          { n: 'v', t: { pt: 'Mais de 5 anos', en: 'More than 5 years', es: 'Más de 5 años', fr: 'Plus de 5 ans', de: 'Mehr als 5 Jahre' } }
        ] },
      { id: 'asa',
        t: { pt: 'Que asa utilizas atualmente?', en: 'What wing do you use at the moment?', es: '¿Qué ala usas actualmente?',
             fr: 'Quelle aile utilises-tu actuellement ?', de: 'Welchen Schirm fliegst du aktuell?' },
        rot: { pt: 'Asa atual', en: 'Current wing', es: 'Ala actual', fr: 'Aile actuelle', de: 'Aktueller Schirm' },
        op: [
          { n: 'a', t: { pt: 'Asa de escola / EN-A', en: 'School wing / EN-A', es: 'Ala de escuela / EN-A', fr: 'Aile école / EN-A', de: 'Schulschirm / EN-A' } },
          { n: 'a', t: { pt: 'EN-B', en: 'EN-B', es: 'EN-B', fr: 'EN-B', de: 'EN-B' } },
          { n: 'a', t: { pt: 'EN-C ou superior', en: 'EN-C or higher', es: 'EN-C o superior', fr: 'EN-C ou plus', de: 'EN-C oder höher' } },
          { n: 'a', t: { pt: 'Mini-wing', en: 'Mini-wing', es: 'Mini-wing', fr: 'Mini-wing', de: 'Mini-Wing' } },
          { n: 'a', t: { pt: 'Ainda não tenho', en: 'I don’t have one yet', es: 'Todavía no tengo', fr: 'Je n’en ai pas encore', de: 'Habe noch keinen' } }
        ] },
      { id: 'gh',
        t: { pt: 'Que experiência tens de groundhandling?', en: 'What groundhandling experience do you have?',
             es: '¿Qué experiencia tienes de groundhandling?', fr: 'Quelle expérience as-tu en groundhandling ?',
             de: 'Welche Groundhandling-Erfahrung hast du?' },
        rot: { pt: 'Groundhandling', en: 'Groundhandling', es: 'Groundhandling', fr: 'Groundhandling', de: 'Groundhandling' },
        op: [
          { n: 'g0', t: { pt: 'Nunca fiz', en: 'Never', es: 'Nunca', fr: 'Jamais', de: 'Noch nie' } },
          { n: 'g1', t: { pt: 'Só na descolagem', en: 'Only at take-off', es: 'Solo en el despegue', fr: 'Seulement au décollage', de: 'Nur beim Start' } },
          { n: 'g1', t: { pt: 'De vez em quando, com vento fraco', en: 'Now and then, in light wind', es: 'De vez en cuando, con viento flojo', fr: 'De temps en temps, par vent faible', de: 'Ab und zu, bei schwachem Wind' } },
          { n: 'g2', t: { pt: 'Regularmente', en: 'Regularly', es: 'Con regularidad', fr: 'Régulièrement', de: 'Regelmäßig' } },
          { n: 'g2', t: { pt: 'Regularmente, com vento forte', en: 'Regularly, in strong wind', es: 'Con regularidad, con viento fuerte', fr: 'Régulièrement, par vent fort', de: 'Regelmäßig, bei starkem Wind' } }
        ] },
      { id: 'mw',
        t: { pt: 'Já voaste ou tocaste num mini-wing/parakite?', en: 'Have you ever flown or handled a mini-wing/parakite?',
             es: '¿Ya has volado o tocado un mini-wing/parakite?', fr: 'As-tu déjà volé ou manipulé un mini-wing/parakite ?',
             de: 'Bist du schon einen Mini-Wing/Parakite geflogen oder hattest einen in der Hand?' },
        rot: { pt: 'Mini-wing/parakite', en: 'Mini-wing/parakite', es: 'Mini-wing/parakite', fr: 'Mini-wing/parakite', de: 'Mini-Wing/Parakite' },
        op: [
          { n: 'm0', t: { pt: 'Nunca', en: 'Never', es: 'Nunca', fr: 'Jamais', de: 'Nie' } },
          { n: 'm0', t: { pt: 'Já vi ou toquei', en: 'I have seen or touched one', es: 'Lo he visto o tocado', fr: 'J’en ai vu ou touché un', de: 'Gesehen oder angefasst' } },
          { n: 'm1', t: { pt: 'Experimentei uma vez', en: 'I tried one once', es: 'Lo probé una vez', fr: 'J’en ai essayé un une fois', de: 'Einmal ausprobiert' } },
          { n: 'm2', t: { pt: 'Uso com regularidade', en: 'I use one regularly', es: 'Lo uso con regularidad', fr: 'J’en utilise un régulièrement', de: 'Nutze ich regelmäßig' } },
          { n: 'm2', t: { pt: 'Tenho equipamento próprio', en: 'I have my own equipment', es: 'Tengo equipo propio', fr: 'J’ai mon propre matériel', de: 'Habe eigene Ausrüstung' } }
        ] },
      { id: 'obj',
        t: { pt: 'O que procuras?', en: 'What are you looking for?', es: '¿Qué buscas?', fr: 'Que cherches-tu ?', de: 'Was suchst du?' },
        rot: { pt: 'Procuro', en: 'Looking for', es: 'Busco', fr: 'Je cherche', de: 'Suche' },
        op: [
          { n: 'base', t: { pt: 'Começar com a base completa', en: 'Start with the full base', es: 'Empezar con la base completa', fr: 'Commencer avec la base complète', de: 'Mit der kompletten Basis anfangen' } },
          { n: 'base', t: { pt: 'Converter a minha técnica de parapente', en: 'Convert my paragliding technique', es: 'Convertir mi técnica de parapente', fr: 'Convertir ma technique de parapente', de: 'Meine Gleitschirmtechnik umstellen' } },
          { n: 'pontos', t: { pt: 'Corrigir pontos específicos', en: 'Correct specific points', es: 'Corregir puntos específicos', fr: 'Corriger des points précis', de: 'Bestimmte Punkte korrigieren' } },
          { n: 'base', t: { pt: 'Preparar-me para treinar sozinho', en: 'Get ready to train on my own', es: 'Prepararme para entrenar solo', fr: 'Me préparer à m’entraîner seul', de: 'Mich darauf vorbereiten, allein zu trainieren' } },
          { n: 'naosei', t: { pt: 'Ainda não sei', en: 'I don’t know yet', es: 'Todavía no lo sé', fr: 'Je ne sais pas encore', de: 'Weiß ich noch nicht' } }
        ] },
      { id: 'fmt',
        t: { pt: 'Como preferes treinar?', en: 'How do you prefer to train?', es: '¿Cómo prefieres entrenar?',
             fr: 'Comment préfères-tu t’entraîner ?', de: 'Wie trainierst du lieber?' },
        rot: { pt: 'Treino', en: 'Training', es: 'Entrenamiento', fr: 'Entraînement', de: 'Training' },
        op: [
          { n: 'dias', t: { pt: 'Vários dias seguidos', en: 'Several days in a row', es: 'Varios días seguidos', fr: 'Plusieurs jours d’affilée', de: 'Mehrere Tage am Stück' } },
          { n: 'dias', t: { pt: 'Fins de semana', en: 'Weekends', es: 'Fines de semana', fr: 'Week-ends', de: 'Wochenenden' } },
          { n: 'soltas', t: { pt: 'Sessões soltas, quando posso', en: 'Separate sessions, when I can', es: 'Sesiones sueltas, cuando puedo', fr: 'Des séances ponctuelles, quand je peux', de: 'Einzelne Einheiten, wenn ich kann' } },
          { n: 'tantofaz', t: { pt: 'Tanto faz', en: 'Either', es: 'Me da igual', fr: 'Peu importe', de: 'Egal' } }
        ] }
    ],
    resultados: {
      curso: { pt: 'Curso completo', en: 'Full course', es: 'Curso completo', fr: 'Cours complet', de: 'Kompletter Kurs' },
      medida: { pt: 'Curso completo, marcado à tua medida', en: 'Full course, scheduled around you', es: 'Curso completo, a tu medida',
                fr: 'Cours complet, planifié selon toi', de: 'Kompletter Kurs, nach deinem Zeitplan' },
      hora: { pt: 'Formação à hora', en: 'Hourly training', es: 'Formación por horas', fr: 'Formation à l’heure', de: 'Stundenweise Ausbildung' },
      falar: { pt: 'Melhor falarmos primeiro', en: 'Best to talk first', es: 'Mejor hablamos primero', fr: 'Mieux vaut en parler d’abord', de: 'Lass uns zuerst sprechen' }
    },
    porque: {
      r1: { pt: 'Já trazes base no chão e queres trabalhar pontos concretos: pagas só as horas de que precisas.',
            en: 'You already have a base on the ground and want to work on specific points: you only pay for the hours you need.',
            es: 'Ya traes base en el suelo y quieres trabajar puntos concretos: pagas solo las horas que necesitas.',
            fr: 'Tu as déjà une base au sol et tu veux travailler des points précis : tu ne paies que les heures dont tu as besoin.',
            de: 'Du bringst schon eine Basis am Boden mit und willst an bestimmten Punkten arbeiten: Du zahlst nur die Stunden, die du brauchst.' },
      r2: { pt: 'Vais construir a base desde o início. A referência para isso é o curso: cerca de {horasCurso} horas de apoio direto, e acima de ~{equilibrio} horas sai mais em conta do que a hora.',
            en: 'You will build the base from the start. The reference for that is the course: about {horasCurso} hours of direct support, and above ~{equilibrio} hours it works out cheaper than paying by the hour.',
            es: 'Vas a construir la base desde el principio. La referencia para eso es el curso: unas {horasCurso} horas de apoyo directo, y a partir de ~{equilibrio} horas sale más a cuenta que por horas.',
            fr: 'Tu vas construire la base depuis le début. La référence pour cela est le cours : environ {horasCurso} heures d’accompagnement direct, et au-delà de ~{equilibrio} heures il revient moins cher que l’heure.',
            de: 'Du baust die Basis von Anfang an auf. Der Richtwert dafür ist der Kurs: etwa {horasCurso} Stunden direkte Betreuung, und ab ~{equilibrio} Stunden ist er günstiger als stundenweise.' },
      r3: { pt: 'Os {dias} dias marcam-se conforme a tua disponibilidade e as condições, por isso o curso também serve quem não pode fazer tudo de seguida.',
            en: 'The {dias} days are scheduled around your availability and the conditions, so the course also works if you cannot do it all in one go.',
            es: 'Los {dias} días se programan según tu disponibilidad y las condiciones, así que el curso también sirve si no puedes hacerlo todo seguido.',
            fr: 'Les {dias} jours se planifient selon ta disponibilité et les conditions, donc le cours convient aussi si tu ne peux pas tout faire d’affilée.',
            de: 'Die {dias} Tage werden nach deiner Verfügbarkeit und den Bedingungen geplant – der Kurs passt also auch, wenn du nicht alles am Stück machen kannst.' },
      r4: { pt: 'Queres trabalhar pontos concretos, mas ainda sem base no chão. Vale a pena perceber contigo o que faz mais sentido.',
            en: 'You want to work on specific points, but without a base on the ground yet. It is worth working out with you what makes most sense.',
            es: 'Quieres trabajar puntos concretos, pero todavía sin base en el suelo. Merece la pena ver contigo qué tiene más sentido.',
            fr: 'Tu veux travailler des points précis, mais sans base au sol pour l’instant. Il vaut la peine de voir avec toi ce qui a le plus de sens.',
            de: 'Du willst an bestimmten Punkten arbeiten, hast aber noch keine Basis am Boden. Es lohnt sich, mit dir zu klären, was am meisten Sinn ergibt.' },
      r5: { pt: 'As tuas respostas ficam a meio caminho. Numa conversa curta percebemos se precisas de poucas horas ou da base completa.',
            en: 'Your answers sit halfway. In a short conversation we can work out whether you need a few hours or the full base.',
            es: 'Tus respuestas quedan a medio camino. En una conversación corta vemos si necesitas pocas horas o la base completa.',
            fr: 'Tes réponses sont à mi-chemin. En une courte conversation, on voit si tu as besoin de quelques heures ou de la base complète.',
            de: 'Deine Antworten liegen dazwischen. In einem kurzen Gespräch klären wir, ob du wenige Stunden oder die komplette Basis brauchst.' },
      r6: { pt: 'Sem experiência de chão nem de mini-wing, a base completa é o ponto de partida mais seguro.',
            en: 'With no ground or mini-wing experience, the full base is the safest starting point.',
            es: 'Sin experiencia en el suelo ni de mini-wing, la base completa es el punto de partida más seguro.',
            fr: 'Sans expérience au sol ni en mini-wing, la base complète est le point de départ le plus sûr.',
            de: 'Ohne Boden- oder Mini-Wing-Erfahrung ist die komplette Basis der sicherste Ausgangspunkt.' },
      r7: { pt: 'Não há uma resposta clara. A avaliação inicial decide por onde começar.',
            en: 'There is no clear answer. The initial assessment decides where to start.',
            es: 'No hay una respuesta clara. La evaluación inicial decide por dónde empezar.',
            fr: 'Il n’y a pas de réponse claire. L’évaluation initiale décide par où commencer.',
            de: 'Es gibt keine eindeutige Antwort. Die Ersteinschätzung entscheidet, wo man anfängt.' },
      r8: { pt: 'Ainda estás em formação de parapente, e este curso é para pilotos de parapente. Falamos primeiro para perceber qual é o melhor momento.',
            en: 'You are still training as a paraglider pilot, and this course is for paraglider pilots. Let’s talk first to work out the right moment.',
            es: 'Todavía estás en formación de parapente, y este curso es para pilotos de parapente. Hablamos primero para ver cuál es el mejor momento.',
            fr: 'Tu es encore en formation de parapente, et ce cours s’adresse aux pilotes de parapente. Parlons d’abord pour voir quel est le bon moment.',
            de: 'Du bist noch in der Gleitschirmausbildung, und dieser Kurs richtet sich an Gleitschirmpiloten. Lass uns zuerst sprechen, um den richtigen Zeitpunkt zu finden.' },
      r9: { pt: 'Deste uma resposta tua numa das perguntas que decidem a sugestão. Com ela, é melhor falarmos para perceber o teu ponto de partida.',
            en: 'You gave your own answer to one of the questions that decide the suggestion. With that, it is best to talk to work out your starting point.',
            es: 'Diste una respuesta propia en una de las preguntas que deciden la sugerencia. Con ella, es mejor hablar para ver tu punto de partida.',
            fr: 'Tu as donné ta propre réponse à l’une des questions qui décident de la suggestion. Dans ce cas, mieux vaut en parler pour voir ton point de départ.',
            de: 'Du hast bei einer der Fragen, die über den Vorschlag entscheiden, eine eigene Antwort gegeben. Dann sprechen wir am besten, um deinen Ausgangspunkt zu klären.' }
    }
  },

  fichaIndividual: {
    pt: 'A correção é individual, mesmo quando o treino é em grupo.',
    en: 'Correction is individual, even when the training is in a group.',
    es: 'La corrección es individual, incluso cuando el entrenamiento es en grupo.',
    fr: 'La correction est individuelle, même quand l’entraînement se fait en groupe.',
    de: 'Die Korrektur ist individuell, auch wenn in der Gruppe trainiert wird.'
  },
  fichaNota: {
    pt: 'Os {dias} dias são uma referência, não uma promessa. Há pilotos que precisam de algumas horas e pilotos que precisam de mais formação do que isto — as duas coisas são normais. A formação flexível à hora existe para esses dois casos.',
    en: 'The {dias} days are a reference, not a promise. Some pilots need only a few hours and some need more training than this — both are normal. The hourly option exists for both cases.',
    es: 'Los {dias} días son una referencia, no una promesa. Hay pilotos que necesitan unas pocas horas y pilotos que necesitan más formación que esto — las dos cosas son normales. La formación por horas existe para esos dos casos.',
    fr: 'Les {dias} jours sont une référence, pas une promesse. Certains pilotes n’ont besoin que de quelques heures, d’autres de plus de formation que cela — les deux sont normaux. La formation à l’heure existe pour ces deux cas.',
    de: 'Die {dias} Tage sind ein Richtwert, kein Versprechen. Manche Piloten brauchen nur ein paar Stunden, andere mehr Ausbildung als das — beides ist normal. Die stundenweise Ausbildung gibt es für beide Fälle.'
  },
  licenca: {
    pt: 'Formação ministrada por instrutores licenciados através de escola parceira.',
    en: 'Training delivered by licensed instructors through a partner school.',
    es: 'Formación impartida por instructores licenciados a través de escuela asociada.',
    fr: 'Formation dispensée par des instructeurs licenciés via une école partenaire.',
    de: 'Ausbildung durch lizenzierte Fluglehrer über eine Partnerschule.'
  },

  /* ==================================================================
     BLOCO 3 · O QUE ESTE CURSO É  ·  autonomia + os nove critérios
     ================================================================== */

  autonomiaKicker: {
    pt: 'O que este curso é', en: 'What this course is', es: 'Qué es este curso',
    fr: 'Ce qu’est ce cours', de: 'Was dieser Kurs ist'
  },
  autonomiaTitulo: {
    pt: 'Autonomia não é experiência',
    en: 'Autonomy is not experience',
    es: 'Autonomía no es experiencia',
    fr: 'L’autonomie n’est pas l’expérience',
    de: 'Autonomie ist nicht Erfahrung'
  },
  autonomiaDef: {
    pt: 'Autonomia é conseguires treinar sozinho dentro do teu nível: compreendes o que a asa está a fazer, repetes com intenção, reconheces e corriges os teus erros, e sabes quando não fazer.',
    en: 'Autonomy is being able to train on your own within your level: you understand what the wing is doing, you repeat on purpose, you recognise and correct your own mistakes, and you know when not to.',
    es: 'Autonomía es poder entrenar solo dentro de tu nivel: comprendes lo que está haciendo el ala, repites con intención, reconoces y corriges tus errores, y sabes cuándo no hacer.',
    fr: 'L’autonomie, c’est pouvoir t’entraîner seul à ton niveau : tu comprends ce que fait l’aile, tu répètes volontairement, tu reconnais et corriges tes erreurs, et tu sais quand ne pas faire.',
    de: 'Autonomie heißt, in deinem Niveau allein trainieren zu können: du verstehst, was der Schirm macht, wiederholst absichtlich, erkennst und korrigierst deine Fehler und weißt, wann nicht.'
  },
  autonomiaLimites: {
    pt: 'Em {dias} dias ninguém fica experiente. O que se pode fazer é dar-te uma base correta e autonomia suficiente para continuares a treinar dentro do teu nível — que é outra coisa, e é a coisa que dura.',
    en: 'Nobody becomes experienced in {dias} days. What can be done is give you a correct foundation and enough autonomy to keep training within your own level — which is a different thing, and it is the thing that lasts.',
    es: 'En {dias} días nadie se vuelve experimentado. Lo que se puede hacer es darte una base correcta y autonomía suficiente para seguir entrenando dentro de tu nivel — que es otra cosa, y es la que dura.',
    fr: 'En {dias} jours, personne ne devient expérimenté. Ce qu’on peut faire, c’est te donner une base correcte et assez d’autonomie pour continuer à t’entraîner à ton niveau — ce qui est autre chose, et c’est ce qui dure.',
    de: 'In {dias} Tagen wird niemand erfahren. Was möglich ist: dir eine korrekte Grundlage und genug Autonomie geben, um in deinem Niveau weiter zu trainieren — das ist etwas anderes, und es ist das, was bleibt.'
  },
  criteriosTitulo: {
    pt: 'Critérios de autonomia', en: 'Autonomy criteria', es: 'Criterios de autonomía',
    fr: 'Critères d’autonomie', de: 'Autonomiekriterien'
  },
  criterios: {
    pt: ['Compreender os princípios', 'Controlar a asa no chão',
         'Usar corpo e comandos de forma coerente', 'Reconhecer os erros',
         'Conseguir corrigi-los', 'Escolher condições adequadas',
         'Conhecer os próprios limites', 'Saber quando parar',
         'Continuar a treinar sem depender constantemente do instrutor'],
    en: ['Understand the principles', 'Control the wing on the ground',
         'Use body and controls coherently', 'Recognise mistakes',
         'Be able to correct them', 'Choose suitable conditions',
         'Know your own limits', 'Know when to stop',
         'Keep training without constantly depending on the instructor'],
    es: ['Comprender los principios', 'Controlar el ala en el suelo',
         'Usar cuerpo y mandos de forma coherente', 'Reconocer los errores',
         'Conseguir corregirlos', 'Elegir condiciones adecuadas',
         'Conocer los propios límites', 'Saber cuándo parar',
         'Seguir entrenando sin depender constantemente del instructor'],
    fr: ['Comprendre les principes', 'Contrôler l’aile au sol',
         'Utiliser corps et commandes de façon cohérente', 'Reconnaître les erreurs',
         'Réussir à les corriger', 'Choisir des conditions adaptées',
         'Connaître ses propres limites', 'Savoir quand arrêter',
         'Continuer à s’entraîner sans dépendre constamment de l’instructeur'],
    de: ['Die Prinzipien verstehen', 'Den Schirm am Boden kontrollieren',
         'Körper und Steuerung kohärent einsetzen', 'Fehler erkennen',
         'Sie korrigieren können', 'Passende Bedingungen wählen',
         'Die eigenen Grenzen kennen', 'Wissen, wann man aufhört',
         'Weiter trainieren, ohne ständig vom Ausbilder abzuhängen']
  },

  /* 14/09/2026 · OS CRITÉRIOS DEIXAM DE SER ETIQUETAS
     Nove etiquetas iguais pareciam botões e não se liam como lista. Passam a
     três grupos — os mesmos verbos do ciclo de aprendizagem desta página — e
     o nono critério, que é a própria definição de autonomia, fica como
     resultado. Os textos dos critérios não mudam: os grupos apontam para
     eles pela posição em `criterios`. */
  criteriosGrupos: [
    { titulo: { pt: 'Compreender e executar', en: 'Understand and execute', es: 'Comprender y ejecutar',
                fr: 'Comprendre et exécuter', de: 'Verstehen und ausführen' }, itens: [0, 1, 2] },
    { titulo: { pt: 'Corrigir', en: 'Correct', es: 'Corregir', fr: 'Corriger', de: 'Korrigieren' }, itens: [3, 4] },
    { titulo: { pt: 'Decidir', en: 'Decide', es: 'Decidir', fr: 'Décider', de: 'Entscheiden' }, itens: [5, 6, 7] }
  ],
  criterioResultado: 8,
  criterioResultadoRotulo: {
    pt: 'É isto a autonomia', en: 'That is autonomy', es: 'Eso es la autonomía',
    fr: 'C’est ça, l’autonomie', de: 'Das ist Autonomie'
  },
  /* A PONTE ENTRE AS DUAS SECÇÕES
     Frases que a página já dizia nas perguntas frequentes — «a autonomia
     ensina-se; a experiência acumula-se», «mede-se por critérios, não por
     dias», «vem depois, com as horas que fizeres» — postas lado a lado. */
  /* `pontes` e não `ponte`: `ponte` é a frase do herói, e uma segunda chave com o
     mesmo nome apagava-a em silêncio (aconteceu a 14/09, antes de publicar) */
  pontes: [
    { nome: { pt: 'Autonomia', en: 'Autonomy', es: 'Autonomía', fr: 'Autonomie', de: 'Autonomie' },
      verbo: { pt: 'Ensina-se.', en: 'It is taught.', es: 'Se enseña.', fr: 'S’enseigne.', de: 'Wird gelehrt.' },
      nota: { pt: 'Mede-se por critérios, não por dias.', en: 'Measured by criteria, not by days.',
              es: 'Se mide por criterios, no por días.', fr: 'Se mesure par des critères, pas en jours.',
              de: 'Misst sich an Kriterien, nicht an Tagen.' } },
    { nome: { pt: 'Experiência', en: 'Experience', es: 'Experiencia', fr: 'Expérience', de: 'Erfahrung' },
      verbo: { pt: 'Acumula-se.', en: 'It accumulates.', es: 'Se acumula.', fr: 'S’accumule.', de: 'Sammelt sich an.' },
      nota: { pt: 'Vem depois, com as horas que fizeres.', en: 'Comes later, with the hours you put in.',
              es: 'Viene después, con las horas que hagas.', fr: 'Vient après, avec les heures que tu feras.',
              de: 'Kommt später, mit den Stunden.' } }
  ],

  /* ==================================================================
     BLOCO 4 · COMO SE MEDE  ·  experiência
     ================================================================== */

  expKicker: {
    pt: 'Como se mede', en: 'How it is measured', es: 'Cómo se mide',
    fr: 'Comment on la mesure', de: 'Wie man sie misst'
  },
  expTitulo: {
    pt: 'Experiência não se mede pelo número de manobras',
    en: 'Experience is not measured in manoeuvres',
    es: 'La experiencia no se mide por el número de maniobras',
    fr: 'L’expérience ne se mesure pas au nombre de manœuvres',
    de: 'Erfahrung misst sich nicht an der Zahl der Manöver'
  },
  expManobra: {
    pt: 'Uma manobra demonstra uma competência específica; não mede experiência global. E experiência também não é apenas acumular horas.',
    en: 'A manoeuvre demonstrates one specific skill; it does not measure overall experience. And experience is not just accumulating hours either.',
    es: 'Una maniobra demuestra una competencia específica; no mide experiencia global. Y la experiencia tampoco es solo acumular horas.',
    fr: 'Une manœuvre démontre une compétence précise ; elle ne mesure pas l’expérience globale. Et l’expérience n’est pas non plus une simple accumulation d’heures.',
    de: 'Ein Manöver zeigt eine bestimmte Fähigkeit; es misst nicht die Gesamterfahrung. Und Erfahrung ist auch nicht bloß das Ansammeln von Stunden.'
  },
  expCentral: {
    pt: 'A experiência aparece quando o piloto deixa de precisar de pensar conscientemente em cada pequeno movimento, sem deixar de compreender o que está a fazer.',
    en: 'Experience appears when the pilot no longer needs to think consciously about every small movement, without ceasing to understand what they are doing.',
    es: 'La experiencia aparece cuando el piloto deja de necesitar pensar conscientemente en cada pequeño movimiento, sin dejar de comprender lo que está haciendo.',
    fr: 'L’expérience apparaît quand le pilote n’a plus besoin de penser consciemment à chaque petit mouvement, sans cesser de comprendre ce qu’il fait.',
    de: 'Erfahrung zeigt sich, wenn der Pilot nicht mehr über jede kleine Bewegung bewusst nachdenken muss, ohne aufzuhören zu verstehen, was er tut.'
  },
  expAtributosTitulo: {
    pt: 'Como se reconhece', en: 'How you recognise it', es: 'Cómo se reconoce',
    fr: 'Comment on la reconnaît', de: 'Woran man sie erkennt'
  },
  expAtributos: {
    pt: ['Ligação forte com a asa', 'Leitura e antecipação', 'Capacidade de decisão',
         'Respostas progressivamente naturais',
         'Capacidade de adaptar quando algo não acontece como esperado',
         'Saber como, onde, quando e se deve fazer algo'],
    en: ['A strong connection with the wing', 'Reading and anticipation', 'Decision-making',
         'Progressively natural responses',
         'The ability to adapt when something does not happen as expected',
         'Knowing how, where, when and whether to do something'],
    es: ['Conexión fuerte con el ala', 'Lectura y anticipación', 'Capacidad de decisión',
         'Respuestas progresivamente naturales',
         'Capacidad de adaptarse cuando algo no ocurre como se esperaba',
         'Saber cómo, dónde, cuándo y si debe hacer algo'],
    fr: ['Un lien fort avec l’aile', 'Lecture et anticipation', 'Capacité de décision',
         'Des réponses progressivement naturelles',
         'La capacité de s’adapter quand quelque chose ne se passe pas comme prévu',
         'Savoir comment, où, quand et s’il faut faire quelque chose'],
    de: ['Eine starke Verbindung zum Schirm', 'Lesen und Antizipieren', 'Entscheidungsfähigkeit',
         'Zunehmend natürliche Reaktionen',
         'Die Fähigkeit, sich anzupassen, wenn etwas nicht wie erwartet läuft',
         'Wissen, wie, wo, wann und ob man etwas tun sollte']
  },

  /* ==================================================================
     BLOCO 5 · DE ONDE VENS  ·  avaliação inicial + conversão (ilha clara)
     ================================================================== */

  convKicker: {
    pt: 'Para quem é', en: 'Who it is for', es: 'Para quién es',
    fr: 'Pour qui', de: 'Für wen'
  },
  /* 14/09/2026 · OS REQUISITOS, DITOS ÀS CLARAS
     A AI Overview de «curso parakite» respondeu com «requisitos comuns». O
     concorrente escreve «150 horas e licença»; a nossa posição é outra e melhor
     — não há um número, decide a avaliação inicial — mas só estava na primeira
     pergunta frequente. Passa a abrir o capítulo «Para quem é». */
  requisitosRotulo: { pt: 'Requisitos', en: 'Requirements', es: 'Requisitos', fr: 'Prérequis', de: 'Voraussetzungen' },
  requisitosTexto: {
    pt: 'Pilotos de parapente. Não pedimos um número mínimo de horas — conta o que a avaliação inicial mostrar: experiência, hábitos e respostas já consolidadas.',
    en: 'Paraglider pilots. We do not ask for a minimum number of hours — what counts is what the initial assessment shows: experience, habits and responses already consolidated.',
    es: 'Pilotos de parapente. No pedimos un número mínimo de horas; cuenta lo que muestre la evaluación inicial: experiencia, hábitos y respuestas ya consolidadas.',
    fr: 'Les pilotes de parapente. Nous ne demandons pas de nombre minimum d’heures — ce qui compte, c’est ce que montre l’évaluation initiale : expérience, habitudes et réponses déjà consolidées.',
    de: 'Gleitschirmpiloten. Wir verlangen keine Mindestzahl an Stunden — entscheidend ist, was die Ersteinschätzung zeigt: Erfahrung, Gewohnheiten und bereits gefestigte Reaktionen.'
  },
  convTitulo: {
    pt: 'Porque um piloto de parapente precisa de conversão',
    en: 'Why a paraglider pilot needs a conversion course',
    es: 'Por qué un piloto de parapente necesita conversión',
    fr: 'Pourquoi un pilote de parapente a besoin d’une conversion',
    de: 'Warum ein Gleitschirmpilot einen Umstieg braucht'
  },
  avaliacaoTitulo: {
    pt: 'O que a conversão começa por avaliar',
    en: 'What the conversion starts by assessing',
    es: 'Qué evalúa primero la conversión',
    fr: 'Ce que la conversion commence par évaluer',
    de: 'Was der Umstieg zuerst einschätzt'
  },
  avaliacaoTexto: {
    pt: 'Antes de qualquer exercício, o instrutor precisa de saber com que piloto está a trabalhar. Não é um teste: é o que decide por onde se começa e a que ritmo se avança.',
    en: 'Before any exercise, the instructor needs to know which pilot they are working with. It is not a test: it is what decides where to start and how fast to move.',
    es: 'Antes de cualquier ejercicio, el instructor necesita saber con qué piloto está trabajando. No es un examen: es lo que decide por dónde se empieza y a qué ritmo se avanza.',
    fr: 'Avant tout exercice, l’instructeur doit savoir avec quel pilote il travaille. Ce n’est pas un test : c’est ce qui décide par où commencer et à quel rythme avancer.',
    de: 'Vor jeder Übung muss der Ausbilder wissen, mit welchem Piloten er arbeitet. Das ist keine Prüfung: es entscheidet, wo man anfängt und wie schnell es weitergeht.'
  },
  avaliacaoItens: {
    pt: ['Experiência', 'Hábitos', 'Automatismos vindos do parapente',
         'Respostas já consolidadas'],
    en: ['Experience', 'Habits', 'Automatic responses brought from paragliding',
         'Responses already consolidated'],
    es: ['Experiencia', 'Hábitos', 'Automatismos traídos del parapente',
         'Respuestas ya consolidadas'],
    fr: ['Expérience', 'Habitudes', 'Automatismes venus du parapente',
         'Réponses déjà consolidées'],
    de: ['Erfahrung', 'Gewohnheiten', 'Automatismen vom Gleitschirm',
         'Schon gefestigte Reaktionen']
  },
  /* Duas colunas, e não quatro. Na 1.ª iteração isto usava o `pk-percursos`
     do hub, que é uma grelha de QUATRO colunas fixas: com dois itens, metade
     da secção ficava em branco. Passou para o `sg-duas` da /pilot2wing/. */
  asasColunas: [
    {
      rotulo: { pt: 'Parapente', en: 'Paraglider', es: 'Parapente',
                fr: 'Parapente', de: 'Gleitschirm' },
      subtitulo: { pt: 'O que já trazes', en: 'What you already bring',
                   es: 'Lo que ya traes', fr: 'Ce que tu apportes déjà',
                   de: 'Was du schon mitbringst' },
      itens: {
        pt: ['experiência de voo', 'leitura de condições', 'descolagem e aterragem',
             'consciência do espaço e do risco'],
        en: ['flying experience', 'reading conditions', 'take-off and landing',
             'awareness of space and risk'],
        es: ['experiencia de vuelo', 'lectura de condiciones', 'despegue y aterrizaje',
             'conciencia del espacio y del riesgo'],
        fr: ['expérience de vol', 'lecture des conditions', 'décollage et atterrissage',
             'conscience de l’espace et du risque'],
        de: ['Flugerfahrung', 'Bedingungen lesen', 'Start und Landung',
             'Raum- und Risikobewusstsein']
      }
    },
    {
      rotulo: { pt: 'Parakite', en: 'Parakite', es: 'Parakite',
                fr: 'Parakite', de: 'Parakite' },
      subtitulo: { pt: 'O que precisas de adaptar', en: 'What you need to adapt',
                   es: 'Lo que necesitas adaptar', fr: 'Ce qu’il faut adapter',
                   de: 'Was du anpassen musst' },
      itens: {
        pt: ['gestão de energia', 'velocidade', 'pitch', 'timing', 'corpo', 'harness',
             'pernas', 'comandos', 'respostas automáticas adquiridas no parapente'],
        en: ['energy management', 'speed', 'pitch', 'timing', 'body', 'harness',
             'legs', 'controls', 'automatic responses learned on a paraglider'],
        es: ['gestión de la energía', 'velocidad', 'pitch', 'timing', 'cuerpo', 'harness',
             'piernas', 'mandos', 'respuestas automáticas adquiridas en parapente'],
        fr: ['gestion de l’énergie', 'vitesse', 'pitch', 'timing', 'corps', 'harness',
             'jambes', 'commandes', 'réponses automatiques acquises en parapente'],
        de: ['Energieverwaltung', 'Geschwindigkeit', 'Pitch', 'Timing', 'Körper', 'Harness',
             'Beine', 'Steuerung', 'automatische Reaktionen vom Gleitschirm']
      }
    }
  ],
  /* 14/09/2026 · DE DUAS CAIXAS DE ETIQUETAS A UM DIAGRAMA
     O que já trazes → conversão → o que precisas de adaptar. Os nove itens do
     Parakite eram uma nuvem de etiquetas; agrupam-se pelo que são — energia,
     corpo e harness, hábitos — apontando para eles pela posição em
     `asasColunas[1].itens`. Nenhum item muda. */
  conversaoSeta: {
    pt: 'Conversão', en: 'Conversion', es: 'Conversión', fr: 'Conversion', de: 'Umstieg'
  },
  adaptarGrupos: [
    { titulo: { pt: 'Energia', en: 'Energy', es: 'Energía', fr: 'Énergie', de: 'Energie' }, itens: [0, 1, 2, 3] },
    { titulo: { pt: 'Corpo e harness', en: 'Body and harness', es: 'Cuerpo y harness',
                fr: 'Corps et harness', de: 'Körper und Harness' }, itens: [4, 5, 6, 7] },
    { titulo: { pt: 'Hábitos', en: 'Habits', es: 'Hábitos', fr: 'Habitudes', de: 'Gewohnheiten' }, itens: [8] }
  ],
  asasRemate: {
    pt: 'A experiência de parapente é uma vantagem. Não substitui a adaptação ao Parakite.',
    en: 'Paragliding experience is an advantage. It does not replace adapting to the Parakite.',
    es: 'La experiencia de parapente es una ventaja. No sustituye la adaptación al Parakite.',
    fr: 'L’expérience du parapente est un avantage. Elle ne remplace pas l’adaptation au Parakite.',
    de: 'Gleitschirmerfahrung ist ein Vorteil. Sie ersetzt nicht die Anpassung an den Parakite.'
  },
  /* 14/09/2026 · HÁBITOS E PONTOS DE PARTIDA — TEXTO DO PAULO
     O português abaixo é o que o Paulo escreveu, repartido em «no parapente»
     e «no Parakite». Ele pediu expressamente que os hábitos se apresentem
     como TENDÊNCIAS INICIAIS e não como regras universais — é o `habitosNota`,
     e não sai da página. «Tirantes» é a palavra dele em português; nas
     outras línguas fica «risers», como no resto do site. */
  habitosTitulo: {
    pt: 'Três hábitos do parapente que mudam no Parakite',
    en: 'Three paragliding habits that change on the Parakite',
    es: 'Tres hábitos del parapente que cambian en el Parakite',
    fr: 'Trois habitudes du parapente qui changent en Parakite',
    de: 'Drei Gleitschirm-Gewohnheiten, die sich beim Parakite ändern'
  },
  habitosNota: {
    pt: 'São tendências iniciais, não regras universais: a adaptação depende do piloto, da asa e das condições.',
    en: 'These are early tendencies, not universal rules: adapting depends on the pilot, the wing and the conditions.',
    es: 'Son tendencias iniciales, no reglas universales: la adaptación depende del piloto, del ala y de las condiciones.',
    fr: 'Ce sont des tendances de départ, pas des règles universelles : l’adaptation dépend du pilote, de l’aile et des conditions.',
    de: 'Das sind anfängliche Tendenzen, keine allgemeinen Regeln: Die Anpassung hängt vom Piloten, vom Schirm und von den Bedingungen ab.'
  },
  habitosLados: {
    pt: ['No parapente', 'No Parakite'], en: ['On a paraglider', 'On the Parakite'],
    es: ['En parapente', 'En el Parakite'], fr: ['En parapente', 'En Parakite'],
    de: ['Beim Gleitschirm', 'Beim Parakite']
  },
  habitos: [
    {
      titulo: { pt: 'Controlar sobretudo com os travões', en: 'Controlling mainly with the brakes',
                es: 'Controlar sobre todo con los frenos', fr: 'Piloter surtout aux freins',
                de: 'Vor allem mit den Bremsen steuern' },
      antes: { pt: 'O piloto tende a procurar a resposta através dos travões.',
               en: 'The pilot tends to look for the response through the brakes.',
               es: 'El piloto tiende a buscar la respuesta a través de los frenos.',
               fr: 'Le pilote a tendance à chercher la réponse par les freins.',
               de: 'Der Pilot sucht die Reaktion eher über die Bremsen.' },
      depois: { pt: 'O piloto começa por trabalhar mais com o corpo, as pernas, o peito, os ombros e os tirantes, usando os travões de forma mais progressiva e consciente.',
                en: 'The pilot starts by working more with the body, legs, chest, shoulders and risers, using the brakes more progressively and consciously.',
                es: 'El piloto empieza trabajando más con el cuerpo, las piernas, el pecho, los hombros y los risers, usando los frenos de forma más progresiva y consciente.',
                fr: 'Le pilote commence par travailler davantage avec le corps, les jambes, la poitrine, les épaules et les risers, en utilisant les freins de façon plus progressive et consciente.',
                de: 'Der Pilot arbeitet zuerst mehr mit Körper, Beinen, Brust, Schultern und den Risers und setzt die Bremsen progressiver und bewusster ein.' }
    },
    {
      titulo: { pt: 'Olhar para a asa ou para o lado alto', en: 'Looking at the wing or at the high side',
                es: 'Mirar el ala o el lado alto', fr: 'Regarder l’aile ou le côté haut',
                de: 'Auf den Schirm oder die hohe Seite schauen' },
      antes: { pt: 'É comum acompanhar visualmente a asa.',
               en: 'It is common to follow the wing with your eyes.',
               es: 'Es habitual seguir el ala con la vista.',
               fr: 'Il est courant de suivre l’aile des yeux.',
               de: 'Es ist üblich, den Schirm mit den Augen zu verfolgen.' },
      depois: { pt: 'O piloto aprende a manter os olhos no lado baixo e a sentir a asa através do corpo e dos tirantes, sem reagir excessivamente ao que vê.',
                en: 'The pilot learns to keep their eyes on the low side and to feel the wing through the body and the risers, without over-reacting to what they see.',
                es: 'El piloto aprende a mantener la mirada en el lado bajo y a sentir el ala a través del cuerpo y de los risers, sin reaccionar en exceso a lo que ve.',
                fr: 'Le pilote apprend à garder les yeux sur le côté bas et à sentir l’aile à travers le corps et les risers, sans trop réagir à ce qu’il voit.',
                de: 'Der Pilot lernt, den Blick auf der tiefen Seite zu halten und den Schirm über Körper und Risers zu spüren, ohne übermäßig auf das zu reagieren, was er sieht.' }
    },
    {
      titulo: { pt: 'Corrigir tarde, quando a asa já está desalinhada', en: 'Correcting late, when the wing is already off line',
                es: 'Corregir tarde, cuando el ala ya está desalineada', fr: 'Corriger tard, quand l’aile est déjà désaxée',
                de: 'Spät korrigieren, wenn der Schirm schon aus der Achse ist' },
      antes: { pt: 'Algumas correções podem ser feitas depois de a asa já estar por cima.',
               en: 'Some corrections can be made once the wing is already overhead.',
               es: 'Algunas correcciones se pueden hacer cuando el ala ya está arriba.',
               fr: 'Certaines corrections peuvent se faire une fois l’aile déjà au-dessus.',
               de: 'Manche Korrekturen lassen sich machen, wenn der Schirm schon über dem Piloten steht.' },
      depois: { pt: 'A velocidade de inflação e a proximidade ao solo exigem antecipação: preparar a posição, manter os tirantes à frente e corrigir cedo com o corpo e o lado oposto.',
                en: 'The speed of the inflation and the closeness to the ground demand anticipation: prepare your position, keep the risers in front and correct early with the body and the opposite side.',
                es: 'La velocidad de inflado y la proximidad al suelo exigen anticipación: preparar la posición, mantener los risers delante y corregir pronto con el cuerpo y el lado opuesto.',
                fr: 'La vitesse du gonflage et la proximité du sol exigent de l’anticipation : préparer la position, garder les risers devant et corriger tôt avec le corps et le côté opposé.',
                de: 'Die Geschwindigkeit beim Aufziehen und die Nähe zum Boden verlangen Vorausschau: die Position vorbereiten, die Risers vorne halten und früh mit dem Körper und der Gegenseite korrigieren.' }
    }
  ],
  perfisTitulo: {
    pt: 'Por onde começas, conforme o que já voas',
    en: 'Where you start, depending on what you already fly',
    es: 'Por dónde empiezas, según lo que ya vuelas',
    fr: 'Par où tu commences, selon ce que tu voles déjà',
    de: 'Wo du anfängst, je nachdem, was du schon fliegst'
  },
  perfis: [
    {
      nome: { pt: 'Piloto recente de parapente', en: 'Newer paraglider pilot', es: 'Piloto de parapente reciente',
              fr: 'Pilote de parapente récent', de: 'Neuerer Gleitschirmpilot' },
      texto: { pt: 'Começa por consolidar a posição do corpo, o controlo dos tirantes, a inflação e as correções básicas. O objetivo é criar bons reflexos antes de aumentar a velocidade ou a complexidade dos exercícios.',
               en: 'Starts by consolidating body position, riser control, inflation and basic corrections. The aim is to build good reflexes before increasing the speed or complexity of the exercises.',
               es: 'Empieza por consolidar la posición del cuerpo, el control de los risers, el inflado y las correcciones básicas. El objetivo es crear buenos reflejos antes de aumentar la velocidad o la complejidad de los ejercicios.',
               fr: 'Commence par consolider la position du corps, le contrôle des risers, le gonflage et les corrections de base. L’objectif est de créer de bons réflexes avant d’augmenter la vitesse ou la complexité des exercices.',
               de: 'Beginnt damit, Körperposition, Riser-Kontrolle, Aufziehen und grundlegende Korrekturen zu festigen. Ziel ist, gute Reflexe aufzubauen, bevor Tempo oder Komplexität der Übungen steigen.' }
    },
    {
      nome: { pt: 'Piloto experiente de parapente', en: 'Experienced paraglider pilot', es: 'Piloto de parapente experimentado',
              fr: 'Pilote de parapente expérimenté', de: 'Erfahrener Gleitschirmpilot' },
      texto: { pt: 'Normalmente precisa de reaprender alguns automatismos: confiar mais no corpo, não travar por reflexo e aceitar que a asa responde mais depressa. O início pode ser dedicado a substituir hábitos do parapente por respostas adequadas ao Parakite.',
               en: 'Usually needs to relearn some automatic responses: trust the body more, not brake by reflex, and accept that the wing responds faster. The start may be spent replacing paragliding habits with responses suited to the Parakite.',
               es: 'Normalmente necesita reaprender algunos automatismos: confiar más en el cuerpo, no frenar por reflejo y aceptar que el ala responde más rápido. El inicio puede dedicarse a sustituir hábitos del parapente por respuestas adecuadas al Parakite.',
               fr: 'A généralement besoin de réapprendre certains automatismes : faire davantage confiance au corps, ne pas freiner par réflexe et accepter que l’aile répond plus vite. Le début peut être consacré à remplacer des habitudes du parapente par des réponses adaptées au Parakite.',
               de: 'Muss meist einige Automatismen neu lernen: dem Körper mehr vertrauen, nicht reflexartig bremsen und akzeptieren, dass der Schirm schneller reagiert. Der Anfang kann dazu dienen, Gleitschirm-Gewohnheiten durch Reaktionen zu ersetzen, die zum Parakite passen.' }
    },
    {
      nome: { pt: 'Piloto com experiência de groundhandling ou mini-wing', en: 'Pilot with groundhandling or mini-wing experience',
              es: 'Piloto con experiencia de groundhandling o mini-wing', fr: 'Pilote avec de l’expérience en groundhandling ou mini-wing',
              de: 'Pilot mit Groundhandling- oder Mini-Wing-Erfahrung' },
      texto: { pt: 'Já traz alguma sensibilidade ao vento e ao movimento da asa. Pode avançar mais rapidamente, mas é necessário avaliar se os seus reflexos e técnicas correspondem ao comportamento específico do Parakite que vai utilizar.',
               en: 'Already brings some feel for the wind and the wing’s movement. Can move on faster, but it is necessary to assess whether their reflexes and technique match the specific behaviour of the Parakite they will use.',
               es: 'Ya trae cierta sensibilidad al viento y al movimiento del ala. Puede avanzar más rápido, pero hay que evaluar si sus reflejos y técnicas corresponden al comportamiento específico del Parakite que va a usar.',
               fr: 'Apporte déjà une certaine sensibilité au vent et au mouvement de l’aile. Peut avancer plus vite, mais il faut évaluer si ses réflexes et ses techniques correspondent au comportement spécifique du Parakite qu’il va utiliser.',
               de: 'Bringt schon ein Gefühl für den Wind und die Bewegung des Schirms mit. Kann schneller vorankommen, aber es muss geprüft werden, ob Reflexe und Technik zum spezifischen Verhalten des Parakite passen, der verwendet wird.' }
    }
  ],
  perfisFecho: {
    pt: 'Não existe um calendário fixo. O progresso depende da experiência anterior, da capacidade de leitura da asa, da consistência do controlo e das condições de treino. Só se avança quando as respostas são naturais, controladas e repetíveis.',
    en: 'There is no fixed calendar. Progress depends on previous experience, the ability to read the wing, the consistency of control and the training conditions. You only move on when the responses are natural, controlled and repeatable.',
    es: 'No existe un calendario fijo. El progreso depende de la experiencia previa, de la capacidad de leer el ala, de la consistencia del control y de las condiciones de entrenamiento. Solo se avanza cuando las respuestas son naturales, controladas y repetibles.',
    fr: 'Il n’y a pas de calendrier fixe. La progression dépend de l’expérience antérieure, de la capacité à lire l’aile, de la régularité du contrôle et des conditions d’entraînement. On n’avance que quand les réponses sont naturelles, contrôlées et reproductibles.',
    de: 'Es gibt keinen festen Zeitplan. Der Fortschritt hängt von der bisherigen Erfahrung ab, von der Fähigkeit, den Schirm zu lesen, von der Beständigkeit der Kontrolle und von den Trainingsbedingungen. Weiter geht es erst, wenn die Reaktionen natürlich, kontrolliert und wiederholbar sind.'
  },
  perfisBotao: {
    pt: 'Diz-nos o que voas hoje', en: 'Tell us what you fly today', es: 'Dinos qué vuelas hoy',
    fr: 'Dis-nous ce que tu voles aujourd’hui', de: 'Sag uns, was du heute fliegst'
  },
  verTecnico: {
    pt: 'A diferença técnica entre as asas', en: 'The technical difference between the wings',
    es: 'La diferencia técnica entre las alas', fr: 'La différence technique entre les ailes',
    de: 'Der technische Unterschied der Schirme'
  },

  /* ==================================================================
     BLOCO 6 · O MÉTODO  ·  ciclo de aprendizagem + qualidade antes de rapidez
     ================================================================== */

  metodoKicker: {
    pt: 'O método', en: 'The method', es: 'El método',
    fr: 'La méthode', de: 'Die Methode'
  },
  metodoTitulo: {
    pt: 'Compreender, executar, corrigir, repetir, consolidar',
    en: 'Understand, execute, correct, repeat, consolidate',
    es: 'Comprender, ejecutar, corregir, repetir, consolidar',
    fr: 'Comprendre, exécuter, corriger, répéter, consolider',
    de: 'Verstehen, ausführen, korrigieren, wiederholen, festigen'
  },
  /* A FRASE QUE EVITA A CONTRADICAO ENTRE AS DUAS PAGINAS.
     A /pilot2wing/ conta CINCO etapas de treino. Esta página conta SEIS
     passos de um ciclo. São coisas diferentes com o mesmo nome de marca, e
     sem esta frase um leitor vê contradição e um LLM cita uma ao acaso. */
  metodoDistincao: {
    pt: 'O Pilot2Wing organiza o treino em etapas. Dentro de cada etapa, a aprendizagem segue o mesmo ciclo: compreender, executar, corrigir, repetir, consolidar e responder naturalmente.',
    en: 'Pilot2Wing organises the training into stages. Within each stage, learning follows the same cycle: understand, execute, correct, repeat, consolidate and respond naturally.',
    es: 'Pilot2Wing organiza el entrenamiento en etapas. Dentro de cada etapa, el aprendizaje sigue el mismo ciclo: comprender, ejecutar, corregir, repetir, consolidar y responder con naturalidad.',
    fr: 'Pilot2Wing organise l’entraînement en étapes. À l’intérieur de chaque étape, l’apprentissage suit le même cycle : comprendre, exécuter, corriger, répéter, consolider et réagir naturellement.',
    de: 'Pilot2Wing gliedert das Training in Etappen. Innerhalb jeder Etappe folgt das Lernen demselben Zyklus: verstehen, ausführen, korrigieren, wiederholen, festigen und natürlich reagieren.'
  },
  metodoCadeia: {
    pt: ['Compreender', 'Executar corretamente', 'Corrigir', 'Repetir corretamente',
         'Consolidar', 'Responder naturalmente'],
    en: ['Understand', 'Execute correctly', 'Correct', 'Repeat correctly',
         'Consolidate', 'Respond naturally'],
    es: ['Comprender', 'Ejecutar correctamente', 'Corregir', 'Repetir correctamente',
         'Consolidar', 'Responder con naturalidad'],
    fr: ['Comprendre', 'Exécuter correctement', 'Corriger', 'Répéter correctement',
         'Consolider', 'Réagir naturellement'],
    de: ['Verstehen', 'Richtig ausführen', 'Korrigieren', 'Richtig wiederholen',
         'Festigen', 'Natürlich reagieren']
  },
  metodoTexto: {
    pt: 'Cada passo só faz sentido depois do anterior. Executar antes de compreender dá um movimento que funciona uma vez e não se sabe repetir; repetir antes de corrigir é o que transforma um erro em hábito.',
    en: 'Each step only makes sense after the one before it. Executing before understanding gives you a movement that works once and cannot be repeated on purpose; repeating before correcting is what turns a mistake into a habit.',
    es: 'Cada paso solo tiene sentido después del anterior. Ejecutar antes de comprender da un movimiento que funciona una vez y que no se sabe repetir; repetir antes de corregir es lo que convierte un error en hábito.',
    fr: 'Chaque étape n’a de sens qu’après la précédente. Exécuter avant de comprendre donne un mouvement qui marche une fois et qu’on ne sait pas reproduire ; répéter avant de corriger, c’est ce qui transforme une erreur en habitude.',
    de: 'Jeder Schritt ergibt erst nach dem vorherigen Sinn. Ausführen vor dem Verstehen ergibt eine Bewegung, die einmal klappt und die man nicht absichtlich wiederholen kann; Wiederholen vor dem Korrigieren macht aus einem Fehler eine Gewohnheit.'
  },
  qualidadeTitulo: {
    pt: 'Qualidade antes de rapidez', en: 'Quality before speed', es: 'Calidad antes de rapidez',
    fr: 'La qualité avant la vitesse', de: 'Qualität vor Schnelligkeit'
  },
  qualidadeCadeia: {
    pt: ['Qualidade', 'Consistência', 'Velocidade de resposta'],
    en: ['Quality', 'Consistency', 'Speed of response'],
    es: ['Calidad', 'Consistencia', 'Velocidad de respuesta'],
    fr: ['Qualité', 'Constance', 'Vitesse de réponse'],
    de: ['Qualität', 'Konstanz', 'Reaktionsgeschwindigkeit']
  },
  qualidadeTexto: {
    pt: 'A rapidez não se treina antes da qualidade do movimento. Primeiro compreende-se, executa-se corretamente, corrige-se, repete-se corretamente e consolida-se. Só depois se reduz progressivamente o tempo entre estímulo e resposta — que é o que o Quick Response Game do Pilot2Wing treina.',
    en: 'Speed is not trained before the quality of the movement. First you understand, execute correctly, correct, repeat correctly and consolidate. Only then is the time between stimulus and response progressively reduced — which is what the Pilot2Wing Quick Response Game trains.',
    es: 'La rapidez no se entrena antes de la calidad del movimiento. Primero se comprende, se ejecuta correctamente, se corrige, se repite correctamente y se consolida. Solo después se reduce progresivamente el tiempo entre estímulo y respuesta — que es lo que entrena el Quick Response Game del Pilot2Wing.',
    fr: 'La vitesse ne s’entraîne pas avant la qualité du mouvement. D’abord on comprend, on exécute correctement, on corrige, on répète correctement et on consolide. Ensuite seulement on réduit progressivement le temps entre stimulus et réponse — c’est ce que le Quick Response Game de Pilot2Wing entraîne.',
    de: 'Schnelligkeit trainiert man nicht vor der Bewegungsqualität. Zuerst verstehen, richtig ausführen, korrigieren, richtig wiederholen, festigen. Erst danach wird die Zeit zwischen Reiz und Reaktion schrittweise verkürzt — genau das trainiert das Quick Response Game von Pilot2Wing.'
  },
  metodoLigacao: {
    pt: 'As cinco etapas do método Pilot2Wing',
    en: 'The five stages of the Pilot2Wing method',
    es: 'Las cinco etapas del método Pilot2Wing',
    fr: 'Les cinq étapes de la méthode Pilot2Wing',
    de: 'Die fünf Etappen der Pilot2Wing-Methode'
  },

  /* ==================================================================
     BLOCO 7 · ERRO E AUTOMATISMO  ·  dois subtemas + o processo
     ================================================================== */

  erroKicker: {
    pt: 'Erro e automatismo', en: 'Error and automatism', es: 'Error y automatismo',
    fr: 'Erreur et automatisme', de: 'Fehler und Automatismus'
  },
  erroTitulo: {
    pt: 'O corpo aprende o que repete, certo ou errado',
    en: 'The body learns what it repeats, right or wrong',
    es: 'El cuerpo aprende lo que repite, bien o mal',
    fr: 'Le corps apprend ce qu’il répète, juste ou faux',
    de: 'Der Körper lernt, was er wiederholt — richtig oder falsch'
  },
  habitoTitulo: {
    pt: 'O erro repetido transforma-se em hábito',
    en: 'A repeated mistake becomes a habit',
    es: 'El error repetido se transforma en hábito',
    fr: 'L’erreur répétée devient une habitude',
    de: 'Der wiederholte Fehler wird zur Gewohnheit'
  },
  /* 14/09/2026 · as duas fotografias do Paulo na secção do erro (recortes) */
  erroFigObservaAlt: {
    pt: 'Instrutor a observar um piloto enquanto a asa de Parakite se inclina durante um exercício no chão',
    en: 'Instructor watching a pilot as the Parakite wing leans over during a ground exercise',
    es: 'Instructor observando a un piloto mientras el ala de Parakite se inclina durante un ejercicio en el suelo',
    fr: 'Instructeur observant un pilote pendant que l’aile de Parakite s’incline lors d’un exercice au sol',
    de: 'Ausbilder beobachtet einen Piloten, während sich der Parakite-Schirm bei einer Bodenübung neigt'
  },
  erroFigCorrigeAlt: {
    pt: 'Instrutor ao lado de um piloto com a asa de Parakite estabilizada por cima da cabeça',
    en: 'Instructor next to a pilot with the Parakite wing stabilised overhead',
    es: 'Instructor junto a un piloto con el ala de Parakite estabilizada sobre la cabeza',
    fr: 'Instructeur à côté d’un pilote, l’aile de Parakite stabilisée au-dessus de sa tête',
    de: 'Ausbilder neben einem Piloten mit stabilisiertem Parakite-Schirm über dem Kopf'
  },
  habitoColunas: [
    {
      rotulo: { pt: 'O caminho que queremos', en: 'The path we want',
                es: 'El camino que queremos', fr: 'Le chemin que nous voulons',
                de: 'Der Weg, den wir wollen' },
      etapas: {
        pt: ['Movimento correto', 'Repetição correta', 'Automatismo útil'],
        en: ['Correct movement', 'Correct repetition', 'Useful automatism'],
        es: ['Movimiento correcto', 'Repetición correcta', 'Automatismo útil'],
        fr: ['Mouvement correct', 'Répétition correcte', 'Automatisme utile'],
        de: ['Korrekte Bewegung', 'Korrekte Wiederholung', 'Nützlicher Automatismus']
      }
    },
    {
      rotulo: { pt: 'O caminho que evitamos', en: 'The path we avoid',
                es: 'El camino que evitamos', fr: 'Le chemin que nous évitons',
                de: 'Der Weg, den wir vermeiden' },
      etapas: {
        pt: ['Movimento errado', 'Repetição do erro', 'Automatismo difícil de corrigir'],
        en: ['Wrong movement', 'Repeating the mistake', 'Automatism hard to undo'],
        es: ['Movimiento erróneo', 'Repetición del error', 'Automatismo difícil de corregir'],
        fr: ['Mouvement erroné', 'Répétition de l’erreur', 'Automatisme difficile à corriger'],
        de: ['Falsche Bewegung', 'Wiederholung des Fehlers', 'Schwer korrigierbarer Automatismus']
      }
    }
  ],
  habitoTexto: {
    pt: 'Depois de instalado, já não se corrige o movimento: corrige-se um hábito, e isso custa muito mais do que aprendê-lo bem à primeira.',
    en: 'Once it is installed you are no longer correcting a movement: you are correcting a habit, and that costs far more than learning it right the first time.',
    es: 'Una vez instalado, ya no se corrige el movimiento: se corrige un hábito, y eso cuesta mucho más que aprenderlo bien la primera vez.',
    fr: 'Une fois installée, on ne corrige plus un mouvement : on corrige une habitude, et cela coûte bien plus que de l’apprendre correctement du premier coup.',
    de: 'Ist er einmal eingeschliffen, korrigiert man keine Bewegung mehr, sondern eine Gewohnheit — und das kostet weit mehr, als es gleich richtig zu lernen.'
  },
  tecnicaTitulo: {
    pt: 'Um resultado certo pode nascer de uma técnica errada',
    en: 'A right result can come from a wrong technique',
    es: 'Un resultado correcto puede nacer de una técnica errónea',
    fr: 'Un bon résultat peut naître d’une mauvaise technique',
    de: 'Ein richtiges Ergebnis kann aus falscher Technik entstehen'
  },
  tecnicaTexto: {
    pt: 'Não basta a asa responder corretamente. O movimento que produziu essa resposta também tem de estar correto. Uma asa pode fazer exactamente o que se queria através de uma compensação tecnicamente errada — e um resultado certo obtido assim é o pior professor que há: confirma o erro e convida a repeti-lo.',
    en: 'It is not enough for the wing to respond correctly. The movement that produced that response also has to be correct. A wing can do exactly what you wanted through a technically wrong compensation — and a right result obtained that way is the worst teacher there is: it confirms the mistake and invites you to repeat it.',
    es: 'No basta con que el ala responda correctamente. El movimiento que produjo esa respuesta también tiene que ser correcto. Un ala puede hacer exactamente lo que se quería mediante una compensación técnicamente errónea — y un resultado correcto obtenido así es el peor profesor que hay: confirma el error e invita a repetirlo.',
    fr: 'Il ne suffit pas que l’aile réponde correctement. Le mouvement qui a produit cette réponse doit lui aussi être correct. Une aile peut faire exactement ce qu’on voulait par une compensation techniquement fausse — et un bon résultat obtenu ainsi est le pire professeur qui soit : il confirme l’erreur et invite à la répéter.',
    de: 'Es genügt nicht, dass der Schirm richtig reagiert. Auch die Bewegung, die diese Reaktion erzeugt hat, muss korrekt sein. Ein Schirm kann genau das tun, was man wollte — über eine technisch falsche Kompensation. Und ein so erzieltes richtiges Ergebnis ist der schlechteste Lehrer: es bestätigt den Fehler und lädt ein, ihn zu wiederholen.'
  },
  processoTitulo: {
    pt: 'O instrutor observa o processo, não apenas a asa',
    en: 'The instructor watches the process, not just the wing',
    es: 'El instructor observa el proceso, no solo el ala',
    fr: 'L’instructeur observe le processus, pas seulement l’aile',
    de: 'Der Ausbilder beobachtet den Prozess, nicht nur den Schirm'
  },
  processoTexto: {
    pt: 'Por isso se olha para as duas coisas ao mesmo tempo: o resultado e o processo. É essa leitura dupla que permite apanhar o erro no momento, antes de ele ser repetido.',
    en: 'That is why both are watched at once: the result and the process. It is that double reading that catches the mistake in the moment, before it gets repeated.',
    es: 'Por eso se miran las dos cosas a la vez: el resultado y el proceso. Es esa lectura doble la que permite coger el error en el momento, antes de que se repita.',
    fr: 'C’est pourquoi on regarde les deux en même temps : le résultat et le processus. C’est cette double lecture qui permet de saisir l’erreur sur le moment, avant qu’elle ne soit répétée.',
    de: 'Deshalb schaut man auf beides gleichzeitig: das Ergebnis und den Prozess. Diese doppelte Lesart erwischt den Fehler im Moment, bevor er wiederholt wird.'
  },
  processoCadeia: {
    pt: ['Erro', 'Perceber', 'Corrigir', 'Repetir corretamente'],
    en: ['Mistake', 'Understand it', 'Correct', 'Repeat correctly'],
    es: ['Error', 'Comprender', 'Corregir', 'Repetir correctamente'],
    fr: ['Erreur', 'Comprendre', 'Corriger', 'Répéter correctement'],
    de: ['Fehler', 'Verstehen', 'Korrigieren', 'Richtig wiederholen']
  },

  /* ==================================================================
     BLOCO 8 · BODY FIRST  (ilha clara)
     ================================================================== */

  bodyKicker: {
    pt: 'Body First', en: 'Body First', es: 'Body First', fr: 'Body First', de: 'Body First'
  },
  bodyTitulo: {
    pt: 'Body First: preparar o corpo antes de aumentar a energia',
    en: 'Body First: preparing the body before adding energy',
    es: 'Body First: preparar el cuerpo antes de aumentar la energía',
    fr: 'Body First : préparer le corps avant d’augmenter l’énergie',
    de: 'Body First: den Körper vorbereiten, bevor die Energie steigt'
  },
  bodyTexto: {
    pt: 'Primeiro aprendemos a posicionar e utilizar o corpo. Depois acrescentamos progressivamente a energia da asa.',
    en: 'First we learn to position and use the body. Then we progressively add the wing’s energy.',
    es: 'Primero aprendemos a posicionar y utilizar el cuerpo. Después añadimos progresivamente la energía del ala.',
    fr: 'D’abord nous apprenons à placer et à utiliser le corps. Ensuite nous ajoutons progressivement l’énergie de l’aile.',
    de: 'Zuerst lernen wir, den Körper zu positionieren und einzusetzen. Dann fügen wir schrittweise die Energie des Schirms hinzu.'
  },
  bodyNaoTitulo: {
    pt: 'O que Body First não é', en: 'What Body First is not', es: 'Qué no es Body First',
    fr: 'Ce que Body First n’est pas', de: 'Was Body First nicht ist'
  },
  bodyNaoTexto: {
    pt: 'Body First não significa substituir os comandos pelo corpo. Significa preparar o piloto para usar olhar, postura, bacia, pernas e comandos de forma coordenada, antes de aumentar progressivamente a energia da asa.',
    en: 'Body First does not mean replacing the controls with the body. It means preparing the pilot to use eyes, posture, hips, legs and controls in a coordinated way, before progressively adding the wing’s energy.',
    es: 'Body First no significa sustituir los mandos por el cuerpo. Significa preparar al piloto para usar mirada, postura, pelvis, piernas y mandos de forma coordinada, antes de aumentar progresivamente la energía del ala.',
    fr: 'Body First ne signifie pas remplacer les commandes par le corps. Cela signifie préparer le pilote à utiliser regard, posture, bassin, jambes et commandes de façon coordonnée, avant d’augmenter progressivement l’énergie de l’aile.',
    de: 'Body First bedeutet nicht, die Steuerung durch den Körper zu ersetzen. Es bedeutet, den Piloten darauf vorzubereiten, Blick, Haltung, Becken, Beine und Steuerung koordiniert einzusetzen, bevor die Energie des Schirms schrittweise erhöht wird.'
  },
  bodyGestos: {
    pt: 'Também não é um conjunto de gestos memorizados. A lógica é sempre a mesma: compreender o movimento, executá-lo corretamente, e só depois aplicá-lo com energia.',
    en: 'Nor is it a set of memorised gestures. The logic is always the same: understand the movement, execute it correctly, and only then apply it with energy.',
    es: 'Tampoco es un conjunto de gestos memorizados. La lógica es siempre la misma: comprender el movimiento, ejecutarlo correctamente, y solo después aplicarlo con energía.',
    fr: 'Ce n’est pas non plus un ensemble de gestes mémorisés. La logique est toujours la même : comprendre le mouvement, l’exécuter correctement, et seulement ensuite l’appliquer avec de l’énergie.',
    de: 'Es ist auch keine Menge auswendig gelernter Gesten. Die Logik ist immer dieselbe: die Bewegung verstehen, sie korrekt ausführen und erst dann mit Energie anwenden.'
  },
  bodyOrdem: {
    pt: ['Compreender o movimento', 'Executá-lo corretamente', 'Aplicá-lo com energia'],
    en: ['Understand the movement', 'Execute it correctly', 'Apply it with energy'],
    es: ['Comprender el movimiento', 'Ejecutarlo correctamente', 'Aplicarlo con energía'],
    fr: ['Comprendre le mouvement', 'L’exécuter correctement', 'L’appliquer avec de l’énergie'],
    de: ['Die Bewegung verstehen', 'Sie korrekt ausführen', 'Sie mit Energie anwenden']
  },
  /* ==== BLOCO 8, depois da separacao ====
     O harness e os comandos sairam daqui para o bloco 9. As notas da Bacia e
     das Pernas foram reescritas: diziam "distribuicao de carga" e "atraves do
     harness", que e materia do bloco 9 — o elemento do corpo estava a
     definir-se pelo equipamento que ainda nao tinha sido apresentado.
     E a nota dos Ombros dizia "movimento do tronco", que passou a ser
     elemento proprio: definia-se pelo elemento seguinte. */

  corpoAprendeTitulo: {
    pt: 'O corpo aprende primeiro', en: 'The body learns first',
    es: 'El cuerpo aprende primero', fr: 'Le corps apprend d’abord',
    de: 'Der Körper lernt zuerst'
  },
  corpoAprendeTexto: {
    pt: 'Olhar, postura, tronco, bacia e pernas trabalham-se antes de a asa começar a gerar energia. É esta ordem que dá ao piloto tempo para compreender o movimento, em vez de reagir a ele.',
    en: 'Eyes, posture, torso, hips and legs are worked before the wing starts generating energy. It is this order that gives the pilot time to understand the movement instead of reacting to it.',
    es: 'Mirada, postura, tronco, pelvis y piernas se trabajan antes de que el ala empiece a generar energía. Es este orden el que da al piloto tiempo para comprender el movimiento, en vez de reaccionar a él.',
    fr: 'Regard, posture, buste, bassin et jambes se travaillent avant que l’aile ne commence à générer de l’énergie. C’est cet ordre qui donne au pilote le temps de comprendre le mouvement, au lieu d’y réagir.',
    de: 'Blick, Haltung, Oberkörper, Becken und Beine werden gearbeitet, bevor der Schirm Energie erzeugt. Diese Reihenfolge gibt dem Piloten Zeit, die Bewegung zu verstehen, statt auf sie zu reagieren.'
  },
  /* A ponte para o bloco 9. Sem ela, a frase protegida sobre os comandos
     responde a uma pergunta que este bloco ja nao levanta. */
  bodyComandos: {
    pt: 'Os comandos continuam a fazer parte da pilotagem; nesta fase, o foco está primeiro na preparação do corpo.',
    en: 'The controls remain part of flying the wing; at this stage, the focus is first on preparing the body.',
    es: 'Los mandos siguen formando parte del pilotaje; en esta fase, el foco está primero en la preparación del cuerpo.',
    fr: 'Les commandes font toujours partie du pilotage ; à ce stade, l’accent est d’abord mis sur la préparation du corps.',
    de: 'Die Steuerung bleibt Teil des Fliegens; in dieser Phase liegt der Fokus zuerst auf der Vorbereitung des Körpers.'
  },
  /* Fotografia real, sem asa e sem harness, e sem marcadores: as proporcoes
     de um corpo fotografado mudam com o recorte, e numeros sobrepostos em
     HTML nao aguentam isso. Os cinco conceitos vivem na lista ao lado. */
  bodyFiguraAlt: {
    pt: 'Piloto a treinar postura e movimentos corporais sem asa durante um exercício Body First',
    en: 'A pilot training posture and body movements without a wing during a Body First exercise',
    es: 'Piloto entrenando postura y movimientos corporales sin ala durante un ejercicio Body First',
    fr: 'Un pilote travaillant la posture et les mouvements du corps sans aile pendant un exercice Body First',
    de: 'Ein Pilot trainiert Haltung und Körperbewegungen ohne Schirm während einer Body-First-Übung'
  },
  corpoElementos: [
    {
      nome: { pt: 'Olhar', en: 'Eyes', es: 'Mirada', fr: 'Regard', de: 'Blick' },
      nota: { pt: 'ajuda a orientar a postura, a direção e a antecipação',
              en: 'helps orient posture, direction and anticipation',
              es: 'ayuda a orientar la postura, la dirección y la anticipación',
              fr: 'aide à orienter la posture, la direction et l’anticipation',
              de: 'hilft, Haltung, Richtung und Antizipation auszurichten' }
    },
    {
      nome: { pt: 'Ombros e peito', en: 'Shoulders and chest', es: 'Hombros y pecho',
              fr: 'Épaules et buste', de: 'Schultern und Brust' },
      nota: { pt: 'participam na rotação e na orientação para onde se vai',
              en: 'take part in the rotation and in orienting where you are going',
              es: 'participan en la rotación y en la orientación de hacia dónde se va',
              fr: 'participent à la rotation et à l’orientation vers où l’on va',
              de: 'sind an der Rotation und der Ausrichtung beteiligt, wohin es geht' }
    },
    {
      nome: { pt: 'Tronco', en: 'Torso', es: 'Tronco', fr: 'Buste', de: 'Oberkörper' },
      nota: { pt: 'define o eixo e a inclinação do corpo',
              en: 'sets the body’s axis and inclination',
              es: 'define el eje y la inclinación del cuerpo',
              fr: 'définit l’axe et l’inclinaison du corps',
              de: 'bestimmt Achse und Neigung des Körpers' }
    },
    {
      nome: { pt: 'Bacia', en: 'Hips', es: 'Pelvis', fr: 'Bassin', de: 'Becken' },
      nota: { pt: 'participa na posição e na orientação do corpo',
              en: 'takes part in the body’s position and orientation',
              es: 'participa en la posición y en la orientación del cuerpo',
              fr: 'participe à la position et à l’orientation du corps',
              de: 'ist an Position und Ausrichtung des Körpers beteiligt' }
    },
    {
      nome: { pt: 'Pernas', en: 'Legs', es: 'Piernas', fr: 'Jambes', de: 'Beine' },
      nota: { pt: 'participam na posição corporal e na coordenação do movimento',
              en: 'take part in body position and in coordinating the movement',
              es: 'participan en la posición corporal y en la coordinación del movimiento',
              fr: 'participent à la position du corps et à la coordination du mouvement',
              de: 'sind an Körperposition und Bewegungskoordination beteiligt' }
    }
  ],

  /* ==================================================================
     BLOCO 9 · O HARNESS E AS PERNAS  ·  cadeia + sentir + groundhandling
     ================================================================== */

  harnessKicker: {
    pt: 'O harness e as pernas', en: 'The harness and the legs', es: 'El harness y las piernas',
    fr: 'Le harness et les jambes', de: 'Harness und Beine'
  },
  harnessTitulo: {
    pt: 'Harness split-leg: ligação entre corpo, carga e asa',
    en: 'Split-leg harness: the link between body, load and wing',
    es: 'Harness split-leg: enlace entre cuerpo, carga y ala',
    fr: 'Harness split-leg : le lien entre corps, charge et aile',
    de: 'Split-leg-Harness: die Verbindung von Körper, Last und Schirm'
  },
  harnessTexto: {
    pt: 'Num harness split-leg, as pernas podem trabalhar de forma mais independente. A posição das pernas e da bacia influencia a distribuição de carga no harness e, através dele, a resposta do conjunto piloto–asa.',
    en: 'In a split-leg harness, the legs can work more independently. The position of the legs and hips influences how load is distributed in the harness and, through it, the response of the pilot–wing system.',
    es: 'En un harness split-leg, las piernas pueden trabajar de forma más independiente. La posición de las piernas y de la pelvis influye en la distribución de carga en el harness y, a través de él, en la respuesta del conjunto piloto–ala.',
    fr: 'Dans un harness split-leg, les jambes peuvent travailler de façon plus indépendante. La position des jambes et du bassin influence la répartition des charges dans le harness et, par son intermédiaire, la réponse de l’ensemble pilote–aile.',
    de: 'In einem Split-leg-Harness können die Beine unabhängiger arbeiten. Die Position von Beinen und Becken beeinflusst die Lastverteilung im Harness und darüber die Reaktion des Systems Pilot–Schirm.'
  },
  /* Quem vem do parapente traz outra referencia de harness. Uma frase, e nao
     um H3: a adaptacao de quem vem do parapente e materia do bloco 5, que se
     chama exactamente isso. */
  harnessRefTexto: {
    pt: 'Quem vem do parapente traz uma referência de harness diferente, e é isso que se ajusta primeiro.',
    en: 'Anyone coming from paragliding brings a different harness reference, and that is what gets adjusted first.',
    es: 'Quien viene del parapente trae una referencia de harness distinta, y es eso lo que se ajusta primero.',
    fr: 'Qui vient du parapente apporte une autre référence de harness, et c’est cela qu’on ajuste en premier.',
    de: 'Wer vom Gleitschirm kommt, bringt eine andere Harness-Referenz mit — und die wird zuerst angepasst.'
  },

  /* ==== O QUE VEIO DO BLOCO 8 ====
     O H3 do sistema pertence aqui: e neste bloco que o harness e os comandos
     existem. O texto foi reescrito — a versao anterior comecava por "Nao e uma
     formula mecanica", e o cadeiaTexto deste mesmo bloco ja da esse aviso.
     Repetido duas vezes na mesma seccao era duplicacao criada pela mudanca. */
  sistemaTitulo: {
    pt: 'Corpo, harness e comandos trabalham em conjunto',
    en: 'Body, harness and controls work together',
    es: 'Cuerpo, harness y mandos trabajan en conjunto',
    fr: 'Corps, harness et commandes travaillent ensemble',
    de: 'Körper, Harness und Steuerung arbeiten zusammen'
  },
  sistemaTexto: {
    pt: 'Nenhuma destas partes funciona isoladamente: corpo, harness e comandos são coordenados durante a pilotagem.',
    en: 'None of these parts works in isolation: body, harness and controls are coordinated while flying.',
    es: 'Ninguna de estas partes funciona aisladamente: cuerpo, harness y mandos se coordinan durante el pilotaje.',
    fr: 'Aucune de ces parties ne fonctionne isolément : corps, harness et commandes sont coordonnés pendant le pilotage.',
    de: 'Keiner dieser Teile funktioniert isoliert: Körper, Harness und Steuerung werden beim Fliegen koordiniert.'
  },
  harnessFiguraAlt: {
    pt: 'Piloto de Parakite suspenso num harness split-leg com pontos assinalados na bacia, pernas, perneiras, harness, pontos de suspensão e comandos',
    en: 'Parakite pilot suspended in a split-leg harness with points marked at the hips, legs, leg straps, harness, suspension points and controls',
    es: 'Piloto de Parakite suspendido en un harness split-leg con puntos señalados en la pelvis, piernas, perneras, harness, puntos de suspensión y mandos',
    fr: 'Pilote de Parakite suspendu dans un harness split-leg avec des points repérés au bassin, aux jambes, aux cuissardes, au harness, aux points de suspension et aux commandes',
    de: 'Parakite-Pilot hängend in einem Split-leg-Harness mit markierten Punkten an Becken, Beinen, Beinschlaufen, Harness, Aufhängepunkten und Steuerung'
  },
  /* A ordem era a dos marcadores 01 a 06 do SVG; desde 14/09/2026 a figura é a
     fotografia do Paulo e mostra-os pela altura no corpo (ver FIG_HARNESS). Bacia e Pernas repetem os
     nomes do bloco 8 de proposito: la sao partes do corpo, aqui sao elos da
     cadeia de carga. E a articulacao entre os dois blocos, nao repeticao. */
  harnessElementos: [
    {
      nome: { pt: 'Bacia', en: 'Hips', es: 'Pelvis', fr: 'Bassin', de: 'Becken' },
      nota: { pt: 'participa na distribuição de carga no harness',
              en: 'takes part in how load is distributed in the harness',
              es: 'participa en la distribución de carga en el harness',
              fr: 'participe à la répartition des charges dans le harness',
              de: 'ist an der Lastverteilung im Harness beteiligt' }
    },
    {
      nome: { pt: 'Pernas', en: 'Legs', es: 'Piernas', fr: 'Jambes', de: 'Beine' },
      nota: { pt: 'a posição de cada perna altera a forma como a carga se distribui',
              en: 'each leg’s position changes how the load is distributed',
              es: 'la posición de cada pierna altera la forma en que se distribuye la carga',
              fr: 'la position de chaque jambe modifie la répartition des charges',
              de: 'die Position jedes Beins verändert die Lastverteilung' }
    },
    {
      nome: { pt: 'Perneiras', en: 'Leg straps', es: 'Perneras',
              fr: 'Cuissardes', de: 'Beinschlaufen' },
      nota: { pt: 'independentes, uma por perna',
              en: 'independent, one per leg',
              es: 'independientes, una por pierna',
              fr: 'indépendantes, une par jambe',
              de: 'unabhängig, eine pro Bein' }
    },
    {
      nome: { pt: 'Harness', en: 'Harness', es: 'Harness', fr: 'Harness', de: 'Harness' },
      nota: { pt: 'liga o piloto aos pontos de suspensão e participa na forma como as alterações de carga chegam ao sistema',
              en: 'connects the pilot to the suspension points and takes part in how load changes reach the system',
              es: 'conecta al piloto con los puntos de suspensión y participa en la forma en que los cambios de carga llegan al sistema',
              fr: 'relie le pilote aux points de suspension et participe à la façon dont les variations de charge atteignent le système',
              de: 'verbindet den Piloten mit den Aufhängepunkten und ist daran beteiligt, wie Lastwechsel das System erreichen' }
    },
    {
      nome: { pt: 'Pontos de suspensão', en: 'Suspension points', es: 'Puntos de suspensión',
              fr: 'Points de suspension', de: 'Aufhängepunkte' },
      nota: { pt: 'é por aqui que a asa se liga ao harness',
              en: 'this is where the wing connects to the harness',
              es: 'es por aquí donde el ala se conecta al harness',
              fr: 'c’est par là que l’aile se relie au harness',
              de: 'hier verbindet sich der Schirm mit dem Harness' }
    },
    {
      nome: { pt: 'Comandos', en: 'Controls', es: 'Mandos', fr: 'Commandes', de: 'Steuerung' },
      nota: { pt: 'atuam diretamente sobre a asa, ao mesmo tempo que o corpo',
              en: 'act directly on the wing, at the same time as the body',
              es: 'actúan directamente sobre el ala, al mismo tiempo que el cuerpo',
              fr: 'agissent directement sur l’aile, en même temps que le corps',
              de: 'wirken direkt auf den Schirm, gleichzeitig mit dem Körper' }
    }
  ],

  cadeiaTitulo: {
    pt: 'Perna, bacia, harness, risers, asa',
    en: 'Leg, hips, harness, risers, wing',
    es: 'Pierna, pelvis, harness, risers, ala',
    fr: 'Jambe, bassin, harness, risers, aile',
    de: 'Bein, Becken, Harness, Risers, Schirm'
  },
  cadeiaElos: {
    pt: ['Perna', 'Bacia', 'Harness', 'Risers', 'Asa'],
    en: ['Leg', 'Hips', 'Harness', 'Risers', 'Wing'],
    es: ['Pierna', 'Pelvis', 'Harness', 'Risers', 'Ala'],
    fr: ['Jambe', 'Bassin', 'Harness', 'Risers', 'Aile'],
    de: ['Bein', 'Becken', 'Harness', 'Risers', 'Schirm']
  },
  /* A cadeia e CONCEPTUAL. Escrito assim de propósito: nao ha aqui uma
     relacao mecanica rigida nem uma receita do tipo "perna X = resposta Y",
     e a pagina nao pode sugerir que ha. */
  cadeiaTexto: {
    pt: 'É uma cadeia conceptual de movimento, carga e resposta — não uma relação mecânica rígida nem uma regra fixa do tipo «esta posição da perna produz esta resposta da asa». Serve para compreender a relação, não para memorizar respostas.',
    en: 'It is a conceptual chain of movement, load and response — not a rigid mechanical relationship, and not a fixed rule of the «this leg position produces this wing response» kind. It is there to understand the relationship, not to memorise answers.',
    es: 'Es una cadena conceptual de movimiento, carga y respuesta — no una relación mecánica rígida ni una regla fija del tipo «esta posición de la pierna produce esta respuesta del ala». Sirve para comprender la relación, no para memorizar respuestas.',
    fr: 'C’est une chaîne conceptuelle de mouvement, de charge et de réponse — pas une relation mécanique rigide, ni une règle figée du type « cette position de jambe produit cette réponse de l’aile ». Elle sert à comprendre la relation, pas à mémoriser des réponses.',
    de: 'Es ist eine konzeptuelle Kette aus Bewegung, Last und Reaktion — keine starre mechanische Beziehung und keine feste Regel nach dem Muster „diese Beinposition erzeugt diese Schirmreaktion“. Sie dient dem Verständnis der Beziehung, nicht dem Auswendiglernen von Antworten.'
  },
  cadeiaFrase: {
    pt: 'A perna não pilota isoladamente. Faz parte de uma cadeia de movimento que começa no piloto e termina na asa.',
    en: 'The leg does not fly the wing on its own. It is part of a chain of movement that starts at the pilot and ends at the wing.',
    es: 'La pierna no pilota aisladamente. Forma parte de una cadena de movimiento que empieza en el piloto y termina en el ala.',
    fr: 'La jambe ne pilote pas isolément. Elle fait partie d’une chaîne de mouvement qui commence au pilote et finit à l’aile.',
    de: 'Das Bein fliegt nicht für sich allein. Es ist Teil einer Bewegungskette, die beim Piloten beginnt und am Schirm endet.'
  },
  sentirTitulo: {
    pt: 'O que o piloto aprende a sentir', en: 'What the pilot learns to feel',
    es: 'Lo que el piloto aprende a sentir', fr: 'Ce que le pilote apprend à sentir',
    de: 'Was der Pilot zu fühlen lernt'
  },
  sentirItens: {
    pt: ['Qual o lado com mais carga', 'O efeito da posição da perna',
         'Como a bacia acompanha', 'A resposta da asa',
         'Quando o input é maior do que o necessário', 'Quando os comandos complementam'],
    en: ['Which side carries more load', 'The effect of the leg’s position',
         'How the hips follow', 'The wing’s response',
         'When the input is larger than needed', 'When the controls complement'],
    es: ['Qué lado tiene más carga', 'El efecto de la posición de la pierna',
         'Cómo acompaña la pelvis', 'La respuesta del ala',
         'Cuándo el input es mayor de lo necesario', 'Cuándo los mandos complementan'],
    fr: ['Quel côté porte le plus de charge', 'L’effet de la position de la jambe',
         'Comment le bassin accompagne', 'La réponse de l’aile',
         'Quand l’input est plus ample que nécessaire', 'Quand les commandes complètent'],
    de: ['Welche Seite mehr Last trägt', 'Die Wirkung der Beinposition',
         'Wie das Becken mitgeht', 'Die Reaktion des Schirms',
         'Wann der Input größer ist als nötig', 'Wann die Steuerung ergänzt']
  },
  groundTitulo: {
    pt: 'Groundhandling: onde o corpo encontra a energia',
    en: 'Groundhandling: where the body meets the energy',
    es: 'Groundhandling: donde el cuerpo encuentra la energía',
    fr: 'Groundhandling : là où le corps rencontre l’énergie',
    de: 'Groundhandling: wo der Körper auf die Energie trifft'
  },
  groundTexto: {
    pt: 'É no chão que tudo isto se trabalha primeiro, com a asa já a gerar energia e o piloto em contacto com o solo. O groundhandling não é um aquecimento: é uma fase da progressão, e é onde o piloto começa a trabalhar posição, movimento, carga e resposta da asa antes da transição para o voo.',
    en: 'It is on the ground that all of this is worked first, with the wing already generating energy and the pilot still in contact with the ground. Groundhandling is not a warm-up: it is a stage of the progression, and it is where the pilot starts working position, movement, load and the wing’s response before the transition to flight.',
    es: 'Es en el suelo donde todo esto se trabaja primero, con el ala ya generando energía y el piloto en contacto con el suelo. El groundhandling no es un calentamiento: es una fase de la progresión, y es donde el piloto empieza a trabajar posición, movimiento, carga y respuesta del ala antes de la transición al vuelo.',
    fr: 'C’est au sol que tout cela se travaille d’abord, avec l’aile qui génère déjà de l’énergie et le pilote en contact avec le sol. Le groundhandling n’est pas un échauffement : c’est une étape de la progression, et c’est là que le pilote commence à travailler position, mouvement, charge et réponse de l’aile avant la transition vers le vol.',
    de: 'Am Boden wird all das zuerst gearbeitet — der Schirm erzeugt schon Energie, der Pilot hat noch Bodenkontakt. Groundhandling ist kein Aufwärmen: es ist eine Etappe der Progression, und dort beginnt der Pilot, Position, Bewegung, Last und die Reaktion des Schirms zu arbeiten, vor dem Übergang zum Flug.'
  },
  groundItens: {
    pt: ['inflação', 'movimento', 'posicionamento', 'resistência à tração', 'pernas',
         'bacia', 'carga', 'corpo e comandos', 'antecipação', 'controlo da energia'],
    en: ['inflation', 'movement', 'positioning', 'resisting the pull', 'legs',
         'hips', 'load', 'body and controls', 'anticipation', 'energy control'],
    es: ['inflado', 'movimiento', 'posicionamiento', 'resistencia a la tracción', 'piernas',
         'pelvis', 'carga', 'cuerpo y mandos', 'anticipación', 'control de la energía'],
    fr: ['gonflage', 'déplacement', 'placement', 'résistance à la traction', 'jambes',
         'bassin', 'charge', 'corps et commandes', 'anticipation', 'contrôle de l’énergie'],
    de: ['Aufziehen', 'Bewegung', 'Positionierung', 'Zug aushalten', 'Beine',
         'Becken', 'Last', 'Körper und Steuerung', 'Antizipation', 'Energiekontrolle']
  },
  videoChao: {
    pt: 'As pernas em groundhandling', en: 'The legs in groundhandling',
    es: 'Las piernas en groundhandling', fr: 'Les jambes en groundhandling',
    de: 'Die Beine beim Groundhandling'
  },
  videoVoo: {
    pt: 'As pernas em voo', en: 'The legs in flight', es: 'Las piernas en vuelo',
    fr: 'Les jambes en vol', de: 'Die Beine im Flug'
  },

  /* ==================================================================
     BLOCO 10 · CORREÇÃO  ·  ler antes de agir
     ================================================================== */

  corrKicker: {
    pt: 'Correção', en: 'Correction', es: 'Corrección', fr: 'Correction', de: 'Korrektur'
  },
  corrTitulo: {
    pt: 'Corrigir cedo é corrigir pouco',
    en: 'Correcting early means correcting less',
    es: 'Corregir temprano es corregir poco',
    fr: 'Corriger tôt, c’est corriger peu',
    de: 'Früh korrigieren heißt wenig korrigieren'
  },
  lerTitulo: {
    pt: 'Ler a asa antes de agir', en: 'Read the wing before acting',
    es: 'Leer el ala antes de actuar', fr: 'Lire l’aile avant d’agir',
    de: 'Den Schirm lesen, bevor man handelt'
  },
  lerCadeia: {
    pt: ['Perceber o início da alteração', 'Interpretar', 'Responder cedo',
         'Intervenção menor'],
    en: ['Notice the change beginning', 'Interpret', 'Respond early', 'Smaller input'],
    es: ['Percibir el inicio del cambio', 'Interpretar', 'Responder temprano',
         'Intervención menor'],
    fr: ['Percevoir le début du changement', 'Interpréter', 'Répondre tôt',
         'Intervention moindre'],
    de: ['Den Beginn der Veränderung wahrnehmen', 'Deuten', 'Früh reagieren',
         'Kleinerer Eingriff']
  },
  lerTexto: {
    pt: 'Isto não é treino de reação sem leitura. A ideia não é ser rápido: é perceber o início de uma alteração, interpretá-la e responder enquanto a resposta ainda pode ser pequena.',
    en: 'This is not training reaction without reading. The point is not to be fast: it is to notice a change beginning, interpret it, and respond while the response can still be small.',
    es: 'Esto no es entrenar la reacción sin lectura. La idea no es ser rápido: es percibir el inicio de un cambio, interpretarlo y responder mientras la respuesta aún puede ser pequeña.',
    fr: 'Ce n’est pas entraîner la réaction sans lecture. L’idée n’est pas d’être rapide : c’est de percevoir le début d’un changement, de l’interpréter et de répondre pendant que la réponse peut encore être petite.',
    de: 'Das ist kein Training von Reaktion ohne Lesen. Es geht nicht um Schnelligkeit, sondern darum, den Beginn einer Veränderung zu bemerken, sie zu deuten und zu reagieren, solange die Reaktion noch klein sein kann.'
  },
  reacaoColunas: [
    {
      rotulo: { pt: 'Reação precoce', en: 'Early reaction', es: 'Reacción temprana',
                fr: 'Réaction précoce', de: 'Frühe Reaktion' },
      etapas: {
        pt: ['Vês o início', 'Gesto pequeno', 'Pouca energia para corrigir'],
        en: ['You see it start', 'Small input', 'Little energy to correct'],
        es: ['Ves el inicio', 'Gesto pequeño', 'Poca energía que corregir'],
        fr: ['Tu vois le début', 'Geste léger', 'Peu d’énergie à corriger'],
        de: ['Du siehst den Anfang', 'Kleiner Impuls', 'Wenig Energie zu korrigieren']
      }
    },
    {
      rotulo: { pt: 'Reação tardia', en: 'Late reaction', es: 'Reacción tardía',
                fr: 'Réaction tardive', de: 'Späte Reaktion' },
      etapas: {
        pt: ['Vês o fim', 'Gesto grande', 'Mais energia para gerir'],
        en: ['You see the end', 'Big input', 'More energy to manage'],
        es: ['Ves el final', 'Gesto grande', 'Más energía que gestionar'],
        fr: ['Tu vois la fin', 'Geste ample', 'Plus d’énergie à gérer'],
        de: ['Du siehst das Ende', 'Großer Impuls', 'Mehr Energie zu verwalten']
      }
    }
  ],

  /* ==================================================================
     BLOCO 11 · ENERGIA  ·  curto de propósito, com duas ligações
     ================================================================== */

  energiaKicker: {
    pt: 'Energia', en: 'Energy', es: 'Energía', fr: 'Énergie', de: 'Energie'
  },
  energiaTitulo: {
    pt: 'Porque a gestão de energia é o centro da formação',
    en: 'Why energy management is the centre of the training',
    es: 'Por qué la gestión de la energía es el centro de la formación',
    fr: 'Pourquoi la gestion de l’énergie est au centre de la formation',
    de: 'Warum Energieverwaltung im Zentrum der Ausbildung steht'
  },
  /* CORRECAO DE SUBSTANCIA, e nao de estilo.
     A versao anterior dizia "velocidade, trajetoria e altura pagam-se umas
     com as outras", tratando tres grandezas como moedas equivalentes. A
     /o-que-e-um-parakite/ diz que a asa "possui principalmente energia
     associada a sua altura e a sua velocidade" e que e ao alterar a
     trajetoria que o piloto converte uma na outra — duas, nao tres.

     A primeira frase daqui vem dessa pagina. A pagina tecnica e a fonte
     canonica dos conceitos aerodinamicos; esta so diz porque e que isso
     interessa no curso. Se a definicao mudar, muda-se la. */
  energiaTexto: {
    pt: 'A asa possui sobretudo energia associada à altura e à velocidade. Ao alterar a trajetória, o piloto pode converter uma na outra e gerir quanto conserva ou transforma durante o voo. No curso isto interessa porque quase tudo o que se treina — corpo, pernas, comandos, correção precoce — existe para que essa gestão seja compreendida e praticada de forma consciente.',
    en: 'A wing mainly holds energy associated with its height and its speed. By changing the trajectory, the pilot can convert one into the other and manage how much is conserved or transformed during the flight. On the course this matters because almost everything trained — body, legs, controls, early correction — exists so that this management is understood and practised consciously.',
    es: 'El ala posee sobre todo energía asociada a la altura y a la velocidad. Al alterar la trayectoria, el piloto puede convertir una en otra y gestionar cuánto conserva o transforma durante el vuelo. En el curso esto importa porque casi todo lo que se entrena — cuerpo, piernas, mandos, corrección temprana — existe para que esa gestión sea comprendida y practicada de forma consciente.',
    fr: 'L’aile possède surtout de l’énergie associée à sa hauteur et à sa vitesse. En modifiant la trajectoire, le pilote peut convertir l’une en l’autre et gérer ce qu’il conserve ou transforme pendant le vol. Dans le cours, cela compte parce que presque tout ce qu’on travaille — corps, jambes, commandes, correction précoce — existe pour que cette gestion soit comprise et pratiquée de manière consciente.',
    de: 'Ein Schirm hat Energie vor allem in seiner Höhe und seiner Geschwindigkeit. Durch Änderung der Bahn kann der Pilot die eine in die andere umwandeln und steuern, wie viel er im Flug bewahrt oder umsetzt. Im Kurs zählt das, weil fast alles, was trainiert wird — Körper, Beine, Steuerung, frühe Korrektur — dazu dient, dass diese Verwaltung verstanden und bewusst geübt wird.'
  },
  energiaLigacao: {
    pt: 'Como funciona a gestão de energia', en: 'How energy management works',
    es: 'Cómo funciona la gestión de la energía', fr: 'Comment fonctionne la gestion de l’énergie',
    de: 'Wie Energieverwaltung funktioniert'
  },
  reflexLigacao: {
    pt: 'O que é o perfil reflex', en: 'What the reflex profile is',
    es: 'Qué es el perfil reflex', fr: 'Ce qu’est le profil reflex',
    de: 'Was das Reflexprofil ist'
  },

  /* ==================================================================
     BLOCO 12 · COMO SE PROGRIDE  (ilha clara)
     ================================================================== */

  progKicker: {
    pt: 'Como se progride', en: 'How you progress', es: 'Cómo se progresa',
    fr: 'Comment on progresse', de: 'Wie man vorankommt'
  },
  progTitulo: {
    pt: 'Não é «Dia 1, Dia 2, Dia 3»',
    en: 'It is not «Day 1, Day 2, Day 3»',
    es: 'No es «Día 1, Día 2, Día 3»',
    fr: 'Ce n’est pas « Jour 1, Jour 2, Jour 3 »',
    de: 'Es ist nicht „Tag 1, Tag 2, Tag 3“'
  },
  progTexto: {
    pt: 'Passa-se ao passo seguinte quando o anterior está consolidado, não quando o calendário diz. Dois pilotos com a mesma experiência de parapente podem levar tempos muito diferentes, e nenhum dos dois está atrasado.',
    en: 'You move to the next step when the previous one is consolidated, not when the calendar says so. Two pilots with the same paragliding experience can take very different amounts of time, and neither of them is behind.',
    es: 'Se pasa al paso siguiente cuando el anterior está consolidado, no cuando lo dice el calendario. Dos pilotos con la misma experiencia de parapente pueden tardar tiempos muy distintos, y ninguno de los dos va con retraso.',
    fr: 'On passe à l’étape suivante quand la précédente est consolidée, pas quand le calendrier le dit. Deux pilotes avec la même expérience de parapente peuvent mettre des temps très différents, et aucun des deux n’est en retard.',
    de: 'Zum nächsten Schritt geht es, wenn der vorherige gefestigt ist — nicht, wenn der Kalender es sagt. Zwei Piloten mit derselben Gleitschirmerfahrung können sehr unterschiedlich lange brauchen, und keiner ist im Rückstand.'
  },
  fasesTitulo: {
    pt: 'A progressão, na prática', en: 'The progression, in practice',
    es: 'La progresión, en la práctica', fr: 'La progression, en pratique',
    de: 'Die Progression in der Praxis'
  },
  fases: {
    pt: ['Avaliar', 'Preparar', 'Introduzir energia', 'Groundhandling',
         'Transição para voo', 'Voar', 'Decidir', 'Autonomia'],
    en: ['Assess', 'Prepare', 'Introduce energy', 'Groundhandling',
         'Transition to flight', 'Fly', 'Decide', 'Autonomy'],
    es: ['Evaluar', 'Preparar', 'Introducir energía', 'Groundhandling',
         'Transición al vuelo', 'Volar', 'Decidir', 'Autonomía'],
    fr: ['Évaluer', 'Préparer', 'Introduire l’énergie', 'Groundhandling',
         'Transition vers le vol', 'Voler', 'Décider', 'Autonomie'],
    de: ['Einschätzen', 'Vorbereiten', 'Energie einführen', 'Groundhandling',
         'Übergang zum Flug', 'Fliegen', 'Entscheiden', 'Autonomie']
  },
  /* 14/09/2026 · A PROGRESSÃO DESENHADA, NÃO NUMERADA
     A grelha de oito cartões 01–08 dizia «Dia 1, Dia 2, Dia 3» por baixo de
     um título que diz o contrário. Passou a dois trilhos — dois pilotos, as
     mesmas fases pela mesma ordem, larguras diferentes — e a uma lista que diz,
     por fase, o que se trabalha e QUANDO se passa à seguinte. Aprovado pelo
     Paulo a partir de uma maqueta.

     O parágrafo que enumerava as fases em prosa saiu: o que só ele dizia
     (trabalho sem asa, exercícios corporais, mini-wings) está agora na
     descrição da fase a que pertence. As larguras dos trilhos são ilustrativas
     e a própria página o diz — não são dias nem horas, e não se inventam. */
  fasesCurtas: {
    pt: ['Avaliar', 'Preparar', 'Energia', 'Groundhandling', 'Transição', 'Voar', 'Decidir', 'Autonomia'],
    en: ['Assess', 'Prepare', 'Energy', 'Groundhandling', 'Transition', 'Fly', 'Decide', 'Autonomy'],
    es: ['Evaluar', 'Preparar', 'Energía', 'Groundhandling', 'Transición', 'Volar', 'Decidir', 'Autonomía'],
    fr: ['Évaluer', 'Préparer', 'Énergie', 'Groundhandling', 'Transition', 'Voler', 'Décider', 'Autonomie'],
    de: ['Einschätzen', 'Vorbereiten', 'Energie', 'Groundhandling', 'Übergang', 'Fliegen', 'Entscheiden', 'Autonomie']
  },
  trilhosPilotos: {
    pt: ['Piloto A', 'Piloto B'], en: ['Pilot A', 'Pilot B'], es: ['Piloto A', 'Piloto B'],
    fr: ['Pilote A', 'Pilote B'], de: ['Pilot A', 'Pilot B']
  },
  trilhosLegenda: {
    pt: 'A ordem é a mesma; o tempo em cada fase é de cada um. Os dois chegam à autonomia.',
    en: 'The order is the same; the time in each phase is each pilot’s own. Both reach autonomy.',
    es: 'El orden es el mismo; el tiempo en cada fase es de cada uno. Los dos llegan a la autonomía.',
    fr: 'L’ordre est le même ; le temps passé dans chaque phase appartient à chacun. Les deux arrivent à l’autonomie.',
    de: 'Die Reihenfolge ist dieselbe; die Zeit in jeder Phase ist bei jedem anders. Beide erreichen die Autonomie.'
  },
  trilhosNota: {
    pt: 'As larguras são ilustrativas: mostram que as fases não duram o mesmo para todos. Não são dias nem horas.',
    en: 'The widths are illustrative: they show that the phases do not last the same for everyone. They are not days or hours.',
    es: 'Los anchos son ilustrativos: muestran que las fases no duran lo mismo para todos. No son días ni horas.',
    fr: 'Les largeurs sont indicatives : elles montrent que les phases ne durent pas autant pour tout le monde. Ce ne sont ni des jours ni des heures.',
    de: 'Die Breiten dienen nur der Veranschaulichung: Sie zeigen, dass die Phasen nicht für alle gleich lang dauern. Es sind weder Tage noch Stunden.'
  },
  quandoRotulo: {
    pt: 'Passa-se quando', en: 'You move on when', es: 'Se pasa cuando',
    fr: 'On passe à la suite quand', de: 'Weiter geht es, wenn'
  },
  /* `o` é o que se trabalha; `q` completa o `quandoRotulo`; a última fase não
     tem «quando» — tem `fim`. */
  fasesDetalhe: [
    {
      o: { pt: 'A experiência, os hábitos e os automatismos que trazes do parapente.',
           en: 'The experience, habits and automatic responses you bring from paragliding.',
           es: 'La experiencia, los hábitos y los automatismos que traes del parapente.',
           fr: 'L’expérience, les habitudes et les automatismes que tu apportes du parapente.',
           de: 'Die Erfahrung, die Gewohnheiten und die Automatismen, die du vom Gleitschirm mitbringst.' },
      q: { pt: 'se sabe por onde começar e a que ritmo.',
           en: 'it is clear where to start and at what pace.',
           es: 'se sabe por dónde empezar y a qué ritmo.',
           fr: 'on sait par où commencer et à quel rythme.',
           de: 'klar ist, wo man anfängt und in welchem Tempo.' }
    },
    {
      o: { pt: 'Trabalho sem asa e exercícios corporais — olhar, postura, tronco, bacia e pernas (Body First).',
           en: 'Work without a wing and body exercises — eyes, posture, torso, hips and legs (Body First).',
           es: 'Trabajo sin ala y ejercicios corporales: mirada, postura, tronco, pelvis y piernas (Body First).',
           fr: 'Travail sans aile et exercices corporels : regard, posture, buste, bassin et jambes (Body First).',
           de: 'Arbeit ohne Schirm und Körperübungen: Blick, Haltung, Oberkörper, Becken und Beine (Body First).' },
      q: { pt: 'o movimento é compreendido e sai correto.',
           en: 'the movement is understood and done correctly.',
           es: 'el movimiento se comprende y sale correcto.',
           fr: 'le mouvement est compris et exécuté correctement.',
           de: 'die Bewegung verstanden ist und richtig gelingt.' }
    },
    {
      o: { pt: 'Mini-wings e a energia da asa introduzida aos poucos, sobre o corpo já preparado.',
           en: 'Mini-wings, and the wing’s energy added little by little, on a body that is already prepared.',
           es: 'Mini-wings y la energía del ala introducida poco a poco, sobre un cuerpo ya preparado.',
           fr: 'Mini-wings, et l’énergie de l’aile introduite peu à peu, sur un corps déjà préparé.',
           de: 'Mini-Wings und die Energie des Schirms, schrittweise eingeführt, auf einem bereits vorbereiteten Körper.' },
      q: { pt: 'corpo e comandos respondem de forma coordenada.',
           en: 'body and controls respond in a coordinated way.',
           es: 'cuerpo y mandos responden de forma coordinada.',
           fr: 'le corps et les commandes répondent de façon coordonnée.',
           de: 'Körper und Steuerung koordiniert reagieren.' }
    },
    {
      o: { pt: 'No chão, com a asa a gerar energia: ler a asa e corrigir cedo.',
           en: 'On the ground, with the wing generating energy: reading the wing and correcting early.',
           es: 'En el suelo, con el ala generando energía: leer el ala y corregir temprano.',
           fr: 'Au sol, avec l’aile qui produit de l’énergie : lire l’aile et corriger tôt.',
           de: 'Am Boden, während der Schirm Energie erzeugt: den Schirm lesen und früh korrigieren.' },
      q: { pt: 'controlas a asa no chão com gestos pequenos.',
           en: 'you control the wing on the ground with small inputs.',
           es: 'controlas el ala en el suelo con gestos pequeños.',
           fr: 'tu contrôles l’aile au sol avec de petits gestes.',
           de: 'du den Schirm am Boden mit kleinen Bewegungen kontrollierst.' }
    },
    {
      o: { pt: 'Do chão para o ar, com o que ficou consolidado no groundhandling.',
           en: 'From the ground into the air, with what was consolidated in groundhandling.',
           es: 'Del suelo al aire, con lo que quedó consolidado en el groundhandling.',
           fr: 'Du sol vers l’air, avec ce qui a été consolidé au groundhandling.',
           de: 'Vom Boden in die Luft, mit dem, was im Groundhandling gefestigt wurde.' },
      q: { pt: 'a transição está segura.',
           en: 'the transition is safe.',
           es: 'la transición es segura.',
           fr: 'la transition est sûre.',
           de: 'der Übergang sicher ist.' }
    },
    {
      o: { pt: 'Gerir a energia — altura e velocidade — de forma consciente.',
           en: 'Managing energy — height and speed — consciously.',
           es: 'Gestionar la energía —altura y velocidad— de forma consciente.',
           fr: 'Gérer l’énergie — hauteur et vitesse — de façon consciente.',
           de: 'Die Energie — Höhe und Geschwindigkeit — bewusst managen.' },
      q: { pt: 'a gestão de energia é compreendida e praticada.',
           en: 'energy management is understood and practised.',
           es: 'la gestión de la energía se comprende y se practica.',
           fr: 'la gestion de l’énergie est comprise et pratiquée.',
           de: 'das Energiemanagement verstanden ist und geübt wird.' }
    },
    {
      o: { pt: 'Vento, local, espaço, obstáculos, margem, nível atual e estado do piloto.',
           en: 'Wind, site, space, obstacles, margin, current level and the pilot’s condition.',
           es: 'Viento, lugar, espacio, obstáculos, margen, nivel actual y estado del piloto.',
           fr: 'Vent, site, espace, obstacles, marge, niveau actuel et état du pilote.',
           de: 'Wind, Gelände, Raum, Hindernisse, Reserve, aktuelles Niveau und Zustand des Piloten.' },
      q: { pt: 'escolhes condições adequadas e sabes quando não voar.',
           en: 'you choose suitable conditions and know when not to fly.',
           es: 'eliges condiciones adecuadas y sabes cuándo no volar.',
           fr: 'tu choisis des conditions adaptées et sais quand ne pas voler.',
           de: 'du passende Bedingungen wählst und weißt, wann du nicht fliegst.' }
    },
    {
      o: { pt: 'Treinar sozinho dentro do teu nível, sem depender constantemente do instrutor.',
           en: 'Training on your own within your level, without constantly depending on the instructor.',
           es: 'Entrenar solo dentro de tu nivel, sin depender constantemente del instructor.',
           fr: 'T’entraîner seul à ton niveau, sans dépendre constamment de l’instructeur.',
           de: 'Allein in deinem Niveau trainieren, ohne ständig vom Ausbilder abzuhängen.' },
      fim: { pt: 'Não é o fim: é onde começa a experiência.',
             en: 'It is not the end: it is where experience begins.',
             es: 'No es el final: es donde empieza la experiencia.',
             fr: 'Ce n’est pas la fin : c’est là que commence l’expérience.',
             de: 'Das ist nicht das Ende: Hier beginnt die Erfahrung.' }
    }
  ],
  instrutorEtapasTitulo: {
    pt: 'A intervenção do instrutor vai diminuindo',
    en: 'The instructor intervenes less and less',
    es: 'La intervención del instructor va disminuyendo',
    fr: 'L’intervention de l’instructeur diminue',
    de: 'Das Eingreifen des Ausbilders nimmt ab'
  },
  /* A faixa vai do instrutor ao piloto; os três momentos marcam-se nela.
     `quem` diz de quem é cada etiqueta: i = instrutor, p = piloto, n = neutra. */
  instrutorExtremos: {
    pt: ['Decide o instrutor', 'Decide o piloto'],
    en: ['The instructor decides', 'The pilot decides'],
    es: ['Decide el instructor', 'Decide el piloto'],
    fr: ['L’instructeur décide', 'Le pilote décide'],
    de: ['Der Ausbilder entscheidet', 'Der Pilot entscheidet']
  },
  momentoRotulo: { pt: 'Momento', en: 'Stage', es: 'Momento', fr: 'Étape', de: 'Phase' },
  instrutorEtapas: [
    {
      quem: ['i', 'n'],
      nota: { pt: 'O instrutor escolhe o exercício e diz o que fazer.',
              en: 'The instructor chooses the exercise and says what to do.',
              es: 'El instructor elige el ejercicio y dice qué hacer.',
              fr: 'L’instructeur choisit l’exercice et dit quoi faire.',
              de: 'Der Ausbilder wählt die Übung und sagt, was zu tun ist.' },
      cadeia: {
        pt: ['Instrutor decide', 'Piloto executa'],
        en: ['Instructor decides', 'Pilot executes'],
        es: ['Instructor decide', 'Piloto ejecuta'],
        fr: ['L’instructeur décide', 'Le pilote exécute'],
        de: ['Ausbilder entscheidet', 'Pilot führt aus']
      }
    },
    {
      quem: ['i', 'p'],
      nota: { pt: 'A decisão passa para o piloto; o instrutor orienta com perguntas.',
              en: 'The decision passes to the pilot; the instructor guides with questions.',
              es: 'La decisión pasa al piloto; el instructor orienta con preguntas.',
              fr: 'La décision passe au pilote ; l’instructeur guide par des questions.',
              de: 'Die Entscheidung geht an den Piloten; der Ausbilder lenkt mit Fragen.' },
      cadeia: {
        pt: ['Instrutor pergunta', 'Piloto pensa e decide'],
        en: ['Instructor asks', 'Pilot thinks and decides'],
        es: ['Instructor pregunta', 'Piloto piensa y decide'],
        fr: ['L’instructeur demande', 'Le pilote réfléchit et décide'],
        de: ['Ausbilder fragt', 'Pilot denkt und entscheidet']
      }
    },
    {
      quem: ['p'],
      nota: { pt: 'O instrutor observa. O piloto observa, interpreta, decide, executa e avalia.',
              en: 'The instructor observes. The pilot observes, interprets, decides, executes and reviews.',
              es: 'El instructor observa. El piloto observa, interpreta, decide, ejecuta y evalúa.',
              fr: 'L’instructeur observe. Le pilote observe, interprète, décide, exécute et évalue.',
              de: 'Der Ausbilder beobachtet. Der Pilot beobachtet, deutet, entscheidet, führt aus und bewertet.' },
      cadeia: {
        pt: ['Piloto faz o ciclo inteiro'],
        en: ['Pilot runs the whole cycle'],
        es: ['El piloto hace el ciclo completo'],
        fr: ['Le pilote fait tout le cycle'],
        de: ['Pilot durchläuft den ganzen Zyklus']
      }
    }
  ],
  /* O terceiro momento desenha-se como CICLO: depois de avaliar, volta-se a
     observar. Era uma fila de cinco etiquetas com setas que partiam no fim da
     linha. */
  cicloPassos: {
    pt: ['observa', 'interpreta', 'decide', 'executa', 'avalia'],
    en: ['observes', 'interprets', 'decides', 'executes', 'reviews'],
    es: ['observa', 'interpreta', 'decide', 'ejecuta', 'evalúa'],
    fr: ['observe', 'interprète', 'décide', 'exécute', 'évalue'],
    de: ['beobachtet', 'deutet', 'entscheidet', 'führt aus', 'bewertet']
  },
  cicloCentro: {
    pt: ['Piloto', 'autónomo'], en: ['Autonomous', 'pilot'], es: ['Piloto', 'autónomo'],
    fr: ['Pilote', 'autonome'], de: ['Autonomer', 'Pilot']
  },
  cicloDestaque: {
    pt: 'É um ciclo, não uma fila.', en: 'It is a cycle, not a queue.', es: 'Es un ciclo, no una fila.',
    fr: 'C’est un cycle, pas une file.', de: 'Es ist ein Kreislauf, keine Reihe.'
  },
  cicloTexto: {
    pt: 'Depois de avaliar, volta-se a observar.', en: 'After reviewing, you go back to observing.',
    es: 'Después de evaluar, se vuelve a observar.', fr: 'Après avoir évalué, on revient à l’observation.',
    de: 'Nach dem Bewerten beginnt man wieder mit dem Beobachten.'
  },
  inesperadoTitulo: {
    pt: 'Quando não corre como esperado', en: 'When it does not go as expected',
    es: 'Cuando no sale como se esperaba', fr: 'Quand ça ne se passe pas comme prévu',
    de: 'Wenn es nicht wie erwartet läuft'
  },
  inesperadoCadeia: {
    pt: ['Observar', 'Adaptar', 'Responder'],
    en: ['Observe', 'Adapt', 'Respond'],
    es: ['Observar', 'Adaptar', 'Responder'],
    fr: ['Observer', 'Adapter', 'Répondre'],
    de: ['Beobachten', 'Anpassen', 'Reagieren']
  },
  inesperadoTexto: {
    pt: 'Autonomia também é perceber quando alguma coisa não está a acontecer como esperavas. Não é um curso de manobras: é a capacidade de lidar com variações e com os próprios erros.',
    en: 'Autonomy is also noticing when something is not happening the way you expected. This is not a manoeuvres course: it is the ability to deal with variation and with your own mistakes.',
    es: 'Autonomía también es darse cuenta de cuándo algo no está ocurriendo como esperabas. No es un curso de maniobras: es la capacidad de lidiar con variaciones y con los propios errores.',
    fr: 'L’autonomie, c’est aussi remarquer quand quelque chose ne se passe pas comme prévu. Ce n’est pas un cours de manœuvres : c’est la capacité de gérer les variations et ses propres erreurs.',
    de: 'Autonomie heißt auch zu merken, wenn etwas nicht so läuft wie erwartet. Das ist kein Manöverkurs: es ist die Fähigkeit, mit Abweichungen und eigenen Fehlern umzugehen.'
  },

  /* ==================================================================
     BLOCO 13 · A DECISÃO
     ================================================================== */

  decKicker: {
    pt: 'A decisão', en: 'The decision', es: 'La decisión',
    fr: 'La décision', de: 'Die Entscheidung'
  },
  decTitulo: {
    pt: 'A decisão de não voar faz parte da pilotagem',
    en: 'Deciding not to fly is part of flying',
    es: 'La decisión de no volar forma parte del pilotaje',
    fr: 'La décision de ne pas voler fait partie du pilotage',
    de: 'Die Entscheidung, nicht zu fliegen, gehört zum Fliegen'
  },
  decTexto: {
    pt: 'Ninguém filma a decisão de não descolar. Mas é a mesma competência que faz um piloto travar antes de precisar de travar, e é a última coisa que se ensina porque depende de todas as outras.',
    en: 'Nobody films the decision not to launch. But it is the same skill that makes a pilot slow down before needing to, and it is the last thing taught because it depends on everything else.',
    es: 'Nadie filma la decisión de no despegar. Pero es la misma competencia que hace que un piloto frene antes de necesitar frenar, y es lo último que se enseña porque depende de todo lo demás.',
    fr: 'Personne ne filme la décision de ne pas décoller. Mais c’est la même compétence qui fait qu’un pilote ralentit avant d’en avoir besoin, et c’est la dernière chose qu’on enseigne parce qu’elle dépend de toutes les autres.',
    de: 'Niemand filmt die Entscheidung, nicht zu starten. Aber es ist dieselbe Fähigkeit, die einen Piloten bremsen lässt, bevor er muss — und sie wird zuletzt gelehrt, weil sie von allem anderen abhängt.'
  },
  factoresTitulo: {
    pt: 'O que entra na decisão', en: 'What goes into the decision',
    es: 'Qué entra en la decisión', fr: 'Ce qui entre dans la décision',
    de: 'Was in die Entscheidung einfließt'
  },
  factores: {
    pt: ['Vento', 'Local', 'Espaço', 'Obstáculos', 'Margem', 'Nível atual',
         'Estado do piloto', 'Objetivo do treino'],
    en: ['Wind', 'Site', 'Space', 'Obstacles', 'Margin', 'Current level',
         'The pilot’s condition', 'The aim of the session'],
    es: ['Viento', 'Lugar', 'Espacio', 'Obstáculos', 'Margen', 'Nivel actual',
         'Estado del piloto', 'Objetivo del entrenamiento'],
    fr: ['Vent', 'Site', 'Espace', 'Obstacles', 'Marge', 'Niveau actuel',
         'État du pilote', 'Objectif de la séance'],
    de: ['Wind', 'Gelände', 'Raum', 'Hindernisse', 'Reserve', 'Aktuelles Niveau',
         'Zustand des Piloten', 'Ziel der Einheit']
  },

  /* ==================================================================
     BLOCO 14 · QUEM ENSINA E ONDE  (ilha clara)
     ================================================================== */

  ensinaKicker: {
    pt: 'Quem ensina e onde', en: 'Who teaches, and where', es: 'Quién enseña y dónde',
    fr: 'Qui enseigne, et où', de: 'Wer unterrichtet, und wo'
  },
  ensinaTitulo: {
    pt: 'Quem dá a formação, onde se realiza e com que equipamento',
    en: 'Who delivers the training, where it happens and with what equipment',
    es: 'Quién da la formación, dónde se realiza y con qué equipamiento',
    fr: 'Qui dispense la formation, où elle se déroule et avec quel matériel',
    de: 'Wer ausbildet, wo es stattfindet und mit welcher Ausrüstung'
  },
  saberTitulo: {
    pt: 'Saber fazer é uma competência. Saber ensinar é outra',
    en: 'Knowing how to do it is one skill. Knowing how to teach it is another',
    es: 'Saber hacer es una competencia. Saber enseñar es otra',
    fr: 'Savoir faire est une compétence. Savoir enseigner en est une autre',
    de: 'Können ist eine Fähigkeit. Unterrichten können ist eine andere'
  },
  saberTexto: {
    pt: 'Saber voar e saber ensinar são competências diferentes. Ensinar exige observar, diagnosticar, corrigir e adaptar a progressão ao piloto — e saber quando não intervir.',
    en: 'Knowing how to fly and knowing how to teach are different skills. Teaching requires observing, diagnosing, correcting and adapting the progression to the pilot — and knowing when not to intervene.',
    es: 'Saber volar y saber enseñar son competencias diferentes. Enseñar exige observar, diagnosticar, corregir y adaptar la progresión al piloto — y saber cuándo no intervenir.',
    fr: 'Savoir voler et savoir enseigner sont deux compétences différentes. Enseigner exige d’observer, de diagnostiquer, de corriger et d’adapter la progression au pilote — et de savoir quand ne pas intervenir.',
    de: 'Fliegen können und unterrichten können sind verschiedene Fähigkeiten. Unterrichten verlangt beobachten, einordnen, korrigieren und die Progression an den Piloten anpassen — und wissen, wann man nicht eingreift.'
  },
  /* 11/09/2026 · AQUI NÃO ESTAVA UM ÚNICO NOME DE LUGAR
     O texto anterior dizia «os spots da zona de Lisboa e da Península de
     Setúbal», o que é verdade e não responde à pergunta. As 2 905 palavras
     da página não tinham Caparica, nem Meco, nem duna, nem praia — medido.

     E foi por aí que a AI Overview do Google respondeu à query «curso
     parakite» em Portugal: nomeou um lugar («em locais como Sesimbra») e o
     concorrente que o tem no título. Quem não diz onde não é citado a
     propósito de onde.

     OS 35 MINUTOS SÃO O FACTO QUE MAIS TRABALHA: um piloto de Lisboa que
     pesa a viagem tem a resposta antes de perguntar, e é uma distância
     verificável em vez de um adjectivo. */
  locaisTexto: {
    pt: 'A formação decorre em spots a menos de 35 minutos de Lisboa, na Península de Setúbal — Alfarim, a Lagoa de Albufeira e a Praia do Meco no concelho de Sesimbra, a Fonte da Telha em Almada. Não há um local fixo: o sítio de cada sessão escolhe-se pelo vento do dia e pelo nível do piloto — não pelo calendário.',
    en: 'The training takes place at sites less than 35 minutes from Lisbon, on the Setúbal Peninsula — Alfarim, Lagoa de Albufeira and Praia do Meco in the municipality of Sesimbra, Fonte da Telha in Almada. There is no fixed location: each session’s site is chosen by the day’s wind and the pilot’s level — not by the calendar.',
    es: 'La formación se realiza en spots a menos de 35 minutos de Lisboa, en la Península de Setúbal — Alfarim, la Lagoa de Albufeira y la Praia do Meco en el municipio de Sesimbra, la Fonte da Telha en Almada. No hay un lugar fijo: el sitio de cada sesión se elige por el viento del día y por el nivel del piloto — no por el calendario.',
    fr: 'La formation se déroule sur des sites à moins de 35 minutes de Lisbonne, sur la péninsule de Setúbal — Alfarim, la Lagoa de Albufeira et la Praia do Meco dans la commune de Sesimbra, la Fonte da Telha à Almada. Il n’y a pas de lieu fixe : le site de chaque séance est choisi selon le vent du jour et le niveau du pilote — pas selon le calendrier.',
    de: 'Die Ausbildung findet an Spots weniger als 35 Minuten von Lissabon entfernt statt, auf der Halbinsel Setúbal — Alfarim, die Lagoa de Albufeira und die Praia do Meco in der Gemeinde Sesimbra, die Fonte da Telha in Almada. Es gibt keinen festen Ort: Der Spot jeder Einheit richtet sich nach dem Wind des Tages und dem Niveau des Piloten — nicht nach dem Kalender.'
  },

  /* OS QUATRO LOCAIS, E A ORDEM É A DO MÉTODO
     O Paulo deu dois papéis e não deu os outros dois: o Alfarim é o do
     groundhandling, a Fonte da Telha é a dos primeiros voos. Para a Lagoa e
     o Meco a resposta dele foi «depende do vento e do nível do piloto» — e
     é isso que está escrito, em vez de lhes inventar uma função.

     A ordem não é geográfica, é pedagógica: chão, primeiros voos, voo. É a
     tese da página — «Tudo começa no chão» — aplicada ao mapa.

     OS TOPÓNIMOS NÃO SE TRADUZEM e por isso `nome` é uma string e não um
     objecto de cinco línguas. O que se traduz é o papel. */
  /* 14/09/2026 · A EQUIPA — nomes e funções dados pelo Paulo. Instrutores:
     Miguel e Cardoso; auxiliares de instrutor: Paulo e Bea. Só o nome e a
     função: nada de percursos, horas ou licenças que ele não tenha dado. */
  equipa: [
    { titulo: { pt: 'Instrutores de Parakite', en: 'Parakite instructors', es: 'Instructores de Parakite',
                fr: 'Instructeurs de Parakite', de: 'Parakite-Ausbilder' },
      pessoas: [{ nome: 'Miguel', foto: 'equipa-miguel' }, { nome: 'Cardoso', foto: 'equipa-cardoso' }] },
    { titulo: { pt: 'Auxiliares de instrutor de Parakite', en: 'Parakite instructor assistants',
                es: 'Auxiliares de instructor de Parakite', fr: 'Assistants instructeurs de Parakite',
                de: 'Parakite-Ausbildungsassistenten' },
      pessoas: [{ nome: 'Paulo', foto: 'equipa-paulo' }, { nome: 'Bea', foto: 'equipa-bea' }] }
  ],
  locais: [
    { id: 'alfarim', nome: 'Alfarim', papel: {
        pt: 'groundhandling', en: 'groundhandling', es: 'groundhandling',
        fr: 'groundhandling', de: 'Groundhandling' } },
    { id: 'fonte-da-telha', nome: 'Fonte da Telha', papel: {
        pt: 'primeiros voos', en: 'first flights', es: 'primeros vuelos',
        fr: 'premiers vols', de: 'erste Flüge' } },
    { id: 'lagoa-de-albufeira', nome: 'Lagoa de Albufeira', papel: {
        pt: 'voo, conforme as condições', en: 'flying, as conditions allow',
        es: 'vuelo, según las condiciones', fr: 'vol, selon les conditions',
        de: 'Fliegen, je nach Bedingungen' } },
    { id: 'praia-do-meco', nome: 'Praia do Meco', papel: {
        pt: 'voo, conforme as condições', en: 'flying, as conditions allow',
        es: 'vuelo, según las condiciones', fr: 'vol, selon les conditions',
        de: 'Fliegen, je nach Bedingungen' } }
  ],
  equipTexto: {
    pt: 'O Parakite e o harness necessários à formação estão incluídos, e o curso é realizado com a Mullet 2. Levas o que levarias para um dia de voo: capacete, calçado que aguente areia, e roupa para o vento que houver.',
    en: 'The Parakite and harness needed for the training are included, and the course is run on the Mullet 2. You bring what you would bring for a day of flying: helmet, footwear that copes with sand, and clothing for whatever wind there is.',
    es: 'El Parakite y el harness necesarios para la formación están incluidos, y el curso se realiza con la Mullet 2. Llevas lo que llevarías para un día de vuelo: casco, calzado que aguante la arena, y ropa para el viento que haya.',
    fr: 'Le Parakite et le harness nécessaires à la formation sont inclus, et le cours se déroule avec la Mullet 2. Tu apportes ce que tu apporterais pour une journée de vol : casque, chaussures qui supportent le sable, et vêtements adaptés au vent du jour.',
    de: 'Der für die Ausbildung nötige Parakite und das Harness sind enthalten, und der Kurs findet mit der Mullet 2 statt. Du bringst mit, was du für einen Flugtag mitbringen würdest: Helm, sandfeste Schuhe und Kleidung für den Wind, der gerade weht.'
  },
  verAsa: {
    pt: 'Ver a Mullet 2', en: 'See the Mullet 2', es: 'Ver la Mullet 2',
    fr: 'Voir la Mullet 2', de: 'Die Mullet 2 ansehen'
  },
  verSpots: {
    pt: 'Onde se voa Parakite em Portugal', en: 'Where Parakite is flown in Portugal',
    es: 'Dónde se vuela Parakite en Portugal', fr: 'Où voler en Parakite au Portugal',
    de: 'Wo man in Portugal Parakite fliegt'
  },

  /* ==================================================================
     BLOCO 15 · PERGUNTAS  (ilha clara)
     A primeira foi reformulada para nao colidir com "Preciso de saber voar
     de parapente antes?" da /parakite-portugal/, e "onde se realiza" saiu
     daqui porque o bloco 14 ja responde.
     ================================================================== */

  faqKicker: { pt: 'Perguntas', en: 'Questions', es: 'Preguntas',
               fr: 'Questions', de: 'Fragen' },
  faqTitulo: {
    pt: 'Perguntas frequentes', en: 'Frequently asked questions',
    es: 'Preguntas frecuentes', fr: 'Questions fréquentes', de: 'Häufige Fragen'
  },
  faq: [
    {
      q: { pt: 'Quanto tempo de parapente preciso de ter?',
           en: 'How much paragliding experience do I need?',
           es: '¿Cuánto tiempo de parapente necesito tener?',
           fr: 'Combien d’expérience en parapente faut-il ?',
           de: 'Wie viel Gleitschirmerfahrung brauche ich?' },
      a: { pt: 'Não há um número. O que conta é o que a avaliação inicial mostrar: experiência, hábitos e respostas já consolidadas. É isso que decide por onde se começa, e é por isso que dois pilotos com as mesmas horas podem seguir caminhos diferentes.',
           en: 'There is no number. What counts is what the initial assessment shows: experience, habits and responses already consolidated. That is what decides where to start, and it is why two pilots with the same hours can follow different paths.',
           es: 'No hay un número. Lo que cuenta es lo que muestre la evaluación inicial: experiencia, hábitos y respuestas ya consolidadas. Eso decide por dónde se empieza, y por eso dos pilotos con las mismas horas pueden seguir caminos distintos.',
           fr: 'Il n’y a pas de chiffre. Ce qui compte, c’est ce que montre l’évaluation initiale : expérience, habitudes et réponses déjà consolidées. C’est cela qui décide par où commencer, et c’est pourquoi deux pilotes avec les mêmes heures peuvent suivre des chemins différents.',
           de: 'Es gibt keine Zahl. Es zählt, was die Eingangseinschätzung zeigt: Erfahrung, Gewohnheiten und schon gefestigte Reaktionen. Das entscheidet, wo man anfängt — und darum können zwei Piloten mit gleichen Stunden verschiedene Wege gehen.' }
    },
    {
      q: { pt: 'Os {dias} dias são obrigatórios?', en: 'Are the {dias} days compulsory?',
           es: '¿Los {dias} días son obligatorios?', fr: 'Les {dias} jours sont-ils obligatoires ?',
           de: 'Sind die {dias} Tage Pflicht?' },
      a: { pt: 'Não. São a duração de referência. Há pilotos que precisam de algumas horas e pilotos que precisam de mais — e existe formação à hora precisamente para isso.',
           en: 'No. They are the reference duration. Some pilots need a few hours and some need more — and the hourly option exists precisely for that.',
           es: 'No. Son la duración de referencia. Hay pilotos que necesitan unas horas y pilotos que necesitan más — y existe formación por horas precisamente para eso.',
           fr: 'Non. C’est la durée de référence. Certains pilotes ont besoin de quelques heures, d’autres de plus — et la formation à l’heure existe justement pour cela.',
           de: 'Nein. Das ist die Richtdauer. Manche Piloten brauchen ein paar Stunden, andere mehr — genau dafür gibt es die stundenweise Ausbildung.' }
    },
    {
      q: { pt: 'Fico autónomo no fim do curso?', en: 'Will I be autonomous at the end?',
           es: '¿Quedo autónomo al final del curso?', fr: 'Serai-je autonome à la fin du cours ?',
           de: 'Bin ich am Ende autonom?' },
      a: { pt: 'O objetivo é a autonomia para continuares a treinar dentro do teu nível, e ela mede-se por critérios, não por dias. Autonomia não é experiência: a experiência vem depois, com as horas que fizeres.',
           en: 'The aim is autonomy to keep training within your own level, and that is measured by criteria, not by days. Autonomy is not experience: experience comes later, with the hours you put in.',
           es: 'El objetivo es la autonomía para seguir entrenando dentro de tu nivel, y se mide por criterios, no por días. Autonomía no es experiencia: la experiencia viene después, con las horas que hagas.',
           fr: 'L’objectif est l’autonomie pour continuer à t’entraîner à ton niveau, et elle se mesure par des critères, pas en jours. L’autonomie n’est pas l’expérience : celle-ci vient après, avec les heures que tu feras.',
           de: 'Das Ziel ist Autonomie, um in deinem Niveau weiter zu trainieren, und die misst sich an Kriterien, nicht an Tagen. Autonomie ist nicht Erfahrung: die kommt später, mit den Stunden.' }
    },
    {
      q: { pt: 'Quanto tempo até voar sozinho?', en: 'How long until I fly on my own?',
           es: '¿Cuánto tiempo hasta volar solo?', fr: 'Combien de temps avant de voler seul ?',
           de: 'Wie lange, bis ich allein fliege?' },
      a: { pt: 'Depende do que estiver consolidado, não do número de sessões. A progressão passa por avaliar, preparar, introduzir energia, groundhandling e transição para voo — e passa-se à fase seguinte quando a anterior está segura, não quando o calendário diz.',
           en: 'It depends on what is consolidated, not on the number of sessions. The progression goes through assessing, preparing, introducing energy, groundhandling and the transition to flight — and you move on when the previous phase is solid, not when the calendar says so.',
           es: 'Depende de lo que esté consolidado, no del número de sesiones. La progresión pasa por evaluar, preparar, introducir energía, groundhandling y transición al vuelo — y se pasa a la fase siguiente cuando la anterior está segura, no cuando lo dice el calendario.',
           fr: 'Cela dépend de ce qui est consolidé, pas du nombre de séances. La progression passe par évaluer, préparer, introduire l’énergie, le groundhandling et la transition vers le vol — et on avance quand la phase précédente est sûre, pas quand le calendrier le dit.',
           de: 'Das hängt davon ab, was gefestigt ist, nicht von der Zahl der Einheiten. Die Progression führt über Einschätzen, Vorbereiten, Energie einführen, Groundhandling und Übergang zum Flug — und weiter geht es, wenn die vorherige Phase sitzt, nicht wenn der Kalender es sagt.' }
    },
    {
      q: { pt: 'O que levo eu, e o que está incluído?', en: 'What do I bring, and what is included?',
           es: '¿Qué llevo yo, y qué está incluido?', fr: 'Qu’est-ce que j’apporte, et qu’est-ce qui est inclus ?',
           de: 'Was bringe ich mit, und was ist enthalten?' },
      a: { pt: 'O Parakite e o harness estão incluídos, e o curso é realizado com a Mullet 2. Levas capacete, calçado que aguente areia e roupa para o vento que houver.',
           en: 'The Parakite and harness are included, and the course is run on the Mullet 2. You bring a helmet, footwear that copes with sand, and clothing for whatever wind there is.',
           es: 'El Parakite y el harness están incluidos, y el curso se realiza con la Mullet 2. Llevas casco, calzado que aguante la arena y ropa para el viento que haya.',
           fr: 'Le Parakite et le harness sont inclus, et le cours se déroule avec la Mullet 2. Tu apportes un casque, des chaussures qui supportent le sable et des vêtements adaptés au vent.',
           de: 'Parakite und Harness sind enthalten, und der Kurs findet mit der Mullet 2 statt. Du bringst Helm, sandfeste Schuhe und Kleidung für den Wind mit.' }
    },
    {
      q: { pt: 'Quantos pilotos por curso?', en: 'How many pilots per course?',
           es: '¿Cuántos pilotos por curso?', fr: 'Combien de pilotes par cours ?',
           de: 'Wie viele Piloten pro Kurs?' },
      a: { pt: 'No máximo {pilotos}. Corrigir corpo e posição exige olhar para uma pessoa de cada vez, e a correção é individual mesmo quando o treino é em grupo.',
           en: 'A maximum of {pilotos}. Correcting body and position means watching one person at a time, and correction is individual even when the training is in a group.',
           es: 'Como máximo {pilotos}. Corregir cuerpo y posición exige mirar a una persona a la vez, y la corrección es individual incluso cuando el entrenamiento es en grupo.',
           fr: 'Au maximum {pilotos}. Corriger le corps et la position demande de regarder une personne à la fois, et la correction est individuelle même quand l’entraînement se fait en groupe.',
           de: 'Höchstens {pilotos}. Körper und Position zu korrigieren heißt, eine Person auf einmal zu beobachten — und die Korrektur ist individuell, auch wenn in der Gruppe trainiert wird.' }
    },
    {
      q: { pt: 'O que acontece se as condições não permitirem voar?',
           en: 'What happens if the conditions do not allow flying?',
           es: '¿Qué pasa si las condiciones no permiten volar?',
           fr: 'Que se passe-t-il si les conditions ne permettent pas de voler ?',
           de: 'Was passiert, wenn die Bedingungen kein Fliegen erlauben?' },
      a: { pt: 'Trabalha-se o que se pode trabalhar — corpo, posições, groundhandling — ou reagenda-se. A decisão de não voar faz parte da pilotagem, e é uma das coisas que o curso ensina.',
           en: 'We work on what can be worked on — body, positions, groundhandling — or we reschedule. Deciding not to fly is part of flying, and it is one of the things the course teaches.',
           es: 'Se trabaja lo que se puede trabajar — cuerpo, posiciones, groundhandling — o se reprograma. La decisión de no volar forma parte del pilotaje, y es una de las cosas que el curso enseña.',
           fr: 'On travaille ce qui peut l’être — corps, positions, groundhandling — ou on reprogramme. La décision de ne pas voler fait partie du pilotage, et c’est une des choses que le cours enseigne.',
           de: 'Man arbeitet an dem, was möglich ist — Körper, Positionen, Groundhandling — oder verlegt den Termin. Die Entscheidung, nicht zu fliegen, gehört zum Fliegen und ist eines der Dinge, die der Kurs lehrt.' }
    },
    {
      q: { pt: 'Qual é a diferença entre autonomia e experiência em Parakite?',
           en: 'What is the difference between autonomy and experience in Parakite?',
           es: '¿Cuál es la diferencia entre autonomía y experiencia en Parakite?',
           fr: 'Quelle est la différence entre autonomie et expérience en Parakite ?',
           de: 'Was ist der Unterschied zwischen Autonomie und Erfahrung beim Parakite?' },
      a: { pt: 'Autonomia é conseguires treinar sozinho dentro do teu nível — compreendes, repetes com intenção, corriges e sabes quando não fazer. Experiência é o que vem depois: ligação com a asa, antecipação, decisão e respostas cada vez mais naturais. A autonomia ensina-se; a experiência acumula-se.',
           en: 'Autonomy is being able to train on your own within your level — you understand, you repeat on purpose, you correct and you know when not to. Experience is what comes after: connection with the wing, anticipation, decision-making and increasingly natural responses. Autonomy is taught; experience accumulates.',
           es: 'Autonomía es poder entrenar solo dentro de tu nivel — comprendes, repites con intención, corriges y sabes cuándo no hacer. La experiencia es lo que viene después: conexión con el ala, anticipación, decisión y respuestas cada vez más naturales. La autonomía se enseña; la experiencia se acumula.',
           fr: 'L’autonomie, c’est pouvoir t’entraîner seul à ton niveau — tu comprends, tu répètes volontairement, tu corriges et tu sais quand ne pas faire. L’expérience vient après : lien avec l’aile, anticipation, décision et réponses de plus en plus naturelles. L’autonomie s’enseigne ; l’expérience s’accumule.',
           de: 'Autonomie heißt, in deinem Niveau allein trainieren zu können — du verstehst, wiederholst absichtlich, korrigierst und weißt, wann nicht. Erfahrung kommt danach: Verbindung zum Schirm, Antizipation, Entscheidung und zunehmend natürliche Reaktionen. Autonomie wird gelehrt; Erfahrung sammelt sich an.' }
    },
    {
      /* Resposta curta de propósito: o assunto tem página própria e é lá que
         está explicado por inteiro. A ligação vai no fim da resposta. */
      q: { pt: 'O que é um perfil reflex?', en: 'What is a reflex profile?',
           es: '¿Qué es un perfil reflex?', fr: 'Qu’est-ce qu’un profil reflex ?',
           de: 'Was ist ein Reflexprofil?' },
      /* CORRECAO DE SUBSTANCIA. A versao anterior dizia "tendencia a manter
         a pressao", o que esta errado: a pressao interna e uma das variaveis
         de que o efeito reflex DEPENDE, e nao algo que ele produza — esta
         assim na /o-que-e-um-parakite/. E omitia a ressalva que a pagina
         tecnica faz questao de dar. Esta versao e curta e nao cria uma
         segunda definicao: e a da pagina canonica, encurtada. */
      a: { pt: 'O reflex é uma característica da geometria do perfil que influencia o momento de pitch e o comportamento longitudinal da asa, especialmente em configurações mais aceleradas. Não elimina a necessidade de pilotagem nem torna a asa imune a colapsos. No curso interessa perceber como esse comportamento influencia a pilotagem e a gestão de energia.',
           en: 'Reflex is a characteristic of the profile’s geometry that influences the wing’s pitch moment and longitudinal behaviour, especially in faster configurations. It does not remove the need to fly the wing, nor does it make it immune to collapses. On the course, what matters is understanding how that behaviour influences flying and energy management.',
           es: 'El reflex es una característica de la geometría del perfil que influye en el momento de pitch y en el comportamiento longitudinal del ala, especialmente en configuraciones más aceleradas. No elimina la necesidad de pilotar ni hace al ala inmune a colapsos. En el curso interesa entender cómo ese comportamiento influye en el pilotaje y en la gestión de la energía.',
           fr: 'Le reflex est une caractéristique de la géométrie du profil qui influence le moment de pitch et le comportement longitudinal de l’aile, surtout dans les configurations plus accélérées. Il n’élimine pas le besoin de piloter et ne rend pas l’aile immune aux fermetures. Dans le cours, ce qui compte est de comprendre comment ce comportement influence le pilotage et la gestion de l’énergie.',
           de: 'Reflex ist eine Eigenschaft der Profilgeometrie, die das Nickmoment und das Längsverhalten des Schirms beeinflusst, besonders in schnelleren Konfigurationen. Es macht das Fliegen nicht überflüssig und den Schirm nicht klappsicher. Im Kurs geht es darum zu verstehen, wie dieses Verhalten das Fliegen und die Energieverwaltung beeinflusst.' }
    }
  ],

  /* ==================================================================
     BLOCO 16 · FALAR
     ================================================================== */

  ctaKicker: {
    pt: 'Falar sobre o curso', en: 'Talk about the course', es: 'Hablar sobre el curso',
    fr: 'Parler du cours', de: 'Über den Kurs sprechen'
  },
  ctaTitulo: {
    pt: 'Diz-nos o que voas hoje. Ajudamos-te a perceber por onde começar',
    en: 'Tell us what you fly today. We will help you work out where to start',
    es: 'Dinos qué vuelas hoy. Te ayudamos a entender por dónde empezar',
    fr: 'Dis-nous ce que tu voles aujourd’hui. Nous t’aidons à voir par où commencer',
    de: 'Sag uns, was du heute fliegst. Wir helfen dir zu sehen, wo du anfängst'
  },
  cta: {
    pt: 'Pedir informações sobre o curso', en: 'Ask about the course',
    es: 'Pedir información sobre el curso', fr: 'Demander des informations sur le cours',
    de: 'Infos zum Kurs anfragen'
  },
  ctaMsg: {
    pt: 'Olá! Voo de parapente e queria informações sobre o Curso de Parakite.',
    en: 'Hi! I fly a paraglider and would like information about the Parakite Course.',
    es: '¡Hola! Vuelo en parapente y quería información sobre el Curso de Parakite.',
    fr: 'Bonjour ! Je vole en parapente et je voudrais des informations sur le Cours de Parakite.',
    de: 'Hallo! Ich fliege Gleitschirm und hätte gern Infos zum Parakite-Kurs.'
  },
  /* 14/09/2026 · AS QUATRO PERGUNTAS DE WHATSAPP (validadas pelo Paulo) vivem
     agora dentro do assistente (`sim.perguntas`). Ficam aqui a frase final da
     mensagem e o texto do botão, que o assistente usa. */
  formFecho: {
    pt: 'Quero perceber qual será o melhor ponto de partida para a minha transição para o Parakite.',
    en: 'I want to work out the best starting point for my transition to the Parakite.',
    es: 'Quiero entender cuál será el mejor punto de partida para mi transición al Parakite.',
    fr: 'Je veux comprendre quel sera le meilleur point de départ pour ma transition vers le Parakite.',
    de: 'Ich möchte herausfinden, was der beste Ausgangspunkt für meinen Umstieg auf den Parakite ist.'
  },
  formBotao: {
    pt: 'Enviar pelo WhatsApp', en: 'Send via WhatsApp', es: 'Enviar por WhatsApp',
    fr: 'Envoyer par WhatsApp', de: 'Per WhatsApp senden'
  },
  verHub: {
    pt: 'Parakite em Portugal', en: 'Parakite in Portugal', es: 'Parakite en Portugal',
    fr: 'Le Parakite au Portugal', de: 'Parakite in Portugal'
  },
  voltar: {
    pt: 'Voltar ao início', en: 'Back to the homepage', es: 'Volver al inicio',
    fr: 'Retour à l’accueil', de: 'Zurück zur Startseite'
  }
};
