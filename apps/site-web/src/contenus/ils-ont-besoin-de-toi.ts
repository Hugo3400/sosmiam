const nombreFr = new Intl.NumberFormat("fr-FR");

export const TEXTES_ILS_ONT_BESOIN_DE_TOI = {
  titre: "Ils ont besoin de toi",
  chapo: "Des lieux nouveaux ou trop calmes, qui méritent plus de monde.",
  filtres: "Filtrer les lieux",
  tout: "Tout",
  voirTous: (nombre: number | null) => (nombre && nombre > 1 ? `Voir les ${nombreFr.format(nombre)} lieux, sur la carte` : "Voir tous les lieux"),
  tirage: "8 lieux tirés au sort chaque jour, ceux en SOS ce soir d'abord. Tous les autres t'attendent sur la carte.",
} as const;
