export type ImageDecodee = { ok: true; octets: Buffer } | { ok: false; erreur: "image-trop-lourde" | "image-format" };

const PREFIXE_DATA = /^data:[a-z0-9.+/-]{0,40};base64,/i;
const FORME_BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

export function decoderImageSignalement(base64Recu: string, octetsMax: number): ImageDecodee {
  const base64 = base64Recu.replace(PREFIXE_DATA, "").replace(/\s+/g, "");
  if (base64.length === 0 || base64.length % 4 !== 0 || !FORME_BASE64.test(base64)) return { ok: false, erreur: "image-format" };
  const remplissage = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  if ((base64.length / 4) * 3 - remplissage > octetsMax) return { ok: false, erreur: "image-trop-lourde" };
  const octets = Buffer.from(base64, "base64");
  if (octets.length > octetsMax) return { ok: false, erreur: "image-trop-lourde" };
  return { ok: true, octets };
}
