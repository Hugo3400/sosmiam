import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_EN_TETE_MODE_ANGLAIS } from "~/contenus/anglais/textes-modes";

export const TEXTES_EN_TETE_MODE = {
  pastilles: { pro: "Mode pro", ambassadeur: "Mode ambassadeur" },
  revenir: "Revenir à mon SOS Miam",
  indiceRevenir: (pastille: string) => `Quitte le ${pastille.toLowerCase()} et revient à ton profil`,
} as const;

export const TEXTES_EN_TETE_MODE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_EN_TETE_MODE>> = { fr: TEXTES_EN_TETE_MODE, en: TEXTES_EN_TETE_MODE_ANGLAIS };
