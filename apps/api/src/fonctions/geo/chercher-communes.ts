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

/** Négatif si `a` passe avant `b` : meilleur rang, puis la plus peuplée, puis le nom et le code */
function comparer(a: Trouvaille, b: Trouvaille): number {
  const { commune: x } = a;
  const { commune: y } = b;
  return a.rang - b.rang || y.population - x.population || x.nom.localeCompare(y.nom, "fr") || (x.code < y.code ? -1 : x.code > y.code ? 1 : 0);
}

/** Garde les `nombre` meilleures trouvailles, triées et une seule fois chaque commune, sans tout trier à la fin */
function retenir(meilleures: Trouvaille[], nombre: number, commune: CommuneIndexee, rang: number): void {
  if (meilleures.length >= nombre) {
    const derniere = meilleures[meilleures.length - 1];
    if (rang > derniere.rang || (rang === derniere.rang && commune.population < derniere.commune.population)) return;
  }
  const trouvaille = { commune, rang };
  const deja = meilleures.findIndex((autre) => autre.commune === commune);
  if (deja >= 0) {
    if (comparer(trouvaille, meilleures[deja]) >= 0) return;
    meilleures.splice(deja, 1);
  }
  let place = meilleures.length;
  while (place > 0 && comparer(trouvaille, meilleures[place - 1]) < 0) place--;
  if (place >= nombre) return;
  meilleures.splice(place, 0, trouvaille);
  if (meilleures.length > nombre) meilleures.pop();
}

/** Premier nom dont la clé vient au plus tôt après `cle` (les noms sont triés par clé) */
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

/** Rang de la commune dont la clé contient cette position du texte de l'index */
function rangALaPosition(debuts: Int32Array, position: number): number {
  let bas = 0;
  let haut = debuts.length - 1;
  while (bas < haut) {
    const milieu = (bas + haut + 1) >>> 1;
    if (debuts[milieu] <= position) bas = milieu;
    else haut = milieu - 1;
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
 * d'un mot ; à égalité, la commune la plus peuplée d'abord. Le nom compte aussi sans son article (« Mans » est le nom
 * entier de Le Mans). « Lyon 3 » ou « Paris 11 » trouvent l'arrondissement, rendu comme sa commune. Texte vide ou de
 * plus de 80 caractères : liste vide. `limite` : 8 par défaut, 20 au plus.
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
  const { noms, mots: finsDeNom, texte: toutesLesCles, debuts, communesDuTexte } = index ?? chargerIndexCommunes();
  const cles = new Set([mots.map((mot) => ABREVIATIONS.get(mot) ?? mot).join(""), mots.join("")]);
  const meilleures: Trouvaille[] = [];

  for (const cle of cles) {
    for (let i = premierAPartirDe(noms, cle); i < noms.length && noms[i].cle.startsWith(cle); i++) {
      retenir(meilleures, nombre, noms[i].commune, noms[i].cle === cle ? 0 : 1);
    }
  }
  // Les rangs suivants passent toujours après : inutile de les chercher quand la liste est déjà pleine.
  if (meilleures.length < nombre) {
    for (const cle of cles) {
      for (let i = premierAPartirDe(finsDeNom, cle); i < finsDeNom.length && finsDeNom[i].cle.startsWith(cle); i++) {
        retenir(meilleures, nombre, finsDeNom[i].commune, 2);
      }
    }
  }
  if (meilleures.length < nombre) {
    for (const cle of cles) {
      for (let position = toutesLesCles.indexOf(cle); position !== -1; ) {
        const rang = rangALaPosition(debuts, position);
        retenir(meilleures, nombre, communesDuTexte[rang], 3);
        position = rang + 1 < debuts.length ? toutesLesCles.indexOf(cle, debuts[rang + 1]) : -1;
      }
    }
  }
  return meilleures.map(({ commune }) => vue(commune, null));
}
