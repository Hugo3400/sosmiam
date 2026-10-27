import { DUREE_CONTESTATION_JOURS } from "../../../../packages/commun/src/regles/signalement.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

type BaseMenageArticlesActus = Pick<typeof baseDeDonnees, "articleActus">;

const JOUR_MS = 86_400_000;

export async function menagerArticlesActus(maintenant = new Date(), base: BaseMenageArticlesActus = baseDeDonnees): Promise<number> {
  const avant = new Date(maintenant.getTime() - DUREE_CONTESTATION_JOURS * JOUR_MS);
  const { count } = await base.articleActus.deleteMany({ where: { statut: { in: ["refuse", "retire"] }, refusLe: { lt: avant } } });
  return count;
}
