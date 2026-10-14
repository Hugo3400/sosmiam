// Contrat des « Ça m'intéresse » sur les événements des lieux (compte connecté) : mêmes routes que l'API,
// /app/evenements/mes-interets et /app/evenements/:id/interet. Les événements eux-mêmes se lisent sans compte
// (ServiceContenu.listerEvenements, listerEvenementsDuLieu).

import type { MonInteretEvenement } from "../types/evenement.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type ReponseInterets = ReponseApi<{ interets: MonInteretEvenement[] }>;

export interface ServiceInteretsEvenements {
  /** Les événements pas encore finis qui t'intéressent, le plus proche d'abord (annulé : annule: true jusqu'à sa date) */
  listerMesInterets(): Promise<ReponseInterets>;
  /** rappel : un rappel le jour J. Erreurs : « evenement-inconnu », « evenement-passe ». Déjà posé : le rappel est mis à jour */
  poserInteret(evenementId: number, rappel: boolean): Promise<ReponseInterets>;
  /** Rien à retirer : rien ne change */
  retirerInteret(evenementId: number): Promise<ReponseInterets>;
}
