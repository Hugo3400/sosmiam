import { decoderNomPdf } from "./decoder-nom-pdf.ts";

const FIN_DE_NOM = new Uint8Array(256);
for (const c of "\x00\t\n\f\r ()<>[]{}/%") FIN_DE_NOM[c.charCodeAt(0)] = 1;
const BLANCS = new Set(["\x00", "\t", "\n", "\f", "\r", " "]);
const NOMS_ACTIFS: ReadonlySet<string> = new Set([
  "JavaScript", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "GoToE", "GoToR", "SubmitForm", "ImportData", "OnInstantiate",
]);
const LONGUEUR_ECRITE_MAX = 3 * Math.max(...[...NOMS_ACTIFS].map((nom) => nom.length));

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
  for (let i = texte.indexOf("/"); i >= 0; i = texte.indexOf("/", i)) {
    let fin = i + 1;
    while (fin < texte.length && FIN_DE_NOM[texte.charCodeAt(fin)] !== 1) fin++;
    if (fin - i - 1 >= 2 && fin - i - 1 <= LONGUEUR_ECRITE_MAX) {
      const nom = decoderNomPdf(texte.slice(i + 1, fin));
      if (NOMS_ACTIFS.has(nom) || (nom === "JS" && suitUnCodeJs(texte, fin))) return true;
    }
    i = fin;
  }
  return false;
}
