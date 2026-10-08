// Annonces Discord : écrites dans le logiciel de gestion, publiées par le bot, qui vient les chercher ici.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

/** Annonces que le bot doit publier (les plus anciennes d'abord). */
export const listerAnnoncesAPublier = () =>
  baseDeDonnees.annonceDiscord.findMany({ where: { statut: "en-attente" }, orderBy: { creeLe: "asc" }, take: 5, select: { id: true, titre: true, texte: true } });

/** Le bot dit ce qu'il a fait d'une annonce : publiée (avec le lien du message) ou ratée (avec la raison). */
export async function noterPublicationAnnonce(id: number, resultat: { lien: string } | { erreur: string }) {
  const { count } = await baseDeDonnees.annonceDiscord.updateMany({
    where: { id, statut: "en-attente" },
    data: "lien" in resultat
      ? { statut: "publiee", lienMessage: resultat.lien.slice(0, 200), publieeLe: new Date(), erreur: null }
      : { statut: "echec", erreur: resultat.erreur.slice(0, 300) },
  });
  return count > 0;
}
