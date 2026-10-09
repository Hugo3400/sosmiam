// Tests du partage des adresses entre sosmiam.fr, ambassadeur.sosmiam.fr et pro.sosmiam.fr : node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { choisirRedirectionHote } from "../src/fonctions/hotes/choisir-redirection-hote.ts";

const AMBASSADEUR = "ambassadeur.sosmiam.fr";
const PRO = "pro.sosmiam.fr";

test("ambassadeur.sosmiam.fr : l'accueil mène au programme, avec ses paramètres", () => {
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/"), { adresse: "/programme", statut: 302 });
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/?utm_campaign=tiktok"), { adresse: "/programme?utm_campaign=tiktok", statut: 302 });
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, ""), { adresse: "/programme", statut: 302 });
  // Données de navigation de React Router pour « / » (« /_.data » aujourd'hui, « /_root.data » avant)
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/_.data?_routes=root"), { adresse: "/programme", statut: 302 });
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/_root.data"), { adresse: "/programme", statut: 302 });
  // Formulaire envoyé à l'accueil (« ?index ») : le paramètre technique n'est pas recopié
  assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, "/?index"), { adresse: "/programme", statut: 302 });
});

test("ambassadeur.sosmiam.fr : les pages de l'espace, leurs données et les fichiers des moteurs sont servis", () => {
  const servis = [
    "/programme", "/programme/", "/Programme", "/programme.data", "/inscription", "/connexion", "/connexion?retour=%2Fespace%2Fkit-media",
    "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/espace", "/espace/", "/espace.data?_routes=root", "/espace/mon-compte",
    "/espace/kit-media", "/espace/proposer-un-lieu.data", "/espace/fondateur", "/espace/missions", "/espace/messages",
    "/deconnexion", "/deconnexion.data", "/kit-media/logo-fond-clair.svg", "/kit-media/kit-media-sos-miam.zip?apercu=1",
    "/robots.txt", "/sitemap.xml",
    // Confirmation de l'e-mail, suggestions de « Ta ville » et carte de fondateur
    "/verifier-email", "/communes?recherche=lyon", "/programme?ville=Lyon", "/espace/fondateur/carte.svg?titre=fondatrice",
    // Ambassadeur certifié et son kit média pro
    "/espace/certification", "/espace/certification.data", "/espace/kit-media-pro", "/kit-media-pro/affiche-a4.pdf?apercu=1",
  ];
  for (const chemin of servis) assert.equal(choisirRedirectionHote(AMBASSADEUR, chemin), null, chemin);
});

test("ambassadeur.sosmiam.fr : tout le reste part sur sosmiam.fr (301), avec ses paramètres", () => {
  const attendus: [string, string][] = [
    ["/faq", "https://sosmiam.fr/faq"],
    ["/cgu?x=1&utm_campaign=ambassadeurs", "https://sosmiam.fr/cgu?x=1&utm_campaign=ambassadeurs"],
    ["/faq.data?_routes=root%2Croutes%2Fpublic%2Ffaq", "https://sosmiam.fr/faq"],
    ["/inscrire-mon-lieu", "https://sosmiam.fr/inscrire-mon-lieu"],
    ["/inscrire-mon-lieu?index&utm_source=x", "https://sosmiam.fr/inscrire-mon-lieu?utm_source=x"],
    // Des chemins qui ressemblent à l'espace sans en être
    ["/espacement", "https://sosmiam.fr/espacement"],
    ["/programmes", "https://sosmiam.fr/programmes"],
    ["/kit-media", "https://sosmiam.fr/kit-media"],
    ["/liens/aller/tiktok", "https://sosmiam.fr/liens/aller/tiktok"],
    // Un chemin qui commence par « // » reste un chemin de sosmiam.fr
    ["//exemple.fr/piege", "https://sosmiam.fr//exemple.fr/piege"],
  ];
  for (const [chemin, adresse] of attendus) {
    assert.deepEqual(choisirRedirectionHote(AMBASSADEUR, chemin), { adresse, statut: 301 }, chemin);
  }
});

test("sosmiam.fr : les pages de l'espace partent sur ambassadeur.sosmiam.fr (301)", () => {
  const attendus: [string, string][] = [
    ["/programme", "https://ambassadeur.sosmiam.fr/programme"],
    ["/connexion?retour=%2Fespace", "https://ambassadeur.sosmiam.fr/connexion?retour=%2Fespace"],
    ["/espace/kit-media", "https://ambassadeur.sosmiam.fr/espace/kit-media"],
    ["/espace/missions.data?_routes=x", "https://ambassadeur.sosmiam.fr/espace/missions"],
    ["/nouveau-mot-de-passe", "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe"],
    ["/verifier-email", "https://ambassadeur.sosmiam.fr/verifier-email"],
    ["/kit-media/logo-fond-clair.png", "https://ambassadeur.sosmiam.fr/kit-media/logo-fond-clair.png"],
    ["/kit-media-pro/flyer-a6.pdf", "https://ambassadeur.sosmiam.fr/kit-media-pro/flyer-a6.pdf"],
    ["/espace/certification", "https://ambassadeur.sosmiam.fr/espace/certification"],
    ["/deconnexion", "https://ambassadeur.sosmiam.fr/deconnexion"],
    ["/esp%61ce", "https://ambassadeur.sosmiam.fr/esp%61ce"],
  ];
  for (const [chemin, adresse] of attendus) {
    assert.deepEqual(choisirRedirectionHote("sosmiam.fr", chemin), { adresse, statut: 301 }, chemin);
  }
});

test("sosmiam.fr : le reste du site et les fichiers des moteurs restent sur place", () => {
  for (const chemin of ["/", "/_.data", "/faq", "/cgu", "/inscrire-mon-lieu", "/liens", "/robots.txt", "/sitemap.xml", "/espacement", "/%E0%A4%A"]) {
    assert.equal(choisirRedirectionHote("sosmiam.fr", chemin), null, chemin);
  }
});

test("l'hôte est lu sans majuscules, sans port et sans point final", () => {
  assert.deepEqual(choisirRedirectionHote("SOSMIAM.FR", "/connexion"), { adresse: "https://ambassadeur.sosmiam.fr/connexion", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr:443", "/faq"), { adresse: "https://sosmiam.fr/faq", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr.", "/"), { adresse: "/programme", statut: 302 });
});

test("les autres hôtes (essais, aperçu) ne sont jamais renvoyés ailleurs", () => {
  for (const hote of ["127.0.0.1", "localhost", "pro.localhost", "apercu.sosmiam.fr", "www.exemple.fr", ""]) {
    for (const chemin of ["/", "/faq", "/connexion", "/espace/mon-compte", "/kit-media/logo.svg", "/tableau", "/lieu/12"]) {
      assert.equal(choisirRedirectionHote(hote, chemin), null, `${hote}${chemin}`);
    }
  }
});

test("pro.sosmiam.fr : l'accueil mène à /bienvenue, avec ses paramètres", () => {
  assert.deepEqual(choisirRedirectionHote(PRO, "/"), { adresse: "/bienvenue", statut: 302 });
  assert.deepEqual(choisirRedirectionHote(PRO, "/?utm_source=affiche"), { adresse: "/bienvenue?utm_source=affiche", statut: 302 });
  assert.deepEqual(choisirRedirectionHote(PRO, "/_.data?_routes=root"), { adresse: "/bienvenue", statut: 302 });
  assert.deepEqual(choisirRedirectionHote("PRO.sosmiam.fr.", "/"), { adresse: "/bienvenue", statut: 302 });
});

test("pro.sosmiam.fr : l'espace pro, les pages du compte et les fichiers des moteurs sont servis", () => {
  const servis = [
    "/bienvenue", "/bienvenue/", "/tableau", "/tableau.data", "/rattacher", "/rattacher?texte=chez%20jo", "/recherche-lieux?texte=jo",
    "/lieu/12", "/lieu/12.data", "/lieu/12/suggestions", "/lieu/12/equipe", "/lieu/12/affichette",
    "/connexion", "/connexion?retour=%2Flieu%2F12", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/verifier-email",
    "/deconnexion", "/robots.txt", "/sitemap.xml",
  ];
  for (const chemin of servis) assert.equal(choisirRedirectionHote(PRO, chemin), null, chemin);
});

test("pro.sosmiam.fr : l'espace ambassadeur part chez lui, tout le reste sur sosmiam.fr (301)", () => {
  const attendus: [string, string][] = [
    ["/programme", "https://ambassadeur.sosmiam.fr/programme"],
    ["/espace", "https://ambassadeur.sosmiam.fr/espace"],
    ["/espace/mon-compte", "https://ambassadeur.sosmiam.fr/espace/mon-compte"],
    ["/kit-media/logo.svg", "https://ambassadeur.sosmiam.fr/kit-media/logo.svg"],
    ["/faq", "https://sosmiam.fr/faq"],
    ["/inscrire-mon-lieu?utm_source=pro", "https://sosmiam.fr/inscrire-mon-lieu?utm_source=pro"],
    ["/lieux/12", "https://sosmiam.fr/lieux/12"],
    ["/lieu", "https://sosmiam.fr/lieu"],
    ["/tableaux", "https://sosmiam.fr/tableaux"],
  ];
  for (const [chemin, adresse] of attendus) assert.deepEqual(choisirRedirectionHote(PRO, chemin), { adresse, statut: 301 }, chemin);
});

test("sosmiam.fr et ambassadeur.sosmiam.fr : l'espace pro part sur pro.sosmiam.fr (301)", () => {
  for (const hote of ["sosmiam.fr", AMBASSADEUR]) {
    const attendus: [string, string][] = [
      ["/bienvenue", "https://pro.sosmiam.fr/bienvenue"],
      ["/tableau.data?_routes=x", "https://pro.sosmiam.fr/tableau"],
      ["/rattacher?texte=jo", "https://pro.sosmiam.fr/rattacher?texte=jo"],
      ["/lieu/12/affichette", "https://pro.sosmiam.fr/lieu/12/affichette"],
    ];
    for (const [chemin, adresse] of attendus) assert.deepEqual(choisirRedirectionHote(hote, chemin), { adresse, statut: 301 }, `${hote}${chemin}`);
  }
  // La fiche publique d'un lieu reste sur sosmiam.fr ; les pages du compte, elles, restent celles de l'espace ambassadeur
  assert.equal(choisirRedirectionHote("sosmiam.fr", "/lieux/12"), null);
  assert.deepEqual(choisirRedirectionHote("sosmiam.fr", "/connexion"), { adresse: "https://ambassadeur.sosmiam.fr/connexion", statut: 301 });
});
