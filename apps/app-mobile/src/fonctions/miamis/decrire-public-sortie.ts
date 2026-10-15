import type { PublicSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { CHOIX_PUBLICS_SORTIE, NOMS_TRANCHES_AGE, QUI_VOIT_PUBLIC, TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { lireChoixPublic } from "~/fonctions/miamis/lire-choix-public";

export function decrirePublicSortie(publicSortie: PublicSortieMiamis): { nom: string; quiVoit: string | null } {
  const choix = lireChoixPublic(publicSortie);
  if (choix === "tous") return { nom: TEXTES_SORTIE_MIAMIS.pourTous, quiVoit: null };
  const nom = publicSortie.type === "age" ? NOMS_TRANCHES_AGE[publicSortie.tranche] : (CHOIX_PUBLICS_SORTIE.find((c) => c.id === choix)?.nom ?? "");
  return { nom, quiVoit: QUI_VOIT_PUBLIC[choix] };
}
