// Espace pro (https://pro.sosmiam.fr) et fiche publique d'un lieu : appels à l'API, côté serveur uniquement, avec le jeton
// de session et l'IP du visiteur comme les autres appels (services/comptes.server.ts). Contrats : en tête de
// apps/api/src/routes/pro.ts, routes/comptes.ts (rattachements) et routes/lieux-publics.ts.
import { appelerApiComptes } from "~/services/comptes.server";
import type { CarteLieu } from "~/types/carte";
import type { ChampsFiche, FichePro, FichePublique, LieuTrouve, MembreEquipe, Rattachement, ResultatModificationFiche, RoleLieu, SuggestionFiche } from "~/types/pro";

// ─── Les demandes et invitations du compte (/comptes/moi/rattachements) ───

/** Toutes les demandes et invitations du compte (sauf celles retirées), les plus récentes d'abord. */
export function listerRattachements(jeton: string, ip: string | null) {
  return appelerApiComptes<{ rattachements: Rattachement[] }>("/comptes/moi/rattachements", { jeton, ip });
}

export type DemandeRattachement = { lieuId: number; role: "gerant"; preuve: string; siret?: string };

/**
 * « Ce lieu est à moi » : la demande part à l'équipe (201). Erreurs : champ-invalide {champ}, lieu-inconnu, deja-demande,
 * trop-de-demandes (5 par 24 h, ou trop d'envois depuis la connexion).
 */
export function demanderRattachement(jeton: string, ip: string | null, demande: DemandeRattachement) {
  return appelerApiComptes<{ id: number }>("/comptes/moi/rattachements", { methode: "POST", jeton, ip, corps: demande });
}

/** Accepte une invitation à rejoindre l'équipe d'un lieu (invitation-inconnue sinon). */
export function accepterInvitation(jeton: string, ip: string | null, rattachementId: number) {
  return appelerApiComptes<object>(`/comptes/moi/rattachements/${rattachementId}/accepter`, { methode: "POST", jeton, ip });
}

/** Refuse une invitation, annule une demande ou quitte un lieu (rattachement-inconnu sinon). */
export function retirerRattachement(jeton: string, ip: string | null, rattachementId: number) {
  return appelerApiComptes<object>(`/comptes/moi/rattachements/${rattachementId}`, { methode: "DELETE", jeton, ip });
}

// ─── Les lieux (/pro/…) ───

/** « Chercher mon lieu » (2 à 80 caractères) : 10 lieux au plus, publiés ou en brouillon. */
export function chercherLieux(texte: string, jeton: string, ip: string | null) {
  return appelerApiComptes<{ lieux: LieuTrouve[] }>(`/pro/recherche-lieux?${new URLSearchParams({ texte })}`, { jeton, ip });
}

/** La fiche d'un lieu du compte, son rôle et s'il peut la modifier (pas-pro : pas son lieu, ou lieu inconnu). */
export function lireFichePro(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ fiche: FichePro; role: RoleLieu; peutModifier: boolean }>(`/pro/lieux/${lieuId}`, { jeton, ip });
}

/**
 * Enregistre « Ma fiche » (gérant) : seulement les champs qui changent. Les infos changent tout de suite (null, "" ou []
 * les efface) ; le nom et l'adresse partent vers l'équipe, avec le « Pourquoi ? » (message). Erreurs :
 * proposition-invalide {champ}, trop-de-suggestions (alors rien n'est appliqué), reserve-au-gerant, pas-pro.
 */
export function modifierFichePro(jeton: string, ip: string | null, lieuId: number, champs: Partial<ChampsFiche> & { message?: string }) {
  return appelerApiComptes<ResultatModificationFiche>(`/pro/lieux/${lieuId}`, { methode: "PATCH", jeton, ip, corps: champs });
}

/** Les suggestions de modification de la fiche (clients et lieu), les plus récentes d'abord. */
export function listerSuggestions(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ suggestions: SuggestionFiche[] }>(`/pro/lieux/${lieuId}/suggestions`, { jeton, ip });
}

/** La carte du lieu (gérant et équipe) : null tant qu'il n'y en a pas ; majLe : moment exact (ISO 8601). */
export function lireCartePro(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ carte: CarteLieu | null; majLe: string | null }>(`/pro/lieux/${lieuId}/carte`, { jeton, ip });
}

/**
 * Remplace la carte du lieu (gérant) ; null l'efface. Erreurs : carte-invalide {champ, section, element},
 * reserve-au-gerant, pas-pro, trop-de-demandes (60 enregistrements par heure).
 */
export function enregistrerCartePro(jeton: string, ip: string | null, lieuId: number, carte: CarteLieu | null) {
  return appelerApiComptes<{ carte: CarteLieu | null; majLe: string | null }>(`/pro/lieux/${lieuId}/carte`, { methode: "PUT", jeton, ip, corps: { carte } });
}

/** L'équipe du lieu (gérant seulement : reserve-au-gerant sinon). */
export function listerEquipe(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ equipe: MembreEquipe[] }>(`/pro/lieux/${lieuId}/equipe`, { jeton, ip });
}

/** Invite un compte SOS Miam (compte-inconnu, deja-membre, trop-d-invitations, equipe-complete, champ-invalide). */
export function inviterMembre(jeton: string, ip: string | null, lieuId: number, email: string) {
  return appelerApiComptes<object>(`/pro/lieux/${lieuId}/equipe`, { methode: "POST", jeton, ip, corps: { email } });
}

/** Retire un membre de l'équipe (membre-inconnu sinon). */
export function retirerMembre(jeton: string, ip: string | null, lieuId: number, compteId: number) {
  return appelerApiComptes<object>(`/pro/lieux/${lieuId}/equipe/${compteId}`, { methode: "DELETE", jeton, ip });
}

/** La fiche publique d'un lieu publié (sans session) ; lieu-inconnu s'il n'existe pas, est en brouillon ou masqué. */
export function lireFichePublique(lieuId: number, ip: string | null) {
  return appelerApiComptes<{ lieu: FichePublique }>(`/lieux/publics/${lieuId}`, { ip });
}

// ─── Miam Safe (contrat : apps/api/src/routes/miam-safe.ts) ───

/** La charte Miam Safe du lieu ; retireeParEquipe : l'équipe SOS Miam l'a retirée, seule elle peut la rendre. */
export type CharteMiamSafe = { signee: boolean; signeeLe: string | null; retireeParEquipe: boolean };

export function lireCharteMiamSafe(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ charte: CharteMiamSafe }>(`/miam-safe/pro/lieux/${lieuId}/charte`, { jeton, ip });
}

/** Le gérant signe (charte-retiree si l'équipe SOS Miam l'a retirée ; reserve-au-gerant sinon). */
export function signerCharteMiamSafe(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ charte: CharteMiamSafe }>(`/miam-safe/pro/lieux/${lieuId}/charte`, { methode: "PUT", jeton, ip, corps: { accepte: true } });
}

/** Le gérant quitte la charte : le badge disparaît, les alertes silencieuses ne partent plus. */
export function quitterCharteMiamSafe(jeton: string, ip: string | null, lieuId: number) {
  return appelerApiComptes<{ charte: CharteMiamSafe }>(`/miam-safe/pro/lieux/${lieuId}/charte`, { methode: "DELETE", jeton, ip });
}
