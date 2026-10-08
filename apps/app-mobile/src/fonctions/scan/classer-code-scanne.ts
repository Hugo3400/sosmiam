import { lireCodeScanne } from "@sos-miam/commun/fonctions/qr/lire-code-scanne";
import type { CodeScanne } from "@sos-miam/commun/types/code-scanne";
import { lireLienInvitation } from "~/fonctions/communaute/lire-lien-invitation";

/**
 * Range un texte lu par le scanner du comptoir : jeton du comptoir, QR de vitrine d'un lieu, invitation d'un pote
 * (à refuser : elle se scanne dans l'onglet Potes), ou autre chose. Aucune adresse lue dans un QR n'est jamais ouverte.
 */
export function classerCodeScanne(texte: string): CodeScanne | { type: "invitation"; pseudo: string; code: string | null } {
  const invitation = lireLienInvitation(texte);
  if (invitation) return { type: "invitation", pseudo: invitation.pseudo, code: invitation.code };
  return lireCodeScanne(texte);
}
