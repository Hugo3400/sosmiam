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

const { lireFormulaireSignalement } = await import("../src/fonctions/securite/lire-formulaire-signalement.ts");
const { convertirImagesEnBase64 } = await import("../src/fonctions/securite/convertir-images-en-base64.ts");
const { lireChampSignalement } = await import("../src/fonctions/securite/lire-champ-signalement.ts");
const { formaterMoisEnLettres } = await import("../src/fonctions/dates/formater-mois-en-lettres.ts");
const { ecrireMessageService } = await import("../src/fonctions/texte/ecrire-message-service.ts");
const { IMAGE_SIGNALEMENT_OCTETS_MAX } = await import("../../../packages/commun/src/regles/securite.ts");

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46]);
const DESCRIPTION = "1. Ouvre /lieux/12 avec un compte A.\n2. Change l'id dans la requête.\n    Impact : lecture d'un profil privé.";

const sansEspaces = (texte: string | undefined) => texte?.replace(/[\u00a0\u202f]/g, " ");

function remplir(champs: Record<string, string | File | File[]>): FormData {
  const formulaire = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) {
    for (const une of Array.isArray(valeur) ? valeur : [valeur]) formulaire.append(cle, une);
  }
  return formulaire;
}

const VALABLE = {
  nom: "  Léa   la Chasseuse ",
  email: "lea@exemple.fr",
  cible: "api",
  titre: "IDOR  sur les profils",
  description: `${DESCRIPTION}\r\n`,
  lien: "",
  majeur: "oui",
  reglesAcceptees: "oui",
  site_web: "",
};

test("lireFormulaireSignalement : un signalement valable, espaces nettoyés, description gardée telle quelle, sans tableau d'honneur", async () => {
  const lecture = await lireFormulaireSignalement(remplir({ ...VALABLE, nomTableauHonneur: "Léa", images: new File([], "", { type: "application/octet-stream" }) }));
  assert.ok(lecture.ok);
  assert.deepEqual(lecture.signalement, {
    nom: "Léa la Chasseuse",
    email: "lea@exemple.fr",
    cible: "api",
    titre: "IDOR sur les profils",
    description: DESCRIPTION,
    lien: null,
    majeur: true,
    reglesAcceptees: true,
    nomTableauHonneur: null,
    images: [],
  });
  assert.equal(lecture.piege, "");
});

test("lireFormulaireSignalement : tableau d'honneur, lien complété en https, captures PNG et JPEG en base64 exact, piège rendu", async () => {
  const lecture = await lireFormulaireSignalement(remplir({
    ...VALABLE,
    lien: "exemple.fr/video",
    tableauHonneur: "oui",
    nomTableauHonneur: " Team   Bouiboui ",
    images: [new File([PNG], "C:\\captures\\écran 1.png", { type: "image/png" }), new File([JPEG], "photo", { type: "image/jpeg" })],
    site_web: "rempli par un robot",
  }));
  assert.ok(lecture.ok);
  assert.equal(lecture.signalement.lien, "https://exemple.fr/video");
  assert.equal(lecture.signalement.nomTableauHonneur, "Team Bouiboui");
  assert.deepEqual(lecture.signalement.images, [
    { nomFichier: "écran 1.png", base64: Buffer.from(PNG).toString("base64") },
    { nomFichier: "photo.jpg", base64: Buffer.from(JPEG).toString("base64") },
  ]);
  assert.equal(lecture.piege, "rempli par un robot");
});

test("lireFormulaireSignalement : chaque champ fautif a son message, et les valeurs reviennent pour remplir le formulaire", async () => {
  const lecture = await lireFormulaireSignalement(remplir({
    nom: "L", email: "lea@", cible: "logiciel-gestion", titre: "XSS", description: "trop court", lien: "http://exemple.fr",
    tableauHonneur: "oui", nomTableauHonneur: "", images: new File(["%PDF-1.7"], "rapport.pdf", { type: "application/pdf" }),
  }));
  assert.ok(!lecture.ok);
  assert.deepEqual(Object.keys(lecture.erreurs).sort(), [
    "cible", "description", "email", "images", "lien", "majeur", "nom", "nomTableauHonneur", "reglesAcceptees", "titre",
  ]);
  assert.match(sansEspaces(lecture.erreurs.majeur) ?? "", /18 ans ou plus/);
  assert.match(sansEspaces(lecture.erreurs.reglesAcceptees) ?? "", /lu les règles/);
  assert.match(sansEspaces(lecture.erreurs.images) ?? "", /^Seulement des images PNG ou JPEG\. /);
  assert.match(sansEspaces(lecture.erreurs.description) ?? "", /30 à 10 000 caractères/);
  assert.equal(lecture.valeurs.titre, "XSS");
  assert.equal(lecture.valeurs.tableauHonneur, true);
  assert.equal(lecture.imagesEnvoyees, true);
});

test("convertirImagesEnBase64 : 4 images, une trop lourde, un faux PNG ou un fichier vide sont refusés avec le code de l'API", async () => {
  const png = (nom: string) => new File([PNG], nom, { type: "image/png" });
  assert.deepEqual(await convertirImagesEnBase64([png("a.png"), png("b.png"), png("c.png"), png("d.png")]), { ok: false, erreur: "trop-d-images" });
  const lourde = new File([new Uint8Array(IMAGE_SIGNALEMENT_OCTETS_MAX + 1)], "lourde.png", { type: "image/png" });
  assert.deepEqual(await convertirImagesEnBase64([lourde]), { ok: false, erreur: "image-trop-lourde" });
  assert.deepEqual(await convertirImagesEnBase64([new File(["<svg/>"], "faux.png", { type: "image/png" })]), { ok: false, erreur: "image-format" });
  assert.deepEqual(await convertirImagesEnBase64([new File([], "vide.png", { type: "image/png" })]), { ok: false, erreur: "image-format" });
  const lu = await convertirImagesEnBase64([new File([JPEG], "../../etc/capture.jpeg", { type: "image/jpeg" })]);
  assert.deepEqual(lu, { ok: true, images: [{ nomFichier: "capture.jpg", base64: Buffer.from(JPEG).toString("base64") }] });
});

test("lireChampSignalement : les champs de l'API vers ceux du formulaire, rien pour un champ inconnu", () => {
  assert.equal(lireChampSignalement("email"), "email");
  assert.equal(lireChampSignalement("reglesAcceptees"), "reglesAcceptees");
  assert.equal(lireChampSignalement("nomTableauHonneur"), "nomTableauHonneur");
  assert.equal(lireChampSignalement("images"), "images");
  assert.equal(lireChampSignalement("images.1.base64"), "images");
  assert.equal(lireChampSignalement("imagesFoo"), null);
  assert.equal(lireChampSignalement("site_web"), null);
});

test("formaterMoisEnLettres : « 2026-10 » → « octobre 2026 », null si illisible", () => {
  assert.equal(formaterMoisEnLettres("2026-10"), "octobre 2026");
  assert.equal(formaterMoisEnLettres("2027-01"), "janvier 2027");
  assert.equal(formaterMoisEnLettres("2026-13"), null);
  assert.equal(formaterMoisEnLettres("octobre"), null);
});

test("ecrireMessageService : le titre et le texte de MESSAGES_SERVICE, sans point en trop après « ! »", () => {
  assert.equal(ecrireMessageService("trop-d-images"), "3 captures au plus. Garde les 3 qui montrent le mieux la faille : le reste, tu peux le décrire ou le mettre derrière un lien.");
  assert.equal(ecrireMessageService("trop-de-demandes"), "Doucement ! Beaucoup d'essais d'un coup : réessaie dans quelques minutes.");
});
