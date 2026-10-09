// Zones des fondateurs en mémoire, pour les tests et l'API de démonstration : construites depuis src/donnees/communes.json
// avec construireZonesFondateurs (mêmes 241 zones et 367 places que la base), sans rien lire ni écrire dans la base.
// Une seule différence : communes.json ne dit pas l'article officiel des noms (champ TNCC de l'Insee). Il est deviné
// d'après le nom (« Le Havre » → « du Havre », « Angers » → « d'Angers ») ; un département n'en a pas (« de Rhône » ici,
// « du Rhône » dans la base).
import { readFileSync } from "node:fs";

import { calculerCodeZone } from "../fonctions/fondateurs/calculer-code-zone.ts";
import { construireZonesFondateurs, type ZonePreparee } from "../fonctions/fondateurs/construire-zones-fondateurs.ts";
import { decrireZone, type ZoneVue } from "../fonctions/fondateurs/decrire-zone.ts";
import { decrireCommune } from "../fonctions/geo/decrire-commune.ts";
import type { DonneesCommunes } from "../fonctions/geo/indexer-communes.ts";
import type { ServicesZones } from "./zones-fondateurs.ts";

/** Collectivités d'outre-mer qui comptent comme un département (pas de région) */
const COLLECTIVITES = new Set(["975", "977", "978", "986", "987", "988"]);
const ARTICLES: [string, number][] = [["Les ", 4], ["Le ", 2], ["La ", 3], ["L'", 5]];

/** Nom sans article et type de nom de l'Insee, devinés d'après le nom (voir l'en-tête) */
function devinerArticle(nom: string): { nomSansArticle: string; tncc: number } {
  for (const [article, tncc] of ARTICLES) if (nom.startsWith(article)) return { nomSansArticle: nom.slice(article.length), tncc };
  return { nomSansArticle: nom, tncc: /^[AEIOUYÉÈÊÎÔH]/i.test(nom) ? 1 : 0 };
}

let zonesPreparees: ZonePreparee[] | undefined;

/** Les zones tirées de communes.json, préparées une fois par lancement (une fraction de seconde). */
function preparerZones(): ZonePreparee[] {
  if (zonesPreparees) return zonesPreparees;
  const donnees = JSON.parse(readFileSync(new URL("../donnees/communes.json", import.meta.url), "utf8")) as DonneesCommunes;
  const communes = donnees.communes.map(([code, nom, codeDepartement, population]) => ({ code, nom, codeDepartement, population }));
  const departements = Object.entries(donnees.departements).map(([code, nom]) => ({
    code, nom, nomSansArticle: nom, tncc: 0, codeRegion: COLLECTIVITES.has(code) ? null : "00",
  }));
  const nomsInsee = new Map(communes.map((commune) => [commune.code, devinerArticle(commune.nom)]));
  zonesPreparees = construireZonesFondateurs({ communes, departements, nomsInsee });
  return zonesPreparees;
}

/** Une candidature, vue par les zones : sa zone et son statut (seules les « acceptee » prennent une place) */
export type CandidaturePourZone = { zoneCode: string | null; statut: string };

/**
 * Les services des zones, en mémoire. `lireCandidatures` donne les candidatures du moment (celles du double des
 * comptes) : les places prises sont recomptées à chaque demande, comme dans la base. `prochainNumero` : le prochain
 * numéro local de chaque zone (il ne fait que monter), pour accepter une candidature comme le logiciel de gestion.
 */
export function creerZonesEnMemoire(lireCandidatures: () => CandidaturePourZone[]) {
  const zones = new Map(preparerZones().map((zone) => [zone.code, zone]));
  const prochainNumero = new Map<string, number>();
  const prises = (code: string) => lireCandidatures().filter((candidature) => candidature.zoneCode === code && candidature.statut === "acceptee").length;
  const vue = (code: string): ZoneVue | null => {
    const zone = zones.get(code);
    return zone ? decrireZone(zone, prises(code)) : null;
  };

  const services: ServicesZones = {
    async trouverZoneDeCommune(communeCode) {
      const commune = decrireCommune(communeCode);
      const zone = commune && vue(calculerCodeZone(commune));
      return commune && zone ? { commune, zone } : null;
    },
    async listerZones() {
      const parZone = new Map<string, number>();
      for (const { zoneCode, statut } of lireCandidatures()) if (zoneCode && statut === "acceptee") parZone.set(zoneCode, (parZone.get(zoneCode) ?? 0) + 1);
      return [...zones.values()].map((zone) => decrireZone(zone, parZone.get(zone.code) ?? 0));
    },
    async lireZone(code) {
      return vue(code);
    },
  };

  return {
    services,
    /** Le numéro local suivant de la zone (1, 2, 3… jamais redonné), et le note comme pris */
    prendreNumero(code: string): number {
      const numero = prochainNumero.get(code) ?? 1;
      prochainNumero.set(code, numero + 1);
      return numero;
    },
  };
}
