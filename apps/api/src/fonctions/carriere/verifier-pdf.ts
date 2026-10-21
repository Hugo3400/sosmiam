const DEBUT = Buffer.from("%PDF-", "latin1");
const FIN = Buffer.from("%%EOF", "latin1");
const BLANCS_DE_FIN = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const CONTENU_ACTIF = /\/(?:JavaScript|Launch|EmbeddedFiles?|RichMedia|SubmitForm|ImportData)(?![A-Za-z0-9])/;

export function verifierPdf(octets: Uint8Array): boolean {
  const pdf = Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength);
  if (pdf.length < DEBUT.length + FIN.length || !pdf.subarray(0, DEBUT.length).equals(DEBUT)) return false;
  let fin = pdf.length;
  while (fin > 0 && BLANCS_DE_FIN.has(pdf[fin - 1]!)) fin--;
  if (fin < FIN.length || !pdf.subarray(fin - FIN.length, fin).equals(FIN)) return false;
  return !CONTENU_ACTIF.test(pdf.toString("latin1"));
}
