import { LIBELLES_AVANTAGE_PAR_LANGUE, LIBELLES_REGLEMENT_CLIENT_PAR_LANGUE, LIBELLES_REGLEMENT_LIEU_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { AvantageVisite, ReglementVisite } from "@sos-miam/commun/types/visite";

import { TEXTES_ETIQUETTES_REGLEMENT_PAR_LANGUE } from "~/contenus/textes-etiquettes-reglement";

export type ReglementDecritLangue = {
  titre: string;
  etiquettes: string[];
  etiquettesLues: string[];
  avantages: AvantageVisite[];
  offert: boolean;
};

export function decrireReglementLangue(r: ReglementVisite | null, pour: "client" | "lieu", langue: Langue): ReglementDecritLangue {
  const reglement: ReglementVisite = r ?? { type: "paye", reductionPourcent: null, avantages: [] };
  const libelles = choisirTextes(pour === "client" ? LIBELLES_REGLEMENT_CLIENT_PAR_LANGUE : LIBELLES_REGLEMENT_LIEU_PAR_LANGUE, langue);
  const libellesAvantage = choisirTextes(LIBELLES_AVANTAGE_PAR_LANGUE, langue);
  const T = choisirTextes(TEXTES_ETIQUETTES_REGLEMENT_PAR_LANGUE, langue);
  const reduction = reglement.type === "reduction" && reglement.reductionPourcent !== null ? T.reduction(reglement.reductionPourcent) : "";
  const avantages = [...new Set(reglement.avantages)].sort((a, b) => (a === "partenariat" ? -1 : b === "partenariat" ? 1 : 0));
  const etiquettes = avantages.map((a) => libellesAvantage[a]);
  return {
    titre: `${libelles[reglement.type]}${reduction}`,
    etiquettes,
    etiquettesLues: avantages.map((a, i) => (a === "partenariat" ? `${etiquettes[i]}${T.glosePartenariatLue}` : etiquettes[i])),
    avantages,
    offert: reglement.type === "offert",
  };
}
