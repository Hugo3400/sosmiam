const EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const TAG_ORIENTATION = 0x0112;

function lireOrientationTiff(tiff: Uint8Array): number | null {
  if (tiff.length < 8) return null;
  const vue = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const ordre = String.fromCharCode(tiff[0]!, tiff[1]!);
  if (ordre !== "II" && ordre !== "MM") return null;
  const petit = ordre === "II";
  if (vue.getUint16(2, petit) !== 42) return null;
  const ifd = vue.getUint32(4, petit);
  if (ifd + 2 > tiff.length) return null;
  const nombre = vue.getUint16(ifd, petit);
  for (let k = 0; k < nombre; k++) {
    const entree = ifd + 2 + k * 12;
    if (entree + 12 > tiff.length) return null;
    if (vue.getUint16(entree, petit) !== TAG_ORIENTATION) continue;
    if (vue.getUint16(entree + 2, petit) !== 3 || vue.getUint32(entree + 4, petit) !== 1) return null;
    const valeur = vue.getUint16(entree + 8, petit);
    return valeur >= 2 && valeur <= 8 ? valeur : null;
  }
  return null;
}

export function lireOrientationJpeg(octets: Uint8Array): number | null {
  let i = 2;
  while (i + 4 <= octets.length && octets[i] === 0xff) {
    const marqueur = octets[i + 1]!;
    if (marqueur === 0xda || marqueur === 0xd9) return null;
    const fin = i + 2 + ((octets[i + 2]! << 8) | octets[i + 3]!);
    if (fin < i + 4 || fin > octets.length) return null;
    if (marqueur === 0xe1 && fin - i >= 10 && EXIF.every((octet, k) => octets[i + 4 + k] === octet)) {
      return lireOrientationTiff(octets.subarray(i + 10, fin));
    }
    i = fin;
  }
  return null;
}
