import type { Lieu } from "@sos-miam/commun/types/lieu";

import type { Publication } from "~/contenus/type-publication";

/**
 * La ville d'un créateur, devinée d'après ses publications : celle qui revient le plus souvent parmi leurs lieux
 * (à égalité, la première rencontrée). null s'il n'a aucune publication sur un lieu de `lieux`.
 */
export function trouverVilleCreateur(pseudo: string, publications: readonly Publication[], lieux: readonly Lieu[]): string | null {
  const comptes = new Map<string, number>();
  for (const publication of publications) {
    if (publication.auteur.type !== "createur" || publication.auteur.pseudo !== pseudo) continue;
    const ville = lieux.find((lieu) => lieu.id === publication.lieuId)?.ville;
    if (ville) comptes.set(ville, (comptes.get(ville) ?? 0) + 1);
  }
  let trouvee: string | null = null;
  let meilleur = 0;
  for (const [ville, nombre] of comptes) {
    if (nombre > meilleur) {
      trouvee = ville;
      meilleur = nombre;
    }
  }
  return trouvee;
}
