import type { EtiquetteLieu } from "../../types/etiquette.ts";
import { normaliserEtiquette } from "./normaliser-etiquette.ts";

export function ajouterPropositionEtiquette(etiquettes: readonly EtiquetteLieu[], nom: string): readonly EtiquetteLieu[] {
  const cle = normaliserEtiquette(nom);
  const existante = etiquettes.find((e) => normaliserEtiquette(e.nom) === cle);
  if (!existante) return [...etiquettes, { nom, statut: "proposee", propositions: 1, parToi: true }];
  if (existante.statut === "confirmee" || existante.parToi) return etiquettes;
  return etiquettes.map((e) => (e === existante ? { ...e, propositions: e.propositions + 1, parToi: true } : e));
}
