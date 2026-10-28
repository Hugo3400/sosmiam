import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CONTESTATION_VISITE_ANGLAIS } from "~/contenus/anglais/textes-contestation-visite";

export const TEXTES_CONTESTATION_VISITE = {
  lieuInconnu: "le lieu",
  fermerSansEnvoyer: "Fermer, sans rien envoyer",
  titreEnvoyee: "On regarde ça de près",
  titre: "Une erreur, tu crois ?",
  texteEnvoyee: "Un humain répondra. Merci de nous l'avoir dit !",
  texte: (lieu: string) => `Si tu as bien payé chez ${lieu}, dis-le-nous. C'est l'équipe SOS Miam qui lit ton mot, jamais le lieu.`,
  motTitre: "Ton petit mot",
  motFacultatif: "(facultatif)",
  motLu: "Ton petit mot, facultatif",
  motIndice: "Ce qui s'est passé, en quelques mots. 500 caractères au plus.",
  motPlaceholder: "Ex. : j'ai payé vers 20 h, en terrasse, avec ma sœur.",
  fermer: "Fermer",
  envoiLu: "Envoi en cours",
  envoi: "On envoie…",
  reessayer: "Réessayer",
  envoyer: "Envoyer",
  envoyerIndice: "L'équipe SOS Miam reçoit ta contestation",
  renoncerIndice: "Rien n'est envoyé",
  renoncer: "Finalement non",
};

export const TEXTES_CONTESTATION_VISITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONTESTATION_VISITE>> = {
  fr: TEXTES_CONTESTATION_VISITE,
  en: TEXTES_CONTESTATION_VISITE_ANGLAIS,
};
