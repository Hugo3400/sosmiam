// Contrat de l'inscription d'un téléphone aux notifications (mêmes routes que l'API : PUT et DELETE /app/appareils). Le
// jeton est celui d'Apple (APNs) ou de Google (FCM), jamais celui d'Expo. La session est facultative : avec un compte
// connecté, le téléphone lui est lié.

import type { ReponseApi } from "./reponse-api.ts";

export type InscriptionTelephone = {
  jeton: string;
  plateforme: "ios" | "android";
  /** La ville choisie dans l'app, jamais une position */
  ville: string | null;
  offres: boolean;
  /** Avec un compte connecté : la clé de l'aperçu chiffré des messages (32 octets en base64url), tirée par le téléphone */
  cleApercu?: string;
};

export interface ServiceAppareils {
  /** Erreurs : « champ-invalide » */
  inscrire(inscription: InscriptionTelephone): Promise<ReponseApi>;
  /** Oublié tout de suite ; déjà oublié : réussi quand même */
  desinscrire(jeton: string): Promise<ReponseApi>;
}
