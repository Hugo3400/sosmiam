// Connexion par e-mail et mot de passe, envoyée par un formulaire : celui de /connexion (espaces ambassadeur et pro) et
// celui du « Mon compte » de sosmiam.fr (routes/compte/mon-compte.tsx), qui a sa connexion dans la page même.
import { redirect } from "react-router";

import { choisirTextes } from "../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TEXTES_CONNEXION_COMPTE_PAR_LANGUE } from "~/contenus/connexion-compte";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { ecrireAttente } from "~/fonctions/compte/ecrire-attente";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterCompte } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur, poserCookieSession } from "~/services/session-compte.server";

/**
 * Lit l'e-mail et le mot de passe du formulaire « connexion » et ouvre la session : réussite → redirection vers `apres`
 * avec le cookie de session (lancée, jamais rendue) ; sinon la réponse à afficher dans le formulaire.
 */
export async function connecterDepuisFormulaire(request: Request, formulaire: FormData, apres: string): Promise<ReponseFormulaire> {
  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  const valeurs = { email };
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_CONNEXION_COMPTE_PAR_LANGUE, langue);
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);

  const erreurs: Record<string, string> = {};
  if (!email) erreurs.email = T.indiqueEmail;
  if (!motDePasse) erreurs.motDePasse = T.indiqueMotDePasse;
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "connexion", erreurs, valeurs };

  const reponse = await connecterCompte(email, motDePasse, lireIpVisiteur(request));
  if (reponse.ok) throw redirect(apres, { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });

  // Même message pour un e-mail inconnu, un mauvais mot de passe et un compte sans mot de passe (Apple ou Google) : rien
  // n'est révélé sur les comptes existants
  let message = T.pasMarche;
  if (reponse.erreur === "identifiants" || reponse.erreur === "champ-invalide") message = T.identifiants;
  if (reponse.erreur === "occupe") message = M.occupe;
  // Après 5 mots de passe faux : 2 minutes d'attente, puis le double à chaque fois, 2 heures au plus
  if (reponse.erreur === "trop-de-demandes") message = M.tropDEssais(ecrireAttente(reponse.attente, langue));
  return { ok: false, formulaire: "connexion", message: lierPonctuation(message), valeurs };
}
