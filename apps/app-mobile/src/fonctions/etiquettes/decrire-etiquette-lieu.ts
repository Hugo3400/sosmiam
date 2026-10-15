import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";

export function decrireEtiquetteLieu(etiquette: EtiquetteLieu): { texte: string; libelleLu: string } {
  if (etiquette.statut === "confirmee") return { texte: etiquette.nom, libelleLu: `${etiquette.nom}, confirmée par le lieu` };
  const n = etiquette.propositions;
  if (etiquette.parToi && n <= 1) return { texte: `${etiquette.nom} · toi`, libelleLu: `${etiquette.nom}, proposée par toi` };
  const miamis = `${n} Miami${n > 1 ? "s" : ""}`;
  return {
    texte: `${etiquette.nom} · ${n}`,
    libelleLu: `${etiquette.nom}, proposée par ${miamis}${etiquette.parToi ? ", dont toi" : ""}`,
  };
}
