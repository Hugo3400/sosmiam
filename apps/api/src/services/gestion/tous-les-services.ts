// Tous les services du logiciel de gestion, passés d'un bloc à creerApplication (des faux les remplacent dans les tests).
import { creerAnnonce, listerAnnonces, retirerAnnonce } from "./annonces.ts";
import { lireEtatBoite, synchroniserBoite } from "./boite-mail.ts";
import { accepterDemande, effacerContactDemande, listerDemandes, refuserDemande } from "./demandes.ts";
import { chercherAdresse } from "./geocodage.ts";
import { noterAction, listerJournal } from "./journal.ts";
import { creerLieu, lireLieu, listerLieux, modifierLieu, supprimerLieu } from "./lieux.ts";
import { lireEtatServeur, relancerProcessus } from "./maintenance.ts";
import { ajouterMedia, retirerMedia, trouverFichierMedia } from "./medias.ts";
import { deciderSignalement, listerSignalements } from "./moderation.ts";
import {
  creerBrouillon, desinscrire, exporterInscrits, lireBrouillon, listerBrouillons, listerInscrits, modifierBrouillon, supprimerBrouillon,
} from "./newsletter.ts";
import {
  changerStatutPublication, creerPublication, lirePublication, listerPublications, modifierPublication, supprimerPublication,
} from "./publications.ts";
import { lireEtatSauvegardes, sauvegarderBase, trouverSauvegarde } from "./sauvegardes.ts";
import { lireStatistiques } from "./statistiques.ts";
import { lireTableauDeBord } from "./tableau-de-bord.ts";

export const servicesGestion = {
  noterAction, listerJournal,
  lireTableauDeBord, lireStatistiques,
  listerInscrits, desinscrire, exporterInscrits,
  listerBrouillons, lireBrouillon, creerBrouillon, modifierBrouillon, supprimerBrouillon,
  listerLieux, lireLieu, creerLieu, modifierLieu, supprimerLieu,
  listerPublications, lirePublication, creerPublication, modifierPublication, changerStatutPublication, supprimerPublication,
  ajouterMedia, retirerMedia, trouverFichierMedia,
  listerSignalements, deciderSignalement,
  lireEtatServeur, relancerProcessus,
  lireEtatSauvegardes, sauvegarderBase, trouverSauvegarde,
  chercherAdresse,
  lireEtatBoite, synchroniserBoite,
  listerDemandes, accepterDemande, refuserDemande, effacerContactDemande,
  listerAnnonces, creerAnnonce, retirerAnnonce,
};

export type ServicesGestion = typeof servicesGestion;
