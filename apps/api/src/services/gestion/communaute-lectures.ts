import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export async function listerCommentairesIdeeGestion(ideeId: number) {
  const lignes = await baseDeDonnees.commentaireIdeeCommunaute.findMany({
    where: { ideeId },
    orderBy: [{ creeLe: "asc" }, { id: "asc" }],
    take: 500,
    select: { id: true, texte: true, reponseAId: true, masqueLe: true, suspenduLe: true, retireLe: true, creeLe: true, auteur: { select: { pseudo: true, prenom: true } } },
  });
  return lignes.map(({ masqueLe, suspenduLe, retireLe, ...c }) => ({ ...c, masque: masqueLe !== null, suspendu: suspenduLe !== null, retire: retireLe !== null }));
}
