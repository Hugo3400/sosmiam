import { redirect } from "react-router";

import type { Route } from "./+types/deconnexion";
import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { site } from "~/contenus/legal/informations-legales";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { deconnecterCompte } from "~/services/comptes.server";
import { effacerCookieSession, lireIpVisiteur, lireJetonSession } from "~/services/session-compte.server";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Déconnexion — SOS Miam" }, { name: "robots", content: "noindex" }];
}

/**
 * L'adresse seule ne déconnecte pas (un lien piégé ne peut pas te déconnecter) : retour à l'espace (au tableau pro sur
 * pro.sosmiam.fr, à « Mon compte » sur sosmiam.fr).
 */
export function loader({ request }: Route.LoaderArgs) {
  const { host, hostname } = new URL(request.url);
  if (hostname === site.adresse) throw redirect("/mon-compte");
  throw redirect(lireEspaceHote(host) === "pro" ? "/tableau" : "/espace");
}

/**
 * Déconnexion (formulaire POST, dont React Router vérifie l'origine) : la session est effacée côté API, le cookie aussi,
 * même si l'API ne répond pas. Puis retour à la connexion, ou au « Mon compte » du site principal (champ « apres »).
 */
export async function action({ request }: Route.ActionArgs) {
  const formulaire = await request.formData().catch(() => null);
  const jeton = await lireJetonSession(request);
  if (jeton) await deconnecterCompte(jeton, lireIpVisiteur(request));
  const cible = formulaire?.get("apres") === "/mon-compte" ? "/mon-compte?deconnecte" : "/connexion?deconnecte";
  throw redirect(cible, { headers: { "Set-Cookie": await effacerCookieSession() } });
}

/**
 * Jamais affichée en temps normal (le loader et l'action redirigent) ; la page existe pour que React Router vérifie
 * l'origine du formulaire, ce qu'il ne fait pas pour une adresse sans page.
 */
export default function PageDeconnexion() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <BoutonDeconnexion />
    </main>
  );
}
