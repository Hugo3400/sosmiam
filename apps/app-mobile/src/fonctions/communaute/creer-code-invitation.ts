// Sans « 0/o », « 1/l/i » : un code qui se recopie à la main sans se tromper
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const LONGUEUR = 12;

type SourceHasard = { getRandomValues?: (tableau: Uint8Array) => Uint8Array };

/**
 * Tire au hasard un code secret d'invitation (12 caractères, minuscules et chiffres), à ranger une fois pour toutes sur le téléphone.
 * Prend le hasard du système quand il est là ; sinon Math.random (suffisant pour la démo : l'API créera les vrais codes).
 */
export function creerCodeInvitation(): string {
  const hasard = (globalThis as { crypto?: SourceHasard }).crypto;
  const octets = new Uint8Array(LONGUEUR);
  if (typeof hasard?.getRandomValues === "function") hasard.getRandomValues(octets);
  else octets.forEach((_, i) => (octets[i] = Math.floor(Math.random() * 256)));
  return Array.from(octets, (octet) => ALPHABET[octet % ALPHABET.length]).join("");
}
