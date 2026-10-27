import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { LANGUES } from "../../../packages/commun/src/regles/langues.ts";

const dossierSrc = `${import.meta.dirname}/../src/`;
const racine = pathToFileURL(dossierSrc).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (!specificateur.startsWith("~/")) return suivant(specificateur, contexte);
    const chemin = specificateur.slice(2);
    return suivant(`${racine}${chemin}${existsSync(`${dossierSrc}${chemin}.tsx`) ? ".tsx" : ".ts"}`, contexte);
  },
});

const { lireLangueChemin } = await import("../src/fonctions/langue/lire-langue-chemin.ts");
const { listerLanguesServies } = await import("../src/fonctions/langue/lister-langues-servies.ts");
const { estPageDoublee } = await import("../src/fonctions/langue/est-page-doublee.ts");
const { choisirLanguePage } = await import("../src/fonctions/langue/choisir-langue-page.ts");
const { ecrireCheminLangue } = await import("../src/fonctions/langue/ecrire-chemin-langue.ts");
const { lireCookieLangue } = await import("../src/fonctions/langue/lire-cookie-langue.ts");
const { ecrireCookieLangue } = await import("../src/fonctions/langue/ecrire-cookie-langue.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
const { default: routes } = await import("../src/routes.ts");

const demande = (adresse: string, cookie: string | null = null, acceptLanguage: string | null = null) => ({ adresse: new URL(adresse), cookie, acceptLanguage });

test("lireLangueChemin : /en et ses pages, données comprises, et rien d'autre", () => {
  assert.deepEqual(lireLangueChemin("/en"), { langue: "en", chemin: "/" });
  assert.deepEqual(lireLangueChemin("/en.data"), { langue: "en", chemin: "/" });
  assert.deepEqual(lireLangueChemin("/en/faq"), { langue: "en", chemin: "/faq" });
  assert.deepEqual(lireLangueChemin("/en/faq.data"), { langue: "en", chemin: "/faq.data" });
  for (const chemin of ["/", "/faq", "/english", "/enfants", "/lieux/en"]) assert.deepEqual(lireLangueChemin(chemin), { langue: null, chemin });
});

test("listerLanguesServies : le français seul sur le vrai site tant que l'anglais n'est pas ouvert, tout sur l'aperçu", () => {
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr", "SOSMIAM.FR."]) assert.deepEqual(listerLanguesServies(hote, ["fr"]), ["fr"]);
  for (const hote of ["apercu.sosmiam.fr", "localhost:5190", "127.0.0.1:5191", "pro.localhost"]) assert.deepEqual(listerLanguesServies(hote, ["fr"]), LANGUES);
  assert.deepEqual(listerLanguesServies("sosmiam.fr", ["fr", "en"]), ["fr", "en"]);
});

test("estPageDoublee : les pages pour les moteurs de recherche, jamais les fiches, les espaces ni les comptes", () => {
  for (const chemin of ["/", "/faq", "/faq/", "/faq.data", "/carriere/developpeur", "/cgu#moderation", "/lieux?ville=Lyon", "/programme", "/bienvenue"]) assert.ok(estPageDoublee(chemin), chemin);
  for (const chemin of ["/lieux/12", "/lieux/12/carte", "/mon-compte", "/espace", "/connexion", "/l/abc", "/desinscription", "/carriere/a/b"]) assert.ok(!estPageDoublee(chemin), chemin);
});

test("choisirLanguePage : l'adresse décide pour /en, le français pour les pages doublées, la personne pour les autres", () => {
  const deux = ["fr", "en"] as const;
  assert.deepEqual(choisirLanguePage(demande("https://sosmiam.fr/en/faq"), ["fr"]), { langue: "en", servie: false, negociee: false });
  assert.deepEqual(choisirLanguePage(demande("https://apercu.sosmiam.fr/en/faq"), deux), { langue: "en", servie: true, negociee: false });
  assert.deepEqual(choisirLanguePage(demande("https://apercu.sosmiam.fr/faq", "sosmiam-langue=en", "en-GB"), deux), { langue: "fr", servie: true, negociee: false });
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3?langue=en"), deux).langue, "en");
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3?langue=fr", "sosmiam-langue=en", "en"), deux).langue, "fr");
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3", "a=1; sosmiam-langue=en"), deux).langue, "en");
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3", null, "es, en;q=0.8"), deux).langue, "en");
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3", "sosmiam-langue=de", "de"), deux).langue, "fr");
  assert.equal(choisirLanguePage(demande("https://apercu.sosmiam.fr/lieux/3"), deux).negociee, true);
  assert.deepEqual(choisirLanguePage(demande("https://sosmiam.fr/lieux/3?langue=en", "sosmiam-langue=en", "en"), ["fr"]), { langue: "fr", servie: true, negociee: false });
});

test("ecrireCheminLangue : /en devant les pages doublées seulement", () => {
  assert.equal(ecrireCheminLangue("/", "en"), "/en");
  assert.equal(ecrireCheminLangue("/#comment", "en"), "/en#comment");
  assert.equal(ecrireCheminLangue("/faq", "en"), "/en/faq");
  assert.equal(ecrireCheminLangue("/cgu#moderation", "en"), "/en/cgu#moderation");
  assert.equal(ecrireCheminLangue("/lieux/12", "en"), "/lieux/12");
  assert.equal(ecrireCheminLangue("/en/faq", "fr"), "/faq");
  assert.equal(ecrireCheminLangue("/en", "fr"), "/");
  assert.equal(ecrireCheminLangue("https://exemple.fr/faq", "en"), "https://exemple.fr/faq");
  assert.equal(ecrireCheminLangue("//exemple.fr/faq", "en"), "//exemple.fr/faq");
  assert.equal(ecrireCheminLangue("#inscription", "en"), "#inscription");
});

test("cookie sosmiam-langue : lu sans se tromper de nom, posé pour les trois hôtes en vrai et pour l'hôte seul ailleurs", () => {
  assert.equal(lireCookieLangue("sosmiam-langue=en"), "en");
  assert.equal(lireCookieLangue("x=1; sosmiam-langue=fr; y=2"), "fr");
  assert.equal(lireCookieLangue("autre-sosmiam-langue=en"), null);
  assert.equal(lireCookieLangue("sosmiam-langue=de"), null);
  assert.equal(lireCookieLangue(null), null);
  assert.equal(ecrireCookieLangue("en", "sosmiam.fr"), "sosmiam-langue=en; Max-Age=31536000; Path=/; Domain=sosmiam.fr; SameSite=Lax; Secure");
  assert.equal(ecrireCookieLangue("fr", "pro.sosmiam.fr"), "sosmiam-langue=fr; Max-Age=31536000; Path=/; Domain=sosmiam.fr; SameSite=Lax; Secure");
  assert.equal(ecrireCookieLangue("en", "apercu.sosmiam.fr"), "sosmiam-langue=en; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
  assert.equal(ecrireCookieLangue("en", "localhost:5190"), "sosmiam-langue=en; Max-Age=31536000; Path=/; SameSite=Lax");
});

test("choisirRedirectionHote : /en suit sa page vers le bon hôte, et l'accueil des espaces garde sa langue", () => {
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/en/faq"), null);
  assert.deepEqual(choisirRedirectionHote("sosmiam.fr", "/en/programme"), { adresse: "https://ambassadeur.sosmiam.fr/en/programme", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("sosmiam.fr", "/en/bienvenue"), { adresse: "https://pro.sosmiam.fr/en/bienvenue", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/en"), { adresse: "/en/programme", statut: 302 });
  assert.deepEqual(choisirRedirectionHote("pro.sosmiam.fr", "/en"), { adresse: "/en/bienvenue", statut: 302 });
  assert.equal(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/en/programme"), null);
  assert.equal(choisirRedirectionHote("pro.sosmiam.fr", "/en/bienvenue"), null);
  assert.deepEqual(choisirRedirectionHote("pro.sosmiam.fr", "/en/faq"), { adresse: "https://sosmiam.fr/en/faq", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/"), { adresse: "/programme", statut: 302 });
  for (const hote of ["sosmiam.fr", "ambassadeur.sosmiam.fr", "pro.sosmiam.fr"]) assert.equal(choisirRedirectionHote(hote, "/langue/choix"), null, hote);
});

type RouteLue = { id?: string; path?: string; index?: boolean; children?: RouteLue[] };

function listerChemins(liste: RouteLue[], parent = ""): { id: string; chemin: string }[] {
  return liste.flatMap((r) => {
    const ici = r.path ? `${parent}/${r.path}`.replace(/\/+/g, "/") : parent;
    const lui = r.index || r.path ? [{ id: r.id ?? "", chemin: ici || "/" }] : [];
    return [...lui, ...listerChemins(r.children ?? [], ici)];
  });
}

test("routes : chaque page doublée a sa jumelle /en (id « en/… »), et /en ne sert rien d'autre", () => {
  const chemins = listerChemins(routes as RouteLue[]);
  const anglaises = chemins.filter(({ chemin }) => chemin === "/en" || chemin.startsWith("/en/"));
  assert.ok(anglaises.length > 10);
  for (const { id, chemin } of anglaises) {
    assert.ok(id.startsWith("en/"), `${chemin} : ${id}`);
    const francais = lireLangueChemin(chemin).chemin;
    if (francais !== "/*") assert.ok(estPageDoublee(francais.replace(":id", "x")), chemin);
  }
  for (const { chemin } of chemins.filter(({ chemin }) => !chemin.startsWith("/en") && estPageDoublee(chemin.replace(":id", "x")))) {
    assert.ok(anglaises.some((a) => a.chemin === (chemin === "/" ? "/en" : `/en${chemin}`)), `pas de jumelle pour ${chemin}`);
  }
  const derniere = (routes as RouteLue[]).at(-1);
  assert.equal(derniere?.path, "*");
});

const dossierAnglais = `${dossierSrc}contenus/anglais/`;

function comparer(francais: unknown, anglais: unknown, chemin: string, identiques: string[]) {
  if (typeof francais === "string") {
    assert.equal(typeof anglais, "string", chemin);
    assert.ok((anglais as string).trim() !== "", `${chemin} : vide`);
    if (anglais === francais && !/^[\s—·✓0-9+%-]*(SOS Miam)?[\s—·✓0-9+%-]*$/.test(francais)) identiques.push(`${chemin} : « ${francais} »`);
    return;
  }
  if (typeof francais === "function") return assert.equal(typeof anglais, "function", chemin);
  if (Array.isArray(francais)) {
    assert.ok(Array.isArray(anglais) && anglais.length === francais.length, `${chemin} : pas la même longueur`);
    francais.forEach((element, i) => comparer(element, (anglais as unknown[])[i], `${chemin}[${i}]`, identiques));
    return;
  }
  if (francais && typeof francais === "object") {
    assert.deepEqual(Object.keys(anglais as object).sort(), Object.keys(francais).sort(), chemin);
    for (const [cle, valeur] of Object.entries(francais)) comparer(valeur, (anglais as Record<string, unknown>)[cle], `${chemin}.${cle}`, identiques);
  }
}

test("contenus/anglais : chaque dictionnaire a son jumeau français, sa paire, aucun texte vide ni recopié du français", async () => {
  const fichiers = readdirSync(dossierAnglais).filter((nom) => nom.endsWith(".ts"));
  assert.ok(fichiers.length > 0);
  for (const fichier of fichiers) {
    const anglais = await import(`${dossierAnglais}${fichier}`);
    const francais = await import(`${dossierSrc}contenus/${fichier}`);
    for (const [nom, valeur] of Object.entries(anglais)) {
      if (!nom.endsWith("_ANGLAIS")) continue;
      const nomFrancais = nom.slice(0, -"_ANGLAIS".length);
      assert.ok(nomFrancais in francais, `${fichier} : ${nomFrancais} manque`);
      assert.equal(francais[`${nomFrancais}_PAR_LANGUE`]?.en, valeur, `${fichier} : ${nomFrancais}_PAR_LANGUE.en`);
      assert.equal(francais[`${nomFrancais}_PAR_LANGUE`]?.fr, francais[nomFrancais], `${fichier} : ${nomFrancais}_PAR_LANGUE.fr`);
      const identiques: string[] = [];
      comparer(francais[nomFrancais], valeur, `${fichier} ${nom}`, identiques);
      assert.deepEqual(identiques, [], "textes anglais identiques au français");
    }
  }
});
