import { useEffect, useRef } from "react";
import { data, Link } from "react-router";

import type { Route } from "./+types/mot-de-passe-oublie";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { site } from "~/contenus/legal/informations-legales";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { decrireAttente, demanderNouveauMotDePasse } from "~/services/comptes.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

const nom = "mot-de-passe-oublie";
const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** La même réponse, que l'adresse ait un compte ou non : personne ne peut s'en servir pour savoir qui est inscrit. */
const REPONSE_ENVOI = "Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe. Il marche 24 heures, une seule fois. Pense à regarder tes indésirables !";

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Mot de passe oublié", description: "Mot de passe oublié dans l'espace ambassadeur SOS Miam : reçois un lien pour en choisir un nouveau." }),
    { name: "robots", content: "noindex" },
  ];
}

/** Demande le lien de nouveau mot de passe (l'API ne l'envoie que si le compte existe, et répond pareil sinon). */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const email = String(formulaire.get("email") ?? "").replace(/\s+/g, "").toLowerCase();
  const erreurEmail = { ok: false, formulaire: nom, erreurs: { email: "Cette adresse e-mail ne semble pas valide." }, valeurs: { email } };
  if (!verifierEmail(email) || email.length > 254) return erreurEmail;

  const reponse = await demanderNouveauMotDePasse(email, lireIpVisiteur(request));
  if (reponse.ok) return { ok: true, formulaire: nom };
  if (reponse.erreur === "champ-invalide") return erreurEmail;
  const message = reponse.erreur === "trop-de-demandes"
    ? `Doucement ! Trop de demandes d'affilée depuis ta connexion : réessaie dans ${decrireAttente(reponse.attente)}.`
    : `Oups, ta demande n'est pas passée. Réessaie dans un instant, ou écris-nous à ${site.emailContact}.`;
  return { ok: false, formulaire: nom, message: lierPonctuation(message), valeurs: { email } };
}

/** Page /mot-de-passe-oublie : « Ton e-mail », puis un lien reçu par mail (24 h, une seule fois). */
export default function PageMotDePasseOublie({ actionData }: Route.ComponentProps) {
  const titreReussite = useRef<HTMLHeadingElement>(null);
  const envoye = actionData?.ok === true;
  useEffect(() => {
    if (envoye) titreReussite.current?.focus();
  }, [envoye]);

  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Pas de panique, ça arrive à tout le monde. Donne-nous ton e-mail : on t'envoie un lien pour en choisir un nouveau.")}>
        {lierPonctuation("Mot de passe oublié ?")}
      </TitreSection>
      {envoye ? (
        <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
          <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
          <h2 ref={titreReussite} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("C'est noté !")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation(REPONSE_ENVOI)}</p>
          <p className="mx-auto mt-5 max-w-lg">
            <Link to="/connexion" className={classeLien}>Retour à la connexion</Link>
          </p>
        </div>
      ) : (
        <>
          <FormulaireCompte
            nom={nom}
            bouton="Recevoir le lien"
            className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
            apres={<Link to="/connexion" className={`text-sm ${classeLien}`}>Retour à la connexion</Link>}
          >
            <ChampTexte nom="email" libelle="Ton e-mail" type="email" autoComplete="email" inputMode="email" maximum={254} aide="L'adresse de ton compte." />
          </FormulaireCompte>
          <p className="mt-6 text-center text-gris">
            {lierPonctuation("Rien reçu, même dans tes indésirables ? Écris-nous depuis l'adresse de ton compte à ")}
            <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>.
          </p>
        </>
      )}
    </Section>
  );
}
