import type { ParticipantSortieMiamis, SortieMiamis } from "@sos-miam/commun/types/sorties-miamis";

const AUCUNE_PLACE = { place: "aucune", rangAttente: null, present: false } as const;

export function fairePartirMoi(sortie: SortieMiamis, monId: string, remplacant: ParticipantSortieMiamis | null): SortieMiamis {
  if (sortie.moi.place === "attente") return { ...sortie, nombreEnAttente: Math.max(0, sortie.nombreEnAttente - 1), moi: AUCUNE_PLACE };
  if (sortie.moi.place !== "accepte") return { ...sortie, moi: AUCUNE_PLACE };
  const restants = sortie.participants.filter((p) => p.personne.id !== monId);
  const entrant = sortie.nombreEnAttente > 0 && remplacant ? [remplacant] : [];
  return { ...sortie, participants: [...restants, ...entrant], nombreEnAttente: sortie.nombreEnAttente - entrant.length, moi: AUCUNE_PLACE };
}
