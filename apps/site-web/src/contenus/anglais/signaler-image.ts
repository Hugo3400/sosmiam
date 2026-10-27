import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_RAISONS_SIGNALER_IMAGE, TEXTES_SIGNALER_IMAGE } from "~/contenus/signaler-image";

export const TEXTES_RAISONS_SIGNALER_IMAGE_ANGLAIS: Traduction<typeof TEXTES_RAISONS_SIGNALER_IMAGE> = {
  "faux-lieu": {
    titre: "It's not this place",
    detail: "The image shows somewhere else, or misleads about the place",
    precisions: ["The image doesn't show this place", "It's not their logo", "The image misleads about the place"],
  },
  "pub-cachee": {
    titre: "Hidden ad or spam",
    detail: "An ad for something other than the place, clickbait text",
    precisions: ["An ad for something other than the place", "Partnership not disclosed", "Advertising text or link"],
  },
  arnaque: {
    titre: "Scam",
    detail: "Fake competition, dodgy QR code or link",
    precisions: ["Fake competition", "Dodgy QR code or link", "Asking for money or bank details"],
  },
  haine: {
    titre: "Hate or harassment",
    detail: "Insults, mockery, hateful symbols or remarks",
    precisions: ["Hateful remarks or symbols", "Mockery or harassment", "Threats"],
  },
  choquant: {
    titre: "Violence or sexual content",
    detail: "Violent image, nudity, disturbing image",
    precisions: ["Violence or cruelty", "Nudity or sexual content", "Shocking or disturbing image"],
  },
  danger: {
    titre: "Danger or banned product",
    detail: "Drugs, weapons, dangerous challenges, alcohol advertising",
    precisions: ["Drugs", "Weapon", "Alcohol advertising (France's Évin law)", "Dangerous challenge or behaviour"],
  },
  "vie-privee": {
    titre: "Privacy",
    detail: "Someone shown without their consent, personal details",
    precisions: ["I appear without my consent", "Someone else appears without their consent", "Personal details are visible"],
  },
  "vol-contenu": {
    titre: "Stolen image",
    detail: "Photo or logo used without its creator's consent",
    precisions: ["It's my image", "It's someone else's image"],
  },
  autre: {
    titre: "Something else",
    detail: "Tell us in your own words what's wrong",
    precisions: [],
  },
};

export const TEXTES_SIGNALER_IMAGE_ANGLAIS: Traduction<typeof TEXTES_SIGNALER_IMAGE> = {
  meta: {
    titre: (nom: string) => `Report an image for ${nom}`,
    description: "A banner or a logo that's not right? Tell the SOS Miam moderation team.",
    introuvable: "Image not found — SOS Miam",
  },
  retour: (nom: string) => `Back to the page for ${nom}`,
  titre: "Report an image",
  intro: (nom: string) => `Is something wrong with the banner or logo for ${nom}? Tell us what's off – the SOS Miam team checks every report by hand.`,
  quelle: {
    legende: "Which image are you reporting?",
    banniere: "The banner",
    logo: "The logo",
    seule: { banniere: "You're reporting the banner", logo: "You're reporting the logo" },
    detail: { banniere: "The big photo at the top of the page", logo: "The square next to the name" },
  },
  raison: {
    legende: "What's wrong?",
    precision: "You can add a detail (optional)",
  },
  explication: {
    libelle: "Tell us more",
    facultatif: " (optional, except for “Something else”)",
    aide: "A few words help the team decide quickly. For “Something else”, at least 10 characters.",
    compteur: (longueur: number, max: number) => `${longueur} / ${max} characters`,
  },
  piege: "Leave this field empty",
  donnees: "No account needed: we won't ask for your name or your email, and the venue won't know it was you.",
  donneesLien: "What we keep, and for how long",
  envoyer: "Send the report",
  envoi: "Sending…",
  annuler: "Cancel",
  erreurs: {
    unChamp: "One thing to fix before sending.",
    plusieursChamps: (nombre: number) => `${nombre} things to fix before sending.`,
    quelle: "Choose the image you're reporting.",
    raison: "Choose what's wrong.",
    explicationCourte: "For “Something else”, tell us in a few words what's wrong (at least 10 characters).",
    explicationLongue: "500 characters max – keep it to the essentials, the team will understand.",
    refuse: "Your report didn't go through. Check what you chose and your explanation, then send it again.",
  },
  merci: {
    titre: "Thank you, the team will take a look",
    texte: "Your report has arrived. The SOS Miam moderation team will look at the image and decide whether it can stay on the page.",
    retour: "Back to the page",
    retourDe: (nom: string) => ` for ${nom}`,
  },
};
