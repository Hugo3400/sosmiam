// Zones des fondateurs (décision « Fondateurs par ville » du 9 octobre 2026, docs/decisions.md), calculées par
// scripts/preparer-communes.ts pour la table zones_fondateurs.
import { calculerPlacesVille } from "./calculer-places-ville.ts";
import { ecrireNomAvecDe } from "./ecrire-nom-avec-de.ts";

/** Une ligne de la table zones_fondateurs (sans prochainNumero, qui commence à 1) */
export type ZonePreparee = {
  code: string;
  type: "ville" | "departement";
  nom: string;
  nomAvecDe: string;
  codeDepartement: string;
  codeRegion: string | null;
  population: number;
  places: number;
};

export type DonneesZones = {
  /** Communes habitées des départements et collectivités ci-dessous (sans les arrondissements municipaux) */
  communes: { code: string; nom: string; codeDepartement: string; population: number }[];
  /**
   * Les départements et les collectivités d'outre-mer qui comptent comme un département : nom officiel, nom sans article
   * et type de nom de l'Insee (TNCC), région (null pour une collectivité d'outre-mer)
   */
  departements: { code: string; nom: string; nomSansArticle: string; tncc: number; codeRegion: string | null }[];
  /** Nom sans article et type de nom de l'Insee des communes, par code INSEE : ceux des villes au moins */
  nomsInsee: Map<string, { nomSansArticle: string; tncc: number }>;
};

/**
 * Les zones : une par commune de 50 000 habitants ou plus (10, 5, 3 ou 1 place), puis une par département ou collectivité
 * pour toutes ses communes plus petites (1 place, et pas de zone si elle n'en a aucune, comme Paris). Les homonymes
 * prennent le nom de leur département entre parenthèses : « Saint-Denis (La Réunion) ». Villes de la plus peuplée à la
 * moins peuplée, puis départements par code. Lève une erreur si une donnée manque ou si deux zones ont le même nom.
 */
export function construireZonesFondateurs({ communes, departements, nomsInsee }: DonneesZones): ZonePreparee[] {
  const departementsParCode = new Map(departements.map((departement) => [departement.code, departement]));
  const villes: ZonePreparee[] = [];
  const petitesCommunes = new Map<string, number>(); // code du département → population de ses communes de moins de 50 000 habitants

  for (const commune of communes) {
    const departement = departementsParCode.get(commune.codeDepartement);
    if (!departement) throw new Error(`Département ${commune.codeDepartement} inconnu pour ${commune.nom} (${commune.code})`);
    const places = calculerPlacesVille(commune.population);
    if (places === 0) {
      petitesCommunes.set(departement.code, (petitesCommunes.get(departement.code) ?? 0) + commune.population);
      continue;
    }
    const insee = nomsInsee.get(commune.code);
    if (!insee) throw new Error(`${commune.nom} (${commune.code}) absente du Code officiel géographique : mets à jour son millésime`);
    villes.push({
      code: commune.code,
      type: "ville",
      nom: commune.nom,
      nomAvecDe: ecrireNomAvecDe(insee.nomSansArticle, insee.tncc, true),
      codeDepartement: departement.code,
      codeRegion: departement.codeRegion,
      population: commune.population,
      places,
    });
  }

  const homonymes = new Map<string, number>();
  for (const ville of villes) homonymes.set(ville.nom, (homonymes.get(ville.nom) ?? 0) + 1);
  for (const ville of villes) {
    if ((homonymes.get(ville.nom) ?? 0) > 1) ville.nom = `${ville.nom} (${departementsParCode.get(ville.codeDepartement)?.nom})`;
  }
  villes.sort((a, b) => b.population - a.population || (a.code < b.code ? -1 : 1));

  const zonesDepartements = departements
    .filter((departement) => petitesCommunes.has(departement.code))
    .sort((a, b) => (a.code < b.code ? -1 : 1))
    .map((departement): ZonePreparee => ({
      code: `D${departement.code}`,
      type: "departement",
      nom: departement.nom,
      nomAvecDe: ecrireNomAvecDe(departement.nomSansArticle, departement.tncc, false),
      codeDepartement: departement.code,
      codeRegion: departement.codeRegion,
      population: petitesCommunes.get(departement.code) ?? 0,
      places: 1,
    }));

  const zones = [...villes, ...zonesDepartements];
  const noms = new Set<string>();
  for (const zone of zones) {
    if (noms.has(zone.nom)) throw new Error(`Deux zones portent le nom « ${zone.nom} » : rends-les distincts`);
    noms.add(zone.nom);
  }
  return zones;
}
