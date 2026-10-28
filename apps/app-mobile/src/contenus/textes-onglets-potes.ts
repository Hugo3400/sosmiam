import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ONGLETS_POTES_ANGLAIS } from "~/contenus/anglais/textes-onglets-potes";

export const TEXTES_ONGLETS_POTES = {
  onglets: {
    noms: {
      sorties: "Sorties",
      bande: "Ma bande",
      listes: "Listes",
    },
    demandesBande: (n: number) => `${n} demande${n > 1 ? "s" : ""} pour rejoindre ta bande`,
    invitationsListes: (n: number) => `${n} invitation${n > 1 ? "s" : ""} à remplir une liste`,
    lieuxRecus: (n: number) => `${n} lieu${n > 1 ? "x" : ""} reçu${n > 1 ? "s" : ""} pas encore vu${n > 1 ? "s" : ""}`,
    invitationsSorties: (n: number) => `${n} invitation${n > 1 ? "s" : ""} à une sortie`,
    ongletSur: (lu: string, position: number, total: number) => `${lu}, onglet ${position} sur ${total}`,
  },
  bande: {
    titre: (n: number) => (n > 0 ? `Ta bande (${n})` : "Ta bande"),
    sousTitre: "Touche un pote pour voir son profil.",
    sousTitreVide: "Personne pour l'instant : invite tes potes, la table sera plus joyeuse.",
    ajouterPote: "Ajouter un pote",
    ajouterIndice: "Par son pseudo, ton lien ou ton QR code",
    ajouter: "Ajouter",
    profilIndice: "Ouvre son profil",
    inviter: "Inviter un pote",
    suggestionsTitre: "Tu pourrais suivre",
    suggestionsSousTitre: "Des potes de tes potes. Suivre, c'est voir passer leurs listes ; Ma bande, c'est pour sortir ensemble.",
  },
};

export const TEXTES_ONGLETS_POTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLETS_POTES>> = { fr: TEXTES_ONGLETS_POTES, en: TEXTES_ONGLETS_POTES_ANGLAIS };
