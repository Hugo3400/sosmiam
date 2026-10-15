import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";

export function trouverCoucouReciproque(presents: readonly MiamiPresent[], ecartes: ReadonlySet<string>, estDejaDemande: (id: string) => boolean): MiamiPresent | null {
  return presents.find((p) => p.coucou === "reciproque" && !p.dansTaBande && !ecartes.has(p.personne.id) && !estDejaDemande(p.personne.id)) ?? null;
}
