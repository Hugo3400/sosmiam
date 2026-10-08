// Contrat du service de fidélité, côté client : ses cartes, et demander (ou annuler) sa récompense.

import type { CarteFidelite } from "../types/fidelite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceFidelite {
  listerCartes(): Promise<ReponseApi<{ cartes: CarteFidelite[] }>>;
  demanderRecompense(lieuId: number): Promise<ReponseApi<{ carte: CarteFidelite }>>;
  annulerDemandeRecompense(lieuId: number): Promise<ReponseApi<{ carte: CarteFidelite }>>;
}
