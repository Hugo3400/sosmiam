import AsyncStorage from "@react-native-async-storage/async-storage";

import { ajouterAnnonceVue } from "~/fonctions/annonces-app/ajouter-annonce-vue";

const CLE = "sosmiam.annonces-app-deja-vues";
const PLAFOND = 200;

let enMemoire: number[] | null = null;

function garderIdentifiants(brut: string | null): number[] {
  if (!brut) return [];
  const lu: unknown = JSON.parse(brut);
  if (!Array.isArray(lu)) throw new Error("Pop-ups vues illisibles");
  return lu.filter((id): id is number => Number.isSafeInteger(id)).slice(-PLAFOND);
}

export async function lireAnnoncesAppVues(): Promise<readonly number[]> {
  if (enMemoire) return enMemoire;
  const brut = await AsyncStorage.getItem(CLE);
  enMemoire ??= garderIdentifiants(brut);
  return enMemoire;
}

export async function noterAnnonceAppVue(id: number): Promise<void> {
  enMemoire = ajouterAnnonceVue(await lireAnnoncesAppVues(), id, PLAFOND);
  await AsyncStorage.setItem(CLE, JSON.stringify(enMemoire));
}
