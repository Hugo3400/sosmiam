import { chargerIndexCommunes } from "./charger-index-communes.ts";
import type { CommuneIndexee, IndexCommunes, NomIndexe } from "./indexer-communes.ts";
import { normaliserNomCommune } from "./normaliser-nom-commune.ts";

export type CommuneTrouvee = {
  /** Code INSEE de la commune (celui de Paris, Lyon ou Marseille pour un de leurs arrondissements) */
  code: string;
  nom: string;
  /** Nom du département, ou de la collectivité d'outre-mer */
  nomDepartement: string;
  codeDepartement: string;
  population: number;
  /** Le code postal tapé, quand la recherche en était un */
  codePostal: string | null;
};

const LONGUEUR_MAX = 80;
const LIMITE_PAR_DEFAUT = 8;
const LIMITE_MAX = 20;
const ABREVIATIONS = new Map([
  ["st", "saint"],
  ["ste", "sainte"],
]);

/** Rang d'une correspondance : 0 nom entier, 1 début du nom, 2 début d'un mot du milieu, 3 milieu d'un mot */
type Trouvaille = { commune: CommuneIndexee; rang: number };

/** Premier nom dont la clé est au moins `cle` (les noms sont triés par clé) */
function premierAPartirDe(noms: NomIndexe[], cle: string): number {
  let bas = 0;
  let haut = noms.length;
  while (bas < haut) {
    const milieu = (bas + haut) >>> 1;
    if (noms[milieu].cle < cle) bas = milieu + 1;
    else haut = milieu;
  }
  return bas;
}

function vue(commune: CommuneIndexee, codePostal: string | null): CommuneTrouvee {
  const { code, nom, nomDepartement, codeDepartement, population } = commune;
  return { code, nom, nomDepartement, codeDepartement, population, codePostal };
}

/**
 * Communes qui répondent à ce qui est tapé, sans tenir compte des accents, des majuscules ni des tirets ; « st » et
 * « ste » valent aussi « saint » et « sainte ». Un code postal à 5 chiffres donne ses communes. Le nom entier passe
 * avant le début du nom, qui passe avant le début d'un mot du milieu (« Denis » pour Saint-Denis), puis avant le milieu
 * d'un mot ; à égalité, la commune la plus peuplée d'abord. « Lyon 3 » ou « Paris 11 » trouvent l'arrondissement, rendu
 * comme sa commune. Texte vide ou de plus de 80 caractères : liste vide. `limite` : 8 par défaut, 20 au plus.
 */
export function chercherCommunes(texte: string, limite = LIMITE_PAR_DEFAUT, index?: IndexCommunes): CommuneTrouvee[] {
  if (typeof texte !== "string" || texte.length > LONGUEUR_MAX) return [];
  const nombre = Number.isFinite(limite) ? Math.min(LIMITE_MAX, Math.max(1, Math.floor(limite))) : LIMITE_PAR_DEFAUT;

  const codePostal = texte.replace(/\s+/g, "");
  if (/^\d{5}$/.test(codePostal)) {
    const communes = (index ?? chargerIndexCommunes()).parCodePostal.get(codePostal) ?? [];
    return communes.slice(0, nombre).map((commune) => vue(commune, codePostal));
  }

  const mots = normaliserNomCommune(texte).split(" ").filter(Boolean);
  if (mots.length === 0) return [];
  const { noms, mots: finsDeNom } = index ?? chargerIndexCommunes();
  const cles = new Set([mots.map((mot) => ABREVIATIONS.get(mot) ?? mot).join(""), mots.join("")]);

  const trouvailles = new Map<string, Trouvaille>();
  const noter = (commune: CommuneIndexee, rang: number) => {
    const deja = trouvailles.get(commune.code);
    if (!deja || rang < deja.rang) trouvailles.set(commune.code, { commune, rang });
  };
  // Les rangs suivants ne servent que s'il reste de la place : ils passent toujours après les précédents.
  for (const cle of cles) {
    for (let i = premierAPartirDe(noms, cle); i < noms.length && noms[i].cle.startsWith(cle); i++) noter(noms[i].commune, noms[i].cle === cle ? 0 : 1);
  }
  if (trouvailles.size < nombre) {
    for (const cle of cles) {
      for (let i = premierAPartirDe(finsDeNom, cle); i < finsDeNom.length && finsDeNom[i].cle.startsWith(cle); i++) noter(finsDeNom[i].commune, 2);
    }
  }
  if (trouvailles.size < nombre) {
    for (const cle of cles) for (const nom of noms) if (!nom.arrondissement && nom.cle.includes(cle)) noter(nom.commune, 3);
  }

  return [...trouvailles.values()]
    .sort((a, b) => a.rang - b.rang || b.commune.population - a.commune.population || a.commune.nom.localeCompare(b.commune.nom, "fr") || (a.commune.code < b.commune.code ? -1 : 1))
    .slice(0, nombre)
    .map(({ commune }) => vue(commune, null));
}
