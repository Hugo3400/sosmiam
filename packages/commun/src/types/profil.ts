// Profil d'un utilisateur de l'app SOS Miam. Pour l'instant gardé seulement sur le téléphone (pas encore d'API).

/** Catégories d'envies demandées à l'inscription (contenu : apps/app-mobile/src/contenus/inscription/envies.ts). */
export type CategorieEnvie = "lieux" | "cuisines" | "boissons" | "bars" | "musique" | "jeux" | "moments" | "regimes";

export type Profil = {
  prenom: string;
  /** Facultatif : on ne collecte que le nécessaire (RGPD) */
  nom?: string;
  /** Pseudo unique pour que les potes te trouvent (sans « @ ») ; absent dans les profils créés avant Potes */
  pseudo?: string;
  /** Date de naissance au format AAAA-MM-JJ */
  dateNaissance: string;
  ville: string;
  /**
   * Choix cochés, par catégorie. Attention : « regimes » peut révéler une religion (halal, casher) ou un état de santé
   * (allergies, sans gluten) : avant tout envoi au serveur, il faudra un accord explicite (RGPD, article 9).
   */
  envies: Partial<Record<CategorieEnvie, string[]>>;
  /** Date de création, au format ISO */
  creeLe: string;
};
