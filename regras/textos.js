/**
 * As palavras da interface — partilhadas pelo site e pela página de música
 * ========================================================================
 *
 * Isto são as etiquetas que não vêm do CMS: "reproduzir", "limpar selecção",
 * "{n} músicas", os cabeçalhos das colunas, as perguntas do carrinho. Viviam
 * dentro do app.js, e por isso só existiam na página inicial.
 *
 * Saíram para aqui quando a música ganhou página própria: as duas páginas
 * mostram a mesma loja e têm de lhe chamar os mesmos nomes. Uma segunda
 * tabela seria uma segunda tradução para manter — e um dia diriam coisas
 * diferentes, como já aconteceu com os rótulos de família antes de irem
 * para a taxonomia.
 *
 * São dados puros, sem DOM: correm em Node como o resto desta pasta.
 */
export const UI = {
  /* filtros */
  fAll:   { pt: 'Todas', en: 'All', es: 'Todas', fr: 'Toutes', de: 'Alle' },
  fPt:    { pt: 'Português', en: 'Portuguese', es: 'Portugués', fr: 'Portugais', de: 'Portugiesisch' },
  fEn:    { pt: 'Inglês', en: 'English', es: 'Inglés', fr: 'Anglais', de: 'Englisch' },
  fInst:  { pt: 'Instrumental', en: 'Instrumental', es: 'Instrumental', fr: 'Instrumental', de: 'Instrumental' },
  /* controlos */
  allGenres:  { pt: 'Todos os géneros', en: 'All genres', es: 'Todos los géneros', fr: 'Tous les genres', de: 'Alle Genres' },
  filterGenre:{ pt: 'Filtrar por género', en: 'Filter by genre', es: 'Filtrar por género', fr: 'Filtrer par genre', de: 'Nach Genre filtern' },
  search:     { pt: 'Pesquisar música…', en: 'Search music…', es: 'Buscar música…', fr: 'Rechercher…', de: 'Musik suchen…' },
  searchAria: { pt: 'Pesquisar música', en: 'Search music', es: 'Buscar música', fr: 'Rechercher une musique', de: 'Musik suchen' },
  selectAll:  { pt: 'Marcar todas', en: 'Select all', es: 'Seleccionar todas', fr: 'Tout sélectionner', de: 'Alle auswählen' },
  deselectAll:{ pt: 'Desmarcar todas', en: 'Deselect all', es: 'Deseleccionar todas', fr: 'Tout désélectionner', de: 'Alle abwählen' },
  /* colunas */
  colTrack:  { pt: 'Música', en: 'Track', es: 'Música', fr: 'Titre', de: 'Titel' },
  colLang:   { pt: 'Idioma', en: 'Language', es: 'Idioma', fr: 'Langue', de: 'Sprache' },
  colGenre:  { pt: 'Género', en: 'Genre', es: 'Género', fr: 'Genre', de: 'Genre' },
  colLength: { pt: 'Duração', en: 'Length', es: 'Duración', fr: 'Durée', de: 'Dauer' },
  /* faixas */
  free:      { pt: 'GRÁTIS', en: 'FREE', es: 'GRATIS', fr: 'GRATUIT', de: 'GRATIS' },
  excerpt:   { pt: 'excerto {e}', en: 'excerpt {e}', es: 'extracto {e}', fr: 'extrait {e}', de: 'Auszug {e}' },
  excerptTip:{ pt: 'Ouves um excerto de {e}. A compra inclui a música completa ({t}).',
               en: 'You are hearing a {e} excerpt. Your purchase includes the full track ({t}).',
               es: 'Escuchas un extracto de {e}. La compra incluye la canción completa ({t}).',
               fr: 'Vous écoutez un extrait de {e}. L’achat inclut le morceau complet ({t}).',
               de: 'Du hörst einen Auszug von {e}. Der Kauf enthält den vollständigen Titel ({t}).' },
  play:      { pt: 'Tocar {n}', en: 'Play {n}', es: 'Reproducir {n}', fr: 'Écouter {n}', de: '{n} abspielen' },
  markFree:  { pt: 'Marcar faixa grátis {n}', en: 'Select free track {n}', es: 'Seleccionar pista gratis {n}', fr: 'Sélectionner le titre gratuit {n}', de: 'Gratis-Titel {n} auswählen' },
  markBuy:   { pt: 'Marcar para comprar {n}', en: 'Select {n} to buy', es: 'Seleccionar {n} para comprar', fr: 'Sélectionner {n} pour acheter', de: '{n} zum Kauf auswählen' },
  playPause: { pt: 'Tocar/Pausar', en: 'Play/Pause', es: 'Reproducir/Pausar', fr: 'Lecture/Pause', de: 'Abspielen/Pause' },
  /* carrinho */
  nTrack:    { pt: '{n} música', en: '{n} track', es: '{n} canción', fr: '{n} morceau', de: '{n} Titel' },
  nTracks:   { pt: '{n} músicas', en: '{n} tracks', es: '{n} canciones', fr: '{n} morceaux', de: '{n} Titel' },
  nFreeOne:  { pt: '{n} música grátis', en: '{n} free track', es: '{n} canción gratis', fr: '{n} morceau gratuit', de: '{n} Gratis-Titel' },
  nFreeMany: { pt: '{n} músicas grátis', en: '{n} free tracks', es: '{n} canciones gratis', fr: '{n} morceaux gratuits', de: '{n} Gratis-Titel' },
  mixed:     { pt: '{n} músicas ({c} {pag} + {f} grátis)', en: '{n} tracks ({c} {pag} + {f} free)',
               es: '{n} canciones ({c} {pag} + {f} gratis)', fr: '{n} morceaux ({c} {pag} + {f} gratuits)',
               de: '{n} Titel ({c} {pag} + {f} gratis)' },
  paidOne:   { pt: 'paga', en: 'paid', es: 'pagada', fr: 'payant', de: 'bezahlt' },
  paidMany:  { pt: 'pagas', en: 'paid', es: 'pagadas', fr: 'payants', de: 'bezahlt' },
  freeSuffix:{ pt: '(grátis)', en: '(free)', es: '(gratis)', fr: '(gratuit)', de: '(gratis)' },
  freeCount: { pt: '{n} grátis', en: '{n} free', es: '{n} gratis', fr: '{n} gratuits', de: '{n} gratis' },
  perTrack:  { pt: 'a {p}/música', en: '{p} per track', es: 'a {p}/canción', fr: '{p} par morceau', de: '{p} pro Titel' },
  bestPrice: { pt: 'melhor preço aplicado', en: 'best price applied', es: 'mejor precio aplicado', fr: 'meilleur prix appliqué', de: 'bester Preis angewendet' },
  /* frases com número: cada idioma escreve o substantivo na posição certa —
     encaixar "2 morceaux" numa frase feita dá gramática errada */
  takeMoreOne: { pt: 'podes levar mais {n} música pelo mesmo preço', en: 'you can add {n} more track for the same price',
                 es: 'puedes llevar {n} canción más al mismo precio', fr: 'vous pouvez ajouter {n} morceau de plus au même prix',
                 de: 'du kannst {n} weiteren Titel zum gleichen Preis mitnehmen' },
  takeMoreMany:{ pt: 'podes levar mais {n} músicas pelo mesmo preço', en: 'you can add {n} more tracks for the same price',
                 es: 'puedes llevar {n} canciones más al mismo precio', fr: 'vous pouvez ajouter {n} morceaux de plus au même prix',
                 de: 'du kannst {n} weitere Titel zum gleichen Preis mitnehmen' },
  missingFor:{ pt: 'faltam {n} para {p}/música', en: '{n} more for {p} per track', es: 'faltan {n} para {p}/canción',
               fr: 'encore {n} pour {p} par morceau', de: 'noch {n} für {p} pro Titel' },
  clearSel:  { pt: 'Limpar seleção', en: 'Clear selection', es: 'Limpiar selección', fr: 'Vider la sélection', de: 'Auswahl leeren' },
  buyWa:     { pt: 'Comprar no WhatsApp', en: 'Buy on WhatsApp', es: 'Comprar por WhatsApp', fr: 'Acheter sur WhatsApp', de: 'Über WhatsApp kaufen' },
  introMsg:  { pt: 'Olá! Quero comprar estas faixas:', en: 'Hi! I want to buy these tracks:',
               es: '¡Hola! Quiero comprar estas canciones:', fr: 'Bonjour ! Je souhaite acheter ces morceaux :',
               de: 'Hallo! Ich möchte diese Titel kaufen:' },
  totalWord: { pt: 'Total', en: 'Total', es: 'Total', fr: 'Total', de: 'Gesamt' },
  refWord:   { pt: 'Ref', en: 'Ref', es: 'Ref', fr: 'Réf', de: 'Ref' },
  refLabel:  { pt: 'Ref. {r}', en: 'Ref. {r}', es: 'Ref. {r}', fr: 'Réf. {r}', de: 'Ref. {r}' },
  sentAsk:   { pt: 'Enviaste a encomenda {r}?', en: 'Did you send order {r}?', es: '¿Enviaste el pedido {r}?',
               fr: 'Avez-vous envoyé la commande {r} ?', de: 'Hast du die Bestellung {r} gesendet?' },
  sentYes:   { pt: 'Sim, limpar', en: 'Yes, clear', es: 'Sí, limpiar', fr: 'Oui, vider', de: 'Ja, leeren' },
  sentNo:    { pt: 'Ainda não', en: 'Not yet', es: 'Todavía no', fr: 'Pas encore', de: 'Noch nicht' },
  /* preços */
  pricesTitle:{ pt: 'Preços', en: 'Prices', es: 'Precios', fr: 'Tarifs', de: 'Preise' },
  perTrackUnit:{ pt: '/ música', en: '/ track', es: '/ canción', fr: '/ morceau', de: '/ Titel' },
  tierOne:   { pt: '1 música', en: '1 track', es: '1 canción', fr: '1 morceau', de: '1 Titel' },
  tierFrom:  { pt: 'A partir de {n} músicas', en: 'From {n} tracks', es: 'A partir de {n} canciones',
               fr: 'À partir de {n} morceaux', de: 'Ab {n} Titeln' },

  /* ---- secção Flow ---- */
  flowHomologacao:{ pt:'Homologação', en:'Certification', es:'Homologación', fr:'Homologation', de:'Zulassung' },
  flowTipo:       { pt:'Tipo', en:'Type', es:'Tipo', fr:'Type', de:'Typ' },
  flowListaSimples:{ pt:'Esta família não se divide por níveis — é uma lista simples.',
                     en:'This family is not split by level — it is a simple list.',
                     es:'Esta familia no se divide por niveles — es una lista simple.',
                     fr:'Cette famille ne se divise pas par niveaux — c’est une liste simple.',
                     de:'Diese Familie ist nicht nach Stufen unterteilt — es ist eine einfache Liste.' },
  flowCores:      { pt:'Cores disponíveis', en:'Available colours', es:'Colores disponibles', fr:'Couleurs disponibles', de:'Verfügbare Farben' },
  flowTamanhos:   { pt:'Tamanhos', en:'Sizes', es:'Tallas', fr:'Tailles', de:'Größen' },
  flowVerDetalhes:{ pt:'Detalhes', en:'Details', es:'Detalles', fr:'Détails', de:'Details' },
  flowFechar:     { pt:'Fechar', en:'Close', es:'Cerrar', fr:'Fermer', de:'Schließen' },
  /* ---- descoberta ---- */
  descTitulo:    { pt:'Não sabes qual escolher?', en:'Not sure which one?', es:'¿No sabes cuál elegir?',
                   fr:'Tu ne sais pas laquelle choisir ?', de:'Unsicher, welcher passt?' },
  descSub:       { pt:'{n} perguntas e digo-te quais das {t} são para ti.',
                   en:'{n} questions and I tell you which of the {t} are for you.',
                   es:'{n} preguntas y te digo cuáles de las {t} son para ti.',
                   fr:'{n} questions et je te dis lesquelles des {t} sont pour toi.',
                   de:'{n} Fragen, und ich sage dir, welche der {t} zu dir passen.' },
  descResponder: { pt:'Responder', en:'Answer', es:'Responder', fr:'Répondre', de:'Antworten' },
  descPergTit:   { pt:'Quatro coisas, e digo-te quais são para ti',
                   en:'Four things, and I tell you which are for you',
                   es:'Cuatro cosas, y te digo cuáles son para ti',
                   fr:'Quatre choses, et je te dis lesquelles sont pour toi',
                   de:'Vier Dinge, und ich sage dir, welche passen' },
  descPergSub:   { pt:'Podes saltar qualquer uma — quanto mais responderes, mais afino.',
                   en:'Skip any of them — the more you answer, the finer I get.',
                   es:'Puedes saltar cualquiera — cuanto más respondas, más afino.',
                   fr:'Tu peux en sauter — plus tu réponds, plus j’affine.',
                   de:'Du kannst jede überspringen — je mehr du beantwortest, desto genauer.' },
  descQ1:        { pt:'1 · Que tipo de asa procuras', en:'1 · What kind of wing', es:'1 · Qué tipo de vela buscas',
                   fr:'1 · Quel type d’aile', de:'1 · Welche Art Schirm' },
  descQ2:        { pt:'2 · Nível de experiência', en:'2 · Experience level', es:'2 · Nivel de experiencia',
                   fr:'2 · Niveau d’expérience', de:'2 · Erfahrungsstufe' },
  descQ3:        { pt:'3 · Onde voas', en:'3 · Where you fly', es:'3 · Dónde vuelas',
                   fr:'3 · Où tu voles', de:'3 · Wo du fliegst' },
  descQ4:        { pt:'4 · Peso total em voo', en:'4 · All-up weight', es:'4 · Peso total en vuelo',
                   fr:'4 · Poids total en vol', de:'4 · Startgewicht' },
  descNaoSei:    { pt:'Não sei — mostra-me tudo', en:'Not sure — show me everything',
                   es:'No sé — muéstrame todo', fr:'Je ne sais pas — montre-moi tout',
                   de:'Weiß nicht — zeig mir alles' },
  descMostra:    { pt:'Mostra-me as asas', en:'Show me the wings', es:'Muéstrame las velas',
                   fr:'Montre-moi les ailes', de:'Zeig mir die Schirme' },
  descContam:    { pt:'{n} de {t} correspondem ao que disseste',
                   en:'{n} of {t} match what you said', es:'{n} de {t} coinciden con lo que dijiste',
                   fr:'{n} sur {t} correspondent', de:'{n} von {t} passen zu deinen Angaben' },
  descFiltrado:  { pt:'Filtrado para ti:', en:'Filtered for you:', es:'Filtrado para ti:',
                   fr:'Filtré pour toi :', de:'Für dich gefiltert:' },
  descAlterar:   { pt:'alterar', en:'change', es:'cambiar', fr:'modifier', de:'ändern' },
  descVerTudo:   { pt:'ver a gama toda', en:'see the whole range', es:'ver toda la gama',
                   fr:'voir toute la gamme', de:'die ganze Reihe ansehen' },
  descApagar:    { pt:'Apagar respostas', en:'Clear answers', es:'Borrar respuestas',
                   fr:'Effacer les réponses', de:'Antworten löschen' },
  descMelhor:    { pt:'A melhor para ti', en:'Your best match', es:'La mejor para ti',
                   fr:'La meilleure pour toi', de:'Die beste für dich' },
  descPorque:    { pt:'Porquê esta para ti:', en:'Why this one for you:', es:'Por qué esta para ti:',
                   fr:'Pourquoi celle-ci :', de:'Warum diese für dich:' },
  descTeuTam:    { pt:'· o teu é o {t}', en:'· yours is the {t}', es:'· el tuyo es el {t}',
                   fr:'· la tienne est la {t}', de:'· deiner ist der {t}' },
  descAsTuas:    { pt:'As tuas {n} asas', en:'Your {n} wings', es:'Tus {n} velas',
                   fr:'Tes {n} ailes', de:'Deine {n} Schirme' },
  /* uma so asa nao e "as tuas 1 asas" */
  descATua:      { pt:'A tua asa', en:'Your wing', es:'Tu vela',
                   fr:'Ton aile', de:'Dein Schirm' },
  descRestoFam:  { pt:'O resto da família', en:'The rest of the family', es:'El resto de la familia',
                   fr:'Le reste de la famille', de:'Der Rest der Familie' },
  descAVer:      { pt:'A ver agora', en:'Now showing', es:'Viendo ahora', fr:'En cours', de:'Gerade offen' },
  descNivel1:    { pt:'Iniciado', en:'Beginner', es:'Iniciado', fr:'Débutant', de:'Einsteiger' },
  descNivel2:    { pt:'Avançado', en:'Advanced', es:'Avanzado', fr:'Confirmé', de:'Fortgeschritten' },
  descNivel3:    { pt:'Experiente', en:'Experienced', es:'Experto', fr:'Expérimenté', de:'Erfahren' },
  descTerr1:     { pt:'Praia / dunas', en:'Beach / dunes', es:'Playa / dunas',
                   fr:'Plage / dunes', de:'Strand / Dünen' },
  descTerr2:     { pt:'Montanha', en:'Mountain', es:'Montaña', fr:'Montagne', de:'Berg' },
  descTerr3:     { pt:'Térmica', en:'Thermals', es:'Térmica', fr:'Thermique', de:'Thermik' },
  descNenhuma:   { pt:'Nenhuma asa corresponde a tudo o que pediste. Estas são as mais próximas.',
                   en:'No wing matches everything you asked for. These are the closest.',
                   es:'Ninguna vela cumple todo lo que pediste. Estas son las más cercanas.',
                   fr:'Aucune aile ne coche tout. Voici les plus proches.',
                   de:'Kein Schirm passt auf alles. Diese kommen am nächsten.' },
  /* cor à medida */
  corMedida:      { pt:'Escolhe a tua cor', en:'Choose your colour', es:'Elige tu color',
                    fr:'Choisis ta couleur', de:'Wähl deine Farbe' },
  corIndicativa:  { pt:'As cores no ecrã são indicativas. O tecido pode ser diferente do que vês — confirma connosco antes de encomendares.',
                    en:'On-screen colours are indicative. The fabric may differ from what you see — check with us before ordering.',
                    es:'Los colores en pantalla son indicativos. El tejido puede diferir de lo que ves — confírmalo con nosotros antes de pedir.',
                    fr:'Les couleurs à l’écran sont indicatives. Le tissu peut différer de ce que tu vois — confirme avec nous avant de commander.',
                    de:'Die Farben am Bildschirm sind Richtwerte. Der Stoff kann abweichen — kläre das vor der Bestellung mit uns ab.' },
  /* a mensagem monta-se por pecas: com varios tamanhos, cor opcional e foto
     opcional, um so molde por idioma dava dezenas de combinacoes */
  msgAbre:   { pt:'Olá! Queria pedir preço para a {n}.', en:'Hi! I would like a price for the {n}.',
               es:'¡Hola! Quería pedir precio para la {n}.', fr:'Bonjour ! Je voudrais le prix de la {n}.',
               de:'Hallo! Ich hätte gern den Preis der {n}.' },
  msgTam:    { pt:'Tamanho: {t}', en:'Size: {t}', es:'Talla: {t}', fr:'Taille : {t}', de:'Größe: {t}' },
  msgTams:   { pt:'Tamanhos: {t}', en:'Sizes: {t}', es:'Tallas: {t}', fr:'Tailles : {t}', de:'Größen: {t}' },
  msgCor:    { pt:'Cor: {c}', en:'Colour: {c}', es:'Color: {c}', fr:'Couleur : {c}', de:'Farbe: {c}' },
  msgPais:   { pt:'Estou em {p}.', en:'I am in {p}.', es:'Estoy en {p}.',
               fr:'Je suis en {p}.', de:'Ich bin in {p}.' },
  flowEscolheTams:{ pt:'Que tamanhos queres?', en:'Which sizes?', es:'¿Qué tallas quieres?',
                    fr:'Quelles tailles ?', de:'Welche Größen?' },
  /* prazo dos avisos — escrito a partir da data de fim, nunca à mão */
  avisoAte:       { pt:'Até {d}', en:'Until {d}', es:'Hasta el {d}', fr:'Jusqu’au {d}', de:'Bis {d}' },
  avisoFaltam:    { pt:'Faltam {n} dias', en:'{n} days left', es:'Quedan {n} días',
                    fr:'Encore {n} jours', de:'Noch {n} Tage' },
  avisoFaltaUm:   { pt:'Falta 1 dia', en:'1 day left', es:'Queda 1 día',
                    fr:'Encore 1 jour', de:'Noch 1 Tag' },
  avisoUltimoDia: { pt:'Último dia', en:'Last day', es:'Último día',
                    fr:'Dernier jour', de:'Letzter Tag' },
  flowPedirPreco: { pt:'Preço', en:'Price', es:'Precio', fr:'Prix', de:'Preis' },
  flowHistorico:  { pt:'Dados históricos', en:'Historical data', es:'Datos históricos',
                    fr:'Données historiques', de:'Historische Daten' },
  erroParcial:    { pt:'Nem tudo carregou. O essencial está aqui em baixo.',
                    en:'Not everything loaded. The essentials are below.',
                    es:'No se cargó todo. Lo esencial está aquí abajo.',
                    fr:'Tout n’a pas chargé. L’essentiel est ci-dessous.',
                    de:'Nicht alles wurde geladen. Das Wesentliche steht unten.' },
  flowMsgPreco:   { pt:'Olá! Queria pedir preço para a {n}. Estou em {p}.',
                    en:'Hi! I would like a price for the {n}. I am in {p}.',
                    es:'¡Hola! Quería pedir precio para la {n}. Estoy en {p}.',
                    fr:'Bonjour ! Je voudrais le prix de la {n}. Je suis en {p}.',
                    de:'Hallo! Ich hätte gerne einen Preis für die {n}. Ich bin in {p}.' },
  flowMsgPrecoTam:{ pt:'Olá! Queria pedir preço para a {n}, tamanho {t}. Estou em {p}.',
                    en:'Hi! I would like a price for the {n}, size {t}. I am in {p}.',
                    es:'¡Hola! Quería pedir precio para la {n}, talla {t}. Estoy en {p}.',
                    fr:'Bonjour ! Je voudrais le prix de la {n}, taille {t}. Je suis en {p}.',
                    de:'Hallo! Ich hätte gerne einen Preis für die {n}, Größe {t}. Ich bin in {p}.' },
  flowPais:       { pt:'De que país és?', en:'Which country are you in?', es:'¿De qué país eres?',
                    fr:'De quel pays es-tu ?', de:'Aus welchem Land kommst du?' },
  flowPaisDica:   { pt:'Obrigatório — é o que me diz em que idioma te devo responder.',
                    en:'Required — it tells me which language to reply in.',
                    es:'Obligatorio: me dice en qué idioma debo responderte.',
                    fr:'Obligatoire — cela me dit dans quelle langue te répondre.',
                    de:'Pflichtfeld — daran sehe ich, in welcher Sprache ich antworten soll.' },
  flowEscolheTam: { pt:'Que tamanho queres?', en:'Which size do you want?', es:'¿Qué talla quieres?',
                    fr:'Quelle taille veux-tu ?', de:'Welche Größe möchtest du?' },
  flowEnviarWa:   { pt:'Enviar no WhatsApp', en:'Send on WhatsApp', es:'Enviar por WhatsApp',
                    fr:'Envoyer sur WhatsApp', de:'Über WhatsApp senden' },
  flowParaQuem:   { pt:'Para quem é', en:'Who it is for', es:'Para quién es', fr:'Pour qui', de:'Für wen' },
  flowPontosFortes:{ pt:'Pontos fortes', en:'Strengths', es:'Puntos fuertes', fr:'Points forts', de:'Stärken' },
  flowIncluido:   { pt:'Vem incluído', en:'Included', es:'Incluido', fr:'Inclus', de:'Im Lieferumfang' },
  flowSpecs:      { pt:'Tamanhos e especificações', en:'Sizes and specifications', es:'Tallas y especificaciones',
                    fr:'Tailles et spécifications', de:'Größen und technische Daten' },
  /* cabeçalhos da tabela de especificações */
  sTam:      { pt:'Tam.', en:'Size', es:'Talla', fr:'Taille', de:'Größe' },
  sArea:     { pt:'Área plana', en:'Flat area', es:'Área plana', fr:'Surface à plat', de:'Fläche' },
  sAreaProj: { pt:'Área proj.', en:'Proj. area', es:'Área proy.', fr:'Surface proj.', de:'Proj. Fläche' },
  sEnv:      { pt:'Envergadura', en:'Wingspan', es:'Envergadura', fr:'Envergure', de:'Spannweite' },
  sCelulas:  { pt:'Células', en:'Cells', es:'Celdas', fr:'Caissons', de:'Zellen' },
  sAlong:    { pt:'Along.', en:'Aspect ratio', es:'Alarg.', fr:'Allongement', de:'Streckung' },
  sAlongProj:{ pt:'Along. proj.', en:'Proj. AR', es:'Alarg. proy.', fr:'Allong. proj.', de:'Proj. Streckung' },
  sPeso:     { pt:'Peso', en:'Weight', es:'Peso', fr:'Poids', de:'Gewicht' },
  sPtv:      { pt:'PTV', en:'Weight range', es:'PTV', fr:'PTV', de:'Startgewicht' },
  sCarga:    { pt:'Carga máx.', en:'Max load', es:'Carga máx.', fr:'Charge max.', de:'Max. Last' },
  sQueda:    { pt:'Taxa de queda', en:'Descent rate', es:'Tasa de caída', fr:'Taux de chute', de:'Sinkrate' },
  sSusp:     { pt:'Alt. susp.', en:'Susp. height', es:'Alt. susp.', fr:'Haut. susp.', de:'Aufhängung' },
  sAssento:  { pt:'Assento', en:'Seat board', es:'Asiento', fr:'Planchette', de:'Sitzbrett' },
  sPaineis:  { pt:'Painéis', en:'Panels', es:'Paneles', fr:'Panneaux', de:'Bahnen' },
  sHomol:    { pt:'Homologação', en:'Certification', es:'Homologación', fr:'Homologation', de:'Zulassung' },

  videoPlay: { pt:'Ver o vídeo: {n}', en:'Play the video: {n}', es:'Ver el vídeo: {n}',
               fr:'Voir la vidéo : {n}', de:'Video ansehen: {n}' },
  flowVideo: { pt:'Vídeo', en:'Video', es:'Vídeo', fr:'Vidéo', de:'Video' },
  flowVento: { pt:'Gama de vento', en:'Wind range', es:'Rango de viento', fr:'Plage de vent', de:'Windbereich' },
  unidadeKn: { pt:'nós', en:'knots', es:'nudos', fr:'nœuds', de:'Knoten' },
  unidadeKmh:{ pt:'km/h', en:'km/h', es:'km/h', fr:'km/h', de:'km/h' },
  flowDescricao:{ pt:'Descrição', en:'Description', es:'Descripción', fr:'Description', de:'Beschreibung' }
};

/**
 * As palavras que se esconderam dentro de um valor de tabela
 * =========================================================
 *
 * O QUE ACONTECEU
 *   Os campos de especificação — `ptv`, `tamanhos` — são texto simples no
 *   CMS, e texto simples não tem cinco línguas: sai igual em todas. Isso
 *   está certo enquanto o valor for "75–105 kg", que se lê em qualquer
 *   língua. Deixou de estar quando alguém precisou de dizer QUAL das duas
 *   gamas é para que piloto e escreveu, dentro do campo:
 *
 *       75–105 kg (intermédio) / 75–120 kg (avançado)
 *
 *   A partir daí a tabela da RPM 3 e da Cosmos Power 2 tinha duas palavras
 *   portuguesas nas páginas inglesa, espanhola, francesa e alemã. Não foi
 *   um esquecimento de tradução: o campo nunca teve para onde a receber.
 *
 * PORQUE NAO SE RESOLVE PROMOVENDO O CAMPO A OBJECTO
 *   Havia a hipótese de dar cinco línguas ao `ptv`, como os outros campos
 *   traduzíveis. Mas há 84 valores `ptv` no catálogo e 82 são só números:
 *   obrigar a escrever "75–105 kg" cinco vezes em 82 sítios para resolver
 *   dois é piorar o CMS para toda a gente por causa da excepção.
 *
 * O QUE SE FAZ EM VEZ DISSO
 *   O qualificador é vocabulário fechado — não é prosa. Vive aqui, com as
 *   cinco línguas, e os dois lados que desenham a tabela traduzem-no à
 *   passagem. E como vocabulário fechado tem um risco próprio — alguém
 *   escrever amanhã uma palavra nova que ninguém traduz — a verificação 11
 *   recusa qualquer palavra destes campos que não esteja nesta lista.
 *   É isso que torna a lista segura: não é preciso lembrar dela.
 */
export const QUALIFICADORES = {
  'intermédio':    { pt:'intermédio', en:'intermediate', es:'intermedio',
                     fr:'intermédiaire', de:'fortgeschritten' },
  'avançado':      { pt:'avançado', en:'advanced', es:'avanzado',
                     fr:'confirmé', de:'erfahren' },
  'tamanho único': { pt:'tamanho único', en:'one size', es:'talla única',
                     fr:'taille unique', de:'Einheitsgröße' }
};

/* Substitui os qualificadores conhecidos dentro de um valor de tabela.
   Vai do mais longo para o mais curto para que "tamanho único" nunca seja
   partido por uma entrada mais curta que apareça primeiro. */
export function comQualificadores(valor, lingua) {
  if (valor == null) return valor;
  let s = String(valor);
  const chaves = Object.keys(QUALIFICADORES).sort((a, b) => b.length - a.length);
  for (const k of chaves) {
    const traduzido = QUALIFICADORES[k][lingua] || QUALIFICADORES[k].pt;
    if (traduzido === k) continue;
    s = s.split(k).join(traduzido);
  }
  return s;
}

/**
 * Um título não leva ponto final
 * ==============================
 *
 * A REGRA
 *   Um título nomeia, não afirma. O ponto fecha uma frase, e um título não
 *   é uma frase — é uma etiqueta. Vale para h1, h2 e h3, nas 140 páginas e
 *   nas que vierem.
 *
 * O CASO QUE OBRIGA A PENSAR
 *   O h1 do /pilot2wing/ tem duas linhas:
 *
 *       Toda a gente começa pela asa.
 *       Nós começamos pelo piloto.
 *
 *   Escrito, é `<h1>A<br><span>B.</span></h1>`. Há DOIS pontos, e o
 *   segundo está dentro de um `<span>`. Uma regra que só apagasse o
 *   caractere antes de `</h1>` não apanhava nenhum dos dois.
 *
 *   Por isso o título parte-se pelos `<br>` e trata-se cada linha como um
 *   título por direito próprio — que é o que ela é, para quem lê. E o
 *   ponto pode vir seguido de etiquetas a fechar.
 *
 * O QUE NAO SE APAGA
 *   Reticências, porque `…` não é um ponto que sobra — é intenção. E o
 *   ponto no meio de um título com duas frases fica: só sai o que fecha
 *   a linha.
 */
const FIM_DE_LINHA = /(?<![.…])\.((?:\s*<\/[a-z0-9-]+>)*\s*)$/i;

export function semPontoFinal(txt) {
  return String(txt == null ? '' : txt).replace(FIM_DE_LINHA, '$1');
}

/** A mesma regra, aplicada aos títulos de um documento já montado. */
export function tiraPontosDosTitulos(html) {
  return String(html).replace(/(<h[1-3]\b[^>]*>)([\s\S]*?)(<\/h[1-3]>)/gi,
    (todo, abre, dentro, fecha) =>
      abre + dentro.split(/(<br\s*\/?>)/i)
        .map(p => (/^<br/i.test(p) ? p : semPontoFinal(p))).join('') + fecha);
}

/**
 * O que não é palavra
 * ===================
 *
 * O QUE SE VIU
 *   Um visitante com o Chrome em português abre a /fr/ e o browser oferece-se
 *   para traduzir. Ele aceita — e tem todo o direito. O que saiu foi isto:
 *
 *       HAPPY SOARING          ->  FELIZ VOO
 *       Parakite em Portugal   ->  Paraquito em Portugal
 *       Parakite e Parapente   ->  Parapente e paraquedas
 *
 *   Mas "Flow Paragliders" e "FelloFly" ficaram intactos. Isso diz o que se
 *   passa: o tradutor reconheceu esses dois como nomes e não reconheceu os
 *   outros. "Happy Soaring" são duas palavras inglesas correntes e "Parakite"
 *   parece um diminutivo — traduziu ambos, e fez o que se lhe pediu.
 *
 * PORQUE E QUE ISTO E DO SITE E NAO DO VISITANTE
 *   Impedir a tradução da página seria a resposta errada: quem lê melhor em
 *   português tem direito a lê-la assim, e desligar isso fecha o site a
 *   quem mais precisa dele. O que o site pode fazer — e não estava a fazer —
 *   é dizer ao tradutor QUAIS pedaços não são texto. `translate="no"` é
 *   norma HTML e o Chrome respeita-a.
 *
 * O QUE ENTRA NESTA LISTA, E O QUE NAO
 *   Entra o que é nome: a casa, o método, as marcas, a categoria que o
 *   negócio define, e os modelos das asas. Não entra "parapente", que é uma
 *   palavra comum e DEVE traduzir-se — quem lê em alemão quer ler
 *   "Gleitschirm". A regra é: se traduzir muda o que a coisa é, não se
 *   traduz; se traduzir só muda a língua, traduz-se.
 *
 *   Os nomes das asas não estão aqui escritos: vêm do catálogo, porque uma
 *   segunda lista de 22 nomes é uma segunda lista para manter.
 */
export const NOMES_INTOCAVEIS = [
  'Happy Soaring',
  'Flow Paragliders',
  'Pilot2Wing',
  'FelloFly',
  'Parakites',           /* antes do singular: o mais longo ganha */
  'Parakite',
  'Parawing',
  'SmartGround'          /* o nome antigo do Pilot2Wing, que ainda circula */
];

/* limite de palavra sem expressao regular: o que esta antes e depois nao
   pode ser letra nem digito, senao "Parakite" apanhava "Parakiteboard" */
function eLetra(c) {
  return c !== undefined && /[0-9A-Za-zÀ-ÿ]/.test(c);
}

/* Marca os nomes dentro de UM pedaço de texto. Recebe texto que ja vem
   escapado e devolve HTML — os unicos sinais `<` que acrescenta sao os das
   etiquetas que ela propria escreve. */
function marcaTexto(txt, nomes) {
  let fora = '', i = 0, achou = false;
  while (i < txt.length) {
    let nome = null;
    for (const n of nomes) {
      if (txt.startsWith(n, i) && !eLetra(txt[i - 1]) && !eLetra(txt[i + n.length])) {
        nome = n; break;
      }
    }
    if (nome) {
      fora += '<span class="hs-nome" translate="no">' + nome + '</span>';
      i += nome.length; achou = true;
    } else { fora += txt[i]; i++; }
  }
  return achou ? fora : txt;
}

/**
 * Marca os nomes no CORPO de um documento HTML já montado.
 *
 * Trabalha só no texto entre etiquetas, nunca dentro delas. E a razão é
 * concreta: os mesmos nomes vivem em `alt=`, em `content=`, no `<title>` e
 * no JSON-LD, e um `<span>` enfiado ali dentro não é marcação — é lixo que
 * o Google lê como parte do título. Por isso o `<head>` fica de fora
 * inteiro, e dentro do corpo saltam-se o `<script>` e o `<style>`.
 */
export function protegeNomes(html, extra) {
  const nomes = NOMES_INTOCAVEIS.concat(extra || [])
    .filter(Boolean).sort((a, b) => b.length - a.length);

  const ini = html.indexOf('<body');
  if (ini < 0) return html;
  const abre = html.indexOf('>', ini);
  const fim = html.lastIndexOf('</body>');
  if (abre < 0 || fim < 0) return html;

  /* Elementos que nunca fecham: nao entram na pilha, senao a pilha nunca
     mais desce e a partir do primeiro <br> o documento inteiro parecia
     estar dentro dele. */
  const VAZIOS = new Set(['br', 'img', 'meta', 'link', 'input', 'hr', 'source',
    'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);

  /* O QUE ESTA DENTRO DE UM `<script>` NAO E HTML
     A primeira versao entrava no script e ia procurando `<` e `>` como se
     fossem etiquetas. Dentro de JavaScript ha `x<0` e `a > b`, e o leitor
     apanhava `<0` como uma etiqueta a abrir, engolia o `</script>` a
     caminho do `>` seguinte, e ficava convencido de que o script nunca
     tinha fechado. A partir dai TODO o resto do documento era saltado.

     Medido na /asas/mullet-2/: dez nomes por proteger depois do primeiro
     script, incluindo o rodape e "A Happy Soaring é revendedor oficial".

     A norma trata estes elementos como texto cru: o conteudo copia-se tal
     e qual ate ao fecho correspondente, sem o interpretar. E o que se faz
     aqui — e por isso o contador `mudo` desapareceu, deixou de haver
     estado nenhum para se prender. */
  const CRUS = new Set(['script', 'style', 'textarea', 'title']);

  const corpo = html.slice(abre + 1, fim);
  const pilha = [];
  let saida = '', i = 0, protegido = 0;
  while (i < corpo.length) {
    const t = corpo.indexOf('<', i);
    const texto = t < 0 ? corpo.slice(i) : corpo.slice(i, t);
    /* dentro de `translate="no"` nao se marca outra vez: e o que torna esta
       funcao idempotente */
    saida += protegido ? texto : marcaTexto(texto, nomes);
    if (t < 0) break;
    const f = corpo.indexOf('>', t);
    if (f < 0) { saida += corpo.slice(t); break; }
    const etiqueta = corpo.slice(t, f + 1);
    const nome = (etiqueta.match(/^<\/?\s*([a-zA-Z0-9-]+)/) || [])[1];
    if (nome) {
      const baixo = nome.toLowerCase();
      const fecha = etiqueta[1] === '/';
      const solto = etiqueta.slice(-2) === '/>' || VAZIOS.has(baixo);
      if (!fecha && !solto && CRUS.has(baixo)) {
        /* salta o conteudo inteiro de uma vez, sem o ler */
        const fim2 = corpo.toLowerCase().indexOf('</' + baixo, f);
        if (fim2 < 0) { saida += corpo.slice(t); break; }
        const f3 = corpo.indexOf('>', fim2);
        if (f3 < 0) { saida += corpo.slice(t); break; }
        saida += corpo.slice(t, f3 + 1);
        i = f3 + 1;
        continue;
      }
      if (fecha) {
        /* desenrola ate ao elemento que fecha: um documento com uma
           etiqueta por fechar nao pode deixar a pilha presa para sempre */
        for (let k = pilha.length - 1; k >= 0; k--) {
          if (pilha[k].nome === baixo) {
            for (let j = pilha.length - 1; j >= k; j--) {
              if (pilha[j].protege) protegido = Math.max(0, protegido - 1);
            }
            pilha.length = k;
            break;
          }
        }
      } else if (!solto) {
        const protege = /\btranslate\s*=\s*["']?no\b/i.test(etiqueta);
        pilha.push({ nome: baixo, protege });
        if (protege) protegido++;
      }
    }
    saida += etiqueta;
    i = f + 1;
  }

  /* QUANDO O NOME E O ELEMENTO TODO, NAO E PRECISO SPAN NENHUM
     Um `<a class="ng-l"><span …>Parakite</span></a>` diz o mesmo que um
     `<a class="ng-l" translate="no">Parakite</a>` e tem menos uma caixa.
     E a caixa a mais nao era inofensiva: `.ng-l` e `.qp-cta` sao
     contentores `flex`, e a especificacao BLOQUEIA os filhos de um flex —
     o `display:inline` do marcador e ignorado por regra, nao por cascata.
     Medido: um botao ficava 5px mais largo.

     Aqui desfaz-se isso. So colapsa quando entre a etiqueta e o span nao
     ha mais nada senao espacos, que e o unico caso em que os dois sao
     equivalentes. */
  saida = saida.replace(
    /<([a-z0-9-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>(\s*)<span class="hs-nome" translate="no">([^<]*)<\/span>(\s*)<\/\1>/gi,
    (todo, tag, atrib, e1, texto, e2) =>
      /\btranslate\s*=/i.test(atrib) ? todo
        : '<' + tag + atrib + ' translate="no">' + e1 + texto + e2 + '</' + tag + '>');

  return html.slice(0, abre + 1) + saida + html.slice(fim);
}

/**
 * A mesma coisa, mas para uma página montada no browser.
 *
 * Aqui não há string de HTML para percorrer: há nós. Percorre-se o texto,
 * que é exactamente o que a versão de cima faz — só muda o material. Cria
 * elementos em vez de escrever etiquetas, e por isso não há nada a escapar.
 */
/**
 * A mesma protecção, mas a durar.
 *
 * PORQUE E QUE UMA PASSAGEM SO NAO CHEGA
 *   A `protegeNomesNoDom` corre no fim do render e apanha o que existe nessa
 *   altura. Mas metade da página inicial só nasce quando alguém mexe nela:
 *   abrir uma família, escolher um chip, abrir a descrição de uma asa. Medido
 *   depois de a ligar: 12 ocorrências de "Parakite" ficavam de fora, todas em
 *   coisas desenhadas mais tarde.
 *
 *   Ir chamar a função a cada sítio que desenha texto era garantir que um dia
 *   fica um de fora — que é exactamente o defeito que se está a corrigir.
 *   Um observador é UM sítio, e cobre o que a página vier a desenhar, mesmo
 *   o que ainda não existe.
 *
 * O CUIDADO OBVIO
 *   Marcar nomes é, ele próprio, mexer no DOM. Sem trava, o observador
 *   reagia ao seu próprio trabalho para sempre. A `ocupado` fecha o ciclo.
 */
export function vigiaNomes(raiz, extra) {
  if (!raiz || typeof document === 'undefined') return null;
  protegeNomesNoDom(raiz, extra);
  tiraPontosNoDom(raiz);
  if (typeof MutationObserver === 'undefined') return null;

  let ocupado = false, agendado = false;
  const pendentes = [];
  const obs = new MutationObserver(muts => {
    if (ocupado) return;
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 || n.nodeType === 3) pendentes.push(n);
      }
    }
    if (!pendentes.length || agendado) return;
    agendado = true;
    /* junta as mutações da mesma volta numa passagem só */
    Promise.resolve().then(() => {
      agendado = false;
      const lote = pendentes.splice(0, pendentes.length);
      ocupado = true;
      try {
        for (const n of lote) {
          if (!n.isConnected) continue;
          /* um nó de texto solto não se percorre: trata-se o pai */
          const alvo = n.nodeType === 3 ? n.parentElement : n;
          if (alvo) { protegeNomesNoDom(alvo, extra); tiraPontosNoDom(alvo); }
        }
      } finally { ocupado = false; }
    });
  });
  obs.observe(raiz, { childList: true, subtree: true });
  return obs;
}

/**
 * A regra dos titulos, na pagina que se monta no browser.
 *
 * As 140 paginas geradas ja saem sem ponto: o gerador aplica a regra ao
 * documento inteiro antes de o escrever. A pagina inicial nao tem gerador —
 * os titulos dela vem do CMS e sao escritos aqui — e por isso a regra tem
 * de existir tambem deste lado. Assim, quem escrever um titulo com ponto
 * no CMS ve-o sair sem ele, em vez de ver a pagina desobedecer a regra.
 *
 * Corre no mesmo observador que protege os nomes proprios, pela mesma
 * razao: metade da inicial so nasce quando alguem mexe nela, e uma
 * passagem unica no fim do render nao ve o que ainda nao existe.
 *
 * COMO E QUE UM TITULO SE PARTE EM LINHAS
 *   O h1 do wordmark e HAPPY<br><span>SOARING</span>: um <br> comeca uma
 *   linha nova, e cada linha e um titulo por direito proprio para quem le.
 *   Por isso junta-se os nos de texto por linha e trata-se o ULTIMO de
 *   cada uma — que pode estar dentro de um <span>, como esta ali.
 */
export function tiraPontosNoDom(raiz) {
  if (!raiz || typeof document === 'undefined') return;
  const tits = [];
  if (raiz.matches && raiz.matches('h1,h2,h3')) tits.push(raiz);
  if (raiz.querySelectorAll) tits.push(...raiz.querySelectorAll('h1,h2,h3'));

  for (const h of tits) {
    /* percorre elementos e texto pela ordem em que aparecem, para saber
       onde os <br> caem */
    const it = document.createTreeWalker(h, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    const linhas = [[]];
    let n;
    while ((n = it.nextNode())) {
      if (n.nodeType === 1) { if (n.tagName === 'BR') linhas.push([]); continue; }
      if ((n.nodeValue || '').trim()) linhas[linhas.length - 1].push(n);
    }
    for (const linha of linhas) {
      const ultimo = linha[linha.length - 1];
      if (!ultimo) continue;
      const cauda = (ultimo.nodeValue || '').replace(/\s+$/, '');
      const limpo = semPontoFinal(cauda);
      if (limpo !== cauda) ultimo.nodeValue = limpo;
    }
  }
}

export function protegeNomesNoDom(raiz, extra) {
  if (!raiz || typeof document === 'undefined') return;
  const nomes = NOMES_INTOCAVEIS.concat(extra || [])
    .filter(Boolean).sort((a, b) => b.length - a.length);

  const it = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const et = p.tagName;
      if (et === 'SCRIPT' || et === 'STYLE' || et === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
      if (p.closest('[translate="no"]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const alvos = [];
  let n; while ((n = it.nextNode())) alvos.push(n);

  for (const no of alvos) {
    const txt = no.nodeValue || '';
    let i = 0, frag = null, corrente = '';
    while (i < txt.length) {
      let nome = null;
      for (const x of nomes) {
        if (txt.startsWith(x, i) && !eLetra(txt[i - 1]) && !eLetra(txt[i + x.length])) {
          nome = x; break;
        }
      }
      if (nome) {
        if (!frag) frag = document.createDocumentFragment();
        if (corrente) { frag.appendChild(document.createTextNode(corrente)); corrente = ''; }
        const s = document.createElement('span');
        s.className = 'hs-nome';
        s.setAttribute('translate', 'no');
        s.textContent = nome;
        frag.appendChild(s);
        i += nome.length;
      } else { corrente += txt[i]; i++; }
    }
    if (frag) {
      if (corrente) frag.appendChild(document.createTextNode(corrente));
      const pai = no.parentNode;
      pai.replaceChild(frag, no);
      /* o mesmo colapso da versão de texto: se o elemento ficou com um
         único filho, que é o marcador, a marca vai para o elemento e o
         marcador desaparece. Poupa uma caixa e, nos contentores `flex`,
         poupa os 5px que a blockificação dos filhos acrescentava. */
      if (pai.nodeType === 1 && pai.children.length === 1
          && pai.firstElementChild.classList.contains('hs-nome')
          && !pai.hasAttribute('translate')
          && pai.textContent === pai.firstElementChild.textContent) {
        const so = pai.firstElementChild;
        pai.setAttribute('translate', 'no');
        pai.replaceChild(document.createTextNode(so.textContent), so);
      }
    }
  }
}
