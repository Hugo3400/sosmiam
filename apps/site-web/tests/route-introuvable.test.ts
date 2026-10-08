// Route « * » (la dernière de src/routes.ts) : toute adresse inconnue trouve une route, donc passe par les middlewares de
// root.tsx (partage des hôtes, statistiques) au lieu d'un 404 donné par React Router avant eux. node --test tests/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { matchRoutes, type RouteObject } from "react-router";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";
// @ts-ignore : même raison
import routes from "../src/routes.ts";

const INTROUVABLE = "routes/public/introuvable.tsx";
const AMBASSADEUR = "ambassadeur.sosmiam.fr";
const arbre = [{ path: "", children: routes }] as unknown as RouteObject[];

/** Le fichier de la route qui répond à `chemin` (la plus précise), comme React Router la choisit. */
function trouverFichier(chemin: string): string | undefined {
  const route = matchRoutes(arbre, chemin)?.at(-1)?.route as { file?: string } | undefined;
  return route?.file;
}

test("la route « * » est la dernière de routes.ts", () => {
  const derniere = routes.at(-1);
  assert.equal(derniere?.path, "*");
  assert.equal(derniere?.file, INTROUVABLE);
});

test("une adresse inconnue trouve la route « * », et le middleware de root.tsx la renvoie de ambassadeur.sosmiam.fr vers sosmiam.fr", () => {
  for (const chemin of ["/espacement", "/programmes", "/kit-media", "//exemple.fr/piege", "/villes/lyon", "/programme/extra", "/une-page-introuvable"]) {
    assert.equal(trouverFichier(chemin), INTROUVABLE, chemin);
    assert.equal(choisirRedirectionHote(AMBASSADEUR, chemin)?.statut, 301, chemin);
  }
});

test("une adresse inconnue de l'espace reste sur ambassadeur.sosmiam.fr : « Page introuvable » (404)", () => {
  assert.equal(trouverFichier("/espace/inconnu"), INTROUVABLE);
  assert.equal(choisirRedirectionHote(AMBASSADEUR, "/espace/inconnu"), null);
});

test("les adresses qui ont une page gardent leur route", () => {
  const attendus: [string, string][] = [
    ["/", "routes/public/accueil.tsx"],
    ["/faq", "routes/public/faq.tsx"],
    ["/programme", "routes/ambassadeur/programme.tsx"],
    ["/connexion", "routes/compte/connexion.tsx"],
    ["/espace", "routes/ambassadeur/espace.tsx"],
    ["/espace/mon-compte", "routes/compte/mon-compte.tsx"],
    ["/deconnexion", "routes/compte/deconnexion.tsx"],
    ["/kit-media/logo-fond-clair.svg", "routes/ressources/telecharger-kit.ts"],
    ["/robots.txt", "routes/ressources/robots.ts"],
    ["/sitemap.xml", "routes/ressources/plan-du-site.ts"],
  ];
  for (const [chemin, fichier] of attendus) assert.equal(trouverFichier(chemin), fichier, chemin);
});
