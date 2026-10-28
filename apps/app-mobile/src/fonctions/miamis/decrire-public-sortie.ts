import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { PublicSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import {
  CHOIX_PUBLICS_SORTIE,
  CHOIX_PUBLICS_SORTIE_PAR_LANGUE,
  NOMS_TRANCHES_AGE_PAR_LANGUE,
  QUI_VOIT_PUBLIC_PAR_LANGUE,
  TEXTES_SORTIE_MIAMIS_PAR_LANGUE,
} from "~/contenus/textes-sorties-miamis";
import { lireChoixPublic } from "~/fonctions/miamis/lire-choix-public";

export function decrirePublicSortie(publicSortie: PublicSortieMiamis, langue: Langue): { nom: string; quiVoit: string | null } {
  const choix = lireChoixPublic(publicSortie);
  if (choix === "tous") return { nom: choisirTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE, langue).pourTous, quiVoit: null };
  const rang = CHOIX_PUBLICS_SORTIE.findIndex((c) => c.id === choix);
  const nom = publicSortie.type === "age" ? choisirTextes(NOMS_TRANCHES_AGE_PAR_LANGUE, langue)[publicSortie.tranche] : (choisirTextes(CHOIX_PUBLICS_SORTIE_PAR_LANGUE, langue)[rang]?.nom ?? "");
  return { nom, quiVoit: choisirTextes(QUI_VOIT_PUBLIC_PAR_LANGUE, langue)[choix] };
}
