// La première page du fil lue sur le serveur, gardée sur le téléphone : le fil s'ouvre tout de suite (et hors ligne) avec
// elle, puis la relit. Des publications publiques, rien de personnel.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PublicationApi } from "@sos-miam/commun/types/publication";

const CLE = "sosmiam.publications-serveur";

export async function lirePublicationsServeur(): Promise<PublicationApi[] | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    return Array.isArray(lu) ? (lu as PublicationApi[]) : null;
  } catch {
    return null;
  }
}

export async function enregistrerPublicationsServeur(publications: PublicationApi[]): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(publications)).catch(() => {});
}
