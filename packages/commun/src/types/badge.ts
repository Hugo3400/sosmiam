// Badges d'un compte : le catalogue d'affichage (contenus/badges.ts) et les critères des badges donnés d'office par le
// serveur (regles/badges-automatiques.ts).

/** Tous les badges connus. « iode » (type de plat) et « bande » (sorties entre potes) attendent encore leur mesure */
export type IdBadge =
  | "premiere-rescousse"
  | "sauveteur-en-serie"
  | "second-du-capitaine"
  | "heros-de-la-brigade"
  | "coeur-sur-la-main"
  | "bonne-etoile"
  | "premier-sauveteur"
  | "vigie"
  | "deniche-par-toi"
  | "fondateur"
  | "fine-fourchette"
  | "fourchette-d-or"
  | "tour-de-table"
  | "bec-sucre"
  | "creme-de-la-creme"
  | "as-du-gouter"
  | "habitue"
  | "mordu-de-miam"
  | "legende-du-miam"
  | "serie-4"
  | "saison-complete"
  | "marathon-du-miam"
  | "un-an-de-miam"
  | "iode"
  | "noctambule"
  | "curieux"
  | "explorateur"
  | "baroudeur"
  | "bande"
  | "premiere-plume"
  | "plume-gourmande"
  | "plume-d-or"
  | "oeil-de-chef"
  | "objectif-gourmand";

/** Un badge tel qu'on le montre (app, logiciel de gestion, et plus tard le site) */
export type BadgeCatalogue = {
  id: IdBadge;
  emoji: string;
  nom: string;
  /** Comment on l'obtient, au tutoiement */
  texte: string;
};
