import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ONGLET_SORTIES_ANGLAIS } from "~/contenus/anglais/textes-onglet-sorties";

export const TEXTES_ONGLET_SORTIES = {
  sorties: {
    nom: { un: "sortie", des: "sorties" },
    ouvrir: "Ouvrir la sortie",
    ouvrirDetail: "Le vote, les lieux proposés et la discussion",
    retirer: "Retirer de tes sorties",
    retirerDetail: "Elle disparaît d'ici, pour toi seulement : tes potes la gardent",
    retiree: "Sortie retirée",
    quitter: "Quitter la sortie",
    quitterDetail: "Tu ne verras plus le vote ni la discussion",
    quitterTitre: "Quitter la sortie ?",
    quitterOrganisateur: "Tu organises cette sortie : tes potes la garderont sans toi, et tu ne verras plus le vote ni la discussion.",
    quitterParticipant: "Tu ne verras plus le vote ni la discussion de cette sortie.",
    quitterConfirmer: "Quitter",
    quitterRester: "Je reste",
    quittee: (titre: string) => `Tu as quitté « ${titre} »`,
    titre: "Tes sorties",
    sousTitre: "Chacun propose ses lieux, tout le monde vote, et c'est plié.",
    videTitre: "Rien de prévu pour l'instant",
    videAvecPotes:
      "Ton agenda est plus vide qu'un frigo un dimanche soir. Lance une sortie : tes potes votent pour le lieu, fini les « on va où ? » qui durent trois jours.",
    videSansPotes: "Ajoute d'abord un pote ou deux : une sortie en solo, c'est juste un dîner (très bien aussi, remarque).",
    nouvelle: "Nouvelle sortie",
    nouvelleIndice: "Choisis tes potes et propose des lieux, puis tout le monde vote",
    ajouterPote: "Ajouter un pote",
    ajouterPoteIndice: "Par son pseudo, ton lien ou ton QR code",
    passees: "Déjà vécues",
  },
  recus: {
    nom: { un: "lieu", des: "lieux" },
    titre: "Reçu de tes potes",
    nouveaux: (n: number) => `${n} nouveau${n > 1 ? "x" : ""} lieu${n > 1 ? "x" : ""} à découvrir`,
    sousTitre: "Les bonnes adresses que ta bande t'a envoyées",
    retirerVusIndice: "Ils disparaissent d'ici, pour toi seulement",
    retirerVus: (n: number) => `Retirer les ${n} déjà vus`,
    retirerTitre: "Retirer de « Reçu de tes potes »",
    retirerDetail: (prenom: string) => `Il disparaît d'ici, pour toi seulement. ${prenom} n'en saura rien.`,
    retire: "Lieu retiré",
    nettoyageTitre: (n: number) => `Retirer les ${n} lieux déjà vus ?`,
    nettoyageDetail: "Ceux que tu as déjà ouverts disparaissent d'ici, pour toi seulement. Les nouveaux restent.",
    nettoyageConfirmer: "Retirer",
    nettoyageRester: "Je les garde",
    retires: (n: number) => `${n} lieux retirés`,
  },
};

export const TEXTES_ONGLET_SORTIES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLET_SORTIES>> = { fr: TEXTES_ONGLET_SORTIES, en: TEXTES_ONGLET_SORTIES_ANGLAIS };
