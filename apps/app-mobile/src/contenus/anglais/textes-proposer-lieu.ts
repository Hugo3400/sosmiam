import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_PROPOSER_LIEU } from "~/contenus/textes-proposer-lieu";

export const TEXTES_PROPOSER_LIEU_ANGLAIS: Traduction<typeof TEXTES_PROPOSER_LIEU> = {
  titre: "Suggest an edit",
  merci: "Thanks, it's sent!",
  merciTexte: (nom: string) => `The SOS Miam team reviews your suggestion before changing the page for ${nom}. Thanks to you, foodies will have the right info 💛`,
  intro: "Spotted something that's changed? Tell us – the SOS Miam team checks before updating the page.",
  quoi: "What's changed?",
  horaires: "Opening hours",
  exempleHoraires: "12:00–14:30 · 19:00–22:30 · closed Monday",
  adresse: "The new address",
  exempleAdresse: "e.g. 12 rue de la Loge, Montpellier",
  nom: "The name",
  presentation: "The description",
  motEquipe: "A note for the SOS Miam team",
  exempleMot: "I was there yesterday – they're closed on Mondays now",
  envoi: "Sending…",
  envoyer: "Send my suggestion",
  cocherDAbord: "Tick what's changed first",
  erreurs: {
    nom: "A name of 80 characters max, with no swear words.",
    adresse: "An address of 160 characters max, with no swear words.",
    horaires: "Opening hours of 160 characters max, with no swear words.",
    texte: "A description of 1,000 characters max, with no swear words.",
    message: "A note of 1,000 characters max, with no swear words.",
    vide: "Change at least one detail – for now, everything's the same as on the page.",
  },
};
