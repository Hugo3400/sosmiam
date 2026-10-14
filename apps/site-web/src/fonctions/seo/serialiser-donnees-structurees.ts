// Aucun import « ~/… » ici : le test (tests/donnees-structurees.test.ts) lance ce fichier directement avec Node.

/** Caractères qui pourraient fermer la balise <script> ou casser le JavaScript, remplacés par leur forme \uXXXX (JSON valide) */
const ECHAPPEMENTS: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * Le texte d'une balise <script type="application/ld+json"> : du JSON où « < », « > », « & » et les séparateurs de ligne
 * Unicode sont échappés. Un nom de lieu comme « </script><script>… » reste du texte : impossible d'injecter du HTML.
 */
export function serialiserDonneesStructurees(donnees: unknown): string {
  return JSON.stringify(donnees).replace(/[<>&\u2028\u2029]/g, (caractere) => ECHAPPEMENTS[caractere] ?? caractere);
}
