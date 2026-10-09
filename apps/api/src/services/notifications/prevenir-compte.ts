// Une notification pour une seule personne, sur tous ses téléphones (une visite revue par l'équipe, par exemple). Pas d'anti-spam :
// c'est une réponse à ce qu'elle a fait elle-même, jamais une annonce. Les téléphones dont le jeton ne marche plus sont désactivés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { expedierPush, type ExpedierPush, type MessagePush } from "./expedier-push.ts";

export async function prevenirCompte(compteId: number, message: MessagePush, envoyer: ExpedierPush = expedierPush): Promise<void> {
  const appareils = await baseDeDonnees.appareilPush.findMany({ where: { actif: true, compteId }, select: { id: true, jeton: true, plateforme: true } });
  await Promise.all(
    appareils.map(async (appareil) => {
      const resultat = await envoyer(appareil, message);
      if (resultat === "jeton-invalide") await baseDeDonnees.appareilPush.update({ where: { id: appareil.id }, data: { actif: false } });
      // L'erreur vient d'Apple ou de Google (statut et raison), sans donnée personnelle
      else if (resultat !== "envoyee") console.error("Notification d'un compte :", resultat.erreur);
    }),
  );
}
