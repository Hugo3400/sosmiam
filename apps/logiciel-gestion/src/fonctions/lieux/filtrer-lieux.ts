import { simplifierNom } from "../texte/simplifier-nom.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

/**
 * Les lieux du type (« resto », « bar »…) et de la catégorie (« Ce que c'est » : Bar à tapas, Brasserie…) choisis, dans
 * le même ordre ; vide : pas de filtre. La catégorie se compare sans majuscules, accents ni espaces en trop.
 */
export function filtrerLieux<T extends Pick<ResumeLieu, "type" | "info">>(lieux: T[], { type, categorie }: { type: string; categorie: string }): T[] {
  const cle = simplifierNom(categorie);
  return lieux.filter((lieu) => (!type || lieu.type === type) && (!cle || simplifierNom(lieu.info) === cle));
}
