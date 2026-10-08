import { villesConnues } from "~/contenus/inscription/villes";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

// Petits mots qui restent en minuscules au milieu d'un nom de commune (« Saint-Jean-de-Védas », « Villeneuve-d'Ascq », « Pont-l'Abbé »)
const PETITS_MOTS = new Set(["de", "du", "des", "d", "la", "le", "les", "l", "sur", "sous", "en", "et", "lès", "lez", "au", "aux", "à"]);

/** Majuscule à chaque partie d'un nom de commune, sauf aux petits mots qui ne sont pas au début (« Le Grau-du-Roi »). */
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
 * Met au propre une ville tapée à la main : espaces en trop retirés, l'orthographe exacte d'une ville de notre liste,
 * partout en France, quand c'est elle (« clermont ferrand » → « Clermont-Ferrand »), sinon les majuscules d'un nom de commune
 * quand il est tapé tout en minuscules, tout en majuscules, ou avec juste des initiales, comme le fait le clavier
 * (« Saint-jean-De-védas » → « Saint-Jean-de-Védas »).
 */
export function nettoyerNomVille(saisie: string): string {
  const propre = saisie.replace(/\s+/g, " ").trim();
  const cherche = normaliserRecherche(propre);
  const connue = villesConnues.find((ville) => normaliserRecherche(ville) === cherche);
  if (connue) return connue;
  // Les initiales mises à part, une majuscule au milieu d'un mot (« McAllen ») veut dire que la casse est voulue : on n'y touche pas
  const sansInitiales = propre.replace(/(^|[\s'’-])\p{L}/gu, (debut) => debut.toLocaleLowerCase("fr-FR"));
  const casseVoulue = sansInitiales !== sansInitiales.toLocaleLowerCase("fr-FR") && propre !== propre.toLocaleUpperCase("fr-FR");
  return casseVoulue ? propre.charAt(0).toLocaleUpperCase("fr-FR") + propre.slice(1) : mettreMajuscules(propre);
}
