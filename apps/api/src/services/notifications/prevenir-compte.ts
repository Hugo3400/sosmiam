// Une notification pour une seule personne, sur tous ses téléphones (une visite revue par l'équipe, un message d'un pote…). Pas
// d'anti-spam : c'est une réponse à ce qu'elle a fait elle-même ou un message qu'elle attend, jamais une annonce. Seulement les
// téléphones encore connectés : inscrits avec une session qui existe toujours (la base remet sessionId à null quand elle se ferme :
// déconnexion, « Me déconnecter partout », mot de passe changé, session expirée). Un téléphone prêté, vendu ou volé ne reçoit plus
// rien du compte. Les téléphones dont le jeton ne marche plus sont désactivés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { expedierPush, type ExpedierPush, type MessagePush } from "./expedier-push.ts";

/** Ce que prevenirCompte lit et écrit des téléphones : la table appareils_push (un double dans les tests) */
export type TableAppareilsPush = Pick<typeof baseDeDonnees.appareilPush, "findMany" | "update">;

export async function prevenirCompte(
  compteId: number,
  message: MessagePush,
  envoyer: ExpedierPush = expedierPush,
  appareilsPush: TableAppareilsPush = baseDeDonnees.appareilPush,
): Promise<void> {
  const appareils = await appareilsPush.findMany({
    where: { actif: true, compteId, sessionId: { not: null } },
    select: { id: true, jeton: true, plateforme: true },
  });
  await Promise.all(
    appareils.map(async (appareil) => {
      const resultat = await envoyer(appareil, message);
      if (resultat === "jeton-invalide") await appareilsPush.update({ where: { id: appareil.id }, data: { actif: false } });
      // L'erreur vient d'Apple ou de Google (statut et raison), sans donnée personnelle
      else if (resultat !== "envoyee") console.error("Notification d'un compte :", resultat.erreur);
    }),
  );
}
