import { appeler } from "./client-gestion.ts";

/** Ce que le logiciel surveille chaque minute (pastilles du menu et notifications Windows). */
export type Alertes = {
  moderation: { aTraiter: number; urgents: number; contestes: number };
  /** Miam Safe : signalements à lire (en retard après 48 h) et alertes silencieuses restées sans « On arrive » */
  miamSafe?: { aTraiter: number; enRetard: number; sansReponse: number };
  /** rattachements : demandes de compte pro (gérant) à valider */
  demandes: { aTraiter: number; rattachements?: number };
  /** Modifications de fiches proposées par un client ou un lieu, à examiner */
  lieux?: { suggestions: number };
  /** Mails pas encore lus dans bonjour@ (null : boîte injoignable) */
  boite?: { nonLus: number | null };
  ambassadeurs: { enAttente: number; candidatures: number; certifications?: number };
  /** Total des missions faites : quand il monte, un compte rendu vient d'arriver */
  missionsFaites: number;
  bigSos: { aTraiter: number; aCloturer: number; demarrentBientot: { id: number; lieu: string; debutLe: string }[] };
};

export const lireAlertes = () => appeler<Alertes>("GET", "/alertes");
