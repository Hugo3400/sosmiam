import { compterPlacesLibres } from "@sos-miam/commun/fonctions/sorties-miamis/compter-places-libres";
import type { SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { lireOccupationSortie } from "~/fonctions/miamis/lire-occupation-sortie";

export function accepterDemandeArrivee(sortie: SortieMiamis, personneId: string): SortieMiamis {
  const demande = sortie.demandes.find((d) => d.personne.id === personneId);
  if (!demande) return sortie;
  const demandes = sortie.demandes.filter((d) => d.personne.id !== personneId);
  if (compterPlacesLibres(lireOccupationSortie(sortie), demande.nouveau) > 0) {
    const arrivant = { personne: demande.personne, habitue: false, dansTaBande: false, nouveau: demande.nouveau, present: false };
    return { ...sortie, demandes, participants: [...sortie.participants, arrivant] };
  }
  return { ...sortie, demandes, listeAttente: [...sortie.listeAttente, demande.personne], nombreEnAttente: sortie.nombreEnAttente + 1 };
}
