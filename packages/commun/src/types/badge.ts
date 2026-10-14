// Badges d'un compte : le catalogue d'affichage (contenus/badges.ts) et les critères des badges donnés d'office par le
// serveur (regles/badges-automatiques.ts).

/** Tous les badges connus. « iode » (type de plat) et « bande » (sorties entre potes) attendent encore leur mesure */
export type IdBadge =
  | "premiere-rescousse"
  | "premier-sauveteur"
  | "deniche-par-toi"
  | "fondateur"
  | "bec-sucre"
  | "serie-4"
  | "iode"
  | "noctambule"
  | "explorateur"
  | "bande";

/** Un badge tel qu'on le montre (app, logiciel de gestion, et plus tard le site) */
export type BadgeCatalogue = {
  id: IdBadge;
  emoji: string;
  nom: string;
  /** Comment on l'obtient, au tutoiement */
  texte: string;
};
