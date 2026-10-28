import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_NOUVEAUTES_ANGLAIS } from "~/contenus/anglais/textes-nouveautes";

export const TEXTES_NOUVEAUTES = {
  fenetre: {
    surtitre: (libelle: string) => `Nouveau dans la ${libelle}`,
    voir: "Voir les nouveautés",
    indiceVoir: "Ouvre la page des nouveautés, version après version",
    fermer: "Fermer",
    indiceFermer: "Ferme la fenêtre, tu retrouveras les nouveautés dans les Paramètres",
    fermerFond: "Fermer les nouveautés",
    rappel: "Tu les retrouves quand tu veux dans Paramètres › Les nouveautés.",
    annonceLecteurEcran: (libelle: string) => `Nouveautés de la version ${libelle} de SOS Miam`,
  },
  page: {
    titre: "Les nouveautés",
    sousTitre: "Ce qui change dans l'app, version après version.",
    version: (libelle: string) => `Version ${libelle}`,
    taVersion: "Ta version",
  },
  apercu: {
    titre: "Voir le pop-up des nouveautés",
    detail: "Celui qui s'ouvre une fois après chaque mise à jour",
  },
} as const;

export const TEXTES_NOUVEAUTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_NOUVEAUTES>> = { fr: TEXTES_NOUVEAUTES, en: TEXTES_NOUVEAUTES_ANGLAIS };
