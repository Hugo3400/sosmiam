import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/connexion";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { lireEspaceHote, type EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterCompte, decrireAttente, MESSAGE_OCCUPE } from "~/services/comptes.server";
import { lireCompteConnecte, lireIpVisiteur, lireRetourSur, poserCookieSession } from "~/services/session-compte.server";

/**
 * Petits mots affichés en arrivant (?au-revoir après une suppression de compte, ?deconnecte après une déconnexion).
 * Pas de « avec tout ce qui allait avec » : un prénom « Déniché par » reste sur la fiche d'un lieu accepté.
 */
const accueils = {
  "au-revoir": "Ton compte est effacé. Merci d'avoir fait un bout de chemin avec SOS Miam !",
  deconnecte: "Tu es déconnecté. À bientôt !",
};

/** Ce qui change d'un espace à l'autre : la page ouverte après la connexion, et les mots de la page. */
const textes: Record<EspaceCompte, { accueil: string; description: string; chapo: string; inscription: string }> = {
  ambassadeur: {
    accueil: "/espace",
    description: "Connecte-toi à ton espace ambassadeur SOS Miam.",
    chapo: "Content de te revoir ! Connecte-toi pour retrouver ton espace ambassadeur.",
    inscription: "Deviens ambassadeur",
  },
  pro: {
    accueil: "/tableau",
    description: "Connecte-toi à l'espace pro SOS Miam : ta fiche, ton équipe, ton affichette.",
    chapo: "Content de te revoir ! Connecte-toi pour retrouver ton lieu.",
    inscription: "Crée ton compte",
  },
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Connexion", description: textes[loaderData?.espace ?? "ambassadeur"].description }),
    { name: "robots", content: "noindex" },
  ];
}

/** Déjà connecté : direction l'espace (ou la page demandée). */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const espace = lireEspaceHote(url.host);
  const retour = lireRetourSur(url.searchParams.get("retour"));
  if (await lireCompteConnecte(request)) throw redirect(retour ?? textes[espace].accueil);
  const accueil = url.searchParams.has("au-revoir") ? accueils["au-revoir"] : url.searchParams.has("deconnecte") ? accueils.deconnecte : null;
  return { espace, retour, accueil: accueil && lierPonctuation(accueil) };
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
  const accueilEspace = textes[lireEspaceHote(new URL(request.url).host)].accueil;
  if (reponse.ok) throw redirect(retour ?? accueilEspace, { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });

  // Même message pour un e-mail inconnu et un mauvais mot de passe : rien n'est révélé sur les comptes existants
  let message = "Oups, la connexion n'a pas marché. Réessaie dans un instant.";
  if (reponse.erreur === "identifiants" || reponse.erreur === "champ-invalide") message = "E-mail ou mot de passe incorrect.";
  if (reponse.erreur === "occupe") message = MESSAGE_OCCUPE;
  // Après 5 mots de passe faux : 2 minutes d'attente, puis le double à chaque fois, 2 heures au plus
  if (reponse.erreur === "trop-de-demandes") message = `Trop d'essais : réessaie dans ${decrireAttente(reponse.attente)}.`;
  return { ok: false, formulaire: "connexion", message: lierPonctuation(message), valeurs };
}

/** Page /connexion : e-mail et mot de passe ; « ?retour= » rouvre ensuite la page demandée. */
export default function PageConnexion({ loaderData }: Route.ComponentProps) {
  const { espace, retour, accueil } = loaderData;
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(textes[espace].chapo)}>
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
            {textes[espace].inscription}
          </Link>
        </p>
      </div>
    </Section>
  );
}
