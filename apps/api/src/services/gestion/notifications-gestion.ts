// Notifications dans le logiciel de gestion : écrire, viser (tout le monde, une ville, iPhone ou Android), programmer,
// estimer (combien de téléphones, combien laissés de côté par l'anti-spam), suivre et annuler.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { CiblePush } from "../notifications/file-push.ts";

export type SaisieNotification = { titre: string; texte: string; lien: string | null; cible: CiblePush; description: string; programmeeLe: Date };

export const listerNotifications = () =>
  baseDeDonnees.notificationPush.findMany({ orderBy: { programmeeLe: "desc" }, take: 100 });

export const creerNotification = (saisie: SaisieNotification) => baseDeDonnees.notificationPush.create({ data: saisie, select: { id: true } });

/** Annule une notification pas encore partie. Faux si elle est déjà partie (ou en train). */
export async function annulerNotification(id: number) {
  const { count } = await baseDeDonnees.notificationPush.updateMany({ where: { id, statut: "programmee" }, data: { statut: "annulee" } });
  return count > 0;
}
