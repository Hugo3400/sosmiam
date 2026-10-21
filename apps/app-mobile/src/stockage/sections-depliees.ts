import AsyncStorage from "@react-native-async-storage/async-storage";

export type IdSectionPliable =
  | "defis"
  | "badges"
  | "palier"
  | "collection"
  | "parametres-compte"
  | "parametres-securite"
  | "parametres-vie"
  | "parametres-aide"
  | "parametres-donnees";

type SectionsDepliees = Partial<Record<IdSectionPliable, boolean>>;

const CLE = "sosmiam.sections-depliees";
const DEPLIEES_PAR_DEFAUT: Record<IdSectionPliable, boolean> = {
  defis: false,
  badges: false,
  palier: true,
  collection: true,
  "parametres-compte": true,
  "parametres-securite": true,
  "parametres-vie": true,
  "parametres-aide": true,
  "parametres-donnees": true,
};
const SECTIONS = Object.keys(DEPLIEES_PAR_DEFAUT) as IdSectionPliable[];

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

export function lireSectionDeplieeEnMemoire(section: IdSectionPliable): boolean {
  return enMemoire?.[section] ?? DEPLIEES_PAR_DEFAUT[section];
}

export async function lireSectionDepliee(section: IdSectionPliable): Promise<boolean> {
  return (await lireToutes())[section] ?? DEPLIEES_PAR_DEFAUT[section];
}

export async function enregistrerSectionDepliee(section: IdSectionPliable, deplie: boolean): Promise<void> {
  enMemoire = { ...(await lireToutes()), [section]: deplie };
  await AsyncStorage.setItem(CLE, JSON.stringify(enMemoire));
}
