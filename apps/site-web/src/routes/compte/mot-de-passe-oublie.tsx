import { useEffect, useRef } from "react";
import { data, Link } from "react-router";

import type { Route } from "./+types/mot-de-passe-oublie";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { TEXTES_MOT_DE_PASSE_PAR_LANGUE } from "~/contenus/mot-de-passe";
import { ecrireAttente } from "~/fonctions/compte/ecrire-attente";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { demanderNouveauMotDePasse } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const nom = "mot-de-passe-oublie";
const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE, langue).oublie;
  return [
    ...creerMeta({ titre: T.titreMeta, description: T.description, langue }),
    { name: "robots", content: "noindex" },
  ];
}

/** Demande le lien de nouveau mot de passe (l'API ne l'envoie que si le compte existe, et répond pareil sinon). */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const email = String(formulaire.get("email") ?? "").replace(/\s+/g, "").toLowerCase();
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE, langue).oublie;
  const erreurEmail = { ok: false, formulaire: nom, erreurs: { email: choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue).email }, valeurs: { email } };
  if (!verifierEmail(email) || email.length > 254) return erreurEmail;

  const reponse = await demanderNouveauMotDePasse(email, lireIpVisiteur(request));
  if (reponse.ok) return { ok: true, formulaire: nom };
  if (reponse.erreur === "champ-invalide") return erreurEmail;
  const message = reponse.erreur === "trop-de-demandes" ? T.tropDeDemandes(ecrireAttente(reponse.attente, langue)) : T.pasPassee(site.emailContact);
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs: { email } };
}

/** Page /mot-de-passe-oublie : « Ton e-mail », puis un lien reçu par mail (24 h, une seule fois). */
export default function PageMotDePasseOublie({ actionData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE).oublie;
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const envoye = actionData?.ok === true;
  useEffect(() => {
    if (envoye) titreReussite.current?.focus();
  }, [envoye]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(T.chapo)}>
        {lierPonctuation(T.titre)}
      </TitreSection>
      {envoye ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.cestNote)}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation(T.reponseEnvoi)}</p>
          <p className="mx-auto mt-5 max-w-lg">
            <Link to="/connexion" className={classeLien}>{T.retourConnexion}</Link>
          </p>
        </div>
      ) : (
        <>
          <FormulaireCompte
            nom={nom}
            bouton={T.bouton}
            className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
            apres={<Link to="/connexion" className={`text-sm ${classeLien}`}>{T.retourConnexion}</Link>}
          >
            <ChampTexte nom="email" libelle={champs.email} type="email" autoComplete="email" inputMode="email" maximum={254} aide={T.aideEmail} />
          </FormulaireCompte>
          <p className="mt-6 text-center text-gris">
            {lierPonctuation(T.rienRecu)}
            <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>.
          </p>
        </>
      )}
    </Section>
  );
}
