import { encode } from "uqr";

/**
 * Un QR code en SVG (texte), calculé ici même avec uqr, sans aucun service en ligne : correction d'erreur « M » (un QR un
 * peu abîmé ou mal imprimé se lit encore) et la marge blanche de 4 modules qu'exigent les lecteurs. Même dessin que le kit
 * média du site.
 */
export function dessinerQrSvg(lien: string): string {
  const { size, data } = encode(lien, { ecc: "M", border: 4 });
  const cases = data.flatMap((ligne, y) => ligne.flatMap((noire, x) => (noire ? [`M${x} ${y}h1v1h-1z`] : [])));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${cases.join("")}" fill="#1A1A1A"/></svg>`;
}
