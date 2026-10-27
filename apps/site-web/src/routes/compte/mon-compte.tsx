import { useMemo } from "react";
import { data, Link, redirect, useActionData } from "react-router";

import type { Route } from "./+types/mon-compte";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { BoutonDeconnexion } from "~/composants/compte/BoutonDeconnexion";
import { ConnexionMonCompte } from "~/composants/compte/ConnexionMonCompte";
import { EncadreCompteLimite, FORMULAIRE_CONTESTATION } from "~/composants/compte/EncadreCompteLimite";
import { FormulaireChangerMotDePasse } from "~/composants/compte/FormulaireChangerMotDePasse";
import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { FormulaireProfil } from "~/composants/compte/FormulaireProfil";
import { FormulaireSupprimerCompte } from "~/composants/compte/FormulaireSupprimerCompte";
import { PartieCompte } from "~/composants/compte/PartieCompte";
import { PartieMesConnexions } from "~/composants/compte/PartieMesConnexions";
import { PartieMesDonnees } from "~/composants/compte/PartieMesDonnees";
import { PartieSupprimerSansConnexion } from "~/composants/compte/PartieSupprimerSansConnexion";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_CONNEXION_COMPTE_PAR_LANGUE } from "~/contenus/connexion-compte";
import { TEXTES_CONNEXION_EXTERNE_PAR_LANGUE } from "~/contenus/connexion-externe";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_MESSAGES_COMPTE_PAR_LANGUE } from "~/contenus/messages-compte";
import { TEXTES_MON_COMPTE_PAR_LANGUE } from "~/contenus/mon-compte";
import { ecrireAttente } from "~/fonctions/compte/ecrire-attente";
import { expliquerCompteLimite } from "~/fonctions/compte/expliquer-compte-limite";
import { lireMotifLimitation } from "~/fonctions/compte/lire-motif-limitation";
import { choisirCodeConnexionExterne } from "~/fonctions/connexion-externe/choisir-code-connexion-externe";
import { lireCodeConnexionExterne } from "~/fonctions/connexion-externe/lire-code-connexion-externe";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";
import { lireEspaceHote } from "~/fonctions/hotes/lire-espace-hote";
import { lireEspaceMonCompte } from "~/fonctions/hotes/lire-espace-mon-compte";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import {
  changerMotDePasse, lireConnexionsCompte, modifierCompte, supprimerCompte, supprimerCompteAvecFournisseur,
} from "~/services/comptes.server";
import { effacerCookieAttente, lireCookieAttente } from "~/services/cookies-connexion-externe.server";
import { lireFournisseursActifs } from "~/services/reglages-connexion-externe.server";
import { connecterDepuisFormulaire } from "~/services/connexion-compte.server";
import { lireQrAffiche } from "~/services/connexion-qr.server";
import { lireLangueRequete } from "~/services/langue.server";
import { contesterLimitation, lireLimitation } from "~/services/limitation-compte.server";
import { preparerMesConnexions, traiterMesConnexions } from "~/services/mes-connexions.server";
import {
  effacerCookieSession, exigerCompte, lireCompteConnecte, lireIpVisiteur, poserCookieSession, redirigerSiSessionFermee,
} from "~/services/session-compte.server";


/** Après un changement de mot de passe : « ?mot-de-passe-change=<marque> », une marque nouvelle à chaque changement. */
const PARAMETRE_CHANGE = "mot-de-passe-change";

/** Où mène le lien du bas de la page, selon l'espace. */
const RETOURS = { ambassadeur: "/espace", pro: "/tableau", site: "/" };

/**
 * La même page sert trois espaces, chacun avec son cookie : /espace/mon-compte (ambassadeur.sosmiam.fr), /mon-compte sur
 * pro.sosmiam.fr (cadre pro) et /mon-compte sur sosmiam.fr (cadre public : voir routes.ts). « chemin » : celui de la page,
 * pour y revenir.
 */
function lireEspacePage(request: Request) {
  const url = new URL(request.url);
  const espace = lireEspaceMonCompte(lireEspaceHote(url.host), url.pathname);
  return { espace, chemin: espace === "ambassadeur" ? "/espace/mon-compte" : "/mon-compte", retour: RETOURS[espace] };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_MON_COMPTE_PAR_LANGUE, langue);
  return [...creerMeta({ titre: T.titre, description: T.descriptions[loaderData?.espace ?? "ambassadeur"], langue }), { name: "robots", content: "noindex" }];
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
    const accueil = url.searchParams.has("au-revoir") ? "au-revoir" as const : url.searchParams.has("deconnecte") ? "deconnecte" as const : null;
    // Sur sosmiam.fr, « Mot de passe oublié » vit sur l'espace ambassadeur (le lien reçu par mail y mène aussi)
    const adresseOubli = url.hostname === site.adresse ? `https://${HOTE_AMBASSADEUR}/mot-de-passe-oublie` : "/mot-de-passe-oublie";
    const messageExterne = lireCodeConnexionExterne(url.searchParams.get("externe"));
    return { connecte: false as const, espace, retour, accueil, adresseOubli, fournisseurs: lireFournisseursActifs(), messageExterne,
      // « Me connecter avec l'app » : le QR redessiné après un retour sans JavaScript (« ?qr=… »), sinon rien
      qr: lireQrAffiche(request) };
  }
  const { jeton, compte } = await exigerCompte(request);
  // Compte sans mot de passe (créé avec Apple ou Google) : la suppression se confirme en se reconnectant avec le compte lié
  // (si l'API ne répond pas, la page reste celle d'un compte avec mot de passe : l'API tranche de toute façon)
  // « Ton compte est limité » : la limitation en cours ou à venir (si l'API ne répond pas, pas d'encadré : l'API tranche)
  const ip = lireIpVisiteur(request);
  const [connexions, limitationLue] = await Promise.all([lireConnexionsCompte(jeton, ip), lireLimitation(jeton, ip)]);
  const limitation = limitationLue.ok && limitationLue.limitation
    ? { vue: limitationLue.limitation, motif: lireMotifLimitation(limitationLue.limitation.motif) }
    : null;
  const actifs = lireFournisseursActifs();
  const attente = lireCookieAttente(request, Date.now());
  const sansMotDePasse = connexions.ok && !connexions.connexions.motDePasse
    ? {
        lies: (["apple", "google"] as const).filter((fournisseur) => connexions.connexions[fournisseur] && actifs[fournisseur]),
        pret: attente?.intention === "suppression" ? attente.fournisseur : null,
        depart: espace === "ambassadeur" ? "/espace/mon-compte" as const : "/mon-compte" as const,
        message: lireCodeConnexionExterne(url.searchParams.get("externe")),
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
    mesConnexions: preparerMesConnexions(request, connexions, compte.email, espace === "ambassadeur" ? "/espace/mon-compte" : "/mon-compte", actifs),
    limitation,
  };
}

/** Message général d'une erreur de l'API qui ne vise pas un champ (« attente » : secondes avant le prochain essai). */
function expliquer({ erreur, attente }: { erreur: string; attente?: number }, langue: Langue): string {
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  if (erreur === "occupe") return lierPonctuation(M.occupe);
  if (erreur !== "trop-de-demandes") return lierPonctuation(M.panne);
  return lierPonctuation(M.tropDEssais(ecrireAttente(attente, langue)));
}

/**
 * Les formulaires (champ caché « formulaire ») : infos, mot de passe, suppression du compte, « Mes façons de me
 * connecter » (services/mes-connexions.server.ts) ; et sur sosmiam.fr, la connexion (dans la page même, puis retour ici).
 */
export async function action({ request }: Route.ActionArgs): Promise<ReponseFormulaire> {
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data("Formulaire illisible", { status: 400 });
  const page = lireEspacePage(request);
  if (formulaire.get("formulaire") === "connexion" && page.espace === "site") return connecterDepuisFormulaire(request, formulaire, "/mon-compte");
  const { langue } = lireLangueRequete(request);
  const M = choisirTextes(TEXTES_MESSAGES_COMPTE_PAR_LANGUE, langue);
  const T = choisirTextes(TEXTES_MON_COMPTE_PAR_LANGUE, langue);
  const L = choisirTextes(TEXTES_LIMITATION_PAR_LANGUE, langue);
  const messages = {
    prenom: M.prenom, ville: M.ville, quartier: M.quartier, actuel: T.messages.actuel, actuelIncorrect: T.messages.actuelIncorrect,
    nouveau: T.messages.nouveau, nouveauRefuse: M.motDePasseRefuse, motDePasse: M.motDePasseConfirmer, motDePasseIncorrect: M.motDePasseIncorrect,
  };
  const { jeton, compte } = await exigerCompte(request);
  const lire = (nom: string) => String(formulaire.get(nom) ?? "").replace(/\s+/g, " ").trim();
  const ip = lireIpVisiteur(request);
  const nom = formulaire.get("formulaire");
  // « Mes façons de me connecter » : ajouter un mot de passe, relier ou délier Apple et Google
  const mesConnexions = await traiterMesConnexions(request, formulaire, { jeton, email: compte.email, ip, chemin: page.chemin });
  if (mesConnexions) return mesConnexions;

  if (nom === "infos") {
    const valeurs = { prenom: lire("prenom"), ville: lire("ville"), quartier: lire("quartier") };
    const erreurs: Record<string, string> = {};
    if (!valeurs.prenom || valeurs.prenom.length > 40) erreurs.prenom = messages.prenom;
    if (compte.ambassadeur && (valeurs.ville.length < 2 || valeurs.ville.length > 80)) erreurs.ville = messages.ville;
    if (compte.ambassadeur && valeurs.quartier.length > 80) erreurs.quartier = messages.quartier;
    if (Object.keys(erreurs).length > 0) return { ok: false, formulaire: nom, erreurs, valeurs };
    // Un quartier vide efface celui qui était enregistré
    const reponse = await modifierCompte(jeton, ip, compte.ambassadeur ? valeurs : { prenom: valeurs.prenom });
    if (reponse.ok) return { ok: true, formulaire: nom, message: T.enregistre };
    await redirigerSiSessionFermee(request, reponse.erreur);
    const champ = reponse.champ as keyof typeof messages | undefined;
    // Compte limité : un nouveau prénom se verrait des autres, il attend la fin de la limitation
    if (reponse.erreur === "compte-limite") return { ok: false, formulaire: nom, message: lierPonctuation(expliquerCompteLimite(reponse.jusqua, langue)), valeurs };
    if (reponse.erreur === "champ-invalide" && champ && (champ === "prenom" || champ === "ville" || champ === "quartier")) {
      // Le prénom avait la bonne longueur (vérifiée ici) : l'API le refuse pour un gros mot
      return { ok: false, formulaire: nom, erreurs: { [champ]: champ === "prenom" ? M.prenomRefuse : messages[champ] }, valeurs };
    }
    return { ok: false, formulaire: nom, message: expliquer(reponse, langue), valeurs };
  }

  if (nom === FORMULAIRE_CONTESTATION) {
    // « Contester » ma limitation : 10 à 1 000 caractères, une seule fois, pendant la limitation
    const texte = String(formulaire.get("texte") ?? "").trim();
    if (texte.length < 10 || texte.length > 1000) return { ok: false, formulaire: nom, erreurs: { texte: lierPonctuation(L.texteInvalide) }, valeurs: { texte } };
    const reponse = await contesterLimitation(jeton, ip, texte);
    if (reponse.ok) return { ok: true, formulaire: nom, message: lierPonctuation(L.envoiReussi) };
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "champ-invalide") return { ok: false, formulaire: nom, erreurs: { texte: lierPonctuation(L.texteInvalide) }, valeurs: { texte } };
    const message = reponse.erreur === "deja-conteste" ? L.dejaConteste : reponse.erreur === "aucune-limitation" ? L.plusDeLimitation : null;
    return { ok: false, formulaire: nom, message: message ? lierPonctuation(message) : expliquer(reponse, langue), valeurs: { texte } };
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
    return { ok: false, formulaire: nom, message: expliquer(reponse, langue) };
  }

  if (nom === "suppression") {
    const motDePasse = String(formulaire.get("motDePasse") ?? "");
    if (!motDePasse) return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasse } };
    const reponse = await supprimerCompte(jeton, ip, motDePasse);
    const apres = page.espace === "site" ? "/mon-compte?au-revoir" : "/connexion?au-revoir";
    if (reponse.ok) throw redirect(apres, { headers: { "Set-Cookie": await effacerCookieSession() } });
    await redirigerSiSessionFermee(request, reponse.erreur);
    if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { motDePasse: messages.motDePasseIncorrect } };
    return { ok: false, formulaire: nom, message: expliquer(reponse, langue) };
  }

  if (nom === "suppression-externe") {
    // Le jeton d'Apple ou de Google, gardé côté serveur après la reconnexion (10 minutes au plus)
    const attente = lireCookieAttente(request, Date.now());
    const externe = choisirTextes(TEXTES_CONNEXION_EXTERNE_PAR_LANGUE, langue).messages;
    if (attente?.intention !== "suppression") return { ok: false, formulaire: nom, message: lierPonctuation(externe.expire) };
    const reponse = await supprimerCompteAvecFournisseur(jeton, ip, attente.fournisseur, attente.jeton, attente.nonce);
    const apres = page.espace === "site" ? "/mon-compte?au-revoir" : "/connexion?au-revoir";
    if (reponse.ok) {
      const entetes = new Headers();
      entetes.append("Set-Cookie", await effacerCookieSession());
      entetes.append("Set-Cookie", effacerCookieAttente());
      throw redirect(apres, { headers: entetes });
    }
    await redirigerSiSessionFermee(request, reponse.erreur);
    return { ok: false, formulaire: nom, message: lierPonctuation(externe[choisirCodeConnexionExterne(reponse.erreur)]) };
  }

  throw data("Formulaire inconnu", { status: 400 });
}

/**
 * Pages /espace/mon-compte et /mon-compte (espace pro, et site principal) : infos, mot de passe, déconnexion et
 * suppression du compte ; sur sosmiam.fr, en plus, « Mes données » et, sans connexion, la connexion et la suppression par mail.
 */
export default function PageMonCompte({ loaderData }: Route.ComponentProps) {
  const T = utiliserTextes(TEXTES_MON_COMPTE_PAR_LANGUE);
  const { accueils } = utiliserTextes(TEXTES_CONNEXION_COMPTE_PAR_LANGUE);
  const reponseAction = useActionData<ReponseFormulaire>();
  const motDePasseChange = loaderData.connecte ? loaderData.motDePasseChange : null;
  // Mot de passe changé (on revient ici par une redirection, sans réponse d'action) : le formulaire l'annonce comme une
  // réussite et se vide. Un nouvel objet seulement quand la marque change : chaque changement est annoncé une fois.
  const confirmation = useMemo<ReponseFormulaire | undefined>(
    () => motDePasseChange
      ? { ok: true, formulaire: "mot-de-passe", message: lierPonctuation(T.motDePasseChange) }
      : undefined,
    [motDePasseChange, T],
  );
  const { espace, retour } = loaderData;
  const surSite = espace === "site";
  const lienRetour = (
    <p className="mt-8 text-center">
      <Link to={retour} className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
        <span aria-hidden="true">← </span>{T.retours[espace]}
      </Link>
    </p>
  );

  if (!loaderData.connecte) {
    return (
      <Section fond="creme" etroit>
        <TitreSection principal chapo={lierPonctuation(T.chapoVisiteur)}>{T.titre}</TitreSection>
        {loaderData.accueil && (
          <p role="status" className="mx-auto -mt-4 mb-8 max-w-xl rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 text-center font-semibold">
            {lierPonctuation(accueils[loaderData.accueil])}
          </p>
        )}
        <div className="grid gap-8">
          <ConnexionMonCompte adresseOubli={loaderData.adresseOubli} fournisseurs={loaderData.fournisseurs} messageExterne={loaderData.messageExterne} qr={loaderData.qr} />
          <PartieSupprimerSansConnexion />
          <PartieMesDonnees connecte={false} />
        </div>
        {lienRetour}
      </Section>
    );
  }

  const { prenom, email, lieu, suppression, sansMotDePasse, mesConnexions, limitation } = loaderData;
  // Contestation refusée alors que l'encadré a disparu entre-temps (limitation finie ou levée) : le message reste visible
  const contestationSansEncadre = !limitation && reponseAction?.formulaire === FORMULAIRE_CONTESTATION ? reponseAction.message : undefined;
  return (
    <Section fond="creme" etroit>
      <TitreSection principal chapo={lierPonctuation(surSite ? T.chapoConnecte : T.chapoEspace)}>
        {T.titre}
      </TitreSection>
      <div className="grid gap-8">
        {limitation && <EncadreCompteLimite limitation={limitation.vue} motif={limitation.motif} />}
        {contestationSansEncadre && <p role="status" className="rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 font-semibold">{contestationSansEncadre}</p>}
        <PartieCompte id="mes-infos" titre={T.parties.mesInfos}>
          <FormulaireProfil prenom={prenom} email={email} lieu={lieu} />
        </PartieCompte>
        <PartieMesConnexions connexions={mesConnexions} />
        <PartieCompte id="mon-mot-de-passe" titre={T.parties.monMotDePasse}>
          {sansMotDePasse
            ? <p className="text-gris">{lierPonctuation(T.aideSansMotDePasse)}</p>
            : <FormulaireChangerMotDePasse email={email} confirmation={confirmation} />}
        </PartieCompte>
        <PartieCompte id="me-deconnecter" titre={T.parties.meDeconnecter}>
          <p className="mb-5 text-gris">{lierPonctuation(sansMotDePasse ? T.deconnexionAppleGoogle : T.deconnexionEmail)}</p>
          <BoutonDeconnexion apres={surSite ? "/mon-compte" : undefined} />
        </PartieCompte>
        <PartieCompte id="supprimer-mon-compte" titre={T.parties.supprimer}>
          <FormulaireSupprimerCompte espace={suppression} sansMotDePasse={sansMotDePasse ?? undefined} />
        </PartieCompte>
        {surSite && <PartieMesDonnees connecte />}
      </div>
      {lienRetour}
    </Section>
  );
}
