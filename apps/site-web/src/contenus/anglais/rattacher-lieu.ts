import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_RATTACHER_LIEU } from "~/contenus/rattacher-lieu";

export const TEXTES_RATTACHER_LIEU_ANGLAIS: Traduction<typeof TEXTES_RATTACHER_LIEU> = {
  meta: {
    titre: "Claim my venue",
    description: "Tell us this venue is yours so you can manage its listing.",
  },
  titre: "Claim my venue",
  chapo: "Find your venue on SOS Miam and tell us it's yours: the SOS Miam team checks, and its listing opens in your dashboard.",
  lieuNumero: (id: number) => `Venue #${id}`,
  recherche: {
    "trop-court": "Type at least 2 letters.",
    "trop-de-demandes": "Lots of searches in one go: try again in a few minutes.",
    panne: "The search isn't responding. Try again in a moment.",
    aucun: "No venue found. Try another word, or list your venue.",
  },
  erreurs: {
    gerant: "Tick the box: only the manager can request the listing (they'll invite their staff afterwards).",
    preuve: "Tell us in a few words how we can check (600 characters at most).",
    siret: "A SIRET number has 14 digits. Not to hand? Leave it blank.",
    siretRefuse: "This SIRET number doesn't look right: check the 14 digits, or leave it blank.",
    dejaDemande: "You've already requested this venue: the SOS Miam team is looking at your request. You'll find it in your dashboard.",
    tropDeDemandes: "That's a lot of requests in one go: try again tomorrow, or drop us a line at bonjour@sosmiam.fr.",
    lieuInconnu: "This venue isn't on SOS Miam any more. Search for it again, or list it.",
    champInvalide: "Something's not right in the form: check it over.",
    panne: "Oops, your request didn't go through. Try again in a moment, or drop us a line at bonjour@sosmiam.fr.",
  },
  page: {
    dejaValide: "This venue is already yours! ",
    dejaDemande: "You've already requested this venue: the SOS Miam team is looking. ",
    retourTableau: "Back to the dashboard",
    pasLeBon: "Not the right one? ",
    autreLieu: "Search for another venue",
    pasEncore: "Your venue isn't on SOS Miam yet? ",
    inscrisLe: "List it for free",
    inscrisSuite: " – the SOS Miam team creates its listing, then you come back here.",
  },
  formulaire: {
    bouton: "Send my request",
    gerant: "I'm the manager of this venue",
    preuve: "How can we check it's you?",
    aidePreuve: "For example: the venue's phone number to call you back on, an email address in the venue's name, your name on the Kbis extract (the French company registration)… The SOS Miam team only uses it to check.",
    siret: "The venue's SIRET number",
    aideSiret: "14 digits, on your invoices or your Kbis extract. It's quicker with it, but it works without.",
    gratuit: "It's free, with no subscription or commission. The SOS Miam team reads every request by hand.",
  },
  rechercheLieu: {
    nom: "Search for my venue",
    libelle: "Your venue's name (and its town, if you like)",
    aide: "Only venues already published on SOS Miam show up.",
    bouton: "Search",
    lequel: "Which one is it?",
    pasPublie: "· not published yet",
    verifie: "· Verified ✓",
  },
  champ: {
    liste: "Suggested venues",
    aucun: "No venue found.",
    trouves: (nombre: number) => accorder(nombre, "en", `${nombre} matching venue.`, `${nombre} matching venues.`),
    pasPublie: " · not published yet",
  },
};
