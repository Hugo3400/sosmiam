import { normaliserNomCommune } from "./normaliser-nom-commune.ts";

/** Contenu de src/donnees/communes.json, écrit par scripts/preparer-communes.ts (npm run api:communes) */
export type DonneesCommunes = {
  source: string;
  telechargeLe: string;
  /** Nom de chaque département et collectivité d'outre-mer, par code (« 69 » → « Rhône ») */
  departements: Record<string, string>;
  /** Communes habitées : [code INSEE, nom, code du département, population municipale, codes postaux] */
  communes: [string, string, string, number, string[]][];
  /** Arrondissements de Paris, Lyon et Marseille : [code INSEE, nom, code INSEE de leur commune, codes postaux] */
  arrondissements: [string, string, string, string[]][];
};

export type CommuneIndexee = {
  code: string;
  nom: string;
  codeDepartement: string;
  /** Nom du département, ou de la collectivité d'outre-mer */
  nomDepartement: string;
  population: number;
  codesPostaux: string[];
};

/** Un nom à chercher et la commune qu'il désigne. `cle` : sa forme de recherche, sans espaces. */
export type NomIndexe = { cle: string; commune: CommuneIndexee };

export type IndexCommunes = {
  /** Communes par code INSEE ; le code d'un arrondissement mène à sa commune */
  parCode: Map<string, CommuneIndexee>;
  /** Communes de chaque code postal, la plus peuplée d'abord */
  parCodePostal: Map<string, CommuneIndexee[]>;
  /** Noms des communes et des arrondissements, triés par clé : pour trouver vite les débuts de nom */
  noms: NomIndexe[];
  /** Fins de nom qui commencent à un mot du milieu (« denis » pour Saint-Denis), triées par clé ; sans arrondissements */
  mots: NomIndexe[];
  /** Clés de toutes les communes (sans arrondissements) bout à bout, séparées par « | » : pour chercher au milieu d'un mot */
  texte: string;
  /** Début de chaque commune dans `texte` (croissant), et la commune de même rang dans `communesDuTexte` */
  debuts: Int32Array;
  communesDuTexte: CommuneIndexee[];
};

const parCle = (a: NomIndexe, b: NomIndexe) => (a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : b.commune.population - a.commune.population);
/** Article au début du nom (« Le Mans », « La Rochelle », « Les Abymes », « L'Haÿ-les-Roses ») : le nom compte aussi sans lui */
const ARTICLES = new Set(["le", "la", "les", "l"]);

/** Prépare la recherche : à faire une fois, au chargement du fichier (chargerIndexCommunes s'en occupe). */
export function indexerCommunes(donnees: DonneesCommunes): IndexCommunes {
  const parCode = new Map<string, CommuneIndexee>();
  const parCodePostal = new Map<string, CommuneIndexee[]>();
  const noms: NomIndexe[] = [];
  const mots: NomIndexe[] = [];
  const clesDuTexte: string[] = [];
  const communesDuTexte: CommuneIndexee[] = [];
  const ajouterCodePostal = (codePostal: string, commune: CommuneIndexee) => {
    const liste = parCodePostal.get(codePostal) ?? [];
    if (!liste.includes(commune)) liste.push(commune);
    parCodePostal.set(codePostal, liste);
  };

  for (const [code, nom, codeDepartement, population, codesPostaux] of donnees.communes) {
    const commune = { code, nom, codeDepartement, nomDepartement: donnees.departements[codeDepartement] ?? "", population, codesPostaux };
    parCode.set(code, commune);
    for (const codePostal of codesPostaux) ajouterCodePostal(codePostal, commune);
    const morceaux = normaliserNomCommune(nom).split(" ");
    const article = morceaux.length > 1 && ARTICLES.has(morceaux[0]) ? 1 : 0;
    const cle = morceaux.join("");
    noms.push({ cle, commune });
    if (article) noms.push({ cle: morceaux.slice(1).join(""), commune });
    for (let debut = 1 + article; debut < morceaux.length; debut++) mots.push({ cle: morceaux.slice(debut).join(""), commune });
    clesDuTexte.push(cle);
    communesDuTexte.push(commune);
  }
  for (const [code, nom, codeCommune, codesPostaux] of donnees.arrondissements) {
    const commune = parCode.get(codeCommune);
    if (!commune) throw new Error(`Arrondissement ${nom} (${code}) : commune ${codeCommune} absente`);
    parCode.set(code, commune);
    for (const codePostal of codesPostaux) ajouterCodePostal(codePostal, commune);
    noms.push({ cle: normaliserNomCommune(nom).replaceAll(" ", ""), commune });
  }

  for (const liste of parCodePostal.values()) liste.sort((a, b) => b.population - a.population || (a.code < b.code ? -1 : 1));
  noms.sort(parCle);
  mots.sort(parCle);
  const debuts = new Int32Array(clesDuTexte.length);
  let position = 0;
  clesDuTexte.forEach((cle, rang) => {
    debuts[rang] = position;
    position += cle.length + 1;
  });
  return { parCode, parCodePostal, noms, mots, texte: clesDuTexte.join("|"), debuts, communesDuTexte };
}
