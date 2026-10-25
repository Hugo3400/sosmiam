// Indexation : adresse canonique sur chaque page publique, « noindex » sur chaque page privée, robots.txt et titres.
// Les pages sont des .tsx (Node ne les lance pas) : on suit les routes de routes.ts et on lit leur source.
// Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { matchRoutes, type RouteObject } from "react-router";

const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { default: routes } = await import("../src/routes.ts");
const { pagesIndexees } = await import("../src/contenus/plan-du-site.ts");
const { creerAdresseCanonique } = await import("../src/fonctions/seo/creer-adresse-canonique.ts");
const { creerMeta } = await import("../src/fonctions/seo/creer-meta.ts");
const { loader: robots } = await import("../src/routes/ressources/robots.ts");

const arbre = [{ path: "", children: routes }] as unknown as RouteObject[];
const lire = (fichier: string) => readFileSync(`${import.meta.dirname}/../src/${fichier}`, "utf-8");

/** Les fichiers des routes qui servent ce chemin, du cadre à la page */
function fichiersDe(chemin: string): string[] {
  const trouve = matchRoutes(arbre, chemin) as { route: { file?: string } }[] | null;
  const fichiers = (trouve ?? []).map((correspondance) => correspondance.route.file).filter((fichier): fichier is string => Boolean(fichier));
  assert.ok(fichiers.length > 0, `aucune route pour ${chemin}`);
  return fichiers;
}

// Les cadres qui posent la balise canonique (composants/mise-en-page/LienCanonique.tsx)
const CADRES_AVEC_CANONIQUE = ["composants/mise-en-page/CadrePublic.tsx", "composants/ambassadeur/CadreAmbassadeur.tsx", "composants/pro/CadrePro.tsx"];

test("les cadres des pages publiques posent la balise canonique", () => {
  for (const cadre of CADRES_AVEC_CANONIQUE) assert.match(lire(cadre), /<LienCanonique\b/, cadre);
});

test("chaque page publique a une adresse canonique, et la page elle-même ne se met pas en noindex", () => {
  const publiques = [...pagesIndexees, "/lieux/2810", "/carriere/moderation-brigade", "/liens", "/programme", "/bienvenue"];
  for (const chemin of publiques) {
    const fichiers = fichiersDe(chemin);
    const sources = fichiers.map(lire);
    const avecCanonique = sources.some((source) => /<LienCanonique\b|<Cadre(Public|Ambassadeur|Pro)\b/.test(source));
    assert.ok(avecCanonique, `${chemin} (${fichiers.join(", ")}) sans adresse canonique`);
    // La fiche d'un lieu ne met « noindex » que quand elle est introuvable (404) : la condition est vérifiée à part
    if (chemin === "/lieux" || chemin.startsWith("/lieux/") || chemin.startsWith("/carriere/")) continue;
    for (const [rang, source] of sources.entries()) assert.doesNotMatch(source, /noindex/, `${chemin} : ${fichiers[rang]}`);
  }
  assert.match(lire("routes/public/fiche-lieu.tsx"), /if \(!loaderData\) return \[[^\n]*noindex/);
  assert.match(lire("routes/public/offre-carriere.tsx"), /if \(!loaderData\) return \[[^\n]*noindex/);
  assert.match(lire("routes/public/lieux.tsx"), /const sansIndex = filtres\.recherche !== null[^\n]*\n\s*return sansIndex \? \[[^\n]*noindex/);
});

test("adresse canonique : absolue, sans paramètres ni « / » final", () => {
  assert.equal(creerAdresseCanonique("https://sosmiam.fr", "/"), "https://sosmiam.fr/");
  assert.equal(creerAdresseCanonique("https://sosmiam.fr", ""), "https://sosmiam.fr/");
  assert.equal(creerAdresseCanonique("https://sosmiam.fr/", "/faq/"), "https://sosmiam.fr/faq");
  assert.equal(creerAdresseCanonique("https://sosmiam.fr", "/faq?utm_source=tiktok#ancre"), "https://sosmiam.fr/faq");
  assert.equal(creerAdresseCanonique("https://ambassadeur.sosmiam.fr", "/programme"), "https://ambassadeur.sosmiam.fr/programme");
});

test("chaque page privée est en noindex (mon compte, espaces, désinscription, fin d'inscription…)", () => {
  const privees = [
    "/mon-compte", "/desinscription", "/confirmer-newsletter", "/connexion/finir-inscription", "/deconnexion", "/l/ABC123",
    "/connexion", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/verifier-email",
    "/espace", "/espace/mon-compte", "/espace/kit-media", "/espace/kit-media-pro", "/espace/proposer-un-lieu", "/espace/fondateur",
    "/espace/certification", "/espace/missions", "/espace/messages",
    "/tableau", "/rattacher", "/rattacher/12", "/lieu/12", "/lieu/12/carte", "/lieu/12/suggestions", "/lieu/12/equipe",
    "/lieu/12/affichette", "/lieu/12/miam-safe", "/lieu/12/images", "/invitation/lea.croque", "/preview", "/preview/communaute",
  ];
  for (const chemin of privees) {
    const fichiers = fichiersDe(chemin);
    assert.ok(fichiers.some((fichier) => /noindex/.test(lire(fichier))), `${chemin} (${fichiers.at(-1)}) sans noindex`);
  }
  // En plus de la balise, l'en-tête HTTP pour les pages aux liens personnels
  assert.match(lire("routes/public/desinscription.tsx"), /"X-Robots-Tag": "noindex"/);
  assert.match(lire("routes/public/confirmer-newsletter.tsx"), /"X-Robots-Tag": "noindex"/);
  assert.match(lire("routes/public/invitation.tsx"), /"X-Robots-Tag": "noindex"/);
  assert.match(lire("routes/compte/mise-en-page-mon-compte.tsx"), /"X-Robots-Tag", "noindex"/);
});

test("robots.txt : le plan du site est déclaré en adresse absolue sur chaque hôte ; l'aperçu reste fermé", async () => {
  const lireRobots = async (hote: string) => (await robots({ request: new Request(`https://${hote}/robots.txt`) } as never)).text();
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) {
    const texte = await lireRobots(hote);
    assert.match(texte, new RegExp(`^Sitemap: https://${hote.replace(/\./g, "\\.")}/sitemap\\.xml$`, "m"), hote);
  }
  assert.match(await lireRobots("sosmiam.fr"), /^Allow: \/$/m);
  assert.match(await lireRobots("sosmiam.fr"), /^Disallow: \/confirmer-newsletter$/m);
  assert.equal(await lireRobots("apercu.sosmiam.fr"), "User-agent: *\nDisallow: /\n");
});

test("titres : la marque une seule fois, l'accueil dit ce qu'est SOS Miam en 60 caractères au plus", () => {
  assert.equal(creerMeta({ titre: "Questions fréquentes", description: "x" })[0].title, "Questions fréquentes — SOS Miam");
  const accueil = lire("routes/public/accueil.tsx").match(/titre: "(SOS Miam[^"]*)"/)?.[1];
  assert.ok(accueil && accueil.length <= 60 && accueil !== "SOS Miam", accueil);
  assert.equal(creerMeta({ titre: accueil, description: "x" })[0].title, accueil);
});
