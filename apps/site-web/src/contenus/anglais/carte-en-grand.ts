import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CARTE_EN_GRAND } from "~/contenus/carte-en-grand";

export const TEXTES_CARTE_EN_GRAND_ANGLAIS: Traduction<typeof TEXTES_CARTE_EN_GRAND> = {
  meta: {
    titre: (nom: string, ville: string) => `The menu at ${nom} in ${ville}`,
    description: (nom: string, rubriques: string) => `The menu at ${nom} on SOS Miam: ${rubriques}.`,
    introuvable: "Menu not found — SOS Miam",
  },
  filAriane: {
    accueil: "Home",
    carte: "The menu",
  },
  titre: { carte: "The menu", formules: "The packages" },
  sousTitre: (nom: string, date: string | null) => (date ? `${nom} · updated by the venue on ${date}` : nom),
  imprimer: "Print",
  fermer: "Close",
  retourFiche: (nom: string) => ` the menu and go back to the page for ${nom}`,
  rubriques: "Menu sections",
  recherche: {
    etiquette: "Search the menu",
    indication: "Search for a dish, a drink…",
  },
  filtres: {
    etiquette: "Filter the menu",
    sansAlcool: "Alcohol-free",
    toutAfficher: "Show everything",
  },
  resultats: (nombre: number) =>
    nombre === 0 ? "Nothing on screen for these choices." : `${nombre} ${accorder(nombre, "en", "dish or drink", "dishes and drinks")} on screen`,
  aucunResultat: "Nothing matches. Try another word or remove a filter – the menu has plenty of other gems.",
  piedDePage: "Prices, dishes and drinks are the ones the venue has put on SOS Miam. Allergens: ask the staff.",
};
