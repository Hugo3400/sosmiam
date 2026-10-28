import type { IdMiamiAuChoix } from "@sos-miam/commun/regles/avatars-miamis";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { NOMS_MIAMIS_ANGLAIS, TEXTES_GRILLE_MIAMIS_ANGLAIS } from "~/contenus/anglais/textes-profil-avatars";

export const TEXTES_GRILLE_MIAMIS = {
  groupeLu: "Choisis un Miami",
  miamiLu: (nom: string, position: number, total: number) => `Miami ${nom}, ${position} sur ${total}`,
  miamiCourtLu: (nom: string) => `Miami ${nom}`,
} as const;

export const NOMS_MIAMIS: Readonly<Partial<Record<IdMiamiAuChoix, string>>> = {};

export const TEXTES_GRILLE_MIAMIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_GRILLE_MIAMIS>> = { fr: TEXTES_GRILLE_MIAMIS, en: TEXTES_GRILLE_MIAMIS_ANGLAIS };
export const NOMS_MIAMIS_PAR_LANGUE: ParLangue<Readonly<Partial<Record<IdMiamiAuChoix, string>>>> = { fr: NOMS_MIAMIS, en: NOMS_MIAMIS_ANGLAIS };
