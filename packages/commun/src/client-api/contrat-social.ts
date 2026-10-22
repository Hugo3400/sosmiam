// Contrat du service social de l'app (compte connecté) : profil social, pouls, personnes et masques, mêmes routes que l'API
// (/app/social, /app/personnes, /app/masques). Le profil social n'est créé que par ouvrirProfil (à l'ouverture de Potes) ou
// par une première écriture sociale : lireMoi, lirePouls et les autres lectures ne le créent jamais. Une personne est
// toujours désignée par son identifiant public (10 caractères), jamais par l'id de son compte. Aucune règle d'âge : l'app
// est réservée aux majeurs.

import type { ExportSocialApi } from "../types/export-social.ts";
import type { ListeResumeApi } from "../types/listes.ts";
import type {
  CibleMasque,
  MoiSocial,
  PersonneResume,
  PoulsSocial,
  ProfilCommunautaireApi,
  ReglagesMessagerie,
  ReglagesSociaux,
  SuggestionPersonneApi,
} from "../types/social.ts";
import type { PageLiensSuiviApi } from "../types/suivis.ts";
import type { ReponseApi } from "./reponse-api.ts";

/** Une personne trouvée par la recherche : déjà pote ou non, compte privé ou non (l'en-tête seul, dans ce cas) */
export type ResultatRecherchePersonne = { personne: PersonneResume; pote: boolean; prive: boolean };

/** Un élément retiré de TA vue (sortie passée, ligne de « Quoi de neuf », liste, lieu reçu, suggestion) */
export type MasqueSocial = { cible: CibleMasque; cibleId: string };

/** Abonnés ou abonnements d'une personne */
export type SensLiensSuivi = "abonnes" | "abonnements";

export interface ServiceSocial {
  /** GET /app/social/moi : moi vaut null tant que le profil social n'existe pas (rien n'est créé) */
  lireMoi(): Promise<ReponseApi<{ moi: MoiSocial | null }>>;
  /** POST /app/social/moi, à l'ouverture de Potes : crée le profil social s'il manque. « pseudo-requis » sans pseudo */
  ouvrirProfil(): Promise<ReponseApi<{ moi: MoiSocial }>>;
  /** PATCH /app/social/moi : seuls les réglages donnés changent. « pseudo-requis », « champ-invalide » { champ } */
  modifierReglages(r: Partial<ReglagesSociaux & ReglagesMessagerie>): Promise<ReponseApi<{ moi: MoiSocial }>>;
  /**
   * GET /app/social/pouls, toutes les 30 s app ouverte : sans profil social, tout vaut zéro et les signatures sont vides, sauf
   * la signature de la cloche (cloche.nonVues vaut 0 : voir ServiceCloche.marquerVu)
   */
  lirePouls(): Promise<ReponseApi<{ pouls: PoulsSocial }>>;
  /**
   * POST /app/personnes/recherche : le début cherché part dans le corps, jamais dans l'adresse (« @ » toléré, 2 à 20
   * caractères), 10 résultats au plus, le pseudo exact en tête. « champ-invalide » { champ: "debut" }
   */
  chercher(debut: string): Promise<ReponseApi<{ resultats: ResultatRecherchePersonne[] }>>;
  /** GET /app/personnes/suggestions : « Tu pourrais suivre », 10 au plus */
  suggerer(): Promise<ReponseApi<{ suggestions: SuggestionPersonneApi[] }>>;
  /**
   * GET /app/social/export : tes données sociales et TES messages déchiffrés, jamais ceux des autres ni ton code
   * d'invitation (2 par 24 h : « trop-de-demandes » au-delà). « chiffrement-indisponible » sans la clé des données. Sans
   * profil social (Potes jamais ouvert), export.profil vaut null : rien n'est créé
   */
  exporter(): Promise<ReponseApi<{ export: ExportSocialApi }>>;
  /** GET /app/personnes/:personne : ce que ton niveau permet. « personne-inconnue » (inconnue, sans profil, ou elle t'a bloqué) */
  lireProfil(id: string): Promise<ReponseApi<{ profil: ProfilCommunautaireApi }>>;
  /**
   * GET /app/personnes/:personne/abonnes (ou /abonnements)[?apres=] : 50 par page, les plus récents d'abord ; apres : la
   * `suite` de la page d'avant, opaque, renvoyée telle quelle. « personne-inconnue », « profil-prive » (hors de sa bande)
   */
  listerLiensDe(id: string, sens: SensLiensSuivi, apres?: string): Promise<ReponseApi<PageLiensSuiviApi>>;
  /** GET /app/personnes/:personne/listes : celles que tu peux voir, 50 au plus. « personne-inconnue » */
  listerListesDe(id: string): Promise<ReponseApi<{ listes: ListeResumeApi[] }>>;
  /** GET /app/masques[?cible=] : ce que tu as retiré de ta vue, 500 au plus, les plus récents d'abord */
  listerMasques(cible?: CibleMasque): Promise<ReponseApi<{ masques: MasqueSocial[] }>>;
  /** PUT /app/masques/:cible/:cibleId (masque vrai) ou DELETE (« Annuler »). « trop-de-masques » au-delà de 2 000 */
  masquer(cible: CibleMasque, cibleId: string, masque: boolean): Promise<ReponseApi>;
}
