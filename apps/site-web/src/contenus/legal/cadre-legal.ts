import type { ParLangue, Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_CADRE_LEGAL_ANGLAIS } from "~/contenus/anglais/legal/cadre-legal";

export const TEXTES_CADRE_LEGAL = {
  retourSite: "Retour au site",
  miseAJour: (date: string) => `Mise à jour le ${date}`,
  enBref: "En bref",
  auSommaire: "Au sommaire",
  hautDePage: "Haut de page",
};

export const TEXTES_CADRE_LEGAL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CADRE_LEGAL>> = {
  fr: TEXTES_CADRE_LEGAL,
  en: TEXTES_CADRE_LEGAL_ANGLAIS,
};
