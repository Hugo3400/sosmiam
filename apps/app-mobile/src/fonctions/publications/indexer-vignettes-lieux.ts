import type { ImageSourcePropType } from "react-native";

import type { Publication } from "~/contenus/type-publication";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";

export function indexerVignettesLieux(publications: Publication[], estMasquee: (id: string) => boolean): Map<number, ImageSourcePropType | null> {
  const choisies = new Map<number, Publication>();
  for (const publication of publications) {
    if (estMasquee(publication.id)) continue;
    const deja = choisies.get(publication.lieuId);
    if (!deja || (deja.auteur.type !== "lieu" && publication.auteur.type === "lieu")) choisies.set(publication.lieuId, publication);
  }
  const vignettes = new Map<number, ImageSourcePropType | null>();
  for (const [lieuId, publication] of choisies) vignettes.set(lieuId, trouverVignettePublication(publication));
  return vignettes;
}
