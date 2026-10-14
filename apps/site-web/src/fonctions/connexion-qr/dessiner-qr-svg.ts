// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.
import { encode } from "uqr";

/**
 * Le QR code d'une adresse, en SVG (texte), calculé sur le serveur avec uqr (comme l'affichette pro, sans service en
 * ligne). Correction « M », marge blanche de 4 modules, encre sur blanc (un QR inversé se lit mal).
 */
export function dessinerQrSvg(lien: string): string {
  const { size, data } = encode(lien, { ecc: "M", border: 4 });
  const cases = data.flatMap((ligne, y) => ligne.flatMap((noire, x) => (noire ? [`M${x} ${y}h1v1h-1z`] : [])));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code de connexion à scanner avec l'app SOS Miam"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${cases.join("")}" fill="#1A1A1A"/></svg>`;
}
