import { useEffect, useRef } from "react";
import { data, useActionData } from "react-router";

import type { Route } from "./+types/verifier-email";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { FORMULAIRE_RENVOI } from "~/composants/compte/BandeauVerificationEmail";
import { FormulaireVerificationEmail } from "~/composants/compte/FormulaireVerificationEmail";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { TEXTES_VERIFICATION_EMAIL_PAR_LANGUE } from "~/contenus/verification-email";
import { ecrireAttente } from "~/fonctions/compte/ecrire-attente";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { extraireJeton } from "~/fonctions/texte/extraire-jeton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { confirmerEmail } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireCompteConnecte, lireIpVisiteur } from "~/services/session-compte.server";
import { traiterRenvoiVerification } from "~/services/verification-email.server";

const nom = "verifier-email";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_VERIFICATION_EMAIL_PAR_LANGUE, langue);
  return [
    ...creerMeta({ titre: T.titre, description: T.description, langue }),
    { name: "robots", content: "noindex" },
  ];
}

/** Pour la page : la personne est-elle connectée (elle peut alors se faire renvoyer un lien), et déjà confirmée ? */
export async function loader({ request }: Route.LoaderArgs) {
  const connecte = await lireCompteConnecte(request);
  const accueil = lireEspaceHote(new URL(request.url).host) === "pro" ? "/tableau" : "/espace";
  return { connecte: connecte !== null, dejaVerifie: connecte?.compte.emailVerifie === true, accueil };
}

/** Confirme l'e-mail avec le jeton du lien (ou du champ « Code reçu par mail »), ou renvoie un lien (personne connectée). */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  if (formulaire.get("formulaire") === FORMULAIRE_RENVOI) return traiterRenvoiVerification(request);

  const { langue } = lireLangueRequete(request);
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  const jeton = extraireJeton(String(formulaire.get("jeton") ?? ""));
  if (!jeton) return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(M.jeton) } };
  const reponse = await confirmerEmail(jeton, lireIpVisiteur(request));
  if (reponse.ok) return { ok: true, formulaire: nom };
  if (reponse.erreur === "jeton-invalide" || reponse.erreur === "champ-invalide") {
    return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(choisirTextes(TEXTES_VERIFICATION_EMAIL_PAR_LANGUE, langue).jetonInvalide) } };
  }
  const message = reponse.erreur === "trop-de-demandes" ? M.tropDEssais(ecrireAttente(reponse.attente, langue)) : M.panne;
  return { ok: false, formulaire: nom, message: lierPonctuation(message) };
}

/**
 * Page /verifier-email (ouverte depuis le lien …/verifier-email#jeton=… reçu à l'inscription, 7 jours, une seule fois) :
 * avec JavaScript, l'adresse est confirmée dès l'ouverture ; sans, un champ « Code reçu par mail » et un bouton.
 */
export default function PageVerifierEmail({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_VERIFICATION_EMAIL_PAR_LANGUE);
  const reponse = useActionData<ReponseFormulaire>();
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const reussi = reponse?.formulaire === nom && reponse.ok;
  useEffect(() => {
    if (reussi) titreReussite.current?.focus();
  }, [reussi]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(T.chapo)}>{T.titre}</TitreSection>
      {reussi || (loaderData.dejaVerifie && reponse?.formulaire !== nom) ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">
            {lierPonctuation(reussi ? T.confirme : T.dejaConfirmee)}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">
            {lierPonctuation(T.merci)}
          </p>
          <Bouton vers={loaderData.connecte ? loaderData.accueil : "/connexion"} variante="encre" className="mt-7">
            {loaderData.connecte ? T.allerEspace : T.meConnecter}
          </Bouton>
        </div>
      ) : (
        <FormulaireVerificationEmail connecte={loaderData.connecte} />
      )}
    </Section>
  );
}
