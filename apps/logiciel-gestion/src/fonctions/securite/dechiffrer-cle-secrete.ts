import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { decoderBase64Url } from "./decoder-base64url.ts";
import { deriverCleMotDePasse } from "./deriver-cle-mot-de-passe.ts";

/** Rouvre le coffre avec le mot de passe et rend la clé secrète (PKCS#8). Lève une erreur si le mot de passe est faux. */
export async function dechiffrerCleSecrete(coffre: CoffreCle, motDePasse: string): Promise<Uint8Array<ArrayBuffer>> {
  const cle = await deriverCleMotDePasse(motDePasse, decoderBase64Url(coffre.sel), coffre.iterations);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: decoderBase64Url(coffre.iv) }, cle, decoderBase64Url(coffre.chiffre)));
}
