// Réponses types du logiciel de gestion : des modèles de mails réutilisables, insérés en un clic.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { CategorieReponse } from "./categories-reponses.ts";

export type SaisieReponseType = { titre: string; categorie: CategorieReponse; objet: string; texte: string };

export const listerReponsesTypes = () => baseDeDonnees.reponseType.findMany({ orderBy: [{ categorie: "asc" }, { titre: "asc" }] });
export const creerReponseType = (saisie: SaisieReponseType) => baseDeDonnees.reponseType.create({ data: saisie });
export const modifierReponseType = (id: number, saisie: SaisieReponseType) => baseDeDonnees.reponseType.update({ where: { id }, data: saisie }).catch(() => null);
export async function supprimerReponseType(id: number) {
  const { count } = await baseDeDonnees.reponseType.deleteMany({ where: { id } });
  return count > 0;
}
