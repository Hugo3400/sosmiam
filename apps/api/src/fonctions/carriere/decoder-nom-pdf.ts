const ECHAPPEMENT = /#([0-9A-Fa-f]{2})/g;

export function decoderNomPdf(brut: string): string {
  return brut.includes("#") ? brut.replace(ECHAPPEMENT, (_, hexa: string) => String.fromCharCode(Number.parseInt(hexa, 16))) : brut;
}
