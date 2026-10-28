import type { Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ESPACE_COMMUNAUTE_ANGLAIS } from "~/contenus/anglais/textes-miamis";
import { TEXTES_ONGLETS_POTES_ANGLAIS } from "~/contenus/anglais/textes-onglets-potes";
import type { TEXTES_ONGLET_LISTES } from "~/contenus/textes-onglet-listes";

const SUIVIES = "Lists you follow";
const A_DECOUVRIR = "Discover";

export const TEXTES_ONGLET_LISTES_ANGLAIS: Traduction<typeof TEXTES_ONGLET_LISTES> = {
  section: {
    nom: { un: "list", des: "lists" },
    nePlusSuivre: "Unfollow this list",
    nePlusSuivreDetail: (prenom: string) => `It leaves “${SUIVIES}”. ${prenom} won't know.`,
    nePlusSuivreFait: "You've unfollowed this list",
    pasInteresse: "Not for me",
    pasInteresseDetail: (prenom: string) => `It disappears from “${A_DECOUVRIR}”, just for you. It stays on ${prenom}'s profile.`,
    retiree: "List removed",
    unPote: "a friend",
    invitations: "You're invited to add places",
    tesListes: "Your lists",
    tesListesSousTitre: "Your favourite spots, sorted by mood.",
    videMiennes: "No lists yet. “Sunny terraces”, “Skint till payday”… over to you!",
    nouvelle: "New list",
    nouvelleIndice: "Pick an emoji and a name, then add your places",
    remplies: "Lists you're adding to",
    rempliesSousTitre: "Even better together.",
    suivies: SUIVIES,
    suiviesVide: "You're not following any lists yet. Open one of a friend's lists and follow it – it'll be waiting for you here.",
    aDecouvrir: A_DECOUVRIR,
    aDecouvrirSousTitre: "Good spots from your crew and the people you follow – help yourself.",
  },
  profil: {
    titreLu: (n: number) => `Shared lists, ${n}`,
    titre: (n: number) => `🗂️ Shared lists (${n})`,
    videMoi: `No lists yet – create one in ${TEXTES_ESPACE_COMMUNAUTE_ANGLAIS.bande} › ${TEXTES_ONGLETS_POTES_ANGLAIS.onglets.noms.listes}.`,
    videAutre: (prenom: string) => `${prenom} hasn't shared any lists yet.`,
    lieux: (n: number) => `${n} place${n === 1 ? "" : "s"}`,
    ouvrirIndice: "Opens the list",
  },
  ligneLieu: {
    aDistance: (distance: string) => `${distance} away`,
    ficheIndice: "Opens the place's page",
    retirer: (nom: string) => `Remove ${nom} from the list`,
  },
};
