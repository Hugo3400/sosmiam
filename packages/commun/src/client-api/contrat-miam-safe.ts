// Contrat du service Miam Safe (se sentir en sécurité dans un lieu) : côté Miami (alerte silencieuse, signalement,
// « Tu t'es senti·e bien ici ? ») et côté équipe du lieu (alertes du comptoir, « On arrive », charte).
// Même contrat que l'API (apps/api/src/routes/miam-safe.ts) : le lieu est relu par le serveur, jamais cru sur parole.

import type { EndroitAlerte, RaisonSignalementMiamSafe } from "../regles/miam-safe.ts";
import type { AlerteComptoir, AlerteSuivie, CharteMiamSafe, MiamSafeLieu } from "../types/miam-safe.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceMiamSafe {
  /** Sans compte : le badge et le repère d'un lieu publié (« lieu-inconnu » sinon) */
  lireLieu(lieuId: number): Promise<ReponseApi<MiamSafeLieu>>;
  /** « pas-miam-safe » : le lieu n'a pas de charte active (proposer les secours ou un pote) ; « trop-de-demandes » : 3 par 10 min */
  envoyerAlerte(alerte: { lieuId: number; endroit: EndroitAlerte; detail: string }): Promise<ReponseApi<{ id: number }>>;
  suivreAlerte(alerteId: number): Promise<ReponseApi<{ alerte: AlerteSuivie }>>;
  signaler(signalement: { lieuId: number; raison: RaisonSignalementMiamSafe; explication: string }): Promise<ReponseApi>;
  repondreSentiBien(lieuId: number, oui: boolean): Promise<ReponseApi>;
  /** Équipe du lieu : les alertes des 2 dernières heures */
  listerAlertesComptoir(lieuId: number): Promise<ReponseApi<{ alertes: AlerteComptoir[] }>>;
  direOnArrive(lieuId: number, alerteId: number): Promise<ReponseApi>;
  lireCharte(lieuId: number): Promise<ReponseApi<{ charte: CharteMiamSafe }>>;
  /** Gérant seulement (« reserve-au-gerant ») ; « charte-retiree » si l'équipe SOS Miam l'a retirée */
  signerCharte(lieuId: number): Promise<ReponseApi<{ charte: CharteMiamSafe }>>;
  quitterCharte(lieuId: number): Promise<ReponseApi<{ charte: CharteMiamSafe }>>;
}
