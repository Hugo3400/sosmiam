import type { EtiquetteLieu } from "../../types/etiquette.ts";

const COMPARER_NOMS = new Intl.Collator("fr").compare;

export function trierEtiquettesLieu(etiquettes: readonly EtiquetteLieu[]): EtiquetteLieu[] {
  const confirmees = etiquettes.filter((e) => e.statut === "confirmee");
  const proposees = etiquettes
    .filter((e) => e.statut === "proposee")
    .sort((a, b) => b.propositions - a.propositions || COMPARER_NOMS(a.nom, b.nom));
  return [...confirmees, ...proposees];
}
