import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CONTESTATION_VISITE } from "~/contenus/textes-contestation-visite";

export const TEXTES_CONTESTATION_VISITE_ANGLAIS: Traduction<typeof TEXTES_CONTESTATION_VISITE> = {
  lieuInconnu: "the place",
  fermerSansEnvoyer: "Close without sending anything",
  titreEnvoyee: "We're looking into it",
  titre: "Think it's a mistake?",
  texteEnvoyee: "A human will reply. Thanks for letting us know!",
  texte: (lieu: string) => `If you did pay at ${lieu}, let us know. Your note is read by the SOS Miam team, never by the place.`,
  motTitre: "Your note",
  motFacultatif: "(optional)",
  motLu: "Your note, optional",
  motIndice: "What happened, in a few words. 500 characters max.",
  motPlaceholder: "E.g. I paid around 20:00, on the terrace, with my sister.",
  fermer: "Close",
  envoiLu: "Sending",
  envoi: "Sending…",
  reessayer: "Try again",
  envoyer: "Send",
  envoyerIndice: "The SOS Miam team receives your appeal",
  renoncerIndice: "Nothing is sent",
  renoncer: "Actually, no",
};
