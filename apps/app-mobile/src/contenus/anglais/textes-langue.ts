import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_LANGUE } from "~/contenus/textes-langue";

export const TEXTES_LANGUE_ANGLAIS: Traduction<typeof TEXTES_LANGUE> = {
  titre: "Language",
  resume: {
    automatique: "Automatic, like your phone",
    fr: "Français",
    en: "English",
  },
  choix: {
    automatique: { emoji: "📱", titre: "Automatic", detail: "Your phone's language" },
    fr: { emoji: "🇫🇷", titre: "Français", detail: "Toujours en français" },
    en: { emoji: "🇬🇧", titre: "English", detail: "Always in English" },
  },
  apercu: "Preview: English isn't open to everyone yet. Only the screens that are already translated change language.",
};
