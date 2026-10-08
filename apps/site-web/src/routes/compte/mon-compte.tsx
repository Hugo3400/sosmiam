import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/mon-compte";
import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { FormulaireChangerMotDePasse } from "~/composants/compte/FormulaireChangerMotDePasse";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireProfil } from "~/composants/compte/FormulaireProfil";
import { FormulaireSupprimerCompte } from "~/composants/compte/FormulaireSupprimerCompte";
import { PartieCompte } from "~/composants/compte/PartieCompte";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { changerMotDePasse, modifierCompte, supprimerCompte } from "~/services/comptes.server";
import { effacerCookieSession, exigerCompte, lireIpVisiteur, redirigerSiSessionFermee } from "~/services/session-compte.server";

const messages = {
  prenom: "Donne ton prénom ou un surnom (40 caractères au plus).",
  ville: "Indique ta ville (2 à 80 caractères).",
  quartier: "Le quartier fait 80 caractères au plus.",
  actuel: "Indique ton mot de passe actuel.",
  actuelIncorrect: "Ce n'est pas ton mot de passe actuel.",
  nouveau: "Ton nouveau mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  nouveauRefuse: "Ce mot de passe est trop courant, ou c'est ton e-mail : choisis-en un autre. Une petite phrase marche très bien.",
  motDePasse: "Indique ton mot de passe pour confirmer.",
  motDePasseIncorrect: "Ce n'est pas ton mot de passe.",
};

export function meta(_: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mon compte", description: "Ton compte ambassadeur SOS Miam." }), { name: "robots", content: "noindex" }];
}

/** Ce que la page montre du compte : prénom, e-mail, ville et quartier. */
export async function loader({ request }: Route.LoaderArgs) {
  const { compte } = await exigerCompte(request);
  return {
    prenom: compte.prenom,
    email: compte.email,
    lieu: compte.ambassadeur ? { ville: compte.ambassadeur.ville, quartier: compte.ambassadeur.quartier } : null,
  };
}

/** Message général d'une erreur de l'API qui ne vise pas un champ (« attente » : secondes avant le prochain essai). */
function expliquer({ erreur, attente }: { erreur: string; attente?: number }): string {
  if (erreur !== "trop-de-demandes") return lierPonctuation("Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.");
  const minutes = attente ? Math.max(1, Math.ceil(attente / 60)) : null;
  return lierPonctuation(minutes ? `Trop d'essais : réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.` : "Trop d'essais : réessaie dans quelques minutes.");
}

/** Trois formulaires (champ caché « formulaire ») : infos, mot de passe, suppression du compte. */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const { jeton, compte } = await exigerCompte(request);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/\s+/g, " ").trim();
  const ip = lireIpVisiteur(request);
  const nom = formulaire.get("formulaire");

  if (nom === "infos") {
    const valeurs = { prenom: lire("prenom"), ville: lire("ville"), quartier: lire("quartier") };
    const erreurs: Record<string, string> = {};
    if (!valeurs.prenom || valeurs.prenom.length > 40) erreurs.prenom = messages.prenom;
    if (compte.ambassadeur && (valeurs.ville.length < 2 || valeurs.ville.length > 80)) erreurs.ville = messages.ville;
    if (compte.ambassadeur && valeurs.quartier.length > 80) erreurs.quartier = messages.quartier;
    if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs, valeurs };
    // Un quartier vide efface celui qui était enregistré
    const reponse = await modifierCompte(jeton, ip, compte.ambassadeur ? valeurs : { prenom: valeurs.prenom });
    if (reponse.ok) return { ok: true, formulaire: nom, message: "C'est enregistré." };
    await redirigerSiSessionFermee(request, reponse.erreur);
    const champ = reponse.champ as keyof typeof messages | undefined;
    if (reponse.erreur === "champ-invalide" && champ && (champ === "prenom" || champ === "ville" || champ === "quartier")) {
      return { ok: false, formulaire: nom, erreurs: { [champ]: messages[champ] }, valeurs };
    }
    return { ok: false, formulaire: nom, message: expliquer(reponse), valeurs };
  }

  if (nom === "mot-de-passe") {
    // Les mots de passe sont pris tels quels (espaces compris) et jamais renvoyés dans la page
    const actuel = String(formulaire.get("actuel") ?? "");
    const nouveau = String(formulaire.get("nouveau") ?? "");
    const longueur = [...nouveau.normalize("NFC")].length;
    const erreurs: Record<string, string> = {};
    if (!actuel) erreurs.actuel = messages.actuel;
    if (longueur < 12 || longueur > 128) erreurs.nouveau = messages.nouveau;
    if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs };
    const reponse = await changerMotDePasse(jeton, ip, actuel, nouveau);
    if (reponse.ok) return { ok: true, formulaire: nom, message: lierPonctuation("C'est fait ! Ton nouveau mot de passe est enregistré, et tes autres connexions sont fermées.") };
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { actuel: messages.actuelIncorrect } };
    if (reponse.erreur === "champ-invalide") return { ok: false, formulaire: nom, erreurs: { nouveau: lierPonctuation(messages.nouveauRefuse) } };
    return { ok: false, formulaire: nom, message: expliquer(reponse) };
  }

  if (nom === "suppression") {
    const motDePasse = String(formulaire.get("motDePasse") ?? "");
    if (!motDePasse) return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasse } };
    const reponse = await supprimerCompte(jeton, ip, motDePasse);
    if (reponse.ok) throw redirect("/connexion?au-revoir", { headers: { "Set-Cookie": await effacerCookieSession() } });
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasseIncorrect } };
    return { ok: false, formulaire: nom, message: expliquer(reponse) };
  }

  throw data("Formulaire inconnu", { status: 400 });
}

/** Page /espace/mon-compte : infos, mot de passe, déconnexion et suppression du compte. */
export default function PageMonCompte({ loaderData }: Route.ComponentProps) {
  const { prenom, email, lieu } = loaderData;
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Tes infos, ton mot de passe, et la porte de sortie si tu en as besoin.")}>
        Mon compte
      </TitreSection>
      <div className="grid gap-8">
        <PartieCompte id="mes-infos" titre="Mes infos">
          <FormulaireProfil prenom={prenom} email={email} lieu={lieu} />
        </PartieCompte>
        <PartieCompte id="mon-mot-de-passe" titre="Mon mot de passe">
          <FormulaireChangerMotDePasse />
        </PartieCompte>
        <PartieCompte id="me-deconnecter" titre="Me déconnecter">
          <p className="mb-5 text-gris">Sur cet appareil. Tu pourras te reconnecter quand tu veux avec ton e-mail et ton mot de passe.</p>
          <BoutonDeconnexion />
        </PartieCompte>
        <PartieCompte id="supprimer-mon-compte" titre="Supprimer mon compte">
          <FormulaireSupprimerCompte />
        </PartieCompte>
      </div>
      <p className="mt-8 text-center">
        <Link to="/espace" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          <span aria-hidden="true">← </span>Retour à mon espace
        </Link>
      </p>
    </Section>
  );
}
