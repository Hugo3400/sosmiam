import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { fabriquerBlocPng, fabriquerPng } from "./outils/fabriquer-png.ts";
import {
  creerBancSecurite, fabriquerPngBavard, image, JPEG_POSITION, SECRET_PNG, SECRETS_JPEG, signalement,
} from "./outils/creer-banc-securite.ts";

let banc: Awaited<ReturnType<typeof creerBancSecurite>>;
before(async () => {
  banc = await creerBancSecurite();
});
after(() => banc.fermer());

const deposer = (corps: unknown, ip?: string) => banc.demander("POST", "/securite/signalements", corps, ip);
const dernier = () => [...banc.memoire.signalements.values()].at(-1)!;

test("un signalement valide est gardé chiffré, avec ses captures nettoyées et chiffrées", async () => {
  const envoi = await deposer(signalement({
    email: "  Zoe.Martin@Exemple.FR ", nom: "  Zoé   Martin ", images: [image(fabriquerPngBavard(), "a.jpg"), image(JPEG_POSITION, "b.png")],
  }));
  assert.deepEqual([envoi.statut, envoi.corps], [201, { ok: true }]);
  const ligne = dernier();
  for (const clair of ["Zoé", "zoe.martin", "e-mail d'un autre", "exemple.fr/video", "Une route"]) {
    assert.ok(!JSON.stringify(ligne).includes(clair), `rien en clair : ${clair}`);
  }
  assert.match(ligne.descriptionChiffree, /^v1:/);
  assert.equal(ligne.statut, "nouveau");
  assert.equal(ligne.gravite, null);
  assert.equal(ligne.images.length, 2);
  for (const fichier of ligne.images) {
    const surDisque = banc.stockage.fichiers.get(fichier)!.octets;
    assert.equal(surDisque.subarray(0, 3).toString("latin1"), "v1:", "chiffrée sur le disque");
    assert.ok(!surDisque.includes("PNG") && !surDisque.includes("TelephoneDe"));
  }
  const [lu] = await banc.securite.listerSignalementsSecurite();
  assert.equal(lu?.nom, "Zoé Martin");
  assert.equal(lu?.email, "zoe.martin@exemple.fr");
  assert.equal(lu?.nomTableauHonneur, "Zoé M.");
  assert.equal(lu?.images, 2);
  const png = await banc.securite.lireImageSignalementSecurite(ligne.id, 0);
  const jpeg = await banc.securite.lireImageSignalementSecurite(ligne.id, "1");
  assert.equal(png?.typeMime, "image/png", "reconnue par son contenu, pas par son nom");
  assert.equal(jpeg?.typeMime, "image/jpeg");
  const textePng = png!.octets.toString("latin1");
  for (const bloc of ["tEXt", "zTXt", "iTXt", "eXIf", "tIME", SECRET_PNG]) assert.ok(!textePng.includes(bloc), `PNG sans ${bloc}`);
  assert.ok(textePng.includes("sRGB") && textePng.endsWith("IEND\xaeB`\x82"), "sRGB gardé, rien après IEND");
  for (const secret of SECRETS_JPEG) assert.ok(!jpeg!.octets.toString("latin1").includes(secret), `JPEG sans ${secret}`);
  assert.ok(JPEG_POSITION.toString("latin1").includes("TelephoneDeLea"), "la photo d'essai avait bien ses métadonnées");
});

test("chaque champ invalide est signalé, rien n'est gardé", async () => {
  const avant = banc.memoire.signalements.size;
  const cas: [string, Record<string, unknown>][] = [
    ["nom", { nom: "Z" }], ["nom", { nom: "Z".repeat(81) }], ["email", { email: "pas-une-adresse" }],
    ["cible", { cible: "logiciel" }], ["cible", { cible: undefined }],
    ["titre", { titre: "Bug" }], ["titre", { titre: "a".repeat(121) }],
    ["description", { description: "Trop court" }], ["description", { description: "a".repeat(10_001) }],
    ["lien", { lien: "http://exemple.fr" }], ["lien", { lien: "javascript:alert(1)" }],
    ["majeur", { majeur: false }], ["majeur", { majeur: "true" }],
    ["reglesAcceptees", { reglesAcceptees: undefined }],
    ["nomTableauHonneur", { nomTableauHonneur: "Z" }], ["nomTableauHonneur", { nomTableauHonneur: "Z".repeat(41) }],
    ["images", { images: "capture.png" }], ["images", { images: [{ nomFichier: "a.png" }] }],
  ];
  for (const [champ, changement] of cas) {
    const reponse = await deposer(signalement(changement));
    assert.deepEqual([reponse.statut, reponse.corps], [400, { ok: false, erreur: "champ-invalide", champ }], champ);
  }
  assert.equal((await deposer(signalement({ lien: null, nomTableauHonneur: "", images: undefined }))).statut, 201, "lien, nom public et captures facultatifs");
  assert.equal(dernier().nomTableauChiffre, null);
  assert.equal(banc.memoire.signalements.size, avant + 1);
});

test("4 captures : trop-d-images ; un faux PNG ou un autre format : 415 ; trop lourde : 413", async () => {
  const avant = [banc.memoire.signalements.size, banc.stockage.fichiers.size];
  const png = image(fabriquerPng());
  const quatre = await deposer(signalement({ images: [png, png, png, png] }));
  assert.deepEqual([quatre.statut, quatre.corps], [400, { ok: false, erreur: "trop-d-images" }]);
  const bon = fabriquerPng();
  const crcFaux = Buffer.from(bon);
  crcFaux[crcFaux.length - 13] ^= 1;
  const faux = [
    Buffer.from("GIF89a pas une capture"),
    Buffer.from("\x89PNG\r\n\x1a\n", "latin1"),
    crcFaux,
    fabriquerPng({ idat: Buffer.from("pas du zlib") }),
    fabriquerPng({ avant: [fabriquerBlocPng("ABCD", Buffer.from("critique inconnu"))] }),
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a]),
    Buffer.concat([Buffer.from("<svg onload=alert(1)>"), bon]),
  ];
  for (const octets of faux) assert.deepEqual((await deposer(signalement({ images: [image(octets)] }))).corps, { ok: false, erreur: "image-format" });
  assert.deepEqual((await deposer(signalement({ images: [{ nomFichier: "a.png", base64: "ceci n'est pas du base64 !" }] }))).corps, { ok: false, erreur: "image-format" });
  const lourde = await deposer(signalement({ images: [image(Buffer.concat([bon, Buffer.alloc(5 * 1024 * 1024)]))] }));
  assert.deepEqual([lourde.statut, lourde.corps], [413, { ok: false, erreur: "image-trop-lourde" }]);
  const geante = await deposer(signalement({ images: [image(fabriquerPng({ largeur: 40_000, hauteur: 1, couleur: 0, profondeur: 1 }))] }));
  assert.deepEqual([geante.statut, geante.corps], [413, { ok: false, erreur: "image-trop-lourde" }], "dimensions démesurées");
  const tropGros = await deposer(signalement({ images: [{ nomFichier: "a.png", base64: "A".repeat(23 * 1024 * 1024) }] }));
  assert.deepEqual([tropGros.statut, tropGros.corps], [413, { ok: false, erreur: "image-trop-lourde" }], "corps de plus de 22 Mo");
  assert.deepEqual([banc.memoire.signalements.size, banc.stockage.fichiers.size], avant);
  const juste = Buffer.concat([fabriquerPng(), Buffer.alloc(5 * 1024 * 1024 - 400)]);
  const trois = await deposer(signalement({ images: [image(juste), image(juste), { nomFichier: "x", base64: `data:image/png;base64,${juste.toString("base64")}` }] }));
  assert.equal(trois.statut, 201, "3 captures de presque 5 Mo passent");
  assert.equal(banc.stockage.fichiers.size, avant[1]! + 3);
});

test("un robot qui remplit le champ piège reçoit 201, rien n'est gardé", async () => {
  const avant = [banc.memoire.signalements.size, banc.stockage.fichiers.size];
  const reponse = await deposer({ ...signalement({ images: [image(fabriquerPng())] }), site_web: "https://robot.example" });
  assert.deepEqual([reponse.statut, reponse.corps], [201, { ok: true }]);
  assert.equal((await deposer({ site_web: "x" })).statut, 201);
  assert.deepEqual([banc.memoire.signalements.size, banc.stockage.fichiers.size], avant);
  assert.equal((await deposer("{pas du json")).statut, 400);
});

test("5 signalements par heure et par IP, 3 par jour et par e-mail", async () => {
  const statuts = [];
  for (let i = 0; i < 6; i++) statuts.push((await deposer(signalement(), "198.51.100.42")).statut);
  assert.deepEqual(statuts, [201, 201, 201, 201, 201, 429]);
  const email = "meme.adresse@exemple.fr";
  const parEmail = [];
  for (let i = 0; i < 4; i++) parEmail.push(await deposer(signalement({ email: i === 2 ? " MEME.Adresse@exemple.fr" : email })));
  assert.deepEqual(parEmail.map((r) => r.statut), [201, 201, 201, 429]);
  assert.deepEqual(parEmail[3]?.corps, { ok: false, erreur: "trop-de-demandes" });
  assert.equal(parEmail[3]?.entetes.get("retry-after"), String(24 * 3600));
  banc.banc.horloge += 24 * 3600_000 + 1000;
  assert.equal((await deposer(signalement({ email }))).statut, 201, "le lendemain, ça repasse");
});

test("disque presque plein : 503 avec une capture, sans capture le signalement passe", async () => {
  banc.stockage.reglerPartLibre(0.05);
  try {
    const refus = await deposer(signalement({ images: [image(fabriquerPng())] }));
    assert.deepEqual([refus.statut, refus.corps], [503, { ok: false, erreur: "stockage-plein" }]);
    assert.equal((await deposer(signalement())).statut, 201);
  } finally {
    banc.stockage.reglerPartLibre(1);
  }
});

test("sans clé des données : 503 chiffrement-indisponible, le tableau d'honneur se lit quand même", async () => {
  const sansCle = await creerBancSecurite({ sansCle: true });
  try {
    const reponse = await sansCle.demander("POST", "/securite/signalements", signalement());
    assert.deepEqual([reponse.statut, reponse.corps], [503, { ok: false, erreur: "chiffrement-indisponible" }]);
    assert.equal(sansCle.memoire.signalements.size, 0);
    const tableau = await sansCle.demander("GET", "/securite/tableau-honneur");
    assert.deepEqual([tableau.statut, tableau.corps], [200, { ok: true, entrees: [] }]);
  } finally {
    await sansCle.fermer();
  }
});

test("tableau d'honneur : les plus récents d'abord, seulement le nom et le mois", async () => {
  const ids: string[] = [];
  for (const [nom, mois] of [["Ada", "2026-11"], ["Linus", "2027-01"], ["Grace", "2026-12"]] as const) {
    await deposer(signalement({ nomTableauHonneur: nom }));
    const id = dernier().id;
    ids.push(id);
    const [annee, m] = mois.split("-").map(Number);
    assert.equal((await banc.securite.changerSignalementSecurite(id, { statut: "corrige", auTableauHonneur: true }, new Date(Date.UTC(annee!, m! - 1, 15)))).ok, true);
  }
  const lu = await banc.demander("GET", "/securite/tableau-honneur");
  assert.equal(lu.statut, 200);
  assert.deepEqual(lu.corps?.entrees.slice(0, 3), [{ nom: "Linus", mois: "2027-01" }, { nom: "Grace", mois: "2026-12" }, { nom: "Ada", mois: "2026-11" }]);
  assert.equal((await banc.demander("GET", "/securite/inconnue")).statut, 404);
});
