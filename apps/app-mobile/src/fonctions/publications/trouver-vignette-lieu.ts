import type { ImageSourcePropType } from "react-native";

import type { Publication } from "~/contenus/type-publication";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";

/** Image qui représente un lieu en petit : la vignette de sa propre publication, sinon d'une publication à son sujet (null si aucune). */
export function trouverVignetteLieu(idLieu: number, publications: Publication[]): ImageSourcePropType | null {
  const duLieu = publications.filter((p) => p.lieuId === idLieu);
  const sienne = duLieu.find((p) => p.auteur.type === "lieu") ?? duLieu[0];
  return sienne ? trouverVignettePublication(sienne) : null;
}
