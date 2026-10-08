// Dernier mode de l'app (perso, pro ou ambassadeur) et lieu choisi en mode pro, gardés sur le téléphone pour y revenir
// au prochain lancement. Ça ne donne aucun droit : les rôles sont relus à chaque demande (voir FournisseurModes).
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ModeApp } from "@sos-miam/commun/types/roles";

export type ModeAppGarde = {
  dernierMode: ModeApp;
  /** Lieu choisi en mode pro (quand on en gère plusieurs) ; null : le premier de la liste */
  lieuProId: number | null;
};

export const MODE_APP_PAR_DEFAUT: ModeAppGarde = { dernierMode: "perso", lieuProId: null };

const CLE = "sosmiam.mode-app";
const MODES: readonly ModeApp[] = ["perso", "pro", "ambassadeur"];

/** Lit le dernier mode (le mode perso si rien, ou illisible). */
export async function lireModeApp(): Promise<ModeAppGarde> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<ModeAppGarde> | null) : null;
    if (!lu || typeof lu !== "object") return MODE_APP_PAR_DEFAUT;
    return {
      dernierMode: MODES.includes(lu.dernierMode as ModeApp) ? (lu.dernierMode as ModeApp) : "perso",
      lieuProId: typeof lu.lieuProId === "number" && Number.isInteger(lu.lieuProId) ? lu.lieuProId : null,
    };
  } catch {
    return MODE_APP_PAR_DEFAUT;
  }
}

/** Retient le mode et le lieu choisis. */
export async function enregistrerModeApp(mode: ModeAppGarde): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(mode));
}

/** Oublie le mode (retour au mode perso au prochain lancement). */
export async function effacerModeApp(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
