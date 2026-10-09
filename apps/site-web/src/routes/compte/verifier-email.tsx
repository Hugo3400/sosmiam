import { useEffect, useRef } from "react";
import { data, useActionData } from "react-router";

import type { Route } from "./+types/verifier-email";
import { FORMULAIRE_RENVOI } from "~/composants/compte/BandeauVerificationEmail";
import { FormulaireVerificationEmail } from "~/composants/compte/FormulaireVerificationEmail";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { extraireJeton } from "~/fonctions/texte/extraire-jeton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { confirmerEmail, decrireAttente } from "~/services/comptes.server";
import { lireCompteConnecte, lireIpVisiteur } from "~/services/session-compte.server";
import { traiterRenvoiVerification } from "~/services/verification-email.server";

const nom = "verifier-email";
const messages = {
  jeton: "Colle le code reçu par mail : la suite de lettres et de chiffres après « jeton= ».",
  jetonInvalide: "Ce lien ne marche plus : il a déjà servi, ou il a plus de 7 jours.",
};

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Confirmer mon e-mail", description: "Confirme l'adresse e-mail de ton compte SOS Miam." }),
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

  const jeton = extraireJeton(String(formulaire.get("jeton") ?? ""));
  if (!jeton) return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(messages.jeton) } };
  const reponse = await confirmerEmail(jeton, lireIpVisiteur(request));
  if (reponse.ok) return { ok: true, formulaire: nom };
  if (reponse.erreur === "jeton-invalide" || reponse.erreur === "champ-invalide") {
    return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(messages.jetonInvalide) } };
  }
  const message = reponse.erreur === "trop-de-demandes"
    ? `Trop d'essais : réessaie dans ${decrireAttente(reponse.attente)}.`
    : "Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: nom, message: lierPonctuation(message) };
}

/**
 * Page /verifier-email (ouverte depuis le lien …/verifier-email#jeton=… reçu à l'inscription, 7 jours, une seule fois) :
 * avec JavaScript, l'adresse est confirmée dès l'ouverture ; sans, un champ « Code reçu par mail » et un bouton.
 */
export default function PageVerifierEmail({ loaderData }: Route.ComponentProps) {
  const reponse = useActionData<ReponseFormulaire>();
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const reussi = reponse?.formulaire === nom && reponse.ok;
  useEffect(() => {
    if (reussi) titreReussite.current?.focus();
  }, [reussi]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Un clic pour nous dire que cette adresse est bien la tienne.")}>Confirmer mon e-mail</TitreSection>
      {reussi || (loaderData.dejaVerifie && reponse?.formulaire !== nom) ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">
            {lierPonctuation(reussi ? "C'est confirmé !" : "Ton adresse est déjà confirmée")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">
            {lierPonctuation("Merci ! L'équipe voit maintenant que ton adresse est bien la tienne.")}
          </p>
          <Bouton vers={loaderData.connecte ? loaderData.accueil : "/connexion"} variante="encre" className="mt-7">
            {loaderData.connecte ? "Aller dans mon espace" : "Me connecter"}
          </Bouton>
        </div>
      ) : (
        <FormulaireVerificationEmail connecte={loaderData.connecte} />
      )}
    </Section>
  );
}
