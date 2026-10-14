import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/connexion";
import { BoutonsConnexionExterne } from "~/composants/compte/BoutonsConnexionExterne";
import { ConnexionParQr } from "~/composants/compte/ConnexionParQr";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { lireMessageConnexionExterne } from "~/fonctions/connexion-externe/lire-message-connexion-externe";
import { lireEspaceHote, type EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterDepuisFormulaire } from "~/services/connexion-compte.server";
import { lireQrAffiche } from "~/services/connexion-qr.server";
import { lireFournisseursActifs } from "~/services/reglages-connexion-externe.server";
import { lireCompteConnecte, lireRetourSur } from "~/services/session-compte.server";

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
  // « Continuer avec Apple / Google » : les boutons réglés, et le message d'un essai raté (?externe=…)
  const fournisseurs = lireFournisseursActifs();
  return { espace, retour, accueil: accueil && lierPonctuation(accueil), fournisseurs, messageExterne: lireMessageConnexionExterne(url.searchParams.get("externe")),
    // « Me connecter avec l'app » : le QR redessiné après un retour sans JavaScript (« ?qr=… »), sinon rien
    qr: lireQrAffiche(request) };
}

/** Connexion (avec ou sans JavaScript) : un nouveau jeton, gardé dans le cookie de session. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const retour = lireRetourSur(formulaire.get("retour"));
  return connecterDepuisFormulaire(request, formulaire, retour ?? textes[lireEspaceHote(new URL(request.url).host)].accueil);
}

/** Page /connexion : Apple, Google, ou e-mail et mot de passe ; « ?retour= » rouvre ensuite la page demandée. */
export default function PageConnexion({ loaderData }: Route.ComponentProps) {
  const { espace, retour, accueil, fournisseurs, messageExterne, qr } = loaderData;
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
        <BoutonsConnexionExterne fournisseurs={fournisseurs} depart="/connexion" retour={retour} message={messageExterne} />
        <FormulaireConnexion retour={retour} />
        <ConnexionParQr depart="/connexion" retour={retour} initial={qr} />
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
