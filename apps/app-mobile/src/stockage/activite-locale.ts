// Ce que la personne fait dans l'app (rescousses, lieux gardés, J'aime, publications masquées, lieux et créateurs suivis),
// gardé sur le téléphone en attendant l'API.
// Rien de sensible : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Une rescousse donnée (et pas reprise) : à quel lieu, et quelle semaine */
export type RescousseDonnee = { lieu: number; semaine: string };

export type ActiviteLocale = {
  /** Semaine des rescousses (date de son lundi, voir calculerCleSemaine) */
  semaine: string;
  /** Lieux qui ont reçu une rescousse cette semaine */
  rescousses: number[];
  /** Toutes les rescousses données depuis l'inscription (lieux sauvés, points du programme Ambassadeurs) */
  historique: RescousseDonnee[];
  /** Lieux dont la personne a été le premier sauveteur (« Déniché par ») */
  premiersSauvetages: number[];
  /** Lieux gardés pour plus tard */
  gardes: number[];
  /** Publications aimées (❤️) */
  jaimes: string[];
  /** Publications masquées (« Pas intéressé », « Signaler ») */
  masques: string[];
  /** Lieux et créateurs suivis, du plus ancien au plus récent : « lieu:<id> » ou « createur:<pseudo> » (voir calculerCleSuivi) */
  suivis: string[];
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
    const semaine = lu.semaine;
    const rescousses = nombres(lu.rescousses);
    // Données d'avant l'historique : on le reconstruit avec les rescousses de la semaine
    const historique = Array.isArray(lu.historique)
      ? lu.historique.filter((r): r is RescousseDonnee => typeof r?.lieu === "number" && typeof r?.semaine === "string")
      : rescousses.map((lieu) => ({ lieu, semaine }));
    return {
      semaine,
      rescousses,
      historique,
      premiersSauvetages: nombres(lu.premiersSauvetages),
      gardes: nombres(lu.gardes),
      jaimes: textes(lu.jaimes),
      masques: textes(lu.masques),
      // Données d'avant les suivis : personne de suivi pour l'instant
      suivis: textes(lu.suivis),
    };
  } catch {
    return null;
  }
}

/** Enregistre l'activité sur le téléphone. */
export async function enregistrerActiviteLocale(activite: ActiviteLocale): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(activite));
}

/** Efface toute l'activité du téléphone. */
export async function effacerActiviteLocale(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
