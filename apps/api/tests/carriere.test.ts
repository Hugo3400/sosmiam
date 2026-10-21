import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancCarriere, fabriquerPdf, OFFRE_BANC } from "./outils/creer-banc-carriere.ts";

let banc: Awaited<ReturnType<typeof creerBancCarriere>>;
before(async () => {
  banc = await creerBancCarriere();
});
after(() => banc.fermer());

let numero = 0;
const candidature = (o: Record<string, unknown> = {}) => ({
  nom: "Zoé Martin",
  email: `zoe.${++numero}@exemple.fr`,
  message: "Je relis volontiers les avis du soir, avec bienveillance et un bon thé.",
  lien: "https://exemple.fr/portfolio",
  majeur: true,
  cv: { nomFichier: "cv.pdf", base64: fabriquerPdf().toString("base64") },
  ...o,
});
const deposer = (offreId: string, corps: unknown, ip?: string) => banc.demander("POST", `/carriere/offres/${offreId}/candidatures`, corps, ip);

test("une offre en brouillon est invisible, publiée elle se lit, fermée elle disparaît", async () => {
  const creee = await banc.carriere.creerOffre(OFFRE_BANC);
  assert.ok(creee.ok);
  const id = creee.offre.id;
  assert.equal(creee.offre.publieeLe, null);
  assert.equal(creee.offre.lieu, "À distance, partout en France");
  assert.deepEqual((await banc.demander("GET", `/carriere/offres/${id}`)).corps, { ok: false, erreur: "offre-inconnue" });
  assert.equal((await banc.demander("GET", "/carriere/offres")).corps?.offres.some((o: { id: string }) => o.id === id), false);
  assert.deepEqual((await deposer(id, candidature())).corps, { ok: false, erreur: "offre-inconnue" });

  banc.banc.horloge += 60_000;
  const publiee = await banc.carriere.publierOffre(id);
  assert.equal(publiee?.publieeLe, new Date(banc.banc.horloge).toISOString());
  const lue = await banc.demander("GET", `/carriere/offres/${id}`);
  assert.equal(lue.statut, 200);
  assert.deepEqual(Object.keys(lue.corps?.offre).sort(), ["description", "domaine", "enEchange", "id", "lieu", "missions", "profil", "publieeLe", "resume", "titre", "type"]);
  assert.deepEqual(lue.corps?.offre.missions, ["Relire les avis signalés"]);
  assert.equal((await banc.demander("GET", "/carriere/offres")).corps?.offres[0].id, id, "la plus récente d'abord");

  banc.banc.horloge += 60_000;
  assert.ok((await banc.carriere.fermerOffre(id))?.fermeeLe);
  assert.equal((await banc.demander("GET", `/carriere/offres/${id}`)).statut, 404);
  assert.equal((await banc.demander("GET", "/carriere/offres")).corps?.offres.some((o: { id: string }) => o.id === id), false);
  const refus = await deposer(id, candidature());
  assert.deepEqual([refus.statut, refus.corps], [409, { ok: false, erreur: "offre-fermee" }]);

  banc.banc.horloge += 60_000;
  assert.equal((await banc.carriere.publierOffre(id))?.fermeeLe, null, "republier rouvre l'offre");
  assert.equal((await banc.demander("GET", `/carriere/offres/${id}`)).statut, 200);
  assert.equal((await banc.demander("GET", "/carriere/offres/abc")).statut, 404);
  assert.equal((await banc.demander("GET", "/carriere/offres/999")).statut, 404);
});

test("les offres se modifient et se suppriment depuis les fonctions du logiciel", async () => {
  const id = await banc.publier();
  assert.deepEqual(await banc.carriere.modifierOffre(id, { ...OFFRE_BANC, titre: "" }), { ok: false, erreur: "champ-invalide", champ: "titre" });
  assert.deepEqual(await banc.carriere.modifierOffre(id, { ...OFFRE_BANC, type: "stage" }), { ok: false, erreur: "champ-invalide", champ: "type" });
  assert.deepEqual(await banc.carriere.modifierOffre(id, { ...OFFRE_BANC, missions: "une" }), { ok: false, erreur: "champ-invalide", champ: "missions" });
  assert.deepEqual(await banc.carriere.modifierOffre("999", OFFRE_BANC), { ok: false, erreur: "offre-inconnue" });
  const modifiee = await banc.carriere.modifierOffre(id, { ...OFFRE_BANC, titre: "  Réseaux   sociaux  ", domaine: "reseaux-sociaux" });
  assert.ok(modifiee.ok);
  assert.equal(modifiee.offre.titre, "Réseaux sociaux");
  assert.equal((await deposer(id, candidature())).statut, 201);
  const gestion = (await banc.carriere.listerOffresGestion()).find((o) => o.id === id);
  assert.deepEqual([gestion?.candidatures, gestion?.nouvelles], [1, 1]);
  assert.equal(banc.stockage.fichiers.size > 0, true);
  const avant = banc.stockage.fichiers.size;
  assert.equal(await banc.carriere.supprimerOffre(id), true);
  assert.equal(banc.stockage.fichiers.size, avant - 1, "le CV part avec l'offre");
  assert.equal(await banc.carriere.supprimerOffre(id), false);
  assert.equal((await banc.demander("GET", `/carriere/offres/${id}`)).statut, 404);
});

test("une candidature valide est gardée, chiffrée, et se relit dans le logiciel", async () => {
  const id = await banc.publier();
  const envoi = await deposer(id, candidature({ email: "  Lea.Dupont@Exemple.FR ", nom: "  Léa   Dupont " }));
  assert.deepEqual([envoi.statut, envoi.corps], [201, { ok: true }]);
  const [ligne] = [...banc.memoire.candidatures.values()].filter((c) => c.offreId === Number(id));
  assert.ok(ligne);
  for (const clair of ["Léa", "lea.dupont", "bon thé", "exemple.fr/portfolio"]) {
    assert.ok(!JSON.stringify(ligne).includes(clair), `rien en clair : ${clair}`);
  }
  assert.match(ligne.messageChiffre, /^v1:/);
  const [lue] = await banc.carriere.listerCandidatures({ offreId: id });
  assert.equal(lue?.nom, "Léa Dupont");
  assert.equal(lue?.email, "lea.dupont@exemple.fr");
  assert.equal(lue?.lien, "https://exemple.fr/portfolio");
  assert.equal(lue?.aUnCv, true);
  assert.equal(lue?.statut, "nouvelle");
  assert.equal(lue?.offreTitre, OFFRE_BANC.titre);
  assert.equal(Date.parse(lue!.effaceeLe) - Date.parse(lue!.creeLe), 183 * 86_400_000);
  assert.deepEqual(await banc.carriere.lireCvCandidature(lue!.id), fabriquerPdf());
  const fichier = banc.stockage.fichiers.get(ligne.cvFichier!)!.octets;
  assert.ok(!fichier.includes("%PDF-"), "le CV est chiffré sur le disque");
  assert.equal(fichier.subarray(0, 3).toString("latin1"), "v1:");
});

test("chaque champ invalide est signalé, rien n'est gardé", async () => {
  const id = await banc.publier();
  const avant = banc.memoire.candidatures.size;
  const cas: [string, Record<string, unknown>][] = [
    ["nom", { nom: "Z" }], ["nom", { nom: "Z".repeat(81) }], ["nom", { nom: 12 }],
    ["email", { email: "pas-une-adresse" }], ["email", { email: "" }],
    ["message", { message: "Trop court" }], ["message", { message: "a".repeat(3001) }],
    ["lien", { lien: "http://exemple.fr" }], ["lien", { lien: "javascript:alert(1)" }], ["lien", { lien: `https://exemple.fr/${"a".repeat(290)}` }],
    ["majeur", { majeur: false }], ["majeur", { majeur: "true" }], ["majeur", { majeur: undefined }],
    ["cv", { cv: "cv.pdf" }], ["cv", { cv: { nomFichier: "cv.pdf" } }],
  ];
  for (const [champ, changement] of cas) {
    const reponse = await deposer(id, candidature(changement));
    assert.deepEqual([reponse.statut, reponse.corps], [400, { ok: false, erreur: "champ-invalide", champ }], champ);
  }
  assert.equal((await deposer(id, candidature({ lien: null, cv: null }))).statut, 201, "lien et CV facultatifs");
  assert.equal(banc.memoire.candidatures.size, avant + 1);
});

test("un faux PDF est refusé (415), un PDF trop lourd aussi (413)", async () => {
  const id = await banc.publier();
  const avant = banc.memoire.candidatures.size;
  const faux: Record<string, unknown>[] = [
    { nomFichier: "cv.pdf", base64: Buffer.from("MZ pas un pdf du tout %%EOF").toString("base64") },
    { nomFichier: "cv.pdf", base64: Buffer.from("%PDF-1.7 sans fin").toString("base64") },
    { nomFichier: "cv.docx", base64: fabriquerPdf().toString("base64") },
    { nomFichier: "cv.pdf", base64: "ceci n'est pas du base64 !" },
    { nomFichier: "cv.pdf", base64: fabriquerPdf("<< /S /JavaScript /JS (app.alert(1)) >>").toString("base64") },
  ];
  for (const cv of faux) assert.deepEqual((await deposer(id, candidature({ cv }))).corps, { ok: false, erreur: "cv-format" });
  const lourd = fabriquerPdf("lourd", 5 * 1024 * 1024);
  const reponse = await deposer(id, candidature({ cv: { nomFichier: "cv.pdf", base64: lourd.toString("base64") } }));
  assert.deepEqual([reponse.statut, reponse.corps], [413, { ok: false, erreur: "cv-trop-lourd" }]);
  const tropGros = await deposer(id, candidature({ cv: { nomFichier: "cv.pdf", base64: "A".repeat(9 * 1024 * 1024) } }));
  assert.deepEqual([tropGros.statut, tropGros.corps], [413, { ok: false, erreur: "cv-trop-lourd" }], "corps de plus de 8 Mo");
  const juste = fabriquerPdf("juste", 5 * 1024 * 1024 - 200);
  assert.equal((await deposer(id, candidature({ cv: { nomFichier: "CV Final.PDF", base64: `data:application/pdf;base64,${juste.toString("base64")}` } }))).statut, 201);
  assert.equal(banc.memoire.candidatures.size, avant + 1);
});

test("un robot qui remplit le champ piège reçoit 201, rien n'est gardé", async () => {
  const id = await banc.publier();
  const avant = [banc.memoire.candidatures.size, banc.stockage.fichiers.size];
  const reponse = await deposer(id, { ...candidature(), site_web: "https://robot.example" });
  assert.deepEqual([reponse.statut, reponse.corps], [201, { ok: true }]);
  assert.equal((await deposer(id, { site_web: "x" })).statut, 201);
  assert.deepEqual([banc.memoire.candidatures.size, banc.stockage.fichiers.size], avant);
});

test("5 candidatures par heure et par IP, 3 par jour et par e-mail", async () => {
  const id = await banc.publier();
  const statuts = [];
  for (let i = 0; i < 6; i++) statuts.push((await deposer(id, candidature(), "198.51.100.42")).statut);
  assert.deepEqual(statuts, [201, 201, 201, 201, 201, 429]);

  const email = "meme.adresse@exemple.fr";
  const parEmail = [];
  for (let i = 0; i < 4; i++) parEmail.push(await deposer(id, candidature({ email: i === 2 ? " MEME.Adresse@exemple.fr" : email })));
  assert.deepEqual(parEmail.map((r) => r.statut), [201, 201, 201, 429]);
  assert.deepEqual(parEmail[3]?.corps, { ok: false, erreur: "trop-de-demandes" });
  assert.equal(parEmail[3]?.entetes.get("retry-after"), String(24 * 3600));
  banc.banc.horloge += 24 * 3600_000 + 1000;
  assert.equal((await deposer(id, candidature({ email }))).statut, 201, "le lendemain, ça repasse");
});

test("sans clé des données, le dépôt répond 503 et les offres se lisent quand même", async () => {
  const sansCle = await creerBancCarriere({ sansCle: true });
  try {
    const id = await sansCle.publier();
    assert.equal((await sansCle.demander("GET", `/carriere/offres/${id}`)).statut, 200);
    const reponse = await sansCle.demander("POST", `/carriere/offres/${id}/candidatures`, candidature());
    assert.deepEqual([reponse.statut, reponse.corps], [503, { ok: false, erreur: "chiffrement-indisponible" }]);
    assert.equal(sansCle.memoire.candidatures.size, 0);
    assert.equal(sansCle.stockage.fichiers.size, 0);
  } finally {
    await sansCle.fermer();
  }
});
