import { MENTIONS_AVIS_REGLEMENT_ANGLAIS } from "@sos-miam/commun/contenus/anglais/libelles-reglement";
import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CHOIX_REGLEMENT } from "~/contenus/textes-choix-reglement";

export const TEXTES_CHOIX_REGLEMENT_ANGLAIS: Traduction<typeof TEXTES_CHOIX_REGLEMENT> = {
  details: {
    paye: "+15 points for the customer (+25 during an SOS), plus a stamp",
    reduction: "Same as paid, and the discount is shown",
    offert: `Visit noted, no points or stamp. Their review will be marked ${citer(MENTIONS_AVIS_REGLEMENT_ANGLAIS.offert ?? "", "en")}`,
  },
  titre: "How was the bill settled?",
  choixLu: (libelle: string, position: number, total: number, detail: string) => `${libelle}, ${position} of ${total}. ${detail}`,
  quelleReduction: "Which discount?",
  reduction: (pourcent: number) => `−${pourcent}%`,
  sansPreciser: "Not specified",
  avantageEnPlus: "Any perks on top?",
  glosePartenariat: (mention: string) => `${mention} · paid or gifted partnership`,
  notePartenariat: (mention: string) => `${mention} (a paid or gifted partnership) will always be shown on the visit and on the customer's review, in full transparency.`,
};
