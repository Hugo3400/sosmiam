import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_ERREUR_RACINE_ANGLAIS } from "~/contenus/anglais/erreur-racine";

export const TEXTES_ERREUR_RACINE = {
  erreur: {
    titre: "Oups, une erreur",
    details: "Quelque chose s'est mal passé. Réessaie dans un instant.",
  },
  introuvable: {
    titre: "Page introuvable",
    details: "Cette page s'est fait la malle. Reviens à l'accueil pour trouver ta prochaine table.",
  },
  suffixeTitre: " — SOS Miam",
  retour: "Retour à l'accueil",
};

export const TEXTES_ERREUR_RACINE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ERREUR_RACINE>> = {
  fr: TEXTES_ERREUR_RACINE,
  en: TEXTES_ERREUR_RACINE_ANGLAIS,
};
