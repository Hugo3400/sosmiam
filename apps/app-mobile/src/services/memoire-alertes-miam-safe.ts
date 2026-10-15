import { DELAI_RELANCE_ALERTE_SECONDES } from "@sos-miam/commun/regles/miam-safe";
import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";

export type AlerteGardeeMiamSafe = {
  id: number;
  envoyeeLe: number;
  telephones: number | null;
  statut: StatutAlerteMiamSafe;
  reponduLe: number | null;
};

type Entree = { alerte: AlerteGardeeMiamSafe; minuteurs: ReturnType<typeof setTimeout>[] };

const DUREE_GARDE_MS = 15 * 60_000;
const DELAI_RELANCE_MS = DELAI_RELANCE_ALERTE_SECONDES * 1000;

const entrees = new Map<string, Entree>();
const abonnes = new Map<string, Set<() => void>>();

export function ecrireCleAlerteMiamSafe(source: string, compte: string, lieuId: number): string {
  return JSON.stringify([source, compte, lieuId]);
}

function prevenir(cle: string) {
  for (const rappel of [...(abonnes.get(cle) ?? [])]) rappel();
}

function retirer(cle: string) {
  const entree = entrees.get(cle);
  if (!entree) return;
  for (const minuteur of entree.minuteurs) clearTimeout(minuteur);
  entrees.delete(cle);
  prevenir(cle);
}

function remplacer(cle: string, alerte: AlerteGardeeMiamSafe) {
  const entree = entrees.get(cle);
  if (!entree) return;
  entree.alerte = alerte;
  prevenir(cle);
}

function passerSansReponse(cle: string) {
  const alerte = entrees.get(cle)?.alerte;
  if (alerte?.statut === "envoyee") remplacer(cle, { ...alerte, statut: "sans-reponse" });
}

function rattraper(cle: string, maintenant: number) {
  const alerte = entrees.get(cle)?.alerte;
  if (!alerte) return;
  if (maintenant - alerte.envoyeeLe >= DUREE_GARDE_MS) retirer(cle);
  else if (maintenant - alerte.envoyeeLe >= DELAI_RELANCE_MS) passerSansReponse(cle);
}

export function lireAlerteGardeeMiamSafe(cle: string): AlerteGardeeMiamSafe | null {
  return entrees.get(cle)?.alerte ?? null;
}

export function suivreAlerteGardeeMiamSafe(cle: string, rappel: () => void): () => void {
  const liste = abonnes.get(cle) ?? new Set<() => void>();
  abonnes.set(cle, liste);
  liste.add(rappel);
  rattraper(cle, Date.now());
  return () => {
    liste.delete(rappel);
    if (liste.size === 0) abonnes.delete(cle);
  };
}

export function garderAlerteMiamSafe(cle: string, alerte: AlerteGardeeMiamSafe) {
  for (const minuteur of entrees.get(cle)?.minuteurs ?? []) clearTimeout(minuteur);
  const maintenant = Date.now();
  const minuteurs = [
    setTimeout(() => passerSansReponse(cle), Math.max(0, alerte.envoyeeLe + DELAI_RELANCE_MS - maintenant)),
    setTimeout(() => retirer(cle), Math.max(0, alerte.envoyeeLe + DUREE_GARDE_MS - maintenant)),
  ];
  entrees.set(cle, { alerte, minuteurs });
  prevenir(cle);
}

export function noterStatutAlerteMiamSafe(cle: string, alerteId: number, statut: StatutAlerteMiamSafe, reponduLe: number | null) {
  const alerte = entrees.get(cle)?.alerte;
  if (!alerte || alerte.id !== alerteId || alerte.statut === statut) return;
  remplacer(cle, { ...alerte, statut, reponduLe: statut === "en-route" ? reponduLe : alerte.reponduLe });
}

export function oublierAlerteMiamSafe(cle: string) {
  retirer(cle);
}
