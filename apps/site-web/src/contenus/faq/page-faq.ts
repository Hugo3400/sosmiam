import type { ParLangue, Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PAGE_FAQ_ANGLAIS } from "~/contenus/anglais/faq/page-faq";

export const TEXTES_PAGE_FAQ = {
  titre: "Questions fréquentes",
  description: "Rescousses, BIG SOS, inscription des lieux, ambassadeurs : toutes les réponses sur SOS Miam, l'app des lieux indépendants qui ont besoin de monde.",
  chapo: "Tout ce que tu veux savoir avant de sauver ta première table.",
  recherche: { libelle: "Chercher dans les questions", exemple: "Cherche : prix, avis, BIG SOS…" },
  themes: "Thèmes des questions",
  rienTrouve: (recherche: string) => `Rien trouvé pour « ${recherche} ». Pose-nous ta question juste en dessous 👇`,
  trouvees: (nombre: number) => `${nombre} question${nombre > 1 ? "s" : ""} trouvée${nombre > 1 ? "s" : ""}`,
  aucuneTrouvee: "Aucune question trouvée",
  pasTrouve: { titre: "Pas trouvé ta réponse ?", texte: "Pose-nous ta question, on lit tous les messages." },
  ecrisNous: "Écris-nous",
};

export const TEXTES_PAGE_FAQ_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PAGE_FAQ>> = {
  fr: TEXTES_PAGE_FAQ,
  en: TEXTES_PAGE_FAQ_ANGLAIS,
};
