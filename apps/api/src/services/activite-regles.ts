// L'activité de l'app (GET /app/activite et ses gestes) : contrat commun du service Prisma et de son double en mémoire.
// Points et badges ne sont pas ici : le contrôleur les donne (ajouterPoints, donnerBadge), une fois le geste écrit.
import type { ActiviteApi } from "../../../../packages/commun/src/types/activite.ts";

/** Ce qu'on bascule (oui / non) : un lieu gardé, un J'aime, une publication masquée, un lieu ou un créateur suivi */
export type GesteActivite = { quoi: "garde"; lieuId: number } | { quoi: "jaime" | "masque"; publicationId: number } | { quoi: "suivi-lieu"; lieuId: number } | { quoi: "suivi-createur"; pseudo: string };

export type ResultatRescousse =
  | { ok: true; /** Déjà donnée cette semaine : rien n'a changé */ deja: boolean; /** Toute première rescousse d'un lieu nouveau */ premierSauveteur: boolean }
  | { ok: false; erreur: "lieu-inconnu" | "lieu-non-verifie" | "plus-de-rescousse" };

export type ResultatReprise = { ok: true; /** Faux : pas de rescousse cette semaine à reprendre */ reprise: boolean; /** Il perd son titre de premier sauveteur */ premierSauveteurRetire: boolean };

export interface ServicesActivite {
  lireActivite(compteId: number, maintenant: Date): Promise<ActiviteApi>;
  /** Donne une rescousse (3 par semaine, lieu publié et vérifié) ; premier sauveteur si le lieu est nouveau et sans sauveteur */
  donnerRescousse(compteId: number, lieuId: number, maintenant: Date): Promise<ResultatRescousse>;
  /** Reprend la rescousse de cette semaine ; sans autre rescousse à ce lieu, il n'en est plus le premier sauveteur */
  reprendreRescousse(compteId: number, lieuId: number, maintenant: Date): Promise<ResultatReprise>;
  /** Met ou retire ; « lieu-inconnu » ou « publication-inconnue » si la cible n'est pas publiée (le retrait marche toujours) */
  basculer(compteId: number, geste: GesteActivite, oui: boolean): Promise<{ ok: true } | { ok: false; erreur: "lieu-inconnu" | "publication-inconnue" }>;
}

/** Le pseudo d'un créateur suivi : celui de ses publications (lettres, chiffres, point, tiret, souligné ; 40 au plus) */
export const FORME_PSEUDO_CREATEUR = /^[a-z0-9._-]{1,40}$/;
