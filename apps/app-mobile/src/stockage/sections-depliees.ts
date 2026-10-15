import AsyncStorage from "@react-native-async-storage/async-storage";

export type IdSectionPliable = "defis" | "badges";

type SectionsDepliees = Partial<Record<IdSectionPliable, boolean>>;

const CLE = "sosmiam.sections-depliees";
const SECTIONS: readonly IdSectionPliable[] = ["defis", "badges"];

let enMemoire: SectionsDepliees | null = null;

function garderChoixLisibles(lu: unknown): SectionsDepliees {
  if (!lu || typeof lu !== "object") return {};
  const choix = lu as Record<string, unknown>;
  return Object.fromEntries(SECTIONS.filter((s) => typeof choix[s] === "boolean").map((s) => [s, choix[s]]));
}

async function lireToutes(): Promise<SectionsDepliees> {
  if (enMemoire) return enMemoire;
  try {
    const brut = await AsyncStorage.getItem(CLE);
    enMemoire = garderChoixLisibles(brut ? JSON.parse(brut) : null);
  } catch {
    enMemoire = {};
  }
  return enMemoire;
}

export function lireSectionDeplieeEnMemoire(section: IdSectionPliable): boolean | null {
  return enMemoire?.[section] ?? null;
}

export async function lireSectionDepliee(section: IdSectionPliable): Promise<boolean> {
  return (await lireToutes())[section] ?? false;
}

export async function enregistrerSectionDepliee(section: IdSectionPliable, deplie: boolean): Promise<void> {
  enMemoire = { ...(await lireToutes()), [section]: deplie };
  await AsyncStorage.setItem(CLE, JSON.stringify(enMemoire));
}
