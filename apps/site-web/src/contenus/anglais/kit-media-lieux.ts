import { citer } from "../../../../../packages/commun/src/fonctions/langue/citer.ts";
import { PHRASE_MIAM_SAFE } from "../../../../../packages/commun/src/regles/miam-safe.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_KIT_MEDIA_LIEUX } from "~/contenus/kit-media-lieux";

const PHRASE_CITEE = citer(PHRASE_MIAM_SAFE, "en");

export const TEXTES_KIT_MEDIA_LIEUX_ANGLAIS: Traduction<typeof TEXTES_KIT_MEDIA_LIEUX> = {
  visuels: {
    "story-on-est-sur-sos-miam": {
      titre: "Story “On est sur SOS Miam” (We're on SOS Miam)",
      description: "Yellow story: the Captain saying “Miam”, “On est sur SOS Miam !” (We're on SOS Miam!) and sosmiam.fr.",
    },
    "post-on-est-sur-sos-miam": {
      titre: "Post “On est sur SOS Miam” (We're on SOS Miam)",
      description: "Yellow post: the Captain saying “Miam”, “On est sur SOS Miam !” (We're on SOS Miam!) and sosmiam.fr.",
    },
    "story-lieu-miam-safe": {
      titre: "Story “Ici, on est Miam Safe” (We've signed the Miam Safe charter)",
      description: `Black story: the Miam Safe shield, “Ici, on est Miam Safe” and the phrase ${PHRASE_CITEE} (Is the Captain here?) to say at the counter.`,
    },
    "post-lieu-miam-safe": {
      titre: "Post “Ici, on est Miam Safe” (We've signed the Miam Safe charter)",
      description: `Black post: the Miam Safe shield, “Ici, on est Miam Safe” and the phrase ${PHRASE_CITEE} (Is the Captain here?) to say at the counter.`,
    },
    "autocollant-sos-miam": {
      titre: "Window sticker “On est sur SOS Miam” (We're on SOS Miam)",
      description: "Yellow 10 cm circle: the logo, “On est sur SOS Miam” and sosmiam.fr. Print it on sticker paper, then cut it out.",
    },
    "autocollant-miam-safe": {
      titre: "Window sticker “Lieu Miam Safe”",
      description: `Black 10 cm circle: the Miam Safe shield, “Lieu Miam Safe” and the phrase ${PHRASE_CITEE} (Is the Captain here?).`,
    },
    "memo-equipe-miam-safe": {
      titre: "Miam Safe staff memo (A5)",
      description: "A5 memo in French to keep behind the counter: the phrase, the screen to recognise, the four steps, what to do when an alert comes in, and the emergency numbers.",
    },
    "logo-fond-clair": {
      titre: "Logo for light backgrounds",
      description: "The SOS Miam logo, “SOS” in black and “Miam” in tomato red, on a transparent background.",
    },
    "logo-fond-sombre": {
      titre: "Logo for dark backgrounds",
      description: "The SOS Miam logo, “SOS” in cream and “Miam” in tomato red, on a transparent background.",
    },
  },
  zip: "The venue's whole media kit",
  groupes: {
    reseaux: { titre: "For your socials", texte: "Stories (1080 × 1920) and posts (1080 × 1350), ready to share as they are." },
    vitrine: { titre: "For your shop window", texte: "Round 10 cm stickers: print the PDF on sticker paper, then cut along the circle." },
    equipe: { titre: "For your staff", texte: "To print and keep behind the counter." },
    logos: { titre: "The logos", texte: "Transparent background. Leave a margin around the logo at least as wide as the lifebuoy." },
  },
  miamSafe: {
    signee: "Your venue has signed the Miam Safe charter: these visuals are for you.",
    pasSignee: "These visuals are only for venues that have signed the Miam Safe charter. Sign it first, from your venue's Miam Safe page.",
  },
  ecrireTextes: (nomLieu: string, lien: string): { titre: string; texte: string; miamSafe?: true }[] => [
    {
      titre: "We're on SOS Miam",
      texte: `${nomLieu} is on SOS Miam! 🛟
SOS Miam helps people discover independent places nearby. Come and see us, and add us to your favourites:
${lien}
#SOSMiam`,
    },
    {
      titre: "Your neighbourhood gem",
      texte: `Looking for an independent spot near you? Find ${nomLieu} on SOS Miam, with our opening hours and good-to-know info. 😋
${lien}
#SOSMiam`,
    },
    {
      titre: "We've signed the Miam Safe charter",
      texte: `At ${nomLieu}, our staff have signed the Miam Safe charter. 🛡
Not at ease during your visit? Just say this to the staff, in French: ${PHRASE_CITEE}. Someone will come to you, discreetly.
${lien}
#SOSMiam`,
      miamSafe: true,
    },
  ],
  regles: {
    peux: [
      "Post the kit's visuals and texts on your venue's social media, and adapt them in your own words.",
      "Print the stickers and the memo as often as you like, for your window, your tables and your staff.",
      "Put the SOS Miam logo on your website or social media, on a light background (or its cream version on a dark background).",
    ],
    peuxPas: [
      "Use the Miam Safe visuals if your venue hasn't signed the charter, or after leaving it.",
      "Present Miam Safe as protection or a guarantee: it's a helping hand for alerting your staff, nothing more.",
      "Suggest a paid partnership, a rating or a place in a ranking: SOS Miam is free and doesn't sell any kind of promotion.",
      "Distort, recolour or redraw the logo, the mascot or the shield.",
      "Use the kit for anything other than saying your venue is on SOS Miam.",
    ],
  },
};
