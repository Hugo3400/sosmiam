import type { OccupationSortieMiamis } from "../../../../../packages/commun/src/fonctions/sorties-miamis/compter-places-libres.ts";
import { estInvitationHabitueValable } from "./est-invitation-habitue-valable.ts";

type Participation = { compteId: number; statut: string; creeLe: Date };

export function calculerOccupationSortie(
  sortie: { places: number; placeGardeeNouveau: boolean },
  participations: readonly Participation[],
  nouveaux: ReadonlySet<number>,
  maintenant: Date,
): OccupationSortieMiamis {
  const occupants = participations.filter((p) => p.statut === "organise" || p.statut === "accepte" || estInvitationHabitueValable(p, maintenant));
  return {
    places: sortie.places,
    occupees: occupants.length,
    placeGardeePourNouveau: sortie.placeGardeeNouveau,
    nouveauDejaLa: occupants.some((p) => p.statut !== "organise" && nouveaux.has(p.compteId)),
  };
}
