import { Router, type RequestHandler } from "express";

import { creerAttenteParCompte } from "../controleurs/comptes-attente.ts";
import { creerControleursCertification } from "../controleurs/comptes-certification.ts";
import { creerControleursEspaceComptes } from "../controleurs/comptes-espace.ts";
import { creerControleursLimitation } from "../controleurs/comptes-limitation.ts";
import { creerControleursMonCompte } from "../controleurs/comptes-moi.ts";
import { creerControleursProfil } from "../controleurs/comptes-profil.ts";
import { creerControleursPropositionsLieux } from "../controleurs/comptes-propositions-lieux.ts";
import { creerLecteurCompteVu } from "../controleurs/comptes-vu.ts";
import { ADRESSE_ESPACE, creerControleursLiens, type CourrielsComptes } from "../controleurs/comptes-liens.ts";
import { creerLimiteEnvois } from "../controleurs/comptes-limite-envois.ts";
import { creerControleursSuggestions } from "../controleurs/comptes-suggestions.ts";
import { creerControleursRattachements } from "../controleurs/pro-rattachements.ts";
import { creerControleursComptes, type ServicesComptes } from "../controleurs/comptes.ts";
import { creerControleursComptesExternes, type DependancesConnexionExterne } from "../controleurs/comptes-externes.ts";
import { creerControleursConnexionsCompte } from "../controleurs/comptes-connexions.ts";
import type { InscriptionNewsletterComptes } from "../controleurs/comptes-newsletter.ts";
import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { creerControleMajorite } from "../middlewares/exiger-majeur.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { creerRefuserSiLimite } from "../middlewares/refuser-si-limite.ts";
import { gererErreursComptes, type ProtectionComptes, type StockageSessionsComptes } from "../middlewares/proteger-comptes.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
import type { ServicesLimitations } from "../services/limitations-comptes-regles.ts";
import type { ServicesPro } from "../services/pro-regles.ts";
import type { ServicesZones } from "../services/zones-fondateurs.ts";

const DIX_MINUTES = 10 * 60_000;
/**
 * Adresses de la personne connectée (et l'espace ambassadeur) : 600 appels d'API par SESSION toutes les 10 minutes (par
 * IP s'il n'y a pas de jeton). Une page en coûte plusieurs (/espace : 5 ; le kit média : 18 avec ses aperçus). Une IP
 * partagée (opérateur mobile, Wi-Fi d'un resto) a en plus sa propre limite, bien plus large : LIMITE_CONNECTEE_IP
 * (middlewares/limiter-connectes.ts). Les routes qui vérifient un mot de passe gardent l'attente par compte et la file
 * des calculs.
 */
export const LIMITE_CONNECTEE = { fenetre: DIX_MINUTES, maximum: 600 };
/** La limite large par IP, devant la limite par session : arrête un robot qui changerait de jeton à chaque appel */
export const LIMITE_CONNECTEE_IP = { fenetre: DIX_MINUTES, maximum: 12_000 };
/** « Mot de passe oublié » : 5 demandes par visiteur et par heure (en plus de la limite par compte : 1 lien toutes les
 * 15 minutes, 5 par 24 heures) */
export const LIMITE_MOT_DE_PASSE_OUBLIE = { fenetre: 60 * 60_000, maximum: 5 };
/** Confirmation de l'e-mail par le lien reçu : 20 essais par visiteur toutes les 10 minutes */
export const LIMITE_VERIFIER_EMAIL = { fenetre: DIX_MINUTES, maximum: 20 };
/** « Proposer une modification » d'une fiche : 20 envois par visiteur et par heure (en plus des limites par compte : 10
 * par 24 heures, 3 en attente sur un même lieu) */
export const LIMITE_SUGGESTIONS = { fenetre: 60 * 60_000, maximum: 20 };
/** Demander à gérer un lieu : 10 demandes par visiteur et par heure (en plus de la limite par compte : 5 par 24 heures) */
export const LIMITE_RATTACHEMENTS = { fenetre: 60 * 60_000, maximum: 10 };
/** « Ce pseudo est-il libre ? » : 60 questions par COMPTE toutes les 10 minutes (l'app attend une pause de frappe) */
export const LIMITE_PSEUDO_DISPONIBLE = { fenetre: DIX_MINUTES, maximum: 60 };
/** Proposer un nouveau lieu (tout compte de 18 ans et plus) : 10 propositions par COMPTE et par 24 heures */
export const LIMITE_PROPOSITIONS_LIEUX = { fenetre: 24 * 60 * 60_000, maximum: 10 };
/** « Se connecter avec Apple » ou « avec Google » : 20 essais par visiteur toutes les 10 minutes pour chacun, comme la
 * connexion par mot de passe (« Fais connaissance » en coûte un de plus) */
export const LIMITE_CONNEXION_EXTERNE = { fenetre: DIX_MINUTES, maximum: 20 };
/** Relier ou délier Apple et Google depuis « Mon compte » : 10 demandes par COMPTE et par heure, les trois adresses ensemble */
export const LIMITE_CONNEXIONS_COMPTE = { fenetre: 60 * 60_000, maximum: 10 };
/** Contester sa limitation : 10 envois par COMPTE et par 24 heures, essais trop courts compris (une seule contestation est gardée) */
export const LIMITE_CONTESTATION_LIMITATION = { fenetre: 24 * 60 * 60_000, maximum: 10 };

export type DependancesComptes = {
  services: ServicesComptes;
  /** Où garder les sessions (la base en vrai : services/stockage-sessions-comptes.ts) */
  sessions: StockageSessionsComptes;
  /** Zones des fondateurs, pour la candidature (services/zones-fondateurs.ts, ou la mémoire) */
  zones: ServicesZones;
  /** Envoi des liens par mail (services/courriels/courriels-comptes.ts) */
  courriels: CourrielsComptes;
  /** Base des liens envoyés par mail (https://ambassadeur.sosmiam.fr ; l'API de démonstration met la sienne) */
  adresseEspace?: string;
  /** Espace pro : rattachements, fiche, équipe (services/pro.ts, ou la mémoire) ; sans lui, ni /pro ni /comptes/moi/rattachements */
  pro?: ServicesPro;
  /** Chiffrement du nom et de la date de naissance (services/chiffrement-donnees.ts) ; absent ou null : l'inscription
   * « app », le profil et la lecture de l'âge répondent 503 « chiffrement-indisponible » */
  chiffrement?: ChiffrementDonnees | null;
  /** Connexion avec Apple et Google : données (services/comptes-externes.ts, ou la mémoire) et vérificateurs des jetons
   * (services/connexion-externe.ts) ; absent : POST /comptes/apple et /comptes/google répondent 503 */
  externes?: DependancesConnexionExterne;
  /** Case « newsletter » à la création d'un compte : cochée dans l'app (inscription « app », Apple, Google),
   * inscrireCompteNewsletter ; décochée (app, Apple, Google, espace ambassadeur), noterRefus : noterDesinscription
   * (services/gestion/newsletter.ts) en vrai ; absente : la case est lue et vérifiée, mais rien n'est fait */
  newsletter?: InscriptionNewsletterComptes;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
  /** PATCH /comptes/moi/profil { prive: false } : le compte repasse en public et accepte ses demandes de suivi en attente,
   * comme PUT /app/suivis-personnes/confidentialite (partie sociale, creerApresPassageEnPublic) ; absente : rien de plus */
  apresPassageEnPublic?: (compteId: number) => Promise<void>;
  /** Limitations décidées par l'équipe dans le logiciel de gestion (services/limitations-comptes.ts, ou la mémoire) : GET
   * /comptes/moi/limitation, sa contestation, et les refus 403 « compte-limite » (ici et dans l'espace pro) ; absentes :
   * personne n'est limité (limitation: null, contestation 404) */
  limitations?: ServicesLimitations;
};

/**
 * /comptes/… : le compte unique de SOS Miam, pour l'espace ambassadeur (ambassadeur.sosmiam.fr) et l'espace pro
 * (pro.sosmiam.fr), appelés par le serveur du site, et pour l'app.
 * JSON ; jeton de session dans l'en-tête X-Session-Compte (le site) ou « Authorization: Bearer <jeton> » (l'app ; si les
 * deux sont là, X-Session-Compte compte), IP du visiteur dans X-IP-Visiteur (elle ne sert qu'aux limites).
 * Réponses : { ok: true, … } ou { ok: false, erreur, champ?, attente? }, jamais en cache. Les adresses qui calculent une
 * empreinte de mot de passe peuvent aussi répondre 503 « occupe » (avec Retry-After) quand trop de calculs attendent
 * déjà : rien n'est fait, ni compté, on réessaie. 503 « chiffrement-indisponible » : la clé des données des comptes
 * manque au serveur (inscription « app », profil) ; rien n'est fait, on réessaie plus tard.
 *
 * `compte` (rendu par l'inscription, la connexion, GET /comptes/session et PATCH /comptes/moi) : la forme de
 * apps/site-web/src/types/compte.ts, plus :
 *   - `emailVerifie` (booléen : e-mail confirmé par le lien reçu) ;
 *   - `age` : âge en années pleines au jour de Paris si la date de naissance est gardée (comptes de l'app), sinon null ;
 *   - `pro.lieux[].emoji` (l'emoji du lieu) et `pro.lieuxValides` : les mêmes lieux, seulement ceux au statut « valide » ;
 *   - si l'âge connu est sous 18 ans, AUCUN rôle : `ambassadeur` null, `pro` { lieux: [], lieuxValides: [] } (de même si
 *     la date est gardée mais illisible faute de clé : dans le doute, on ne montre pas). Depuis le 14 octobre 2026, on ne
 *     s'inscrit plus avant 18 ans : filet de sécurité pour les comptes de l'app créés plus jeunes avant cette date.
 * `prenom` (inscription du site et de l'app, Apple et Google à la création, PATCH /comptes/moi, PATCH /comptes/moi/profil) :
 * 1 à 40 caractères, sans gros mot (nomPublicContientMotInterdit de packages/commun, comme le pseudo), sinon 400
 * champ-invalide { champ: "prenom" } ; vérifié seulement à l'écriture : le prénom déjà enregistré, renvoyé tel quel, passe.
 * Sessions : support « site » (par défaut) : fermée après 30 jours sans visite, 90 jours au plus ; support « app » : 1 an,
 * prolongé à chaque usage (au plus une écriture par jour), sans limite totale. Expirée : 401 « session-expiree ».
 *
 * POST   /comptes                       { email, motDePasse, prenom, ville, quartier?, dateNaissance, cgu: true, espace?,
 *                                        support?, piege? } → 201 { ok, session, compte } (piège rempli : 201 { ok } sans
 *                                        session) · 400 champ-invalide {champ} · 403 age-minimum · 409 email-deja-utilise
 *                                        · 409 pseudo-pris (espace « app ») · 429 · 503 chiffrement-indisponible (« app »)
 *                                        support : « site » ou « app » (absent : « app » pour l'espace « app », sinon « site »)
 *                                        espace : absent ou « ambassadeur » : le compte ET sa fiche d'ambassadeur
 *                                        « en-attente » (une demande que l'équipe valide). « pro » (inscription sur
 *                                        pro.sosmiam.fr) : le compte seul, SANS fiche d'ambassadeur (`compte.ambassadeur`
 *                                        null) ; ville et quartier ne sont ni exigés ni gardés. Autre valeur : 400 {champ:
 *                                        espace}. Un compte sans ambassadeur se connecte, lit et modifie son compte (prénom,
 *                                        mot de passe, suppression), confirme son e-mail et va dans l'espace pro comme les
 *                                        autres ; les adresses « ambassadeur actif » lui répondent 403. Ménage de nuit : seul
 *                                        l'effacement après 2 ans sans connexion le concerne.
 *                                        « app » : l'inscription de l'app, DÈS 18 ANS (âge au jour de Paris ; dessous : 403
 *                                        age-minimum et rien n'est gardé) ; le compte seul, SANS fiche d'ambassadeur. Champs
 *                                        en plus : nom? (60 car., gardé chiffré), ville (2 à 80 car., obligatoire, gardée
 *                                        sur le compte ; quartier ignoré), envies? ({ lieux?, cuisines?, boissons?, bars?,
 *                                        musique?, jeux?, moments?: string[] } : identifiants « a-z0-9- » de 40 car. au
 *                                        plus, 60 par catégorie ; « regimes » ou une autre catégorie : 400 {champ: envies}),
 *                                        pseudo? (forme estPseudoValide, sans « @ », mis en minuscules, sans gros mot,
 *                                        sinon 400 {champ: pseudo}). La date de naissance est GARDÉE, chiffrée. Le lien de
 *                                        confirmation de l'e-mail part comme pour les autres (ambassadeur.sosmiam.fr).
 *                                        newsletter? (booléen ; « soft opt-in » de la CNIL : l'app, et le formulaire de
 *                                        l'espace ambassadeur, montrent à l'inscription une case claire, cochée, que la
 *                                        personne peut décocher) : true → espace « app » : après la création, l'e-mail (en
 *                                        minuscules) et la ville du profil sont inscrits à la newsletter ; espace
 *                                        « ambassadeur » : rien ici (l'inscription se fait à la validation, dans le logiciel
 *                                        de gestion). false → après la création, le refus est retenu (noterRefus : l'e-mail
 *                                        rejoint la liste des désinscrits, 3 ans), pour qu'aucune inscription automatique ne
 *                                        le reprenne. Les deux SANS attendre (une panne est journalisée sans l'e-mail et
 *                                        n'empêche jamais l'inscription). Absent ou null (anciennes versions) → rien ; autre
 *                                        valeur → 400 {champ: newsletter}. Ignoré pour l'espace « pro ».
 * POST   /comptes/session               { email, motDePasse, support? } → 201 { ok, session, compte } · 400 · 401
 *                                        identifiants · 429 {attente} (support : « site » par défaut, ou « app »)
 * POST   /comptes/apple                 { identityToken, nonce, prenom?, nom?, dateNaissance?, ville?, envies?, pseudo?,
 *                                        newsletter?, support? } : « Se connecter avec Apple » (le compte reste unique). Voir plus bas.
 * POST   /comptes/google                { idToken, nonce?, mêmes champs } : « Se connecter avec Google ». Voir plus bas.
 * GET    /comptes/session               → 200 { ok, compte } · 401 session-expiree
 * DELETE /comptes/session               → 200 { ok } (déconnexion)
 * PATCH  /comptes/moi                   { prenom?, ville?, quartier? } (quartier "" : effacé) → 200 { ok, compte } · 400 · 401
 *                                        (sans fiche d'ambassadeur, ville et quartier sont vérifiés mais sans effet)
 * POST   /comptes/moi/mot-de-passe      { actuel, nouveau } → 200 { ok, session } (toutes les sessions fermées, un nouveau
 *                                        jeton remplace celui en cours) · 400 champ-invalide (nouveau) · 403 mot-de-passe-incorrect
 *                                        · 401 · 429 {attente} (le nouveau jeton garde le support de la session en cours)
 * POST   /comptes/moi/deconnecter-partout → 200 { ok } : TOUTES les sessions du compte (site et app) sont fermées, celle-ci
 *                                        comprise · 401
 * GET    /comptes/moi/profil            → 200 { ok, profil: { prenom, nom, pseudo, dateNaissance ("AAAA-MM-JJ"), ville,
 *                                        envies ({ categorie: string[] }, {} si aucune), avatar, prive, emailVerifie, age } }
 *                                        (nom, pseudo, dateNaissance, ville, avatar, age : null s'ils ne sont pas connus ;
 *                                        un compte du site n'a ni date ni ville de profil) · 401 · 503 chiffrement-indisponible
 * PATCH  /comptes/moi/profil            { prenom?, nom?, pseudo?, ville?, envies?, avatar?, prive? } → 200 { ok, profil }
 *                                        (même forme que GET ; champ absent : inchangé) · 400 champ-invalide {champ} · 401
 *                                        · 409 pseudo-pris · 503 chiffrement-indisponible
 *                                        prenom 1 à 40 car., sans gros mot ; nom 60 car., null ou "" : effacé ; pseudo : comme à
 *                                        l'inscription (le sien : accepté ; l'ancien est réservé 30 jours pour ce compte, et un
 *                                        pseudo réservé pour un autre répond 409 pseudo-pris) ; ville 2 à 80 car. ; envies : comme à
 *                                        l'inscription, REMPLACENT les précédentes ; avatar : un seul emoji (16 car. au
 *                                        plus), null ou "" : effacé ; prive : booléen. dateNaissance ("AAAA-MM-JJ") :
 *                                        acceptée UNE fois, seulement si le compte n'en a aucune (compte du site, ambassadeur
 *                                        ou pro, qui arrive dans l'app) ; elle doit donner 18 ans ou plus (le compte du site
 *                                        les a jurés), sinon 403 age-minimum ; mal écrite : 400 {champ: dateNaissance}. Un
 *                                        compte qui en a déjà une : 400 {champ: dateNaissance} (l'équipe la corrige sur demande)
 * GET    /comptes/pseudo-disponible?pseudo=… → 200 { ok, disponible } (le sien, ou son ancien encore réservé pour lui :
 *                                        disponible ; libéré par un autre depuis moins de 30 jours, ou gros mot : jamais) · 400
 *                                        champ-invalide {champ: pseudo} (forme de estPseudoValide, après « @ » retiré et
 *                                        minuscules) · 401 · 429 (60 par compte toutes les 10 minutes)
 * DELETE /comptes/moi                   { motDePasse } → 200 { ok } (tout effacé ; le pseudo reste réservé 30 jours) · 403 mot-de-passe-incorrect · 401 · 429 {attente}
 *                                        Compte SANS vrai mot de passe (connexions.motDePasse faux : créé avec Apple ou
 *                                        Google) : confirmé par un NOUVEAU jeton du compte Apple ou Google lié, { identityToken,
 *                                        nonce } (Apple) ou { idToken, nonce? } (Google), même vérification qu'à la connexion
 *                                        → 200 { ok } · 400 champ-invalide {champ: confirmation} (aucun jeton ; ou
 *                                        identityToken|idToken|nonce mal formé) · 403 confirmation-incorrecte (jeton refusé,
 *                                        ou d'un autre compte Apple ou Google) · 503 apple-indisponible|google-indisponible|
 *                                        verification-indisponible. Une session seule ne suffit jamais : un téléphone
 *                                        déverrouillé et volé ne peut pas effacer le compte sans Face ID ou Google.
 * GET    /comptes/moi/connexions        → 200 { ok, connexions: { motDePasse, apple, google } } (booléens : vrai mot de passe,
 *                                        compte Apple lié, compte Google lié ; jamais les identifiants) · 401. L'app s'en
 *                                        sert pour « Supprimer mon compte » : mot de passe, ou bouton Apple ou Google.
 * POST   /comptes/moi/connexions/apple  { identityToken, nonce } (comme POST /comptes/apple) : relie un compte Apple au compte
 * POST   /comptes/moi/connexions/google { idToken, nonce? } (comme POST /comptes/google) : relie un compte Google
 *                                        → 200 { ok, connexions } (même forme que GET ; déjà relié à CETTE identité : 200
 *                                        aussi, rien ne change) · 400 champ-invalide {champ: identityToken|idToken|nonce}
 *                                        · 401 jeton-externe-invalide · 401 session-expiree · 409 deja-relie (le compte a
 *                                        déjà une AUTRE identité chez ce fournisseur : la délier d'abord) · 409
 *                                        identite-deja-reliee (cette identité appartient à un AUTRE compte SOS Miam : jamais
 *                                        de fusion ; se connecter à l'autre compte, l'y délier ou supprimer ce compte, puis
 *                                        revenir) · 429 trop-de-demandes · 503 apple-indisponible|google-indisponible|
 *                                        verification-indisponible. L'e-mail du compte ne change JAMAIS (une adresse Google
 *                                        différente est acceptée) ; il compte comme confirmé seulement si le jeton porte le
 *                                        même, vérifié.
 * DELETE /comptes/moi/connexions/:fournisseur (apple | google) → 200 { ok, connexions } · 400 champ-invalide {champ:
 *                                        fournisseur} · 409 derniere-connexion (ni vrai mot de passe ni l'autre fournisseur :
 *                                        refusé avant toute confirmation) · 401 · 429. Rien de relié chez ce fournisseur :
 *                                        200, rien ne change. Confirmation : compte avec un vrai mot de passe → { motDePasse }
 *                                        (403 mot-de-passe-incorrect, 429 {attente} : la même attente que « Mon compte ») ;
 *                                        compte sans mot de passe → un NOUVEAU jeton de l'AUTRE fournisseur, celui qui reste
 *                                        ({ identityToken, nonce } pour délier Google, { idToken, nonce? } pour délier Apple :
 *                                        400 {champ: confirmation} s'il manque, 403 confirmation-incorrecte s'il est refusé
 *                                        ou d'un autre compte). Ce jeton prouve que c'est bien toi ET que ta dernière façon
 *                                        de te connecter marche. Limite : 10 demandes par compte et par heure pour relier et
 *                                        délier ensemble (429 trop-de-demandes, Retry-After).
 *                                        Ajouter un mot de passe à un compte qui n'en a pas : POST /comptes/mot-de-passe-oublie
 *                                        avec l'e-mail du compte (lien de 24 h ; adresse relais d'Apple : le relais doit
 *                                        transmettre les mails).
 * POST   /comptes/nouveau-mot-de-passe  { jeton, motDePasse } → 200 { ok } (jeton effacé, toutes les sessions fermées)
 *                                        400 champ-invalide · 410 jeton-invalide · 429
 * POST   /comptes/mot-de-passe-oublie   { email } → toujours 200 { ok } (lien de 24 h envoyé seulement si le compte existe,
 *                                        1 toutes les 15 min et 5 par 24 h par compte) · 400 champ-invalide (email mal
 *                                        formé) · 429 (5 demandes par visiteur et par heure)
 * POST   /comptes/verifier-email        { jeton } → 200 { ok } (e-mail confirmé, jeton effacé) · 400 jeton-invalide · 429
 * POST   /comptes/moi/renvoyer-verification → 200 { ok, dejaVerifie } · 401 · 429 trop-de-demandes {attente} (1 lien toutes
 *                                        les 15 min et 5 par 24 h, l'envoi de l'inscription compris)
 * GET    /comptes/moi/limitation        → 200 { ok, limitation: null | { motif, motivation, debut, fin, contestation,
 *                                        contesteLe, reexamineLe, active, peutContester } } : la limitation décidée par
 *                                        l'équipe (CGU, « Modération »), en cours (celle qui finit le plus tard) sinon la
 *                                        prochaine à venir ; null s'il n'y en a pas, ou plus (finie ou levée). motif : un code
 *                                        de MOTIFS_MODERATION (packages/commun) ; motivation : le pourquoi écrit pour la
 *                                        personne ; dates ISO 8601, fin null : jusqu'à nouvel ordre ; active : elle court
 *                                        maintenant ; peutContester : active et pas encore contestée. Jamais rien sur l'équipe.
 * POST   /comptes/moi/limitation/contestation { texte } (10 à 1 000 caractères, espaces autour retirés) → 200 { ok,
 *                                        limitation } (même forme que GET) : une seule fois, pendant la limitation ; une autre
 *                                        personne de l'équipe la réexamine dans le logiciel de gestion · 400 champ-invalide
 *                                        {champ: texte} · 404 aucune-limitation (aucune en cours, même à venir) · 409
 *                                        deja-conteste · 429 (10 envois par compte et par 24 h)
 * Compte LIMITÉ (décision de Hugo du 15 octobre 2026, docs/decisions.md) : ce que les AUTRES utilisateurs verraient est
 * refusé, 403 { ok: false, erreur: "compte-limite", details: { jusqua } } (jusqua : ISO 8601, ou null : jusqu'à nouvel
 * ordre), rien n'est fait. Ici : POST /comptes/moi/suggestions (le gérant les lit) ; POST /comptes/moi/rattachements/:id/
 * accepter (le gérant voit son équipe) ; PATCH /comptes/moi et PATCH /comptes/moi/profil seulement si le prénom, le
 * pseudo ou l'avatar CHANGENT (une valeur renvoyée telle quelle passe ; retirer son avatar aussi ; ville, envies, prive,
 * nom… restent permis). Espace pro : routes/pro.ts. Restent permis ce que seule l'équipe lit (proposer un lieu,
 * candidatures fondateur et certification, demandes de rattachement, missions et messages de l'espace ambassadeur),
 * et tout le reste : lire, Mon compte, mot de passe, connexions, export, suppression du compte, contestation, quitter.
 * POST   /comptes/moi/suggestions       { lieuId, proposition, message? } (tout compte connecté) : proposer une modification
 *                                        d'une fiche de lieu, décidée par l'équipe dans le logiciel de gestion.
 *                                        proposition : PropositionLieu de packages/commun (nom, adresse, horaires, texte,
 *                                        telephone, siteWeb, instagram, animaux, accessible, terrasse, wifi, enfants, parking,
 *                                        paiements, reservation), vérifiée par validerPropositionLieu ; message : « Pourquoi ? »
 *                                        (1 000 car.) → 201 { ok, id } (gardée avec seulement les champs qui changent, et
 *                                        « avant » : ces champs tels qu'ils sont dans la fiche ; source « client »)
 *                                        · 400 proposition-invalide {champ} (champ de validerPropositionLieu, ou « autre »
 *                                        pour un champ qui n'est pas proposable) · 400 rien-a-changer (tout est déjà
 *                                        comme ça) · 401 · 404 lieu-inconnu (absent ou pas publié) · 409 trop-de-suggestions
 *                                        (10 par 24 h par compte, ou déjà 3 en attente sur ce lieu) · 429 (20 par visiteur
 *                                        et par heure)
 *
 * Connexion avec Apple ou Google (décidé le 9 octobre 2026) : POST /comptes/apple et POST /comptes/google, sans session,
 * 20 essais par visiteur toutes les 10 minutes pour chacun (429 au-delà). Le serveur vérifie lui-même le jeton : signature
 * RS256 avec les clés publiques d'Apple ou de Google (gardées en mémoire), émetteur, audience (Apple : l'App ID,
 * SOS_MIAM_APPLE_AUDIENCES, et pour le site le « Services ID », SOS_MIAM_APPLE_SERVICES_ID ; Google : les identifiants client OAuth iOS, Android et web, SOS_MIAM_GOOGLE_CLIENT_IDS),
 * exp et iat à 60 s près, et le nonce. Apple : `nonce` obligatoire, le nonce BRUT (8 à 256 caractères ASCII visibles) ;
 * l'app donne son SHA-256 en hexadécimal minuscule à Apple (option nonce de signInAsync), le jeton le porte, l'API
 * recalcule (le site fait pareil : il envoie à Apple le SHA-256 du nonce qu'il garde, puis le nonce brut ici, avec
 * support « site »). Google : `nonce` facultatif, comparé tel quel au nonce du jeton s'il est envoyé ; email_verified exigé.
 * support : « app » par défaut (session d'un an), ou « site ». Dans l'ordre :
 *   a) jeton refusé → 401 jeton-externe-invalide (identityToken|idToken absent ou vide, nonce mal formé : 400
 *      champ-invalide {champ}) ;
 *   b) compte Apple ou Google (« sub ») déjà lié à un compte → connexion : 200 { ok, session, compte, nouveau: false,
 *      rattache: false } (les champs du profil et cgu sont ignorés : ni b ni c ne demandent cgu) ;
 *   c) sinon, un compte a l'e-mail du jeton (vérifié : toujours chez Apple, adresse « privaterelay » comprise ;
 *      email_verified chez Google) → ce compte Apple ou Google lui est LIÉ, son e-mail compte désormais comme confirmé,
 *      et on se connecte : 200 { ok, session, compte, nouveau: false, rattache: true }. Un compte du site garde sa
 *      situation (pas de date de naissance : majeur). 409 compte-deja-rattache si ce compte est déjà lié à un AUTRE
 *      compte Apple (ou Google) ;
 *   d) sinon, création d'un compte de l'app, avec les mêmes champs et règles que l'inscription « app » : prenom,
 *      dateNaissance, ville et cgu: true obligatoires (comme l'inscription ; la version du jour est gardée) ; nom?,
 *      envies?, pseudo?, newsletter? (comme l'inscription « app » : true inscrit l'e-mail du jeton à la newsletter
 *      après la création, false retient le refus, sans attendre ; autre valeur qu'un booléen → 400 {champ: newsletter} ; lu SEULEMENT à la
 *      création : en b et c, il est ignoré). D'abord l'âge : dateNaissance sous 18 ans → 403 age-minimum, rien n'est gardé. Sans clé de
 *      chiffrement : 503 chiffrement-indisponible. cgu envoyé mais pas true : 400 champ-invalide {champ: cgu}. Si
 *      prenom, dateNaissance, ville ou cgu manquent → 409 { ok: false, erreur: "profil-a-completer", manque: [ces champs,
 *      dans cet ordre], prefill: { email, prenom?, nom? } } (prenom et nom : ceux envoyés,
 *      sinon ceux du jeton de Google ; Apple ne donne le nom qu'à la toute première connexion, l'app le renvoie) : l'app
 *      montre « Fais connaissance » et renvoie la même demande, avec le même jeton s'il est encore valable (Apple : 10
 *      minutes ; Google : 1 h), sinon un nouveau. Champ invalide : 400 champ-invalide {champ} ; 409 pseudo-pris. Le
 *      compte : e-mail du jeton (confirmé), aucun vrai mot de passe (« Mot de passe oublié » permet d'en choisir un),
 *      aucun lien de confirmation envoyé → 201 { ok, session, compte, nouveau: true }. Jeton sans e-mail (portée
 *      « email » non demandée à Apple) : 400 email-manquant ;
 *   e) jamais de compte sans date de naissance par ce chemin.
 * Autres erreurs : 503 apple-indisponible | google-indisponible (pas réglé sur le serveur ; Google sans identifiant
 * client), 503 verification-indisponible (clés publiques injoignables, Retry-After 30 : réessayer). Un compte sans vrai
 * mot de passe ne se connecte pas par e-mail et mot de passe (401 identifiants) ; POST /comptes/moi/mot-de-passe lui
 * répond 403 mot-de-passe-incorrect : il passe par « Mot de passe oublié ».
 *
 * Tout compte (18 ans vérifiés à l'inscription depuis le 14/10/2026 ; âge connu sous 18 ans, ancien compte → 403
 * reserve-aux-majeurs ; 503 chiffrement-indisponible si sa date ne peut pas se lire) :
 * GET    /comptes/moi/propositions-lieux → 200 { ok, propositions: [{ id, nom, ville, statut, creeLe }] } (les siennes,
 *                                        site compris, les plus récentes d'abord ; statut : a-traiter, acceptee, refusee)
 * POST   /comptes/moi/propositions-lieux { nom, type?, ville, adresse?, description, plat?, horaires?, siteWeb?,
 *                                        instagram?, piege? } (mêmes champs et règles que POST /comptes/moi/propositions)
 *                                        → 201 { ok } (relue par l'équipe dans le logiciel de gestion, origine « compte »)
 *                                        · 400 champ-invalide {champ} · 429 (10 par compte et par 24 h)
 * Ambassadeur « actif » seulement (sinon 403 ambassadeur-non-actif) :
 * GET    /comptes/moi/candidature       → 200 { ok, candidature: { statut, numero, numeroLocal, numeroNational, commune, zone,
 *                                        creeLe, reponduLe } | null, placesRestantes } (statut : en-attente, acceptee,
 *                                        refusee, souvenir ; numero = numeroLocal ; commune { code, nom, nomDepartement } ou
 *                                        null ; zone { code, type, nom, nomAvecDe, places, prises, libres } ou null ;
 *                                        placesRestantes : libres de sa zone, sinon de toute la France)
 * POST   /comptes/moi/candidature       { communeCode, pepites, envies[], reseaux?, motivation, partantRencontre, connuPar?,
 *                                        piege? } → 201 { ok } · 400 (champ communeCode : absente ou inconnue) · 409
 *                                        plus-de-place (zone complète) · 409 candidature-existante
 * POST   /comptes/moi/candidature/commune { communeCode } → 200 { ok, candidature } · 400 champ-invalide communeCode · 404
 *                                        aucune-candidature · 409 deja-traitee (plus en attente) · 409 plus-de-place
 * GET    /comptes/moi/propositions      → 200 { ok, propositions: [{ id, nom, ville, statut, creeLe }] }
 * POST   /comptes/moi/propositions      { nom, type?, ville, adresse?, description, plat?, horaires?, siteWeb?, instagram?, piege? }
 *                                        201 { ok } · 400 (route du site, gardée telle quelle ; l'app : propositions-lieux)
 * GET    /comptes/moi/certification     → 200 { ok, certifie: { depuis, profil, structure } | null, candidature: { statut,
 *                                        profil, structure, commune: { code, nom, nomDepartement } | null, envies[], creeLe,
 *                                        reponduLe } | null } (statut : en-attente, acceptee, refusee ; la dernière envoyée)
 * POST   /comptes/moi/certification     { profil, structure?, communeCode, aide, envies[], engagementGratuit: true, piege? }
 *                                        → 201 { ok } · 400 champ-invalide {champ} (profil : ambassadeur, pro ou structure ;
 *                                        structure : 100 car. ; communeCode connue ; aide : 1 à 600 car. ; envies : au moins
 *                                        une parmi fiche, photos, presenter, big-sos ; engagementGratuit : true) · 409
 *                                        deja-certifie · 409 candidature-existante (une en attente ; après un refus, on peut
 *                                        recandidater tout de suite)
 * `compte.ambassadeur.certifie` (dans toutes les réponses qui rendent `compte`) : { depuis, profil, structure } ou null.
 * `compte.pro` (toujours là) : { lieux: [{ lieuId, nom, ville, emoji, role: "gerant"|"equipe", statut: "en-attente"|"valide"|
 * "refuse" }], lieuxValides: [même forme, statut « valide » seulement] }, tous ses rattachements sauf « retire », du plus
 * ancien au plus récent (vides sous 18 ans). Un lieu est à lui quand statut
 * est « valide » : pages /pro/lieux/:id (routes/pro.ts).
 * Espace pro, tout compte connecté (demander et accepter : 18 ans et plus, sinon 403 reserve-aux-majeurs si l'âge connu
 * est sous 18 ans, 503 chiffrement-indisponible si la date gardée est illisible ; un compte sans date, créé sur le site,
 * passe ; lister et quitter restent ouverts) :
 * GET    /comptes/moi/rattachements     → 200 { ok, rattachements: [{ id, lieuId, nom, ville, emoji, role, statut, reponse,
 *                                        creeLe, decideLe }] } (sauf « retire » ; les plus récents d'abord ; reponse : celle
 *                                        de l'équipe, ou null). Une invitation dans une équipe : role « equipe », statut
 *                                        « en-attente ».
 * POST   /comptes/moi/rattachements     { lieuId, role: "gerant", preuve (1 à 600 car.), siret? (14 chiffres, espaces
 *                                        tolérés, clé de Luhn juste ; "" ou null : sans) } → 201 { ok, id } (statut
 *                                        « en-attente », validé ou refusé par l'équipe dans le logiciel de gestion)
 *                                        · 400 champ-invalide {champ: lieuId|role|preuve|siret} · 404 lieu-inconnu (absent
 *                                        ou masqué ; un brouillon se demande) · 409 deja-demande (une demande en attente ou
 *                                        validée sur ce lieu, ou déjà dans son équipe ; après un refus ou un retrait, on
 *                                        redemande) · 409 trop-de-demandes (5 par 24 h par compte) · 429 (10 par visiteur
 *                                        et par heure)
 * POST   /comptes/moi/rattachements/:id/accepter → 200 { ok } (invitation « equipe » acceptée : statut « valide ») · 404
 *                                        invitation-inconnue (pas à lui, pas une invitation, ou plus en attente)
 * DELETE /comptes/moi/rattachements/:id → 200 { ok } (refuser une invitation, annuler sa demande ou quitter un lieu :
 *                                        statut « retire ») · 404 rattachement-inconnu
 */
export function creerRoutesComptes(dependances: DependancesComptes, protection: ProtectionComptes, limiteConnectee: RequestHandler) {
  const { services, zones, courriels, adresseEspace = ADRESSE_ESPACE, horloge = Date.now, chiffrement = null } = dependances;
  // Deux attentes après des mots de passe faux : la connexion (par e-mail) et « Mon compte » (par id du compte) ; deux
  // limites de liens envoyés par mail (par id du compte)
  const contexte = {
    services, protection, zones, courriels, adresseEspace, horloge,
    attente: creerAttenteParCompte(horloge), attenteConnectee: creerAttenteParCompte(horloge),
    limiteOubli: creerLimiteEnvois(horloge), limiteVerification: creerLimiteEnvois(horloge),
    chiffrement, lireCompteVu: creerLecteurCompteVu(services.lireCompte, chiffrement, horloge).lireCompteVu,
    externes: dependances.externes ?? null,
    newsletter: dependances.newsletter,
    apresPassageEnPublic: dependances.apresPassageEnPublic,
    limitations: dependances.limitations,
  };
  const c = creerControleursComptes(contexte);
  const moi = creerControleursMonCompte(contexte);
  const liens = creerControleursLiens(contexte);
  const espace = creerControleursEspaceComptes(services, zones);
  const certification = creerControleursCertification(services);
  const suggestions = creerControleursSuggestions(services, horloge);
  const profil = creerControleursProfil(contexte);
  const propositionsLieux = creerControleursPropositionsLieux(contexte);
  const externes = creerControleursComptesExternes(contexte);
  const connexions = creerControleursConnexionsCompte(contexte);
  const limitation = creerControleursLimitation(dependances.limitations, horloge);
  // Compte limité : ce que les autres verraient est refusé (403 compte-limite), après la session
  const refuserSiLimite = creerRefuserSiLimite(dependances.limitations?.estLimite, horloge);
  const parCompte = (reglages: { fenetre: number; maximum: number }) => limiterRequetes({ ...reglages, cle: (_requete, reponse) => `compte-${lireCompteId(reponse)}` });
  const routes = Router();

  // Sans session : une limite par visiteur pour chaque porte d'entrée, toujours AVANT de calculer une empreinte
  routes.post("/", limiterRequetes({ fenetre: 60 * 60_000, maximum: 10 }), c.inscrire);
  routes.post("/session", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 20 }), c.connecter);
  routes.post("/apple", limiterRequetes(LIMITE_CONNEXION_EXTERNE), externes.connecterApple);
  routes.post("/google", limiterRequetes(LIMITE_CONNEXION_EXTERNE), externes.connecterGoogle);
  routes.post("/nouveau-mot-de-passe", limiterRequetes({ fenetre: DIX_MINUTES, maximum: 10 }), c.choisirNouveauMotDePasse);
  routes.post("/mot-de-passe-oublie", limiterRequetes(LIMITE_MOT_DE_PASSE_OUBLIE), liens.motDePasseOublie);
  routes.post("/verifier-email", limiterRequetes(LIMITE_VERIFIER_EMAIL), liens.verifierEmail);
  // La déconnexion passe toujours, même limite atteinte : le site efface son cookie quoi qu'il arrive, la session doit donc
  // disparaître aussi (une empreinte SHA-256 et une suppression, réponse toujours « ok » : rien à deviner ni à protéger)
  routes.delete("/session", c.deconnecter);

  routes.use(limiteConnectee);
  routes.get("/session", protection.exigerCompte, c.lireSession);
  routes.patch("/moi", protection.exigerCompte, moi.modifier);
  routes.post("/moi/mot-de-passe", protection.exigerCompte, moi.changerMotDePasse);
  routes.delete("/moi", protection.exigerCompte, moi.supprimer);
  routes.post("/moi/renvoyer-verification", protection.exigerCompte, liens.renvoyerVerification);
  routes.post("/moi/deconnecter-partout", protection.exigerCompte, moi.deconnecterPartout);
  routes.get("/moi/connexions", protection.exigerCompte, externes.lireConnexions);
  const limiteConnexions = parCompte(LIMITE_CONNEXIONS_COMPTE);
  routes.post("/moi/connexions/apple", protection.exigerCompte, limiteConnexions, connexions.relierApple);
  routes.post("/moi/connexions/google", protection.exigerCompte, limiteConnexions, connexions.relierGoogle);
  routes.delete("/moi/connexions/:fournisseur", protection.exigerCompte, limiteConnexions, connexions.delier);
  routes.get("/moi/profil", protection.exigerCompte, profil.lire);
  routes.patch("/moi/profil", protection.exigerCompte, profil.modifier);
  routes.get("/pseudo-disponible", protection.exigerCompte, parCompte(LIMITE_PSEUDO_DISPONIBLE), profil.pseudoDisponible);
  routes.get("/moi/propositions-lieux", protection.exigerCompte, propositionsLieux.exigerMajeur, propositionsLieux.lister);
  routes.post(
    "/moi/propositions-lieux",
    protection.exigerCompte, propositionsLieux.exigerMajeur, parCompte(LIMITE_PROPOSITIONS_LIEUX), propositionsLieux.proposer,
  );
  routes.post("/moi/suggestions", limiterRequetes(LIMITE_SUGGESTIONS), protection.exigerCompte, refuserSiLimite, suggestions.proposer);
  routes.get("/moi/limitation", protection.exigerCompte, limitation.lire);
  routes.post("/moi/limitation/contestation", protection.exigerCompte, parCompte(LIMITE_CONTESTATION_LIMITATION), limitation.contester);
  if (dependances.pro) {
    const rattachements = creerControleursRattachements(dependances.pro, horloge);
    // Demander à gérer un lieu ou rejoindre une équipe : 18 ans et plus (la liste et « quitter » restent ouvertes)
    const { exigerMajeur } = creerControleMajorite(services.lireCompte, chiffrement, horloge);
    routes.get("/moi/rattachements", protection.exigerCompte, rattachements.lister);
    routes.post("/moi/rattachements", limiterRequetes(LIMITE_RATTACHEMENTS), protection.exigerCompte, exigerMajeur, rattachements.demander);
    routes.post("/moi/rattachements/:id/accepter", protection.exigerCompte, exigerMajeur, refuserSiLimite, rattachements.accepter);
    routes.delete("/moi/rattachements/:id", protection.exigerCompte, rattachements.quitter);
  }
  routes.get("/moi/candidature", protection.exigerAmbassadeurActif, espace.lireCandidature);
  routes.post("/moi/candidature", protection.exigerAmbassadeurActif, espace.candidater);
  routes.post("/moi/candidature/commune", protection.exigerAmbassadeurActif, espace.changerCommune);
  routes.get("/moi/propositions", protection.exigerAmbassadeurActif, espace.listerPropositions);
  routes.post("/moi/propositions", protection.exigerAmbassadeurActif, espace.proposer);
  routes.get("/moi/certification", protection.exigerAmbassadeurActif, certification.lire);
  routes.post("/moi/certification", protection.exigerAmbassadeurActif, certification.candidater);
  routes.use(gererErreursComptes);
  return routes;
}
