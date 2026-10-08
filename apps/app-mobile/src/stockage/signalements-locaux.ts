// Signalements faits dans l'app, gardés sur le téléphone en attendant l'API :
// ils partiront à la modération (logiciel de gestion) quand l'app sera reliée au serveur.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Signalement } from "@sos-miam/commun/types/signalement";
import { estSignalementValide } from "@sos-miam/commun/validation/est-signalement-valide";

const CLE = "sosmiam.signalements";
// Au-delà, on ne garde que les plus récents (le téléphone n'est pas une base de données)
const MAXIMUM = 200;

/** Lit les signalements gardés sur le téléphone (liste vide si rien, ou illisible). */
export async function lireSignalementsLocaux(): Promise<Signalement[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lus: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(lus) ? lus.filter(estSignalementValide) : [];
  } catch {
    return [];
  }
}

/** Ajoute un signalement à ceux gardés sur le téléphone. */
export async function ajouterSignalementLocal(signalement: Signalement): Promise<void> {
  const signalements = await lireSignalementsLocaux();
  await AsyncStorage.setItem(CLE, JSON.stringify([...signalements, signalement].slice(-MAXIMUM)));
}
