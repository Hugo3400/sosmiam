import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MES_ARTICLES_ACTUS } from "~/contenus/textes-mes-articles-actus";

export const TEXTES_MES_ARTICLES_ACTUS_ANGLAIS: Traduction<typeof TEXTES_MES_ARTICLES_ACTUS> = {
  titre: "My stories",
  retour: "Back",
  ecrire: "Write a story",
  badges: { "premier-reportage": "First Scoop", "reporter-du-quartier": "Neighbourhood Reporter", "grand-reporter": "Star Reporter" },
  tousLesBadges: "All three News badges are yours. Hats off, Star Reporter! 🎩",
  progression: (publies: number, objectif: number) => `${publies} / ${objectif} published`,
  progressionLue: (badge: string) => `Towards the ${badge} badge`,
  points: (parArticle: number, gagnes: number) => `+${parArticle} points per published story · +${gagnes} so far`,
  statuts: { "en-relecture": "Being checked", "a-retoucher": "Needs a tweak", publie: "Published", refuse: "Not published", retire: "Taken down" },
  envoye: (date: string) => `sent on ${date}`,
  publie: (date: string, jaime: number, commentaires: number) => `Published on ${date} · ${jaime} like${jaime === 1 ? "" : "s"} · ${commentaires} comment${commentaires === 1 ? "" : "s"}`,
  lieuARepondu: "the place replied",
  brigade: "The Brigade:",
  retoucher: "Tweak it",
  refus: (motif: string) => `Reason: ${motif}.`,
  contester: "Appeal the decision",
  retire: "Taken down after a report: moderation explains why, and you can appeal.",
  vide: "No stories yet. Your first scoop awaits ✍️",
};
