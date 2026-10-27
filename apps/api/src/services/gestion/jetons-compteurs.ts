import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

export const DUREE_JETON_COMPTEURS = 90 * 24 * 3600_000;
const AVANCE_TOLEREE = 60_000;
const FORME = /^([A-Za-z0-9_-]{8,64})\.(\d{13})\.([A-Za-z0-9_-]{43})$/;

const signer = (secret: Uint8Array, posteId: string, creeLe: string) => {
  const cle = Buffer.from(hkdfSync("sha256", secret, new Uint8Array(0), "sos-miam-gestion:compteurs", 32));
  return createHmac("sha256", cle).update(`compteurs:${posteId}:${creeLe}`).digest("base64url");
};

export function creerJetonCompteurs(secret: Uint8Array, posteId: string, maintenant: number): string {
  const creeLe = String(maintenant);
  return `${posteId}.${creeLe}.${signer(secret, posteId, creeLe)}`;
}

export function lireJetonCompteurs(secret: Uint8Array, jeton: string, maintenant: number): string | null {
  const morceaux = FORME.exec(jeton);
  if (!morceaux) return null;
  const [, posteId = "", creeLe = "", signature = ""] = morceaux;
  const age = maintenant - Number(creeLe);
  if (age > DUREE_JETON_COMPTEURS || age < -AVANCE_TOLEREE) return null;
  const attendue = Buffer.from(signer(secret, posteId, creeLe));
  const recue = Buffer.from(signature);
  return attendue.length === recue.length && timingSafeEqual(attendue, recue) ? posteId : null;
}
