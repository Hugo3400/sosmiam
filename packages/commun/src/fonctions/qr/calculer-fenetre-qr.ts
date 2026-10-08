import { DUREE_FENETRE_QR_MS } from "../../regles/visites.ts";

/** Numéro de la fenêtre de 30 secondes d'un instant : le QR du comptoir change à chaque nouvelle fenêtre. */
export function calculerFenetreQr(instantMs: number): number {
  return Math.floor(instantMs / DUREE_FENETRE_QR_MS);
}
