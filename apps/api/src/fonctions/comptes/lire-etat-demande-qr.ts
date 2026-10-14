import { FENETRE_REPONSE_QR, RATTRAPAGE_ACCEPTEE_QR, type DemandeQr } from "../../services/connexion-qr-regles.ts";

export type EtatDemandeQr = "attente" | "scanne" | "accepte" | "refuse" | "expire";

/**
 * Ce que voit l'appareil qui attend : « refuse » reste « refuse » ; « accepte » se récupère jusqu'à 30 s après la fin du QR
 * (l'appareil interroge toutes les 2 s) ; « utilisee », un QR fini ou un scan resté 60 s sans réponse : « expire ».
 */
export function lireEtatDemandeQr(demande: DemandeQr | null, maintenant: number): EtatDemandeQr {
  if (!demande || demande.statut === "utilisee") return "expire";
  if (demande.statut === "refuse") return "refuse";
  if (demande.statut === "accepte") return maintenant <= demande.expireLe + RATTRAPAGE_ACCEPTEE_QR ? "accepte" : "expire";
  if (maintenant >= demande.expireLe) return "expire";
  if (demande.statut === "scanne" && demande.scanneLe !== null && maintenant - demande.scanneLe > FENETRE_REPONSE_QR) return "expire";
  return demande.statut;
}
