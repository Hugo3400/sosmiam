import { appeler } from "./client-gestion.ts";

export type CategorieReponse = "demande" | "ambassadeur" | "moderation" | "lieu" | "createur" | "autre";
export type ReponseType = { id: number; titre: string; categorie: CategorieReponse; objet: string; texte: string; modifieLe: string };
export type SaisieReponseType = Pick<ReponseType, "titre" | "categorie" | "objet" | "texte">;

export const listerReponsesTypes = () => appeler<ReponseType[]>("GET", "/reponses-types");
export const enregistrerReponseType = (id: number | null, saisie: SaisieReponseType) =>
  id ? appeler<ReponseType>("PUT", `/reponses-types/${id}`, { corps: saisie }) : appeler<ReponseType>("POST", "/reponses-types", { corps: saisie });
export const supprimerReponseType = (id: number) => appeler<{ ok: true }>("DELETE", `/reponses-types/${id}`);
