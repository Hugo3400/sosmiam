import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECHEC_VISITE } from "~/contenus/textes-echec-visite";

export const TEXTES_ECHEC_VISITE_ANGLAIS: Traduction<typeof TEXTES_ECHEC_VISITE> = {
  horsZoneSansDistance: "We place you a bit too far from {lieu}. To confirm, you need to be there.",
  positionImpreciseSansPrecision: "It's not sure where you are – too vague to confirm. Move closer to a window, then try again.",
  pauseSansDate: "Confirmations paused for now",
  ceLieuDebut: "This place",
  ceLieu: "this place",
  fermer: "Close",
  reessayer: "Try again",
  relance: "Trying again…",
};
