// Tests de ce que l'app lit sans session (/app/lieux, /app/publications, /app/medias), avec des services en mémoire :
// aucune base de données n'est touchée. Les médias sont de vrais fichiers, dans un dossier temporaire.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, test } from "node:test";

import express from "express";

import { creerRoutesContenuApp } from "../src/routes/contenu-app.ts";
import { creerLieuxAppEnMemoire, type LieuAppEnMemoire } from "../src/services/lieux-app-en-memoire.ts";
import { creerPublicationsAppEnMemoire, type PublicationAppEnMemoire } from "../src/services/publications-app-en-memoire.ts";

const MAINTENANT = Date.parse("2026-10-09T18:00:00Z");
const dossier = mkdtempSync(join(tmpdir(), "sos-miam-medias-"));
const VIDEO = "11111111-1111-1111-1111-111111111111.mp4";
const AFFICHE = "22222222-2222-2222-2222-222222222222.jpg";
writeFileSync(join(dossier, VIDEO), Buffer.from("0123456789abcdef"));
writeFileSync(join(dossier, AFFICHE), Buffer.from("affiche"));

const lieux = creerLieuxAppEnMemoire();
const fil = creerPublicationsAppEnMemoire((fichier) => `https://api.exemple.fr/app/medias/${fichier}`);
const application = express();
application.use("/app", creerRoutesContenuApp({ lieux: lieux.services, publications: fil.services, dossierMedias: dossier, horloge: () => MAINTENANT }));
// Le routeur suivant sur /app (heure du serveur…) : une adresse inconnue du nôtre doit y arriver
application.use("/app", express.Router().get("/temps", (_q, r) => void r.json({ ok: true, suivant: true })));
const serveur = application.listen(0, "127.0.0.1");
let adresse = "";

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => {
  rmSync(dossier, { recursive: true, force: true });
  return new Promise<void>((fini) => serveur.close(() => fini()));
});

const LIEU: LieuAppEnMemoire = {
  id: 1, nom: "Chez Léa", type: "resto", emoji: "🍝", info: "Trattoria", texte: "Des pâtes fraîches.", quartier: "Écusson", ville: "Montpellier",
  latitude: 43.61, longitude: 3.877, prix: "€€", prixMoyen: 18, couleurs: ["#FFD60A", "#FF7A00"], horaires: "12h–14h30",
  ouverture: [{ jours: [2, 3, 4], de: "12:00", a: "14:30" }, { jours: [9], de: "25:00", a: "x" }], plat: "Cacio e pepe · 12 €",
  tags: ["Fait maison"], envies: ["terrasse"], reservable: true, telephone: "04 65 71 00 01", siteWeb: null, instagram: null,
  animaux: "terrasse", accessible: true, terrasse: false, wifi: null, enfants: null, parking: null, paiements: ["cb"], reservation: null,
  decouvertPar: null, rattachementsValides: 1, statut: "publie", carte: null, carteMajLe: null,
  rescousses: 214, sos: null, alerte: null, alerteJusqua: null, publieLe: new Date("2026-08-01T10:00:00Z"),
};

function publication(retouches: Partial<PublicationAppEnMemoire>): PublicationAppEnMemoire {
  return {
    id: 1, lieuId: 1, auteurType: "lieu", auteurPseudo: null, partenariat: null, legende: "Pâtes du jour", illustration: false,
    medias: [], statut: "publiee", suspendue: false, publieeLe: new Date("2026-10-09T10:00:00Z"), lieuPublie: true, lieuVerifie: true,
    ...retouches,
  };
}

async function lire(chemin: string, entetes: Record<string, string> = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, { headers: { "X-IP-Visiteur": `v-${Math.random()}`, ...entetes } });
  const type = reponse.headers.get("content-type") ?? "";
  // Corps JSON, ou texte pour un fichier : lu au cas par cas dans les tests
  const corps: any = type.includes("json") ? await reponse.json() : await reponse.text();
  return { statut: reponse.status, corps, entetes: reponse.headers };
}

beforeEach(() => {
  lieux.lieux.clear();
  fil.publications.clear();
});

test("GET /app/lieux : les lieux publiés au format de l'app, sans distance ni note interne", async () => {
  lieux.lieux.set(1, structuredClone(LIEU));
  lieux.lieux.set(2, { ...structuredClone(LIEU), id: 2, statut: "brouillon" });
  lieux.lieux.set(3, { ...structuredClone(LIEU), id: 3, couleurs: ["#123456"], latitude: null, rattachementsValides: 0, prixMoyen: null });
  const { statut, corps, entetes } = await lire("/app/lieux");
  assert.equal(statut, 200);
  assert.equal(entetes.get("cache-control"), "public, max-age=60");
  assert.deepEqual(corps.lieux.map((l: { id: number }) => l.id), [1, 3]);
  const [lea, sans] = corps.lieux;
  assert.equal(lea.km, undefined);
  assert.deepEqual(lea.position, { latitude: 43.61, longitude: 3.877 });
  assert.equal(lea.verifie, true);
  assert.equal(lea.rescousses, 214);
  assert.deepEqual(lea.ouverture, [{ jours: [2, 3, 4], de: "12:00", a: "14:30" }]);
  assert.deepEqual(lea.pratique, { telephone: "04 65 71 00 01", animaux: "terrasse", accessible: true, terrasse: false, paiements: ["cb"] });
  assert.equal("statut" in lea || "note" in lea, false);
  assert.equal(sans.position, undefined);
  assert.equal(sans.prixMoyen, undefined);
  assert.equal(sans.verifie, false);
  assert.deepEqual(sans.couleurs, ["#FFD60A", "#FF4D3D"]);
});

test("GET /app/lieux : SOS du soir (lieu vérifié, heure à Paris), message du moment et « Nouveau » selon l'heure", async () => {
  lieux.lieux.set(1, { ...structuredClone(LIEU), sos: { places: 6, jusqua: new Date("2026-10-09T19:30:00Z"), offre: "Un tiramisu offert" }, alerte: "Salle calme ce soir", alerteJusqua: new Date("2026-10-09T21:00:00Z"), publieLe: new Date("2026-09-20T10:00:00Z") });
  // Non vérifié : jamais de SOS ; message expiré ; mis en ligne il y a plus de 30 jours
  lieux.lieux.set(2, { ...structuredClone(LIEU), id: 2, rattachementsValides: 0, sos: { places: 2, jusqua: new Date("2026-10-09T20:00:00Z"), offre: null }, alerte: "Vieux message", alerteJusqua: new Date("2026-10-09T17:00:00Z"), publieLe: new Date("2026-08-01T10:00:00Z") });
  // SOS dont l'heure est passée ; message sans fin
  lieux.lieux.set(3, { ...structuredClone(LIEU), id: 3, sos: { places: 4, jusqua: new Date("2026-10-09T17:59:00Z"), offre: null }, alerte: "Fournée du soir", alerteJusqua: null, publieLe: null });
  const [a, b, c] = (await lire("/app/lieux")).corps.lieux;
  assert.deepEqual(a.sos, { places: 6, jusqua: "21:30", offre: "Un tiramisu offert" });
  assert.equal(a.alerte, "Salle calme ce soir");
  assert.equal(a.nouveau, true);
  assert.deepEqual([b.sos, b.alerte, b.nouveau], [undefined, undefined, undefined]);
  assert.deepEqual([c.sos, c.alerte, c.nouveau], [undefined, "Fournée du soir", undefined]);
});

test("GET /app/lieux : une zone garde ceux qui y ont leur position ; une zone mal formée est refusée", async () => {
  lieux.lieux.set(1, structuredClone(LIEU));
  lieux.lieux.set(2, { ...structuredClone(LIEU), id: 2, latitude: 48.85, longitude: 2.35 });
  const { corps } = await lire("/app/lieux?nord=44&sud=43&ouest=3&est=4");
  assert.deepEqual(corps.lieux.map((l: { id: number }) => l.id), [1]);
  for (const zone of ["nord=44&sud=43", "nord=43&sud=44&ouest=3&est=4", "nord=abc&sud=43&ouest=3&est=4", "nord=95&sud=43&ouest=3&est=4"]) {
    const r = await lire(`/app/lieux?${zone}`);
    assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "champ-invalide", "zone"], zone);
  }
});

test("GET /app/lieux/:id et sa carte : 404 pour un brouillon, un inconnu ou un id mal formé", async () => {
  lieux.lieux.set(1, { ...structuredClone(LIEU), carte: { sections: [{ titre: "À boire", elements: [{ nom: "Picpoul", prix: 5, alcool: true }] }] }, carteMajLe: new Date("2026-10-08T09:00:00Z") });
  lieux.lieux.set(2, { ...structuredClone(LIEU), id: 2, statut: "masque" });
  assert.equal((await lire("/app/lieux/1")).corps.lieu.nom, "Chez Léa");
  const carte = await lire("/app/lieux/1/carte");
  assert.equal(carte.corps.carte.majLe, "2026-10-08");
  assert.equal(carte.corps.majLe, "2026-10-08T09:00:00.000Z");
  assert.equal(carte.corps.carte.sections[0].elements[0].alcool, true);
  for (const chemin of ["/app/lieux/2", "/app/lieux/99", "/app/lieux/abc", "/app/lieux/2/carte", "/app/lieux/0/carte"]) {
    const r = await lire(chemin);
    assert.deepEqual([r.statut, r.corps.erreur], [404, "lieu-inconnu"], chemin);
  }
});

test("GET /app/lieux/code/:code : le lieu publié du QR de vitrine, rien d'autre", async () => {
  lieux.lieux.set(1, { ...structuredClone(LIEU), codePublic: "chezlea2" });
  lieux.lieux.set(2, { ...structuredClone(LIEU), id: 2, statut: "brouillon", codePublic: "brouill2" });
  const r = await lire("/app/lieux/code/chezlea2");
  assert.deepEqual([r.statut, r.corps.lieuId, r.entetes.get("cache-control")], [200, 1, "public, max-age=300"]);
  for (const code of ["brouill2", "inconnu2", "CHEZLEA2", "court"]) {
    assert.deepEqual([(await lire(`/app/lieux/code/${code}`)).statut], [404], code);
  }
});

test("GET /app/publications : seulement les visibles, de la plus récente à la plus ancienne", async () => {
  fil.publications.set(1, publication({ id: 1 }));
  fil.publications.set(2, publication({ id: 2, publieeLe: new Date("2026-10-09T12:00:00Z"), auteurType: "createur", auteurPseudo: "lea.mange", partenariat: "Repas offert", lieuVerifie: false }));
  fil.publications.set(3, publication({ id: 3, statut: "brouillon" }));
  fil.publications.set(4, publication({ id: 4, suspendue: true }));
  fil.publications.set(5, publication({ id: 5, publieeLe: new Date("2026-10-10T08:00:00Z") }));
  fil.publications.set(6, publication({ id: 6, lieuPublie: false }));
  // Un lieu non vérifié ne publie pas lui-même
  fil.publications.set(7, publication({ id: 7, lieuVerifie: false }));
  fil.publications.set(8, publication({ id: 8, medias: [
    { type: "video", fichier: VIDEO, ordre: 0, typeMime: "video/mp4" },
    { type: "affiche", fichier: AFFICHE, ordre: 0, typeMime: "image/jpeg" },
  ] }));
  const { statut, corps, entetes } = await lire("/app/publications");
  assert.equal(statut, 200);
  assert.equal(entetes.get("cache-control"), "public, max-age=30");
  assert.deepEqual(corps.publications.map((p: { id: string }) => p.id), ["2", "8", "1"]);
  assert.deepEqual(corps.publications[0].auteur, { type: "createur", pseudo: "lea.mange", partenariat: "Repas offert" });
  assert.deepEqual(corps.publications[1].media, {
    type: "video", video: `https://api.exemple.fr/app/medias/${VIDEO}`, affiche: `https://api.exemple.fr/app/medias/${AFFICHE}`,
  });
  assert.equal(corps.publications[2].media, undefined);
  assert.equal(corps.suite, null);
});

test("GET /app/publications : pages avec un curseur, et refus d'un curseur ou d'une limite mal formés", async () => {
  for (let i = 1; i <= 5; i++) fil.publications.set(i, publication({ id: i, publieeLe: new Date("2026-10-09T10:00:00Z") }));
  const page1 = await lire("/app/publications?limite=2");
  assert.deepEqual(page1.corps.publications.map((p: { id: string }) => p.id), ["5", "4"]);
  const page2 = await lire(`/app/publications?limite=2&apres=${encodeURIComponent(page1.corps.suite)}`);
  assert.deepEqual(page2.corps.publications.map((p: { id: string }) => p.id), ["3", "2"]);
  const page3 = await lire(`/app/publications?limite=2&apres=${encodeURIComponent(page2.corps.suite)}`);
  assert.deepEqual([page3.corps.publications.map((p: { id: string }) => p.id), page3.corps.suite], [["1"], null]);
  for (const [requete, champ] of [["apres=hier", "apres"], ["limite=0", "limite"], ["limite=31", "limite"], ["limite=2.5", "limite"]]) {
    const r = await lire(`/app/publications?${requete}`);
    assert.deepEqual([r.statut, r.corps.champ], [400, champ], requete);
  }
});

test("GET /app/medias/:fichier : servi seulement tant que la publication est visible, par morceaux pour la vidéo", async () => {
  fil.publications.set(1, publication({ id: 1, medias: [{ type: "video", fichier: VIDEO, ordre: 0, typeMime: "video/mp4" }] }));
  const entier = await lire(`/app/medias/${VIDEO}`);
  assert.equal(entier.statut, 200);
  assert.equal(entier.entetes.get("content-type"), "video/mp4");
  assert.equal(entier.entetes.get("cache-control"), "public, max-age=300");
  const morceau = await lire(`/app/medias/${VIDEO}`, { Range: "bytes=0-3" });
  assert.deepEqual([morceau.statut, morceau.corps], [206, "0123"]);
  fil.publications.set(1, publication({ id: 1, suspendue: true, medias: [{ type: "video", fichier: VIDEO, ordre: 0, typeMime: "video/mp4" }] }));
  assert.equal((await lire(`/app/medias/${VIDEO}`)).statut, 404);
  assert.equal((await lire("/app/medias/..%2F..%2Fetc%2Fpasswd")).statut, 404);
  // Connu de la base mais absent du disque
  fil.publications.set(2, publication({ id: 2, medias: [{ type: "photo", fichier: "33333333-3333-3333-3333-333333333333.jpg", ordre: 0, typeMime: "image/jpeg" }] }));
  assert.equal((await lire("/app/medias/33333333-3333-3333-3333-333333333333.jpg")).statut, 404);
});

test("une adresse /app/… inconnue passe au routeur suivant (heure du serveur, version)", async () => {
  const { statut, corps } = await lire("/app/temps");
  assert.deepEqual([statut, corps.suivant], [200, true]);
});

test("dans l'application de l'API : lieux de l'app et heure du serveur cohabitent sur /app", async () => {
  const { creerApplication } = await import("../src/application.ts");
  lieux.lieux.set(1, structuredClone(LIEU));
  const autre = creerApplication({
    enregistrerInscription: async () => {},
    contenuApp: { lieux: lieux.services, publications: fil.services, dossierMedias: dossier, horloge: () => MAINTENANT },
    app: { horloge: () => MAINTENANT },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => autre.once("listening", () => pret()));
  const base = `http://127.0.0.1:${(autre.address() as AddressInfo).port}`;
  try {
    const lieuxLus = (await (await fetch(`${base}/app/lieux`)).json()) as { lieux: { id: number }[] };
    assert.deepEqual(lieuxLus.lieux.map((l) => l.id), [1]);
    const temps = (await (await fetch(`${base}/app/temps`)).json()) as { maintenant: string };
    assert.equal(temps.maintenant, new Date(MAINTENANT).toISOString());
  } finally {
    await new Promise<void>((fini) => autre.close(() => fini()));
  }
});
