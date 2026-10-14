import { FENETRE_REPONSE_QR } from "../../services/connexion-qr-regles.ts";

/**
 * Secondes qui restent, comptées par le serveur (l'horloge du téléphone peut être fausse) : avant le scan, jusqu'à la fin du
 * QR ; après, pour accepter : min(60 s après le PREMIER scan, fin du QR). Arrondi vers le bas, jamais négatif.
 */
export function calculerSecondesRestantesQr({ scanneLe, expireLe }: { scanneLe: number | null; expireLe: number }, maintenant: number): number {
  const limite = scanneLe === null ? expireLe : Math.min(scanneLe + FENETRE_REPONSE_QR, expireLe);
  return Math.max(0, Math.floor((limite - maintenant) / 1000));
}
