// Filtre des commentaires, messages de sortie, mots envoyés à un pote, prénoms et pseudos : une première barrière contre
// les insultes et la haine les plus courantes, avant la modération humaine (logiciel de gestion).
// Comparé sans accents, sans majuscules ni ponctuation, et en déjouant les ruses habituelles : chiffres collés
// (« connard69 »), lettres espacées ou pointées (« c o n n a r d », « c.o.n.n.a.r.d »), lettres répétées (« connnnard »),
// chiffres à la place des lettres (« c0nn4rd »). Volontairement courte : elle bloque l'évident sans gêner les
// conversations normales (« je crève de faim », « pain bâtard », « bœuf mongol », « je suis retardé » passent).
// Les fonctions sont dans validation/ : contientMotInterdit (textes) et nomPublicContientMotInterdit (pseudos, prénoms).

export const LONGUEUR_MAX_COMMENTAIRE = 500;

/**
 * Expressions refusées partout, en minuscules et sans accents. Par défaut, mot ou expression entière ;
 * un « * » à la fin d'un mot accepte tout mot qui commence ainsi (« connard* » attrape aussi « connards »).
 * Les mots qui ont aussi un sens tout à fait normal (« retardé », « mongol ») ne sont refusés que dans une tournure d'insulte.
 */
export const EXPRESSIONS_INTERDITES: readonly string[] = [
  // Insultes
  "connard*", "conard*", "connasse*", "conasse*", "salope", "salopes", "salopard*", "salaud*", "encule*", "enfoire*",
  "batard*", "fils de pute", "pute", "putes", "nique ta*", "ntm", "tg", "ferme ta gueule",
  // « petasse » ; « tapette » seulement en insulte (la tapette à mouches passe)
  "petasse*", "sale tapette*", "sales tapette*", "espece de tapette*", "grosse tapette*", "t es une tapette*", "tes une tapette*",
  // Homophobie
  "pd", "pds", "pede", "pedes", "tarlouze*", "gouine*", "tafiole*",
  // Racisme et antisémitisme
  // « negro » en mot entier seulement : le negroni (cocktail) passe
  "negre*", "negro", "negros", "bougnoul*", "youpin*", "bicot*",
  "sale arabe*", "sales arabe*", "sale noir*", "sales noir*", "sale juif*", "sales juif*", "sale juive*", "sales juive*",
  "sale blanc*", "sales blanc*",
  // Validisme : seulement en insulte (« on retarde d'une heure », « le train est retardé », « bœuf mongol » passent)
  "mongolien*", "mongolo", "mongolos", "espece de mongol*", "bande de mongol*", "sale mongol*", "sales mongol*",
  "gros mongol*", "grosse mongol*", "t es un mongol*", "t es une mongol*", "tes un mongol*", "tes une mongol*", "t es mongol*",
  "retarde* mental*", "espece de retarde*", "bande de retarde*", "sale retarde*", "sales retarde*", "gros retarde*",
  "grosse retarde*", "t es un retarde*", "t es une retarde*", "tes un retarde*", "tes une retarde*",
  // Menaces
  "suicide toi", "va te suicider", "va crever", "je vais te tuer", "je vais te buter",
];

/**
 * En plus, pour les noms montrés à tout le monde (pseudo, prénom) : des mots trop courants dans une conversation pour
 * être refusés dans un message (« c'est pas con », « oh merde, j'ai oublié »), mais pas comme nom.
 */
export const EXPRESSIONS_INTERDITES_NOM_PUBLIC: readonly string[] = [
  "con", "cons", "conne", "connes", "merde*", "bite", "bites", "couille*", "nazi", "nazis", "hitler*", "pedophile*", "pedo", "pedos",
];

/**
 * Morceaux refusés même collés à d'autres lettres (« filsdepute », « groconnard », « niquetamere42 »).
 * Écrits avec leurs espaces pour la lecture, comparés sans. Seulement des formes assez longues et assez rares pour ne
 * jamais tomber dans un mot normal ou un nom : « pute » est dans « computer » et « député », « ntm » dans « Montmartre »,
 * « nègre » dans « Anne Grégoire », « bicot » dans « abricot ». Ceux-là restent des mots entiers (liste du dessus).
 */
export const MORCEAUX_INTERDITS: readonly string[] = [
  "connard", "connasse", "conasse", "salope", "salopard", "salaud", "encule", "enfoire", "batard", "tarlouze", "tafiole",
  "bougnoul", "youpin", "gouine", "mongolien", "retarde mental", "espece de mongol", "espece de retarde",
  "fils de pute", "nique ta mere", "nique ta race", "nique ta soeur", "ferme ta gueule",
  "sale arabe", "sale noir", "sale juif", "sale juive", "sale blanc", "sale pute",
  "suicide toi", "va te suicider", "va crever", "je vais te tuer", "je vais te buter",
];

/**
 * Expressions tout à fait correctes qui contiennent un mot de la liste : retirées du texte avant de chercher
 * (« pain bâtard », « Isa Lopez »). Même écriture que EXPRESSIONS_INTERDITES (« * » à la fin d'un mot).
 */
export const EXPRESSIONS_PERMISES: readonly string[] = [
  "pain batard*", "pains batard*", "sauce batard*", "sauces batard*", "chien batard*", "chiens batard*",
  "salopette*", "saloperie*", "baragouin*", "lopez", "lopes", "con carne", "con leche",
];
