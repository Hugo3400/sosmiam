import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import { ETIQUETTES_LIEUX_EXEMPLES } from "~/contenus/etiquettes-lieux-exemples";

const AUCUNE: readonly EtiquetteLieu[] = [];
const dejaLues = new Map<number, readonly EtiquetteLieu[]>();

export function lireEtiquettesConfirmeesDemo(lieuId: number): readonly EtiquetteLieu[] {
  const deja = dejaLues.get(lieuId);
  if (deja) return deja;
  const confirmees = (ETIQUETTES_LIEUX_EXEMPLES[lieuId] ?? AUCUNE).filter((e) => e.statut === "confirmee");
  const liste = confirmees.length > 0 ? confirmees : AUCUNE;
  dejaLues.set(lieuId, liste);
  return liste;
}
