import type { FiltresActus } from "../../types/actus.ts";

export function ecrireAdresseActus(filtres: FiltresActus): string {
  const parametres = new URLSearchParams();
  if (filtres.rubrique) parametres.set("rubrique", filtres.rubrique);
  if (filtres.ville) parametres.set("ville", filtres.ville);
  const requete = parametres.toString();
  return requete ? `/actus?${requete}` : "/actus";
}
