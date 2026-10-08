import { DUREE_FENETRE_QR_MS } from "../../regles/visites.ts";
import { calculerFenetreQr } from "./calculer-fenetre-qr.ts";

/** Temps restant avant que le QR du comptoir change, en millisecondes (de 1 à 30 000). */
export function calculerDelaiChangementQr(instantMs: number): number {
  return (calculerFenetreQr(instantMs) + 1) * DUREE_FENETRE_QR_MS - instantMs;
}
