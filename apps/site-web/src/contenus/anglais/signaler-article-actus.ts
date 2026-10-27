import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS, TEXTES_SIGNALER_ARTICLE_ACTUS } from "~/contenus/signaler-article-actus";

export const TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS_ANGLAIS: Traduction<typeof TEXTES_RAISONS_SIGNALER_ARTICLE_ACTUS> = {
  "faux-lieu": {
    titre: "Made-up or misleading place",
    detail: "The story is about a place that doesn't exist, or misleads about it",
    precisions: ["This place doesn't exist", "The details about the place are wrong", "It's not the right place"],
  },
  "pub-cachee": {
    titre: "Hidden ad",
    detail: "Partnership not disclosed, paid-for story, an ad for something else",
    precisions: ["Collaboration commerciale not disclosed", "Story written for money", "An ad for something other than the place"],
  },
  arnaque: {
    titre: "Scam",
    detail: "Fake deal, dodgy link or QR code",
    precisions: ["Fake deal", "Dodgy link or QR code", "Asking for money or bank details"],
  },
  haine: {
    titre: "Hate or harassment",
    detail: "Insults, mockery, hateful remarks",
    precisions: ["Hateful remarks", "Mockery or harassment", "Threats"],
  },
  choquant: {
    titre: "Violence or sexual content",
    detail: "Violent text or photo, nudity, disturbing content",
    precisions: ["Violence or cruelty", "Nudity or sexual content", "Shocking or disturbing content"],
  },
  danger: {
    titre: "Danger or banned product",
    detail: "Drugs, weapons, dangerous challenges, encouraging drinking",
    precisions: ["Drugs", "Weapon", "Encouraging drinking (France's Évin law)", "Dangerous challenge or behaviour"],
  },
  "vie-privee": {
    titre: "Privacy",
    detail: "Someone named or shown without their consent, personal details",
    precisions: ["I appear without my consent", "Someone else appears without their consent", "A member of staff is named without their consent", "Personal details are visible"],
  },
  "vol-contenu": {
    titre: "Stolen content",
    detail: "Text or photo used without its creator's consent",
    precisions: ["It's my text or photo", "It's someone else's content"],
  },
  autre: {
    titre: "Something else",
    detail: "Tell us in your own words what's wrong",
    precisions: [],
  },
};

export const TEXTES_SIGNALER_ARTICLE_ACTUS_ANGLAIS: Traduction<typeof TEXTES_SIGNALER_ARTICLE_ACTUS> = {
  meta: {
    titreArticle: (titre: string) => `Report the story “${titre}”`,
    titreReponse: (nom: string) => `Report the reply from ${nom}`,
    description: "A story or a reply that's not right? Tell the SOS Miam moderation team.",
    introuvable: "Story not found — SOS Miam",
  },
  retour: "Back to the story",
  titre: { article: "Report this story", reponse: "Report this reply" },
  intro: {
    article: (titre: string) => `Is something wrong with the story “${titre}”? Tell us what's off – the SOS Miam team checks every report by hand.`,
    reponse: (nom: string) => `Is something wrong with the reply from ${nom} under this story? Tell us what's off – the SOS Miam team checks every report by hand.`,
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
  donnees: "No account needed: we won't ask for your name or your email, and neither the author nor the place will know it was you.",
  donneesLien: "What we keep, and for how long",
  envoyer: "Send the report",
  envoi: "Sending…",
  annuler: "Cancel",
  erreurs: {
    unChamp: "One thing to fix before sending.",
    plusieursChamps: (nombre: number) => `${nombre} things to fix before sending.`,
    raison: "Choose what's wrong.",
    explicationCourte: "For “Something else”, tell us in a few words what's wrong (at least 10 characters).",
    explicationLongue: "500 characters max – keep it to the essentials, the team will understand.",
    refuse: "Your report didn't go through. Check what you chose and your explanation, then send it again.",
  },
  merci: {
    titre: "Thank you, the team will take a look",
    texte: {
      article: "Your report has arrived. The SOS Miam moderation team will read the story and decide whether it can stay online.",
      reponse: "Your report has arrived. The SOS Miam moderation team will read the place's reply and decide whether it can stay online.",
    },
    retour: "Back to the story",
  },
};
