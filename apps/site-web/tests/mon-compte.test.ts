// Tests du « Mon compte » de sosmiam.fr (https://sosmiam.fr/mon-compte, l'adresse donnée à Google Play pour supprimer son
// compte) : partage des hôtes, route et cadre choisis, espace de la page, textes de « Mes données » et de la suppression
// sans connexion. node --test tests/*.test.ts. Le rendu de la page est vérifié à part, dans un navigateur.
import assert from "node:assert/strict";
import { test } from "node:test";

import { matchRoutes, type RouteObject } from "react-router";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";
// @ts-ignore : même raison
import { lireEspaceMonCompte } from "../src/fonctions/hotes/lire-espace-mon-compte.ts";
// @ts-ignore : même raison
import { ecrireAdresseMail } from "../src/fonctions/texte/ecrire-adresse-mail.ts";
// @ts-ignore : même raison
import { TEXTES_MON_COMPTE } from "../src/contenus/mon-compte.ts";
// @ts-ignore : même raison
import routes from "../src/routes.ts";

const { aideAppleGoogle: AIDE_APPLE_GOOGLE, delaiReponse: DELAI_REPONSE, droitsRgpd, mailSuppression, resteApresSuppression: RESTE_APRES_SUPPRESSION } = TEXTES_MON_COMPTE;
const AMBASSADEUR = "ambassadeur.sosmiam.fr";
const PRO = "pro.sosmiam.fr";
const arbre = [{ path: "", children: routes }] as unknown as RouteObject[];

test("sosmiam.fr sert /mon-compte et /deconnexion (son propre cookie) ; les autres pages du compte restent aux espaces", () => {
  for (const chemin of ["/mon-compte", "/mon-compte/", "/Mon-Compte", "/mon-compte.data", "/mon-compte?au-revoir", "/mon-compte?deconnecte", "/deconnexion", "/deconnexion.data"]) {
    assert.equal(choisirRedirectionHote("sosmiam.fr", chemin), null, chemin);
  }
  const attendus: [string, string][] = [
    ["/connexion", `https://${AMBASSADEUR}/connexion`],
    ["/mot-de-passe-oublie", `https://${AMBASSADEUR}/mot-de-passe-oublie`],
    ["/nouveau-mot-de-passe", `https://${AMBASSADEUR}/nouveau-mot-de-passe`],
    ["/inscription", `https://${AMBASSADEUR}/inscription`],
    ["/espace/mon-compte", `https://${AMBASSADEUR}/espace/mon-compte`],
    ["/tableau", `https://${PRO}/tableau`],
  ];
  for (const [chemin, adresse] of attendus) assert.deepEqual(choisirRedirectionHote("sosmiam.fr", chemin), { adresse, statut: 301 }, chemin);
  // Une adresse qui commence pareil sans être la page : « Page introuvable » de sosmiam.fr, comme avant
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/mon-compte/autre"), null);
});

test("pro.sosmiam.fr garde son /mon-compte ; ambassadeur.sosmiam.fr renvoie vers /espace/mon-compte", () => {
  assert.equal(choisirRedirectionHote(PRO, "/mon-compte"), null);
  assert.equal(choisirRedirectionHote(PRO, "/deconnexion"), null);
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/mon-compte"), { adresse: "/espace/mon-compte", statut: 302 });
  assert.equal(choisirRedirectionHote(AMBASSADEUR, "/deconnexion"), null);
});

test("lireEspaceMonCompte : /mon-compte est la page du site, sauf sur l'hôte pro ; le reste, celle de l'ambassadeur", () => {
  assert.equal(lireEspaceMonCompte("ambassadeur", "/mon-compte"), "site");
  assert.equal(lireEspaceMonCompte("ambassadeur", "/mon-compte.data"), "site");
  assert.equal(lireEspaceMonCompte("ambassadeur", "/Mon-Compte/"), "site");
  assert.equal(lireEspaceMonCompte("pro", "/mon-compte"), "pro");
  assert.equal(lireEspaceMonCompte("pro", "/mon-compte.data"), "pro");
  assert.equal(lireEspaceMonCompte("ambassadeur", "/espace/mon-compte"), "ambassadeur");
  assert.equal(lireEspaceMonCompte("ambassadeur", "/espace/mon-compte.data"), "ambassadeur");
});

test("routes.ts : /mon-compte a une seule route, la page partagée, dans le cadre qui suit l'hôte", () => {
  const trouve = matchRoutes(arbre, "/mon-compte") as { route: { file?: string; id?: string } }[] | null;
  const fichiers = trouve?.map((correspondance) => correspondance.route.file).filter(Boolean);
  assert.deepEqual(fichiers, ["routes/compte/mise-en-page-mon-compte.tsx", "routes/compte/mon-compte.tsx"]);
  const espace = matchRoutes(arbre, "/espace/mon-compte")?.map((correspondance) => (correspondance.route as { file?: string }).file).filter(Boolean);
  assert.deepEqual(espace, ["routes/ambassadeur/mise-en-page-ambassadeur.tsx", "routes/compte/mon-compte.tsx"]);
  // Les id restent uniques, même avec le même fichier deux fois
  const ids: string[] = [];
  const parcourir = (liste: { id?: string; file: string; children?: unknown[] }[]) => {
    for (const route of liste) {
      ids.push(route.id ?? route.file);
      if (route.children) parcourir(route.children as typeof liste);
    }
  };
  parcourir(routes as unknown as { id?: string; file: string; children?: unknown[] }[]);
  assert.equal(new Set(ids).size, ids.length);
});

test("textes : délai d'un mois (RGPD), droits en clair avec la CNIL, mail de suppression tout prêt, aide Apple ou Google", () => {
  assert.equal(DELAI_REPONSE, "dans un délai d'un mois au plus");
  assert.deepEqual(droitsRgpd.map((ligne: { droit: string }) => ligne.droit), ["Accès", "Rectification", "Effacement", "Opposition", "Réclamation"]);
  assert.match(droitsRgpd.at(-1)?.explication ?? "", /CNIL/);
  assert.match(RESTE_APRES_SUPPRESSION, /30 jours au plus/);
  assert.match(AIDE_APPLE_GOOGLE, /Mot de passe oublié/);
  const adresse = ecrireAdresseMail("bonjour@sosmiam.fr", mailSuppression);
  assert.ok(adresse.startsWith("mailto:bonjour@sosmiam.fr?subject=Supprimer%20mon%20compte%20SOS%20Miam&body="));
  assert.ok(!/[\s\n]/.test(adresse), "rien de non encodé dans l'adresse");
  assert.match(decodeURIComponent(adresse.split("body=")[1] ?? ""), /suppression de mon compte SOS Miam/);
});
