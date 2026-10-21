import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { decoderBase64Url } from "./decoder-base64url.ts";

export async function ouvrirCoffreAvecOctets(coffre: CoffreCle, octets: Uint8Array<ArrayBuffer>): Promise<{ cleSecrete: CryptoKey; cleCoffre: CryptoKey }> {
  const cleCoffre = await crypto.subtle.importKey("raw", octets, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const pkcs8 = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: decoderBase64Url(coffre.iv) }, cleCoffre, decoderBase64Url(coffre.chiffre)));
  try {
    return { cleSecrete: await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]), cleCoffre };
  } finally {
    pkcs8.fill(0);
  }
}
