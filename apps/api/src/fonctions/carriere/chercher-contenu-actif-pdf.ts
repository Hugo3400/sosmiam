import { decoderNomPdf } from "./decoder-nom-pdf.ts";

const NOM = /\/([^\x00\t\n\f\r ()<>[\]{}/%]*)/g;
const BLANCS = new Set(["\x00", "\t", "\n", "\f", "\r", " "]);
const NOMS_ACTIFS: ReadonlySet<string> = new Set([
  "JavaScript", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "GoToE", "GoToR", "SubmitForm", "ImportData", "OnInstantiate",
]);

function suitUnCodeJs(texte: string, i: number): boolean {
  while (i < texte.length) {
    const c = texte[i]!;
    if (BLANCS.has(c)) i++;
    else if (c === "%") while (i < texte.length && texte[i] !== "\r" && texte[i] !== "\n") i++;
    else return c === "(" || c === "<" || (c >= "0" && c <= "9");
  }
  return false;
}

export function chercherContenuActifPdf(texte: string): boolean {
  for (const trouve of texte.matchAll(NOM)) {
    const nom = decoderNomPdf(trouve[1]!);
    if (NOMS_ACTIFS.has(nom)) return true;
    if (nom === "JS" && suitUnCodeJs(texte, trouve.index + trouve[0].length)) return true;
  }
  return false;
}
