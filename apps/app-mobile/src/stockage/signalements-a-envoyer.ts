// Les signalements de publications pas encore partis à la modération (pas de réseau au moment de signaler) : renvoyés au
// prochain lancement de l'app. Ils ne disent pas qui les a faits.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Signalement } from "@sos-miam/commun/types/signalement";
import { estSignalementValide } from "@sos-miam/commun/validation/est-signalement-valide";

const CLE = "sosmiam.signalements-a-envoyer";
const MAXIMUM = 50;

export async function lireSignalementsAEnvoyer(): Promise<Signalement[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lus: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(lus) ? lus.filter(estSignalementValide) : [];
  } catch {
    return [];
  }
}

export async function remplacerSignalementsAEnvoyer(liste: Signalement[]): Promise<void> {
  if (liste.length === 0) return void (await AsyncStorage.removeItem(CLE).catch(() => {}));
  await AsyncStorage.setItem(CLE, JSON.stringify(liste.slice(-MAXIMUM))).catch(() => {});
}
