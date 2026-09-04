/**
 * Copy das cinco páginas iniciais
 * ==============================
 *
 * Só o que é do <head>: title, description e o locale do Open Graph. O que
 * se vê na página — kicker, h1 e parágrafo de entrada — vive no
 * content/slides/hero.json, porque é conteúdo e o CMS tem de o poder editar.
 * O bloco estático desta página lê de lá, para não haver dois textos a
 * dizerem coisas diferentes conforme o JavaScript corra ou não.
 *
 * INTENÇÃO POR IDIOMA
 *   As cinco são a mesma Happy Soaring e a mesma declaração de entidade:
 *   Parakite + Parapente + Portugal. Nenhuma tenta ganhar "curso",
 *   "course", "curso", "stage" ou "Kurs" — essa intenção é da futura página
 *   de formação, e duas páginas a disputá-la não ajudam nenhuma das duas.
 *
 * O QUE AQUI SE PODE E NÃO SE PODE DIZER
 *   A formação oficial é da escola parceira FelloFly. A Happy Soaring
 *   aconselha, vende equipamento Flow e liga à formação — não é a escola
 *   que a emite, e nenhuma destas linhas pode sugerir o contrário.
 *
 *   Sobre a Flow, o estatuto confirmado é revendedor oficial. Nada de
 *   importador, representante exclusivo ou distribuidor nacional. Em
 *   espanhol diz-se "punto de venta oficial" e não "distribuidor oficial",
 *   que também é a palavra de quem distribui a marca num país.
 */
export const IN = {
  titulo: {
    pt: 'Happy Soaring — Parakite e Parapente em Portugal',
    en: 'Parakite and Paragliding in Portugal — Happy Soaring',
    es: 'Parakite y Parapente en Portugal — Happy Soaring',
    fr: 'Parakite et Parapente au Portugal — Happy Soaring',
    de: 'Parakite und Gleitschirmfliegen in Portugal — Happy Soaring'
  },
  descricao: {
    pt: 'Parakite e parapente em Portugal com a Happy Soaring: aconselhamento, equipamento Flow Paragliders e formação com a escola parceira FelloFly.',
    en: 'Parakite and paragliding in Portugal with Happy Soaring: advice, Flow Paragliders equipment and training with partner school FelloFly.',
    es: 'Parakite y parapente en Portugal con Happy Soaring: asesoramiento, equipo Flow Paragliders y formación con la escuela asociada FelloFly.',
    fr: 'Parakite et parapente au Portugal avec Happy Soaring : conseils, matériel Flow Paragliders et formation avec l\u2019école partenaire FelloFly.',
    de: 'Parakite und Gleitschirmfliegen in Portugal mit Happy Soaring: Beratung, Ausrüstung von Flow Paragliders und Ausbildung mit der Partnerschule FelloFly.'
  },
  /* o Twitter corta mais cedo do que o Google */
  descricaoCurta: {
    pt: 'Parakite e parapente em Portugal: aconselhamento, equipamento Flow Paragliders e formação com a escola parceira FelloFly.',
    en: 'Parakite and paragliding in Portugal: advice, Flow Paragliders equipment and training with partner school FelloFly.',
    es: 'Parakite y parapente en Portugal: asesoramiento, equipo Flow Paragliders y formación con la escuela asociada FelloFly.',
    fr: 'Parakite et parapente au Portugal : conseils, matériel Flow Paragliders et formation avec l\u2019école partenaire FelloFly.',
    de: 'Parakite und Gleitschirmfliegen in Portugal: Beratung, Ausrüstung von Flow Paragliders und Ausbildung mit der Partnerschule FelloFly.'
  },
  ogLocale: { pt: 'pt_PT', en: 'en_GB', es: 'es_ES', fr: 'fr_FR', de: 'de_DE' },
  /* alt da imagem de partilha — muda de língua, a imagem não */
  ogAlt: {
    pt: 'Costa portuguesa vista de cima, com a marca Happy Soaring',
    en: 'The Portuguese coast from above, with the Happy Soaring wordmark',
    es: 'La costa portuguesa desde el aire, con la marca Happy Soaring',
    fr: 'La côte portugaise vue du ciel, avec la marque Happy Soaring',
    de: 'Die portugiesische Küste von oben, mit dem Schriftzug Happy Soaring'
  }
};
