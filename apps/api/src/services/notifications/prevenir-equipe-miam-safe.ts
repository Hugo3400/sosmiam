// Une alerte silencieuse Miam Safe arrive tout de suite sur les téléphones de l'équipe du lieu (gérants et membres validés),
// même app fermée, en notification « urgente ». Le prénom et l'endroit seulement, jamais le nom ni la photo.
// Pas de file d'attente ni d'anti-spam ici : chaque seconde compte (le nombre d'alertes est limité à l'envoi, par compte).
// Seulement les téléphones encore connectés (session ouverte, comme prevenirCompte) : l'ancien téléphone d'un serveur
// qui s'est déconnecté ne reçoit plus les alertes du lieu.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { ecrireTexteAlerte } from "../../fonctions/miam-safe/ecrire-texte-alerte.ts";
import { expedierPush, type ExpedierPush } from "./expedier-push.ts";
import type { TableAppareilsPush } from "./prevenir-compte.ts";

export async function prevenirEquipeMiamSafe(
  alerte: { lieuId: number; prenom: string; endroit: string; detail: string },
  envoyer: ExpedierPush = expedierPush,
  appareilsPush: TableAppareilsPush = baseDeDonnees.appareilPush,
): Promise<void> {
  const appareils = await appareilsPush.findMany({
    where: { actif: true, sessionId: { not: null }, compte: { rattachementsLieux: { some: { lieuId: alerte.lieuId, statut: "valide" } } } },
    select: { id: true, jeton: true, plateforme: true },
  });
  const message = { titre: `🛡 ${alerte.prenom} a besoin d'aide`, texte: ecrireTexteAlerte(alerte.endroit, alerte.detail), lien: "/pro/comptoir", urgent: true };
  await Promise.all(
    appareils.map(async (appareil) => {
      const resultat = await envoyer(appareil, message);
      if (resultat === "jeton-invalide") await appareilsPush.update({ where: { id: appareil.id }, data: { actif: false } });
      // L'erreur vient d'Apple ou de Google (statut et raison), sans donnée personnelle
      else if (resultat !== "envoyee") console.error("Alerte Miam Safe :", resultat.erreur);
    }),
  );
}
