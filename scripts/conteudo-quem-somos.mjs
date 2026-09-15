/**
 * A página «Quem somos», nos cinco idiomas.
 * =========================================
 *
 * Pedida pelo Paulo a 15/09/2026, na sequência da auditoria face à
 * documentação do Google: o site só mostrava quem está por trás no
 * /pilot2wing/ e na equipa do curso, e o Google pergunta se é evidente quem
 * faz o conteúdo e porque se deve confiar nele.
 *
 * SÓ FACTOS QUE O SITE JÁ DIZ, E DITOS NUM SÍTIO SÓ
 *   O que já existe noutro conteúdo não se copia para aqui: o gerador lê-o de
 *   lá — a apresentação da Flow (FL.entrada), o percurso do Paulo
 *   (P2W.autorTexto), a equipa do curso (CURSO.equipa), as asas que o Paulo
 *   voa (campo `voada` de cada asa) e a descrição da música (MU.desc). Aqui
 *   ficam só os rótulos e as frases que ligam isso tudo.
 *
 * O QUE NÃO ESTÁ AQUI, E PORQUE
 *   A escola parceira e a licença: em standby até o Paulo recolher os dados
 *   dos instrutores (docs/PENDENTES.md). A equipa aparece só com nomes e
 *   funções, como no curso.
 */

export const QS = {
  titulo: {
    pt: 'Quem somos — Happy Soaring',
    en: 'About us — Happy Soaring',
    es: 'Quiénes somos — Happy Soaring',
    fr: 'Qui sommes-nous — Happy Soaring',
    de: 'Über uns — Happy Soaring'
  },
  descricao: {
    pt: 'A Happy Soaring é revendedor oficial da Flow Paragliders em Portugal e organiza o Curso de Parakite na zona de Lisboa e Setúbal. Quem está por trás e como falar connosco.',
    en: 'Happy Soaring is an official Flow Paragliders dealer in Portugal and organises the Parakite course in the Lisbon and Setúbal area. Who is behind it and how to reach us.',
    es: 'Happy Soaring es punto de venta oficial de Flow Paragliders en Portugal y organiza el curso de Parakite en la zona de Lisboa y Setúbal. Quién está detrás y cómo contactarnos.',
    fr: 'Happy Soaring est revendeur officiel Flow Paragliders au Portugal et organise le cours de Parakite dans la région de Lisbonne et Setúbal. Qui est derrière et comment nous joindre.',
    de: 'Happy Soaring ist offizieller Flow-Paragliders-Händler in Portugal und organisiert den Parakite-Kurs im Raum Lissabon und Setúbal. Wer dahintersteht und wie du uns erreichst.'
  },
  h1: { pt: 'Quem somos', en: 'About us', es: 'Quiénes somos', fr: 'Qui sommes-nous', de: 'Über uns' },

  /* a segunda frase da abertura; a primeira é o FL.entrada */
  curso: {
    pt: 'Organizamos também o Curso de Parakite para pilotos de parapente, na zona de Lisboa e Setúbal. A Happy Soaring não é escola: quem dá a formação são os instrutores de Parakite do curso.',
    en: 'We also organise the Parakite course for paraglider pilots, in the Lisbon and Setúbal area. Happy Soaring is not a school: the training is given by the course’s Parakite instructors.',
    es: 'También organizamos el curso de Parakite para pilotos de parapente, en la zona de Lisboa y Setúbal. Happy Soaring no es escuela: la formación la imparten los instructores de Parakite del curso.',
    fr: 'Nous organisons aussi le cours de Parakite pour pilotes de parapente, dans la région de Lisbonne et Setúbal. Happy Soaring n’est pas une école : la formation est assurée par les instructeurs de Parakite du cours.',
    de: 'Außerdem organisieren wir den Parakite-Kurs für Gleitschirmpiloten im Raum Lissabon und Setúbal. Happy Soaring ist keine Flugschule: Die Ausbildung übernehmen die Parakite-Instruktoren des Kurses.'
  },

  pauloTit: { pt: 'Paulo Pereira', en: 'Paulo Pereira', es: 'Paulo Pereira', fr: 'Paulo Pereira', de: 'Paulo Pereira' },
  /* o texto do percurso é o P2W.autorTexto; isto vem a seguir */
  pauloMais: {
    pt: 'Dedica-se a tempo inteiro à Happy Soaring. A música original do site também é dele: é multi-instrumentista e compositor.',
    en: 'Works full-time on Happy Soaring. The site’s original music is also Paulo’s — a multi-instrumentalist and composer.',
    es: 'Se dedica a tiempo completo a Happy Soaring. La música original del sitio también es suya: es multiinstrumentista y compositor.',
    fr: 'Se consacre à plein temps à Happy Soaring. La musique originale du site est aussi de Paulo, multi-instrumentiste et compositeur.',
    de: 'Arbeitet in Vollzeit an Happy Soaring. Auch die Originalmusik der Website stammt von Paulo — Multiinstrumentalist und Komponist.'
  },
  asasTit: {
    pt: 'Asas que o Paulo voa', en: 'Wings Paulo flies', es: 'Alas que vuela Paulo',
    fr: 'Ailes que Paulo vole', de: 'Schirme, die Paulo fliegt'
  },

  fazemosTit: { pt: 'O que fazemos', en: 'What we do', es: 'Qué hacemos', fr: 'Ce que nous faisons', de: 'Was wir machen' },
  fazemos: {
    flow: {
      pt: 'a gama completa, ajuda a escolher modelo e tamanho, e acompanhamento depois da compra.',
      en: 'the full range, help choosing model and size, and support after the sale.',
      es: 'la gama completa, ayuda para elegir modelo y talla, y acompañamiento después de la compra.',
      fr: 'toute la gamme, aide au choix du modèle et de la taille, et suivi après l’achat.',
      de: 'die komplette Reihe, Hilfe bei Modell- und Größenwahl und Betreuung nach dem Kauf.'
    },
    curso: {
      pt: 'curso de conversão para pilotos de parapente, com o método Pilot2Wing.',
      en: 'a conversion course for paraglider pilots, with the Pilot2Wing method.',
      es: 'curso de conversión para pilotos de parapente, con el método Pilot2Wing.',
      fr: 'cours de conversion pour pilotes de parapente, avec la méthode Pilot2Wing.',
      de: 'Umstiegskurs für Gleitschirmpiloten mit der Pilot2Wing-Methode.'
    },
    spots: {
      pt: 'os spots onde se voa Parakite e parapente perto de Lisboa.',
      en: 'the sites where Parakite and paragliding happen near Lisbon.',
      es: 'los spots donde se vuela Parakite y parapente cerca de Lisboa.',
      fr: 'les sites où l’on vole en Parakite et en parapente près de Lisbonne.',
      de: 'die Spots, an denen bei Lissabon Parakite und Gleitschirm geflogen wird.'
    }
  },
  equipaTit: {
    pt: 'A equipa do Curso de Parakite', en: 'The Parakite course team', es: 'El equipo del curso de Parakite',
    fr: 'L’équipe du cours de Parakite', de: 'Das Team des Parakite-Kurses'
  },
  contactosTit: { pt: 'Falar connosco', en: 'Get in touch', es: 'Hablar con nosotros', fr: 'Nous contacter', de: 'Kontakt' }
};
