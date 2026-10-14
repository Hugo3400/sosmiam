// « Mes façons de me connecter » dans « Mon compte » (sosmiam.fr/mon-compte, ambassadeur.sosmiam.fr/espace/mon-compte,
// pro.sosmiam.fr/mon-compte) : ce que la page montre, et ses formulaires. Relier ou délier (sans mot de passe) passe par
// Apple ou Google : leur retour est un POST d'un autre site, SANS le cookie de session, donc le jeton vérifié attend dans
// le cookie chiffré de 10 minutes, et un bouton de cette page termine l'action (avec la session). Ajouter un mot de
// passe : le lien de « Mot de passe oublié », envoyé à l'e-mail du compte. Jamais de jeton ni d'e-mail dans un journal.
import { redirect } from "react-router";

import type { ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { LIEN_MOT_DE_PASSE_ENVOYE } from "~/contenus/mes-connexions";
import { choisirCodeMesConnexions } from "~/fonctions/connexion-externe/choisir-code-mes-connexions";
import { estAdresseRelaisApple } from "../../../../packages/commun/src/fonctions/compte/est-adresse-relais-apple.ts";
import { lireMessageMesConnexions } from "~/fonctions/connexion-externe/lire-message-mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireAttente, delierConnexion, demanderNouveauMotDePasse, MESSAGE_OCCUPE, relierConnexion } from "~/services/comptes.server";
import { effacerCookieAttente, lireCookieAttente } from "~/services/cookies-connexion-externe.server";
import { redirigerSiSessionFermee } from "~/services/session-compte.server";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const AUTRE: Record<FournisseurExterne, FournisseurExterne> = { apple: "google", google: "apple" };

/** Les formulaires de la partie (champ caché « formulaire ») */
export const FORMULAIRES_MES_CONNEXIONS = ["ajouter-mot-de-passe", "relier-externe", "delier-externe", "connexion-annuler", "delier-apple", "delier-google"];

type ConnexionsLues = { ok: true; connexions: { motDePasse: boolean; apple: boolean; google: boolean } } | { ok: false };

/** Ce que la partie montre ; null si l'API n'a pas pu dire comment le compte se connecte (la partie l'annonce simplement). */
export function preparerMesConnexions(
  request: Request, lues: ConnexionsLues, email: string, depart: MesConnexions["depart"], actifs: Record<FournisseurExterne, boolean>,
): MesConnexions | null {
  if (!lues.ok) return null;
  const url = new URL(request.url);
  const attente = lireCookieAttente(request, Date.now());
  const pret = attente && (attente.intention === "relier" || attente.intention === "delier") ? { intention: attente.intention, fournisseur: attente.fournisseur } : null;
  return {
    ...lues.connexions, actifs, pret, depart, email, relaisApple: estAdresseRelaisApple(email),
    message: lireMessageMesConnexions(url.searchParams.get("connexions"), url.searchParams.get("avec")),
  };
}

type Contexte = { jeton: string; email: string; ip: string | null; chemin: string };

/** Retour à la partie avec un message, et le jeton en attente effacé */
function revenir(chemin: string, code: string, fournisseur: FournisseurExterne): never {
  throw redirect(`${chemin}?connexions=${code}&avec=${fournisseur}#mes-connexions`, { headers: { "Set-Cookie": effacerCookieAttente() } });
}

const expliquerPanne = (erreur: string, attente?: number) =>
  lierPonctuation(erreur === "occupe" ? MESSAGE_OCCUPE : erreur === "trop-de-demandes"
    ? `Trop d'essais : réessaie dans ${decrireAttente(attente)}.`
    : "Oups, ça n'a pas marché. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.");

/**
 * Les formulaires de « Mes façons de me connecter » ; null pour un autre formulaire de la page. Relier, délier et
 * « annuler » finissent par une redirection (message dans l'adresse, cookie d'attente effacé) ; « Ajouter un mot de
 * passe » et « Délier » avec mot de passe répondent dans la page.
 */
export async function traiterMesConnexions(request: Request, formulaire: FormData, contexte: Contexte): Promise<ReponseFormulaire | null> {
  const nom = String(formulaire.get("formulaire") ?? "");
  if (!FORMULAIRES_MES_CONNEXIONS.includes(nom)) return null;
  const { jeton, email, ip, chemin } = contexte;

  if (nom === "ajouter-mot-de-passe") {
    const reponse = await demanderNouveauMotDePasse(email, ip);
    if (reponse.ok) return { ok: true, formulaire: nom, message: lierPonctuation(LIEN_MOT_DE_PASSE_ENVOYE) };
    return { ok: false, formulaire: nom, message: expliquerPanne(reponse.erreur, reponse.attente) };
  }

  const attente = lireCookieAttente(request, Date.now());
  if (nom === "connexion-annuler") revenir(chemin, "annule", attente?.fournisseur ?? "google");

  if (nom === "relier-externe" || nom === "delier-externe") {
    const intention = nom === "relier-externe" ? "relier" : "delier";
    if (!attente || attente.intention !== intention) revenir(chemin, "expire", attente?.fournisseur ?? "google");
    const { fournisseur } = attente;
    const reponse = intention === "relier"
      ? await relierConnexion(jeton, ip, fournisseur, attente.jeton, attente.nonce)
      : await delierConnexion(jeton, ip, AUTRE[fournisseur], { fournisseur, jeton: attente.jeton, nonce: attente.nonce });
    // Le message parle du fournisseur relié ou délié (pour délier, c'est l'autre qui a confirmé)
    const cible = intention === "relier" ? fournisseur : AUTRE[fournisseur];
    if (reponse.ok) revenir(chemin, intention === "relier" ? "relie" : "delie", cible);
    await redirigerSiSessionFermee(request, reponse.erreur);
    // « confirmation-incorrecte » parle du fournisseur qui a confirmé
    revenir(chemin, choisirCodeMesConnexions(reponse.erreur), reponse.erreur === "confirmation-incorrecte" ? fournisseur : cible);
  }

  // « Délier » avec le mot de passe (compte qui en a un)
  const cible: FournisseurExterne = nom === "delier-apple" ? "apple" : "google";
  const motDePasse = String(formulaire.get("motDePasse") ?? "");
  if (!motDePasse) return { ok: false, formulaire: nom, erreurs: { motDePasse: "Indique ton mot de passe pour confirmer." } };
  const reponse = await delierConnexion(jeton, ip, cible, { motDePasse });
  if (reponse.ok) revenir(chemin, "delie", cible);
  await redirigerSiSessionFermee(request, reponse.erreur);
  if (reponse.erreur === "mot-de-passe-incorrect") return { ok: false, formulaire: nom, erreurs: { motDePasse: "Ce n'est pas ton mot de passe." } };
  if (reponse.erreur === "trop-de-demandes" || reponse.erreur === "occupe") return { ok: false, formulaire: nom, message: expliquerPanne(reponse.erreur, reponse.attente) };
  const message = lireMessageMesConnexions(choisirCodeMesConnexions(reponse.erreur), cible);
  return { ok: false, formulaire: nom, message: lierPonctuation(message?.texte ?? expliquerPanne(reponse.erreur)) };
}
