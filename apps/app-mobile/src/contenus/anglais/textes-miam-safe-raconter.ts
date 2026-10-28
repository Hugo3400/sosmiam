import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MIAM_SAFE_RACONTER } from "~/contenus/textes-miam-safe-raconter";

export const TEXTES_MIAM_SAFE_RACONTER_ANGLAIS: Traduction<typeof TEXTES_MIAM_SAFE_RACONTER> = {
  merci: "Thank you for telling us.",
  lecture: (heures: number) =>
    `The SOS Miam team reads it within ${heures} hour${heures === 1 ? "" : "s"} and will tell you what they've decided. Nothing shows on the place's page.`,
  intro: (chezLieu: string) => `What happened ${chezLieu}. It stays between you and the SOS Miam team.`,
  avecTesMots: "In your own words",
  facultatif: "optional",
  envoyer: "Send to the SOS Miam team",
  indiceRaison: "Choose what happened first",
  indiceTexte: "Tell us what happened in a few words",
  visitePasEncoreVue: "Your answer only counts after a confirmed visit to this place, and we can't find yours on our side yet, so nothing was sent.",
  merciReponse: "Thank you for your answer.",
  merciCompte: (nomLieu: string) => `Thank you – that counts for ${nomLieu}.`,
  question: "Did you feel at ease here?",
  desole: "We're sorry. Nothing shows on the place's page. If you like, tell us what happened.",
  oui: "Yes",
  pasVraiment: "Not really",
  pasVraimentIndice: "This never shows on the place's page",
};
