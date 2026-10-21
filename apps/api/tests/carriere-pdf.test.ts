import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateRawSync, deflateSync } from "node:zlib";

import { decoderCvPdf } from "../src/fonctions/carriere/decoder-cv-pdf.ts";
import { decoderNomPdf } from "../src/fonctions/carriere/decoder-nom-pdf.ts";
import { verifierPdf } from "../src/fonctions/carriere/verifier-pdf.ts";
import { fabriquerPdf } from "./outils/creer-banc-carriere.ts";
import { fabriquerPdfBureautique } from "./outils/fabriquer-pdf-bureautique.ts";

const pdf = (corps: string | Buffer) => Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.isBuffer(corps) ? corps : Buffer.from(corps, "latin1"), Buffer.from("\n%%EOF\n")]);
const fluxObjets = (dictionnaire: string, donnees: Buffer) =>
  Buffer.concat([Buffer.from(`5 0 obj << ${dictionnaire} /Length ${donnees.length} >> stream\n`, "latin1"), donnees, Buffer.from("\nendstream endobj", "latin1")]);
const ACTION_CACHEE = "<< /S /JavaScript /JS (app.alert(1)) >>";

test("decoderNomPdf : les échappements #xx d'un nom", () => {
  assert.equal(decoderNomPdf("J#61vaScript"), "JavaScript");
  assert.equal(decoderNomPdf("#4A#53"), "JS");
  assert.equal(decoderNomPdf("Bonjour#2"), "Bonjour#2");
});

test("un PDF de bureautique ordinaire passe : flux d'objets, liens, vue d'ouverture, image, profil ICC, police", () => {
  assert.equal(verifierPdf(fabriquerPdfBureautique()), true);
  assert.deepEqual(decoderCvPdf({ nomFichier: "cv.pdf", base64: fabriquerPdfBureautique().toString("base64") }, 5 * 1024 * 1024).ok, true);
  assert.equal(verifierPdf(pdf("1 0 obj << /Type /Catalog /OpenAction << /S /URI /URI (https://exemple.fr/cv) >> /AA << /O << /S /GoTo /D [3 0 R /Fit] >> >> >> endobj")), true);
  assert.equal(verifierPdf(pdf("/JSON /JSX (x) /JS-libre (x) /JavaScriptLike")), true, "des noms qui ressemblent sans l'être");
  assert.equal(verifierPdf(pdf("<< /JS /Autre >> << /JS >>")), true, "/JS sans code derrière");
});

test("noms actifs refusés, en clair ou écrits avec #xx", () => {
  for (const nom of ["JavaScript", "J#61vaScript", "#4Aava#53cript", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "GoToE", "GoToR", "SubmitForm", "ImportData", "OnInstantiate"]) {
    assert.equal(verifierPdf(pdf(`1 0 obj << /OpenAction << /S /${nom} >> >> endobj`)), false, nom);
  }
  for (const js of ["/JS (app.alert(1))", "/JS<6170702e616c657274283129>", "/JS 12 0 R", "/J#53 %commentaire\n  (x)", "/JS\r\n\t(x)"]) {
    assert.equal(verifierPdf(pdf(`1 0 obj << /S /Named ${js} >> endobj`)), false, js);
  }
});

test("une action cachée dans un flux d'objets compressé est trouvée, même sans /Type ni en-tête zlib", () => {
  assert.equal(verifierPdf(fabriquerPdfBureautique({ dansLesObjets: ACTION_CACHEE })), false);
  assert.equal(verifierPdf(fabriquerPdfBureautique({ dansLesObjets: "<< /S /J#61vaScript /JS (x) >>" })), false);
  assert.equal(verifierPdf(fabriquerPdfBureautique({ dansLesObjets: "<< /S /Launch /F (calc.exe) >>" })), false);
  assert.equal(verifierPdf(pdf(fluxObjets("/N 1 /First 4 /Filter /FlateDecode", deflateSync(Buffer.from(`1 0 ${ACTION_CACHEE}`))))), false, "sans /Type");
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /Obj#53tm /N 1 /First 4 /Filter /Fl", deflateRawSync(Buffer.from(`1 0 ${ACTION_CACHEE}`))))), false, "deflate brut, filtre abrégé");
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4 /Filter [/FlateDecode]", deflateSync(Buffer.from(`1 0 ${ACTION_CACHEE}`)).subarray(0, 30)))), false, "tronqué : ce qui se lit est lu");
  const avecFausseFin = Buffer.concat([Buffer.from([0x78, 0x01, 0x00]), Buffer.from([16, 0, 0xef, 0xff]), Buffer.from("endstream endobj"), deflateRawSync(Buffer.from(` 1 0 ${ACTION_CACHEE}`))]);
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", avecFausseFin))), false, "un faux endstream au milieu du flux");
});

test("un flux d'objets qu'on ne sait pas lire fait refuser le PDF", () => {
  const clair = Buffer.from(`1 0 << /Type /Pages /Count 0 >>`);
  for (const dictionnaire of [
    "/Type /ObjStm /N 1 /First 4 /Filter /ASCIIHexDecode",
    "/Type /ObjStm /N 1 /First 4 /Filter /AHx",
    "/Type /ObjStm /N 1 /First 4 /Filter [/ASCII85Decode /FlateDecode]",
    "/Type /ObjStm /N 1 /First 4 /Filter [/FlateDecode /FlateDecode]",
    "/Type /ObjStm /N 1 /First 4 /Filter 9 0 R",
    "/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /DecodeParms << /Predictor 12 /Columns 5 >>",
    "/Type /ObjStm /N 1 /First 4 /Filter /Crypt",
    "/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode /F (ailleurs.bin)",
  ]) {
    assert.equal(verifierPdf(pdf(fluxObjets(dictionnaire, deflateSync(clair)))), false, dictionnaire);
  }
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", Buffer.from("pas du zlib du tout")))), false, "illisible : refusé");
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4", clair))), true, "sans filtre : lu en clair");
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4", Buffer.from(`1 0 ${ACTION_CACHEE}`)))), false);
});

test("bombes : plafond de décompression, de flux et de lecture, sans bloquer longtemps", () => {
  const debut = performance.now();
  const bombe = deflateSync(Buffer.alloc(40 * 1024 * 1024, 0x20));
  assert.equal(verifierPdf(pdf(fluxObjets("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", bombe))), false, "40 Mo décompressés");
  const petit = fluxObjets("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", deflateSync(Buffer.from("1 0 << >>")));
  assert.equal(verifierPdf(pdf(Buffer.concat(Array.from({ length: 1001 }, () => petit)))), false, "plus de 1 000 flux d'objets");
  assert.equal(verifierPdf(pdf(Buffer.concat(Array.from({ length: 300 }, () => petit)))), true);
  assert.equal(verifierPdf(pdf("1 0 obj <<(".repeat(400_000))), false, "des dictionnaires jamais fermés");
  assert.equal(verifierPdf(pdf(`1 0 obj %${"obj %".repeat(800_000)}\n<< >>`)), true, "des commentaires sans fin");
  assert.ok(performance.now() - debut < 8000, `${Math.round(performance.now() - debut)} ms`);
});

test("fabriquerPdf du banc reste un CV valable", () => {
  assert.equal(verifierPdf(fabriquerPdf()), true);
  assert.equal(verifierPdf(fabriquerPdf("Lien : /URI (https://www.linkedin.com/in/malo)")), true);
});
