// Les statistiques d'un lieu, pour son équipe (gérant et équipe, au comptoir : mode pro de l'app, puis pro.sosmiam.fr). Elles
// sont comptées par semaine, du lundi au dimanche, à l'heure de Paris. Les vues de la fiche sont comptées sans pister personne :
// un simple compteur par jour et par lieu (docs/decisions.md, « Décidé le 9 octobre 2026, au soir »).

/** Semaines rendues quand on ne précise rien */
export const SEMAINES_STATISTIQUES_DEFAUT = 8;
/** Semaines rendues au plus (un semestre) */
export const SEMAINES_STATISTIQUES_MAX = 26;

export type StatistiquesSemaine = {
  /** Semaine ISO, « 2026-S41 » */
  semaine: string;
  /** Son lundi, jour de Paris « 2026-10-05 » */
  debut: string;
  /** Vues de la fiche dans l'app : une par visiteur et par jour, sans jamais savoir qui */
  vues: number;
  /** Rescousses reçues cette semaine */
  rescousses: number;
  /** Visites validées cette semaine, offertes comprises (une validation annulée ne compte plus) */
  visitesValidees: number;
  /** Personnes dont la toute première visite validée ici tombe cette semaine */
  nouveauxClients: number;
};

/** GET /pro/comptoir/lieux/:id/statistiques : de la semaine en cours (la première) à la plus ancienne */
export type StatistiquesLieu = { semaines: StatistiquesSemaine[] };
