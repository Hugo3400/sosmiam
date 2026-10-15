import AsyncStorage from "@react-native-async-storage/async-storage";

const CLE = "sosmiam.cloche-effacee";

export const NOMBRE_MAX_EFFACEES = 200;

export type ClocheEffacee = { ids: string[]; jusqua: string | null };

export const CLOCHE_EFFACEE_VIDE: ClocheEffacee = { ids: [], jusqua: null };

const estDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

export async function lireClocheEffacee(compteCreeLe: string): Promise<ClocheEffacee> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return CLOCHE_EFFACEE_VIDE;
    const lu = JSON.parse(brut) as Partial<Record<"compteCreeLe" | "ids" | "jusqua", unknown>>;
    if (lu.compteCreeLe !== compteCreeLe) return CLOCHE_EFFACEE_VIDE;
    const ids = Array.isArray(lu.ids) ? [...new Set(lu.ids.filter((id): id is string => typeof id === "string" && id !== ""))].slice(-NOMBRE_MAX_EFFACEES) : [];
    return { ids, jusqua: estDate(lu.jusqua) ? lu.jusqua : null };
  } catch {
    return CLOCHE_EFFACEE_VIDE;
  }
}

export async function enregistrerClocheEffacee(compteCreeLe: string, effacee: ClocheEffacee): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify({ compteCreeLe, ...effacee })).catch(() => {});
}

export async function effacerClocheEffacee(): Promise<void> {
  await AsyncStorage.removeItem(CLE).catch(() => {});
}
