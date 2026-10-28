import { LIBELLES_AVANTAGE_PAR_LANGUE, LIBELLES_REGLEMENT_CLIENT_PAR_LANGUE, LIBELLES_REGLEMENT_LIEU_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { decrireReglement, type ReglementDecrit } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";

export function decrireReglementLangue(r: ReglementVisite | null, pour: "client" | "lieu", langue: Langue): ReglementDecrit {
  const decrit = decrireReglement(r, pour);
  if (langue !== "en") return decrit;
  const reglement: ReglementVisite = r ?? { type: "paye", reductionPourcent: null, avantages: [] };
  const libelles = choisirTextes(pour === "client" ? LIBELLES_REGLEMENT_CLIENT_PAR_LANGUE : LIBELLES_REGLEMENT_LIEU_PAR_LANGUE, langue);
  const avantages = choisirTextes(LIBELLES_AVANTAGE_PAR_LANGUE, langue);
  const reduction = reglement.type === "reduction" && reglement.reductionPourcent !== null ? ` (−${reglement.reductionPourcent}%)` : "";
  const ordre = [...new Set(reglement.avantages)].sort((a, b) => (a === "partenariat" ? -1 : b === "partenariat" ? 1 : 0));
  return { titre: `${libelles[reglement.type]}${reduction}`, etiquettes: ordre.map((a) => avantages[a]), offert: decrit.offert };
}
