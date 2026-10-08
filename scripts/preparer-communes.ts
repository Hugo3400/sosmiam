// Prépare les communes de France pour l'API : recherche de commune et zones des fondateurs (décision « Fondateurs par
// ville » du 9 octobre 2026, docs/decisions.md).
//
// Sources, téléchargées à chaque lancement :
//   - https://geo.api.gouv.fr (service public de l'État) : communes (nom, code INSEE, population municipale de l'Insee en
//     vigueur, département, région, codes postaux), arrondissements municipaux de Paris, Lyon et Marseille, départements,
//     collectivités d'outre-mer et régions ;
//   - le Code officiel géographique (COG) de l'Insee : noms officiels des départements et collectivités, et article des
//     noms (champ TNCC), pour écrire « de Lyon », « du Havre », « de la Creuse », « de l'Ain ».
// Données en place : téléchargées le 9 octobre 2026 (COG 2026 ; populations municipales 2023, en vigueur au
// 1er janvier 2026 ; Mayotte : recensement de 2017, tel que le donne geo.api.gouv.fr).
//
// Chaque année, quand l'Insee publie le nouveau COG et les nouvelles populations (en janvier) :
//   1. mets ANNEE_COG et ADRESSE_COG au nouveau millésime (lien « Téléchargement des fichiers » du millésime sur
//      https://www.insee.fr/fr/information/2560452) ;
//   2. npm run api:communes -- --sql <fichier.sql> --zones <fichier.json>
//   3. relis le résumé, commite apps/api/src/donnees/communes.json, et mets le SQL dans une nouvelle migration : une zone
//      déjà là est mise à jour (nom, population, places) sans toucher à ses numéros ; une zone qui n'est plus dans la
//      liste reste dans la table (à décider à la main), et les totaux de docs/decisions.md sont à revoir.
//
//   npm run api:communes                                         réécrit apps/api/src/donnees/communes.json
//   npm run api:communes -- --sql zones.sql --zones zones.json   écrit aussi les zones : SQL (INSERT) et JSON de contrôle
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { calculerPlacesVille } from "../apps/api/src/fonctions/fondateurs/calculer-places-ville.ts";
import { construireZonesFondateurs, type ZonePreparee } from "../apps/api/src/fonctions/fondateurs/construire-zones-fondateurs.ts";
import { formaterOctets } from "../apps/api/src/fonctions/texte/formater-octets.ts";
import { lireLigneCsv } from "../apps/api/src/fonctions/texte/lire-ligne-csv.ts";

const GEO = "https://geo.api.gouv.fr";
const ANNEE_COG = 2026;
const ADRESSE_COG = "https://www.insee.fr/fr/statistiques/fichier/8740222";
/** Collectivités d'outre-mer qui comptent comme un département (pas les TAAF, 984, ni Clipperton, 989 : sans habitants) */
const COLLECTIVITES = ["975", "977", "978", "986", "987", "988"];
const COMMUNES_A_ARRONDISSEMENTS = ["75056", "69123", "13055"];
const FICHIER_COMMUNES = fileURLToPath(new URL("../apps/api/src/donnees/communes.json", import.meta.url));
/** Totaux de la décision du 9 octobre 2026 : un écart est signalé, jamais corrigé ici */
const ATTENDU = { zones: 241, places: 367, villes: 135, placesVilles: 261, departements: 100, collectivites: 6 };

type CommuneGeo = { code: string; nom: string; population?: number; codeDepartement: string; codesPostaux?: string[]; codeParent?: string };
type DepartementGeo = { code: string; nom: string; codeRegion: string; zone: string };
type RegionGeo = { code: string; nom: string };

async function telecharger(adresse: string): Promise<string> {
  const reponse = await fetch(adresse, { signal: AbortSignal.timeout(120_000) });
  if (!reponse.ok) throw new Error(`${adresse} a répondu ${reponse.status}`);
  return reponse.text();
}

async function lireGeo<T>(chemin: string): Promise<T> {
  return JSON.parse(await telecharger(`${GEO}${chemin}`)) as T;
}

/** Un fichier CSV du COG (séparateur « , », champs entre guillemets), en objets { COLONNE: valeur } */
async function lireCog(fichier: string): Promise<Record<string, string>[]> {
  const lignes = (await telecharger(`${ADRESSE_COG}/${fichier}_${ANNEE_COG}.csv`)).replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const colonnes = lireLigneCsv(lignes[0], ",");
  return lignes.slice(1).map((ligne) => {
    const champs = lireLigneCsv(ligne, ",");
    return Object.fromEntries(colonnes.map((colonne, i) => [colonne, champs[i] ?? ""]));
  });
}

function echapperSql(valeur: string | number | null): string {
  if (valeur === null) return "NULL";
  return typeof valeur === "number" ? String(valeur) : `'${valeur.replaceAll("'", "''")}'`;
}

function ecrireSqlZones(zones: ZonePreparee[], entete: string[]): string {
  const lignes = zones.map((z) => `  (${[z.code, z.type, z.nom, z.nomAvecDe, z.codeDepartement, z.codeRegion, z.population, z.places].map(echapperSql).join(", ")})`);
  return [
    ...entete.map((ligne) => `-- ${ligne}`),
    `INSERT INTO "zones_fondateurs" ("code", "type", "nom", "nom_avec_de", "code_departement", "code_region", "population", "places") VALUES`,
    lignes.join(",\n"),
    `ON CONFLICT ("code") DO UPDATE SET "type" = EXCLUDED."type", "nom" = EXCLUDED."nom", "nom_avec_de" = EXCLUDED."nom_avec_de",`,
    `  "code_departement" = EXCLUDED."code_departement", "code_region" = EXCLUDED."code_region", "population" = EXCLUDED."population",`,
    `  "places" = EXCLUDED."places";`,
    "",
  ].join("\n");
}

const { values: options } = parseArgs({ options: { sql: { type: "string" }, zones: { type: "string" } } });
const aujourdhui = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
const source = `geo.api.gouv.fr (communes, arrondissements, départements ; populations municipales de l'Insee en vigueur) et Code officiel géographique ${ANNEE_COG} de l'Insee (noms officiels et articles)`;

console.log(`Téléchargement depuis ${GEO} et ${ADRESSE_COG} (COG ${ANNEE_COG})…`);
const [communesGeo, arrondissementsGeo, departementsGeo, regionsGeo, departementsCog, collectivitesCog, communesCog, communesOutreMerCog] = await Promise.all([
  lireGeo<CommuneGeo[]>("/communes?zone=metro,drom,com&fields=nom,code,population,codeDepartement,codesPostaux&format=json"),
  lireGeo<CommuneGeo[]>("/communes?type=arrondissement-municipal&fields=nom,code,codeDepartement,codesPostaux,codeParent&format=json"),
  lireGeo<DepartementGeo[]>("/departements?zone=metro,drom,com&fields=nom,code,codeRegion,zone"),
  lireGeo<RegionGeo[]>("/regions?fields=nom,code"),
  lireCog("v_departement"),
  lireCog("v_comer"),
  lireCog("v_commune"),
  lireCog("v_commune_comer"),
]);

// Départements et collectivités d'outre-mer : nom officiel et article de l'Insee, région de geo.api.gouv.fr
const regions = new Map(regionsGeo.map((region) => [region.code, region.nom]));
const lignesCog = new Map([...departementsCog.map((l) => [l.DEP, l] as const), ...collectivitesCog.map((l) => [l.COMER, l] as const)]);
const departements = departementsGeo
  .filter((departement) => departement.zone !== "com" || COLLECTIVITES.includes(departement.code))
  .map((departement) => {
    const ligne = lignesCog.get(departement.code);
    if (!ligne) throw new Error(`${departement.nom} (${departement.code}) absent du COG ${ANNEE_COG} : mets à jour ANNEE_COG et ADRESSE_COG`);
    const collectivite = COLLECTIVITES.includes(departement.code);
    if (!collectivite && !regions.has(departement.codeRegion)) throw new Error(`Région ${departement.codeRegion} inconnue pour ${departement.nom}`);
    return { code: departement.code, nom: ligne.LIBELLE, nomSansArticle: ligne.NCCENR, tncc: Number(ligne.TNCC), codeRegion: collectivite ? null : departement.codeRegion };
  });
const nombreCollectivites = departements.filter((departement) => departement.codeRegion === null).length;
if (departements.length - nombreCollectivites !== 101 || nombreCollectivites !== COLLECTIVITES.length) {
  throw new Error(`${departements.length - nombreCollectivites} départements et ${nombreCollectivites} collectivités trouvés (101 et ${COLLECTIVITES.length} attendus)`);
}

// Communes habitées des départements et collectivités gardés, et arrondissements de Paris, Lyon et Marseille
const gardes = new Set(departements.map((departement) => departement.code));
const dansLaListe = communesGeo.filter((commune) => gardes.has(commune.codeDepartement));
const sansHabitants = dansLaListe.filter((commune) => !((commune.population ?? 0) > 0));
const communes = dansLaListe
  .filter((commune) => (commune.population ?? 0) > 0)
  .map((commune) => ({ code: commune.code, nom: commune.nom, codeDepartement: commune.codeDepartement, population: commune.population ?? 0, codesPostaux: [...(commune.codesPostaux ?? [])].sort() }))
  .sort((a, b) => (a.code < b.code ? -1 : 1));
const arrondissements = arrondissementsGeo
  .filter((arrondissement) => COMMUNES_A_ARRONDISSEMENTS.includes(arrondissement.codeParent ?? ""))
  .map((arrondissement) => [arrondissement.code, arrondissement.nom, arrondissement.codeParent ?? "", [...(arrondissement.codesPostaux ?? [])].sort()] as const)
  .sort((a, b) => (a[0] < b[0] ? -1 : 1));
if (arrondissements.length !== 45) console.warn(`Attention : ${arrondissements.length} arrondissements municipaux (45 attendus : 20 à Paris, 9 à Lyon, 16 à Marseille)`);

// Noms des communes selon l'Insee : article (TNCC) et nom sans article (NCCENR), pour « du Havre » ou « de La Rochelle »
const nomsInsee = new Map<string, { nomSansArticle: string; tncc: number; libelle: string }>();
for (const l of communesCog) if (l.TYPECOM === "COM") nomsInsee.set(l.COM, { nomSansArticle: l.NCCENR, tncc: Number(l.TNCC), libelle: l.LIBELLE });
for (const l of communesOutreMerCog) nomsInsee.set(l.COM_COMER, { nomSansArticle: l.NCCENR, tncc: Number(l.TNCC), libelle: l.LIBELLE });
for (const commune of communes) {
  const insee = nomsInsee.get(commune.code);
  if (calculerPlacesVille(commune.population) > 0 && insee?.libelle !== commune.nom) {
    throw new Error(`${commune.nom} (${commune.code}) s'appelle « ${insee?.libelle ?? "?"} » dans le COG ${ANNEE_COG} : les deux sources n'ont pas le même millésime`);
  }
}

const zones = construireZonesFondateurs({ communes, departements, nomsInsee });

// Fichier des communes : une commune par ligne (relecture et différences d'une année sur l'autre)
mkdirSync(dirname(FICHIER_COMMUNES), { recursive: true });
writeFileSync(
  FICHIER_COMMUNES,
  [
    "{",
    `"source": ${JSON.stringify(source)},`,
    `"telechargeLe": "${aujourdhui}",`,
    `"colonnes": ${JSON.stringify({ communes: ["code", "nom", "codeDepartement", "population", "codesPostaux"], arrondissements: ["code", "nom", "codeCommune", "codesPostaux"] })},`,
    `"departements": ${JSON.stringify(Object.fromEntries(departements.map((departement) => [departement.code, departement.nom])))},`,
    `"arrondissements": [`,
    arrondissements.map((arrondissement) => JSON.stringify(arrondissement)).join(",\n"),
    "],",
    `"communes": [`,
    communes.map((c) => JSON.stringify([c.code, c.nom, c.codeDepartement, c.population, c.codesPostaux])).join(",\n"),
    "]",
    "}",
    "",
  ].join("\n"),
);

// Résumé, et écart avec la décision
const somme = (liste: ZonePreparee[]) => liste.reduce((total, zone) => total + zone.places, 0);
const villes = zones.filter((zone) => zone.type === "ville");
const totaux = {
  zones: zones.length,
  places: somme(zones),
  villes: villes.length,
  placesVilles: somme(villes),
  departements: zones.filter((zone) => zone.type === "departement" && zone.codeRegion !== null).length,
  collectivites: zones.filter((zone) => zone.type === "departement" && zone.codeRegion === null).length,
};
const habitants = (zone: ZonePreparee | undefined) => (zone ? `${zone.nom}, ${zone.population.toLocaleString("fr-FR")} hab.` : "aucune");
console.log(`Communes : ${communes.length} habitées et ${arrondissements.length} arrondissements, dans ${FICHIER_COMMUNES} (${formaterOctets(statSync(FICHIER_COMMUNES).size)})`);
console.log(`  laissées de côté, sans habitants : ${sansHabitants.map((commune) => `${commune.nom} (${commune.code})`).join(", ") || "aucune"}`);
console.log(`Zones : ${totaux.zones} (${totaux.villes} villes, ${totaux.departements} départements, ${totaux.collectivites} collectivités d'outre-mer), ${totaux.places} places`);
for (const places of [10, 5, 3, 1]) {
  const liste = villes.filter((ville) => ville.places === places);
  console.log(`  ${places} place${places > 1 ? "s" : ""} : ${liste.length} villes, de ${habitants(liste[0])} à ${habitants(liste.at(-1))}`);
}
const ecarts = Object.entries(ATTENDU).filter(([cle, attendu]) => totaux[cle as keyof typeof totaux] !== attendu);
if (ecarts.length === 0) console.log("Conforme à la décision du 9 octobre 2026 : 241 zones, 367 places.");
else console.warn(`Écart avec la décision du 9 octobre 2026 (docs/decisions.md) : ${ecarts.map(([cle, attendu]) => `${cle} ${totaux[cle as keyof typeof totaux]} au lieu de ${attendu}`).join(", ")}`);

const entete = [
  `Zones des fondateurs (docs/decisions.md, « Fondateurs par ville ») : ${totaux.zones} zones, ${totaux.places} places`,
  `(${totaux.villes} villes, ${totaux.departements} départements, ${totaux.collectivites} collectivités d'outre-mer).`,
  `Écrit par scripts/preparer-communes.ts le ${aujourdhui} : ${source}.`,
  "Une zone déjà là est mise à jour, sans toucher à son prochain numéro.",
];
if (options.sql) {
  writeFileSync(options.sql, ecrireSqlZones(zones, entete));
  console.log(`SQL des zones : ${options.sql}`);
}
if (options.zones) {
  const lisibles = zones.map((zone) => ({ ...zone, region: zone.codeRegion ? regions.get(zone.codeRegion) : null }));
  writeFileSync(options.zones, `${JSON.stringify({ telechargeLe: aujourdhui, source, totaux, zones: lisibles }, null, 2)}\n`);
  console.log(`Zones lisibles : ${options.zones}`);
}
