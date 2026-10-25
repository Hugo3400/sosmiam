import type { CarteLieu, ElementCarte } from "~/types/carte";

export function listerSpecialitesCarte(carte: CarteLieu | null | undefined, maximum: number): ElementCarte[] {
  return (carte?.sections ?? []).flatMap((section) => section.elements).filter((element) => element.signature === true).slice(0, maximum);
}
