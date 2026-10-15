import { verifierPassagesJpeg } from "./verifier-passages-jpeg.ts";

const ADOBE = [0x41, 0x64, 0x6f, 0x62, 0x65];
const JFIF = [0x4a, 0x46, 0x49, 0x46, 0x00];

/** Un segment APP14 « Adobe » : sans lui certains JPEG s'affichent avec de fausses couleurs */
function reecrireSegmentAdobe(octets: Uint8Array, debut: number, fin: number): Uint8Array | null {
  if (fin - debut < 12 || !ADOBE.every((octet, k) => octets[debut + k] === octet)) return null;
  const transformation = octets[debut + 11];
  if (transformation > 2) return null;
  return Uint8Array.of(0xff, 0xee, 0x00, 0x0e, ...ADOBE, 0x00, 0x64, 0x00, 0x00, 0x00, 0x00, transformation);
}

function reecrireSegmentJfif(octets: Uint8Array, debut: number, fin: number): Uint8Array | null {
  if (fin - debut < 14 || !JFIF.every((octet, k) => octets[debut + k] === octet)) return null;
  const unites = octets[debut + 7] <= 2 ? octets[debut + 7] : 0;
  return Uint8Array.of(0xff, 0xe0, 0x00, 0x10, ...JFIF, 0x01, 0x01, unites, ...octets.subarray(debut + 8, debut + 12), 0x00, 0x00);
}

const estGarde = (marqueur: number) =>
  marqueur === 0xdb || marqueur === 0xdd || marqueur === 0xda || (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc8);

/**
 * Une photo (chat, avis, profil) sans ses métadonnées, du début (SOI) à la fin de l'image principale (EOI) :
 * - gardés tels quels : DQT, SOF, DHT, DAC, DRI, SOS et les données compressées ;
 * - réécrits : le premier APP0 « JFIF » (en-tête standard, sans vignette) et le premier APP14 « Adobe » ;
 * - retirés : tout le reste (EXIF et sa position GPS, XMP, ICC, IPTC, COM, JPG, DNL…) et TOUT ce qui suit l'EOI.
 * null : pas un JPEG Huffman (SOF0 à SOF2), mal formé ou tronqué, second SOI, ou données compressées qui ne tombent pas
 * juste (octets parasites : verifierPassagesJpeg). Les pixels décodés restent identiques, mais l'orientation EXIF et le
 * profil ICC partent aussi : l'app envoie une photo déjà redressée, en sRGB.
 */
export function retirerMetadonneesJpeg(octets: Uint8Array): Buffer | null {
  const n = octets.length;
  if (n < 4 || octets[0] !== 0xff || octets[1] !== 0xd8) return null;
  const morceaux: Uint8Array[] = [octets.subarray(0, 2)];
  let i = 2;
  let sofVu = false;
  let sosVu = false;
  const reecrits = new Set<number>();
  for (;;) {
    if (i + 2 > n || octets[i] !== 0xff) return null;
    while (octets[i + 1] === 0xff) {
      i += 1;
      if (i + 2 > n) return null;
    }
    const marqueur = octets[i + 1];
    if (marqueur === 0xd9) {
      if (!sosVu) return null;
      morceaux.push(octets.subarray(i, i + 2));
      const propre = Buffer.concat(morceaux);
      return verifierPassagesJpeg(propre) ? propre : null;
    }
    // Un second SOI, un RST hors des données compressées ou un octet nul : fichier mal formé (ou deux images collées)
    if (marqueur === 0xd8 || marqueur === 0x00 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) return null;
    if (i + 4 > n) return null;
    const fin = i + 2 + ((octets[i + 2] << 8) | octets[i + 3]);
    if (fin < i + 4 || fin > n) return null;
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) sofVu = true;
    const reecrit = reecrits.has(marqueur)
      ? null
      : marqueur === 0xe0
        ? reecrireSegmentJfif(octets, i + 4, fin)
        : marqueur === 0xee
          ? reecrireSegmentAdobe(octets, i + 4, fin)
          : null;
    if (reecrit) {
      reecrits.add(marqueur);
      morceaux.push(reecrit);
    } else if (estGarde(marqueur)) morceaux.push(octets.subarray(i, fin));
    i = fin;
    if (marqueur !== 0xda) continue;
    if (!sofVu) return null;
    sosVu = true;
    // Données compressées : jusqu'au premier marqueur qui n'est ni un octet échappé (FF00), ni un RST, ni du remplissage
    const debut = i;
    for (;;) {
      const ff = octets.indexOf(0xff, i);
      if (ff < 0 || ff + 1 >= n) return null;
      const suivant = octets[ff + 1];
      if (suivant === 0x00 || (suivant >= 0xd0 && suivant <= 0xd7)) i = ff + 2;
      else if (suivant === 0xff) i = ff + 1;
      else {
        i = ff;
        break;
      }
    }
    morceaux.push(octets.subarray(debut, i));
  }
}
