import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_ACTUS_ANGLAIS } from "~/contenus/anglais/actus";

export const TEXTES_ACTUS = {
  meta: {
    titre: "Actus des Miamis : les lieux racontés par les ambassadeurs",
    description: "Portraits de lieux, tops du quartier, bons plans et récits de sortie : les restos, pâtisseries et sorties de ton coin, racontés par les ambassadeurs de SOS Miam.",
  },
  titre: "Actus des Miamis",
  chapo: "Les restos, pâtisseries et sorties de ton coin, racontés par les ambassadeurs de SOS Miam et relus par la Brigade.",
  filtres: {
    rubriques: "Rubriques",
    longs: { "top-quartier": "Tops du quartier", "recit-sortie": "Récits de sortie" },
    ville: "Ville",
    toutes: "Toutes les villes",
    afficher: "Afficher",
  },
  liste: "Les articles",
  compte: (nombre: number) => `${nombre} ${accorder(nombre, "fr", "article", "articles")}`,
  aucun: {
    titre: "Pas encore d'article par ici",
    texte: "Les ambassadeurs affûtent leurs plumes. En attendant, jette un œil aux autres rubriques ou aux autres villes.",
    lien: "Voir toutes les actus",
  },
  lecture: (minutes: number) => `${minutes} min de lecture`,
  encart: {
    titre: "Toi aussi, tu as un lieu à raconter ?",
    texte: "Les articles s'écrivent dans l'app, par les ambassadeurs pour commencer.",
    bouton: "Devenir ambassadeur",
  },
  article: {
    introuvable: "Article introuvable",
    retour: "Retour aux Actus",
    finLe: (date: string) => `Bon plan valable jusqu'au ${date}`,
    lieux: (nombre: number) => accorder(nombre, "fr", "Le lieu de l'article", "Les lieux de l'article"),
    verifie: "✓ Vérifié",
    voirFiche: "Voir la fiche",
    voirFicheLu: (nom: string) => `Voir la fiche de ${nom}`,
    motDuLieu: "Le mot du lieu",
    reponseRelue: "Réponse du lieu, relue par la Brigade",
    relu: (date: string) => `Relu par la Brigade et publié le ${date}.`,
    collaborationOui: (prenom: string) => `${prenom} a reçu quelque chose du lieu pour cet article : c'est une collaboration commerciale.`,
    collaborationNon: (prenom: string) => `${prenom} n'a rien reçu du lieu pour l'écrire.`,
    app: {
      titre: "J'aime et commentaires, c'est dans l'app",
      texte: "Pour aimer cet article, le commenter ou l'envoyer à un pote, ouvre-le dans l'app SOS Miam.",
      compteurs: (jaime: number, commentaires: number) => `${jaime} J'aime · ${commentaires} ${accorder(commentaires, "fr", "commentaire", "commentaires")}`,
      bientot: "Pas encore l'app ? Elle arrive bientôt sur les stores.",
    },
  },
};

export const TEXTES_ACTUS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ACTUS>> = {
  fr: TEXTES_ACTUS,
  en: TEXTES_ACTUS_ANGLAIS,
};
