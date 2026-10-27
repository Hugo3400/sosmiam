import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_BIG_SOS_EN_BREF } from "~/contenus/big-sos-en-bref";

export const TEXTES_BIG_SOS_EN_BREF_ANGLAIS: Traduction<typeof TEXTES_BIG_SOS_EN_BREF> = {
  titre: "Going through a tough time? The whole neighbourhood to the rescue.",
  chapo:
    "Roadworks outside the door, a big drop in customers, a run of bad luck: when an independent place is going through a really tough time, it's in the spotlight on the app for 7 days. The aim: fill the room, together.",
  etapes: [
    { titre: "The request", texte: "The place sends it from its Pro area, or an ambassador puts it forward." },
    { titre: "The check", texte: "A local ambassador drops by in person." },
    { titre: "The vote", texte: "The community backs the requests that speak to it." },
    { titre: "The spotlight", texte: "The SOS Miam team gives the green light, and the place is in the spotlight for 7 days." },
  ],
  apres: {
    question: "What happens next?",
    texte: "We look back on it together, and the place keeps its page, its videos and its new regulars.",
  },
  surSaPage: "On its page, for 7 days",
  page: [
    "The place's story, told by the people who run it",
    "Videos from the creators who came to film it",
    "A turnout goal with a live gauge",
    "Support vouchers: pay now, enjoy later",
  ],
  note: "💬 The place tells its own story and approves everything that's said – to make you want to come, never to make you feel sorry for it.",
};
