// Tous les services du logiciel de gestion, passés d'un bloc à creerApplication (des faux les remplacent dans les tests).
import {
  accepterCandidature, deciderAmbassadeur, exporterAmbassadeurs, lireAmbassadeur, lireClassement, lireCouverture,
  listerAmbassadeurs, listerCandidatures, lirePrenom, modifierAmbassadeur, refuserCandidature, retirerDuProgramme, supprimerCompte,
} from "./ambassadeurs.ts";
import { creerAnnonce, listerAnnonces, retirerAnnonce } from "./annonces.ts";
import { lireEtatBoite, synchroniserBoite } from "./boite-mail.ts";
import { accepterDemande, effacerContactDemande, listerDemandes, refuserDemande } from "./demandes.ts";
import { chercherAdresse } from "./geocodage.ts";
import { noterAction, listerJournal } from "./journal.ts";
import { creerLieu, lireLieu, listerLieux, modifierLieu, modifierLieuxEnLot, supprimerLieu, supprimerLieuxEnLot } from "./lieux.ts";
import { lireEtatServeur, relancerProcessus } from "./maintenance.ts";
import {
  changerStatutMission, creerMission, envoyerMessage, listerMessages, listerMissions, supprimerMessage, supprimerMission,
} from "./missions-messages.ts";
import { ajouterMedia, retirerMedia, trouverFichierMedia } from "./medias.ts";
import { deciderSignalement, listerSignalements } from "./moderation.ts";
import {
  creerBrouillon, desinscrire, exporterInscrits, lireBrouillon, listerBrouillons, listerInscrits, modifierBrouillon, supprimerBrouillon,
} from "./newsletter.ts";
import {
  changerStatutPublication, creerPublication, lirePublication, listerPublications, modifierPublication, supprimerPublication,
} from "./publications.ts";
import { lireEtatSauvegardes, sauvegarderBase, trouverSauvegarde } from "./sauvegardes.ts";
import { ecrireObjectifMois, lireObjectifMois } from "./reglages.ts";
import { lireStatistiques } from "./statistiques.ts";
import { lireTableauDeBord } from "./tableau-de-bord.ts";

export const servicesGestion = {
  noterAction, listerJournal,
  lireTableauDeBord, lireStatistiques,
  listerInscrits, desinscrire, exporterInscrits,
  listerBrouillons, lireBrouillon, creerBrouillon, modifierBrouillon, supprimerBrouillon,
  listerLieux, lireLieu, creerLieu, modifierLieu, supprimerLieu, modifierLieuxEnLot, supprimerLieuxEnLot,
  listerPublications, lirePublication, creerPublication, modifierPublication, changerStatutPublication, supprimerPublication,
  ajouterMedia, retirerMedia, trouverFichierMedia,
  listerSignalements, deciderSignalement,
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
};

export type ServicesGestion = typeof servicesGestion;
