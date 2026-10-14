// Le code secret du lien et du QR d'invitation de la bande (spécification sociale B.2, D.4) : tiré par le serveur, gardé
// CHIFFRÉ dans le profil social, sans date de fin (réponse de Hugo du 14/10/2026), changé à la demande (« Changer mon
// lien ») ou tout seul quand le lien a trop tourné. Il passe dans le fragment du lien (« #c= ») : jamais dans un journal.
import { LONGUEUR_CODE_INVITATION } from "../../../../../packages/commun/src/regles/potes.ts";

/** Le même alphabet que l'app : sans « 0/o » ni « 1/l/i », un code qui se recopie à la main sans se tromper */
const ALPHABET_CODE_INVITATION = "abcdefghjkmnpqrstuvwxyz23456789";

/** 12 caractères tirés au hasard (`tirer(max)` rend un entier de 0 à max − 1, randomInt de node:crypto en vrai) */
export function creerCodeInvitation(tirer: (max: number) => number): string {
  let code = "";
  for (let i = 0; i < LONGUEUR_CODE_INVITATION; i++) code += ALPHABET_CODE_INVITATION[tirer(ALPHABET_CODE_INVITATION.length)];
  return code;
}
