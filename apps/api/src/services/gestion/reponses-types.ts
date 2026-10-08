// Réponses types du logiciel de gestion : des modèles de mails réutilisables, insérés en un clic.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export const CATEGORIES_REPONSES = ["demande", "ambassadeur", "moderation", "lieu", "createur", "autre"] as const;
export type SaisieReponseType = { titre: string; categorie: (typeof CATEGORIES_REPONSES)[number]; objet: string; texte: string };

export const listerReponsesTypes = () => baseDeDonnees.reponseType.findMany({ orderBy: [{ categorie: "asc" }, { titre: "asc" }] });
export const creerReponseType = (saisie: SaisieReponseType) => baseDeDonnees.reponseType.create({ data: saisie });
export const modifierReponseType = (id: number, saisie: SaisieReponseType) => baseDeDonnees.reponseType.update({ where: { id }, data: saisie }).catch(() => null);
export async function supprimerReponseType(id: number) {
  const { count } = await baseDeDonnees.reponseType.deleteMany({ where: { id } });
  return count > 0;
}
