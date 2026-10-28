import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_NOUVEAUTES } from "~/contenus/textes-nouveautes";

export const TEXTES_NOUVEAUTES_ANGLAIS: Traduction<typeof TEXTES_NOUVEAUTES> = {
  fenetre: {
    surtitre: (libelle: string) => `New in ${libelle}`,
    voir: "See what's new",
    indiceVoir: "Opens the What's new page, version after version",
    fermer: "Close",
    indiceFermer: "Closes the window – you'll find what's new in Settings",
    fermerFond: "Close What's new",
    rappel: "You'll find them any time in Settings › What's new.",
    annonceLecteurEcran: (libelle: string) => `What's new in version ${libelle} of SOS Miam`,
  },
  page: {
    titre: "What's new",
    sousTitre: "What's changing in the app, version after version.",
    version: (libelle: string) => `Version ${libelle}`,
    taVersion: "Your version",
  },
  apercu: {
    titre: "See the What's new pop-up",
    detail: "The one that opens once after each update",
  },
};
