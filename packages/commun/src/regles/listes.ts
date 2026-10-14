// Règles des listes de lieux (décidées le 14 octobre 2026) : l'auteur les remplit et choisit qui les voit ; il peut inviter
// des potes de sa bande à les remplir avec lui. Les limites 40 et 140 étaient dans l'écran de l'app : elles passent ici.
// Les nombres sans décision de Hugo sont des choix de construction à lui confirmer.
import type { VisibiliteListe } from "../types/listes.ts";

export const LONGUEUR_MAX_TITRE_LISTE = 40;
export const LONGUEUR_MAX_DESCRIPTION_LISTE = 140;

export const MAX_LISTES_PAR_COMPTE = 50;
export const MAX_LIEUX_PAR_LISTE = 100;
/** Des potes de la bande de l'auteur ; un refus reste noté 30 jours */
export const MAX_CO_AUTEURS_LISTE = 10;

/** « tous » : qui voit le profil en public (tout le monde pour un compte public, abonnés et bande pour un compte privé) */
export const VISIBILITES_LISTE = ["tous", "bande"] as const satisfies readonly VisibiliteListe[];
