import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_SCANNER_COMPTOIR_ANGLAIS } from "~/contenus/anglais/textes-scanner-comptoir";

export const TEXTES_SCANNER_COMPTOIR = {
  soucis: {
    refuse: "Sans l'appareil photo, pas de scan. Pas de souci : tu peux aussi demander l'addition dans l'app.",
    bloque: "L'appareil photo est coupé pour SOS Miam. Tu peux l'autoriser dans les réglages de ton téléphone, ou demander l'addition dans l'app.",
    panne: "L'appareil photo n'a pas voulu s'allumer. Réessaie dans un instant, ou demande l'addition dans l'app.",
  },
  etapes: {
    position: "On vérifie que tu es bien chez eux…",
    envoi: "On valide ta visite…",
    "nouvel-essai": "Pas de réseau : on réessaie tout seul pendant une minute…",
  },
  cameraPrete: "Appareil photo prêt, vise le QR du comptoir",
  voirFiche: "Voir la fiche",
  ouvrirReglages: "Ouvrir les réglages",
  reessayer: "Réessayer",
  titre: "Scanner le QR du comptoir",
  consigne: "Allume l'appareil photo et vise le QR que te montre l'équipe au moment de payer. On ne garde aucune image.",
  allumer: "Allumer l'appareil photo",
  fermer: "Fermer le scanner",
  viser: "Vise le QR que te montre l'équipe",
  pasDeQr: "Pas de QR ? Demande l'addition",
  apercuWeb: "Sur l'aperçu web, pas d'appareil photo : le scan se fait depuis ton téléphone.",
  eteindreLampe: "Éteindre la lampe",
  allumerLampe: "Allumer la lampe",
};

export const TEXTES_SCANNER_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SCANNER_COMPTOIR>> = {
  fr: TEXTES_SCANNER_COMPTOIR,
  en: TEXTES_SCANNER_COMPTOIR_ANGLAIS,
};
