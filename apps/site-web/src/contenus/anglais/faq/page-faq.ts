import type { Traduction } from "../../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PAGE_FAQ } from "~/contenus/faq/page-faq";

export const TEXTES_PAGE_FAQ_ANGLAIS: Traduction<typeof TEXTES_PAGE_FAQ> = {
  titre: "Frequently asked questions",
  description: "Rescues, BIG SOS, listing your venue, ambassadors: all the answers about SOS Miam, the app for independent places that would love a few more faces.",
  chapo: "Everything you want to know before you rescue your first table.",
  recherche: { libelle: "Search the questions", exemple: "Search: price, reviews, BIG SOS…" },
  themes: "Question topics",
  rienTrouve: (recherche: string) => `Nothing found for “${recherche}”. Ask us your question just below 👇`,
  trouvees: (nombre: number) => `${nombre} question${nombre === 1 ? "" : "s"} found`,
  aucuneTrouvee: "No questions found",
  pasTrouve: { titre: "Can't find your answer?", texte: "Ask us your question – we read every message." },
  ecrisNous: "Drop us a line",
};
