// Contrat du service des propositions de modification d'une fiche (« Une info a changé ? »), côté client.
// Même route que l'API : POST /comptes/moi/suggestions { lieuId, proposition, message? }, pour tout compte connecté.
// Le serveur revérifie (validerPropositionLieu), ne garde que les champs qui changent par rapport à la fiche, et limite :
// 10 propositions par 24 h et par compte, 3 en attente au plus sur un même lieu (« trop-de-suggestions »).

import type { NouvelleSuggestionLieu } from "../types/proposition-lieu.ts";
import type { ReponseApi } from "./reponse-api.ts";

export interface ServiceSuggestions {
  /**
   * Erreurs : « connexion-requise », « proposition-invalide », « rien-a-changer » (tout est déjà sur la fiche),
   * « lieu-inconnu », « trop-de-suggestions », « trop-de-demandes ».
   */
  proposer(lieuId: number, suggestion: NouvelleSuggestionLieu): Promise<ReponseApi<{ id: number }>>;
}
