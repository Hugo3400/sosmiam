import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { calculerIdPoste } from "./calculer-id-poste.ts";
import { chiffrerCleSecrete } from "./chiffrer-cle-secrete.ts";
import { encoderBase64Url } from "./encoder-base64url.ts";

/**
 * Crée la paire de clés Ed25519 du poste. La clé secrète repart aussitôt chiffrée par le mot de passe (le coffre) ;
 * en mémoire, il n'en reste qu'une version non exportable, qui sait signer mais qu'aucun script ne peut lire.
 */
export async function creerClePoste(motDePasse: string): Promise<{ coffre: CoffreCle; cleSecrete: CryptoKey; cleCoffre: CryptoKey }> {
  const paire = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const brute = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", paire.privateKey));
  try {
    const { coffre, cleCoffre } = await chiffrerCleSecrete(pkcs8, motDePasse, {
      idPoste: await calculerIdPoste(brute),
      clePublique: encoderBase64Url(brute),
      creeLe: new Date().toISOString(),
    });
    const cleSecrete = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
    return { coffre, cleSecrete, cleCoffre };
  } finally {
    pkcs8.fill(0);
  }
}
