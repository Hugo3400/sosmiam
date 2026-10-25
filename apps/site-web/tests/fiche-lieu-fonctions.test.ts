import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { lireImageLieu } = await import("../src/fonctions/lieux/lire-image-lieu.ts");
const { lireLienExterne } = await import("../src/fonctions/lieux/lire-lien-externe.ts");
const { lireIdLieu } = await import("../src/fonctions/lieux/lire-id-lieu.ts");
const { choisirCouleursLieu } = await import("../src/fonctions/lieux/choisir-couleurs-lieu.ts");
const { choisirEmojiLieu } = await import("../src/fonctions/lieux/choisir-emoji-lieu.ts");
const { ecrireAdresseLieu } = await import("../src/fonctions/lieux/ecrire-adresse-lieu.ts");
const { creerLienItineraire } = await import("../src/fonctions/lieux/creer-lien-itineraire.ts");
const { creerLienTelephone } = await import("../src/fonctions/lieux/creer-lien-telephone.ts");
const { creerLienAppLieu } = await import("../src/fonctions/liens-app/creer-lien-app-lieu.ts");
const { formaterHeureCourte } = await import("../src/fonctions/dates/formater-heure-courte.ts");
const { nettoyerFichePublique } = await import("../src/fonctions/lieux/nettoyer-fiche-publique.ts");
const { listerRubriquesCarte } = await import("../src/fonctions/carte/lister-rubriques-carte.ts");
const { filtrerRubriquesCarte } = await import("../src/fonctions/carte/filtrer-rubriques-carte.ts");
const { listerSpecialitesCarte } = await import("../src/fonctions/carte/lister-specialites-carte.ts");
const { listerFiltresCarte } = await import("../src/fonctions/carte/lister-filtres-carte.ts");
const { creerDonneesLieu } = await import("../src/fonctions/seo/creer-donnees-lieu.ts");
const { estFicheIndexable } = await import("../src/fonctions/lieux/est-fiche-indexable.ts");

type FichePublique = import("../src/types/pro.ts").FichePublique;
type CarteLieu = import("../src/types/carte.ts").CarteLieu;

const IMAGE = "/app/lieux/images/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const LOGO = "/app/lieux/images/7c9e6679-7425-40de-944b-e07fc1f90ae7.png";

const CARTE: CarteLieu = {
  majLe: "2026-10-20",
  sections: [
    { titre: "Entrées", elements: [{ nom: "Soupe de poissons", description: "Rouille et croûtons", prix: 9, etiquettes: ["fait-maison"] }] },
    { titre: "Vide", elements: [] },
    { titre: "Plats", elements: [{ nom: "Risotto aux cèpes", prix: 18, etiquettes: ["vege"], signature: true }, { nom: "Moules marinières", prix: 16 }] },
    { titre: "Vins", elements: [{ nom: "Picpoul de Pinet", prix: 6, unite: "le verre", alcool: true }, { nom: "Jus de raisin", prix: 4 }] },
    { titre: "Plats", elements: [{ nom: "Plat du jour", prix: 14 }] },
  ],
};

const FICHE: FichePublique = {
  id: 18,
  nom: "Restaurant du Capitaine Bouiboui",
  adresse: "3 rue du Port",
  type: "resto",
  emoji: "🛟",
  info: "Bistrot de la mer",
  quartier: "Le Port",
  ville: "Montpellier",
  horaires: "Mar–sam, 12h–14h et 19h–23h",
  texte: "Le Capitaine régale la Brigade.",
  estVerifie: true,
  prix: "€€",
  couleurs: ["#FFB36B", "#E8590C"],
  decouvertPar: "Zoé",
  telephone: "+33 4 00 00 00 00",
  siteWeb: "https://capitaine.example",
  instagram: "capitaine.bouiboui",
  animaux: null,
  accessible: true,
  terrasse: false,
  wifi: null,
  enfants: null,
  parking: null,
  paiements: [],
  reservation: null,
  carte: CARTE,
  source: null,
};

test("lireImageLieu : seulement une image de lieu du serveur (« /app/lieux/images/<uuid>.jpg|png »)", () => {
  assert.equal(lireImageLieu(IMAGE), IMAGE);
  assert.equal(lireImageLieu(LOGO), LOGO);
  for (const mauvaise of [null, undefined, 42, "", "https://ailleurs.fr/a.jpg", "/app/lieux/images/../secret.jpg", `${IMAGE}?x=1`, IMAGE.replace(".jpg", ".svg"), `//${IMAGE}`]) {
    assert.equal(lireImageLieu(mauvaise), null, String(mauvaise));
  }
});

test("lireLienExterne : http(s) seulement, gardé tel qu'écrit", () => {
  assert.equal(lireLienExterne(" https://exemple.fr/resa "), "https://exemple.fr/resa");
  assert.equal(lireLienExterne("http://exemple.fr"), "http://exemple.fr");
  for (const mauvais of ["javascript:alert(1)", "data:text/html,x", "exemple.fr", "", null, 3]) assert.equal(lireLienExterne(mauvais), null, String(mauvais));
});

test("lireIdLieu : un entier positif de 9 chiffres au plus", () => {
  assert.equal(lireIdLieu("19"), 19);
  assert.equal(lireIdLieu("000123"), 123);
  for (const mauvais of [undefined, "", "0", "-3", "1.5", "12a", "1234567890"]) assert.equal(lireIdLieu(mauvais), null, String(mauvais));
});

test("couleurs et emoji : dégradé du lieu ou celui de SOS Miam ; jamais d'emoji d'alcool en avant", () => {
  assert.deepEqual(choisirCouleursLieu(["#F77F00", "#D62828"]), ["#F77F00", "#D62828"]);
  assert.deepEqual(choisirCouleursLieu(["#F77F00", "red"]), ["#FFD60A", "#FF4D3D"]);
  assert.deepEqual(choisirCouleursLieu([]), ["#FFD60A", "#FF4D3D"]);
  for (const alcool of ["🍷", "🍸", "🍺", "🍻", "🥂", "🍹", "🥃", "🍾"]) assert.equal(choisirEmojiLieu(alcool), "🎶", alcool);
  assert.equal(choisirEmojiLieu("🥘"), "🥘");
  assert.equal(choisirEmojiLieu("🧁"), "🧁");
});

test("adresse, itinéraire, téléphone et lien de l'app", () => {
  assert.equal(ecrireAdresseLieu({ adresse: "3 rue du Port", quartier: "Le Port", ville: "Montpellier" }), "3 rue du Port, Montpellier");
  assert.equal(ecrireAdresseLieu({ adresse: "29 rue Rousseau, 34000 Montpellier", quartier: "", ville: "Montpellier" }), "29 rue Rousseau, 34000 Montpellier");
  assert.equal(ecrireAdresseLieu({ adresse: null, quartier: "Gambetta", ville: "Montpellier" }), "Gambetta, Montpellier");
  assert.equal(ecrireAdresseLieu({ adresse: " ", quartier: "", ville: "Lattes" }), "Lattes");
  assert.equal(
    creerLienItineraire({ nom: "Esencia", adresse: "11 Rue du Cheval Vert", quartier: "Gambetta", ville: "Montpellier" }),
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("Esencia, 11 Rue du Cheval Vert, Montpellier")}`,
  );
  assert.ok(creerLienItineraire({ nom: "Le Joseph", adresse: null, quartier: "", ville: "Sète" }).endsWith(encodeURIComponent("Le Joseph, Sète")));
  assert.equal(creerLienTelephone("+33 4 99 61 09 17"), "tel:+33499610917");
  assert.equal(creerLienAppLieu(19), "sosmiam://lieux/19");
});

test("formaterHeureCourte : « 21:30 » → « 21h30 », « 20:00 » → « 20h », illisible → null", () => {
  assert.equal(formaterHeureCourte("21:30"), "21h30");
  assert.equal(formaterHeureCourte("20:00"), "20h");
  assert.equal(formaterHeureCourte("09:05"), "9h05");
  assert.equal(formaterHeureCourte("24:00"), "0h");
  assert.equal(formaterHeureCourte("demain"), null);
  assert.equal(formaterHeureCourte("25:00"), null);
});

test("nettoyerFichePublique : une API plus ancienne (sans les nouveaux champs) donne des blocs vides, jamais une erreur", () => {
  const propre = nettoyerFichePublique(FICHE);
  assert.equal(propre.banniere, null);
  assert.equal(propre.logo, null);
  assert.equal(propre.position, null);
  assert.equal(propre.sos, null);
  assert.deepEqual(propre.ouverture, []);
  assert.deepEqual(propre.etiquettes, []);
  assert.deepEqual(propre.autour, []);
  assert.equal(propre.lienReservation, null);
  assert.equal(propre.siteWeb, "https://capitaine.example");
  assert.equal(propre.instagram, "capitaine.bouiboui");
});

test("nettoyerFichePublique : garde les nouveaux champs bien formés et écarte le reste", () => {
  const voisin = { id: 20, nom: "Le Joseph", type: "bar", emoji: "🥘", info: "Bar à tapas", quartier: "", ville: "Montpellier", prix: "€", couleurs: ["#FFC861", "#FF8A00"], decouvertPar: null, logo: LOGO, verifie: true, sos: { places: 4 } };
  const brute = {
    ...FICHE,
    siteWeb: "javascript:alert(1)",
    instagram: "pas un compte !",
    banniere: IMAGE,
    logo: "https://ailleurs.fr/logo.png",
    position: { latitude: 43.61, longitude: 3.87 },
    sos: { places: 6, jusqua: "21:30", offre: "  Le dessert du Capitaine offert  " },
    ouverture: [{ jours: [2, 3, 9], de: "12:00", a: "14:00" }, { jours: [], de: "19:00", a: "23:00" }, { jours: [5], de: "7h", a: "12:00" }],
    etiquettes: ["Fait maison", " Fait maison ", "", "Terrasse", 4, "x".repeat(41)],
    autour: [voisin, { ...voisin, id: 18 }, { ...voisin, id: 0 }, { ...voisin, id: 21, sos: { places: 0 }, logo: "/autre.png" }, { ...voisin, id: 22 }, { ...voisin, id: 23 }, { ...voisin, id: 24 }],
    lienReservation: "https://resa.example/capitaine",
  } as unknown as FichePublique;
  const propre = nettoyerFichePublique(brute);
  assert.equal(propre.siteWeb, null);
  assert.equal(propre.instagram, null);
  assert.equal(propre.banniere, IMAGE);
  assert.equal(propre.logo, null);
  assert.deepEqual(propre.position, { latitude: 43.61, longitude: 3.87 });
  assert.deepEqual(propre.sos, { places: 6, jusqua: "21:30", offre: "Le dessert du Capitaine offert" });
  assert.deepEqual(propre.ouverture, [{ jours: [2, 3], de: "12:00", a: "14:00" }]);
  assert.deepEqual(propre.etiquettes, ["Fait maison", "Terrasse"]);
  assert.deepEqual(propre.autour?.map((lieu) => lieu.id), [20, 21, 22, 23]);
  assert.deepEqual(propre.autour?.[1]?.sos, null);
  assert.equal(propre.autour?.[1]?.logo, null);
  assert.equal(propre.autour?.[0]?.logo, LOGO);
  assert.equal(propre.lienReservation, "https://resa.example/capitaine");
  for (const position of [{ latitude: 91, longitude: 0 }, { latitude: "43", longitude: 3 }, { latitude: Number.NaN, longitude: 3 }]) {
    assert.equal(nettoyerFichePublique({ ...FICHE, position } as unknown as FichePublique).position, null);
  }
  for (const sos of [{ places: 0, jusqua: "21:30" }, { places: 2.5, jusqua: "21:30" }, { places: 3 }, "6 places"]) {
    assert.equal(nettoyerFichePublique({ ...FICHE, sos } as unknown as FichePublique).sos, null);
  }
});

test("listerRubriquesCarte : sections non vides, ancres uniques et repère d'alcool", () => {
  const rubriques = listerRubriquesCarte(CARTE);
  assert.deepEqual(rubriques.map((rubrique) => rubrique.id), ["carte-entrees", "carte-plats", "carte-vins", "carte-plats-2"]);
  assert.deepEqual(rubriques.map((rubrique) => rubrique.alcool), [false, false, true, false]);
  assert.deepEqual(listerRubriquesCarte({ sections: [{ titre: "🍕🍕", elements: [{ nom: "Margherita", prix: 9 }] }] }).map((r) => r.id), ["carte-rubrique-1"]);
  assert.deepEqual(listerRubriquesCarte(null), []);
});

test("filtrerRubriquesCarte : recherche sans accents, filtres par repère et « sans alcool »", () => {
  const rubriques = listerRubriquesCarte(CARTE);
  assert.equal(filtrerRubriquesCarte(rubriques, "", []), rubriques);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "CEPES", []).map((r) => r.elements.map((e) => e.nom)), [["Risotto aux cèpes"]]);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "verre", []).map((r) => [r.id, r.alcool]), [["carte-vins", true]]);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "vins", ["sans-alcool"]).map((r) => [r.id, r.alcool, r.elements.length]), [["carte-vins", false, 1]]);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "", ["vege"]).flatMap((r) => r.elements.map((e) => e.nom)), ["Risotto aux cèpes"]);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "", ["vege", "fait-maison"]), []);
  assert.deepEqual(filtrerRubriquesCarte(rubriques, "plat jour", []).flatMap((r) => r.elements.map((e) => e.nom)), ["Plat du jour"]);
});

test("spécialités et filtres proposés : seulement ce que la carte contient", () => {
  assert.deepEqual(listerSpecialitesCarte(CARTE, 4).map((element) => element.nom), ["Risotto aux cèpes"]);
  assert.deepEqual(listerSpecialitesCarte(null, 4), []);
  assert.deepEqual(listerFiltresCarte(listerRubriquesCarte(CARTE)), ["vege", "fait-maison", "sans-alcool"]);
  assert.deepEqual(listerFiltresCarte(listerRubriquesCarte({ sections: [{ titre: "Bières", elements: [{ nom: "Blonde", prix: 5, alcool: true }] }] })), []);
});

test("creerDonneesLieu : bannière, logo, position et carte en grand quand la fiche les a, rien sinon", () => {
  const sans = creerDonneesLieu({ ...FICHE, carte: null }, "https://sosmiam.fr/lieux/18") as Record<string, unknown>;
  for (const champ of ["image", "logo", "geo", "hasMenu"]) assert.equal(champ in sans, false, champ);
  const avec = creerDonneesLieu({ ...FICHE, banniere: IMAGE, logo: LOGO, position: { latitude: 43.61, longitude: 3.87 } }, "https://sosmiam.fr/lieux/18") as Record<string, unknown>;
  assert.equal(avec.image, `https://sosmiam.fr${IMAGE}`);
  assert.equal(avec.logo, `https://sosmiam.fr${LOGO}`);
  assert.deepEqual(avec.geo, { "@type": "GeoCoordinates", latitude: 43.61, longitude: 3.87 });
  assert.equal(avec.hasMenu, "https://sosmiam.fr/lieux/18/carte");
  assert.equal("hasMenu" in (creerDonneesLieu({ ...FICHE, type: "sortie" }, "https://sosmiam.fr/lieux/18") as Record<string, unknown>), false);
});

test("estFicheIndexable : la même règle pour la fiche et sa carte en grand", () => {
  const OFFICE = { nom: "l'office de tourisme de Montpellier", site: "montpellier-tourisme.fr", adresse: "https://www.montpellier-tourisme.fr", licence: null };
  assert.equal(estFicheIndexable({ id: 19, estVerifie: false, source: OFFICE }), false);
  assert.equal(estFicheIndexable({ id: 19, estVerifie: true, source: OFFICE }), true);
  assert.equal(estFicheIndexable({ id: 49, estVerifie: false, source: null }), true);
  assert.equal(estFicheIndexable({ id: 2810, estVerifie: true, source: null }), false);
});
