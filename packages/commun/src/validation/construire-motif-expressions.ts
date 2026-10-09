import { simplifierTexteFiltre } from "./simplifier-texte-filtre.ts";

// Ne trouve jamais rien : pour une liste vide (un « (?:) » vide trouverait chaque espace)
const MOTIF_VIDE = /(?!)/;

/**
 * Transforme une liste d'expressions (écriture de regles/mots-interdits.ts : mots séparés par des espaces, « * » à la fin
 * d'un mot pour tout mot qui commence ainsi) en un seul motif qui les cherche en mots entiers, dans un texte préparé par
 * preparerFormesFiltre (« ␣mot␣mot␣ » : minuscules sans accents, chiffres et lettres séparés par une seule espace).
 * Le motif mange l'espace d'avant et garde celle d'après : remplacé par « ␣ », il retire l'expression sans coller ses voisins.
 */
export function construireMotifExpressions(expressions: readonly string[], drapeaux = ""): RegExp {
  const choix = expressions
    .map((expression) =>
      simplifierTexteFiltre(expression)
        // Apostrophes, tirets et ponctuation séparent les mots, comme dans les textes (« t'es » → « t es »)
        .replace(/[^a-z0-9*]+/g, " ")
        .trim()
        .split(" ")
        .map((mot) => (mot.endsWith("*") ? `${mot.replace(/\*/g, "")}[a-z0-9]*` : mot.replace(/\*/g, "")))
        .filter((mot) => mot !== "" && mot !== "[a-z0-9]*")
        .join(" "),
    )
    .filter((expression) => expression !== "");
  return choix.length === 0 ? new RegExp(MOTIF_VIDE.source, drapeaux) : new RegExp(` (?:${choix.join("|")})(?= )`, drapeaux);
}
