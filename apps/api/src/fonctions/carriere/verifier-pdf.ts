import { chercherContenuActifPdf } from "./chercher-contenu-actif-pdf.ts";
import { decompresserFluxPdf } from "./decompresser-flux-pdf.ts";
import { listerFluxObjetsPdf } from "./lister-flux-objets-pdf.ts";

const DEBUT = Buffer.from("%PDF-", "latin1");
const FIN = Buffer.from("%%EOF", "latin1");
const BLANCS_DE_FIN = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const FLUX_D_OBJETS_MAX = 1000;
const OCTETS_DECOMPRESSES_MAX = 16 * 1024 * 1024;

export function verifierPdf(octets: Uint8Array): boolean {
  const pdf = Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength);
  if (pdf.length < DEBUT.length + FIN.length || !pdf.subarray(0, DEBUT.length).equals(DEBUT)) return false;
  let fin = pdf.length;
  while (fin > 0 && BLANCS_DE_FIN.has(pdf[fin - 1]!)) fin--;
  if (fin < FIN.length || !pdf.subarray(fin - FIN.length, fin).equals(FIN)) return false;
  const texte = pdf.toString("latin1");
  if (chercherContenuActifPdf(texte)) return false;
  const flux = listerFluxObjetsPdf(texte);
  if (flux === null || flux.length > FLUX_D_OBJETS_MAX) return false;
  let reste = OCTETS_DECOMPRESSES_MAX;
  for (const { debut, compresse } of flux) {
    if (!compresse) continue;
    const clair = decompresserFluxPdf(pdf.subarray(debut), reste);
    if (clair === null || chercherContenuActifPdf(clair.toString("latin1"))) return false;
    reste -= clair.length;
  }
  return true;
}
