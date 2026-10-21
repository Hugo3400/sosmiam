import { ETIQUETTES_FILTRE_EXPLORER } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";
import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";

const RANGS_FILTRE = new Map(ETIQUETTES_FILTRE_EXPLORER.map((nom, rang) => [normaliserEtiquette(nom), rang]));

export function choisirEtiquettesLigne(etiquettes: readonly EtiquetteLieu[], choisie: string | null, nombre = 2): readonly EtiquetteLieu[] {
  if (etiquettes.length === 0) return etiquettes;
  const cleChoisie = choisie ? normaliserEtiquette(choisie) : null;
  const rang = (etiquette: EtiquetteLieu) => {
    const cle = normaliserEtiquette(etiquette.nom);
    return cle === cleChoisie ? -1 : (RANGS_FILTRE.get(cle) ?? RANGS_FILTRE.size);
  };
  return [...etiquettes].sort((a, b) => rang(a) - rang(b)).slice(0, nombre);
}
