import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { dechiffrerCleSecrete } from "./dechiffrer-cle-secrete.ts";

/** Déverrouille le coffre : rend la clé de signature, non exportable. Lève une erreur si le mot de passe est faux. */
export async function ouvrirCoffre(coffre: CoffreCle, motDePasse: string): Promise<CryptoKey> {
  const pkcs8 = await dechiffrerCleSecrete(coffre, motDePasse);
  try {
    return await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
  } finally {
    pkcs8.fill(0);
  }
}
