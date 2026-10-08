import { encoderBase64Url } from "./encoder-base64url.ts";

/** Signe un message (Ed25519) et rend la signature en base64url, pour l'en-tête X-Gestion-Signature. */
export async function signerMessage(cleSecrete: CryptoKey, message: string): Promise<string> {
  return encoderBase64Url(new Uint8Array(await crypto.subtle.sign("Ed25519", cleSecrete, new TextEncoder().encode(message))));
}
