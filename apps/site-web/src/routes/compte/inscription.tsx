import { data, redirect } from "react-router";

import type { Route } from "./+types/inscription";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { BoutonsConnexionExterne } from "~/composants/compte/BoutonsConnexionExterne";
import { FormulaireInscription } from "~/composants/compte/FormulaireInscription";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { RefusAge } from "~/composants/compte/RefusAge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE } from "~/contenus/inscription-compte";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { lireCaseNewsletter } from "~/fonctions/compte/lire-case-newsletter";
import { lireCodeConnexionExterne } from "~/fonctions/connexion-externe/lire-code-connexion-externe";
import { lireEspaceHote, type EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { inscrireAmbassadeur } from "~/services/comptes.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireFournisseursActifs } from "~/services/reglages-connexion-externe.server";
import { lireCompteConnecte, lireIpVisiteur, poserCookieSession } from "~/services/session-compte.server";

/** Réponse de l'action : celle d'un formulaire, ou le refus d'âge (moins de 18 ans), qui remplace le formulaire. */
type ReponseInscription = ReponseFormulaire & { refusAge?: boolean };

const ACCUEILS: Record<EspaceCompte, string> = { ambassadeur: "/espace", pro: "/tableau" };

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const texte = choisirTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE, langue).espaces[loaderData?.espace ?? "ambassadeur"];
  return [...creerMeta({ titre: texte.titre, description: texte.description, langue }), { name: "robots", content: "noindex" }];
}

/** Déjà connecté : direction l'espace. */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const espace = lireEspaceHote(url.host);
  if (await lireCompteConnecte(request)) throw redirect(ACCUEILS[espace]);
  // Apple et Google seulement pour l'espace pro : la demande d'ambassadeur (ville, quartier) passe par le formulaire
  const fournisseurs = espace === "pro" ? lireFournisseursActifs() : { apple: false, google: false };
  return { espace, fournisseurs, messageExterne: lireCodeConnexionExterne(url.searchParams.get("externe")) };
}

/**
 * Vérifie le formulaire (avec ou sans JavaScript), crée le compte (l'API envoie le lien qui confirme l'e-mail), pose le
 * cookie de session et ouvre l'espace.
 */
export async function action({ request }: Route.ActionArgs): Promise<ReponseInscription> {
  // L'espace pro ne demande ni ville ni quartier : l'API crée le compte sans demande d'ambassadeur
  const espace = lireEspaceHote(new URL(request.url).host);
  const { langue } = lireLangueRequete(request);
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  const T = choisirTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE, langue);
  const messages = {
    prenom: M.prenom, email: M.email, motDePasse: M.motDePasse, motDePasseRefuse: M.motDePasseRefuse, dateNaissance: M.dateNaissance,
    ville: M.ville, quartier: M.quartier, cgu: M.cgu, emailPris: T.emailPris,
  };
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/\s+/g, " ").trim();
  // Le mot de passe est pris tel quel (espaces compris) et n'est jamais renvoyé dans la page
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  const valeurs = {
    prenom: lire("prenom"),
    email: lire("email").toLowerCase(),
    dateNaissance: lire("dateNaissance"),
    ville: lire("ville"),
    quartier: lire("quartier"),
    cgu: formulaire.get("cgu") === "oui" ? "oui" : "",
    newsletter: formulaire.get("newsletter") === "oui" ? "oui" : "",
  };
  // Case « newsletter » de l'espace ambassadeur (cochée d'avance) : décochée, l'API retient le « non »
  const newsletter = espace === "ambassadeur" ? lireCaseNewsletter(formulaire) : undefined;

  // Mêmes règles que l'API, vérifiées ici pour signaler d'un coup tous les champs à corriger (dans l'ordre du formulaire)
  const erreurs: Record<string, string> = {};
  const longueurMotDePasse = [...motDePasse.normalize("NFC")].length;
  const date = new Date(`${valeurs.dateNaissance}T12:00:00Z`);
  if (!valeurs.prenom || valeurs.prenom.length > 40) erreurs.prenom = messages.prenom;
  if (!verifierEmail(valeurs.email) || valeurs.email.length > 254) erreurs.email = messages.email;
  if (longueurMotDePasse < 12 || longueurMotDePasse > 128) erreurs.motDePasse = messages.motDePasse;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeurs.dateNaissance) || Number.isNaN(date.getTime()) || !date.toISOString().startsWith(valeurs.dateNaissance)) {
    erreurs.dateNaissance = messages.dateNaissance;
  }
  if (espace === "ambassadeur" && (valeurs.ville.length < 2 || valeurs.ville.length > 80)) erreurs.ville = messages.ville;
  if (espace === "ambassadeur" && valeurs.quartier.length > 80) erreurs.quartier = messages.quartier;
  if (!valeurs.cgu) erreurs.cgu = messages.cgu;
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "inscription", erreurs, valeurs };

  const reponse = await inscrireAmbassadeur(
    {
      email: valeurs.email,
      motDePasse,
      prenom: valeurs.prenom,
      ...(espace === "ambassadeur" ? { ville: valeurs.ville, ...(valeurs.quartier ? { quartier: valeurs.quartier } : {}) } : {}),
      ...(newsletter === undefined ? {} : { newsletter }),
      dateNaissance: valeurs.dateNaissance,
      cgu: true,
      piege: lire("piege"),
      // Inscription depuis l'espace pro : l'API crée le compte seul, sans demande d'ambassadeur
      ...(espace === "pro" ? { espace } : {}),
    },
    lireIpVisiteur(request),
  );
  if (reponse.ok) {
    // Sans session : le champ piège était rempli (un robot), rien n'a été créé
    if (!reponse.session) throw redirect("/connexion");
    // ?inscription=1 : l'espace dit que le lien qui confirme l'e-mail vient de partir (7 jours)
    throw redirect(`${ACCUEILS[espace]}?inscription=1`, { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });
  }
  // Moins de 18 ans : l'API n'a rien gardé ; la page ne renvoie rien de ce qui a été tapé
  if (reponse.erreur === "age-minimum") return { ok: false, formulaire: "inscription", refusAge: true };
  if (reponse.erreur === "email-deja-utilise") {
    return { ok: false, formulaire: "inscription", erreurs: { email: lierPonctuation(messages.emailPris) }, valeurs };
  }
  if (reponse.erreur === "champ-invalide") {
    const champ = reponse.champ ?? "";
    // Le prénom avait la bonne longueur (vérifiée ici) : l'API le refuse pour un gros mot
    const message = champ === "motDePasse" ? messages.motDePasseRefuse
      : champ === "prenom" ? M.prenomRefuse
      : messages[champ as keyof typeof messages];
    if (message) return { ok: false, formulaire: "inscription", erreurs: { [champ]: lierPonctuation(message) }, valeurs };
    return { ok: false, formulaire: "inscription", message: lierPonctuation(T.champInvalide), valeurs };
  }
  const message = reponse.erreur === "trop-de-demandes" ? T.tropDInscriptions : reponse.erreur === "occupe" ? M.occupe : T.pasPassee;
  return { ok: false, formulaire: "inscription", message: lierPonctuation(message), valeurs };
}

/** Page /inscription : créer son compte (ambassadeur, dès 18 ans, validé ensuite par l'équipe ; ou pro, sur pro.sosmiam.fr). */
export default function PageInscription({ loaderData, actionData }: Route.ComponentProps) {
  const { espace } = loaderData;
  const T = utiliserTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE);
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(T.espaces[espace].chapo)}>
        {T.espaces[espace].titre}
      </TitreSection>
      {actionData?.refusAge ? <RefusAge /> : (
        <>
          <BoutonsConnexionExterne
            fournisseurs={loaderData.fournisseurs}
            depart="/inscription"
            message={loaderData.messageExterne}
            separateur={T.separateur}
          />
          <FormulaireInscription espace={espace} />
        </>
      )}
    </Section>
  );
}
