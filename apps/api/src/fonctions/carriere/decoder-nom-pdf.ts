const estHexa = (c: number) => (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);

export function decoderNomPdf(brut: string): string {
  const premier = brut.indexOf("#");
  if (premier < 0) return brut;
  let nom = brut.slice(0, premier);
  for (let i = premier; i < brut.length; i++) {
    if (brut.charCodeAt(i) === 0x23 && i + 2 < brut.length && estHexa(brut.charCodeAt(i + 1)) && estHexa(brut.charCodeAt(i + 2))) {
      nom += String.fromCharCode(Number.parseInt(brut.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      nom += brut[i];
    }
  }
  return nom;
}
