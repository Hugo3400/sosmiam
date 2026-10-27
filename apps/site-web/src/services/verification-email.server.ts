// « Renvoyer le lien » qui confirme l'e-mail : le même traitement pour le bandeau de /espace et pour /verifier-email.
import { choisirTextes } from "../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { FORMULAIRE_RENVOI } from "~/composants/compte/BandeauVerificationEmail";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TEXTES_VERIFICATION_EMAIL_PAR_LANGUE } from "~/contenus/verification-email";
import { ecrireAttente } from "~/fonctions/compte/ecrire-attente";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { renvoyerVerification } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

/**
 * Demande un nouveau lien (personne connectée) : un toutes les 15 minutes et 5 par 24 heures, l'envoi de l'inscription
 * compris ; au-delà, l'API dit combien de temps attendre.
 */
export async function traiterRenvoiVerification(request: Request): Promise<ReponseFormulaire> {
  const { jeton } = await exigerCompte(request);
  const reponse = await renvoyerVerification(jeton, lireIpVisiteur(request));
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_VERIFICATION_EMAIL_PAR_LANGUE, langue).renvoi;
  if (reponse.ok) {
    const message = reponse.dejaVerifie ? T.dejaVerifie : T.envoye;
    return { ok: true, formulaire: FORMULAIRE_RENVOI, message: lierPonctuation(message) };
  }
  await redirigerSiSessionFermee(request, reponse.erreur);
  const message = reponse.erreur === "trop-de-demandes" ? T.tropTot(ecrireAttente(reponse.attente, langue)) : T.pasParti;
  return { ok: false, formulaire: FORMULAIRE_RENVOI, message: lierPonctuation(message) };
}
