// Point d'entrée de l'API de SOS Miam. Elle n'écoute qu'en local (127.0.0.1) : le site lui parle côté serveur, et seul
// le chemin /api-gestion est joignable de l'extérieur (nginx), pour le logiciel de gestion, avec des demandes signées.
// Lancement : npm start (ou npm run dev, qui relance à chaque modification). Réglages : .env (DATABASE_URL, HOST, PORT).
import { randomBytes, randomInt } from "node:crypto";

import { creerApplication } from "./application.ts";
import { listerAnnoncesAPublier, noterPublicationAnnonce } from "./services/annonces-discord.ts";
import { baseDeDonnees } from "./base-de-donnees/connexion.ts";
import {
  ajouterPoints, ajouterPointsDans, changerMotDePasse, creerCompte, donnerBadge, effacerCompte, lireCompte, lireIdentifiants, modifierCompte,
  nommerAmbassadeurVille, preparerReinitialisation, preparerVerificationEmail, reinitialiserMotDePasse, retirerAmbassadeurVille, trouverCompteParEmail,
  trouverCompteParJeton, verifierEmail,
} from "./services/comptes.ts";
import { creerCandidatureCertification, lireCandidatureCertification } from "./services/certification.ts";
import { changerCommuneCandidature, creerCandidature, creerProposition, lireCandidature, listerPropositions } from "./services/comptes-espace.ts";
import { envoyerLienMotDePasse, envoyerLienVerificationEmail } from "./services/courriels/courriels-comptes.ts";
import { traiterFileCourriels } from "./services/courriels/file-courriels.ts";
import { traiterNotifications } from "./services/notifications/file-push.ts";
import { prevenirEquipeMiamSafe } from "./services/notifications/prevenir-equipe-miam-safe.ts";
import { servicesMiamSafe } from "./services/miam-safe.ts";
import { creerPartagesMiamSafe } from "./services/partages-miam-safe.ts";
import { enregistrerDemandeLieu } from "./services/demandes-lieux.ts";
import { creerLecteurAcces } from "./services/gestion/acces.ts";
import { marquerMessageLu, messagesDuCompte, missionsDuCompte, noterPresence, terminerMission } from "./services/gestion/missions-messages.ts";
import { enregistrerSignalement } from "./services/gestion/moderation.ts";
import { stockageSessions } from "./services/gestion/stockage-sessions.ts";
import { servicesGestion } from "./services/gestion/tous-les-services.ts";
import { enregistrerInscription } from "./services/inscriptions.ts";
import { creerSuggestionLieu, lireFichePourSuggestion } from "./services/suggestions-comptes.ts";
import { lireFichePublique, listerLieuxPublics } from "./services/lieux-publics.ts";
import { listerLieuxDuPlan } from "./services/lieux-publics.ts";
import { servicesPro } from "./services/pro.ts";
import { trouverCommune } from "./services/localisation.ts";
import { creerCompteurVisites } from "./services/mesure.ts";
import { stockageSessionsComptes } from "./services/stockage-sessions-comptes.ts";
import { stockageStats } from "./services/stockage-stats.ts";
import { listerZones, lireZone, trouverZoneDeCommune } from "./services/zones-fondateurs.ts";
import { planifierTachesDeNuit } from "./taches/taches-de-nuit.ts";
import { resumerErreur } from "./fonctions/comptes/resumer-erreur.ts";
import { chargerChiffrementDonnees } from "./services/chiffrement-donnees.ts";
import { lireProfil, modifierProfil, pseudoEstPris } from "./services/comptes-profil.ts";
import { lireVersionApp } from "./fonctions/texte/lire-version-app.ts";
import { DOSSIER_MEDIAS } from "./services/gestion/medias.ts";
import { creerLieuxApp } from "./services/lieux-app.ts";
import { creerPublicationsApp } from "./services/publications-app.ts";
import { creerActivite } from "./services/activite.ts";
import { creerDepotVisites } from "./services/visites.ts";
import { creerMomentLieu } from "./services/moment-lieu.ts";
import { creerVuesLieux } from "./services/vues-lieux.ts";
import { creerStatistiquesLieu } from "./services/statistiques-lieu.ts";
import { creerEvenements } from "./services/evenements.ts";
import { creerDepotAvis } from "./services/avis.ts";
import { creerVisitesGestion } from "./services/visites-gestion.ts";
import { prevenirCompte, prevenirCompteEtCompter } from "./services/notifications/prevenir-compte.ts";
import { creerSignatureQr } from "./fonctions/securite/creer-signature-qr.ts";
import { lireListeVirgules } from "./fonctions/texte/lire-liste-virgules.ts";
import { servicesComptesExternes } from "./services/comptes-externes.ts";
import { AUDIENCES_APPLE_DEFAUT, creerVerificateurApple, creerVerificateurGoogle } from "./services/connexion-externe.ts";
import { lireAudiencesAppleWeb } from "./services/connexion-externe.ts";
import { brancherCleDesinscription } from "./services/liens-desinscription.ts";
import { lireClesAnciennesDesinscription } from "./services/liens-desinscription.ts";
import { brancherRechiffrementDeNuit } from "./taches/taches-de-nuit.ts";
import { trouverInscritNewsletter } from "./services/desinscription-newsletter.ts";
import { desinscrire, noterDesinscription } from "./services/gestion/newsletter.ts";
import { inscrireCompteNewsletter } from "./services/gestion/newsletter.ts";
import { desinscrireAppareil, inscrireAppareil } from "./services/appareils-push.ts";
import { creerDefis } from "./services/defis.ts";
import { brancherReevaluationDefis } from "./fonctions/defis/brancher-reevaluation-defis.ts";
import { servicesConnexionQr } from "./services/connexion-qr.ts";
import { creerDependancesSociales } from "./services/dependances-sociales.ts";
import { creerApresPassageEnPublic } from "./controleurs/suivis-personnes.ts";
import { contesterSignalement } from "./services/gestion/moderation.ts";
import { creerAppliquerEffetsSociaux } from "./controleurs/effets-sociaux.ts";
import { planifierFinDesVotes } from "./taches/terminer-votes-sorties.ts";
import { noterAction } from "./services/gestion/journal.ts";

const hote = process.env.HOST || "127.0.0.1";
const adresseMedias = (process.env.SOS_MIAM_ADRESSE_MEDIAS || "https://api.sosmiam.fr/app/medias").replace(/\/+$/, "");
const port = Number(process.env.PORT) || 5192;

const compteur = creerCompteurVisites(stockageStats);
// Clé des données des comptes (nom, date de naissance) : lue une seule fois ici ; sans elle, l'API démarre quand même
const chiffrement = chargerChiffrementDonnees();
// Liens de désinscription de la newsletter : sous-clé tirée de la clé des données (HKDF), une fois ici
const cleDesinscription = brancherCleDesinscription(chiffrement);
// Changement de la clé des données (docs/procedure-changement-cle.md) : les liens signés avec l'ancienne clé restent bons,
// et la tâche de nuit rechiffre les comptes. Pour les autres usages, chiffrement.versionCle, versionsAnciennes,
// deriverClesAnciennes(contexte) et deriverCleVersion(contexte, version) (services/chiffrement-donnees.ts)
const clesAnciennesDesinscription = lireClesAnciennesDesinscription();
brancherRechiffrementDeNuit(chiffrement);
// Événements des lieux et avis : un seul service pour l'app et pour le comptoir de l'équipe
const evenements = creerEvenements();
const depotAvis = creerDepotAvis();
// Défis et badges automatiques : recomptés après chaque ajout de points des autres domaines (sans les faire attendre ni
// échouer) et à chaque lecture des défis ; leurs propres points sont posés avec la réussite, dans la même transaction
const defis = creerDefis({ ajouterPointsDans, donnerBadge });
const ajouterPointsEtDefis = brancherReevaluationDefis(ajouterPoints, defis.reevaluer);
// Version minimale de l'app (écran « mets à jour ») : « 0.0.0 » si rien n'est réglé
const versionMinimale = {
  ios: lireVersionApp(process.env.SOS_MIAM_VERSION_MIN_IOS),
  android: lireVersionApp(process.env.SOS_MIAM_VERSION_MIN_ANDROID),
};
const zones = { trouverZoneDeCommune, listerZones, lireZone };
// Connexion avec Apple et Google : audiences acceptées (séparées par des virgules). Apple : l'App ID de l'app iOS par
// défaut ; Google : les identifiants client OAuth (iOS, Android, web), aucun par défaut (POST /comptes/google : 503)
const audiencesApple = lireListeVirgules(process.env.SOS_MIAM_APPLE_AUDIENCES, AUDIENCES_APPLE_DEFAUT);
const audiencesGoogle = lireListeVirgules(process.env.SOS_MIAM_GOOGLE_CLIENT_IDS);
// « Continuer avec Apple » sur le site : son « Services ID » (vide tant qu'il n'est pas créé chez Apple) est aussi accepté
audiencesApple.push(...lireAudiencesAppleWeb(process.env.SOS_MIAM_APPLE_SERVICES_ID, audiencesApple));
const vider = () => compteur.vider().catch((erreur: unknown) => console.error("Écriture des statistiques impossible :", erreur));
const minuteur = setInterval(vider, 30_000);
// Ménage et sauvegarde chiffrée de la base chaque nuit (pas pendant un essai sur un autre schéma)
const arreterSauvegardes = process.env.SCHEMA_BASE ? () => {} : planifierTachesDeNuit();
void vider(); // ferme tout de suite les périodes terminées pendant que l'API était arrêtée
// Mails en attente (newsletter, bienvenue…) : un passage toutes les 20 secondes, dans la limite d'envois par heure
const passerLaFile = () => traiterFileCourriels().catch((erreur: unknown) => console.error("File des mails :", resumerErreur(erreur)));
const minuteurCourriels = process.env.SCHEMA_BASE ? undefined : setInterval(passerLaFile, 20_000);
// Notifications programmées (logiciel de gestion) : envoyées à Apple et Google dès leur heure, vérifié toutes les 30 secondes
const envoyerLesNotifications = () => traiterNotifications().catch((erreur: unknown) => console.error("Notifications :", resumerErreur(erreur)));
const minuteurNotifications = process.env.SCHEMA_BASE ? undefined : setInterval(envoyerLesNotifications, 30_000);
// Partie sociale de l'app (profil social, personnes, masques, pouls, cloche ; puis bande, messagerie, sorties…) : textes,
// médias, codes et instantanés chiffrés avec des sous-clés de la clé des données (503 sans elle) ; les notifications
// sociales partent par prevenirCompte, hors anti-spam (réponse de Hugo du 14/10/2026)
const socialApp = creerDependancesSociales({
  chiffrement, prevenirCompte, contesterSignalement, lireRole: (compteId, lieuId) => servicesPro.lireRole(compteId, lieuId), tirer: (max) => randomInt(max),
  // Disque des médias sous 15 % libres (B.12) : une ligne au journal du logiciel, une fois par heure au plus
  quandDisquePresquePlein: (part) => void noterAction("serveur", "Disque presque plein : envois de médias suspendus", `${Math.round(part * 100)} % libres`).catch((erreur: unknown) => console.error("Journal :", resumerErreur(erreur))),
});
// Sorties : chaque minute, les votes échus reçoivent leur lieu retenu, et les participants sont prévenus (cloche et
// téléphone, hors anti-spam) ; pas pendant un essai sur un autre schéma
const arreterVotes = process.env.SCHEMA_BASE ? () => {} : planifierFinDesVotes({
  sorties: socialApp.sorties,
  appliquer: creerAppliquerEffetsSociaux({ cloche: socialApp.cloche, prevenirCompte, lirePushSocial: (ids) => socialApp.relations.lirePushSocial(ids), horloge: Date.now }),
});

const serveur = creerApplication({
  enregistrerInscription,
  enregistrerVue: compteur.enregistrerVue,
  enregistrerClic: (cible: string) => compteur.enregistrerClic("site", cible),
  enregistrerSignalement,
  trouverCommune,
  listerLieuxPublics,
  lireFichePublique,
  listerLieuxDuPlan,
  enregistrerDemandeLieu,
  bot: { enregistrerDemandeLieu, listerAnnoncesAPublier, noterPublicationAnnonce },
  gestion: { lireAcces: creerLecteurAcces(), services: servicesGestion, sessions: stockageSessions, lireDirect: (source) => compteur.lireDirect(source), chiffrement,
    comptes: { ajouterPoints: ajouterPointsEtDefis, donnerBadge, preparerReinitialisation, preparerVerificationEmail, nommerAmbassadeurVille, retirerAmbassadeurVille },
    // « Donner raison au client » sur une contestation de refus (logique des visites de la session App)
    defis,
    visites: creerVisitesGestion({ depot: creerDepotVisites(), chiffrement, ajouterPoints: ajouterPointsEtDefis, prevenirCompte }) },
  // Espace ambassadeur (ambassadeur.sosmiam.fr) : comptes, sessions gardées dans la base, missions et messages de l'équipe
  comptes: {
    services: {
      creerCompte, trouverCompteParEmail, lireCompte, lireIdentifiants, modifierCompte, changerMotDePasse, effacerCompte, trouverCompteParJeton,
      reinitialiserMotDePasse, preparerReinitialisation, preparerVerificationEmail, verifierEmail, lireCandidature, creerCandidature,
      changerCommuneCandidature, listerPropositions, creerProposition, lireCandidatureCertification, creerCandidatureCertification,
      lireFichePourSuggestion, creerSuggestionLieu,
      lireProfil, modifierProfil, pseudoEstPris,
    },
    // Nom et date de naissance des comptes de l'app, chiffrés (AES-256-GCM)
    chiffrement,
    sessions: stockageSessionsComptes,
    zones,
    courriels: { envoyerLienMotDePasse, envoyerLienVerificationEmail },
    // Espace pro (pro.sosmiam.fr) : rattachements, fiche, suggestions sur son lieu, équipe
    pro: servicesPro,
    // « Se connecter avec Apple » et « avec Google » : jetons vérifiés avec leurs clés publiques (gardées en mémoire)
    externes: {
      services: servicesComptesExternes,
      apple: creerVerificateurApple({ audiences: audiencesApple }),
      google: creerVerificateurGoogle({ audiences: audiencesGoogle }),
    },
    // Case « newsletter » cochée à la création d'un compte de l'app (inscription, Apple, Google) : soft opt-in de la CNIL
    newsletter: { inscrireCompte: (email, ville) => inscrireCompteNewsletter(email, ville, "app") },
    // Repasser en public par le profil accepte les demandes de suivi en attente, comme PUT /app/suivis-personnes/confidentialite
    apresPassageEnPublic: creerApresPassageEnPublic(socialApp, Date.now),
  },
  espaceAmbassadeur: { missionsDuCompte, terminerMission, messagesDuCompte, marquerMessageLu, noterPresence },
  // Recherche de commune et places de fondateurs, sans session (page du programme, formulaire de candidature)
  zones,
  // Miam Safe : l'alerte silencieuse part aussitôt vers les téléphones de l'équipe du lieu
  miamSafe: {
    services: servicesMiamSafe,
    prevenirEquipe: prevenirEquipeMiamSafe,
    // « Prévenir un pote » : la bande de la partie sociale (lot L3), la position chiffrée avec la clé des données
    partages: {
      services: creerPartagesMiamSafe(chiffrement),
      potes: {
        trouverCompte: (idPublic, pour) => socialApp.relations.trouverCompte(idPublic, pour),
        estPote: (a, b) => socialApp.bande.estPote(a, b),
        presenter: (compteIds) => socialApp.relations.presenter(compteIds),
      },
      prevenirCompte: prevenirCompteEtCompter,
    },
  },
  // L'app, sans session : heure du serveur et version minimale
  app: { versionMinimale: () => versionMinimale },
  // Adresse publique des médias du fil, telle que l'app la lit (SOS_MIAM_ADRESSE_MEDIAS, par défaut celle de api.sosmiam.fr)
  contenuApp: {
    lieux: creerLieuxApp(),
    publications: creerPublicationsApp((fichier) => `${adresseMedias}/${fichier}`),
    dossierMedias: DOSSIER_MEDIAS,
  },
  // Rescousses, lieux gardés, J'aime, masques et suivis de l'app (points et badge donnés par le contrôleur)
  activiteApp: { services: creerActivite(), ajouterPoints: ajouterPointsEtDefis, donnerBadge },
  // La clé des QR du comptoir est tirée à chaque démarrage, jamais écrite (un QR vit 60 s au plus)
  visitesApp: {
    depot: creerDepotVisites(), chiffrement, signerQr: creerSignatureQr(randomBytes(32)), tirer: (max) => randomInt(max),
    lireRole: (compteId, lieuId) => servicesPro.lireRole(compteId, lieuId), ajouterPoints: ajouterPointsEtDefis, moment: creerMomentLieu(),
    statistiques: creerStatistiquesLieu(), evenements, avis: { depot: depotAvis },
  },
  // Vues des fiches dans l'app : un compteur par lieu et par jour ; les visiteurs ne sont reconnus qu'en mémoire, jusqu'à minuit
  vuesLieux: { services: creerVuesLieux() },
  // Événements des lieux : dates visibles et « Ça m'intéresse » (l'âge, pour l'alcool, est lu avec la clé des données)
  evenementsApp: { services: evenements, chiffrement },
  // Avis des lieux : vérifiés (visite validée) ou non vérifiés (lieu sans compte), relus par les ambassadeurs. Pas encore
  // d'envoi de photo : sans verifierPhoto, un avis avec photo est refusé (400 avis-invalide { champ: "photo" })
  avisApp: { depot: depotAvis, chiffrement, ajouterPoints: ajouterPointsEtDefis, tirer: (max) => randomInt(max) },
  // Défis du moment (liste gérée dans le logiciel de gestion), avancée recomptée à chaque lecture
  defisApp: { services: defis },
  // Connexion par QR code, comme Discord : le site ou un nouveau téléphone affiche le QR, l'app connectée valide
  connexionQr: { services: servicesConnexionQr },
  // Désinscription de la newsletter par le lien signé des mails (page /desinscription du site, « un clic » des messageries)
  // Téléphones inscrits aux notifications push (PUT/DELETE /app/appareils)
  appareilsApp: { inscrire: inscrireAppareil, desinscrire: desinscrireAppareil },
  newsletter: { cle: cleDesinscription, clesAnciennes: clesAnciennesDesinscription, trouverInscrit: trouverInscritNewsletter, desinscrire: (id) => desinscrire(id), noterDesinscrit: (email) => noterDesinscription(email) },
  // Potes, profils, masques, pouls et cloche de l'app (routes /app/social, /app/personnes, /app/masques, /app/cloche…)
  socialApp,
}).listen(port, hote, () => {
  console.log(`API SOS Miam prête sur http://${hote}:${port}`);
});

// Arrêt propre (pm2 reload, Ctrl+C) : on finit les requêtes en cours, on écrit les derniers totaux, puis on ferme la base
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    clearInterval(minuteur);
    clearInterval(minuteurCourriels);
    clearInterval(minuteurNotifications);
    arreterSauvegardes();
    arreterVotes();
    serveur.close(() => {
      // Les visites en cours sont closes : leurs totaux (durée, rebond, sortie) ne sont pas perdus
      compteur.vider(new Date(), true).catch(() => {}).finally(() => baseDeDonnees.$disconnect().finally(() => process.exit(0)));
    });
  });
}
