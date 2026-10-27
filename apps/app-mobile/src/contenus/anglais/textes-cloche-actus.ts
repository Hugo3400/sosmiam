import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CLOCHE_ACTUS } from "~/contenus/textes-cloche-actus";

export const TEXTES_CLOCHE_ACTUS_ANGLAIS: Traduction<typeof TEXTES_CLOCHE_ACTUS> = {
  publiee: (titre: string) => `Your story${titre} is live in News 📰 +20 points!`,
  aRetoucher: (titre: string) => `The Brigade checked your story${titre}: one little tweak and you're good to go.`,
  refusee: (motif: string | null) => (motif ? `Your story wasn't published (reason: ${motif}). You can appeal.` : "Your story wasn't published. We'll explain why, and you can appeal."),
  lieuCite: (titre: string) => `You're in the News${titre}! You can reply under the story.`,
  reponsePubliee: "Your reply under the News story is live.",
  reponseRefusee: (motif: string | null) => (motif ? `Your reply under the story wasn't published (reason: ${motif}).` : "Your reply under the story wasn't published."),
  indiceArticle: "Opens the story",
  indiceMesArticles: "Opens your stories",
  indiceModeration: "Opens the moderation decisions",
  indicePro: "Opens “You're in the News”",
};
