import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_FIL_MIAMIS } from "~/contenus/textes-fil-miamis";

export const TEXTES_FIL_MIAMIS_ANGLAIS: Traduction<typeof TEXTES_FIL_MIAMIS> = {
  brigade: "The Brigade",
  ideeProposee: (titre: string) => `suggested “${titre}”`,
  sortieRejointe: (titre: string) => `joined the meetup ${titre}`,
  reponseBrigade: (titre: string) => `replied to “${titre}”`,
  votesIdees: (n: number) => (n === 1 ? "voted for an idea" : `voted for ${n} ideas`),
  sortieOrganisee: (titre: string) => `is organising ${titre}`,
};
