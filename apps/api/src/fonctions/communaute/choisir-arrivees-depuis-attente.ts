import { compterPlacesLibres } from "../../../../../packages/commun/src/fonctions/sorties-miamis/compter-places-libres.ts";
import { calculerOccupationSortie } from "./calculer-occupation-sortie.ts";

type Participation = { compteId: number; statut: string; creeLe: Date; decideLe: Date | null };

export function choisirArriveesDepuisAttente(
  sortie: { places: number; placeGardeeNouveau: boolean },
  participations: readonly Participation[],
  nouveaux: ReadonlySet<number>,
  maintenant: Date,
): number[] {
  const occupation = calculerOccupationSortie(sortie, participations, nouveaux, maintenant);
  const file = participations
    .filter((p) => p.statut === "attente")
    .sort((a, b) => (a.decideLe ?? a.creeLe).getTime() - (b.decideLe ?? b.creeLe).getTime() || a.compteId - b.compteId);
  const arrivees: number[] = [];
  for (const p of file) {
    const nouveau = nouveaux.has(p.compteId);
    if (compterPlacesLibres(occupation, nouveau) <= 0) continue;
    arrivees.push(p.compteId);
    occupation.occupees += 1;
    if (nouveau) occupation.nouveauDejaLa = true;
  }
  return arrivees;
}
