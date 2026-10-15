import { creerMiamSafeApi } from "@sos-miam/commun/client-api/api/api-miam-safe";
import type { ServiceMiamSafe } from "@sos-miam/commun/client-api/contrat-miam-safe";
import type { Services } from "@sos-miam/commun/client-api/services";
import type { MiamSafeLieu } from "@sos-miam/commun/types/miam-safe";

import { clientApiPublic } from "~/services/client-api-public";

export type LectureMiamSafe = "en-cours" | "lue" | "ratee";

export type EtatMiamSafeLieu = { lecture: LectureMiamSafe; valeur: MiamSafeLieu | null };

type Entree = {
  lieuId: number;
  service: ServiceMiamSafe;
  etat: EtatMiamSafeLieu;
  lueLe: number;
  echecs: number;
  finiLe: number;
  generation: number;
  enCours: boolean;
  relance: ReturnType<typeof setTimeout> | null;
  abonnes: Set<() => void>;
};

const DUREE_VALIDITE_MS = 5 * 60_000;
const PREMIERE_RELANCE_MS = 15_000;
const RELANCE_SUIVANTE_MS = 60_000;
const ECART_MIN_RELECTURE_MS = 5000;
const SANS_MIAM_SAFE: MiamSafeLieu = { engage: false, repere: false };
const EN_COURS: EtatMiamSafeLieu = { lecture: "en-cours", valeur: null };
const RATEE: EtatMiamSafeLieu = { lecture: "ratee", valeur: null };

const entrees = new Map<string, Entree>();
let servicePublic: ServiceMiamSafe | null = null;

function choisirService(services: Services): ServiceMiamSafe {
  if (services.source !== "indisponible") return services.miamSafe;
  servicePublic ??= creerMiamSafeApi(clientApiPublic);
  return servicePublic;
}

function ecrireCle(services: Services, lieuId: number): string {
  return `${services.source}:${lieuId}`;
}

function changer(entree: Entree, etat: EtatMiamSafeLieu) {
  entree.etat = etat;
  for (const prevenir of [...entree.abonnes]) prevenir();
}

function arreterRelance(entree: Entree) {
  if (entree.relance) clearTimeout(entree.relance);
  entree.relance = null;
}

function programmerRelance(entree: Entree) {
  arreterRelance(entree);
  if (entree.abonnes.size === 0) return;
  entree.relance = setTimeout(
    () => {
      entree.relance = null;
      if (entree.abonnes.size > 0) lancer(entree, false);
    },
    entree.echecs <= 1 ? PREMIERE_RELANCE_MS : RELANCE_SUIVANTE_MS,
  );
}

async function lireValeur(entree: Entree): Promise<MiamSafeLieu | null> {
  const reponse = await entree.service.lireLieu(entree.lieuId).catch(() => null);
  if (!reponse) return null;
  if (reponse.ok) return { engage: reponse.engage, repere: reponse.repere };
  return reponse.erreur === "lieu-inconnu" ? SANS_MIAM_SAFE : null;
}

function lancer(entree: Entree, annoncer: boolean) {
  if (entree.enCours) return;
  arreterRelance(entree);
  entree.enCours = true;
  const generation = entree.generation;
  if (annoncer && entree.etat.valeur === null && entree.etat !== EN_COURS) changer(entree, EN_COURS);
  void lireValeur(entree).then((valeur) => {
    entree.enCours = false;
    entree.finiLe = Date.now();
    if (generation !== entree.generation) {
      if (entree.abonnes.size > 0) lancer(entree, false);
      return;
    }
    if (valeur) {
      entree.echecs = 0;
      entree.lueLe = Date.now();
      changer(entree, { lecture: "lue", valeur });
      return;
    }
    entree.echecs += 1;
    if (entree.etat.valeur === null) changer(entree, RATEE);
    programmerRelance(entree);
  });
}

function trouverEntree(services: Services, lieuId: number): Entree {
  const cle = ecrireCle(services, lieuId);
  const existante = entrees.get(cle);
  const service = choisirService(services);
  if (existante) {
    existante.service = service;
    return existante;
  }
  const entree: Entree = { lieuId, service, etat: EN_COURS, lueLe: 0, echecs: 0, finiLe: 0, generation: 0, enCours: false, relance: null, abonnes: new Set() };
  entrees.set(cle, entree);
  return entree;
}

function estPerimee(entree: Entree): boolean {
  return entree.etat.valeur === null || Date.now() - entree.lueLe > DUREE_VALIDITE_MS;
}

export function lireEtatMiamSafeLieu(services: Services, lieuId: number): EtatMiamSafeLieu {
  return entrees.get(ecrireCle(services, lieuId))?.etat ?? EN_COURS;
}

export function suivreMiamSafeLieu(services: Services, lieuId: number, prevenir: () => void): () => void {
  const entree = trouverEntree(services, lieuId);
  entree.abonnes.add(prevenir);
  if (!entree.enCours && !entree.relance && estPerimee(entree)) lancer(entree, true);
  return () => {
    entree.abonnes.delete(prevenir);
    if (entree.abonnes.size === 0) arreterRelance(entree);
  };
}

export function relireMiamSafeLieu(services: Services, lieuId: number) {
  const entree = trouverEntree(services, lieuId);
  if (!entree.enCours && Date.now() - entree.finiLe >= ECART_MIN_RELECTURE_MS) lancer(entree, true);
}

export function oublierMiamSafeLieu(lieuId: number) {
  for (const entree of entrees.values()) {
    if (entree.lieuId !== lieuId) continue;
    entree.generation += 1;
    entree.lueLe = 0;
    if (entree.abonnes.size > 0) lancer(entree, false);
  }
}
