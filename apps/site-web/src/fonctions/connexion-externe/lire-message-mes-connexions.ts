// Aucun import « ~/… » ici : les tests (tests/mes-connexions.test.ts) lancent ce fichier directement avec Node.
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { REUSSITES_MES_CONNEXIONS, TEXTES_MES_CONNEXIONS_PAR_LANGUE } from "../../contenus/mes-connexions.ts";
import { lireCodeMesConnexions } from "./lire-code-mes-connexions.ts";

const NOMS = { apple: "Apple", google: "Google" } as const;

/**
 * Le message de « ?connexions=<code>&avec=<fournisseur> », ou null pour un code absent ou inconnu (rien de tapé dans
 * l'adresse n'est affiché : seulement nos textes, avec « Apple », « Google » ou « Apple ou Google »).
 */
export function lireMessageMesConnexions(code: string | null, avec: string | null, langue: Langue = LANGUE_PAR_DEFAUT): { texte: string; reussite: boolean } | null {
  const connu = lireCodeMesConnexions(code);
  if (connu === null) return null;
  const T = choisirTextes(TEXTES_MES_CONNEXIONS_PAR_LANGUE, langue);
  const nom = avec === "apple" || avec === "google" ? NOMS[avec] : T.appleOuGoogle;
  return { texte: T.messages[connu].replaceAll("{fournisseur}", nom), reussite: REUSSITES_MES_CONNEXIONS.includes(connu) };
}
