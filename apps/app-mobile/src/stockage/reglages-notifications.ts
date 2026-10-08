// Préférences de notifications, gardées sur le téléphone. Les notifications elles-mêmes arriveront avec l'API :
// ces choix seront alors appliqués.
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Sortes d'alertes qu'on peut recevoir sur les lieux (comme dans le prototype) */
export type TypeNotification = "sos" | "calme" | "offre" | "evenement" | "nouveau";

export type ReglagesNotifications = {
  /** Interrupteur général */
  actives: boolean;
  types: Record<TypeNotification, boolean>;
  /** Pas de notification la nuit (heures au format HH:MM) */
  silence: { actif: boolean; de: string; a: string };
};

export const REGLAGES_NOTIFICATIONS_PAR_DEFAUT: ReglagesNotifications = {
  actives: true,
  types: { sos: true, calme: true, offre: true, evenement: true, nouveau: true },
  silence: { actif: true, de: "23:00", a: "09:00" },
};

const CLE = "sosmiam.reglages-notifications";
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Lit les préférences (celles par défaut si rien, ou illisible). */
export async function lireReglagesNotifications(): Promise<ReglagesNotifications> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<ReglagesNotifications>) : null;
    if (!lu || typeof lu !== "object") return REGLAGES_NOTIFICATIONS_PAR_DEFAUT;
    const defaut = REGLAGES_NOTIFICATIONS_PAR_DEFAUT;
    const types = { ...defaut.types };
    for (const cle of Object.keys(types) as TypeNotification[]) {
      if (typeof lu.types?.[cle] === "boolean") types[cle] = lu.types[cle];
    }
    return {
      actives: typeof lu.actives === "boolean" ? lu.actives : defaut.actives,
      types,
      silence: {
        actif: typeof lu.silence?.actif === "boolean" ? lu.silence.actif : defaut.silence.actif,
        de: typeof lu.silence?.de === "string" && HEURE.test(lu.silence.de) ? lu.silence.de : defaut.silence.de,
        a: typeof lu.silence?.a === "string" && HEURE.test(lu.silence.a) ? lu.silence.a : defaut.silence.a,
      },
    };
  } catch {
    return REGLAGES_NOTIFICATIONS_PAR_DEFAUT;
  }
}

/** Enregistre les préférences sur le téléphone. */
export async function enregistrerReglagesNotifications(reglages: ReglagesNotifications): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(reglages));
}

/** Efface les préférences du téléphone. */
export async function effacerReglagesNotifications(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
