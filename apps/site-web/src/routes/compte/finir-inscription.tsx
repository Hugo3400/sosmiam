import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/finir-inscription";
import { CadreAmbassadeur } from "~/composants/ambassadeur/CadreAmbassadeur";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireFinirInscription } from "~/composants/compte/FormulaireFinirInscription";
import { RefusAge } from "~/composants/compte/RefusAge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { CadrePublic } from "~/composants/mise-en-page/CadrePublic";
import { Section } from "~/composants/mise-en-page/Section";
import { CadrePro } from "~/composants/pro/CadrePro";
import { messagesConnexionExterne } from "~/contenus/connexion-externe";
import { MESSAGE_PRENOM_REFUSE } from "~/contenus/prenom-refuse";
import { choisirCodeConnexionExterne } from "~/fonctions/connexion-externe/choisir-code-connexion-externe";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { connecterAvecFournisseur } from "~/services/comptes.server";
import { effacerCookieAttente, lireCookieAttente } from "~/services/cookies-connexion-externe.server";
import { lireIpVisiteur, poserCookieSession } from "~/services/session-compte.server";

type ReponseFinir = ReponseFormulaire & { refusAge?: boolean };

const messages = {
  prenom: "Donne ton prénom ou un surnom (40 caractères au plus).",
  dateNaissance: "Indique ta date de naissance (jour, mois et année).",
  ville: "Indique ta ville (2 à 80 caractères).",
  cgu: "Pour créer ton compte, coche la case qui accepte les conditions d'utilisation.",
};

/** Page propre à chaque personne : jamais gardée par un cache */
export const middleware: Route.MiddlewareFunction[] = [
  async (_, suite) => {
    const reponse = await suite();
    if (reponse instanceof Response) reponse.headers.set("Cache-Control", "private, no-store");
    return reponse;
  },
];

export function meta() {
  return [...creerMeta({ titre: "Finir ton inscription", description: "Encore trois infos et ton compte SOS Miam est prêt." }), { name: "robots", content: "noindex" }];
}

/** L'attente posée par le retour d'Apple ou de Google ; sans elle (expirée, déjà utilisée), retour au départ. */
export async function loader({ request }: Route.LoaderArgs) {
  const attente = lireCookieAttente(request, Date.now());
  if (attente?.intention !== "connexion") {
    throw redirect(`${attente?.depart ?? "/mon-compte"}?externe=expire`, { headers: { "Set-Cookie": effacerCookieAttente() } });
  }
  const { espace, fournisseur, prenom, email, depart } = attente;
  return { espace, fournisseur, prenom, email, depart };
}

/** Crée le compte avec le jeton gardé (l'API vérifie l'âge d'abord), pose le cookie de session et ouvre la page demandée. */
export async function action({ request }: Route.ActionArgs) {
  const attente = lireCookieAttente(request, Date.now());
  if (attente?.intention !== "connexion") {
    throw redirect(`${attente?.depart ?? "/mon-compte"}?externe=expire`, { headers: { "Set-Cookie": effacerCookieAttente() } });
  }
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/\s+/g, " ").trim();
  const valeurs = { prenom: lire("prenom"), dateNaissance: lire("dateNaissance"), ville: lire("ville"), cgu: formulaire.get("cgu") === "oui" ? "oui" : "" };
  const erreurs: Record<string, string> = {};
  const date = new Date(`${valeurs.dateNaissance}T12:00:00Z`);
  if (!valeurs.prenom || valeurs.prenom.length > 40) erreurs.prenom = messages.prenom;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeurs.dateNaissance) || Number.isNaN(date.getTime()) || !date.toISOString().startsWith(valeurs.dateNaissance)) {
    erreurs.dateNaissance = messages.dateNaissance;
  }
  if (valeurs.ville.length < 2 || valeurs.ville.length > 80) erreurs.ville = messages.ville;
  if (!valeurs.cgu) erreurs.cgu = messages.cgu;
  for (const nom of Object.keys(erreurs)) erreurs[nom] = lierPonctuation(erreurs[nom]);
  if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: "finir-inscription", erreurs, valeurs } satisfies ReponseFinir;

  const { fournisseur, jeton, nonce, nom, retour, depart } = attente;
  const reponse = await connecterAvecFournisseur(fournisseur, {
    [fournisseur === "apple" ? "identityToken" : "idToken"]: jeton, nonce, support: "site",
    prenom: valeurs.prenom, ...(nom ? { nom } : {}), dateNaissance: valeurs.dateNaissance, ville: valeurs.ville, cgu: true,
  }, lireIpVisiteur(request));
  if (reponse.ok) {
    const entetes = new Headers();
    entetes.append("Set-Cookie", await poserCookieSession(reponse.session));
    entetes.append("Set-Cookie", effacerCookieAttente());
    throw redirect(retour, { headers: entetes });
  }
  // Moins de 18 ans : l'API n'a rien gardé, le jeton est oublié ici aussi
  if (reponse.erreur === "age-minimum") {
    return data({ ok: false, formulaire: "finir-inscription", refusAge: true } satisfies ReponseFinir, { headers: { "Set-Cookie": effacerCookieAttente() } });
  }
  // Jeton expiré entre-temps (Apple : 10 minutes) : on recommence depuis le bouton
  if (reponse.erreur === "jeton-externe-invalide") throw redirect(`${depart}?externe=expire`, { headers: { "Set-Cookie": effacerCookieAttente() } });
  if (reponse.erreur === "champ-invalide" && (reponse.champ === "prenom" || reponse.champ === "dateNaissance" || reponse.champ === "ville")) {
    const message = reponse.champ === "prenom" ? MESSAGE_PRENOM_REFUSE : messages[reponse.champ];
    return { ok: false, formulaire: "finir-inscription", erreurs: { [reponse.champ]: lierPonctuation(message) }, valeurs } satisfies ReponseFinir;
  }
  const message = messagesConnexionExterne[choisirCodeConnexionExterne(reponse.erreur)];
  return { ok: false, formulaire: "finir-inscription", message: lierPonctuation(message), valeurs } satisfies ReponseFinir;
}

/** Page /connexion/finir-inscription, dans le cadre de l'espace de départ (site, ambassadeur ou pro). */
export default function PageFinirInscription({ loaderData, actionData }: Route.ComponentProps) {
  const { espace, fournisseur, prenom, email, depart } = loaderData;
  const contenu = (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation("Bienvenue chez les Miamis ! Encore trois petites infos et ton compte SOS Miam est prêt.")}>
        Finir ton inscription
      </TitreSection>
      <div className="mx-auto max-w-xl">
        {actionData && "refusAge" in actionData && actionData.refusAge ? <RefusAge /> : (
          <>
            <FormulaireFinirInscription fournisseur={fournisseur} prenom={prenom} email={email} />
            <p className="mt-6 text-center">
              <Link to={depart} className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
                {lierPonctuation("Finalement non, je laisse tomber")}
              </Link>
            </p>
          </>
        )}
      </div>
    </Section>
  );
  if (espace === "pro") return <CadrePro connecte={false}>{contenu}</CadrePro>;
  if (espace === "ambassadeur") return <CadreAmbassadeur connecte={false}>{contenu}</CadreAmbassadeur>;
  return <CadrePublic>{contenu}</CadrePublic>;
}
