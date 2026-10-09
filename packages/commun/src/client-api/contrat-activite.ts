// Contrat du service de l'activité de l'app (compte connecté) : mêmes routes que l'API, /app/activite.
// Rescousses : 3 par semaine (lundi, heure de Paris), seulement dans un lieu vérifié, +2 points ; la toute première
// rescousse d'un lieu nouveau fait son premier sauveteur (+20 et le badge). Une rescousse se reprend dans la semaine.

import type { ActiviteApi } from "../types/activite.ts";
import type { ReponseApi } from "./reponse-api.ts";

export type ReponseActivite = ReponseApi<{ activite: ActiviteApi }>;

export interface ServiceActivite {
  lireActivite(): Promise<ReponseActivite>;
  /** Erreurs : « lieu-inconnu », « lieu-non-verifie », « plus-de-rescousse ». Déjà donnée cette semaine : rendue telle quelle */
  donnerRescousse(lieuId: number): Promise<ReponseApi<{ activite: ActiviteApi; premierSauveteur: boolean }>>;
  reprendreRescousse(lieuId: number): Promise<ReponseActivite>;
  garder(lieuId: number, garde: boolean): Promise<ReponseActivite>;
  aimer(publicationId: string, aime: boolean): Promise<ReponseActivite>;
  masquer(publicationId: string, masquee: boolean): Promise<ReponseActivite>;
  /** cle : « lieu:<id> » ou « createur:<pseudo> » */
  suivre(cle: string, suivi: boolean): Promise<ReponseActivite>;
}
