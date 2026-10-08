import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/nouveau-mot-de-passe";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireNouveauMotDePasse } from "~/composants/compte/FormulaireNouveauMotDePasse";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { MESSAGE_OCCUPE, reinitialiserMotDePasse } from "~/services/comptes.server";
import { effacerCookieSession, lireIpVisiteur } from "~/services/session-compte.server";

const messages = {
  jeton: "Colle le code reçu par mail : la suite de lettres et de chiffres après « jeton= ».",
  motDePasse: "Ton mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  // Refusé par l'API : trop facile à deviner (courant, suite, répétition, e-mail), ou que des chiffres et moins de 16
  motDePasseRefuse: "Ce mot de passe est trop facile à deviner (trop courant, une suite, une répétition, ton e-mail…), ou il n'a que des chiffres (il en faut alors 16) : choisis-en un autre. Une petite phrase marche très bien.",
  jetonInvalide: "Ce lien ne marche plus : il a déjà servi, ou il a plus de 24 heures. Écris-nous à bonjour@sosmiam.fr pour en recevoir un nouveau.",
};

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Nouveau mot de passe", description: "Choisis un nouveau mot de passe pour ton espace ambassadeur SOS Miam." }),
    { name: "robots", content: "noindex" },
  ];
}

/** Enregistre le nouveau mot de passe ; l'API efface le jeton et ferme toutes les sessions du compte (cookie effacé aussi). */
export async function action({ request }: Route.ActionArgs) {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  // Le code peut être collé seul, ou avec tout le lien
  const saisie = String(formulaire.get("jeton") ?? "").trim();
  const jeton = saisie.includes("jeton=") ? saisie.slice(saisie.lastIndexOf("jeton=") + "jeton=".length) : saisie;
  const nom = "nouveau-mot-de-passe";

  const erreurs: Record<string, string> = {};
  const longueur = [...motDePasse.normalize("NFC")].length;
  if (!/^[\w-]{16,200}$/.test(jeton)) erreurs.jeton = lierPonctuation(messages.jeton);
  if (longueur < 12 || longueur > 128) erreurs.motDePasse = messages.motDePasse;
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs } satisfies ReponseFormulaire;

  const reponse = await reinitialiserMotDePasse(jeton, motDePasse, lireIpVisiteur(request));
  if (reponse.ok) {
    return data({ ok: true, formulaire: nom } satisfies ReponseFormulaire, { headers: { "Set-Cookie": await effacerCookieSession() } });
  }
  if (reponse.erreur === "champ-invalide") {
    const message = reponse.champ === "jeton" ? messages.jeton : messages.motDePasseRefuse;
    return { ok: false, formulaire: nom, erreurs: { [reponse.champ === "jeton" ? "jeton" : "motDePasse"]: lierPonctuation(message) } } satisfies ReponseFormulaire;
  }
  // Lien déjà servi ou trop vieux : l'erreur va sous le champ « Code reçu par mail », qui remplace le bandeau « Ton lien
  // est bien reconnu » (on peut y coller le nouveau lien envoyé par l'équipe)
  if (reponse.erreur === "jeton-invalide") {
    return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(messages.jetonInvalide) } } satisfies ReponseFormulaire;
  }
  const message = reponse.erreur === "trop-de-demandes"
    ? "Trop d'essais : réessaie dans 10 minutes."
    : reponse.erreur === "occupe"
      ? MESSAGE_OCCUPE
      : "Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: nom, message: lierPonctuation(message) } satisfies ReponseFormulaire;
}

/** Page /nouveau-mot-de-passe : ouverte depuis le lien préparé par l'équipe (24 h, une seule fois). */
export default function PageNouveauMotDePasse({ actionData }: Route.ComponentProps) {
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const reussi = actionData?.ok === true;
  useEffect(() => {
    if (reussi) titreReussite.current?.focus();
  }, [reussi]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Choisis-en un nouveau : il remplace l'ancien tout de suite.")}>Nouveau mot de passe</TitreSection>
      {reussi ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("C'est fait !")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">Connecte-toi avec ton nouveau mot de passe.</p>
          <Bouton vers="/connexion" variante="encre" className="mt-7">Me connecter</Bouton>
        </div>
      ) : (
        <FormulaireNouveauMotDePasse />
      )}
    </Section>
  );
}
