// Tous les services du logiciel de gestion, passés d'un bloc à creerApplication (des faux les remplacent dans les tests).
import {
  accepterCandidature, deciderAmbassadeur, exporterAmbassadeurs, lireAmbassadeur, lireClassement, lireCouverture,
  listerAmbassadeurs, listerCandidatures, lirePrenom, modifierAmbassadeur, refuserCandidature, retirerDuProgramme, supprimerCompte,
} from "./ambassadeurs.ts";
import { lireAlertes } from "./alertes.ts";
import { rechercherPartout } from "./recherche.ts";
import { lireHistoriqueLieu } from "./historique-lieu.ts";
import { lireCalendrier } from "./calendrier.ts";
import { creerReponseType, listerReponsesTypes, modifierReponseType, supprimerReponseType } from "./reponses-types.ts";
import { creerAnnonce, listerAnnonces, retirerAnnonce } from "./annonces.ts";
import { envoyerLienMotDePasse, prevenirAmbassadeurValide } from "../courriels/courriels-comptes.ts";
import { lireEtatEnvois, listerDerniersEnvois } from "../courriels/file-courriels.ts";
import { annulerCampagne, envoyerEssaiNewsletter, lancerCampagne, listerCampagnes, listerDestinataires } from "./envois-newsletter.ts";
import { lireEtatBoite, synchroniserBoite } from "./boite-mail.ts";
import { creerBigSos, deciderBigSos, envoyerVerification, lireBigSos, listerBigSos, modifierBigSos, supprimerBigSos } from "./big-sos.ts";
import { deconnecterPartout, exporterDonneesCompte, lireCompteGestion, listerComptes } from "./comptes-gestion.ts";
import { estimerPush, lireEtatPush } from "../notifications/file-push.ts";
import { annulerNotification, creerNotification, listerNotifications } from "./notifications-gestion.ts";
import { accepterDemande, effacerContactDemande, listerDemandes, refuserDemande } from "./demandes.ts";
import { chercherAdresse } from "./geocodage.ts";
import { noterAction, listerJournal } from "./journal.ts";
import { creerLieu, lireLieu, listerLieux, modifierLieu, modifierLieuxEnLot, supprimerLieu, supprimerLieuxEnLot } from "./lieux.ts";
import { lireEtatServeur, relancerProcessus } from "./maintenance.ts";
import {
  changerStatutMission, creerMission, envoyerMessage, listerMessages, listerMissions, supprimerMessage, supprimerMission,
} from "./missions-messages.ts";
import { ajouterMedia, retirerMedia, trouverFichierMedia } from "./medias.ts";
import { contesterSignalement, deciderSignalement, listerSignalements } from "./moderation.ts";
import {
  creerBrouillon, desinscrire, exporterInscrits, lireBrouillon, listerBrouillons, listerInscrits, modifierBrouillon, supprimerBrouillon,
} from "./newsletter.ts";
import {
  changerStatutPublication, creerPublication, lirePublication, listerPublications, modifierPublication, supprimerPublication,
} from "./publications.ts";
import { lireEtatSauvegardes, sauvegarderBase, trouverSauvegarde } from "./sauvegardes.ts";
import { ecrireObjectifMois, lireObjectifMois } from "./reglages.ts";
import { lireStatistiques } from "./statistiques.ts";
import { lireStatistiquesCommunaute } from "./statistiques-communaute.ts";
import { lireBilanMois } from "./bilan-mois.ts";
import { lireTableauDeBord } from "./tableau-de-bord.ts";

export const servicesGestion = {
  noterAction, listerJournal,
  lireTableauDeBord, lireAlertes, rechercherPartout, lireCalendrier, lireStatistiques, lireStatistiquesCommunaute, lireBilanMois,
  listerInscrits, desinscrire, exporterInscrits,
  listerBrouillons, lireBrouillon, creerBrouillon, modifierBrouillon, supprimerBrouillon,
  listerLieux, lireLieu, lireHistoriqueLieu, creerLieu, modifierLieu, supprimerLieu, modifierLieuxEnLot, supprimerLieuxEnLot,
  listerPublications, lirePublication, creerPublication, modifierPublication, changerStatutPublication, supprimerPublication,
  ajouterMedia, retirerMedia, trouverFichierMedia,
  listerSignalements, deciderSignalement, contesterSignalement,
  lireEtatServeur, relancerProcessus,
  lireEtatSauvegardes, sauvegarderBase, trouverSauvegarde,
  chercherAdresse,
  lireEtatBoite, synchroniserBoite,
  lireObjectifMois, ecrireObjectifMois,
  listerAmbassadeurs, lireAmbassadeur, deciderAmbassadeur, modifierAmbassadeur, lirePrenom, retirerDuProgramme, supprimerCompte, exporterAmbassadeurs,
  lireClassement, lireCouverture, listerCandidatures, accepterCandidature, refuserCandidature,
  listerMissions, creerMission, changerStatutMission, supprimerMission, listerMessages, envoyerMessage, supprimerMessage,
  listerDemandes, accepterDemande, refuserDemande, effacerContactDemande,
  listerAnnonces, creerAnnonce, retirerAnnonce,
  lireEtatEnvois, listerDerniersEnvois, envoyerEssaiNewsletter, listerDestinataires, lancerCampagne, listerCampagnes, annulerCampagne,
  prevenirAmbassadeurValide, envoyerLienMotDePasse,
  listerComptes, lireCompteGestion, deconnecterPartout, exporterDonneesCompte,
  listerBigSos, lireBigSos, creerBigSos, modifierBigSos, envoyerVerification, deciderBigSos, supprimerBigSos,
  lireEtatPush, estimerPush, listerNotifications, creerNotification, annulerNotification,
  listerReponsesTypes, creerReponseType, modifierReponseType, supprimerReponseType,
};

export type ServicesGestion = typeof servicesGestion;
