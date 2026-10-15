import type { Signalement } from "../../base-de-donnees/client-genere/client.ts";

/**
 * Le fichier chiffré (photo, note vocale) que cite ce signalement (fichierMedia) reste sur le disque pour la modération
 * (décision de Hugo du 15/10/2026) : le signalement est ouvert (pas encore jugé, ou contesté et pas encore réexaminé), ou il
 * a été jugé APRÈS `seuil` (la décision, ou le réexamen s'il y en a eu un : COALESCE(reexamine_le, traite_le) > seuil), même
 * retenu, car un réexamen se fait avec la preuve. `seuil` : SeuilsMenageSocial.fichiersSignales (maintenant − 183 jours, le
 * délai de contestation). Version en mémoire de signalementsGardantLeurFichier (services/effacer-conversations.ts).
 */
export function estFichierGardeParSignalement(
  s: Pick<Signalement, "statut" | "contesteLe" | "reexamineLe" | "traiteLe">,
  seuil: Date,
): boolean {
  // « == null » : une date absente compte comme vide (les tables en mémoire des tests n'écrivent pas toutes les colonnes)
  if (s.statut === "a-traiter" || (s.contesteLe != null && s.reexamineLe == null)) return true;
  const juge = s.reexamineLe ?? s.traiteLe ?? null;
  return juge !== null && juge.getTime() > seuil.getTime();
}
