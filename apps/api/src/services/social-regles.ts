// Profil social, personnes, masques et pouls (spécification sociale B.1, C.2, D.2) : contrat commun du service Prisma
// (social.ts et social-pouls.ts) et de son double en mémoire (social-en-memoire.ts). Le profil social n'est créé que par
// un geste volontaire (assurerProfil : ouverture de Potes, ou première écriture sociale ; il faut un pseudo) ; aucune
// lecture ne le crée, et sans lui personne ne trouve le compte. Aucune règle d'âge : l'app est réservée aux majeurs.
import type { ListeResumeApi } from "../../../../packages/commun/src/types/listes.ts";
import type {
  CibleMasque, MoiSocial, PersonneResume, PoulsSocial, ProfilCommunautaireApi, ReglagesSociaux, SuggestionPersonneApi,
} from "../../../../packages/commun/src/types/social.ts";
import type { PageLiensSuiviApi } from "../../../../packages/commun/src/types/suivis.ts";

export type ResultatRecherchePersonne = { personne: PersonneResume; pote: boolean; prive: boolean };

/** Le profil social d'un compte, tel que exigerProfilSocial le pose ; cree : il vient d'être créé (201) */
export type ProfilAssure = { compteId: number; idPublic: string; cree: boolean };

export interface ServicesSocial {
  /** Lecture seule (lireProfilSocial) : l'identifiant public, ou null s'il n'y a pas de profil social */
  lireIdPublic(compteId: number): Promise<string | null>;
  /**
   * Le profil social, créé s'il manque : INSERT … ON CONFLICT DO NOTHING, puis relecture (deux demandes en même temps ne
   * font jamais d'erreur) ; identifiant public tiré au hasard, nouvel essai s'il est déjà pris. null : pas de pseudo
   */
  assurerProfil(compteId: number): Promise<ProfilAssure | null>;
  /** null : pas de profil social */
  lireMoi(compteId: number): Promise<MoiSocial | null>;
  /** Le profil existe (exigerProfilSocial est passé avant) ; seuls les réglages donnés changent */
  modifierReglages(compteId: number, reglages: Partial<ReglagesSociaux>): Promise<MoiSocial>;
  /**
   * Le pseudo commence par `debut` (déjà nettoyé : sans « @ », en minuscules, 2 à 20 caractères), l'exact en tête, 10 au
   * plus. Jamais : soi, un blocage dans un sens ou dans l'autre, un compte sans profil social ou « trouvable: false »
   */
  chercher(compteId: number, debut: string): Promise<ResultatRecherchePersonne[]>;
  /**
   * Te suit (sans que tu la suives), ta bande (pas suivie), puis potes de potes (comptes publics et « suggerable »
   * seulement, rangés par nombre de potes en commun, jamais nommés) ; jamais un compte bloqué, suivi, demandé ou masqué
   * (masque « suggestion », « personne:<idPublic> ») ; 10 au plus
   */
  suggerer(compteId: number): Promise<SuggestionPersonneApi[]>;
  /**
   * Mentions d'un commentaire : pseudo → identifiant public (10 au plus), sans les comptes sans profil, ni blocage dans un sens
   * ou dans l'autre. Un compte « trouvable: false » n'est jamais retrouvé par son pseudo, sauf par qui connaît déjà son
   * identifiant public : sa bande, et un suivi accepté dans un sens ou dans l'autre (version prudente, à confirmer par Hugo,
   * I.1) ; sinon la mention reste du texte simple.
   */
  trouverMentions(compteId: number, pseudos: readonly string[]): Promise<Map<string, string>>;
  /**
   * calculerNiveauProfil ; badges et listes à partir de « public » ; ville, points, lieux sauvés et gardés à « bande ».
   * cibleId : déjà trouvé par trouverCompte(…, compteId) (404 si elle t'a bloqué) ; si TU l'as bloquée, l'en-tête seul.
   * null : le profil vient de disparaître (compte supprimé entre-temps : 404)
   */
  lireProfil(compteId: number, cibleId: number, maintenant: Date): Promise<ProfilCommunautaireApi | null>;
  /**
   * "ferme" : niveau autre que « bande » (403 profil-prive) ; 50 par page, plus récents d'abord, sans les personnes bloquées
   * ni les comptes sans profil social. `apres` : la `suite` d'avant (lireCurseurPersonne : date et identifiant public, jamais
   * l'id d'un compte)
   */
  listerLiens(compteId: number, cibleId: number, sens: "abonnes" | "abonnements", apres: string | null): Promise<PageLiensSuiviApi | "ferme">;
  /** Ses listes que tu peux voir (peutVoirListe, sans celles que tu as signalées ni, sauf pour son auteur, celles en modération) */
  listerListesDe(compteId: number, cibleId: number): Promise<ListeResumeApi[]>;
  /** 500 au plus, les plus récents d'abord ; cible null : toutes */
  listerMasques(compteId: number, cible: CibleMasque | null): Promise<{ cible: CibleMasque; cibleId: string }[]>;
  /** 2 000 au plus par compte (MAX_MASQUES), comptés sous le verrou du compte ; masque faux : « Annuler » */
  masquer(compteId: number, cible: CibleMasque, cibleId: string, masque: boolean): Promise<{ ok: true } | { ok: false; erreur: "trop-de-masques" }>;
  /** C.2 ; sans profil social : tout à zéro et signatures vides, sauf la cloche */
  lirePouls(compteId: number, maintenant: Date): Promise<PoulsSocial>;
}

/** Résultats de la recherche par pseudo */
export const MAX_RESULTATS_RECHERCHE = 10;
export const MAX_SUGGESTIONS = 10;
export const MAX_MENTIONS = 10;
/** Abonnés ou abonnements par page */
export const LIENS_PAR_PAGE = 50;
/** Listes d'un profil */
export const MAX_LISTES_PROFIL = 50;
/** Masques rendus par GET /app/masques */
export const MAX_MASQUES_LUS = 500;
/** Un compteur de non-lus (par conversation) ou de cloche ne dépasse pas 99 : « 99+ » à l'écran */
export const MAX_COMPTEUR_POULS = 99;
/** cibleId d'un masque : « 42 », « rescousse:118 », « personne:k7mq2x9pa4 », « createur:lea.mange », « lieu:13 »… */
export const FORME_CIBLE_ID_MASQUE = /^[a-z0-9:._-]{1,60}$/;
/** Début de pseudo cherché, une fois « @ » retiré et en minuscules */
export const FORME_DEBUT_PSEUDO = /^[a-z0-9._]{2,20}$/;

/** La cible d'un masque de suggestion pour une personne */
export const cibleIdSuggestion = (idPublic: string) => `personne:${idPublic}`;
