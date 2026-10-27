import type { StatutArticleActus } from "@sos-miam/commun/types/actus";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MES_ARTICLES_ACTUS_ANGLAIS } from "~/contenus/anglais/textes-mes-articles-actus";

const STATUTS: Record<StatutArticleActus, string> = {
  "en-relecture": "En relecture",
  "a-retoucher": "À retoucher",
  publie: "Publié",
  refuse: "Pas publié",
};

export const TEXTES_MES_ARTICLES_ACTUS = {
  titre: "Mes articles",
  retour: "Retour",
  ecrire: "Écrire un article",
  badges: { "premier-reportage": "Premier reportage", "reporter-du-quartier": "Reporter du quartier", "grand-reporter": "Grand reporter" },
  tousLesBadges: "Les trois badges des Actus sont à toi. Chapeau, Grand reporter ! 🎩",
  progression: (publies: number, objectif: number) => `${publies} / ${objectif} publiés`,
  progressionLue: (badge: string) => `Vers le badge ${badge}`,
  points: (parArticle: number, gagnes: number) => `+${parArticle} points par article publié · déjà +${gagnes}`,
  statuts: STATUTS,
  envoye: (date: string) => `envoyé le ${date}`,
  publie: (date: string, jaime: number, commentaires: number) => `Publié le ${date} · ${jaime} J'aime · ${commentaires} commentaire${commentaires > 1 ? "s" : ""}`,
  lieuARepondu: "le lieu a répondu",
  brigade: "La Brigade :",
  retoucher: "Retoucher",
  refus: (motif: string) => `Motif : ${motif}.`,
  contester: "Contester la décision",
  vide: "Pas encore d'article. Ta première plume t'attend ✍️",
} as const;

export const TEXTES_MES_ARTICLES_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MES_ARTICLES_ACTUS>> = {
  fr: TEXTES_MES_ARTICLES_ACTUS,
  en: TEXTES_MES_ARTICLES_ACTUS_ANGLAIS,
};
