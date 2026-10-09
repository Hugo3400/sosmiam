// « Renvoyer le lien » qui confirme l'e-mail : le même traitement pour le bandeau de /espace et pour /verifier-email.
import { FORMULAIRE_RENVOI } from "~/composants/compte/BandeauVerificationEmail";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireAttente, renvoyerVerification } from "~/services/comptes.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

/**
 * Demande un nouveau lien (personne connectée) : un toutes les 15 minutes et 5 par 24 heures, l'envoi de l'inscription
 * compris ; au-delà, l'API dit combien de temps attendre.
 */
export async function traiterRenvoiVerification(request: Request): Promise<ReponseFormulaire> {
  const { jeton } = await exigerCompte(request);
  const reponse = await renvoyerVerification(jeton, lireIpVisiteur(request));
  if (reponse.ok) {
    const message = reponse.dejaVerifie
      ? "Bonne nouvelle : ton adresse est déjà confirmée !"
      : "C'est reparti : un nouveau lien t'attend dans ta boîte mail (il marche 7 jours). Pense à regarder tes indésirables !";
    return { ok: true, formulaire: FORMULAIRE_RENVOI, message: lierPonctuation(message) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  const message = reponse.erreur === "trop-de-demandes"
    ? `Un lien est parti il y a peu : attends ${decrireAttente(reponse.attente)} avant d'en demander un autre (et regarde tes indésirables).`
    : "Oups, le lien n'est pas parti. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: FORMULAIRE_RENVOI, message: lierPonctuation(message) };
}
