import { encoderBase64Url } from "./encoder-base64url.ts";

/** Identifiant court du poste : les 16 premiers caractères du SHA-256 de sa clé publique (même calcul que l'API). */
export async function calculerIdPoste(clePublique: Uint8Array<ArrayBuffer>): Promise<string> {
  return encoderBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", clePublique))).slice(0, 16);
}
