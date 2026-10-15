const ADOBE = [0x41, 0x64, 0x6f, 0x62, 0x65];

/** Un segment APP14 « Adobe » : sans lui certains JPEG s'affichent avec de fausses couleurs */
function reecrireSegmentAdobe(octets: Uint8Array, debut: number, fin: number): Uint8Array | null {
  if (fin - debut < 12 || !ADOBE.every((octet, k) => octets[debut + k] === octet)) return null;
  const transformation = octets[debut + 11];
  if (transformation > 2) return null;
  return Uint8Array.of(0xff, 0xee, 0x00, 0x0e, ...ADOBE, 0x00, 0x64, 0x00, 0x00, 0x00, 0x00, transformation);
}

/**
 * Une photo du chat sans ses métadonnées (spécification sociale B.8, D.4). On suit les segments et les marqueurs depuis le
 * début (SOI) jusqu'à la FIN DE L'IMAGE PRINCIPALE (EOI) :
 * - retirés : APP1 à APP15 (EXIF et sa position GPS, XMP, ICC, MPF, IPTC…), sauf APP14 « Adobe », et les commentaires (COM) ;
 * - gardés : APP0 (JFIF), DQT, SOF, DHT, DRI, SOS et les données compressées, telles quelles (dans les données, FF00 et
 *   RST0 à RST7 ne terminent pas un passage ; une image progressive a plusieurs passages) ;
 * - TOUT ce qui suit l'EOI est jeté : images MPF (seconde vue, carte de gain, avec leur propre EXIF), fichiers collés.
 * null : pas un JPEG, fichier mal formé ou tronqué (pas d'EOI), passage (SOS) avant le SOF, ou second SOI avant l'EOI.
 * Les pixels décodés restent identiques ; mais l'orientation EXIF et le profil de couleurs ICC (APP2) partent aussi : une
 * photo « tournée » par son EXIF s'afficherait couchée, et une photo Display P3 un peu terne. L'app envoie donc une photo
 * déjà redressée, en sRGB (preparerPhotoChat, spécification sociale G.2).
 */
export function retirerMetadonneesJpeg(octets: Uint8Array): Buffer | null {
  const n = octets.length;
  if (n < 4 || octets[0] !== 0xff || octets[1] !== 0xd8) return null;
  const morceaux: Uint8Array[] = [octets.subarray(0, 2)];
  let i = 2;
  let sofVu = false;
  let sosVu = false;
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
      return Buffer.concat(morceaux);
    }
    // Un second SOI, un RST hors des données compressées ou un octet nul : fichier mal formé (ou deux images collées)
    if (marqueur === 0xd8 || marqueur === 0x00 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) return null;
    if (i + 4 > n) return null;
    const fin = i + 2 + ((octets[i + 2] << 8) | octets[i + 3]);
    if (fin < i + 4 || fin > n) return null;
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) sofVu = true;
    const metadonnee = marqueur === 0xfe || marqueur === 0xc8 || (marqueur >= 0xe1 && marqueur <= 0xef) || (marqueur >= 0xf0 && marqueur <= 0xfd);
    const adobe = marqueur === 0xee ? reecrireSegmentAdobe(octets, i + 4, fin) : null;
    if (adobe) morceaux.push(adobe);
    else if (!metadonnee) morceaux.push(octets.subarray(i, fin));
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
