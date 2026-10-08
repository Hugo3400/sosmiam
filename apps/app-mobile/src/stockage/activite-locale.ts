// Ce que la personne fait dans l'app (rescousses de la semaine, lieux gardés, J'aime, publications masquées),
// gardé sur le téléphone en attendant l'API.
// Rien de sensible : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActiviteLocale = {
  /** Semaine des rescousses (date de son lundi, voir calculerCleSemaine) */
  semaine: string;
  /** Lieux qui ont reçu une rescousse cette semaine */
  rescousses: number[];
  /** Lieux gardés pour plus tard */
  gardes: number[];
  /** Publications aimées (❤️) */
  jaimes: string[];
  /** Publications masquées (« Pas intéressé », « Signaler ») */
  masques: string[];
};

const CLE = "sosmiam.activite";

/** Lit l'activité gardée sur le téléphone (null si rien, ou illisible). */
export async function lireActiviteLocale(): Promise<ActiviteLocale | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<ActiviteLocale>;
    const nombres = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : []);
    const textes = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    if (typeof lu.semaine !== "string") return null;
    return { semaine: lu.semaine, rescousses: nombres(lu.rescousses), gardes: nombres(lu.gardes), jaimes: textes(lu.jaimes), masques: textes(lu.masques) };
  } catch {
    return null;
  }
}

/** Enregistre l'activité sur le téléphone. */
export async function enregistrerActiviteLocale(activite: ActiviteLocale): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(activite));
}
