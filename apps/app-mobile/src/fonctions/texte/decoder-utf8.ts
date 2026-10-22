export function decoderUtf8(octets: Uint8Array): string | null {
  let texte = "";
  let i = 0;
  while (i < octets.length) {
    const premier = octets[i]!;
    const longueur = premier < 0x80 ? 1 : premier >= 0xc2 && premier < 0xe0 ? 2 : premier >= 0xe0 && premier < 0xf0 ? 3 : premier >= 0xf0 && premier < 0xf5 ? 4 : 0;
    if (longueur === 0 || i + longueur > octets.length) return null;
    let point = longueur === 1 ? premier : premier & (0xff >> (longueur + 1));
    for (let j = 1; j < longueur; j++) {
      const suite = octets[i + j]!;
      if ((suite & 0xc0) !== 0x80) return null;
      point = (point << 6) | (suite & 0x3f);
    }
    const minimum = [0, 0, 0x80, 0x800, 0x10000][longueur]!;
    if (point < minimum || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return null;
    texte += String.fromCodePoint(point);
    i += longueur;
  }
  return texte;
}
