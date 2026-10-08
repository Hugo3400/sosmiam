import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/connexion";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterCompte } from "~/services/comptes.server";
import { lireCompteConnecte, lireIpVisiteur, lireRetourSur, poserCookieSession } from "~/services/session-compte.server";

/** Petits mots affichés en arrivant (?au-revoir après une suppression de compte, ?deconnecte après une déconnexion). */
const accueils = {
  "au-revoir": "Ton compte est effacé, avec tout ce qui allait avec. Merci d'avoir fait un bout de chemin avec SOS Miam !",
  deconnecte: "Tu es déconnecté. À bientôt !",
};

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Connexion", description: "Connecte-toi à ton espace ambassadeur SOS Miam." }),
    { name: "robots", content: "noindex" },
  ];
}

/** Déjà connecté : direction l'espace (ou la page demandée). */
export async function loader({ request }: Route.LoaderArgs) {
  const parametres = new URL(request.url).searchParams;
  const retour = lireRetourSur(parametres.get("retour"));
  if (await lireCompteConnecte(request)) throw redirect(retour ?? "/espace");
  const accueil = parametres.has("au-revoir") ? accueils["au-revoir"] : parametres.has("deconnecte") ? accueils.deconnecte : null;
  return { retour, accueil: accueil && lierPonctuation(accueil) };
}

/** Connexion (avec ou sans JavaScript) : un nouveau jeton, gardé dans le cookie de session. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  const retour = lireRetourSur(formulaire.get("retour"));
  const valeurs = { email };

  const erreurs: Record<string, string> = {};
  if (!email) erreurs.email = "Indique ton e-mail.";
  if (!motDePasse) erreurs.motDePasse = "Indique ton mot de passe.";
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "connexion", erreurs, valeurs };

  const reponse = await connecterCompte(email, motDePasse, lireIpVisiteur(request));
  if (reponse.ok) throw redirect(retour ?? "/espace", { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });

  // Même message pour un e-mail inconnu et un mauvais mot de passe : rien n'est révélé sur les comptes existants
  let message = "Oups, la connexion n'a pas marché. Réessaie dans un instant.";
  if (reponse.erreur === "identifiants" || reponse.erreur === "champ-invalide") message = "E-mail ou mot de passe incorrect.";
  if (reponse.erreur === "trop-de-demandes") {
    const minutes = reponse.attente ? Math.max(1, Math.ceil(reponse.attente / 60)) : null;
    message = minutes ? `Trop d'essais : réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` : "Trop d'essais : réessaie dans quelques minutes.";
  }
  return { ok: false, formulaire: "connexion", message: lierPonctuation(message), valeurs };
}

/** Page /connexion : e-mail et mot de passe ; « ?retour= » rouvre ensuite la page demandée. */
export default function PageConnexion({ loaderData }: Route.ComponentProps) {
  const { retour, accueil } = loaderData;
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Content de te revoir ! Connecte-toi pour retrouver ton espace ambassadeur.")}>
        Connexion
      </TitreSection>
      {accueil && (
        <p role="status" className="mx-auto -mt-4 mb-8 max-w-xl rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-center font-semibold">
          {accueil}
        </p>
      )}
      <div className="mx-auto max-w-xl">
        <FormulaireConnexion retour={retour} />
        <p className="mt-6 text-center text-gris">
          {lierPonctuation("Pas encore de compte ? ")}
          <Link to="/inscription" className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
            Deviens ambassadeur
          </Link>
        </p>
      </div>
    </Section>
  );
}
