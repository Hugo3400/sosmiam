import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

// Petits mots qui restent en minuscules au milieu d'un nom de commune (« Saint-Jean-de-Védas », « Palavas-les-Flots »)
const PETITS_MOTS = new Set(["de", "du", "des", "la", "le", "les", "sur", "sous", "en", "et", "lès", "lez", "aux", "à"]);

/** Majuscule à chaque partie d'un nom tapé tout en minuscules (ou tout en majuscules), sauf aux petits mots. */
function mettreMajuscules(nom: string): string {
  return nom
    .toLocaleLowerCase("fr-FR")
    .split(/([\s'’-])/)
    .map((partie, index) => {
      if (index > 0 && PETITS_MOTS.has(partie)) return partie;
      return partie.charAt(0).toLocaleUpperCase("fr-FR") + partie.slice(1);
    })
    .join("");
}

/**
 * Met au propre une ville tapée à la main : espaces en trop retirés, l'orthographe exacte d'une ville connue quand c'est elle
 * (« montpellier » → « Montpellier »), sinon les majuscules d'un nom de commune quand tout est tapé dans la même casse.
 */
export function nettoyerNomVille(saisie: string, villesConnues: readonly string[]): string {
  const propre = saisie.replace(/\s+/g, " ").trim();
  const connue = villesConnues.find((ville) => normaliserRecherche(ville) === normaliserRecherche(propre));
  if (connue) return connue;
  const memeCasse = propre === propre.toLocaleLowerCase("fr-FR") || propre === propre.toLocaleUpperCase("fr-FR");
  return memeCasse ? mettreMajuscules(propre) : propre.charAt(0).toLocaleUpperCase("fr-FR") + propre.slice(1);
}
