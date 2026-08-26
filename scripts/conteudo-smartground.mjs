/**
 * Conteúdo da página /smartground/, nos cinco idiomas.
 * ===================================================
 *
 * Fica num ficheiro à parte porque é TEXTO, e texto revê-se — não se anda a
 * procurá-lo no meio da lógica que constrói o HTML.
 *
 * O português é o original: são as palavras do Paulo, tal como as escreveu
 * ao explicar o método. As outras quatro versões traduzem essas, e nada
 * mais: não há aqui um número, uma data ou uma credencial que ele não tenha
 * dado.
 *
 * "SmartGround", "Parakite", "Quick Response Game" e "mini-wings" não se
 * traduzem — são nomes, e um piloto alemão procura-os em inglês.
 */
export const SG = {
  titulo: {
    pt: 'SmartGround — o método de formação em parakite | Happy Soaring',
    en: 'SmartGround — the parakite training method | Happy Soaring',
    es: 'SmartGround — el método de formación en parakite | Happy Soaring',
    fr: 'SmartGround — la méthode de formation parakite | Happy Soaring',
    de: 'SmartGround — die Parakite-Ausbildungsmethode | Happy Soaring'
  },
  descricao: {
    pt: 'Primeiro automatizamos o piloto, depois acrescentamos a asa. As cinco etapas do método SmartGround, do treino sem asa até ao Parakite.',
    en: 'First we make the pilot automatic, then we add the wing. The five stages of the SmartGround method, from training without a wing to the Parakite.',
    es: 'Primero automatizamos al piloto, después añadimos el ala. Las cinco etapas del método SmartGround, del entrenamiento sin ala al Parakite.',
    fr: 'D’abord on automatise le pilote, ensuite on ajoute l’aile. Les cinq étapes de la méthode SmartGround, de l’entraînement sans aile au Parakite.',
    de: 'Zuerst automatisieren wir den Piloten, dann kommt der Schirm dazu. Die fünf Stufen der SmartGround-Methode, vom Training ohne Schirm bis zum Parakite.'
  },

  kicker: {
    pt: 'O método de formação da Happy Soaring', en: 'Happy Soaring’s training method',
    es: 'El método de formación de Happy Soaring', fr: 'La méthode de formation de Happy Soaring',
    de: 'Die Ausbildungsmethode von Happy Soaring'
  },
  h1a: {
    pt: 'Toda a gente começa pela asa.', en: 'Everyone starts with the wing.',
    es: 'Todo el mundo empieza por el ala.', fr: 'Tout le monde commence par l’aile.',
    de: 'Alle fangen mit dem Schirm an.'
  },
  h1b: {
    pt: 'Nós começamos pelo piloto.', en: 'We start with the pilot.',
    es: 'Nosotros empezamos por el piloto.', fr: 'Nous, on commence par le pilote.',
    de: 'Wir fangen beim Piloten an.'
  },
  tese: {
    pt: 'Primeiro automatizamos o piloto.\nDepois acrescentamos a asa.',
    en: 'First we make the pilot automatic.\nThen we add the wing.',
    es: 'Primero automatizamos al piloto.\nDespués añadimos el ala.',
    fr: 'D’abord on automatise le pilote.\nEnsuite on ajoute l’aile.',
    de: 'Zuerst automatisieren wir den Piloten.\nDann kommt der Schirm dazu.'
  },
  legendaVideo: {
    pt: 'Exercício de memorização muscular, sem asa',
    en: 'Muscle-memory exercise, without a wing',
    es: 'Ejercicio de memorización muscular, sin ala',
    fr: 'Exercice de mémorisation musculaire, sans aile',
    de: 'Übung zur Muskelerinnerung, ohne Schirm'
  },

  abordagens: { pt: 'Duas abordagens', en: 'Two approaches', es: 'Dos enfoques',
                fr: 'Deux approches', de: 'Zwei Ansätze' },
  convLabel: { pt: 'Abordagem convencional', en: 'Conventional approach',
               es: 'Enfoque convencional', fr: 'Approche conventionnelle',
               de: 'Konventioneller Ansatz' },
  convTexto: {
    pt: 'O aluno começa a aprendizagem já com uma asa, tendo de aprender ao mesmo tempo os movimentos do corpo e as respostas da asa.',
    en: 'The student starts out with a wing already in hand, having to learn the body movements and the wing’s responses at the same time.',
    es: 'El alumno empieza el aprendizaje ya con un ala, teniendo que aprender a la vez los movimientos del cuerpo y las respuestas del ala.',
    fr: 'L’élève commence son apprentissage avec une aile en main, devant apprendre en même temps les mouvements du corps et les réactions de l’aile.',
    de: 'Der Schüler beginnt bereits mit einem Schirm und muss die Körperbewegungen und die Reaktionen des Schirms gleichzeitig lernen.'
  },
  sgTexto: {
    pt: 'Primeiro trabalhamos as respostas do piloto. Depois introduzimos progressivamente a energia e a asa.',
    en: 'First we work on the pilot’s responses. Then we introduce the energy and the wing, step by step.',
    es: 'Primero trabajamos las respuestas del piloto. Después introducimos progresivamente la energía y el ala.',
    fr: 'D’abord nous travaillons les réponses du pilote. Ensuite nous introduisons progressivement l’énergie et l’aile.',
    de: 'Zuerst arbeiten wir an den Reaktionen des Piloten. Dann bringen wir Schritt für Schritt die Energie und den Schirm dazu.'
  },

  espinhaKicker: { pt: 'A espinha do método', en: 'The backbone of the method',
                   es: 'La espina del método', fr: 'La colonne vertébrale de la méthode',
                   de: 'Das Rückgrat der Methode' },
  espinhaA: { pt: 'Cinco etapas.', en: 'Five stages.', es: 'Cinco etapas.',
              fr: 'Cinq étapes.', de: 'Fünf Stufen.' },
  espinhaB: { pt: 'O Parakite só entra na quinta.', en: 'The Parakite only arrives in the fifth.',
              es: 'El Parakite solo entra en la quinta.', fr: 'Le Parakite n’arrive qu’à la cinquième.',
              de: 'Der Parakite kommt erst in der fünften dazu.' },
  espinhaSub: {
    pt: 'Começa antes de o aluno tocar numa asa e acompanha-o até ao voo.',
    en: 'It starts before the student touches a wing and stays with them until they fly.',
    es: 'Empieza antes de que el alumno toque un ala y le acompaña hasta el vuelo.',
    fr: 'Elle commence avant que l’élève ne touche une aile et l’accompagne jusqu’au vol.',
    de: 'Sie beginnt, bevor der Schüler einen Schirm anfasst, und begleitet ihn bis zum Flug.'
  },
  cadeia: {
    pt: ['compreender', 'memorizar', 'automatizar', 'adicionar energia', 'Parakite'],
    en: ['understand', 'memorise', 'automate', 'add energy', 'Parakite'],
    es: ['comprender', 'memorizar', 'automatizar', 'añadir energía', 'Parakite'],
    fr: ['comprendre', 'mémoriser', 'automatiser', 'ajouter l’énergie', 'Parakite'],
    de: ['verstehen', 'einprägen', 'automatisieren', 'Energie dazu', 'Parakite']
  },
  fases: {
    pt: ['Preparar o piloto', 'Adicionar energia', 'Parakite'],
    en: ['Prepare the pilot', 'Add energy', 'Parakite'],
    es: ['Preparar al piloto', 'Añadir energía', 'Parakite'],
    fr: ['Préparer le pilote', 'Ajouter l’énergie', 'Parakite'],
    de: ['Den Piloten vorbereiten', 'Energie dazugeben', 'Parakite']
  },

  etapas: [
    {
      nome: { pt: 'Documento SmartGround', en: 'SmartGround document', es: 'Documento SmartGround',
              fr: 'Document SmartGround', de: 'SmartGround-Dokument' },
      texto: {
        pt: 'O aluno aprende técnicas, posições e movimentos — e um vocabulário comum com o formador. A partir daqui, quando ele diz um nome, os dois falam da mesma coisa.',
        en: 'The student learns techniques, positions and movements — and a shared vocabulary with the instructor. From here on, when the instructor names something, both mean the same thing.',
        es: 'El alumno aprende técnicas, posiciones y movimientos — y un vocabulario común con el formador. A partir de aquí, cuando él dice un nombre, los dos hablan de lo mismo.',
        fr: 'L’élève apprend des techniques, des positions et des mouvements — et un vocabulaire commun avec le formateur. Dès lors, quand celui-ci nomme quelque chose, les deux parlent de la même chose.',
        de: 'Der Schüler lernt Techniken, Positionen und Bewegungen — und ein gemeinsames Vokabular mit dem Ausbilder. Von da an meinen beide dasselbe, wenn ein Name fällt.'
      }
    },
    {
      nome: { pt: 'Memorização muscular', en: 'Muscle memory', es: 'Memorización muscular',
              fr: 'Mémorisation musculaire', de: 'Muskelerinnerung' },
      texto: {
        pt: 'Treino sem asa. Repetição das posições e dos movimentos do corpo. Alguns exercícios fazem-se de olhos fechados, para desenvolver memória muscular e consciência corporal.',
        en: 'Training without a wing. Repeating the positions and the body’s movements. Some exercises are done with the eyes closed, to build muscle memory and body awareness.',
        es: 'Entrenamiento sin ala. Repetición de las posiciones y de los movimientos del cuerpo. Algunos ejercicios se hacen con los ojos cerrados, para desarrollar memoria muscular y conciencia corporal.',
        fr: 'Entraînement sans aile. Répétition des positions et des mouvements du corps. Certains exercices se font les yeux fermés, pour développer la mémoire musculaire et la conscience corporelle.',
        de: 'Training ohne Schirm. Wiederholung der Positionen und Körperbewegungen. Manche Übungen macht man mit geschlossenen Augen, um Muskelerinnerung und Körperbewusstsein aufzubauen.'
      }
    },
    {
      nome: { pt: 'Quick Response Game', en: 'Quick Response Game', es: 'Quick Response Game',
              fr: 'Quick Response Game', de: 'Quick Response Game' },
      texto: {
        pt: 'O formador diz o nome de uma posição; o aluno responde com o movimento certo. O objectivo é diminuir progressivamente o tempo entre o estímulo e a resposta.',
        en: 'The instructor calls out the name of a position; the student answers with the right movement. The goal is to shorten the time between the cue and the response, session after session.',
        es: 'El formador dice el nombre de una posición; el alumno responde con el movimiento correcto. El objetivo es reducir progresivamente el tiempo entre el estímulo y la respuesta.',
        fr: 'Le formateur annonce le nom d’une position ; l’élève répond par le bon mouvement. L’objectif est de réduire progressivement le temps entre le signal et la réponse.',
        de: 'Der Ausbilder nennt den Namen einer Position; der Schüler antwortet mit der richtigen Bewegung. Ziel ist es, die Zeit zwischen Reiz und Reaktion Schritt für Schritt zu verkürzen.'
      }
    },
    {
      nome: { pt: 'Treino com mini-wings', en: 'Mini-wing training', es: 'Entrenamiento con mini-wings',
              fr: 'Entraînement en mini-wing', de: 'Training mit Miniwings' },
      texto: {
        pt: 'Asas de 8, 10 e 12 m², e vento moderado a forte quando as condições permitem. Entra a energia de uma asa nos movimentos já aprendidos.',
        en: 'Wings of 8, 10 and 12 m², in moderate to strong wind when conditions allow. The energy of a wing enters movements that are already learned.',
        es: 'Alas de 8, 10 y 12 m², y viento moderado a fuerte cuando las condiciones lo permiten. Entra la energía de un ala en los movimientos ya aprendidos.',
        fr: 'Ailes de 8, 10 et 12 m², par vent modéré à fort quand les conditions le permettent. L’énergie d’une aile entre dans des mouvements déjà appris.',
        de: 'Schirme mit 8, 10 und 12 m², bei mäßigem bis starkem Wind, wenn es die Bedingungen zulassen. Die Energie eines Schirms kommt zu bereits gelernten Bewegungen dazu.'
      }
    },
    {
      nome: { pt: 'Treino com Parakite', en: 'Parakite training', es: 'Entrenamiento con Parakite',
              fr: 'Entraînement en Parakite', de: 'Training mit dem Parakite' },
      texto: {
        pt: 'Só agora entra o Parakite. O aluno já não começa do zero: conhece as posições, os movimentos, o uso do corpo e as respostas.',
        en: 'Only now does the Parakite come in. The student is no longer starting from zero: they know the positions, the movements, how to use the body and how to respond.',
        es: 'Solo ahora entra el Parakite. El alumno ya no empieza de cero: conoce las posiciones, los movimientos, el uso del cuerpo y las respuestas.',
        fr: 'C’est seulement là qu’arrive le Parakite. L’élève ne part plus de zéro : il connaît les positions, les mouvements, l’usage du corps et les réponses.',
        de: 'Erst jetzt kommt der Parakite. Der Schüler fängt nicht mehr bei null an: Er kennt die Positionen, die Bewegungen, den Einsatz des Körpers und die Reaktionen.'
      }
    }
  ],

  transAcaba: { pt: 'Aqui acaba o SmartGround', en: 'This is where SmartGround ends',
                es: 'Aquí acaba el SmartGround', fr: 'Ici s’achève le SmartGround',
                de: 'Hier endet SmartGround' },
  curso: { pt: 'Curso de Parakite', en: 'Parakite Course', es: 'Curso de Parakite',
           fr: 'Cours de Parakite', de: 'Parakite-Kurs' },
  cursoEtapas: {
    pt: ['descolagem', 'voo', 'controlo', 'aterragem'],
    en: ['take-off', 'flight', 'control', 'landing'],
    es: ['despegue', 'vuelo', 'control', 'aterrizaje'],
    fr: ['décollage', 'vol', 'contrôle', 'atterrissage'],
    de: ['Start', 'Flug', 'Kontrolle', 'Landung']
  },

  perigoKicker: { pt: 'Porque é que isto importa', en: 'Why this matters',
                  es: 'Por qué esto importa', fr: 'Pourquoi cela compte',
                  de: 'Warum das wichtig ist' },
  perigoTitulo: {
    pt: 'Numa inflação, a asa gera muita energia em muito pouco tempo.',
    en: 'During an inflation, the wing generates a lot of energy in very little time.',
    es: 'En un inflado, el ala genera mucha energía en muy poco tiempo.',
    fr: 'Lors d’un gonflage, l’aile génère beaucoup d’énergie en très peu de temps.',
    de: 'Beim Aufziehen erzeugt der Schirm in sehr kurzer Zeit viel Energie.'
  },
  perigoTexto: {
    pt: 'Um Parakite pode ser usado com vento forte. E quando essa energia chega, já não há tempo para descobrir o que fazer.',
    en: 'A Parakite can be flown in strong wind. And when that energy arrives, there is no time left to work out what to do.',
    es: 'Un Parakite puede usarse con viento fuerte. Y cuando esa energía llega, ya no hay tiempo para descubrir qué hacer.',
    fr: 'Un Parakite peut être utilisé par vent fort. Et quand cette énergie arrive, il n’y a plus le temps de chercher quoi faire.',
    de: 'Ein Parakite lässt sich bei starkem Wind fliegen. Und wenn diese Energie kommt, bleibt keine Zeit mehr, herauszufinden, was zu tun ist.'
  },

  parapenteTitulo: { pt: 'Já voas de parapente?', en: 'Already fly a paraglider?',
                     es: '¿Ya vuelas en parapente?', fr: 'Tu voles déjà en parapente ?',
                     de: 'Fliegst du schon Gleitschirm?' },
  parapenteTexto: {
    pt: 'A tua experiência é uma vantagem — mas um Parakite exige novas respostas. Energia, comandos, inflação e utilização do corpo têm características próprias. O SmartGround ajuda-te a fazer essa transição de forma estruturada.',
    en: 'Your experience is an advantage — but a Parakite calls for new responses. Energy, brake input, inflation and the use of the body all behave differently. SmartGround helps you make that transition in a structured way.',
    es: 'Tu experiencia es una ventaja — pero un Parakite exige nuevas respuestas. Energía, mandos, inflado y uso del cuerpo tienen características propias. El SmartGround te ayuda a hacer esa transición de forma estructurada.',
    fr: 'Ton expérience est un atout — mais un Parakite exige de nouvelles réponses. L’énergie, les commandes, le gonflage et l’usage du corps ont leurs propres caractéristiques. SmartGround t’aide à faire cette transition de façon structurée.',
    de: 'Deine Erfahrung ist ein Vorteil — aber ein Parakite verlangt neue Reaktionen. Energie, Steuerung, Aufziehen und Körpereinsatz haben ihre eigenen Merkmale. SmartGround hilft dir, diesen Übergang strukturiert zu schaffen.'
  },

  principioKicker: { pt: 'O princípio SmartGround', en: 'The SmartGround principle',
                     es: 'El principio SmartGround', fr: 'Le principe SmartGround',
                     de: 'Das SmartGround-Prinzip' },
  principio: {
    pt: 'Preparamos a resposta antes de ela ser necessária.',
    en: 'We build the response before it is needed.',
    es: 'Preparamos la respuesta antes de que sea necesaria.',
    fr: 'Nous préparons la réponse avant qu’elle ne soit nécessaire.',
    de: 'Wir bereiten die Reaktion vor, bevor sie gebraucht wird.'
  },
  autorKicker: { pt: 'Quem desenvolveu o método', en: 'Who developed the method',
                 es: 'Quién desarrolló el método', fr: 'Qui a développé la méthode',
                 de: 'Wer die Methode entwickelt hat' },
  autorNome: 'Paulo Pereira',
  autorTexto: {
    pt: 'Vinte e três anos a voar, os últimos quatro dedicados ao parakite — muitas horas em várias asas. O SmartGround nasceu daí.',
    en: 'Twenty-three years of flying, the last four devoted to the parakite — many hours across several wings. SmartGround came out of that.',
    es: 'Veintitrés años volando, los últimos cuatro dedicados al parakite — muchas horas en varias alas. El SmartGround nació de ahí.',
    fr: 'Vingt-trois ans de vol, les quatre dernières années consacrées au parakite — beaucoup d’heures sur plusieurs ailes. SmartGround est né de là.',
    de: 'Dreiundzwanzig Jahre Fliegen, die letzten vier davon dem Parakite gewidmet — viele Stunden auf verschiedenen Schirmen. Daraus ist SmartGround entstanden.'
  },

  asaKicker: { pt: 'A asa do curso', en: 'The wing used on the course',
               es: 'El ala del curso', fr: 'L’aile du cours', de: 'Der Schirm des Kurses' },
  asaA: { pt: 'Uma asa para aprender.', en: 'A wing to learn on.', es: 'Un ala para aprender.',
          fr: 'Une aile pour apprendre.', de: 'Ein Schirm zum Lernen.' },
  asaB: { pt: 'Uma asa para evoluir.', en: 'A wing to grow with.', es: 'Un ala para evolucionar.',
          fr: 'Une aile pour progresser.', de: 'Ein Schirm zum Weiterkommen.' },
  asaTexto: {
    pt: 'O Curso de Parakite faz-se com a Mullet 2 — não só fácil nos primeiros exercícios, mas com margem para continuares a evoluir depois de ele acabar.',
    en: 'The Parakite Course is flown on the Mullet 2 — not just easy for the first exercises, but with room to keep progressing after the course ends.',
    es: 'El Curso de Parakite se hace con la Mullet 2 — no solo fácil en los primeros ejercicios, sino con margen para seguir evolucionando cuando acabe.',
    fr: 'Le Cours de Parakite se fait sur la Mullet 2 — pas seulement facile pour les premiers exercices, mais avec de la marge pour continuer à progresser ensuite.',
    de: 'Der Parakite-Kurs findet auf der Mullet 2 statt — nicht nur einfach für die ersten Übungen, sondern mit Luft nach oben für die Zeit danach.'
  },
  verAsa: { pt: 'Ver a Mullet 2', en: 'See the Mullet 2', es: 'Ver la Mullet 2',
            fr: 'Voir la Mullet 2', de: 'Die Mullet 2 ansehen' },

  /* enquanto /curso-parakite-portugal/ não existir, o botão pede informações
     por WhatsApp. Trocado pela página quando ela for feita. */
  cta: { pt: 'Pedir informações sobre o curso', en: 'Ask about the course',
         es: 'Pedir información sobre el curso', fr: 'Demander des informations sur le cours',
         de: 'Infos zum Kurs anfragen' },
  ctaMsg: {
    pt: 'Olá! Queria informações sobre o Curso de Parakite e o método SmartGround.',
    en: 'Hi! I would like information about the Parakite Course and the SmartGround method.',
    es: '¡Hola! Quería información sobre el Curso de Parakite y el método SmartGround.',
    fr: 'Bonjour ! Je voudrais des informations sur le Cours de Parakite et la méthode SmartGround.',
    de: 'Hallo! Ich hätte gern Infos zum Parakite-Kurs und zur SmartGround-Methode.'
  },
  conhecer: { pt: 'Conhecer o método SmartGround', en: 'Discover the SmartGround method',
              es: 'Conocer el método SmartGround', fr: 'Découvrir la méthode SmartGround',
              de: 'Die SmartGround-Methode kennenlernen' },
  asaDoCurso: {
    pt: 'É esta a asa com que se faz o Curso de Parakite, com o método SmartGround: primeiro automatizamos o piloto, depois acrescentamos a asa.',
    en: 'This is the wing the Parakite Course is flown on, using the SmartGround method: first we make the pilot automatic, then we add the wing.',
    es: 'Es esta el ala con la que se hace el Curso de Parakite, con el método SmartGround: primero automatizamos al piloto, después añadimos el ala.',
    fr: 'C’est l’aile sur laquelle se fait le Cours de Parakite, avec la méthode SmartGround : d’abord on automatise le pilote, ensuite on ajoute l’aile.',
    de: 'Auf diesem Schirm findet der Parakite-Kurs statt, nach der SmartGround-Methode: zuerst automatisieren wir den Piloten, dann kommt der Schirm dazu.'
  },
  voltar: { pt: 'Voltar ao início', en: 'Back to the homepage', es: 'Volver al inicio',
            fr: 'Retour à l’accueil', de: 'Zurück zur Startseite' }
};
