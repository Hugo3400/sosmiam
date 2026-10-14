// Contrat du service Miam Safe (se sentir en sécurité dans un lieu) : côté Miami (alerte silencieuse, signalement,
// « Tu t'es senti·e bien ici ? ») et côté équipe du lieu (alertes du comptoir, « On arrive », charte).
// Même contrat que l'API (apps/api/src/routes/miam-safe.ts) : le lieu est relu par le serveur, jamais cru sur parole.

import type { EndroitAlerte, RaisonSignalementMiamSafe } from "../regles/miam-safe.ts";
import type { AlerteComptoir, AlerteSuivie, CharteMiamSafe, MiamSafeLieu, PartagePositionMiamSafe, PositionMiamSafe } from "../types/miam-safe.ts";
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
  /**
   * « Prévenir un pote » de ta bande (pote : son identifiant public) : notification urgente, et ta position partagée avec lui
   * pendant 1 h si tu en donnes une. telephones : sur combien de ses téléphones la notification est partie (0 : aucun
   * téléphone connecté, il n'est PAS prévenu : propose d'appeler). « pote-inconnu », « lieu-inconnu », « trop-de-demandes »
   */
  prevenirPote(demande: { pote: string; lieuId: number; position: PositionMiamSafe | null }): Promise<ReponseApi<{ partage: PartagePositionMiamSafe; telephones: number }>>;
  /** La personne qui partage envoie sa nouvelle position. « partage-inconnu », « partage-termine » (arrêté, l'heure passée, plus potes) */
  envoyerPosition(partageId: number, position: PositionMiamSafe): Promise<ReponseApi<{ expireLe: string }>>;
  /** Arrêter le partage tout de suite : la position est effacée */
  arreterPartage(partageId: number): Promise<ReponseApi>;
  /** Un partage, pour la personne qui partage ou pour son pote (seulement s'ils sont toujours potes). « partage-inconnu » */
  lirePartage(partageId: number): Promise<ReponseApi<{ partage: PartagePositionMiamSafe }>>;
  /** Les partages en cours, envoyés et reçus */
  listerPartages(): Promise<ReponseApi<{ partages: PartagePositionMiamSafe[] }>>;
}
