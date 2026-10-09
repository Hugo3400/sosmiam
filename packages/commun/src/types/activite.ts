// L'activité d'un compte dans l'app, telle que l'API la rend (GET /app/activite) : rescousses de la semaine et leur
// historique, premier sauveteur, lieux gardés, J'aime, publications masquées pour soi, lieux et créateurs suivis.

export type ActiviteApi = {
  /** La semaine en cours à l'heure de Paris (valeur opaque : elle change le lundi) */
  semaine: string;
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  /** Lieux qui ont reçu ta rescousse cette semaine */
  rescoussesSemaine: number[];
  /** Tous les lieux que tu as sauvés, du plus récent au plus ancien, une fois chacun */
  lieuxSauves: number[];
  /** Rescousses données depuis toujours, et ce mois-ci (à l'heure de Paris) */
  rescoussesDonnees: number;
  rescoussesDuMois: number;
  /** Lieux dont tu es le premier sauveteur */
  premiersSauvetages: number[];
  /** Lieux gardés (🔖), du plus récent au plus ancien */
  gardes: number[];
  /** Publications aimées et masquées (« Pas intéressé »), en texte comme leurs identifiants */
  jaimes: string[];
  masques: string[];
  /** Lieux et créateurs suivis : « lieu:<id> », « createur:<pseudo> », du plus récent au plus ancien */
  suivis: string[];
};
