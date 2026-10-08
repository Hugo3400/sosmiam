import { encoderBase64Url } from "./encoder-base64url.ts";

/** Chiffre un court texte (AES-256-GCM) avec une clé déjà prête : rend le vecteur d'initialisation et le texte chiffré. */
export async function chiffrerTexte(cle: CryptoKey, texte: string): Promise<{ iv: string; chiffre: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cle, new TextEncoder().encode(texte)));
  return { iv: encoderBase64Url(iv), chiffre: encoderBase64Url(chiffre) };
}
