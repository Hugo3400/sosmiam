import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PAGE_LIEUX_ANGLAIS } from "~/contenus/anglais/page-lieux";
import type { CategorieLieu } from "~/types/lieux";

const nombreFr = new Intl.NumberFormat("fr-FR");
const compter = (nombre: number, un: string, plusieurs: string) => `${nombreFr.format(nombre)} ${nombre > 1 ? plusieurs : un}`;

const TYPES_META: Record<CategorieLieu, string> = {
  resto: "les restos",
  patisserie: "les pâtisseries",
  bar: "les bars",
  sortie: "les sorties",
};

const majuscule = (texte: string) => `${texte.charAt(0).toUpperCase()}${texte.slice(1)}`;

function titrer(ville: string | null, type: CategorieLieu | null): string {
  if (ville && type) return `${ville} : ${TYPES_META[type]}`;
  if (ville) return `${ville} : restos, pâtisseries et bars`;
  if (type) return `${majuscule(TYPES_META[type])} à découvrir`;
  return "Les lieux : restos, pâtisseries, bars et sorties";
}

export const TEXTES_PAGE_LIEUX = {
  meta: {
    titre: (ville: string | null, type: CategorieLieu | null, page: number) => (page > 1 ? `${titrer(ville, type)} (page ${page})` : titrer(ville, type)),
    description: (ville: string | null) =>
      ville
        ? `${ville} : restos, pâtisseries, bars et sorties indépendants, en liste et sur la carte. Ceux en SOS ce soir d'abord. Gratuit, sur SOS Miam.`
        : "Restos, pâtisseries, bars et sorties indépendants, en liste et sur la carte de France. Ceux en SOS ce soir d'abord. Gratuit, sur SOS Miam.",
  },
  filAriane: {
    etiquette: "Fil d'Ariane",
    accueil: "Accueil",
    lieux: "Les lieux",
  },
  titre: "Les lieux",
  chapo: (ville: string | null, nombreVilles: number) =>
    ville
      ? `${ville}, ses restos, ses pâtisseries et ses bars : à toi de choisir, en liste ou sur la carte.`
      : nombreVilles > 1
        ? `Restos, pâtisseries et bars de ${compter(nombreVilles, "ville", "villes")}, à découvrir sur la carte.`
        : "Restos, pâtisseries et bars, à découvrir sur la carte.",
  recherche: {
    etiquette: "Chercher un lieu",
    indication: "Un nom, un quartier, un plat…",
    bouton: "Chercher",
    resultat: (recherche: string) => `Ta recherche : « ${recherche} »`,
    effacer: "Effacer la recherche",
  },
  filtres: {
    ville: "Ville",
    partout: "Partout",
    autresVilles: "Autres villes",
    autresVillesTitre: "Toutes les autres villes",
    nombre: (nombre: number) => compter(nombre, "lieu", "lieux"),
    envieDe: "Envie de",
    tout: "Tout",
  },
  compte: (total: number) => `${compter(total, "lieu", "lieux")} · ceux en SOS ce soir d'abord`,
  liste: "La liste des lieux",
  pagination: {
    etiquette: "Pages de la liste",
    precedents: "Précédents",
    suivants: "Suivants",
    page: (numero: number) => `Page ${numero}`,
    pageSur: (page: number, pages: number) => `Page ${page} sur ${pages}`,
    note: "24 lieux par page : de quoi prévoir quelques soirées.",
  },
  vues: {
    etiquette: "Affichage",
    liste: "Liste",
    carte: "Carte",
  },
  etats: {
    bientot: {
      titre: "La carte des lieux arrive très vite",
      texte: "Cette page finit de s'installer en cuisine : reviens dans un petit moment. En attendant, l'accueil a déjà quelques pépites pour toi.",
      lien: "Voir les pépites de l'accueil",
    },
    indisponible: {
      titre: "Les lieux font une petite pause",
      texte: "Impossible d'afficher la liste pour le moment. Reviens dans un instant !",
      lien: "Réessayer",
    },
    aucun: {
      titre: "Rien par ici… pour l'instant",
      texte: (recherche: string | null) =>
        recherche
          ? `Aucun lieu ne répond à « ${recherche} ». Essaie un autre mot, ou retire un filtre.`
          : "Pas encore de lieu avec ces filtres. Essaie une autre ville ou une autre envie : la Brigade en déniche chaque semaine.",
      lien: "Voir tous les lieux",
    },
  },
  presDeMoi: {
    bouton: "Près de moi",
    recherche: "On cherche où tu es…",
    refus: "Pas de souci : choisis simplement une ville dans la liste.",
    indisponible: "On n'a pas trouvé ta position. Choisis une ville dans la liste.",
    horsDeFrance: "Tu sembles être hors de France : choisis une ville dans la liste.",
    tropDeDemandes: "Trop d'essais d'affilée : réessaie dans quelques minutes.",
    erreur: "La recherche de ta ville n'a pas marché. Choisis-la dans la liste.",
    aucune: (commune: string) => `Pas encore de lieux autour de toi (${commune}). Choisis une ville dans la liste : la Brigade y travaille !`,
    voisine: (commune: string, ville: string) => `Pas encore de lieux dans ta commune (${commune}) : voici ${ville}, la plus proche qu'on connaît.`,
    dejaLa: (ville: string) => `Tu es déjà sur ${ville}.`,
    trouvee: (ville: string) => `Direction ${ville} !`,
  },
} as const;

export const TEXTES_PAGE_LIEUX_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PAGE_LIEUX>> = {
  fr: TEXTES_PAGE_LIEUX,
  en: TEXTES_PAGE_LIEUX_ANGLAIS,
};
