import { data, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/accueil";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { BandeauThemeSaison } from "~/composants/accueil/BandeauThemeSaison";
import { CommentCaMarche } from "~/composants/accueil/CommentCaMarche";
import { DevenirAmbassadeur } from "~/composants/accueil/DevenirAmbassadeur";
import { Hero } from "~/composants/accueil/Hero";
import { IlsOntBesoinDeToi } from "~/composants/accueil/IlsOntBesoinDeToi";
import { Inscription, type ReponseInscription } from "~/composants/accueil/Inscription";
import { PourLesPros } from "~/composants/accueil/PourLesPros";
import { BigSosEnBref } from "~/composants/big-sos/BigSosEnBref";
import { DonneesStructurees } from "~/composants/mise-en-page/DonneesStructurees";
import { TEXTES_ACCUEIL_PAR_LANGUE } from "~/contenus/accueil";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerDonneesOrganisation } from "~/fonctions/seo/creer-donnees-organisation";
import { creerDonneesSite } from "~/fonctions/seo/creer-donnees-site";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { trouverLieuPropose } from "~/fonctions/texte/trouver-lieu-propose";
import { verifierEmail } from "~/fonctions/texte/verifier-email";
import { inscrireNewsletter } from "~/services/inscriptions.server";
import { lireLangueRequete } from "~/services/langue.server";
import { listerLieuxAccueil, listerVillesLieux } from "~/services/page-lieux.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import { lireThemeSaisonAccueil } from "~/services/themes-saison.server";

export function meta({ matches }: Route.MetaArgs) {
  // Le titre dit ce qu'est SOS Miam dès le résultat de recherche (un livre jeunesse porte un nom proche) : 60 et 155 caractères au plus
  const langue = lireLangueMeta(matches?.flatMap((correspondance) => (correspondance ? [correspondance] : [])));
  const T = choisirTextes(TEXTES_ACCUEIL_PAR_LANGUE, langue);
  return creerMeta({ ...T.meta, langue });
}

/** Les vrais lieux publiés, lus à chaque affichage de l'accueil : aucun lieu inventé sur le site. */
export async function loader({ request }: Route.LoaderArgs) {
  const ip = lireIpVisiteur(request);
  const { langue } = lireLangueRequete(request);
  const [accueil, villes, themeSaison] = await Promise.all([listerLieuxAccueil(ip), listerVillesLieux(ip), lireThemeSaisonAccueil(ip, Date.now, langue)]);
  const nombreLieux = villes.ok ? villes.donnees.reduce((total, ville) => total + ville.nombre, 0) : null;
  return { lieux: accueil.lieux, tirage: accueil.tirage, nombreLieux, themeSaison };
}

/** Après l'envoi du formulaire d'inscription, inutile de relire les lieux. */
export function shouldRevalidate({ formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return formMethod === "POST" ? false : defaultShouldRevalidate;
}

/** Reçoit le formulaire « Préviens-moi » (avec ou sans JavaScript dans le navigateur). */
export async function action({ request }: Route.ActionArgs): Promise<ReponseInscription> {
  let formulaire: FormData;
  try {
    formulaire = await request.formData();
  } catch {
    // Corps vide ou qui n'est pas un formulaire (robot…) : erreur du visiteur, pas du serveur
    throw data("Formulaire illisible", { status: 400 });
  }
  const email = String(formulaire.get("email") ?? "");
  const ville = String(formulaire.get("ville") ?? "");
  const ambassadeur = formulaire.get("ambassadeur") === "oui";
  const beta = formulaire.get("beta") === "oui";
  const telephoneSaisi = formulaire.get("telephone");
  const telephone = telephoneSaisi === "iphone" || telephoneSaisi === "android" ? telephoneSaisi : null;
  const piege = String(formulaire.get("piege") ?? "");
  // Renvoyées avec un refus : sans JavaScript, le formulaire se remplit de nouveau avec ce qui avait été tapé
  const valeurs = { email, ville, telephone: telephone ?? "", beta, ambassadeur };

  if (!verifierEmail(email)) {
    return { ok: false, erreur: "email-invalide", champ: "email", valeurs };
  }
  // Pour inviter quelqu'un à la bêta, il faut savoir sur quel store : App Store (iPhone) ou Play Store (Android)
  if (beta && !telephone) {
    return { ok: false, erreur: "telephone-requis", champ: "telephone", valeurs };
  }

  // Un lieu proposé reconnu (« beziers ») est enregistré sous son vrai nom (« Béziers »), le reste tel que tapé
  const lieu = trouverLieuPropose(ville);
  // nginx transmet l'adresse IP du visiteur : l'API s'en sert pour limiter les essais, sans la garder
  const resultat = await inscrireNewsletter(
    { email, ville: lieu?.valeur ?? ville, ambassadeur, telephone, beta, piege },
    request.headers.get("x-real-ip"),
  );
  if (resultat !== "ok") {
    return { ok: false, erreur: resultat, champ: resultat === "email-invalide" ? "email" : undefined, valeurs };
  }
  return { ok: true, lieu: lieu ? { nom: lieu.nom, ou: lieu.ou } : null, beta, ambassadeur };
}

/** Page d'accueil : la promesse, le principe, les lieux, le BIG SOS, les pros, les ambassadeurs et l'inscription. */
export default function Accueil({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <DonneesStructurees donnees={[creerDonneesSite(), creerDonneesOrganisation()]} />
      {loaderData.themeSaison && <BandeauThemeSaison theme={loaderData.themeSaison} />}
      <Hero />
      <CommentCaMarche />
      <IlsOntBesoinDeToi lieux={loaderData.lieux} nombreLieux={loaderData.nombreLieux} tirage={loaderData.tirage} />
      <BigSosEnBref />
      <PourLesPros />
      <DevenirAmbassadeur />
      <Inscription />
    </>
  );
}
