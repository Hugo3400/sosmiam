// Visite sans compte (« Juste jeter un œil ») : le choix est gardé sur le téléphone, pour retrouver le fil au prochain
// lancement sans repasser par la bienvenue. Rien d'autre n'est gardé : ni âge, ni nom, ni position.
// Effacé dès que la personne s'inscrit, efface ses données, ou quand un verrou d'âge est posé sur ce téléphone.
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.invite";

/** Vrai si une visite sans compte était en cours sur ce téléphone (faux si rien, ou illisible). */
export async function lireModeInvite(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLE)) === "1";
  } catch {
    return false;
  }
}

/** Retient que la personne visite sans compte. */
export async function enregistrerModeInvite(): Promise<void> {
  await AsyncStorage.setItem(CLE, "1");
}

/** Oublie la visite sans compte. */
export async function effacerModeInvite(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
