import type { Pote } from "@sos-miam/commun/types/potes";
import { estAjouteEnVrai } from "~/fonctions/communaute/est-ajoute-en-vrai";

/**
 * Protection des 15-17 ans dans un groupe : dès qu'un mineur en fait partie (toi compris), chaque membre doit avoir été ajouté
 * « en vrai » (lien, QR code, pote de la démo), pas seulement par son pseudo. Renvoie les membres qui ne le sont pas
 * (liste vide : le groupe peut se faire). `moyenAjout` : comment tu as ajouté chacun (utiliserCommunaute).
 * Démo : on ne connaît que tes liens à toi. L'API devra vérifier le lien en vrai entre chaque mineur et chaque adulte du groupe,
 * pas seulement avec la personne qui le crée.
 */
export function listerMembresRefusesGroupe(moi: Pote, membres: Pote[], moyenAjout: (id: string) => string | undefined): Pote[] {
  if (!moi.mineur && !membres.some((m) => m.mineur)) return [];
  return membres.filter((m) => !estAjouteEnVrai(moyenAjout(m.id)));
}
