import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_LOCALISATION_ANGLAIS } from "~/contenus/anglais/textes-localisation";

export const TEXTES_LOCALISATION = {
  depuisToi: "de toi",
  distanceDepuis: (distance: string, depuis: string) => `${distance} ${depuis}`,
  repliDistances: (depuisVille: string) => `les distances repartent ${depuisVille}`,
  zoneProche: (rayonKm: number, autourDe: string) => `à moins de ${rayonKm} km ${autourDe}`,
  zoneFrance: "dans toute la France",
  dansRegion: (region: string) => `en ${region}`,
  regionsParticulieres: {
    "Grand Est": "dans le Grand Est",
    "Hauts-de-France": "dans les Hauts-de-France",
    "Pays de la Loire": "dans les Pays de la Loire",
    "La Réunion": "à La Réunion",
    Mayotte: "à Mayotte",
  } as Readonly<Record<string, string>>,
  cheminLocalisationIos: "Réglages > Confidentialité et sécurité > Service de localisation",
  cheminLocalisationAndroid: "les réglages du téléphone (Localisation)",
  enAttendant: (repli: string) => ` En attendant, ${repli}.`,
  coupee: (chemin: string, enAttendant: string) => `Ta localisation est éteinte : allume-la dans ${chemin}.${enAttendant}`,
  refusDefinitif: (enAttendant: string) => `SOS Miam n'a pas accès à ta position : tu peux l'autoriser dans les réglages du téléphone.${enAttendant}`,
  introuvableActualisation: "On ne te retrouve pas pour l'instant : on garde ta position d'avant.",
  introuvable: "On ne te trouve pas pour l'instant : réessaie dans un instant.",
  refusSansActualisation: "Pas de souci : la liste suit tes envies 💛",
  oublieeAvecRepli: (repli: string) => `Pas de souci : ta position est oubliée, ${repli} 💛`,
  oubliee: "Pas de souci : ta position est oubliée 💛",
  alerte: {
    titre: "Autour de moi",
    plusTard: "Plus tard",
    ouvrirReglages: "Ouvrir les réglages",
    compris: "Compris",
  },
};

export const TEXTES_LOCALISATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LOCALISATION>> = { fr: TEXTES_LOCALISATION, en: TEXTES_LOCALISATION_ANGLAIS };
