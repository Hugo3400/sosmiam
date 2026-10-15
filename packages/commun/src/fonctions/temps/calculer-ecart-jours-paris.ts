import { calculerDecalageParis } from "./calculer-decalage-paris.ts";
import { calculerInstantParis } from "./calculer-instant-paris.ts";

const JOUR_MS = 24 * 60 * 60_000;

export function calculerEcartJoursParis(jour: string, maintenantMs: number): number | null {
  if (Number.isNaN(maintenantMs) || Number.isNaN(calculerInstantParis(jour, "00:00"))) return null;
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const aujourdhuiParis = new Date(maintenantMs + calculerDecalageParis(maintenantMs));
  const aujourdhuiUtc = Date.UTC(aujourdhuiParis.getUTCFullYear(), aujourdhuiParis.getUTCMonth(), aujourdhuiParis.getUTCDate());
  return Math.round((Date.UTC(annee, mois - 1, quantieme) - aujourdhuiUtc) / JOUR_MS);
}
