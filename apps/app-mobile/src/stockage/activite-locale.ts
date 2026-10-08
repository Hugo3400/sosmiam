// Ce que la personne fait dans l'app (rescousses de la semaine, lieux gardés), gardé sur le téléphone en attendant l'API.
// Rien de sensible : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActiviteLocale = {
  /** Semaine des rescousses (date de son lundi, voir calculerCleSemaine) */
  semaine: string;
  /** Lieux qui ont reçu une rescousse cette semaine */
  rescousses: number[];
  /** Lieux gardés pour plus tard */
  gardes: number[];
};

const CLE = "sosmiam.activite";

/** Lit l'activité gardée sur le téléphone (null si rien, ou illisible). */
export async function lireActiviteLocale(): Promise<ActiviteLocale | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<ActiviteLocale>;
    const liste = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : []);
    return typeof lu.semaine === "string" ? { semaine: lu.semaine, rescousses: liste(lu.rescousses), gardes: liste(lu.gardes) } : null;
  } catch {
    return null;
  }
}

/** Enregistre l'activité sur le téléphone. */
export async function enregistrerActiviteLocale(activite: ActiviteLocale): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(activite));
}
