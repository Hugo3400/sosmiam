// « Petite vérif' de position » : on retient seulement que la personne a lu l'explication et touché « OK, vérifie »,
// pour ne pas la lui remontrer à chaque addition. Jamais la position elle-même : elle n'est gardée nulle part.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.explication-position-vue";

// Relu une seule fois par lancement, puis gardé en mémoire (l'addition doit partir sans attendre le stockage)
let vueEnMemoire: boolean | null = null;

/** Vrai si l'explication de la position a déjà été acceptée sur ce téléphone (faux si rien, ou illisible). */
export async function lireExplicationPositionVue(): Promise<boolean> {
  if (vueEnMemoire !== null) return vueEnMemoire;
  try {
    vueEnMemoire = (await AsyncStorage.getItem(CLE)) === "1";
  } catch {
    vueEnMemoire = false;
  }
  return vueEnMemoire;
}

/** Retient que l'explication a été acceptée (« OK, vérifie »). */
export async function enregistrerExplicationPositionVue(): Promise<void> {
  vueEnMemoire = true;
  try {
    await AsyncStorage.setItem(CLE, "1");
  } catch {
    // Pas grave : on la remontrera au prochain lancement
  }
}

/** Oublie que l'explication a été vue (« Tout effacer ») : elle sera remontrée à la prochaine addition. */
export async function effacerExplicationPositionVue(): Promise<void> {
  vueEnMemoire = false;
  await AsyncStorage.removeItem(CLE);
}
