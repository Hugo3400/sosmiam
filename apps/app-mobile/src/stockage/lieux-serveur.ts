// La dernière liste des lieux lue sur le serveur, gardée sur le téléphone : l'app s'ouvre tout de suite (et hors ligne)
// avec elle, puis la relit. Ce sont des données publiques (lieux publiés), rien de personnel.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LieuApi } from "@sos-miam/commun/types/lieu";

const CLE = "sosmiam.lieux-serveur";

export async function lireLieuxServeur(): Promise<LieuApi[] | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    return Array.isArray(lu) ? (lu as LieuApi[]) : null;
  } catch {
    return null;
  }
}

export async function enregistrerLieuxServeur(lieux: LieuApi[]): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(lieux)).catch(() => {});
}
