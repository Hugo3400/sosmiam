/**
 * Largeur et hauteur d'un JPEG, lues dans son premier segment SOF (SOF0 à SOF15, sauf DHT, JPG et DAC, qui partagent la
 * même plage de marqueurs), en suivant les segments depuis le début (SOI). null : pas un JPEG, fichier tronqué, segment qui
 * déborde, SOS ou EOI avant le SOF, ou dimensions nulles (hauteur donnée plus tard par DNL : refusé).
 */
export function lireTailleJpeg(octets: Uint8Array): { largeur: number; hauteur: number } | null {
  const n = octets.length;
  if (n < 4 || octets[0] !== 0xff || octets[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= n) {
    if (octets[i] !== 0xff) return null;
    // Octets de remplissage (FF FF…) avant le marqueur
    while (i + 2 < n && octets[i + 1] === 0xff) i += 1;
    const marqueur = octets[i + 1];
    if (marqueur === 0xd8 || marqueur === 0xd9 || marqueur === 0xda) return null;
    // Marqueurs sans longueur (RST0 à RST7, TEM)
    if ((marqueur >= 0xd0 && marqueur <= 0xd7) || marqueur === 0x01) {
      i += 2;
      continue;
    }
    if (i + 4 > n) return null;
    const longueur = (octets[i + 2] << 8) | octets[i + 3];
    if (longueur < 2 || i + 2 + longueur > n) return null;
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
      if (longueur < 7) return null;
      const hauteur = (octets[i + 5] << 8) | octets[i + 6];
      const largeur = (octets[i + 7] << 8) | octets[i + 8];
      return largeur > 0 && hauteur > 0 ? { largeur, hauteur } : null;
    }
    i += 2 + longueur;
  }
  return null;
}
