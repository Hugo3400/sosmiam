import type { OccupationSortieMiamis } from "@sos-miam/commun/fonctions/sorties-miamis/compter-places-libres";
import type { SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";

export function lireOccupationSortie(sortie: SortieMiamis): OccupationSortieMiamis {
  return {
    places: sortie.places,
    occupees: sortie.participants.length,
    placeGardeePourNouveau: sortie.placeGardeePourNouveau,
    nouveauDejaLa: sortie.participants.some((p) => p.nouveau && p.personne.id !== sortie.organisateur.id),
  };
}
