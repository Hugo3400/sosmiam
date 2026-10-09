// Contrat du service du compte, côté app : inscription, connexion (e-mail, Apple, Google), profil, déconnexion, suppression.
// Mêmes routes que l'API (/comptes, contrat dans apps/api/src/routes/comptes.ts ; session « app » d'un an).

import type { CompteApp, ConnexionExterne, ConnexionsCompte, InscriptionEmail, ProfilACompleter, ProfilServeur } from "../types/compte-app.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Une connexion réussie : le jeton à garder dans le coffre-fort du téléphone, et le compte */
export type SessionOuverte = { session: string; compte: CompteApp; nouveau: boolean };

export interface ServiceCompte {
  /** Erreurs : « champ-invalide » (avec champ), « age-minimum », « email-deja-utilise », « pseudo-pris » */
  inscrire(inscription: InscriptionEmail): Promise<ReponseApi<SessionOuverte>>;
  /** Erreurs : « identifiants », « trop-de-demandes » */
  connecter(email: string, motDePasse: string): Promise<ReponseApi<SessionOuverte>>;
  /** Apple ou Google ; { aCompleter } : il faut d'abord « Fais connaissance », puis la même demande complétée */
  connecterExterne(connexion: ConnexionExterne): Promise<ReponseApi<SessionOuverte | { aCompleter: ProfilACompleter }>>;
  lireCompte(): Promise<ReponseApi<{ compte: CompteApp }>>;
  deconnecter(): Promise<ReponseApi>;
  deconnecterPartout(): Promise<ReponseApi>;
  lireProfil(): Promise<ReponseApi<{ profil: ProfilServeur }>>;
  /** Champ absent : inchangé ; la date de naissance ne change jamais ici */
  modifierProfil(modifs: Partial<Omit<ProfilServeur, "dateNaissance" | "emailVerifie" | "age">>): Promise<ReponseApi<{ profil: ProfilServeur }>>;
  pseudoDisponible(pseudo: string): Promise<ReponseApi<{ disponible: boolean }>>;
  lireConnexions(): Promise<ReponseApi<{ connexions: ConnexionsCompte }>>;
  /** Un nouveau jeton remplace celui en cours (toutes les autres sessions sont fermées) */
  changerMotDePasse(actuel: string, nouveau: string): Promise<ReponseApi<{ session: string }>>;
  motDePasseOublie(email: string): Promise<ReponseApi>;
  renvoyerVerification(): Promise<ReponseApi<{ dejaVerifie: boolean }>>;
  /** Mot de passe, ou un NOUVEAU jeton Apple ou Google du compte lié (jamais la session seule) */
  supprimerCompte(
    confirmation: { motDePasse: string } | { identityToken: string; nonce: string } | { idToken: string; nonce?: string },
  ): Promise<ReponseApi>;
}
