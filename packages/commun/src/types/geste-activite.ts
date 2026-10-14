// Un geste de l'activité fait sur le téléphone et pas encore confirmé par l'API (/app/activite) : affiché tout de suite
// (appliquerGesteActivite), puis envoyé une demande après l'autre. Les gardes, J'aime, masques et suivis se rejouent sans
// risque (PUT et DELETE) : ils attendent le réseau sur le téléphone. Une rescousse n'attend jamais : sans réseau, elle est
// défaite tout de suite.

export type GesteActiviteEnAttente =
  | { quoi: "garde"; lieuId: number; oui: boolean }
  | { quoi: "jaime"; publicationId: string; oui: boolean }
  /** « Pas intéressé » : masquée pour soi seulement */
  | { quoi: "masque"; publicationId: string; oui: boolean }
  /** cle : « lieu:<id> » ou « createur:<pseudo> » seulement (les personnes se suivent ailleurs) */
  | { quoi: "suivi"; cle: string; oui: boolean }
  /** oui : donner la rescousse ; non : la reprendre (jamais gardé sur le téléphone) */
  | { quoi: "rescousse"; lieuId: number; oui: boolean };
