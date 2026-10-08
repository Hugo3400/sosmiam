// Annonces Discord dans le logiciel de gestion : écrire, suivre leur publication, retirer celles pas encore parties.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export const listerAnnonces = () => baseDeDonnees.annonceDiscord.findMany({ orderBy: { creeLe: "desc" }, take: 50 });
export const creerAnnonce = (titre: string, texte: string) => baseDeDonnees.annonceDiscord.create({ data: { titre, texte } });
/** Retire une annonce pas encore publiée (ou ratée). Faux si elle est déjà sur Discord. */
export async function retirerAnnonce(id: number) {
  const { count } = await baseDeDonnees.annonceDiscord.deleteMany({ where: { id, statut: { in: ["en-attente", "echec"] } } });
  return count > 0;
}
