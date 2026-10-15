import { compterPlacesLibres } from "@sos-miam/commun/fonctions/sorties-miamis/compter-places-libres";
import type { ParticipantSortieMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { lireOccupationSortie } from "~/fonctions/miamis/lire-occupation-sortie";

export function faireEntrerMoi(sortie: SortieMiamis, moi: ParticipantSortieMiamis): SortieMiamis {
  if (compterPlacesLibres(lireOccupationSortie(sortie), moi.nouveau) > 0) {
    return {
      ...sortie,
      participants: [...sortie.participants, moi],
      conversationId: sortie.conversationId ?? sortie.id,
      moi: { place: "accepte", rangAttente: null, present: false },
    };
  }
  const rang = sortie.nombreEnAttente + 1;
  return { ...sortie, nombreEnAttente: rang, moi: { place: "attente", rangAttente: rang, present: false } };
}
