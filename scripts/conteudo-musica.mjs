/**
 * O enquadramento da página /musica/, nos cinco idiomas.
 * ======================================================
 *
 * Só o que é da PÁGINA: título, descrição, migalha, alt da imagem social e
 * as duas etiquetas de secção. O conteúdo — as 42 faixas, os géneros, os
 * preços, os termos e a biografia — continua a sair do
 * content/slides/music.json, que é o que o CMS edita e o que a página
 * inicial já usava.
 *
 * Se este ficheiro tivesse cópias desse texto, passavam a existir duas
 * versões da mesma loja. A página é uma segunda montra do mesmo conteúdo,
 * não um segundo conteúdo.
 */

export const MU = {

  title: {
    pt: 'Happy Soaring Music — música original para vídeos de voo | Happy Soaring',
    en: 'Happy Soaring Music — original music for flight videos | Happy Soaring',
    es: 'Happy Soaring Music — música original para vídeos de vuelo | Happy Soaring',
    fr: 'Happy Soaring Music — musique originale pour vidéos de vol | Happy Soaring',
    de: 'Happy Soaring Music — Originalmusik für Flugvideos | Happy Soaring'
  },
  desc: {
    pt: 'Música original inspirada no vento, no mar e no voo. Ouve as faixas, filtra por género e usa-as nos teus vídeos de voo e nas redes sociais.',
    en: 'Original music inspired by wind, sea and flight. Listen to the tracks, filter by genre and use them in your flight videos and on social media.',
    es: 'Música original inspirada en el viento, el mar y el vuelo. Escucha las pistas, filtra por género y úsalas en tus vídeos de vuelo y redes sociales.',
    fr: 'Musique originale inspirée par le vent, la mer et le vol. Écoute les morceaux, filtre par genre et utilise-les dans tes vidéos de vol et sur les réseaux.',
    de: 'Originalmusik, inspiriert von Wind, Meer und Flug. Hör die Titel, filtere nach Genre und nutze sie in deinen Flugvideos und in den sozialen Netzwerken.'
  },
  migalha: {
    pt: 'Música', en: 'Music', es: 'Música', fr: 'Musique', de: 'Musik'
  },
  ogAlt: {
    pt: 'Happy Soaring Music — música original inspirada no vento, no mar e no voo.',
    en: 'Happy Soaring Music — original music inspired by wind, sea and flight.',
    es: 'Happy Soaring Music — música original inspirada en el viento, el mar y el vuelo.',
    fr: 'Happy Soaring Music — musique originale inspirée par le vent, la mer et le vol.',
    de: 'Happy Soaring Music — Originalmusik, inspiriert von Wind, Meer und Flug.'
  },

  /* as duas etiquetas que a página põe à volta do que vem do CMS */
  faixasTit: {
    pt: 'As faixas', en: 'The tracks', es: 'Las pistas',
    fr: 'Les morceaux', de: 'Die Titel'
  },
  quemFaz: {
    pt: 'Quem faz esta música', en: 'Who makes this music',
    es: 'Quién hace esta música', fr: 'Qui fait cette musique',
    de: 'Wer diese Musik macht'
  },

  /* a lista estática que o JavaScript substitui pela loja. Existe para quem
     chega sem JavaScript e para quem indexa: os nomes das faixas têm de estar
     no HTML servido, não só no que o browser constrói. */
  semJs: {
    pt: 'A lista completa, com leitor, filtros por género e preços, carrega a seguir.',
    en: 'The full list, with player, genre filters and prices, loads next.',
    es: 'La lista completa, con reproductor, filtros por género y precios, carga a continuación.',
    fr: 'La liste complète, avec lecteur, filtres par genre et tarifs, se charge ensuite.',
    de: 'Die vollständige Liste mit Player, Genre-Filtern und Preisen lädt gleich.'
  }
};
