// La partie sociale de l'app (spécification sociale B.0 et D.1) : un seul routeur rassemble tous les domaines, monté par
// application.use("/app", …) dans le bloc des comptes de application.ts, avant les routeurs /app sans session. Une adresse
// qu'il ne connaît pas passe au routeur suivant. Aucune règle d'âge : l'app est réservée aux majeurs.
//
// Règles communes à tous les domaines :
// - chaîne de chaque domaine : limite « connecté », session (exigerCompte), Cache-Control « private, no-store », puis, route
//   par route, sa limite par compte et le middleware du profil social (lireProfilSocial pour les lectures et quelques gestes
//   sans pseudo, exigerProfilSocial pour le reste : 409 pseudo-requis), et enfin les refus en JSON (gererRefusSociaux, puis
//   gererErreursComptes : 400 champ-invalide, 500) ;
// - compte limité par l'équipe (décision de Hugo du 15 octobre 2026) : refuserSiLimite (403 compte-limite { details: { jusqua
//   } }) sur les seules écritures que les AUTRES voient (messages, groupes, sorties, listes, commentaires, demandes…), posé
//   après la session et la limite par compte, avant le profil social (un refus n'en crée pas), la clé et le corps d'un
//   média ; tout le reste passe (lire, signaler, contester, bloquer, quitter, accepter, voter, J'aime, supprimer le sien…).
//   L'inventaire : tests/limitation-inventaire-routes.test.ts ;
// - 404 AVANT 403 : on vérifie d'abord que tu VOIS la ressource (sinon 404 *-inconnu(e)), seulement ensuite un 403 ; une
//   personne qui t'a bloqué est « inconnue » (404 personne-inconnue), jamais « bloquée » ;
// - blocages dans les deux sens partout : ce qu'écrit l'un est caché pour l'autre, et inversement ;
// - identifiants : :personne est un identifiant public (lirePersonne), :id un entier (lireIdentifiant) ; dans les réponses,
//   tous les identifiants sont des textes ; pages par curseur opaque (?apres=<suite>, réponse { suite }) ;
// - idempotence : idClient (messages, médias, lieux envoyés) et Idempotency-Key (groupes, sorties, listes) : un envoi rejoué
//   rend ce qui a déjà été créé, en 200, sans rien de plus ni prévenir personne ;
// - 🔐 : les routes qui chiffrent passent par exigerChiffrementSocial(d.chiffrement) (503 chiffrement-indisponible) ;
// - rien de personnel dans les adresses (un début de pseudo cherché passe dans le corps).
import { Router, type RequestHandler } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerAppliquerEffetsSociaux } from "../controleurs/effets-sociaux.ts";
import { gererRefusSociaux } from "../controleurs/social-champs.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { creerProfilSocialMiddlewares, type ProfilSocialMiddlewares } from "../middlewares/profil-social.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { creerRefuserSiLimite } from "../middlewares/refuser-si-limite.ts";
import type { ChiffrementSocial } from "../services/chiffrement-social.ts";
import type { ServicesCloche } from "../services/cloche-regles.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import type { MessagePush } from "../services/notifications/expedier-push.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import type { RelationsSociales } from "../services/relations-sociales-regles.ts";
import type { ServicesSocial } from "../services/social-regles.ts";
import type { StockageMediasChat } from "../services/stockage-medias-chat.ts";
import { creerRoutesCloche } from "./cloche.ts";
import { creerRoutesSocial } from "./social.ts";
import type { ServicesBande } from "../services/bande-regles.ts";
import type { ServicesSuivisPersonnes } from "../services/suivis-personnes-regles.ts";
import { creerRoutesBande } from "./bande.ts";
import { creerRoutesSuivisPersonnes } from "./suivis-personnes.ts";
import type { ServicesMessagerie } from "../services/messagerie-regles.ts";
import { creerRoutesConversations } from "./conversations.ts";
import { creerRoutesLieuxEnvoyes } from "./lieux-envoyes.ts";
import type { ServicesSorties } from "../services/sorties-regles.ts";
import type { ServicesListes } from "../services/listes-regles.ts";
import { creerRoutesSorties } from "./sorties.ts";
import { creerRoutesListes } from "./listes.ts";
import type { ServicesCommentaires } from "../services/commentaires-regles.ts";
import type { ServicesDecisionsModeration, ServicesSignalementsSociaux } from "../services/signalements-sociaux-regles.ts";
import { creerRoutesCommentaires } from "./commentaires.ts";
import { creerRoutesModerationApp } from "./moderation-app.ts";
import { creerRoutesSignalementsSociaux } from "./signalements-sociaux.ts";
import type { ServicesExportSocial } from "../services/export-social-regles.ts";
import type { ServicesLimitations } from "../services/limitations-comptes-regles.ts";
import type { ServicesCommunaute } from "../services/communaute-regles.ts";
import { creerRoutesCommunaute } from "./communaute.ts";

/** Toutes les lectures sociales (pouls, fils, profils, listes…), par compte : une seule limite pour tous les domaines */
export const LIMITE_LECTURES_SOCIALES = { fenetre: 10 * 60_000, maximum: 900 };
/** Les petits gestes (bande, blocages, suivis, masques, votes, J'aime, réactions, lu, couper, abonnements…), par compte */
export const LIMITE_GESTES_SOCIAUX = { fenetre: 10 * 60_000, maximum: 300 };

export type DependancesSocialApp = {
  /** null : clé des données absente → routes 🔐 en 503 chiffrement-indisponible */
  chiffrement: ChiffrementSocial | null;
  /** Photos et notes vocales du chat, chiffrées sur le disque (DOSSIER_MEDIAS_CHAT) */
  medias: StockageMediasChat;
  relations: RelationsSociales;
  social: ServicesSocial;
  cloche: ServicesCloche;
  /** prevenirCompte de services/notifications/prevenir-compte.ts : toutes les notifications sociales, hors anti-spam (I.15 a) */
  prevenirCompte: (compteId: number, message: MessagePush) => Promise<void>;
  /** services/gestion/moderation.ts (session Logiciel) : la contestation venue de l'app ; faux si la décision n'existe pas */
  contesterSignalement: (id: number, texte: string, maintenant: Date) => Promise<boolean>;
  /** servicesPro.lireRole : le gérant d'un lieu répond et masque au nom du lieu */
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
  /** limitations.estLimite (services/limitations-comptes.ts, session Site) : un compte limité par l'équipe ne peut plus écrire
   *  ce que les autres voient (403 compte-limite) ; absente : rien n'est refusé */
  estLimite?: ServicesLimitations["estLimite"];
  // Un domaine par ligne, à la fin (lots L3 à L7) : bande, suivis, messagerie, sorties, listes, commentaires…
  /** Bande, invitations, demandes, blocages, « Quoi de neuf » et classement (lot L3) ; aussi pour Miam Safe : listerPotes, estPote */
  bande: ServicesBande;
  /** Suivis entre personnes (lot L3) */
  suivis: ServicesSuivisPersonnes;
  /** Messagerie (privé, groupes sur invitation, discussions des sorties), médias du chat et lieux envoyés (lot L4) ;
   *  lireMessageVisible : la règle d'accès de B.0, aussi pour les signalements de messages */
  messagerie: ServicesMessagerie;
  /** Sorties entre potes : invitations, propositions, votes, lieu retenu (lot L5 ; la fin des votes : taches/terminer-votes-sorties.ts) */
  sorties: ServicesSorties;
  /** Listes de lieux : visibilité, co-auteurs, abonnements (lot L5) */
  listes: ServicesListes;
  /** Commentaires des publications : réponses, J'aime, mentions, réponse et masquage par le lieu (lot L6) */
  commentaires: ServicesCommentaires;
  /** Signalements des contenus sociaux, avec leur instantané chiffré (lot L6) ; lireSignalesPar : « caché pour moi » */
  signalements: ServicesSignalementsSociaux;
  /** Décisions de la modération vues dans l'app, et contestation (lot L6) */
  decisions: ServicesDecisionsModeration;
  /** « Télécharger mes données sociales » : tes données et TES messages déchiffrés (lot L7, GET /app/social/export) */
  exportSocial: ServicesExportSocial;
  communaute?: ServicesCommunaute;
};

/** Ce que chaque domaine reçoit pour construire ses routes */
export type ContexteRoutesSociales = {
  horloge: () => number;
  /** Pour un domaine qui monte sa propre chaîne (les commentaires se lisent sans session) */
  protection: ProtectionComptes;
  limiteConnectee: RequestHandler;
  profils: ProfilSocialMiddlewares;
  appliquer: AppliquerEffetsSociaux;
  /** Limites partagées par tous les domaines (LIMITE_LECTURES_SOCIALES, LIMITE_GESTES_SOCIAUX) */
  lectures: RequestHandler;
  gestes: RequestHandler;
  /** Une limite propre au domaine, comptée par compte */
  parCompte: (r: { fenetre: number; maximum: number }) => RequestHandler;
  /** Compte limité par l'équipe : 403 compte-limite sur les écritures que les autres voient. Après la session et la limite
   *  par compte, AVANT exigerProfilSocial, la clé (🔐) et le corps d'un média */
  refuserSiLimite: RequestHandler;
};

const sansCache: RequestHandler = (_requete, reponse, suite) => {
  reponse.set("Cache-Control", "private, no-store");
  suite();
};

export function creerRoutesSocialesApp(d: DependancesSocialApp, protection: ProtectionComptes, limiteConnectee: RequestHandler, horloge: () => number): Router {
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const contexte: ContexteRoutesSociales = {
    horloge,
    protection,
    limiteConnectee,
    profils: creerProfilSocialMiddlewares(d.social),
    // Un seul applicateur : « sans son dans les 30 s » vaut pour toutes les conversations, groupes et sorties compris
    appliquer: creerAppliquerEffetsSociaux({ cloche: d.cloche, prevenirCompte: d.prevenirCompte, lirePushSocial: (ids) => d.relations.lirePushSocial(ids), horloge }),
    lectures: parCompte(LIMITE_LECTURES_SOCIALES),
    gestes: parCompte(LIMITE_GESTES_SOCIAUX),
    parCompte,
    refuserSiLimite: creerRefuserSiLimite(d.estLimite, horloge),
  };
  const routes = Router();
  /** Session obligatoire, jamais en cache, puis les adresses du domaine et ses refus en JSON */
  const monter = (chemin: string, domaine: Router) =>
    routes.use(chemin, limiteConnectee, protection.exigerCompte, sansCache, domaine, gererRefusSociaux, gererErreursComptes);

  const social = creerRoutesSocial(d, contexte);
  monter("/social", social.social);
  monter("/personnes", social.personnes);
  monter("/masques", social.masques);
  monter("/cloche", creerRoutesCloche(d, contexte));
  // Un domaine par ligne, à la fin (lots L3 à L7). Les commentaires (lecture publique sans session) montent leur propre chaîne
  const bande = creerRoutesBande(d, contexte);
  monter("/bande", bande.bande);
  monter("/blocages", bande.blocages);
  monter("/suivis-personnes", creerRoutesSuivisPersonnes(d, contexte));
  monter("/conversations", creerRoutesConversations(d, contexte));
  monter("/lieux-envoyes", creerRoutesLieuxEnvoyes(d, contexte));
  monter("/sorties", creerRoutesSorties(d, contexte));
  monter("/listes", creerRoutesListes(d, contexte));
  // Les commentaires montent leur propre chaîne (la liste d'une publication se lit sans session)
  routes.use("/commentaires", creerRoutesCommentaires(d, contexte), gererRefusSociaux, gererErreursComptes);
  monter("/signalements", creerRoutesSignalementsSociaux(d, contexte));
  monter("/moderation", creerRoutesModerationApp(d, contexte));
  if (d.communaute) monter("/communaute", creerRoutesCommunaute(d.communaute, d, contexte));
  return routes;
}
