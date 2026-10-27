import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CLOCHE_ACTUS_ANGLAIS } from "~/contenus/anglais/textes-cloche-actus";

export const TEXTES_CLOCHE_ACTUS = {
  publiee: (titre: string) => `Ton article${titre} est publié dans les Actus 📰 +20 points !`,
  aRetoucher: (titre: string) => `La Brigade a relu ton article${titre} : une petite retouche, et c'est bon.`,
  refusee: (motif: string | null) => (motif ? `Ton article n'a pas été publié (motif : ${motif}). Tu peux contester.` : "Ton article n'a pas été publié. On t'explique pourquoi, et tu peux contester."),
  lieuCite: (titre: string) => `On parle de toi dans les Actus${titre} ! Tu peux répondre sous l'article.`,
  reponsePubliee: "Ta réponse sous l'article des Actus est publiée.",
  reponseRefusee: (motif: string | null) => (motif ? `Ta réponse sous l'article n'a pas été publiée (motif : ${motif}).` : "Ta réponse sous l'article n'a pas été publiée."),
  indiceArticle: "Ouvre l'article",
  indiceMesArticles: "Ouvre tes articles",
  indiceModeration: "Ouvre les décisions de la modération",
  indicePro: "Ouvre « On parle de toi »",
} as const;

export const TEXTES_CLOCHE_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CLOCHE_ACTUS>> = { fr: TEXTES_CLOCHE_ACTUS, en: TEXTES_CLOCHE_ACTUS_ANGLAIS };
