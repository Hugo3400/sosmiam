import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_ACTUS } from "~/contenus/actus";

export const TEXTES_ACTUS_ANGLAIS: Traduction<typeof TEXTES_ACTUS> = {
  meta: {
    titre: "News from the Miamis: places, told by our ambassadors",
    description: "Spotlights, neighbourhood tops, deals and days out: the restaurants, patisseries and things to do near you, told by SOS Miam ambassadors.",
  },
  titre: "News from the Miamis",
  chapo: "The restaurants, patisseries and things to do near you, told by SOS Miam ambassadors and checked by the Brigade.",
  filtres: {
    rubriques: "Sections",
    longs: { "top-quartier": "Neighbourhood tops", "recit-sortie": "Days out" },
    ville: "City",
    toutes: "All cities",
    afficher: "Show",
  },
  liste: "The stories",
  compte: (nombre: number) => `${nombre} ${accorder(nombre, "en", "story", "stories")}`,
  aucun: {
    titre: "No stories here yet",
    texte: "Our ambassadors are sharpening their pencils. In the meantime, have a look at the other sections or cities.",
    lien: "See all the news",
  },
  lecture: (minutes: number) => `${minutes} min read`,
  encart: {
    titre: "Got a place you'd love to write about?",
    texte: "Stories are written in the app, by our ambassadors to start with.",
    bouton: "Become an ambassador",
  },
  article: {
    introuvable: "Story not found",
    retour: "Back to News",
    finLe: (date: string) => `Deal valid until ${date}`,
    lieux: (nombre: number) => accorder(nombre, "en", "The place in this story", "The places in this story"),
    verifie: "✓ Verified",
    voirFiche: "See the listing",
    voirFicheLu: (nom: string) => `See the listing for ${nom}`,
    motDuLieu: "A word from the place",
    reponseRelue: "Reply from the place, checked by the Brigade",
    relu: (date: string) => `Checked by the Brigade and published on ${date}.`,
    collaborationOui: (prenom: string) => `${prenom} received something from the place for this story: it's a paid or gifted partnership.`,
    collaborationNon: (prenom: string) => `${prenom} received nothing from the place to write it.`,
    app: {
      titre: "Likes and comments live in the app",
      texte: "To like this story, comment on it or send it to a friend, open it in the SOS Miam app.",
      compteurs: (jaime: number, commentaires: number) => `${jaime} ${accorder(jaime, "en", "like", "likes")} · ${commentaires} ${accorder(commentaires, "en", "comment", "comments")}`,
      bientot: "No app yet? It's coming to the stores soon.",
    },
  },
};
