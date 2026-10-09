import { createHmac } from "node:crypto";

/** 16 octets de HMAC-SHA256, soit 22 caractères base64url (longueur attendue par lireCodeScanne pour la version « 1 ») */
const OCTETS_SIGNATURE = 16;

/**
 * La signature des QR du comptoir (version « 1 ») avec cette clé : HMAC-SHA256 du message de construireMessageQr,
 * tronqué à 128 bits. La clé est tirée au hasard au démarrage et jamais écrite : un redémarrage éteint seulement les QR
 * affichés à cet instant (ils changent toutes les 30 s et l'écran du comptoir les relit toutes les 5 s).
 */
export function creerSignatureQr(cle: Uint8Array): (message: string) => string {
  if (cle.length < 32) throw new Error("La clé des QR du comptoir doit faire au moins 32 octets");
  const copie = Buffer.from(cle);
  return (message) => createHmac("sha256", copie).update(message).digest().subarray(0, OCTETS_SIGNATURE).toString("base64url");
}
