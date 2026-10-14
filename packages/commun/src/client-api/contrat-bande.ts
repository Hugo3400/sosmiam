// Contrat de la bande de l'app (compte connecté) : les potes, le lien et le QR d'invitation, les demandes, les blocages,
// « Quoi de neuf » et le classement du mois, mêmes routes que l'API (/app/bande, /app/blocages). Décisions de Hugo du
// 14/10/2026 : un lien ou un QR avec le code secret ajoute les deux personnes tout de suite ; par pseudo, c'est une demande
// que l'autre accepte ; retirer vaut des deux côtés, sans prévenir ; le lien n'a pas de date de fin. Une personne est
// toujours désignée par son identifiant public (10 caractères). Aucune règle d'âge : l'app est réservée aux majeurs.

import type { ActiviteBandeApi, BandeApi, ClassementApi, InvitationBandeApi } from "../types/bande.ts";
import type { PersonneResume } from "../types/social.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Comment le lien est arrivé : ouvert (« lien ») ou scanné (« qr ») */
export type MoyenInvitation = "lien" | "qr";

/** « demande » : envoyée ; « ajoute » : elle t'avait déjà demandé, vous voilà potes ; « deja » : rien ne change */
export type EtatDemandeBande = "demande" | "ajoute" | "deja";

export interface ServiceBande {
  /** GET /app/bande : potes, demandes reçues (sans celles que tu as refusées) et envoyées, max. Sans profil social : vide */
  lireBande(): Promise<ReponseApi<{ bande: BandeApi }>>;
  /** GET /app/bande/invitation : ton code et ton lien (créés à la première demande). « pseudo-requis », « chiffrement-indisponible » */
  lireInvitation(): Promise<ReponseApi<{ invitation: InvitationBandeApi }>>;
  /** POST /app/bande/invitation/renouveler : « Changer mon lien » ; l'ancien lien et l'ancien QR ne marchent plus */
  renouvelerInvitation(): Promise<ReponseApi<{ invitation: InvitationBandeApi }>>;
  /**
   * POST /app/bande/rejoindre, avec le pseudo et le code lus par lireLienInvitation : deja vrai si vous étiez déjà potes.
   * « invitation-invalide » (lien changé, trop tourné, pseudo inconnu…), « bande-pleine », « champ-invalide » { champ:
   * "pseudo" } pour ton propre lien
   */
  rejoindre(pseudo: string, code: string, moyen: MoyenInvitation): Promise<ReponseApi<{ personne: PersonneResume; deja: boolean }>>;
  /** POST /app/bande/demandes : personne n'est là qu'avec « ajoute ». « personne-inconnue », « bande-pleine », « trop-de-demandes-en-attente » */
  demander(id: string): Promise<ReponseApi<{ etat: EtatDemandeBande; personne?: PersonneResume }>>;
  /** POST /app/bande/demandes/:personne/accepter. « demande-inconnue », « bande-pleine » */
  accepter(id: string): Promise<ReponseApi<{ personne: PersonneResume }>>;
  /** DELETE /app/bande/demandes/:personne : refuser la sienne (sans prévenir) ou annuler la tienne */
  retirerDemande(id: string): Promise<ReponseApi>;
  /** DELETE /app/bande/:personne : des deux bandes, sans prévenir */
  retirer(id: string): Promise<ReponseApi>;
  /** GET /app/bande/activite : « Quoi de neuf » (30 jours, 50 lignes) ; une ligne se retire de ta vue par le masque « activite » */
  lireActivite(): Promise<ReponseApi<{ activites: ActiviteBandeApi[] }>>;
  /** GET /app/bande/classement : le mois en cours, à l'heure de Paris */
  lireClassement(): Promise<ReponseApi<{ classement: ClassementApi }>>;
  /** GET /app/blocages : les personnes que tu as bloquées (Réglages › Personnes bloquées) */
  listerBloques(): Promise<ReponseApi<{ bloques: PersonneResume[] }>>;
  /** PUT (bloque vrai) ou DELETE /app/blocages/:personne : toujours ok, même si elle t'a bloqué. « trop-de-blocages » */
  bloquer(id: string, bloque: boolean): Promise<ReponseApi>;
}
