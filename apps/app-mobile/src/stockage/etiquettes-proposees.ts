import AsyncStorage from "@react-native-async-storage/async-storage";

type Propositions = Record<string, string[]>;

const CLE = "sosmiam.etiquettes-proposees";

let enMemoire: Propositions | null = null;

function garderLisibles(lu: unknown): Propositions {
  if (!lu || typeof lu !== "object") return {};
  return Object.fromEntries(
    Object.entries(lu as Record<string, unknown>)
      .filter(([cle, noms]) => /^\d{1,9}$/.test(cle) && Array.isArray(noms))
      .map(([cle, noms]) => [cle, (noms as unknown[]).filter((n): n is string => typeof n === "string").slice(0, 50)]),
  );
}

async function lireToutes(): Promise<Propositions> {
  if (enMemoire) return enMemoire;
  try {
    const brut = await AsyncStorage.getItem(CLE);
    enMemoire = garderLisibles(brut ? JSON.parse(brut) : null);
  } catch {
    enMemoire = {};
  }
  return enMemoire;
}

export async function lireEtiquettesProposees(lieuId: number): Promise<string[]> {
  return (await lireToutes())[String(lieuId)] ?? [];
}

export async function ajouterEtiquetteProposee(lieuId: number, nom: string): Promise<void> {
  const toutes = await lireToutes();
  const deja = toutes[String(lieuId)] ?? [];
  if (deja.includes(nom)) return;
  enMemoire = { ...toutes, [String(lieuId)]: [...deja, nom] };
  await AsyncStorage.setItem(CLE, JSON.stringify(enMemoire));
}
