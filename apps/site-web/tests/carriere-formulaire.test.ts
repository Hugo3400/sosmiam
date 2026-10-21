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

const { lireFormulaireCandidature } = await import("../src/fonctions/carriere/lire-formulaire-candidature.ts");
const { convertirCvEnBase64 } = await import("../src/fonctions/carriere/convertir-cv-en-base64.ts");
const { choisirTypeOffre } = await import("../src/fonctions/carriere/choisir-type-offre.ts");
const { champsCandidature, TAILLE_MAX_CV } = await import("../src/contenus/carriere.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
const { formaterDateAParis } = await import("../src/fonctions/dates/formater-date-a-paris.ts");

const PDF = "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n";
const MESSAGE = "Bonjour ! J'adore les petits restos de mon quartier et je modère déjà un serveur Discord.";

function remplir(champs: Record<string, string | File>): FormData {
  const formulaire = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) formulaire.append(cle, valeur);
  return formulaire;
}

const sansEspaces = (texte: string | undefined) => texte?.replace(/\u00a0/g, " ");

test("lireFormulaireCandidature : une candidature valable, le lien complété en https, le CV en base64 exact", async () => {
  const lecture = await lireFormulaireCandidature(remplir({
    nom: "  Léa   Martin ",
    email: "lea@exemple.fr",
    message: `${MESSAGE}\r\nÀ bientôt !`,
    lien: "monportfolio.fr/lea",
    majeur: "oui",
    cv: new File([PDF], "Mon CV.pdf", { type: "application/pdf" }),
    site_web: "",
  }));
  assert.ok(lecture.ok);
  assert.deepEqual(lecture.candidature, {
    nom: "Léa Martin",
    email: "lea@exemple.fr",
    message: `${MESSAGE}\nÀ bientôt !`,
    lien: "https://monportfolio.fr/lea",
    majeur: true,
    cv: { nomFichier: "Mon CV.pdf", base64: Buffer.from(PDF).toString("base64") },
  });
  assert.equal(Buffer.from(lecture.candidature.cv?.base64 ?? "", "base64").toString(), PDF);
  assert.equal(lecture.piege, "");
});

test("lireFormulaireCandidature : sans lien ni CV (fichier vide envoyé par le navigateur), les deux valent null ; le piège est rendu", async () => {
  const lecture = await lireFormulaireCandidature(remplir({
    nom: "Sam", email: "sam@exemple.fr", message: MESSAGE, lien: "  ", majeur: "oui",
    cv: new File([], "", { type: "application/octet-stream" }), site_web: "https://robot.example",
  }));
  assert.ok(lecture.ok);
  assert.equal(lecture.candidature.lien, null);
  assert.equal(lecture.candidature.cv, null);
  assert.equal(lecture.piege, "https://robot.example");
  const sansFichier = await lireFormulaireCandidature(remplir({ nom: "Sam", email: "sam@exemple.fr", message: MESSAGE, majeur: "oui" }));
  assert.ok(sansFichier.ok && sansFichier.candidature.cv === null);
});

test("lireFormulaireCandidature : chaque erreur sur son champ, les valeurs renvoyées pour remplir de nouveau le formulaire", async () => {
  const lecture = await lireFormulaireCandidature(remplir({
    nom: "L", email: "pas-un-mail", message: "Trop court", lien: "http://exemple.fr", site_web: "",
  }));
  assert.ok(!lecture.ok);
  assert.deepEqual(Object.keys(lecture.erreurs).sort(), ["email", "lien", "majeur", "message", "nom"]);
  assert.equal(sansEspaces(lecture.erreurs.majeur), champsCandidature.majeur.erreur);
  assert.equal(sansEspaces(lecture.erreurs.lien), champsCandidature.lien.erreur);
  assert.deepEqual(lecture.valeurs, { nom: "L", email: "pas-un-mail", message: "Trop court", lien: "http://exemple.fr", majeur: false });
  assert.equal(lecture.cvEnvoye, false);
});

test("lireFormulaireCandidature : longueurs de l'API (nom 2-80, message 20-3 000, lien 300) et adresses refusées", async () => {
  const base = { nom: "Sam", email: "sam@exemple.fr", message: MESSAGE, majeur: "oui" };
  const erreursDe = async (champs: Record<string, string>) => {
    const lecture = await lireFormulaireCandidature(remplir({ ...base, ...champs }));
    return lecture.ok ? [] : Object.keys(lecture.erreurs);
  };
  assert.deepEqual(await erreursDe({ nom: "x".repeat(80), message: "m".repeat(3000), lien: `https://exemple.fr/${"a".repeat(281)}` }), []);
  assert.deepEqual(await erreursDe({ nom: "x".repeat(81) }), ["nom"]);
  assert.deepEqual(await erreursDe({ message: "m".repeat(3001) }), ["message"]);
  assert.deepEqual(await erreursDe({ message: "m".repeat(19) }), ["message"]);
  assert.deepEqual(await erreursDe({ lien: `https://exemple.fr/${"a".repeat(282)}` }), ["lien"]);
  for (const lien of ["javascript:alert(1)", "ftp://exemple.fr", "https://localhost", "https://exemple .fr"]) {
    assert.deepEqual(await erreursDe({ lien }), ["lien"], lien);
  }
  assert.deepEqual(await erreursDe({ majeur: "non" }), ["majeur"]);
});

test("CV refusé côté serveur du site : pas un PDF (même nommé .pdf), ou plus de 5 Mo ; 5 Mo tout juste passe", async () => {
  const base = { nom: "Sam", email: "sam@exemple.fr", message: MESSAGE, majeur: "oui" };
  const avecCv = (fichier: File) => lireFormulaireCandidature(remplir({ ...base, cv: fichier }));

  const image = await avecCv(new File(["GIF89a......"], "cv.pdf", { type: "application/pdf" }));
  assert.ok(!image.ok);
  assert.equal(sansEspaces(image.erreurs.cv), champsCandidature.cv.erreurFormat);
  assert.equal(image.cvEnvoye, true);

  const texte = await avecCv(new File(["Mon CV en texte"], "cv.txt", { type: "text/plain" }));
  assert.ok(!texte.ok && sansEspaces(texte.erreurs.cv) === champsCandidature.cv.erreurFormat);

  const enTete = new TextEncoder().encode("%PDF-");
  const lourd = new Uint8Array(TAILLE_MAX_CV + 1);
  lourd.set(enTete);
  const tropLourd = await avecCv(new File([lourd], "cv.pdf", { type: "application/pdf" }));
  assert.ok(!tropLourd.ok);
  assert.equal(sansEspaces(tropLourd.erreurs.cv), champsCandidature.cv.erreurPoids);

  const juste = await avecCv(new File([lourd.subarray(0, TAILLE_MAX_CV)], "cv.pdf", { type: "application/pdf" }));
  assert.ok(juste.ok);
  assert.equal(Buffer.from(juste.candidature.cv?.base64 ?? "", "base64").length, TAILLE_MAX_CV);
});

test("convertirCvEnBase64 : nom de fichier nettoyé (chemin, caractères de contrôle), « .pdf » ajouté s'il manque", async () => {
  const nomDe = async (nom: string) => {
    const converti = await convertirCvEnBase64(new File([PDF], nom, { type: "application/pdf" }));
    assert.ok(converti.ok, nom);
    return converti.cv.nomFichier;
  };
  assert.equal(await nomDe("C:\\fakepath\\cv\u0007 final.PDF"), "cv final.PDF");
  assert.equal(await nomDe("portfolio"), "portfolio.pdf");
  assert.equal(await nomDe(""), "cv.pdf");
  assert.equal(await nomDe("<script>.pdf"), "script.pdf");
  assert.ok((await nomDe(`${"a".repeat(300)}.pdf`)).length <= 100);
  assert.deepEqual(await convertirCvEnBase64(new File([], "vide.pdf")), { ok: false, erreur: "cv-format" });
});

test("filtre des offres : seulement « benevolat » et « freelance »", () => {
  assert.equal(choisirTypeOffre("benevolat"), "benevolat");
  assert.equal(choisirTypeOffre("freelance"), "freelance");
  for (const valeur of [null, "", "stage", "Benevolat", "emploi"]) assert.equal(choisirTypeOffre(valeur), null, String(valeur));
});

test("date de publication : le jour à Paris, en lettres", () => {
  assert.equal(formaterDateAParis("2026-10-21T08:00:00.000Z"), "21 octobre 2026");
  assert.equal(formaterDateAParis("2026-10-31T23:30:00.000Z"), "1er novembre 2026");
  assert.equal(formaterDateAParis("pas une date"), null);
});

test("partage des hôtes : /carriere et ses offres vivent sur sosmiam.fr, les deux espaces y renvoient (301)", () => {
  for (const chemin of ["/carriere", "/carriere?type=benevolat", "/carriere.data", "/carriere/moderation-brigade", "/carriere/moderation-brigade.data"]) {
    assert.equal(choisirRedirectionHote("sosmiam.fr", chemin), null, chemin);
  }
  assert.deepEqual(choisirRedirectionHote("ambassadeur.sosmiam.fr", "/carriere"), { adresse: "https://sosmiam.fr/carriere", statut: 301 });
  assert.deepEqual(choisirRedirectionHote("pro.sosmiam.fr", "/carriere/graphiste?utm_source=pro"), {
    adresse: "https://sosmiam.fr/carriere/graphiste?utm_source=pro", statut: 301,
  });
  assert.equal(choisirRedirectionHote("apercu.sosmiam.fr", "/carriere"), null);
});
