import type { VisibiliteProfil } from "../types/suivis";
import { estComptePrive } from "./est-compte-prive";

/**
 * Ce qu'on voit du profil de quelqu'un. Toi : tout. Un adulte devant un mineur qui n'est ni dans sa bande « en vrai »,
 * ni suivi (lien accepté, gardé au passage à 18 ans ou créateur) : l'en-tête seul.
 * Ta bande en vrai (lien, QR code vérifié, bande d'exemple), un compte public ou un abonnement accepté : tout. Sinon : privé.
 */
export function calculerVisibiliteProfil(
  moi: { mineur: boolean },
  cible: { mineur: boolean; prive?: boolean },
  lien: { estMoi: boolean; bandeEnVrai: boolean; abonne: boolean },
): VisibiliteProfil {
  if (lien.estMoi) return "complet";
  if (cible.mineur && !moi.mineur && !lien.bandeEnVrai && !lien.abonne) return "reserve";
  if (lien.bandeEnVrai || lien.abonne || !estComptePrive(cible)) return "complet";
  return "prive";
}
