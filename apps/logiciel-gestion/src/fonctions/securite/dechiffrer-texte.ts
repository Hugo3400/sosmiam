import { decoderBase64Url } from "./decoder-base64url.ts";

/** Déchiffre un texte chiffré par chiffrerTexte. Lève une erreur si la clé n'est pas la bonne ou si le texte a été modifié. */
export async function dechiffrerTexte(cle: CryptoKey, { iv, chiffre }: { iv: string; chiffre: string }): Promise<string> {
  const clair = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decoderBase64Url(iv) }, cle, decoderBase64Url(chiffre));
  return new TextDecoder().decode(clair);
}
