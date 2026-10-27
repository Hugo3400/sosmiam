import { useEffect, useRef } from "react";
import { data } from "react-router";

import type { Route } from "./+types/nouveau-mot-de-passe";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireNouveauMotDePasse } from "~/composants/compte/FormulaireNouveauMotDePasse";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { TEXTES_MOT_DE_PASSE_PAR_LANGUE } from "~/contenus/mot-de-passe";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { extraireJeton } from "~/fonctions/texte/extraire-jeton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { reinitialiserMotDePasse } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { effacerCookieSession, lireIpVisiteur } from "~/services/session-compte.server";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE, langue).nouveau;
  return [
    ...creerMeta({ titre: T.titre, description: T.description, langue }),
    { name: "robots", content: "noindex" },
  ];
}

/** Enregistre le nouveau mot de passe ; l'API efface le jeton et ferme toutes les sessions du compte (cookie effacé aussi). */
export async function action({ request }: Route.ActionArgs) {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  // Le code peut être collé seul, ou avec tout le lien
  const jeton = extraireJeton(String(formulaire.get("jeton") ?? ""));
  const nom = "nouveau-mot-de-passe";
  const { langue } = lireLangueRequete(request);
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  const T = choisirTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE, langue).nouveau;

  const erreurs: Record<string, string> = {};
  const longueur = [...motDePasse.normalize("NFC")].length;
  if (!jeton) erreurs.jeton = lierPonctuation(M.jeton);
  if (longueur < 12 || longueur > 128) erreurs.motDePasse = M.motDePasse;
  if (!jeton || Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs } satisfies ReponseFormulaire;

  const reponse = await reinitialiserMotDePasse(jeton, motDePasse, lireIpVisiteur(request));
  if (reponse.ok) {
    return data({ ok: true, formulaire: nom } satisfies ReponseFormulaire, { headers: { "Set-Cookie": await effacerCookieSession() } });
  }
  if (reponse.erreur === "champ-invalide") {
    const message = reponse.champ === "jeton" ? M.jeton : M.motDePasseRefuse;
    return { ok: false, formulaire: nom, erreurs: { [reponse.champ === "jeton" ? "jeton" : "motDePasse"]: lierPonctuation(message) } } satisfies ReponseFormulaire;
  }
  // Lien déjà servi ou trop vieux : l'erreur va sous le champ « Code reçu par mail », qui remplace le bandeau « Ton lien
  // est bien reconnu » (on peut y coller le nouveau lien reçu)
  if (reponse.erreur === "jeton-invalide") {
    return { ok: false, formulaire: nom, erreurs: { jeton: lierPonctuation(T.jetonInvalide) } } satisfies ReponseFormulaire;
  }
  const message = reponse.erreur === "trop-de-demandes" ? T.tropDEssais : reponse.erreur === "occupe" ? M.occupe : M.panne;
  return { ok: false, formulaire: nom, message: lierPonctuation(message) } satisfies ReponseFormulaire;
}

/** Page /nouveau-mot-de-passe : ouverte depuis le lien reçu par mail (« Mot de passe oublié » ou l'équipe ; 24 h, une seule fois). */
export default function PageNouveauMotDePasse({ actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE).nouveau;
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const reussi = actionData?.ok === true;
  useEffect(() => {
    if (reussi) titreReussite.current?.focus();
  }, [reussi]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(T.chapo)}>{T.titre}</TitreSection>
      {reussi ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.cestFait)}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">{T.connecteToi}</p>
          <Bouton vers="/connexion" variante="encre" className="mt-7">{T.meConnecter}</Bouton>
        </div>
      ) : (
        <FormulaireNouveauMotDePasse />
      )}
    </Section>
  );
}
