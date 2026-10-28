// L'activité du compte connecté (rescousses, lieux gardés, J'aime, masques, suivis), copie de la dernière réponse de l'API
// (/app/activite), et les gestes pas encore partis faute de réseau (gardes, J'aime, masques et suivis : jamais de rescousse).
// Elle sert à ouvrir l'app tout de suite et hors ligne ; l'API fait toujours foi. Effacée dès que le compte n'est plus
// connecté (déconnexion, session expirée) : une seule clé suffit. Rien de sensible : AsyncStorage suffit.
import AsyncStorage from "@react-native-async-storage/async-storage";

import { calculerProchainLundiParis } from "@sos-miam/commun/fonctions/temps/calculer-prochain-lundi-paris";
import type { ActiviteApi } from "@sos-miam/commun/types/activite";
import type { GesteActiviteEnAttente } from "@sos-miam/commun/types/geste-activite";

export type ActiviteCompteGardee = {
  version: 1;
  /** Dernière réponse de l'API (null : pas encore de réponse) */
  activite: ActiviteApi | null;
  /** Quand elle a été lue (millisecondes) ; 0 si jamais */
  luLe: number;
  /** Gestes qui attendent le réseau, dans l'ordre */
  enAttente: GesteActiviteEnAttente[];
};

const CLE = "sosmiam.activite-compte";

const nombres = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isInteger(x)) : null);
const textes = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null);
const entier = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);

/**
 * L'activité rendue par l'API, vérifiée champ par champ (null si elle ne va pas). Une API d'avant `rechargeLe` : la recharge
 * est recalculée à partir du moment de la lecture, avec la même règle que le serveur (prochain lundi à l'heure de Paris).
 */
export function lireActiviteApi(brut: unknown, luLe: number): ActiviteApi | null {
  if (typeof brut !== "object" || brut === null) return null;
  const a = brut as Record<string, unknown>;
  const [rescoussesSemaine, lieuxSauves, premiersSauvetages, gardes] = [a.rescoussesSemaine, a.lieuxSauves, a.premiersSauvetages, a.gardes].map(nombres);
  const [jaimes, masques, suivis] = [a.jaimes, a.masques, a.suivis].map(textes);
  const [restantes, rescoussesDonnees, rescoussesDuMois] = [a.restantes, a.rescoussesDonnees, a.rescoussesDuMois].map(entier);
  if (!rescoussesSemaine || !lieuxSauves || !premiersSauvetages || !gardes || !jaimes || !masques || !suivis) return null;
  if (restantes === null || rescoussesDonnees === null || rescoussesDuMois === null || typeof a.semaine !== "string") return null;
  const rechargeLe = typeof a.rechargeLe === "string" && !Number.isNaN(Date.parse(a.rechargeLe)) ? a.rechargeLe : new Date(calculerProchainLundiParis(luLe)).toISOString();
  return { semaine: a.semaine, restantes, rechargeLe, rescoussesSemaine, lieuxSauves, rescoussesDonnees, rescoussesDuMois, premiersSauvetages, gardes, jaimes, masques, suivis };
}

/** Un geste gardé, vérifié (null s'il ne va pas, ou si c'est une rescousse : elles ne se gardent jamais) */
function lireGeste(brut: unknown): GesteActiviteEnAttente | null {
  if (typeof brut !== "object" || brut === null) return null;
  const g = brut as Record<string, unknown>;
  if (typeof g.oui !== "boolean") return null;
  if (g.quoi === "garde" && typeof g.lieuId === "number") return { quoi: "garde", lieuId: g.lieuId, oui: g.oui };
  if (g.quoi === "jaime" && typeof g.publicationId === "string") return { quoi: "jaime", publicationId: g.publicationId, oui: g.oui };
  if (g.quoi === "masque" && typeof g.publicationId === "string") return { quoi: "masque", publicationId: g.publicationId, oui: g.oui };
  if (g.quoi === "suivi" && typeof g.cle === "string" && /^(lieu|createur):/.test(g.cle)) return { quoi: "suivi", cle: g.cle, oui: g.oui };
  return null;
}

/** Lit la copie gardée sur le téléphone (null si rien, ou illisible). */
export async function lireActiviteCompte(): Promise<ActiviteCompteGardee | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<Record<keyof ActiviteCompteGardee, unknown>>;
    if (lu.version !== 1) return null;
    const luLe = typeof lu.luLe === "number" && Number.isFinite(lu.luLe) ? lu.luLe : 0;
    const enAttente = Array.isArray(lu.enAttente) ? lu.enAttente.map(lireGeste).filter((g): g is GesteActiviteEnAttente => g !== null) : [];
    return { version: 1, activite: lu.activite == null ? null : lireActiviteApi(lu.activite, luLe), luLe, enAttente };
  } catch {
    return null;
  }
}

/** Enregistre la copie (les rescousses en attente n'y vont jamais). */
export async function enregistrerActiviteCompte(copie: Omit<ActiviteCompteGardee, "version">): Promise<void> {
  const enAttente = copie.enAttente.filter((g) => g.quoi !== "rescousse");
  await AsyncStorage.setItem(CLE, JSON.stringify({ version: 1, activite: copie.activite, luLe: copie.luLe, enAttente }));
}

/** Efface la copie de l'activité du compte. */
export async function effacerActiviteCompte(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
