import { useMemo } from "react";
import { data, Link, redirect } from "react-router";

import type { Route } from "./+types/mon-compte";
import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { ConnexionMonCompte } from "~/composants/compte/ConnexionMonCompte";
import { FormulaireChangerMotDePasse } from "~/composants/compte/FormulaireChangerMotDePasse";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireProfil } from "~/composants/compte/FormulaireProfil";
import { FormulaireSupprimerCompte } from "~/composants/compte/FormulaireSupprimerCompte";
import { PartieCompte } from "~/composants/compte/PartieCompte";
import { PartieMesDonnees } from "~/composants/compte/PartieMesDonnees";
import { PartieSupprimerSansConnexion } from "~/composants/compte/PartieSupprimerSansConnexion";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { site } from "~/contenus/legal/informations-legales";
import { messagesConnexionExterne } from "~/contenus/connexion-externe";
import { accueilsMonCompte, AIDE_SANS_MOT_DE_PASSE, CHAPO_CONNECTE, CHAPO_VISITEUR } from "~/contenus/mon-compte";
import { MESSAGE_PRENOM_REFUSE } from "~/contenus/prenom-refuse";
import { choisirCodeConnexionExterne } from "~/fonctions/connexion-externe/choisir-code-connexion-externe";
import { lireMessageConnexionExterne } from "~/fonctions/connexion-externe/lire-message-connexion-externe";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { lireEspaceMonCompte } from "~/fonctions/hotes/lire-espace-mon-compte";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import {
  changerMotDePasse, decrireAttente, lireConnexionsCompte, MESSAGE_OCCUPE, modifierCompte, supprimerCompte, supprimerCompteAvecFournisseur,
} from "~/services/comptes.server";
import { effacerCookieAttente, lireCookieAttente } from "~/services/cookies-connexion-externe.server";
import { lireFournisseursActifs } from "~/services/reglages-connexion-externe.server";
import { connecterDepuisFormulaire } from "~/services/connexion-compte.server";
import {
  effacerCookieSession, exigerCompte, lireCompteConnecte, lireIpVisiteur, poserCookieSession, redirigerSiSessionFermee,
} from "~/services/session-compte.server";

const messages = {
  prenom: "Donne ton prénom ou un surnom (40 caractères au plus).",
  ville: "Indique ta ville (2 à 80 caractères).",
  quartier: "Le quartier fait 80 caractères au plus.",
  actuel: "Indique ton mot de passe actuel.",
  actuelIncorrect: "Ce n'est pas ton mot de passe actuel.",
  nouveau: "Ton nouveau mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  // Refusé par l'API : trop facile à deviner (courant, suite, répétition, e-mail), ou que des chiffres et moins de 16
  nouveauRefuse: "Ce mot de passe est trop facile à deviner (trop courant, une suite, une répétition, ton e-mail…), ou il n'a que des chiffres (il en faut alors 16) : choisis-en un autre. Une petite phrase marche très bien.",
  motDePasse: "Indique ton mot de passe pour confirmer.",
  motDePasseIncorrect: "Ce n'est pas ton mot de passe.",
};

/** Après un changement de mot de passe : « ?mot-de-passe-change=<marque> », une marque nouvelle à chaque changement. */
const PARAMETRE_CHANGE = "mot-de-passe-change";

/** Où mène le lien du bas de la page, selon l'espace. */
const retours = {
  ambassadeur: { vers: "/espace", texte: "Retour à mon espace" },
  pro: { vers: "/tableau", texte: "Retour à mon tableau" },
  site: { vers: "/", texte: "Retour à l'accueil" },
};

/**
 * La même page sert trois espaces, chacun avec son cookie : /espace/mon-compte (ambassadeur.sosmiam.fr), /mon-compte sur
 * pro.sosmiam.fr (cadre pro) et /mon-compte sur sosmiam.fr (cadre public : voir routes.ts). « chemin » : celui de la page,
 * pour y revenir.
 */
function lireEspacePage(request: Request) {
  const url = new URL(request.url);
  const espace = lireEspaceMonCompte(lireEspaceHote(url.host), url.pathname);
  return { espace, chemin: espace === "ambassadeur" ? "/espace/mon-compte" : "/mon-compte", retour: retours[espace] };
}

const descriptions = {
  ambassadeur: "Ton compte ambassadeur SOS Miam.",
  pro: "Ton compte SOS Miam, dans l'espace pro.",
  site: "Ton compte SOS Miam : tes infos, tes données, et la suppression de ton compte, même sans te connecter.",
};

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: "Mon compte", description: descriptions[loaderData?.espace ?? "ambassadeur"] }), { name: "robots", content: "noindex" }];
}

/**
 * Ce que la page montre du compte : prénom, e-mail, ville et quartier (seulement avec une fiche d'ambassadeur) ; si le mot
 * de passe vient d'être changé ; l'espace qui sert la page, son lien de retour et l'avertissement de la suppression.
 * Sur sosmiam.fr, sans connexion : la page elle-même (connexion, suppression par mail, « Mes données »), pas de renvoi.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { espace, retour } = lireEspacePage(request);
  if (espace === "site" && !(await lireCompteConnecte(request))) {
    const accueil = url.searchParams.has("au-revoir") ? accueilsMonCompte["au-revoir"] : url.searchParams.has("deconnecte") ? accueilsMonCompte.deconnecte : null;
    // Sur sosmiam.fr, « Mot de passe oublié » vit sur l'espace ambassadeur (le lien reçu par mail y mène aussi)
    const adresseOubli = url.hostname === site.adresse ? `https://${HOTE_AMBASSADEUR}/mot-de-passe-oublie` : "/mot-de-passe-oublie";
    const messageExterne = lireMessageConnexionExterne(url.searchParams.get("externe"));
    return { connecte: false as const, espace, retour, accueil: accueil && lierPonctuation(accueil), adresseOubli, fournisseurs: lireFournisseursActifs(), messageExterne };
  }
  const { jeton, compte } = await exigerCompte(request);
  // Compte sans mot de passe (créé avec Apple ou Google) : la suppression se confirme en se reconnectant avec le compte lié
  // (si l'API ne répond pas, la page reste celle d'un compte avec mot de passe : l'API tranche de toute façon)
  const connexions = await lireConnexionsCompte(jeton, lireIpVisiteur(request));
  const actifs = lireFournisseursActifs();
  const attente = lireCookieAttente(request, Date.now());
  const sansMotDePasse = connexions.ok && !connexions.connexions.motDePasse
    ? {
        lies: (["apple", "google"] as const).filter((fournisseur) => connexions.connexions[fournisseur] && actifs[fournisseur]),
        pret: attente?.intention === "suppression" ? attente.fournisseur : null,
        depart: espace === "ambassadeur" ? "/espace/mon-compte" as const : "/mon-compte" as const,
        message: lireMessageConnexionExterne(url.searchParams.get("externe")),
      }
    : null;
  // La marque est l'heure du changement (Date.now() en base 36) : passé 2 minutes (rechargement, retour arrière, adresse
  // tapée à la main), plus de message
  const marque = url.searchParams.get(PARAMETRE_CHANGE);
  const recente = marque !== null && Math.abs(Date.now() - Number.parseInt(marque, 36)) < 2 * 60_000;
  // Sur sosmiam.fr, l'avertissement de la suppression suit le compte : ambassadeur, pro (au moins un lieu), ou ni l'un ni l'autre
  const suppression: "ambassadeur" | "pro" | "compte" = espace !== "site" ? espace : compte.ambassadeur ? "ambassadeur" : compte.pro?.lieux?.length ? "pro" : "compte";
  return {
    connecte: true as const,
    prenom: compte.prenom,
    email: compte.email,
    lieu: compte.ambassadeur ? { ville: compte.ambassadeur.ville, quartier: compte.ambassadeur.quartier } : null,
    motDePasseChange: recente ? marque : null,
    espace,
    retour,
    suppression,
    sansMotDePasse,
  };
}

/** Message général d'une erreur de l'API qui ne vise pas un champ (« attente » : secondes avant le prochain essai). */
function expliquer({ erreur, attente }: { erreur: string; attente?: number }): string {
  if (erreur === "occupe") return lierPonctuation(MESSAGE_OCCUPE);
  if (erreur !== "trop-de-demandes") return lierPonctuation("Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.");
  return lierPonctuation(`Trop d'essais : réessaie dans ${decrireAttente(attente)}.`);
}

/**
 * Trois formulaires (champ caché « formulaire ») : infos, mot de passe, suppression du compte ; et sur sosmiam.fr, la
 * connexion (dans la page même, puis retour ici).
 */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const page = lireEspacePage(request);
  if (formulaire.get("formulaire") === "connexion" && page.espace === "site") return connecterDepuisFormulaire(request, formulaire, "/mon-compte");
  const { jeton, compte } = await exigerCompte(request);
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
      // Le prénom avait la bonne longueur (vérifiée ici) : l'API le refuse pour un gros mot
      return { ok: false, formulaire: nom, erreurs: { [champ]: champ === "prenom" ? MESSAGE_PRENOM_REFUSE : messages[champ] }, valeurs };
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
    if (reponse.ok) {
      // Toutes les sessions du compte sont fermées, celle-ci comprise (un cookie volé ne sert plus à rien) : le nouveau
      // jeton part dans le cookie par une REDIRECTION. Avec data(), une page envoyée sans JavaScript relirait ses loaders
      // avec l'ancien jeton, déjà fermé, et renverrait à la connexion. L'ancre ramène à cette partie de la page.
      const cookie = reponse.session ? { "Set-Cookie": await poserCookieSession(reponse.session) } : undefined;
      throw redirect(`${page.chemin}?${PARAMETRE_CHANGE}=${Date.now().toString(36)}#mon-mot-de-passe`, { headers: cookie });
    }
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { actuel: messages.actuelIncorrect } };
    if (reponse.erreur === "champ-invalide") return { ok: false, formulaire: nom, erreurs: { nouveau: lierPonctuation(messages.nouveauRefuse) } };
    return { ok: false, formulaire: nom, message: expliquer(reponse) };
  }

  if (nom === "suppression") {
    const motDePasse = String(formulaire.get("motDePasse") ?? "");
    if (!motDePasse) return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasse } };
    const reponse = await supprimerCompte(jeton, ip, motDePasse);
    const apres = page.espace === "site" ? "/mon-compte?au-revoir" : "/connexion?au-revoir";
    if (reponse.ok) throw redirect(apres, { headers: { "Set-Cookie": await effacerCookieSession() } });
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasseIncorrect } };
    return { ok: false, formulaire: nom, message: expliquer(reponse) };
  }

  if (nom === "suppression-externe") {
    // Le jeton d'Apple ou de Google, gardé côté serveur après la reconnexion (10 minutes au plus)
    const attente = lireCookieAttente(request, Date.now());
    if (attente?.intention !== "suppression") return { ok: false, formulaire: nom, message: lierPonctuation(messagesConnexionExterne.expire) };
    const reponse = await supprimerCompteAvecFournisseur(jeton, ip, attente.fournisseur, attente.jeton, attente.nonce);
    const apres = page.espace === "site" ? "/mon-compte?au-revoir" : "/connexion?au-revoir";
    if (reponse.ok) {
      const entetes = new Headers();
      entetes.append("Set-Cookie", await effacerCookieSession());
      entetes.append("Set-Cookie", effacerCookieAttente());
      throw redirect(apres, { headers: entetes });
    }
    await redirigerSiSessionFermee(request, reponse.erreur);
    return { ok: false, formulaire: nom, message: lierPonctuation(messagesConnexionExterne[choisirCodeConnexionExterne(reponse.erreur)]) };
  }

  throw data("Formulaire inconnu", { status: 400 });
}

/**
 * Pages /espace/mon-compte et /mon-compte (espace pro, et site principal) : infos, mot de passe, déconnexion et
 * suppression du compte ; sur sosmiam.fr, en plus, « Mes données » et, sans connexion, la connexion et la suppression par mail.
 */
export default function PageMonCompte({ loaderData }: Route.ComponentProps) {
  const motDePasseChange = loaderData.connecte ? loaderData.motDePasseChange : null;
  // Mot de passe changé (on revient ici par une redirection, sans réponse d'action) : le formulaire l'annonce comme une
  // réussite et se vide. Un nouvel objet seulement quand la marque change : chaque changement est annoncé une fois.
  const confirmation = useMemo<ReponseFormulaire | undefined>(
    () => motDePasseChange
      ? { ok: true, formulaire: "mot-de-passe", message: lierPonctuation("C'est fait ! Ton nouveau mot de passe est enregistré, et tes autres connexions sont fermées.") }
      : undefined,
    [motDePasseChange],
  );
  const { espace, retour } = loaderData;
  const surSite = espace === "site";
  const lienRetour = (
    <p className="mt-8 text-center">
      <Link to={retour.vers} className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
        <span aria-hidden="true">← </span>{retour.texte}
      </Link>
    </p>
  );

  if (!loaderData.connecte) {
    return (
      <Section fond="creme" etroit>
        <TitreSection principal chapo={lierPonctuation(CHAPO_VISITEUR)}>Mon compte</TitreSection>
        {loaderData.accueil && (
          <p role="status" className="mx-auto -mt-4 mb-8 max-w-xl rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-center font-semibold">
            {loaderData.accueil}
          </p>
        )}
        <div className="grid gap-8">
          <ConnexionMonCompte adresseOubli={loaderData.adresseOubli} fournisseurs={loaderData.fournisseurs} messageExterne={loaderData.messageExterne} />
          <PartieSupprimerSansConnexion />
          <PartieMesDonnees connecte={false} />
        </div>
        {lienRetour}
      </Section>
    );
  }

  const { prenom, email, lieu, suppression, sansMotDePasse } = loaderData;
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(surSite ? CHAPO_CONNECTE : "Tes infos, ton mot de passe, et la porte de sortie si tu en as besoin.")}>
        Mon compte
      </TitreSection>
      <div className="grid gap-8">
        <PartieCompte id="mes-infos" titre="Mes infos">
          <FormulaireProfil prenom={prenom} email={email} lieu={lieu} />
        </PartieCompte>
        <PartieCompte id="mon-mot-de-passe" titre="Mon mot de passe">
          {sansMotDePasse
            ? <p className="text-gris">{lierPonctuation(AIDE_SANS_MOT_DE_PASSE)}</p>
            : <FormulaireChangerMotDePasse email={email} confirmation={confirmation} />}
        </PartieCompte>
        <PartieCompte id="me-deconnecter" titre="Me déconnecter">
          <p className="mb-5 text-gris">{lierPonctuation(sansMotDePasse ? "Sur cet appareil. Tu pourras te reconnecter quand tu veux avec Apple ou Google." : "Sur cet appareil. Tu pourras te reconnecter quand tu veux avec ton e-mail et ton mot de passe.")}</p>
          <BoutonDeconnexion apres={surSite ? "/mon-compte" : undefined} />
        </PartieCompte>
        <PartieCompte id="supprimer-mon-compte" titre="Supprimer mon compte">
          <FormulaireSupprimerCompte espace={suppression} sansMotDePasse={sansMotDePasse ?? undefined} />
        </PartieCompte>
        {surSite && <PartieMesDonnees connecte />}
      </div>
      {lienRetour}
    </Section>
  );
}
