import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";

export type AlerteGardeeMiamSafe = { id: number; envoyeeLe: number; telephones: number | null; statut: StatutAlerteMiamSafe };

const DUREE_GARDE_MS = 2 * 3600_000;

const alertes = new Map<string, AlerteGardeeMiamSafe>();

function ecrireCle(source: string, lieuId: number): string {
  return `${source}:${lieuId}`;
}

export function lireAlerteGardeeMiamSafe(source: string, lieuId: number, maintenant = Date.now()): AlerteGardeeMiamSafe | null {
  const cle = ecrireCle(source, lieuId);
  const alerte = alertes.get(cle);
  if (!alerte) return null;
  if (maintenant - alerte.envoyeeLe > DUREE_GARDE_MS) {
    alertes.delete(cle);
    return null;
  }
  return alerte;
}

export function garderAlerteMiamSafe(source: string, lieuId: number, alerte: AlerteGardeeMiamSafe) {
  alertes.set(ecrireCle(source, lieuId), alerte);
}

export function noterStatutAlerteMiamSafe(source: string, lieuId: number, alerteId: number, statut: StatutAlerteMiamSafe) {
  const alerte = alertes.get(ecrireCle(source, lieuId));
  if (alerte?.id === alerteId) alerte.statut = statut;
}

export function oublierAlerteMiamSafe(source: string, lieuId: number) {
  alertes.delete(ecrireCle(source, lieuId));
}
