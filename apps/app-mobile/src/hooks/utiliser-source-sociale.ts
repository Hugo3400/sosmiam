import { utiliserSession } from "~/hooks/utiliser-session";

/**
 * D'où viennent les potes, les messages, les suivis et la cloche :
 * - « attente » : la session n'est pas encore relue dans le coffre-fort (valeurs vides, pas prêtes) ;
 * - « compte » : un compte est connecté, tout vient de l'API ;
 * - « visite » : sans compte, rien (valeurs vides mais prêtes ; les gestes ouvrent « Crée ton compte »).
 */
export type SourceSociale = "attente" | "compte" | "visite";

/**
 * La source de la partie sociale, la même pour tous les fournisseurs. Chacun appelle toujours ses deux hooks (téléphone et
 * compte) et ne rend qu'un seul Provider : changer de source ne remonte jamais les écrans.
 */
export function utiliserSourceSociale(): SourceSociale {
  const { pret, connecte } = utiliserSession();
  if (!pret) return "attente";
  return connecte ? "compte" : "visite";
}
