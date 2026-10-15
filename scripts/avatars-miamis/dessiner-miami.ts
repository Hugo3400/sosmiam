// Dessine un Miami en SVG carré 200 × 200 : la bouée cadrée pour un rond de profil (le haut du couvre-chef tient dans le rond)
import { BOUCHES, BOUEE, dessinerJoues, YEUX } from "./parties-bouee.ts";
import type { Miami } from "./miamis.ts";

export const CADRAGE = "translate(100 120) scale(0.76) translate(-100 -100)";

/** Le Miami seul (bouée, visage, couvre-chef), sans fond ni découpe */
export function dessinerMiami(miami: Miami): string {
  const yeux = miami.yeux ? YEUX[miami.yeux] : "";
  const bouche = miami.bouche ? BOUCHES[miami.bouche] : "";
  return `<g transform="${CADRAGE}">${BOUEE}${dessinerJoues(miami.jouesDy ?? 0, miami.joues ?? 0.45)}${yeux}${bouche}${miami.dessus}</g>`;
}

/** Le fichier SVG complet : le Miami dans son rond de couleur `fond`, découpé en rond */
export function dessinerSvgMiami(miami: Miami, fond: string, taille = 1024): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" viewBox="0 0 200 200"><defs><clipPath id="rond-${miami.id}"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#rond-${miami.id})"><circle cx="100" cy="100" r="100" fill="${fond}"/>${dessinerMiami(miami)}</g></svg>\n`;
}
