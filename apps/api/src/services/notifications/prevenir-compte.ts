// Une notification pour une seule personne, sur tous ses téléphones (une visite revue par l'équipe, un message d'un pote…). Pas
// d'anti-spam : c'est une réponse à ce qu'elle a fait elle-même ou un message qu'elle attend, jamais une annonce. Seulement les
// téléphones encore connectés : inscrits avec une session qui existe toujours (la base remet sessionId à null quand elle se ferme :
// déconnexion, « Me déconnecter partout », mot de passe changé, session expirée). Un téléphone prêté, vendu ou volé ne reçoit plus
// rien du compte. Les téléphones dont le jeton ne marche plus sont désactivés.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { resumerErreur } from "../../fonctions/comptes/resumer-erreur.ts";
import { expedierPush, type ExpedierPush, type MessagePush } from "./expedier-push.ts";
import type { LirePastille } from "./lire-pastille-compte.ts";

/** Ce que prevenirCompte lit et écrit des téléphones : la table appareils_push (un double dans les tests) */
export type TableAppareilsPush = Pick<typeof baseDeDonnees.appareilPush, "findMany" | "update">;

let pastilleBranchee: LirePastille | null = null;

export function brancherPastillePush(lire: LirePastille | null): void {
  pastilleBranchee = lire;
}

async function lirePastille(lire: LirePastille | null, compteId: number): Promise<number | undefined> {
  if (!lire) return undefined;
  try {
    return await lire(compteId);
  } catch (erreur) {
    console.error("Pastille de l'icône :", resumerErreur(erreur));
    return undefined;
  }
}

export async function prevenirCompte(
  compteId: number,
  message: MessagePush,
  envoyer: ExpedierPush = expedierPush,
  appareilsPush: TableAppareilsPush = baseDeDonnees.appareilPush,
  pastille: LirePastille | null = pastilleBranchee,
): Promise<void> {
  await prevenirCompteEtCompter(compteId, message, envoyer, appareilsPush, pastille);
}

/** Pareil, et rend sur combien de téléphones la notification est partie (Miam Safe : 0, la personne n'est pas prévenue) */
export async function prevenirCompteEtCompter(
  compteId: number,
  message: MessagePush,
  envoyer: ExpedierPush = expedierPush,
  appareilsPush: TableAppareilsPush = baseDeDonnees.appareilPush,
  pastille: LirePastille | null = pastilleBranchee,
): Promise<number> {
  const appareils = await appareilsPush.findMany({
    where: { actif: true, compteId, sessionId: { not: null } },
    select: { id: true, jeton: true, plateforme: true },
  });
  if (appareils.length === 0) return 0;
  const badge = message.badge ?? (await lirePastille(pastille, compteId));
  const avecBadge = badge === undefined ? message : { ...message, badge };
  const envoyees = await Promise.all(
    appareils.map(async (appareil) => {
      const resultat = await envoyer(appareil, avecBadge);
      if (resultat === "jeton-invalide") await appareilsPush.update({ where: { id: appareil.id }, data: { actif: false } });
      // L'erreur vient d'Apple ou de Google (statut et raison), sans donnée personnelle
      else if (resultat !== "envoyee") console.error("Notification d'un compte :", resultat.erreur);
      return resultat === "envoyee";
    }),
  );
  return envoyees.filter(Boolean).length;
}
