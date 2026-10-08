import { CLIENTS_MIN_PART_RETOUR } from "../../regles/avis.ts";

/**
 * Part des clients d'un lieu qui reviennent (de 0 à 1) : ceux qui y ont une visite validée au moins 2 jours
 * différents (deux visites le même jour comptent pour une). En dessous de `minimumClients` clients différents : null,
 * le chiffre ne voudrait rien dire. `client` est un identifiant opaque, `jour` une date « AAAA-MM-JJ ».
 */
export function calculerPartRetour(
  visites: readonly { client: string; jour: string }[],
  minimumClients: number = CLIENTS_MIN_PART_RETOUR,
): number | null {
  const joursParClient = new Map<string, Set<string>>();
  for (const { client, jour } of visites) {
    const jours = joursParClient.get(client) ?? new Set<string>();
    jours.add(jour);
    joursParClient.set(client, jours);
  }
  if (joursParClient.size === 0 || joursParClient.size < minimumClients) return null;
  const reviennent = [...joursParClient.values()].filter((jours) => jours.size >= 2).length;
  return reviennent / joursParClient.size;
}
