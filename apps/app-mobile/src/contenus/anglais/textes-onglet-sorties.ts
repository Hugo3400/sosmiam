import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ONGLET_SORTIES } from "~/contenus/textes-onglet-sorties";

const RECUS = "Sent by your friends";

export const TEXTES_ONGLET_SORTIES_ANGLAIS: Traduction<typeof TEXTES_ONGLET_SORTIES> = {
  sorties: {
    nom: { un: "get-together", des: "get-togethers" },
    ouvrir: "Open the get-together",
    ouvrirDetail: "The vote, the suggested places and the chat",
    retirer: "Remove from your get-togethers",
    retirerDetail: "It disappears from here, just for you – your friends keep it",
    retiree: "Get-together removed",
    quitter: "Leave the get-together",
    quitterDetail: "You won't see the vote or the chat any more",
    quitterTitre: "Leave the get-together?",
    quitterOrganisateur: "You're organising this get-together. Your friends will keep it without you, and you won't see the vote or the chat any more.",
    quitterParticipant: "You won't see the vote or the chat for this get-together any more.",
    quitterConfirmer: "Leave",
    quitterRester: "I'll stay",
    quittee: (titre: string) => `You've left “${titre}”`,
    titre: "Your get-togethers",
    sousTitre: "Everyone suggests their places, everyone votes – done and dusted.",
    videTitre: "Nothing planned yet",
    videAvecPotes:
      "Your diary's emptier than the fridge on a Sunday night. Start a get-together and your friends vote on the place – no more “where shall we go?” dragging on for three days.",
    videSansPotes: "Add a friend or two first – a get-together on your own is just dinner (which is lovely too, mind you).",
    nouvelle: "New get-together",
    nouvelleIndice: "Pick your friends and suggest places, then everyone votes",
    ajouterPote: "Add a friend",
    ajouterPoteIndice: "By their username, your link or your QR code",
    passees: "Past get-togethers",
  },
  recus: {
    nom: { un: "place", des: "places" },
    titre: RECUS,
    nouveaux: (n: number) => `${n} new place${n === 1 ? "" : "s"} to discover`,
    sousTitre: "The good spots your crew has sent you",
    retirerVusIndice: "They disappear from here, just for you",
    retirerVus: (n: number) => `Remove the ${n} you've already seen`,
    retirerTitre: `Remove from “${RECUS}”`,
    retirerDetail: (prenom: string) => `It disappears from here, just for you. ${prenom} won't know.`,
    retire: "Place removed",
    nettoyageTitre: (n: number) => `Remove the ${n} place${n === 1 ? "" : "s"} you've already seen?`,
    nettoyageDetail: "The ones you've already opened disappear from here, just for you. The new ones stay.",
    nettoyageConfirmer: "Remove",
    nettoyageRester: "I'll keep them",
    retires: (n: number) => `${n} place${n === 1 ? "" : "s"} removed`,
  },
};
