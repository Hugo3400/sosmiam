import { createCipheriv, randomBytes } from "node:crypto";

export const CONTEXTE_APERCU_PUSH = "sos-miam/apercu/v1";

export function chiffrerApercuPush(apercu: { titre: string; texte: string }, cle: Uint8Array): string {
  if (cle.length !== 32) throw new Error("La clé d'aperçu doit faire 32 octets");
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle, iv);
  chiffreur.setAAD(Buffer.from(CONTEXTE_APERCU_PUSH, "utf8"));
  const donnees = Buffer.concat([chiffreur.update(JSON.stringify({ t: apercu.titre, c: apercu.texte }), "utf8"), chiffreur.final()]);
  return Buffer.concat([iv, donnees, chiffreur.getAuthTag()]).toString("base64");
}
