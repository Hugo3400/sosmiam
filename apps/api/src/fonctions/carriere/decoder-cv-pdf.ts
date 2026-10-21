import type { NouvelleCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import { verifierPdf } from "./verifier-pdf.ts";

export type CvDecode = { ok: true; octets: Buffer } | { ok: false; erreur: "cv-trop-lourd" | "cv-format" };

const PREFIXE_DATA = "data:application/pdf;base64,";
const FORME_BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

export function decoderCvPdf(cv: NonNullable<NouvelleCandidature["cv"]>, octetsMax: number): CvDecode {
  if (!/\.pdf$/i.test(cv.nomFichier.trim())) return { ok: false, erreur: "cv-format" };
  const base64 = (cv.base64.startsWith(PREFIXE_DATA) ? cv.base64.slice(PREFIXE_DATA.length) : cv.base64).replace(/\s+/g, "");
  if (base64.length === 0 || base64.length % 4 !== 0 || !FORME_BASE64.test(base64)) return { ok: false, erreur: "cv-format" };
  const remplissage = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  if ((base64.length / 4) * 3 - remplissage > octetsMax) return { ok: false, erreur: "cv-trop-lourd" };
  const octets = Buffer.from(base64, "base64");
  if (octets.length > octetsMax) return { ok: false, erreur: "cv-trop-lourd" };
  return verifierPdf(octets) ? { ok: true, octets } : { ok: false, erreur: "cv-format" };
}
