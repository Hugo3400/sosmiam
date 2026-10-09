// Le magasin de la démo des visites (en développement seulement) : visites, cartes, réservations, avis et espace
// ambassadeur joués sur le téléphone. Il n'est lu et écrit que par services/demo/magasin-demo.ts ; jamais importé
// dans un vrai compte. Rien de sensible (aucune position n'y est gardée) : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MagasinDemo } from "~/services/demo/types-demo";

const CLE = "sosmiam.demo-visites";

const LISTES: readonly (keyof MagasinDemo)[] = [
  "figurants",
  "visites",
  "presentations",
  "programmes",
  "cartes",
  "reservations",
  "avis",
  "avisARelire",
  "relectures",
  "missions",
  "messages",
  "journal",
  "contestations",
];

/** Lit le magasin de démo (null si rien, illisible ou d'un autre format : la démo repart alors de zéro). */
export async function lireMagasinDemo(): Promise<MagasinDemo | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<MagasinDemo> | null;
    if (!lu || lu.v !== 2 || typeof lu.creeLe !== "string" || typeof lu.prochainId !== "number") return null;
    if (LISTES.some((cle) => !Array.isArray(lu[cle]))) return null;
    return lu as MagasinDemo;
  } catch {
    return null;
  }
}

/** Enregistre le magasin de démo sur le téléphone. */
export async function enregistrerMagasinDemo(magasin: MagasinDemo): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(magasin));
}

/** Efface le magasin de démo du téléphone. */
export async function effacerMagasinDemo(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
