import { ouvrirCoffreAvecOctets } from "~/fonctions/securite/ouvrir-coffre-avec-octets.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { DUREE_RETENUE_MAX_MS, ecrireDeverrouillageRetenu, lireDeverrouillageRetenu, oublierDeverrouillageRetenu } from "~/stockage/deverrouillage-retenu.ts";
import { deprotegerSecret, peutRetenirMotDePasse, protegerSecret } from "./systeme.ts";

export async function retenirDeverrouillage(octets: Uint8Array, heures: number, maintenant = Date.now()): Promise<boolean> {
  if (heures <= 0 || !peutRetenirMotDePasse()) {
    oublierDeverrouillageRetenu();
    return false;
  }
  try {
    ecrireDeverrouillageRetenu({ protegee: await protegerSecret(octets), expireLe: maintenant + Math.min(heures * 3600_000, DUREE_RETENUE_MAX_MS) });
    return true;
  } catch {
    oublierDeverrouillageRetenu();
    return false;
  }
}

export async function rouvrirDeverrouillageRetenu(coffre: CoffreCle): Promise<{ cleSecrete: CryptoKey; cleCoffre: CryptoKey } | null> {
  const retenu = lireDeverrouillageRetenu();
  if (!retenu || !peutRetenirMotDePasse()) return null;
  try {
    const octets = await deprotegerSecret(retenu.protegee);
    try {
      return await ouvrirCoffreAvecOctets(coffre, octets);
    } finally {
      octets.fill(0);
    }
  } catch {
    oublierDeverrouillageRetenu();
    return null;
  }
}

export const deverrouillageRetenuValable = () => peutRetenirMotDePasse() && lireDeverrouillageRetenu() !== null;
