import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { deriverCleMotDePasse, ITERATIONS_MOT_DE_PASSE } from "./deriver-cle-mot-de-passe.ts";
import { encoderBase64Url } from "./encoder-base64url.ts";

/** Chiffre la clé secrète du poste (format PKCS#8) avec le mot de passe : c'est ce coffre qui est gardé sur le disque. */
export async function chiffrerCleSecrete(
  pkcs8: Uint8Array<ArrayBuffer>,
  motDePasse: string,
  identite: Pick<CoffreCle, "idPoste" | "clePublique" | "creeLe">,
): Promise<CoffreCle> {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cle = await deriverCleMotDePasse(motDePasse, sel, ITERATIONS_MOT_DE_PASSE);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cle, pkcs8));
  return {
    version: 1,
    ...identite,
    iterations: ITERATIONS_MOT_DE_PASSE,
    sel: encoderBase64Url(sel),
    iv: encoderBase64Url(iv),
    chiffre: encoderBase64Url(chiffre),
  };
}
