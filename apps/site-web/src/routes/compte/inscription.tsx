import { data, redirect } from "react-router";

import type { Route } from "./+types/inscription";
import { FormulaireInscription } from "~/composants/compte/FormulaireInscription";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { RefusAge } from "~/composants/compte/RefusAge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { inscrireAmbassadeur, MESSAGE_OCCUPE } from "~/services/comptes.server";
import { lireCompteConnecte, lireIpVisiteur, poserCookieSession } from "~/services/session-compte.server";

/** Réponse de l'action : celle d'un formulaire, ou le refus d'âge (moins de 18 ans), qui remplace le formulaire. */
type ReponseInscription = ReponseFormulaire & { refusAge?: boolean };

const messages = {
  prenom: "Donne ton prénom ou un surnom (40 caractères au plus).",
  email: "Cette adresse e-mail ne semble pas valide.",
  motDePasse: "Ton mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  // Refusé par l'API : trop facile à deviner (courant, suite, répétition, e-mail), ou que des chiffres et moins de 16
  motDePasseRefuse: "Ce mot de passe est trop facile à deviner (trop courant, une suite, une répétition, ton e-mail…), ou il n'a que des chiffres (il en faut alors 16) : choisis-en un autre. Une petite phrase marche très bien.",
  dateNaissance: "Indique ta date de naissance (jour, mois et année).",
  ville: "Indique ta ville (2 à 80 caractères).",
  quartier: "Le quartier fait 80 caractères au plus.",
  cgu: "Pour créer ton compte, coche la case qui accepte les conditions d'utilisation.",
  emailPris: "Un compte existe déjà avec cette adresse. Connecte-toi, ou passe par « Mot de passe oublié ».",
};

export function meta(_: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: "Devenir ambassadeur", description: "Crée ton compte ambassadeur SOS Miam, dès 18 ans : l'équipe valide chaque inscription." }),
    { name: "robots", content: "noindex" },
  ];
}

/** Déjà connecté : direction l'espace. */
export async function loader({ request }: Route.LoaderArgs) {
  if (await lireCompteConnecte(request)) throw redirect("/espace");
  return null;
}

/**
 * Vérifie le formulaire (avec ou sans JavaScript), crée le compte (l'API envoie le lien qui confirme l'e-mail), pose le
 * cookie de session et ouvre l'espace.
 */
export async function action({ request }: Route.ActionArgs): Promise<ReponseInscription> {
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
  };

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
  if (valeurs.ville.length < 2 || valeurs.ville.length > 80) erreurs.ville = messages.ville;
  if (valeurs.quartier.length > 80) erreurs.quartier = messages.quartier;
  if (!valeurs.cgu) erreurs.cgu = messages.cgu;
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "inscription", erreurs, valeurs };

  const reponse = await inscrireAmbassadeur(
    {
      email: valeurs.email,
      motDePasse,
      prenom: valeurs.prenom,
      ville: valeurs.ville,
      ...(valeurs.quartier ? { quartier: valeurs.quartier } : {}),
      dateNaissance: valeurs.dateNaissance,
      cgu: true,
      piege: lire("piege"),
    },
    lireIpVisiteur(request),
  );
  if (reponse.ok) {
    // Sans session : le champ piège était rempli (un robot), rien n'a été créé
    if (!reponse.session) throw redirect("/connexion");
    // ?inscription=1 : l'espace dit que le lien qui confirme l'e-mail vient de partir (7 jours)
    throw redirect("/espace?inscription=1", { headers: { "Set-Cookie": await poserCookieSession(reponse.session) } });
  }
  // Moins de 18 ans : l'API n'a rien gardé ; la page ne renvoie rien de ce qui a été tapé
  if (reponse.erreur === "age-minimum") return { ok: false, formulaire: "inscription", refusAge: true };
  if (reponse.erreur === "email-deja-utilise") {
    return { ok: false, formulaire: "inscription", erreurs: { email: lierPonctuation(messages.emailPris) }, valeurs };
  }
  if (reponse.erreur === "champ-invalide") {
    const champ = reponse.champ ?? "";
    const message = champ === "motDePasse" ? messages.motDePasseRefuse : messages[champ as keyof typeof messages];
    if (message) return { ok: false, formulaire: "inscription", erreurs: { [champ]: lierPonctuation(message) }, valeurs };
    return { ok: false, formulaire: "inscription", message: lierPonctuation("Un champ ne va pas : vérifie le formulaire."), valeurs };
  }
  const message = reponse.erreur === "trop-de-demandes"
    ? "Doucement ! Trop d'inscriptions d'affilée depuis ta connexion : réessaie dans une heure."
    : reponse.erreur === "occupe"
      ? MESSAGE_OCCUPE
      : "Oups, ton inscription n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.";
  return { ok: false, formulaire: "inscription", message: lierPonctuation(message), valeurs };
}

/** Page /inscription : créer son compte ambassadeur (dès 18 ans, validé ensuite par l'équipe). */
export default function PageInscription({ actionData }: Route.ComponentProps) {
  return (
    <Section fond="creme" etroit>
      <TitreSection
        principal
        chapo={lierPonctuation("C'est gratuit, dès 18 ans. L'équipe lit chaque inscription : une fois la tienne validée, ton espace s'ouvre.")}
      >
        Deviens ambassadeur
      </TitreSection>
      {actionData?.refusAge ? <RefusAge /> : <FormulaireInscription />}
    </Section>
  );
}
