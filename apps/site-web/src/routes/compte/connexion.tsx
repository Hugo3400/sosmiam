import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/connexion";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { BoutonsConnexionExterne } from "~/composants/compte/BoutonsConnexionExterne";
import { ConnexionParQr } from "~/composants/compte/ConnexionParQr";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_CONNEXION_COMPTE_PAR_LANGUE } from "~/contenus/connexion-compte";
import { lireCodeConnexionExterne } from "~/fonctions/connexion-externe/lire-code-connexion-externe";
import { lireEspaceHote, type EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { connecterDepuisFormulaire } from "~/services/connexion-compte.server";
import { lireQrAffiche } from "~/services/connexion-qr.server";
import { lireFournisseursActifs } from "~/services/reglages-connexion-externe.server";
import { lireCompteConnecte, lireRetourSur } from "~/services/session-compte.server";

const ACCUEILS: Record<EspaceCompte, string> = { ambassadeur: "/espace", pro: "/tableau" };

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_CONNEXION_COMPTE_PAR_LANGUE, langue);
  return [
    ...creerMeta({ titre: T.titre, description: T.espaces[loaderData?.espace ?? "ambassadeur"].description, langue }),
    { name: "robots", content: "noindex" },
  ];
}

/** Déjà connecté : direction l'espace (ou la page demandée). */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const espace = lireEspaceHote(url.host);
  const retour = lireRetourSur(url.searchParams.get("retour"));
  if (await lireCompteConnecte(request)) throw redirect(retour ?? ACCUEILS[espace]);
  const accueil = url.searchParams.has("au-revoir") ? "au-revoir" as const : url.searchParams.has("deconnecte") ? "deconnecte" as const : null;
  // « Continuer avec Apple / Google » : les boutons réglés, et le message d'un essai raté (?externe=…)
  const fournisseurs = lireFournisseursActifs();
  return { espace, retour, accueil, fournisseurs, messageExterne: lireCodeConnexionExterne(url.searchParams.get("externe")),
    // « Me connecter avec l'app » : le QR redessiné après un retour sans JavaScript (« ?qr=… »), sinon rien
    qr: lireQrAffiche(request) };
}

/** Connexion (avec ou sans JavaScript) : un nouveau jeton, gardé dans le cookie de session. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const retour = lireRetourSur(formulaire.get("retour"));
  return connecterDepuisFormulaire(request, formulaire, retour ?? ACCUEILS[lireEspaceHote(new URL(request.url).host)]);
}

/** Page /connexion : Apple, Google, ou e-mail et mot de passe ; « ?retour= » rouvre ensuite la page demandée. */
export default function PageConnexion({ loaderData }: Route.ComponentProps) {
  const { espace, retour, accueil, fournisseurs, messageExterne, qr } = loaderData;
  const T = utiliserTextes(TEXTES_CONNEXION_COMPTE_PAR_LANGUE);
  const textes = T.espaces[espace];
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(textes.chapo)}>
        {T.titre}
      </TitreSection>
      {accueil && (
        <p role="status" className="mx-auto -mt-4 mb-8 max-w-xl rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-center font-semibold">
          {lierPonctuation(T.accueils[accueil])}
        </p>
      )}
      <div className="mx-auto max-w-xl">
        <BoutonsConnexionExterne fournisseurs={fournisseurs} depart="/connexion" retour={retour} message={messageExterne} />
        <FormulaireConnexion retour={retour} />
        <ConnexionParQr depart="/connexion" retour={retour} initial={qr} />
        <p className="mt-6 text-center text-gris">
          {lierPonctuation(T.pasEncoreDeCompte)}
          <Link to="/inscription" className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
            {textes.inscription}
          </Link>
        </p>
      </div>
    </Section>
  );
}
