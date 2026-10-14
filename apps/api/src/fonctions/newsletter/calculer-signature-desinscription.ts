import { createHmac } from "node:crypto";

/** 16 octets (128 bits) de HMAC-SHA256 : impossible à deviner, et le lien reste court */
export const OCTETS_SIGNATURE_DESINSCRIPTION = 16;

/** Signature d'une adresse (déjà en minuscules) pour le lien de désinscription : HMAC-SHA256 tronqué, avec la sous-clé dédiée. */
export function calculerSignatureDesinscription(email: string, cle: Uint8Array): Buffer {
  return createHmac("sha256", cle).update(`desinscription-newsletter:${email}`, "utf8").digest().subarray(0, OCTETS_SIGNATURE_DESINSCRIPTION);
}
