// Statistiques d'un lieu pour son équipe (voir controleurs/statistiques-lieu.ts) : ce que la route demande aux données, brut.
// Le rangement par semaine de Paris est fait une seule fois, au-dessus (fonctions/statistiques/calculer-statistiques-semaines.ts).
// Sans accès à la base : lu aussi par le double en mémoire (statistiques-lieu-en-memoire.ts). Prisma : statistiques-lieu.ts.

/** Le compteur des vues de la fiche pour un jour de Paris (« AAAA-MM-JJ ») */
export type VuesDuJour = { jour: string; nombre: number };
/** Le nombre de rescousses reçues une semaine (« 2026-S41 ») */
export type RescoussesDeLaSemaine = { semaine: string; nombre: number };

export interface ServicesStatistiquesLieu {
  /** Les compteurs des vues de la fiche, du jour `du` au jour `au` compris (un jour sans vue peut manquer) */
  listerVues(lieuId: number, du: string, au: string): Promise<VuesDuJour[]>;
  /** Les rescousses reçues ces semaines-là (une semaine sans rescousse peut manquer) */
  compterRescousses(lieuId: number, semaines: string[]): Promise<RescoussesDeLaSemaine[]>;
  /** Le moment de validation de chaque visite validée (statut « validee ») depuis `depuis` */
  listerValidations(lieuId: number, depuis: Date): Promise<Date[]>;
  /** Pour chaque client dont la toute première visite validée ici date de `depuis` ou après : le moment de celle-ci */
  listerPremieresValidations(lieuId: number, depuis: Date): Promise<Date[]>;
}
