import type { FiltresActus } from "../../types/actus.ts";

export function ecrireAdresseActus(filtres: Pick<FiltresActus, "rubrique" | "ville"> & { curseur?: string | null }): string {
  const parametres = new URLSearchParams();
  if (filtres.rubrique) parametres.set("rubrique", filtres.rubrique);
  if (filtres.ville) parametres.set("ville", filtres.ville);
  if (filtres.curseur) parametres.set("curseur", filtres.curseur);
  const requete = parametres.toString();
  return requete ? `/actus?${requete}` : "/actus";
}
