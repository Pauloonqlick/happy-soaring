/* MARCA E LÍNGUA DA PESQUISA — calculadas ao ler, nunca gravadas.

   O Search Console não diz a língua da pesquisa nem a da interface do Google.
   A língua da pesquisa infere-se do texto, e só quando há evidência:
     - contam apenas palavras e letras que pertencem a UMA língua;
     - marcas, modelos e termos internacionais não contam;
     - empate, ou nenhuma pista: UNKNOWN.
   Nunca se deduz a língua a partir do país. */

const PISTAS = {
  pt: ['o', 'é', 'uma', 'da', 'dos', 'das', 'na', 'em', 'voo', 'voos', 'asa', 'asas',
    'praia', 'preço', 'precos', 'preços', 'aprender', 'escola', 'batismo', 'baptismo', 'perto', 'melhor', 'onde', 'fazer'],
  es: ['qué', 'el', 'los', 'las', 'del', 'vuelo', 'vuelos', 'alas', 'playa', 'precio', 'precios', 'escuela',
    'bautismo', 'biplaza', 'cerca', 'mejor', 'dónde', 'donde', 'hacer', 'cómo'],
  fr: ['est', 'ce', 'qu', 'une', 'le', 'les', 'des', 'du', 'au', 'vol', 'vols', 'cours', 'aile', 'ailes',
    'plage', 'prix', 'école', 'ecole', 'baptême', 'bapteme', 'lisbonne', 'près', 'meilleur', 'où', 'faire'],
  de: ['ist', 'ein', 'eine', 'der', 'das', 'und', 'kurs', 'kurse', 'gleitschirm', 'gleitschirme',
    'schirm', 'schirme', 'flug', 'flüge', 'tandemflug', 'strand', 'preis', 'preise', 'schule', 'lissabon', 'nähe',
    'beste', 'wo', 'machen', 'fliegen'],
  en: ['what', 'is', 'the', 'how', 'course', 'courses', 'lesson', 'lessons', 'wing', 'wings', 'flight', 'flights',
    'flying', 'beach', 'price', 'prices', 'school', 'lisbon', 'near', 'best', 'where', 'to', 'of', 'for', 'vs', 'versus',
    'paragliding', 'paraglider', 'kiting']
};

/* Letras exclusivas de uma língua (entre as cinco do site). */
const LETRAS = [[/[ãõ]/, 'pt'], [/ñ/, 'es'], [/[èêëîïûœ]/, 'fr'], [/[äöüß]/, 'de']];

/* Não contam para língua nenhuma: nomes próprios, marcas, modelos, termos iguais em várias línguas. */
/* incluindo palavras curtas partilhadas por várias línguas: que, do, no, un, es, was, die… */
const NEUTROS = new Set(['que', 'do', 'no', 'un', 'um', 'es', 'was', 'die', 'parakite', 'parakites', 'parakiting', 'parapente', 'parapentes', 'tandem', 'portugal', 'lisboa',
  'curso', 'cursos', 'de', 'a', 'e', 'y', 'in', 'en', 'on', 'con', 'com', 'para', 'por', 'pro', 'mit', 'with', 'flow',
  'paragliders', 'mullet', 'albatroxx', 'fusion', 'mohawk', 'rpm', 'vissta', 'xc', 'yoti', 'niviuk', 'ozone', 'sesimbra',
  'almada', 'alfarim', 'meco', 'caparica', 'fonte', 'telha', 'gralha', 'albufeira', 'happy', 'soaring', 'happysoaring']);

const LISTAS = Object.fromEntries(Object.entries(PISTAS).map(([l, ps]) => [l, new Set(ps)]));

export function inferirLingua(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return { lingua: 'UNKNOWN', confianca: null };
  const pontos = { pt: 0, es: 0, fr: 0, de: 0, en: 0 };
  for (const [re, l] of LETRAS) if (re.test(q)) pontos[l] += 2;
  for (const t of q.split(/[^a-zà-ÿœß]+/i).filter(Boolean)) {
    if (NEUTROS.has(t)) continue;
    const donas = Object.keys(LISTAS).filter(l => LISTAS[l].has(t));
    if (donas.length === 1) pontos[donas[0]] += 1;      /* palavras de várias línguas não contam */
  }
  const ordem = Object.entries(pontos).sort((a, b) => b[1] - a[1]);
  const [primeira, segunda] = ordem;
  if (primeira[1] === 0 || primeira[1] === segunda[1]) return { lingua: 'UNKNOWN', confianca: null };
  const confianca = primeira[1] >= 2 && segunda[1] === 0 ? 'ALTA' : 'MEDIA';
  return { lingua: primeira[0], confianca };
}

/* Marca: a query contém um termo de marca configurado (com ou sem espaços).
   O que o Google esconde por privacidade não aparece nas linhas: é
   «desconhecido» e calcula-se como total − visível, nunca por aqui. */
export function classificarMarca(query, termos) {
  const q = String(query || '').toLowerCase();
  if (!q) return 'UNKNOWN';
  const junto = q.replace(/\s+/g, '');
  for (const t of termos) {
    const termo = String(t || '').toLowerCase().trim();
    if (!termo) continue;
    if (q.includes(termo) || junto.includes(termo.replace(/\s+/g, ''))) return 'BRANDED';
  }
  return 'NON_BRANDED';
}
