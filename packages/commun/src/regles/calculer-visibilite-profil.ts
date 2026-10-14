import type { VisibiliteProfil } from "../types/suivis";
import { estComptePrive } from "./est-compte-prive";

/**
 * Ce qu'on voit du profil de quelqu'un. Toi : tout. Ta bande en vrai (lien, QR code vérifié, bande d'exemple),
 * un compte public ou un abonnement accepté : tout. Sinon : privé (l'en-tête et les compteurs).
 */
export function calculerVisibiliteProfil(cible: { prive?: boolean }, lien: { estMoi: boolean; bandeEnVrai: boolean; abonne: boolean }): VisibiliteProfil {
  if (lien.estMoi) return "complet";
  if (lien.bandeEnVrai || lien.abonne || !estComptePrive(cible)) return "complet";
  return "prive";
}
