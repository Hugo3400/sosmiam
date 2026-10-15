// Cartes de fidélité des lieux : réglages permis au lieu, demande de récompense, alcool (voir docs/decisions.md,
// « Scan et validation des visites »). Le lieu choisit ce qu'il offre ; la récompense avec alcool s'affiche avec le
// message sanitaire, et jamais en visite sans compte (seulement sa version sans alcool, facultative, si elle existe).

/** Nombre de visites validées pour remplir la carte : 5 par défaut, de 3 à 10 */
export const VISITES_FIDELITE_DEFAUT = 5;
export const VISITES_FIDELITE_MIN = 3;
export const VISITES_FIDELITE_MAX = 10;

/** Longueur du texte de la récompense (« Un tiramisu maison »), espaces du début et de la fin retirés */
export const RECOMPENSE_LONGUEUR_MIN = 3;
export const RECOMPENSE_LONGUEUR_MAX = 60;

/** Durée d'une demande de récompense (le code montré à l'équipe) */
export const DUREE_DEMANDE_RECOMPENSE_MS = 15 * 60_000;

/** Un programme coupé honore encore les récompenses prêtes pendant ce nombre de jours */
export const JOURS_HONNEUR_RECOMPENSES = 30;

/**
 * Mots qui signalent une récompense avec alcool (mots entiers, sans accent ni majuscule) : ils cochent d'office
 * « Il y a de l'alcool dedans ». Première barrière : le lieu reste responsable de ce qu'il sert.
 */
export const MOTS_ALCOOL: readonly string[] = [
  "vin", "vins", "biere", "bieres", "pinte", "spritz", "apero", "aperitif", "cocktail", "cocktails", "shot", "shots",
  "picpoul", "muscat", "champagne", "cremant", "prosecco", "cidre", "pastis", "ricard", "rhum", "whisky", "vodka", "gin",
  "tequila", "mezcal", "kir", "mojito", "sangria", "digestif", "liqueur", "limoncello", "porto", "martini",
  "cognac", "armagnac", "calvados", "caipirinha", "margarita", "ipa",
  "muscadet", "chardonnay", "sauvignon", "merlot", "syrah", "riesling",
  "whiskey", "sake", "absinthe", "vermouth", "amaretto", "grappa", "ouzo", "genepi", "hydromel",
  "bourbon", "chablis", "sancerre", "beaujolais",
];

const HOMONYMES_ALCOOL = ["porto", "bourbon", "chablis", "sancerre", "beaujolais"];
const CONTENANTS_ALCOOL = ["verre", "bouteille", "coupe", "flute", "pichet", "carafe", "ballon", "magnum", "fond", "larme", "degustation", "masterclass"];

export const EXPRESSIONS_ALCOOL: readonly string[] = [
  "un mousseux", "du mousseux", "le mousseux", "au mousseux",
  ...CONTENANTS_ALCOOL.flatMap((contenant) => [...HOMONYMES_ALCOOL, "mousseux"].map((mot) => `${contenant} de ${mot}`)),
  "beaujolais nouveau", "beaujolais villages",
];

export const EXPRESSIONS_SANS_ALCOOL: readonly string[] = [
  ...["a", "de", "depuis", "pour", "vers"].flatMap((avant) => HOMONYMES_ALCOOL.map((lieu) => `${avant} ${lieu}`)),
  "du beaujolais", "en beaujolais", "dans le beaujolais",
  "porto vecchio", "porto novo", "porto rico", "porto alegre", "porto santo", "fc porto",
  "vanille bourbon", "vanilles bourbon", "bourbon vanille", "vanilla bourbon", "bourbon vanilla",
  "ile bourbon", "cafe bourbon", "bourbon pointu", "palais bourbon", "rose bourbon", "biscuit bourbon",
  "bourbon lancy", "bourbon l archambault",
];
