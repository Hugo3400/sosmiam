import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ONGLET_LISTES_ANGLAIS } from "~/contenus/anglais/textes-onglet-listes";

export const TEXTES_ONGLET_LISTES = {
  section: {
    nom: { un: "liste", des: "listes" },
    nePlusSuivre: "Ne plus suivre cette liste",
    nePlusSuivreDetail: (prenom: string) => `Elle quitte « Celles que tu suis ». ${prenom} n'en saura rien.`,
    nePlusSuivreFait: "Tu ne suis plus cette liste",
    pasInteresse: "Pas intéressé",
    pasInteresseDetail: (prenom: string) => `Elle disparaît de « À découvrir », pour toi seulement. Elle reste sur le profil de ${prenom}.`,
    retiree: "Liste retirée",
    unPote: "un pote",
    invitations: "On t'invite à remplir",
    tesListes: "Tes listes",
    tesListesSousTitre: "Tes adresses chouchous, rangées par envie.",
    videMiennes: "Pas encore de liste. « Terrasses au soleil », « Fin de mois serrée »… à toi de jouer !",
    nouvelle: "Nouvelle liste",
    nouvelleIndice: "Choisis un emoji et un nom, puis ajoute tes lieux",
    remplies: "Celles que tu remplis",
    rempliesSousTitre: "À plusieurs, c'est encore meilleur.",
    suivies: "Celles que tu suis",
    suiviesVide: "Tu ne suis aucune liste pour l'instant. Ouvre celle d'un pote et suis-la : elle t'attendra ici.",
    aDecouvrir: "À découvrir",
    aDecouvrirSousTitre: "Les bonnes adresses de ta bande et des gens que tu suis, à piocher sans complexe.",
  },
  profil: {
    titreLu: (n: number) => `Listes partagées, ${n}`,
    titre: (n: number) => `🗂️ Listes partagées (${n})`,
    videMoi: "Pas encore de liste : crée-en une dans Potes › Listes.",
    videAutre: (prenom: string) => `${prenom} n'a pas encore de liste partagée.`,
    lieux: (n: number) => `${n} lieu${n > 1 ? "x" : ""}`,
    ouvrirIndice: "Ouvre la liste",
  },
  ligneLieu: {
    aDistance: (distance: string) => `À ${distance}`,
    ficheIndice: "Ouvre la fiche du lieu",
    retirer: (nom: string) => `Retirer ${nom} de la liste`,
  },
};

export const TEXTES_ONGLET_LISTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLET_LISTES>> = { fr: TEXTES_ONGLET_LISTES, en: TEXTES_ONGLET_LISTES_ANGLAIS };
