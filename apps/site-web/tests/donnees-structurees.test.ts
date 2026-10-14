// Données structurées (JSON-LD) : JSON valide et échappé (aucune injection possible depuis une fiche), WebSite et
// Organization de l'accueil, fiche d'un lieu (rien d'inventé) et fil d'Ariane. Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

// Les fonctions importent « ~/… » (alias de src/) : on l'apprend à Node pour ce test
const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { serialiserDonneesStructurees } = await import("../src/fonctions/seo/serialiser-donnees-structurees.ts");
const { creerDonneesSite } = await import("../src/fonctions/seo/creer-donnees-site.ts");
const { creerDonneesOrganisation } = await import("../src/fonctions/seo/creer-donnees-organisation.ts");
const { creerDonneesLieu } = await import("../src/fonctions/seo/creer-donnees-lieu.ts");
const { creerDonneesFilAriane } = await import("../src/fonctions/seo/creer-donnees-fil-ariane.ts");
const { liensPublics } = await import("../src/contenus/liens-publics.ts");

type FichePublique = import("../src/types/pro.ts").FichePublique;

/** Largeur et hauteur d'un PNG du dossier public/, lues dans son en-tête */
function lireTaillePng(chemin: string) {
  const octets = readFileSync(`${import.meta.dirname}/../public${chemin}`);
  assert.equal(octets.subarray(1, 4).toString("latin1"), "PNG", `${chemin} n'est pas un PNG`);
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
}

const ficheExemple: FichePublique = {
  id: 18,
  nom: "Le Capitaine </script><script>alert(1)</script> & Cie",
  adresse: "3 rue du Port",
  type: "resto",
  emoji: "🛟",
  info: "Bistrot",
  quartier: "Le Port",
  ville: "Montpellier",
  horaires: null,
  texte: "Ligne\u2028séparée",
  estVerifie: false,
  prix: "€€",
  couleurs: [],
  decouvertPar: null,
  telephone: null,
  siteWeb: "https://exemple.fr",
  instagram: "capitaine.bouiboui",
  animaux: null,
  accessible: null,
  terrasse: null,
  wifi: null,
  enfants: null,
  parking: null,
  paiements: [],
  reservation: null,
};

test("le JSON-LD est du JSON valide, sans « < », « > », « & » ni séparateur de ligne bruts", () => {
  const donnees = creerDonneesLieu(ficheExemple, "https://sosmiam.fr/lieux/18");
  const texte = serialiserDonneesStructurees(donnees);
  assert.doesNotMatch(texte, /[<>&\u2028\u2029]/);
  assert.ok(!texte.toLowerCase().includes("</script"));
  assert.deepEqual(JSON.parse(texte), donnees);
  assert.equal(serialiserDonneesStructurees({ a: "<b>&" }), '{"a":"\\u003cb\\u003e\\u0026"}');
  assert.deepEqual(JSON.parse(serialiserDonneesStructurees([{ x: 1 }, { y: "</SCRIPT>" }])), [{ x: 1 }, { y: "</SCRIPT>" }]);
});

test("accueil : WebSite « SOS Miam » avec ses autres noms, sans SearchAction", () => {
  const donnees = creerDonneesSite();
  assert.equal(donnees["@type"], "WebSite");
  assert.equal(donnees.name, "SOS Miam");
  assert.deepEqual(donnees.alternateName, ["SOS Miam app", "sosmiam"]);
  assert.equal(donnees.url, "https://sosmiam.fr/");
  assert.ok(!("potentialAction" in donnees));
});

test("accueil : Organization avec un logo PNG carré d'au moins 512 px servi par le site, et nos vrais réseaux", () => {
  const donnees = creerDonneesOrganisation();
  assert.equal(donnees["@type"], "Organization");
  assert.equal(donnees.name, "SOS Miam");
  assert.match(donnees.logo.url, /^https:\/\/sosmiam\.fr\/.+\.png$/);
  const { largeur, hauteur } = lireTaillePng(new URL(donnees.logo.url).pathname);
  assert.equal(largeur, hauteur);
  assert.ok(largeur >= 512);
  assert.deepEqual([donnees.logo.width, donnees.logo.height], [largeur, hauteur]);
  // Chaque profil vient de contenus/liens-publics.ts (aucun inventé) ; TikTok et Instagram y sont
  const adresses = liensPublics.map((lien) => lien.adresse);
  assert.ok(donnees.sameAs.length >= 2);
  for (const profil of donnees.sameAs) assert.ok(adresses.includes(profil), profil);
});

test("l'image de partage (og:image) existe en 1200 × 630, et l'icône PNG du site fait un multiple de 48 px", () => {
  assert.deepEqual(lireTaillePng("/images/partage-reseaux.png"), { largeur: 1200, hauteur: 630 });
  const icone = lireTaillePng("/icones/favicon-192.png");
  assert.equal(icone.largeur, icone.hauteur);
  assert.equal(icone.largeur % 48, 0);
});

test("fiche d'un lieu : le bon type schema.org, l'adresse, et rien d'inventé", () => {
  const types = { resto: "Restaurant", bar: "BarOrPub", patisserie: "Bakery", sortie: "LocalBusiness" } as const;
  for (const [type, attendu] of Object.entries(types)) {
    assert.equal(creerDonneesLieu({ ...ficheExemple, type: type as FichePublique["type"] }, "https://sosmiam.fr/lieux/18")["@type"], attendu);
  }
  const donnees = creerDonneesLieu(ficheExemple, "https://sosmiam.fr/lieux/18") as Record<string, unknown>;
  assert.equal(donnees.url, "https://sosmiam.fr/lieux/18");
  assert.deepEqual(donnees.address, { "@type": "PostalAddress", streetAddress: "3 rue du Port", addressLocality: "Montpellier", addressCountry: "FR" });
  assert.equal(donnees.priceRange, "€€");
  assert.deepEqual(donnees.sameAs, ["https://exemple.fr", "https://www.instagram.com/capitaine.bouiboui/"]);
  for (const cle of ["aggregateRating", "review", "geo", "image", "telephone", "openingHours"]) assert.ok(!(cle in donnees), cle);

  // Sans adresse, sans prix lisible, sans liens : ces champs disparaissent
  const vide = creerDonneesLieu({ ...ficheExemple, adresse: null, prix: "pas cher", siteWeb: null, instagram: null, texte: null }, "https://sosmiam.fr/lieux/18") as Record<string, unknown>;
  assert.deepEqual(vide.address, { "@type": "PostalAddress", addressLocality: "Montpellier", addressCountry: "FR" });
  for (const cle of ["priceRange", "sameAs", "description"]) assert.ok(!(cle in vide), cle);
});

test("fil d'Ariane : Accueil › lieu, positions à partir de 1", () => {
  const donnees = creerDonneesFilAriane([{ nom: "Accueil", adresse: "https://sosmiam.fr/" }, { nom: "Le lieu", adresse: "https://sosmiam.fr/lieux/18" }]);
  assert.equal(donnees["@type"], "BreadcrumbList");
  assert.deepEqual(donnees.itemListElement.map((etape) => [etape.position, etape.item]), [[1, "https://sosmiam.fr/"], [2, "https://sosmiam.fr/lieux/18"]]);
});
