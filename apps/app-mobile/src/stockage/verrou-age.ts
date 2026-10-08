// Verrou d'âge : quand une date de naissance donne moins que l'âge minimum, l'inscription est bloquée sur ce téléphone
// jusqu'à l'anniversaire, même si on revient changer la date. Rangé dans le coffre-fort du téléphone (Trousseau iOS, qui
// survit à une désinstallation ; Keystore Android). On ne garde que la date de fin du verrou, jamais la date de naissance.
// Sur le web (aperçu de développement seulement), pas de coffre-fort : AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";

const CLE = "sosmiam.verrou-age";
const surLeWeb = Platform.OS === "web";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const lire = () => (surLeWeb ? AsyncStorage.getItem(CLE) : SecureStore.getItemAsync(CLE));

/** Date de fin du verrou (« AAAA-MM-JJ ») s'il est encore actif, sinon null (un verrou passé est effacé). */
export async function lireVerrouAge(aujourdhui: Date = new Date()): Promise<string | null> {
  try {
    const jusqua = await lire();
    if (!jusqua || !DATE.test(jusqua)) return null;
    if (jusqua > formaterDateIso(aujourdhui)) return jusqua;
    await (surLeWeb ? AsyncStorage.removeItem(CLE) : SecureStore.deleteItemAsync(CLE));
    return null;
  } catch {
    return null;
  }
}

/** Pose le verrou jusqu'à cette date ; un verrou déjà posé plus loin n'est jamais raccourci. */
export async function poserVerrouAge(jusqua: string): Promise<void> {
  const actuel = await lireVerrouAge();
  if (actuel && actuel >= jusqua) return;
  await (surLeWeb ? AsyncStorage.setItem(CLE, jusqua) : SecureStore.setItemAsync(CLE, jusqua));
}

/** Lève le verrou. Réservé au mode développement (bouton de l'écran bloqué, pour les tests) : en production, rien ne le lève avant la date. */
export async function leverVerrouAge(): Promise<void> {
  await (surLeWeb ? AsyncStorage.removeItem(CLE) : SecureStore.deleteItemAsync(CLE));
}
