import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { dechiffrerCleSecrete } from "./dechiffrer-cle-secrete.ts";

/**
 * Déverrouille le coffre : rend la clé de signature, non exportable, et la clé tirée du mot de passe (qui déchiffre la
 * session gardée sur ce PC). Lève une erreur si le mot de passe est faux.
 */
export async function ouvrirCoffre(coffre: CoffreCle, motDePasse: string): Promise<{ cleSecrete: CryptoKey; cleCoffre: CryptoKey }> {
  const { pkcs8, cleCoffre } = await dechiffrerCleSecrete(coffre, motDePasse);
  try {
    return { cleSecrete: await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]), cleCoffre };
  } finally {
    pkcs8.fill(0);
  }
}
