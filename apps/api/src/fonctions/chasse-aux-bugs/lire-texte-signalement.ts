import { estTexteAffichable } from "../../../../../packages/commun/src/validation/est-texte-affichable.ts";

export function lireTexteSignalement(valeur: unknown, minimum: number, maximum: number, multiligne = false): string | null {
  if (typeof valeur !== "string") return null;
  const unifie = valeur.replace(/\r\n?/g, "\n");
  const propre = multiligne
    ? unifie.split("\n").map((ligne) => ligne.replace(/[ \t]+/g, " ").trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim()
    : unifie.replace(/\s+/g, " ").trim();
  if (propre.length < minimum || propre.length > maximum || !estTexteAffichable(propre)) return null;
  return propre;
}
