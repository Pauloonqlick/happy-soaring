/**
 * Conteúdo da página /o-que-e-um-parakite/, nos cinco idiomas.
 * ===========================================================
 *
 * DE ONDE VEM ESTE TEXTO
 *   De um documento-base do Paulo com quinze respostas técnicas já
 *   fechadas: o que é, como funciona, sistema de controlo, risers, reflex,
 *   as três comparações, gestão de energia, incidência, pitch, hands up e
 *   geometria. Aqui condensa-se e reorganiza-se; não se acrescenta.
 *
 *   As afirmações foram cruzadas com o que o site já dizia (o pilar
 *   /parakite-portugal/ e o modelo do Reflex Lab, que trabalha com Cm₀ e
 *   centro de pressão) e com fontes externas sobre perfis reflex,
 *   incidência versus ângulo de ataque e speedflying. Não apareceu nenhuma
 *   contradição.
 *
 * O QUE ESTA PAGINA NAO DIZ, E PORQUE
 *   - Não fala de tamanho como se fosse o assunto. O tamanho só aparece
 *     nas comparações, e só para dizer que não chega para distinguir nada.
 *     A definição, o hero e os destaques são sobre o sistema de controlo.
 *
 *   - Não nomeia marcas, fabricantes nem modelos. Em lado nenhum: nem no
 *     texto, nem nos títulos, nem no schema, nem no alt. As asas concretas
 *     serviram para validar o texto e ficaram de fora dele.
 *
 *   - Não generaliza uma solução de um projecto a todos os Parakites. Não
 *     há relação de polias universal, número de risers universal nem
 *     geometria universal, e o texto diz isso explicitamente.
 *
 *   - Nunca diz que o reflex impede colapsos. Diz que aumenta margem de
 *     estabilidade em certas configurações, e que não substitui pilotagem.
 *
 *   - Nunca diz que "a energia transforma-se em sustentação". A sustentação
 *     é uma força; o que há é conversão entre energia potencial e cinética.
 */

export const QP = {

  /* ---------------------------------------------------------- metadata */
  title: {
    pt: 'Parakite — o que é e como funciona | Happy Soaring',
    en: 'Parakite — what it is and how it works | Happy Soaring',
    es: 'Parakite — qué es y cómo funciona | Happy Soaring',
    fr: 'Parakite — ce que c’est et comment ça marche | Happy Soaring',
    de: 'Parakite — was es ist und wie es funktioniert | Happy Soaring'
  },
  desc: {
    pt: 'Descobre o que caracteriza um Parakite, como funciona o seu sistema de controlo e como risers, geometria, reflex e gestão de energia influenciam o voo.',
    en: 'Find out what characterises a Parakite, how its control system works, and how risers, geometry, reflex and energy management shape the way it flies.',
    es: 'Descubre qué caracteriza a un Parakite, cómo funciona su sistema de control y cómo los risers, la geometría, el reflex y la energía influyen en el vuelo.',
    fr: 'Découvre ce qui caractérise un Parakite, comment fonctionne son système de commande et comment élévateurs, géométrie, reflex et énergie influencent le vol.',
    de: 'Erfahre, was ein Parakite ausmacht, wie sein Steuersystem funktioniert und wie Tragegurte, Geometrie, Reflex und Energiemanagement das Fliegen prägen.'
  },
  migalha: {
    pt: 'O que é um Parakite?', en: 'What is a Parakite?',
    es: '¿Qué es un Parakite?', fr: 'Qu’est-ce qu’un Parakite ?',
    de: 'Was ist ein Parakite?'
  },
  ogAlt: {
    pt: 'Parakite explicado: sistema de controlo, geometria, reflex e energia.',
    en: 'Parakite explained: control system, geometry, reflex and energy.',
    es: 'Parakite explicado: sistema de control, geometría, reflex y energía.',
    fr: 'Le Parakite expliqué : système de commande, géométrie, reflex et énergie.',
    de: 'Parakite erklärt: Steuersystem, Geometrie, Reflex und Energie.'
  },

  /* ---- as âncoras com que as outras páginas ligam para cá ----
     Ficam aqui e não em cada página de origem: assim as cinco traduções de
     cada âncora vivem ao lado do texto que a página realmente diz, e não há
     duas versões da mesma pergunta espalhadas pelo gerador. */
  ancoraOque: {
    pt: 'O que é um Parakite?', en: 'What is a Parakite?',
    es: '¿Qué es un Parakite?', fr: 'Qu’est-ce qu’un Parakite ?',
    de: 'Was ist ein Parakite?'
  },
  ancoraComo: {
    pt: 'Como funciona um Parakite?', en: 'How does a Parakite work?',
    es: '¿Cómo funciona un Parakite?', fr: 'Comment fonctionne un Parakite ?',
    de: 'Wie funktioniert ein Parakite?'
  },
  ancoraReflex: {
    pt: 'Como funciona o reflex num Parakite?',
    en: 'How reflex works on a Parakite',
    es: 'Cómo funciona el reflex en un Parakite',
    fr: 'Comment fonctionne le reflex sur un Parakite',
    de: 'Wie Reflex beim Parakite funktioniert'
  },

  /* -------------------------------------------------------------- hero */
  /* a etiqueta fica em inglês nas cinco: é o nome do formato, como
     "Reflex Lab", e não uma frase que se leia */
  eyebrow: { pt: 'Parakite explained', en: 'Parakite explained',
             es: 'Parakite explained', fr: 'Parakite explained',
             de: 'Parakite explained' },
  h1: {
    pt: 'O que é um Parakite?', en: 'What is a Parakite?',
    es: '¿Qué es un Parakite?', fr: 'Qu’est-ce qu’un Parakite ?',
    de: 'Was ist ein Parakite?'
  },
  /* a definição do documento-base, sem uma palavra a mais */
  definicao: {
    pt: 'Um Parakite é uma asa flexível caracterizada sobretudo pelo seu sistema de controlo, no qual a atuação dos comandos permite alterar de forma significativa a geometria e a incidência da asa durante o voo.',
    en: 'A Parakite is a flexible wing characterised above all by its control system, in which moving the brakes significantly changes the geometry and the incidence of the wing in flight.',
    es: 'Un Parakite es un ala flexible caracterizada sobre todo por su sistema de control, en el que la actuación de los mandos permite alterar de forma significativa la geometría y la incidencia del ala durante el vuelo.',
    fr: 'Un Parakite est une aile souple caractérisée avant tout par son système de commande : l’action sur les commandes modifie de façon significative la géométrie et l’incidence de l’aile en vol.',
    de: 'Ein Parakite ist ein flexibler Schirm, der vor allem durch sein Steuersystem geprägt ist: Der Zug an den Steuerleinen verändert Geometrie und Anstellwinkel des Schirms im Flug erheblich.'
  },
  fotoAlt: {
    pt: 'Piloto em voo sobre a costa, com as mãos nos comandos e as linhas a subir para a asa.',
    en: 'Pilot in flight over the coast, hands on the brakes and the lines running up to the wing.',
    es: 'Piloto en vuelo sobre la costa, con las manos en los mandos y las líneas subiendo hacia el ala.',
    fr: 'Pilote en vol au-dessus de la côte, mains sur les commandes et suspentes remontant vers l’aile.',
    de: 'Pilot im Flug über der Küste, die Hände an den Steuerleinen, die Leinen laufen zum Schirm hinauf.'
  },
  heroCta: {
    pt: 'Parakite em Portugal', en: 'Parakite in Portugal',
    es: 'Parakite en Portugal', fr: 'Parakite au Portugal',
    de: 'Parakite in Portugal'
  },

  /* ------------------------------------- 1 · o que caracteriza um Parakite */
  s1Kicker: { pt: 'A característica central', en: 'The central characteristic',
              es: 'La característica central', fr: 'La caractéristique centrale',
              de: 'Das zentrale Merkmal' },
  s1H2: {
    pt: 'O sistema de controlo',
    en: 'The control system',
    es: 'El sistema de control',
    fr: 'Le système de commande',
    de: 'Das Steuersystem'
  },
  s1Frase: {
    pt: 'O sistema de controlo permite ao piloto alterar de forma significativa a configuração da asa durante o voo.',
    en: 'The control system lets the pilot significantly change the wing’s configuration in flight.',
    es: 'El sistema de control permite al piloto alterar de forma significativa la configuración del ala durante el vuelo.',
    fr: 'Le système de commande permet au pilote de modifier de façon significative la configuration de l’aile en vol.',
    de: 'Das Steuersystem erlaubt dem Piloten, die Konfiguration des Schirms im Flug erheblich zu verändern.'
  },
  s1P: {
    pt: [
      'Num Parakite, os comandos fazem parte de um sistema integrado com os risers e as linhas, permitindo ao piloto alterar progressivamente a configuração longitudinal da asa durante o voo.',
      'Ao movimentar as mãos, o piloto influencia de forma direta a velocidade, o pitch, a trajetória e a gestão de energia da asa.',
      'A característica diferenciadora está na arquitetura dos risers e dos comandos, e na amplitude de controlo que esse sistema proporciona ao piloto.'
    ],
    en: [
      'On a Parakite the brakes are part of a system integrated with the risers and the lines, letting the pilot progressively change the wing’s longitudinal configuration in flight.',
      'By moving the hands, the pilot directly influences the wing’s speed, pitch, trajectory and energy management.',
      'The distinguishing characteristic lies in the architecture of the risers and the brakes, and in the range of control that system gives the pilot.'
    ],
    es: [
      'En un Parakite, los mandos forman parte de un sistema integrado con los risers y las líneas, permitiendo al piloto alterar progresivamente la configuración longitudinal del ala durante el vuelo.',
      'Al mover las manos, el piloto influye de forma directa en la velocidad, el pitch, la trayectoria y la gestión de energía del ala.',
      'La característica diferenciadora está en la arquitectura de los risers y de los mandos, y en la amplitud de control que ese sistema ofrece al piloto.'
    ],
    fr: [
      'Sur un Parakite, les commandes font partie d’un système intégré aux élévateurs et aux suspentes : le pilote modifie progressivement la configuration longitudinale de l’aile en vol.',
      'En bougeant les mains, il influence directement la vitesse, le tangage, la trajectoire et la gestion de l’énergie de l’aile.',
      'La caractéristique distinctive tient à l’architecture des élévateurs et des commandes, et à l’amplitude de contrôle que ce système offre au pilote.'
    ],
    de: [
      'Beim Parakite sind die Steuerleinen Teil eines Systems, das mit Tragegurten und Leinen zusammenwirkt: Der Pilot verändert damit die Längskonfiguration des Schirms im Flug schrittweise.',
      'Über die Handbewegung beeinflusst er unmittelbar Geschwindigkeit, Nicken, Flugbahn und Energiemanagement des Schirms.',
      'Das Unterscheidende liegt in der Architektur von Tragegurten und Steuerleinen — und in der Steuerbandbreite, die dieses System dem Piloten gibt.'
    ]
  },
  s1Cartoes: {
    pt: [
      ['Asa flexível', 'Pressurizada pelo ar, sem estrutura rígida.'],
      ['Comandos integrados', 'O input não fica limitado ao bordo de fuga.'],
      ['Geometria longitudinal', 'A relação entre grupos de linhas ao longo da corda.'],
      ['Amplitude', 'Quanto dessa configuração o piloto consegue mesmo mudar.']
    ],
    en: [
      ['Flexible wing', 'Pressurised by the air, with no rigid structure.'],
      ['Integrated brakes', 'The input is not confined to the trailing edge.'],
      ['Longitudinal geometry', 'The relation between line groups along the chord.'],
      ['Range', 'How much of that configuration the pilot can actually change.']
    ],
    es: [
      ['Ala flexible', 'Presurizada por el aire, sin estructura rígida.'],
      ['Mandos integrados', 'El input no se limita al borde de fuga.'],
      ['Geometría longitudinal', 'La relación entre grupos de líneas a lo largo de la cuerda.'],
      ['Amplitud', 'Cuánto de esa configuración puede cambiar realmente el piloto.']
    ],
    fr: [
      ['Aile souple', 'Mise en pression par l’air, sans structure rigide.'],
      ['Commandes intégrées', 'L’action ne se limite pas au bord de fuite.'],
      ['Géométrie longitudinale', 'La relation entre groupes de suspentes le long de la corde.'],
      ['Amplitude', 'Ce que le pilote peut réellement modifier dans cette configuration.']
    ],
    de: [
      ['Flexibler Schirm', 'Luftgefüllt, ohne starre Struktur.'],
      ['Integrierte Steuerung', 'Der Eingriff bleibt nicht auf die Hinterkante beschränkt.'],
      ['Längsgeometrie', 'Das Verhältnis der Leinenebenen entlang der Profiltiefe.'],
      ['Bandbreite', 'Wie viel davon der Pilot tatsächlich verändern kann.']
    ]
  },

  /* ---------------------------------------- 2 · como funciona um Parakite */
  s2Kicker: { pt: 'Do input ao voo', en: 'From input to flight',
              es: 'Del input al vuelo', fr: 'De l’action au vol',
              de: 'Vom Eingriff zum Flug' },
  s2H2: {
    pt: 'Como funciona um Parakite',
    en: 'How a Parakite works',
    es: 'Cómo funciona un Parakite',
    fr: 'Comment fonctionne un Parakite',
    de: 'Wie ein Parakite funktioniert'
  },
  s2P: {
    pt: [
      'Os comandos estão integrados com a geometria do sistema de risers. Ao movimentá-los, o piloto não atua apenas sobre o bordo de fuga: pode alterar de forma significativa a geometria longitudinal e a incidência da asa.',
      'Com as mãos mais altas, a asa assume uma configuração mais acelerada. A velocidade aumenta e a trajetória pode tornar-se mais descendente.',
      'Ao baixar progressivamente as mãos, a configuração muda e a velocidade diminui. A energia acumulada em velocidade pode então ser utilizada para alterar a trajetória, reduzir a descida e, em determinadas situações, ganhar temporariamente altura.'
    ],
    en: [
      'The brakes are integrated with the geometry of the riser system. Moving them does not act on the trailing edge alone: it can significantly change the wing’s longitudinal geometry and incidence.',
      'With the hands higher, the wing takes up a more accelerated configuration. Speed increases and the trajectory can become more descending.',
      'Bringing the hands progressively down changes the configuration and speed drops. The energy stored as speed can then be used to change the trajectory, reduce the descent and, in certain situations, temporarily gain height.'
    ],
    es: [
      'Los mandos están integrados con la geometría del sistema de risers. Al moverlos, el piloto no actúa solo sobre el borde de fuga: puede alterar de forma significativa la geometría longitudinal y la incidencia del ala.',
      'Con las manos más altas, el ala adopta una configuración más acelerada. La velocidad aumenta y la trayectoria puede volverse más descendente.',
      'Al bajar progresivamente las manos, la configuración cambia y la velocidad disminuye. La energía acumulada en velocidad puede entonces usarse para alterar la trayectoria, reducir el descenso y, en determinadas situaciones, ganar altura temporalmente.'
    ],
    fr: [
      'Les commandes sont intégrées à la géométrie du système d’élévateurs. En les actionnant, le pilote n’agit pas seulement sur le bord de fuite : il peut modifier de façon significative la géométrie longitudinale et l’incidence de l’aile.',
      'Mains hautes, l’aile prend une configuration plus accélérée. La vitesse augmente et la trajectoire peut devenir plus descendante.',
      'En descendant progressivement les mains, la configuration change et la vitesse diminue. L’énergie accumulée en vitesse peut alors servir à modifier la trajectoire, réduire la descente et, dans certaines situations, reprendre temporairement de la hauteur.'
    ],
    de: [
      'Die Steuerleinen sind in die Geometrie des Tragegurtsystems eingebunden. Wer sie bewegt, wirkt nicht nur auf die Hinterkante: Längsgeometrie und Anstellwinkel des Schirms können sich deutlich ändern.',
      'Mit höheren Händen nimmt der Schirm eine beschleunigtere Konfiguration ein. Die Geschwindigkeit steigt, die Flugbahn kann steiler werden.',
      'Werden die Hände schrittweise gesenkt, ändert sich die Konfiguration und die Geschwindigkeit sinkt. Die in Geschwindigkeit gespeicherte Energie lässt sich dann nutzen, um die Flugbahn zu ändern, das Sinken zu verringern und in bestimmten Situationen kurzzeitig Höhe zu gewinnen.'
    ]
  },
  /* o diagrama: cinco degraus, HTML e CSS, sem desenho aerodinâmico */
  fluxo: {
    pt: ['Input do piloto', 'Comandos', 'Risers + linhas', 'Configuração da asa',
         'Velocidade · pitch · trajetória · energia'],
    en: ['Pilot input', 'Brakes', 'Risers + lines', 'Wing configuration',
         'Speed · pitch · trajectory · energy'],
    es: ['Input del piloto', 'Mandos', 'Risers + líneas', 'Configuración del ala',
         'Velocidad · pitch · trayectoria · energía'],
    fr: ['Action du pilote', 'Commandes', 'Élévateurs + suspentes', 'Configuration de l’aile',
         'Vitesse · tangage · trajectoire · énergie'],
    de: ['Eingriff des Piloten', 'Steuerleinen', 'Tragegurte + Leinen', 'Schirmkonfiguration',
         'Geschwindigkeit · Nicken · Flugbahn · Energie']
  },
  fluxoTit: {
    pt: 'O caminho do input', en: 'The path of the input',
    es: 'El recorrido del input', fr: 'Le chemin de l’action',
    de: 'Der Weg des Eingriffs'
  },
  maos: {
    pt: [['Mãos mais altas', 'Mais velocidade e maior tendência para mergulhar.'],
         ['Mãos mais baixas', 'Menos velocidade e maior capacidade de converter energia.']],
    en: [['Hands higher', 'More speed and a stronger tendency to dive.'],
         ['Hands lower', 'Less speed and more capacity to convert energy.']],
    es: [['Manos más altas', 'Más velocidad y mayor tendencia a picar.'],
         ['Manos más bajas', 'Menos velocidad y mayor capacidad de convertir energía.']],
    fr: [['Mains plus hautes', 'Plus de vitesse et une tendance plus marquée à plonger.'],
         ['Mains plus basses', 'Moins de vitesse et plus de capacité à convertir l’énergie.']],
    de: [['Hände höher', 'Mehr Geschwindigkeit und stärkere Neigung abzutauchen.'],
         ['Hände tiefer', 'Weniger Geschwindigkeit und mehr Spielraum, Energie umzusetzen.']]
  },

  /* ------------------------------------------- 3 · sistema de controlo e risers */
  s3Kicker: { pt: 'Comandos, risers e linhas', en: 'Brakes, risers and lines',
              es: 'Mandos, risers y líneas', fr: 'Commandes, élévateurs et suspentes',
              de: 'Steuerleinen, Tragegurte und Leinen' },
  s3H2: {
    pt: 'O que os risers fazem',
    en: 'What the risers do',
    es: 'Qué hacen los risers',
    fr: 'Ce que font les élévateurs',
    de: 'Was die Tragegurte tun'
  },
  s3P: {
    pt: [
      'Os risers fazem a ligação mecânica entre os diferentes grupos de linhas da asa e os pontos de suspensão do piloto. Num Parakite, podem desempenhar também um papel ativo no sistema de controlo.',
      'Quando o piloto atua nos comandos, o sistema pode alterar de forma coordenada a posição relativa dos diferentes grupos de linhas: alguns passam a ficar relativamente mais curtos ou mais longos em relação aos outros. Isso modifica a forma como diferentes zonas da asa ficam posicionadas ao longo da corda.',
      'Os risers não controlam a asa isoladamente. Fazem parte de um sistema integrado formado pelos comandos, risers, linhas e geometria da própria asa.',
      'O funcionamento correto depende também do comprimento relativo das linhas e do trim. Como cada riser influencia grupos inteiros de linhas, pequenas diferenças de comprimento, desgaste ou assimetria podem alterar a configuração e a resposta da asa.'
    ],
    en: [
      'The risers are the mechanical link between the wing’s different line groups and the pilot’s attachment points. On a Parakite they can also play an active part in the control system.',
      'When the pilot works the brakes, the system can change the relative position of the different line groups in a coordinated way: some become relatively shorter or longer than others. That changes how different areas of the wing sit along the chord.',
      'The risers do not control the wing on their own. They are part of an integrated system made of brakes, risers, lines and the geometry of the wing itself.',
      'Correct behaviour also depends on the relative length of the lines and on the trim. Because each riser influences whole groups of lines, small differences in length, wear or asymmetry can change the wing’s configuration and response.'
    ],
    es: [
      'Los risers son el enlace mecánico entre los distintos grupos de líneas del ala y los puntos de suspensión del piloto. En un Parakite pueden desempeñar además un papel activo en el sistema de control.',
      'Cuando el piloto actúa sobre los mandos, el sistema puede alterar de forma coordinada la posición relativa de los distintos grupos de líneas: algunos quedan relativamente más cortos o más largos que otros. Eso modifica cómo se sitúan distintas zonas del ala a lo largo de la cuerda.',
      'Los risers no controlan el ala de forma aislada. Forman parte de un sistema integrado por mandos, risers, líneas y la geometría del propio ala.',
      'El funcionamiento correcto depende también de la longitud relativa de las líneas y del trim. Como cada riser influye en grupos enteros de líneas, pequeñas diferencias de longitud, desgaste o asimetría pueden alterar la configuración y la respuesta del ala.'
    ],
    fr: [
      'Les élévateurs assurent la liaison mécanique entre les différents groupes de suspentes et les points d’accrochage du pilote. Sur un Parakite, ils peuvent aussi jouer un rôle actif dans le système de commande.',
      'Quand le pilote agit sur les commandes, le système peut modifier de façon coordonnée la position relative des différents groupes de suspentes : certains deviennent relativement plus courts ou plus longs que d’autres. Cela change la façon dont différentes zones de l’aile se placent le long de la corde.',
      'Les élévateurs ne pilotent pas l’aile seuls. Ils font partie d’un ensemble intégré formé par les commandes, les élévateurs, les suspentes et la géométrie de l’aile elle-même.',
      'Le bon fonctionnement dépend aussi de la longueur relative des suspentes et du trim. Comme chaque élévateur agit sur des groupes entiers, de petites différences de longueur, d’usure ou de symétrie peuvent modifier la configuration et la réponse de l’aile.'
    ],
    de: [
      'Die Tragegurte verbinden die verschiedenen Leinenebenen des Schirms mechanisch mit den Aufhängepunkten des Piloten. Beim Parakite können sie zusätzlich aktiver Teil des Steuersystems sein.',
      'Betätigt der Pilot die Steuerleinen, kann das System die relative Lage der Leinenebenen koordiniert verändern: einige werden im Verhältnis kürzer, andere länger. Damit ändert sich, wie die einzelnen Bereiche des Schirms entlang der Profiltiefe stehen.',
      'Die Tragegurte steuern den Schirm nicht allein. Sie gehören zu einem Gesamtsystem aus Steuerleinen, Tragegurten, Leinen und der Geometrie des Schirms selbst.',
      'Das richtige Verhalten hängt auch von den relativen Leinenlängen und vom Trimm ab. Da jeder Tragegurt ganze Leinengruppen beeinflusst, können kleine Unterschiede in Länge, Verschleiß oder Symmetrie Konfiguration und Reaktion verändern.'
    ]
  },
  s3Aviso: {
    pt: 'Não existe uma solução mecânica universal. Consoante o projeto podem existir polias, mixers, cascatas, diferentes grupos de linhas, diferentes relações mecânicas e diferentes amplitudes de movimento. Nenhuma delas, isoladamente, define um Parakite.',
    en: 'There is no universal mechanical solution. Depending on the design there may be pulleys, mixers, cascades, different line groups, different mechanical ratios and different ranges of movement. None of them, on its own, defines a Parakite.',
    es: 'No existe una solución mecánica universal. Según el proyecto puede haber poleas, mixers, cascadas, distintos grupos de líneas, distintas relaciones mecánicas y distintas amplitudes de movimiento. Ninguna de ellas, aisladamente, define un Parakite.',
    fr: 'Il n’existe pas de solution mécanique universelle. Selon le projet, on peut trouver des poulies, des mixers, des cascades, différents groupes de suspentes, différents rapports mécaniques et différentes amplitudes. Aucune, à elle seule, ne définit un Parakite.',
    de: 'Eine universelle mechanische Lösung gibt es nicht. Je nach Konstruktion können Rollen, Mixer, Kaskaden, unterschiedliche Leinenebenen, Übersetzungen und Wege vorkommen. Keine davon definiert für sich allein ein Parakite.'
  },

  /* ------------------------------- 4 · geometria, incidência, pitch, hands up */
  s4Kicker: { pt: 'Quatro conceitos que não são sinónimos',
              en: 'Four concepts that are not synonyms',
              es: 'Cuatro conceptos que no son sinónimos',
              fr: 'Quatre notions qui ne sont pas synonymes',
              de: 'Vier Begriffe, die keine Synonyme sind' },
  s4H2: {
    pt: 'Geometria, incidência e pitch',
    en: 'Geometry, incidence and pitch',
    es: 'Geometría, incidencia y pitch',
    fr: 'Géométrie, incidence et tangage',
    de: 'Geometrie, Anstellwinkel und Nicken'
  },
  s4Defs: {
    pt: [
      ['Geometria', 'A relação entre a forma da asa, o perfil, o plano de linhas, os risers e os comandos. Parte dela pode ser alterada pelo piloto durante o voo.'],
      ['Incidência', 'A configuração geométrica da asa em relação ao seu sistema de suspensão, determinada pela relação entre os grupos de linhas e pelos risers.'],
      ['Pitch', 'O movimento de rotação da asa em torno do seu eixo lateral: o nariz tende a subir ou a descer, e a atitude longitudinal altera-se.'],
      ['Ângulo de ataque', 'O ângulo entre a corda do perfil e o fluxo de ar relativo naquele instante.']
    ],
    en: [
      ['Geometry', 'The relation between wing shape, profile, line plan, risers and brakes. Part of it can be changed by the pilot in flight.'],
      ['Incidence', 'The wing’s geometric configuration relative to its suspension system, set by the relation between line groups and by the risers.'],
      ['Pitch', 'The wing’s rotation about its lateral axis: the nose tends to rise or drop and the longitudinal attitude changes.'],
      ['Angle of attack', 'The angle between the chord of the profile and the relative airflow at that instant.']
    ],
    es: [
      ['Geometría', 'La relación entre la forma del ala, el perfil, el plano de líneas, los risers y los mandos. Parte de ella puede ser alterada por el piloto en vuelo.'],
      ['Incidencia', 'La configuración geométrica del ala respecto a su sistema de suspensión, determinada por la relación entre grupos de líneas y por los risers.'],
      ['Pitch', 'El movimiento de rotación del ala en torno a su eje lateral: el morro tiende a subir o bajar y cambia la actitud longitudinal.'],
      ['Ángulo de ataque', 'El ángulo entre la cuerda del perfil y el flujo de aire relativo en ese instante.']
    ],
    fr: [
      ['Géométrie', 'La relation entre la forme de l’aile, le profil, le plan de suspentage, les élévateurs et les commandes. Une partie peut être modifiée en vol par le pilote.'],
      ['Incidence', 'La configuration géométrique de l’aile par rapport à son système de suspension, définie par la relation entre groupes de suspentes et par les élévateurs.'],
      ['Tangage', 'La rotation de l’aile autour de son axe latéral : le nez tend à monter ou à descendre et l’assiette longitudinale change.'],
      ['Angle d’attaque', 'L’angle entre la corde du profil et le flux d’air relatif à cet instant.']
    ],
    de: [
      ['Geometrie', 'Das Verhältnis von Schirmform, Profil, Leinenplan, Tragegurten und Steuerleinen. Ein Teil davon lässt sich im Flug verändern.'],
      ['Anstellwinkel (geometrisch)', 'Die geometrische Konfiguration des Schirms gegenüber seiner Aufhängung, bestimmt durch das Verhältnis der Leinenebenen und die Tragegurte.'],
      ['Nicken', 'Die Drehung des Schirms um seine Querachse: die Nase steigt oder sinkt, die Längslage ändert sich.'],
      ['Anströmwinkel', 'Der Winkel zwischen Profilsehne und der momentanen relativen Anströmung.']
    ]
  },
  s4P: {
    pt: [
      'Nos Parakites, a incidência não é necessariamente fixa. A atuação dos comandos pode alterar progressivamente a geometria dos risers e das linhas e, com ela, a incidência da asa durante o voo. De forma geral, uma configuração mais acelerada tende a corresponder a menor incidência geométrica; aumentar o input tende a aumentar a incidência e a reduzir a velocidade. A forma exata depende do projeto do sistema de controlo.',
      'Estes conceitos estão relacionados mas não são a mesma coisa. Mesmo que a configuração geométrica da asa não mudasse, o ângulo de ataque poderia variar por causa de uma rajada, de uma mudança de trajetória, de uma manobra ou do movimento da própria asa.',
      'O pitch também não é determinado isoladamente pelo piloto: depende da inércia, da velocidade, da trajetória, do movimento pendular, das rajadas e da estabilidade aerodinâmica do perfil.',
      'O trim faz parte desta geometria. Pequenas alterações relativas no comprimento das linhas podem deslocar a configuração de referência, alterar a simetria, a autoridade dos comandos e o comportamento do reflex. E há uma diferença entre a geometria projetada e a geometria real em serviço: desgaste, nós, reparações ou assimetrias podem modificar a relação entre grupos de linhas mesmo quando a asa parece normal.'
    ],
    en: [
      'On Parakites the incidence is not necessarily fixed. Working the brakes can progressively change the geometry of risers and lines and, with it, the wing’s incidence in flight. Broadly, a more accelerated configuration tends to mean lower geometric incidence; increasing the input tends to raise incidence and reduce speed. The exact behaviour depends on how the control system is designed.',
      'These concepts are related but not the same. Even if the wing’s geometric configuration did not change, the angle of attack could still vary because of a gust, a change of trajectory, a manoeuvre or the movement of the wing itself.',
      'Nor is pitch determined by the pilot alone: it depends on inertia, speed, trajectory, pendular movement, gusts and the aerodynamic stability of the profile.',
      'Trim is part of this geometry. Small relative changes in line length can shift the reference configuration and alter symmetry, brake authority and reflex behaviour. And there is a difference between designed geometry and geometry in service: wear, knots, repairs or asymmetries can change the relation between line groups even when the wing looks normal.'
    ],
    es: [
      'En los Parakites la incidencia no es necesariamente fija. La actuación de los mandos puede alterar progresivamente la geometría de risers y líneas y, con ella, la incidencia del ala en vuelo. En general, una configuración más acelerada tiende a corresponder a menor incidencia geométrica; aumentar el input tiende a aumentar la incidencia y reducir la velocidad. La forma exacta depende del proyecto del sistema de control.',
      'Estos conceptos están relacionados pero no son lo mismo. Aunque la configuración geométrica del ala no cambiara, el ángulo de ataque podría variar por una racha, un cambio de trayectoria, una maniobra o el movimiento de la propia ala.',
      'El pitch tampoco lo determina el piloto de forma aislada: depende de la inercia, la velocidad, la trayectoria, el movimiento pendular, las rachas y la estabilidad aerodinámica del perfil.',
      'El trim forma parte de esta geometría. Pequeñas alteraciones relativas en la longitud de las líneas pueden desplazar la configuración de referencia y alterar la simetría, la autoridad de los mandos y el comportamiento del reflex. Y hay diferencia entre la geometría proyectada y la geometría real en servicio: desgaste, nudos, reparaciones o asimetrías pueden modificar la relación entre grupos de líneas aunque el ala parezca normal.'
    ],
    fr: [
      'Sur un Parakite, l’incidence n’est pas nécessairement fixe. L’action sur les commandes peut modifier progressivement la géométrie des élévateurs et des suspentes et, avec elle, l’incidence de l’aile en vol. En général, une configuration plus accélérée correspond à une incidence géométrique plus faible ; augmenter l’action tend à augmenter l’incidence et à réduire la vitesse. La forme exacte dépend de la conception du système de commande.',
      'Ces notions sont liées mais ne se confondent pas. Même si la configuration géométrique de l’aile ne changeait pas, l’angle d’attaque pourrait varier à cause d’une rafale, d’un changement de trajectoire, d’une manœuvre ou du mouvement de l’aile elle-même.',
      'Le tangage n’est pas non plus déterminé par le seul pilote : il dépend de l’inertie, de la vitesse, de la trajectoire, du mouvement pendulaire, des rafales et de la stabilité aérodynamique du profil.',
      'Le trim fait partie de cette géométrie. De petites variations relatives de longueur de suspentes peuvent déplacer la configuration de référence et modifier la symétrie, l’autorité des commandes et le comportement du reflex. Il faut aussi distinguer la géométrie conçue de la géométrie réelle en service : usure, nœuds, réparations ou asymétries peuvent modifier la relation entre groupes même si l’aile paraît normale.'
    ],
    de: [
      'Beim Parakite ist der geometrische Anstellwinkel nicht zwangsläufig fest. Die Steuerleinen können die Geometrie von Tragegurten und Leinen schrittweise verändern und damit auch den Anstellwinkel im Flug. Grob gilt: eine beschleunigtere Konfiguration bedeutet eher weniger geometrischen Anstellwinkel; mehr Zug erhöht ihn und senkt die Geschwindigkeit. Wie genau, hängt von der Auslegung des Steuersystems ab.',
      'Die Begriffe hängen zusammen, sind aber nicht dasselbe. Selbst wenn sich die geometrische Konfiguration nicht änderte, könnte der Anströmwinkel durch eine Böe, eine geänderte Flugbahn, ein Manöver oder die Eigenbewegung des Schirms schwanken.',
      'Auch das Nicken bestimmt der Pilot nicht allein: Trägheit, Geschwindigkeit, Flugbahn, Pendelbewegung, Böen und die aerodynamische Stabilität des Profils wirken mit.',
      'Der Trimm gehört zu dieser Geometrie. Kleine relative Änderungen der Leinenlängen können die Referenzkonfiguration verschieben und Symmetrie, Steuerautorität und Reflexverhalten verändern. Und es gibt einen Unterschied zwischen konstruierter und tatsächlicher Geometrie: Verschleiß, Knoten, Reparaturen oder Asymmetrien können das Verhältnis der Leinenebenen ändern, auch wenn der Schirm normal aussieht.'
    ]
  },

  /* ------------------------------------------------------- 5 · hands up */
  s5H3: { pt: 'O que significa hands up', en: 'What hands up means',
          es: 'Qué significa hands up', fr: 'Ce que veut dire hands up',
          de: 'Was hands up bedeutet' },
  s5P: {
    pt: [
      'Hands up significa elevar progressivamente os comandos e reduzir o input aplicado pelo piloto. Não significa largar os comandos.',
      'Em muitos sistemas atuais, este movimento permite que a geometria dos risers evolua para uma configuração mais acelerada: a incidência geométrica tende a diminuir, a velocidade aumenta, a asa tende a avançar em pitch e a trajetória pode tornar-se mais descendente. E não é só retirar a deformação do bordo de fuga — o mesmo movimento pode comandar alterações coordenadas entre diferentes grupos de linhas.'
    ],
    en: [
      'Hands up means progressively raising the brakes and reducing the input the pilot applies. It does not mean letting go of the brakes.',
      'In many current systems this movement lets the riser geometry move to a more accelerated configuration: geometric incidence tends to decrease, speed increases, the wing tends to move forward in pitch and the trajectory can become more descending. And it is not just removing the deformation of the trailing edge — the same movement can drive coordinated changes between different line groups.'
    ],
    es: [
      'Hands up significa elevar progresivamente los mandos y reducir el input aplicado por el piloto. No significa soltar los mandos.',
      'En muchos sistemas actuales, este movimiento permite que la geometría de los risers evolucione hacia una configuración más acelerada: la incidencia geométrica tiende a disminuir, la velocidad aumenta, el ala tiende a avanzar en pitch y la trayectoria puede volverse más descendente. Y no es solo retirar la deformación del borde de fuga — el mismo movimiento puede comandar alteraciones coordinadas entre distintos grupos de líneas.'
    ],
    fr: [
      'Hands up signifie remonter progressivement les commandes et réduire l’action appliquée par le pilote. Cela ne veut pas dire lâcher les commandes.',
      'Sur beaucoup de systèmes actuels, ce mouvement laisse la géométrie des élévateurs évoluer vers une configuration plus accélérée : l’incidence géométrique tend à diminuer, la vitesse augmente, l’aile tend à avancer en tangage et la trajectoire peut devenir plus descendante. Et il ne s’agit pas seulement de retirer la déformation du bord de fuite — le même mouvement peut commander des changements coordonnés entre groupes de suspentes.'
    ],
    de: [
      'Hands up heißt, die Steuerleinen schrittweise anzuheben und den Zug zu verringern. Es heißt nicht, die Steuerleinen loszulassen.',
      'In vielen heutigen Systemen wandert die Tragegurtgeometrie dabei in eine beschleunigtere Konfiguration: der geometrische Anstellwinkel sinkt tendenziell, die Geschwindigkeit steigt, der Schirm neigt dazu vorzunicken und die Flugbahn kann steiler werden. Und es geht nicht nur darum, die Verformung der Hinterkante zurückzunehmen — dieselbe Bewegung kann koordinierte Änderungen zwischen Leinenebenen auslösen.'
    ]
  },
  s5Nao: {
    pt: [
      ['Não é máximo planeio', 'Consoante o projeto, o ponto de melhor razão de planeio pode ocorrer antes da posição totalmente libertada. A posição mais alta pode privilegiar velocidade e dive.'],
      ['Não é «reduzir o ângulo de ataque»', 'A configuração geométrica e a incidência podem mudar, mas o ângulo de ataque instantâneo depende também da trajetória e do fluxo de ar relativo.']
    ],
    en: [
      ['It is not best glide', 'Depending on the design, the best glide ratio may occur before the fully released position. The highest position may favour speed and dive.'],
      ['It is not “reducing the angle of attack”', 'The geometric configuration and the incidence can change, but the instantaneous angle of attack also depends on trajectory and relative airflow.']
    ],
    es: [
      ['No es máximo planeo', 'Según el proyecto, el punto de mejor planeo puede ocurrir antes de la posición totalmente liberada. La posición más alta puede privilegiar velocidad y dive.'],
      ['No es «reducir el ángulo de ataque»', 'La configuración geométrica y la incidencia pueden cambiar, pero el ángulo de ataque instantáneo depende también de la trayectoria y del flujo de aire relativo.']
    ],
    fr: [
      ['Ce n’est pas la finesse maximale', 'Selon le projet, la meilleure finesse peut se situer avant la position totalement relâchée. La position la plus haute peut privilégier vitesse et plongée.'],
      ['Ce n’est pas « réduire l’angle d’attaque »', 'La configuration géométrique et l’incidence peuvent changer, mais l’angle d’attaque instantané dépend aussi de la trajectoire et du flux d’air relatif.']
    ],
    de: [
      ['Nicht gleich bestes Gleiten', 'Je nach Auslegung kann die beste Gleitzahl vor der ganz freigegebenen Position liegen. Die höchste Position kann Geschwindigkeit und Dive begünstigen.'],
      ['Nicht gleich „Anstellwinkel verringern“', 'Geometrie und Anstellwinkel können sich ändern, doch der momentane Anströmwinkel hängt auch von Flugbahn und relativer Anströmung ab.']
    ]
  },

  /* --------------------------------------------------- 6 · gestão de energia */
  s6Kicker: { pt: 'Altura, velocidade, trajetória', en: 'Height, speed, trajectory',
              es: 'Altura, velocidad, trayectoria', fr: 'Hauteur, vitesse, trajectoire',
              de: 'Höhe, Geschwindigkeit, Flugbahn' },
  s6H2: {
    pt: 'Gestão de energia',
    en: 'Energy management',
    es: 'Gestión de energía',
    fr: 'Gestion de l’énergie',
    de: 'Energiemanagement'
  },
  s6Frase: {
    pt: 'Parakite flying is energy management.',
    en: 'Parakite flying is energy management.',
    es: 'Parakite flying is energy management.',
    fr: 'Parakite flying is energy management.',
    de: 'Parakite flying is energy management.'
  },
  s6P: {
    pt: [
      'Durante o voo, a asa possui principalmente energia associada à sua altura e à sua velocidade. Ao alterar a configuração e a trajetória, o piloto gere continuamente a relação entre estas duas formas de energia.',
      'Numa trajetória descendente, a perda de altura pode ser convertida em aumento de velocidade. Essa velocidade representa energia que pode ser conservada e utilizada mais tarde. Quando o piloto aumenta progressivamente o input, modifica a configuração e o pitch — e essa velocidade pode então ser usada para alterar a trajetória, reduzir a descida ou, quando existe energia suficiente, realizar uma trajetória ascendente e ganhar temporariamente altura.',
      'A conversão nunca é perfeita. O arrasto dissipa continuamente parte da energia, pelo que cada manobra tem perdas. A eficiência com que uma asa conserva velocidade e permite reutilizá-la depende do desenho, da configuração, da trajetória e da ação do piloto.'
    ],
    en: [
      'In flight the wing mainly holds energy associated with its height and its speed. By changing configuration and trajectory the pilot continuously manages the relation between these two forms of energy.',
      'On a descending trajectory, height lost can be converted into speed gained. That speed is energy which can be conserved and used later. When the pilot progressively increases the input, the configuration and the pitch change — and that speed can then be used to alter the trajectory, reduce the descent or, when there is enough energy, fly an ascending trajectory and temporarily gain height.',
      'The conversion is never perfect. Drag continuously dissipates part of the energy, so every manoeuvre has losses. How efficiently a wing conserves speed and lets it be reused depends on the design, the configuration, the trajectory and the pilot’s action.'
    ],
    es: [
      'Durante el vuelo, el ala posee principalmente energía asociada a su altura y a su velocidad. Al alterar la configuración y la trayectoria, el piloto gestiona continuamente la relación entre estas dos formas de energía.',
      'En una trayectoria descendente, la pérdida de altura puede convertirse en aumento de velocidad. Esa velocidad representa energía que puede conservarse y utilizarse después. Cuando el piloto aumenta progresivamente el input, modifica la configuración y el pitch — y esa velocidad puede entonces usarse para alterar la trayectoria, reducir el descenso o, cuando hay energía suficiente, realizar una trayectoria ascendente y ganar altura temporalmente.',
      'La conversión nunca es perfecta. La resistencia disipa continuamente parte de la energía, por lo que cada maniobra tiene pérdidas. La eficiencia con que un ala conserva velocidad y permite reutilizarla depende del diseño, la configuración, la trayectoria y la acción del piloto.'
    ],
    fr: [
      'En vol, l’aile possède surtout de l’énergie liée à sa hauteur et à sa vitesse. En modifiant la configuration et la trajectoire, le pilote gère en continu la relation entre ces deux formes d’énergie.',
      'Sur une trajectoire descendante, la hauteur perdue peut se convertir en vitesse gagnée. Cette vitesse est de l’énergie qui peut être conservée puis réutilisée. Quand le pilote augmente progressivement l’action, la configuration et le tangage changent — et cette vitesse peut alors servir à modifier la trajectoire, réduire la descente ou, s’il y a assez d’énergie, réaliser une trajectoire ascendante et reprendre temporairement de la hauteur.',
      'La conversion n’est jamais parfaite. La traînée dissipe en continu une partie de l’énergie : chaque manœuvre a des pertes. L’efficacité avec laquelle une aile conserve la vitesse et permet de la réutiliser dépend de la conception, de la configuration, de la trajectoire et de l’action du pilote.'
    ],
    de: [
      'Im Flug trägt der Schirm vor allem Energie, die mit seiner Höhe und seiner Geschwindigkeit zusammenhängt. Über Konfiguration und Flugbahn steuert der Pilot laufend das Verhältnis dieser beiden Energieformen.',
      'Auf einer sinkenden Bahn lässt sich verlorene Höhe in gewonnene Geschwindigkeit umsetzen. Diese Geschwindigkeit ist Energie, die erhalten und später genutzt werden kann. Erhöht der Pilot den Zug schrittweise, ändern sich Konfiguration und Nicklage — und diese Geschwindigkeit kann dann die Flugbahn ändern, das Sinken verringern oder, bei ausreichender Energie, eine steigende Bahn und kurzzeitigen Höhengewinn ermöglichen.',
      'Die Umwandlung ist nie verlustfrei. Der Widerstand baut fortlaufend Energie ab, jedes Manöver kostet also etwas. Wie gut ein Schirm Geschwindigkeit erhält und wieder nutzbar macht, hängt von Auslegung, Konfiguration, Flugbahn und Pilotenhandeln ab.'
    ]
  },
  s6Rigor: {
    pt: 'Um rigor que importa: a energia não se transforma em sustentação. A sustentação é uma força aerodinâmica. O que existe é uma conversão entre energia potencial, associada à altura, e energia cinética, associada à velocidade — enquanto a asa produz as forças necessárias para alterar a trajetória.',
    en: 'One precision that matters: energy does not turn into lift. Lift is an aerodynamic force. What happens is a conversion between potential energy, associated with height, and kinetic energy, associated with speed — while the wing produces the forces needed to change the trajectory.',
    es: 'Un rigor que importa: la energía no se transforma en sustentación. La sustentación es una fuerza aerodinámica. Lo que existe es una conversión entre energía potencial, asociada a la altura, y energía cinética, asociada a la velocidad — mientras el ala produce las fuerzas necesarias para alterar la trayectoria.',
    fr: 'Une rigueur qui compte : l’énergie ne se transforme pas en portance. La portance est une force aérodynamique. Ce qui existe est une conversion entre énergie potentielle, liée à la hauteur, et énergie cinétique, liée à la vitesse — pendant que l’aile produit les forces nécessaires pour modifier la trajectoire.',
    de: 'Eine Genauigkeit, auf die es ankommt: Energie verwandelt sich nicht in Auftrieb. Auftrieb ist eine aerodynamische Kraft. Was stattfindet, ist eine Umwandlung zwischen potenzieller Energie aus der Höhe und kinetischer Energie aus der Geschwindigkeit — während der Schirm die Kräfte erzeugt, die die Flugbahn ändern.'
  },
  s6Tri: {
    pt: ['Altura', 'Velocidade', 'Trajetória'],
    en: ['Height', 'Speed', 'Trajectory'],
    es: ['Altura', 'Velocidad', 'Trayectoria'],
    fr: ['Hauteur', 'Vitesse', 'Trajectoire'],
    de: ['Höhe', 'Geschwindigkeit', 'Flugbahn']
  },

  /* ---------------------------------------------------------- 7 · reflex */
  s7Kicker: { pt: 'Parte do sistema', en: 'Part of the system',
              es: 'Parte del sistema', fr: 'Une partie du système',
              de: 'Teil des Systems' },
  s7H2: { pt: 'Reflex', en: 'Reflex', es: 'Reflex', fr: 'Reflex', de: 'Reflex' },
  s7Frase: {
    pt: 'O reflex é parte do sistema, não a definição.',
    en: 'Reflex is part of the system, not the definition.',
    es: 'El reflex es parte del sistema, no la definición.',
    fr: 'Le reflex fait partie du système, il n’en est pas la définition.',
    de: 'Reflex ist Teil des Systems, nicht die Definition.'
  },
  s7P: {
    pt: [
      'O reflex é uma característica da geometria do perfil aerodinâmico: a zona posterior apresenta uma curvatura que modifica o momento de pitch da asa. Numa asa sem estabilizador horizontal, esta geometria pode contribuir para a estabilidade longitudinal.',
      'Nos Parakites, o perfil reflex assume particular importância nas configurações mais aceleradas, em que a asa tende a voar com menor incidência geométrica e maior velocidade. Nessa condição pode ajudar a estabilizar o comportamento em pitch e aumentar a resistência a perturbações e a determinadas deformações.',
      'O efeito não funciona isoladamente. Depende do desenho do perfil, da pressão interna, da tensão da vela, da geometria das linhas e dos risers, do trim, da carga e da velocidade. Como o sistema de controlo altera a geometria da asa, o efeito reflex disponível pode variar com a posição dos comandos — e por isso pequenas alterações de trim, nós, assimetrias ou interferências podem modificar o comportamento que se espera do perfil.'
    ],
    en: [
      'Reflex is a feature of the aerofoil geometry: the rear part of the profile carries a curvature that modifies the wing’s pitching moment. On a wing with no horizontal stabiliser, this geometry can contribute to longitudinal stability.',
      'On Parakites the reflex profile matters most in more accelerated configurations, where the wing tends to fly with lower geometric incidence and higher speed. In that condition it can help stabilise pitch behaviour and increase resistance to disturbances and to certain deformations.',
      'The effect does not work in isolation. It depends on the profile design, internal pressure, sail tension, line and riser geometry, trim, loading and speed. Because the control system changes the wing’s geometry, the reflex effect available can vary with brake position — which is why small trim changes, knots, asymmetries or interference can alter the behaviour expected of the profile.'
    ],
    es: [
      'El reflex es una característica de la geometría del perfil aerodinámico: la zona posterior presenta una curvatura que modifica el momento de pitch del ala. En un ala sin estabilizador horizontal, esta geometría puede contribuir a la estabilidad longitudinal.',
      'En los Parakites, el perfil reflex adquiere especial importancia en las configuraciones más aceleradas, en las que el ala tiende a volar con menor incidencia geométrica y mayor velocidad. En esa condición puede ayudar a estabilizar el comportamiento en pitch y aumentar la resistencia a perturbaciones y a determinadas deformaciones.',
      'El efecto no funciona de forma aislada. Depende del diseño del perfil, la presión interna, la tensión de la vela, la geometría de líneas y risers, el trim, la carga y la velocidad. Como el sistema de control altera la geometría del ala, el efecto reflex disponible puede variar con la posición de los mandos — por eso pequeñas alteraciones de trim, nudos, asimetrías o interferencias pueden modificar el comportamiento esperado del perfil.'
    ],
    fr: [
      'Le reflex est une caractéristique de la géométrie du profil : la partie arrière présente une courbure qui modifie le moment de tangage de l’aile. Sur une aile sans stabilisateur horizontal, cette géométrie peut contribuer à la stabilité longitudinale.',
      'Sur les Parakites, le profil reflex prend une importance particulière dans les configurations les plus accélérées, où l’aile vole avec une incidence géométrique plus faible et une vitesse plus élevée. Dans cette condition, il peut aider à stabiliser le tangage et augmenter la résistance aux perturbations et à certaines déformations.',
      'L’effet n’agit pas isolément. Il dépend du dessin du profil, de la pression interne, de la tension de la voile, de la géométrie des suspentes et des élévateurs, du trim, de la charge et de la vitesse. Comme le système de commande modifie la géométrie de l’aile, l’effet reflex disponible peut varier avec la position des commandes — d’où l’importance de petites variations de trim, de nœuds, d’asymétries ou d’interférences.'
    ],
    de: [
      'Reflex ist ein Merkmal der Profilgeometrie: der hintere Bereich hat eine Wölbung, die das Nickmoment des Schirms verändert. Bei einem Flügel ohne Höhenleitwerk kann diese Geometrie zur Längsstabilität beitragen.',
      'Beim Parakite ist das Reflexprofil vor allem in beschleunigteren Konfigurationen wichtig, in denen der Schirm mit geringerem geometrischem Anstellwinkel und höherer Geschwindigkeit fliegt. Dort kann es das Nickverhalten stabilisieren und die Widerstandsfähigkeit gegenüber Störungen und bestimmten Verformungen erhöhen.',
      'Die Wirkung steht nicht für sich. Sie hängt von Profilauslegung, Innendruck, Tuchspannung, Leinen- und Tragegurtgeometrie, Trimm, Beladung und Geschwindigkeit ab. Da das Steuersystem die Geometrie verändert, kann der verfügbare Reflexeffekt mit der Bremsstellung schwanken — kleine Trimmänderungen, Knoten, Asymmetrien oder Störungen können das erwartete Verhalten daher verschieben.'
    ]
  },
  s7Limite: {
    pt: 'O reflex aumenta a margem de estabilidade em determinadas configurações, mas não torna a asa impossível de colapsar. Turbulência, baixa pressão interna, deformações, problemas de trim ou inputs inadequados continuam a poder provocar perda de estabilidade. Não substitui a pilotagem — e também não é, por si só, aquilo que define um Parakite.',
    en: 'Reflex increases the stability margin in certain configurations, but it does not make the wing impossible to collapse. Turbulence, low internal pressure, deformations, trim problems or inadequate inputs can still cause a loss of stability. It does not replace piloting — and it is not, on its own, what defines a Parakite.',
    es: 'El reflex aumenta el margen de estabilidad en determinadas configuraciones, pero no hace que el ala sea imposible de colapsar. Turbulencia, baja presión interna, deformaciones, problemas de trim o inputs inadecuados pueden seguir provocando pérdida de estabilidad. No sustituye la pilotaje — y tampoco es, por sí solo, lo que define un Parakite.',
    fr: 'Le reflex augmente la marge de stabilité dans certaines configurations, mais il ne rend pas l’aile impossible à fermer. Turbulence, pression interne faible, déformations, problèmes de trim ou actions inadaptées peuvent encore provoquer une perte de stabilité. Il ne remplace pas le pilotage — et il n’est pas, à lui seul, ce qui définit un Parakite.',
    de: 'Reflex vergrößert die Stabilitätsreserve in bestimmten Konfigurationen, macht den Schirm aber nicht klappunmöglich. Turbulenz, geringer Innendruck, Verformungen, Trimmprobleme oder unpassende Eingriffe können weiterhin zu Stabilitätsverlust führen. Es ersetzt das Fliegen nicht — und es ist für sich allein auch nicht das, was ein Parakite ausmacht.'
  },
  /* ----------------------------------------------------- 8 · comparações */
  s8Kicker: { pt: 'Onde estão as fronteiras', en: 'Where the boundaries are',
              es: 'Dónde están las fronteras', fr: 'Où sont les frontières',
              de: 'Wo die Grenzen liegen' },
  s8H2: {
    pt: 'Parakite, parapente, speedwing e miniwing',
    en: 'Parakite, paraglider, speedwing and miniwing',
    es: 'Parakite, parapente, speedwing y miniwing',
    fr: 'Parakite, parapente, speedwing et miniwing',
    de: 'Parakite, Gleitschirm, Speedwing und Miniwing'
  },
  s8Intro: {
    pt: 'Estas categorias partilham princípios básicos: asa flexível pressurizada pelo ar, linhas, risers e comandos. O que as separa é sobretudo a arquitetura do sistema de controlo e a forma como a configuração da asa é alterada em voo.',
    en: 'These categories share basic principles: a flexible wing pressurised by the air, lines, risers and brakes. What separates them is above all the architecture of the control system and the way the wing’s configuration is changed in flight.',
    es: 'Estas categorías comparten principios básicos: ala flexible presurizada por el aire, líneas, risers y mandos. Lo que las separa es sobre todo la arquitectura del sistema de control y la forma en que se altera la configuración del ala en vuelo.',
    fr: 'Ces catégories partagent des principes de base : aile souple mise en pression par l’air, suspentes, élévateurs et commandes. Ce qui les sépare tient surtout à l’architecture du système de commande et à la façon dont la configuration de l’aile est modifiée en vol.',
    de: 'Diese Kategorien teilen dieselben Grundlagen: ein luftgefüllter flexibler Schirm, Leinen, Tragegurte und Steuerleinen. Was sie trennt, ist vor allem die Architektur des Steuersystems und die Art, wie die Konfiguration im Flug verändert wird.'
  },
  s8Blocos: {
    pt: [
      ['Parapente',
       'Num parapente convencional, os comandos de mão atuam principalmente sobre o bordo de fuga, permitindo dirigir, desacelerar e controlar a asa. O piloto pode ainda alterar incidência e velocidade através de sistemas separados, como o acelerador, e alguns parapentes modernos permitem controlo de pitch pelos risers traseiros — seria incorreto dizer que só se controla pelos travões.',
       'Num Parakite, a função de alterar a configuração está integrada de forma muito mais direta nos comandos principais. Isso cria uma lógica de pilotagem diferente: passar progressivamente entre configurações mais rápidas e mais lentas através dos próprios comandos.'],
      ['Speedwing',
       'Numa speedwing, o controlo direcional é normalmente feito pelos comandos de travão e, em alguns sistemas, também pelos risers traseiros. A velocidade e o ângulo de planeio podem ser ajustados por trimmers ou outros sistemas próprios do projeto.',
       'Num Parakite, o movimento das mãos pode alterar progressivamente a relação entre grupos de linhas e, com isso, a configuração longitudinal e a incidência — permitindo gerir diretamente, pelos comandos, uma ampla variação de velocidade, pitch, trajetória e energia.'],
      ['Miniwing',
       'O termo miniwing é usado de forma ampla para asas derivadas da lógica de pilotagem do parapente. Numa arquitetura convencional, os comandos atuam principalmente sobre o bordo de fuga; quando existem trimmers, estes alteram separadamente velocidade, incidência e planeio.',
       'Num Parakite, alterar a configuração é função dos próprios comandos principais: a interação entre comandos, linhas e geometria dos risers modifica progressivamente a configuração longitudinal e a incidência. Existem projetos que aproximam soluções das duas famílias — a distinção continua a fazer-se pela arquitetura do sistema de controlo.']
    ],
    en: [
      ['Paraglider',
       'On a conventional paraglider the hand brakes act mainly on the trailing edge, allowing the pilot to steer, slow down and control the wing. Incidence and speed can also be changed through separate systems such as the speed bar, and some modern paragliders allow pitch control through the rear risers — it would be wrong to say they are controlled by the brakes alone.',
       'On a Parakite, changing the configuration is integrated far more directly into the main brakes. That creates a different flying logic: moving progressively between faster and slower configurations through the brakes themselves.'],
      ['Speedwing',
       'On a speedwing, directional control is normally through the brakes and, in some systems, also through the rear risers. Speed and glide angle can be adjusted with trimmers or other systems specific to the design.',
       'On a Parakite, the movement of the hands can progressively change the relation between line groups and, with it, the longitudinal configuration and incidence — letting the pilot manage a wide range of speed, pitch, trajectory and energy directly through the brakes.'],
      ['Miniwing',
       'The term miniwing is used broadly for wings derived from paraglider flying logic. In a conventional architecture the brakes act mainly on the trailing edge; where trimmers exist, they separately change speed, incidence and glide.',
       'On a Parakite, changing the configuration is the job of the main brakes themselves: the interaction between brakes, lines and riser geometry progressively modifies the longitudinal configuration and the incidence. Some designs bring solutions from the two families closer — the distinction is still drawn by the architecture of the control system.']
    ],
    es: [
      ['Parapente',
       'En un parapente convencional, los mandos de mano actúan principalmente sobre el borde de fuga, permitiendo dirigir, desacelerar y controlar el ala. El piloto puede además alterar incidencia y velocidad mediante sistemas separados, como el acelerador, y algunos parapentes modernos permiten control de pitch por los risers traseros — sería incorrecto decir que solo se controlan con los frenos.',
       'En un Parakite, la función de alterar la configuración está integrada de forma mucho más directa en los mandos principales. Eso crea una lógica de pilotaje distinta: pasar progresivamente entre configuraciones más rápidas y más lentas mediante los propios mandos.'],
      ['Speedwing',
       'En una speedwing, el control direccional se hace normalmente con los mandos de freno y, en algunos sistemas, también con los risers traseros. La velocidad y el ángulo de planeo pueden ajustarse con trimmers u otros sistemas propios del proyecto.',
       'En un Parakite, el movimiento de las manos puede alterar progresivamente la relación entre grupos de líneas y, con ello, la configuración longitudinal y la incidencia — permitiendo gestionar directamente, con los mandos, una amplia variación de velocidad, pitch, trayectoria y energía.'],
      ['Miniwing',
       'El término miniwing se usa de forma amplia para alas derivadas de la lógica de pilotaje del parapente. En una arquitectura convencional, los mandos actúan principalmente sobre el borde de fuga; cuando hay trimmers, estos alteran por separado velocidad, incidencia y planeo.',
       'En un Parakite, alterar la configuración es función de los propios mandos principales: la interacción entre mandos, líneas y geometría de los risers modifica progresivamente la configuración longitudinal y la incidencia. Existen proyectos que acercan soluciones de las dos familias — la distinción se sigue haciendo por la arquitectura del sistema de control.']
    ],
    fr: [
      ['Parapente',
       'Sur un parapente conventionnel, les commandes agissent principalement sur le bord de fuite, ce qui permet de diriger, ralentir et contrôler l’aile. Le pilote peut aussi modifier incidence et vitesse par des systèmes séparés comme l’accélérateur, et certains parapentes modernes permettent un contrôle du tangage aux élévateurs arrière — il serait faux de dire qu’on ne les pilote qu’aux freins.',
       'Sur un Parakite, la modification de la configuration est intégrée bien plus directement aux commandes principales. Cela crée une logique de pilotage différente : passer progressivement entre configurations rapides et lentes par les commandes elles-mêmes.'],
      ['Speedwing',
       'Sur une speedwing, le contrôle directionnel se fait normalement aux freins et, sur certains systèmes, aussi aux élévateurs arrière. La vitesse et la finesse peuvent être ajustées par des trimmers ou d’autres systèmes propres au projet.',
       'Sur un Parakite, le mouvement des mains peut modifier progressivement la relation entre groupes de suspentes et, avec elle, la configuration longitudinale et l’incidence — permettant de gérer directement, aux commandes, une large plage de vitesse, de tangage, de trajectoire et d’énergie.'],
      ['Miniwing',
       'Le terme miniwing désigne largement des ailes issues de la logique de pilotage du parapente. Dans une architecture conventionnelle, les commandes agissent surtout sur le bord de fuite ; quand des trimmers existent, ils modifient séparément vitesse, incidence et finesse.',
       'Sur un Parakite, modifier la configuration est le rôle des commandes principales elles-mêmes : l’interaction entre commandes, suspentes et géométrie des élévateurs modifie progressivement la configuration longitudinale et l’incidence. Certains projets rapprochent les solutions des deux familles — la distinction se fait toujours par l’architecture du système de commande.']
    ],
    de: [
      ['Gleitschirm',
       'Beim konventionellen Gleitschirm wirken die Steuerleinen vor allem auf die Hinterkante — damit wird gelenkt, verlangsamt und kontrolliert. Anstellwinkel und Geschwindigkeit lassen sich über getrennte Systeme wie das Beschleunigersystem ändern, und manche moderne Schirme erlauben Nicksteuerung über die hinteren Tragegurte — zu sagen, sie würden nur über die Bremsen gesteuert, wäre falsch.',
       'Beim Parakite ist das Verändern der Konfiguration weit direkter in die Hauptsteuerung eingebunden. Daraus entsteht eine andere Fluglogik: schrittweise zwischen schnelleren und langsameren Konfigurationen wechseln, über die Steuerleinen selbst.'],
      ['Speedwing',
       'Bei einer Speedwing erfolgt die Richtungssteuerung normalerweise über die Bremsen und in manchen Systemen auch über die hinteren Tragegurte. Geschwindigkeit und Gleitwinkel lassen sich über Trimmer oder andere konstruktionsspezifische Systeme einstellen.',
       'Beim Parakite kann die Handbewegung das Verhältnis der Leinenebenen schrittweise verändern und damit Längskonfiguration und Anstellwinkel — der Pilot steuert Geschwindigkeit, Nicken, Flugbahn und Energie direkt über die Steuerleinen.'],
      ['Miniwing',
       'Der Begriff Miniwing wird weit gefasst für Schirme verwendet, die aus der Flug- und Steuerlogik des Gleitschirms abgeleitet sind. In konventioneller Bauweise wirken die Bremsen vor allem auf die Hinterkante; wo Trimmer vorhanden sind, ändern sie Geschwindigkeit, Anstellwinkel und Gleiten getrennt.',
       'Beim Parakite ist das Verändern der Konfiguration Aufgabe der Hauptsteuerung selbst: Das Zusammenspiel von Steuerleinen, Leinen und Tragegurtgeometrie verschiebt Längskonfiguration und Anstellwinkel schrittweise. Manche Konstruktionen nähern Lösungen beider Familien an — unterschieden wird weiterhin über die Architektur des Steuersystems.']
    ]
  },
  s8Speed: {
    pt: 'Speedflying é uma modalidade, não uma categoria de asa. Existem Parakites concebidos especificamente para speedflying — por isso uma asa usada para speedflying não é automaticamente uma speedwing convencional, da mesma forma que um Parakite não deixa de o ser por ter sido desenvolvido para esse tipo de voo.',
    en: 'Speedflying is a discipline, not a wing category. There are Parakites designed specifically for speedflying — so a wing used for speedflying is not automatically a conventional speedwing, just as a Parakite does not stop being one because it was developed for that kind of flying.',
    es: 'El speedflying es una modalidad, no una categoría de ala. Existen Parakites concebidos específicamente para speedflying — por eso un ala usada para speedflying no es automáticamente una speedwing convencional, igual que un Parakite no deja de serlo por haber sido desarrollado para ese tipo de vuelo.',
    fr: 'Le speedflying est une pratique, pas une catégorie d’aile. Il existe des Parakites conçus spécifiquement pour le speedflying — une aile utilisée en speedflying n’est donc pas automatiquement une speedwing conventionnelle, de même qu’un Parakite ne cesse pas d’en être un parce qu’il a été développé pour ce type de vol.',
    de: 'Speedflying ist eine Disziplin, keine Schirmkategorie. Es gibt Parakites, die eigens für Speedflying ausgelegt sind — ein Schirm, der zum Speedflying genutzt wird, ist deshalb nicht automatisch eine konventionelle Speedwing, so wie ein Parakite keiner aufhört zu sein, weil er für diese Flugart entwickelt wurde.'
  },
  /* --------------------------------------- 9 · a implementação pode variar */
  s9Kicker: { pt: 'Uma categoria, muitos projetos', en: 'One category, many designs',
              es: 'Una categoría, muchos proyectos', fr: 'Une catégorie, beaucoup de projets',
              de: 'Eine Kategorie, viele Konstruktionen' },
  s9H2: {
    pt: 'A implementação pode variar',
    en: 'The implementation can vary',
    es: 'La implementación puede variar',
    fr: 'La mise en œuvre peut varier',
    de: 'Die Umsetzung kann variieren'
  },
  s9Frase: {
    pt: 'Não existe uma única arquitetura que represente todos os Parakites.',
    en: 'There is no single architecture that represents every Parakite.',
    es: 'No existe una única arquitectura que represente a todos los Parakites.',
    fr: 'Il n’existe pas une seule architecture qui représente tous les Parakites.',
    de: 'Es gibt nicht die eine Architektur, die alle Parakites abbildet.'
  },
  s9VariaTit: {
    pt: 'O que pode variar entre projetos', en: 'What can vary between designs',
    es: 'Lo que puede variar entre proyectos', fr: 'Ce qui peut varier d’un projet à l’autre',
    de: 'Was zwischen Konstruktionen variieren kann'
  },
  s9Varia: {
    pt: [['Geometria dos risers', 'Como os grupos de linhas se relacionam entre si.'],
         ['Relações mecânicas', 'Quanto se move cada grupo para um dado input.'],
         ['Organização dos grupos de linhas', 'Quantos são e como se distribuem ao longo da corda.'],
         ['Perfil', 'A forma aerodinâmica e o comportamento que dela resulta.'],
         ['Amplitude do sistema de controlo', 'Até onde a configuração pode ser alterada em voo.']],
    en: [['Riser geometry', 'How the line groups relate to one another.'],
         ['Mechanical ratios', 'How much each group moves for a given input.'],
         ['Line group layout', 'How many there are and how they sit along the chord.'],
         ['Profile', 'The aerodynamic shape and the behaviour that follows from it.'],
         ['Range of the control system', 'How far the configuration can be changed in flight.']],
    es: [['Geometría de los risers', 'Cómo se relacionan entre sí los grupos de líneas.'],
         ['Relaciones mecánicas', 'Cuánto se mueve cada grupo para un input dado.'],
         ['Organización de los grupos de líneas', 'Cuántos son y cómo se distribuyen a lo largo de la cuerda.'],
         ['Perfil', 'La forma aerodinámica y el comportamiento que de ella resulta.'],
         ['Amplitud del sistema de control', 'Hasta dónde puede alterarse la configuración en vuelo.']],
    fr: [['Géométrie des élévateurs', 'Comment les groupes de suspentes se rapportent les uns aux autres.'],
         ['Rapports mécaniques', 'De combien chaque groupe bouge pour une action donnée.'],
         ['Organisation des groupes de suspentes', 'Combien il y en a et comment ils se répartissent le long de la corde.'],
         ['Profil', 'La forme aérodynamique et le comportement qui en découle.'],
         ['Amplitude du système de commande', 'Jusqu’où la configuration peut être modifiée en vol.']],
    de: [['Tragegurtgeometrie', 'Wie die Leinenebenen zueinander stehen.'],
         ['Mechanische Übersetzungen', 'Wie weit sich jede Ebene bei gegebenem Zug bewegt.'],
         ['Aufbau der Leinenebenen', 'Wie viele es sind und wie sie entlang der Profiltiefe liegen.'],
         ['Profil', 'Die aerodynamische Form und das Verhalten, das daraus folgt.'],
         ['Bandbreite des Steuersystems', 'Wie weit sich die Konfiguration im Flug verändern lässt.']]
  },
  s9P: {
    pt: 'Diferentes Parakites podem ter diferentes geometrias, sistemas de risers, relações mecânicas, perfis e soluções de controlo. É por isso que nenhuma característica de um projeto concreto deve ser lida como característica de toda a categoria.',
    en: 'Different Parakites can have different geometries, riser systems, mechanical ratios, profiles and control solutions. That is why no feature of one particular design should be read as a feature of the whole category.',
    es: 'Distintos Parakites pueden tener distintas geometrías, sistemas de risers, relaciones mecánicas, perfiles y soluciones de control. Por eso ninguna característica de un proyecto concreto debe leerse como característica de toda la categoría.',
    fr: 'Différents Parakites peuvent avoir des géométries, des systèmes d’élévateurs, des rapports mécaniques, des profils et des solutions de commande différents. Aucune caractéristique d’un projet particulier ne doit donc être lue comme une caractéristique de toute la catégorie.',
    de: 'Verschiedene Parakites können unterschiedliche Geometrien, Tragegurtsysteme, Übersetzungen, Profile und Steuerlösungen haben. Deshalb darf kein Merkmal einer einzelnen Konstruktion als Merkmal der ganzen Kategorie gelesen werden.'
  },

  /* -------------------------------------------------- 10 · aprender mais */
  s10H2: { pt: 'Aprender mais', en: 'Learn more', es: 'Aprender más',
           fr: 'Aller plus loin', de: 'Mehr erfahren' },
  s10Links: {
    pt: [['Parakite em Portugal', 'Aprender, testar e voar — por onde se começa.'],
         ['Pilot2Wing', 'O método de formação: primeiro o piloto, depois a asa.']],
    en: [['Parakite in Portugal', 'Learning, trying and flying — where to start.'],
         ['Pilot2Wing', 'The training method: first the pilot, then the wing.']],
    es: [['Parakite en Portugal', 'Aprender, probar y volar — por dónde se empieza.'],
         ['Pilot2Wing', 'El método de formación: primero el piloto, después el ala.']],
    fr: [['Parakite au Portugal', 'Apprendre, essayer et voler — par où commencer.'],
         ['Pilot2Wing', 'La méthode de formation : d’abord le pilote, ensuite l’aile.']],
    de: [['Parakite in Portugal', 'Lernen, testen und fliegen — wo man anfängt.'],
         ['Pilot2Wing', 'Die Ausbildungsmethode: erst der Pilot, dann der Schirm.']]
  },

  /* ----------------------------------------------------------------- FAQ */
  faqH2: { pt: 'Perguntas frequentes', en: 'Frequently asked questions',
           es: 'Preguntas frecuentes', fr: 'Questions fréquentes',
           de: 'Häufige Fragen' },
  faq: {
    pt: [
      ['O que caracteriza um Parakite?',
       'Sobretudo o sistema de controlo: a atuação dos comandos permite alterar de forma significativa a geometria e a incidência da asa durante o voo. A diferença está na arquitetura dos risers e dos comandos e na amplitude de controlo que daí resulta.'],
      ['Como funciona um Parakite?',
       'Os comandos estão integrados com a geometria dos risers. Ao movimentá-los, o piloto altera a configuração longitudinal e a incidência da asa, e com isso a velocidade, o pitch, a trajetória e a energia.'],
      ['O que fazem os risers?',
       'Ligam os grupos de linhas ao piloto e, num Parakite, podem ser parte ativa do sistema de controlo: transformam o input em alterações coordenadas entre grupos de linhas, mudando a configuração da asa.'],
      ['O que significa hands up?',
       'Elevar progressivamente os comandos e reduzir o input. Não é largar os comandos, não significa necessariamente máximo planeio e não é apenas «reduzir o ângulo de ataque».'],
      ['Como funciona o reflex?',
       'É uma geometria de perfil cuja zona posterior modifica o momento de pitch da asa. Numa asa sem estabilizador horizontal, pode contribuir para a estabilidade longitudinal, sobretudo em configurações aceleradas.'],
      ['O reflex impede um colapso?',
       'Não. Aumenta a margem de estabilidade em determinadas configurações, mas turbulência, baixa pressão interna, deformações, problemas de trim ou inputs inadequados continuam a poder provocar perda de estabilidade.'],
      ['Qual é a diferença entre incidência e ângulo de ataque?',
       'A incidência descreve como a asa está geometricamente configurada pelo sistema de risers e linhas. O ângulo de ataque é o ângulo entre a corda do perfil e o fluxo de ar relativo naquele instante.'],
      ['Qual a diferença entre Parakite e parapente?',
       'Está na lógica do sistema de controlo: num Parakite, os comandos permitem alterar de forma muito direta a configuração, a velocidade, o pitch e a gestão de energia da asa.'],
      ['Um Parakite pode ser usado para speedflying?',
       'Sim. Speedflying é uma modalidade, não uma categoria de asa, e existem Parakites concebidos especificamente para esse tipo de voo.']
    ],
    en: [
      ['What characterises a Parakite?',
       'Above all the control system: moving the brakes significantly changes the geometry and incidence of the wing in flight. The difference lies in the architecture of the risers and brakes and in the range of control that follows from it.'],
      ['How does a Parakite work?',
       'The brakes are integrated with the riser geometry. Moving them changes the wing’s longitudinal configuration and incidence, and with that its speed, pitch, trajectory and energy.'],
      ['What do the risers do?',
       'They connect the line groups to the pilot and, on a Parakite, can be an active part of the control system: they turn the input into coordinated changes between line groups, changing the wing’s configuration.'],
      ['What does hands up mean?',
       'Progressively raising the brakes and reducing the input. It is not letting go of the brakes, it does not necessarily mean best glide, and it is not simply “reducing the angle of attack”.'],
      ['How does reflex work?',
       'It is a profile geometry whose rear section modifies the wing’s pitching moment. On a wing with no horizontal stabiliser it can contribute to longitudinal stability, especially in accelerated configurations.'],
      ['Does reflex prevent a collapse?',
       'No. It increases the stability margin in certain configurations, but turbulence, low internal pressure, deformations, trim problems or inadequate inputs can still cause a loss of stability.'],
      ['What is the difference between incidence and angle of attack?',
       'Incidence describes how the wing is geometrically configured by the riser and line system. Angle of attack is the angle between the chord of the profile and the relative airflow at that instant.'],
      ['What is the difference between a Parakite and a paraglider?',
       'It is in the logic of the control system: on a Parakite the brakes allow very direct changes to configuration, speed, pitch and energy management.'],
      ['Can a Parakite be used for speedflying?',
       'Yes. Speedflying is a discipline, not a wing category, and there are Parakites designed specifically for that kind of flying.']
    ],
    es: [
      ['¿Qué caracteriza a un Parakite?',
       'Sobre todo el sistema de control: la actuación de los mandos permite alterar de forma significativa la geometría y la incidencia del ala durante el vuelo. La diferencia está en la arquitectura de risers y mandos y en la amplitud de control que de ahí resulta.'],
      ['¿Cómo funciona un Parakite?',
       'Los mandos están integrados con la geometría de los risers. Al moverlos, el piloto altera la configuración longitudinal y la incidencia del ala, y con ello la velocidad, el pitch, la trayectoria y la energía.'],
      ['¿Qué hacen los risers?',
       'Conectan los grupos de líneas al piloto y, en un Parakite, pueden ser parte activa del sistema de control: transforman el input en alteraciones coordinadas entre grupos de líneas, cambiando la configuración del ala.'],
      ['¿Qué significa hands up?',
       'Elevar progresivamente los mandos y reducir el input. No es soltar los mandos, no significa necesariamente máximo planeo y no es solo «reducir el ángulo de ataque».'],
      ['¿Cómo funciona el reflex?',
       'Es una geometría de perfil cuya zona posterior modifica el momento de pitch del ala. En un ala sin estabilizador horizontal puede contribuir a la estabilidad longitudinal, sobre todo en configuraciones aceleradas.'],
      ['¿El reflex impide un colapso?',
       'No. Aumenta el margen de estabilidad en determinadas configuraciones, pero turbulencia, baja presión interna, deformaciones, problemas de trim o inputs inadecuados pueden seguir provocando pérdida de estabilidad.'],
      ['¿Cuál es la diferencia entre incidencia y ángulo de ataque?',
       'La incidencia describe cómo está el ala configurada geométricamente por el sistema de risers y líneas. El ángulo de ataque es el ángulo entre la cuerda del perfil y el flujo de aire relativo en ese instante.'],
      ['¿Cuál es la diferencia entre Parakite y parapente?',
       'Está en la lógica del sistema de control: en un Parakite, los mandos permiten alterar de forma muy directa la configuración, la velocidad, el pitch y la gestión de energía del ala.'],
      ['¿Un Parakite puede usarse para speedflying?',
       'Sí. El speedflying es una modalidad, no una categoría de ala, y existen Parakites concebidos específicamente para ese tipo de vuelo.']
    ],
    fr: [
      ['Qu’est-ce qui caractérise un Parakite ?',
       'Avant tout le système de commande : l’action sur les commandes modifie de façon significative la géométrie et l’incidence de l’aile en vol. La différence tient à l’architecture des élévateurs et des commandes et à l’amplitude de contrôle qui en découle.'],
      ['Comment fonctionne un Parakite ?',
       'Les commandes sont intégrées à la géométrie des élévateurs. En les actionnant, le pilote modifie la configuration longitudinale et l’incidence de l’aile, et avec elles la vitesse, le tangage, la trajectoire et l’énergie.'],
      ['Que font les élévateurs ?',
       'Ils relient les groupes de suspentes au pilote et, sur un Parakite, peuvent faire partie active du système de commande : ils transforment l’action en changements coordonnés entre groupes de suspentes, modifiant la configuration de l’aile.'],
      ['Que veut dire hands up ?',
       'Remonter progressivement les commandes et réduire l’action. Ce n’est pas lâcher les commandes, cela ne signifie pas nécessairement la finesse maximale, et ce n’est pas simplement « réduire l’angle d’attaque ».'],
      ['Comment fonctionne le reflex ?',
       'C’est une géométrie de profil dont la partie arrière modifie le moment de tangage de l’aile. Sur une aile sans stabilisateur horizontal, elle peut contribuer à la stabilité longitudinale, surtout en configuration accélérée.'],
      ['Le reflex empêche-t-il une fermeture ?',
       'Non. Il augmente la marge de stabilité dans certaines configurations, mais turbulence, pression interne faible, déformations, problèmes de trim ou actions inadaptées peuvent encore provoquer une perte de stabilité.'],
      ['Quelle différence entre incidence et angle d’attaque ?',
       'L’incidence décrit la configuration géométrique de l’aile définie par les élévateurs et les suspentes. L’angle d’attaque est l’angle entre la corde du profil et le flux d’air relatif à cet instant.'],
      ['Quelle différence entre Parakite et parapente ?',
       'C’est la logique du système de commande : sur un Parakite, les commandes permettent de modifier très directement la configuration, la vitesse, le tangage et la gestion de l’énergie.'],
      ['Un Parakite peut-il servir au speedflying ?',
       'Oui. Le speedflying est une pratique, pas une catégorie d’aile, et il existe des Parakites conçus spécifiquement pour ce type de vol.']
    ],
    de: [
      ['Was macht ein Parakite aus?',
       'Vor allem das Steuersystem: Der Zug an den Steuerleinen verändert Geometrie und Anstellwinkel des Schirms im Flug erheblich. Der Unterschied liegt in der Architektur von Tragegurten und Steuerleinen und in der daraus entstehenden Steuerbandbreite.'],
      ['Wie funktioniert ein Parakite?',
       'Die Steuerleinen sind in die Tragegurtgeometrie eingebunden. Wer sie bewegt, verändert Längskonfiguration und Anstellwinkel des Schirms — und damit Geschwindigkeit, Nicken, Flugbahn und Energie.'],
      ['Was tun die Tragegurte?',
       'Sie verbinden die Leinenebenen mit dem Piloten und können beim Parakite aktiver Teil des Steuersystems sein: Sie setzen den Eingriff in koordinierte Änderungen zwischen Leinenebenen um und verändern so die Konfiguration.'],
      ['Was bedeutet hands up?',
       'Die Steuerleinen schrittweise anheben und den Zug verringern. Es heißt nicht loslassen, bedeutet nicht zwangsläufig bestes Gleiten und ist nicht einfach „den Anstellwinkel verringern“.'],
      ['Wie funktioniert Reflex?',
       'Es ist eine Profilgeometrie, deren hinterer Bereich das Nickmoment des Schirms verändert. Bei einem Flügel ohne Höhenleitwerk kann sie zur Längsstabilität beitragen, besonders in beschleunigten Konfigurationen.'],
      ['Verhindert Reflex einen Klapper?',
       'Nein. Es vergrößert die Stabilitätsreserve in bestimmten Konfigurationen, doch Turbulenz, geringer Innendruck, Verformungen, Trimmprobleme oder unpassende Eingriffe können weiterhin zu Stabilitätsverlust führen.'],
      ['Was ist der Unterschied zwischen Anstellwinkel und Anströmwinkel?',
       'Der geometrische Anstellwinkel beschreibt, wie der Schirm durch Tragegurte und Leinen konfiguriert ist. Der Anströmwinkel ist der Winkel zwischen Profilsehne und der momentanen relativen Anströmung.'],
      ['Was unterscheidet Parakite und Gleitschirm?',
       'Es ist die Logik des Steuersystems: Beim Parakite lassen sich Konfiguration, Geschwindigkeit, Nicken und Energiemanagement sehr direkt über die Steuerleinen verändern.'],
      ['Kann ein Parakite zum Speedflying genutzt werden?',
       'Ja. Speedflying ist eine Disziplin, keine Schirmkategorie, und es gibt Parakites, die eigens für diese Flugart ausgelegt sind.']
    ]
  }
};
