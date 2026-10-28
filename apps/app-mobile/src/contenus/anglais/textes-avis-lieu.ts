import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_AVIS_LIEU } from "~/contenus/textes-avis-lieu";

export const TEXTES_AVIS_LIEU_ANGLAIS: Traduction<typeof TEXTES_AVIS_LIEU> = {
  titre: "What the Miamis say",
  chargement: "Fetching the reviews…",
  resumeMoyenne: "{moyenne} out of 5",
  resumeUnAvis: "1 review",
  resumeAvis: "{nombre} reviews",
  resumeRetour: "{part}% of customers come back",
  resumeLu: "Rated {moyenne} out of 5, from {nombre}",
  prudence: "A cautious average: no 5 out of 5 thanks to a single friend, and no sinking because of a single bad evening.",
  videTitre: "No reviews here yet",
  videTexte: "The first Miami to drop by gets the ball rolling. Maybe it'll be you?",
  erreurTitre: "The reviews couldn't get through",
  erreurTexte: "The network's playing up. We're keeping them warm for you – try again in a moment.",
  reessayer: "Try again",
  voirPlus: "See more reviews",
  voirPlusEnCours: "Looking for more…",
  voirPlusIndice: "Shows the next reviews, from newest to oldest",
};
