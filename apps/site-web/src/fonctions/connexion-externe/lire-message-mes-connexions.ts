// Aucun import « ~/… » ici : les tests (tests/mes-connexions.test.ts) lancent ce fichier directement avec Node.
import { messagesMesConnexions, REUSSITES_MES_CONNEXIONS, type CodeMesConnexions } from "../../contenus/mes-connexions.ts";

const NOMS = { apple: "Apple", google: "Google" } as const;

/**
 * Le message de « ?connexions=<code>&avec=<fournisseur> », ou null pour un code absent ou inconnu (rien de tapé dans
 * l'adresse n'est affiché : seulement nos textes, avec « Apple », « Google » ou « Apple ou Google »).
 */
export function lireMessageMesConnexions(code: string | null, avec: string | null): { texte: string; reussite: boolean } | null {
  if (code === null || !Object.hasOwn(messagesMesConnexions, code)) return null;
  const nom = avec === "apple" || avec === "google" ? NOMS[avec] : "Apple ou Google";
  const connu = code as CodeMesConnexions;
  return { texte: messagesMesConnexions[connu].replaceAll("{fournisseur}", nom), reussite: REUSSITES_MES_CONNEXIONS.includes(connu) };
}
