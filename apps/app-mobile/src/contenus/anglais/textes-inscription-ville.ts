import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INSCRIPTION_VILLE } from "~/contenus/textes-inscription-ville";

export const TEXTES_INSCRIPTION_VILLE_ANGLAIS: Traduction<typeof TEXTES_INSCRIPTION_VILLE> = {
  erreurs: {
    refus: "No worries, your location stays yours. Just type your city below.",
    "refus-definitif":
      "You said no to sharing your location, and that's your right! If you change your mind, it's in your phone's Settings app. Otherwise, just type your city below.",
    coupee: "Location is turned off on your phone. Turn it on in your phone's Settings app, or just type your city below.",
    introuvable: "We couldn't find your city. Just type it below.",
    "reglages-fermes": "Settings wouldn't open – you'll find them in your phone's Settings app. Or just type your city below.",
  },
  caracteres: "Just letters here – no postcode or symbols, the name of your city is enough.",
  incomplet: "A bit's missing – type the full name of your city.",
  notePosition: "Your location is only used to find the name of your city. We don't keep it.",
  villesProposees: (n: number) => (n === 1 ? "1 city suggested, just above the field" : `${n} cities suggested, just above the field`),
  villeTrouvee: (ville: string) => `City found: ${ville}`,
  titre: "Where in France are you?",
  sousTitre: "Living here or just visiting? Pick the city you're in.",
  utiliserPosition: "Use my location",
  indicePosition: "Finds your city using your phone's location, read just once",
  rechercheEnCours: "Finding your city…",
  ouvrirReglages: "Open the Settings app",
  ou: "or",
  indiceVille: "Chooses this city",
  ecrisTaVille: "Type your city",
};
