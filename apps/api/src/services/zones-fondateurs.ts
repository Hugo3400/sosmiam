// Zones des fondateurs vues de l'extérieur (décision « Fondateurs par ville » du 9 octobre 2026, docs/decisions.md) :
// la zone d'une commune, ses places et combien sont prises. Sert aux routes publiques (routes/fondateurs.ts), à la
// candidature de l'espace ambassadeur, et au logiciel de gestion (trouverZoneDeCommune). Le double en mémoire, pour les
// tests et l'API de démonstration : services/zones-fondateurs-en-memoire.ts.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { calculerCodeZone } from "../fonctions/fondateurs/calculer-code-zone.ts";
import { decrireZone, type ZoneVue } from "../fonctions/fondateurs/decrire-zone.ts";
import { decrireCommune, type CommuneVue } from "../fonctions/geo/decrire-commune.ts";

export type { CommuneVue } from "../fonctions/geo/decrire-commune.ts";
export type { ZoneVue } from "../fonctions/fondateurs/decrire-zone.ts";

export type CommuneEtZone = { commune: CommuneVue; zone: ZoneVue };

/** Ce que les routes demandent aux zones : la base (ce fichier) ou la mémoire (tests, démonstration). */
export type ServicesZones = {
  /** La commune de ce code INSEE et sa zone, ou null (commune inconnue, ou zone absente de la base) */
  trouverZoneDeCommune: (communeCode: string) => Promise<CommuneEtZone | null>;
  /** Toutes les zones : villes de la plus peuplée à la moins peuplée, puis départements et collectivités par code */
  listerZones: () => Promise<ZoneVue[]>;
  lireZone: (code: string) => Promise<ZoneVue | null>;
};

const CHAMPS_ZONE = { code: true, type: true, nom: true, nomAvecDe: true, places: true } as const;

/** Fondateurs en place (« acceptee ») de chaque zone, par code de zone */
async function compterPrises(): Promise<Map<string, number>> {
  const groupes = await baseDeDonnees.candidatureFondateur.groupBy({
    by: ["zoneCode"],
    where: { statut: "acceptee", zoneCode: { not: null } },
    _count: { _all: true },
  });
  return new Map(groupes.map((groupe) => [groupe.zoneCode ?? "", groupe._count._all]));
}

/** La zone de ce code (« 69123 », « D69 »), avec ses places prises, ou null si elle n'existe pas. */
export async function lireZone(code: string): Promise<ZoneVue | null> {
  const zone = await baseDeDonnees.zoneFondateur.findUnique({ where: { code }, select: CHAMPS_ZONE });
  if (!zone) return null;
  const prises = await baseDeDonnees.candidatureFondateur.count({ where: { zoneCode: code, statut: "acceptee" } });
  return decrireZone(zone, prises);
}

/**
 * La commune de ce code INSEE et la zone où elle compte (sa ville dès 50 000 habitants, sinon son département ou sa
 * collectivité d'outre-mer), ou null si la commune est inconnue ou si sa zone manque dans la base.
 */
export async function trouverZoneDeCommune(communeCode: string): Promise<CommuneEtZone | null> {
  const commune = decrireCommune(communeCode);
  if (!commune) return null;
  const zone = await lireZone(calculerCodeZone(commune));
  return zone ? { commune, zone } : null;
}

/** Toutes les zones avec leurs places prises : villes de la plus peuplée à la moins peuplée, puis départements par code. */
export async function listerZones(): Promise<ZoneVue[]> {
  const [zones, prises] = await Promise.all([
    baseDeDonnees.zoneFondateur.findMany({ select: { ...CHAMPS_ZONE, population: true } }),
    compterPrises(),
  ]);
  zones.sort((a, b) =>
    a.type !== b.type ? (a.type === "ville" ? -1 : 1) : a.type === "ville" ? b.population - a.population || (a.code < b.code ? -1 : 1) : a.code < b.code ? -1 : 1);
  return zones.map((zone) => decrireZone(zone, prises.get(zone.code) ?? 0));
}
