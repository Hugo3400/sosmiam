import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ONGLETS_PRINCIPAUX } from "~/contenus/textes-onglets-principaux";

export const TEXTES_ONGLETS_PRINCIPAUX_ANGLAIS: Traduction<typeof TEXTES_ONGLETS_PRINCIPAUX> = {
  barre: {
    titres: { index: "For you", explorer: "Explore", scan: "Scan", potes: "Community", profil: "Profile" },
    avisADonner: (n: number) => `${n} review${n === 1 ? "" : "s"} to write`,
    additionEnAttente: "a bill waiting",
    lu: (titre: string, position: number, total: number, info: string | null) => `${titre}, tab ${position} of ${total}${info ? `, ${info}` : ""}`,
  },
  explorer: {
    lieux: (n: number) => `${n} place${n === 1 ? "" : "s"}`,
    aucunSansDepart: "No places – we don't know where you are",
    aucunRecherche: "No places match this search",
    aucunFiltres: "No places with these filters",
    aucunIci: "No places around here yet",
    positionAJour: "Your location's up to date 📍",
    autourArreteRepli: (repli: string) => `Near me is off – ${repli}`,
    autourArrete: "Near me is off – your location's been forgotten",
    plusProches: "closest first",
    selonEnvies: "based on what you're into",
    origine: (depuis: string) => `distances from ${depuis}`,
  },
  communaute: {
    titre: "Your crew's waiting for you",
    texte: "This is where friends make plans: where to eat, who's coming, and who still hasn't replied in the group.",
    avantages: [
      "Your crew, and who's rescued the most places this month",
      "Get-togethers where everyone votes on the place (no more endless debates)",
      "A chat with friends to pin down what time to meet",
      "Shared lists of great places",
      "The Miamis: open meetups in your city",
    ],
  },
  profil: {
    titre: "So, who are you?",
    texte: "Everything you do for local places shows up here. Your nan would be proud.",
    avantages: [
      "Your points and level, from Taster to Neighbourhood Ambassador",
      "Your badges and challenges to take on",
      "Places you've saved for later",
      "Your settings (avatar, what you're into, notifications)",
    ],
    pagesLegales: [
      { titre: "Terms of Use", adresse: "https://sosmiam.fr/en/cgu" },
      { titre: "Privacy", adresse: "https://sosmiam.fr/en/confidentialite" },
      { titre: "Legal notice", adresse: "https://sosmiam.fr/en/mentions-legales" },
    ],
    lienRateTitre: "Oops, that won't open",
    lienRate: (adresse: string) => `Your phone couldn't open this link. You can find it at ${adresse}.`,
    horsLigne: "Your points, level and badges will land as soon as you're back online. We're keeping them warm for you!",
    connecteToi: "Log in to your account to get your points, level and badges back.",
  },
};
