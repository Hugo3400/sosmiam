import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ANNONCE_APP_ANGLAIS } from "~/contenus/anglais/textes-annonce-app";

export const TEXTES_ANNONCE_APP = {
  surtitre: "Un petit mot de SOS Miam",
  compris: "Compris",
  fermerFond: "Fermer l'annonce",
  annonceLecteurEcran: "Nouvelle annonce de SOS Miam",
  indiceBouton: "Ferme l'annonce et ouvre l'écran qu'elle propose",
} as const;

export const TEXTES_ANNONCE_APP_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ANNONCE_APP>> = { fr: TEXTES_ANNONCE_APP, en: TEXTES_ANNONCE_APP_ANGLAIS };
