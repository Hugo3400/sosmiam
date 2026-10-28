import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_LOCALISATION } from "~/contenus/textes-localisation";

export const TEXTES_LOCALISATION_ANGLAIS: Traduction<typeof TEXTES_LOCALISATION> = {
  depuisToi: "you",
  distanceDepuis: (distance: string, depuis: string) => `${distance} from ${depuis}`,
  repliDistances: (depuisVille: string) => `distances count from ${depuisVille} again`,
  zoneProche: (rayonKm: number, autourDe: string) => `within ${rayonKm} km of ${autourDe}`,
  zoneFrance: "all over France",
  dansRegion: (region: string) => `in ${region}`,
  regionsParticulieres: {
    "Grand Est": "in Grand Est",
    "Hauts-de-France": "in Hauts-de-France",
    "Pays de la Loire": "in Pays de la Loire",
    "La Réunion": "in La Réunion",
    Mayotte: "in Mayotte",
  },
  cheminLocalisationIos: "your phone's Settings app (Privacy & Security › Location Services)",
  cheminLocalisationAndroid: "your phone's Settings app (Location)",
  enAttendant: (repli: string) => ` In the meantime, ${repli}.`,
  coupee: (chemin: string, enAttendant: string) => `Your location is switched off. Turn it on in ${chemin}.${enAttendant}`,
  refusDefinitif: (enAttendant: string) => `SOS Miam can't access your location. You can allow it in your phone's Settings app.${enAttendant}`,
  introuvableActualisation: "We can't find you right now, so we're keeping your previous location.",
  introuvable: "We can't find you right now. Try again in a moment.",
  refusSansActualisation: "No worries – the list follows what you're into 💛",
  oublieeAvecRepli: (repli: string) => `No worries – your location's been forgotten and ${repli} 💛`,
  oubliee: "No worries – your location's been forgotten 💛",
  alerte: {
    titre: "Near me",
    plusTard: "Not now",
    ouvrirReglages: "Open phone settings",
    compris: "Got it",
  },
};
