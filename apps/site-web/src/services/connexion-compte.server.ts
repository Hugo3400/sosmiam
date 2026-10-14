// Connexion par e-mail et mot de passe, envoyée par un formulaire : celui de /connexion (espaces ambassadeur et pro) et
// celui du « Mon compte » de sosmiam.fr (routes/compte/mon-compte.tsx), qui a sa connexion dans la page même.
import { redirect } from "react-router";

import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterCompte, decrireAttente, MESSAGE_OCCUPE } from "~/services/comptes.server";
import { lireIpVisiteur, poserCookieSession } from "~/services/session-compte.server";

/**
 * Lit l'e-mail et le mot de passe du formulaire « connexion » et ouvre la session : réussite → redirection vers `apres`
 * avec le cookie de session (lancée, jamais rendue) ; sinon la réponse à afficher dans le formulaire.
 */
export async function connecterDepuisFormulaire(request: Request, formulaire: FormData, apres: string): Promise<ReponseFormulaire> {
  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  const valeurs = { email };

  const erreurs: Record<string, string> = {};
  if (!email) erreurs.email = "Indique ton e-mail.";
  if (!motDePasse) erreurs.motDePasse = "Indique ton mot de passe.";
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "connexion", erreurs, valeurs };

  const reponse = await connecterCompte(email, motDePasse, lireIpVisiteur(request));
  if (reponse.ok) throw redirect(apres, { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });

  // Même message pour un e-mail inconnu, un mauvais mot de passe et un compte sans mot de passe (Apple ou Google) : rien
  // n'est révélé sur les comptes existants
  let message = "Oups, la connexion n'a pas marché. Réessaie dans un instant.";
  if (reponse.erreur === "identifiants" || reponse.erreur === "champ-invalide") message = "E-mail ou mot de passe incorrect.";
  if (reponse.erreur === "occupe") message = MESSAGE_OCCUPE;
  // Après 5 mots de passe faux : 2 minutes d'attente, puis le double à chaque fois, 2 heures au plus
  if (reponse.erreur === "trop-de-demandes") message = `Trop d'essais : réessaie dans ${decrireAttente(reponse.attente)}.`;
  return { ok: false, formulaire: "connexion", message: lierPonctuation(message), valeurs };
}
