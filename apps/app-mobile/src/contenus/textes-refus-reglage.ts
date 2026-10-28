import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REFUS_REGLAGE_ANGLAIS } from "~/contenus/anglais/textes-refus-reglage";

export const TEXTES_REFUS_REGLAGE = {
  pseudoRequis: "🏷️ Choisis d'abord ton pseudo dans Profil › Modifier mon profil › Mes infos",
  horsLigne: "📶 Pas de réseau : ton réglage n'a pas changé. Réessaie dans un instant.",
  tropDeDemandes: "🐢 Doucement ! Beaucoup d'essais d'un coup : réessaie dans quelques minutes.",
  autre: "Ça n'a pas marché cette fois : ton réglage n'a pas changé. Réessaie dans un instant.",
} as const;

export const TEXTES_REFUS_REGLAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REFUS_REGLAGE>> = { fr: TEXTES_REFUS_REGLAGE, en: TEXTES_REFUS_REGLAGE_ANGLAIS };
