import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_FIL_MIAMIS_ANGLAIS } from "~/contenus/anglais/textes-fil-miamis";

export const TEXTES_FIL_MIAMIS = {
  brigade: "La Brigade",
  ideeProposee: (titre: string) => `a proposé « ${titre} »`,
  sortieRejointe: (titre: string) => `rejoint la sortie ${titre}`,
  reponseBrigade: (titre: string) => `a répondu à « ${titre} »`,
  votesIdees: (n: number) => (n > 1 ? `a voté pour ${n} idées` : "a voté pour une idée"),
  sortieOrganisee: (titre: string) => `organise ${titre}`,
} as const;

export const TEXTES_FIL_MIAMIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FIL_MIAMIS>> = { fr: TEXTES_FIL_MIAMIS, en: TEXTES_FIL_MIAMIS_ANGLAIS };
