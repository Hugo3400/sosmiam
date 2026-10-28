import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ONGLETS_POTES } from "~/contenus/textes-onglets-potes";

const BANDE = "My crew";

export const TEXTES_ONGLETS_POTES_ANGLAIS: Traduction<typeof TEXTES_ONGLETS_POTES> = {
  onglets: {
    noms: {
      sorties: "Plans",
      bande: BANDE,
      listes: "Lists",
    },
    demandesBande: (n: number) => `${n} request${n === 1 ? "" : "s"} to join your crew`,
    invitationsListes: (n: number) => `${n} invitation${n === 1 ? "" : "s"} to add to a list`,
    lieuxRecus: (n: number) => `${n} place${n === 1 ? "" : "s"} received, not seen yet`,
    invitationsSorties: (n: number) => `${n} invitation${n === 1 ? "" : "s"} to a get-together`,
    ongletSur: (lu: string, position: number, total: number) => `${lu}, tab ${position} of ${total}`,
  },
  bande: {
    titre: (n: number) => (n > 0 ? `Your crew (${n})` : "Your crew"),
    sousTitre: "Tap a friend to see their profile.",
    sousTitreVide: "Nobody here yet – invite your friends and the table will be all the merrier.",
    ajouterPote: "Add a friend",
    ajouterIndice: "By their username, your link or your QR code",
    ajouter: "Add",
    profilIndice: "Opens their profile",
    inviter: "Invite a friend",
    suggestionsTitre: "You could follow",
    suggestionsSousTitre: `Friends of your friends. Following someone means seeing their lists; ${BANDE} is for getting together.`,
  },
};
