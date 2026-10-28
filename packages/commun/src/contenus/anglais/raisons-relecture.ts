import type { Traduction } from "../../types/traduction.ts";
import type { LIBELLES_MOTIF_AVIS_LOUCHE, LIBELLES_RAISON_RELECTURE } from "../raisons-relecture.ts";

export const LIBELLES_RAISON_RELECTURE_ANGLAIS: Traduction<typeof LIBELLES_RAISON_RELECTURE> = {
  "rafale-notes": "A lot of very clear-cut reviews of this place in a short time",
  "compte-neuf": "One of an account's very first reviews, checked as a matter of course",
  "mots-filtres": "A word made our filter raise an eyebrow: your call whether it belongs",
  "lieu-sous-alerte": "We're taking a slightly closer look at this place's reviews at the moment",
  tirage: "Luck of the draw: every so often, we check a few reviews at random",
};

export const LIBELLES_MOTIF_AVIS_LOUCHE_ANGLAIS: Traduction<typeof LIBELLES_MOTIF_AVIS_LOUCHE> = {
  "hors-sujet": "Off topic: it's not about this place",
  attaque: "Goes after a person",
  "faux-avis": "Looks like a fake review",
  "infos-perso": "Shares personal details",
  autre: "Something else",
};
