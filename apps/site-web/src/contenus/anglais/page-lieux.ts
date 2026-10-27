import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import { citer } from "../../../../../packages/commun/src/fonctions/langue/citer.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import type { CategorieLieu } from "~/types/lieux";

const MILLIERS = /\B(?=(\d{3})+(?!\d))/g;
const compter = (nombre: number, un: string, plusieurs: string) => `${String(nombre).replace(MILLIERS, ",")} ${accorder(nombre, "en", un, plusieurs)}`;

const TYPES_META: Record<CategorieLieu, string> = {
  resto: "restaurants",
  patisserie: "patisseries",
  bar: "bars",
  sortie: "things to do",
};

const majuscule = (texte: string) => `${texte.charAt(0).toUpperCase()}${texte.slice(1)}`;

function titrer(ville: string | null, type: CategorieLieu | null): string {
  if (ville && type) return `${majuscule(TYPES_META[type])} in ${ville}`;
  if (ville) return `Restaurants, patisseries and bars in ${ville}`;
  if (type) return `${majuscule(TYPES_META[type])} to discover`;
  return "Places: restaurants, patisseries, bars and things to do";
}

export const TEXTES_PAGE_LIEUX_ANGLAIS: Traduction<typeof TEXTES_PAGE_LIEUX> = {
  meta: {
    titre: (ville: string | null, type: CategorieLieu | null, page: number) => (page > 1 ? `${titrer(ville, type)} (page ${page})` : titrer(ville, type)),
    description: (ville: string | null) =>
      ville
        ? `${ville}: independent restaurants, patisseries, bars and things to do, as a list and on the map. Places with an SOS tonight come first. Free, on SOS Miam.`
        : "Independent restaurants, patisseries, bars and things to do, as a list and on the map of France. Places with an SOS tonight come first. Free, on SOS Miam.",
  },
  filAriane: {
    etiquette: "Breadcrumb",
    accueil: "Home",
    lieux: "Places",
  },
  titre: "Places",
  chapo: (ville: string | null, nombreVilles: number) =>
    ville
      ? `Restaurants, patisseries and bars in ${ville} – take your pick, as a list or on the map.`
      : nombreVilles > 1
        ? `Restaurants, patisseries and bars in ${compter(nombreVilles, "city", "cities")}, ready to discover on the map.`
        : "Restaurants, patisseries and bars, ready to discover on the map.",
  recherche: {
    etiquette: "Search for a place",
    indication: "A name, a neighbourhood, a dish…",
    bouton: "Search",
    resultat: (recherche: string) => `Your search: ${citer(recherche, "en")}`,
    effacer: "Clear the search",
  },
  filtres: {
    ville: "City",
    partout: "Everywhere",
    autresVilles: "Other cities",
    autresVillesTitre: "All the other cities",
    nombre: (nombre: number) => compter(nombre, "place", "places"),
    envieDe: "In the mood for",
    tout: "All",
  },
  compte: (total: number) => `${compter(total, "place", "places")} · the ones with an SOS tonight first`,
  liste: "The list of places",
  pagination: {
    etiquette: "List pages",
    precedents: "Previous",
    suivants: "Next",
    page: (numero: number) => `Page ${numero}`,
    pageSur: (page: number, pages: number) => `Page ${page} of ${pages}`,
    note: "24 places per page: enough to plan a few evenings.",
  },
  vues: {
    etiquette: "View",
    liste: "List",
    carte: "Map",
  },
  etats: {
    bientot: {
      titre: "The map of places is coming very soon",
      texte: "This page is still settling into the kitchen – check back in a little while. In the meantime, the home page already has a few gems for you.",
      lien: "See the gems on the home page",
    },
    indisponible: {
      titre: "Places are taking a little break",
      texte: "We can't show the list right now. Check back in a moment!",
      lien: "Try again",
    },
    aucun: {
      titre: "Nothing here… for now",
      texte: (recherche: string | null) =>
        recherche
          ? `No place matches ${citer(recherche, "en")}. Try another word, or remove a filter.`
          : "No places with these filters yet. Try another city or another mood – the Brigade spots new ones every week.",
      lien: "See all places",
    },
  },
  presDeMoi: {
    bouton: "Near me",
    recherche: "Finding where you are…",
    refus: "No worries – just pick a city from the list.",
    indisponible: "We couldn't find your location. Pick a city from the list.",
    horsDeFrance: "Looks like you're outside France – pick a city from the list.",
    tropDeDemandes: "Too many tries in a row – try again in a few minutes.",
    erreur: "Finding your city didn't work. Pick it from the list.",
    aucune: (commune: string) => `No places around you yet (${commune}). Pick a city from the list – the Brigade's on it!`,
    voisine: (commune: string, ville: string) => `No places in your town yet (${commune}) – here's ${ville}, the closest one we know.`,
    dejaLa: (ville: string) => `You're already looking at ${ville}.`,
    trouvee: (ville: string) => `Off to ${ville}!`,
  },
};
