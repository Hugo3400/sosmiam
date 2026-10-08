import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { chiffrerCleSecrete } from "./chiffrer-cle-secrete.ts";
import { dechiffrerCleSecrete } from "./dechiffrer-cle-secrete.ts";

/** Rechiffre la clé du poste avec un nouveau mot de passe (même clé : rien à refaire sur le serveur). */
export async function changerMotDePasseCoffre(coffre: CoffreCle, ancien: string, nouveau: string): Promise<{ coffre: CoffreCle; cleCoffre: CryptoKey }> {
  const { pkcs8 } = await dechiffrerCleSecrete(coffre, ancien);
  try {
    return await chiffrerCleSecrete(pkcs8, nouveau, coffre);
  } finally {
    pkcs8.fill(0);
  }
}
