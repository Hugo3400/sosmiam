import {
  IMAGE_SIGNALEMENT_OCTETS_MAX,
  IMAGES_SIGNALEMENT_MAX,
  JOURS_PUBLICATION_SECURITE,
  JOURS_REPONSE_SECURITE,
} from "../../../../../packages/commun/src/regles/securite.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_META_SECURITE, TEXTES_SECURITE } from "~/contenus/securite";

const MO_PAR_IMAGE = IMAGE_SIGNALEMENT_OCTETS_MAX / (1024 * 1024);

export const TEXTES_META_SECURITE_ANGLAIS: Traduction<typeof TEXTES_META_SECURITE> = {
  titre: "Bug hunt: report a security flaw",
  description:
    "Found a security flaw in SOS Miam? Report it. What's in scope, the rules, our commitments, the Bug Hunter badge and the hall of fame.",
};

export const TEXTES_SECURITE_ANGLAIS: Traduction<typeof TEXTES_SECURITE> = {
  page: {
    titre: "Bug hunt",
    badge: "Security",
    chapo: "Found a flaw in SOS Miam? Tell us before the troublemakers do – we'll fix it, and we'll thank you.",
    pourQui:
      "Security researcher, or a curious fellow Miami who's stumbled on something fishy? Read the rules, then tell us everything in the form.",
    enUnCoupDOeilLibelle: "At a glance",
    enUnCoupDOeil: [`Reply within ${JOURS_REPONSE_SECURITE} days`, "Via the form only", "18+"],
    signaler: "Report a flaw",
    lireRegles: "Read the rules",
  },
  perimetre: {
    titre: "What's in scope",
    chapo: "You can hunt for flaws here:",
    dansLeJeuTitre: "In scope",
    dansLeJeu: {
      site: "the website",
      ambassadeur: "the ambassador area",
      pro: "the venues' pro area",
      api: "the API, which runs the app and the website",
      app: "for iPhone and Android",
    },
    nomApp: "The SOS Miam app",
    liaison: ": ",
    deuxComptes:
      "**With your own accounts only.** To test what happens between two people (crew, messages, bookings…), create two accounts and play both parts.",
    horsJeuTitre: "Out of scope",
    horsJeu: [
      "The SOS Miam team's management software, and its /api-gestion/ addresses (even on sosmiam.fr).",
      "The SOS Miam Discord bot and server.",
      "Our providers' services: Cloudflare, Apple, Google, our hosting provider and our email provider. They have their own programmes, so go through them.",
      "Any other site or service on the same machine, plus the machine's IP address and its ports outside the addresses listed here.",
    ],
  },
  regles: {
    titre: "The rules",
    chapo: "A hunt for bugs, not for Miamis. To keep your research on the right side of the line:",
    regles: [
      "**Other people's data is off limits**: don't read it, change it, keep it or delete it. If you stumble on some, stop there, keep nothing and tell us.",
      "**No denial of service** and no load testing – SOS Miam has to stay up for everyone.",
      "**No automated scanners firing in bursts** – a few well-aimed requests beat a downpour.",
      "**No social engineering** – not on the Brigade, the places or the Miamis. We're after flaws in the code, not in people.",
      "**No mass emailing**, and no spam.",
      "**Nothing other people can see** while testing: no reviews, get-togethers, ideas or messages to strangers. Keep your tests between your two accounts.",
      "**No physical testing at a place** – we're testing the app, not the kitchen door.",
      "**18+**, like everything on SOS Miam.",
      `**Mum's the word** – keep the flaw to yourself until it's fixed (or until the ${JOURS_PUBLICATION_SECURITE} days are up; see our commitments).`,
    ],
    neCompteTitre: "What doesn't count",
    neCompteChapo: "To save time on both sides, these cases don't count as a flaw:",
    neCompte: [
      "self-XSS (a flaw you can only trigger against yourself);",
      "a missing security header, with no proven impact;",
      "a visible version number;",
      "clickjacking on a page with no sensitive action;",
      "the SPF, DKIM or DMARC settings of our emails;",
      "a CSRF that only logs you out;",
      "an automated tool's report, with no proof;",
      "a flaw that needs a phone that's already unlocked or modified (jailbroken, rooted).",
    ],
  },
  engagements: {
    titre: "Our commitments",
    chapo: "You take the time to tell us, so we play fair with you.",
    engagements: [
      `**We reply within ${JOURS_REPONSE_SECURITE} days**, then keep you posted.`,
      `**You can talk about the flaw** once it's fixed, or ${JOURS_PUBLICATION_SECURITE} days after your report if nothing's been done, as long as you let us know first.`,
    ],
    promesse:
      "If you follow these rules and act in good faith, we consider your research authorised and we won't lodge a criminal complaint against you.",
  },
  recompenses: {
    titre: "In return for a real flaw",
    chapo: "The Brigade owes you one. Here's what you get:",
    recompenses: [
      "**The “Bug Hunter” badge** in the app. It goes to the SOS Miam account with the same email address as your report, if that address is confirmed on it.",
      "**Your name in the hall of fame**, only if you want it (there's a box to tick in the form).",
      "**A certificate**, for your CV or for a little showing off.",
    ],
    prime: "**For some flaws, a cash reward is possible**, case by case: no amount listed, and nothing guaranteed.",
    premier: "**First come, first served**: if two people report the same flaw, the first report is the one that counts.",
  },
  tableauHonneur: {
    titre: "The hall of fame",
    chapo: "They've made SOS Miam safer. Hats off!",
    videTitre: "The top spot's waiting for you!",
    videTexte: "No one's on it yet. Find a real flaw, tick the box in the form, and your name will show up here.",
    indisponible: "The hall of fame is having a little nap. Pop back in a moment to see it.",
  },
  signaler: {
    titre: "Report a flaw",
    chapo: "Through this form, and this form only: your report is stored encrypted, and only the SOS Miam team reads it.",
    aideTitre: "What helps us",
    aides: [
      "**Steps to reproduce**, one by one, like a recipe.",
      "**The impact**: what a troublemaker could do with it, and who it would hurt.",
      "**Proof**: a request, the server's response, a screenshot.",
      "**In French or English**, whichever you prefer.",
    ],
    captures: `**Your screenshots**: PNG or JPEG, ${IMAGES_SIGNALEMENT_MAX} max, ${MO_PAR_IMAGE} MB each. A video or a script? Put them behind a link.`,
  },
  merci: {
    titre: "Thanks, it's landed safely!",
    texte: `We'll reply within ${JOURS_REPONSE_SECURITE} days, to the address you gave us.`,
    secret: "Until then, keep the flaw to yourself 🤫",
    salut: "The whole Brigade thanks you for looking out for SOS Miam.",
    voirTableau: "See the hall of fame",
    retourAccueil: "Back to the home page",
  },
};
