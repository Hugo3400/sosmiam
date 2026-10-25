import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_LANGUE_ANGLAIS } from "~/contenus/anglais/textes-langue";

export const TEXTES_LANGUE = {
  titre: "Langue",
  resume: {
    automatique: "Automatique, comme ton téléphone",
    fr: "Français",
    en: "English",
  },
  choix: {
    automatique: { emoji: "📱", titre: "Automatique", detail: "La langue de ton téléphone" },
    fr: { emoji: "🇫🇷", titre: "Français", detail: "Toujours en français" },
    en: { emoji: "🇬🇧", titre: "English", detail: "Always in English" },
  },
  apercu: "Aperçu : l'anglais n'est pas encore ouvert à tous. Seuls les écrans déjà traduits changent de langue.",
} as const;

export const TEXTES_LANGUE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LANGUE>> = { fr: TEXTES_LANGUE, en: TEXTES_LANGUE_ANGLAIS };
