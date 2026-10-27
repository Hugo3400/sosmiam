import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_RECHERCHE_COMMUNE } from "~/contenus/recherche-commune";
import type { ZoneFondateurs } from "~/types/compte";

export const TEXTES_RECHERCHE_COMMUNE_ANGLAIS: Traduction<typeof TEXTES_RECHERCHE_COMMUNE> = {
  messages: {
    "commune-inconnue": "We can't find that town – search for it by name.",
    panne: "The spot counter's taking a break. Try again in a moment.",
    "trop-court": "Type at least 2 letters of your town's name.",
    introuvable: (recherche: string) => `We can't find “${recherche}”. Check the spelling, or try your postcode.`,
  },
  chercher: "Search",
  rechercher: (libelle: string) => `Search ${libelle.toLowerCase()}`,
  plusieurs: "Several towns match – pick yours.",
  exemple: "e.g. Lyon, Bron, 69003…",
  suggestions: "Suggested towns",
  aucune: "No town found.",
  proposees: (nombre: number) => (nombre === 1 ? "1 town suggested." : `${nombre} towns suggested.`),
  places: {
    debut: (zone: ZoneFondateurs) => (zone.type === "departement" ? `Your town comes under ${zone.nom}` : zone.nom),
    unePlace: (debut: string, libre: boolean) => `${debut}: 1\u00a0spot, ${libre ? "still free" : "already taken"}`,
    toutesPrises: (debut: string, places: number) => `${debut}: all ${places}\u00a0spots are taken`,
    libres: (debut: string, libres: number, places: number) => `${debut}: ${libres === 1 ? "1\u00a0spot free" : `${libres}\u00a0spots free`} out of ${places}`,
  },
};
