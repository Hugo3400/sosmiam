// Notifications de l'app (« … te suit », demande acceptée, nouveauté d'un compte suivi), gardées sur le téléphone
// en attendant l'API (démo). Rien de sensible : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { NotificationSuivi } from "@sos-miam/commun/types/suivis";

/** Limite technique de la démo : au-delà, les plus anciennes partent */
export const NOMBRE_MAX_NOTIFICATIONS = 50;

export type NotificationsLocales = {
  /** Version du format, pour les reprises futures */
  version: 1;
  /** Profil.creeLe du profil pour lequel la démo a été créée : un autre profil repart d'une démo neuve */
  profilCreeLe: string;
  /** De la plus récente à la plus ancienne, NOMBRE_MAX_NOTIFICATIONS au plus */
  notifications: NotificationSuivi[];
  /** Dernière visite de l'écran Notifications (ISO), null avant la première */
  vuesLe: string | null;
  /** Clés « lieu: » et « createur: » déjà annoncées une fois (démo « a posté ») : elles ne déclenchent plus rien */
  clesAnnoncees: string[];
};

const CLE = "sosmiam.notifications";

const estTexte = (v: unknown): v is string => typeof v === "string" && v !== "";

/** Une notification bien formée, ou null (on l'écarte plutôt que de planter) */
function lireNotification(brute: unknown): NotificationSuivi | null {
  if (!brute || typeof brute !== "object") return null;
  const n = brute as Record<string, unknown>;
  if (!estTexte(n.id) || !estTexte(n.date) || Number.isNaN(Date.parse(n.date))) return null;
  const base = { id: n.id, date: n.date };
  switch (n.type) {
    case "nouvel-abonne":
      return estTexte(n.cle) ? { ...base, type: "nouvel-abonne", cle: n.cle, enRetour: n.enRetour === true } : null;
    case "demande-acceptee":
      return estTexte(n.cle) ? { ...base, type: "demande-acceptee", cle: n.cle } : null;
    case "nouvelle-publication":
      return estTexte(n.cle) && estTexte(n.publicationId) ? { ...base, type: "nouvelle-publication", cle: n.cle, publicationId: n.publicationId } : null;
    case "majorite":
      return { ...base, type: "majorite" };
    default:
      return null;
  }
}

/** Lit les notifications gardées sur le téléphone (null si rien, ou illisible : la démo repart alors de zéro). */
export async function lireNotificationsLocales(): Promise<NotificationsLocales | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<Record<keyof NotificationsLocales, unknown>>;
    if (lu.version !== 1 || !estTexte(lu.profilCreeLe)) return null;
    // Bien formées, sans doublon (même identifiant), de la plus récente à la plus ancienne
    const parId = new Map<string, NotificationSuivi>();
    for (const brute of Array.isArray(lu.notifications) ? lu.notifications : []) {
      const n = lireNotification(brute);
      if (n && !parId.has(n.id)) parId.set(n.id, n);
    }
    const notifications = [...parId.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, NOMBRE_MAX_NOTIFICATIONS);
    const clesAnnoncees = Array.isArray(lu.clesAnnoncees) ? [...new Set(lu.clesAnnoncees.filter(estTexte))] : [];
    const vuesLe = estTexte(lu.vuesLe) && !Number.isNaN(Date.parse(lu.vuesLe)) ? lu.vuesLe : null;
    return { version: 1, profilCreeLe: lu.profilCreeLe, notifications, vuesLe, clesAnnoncees };
  } catch {
    return null;
  }
}

/** Enregistre les notifications sur le téléphone. */
export async function enregistrerNotificationsLocales(etat: NotificationsLocales): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(etat));
}

/** Efface les notifications du téléphone. */
export async function effacerNotificationsLocales(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
