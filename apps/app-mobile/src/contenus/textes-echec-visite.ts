import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECHEC_VISITE_ANGLAIS } from "~/contenus/anglais/textes-echec-visite";

export const TEXTES_ECHEC_VISITE = {
  horsZoneSansDistance: "On te situe un peu trop loin de {lieu}. Pour valider, il faut être sur place.",
  positionImpreciseSansPrecision: "Il ne sait pas bien où tu es, c'est trop flou pour valider. Approche-toi d'une fenêtre, puis réessaie.",
  pauseSansDate: "Validations en pause pour l'instant",
  ceLieuDebut: "Ce lieu",
  ceLieu: "ce lieu",
  fermer: "Fermer",
  reessayer: "Réessayer",
  relance: "On retente…",
};

export const TEXTES_ECHEC_VISITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECHEC_VISITE>> = { fr: TEXTES_ECHEC_VISITE, en: TEXTES_ECHEC_VISITE_ANGLAIS };
