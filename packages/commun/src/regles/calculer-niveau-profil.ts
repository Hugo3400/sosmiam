import type { NiveauProfil } from "../types/social.ts";

/**
 * Ce qu'on voit du profil de quelqu'un, avec l'API (remplace calculerVisibiliteProfil de la démo) :
 * - « bande » (tout : ville, points, lieux sauvés et gardés) : toi, ou un pote de sa bande ;
 * - « public » (la vitrine : badges, listes « tout le monde ») : un compte public, ou l'abonné accepté d'un compte privé ;
 * - « prive » (l'en-tête et les compteurs) : le reste.
 */
export function calculerNiveauProfil(cible: { prive: boolean }, lien: { estMoi: boolean; pote: boolean; abonne: boolean }): NiveauProfil {
  if (lien.estMoi || lien.pote) return "bande";
  if (!cible.prive || lien.abonne) return "public";
  return "prive";
}
