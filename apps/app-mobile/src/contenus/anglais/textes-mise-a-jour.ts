import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MISE_A_JOUR } from "~/contenus/textes-mise-a-jour";

export const TEXTES_MISE_A_JOUR_ANGLAIS: Traduction<typeof TEXTES_MISE_A_JOUR> = {
  obligatoire: {
    surtitre: "Time for a refit",
    titre: "Your version of SOS Miam is showing its age",
    texte: "Update it to carry on. It only takes a few seconds, and the Brigade's waiting for you on board.",
    bouton: "Update",
    versionInstallee: "Your version: {version}",
    annonceLecteurEcran: "An update is needed to keep using SOS Miam",
  },
  nouvelle: {
    surtitre: "New on board",
    titre: "A new version is waiting for you!",
    texte: "The Captain's swabbed the decks: new features and a few repairs on board.",
    bouton: "Update",
    plusTard: "Not now",
    indicePlusTard: "Closes the window – we won't mention this version again",
    fermerFond: "Close, not now",
    annonceLecteurEcran: "A new version of SOS Miam is available",
  },
  indiceStore: "Opens SOS Miam on {store}",
  storeRate: "Oops, {store} didn't answer the call. Search for “SOS Miam” there – we'll be waiting for you on board!",
  stores: { ios: "the App Store", android: "Google Play", autre: "your phone's app store" },
  apercus: {
    titreSection: "App updates",
    obligatoire: "See the required update screen",
    detailObligatoire: "The one that blocks the app when your version is too old",
    nouvelle: "See the new version prompt",
    detailNouvelle: "The gentle window, with “Update” and “Not now”",
  },
};
