import type { CarteLieu } from "../../types/carte.ts";

/** Vrai si la carte (telle qu'elle est montrée) propose au moins une boisson alcoolisée : le message sanitaire va avec. */
export function carteContientAlcool(carte: CarteLieu | null | undefined): boolean {
  return carte?.sections.some((s) => s.elements.some((e) => e.alcool === true)) ?? false;
}
