// Consentement aux cookies, côté serveur : lecture du choix à chaque page (loader de root.tsx, pour un premier affichage
// sans clignotement) et enregistrement du choix envoyé par un formulaire, avec ou sans JavaScript (POST /cookies/choix,
// servi sur les trois hôtes). Catégories : src/contenus/cookies-consentement.ts.
import { redirect } from "react-router";

import { calculerVersionConsentement } from "~/fonctions/consentement/calculer-version-consentement";
import { choisirCategoriesConsentement } from "~/fonctions/consentement/choisir-categories-consentement";
import { choisirReglagesCookieConsentement } from "~/fonctions/consentement/choisir-reglages-cookie-consentement";
import { creerEffacementsTraceurs } from "~/fonctions/consentement/creer-effacements-traceurs";
import { ecrireCookieConsentement } from "~/fonctions/consentement/ecrire-cookie-consentement";
import { estApercuCookies } from "~/fonctions/consentement/est-apercu-cookies";
import { lireChoixConsentement } from "~/fonctions/consentement/lire-choix-consentement";
import { lireFormulaireConsentement } from "~/fonctions/consentement/lire-formulaire-consentement";
import { lireRetourConsentement } from "~/fonctions/consentement/lire-retour-consentement";
import { listerCategoriesAChoisir } from "~/fonctions/consentement/lister-categories-a-choisir";
import type { EtatConsentementServeur } from "~/types/consentement";

/** Aperçu ou pas, et le choix encore valable de la requête (null : pas de choix, expiré, ou autre version). */
export function lireEtatConsentement(requete: Request): EtatConsentementServeur {
  const url = new URL(requete.url);
  const apercu = estApercuCookies(url.hostname, url.searchParams);
  const version = calculerVersionConsentement(choisirCategoriesConsentement(apercu));
  return { apercu, choix: lireChoixConsentement(requete.headers.get("cookie"), version, Date.now()) };
}

/**
 * POST /cookies/choix : enregistre le choix (cookie « sosmiam-consentement », 6 mois), efface les cookies connus des
 * catégories retirées, puis revient à la page d'où il est parti (champ « retour »). L'aperçu suit l'adresse du
 * formulaire (« /cookies/choix?apercu-cookies »). S'il n'y a rien à choisir, aucun cookie n'est posé.
 */
export async function enregistrerChoixConsentement(requete: Request): Promise<Response> {
  const url = new URL(requete.url);
  const apercu = estApercuCookies(url.hostname, url.searchParams);
  const categories = choisirCategoriesConsentement(apercu);
  const aChoisir = listerCategoriesAChoisir(categories);
  const formulaire = await requete.formData();
  const retour = lireRetourConsentement(formulaire.get("retour")) ?? "/";
  const entetes = new Headers({ "Cache-Control": "private, no-store" });
  if (aChoisir.length === 0) return redirect(retour, { status: 303, headers: entetes });

  const maintenant = Date.now();
  const enTeteCookie = requete.headers.get("cookie");
  const version = calculerVersionConsentement(categories);
  const actuel = lireChoixConsentement(enTeteCookie, version, maintenant);
  const reponses = lireFormulaireConsentement(formulaire, aChoisir, actuel);
  const choix = { version, date: Math.floor(maintenant / 1000) * 1000, reponses };
  entetes.append("Set-Cookie", ecrireCookieConsentement(choix, choisirReglagesCookieConsentement(url.hostname, apercu), maintenant));
  const retirees = aChoisir.filter((categorie) => actuel?.reponses[categorie.id] === true && reponses[categorie.id] !== true);
  for (const effacement of creerEffacementsTraceurs(retirees, enTeteCookie, url.hostname)) entetes.append("Set-Cookie", effacement);
  return redirect(retour, { status: 303, headers: entetes });
}
