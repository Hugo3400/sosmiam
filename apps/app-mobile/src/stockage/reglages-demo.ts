// Réglages des Coulisses de la démo des visites (en développement seulement) : vraie position ou position de démo,
// lieux qui répondent tout seuls, avis en accéléré, pépin réservé. Lus et écrits par services/demo/reglages-demo-vivants.ts.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PepinDemo, ReglagesDemo } from "~/services/demo/types-demo";

const CLE = "sosmiam.demo-reglages";

const PEPINS: readonly PepinDemo[] = ["hors-zone", "position-imprecise", "refus-lieu", "hors-ligne", "qr-expire"];

/** Tout coupé : position de démo (30 m du lieu), aucune réponse automatique, avis au bout d'une heure, aucun pépin */
export const REGLAGES_DEMO_DEFAUT: ReglagesDemo = {
  vraiePosition: false,
  lieuxRepondentSeuls: false,
  avisAccelere: false,
  pepin: null,
};

/** Lit les réglages de démo gardés sur le téléphone (null si rien, ou illisible). */
export async function lireReglagesDemoEnregistres(): Promise<ReglagesDemo | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<ReglagesDemo> | null;
    if (!lu || typeof lu !== "object") return null;
    const oui = (v: unknown) => v === true;
    return {
      vraiePosition: oui(lu.vraiePosition),
      lieuxRepondentSeuls: oui(lu.lieuxRepondentSeuls),
      avisAccelere: oui(lu.avisAccelere),
      pepin: PEPINS.find((p) => p === lu.pepin) ?? null,
    };
  } catch {
    return null;
  }
}

/** Enregistre les réglages de démo sur le téléphone. */
export async function enregistrerReglagesDemo(reglages: ReglagesDemo): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(reglages));
}

/** Efface les réglages de démo du téléphone. */
export async function effacerReglagesDemo(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
