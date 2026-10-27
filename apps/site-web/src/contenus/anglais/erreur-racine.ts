import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_ERREUR_RACINE } from "~/contenus/erreur-racine";

export const TEXTES_ERREUR_RACINE_ANGLAIS: Traduction<typeof TEXTES_ERREUR_RACINE> = {
  erreur: {
    titre: "Oops, we hit a snag",
    details: "Something went wrong. Try again in a moment.",
  },
  introuvable: {
    titre: "Page not found",
    details: "This page has done a runner. Head back to the home page to find your next table.",
  },
  suffixeTitre: " — SOS Miam",
  retour: "Back to the home page",
};
