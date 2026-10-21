import { TAILLE_MAX_CV } from "~/contenus/carriere";

export type CvConverti = { ok: true; cv: { nomFichier: string; base64: string } } | { ok: false; erreur: "cv-trop-lourd" | "cv-format" };

const SIGNATURE_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

function nettoyerNomFichier(nom: string): string {
  const base = nom.split(/[\\/]/).pop() ?? "";
  const propre = base.replace(/[\u0000-\u001f\u007f"<>|*?:]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
  if (!propre || propre === ".pdf") return "cv.pdf";
  return /\.pdf$/i.test(propre) ? propre : `${propre.slice(0, 96)}.pdf`;
}

export async function convertirCvEnBase64(fichier: File): Promise<CvConverti> {
  if (fichier.size > TAILLE_MAX_CV) return { ok: false, erreur: "cv-trop-lourd" };
  const octets = new Uint8Array(await fichier.arrayBuffer());
  if (octets.length > TAILLE_MAX_CV) return { ok: false, erreur: "cv-trop-lourd" };
  if (!SIGNATURE_PDF.every((octet, rang) => octets[rang] === octet)) return { ok: false, erreur: "cv-format" };
  return { ok: true, cv: { nomFichier: nettoyerNomFichier(fichier.name), base64: Buffer.from(octets).toString("base64") } };
}
