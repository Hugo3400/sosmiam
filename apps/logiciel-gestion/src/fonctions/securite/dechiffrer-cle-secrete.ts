import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { decoderBase64Url } from "./decoder-base64url.ts";
import { deriverCleMotDePasse } from "./deriver-cle-mot-de-passe.ts";

/**
 * Rouvre le coffre avec le mot de passe : rend la clé secrète (PKCS#8) et la clé tirée du mot de passe (`cleCoffre`).
 * Lève une erreur si le mot de passe est faux.
 */
export async function dechiffrerCleSecrete(coffre: CoffreCle, motDePasse: string): Promise<{ pkcs8: Uint8Array<ArrayBuffer>; cleCoffre: CryptoKey }> {
  const cleCoffre = await deriverCleMotDePasse(motDePasse, decoderBase64Url(coffre.sel), coffre.iterations);
  const pkcs8 = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: decoderBase64Url(coffre.iv) }, cleCoffre, decoderBase64Url(coffre.chiffre)));
  return { pkcs8, cleCoffre };
}
