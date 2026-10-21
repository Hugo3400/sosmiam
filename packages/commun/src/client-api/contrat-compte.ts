// Contrat du service du compte, côté app : inscription, connexion (e-mail, Apple, Google), profil, déconnexion, suppression.
// Mêmes routes que l'API (/comptes, contrat dans apps/api/src/routes/comptes.ts ; session « app » d'un an).

import type { CompteApp, ConnexionExterne, ConnexionsCompte, InscriptionEmail, ProfilACompleter, ProfilServeur } from "../types/compte-app.ts";
import type { ReponseApi } from "./reponse-api.ts";
import type { DemandeConnexionQr, EtatConnexionQr, QrConnexion } from "../types/connexion-qr.ts";
import type { LimitationCompteApi } from "../types/limitation-compte.ts";
import type { PhotoProfilEnvoyee, PhotoProfilRetiree } from "../types/photo-profil.ts";

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
  /**
   * Champ absent : inchangé. La date de naissance se donne UNE fois, seulement pour un compte du site qui n'en a pas (18 ans
   * ou plus, sinon « age-minimum ») ; ensuite, seule l'équipe la corrige (« champ-invalide », champ dateNaissance).
   */
  modifierProfil(modifs: Partial<Omit<ProfilServeur, "emailVerifie" | "age">>): Promise<ReponseApi<{ profil: ProfilServeur }>>;
  pseudoDisponible(pseudo: string): Promise<ReponseApi<{ disponible: boolean }>>;
  envoyerPhotoProfil(fichier: Blob | ArrayBuffer | Uint8Array): Promise<ReponseApi<PhotoProfilEnvoyee>>;
  retirerPhotoProfil(): Promise<ReponseApi<PhotoProfilRetiree>>;
  lireConnexions(): Promise<ReponseApi<{ connexions: ConnexionsCompte }>>;
  /**
   * Relie un compte Apple ou Google au compte connecté (nouveau jeton, comme à la connexion). Confirmation, comme pour
   * délier : le mot de passe si le compte en a un, sinon un NOUVEAU jeton de l'AUTRE fournisseur, celui déjà relié. Erreurs :
   * « deja-relie » (une autre identité de ce fournisseur est déjà là), « identite-deja-reliee » (elle appartient à un autre
   * compte : jamais de fusion), « jeton-externe-invalide », « mot-de-passe-incorrect », « confirmation-incorrecte »,
   * « trop-de-demandes ». L'e-mail du compte ne change pas.
   */
  relierConnexion(
    connexion: { fournisseur: "apple"; identityToken: string; nonce: string } | { fournisseur: "google"; idToken: string; nonce?: string },
    confirmation: { motDePasse: string } | { identityToken: string; nonce: string } | { idToken: string; nonce?: string },
  ): Promise<ReponseApi<{ connexions: ConnexionsCompte }>>;
  /**
   * Délie Apple ou Google. Confirmation : le mot de passe si le compte en a un, sinon un NOUVEAU jeton de l'AUTRE
   * fournisseur. Erreurs : « derniere-connexion », « mot-de-passe-incorrect », « confirmation-incorrecte », « trop-de-demandes ».
   */
  delierConnexion(
    fournisseur: "apple" | "google",
    confirmation: { motDePasse: string } | { identityToken: string; nonce: string } | { idToken: string; nonce?: string },
  ): Promise<ReponseApi<{ connexions: ConnexionsCompte }>>;
  /** Un nouveau jeton remplace celui en cours (toutes les autres sessions sont fermées) */
  changerMotDePasse(actuel: string, nouveau: string): Promise<ReponseApi<{ session: string }>>;
  motDePasseOublie(email: string): Promise<ReponseApi>;
  renvoyerVerification(): Promise<ReponseApi<{ dejaVerifie: boolean }>>;
  /** Mot de passe, ou un NOUVEAU jeton Apple ou Google du compte lié (jamais la session seule) */
  supprimerCompte(
    confirmation: { motDePasse: string } | { identityToken: string; nonce: string } | { idToken: string; nonce?: string },
  ): Promise<ReponseApi>;

  // Limitation du compte (décidée dans le logiciel de gestion) : ce qui se voit des autres est en pause, le reste marche
  /** La limitation en cours, sinon celle à venir, sinon null */
  lireLimitation(): Promise<ReponseApi<{ limitation: LimitationCompteApi | null }>>;
  /** Une seule fois, pendant la limitation ; texte de 10 à 1 000 caractères. Erreurs : « aucune-limitation »,
   * « deja-conteste », « champ-invalide » (champ texte), « trop-de-demandes » */
  contesterLimitation(texte: string): Promise<ReponseApi>;

  // Connexion par QR code, comme Discord (apps/api/src/routes/connexion-qr.ts) : un QR vit 2 minutes et sert une fois
  /** Nouveau téléphone, sans session : un QR à afficher (https://sosmiam.fr/q/<code>) ; garder le secret, jamais dans le QR.
   * Erreur : « trop-de-demandes » (20 par 10 minutes) */
  demanderConnexionQr(): Promise<ReponseApi<QrConnexion>>;
  /** Interroger toutes les 2 s avec le secret : « accepte » arrive une seule fois, avec la session (1 an) et le compte ;
   * ensuite, « expire » */
  attendreConnexionQr(secret: string): Promise<ReponseApi<{ etat: Exclude<EtatConnexionQr, "accepte"> } | ({ etat: "accepte" } & SessionOuverte)>>;
  /** L'app connectée scanne : la demande à confirmer. Erreurs : « connexion-qr-inconnue », « connexion-qr-expiree »,
   * « connexion-qr-deja-scannee » (un autre compte), « deja-repondu », « session-app-requise », « trop-de-demandes » */
  scannerConnexionQr(code: string): Promise<ReponseApi<{ demande: DemandeConnexionQr }>>;
  /** Accepter (dans les 60 s après le scan, APRÈS la biométrie du téléphone) ou refuser. Erreurs : « connexion-qr-inconnue »
   * (pas scanné par ce compte), « connexion-qr-expiree », « deja-repondu », « trop-de-demandes » */
  repondreConnexionQr(code: string, accepte: boolean): Promise<ReponseApi>;
}
