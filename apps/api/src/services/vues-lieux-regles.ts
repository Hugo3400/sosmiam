// Vues de la fiche d'un lieu dans l'app (voir routes/vues-lieux.ts) : ce que la route demande aux données. Un simple compteur
// par lieu et par jour de Paris (table vues_lieux), jamais qui a regardé. Sans accès à la base : lu aussi par le double en
// mémoire (vues-lieux-en-memoire.ts). Prisma : vues-lieux.ts.

/**
 * Visiteurs × lieux reconnus en mémoire pour la journée (une empreinte de 22 caractères chacun, quelques dizaines de Mo au
 * plus). Au-delà, plus aucune nouvelle vue n'est comptée jusqu'à minuit : mieux vaut sous-compter que gonfler les chiffres.
 */
export const VUES_RETENUES_MAX = 200_000;

export interface ServicesVuesLieux {
  /**
   * Ajoute une vue au compteur du lieu pour ce jour de Paris (« AAAA-MM-JJ »), seulement s'il est publié.
   * false : lieu inconnu, brouillon ou masqué (rien n'est écrit).
   */
  ajouterVue(lieuId: number, jour: string): Promise<boolean>;
}
