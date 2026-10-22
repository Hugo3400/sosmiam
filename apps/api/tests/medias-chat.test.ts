// Tests des photos et notes vocales du chat : nettoyage des JPEG (EXIF, position, XMP, commentaires ; tout ce qui suit l'image
// principale coupé, images MPF comprises) et des MP4/M4A (udta, meta : « ©xyz » neutralisé), formats refusés (une vidéo n'est
// pas une note vocale), tailles, dimensions, durée, fichiers chiffrés sur le stockage, quotas (50 par 24 h, 1 Go par compte,
// envois simultanés), disque presque plein, lecture réservée aux membres, 410 après 90 jours ou quand le média est suspendu,
// même gardé pour la modération. Photos d'essai : tests/donnees (faites avec Pillow 9.4 : EXIF avec position GPS et un texte
// « position:… » repérable, XMP, commentaire ; un MPO dont la seconde image a sa propre position ; un JPEG progressif).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { lireDureeMp4 } from "../src/fonctions/medias/lire-duree-mp4.ts";
import { lireTailleJpeg } from "../src/fonctions/medias/lire-taille-jpeg.ts";
import { neutraliserMetadonneesMp4 } from "../src/fonctions/medias/neutraliser-metadonnees-mp4.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { verifierVocalMp4 } from "../src/fonctions/medias/verifier-vocal-mp4.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";
import { demanderBrut, trouverAdresseBanc } from "./outils/demander-brut.ts";
import { fabriquerMp4, POSITION_ESSAI, SON_ESSAI } from "./outils/fabriquer-mp4.ts";

const lireDonnee = (nom: string) => readFileSync(new URL(`./donnees/${nom}`, import.meta.url));
const PHOTO = lireDonnee("photo-exif-position.jpg");
const MPO = lireDonnee("photo-mpf-position.jpg");
const PROGRESSIVE = lireDonnee("photo-progressive.jpg");
const JOUR = 24 * 60 * 60 * 1000;
const compter = (o: Buffer, motif: Buffer | string) => {
  let n = 0;
  for (let i = o.indexOf(motif); i >= 0; i = o.indexOf(motif, i + 1)) n += 1;
  return n;
};
/** Les données compressées : du premier SOS à la fin de l'image principale */
const donneesCompressees = (o: Buffer) => o.subarray(o.indexOf(Buffer.from([0xff, 0xda])), o.indexOf(Buffer.from([0xff, 0xd9])) + 2);

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let adresse = "";
before(async () => {
  banc = await creerBancSocial();
  adresse = await trouverAdresseBanc(banc);
});
after(() => banc.fermer());

async function deuxPotes() {
  const a = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne({ prenom: "Malo" });
  banc.rendrePotes(a, b);
  const id = (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string;
  return { a, b, id };
}
const envoyerMedia = (p: PersonneDeTest, id: string, octets: Uint8Array, type: string, idClient = randomUUID()) =>
  demanderBrut(adresse, p.jeton, "POST", `/app/conversations/${id}/medias`, { octets, type, entetes: { "Idempotency-Key": idClient } });
const lireMedia = (p: PersonneDeTest, id: string, messageId: string) => demanderBrut(adresse, p.jeton, "GET", `/app/conversations/${id}/messages/${messageId}/media`);
const corps = (r: { corps: Record<string, unknown> | null }) => r.corps as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

test("JPEG : EXIF, position, XMP et commentaire retirés, l'image identique ; MPF coupé à la fin de l'image principale ; progressif accepté", () => {
  assert.deepEqual(lireTailleJpeg(PHOTO), { largeur: 64, hauteur: 48 });
  const propre = retirerMetadonneesJpeg(PHOTO)!;
  for (const secret of ["position:", "Exif", "xmpmeta", "commentaire", "TelephoneDeLea"]) assert.equal(compter(propre, secret), 0, secret);
  assert.ok(compter(PHOTO, "position:") > 0, "la photo d'essai a bien une position");
  assert.deepEqual(donneesCompressees(propre), donneesCompressees(PHOTO), "données de l'image intactes");
  const coupe = retirerMetadonneesJpeg(MPO)!;
  assert.equal(compter(coupe, Buffer.from([0xff, 0xd8, 0xff])), 1, "une seule image");
  assert.equal(compter(coupe, "position:"), 0);
  assert.equal(compter(coupe, "MPF"), 0);
  assert.deepEqual(coupe.subarray(-2), Buffer.from([0xff, 0xd9]));
  assert.ok(compter(MPO, "position:seconde-image") === 1, "le MPO d'essai cache bien une seconde position");
  assert.equal(compter(retirerMetadonneesJpeg(PROGRESSIVE)!, "position:"), 0);
  // Mal formés : tronqué (pas de fin), deux SOI collés, pas un JPEG
  assert.equal(retirerMetadonneesJpeg(PHOTO.subarray(0, PHOTO.length - 40)), null);
  assert.equal(retirerMetadonneesJpeg(Buffer.concat([PHOTO.subarray(0, 2), PHOTO])), null);
  assert.equal(retirerMetadonneesJpeg(Buffer.from("pas une image")), null);
  assert.equal(lireTailleJpeg(Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 2])), null, "SOS avant SOF");
});

test("MP4 : durée relue (versions 0 et 1), une seule piste son AAC, métadonnées neutralisées sans rien déplacer", () => {
  const vocal = fabriquerMp4();
  assert.equal(lireDureeMp4(vocal), Math.round(12.4 * 44_100) / 44_100);
  assert.equal(lireDureeMp4(fabriquerMp4({ secondes: 61, version: 1 })), 61);
  assert.equal(lireDureeMp4(vocal.subarray(0, 60)), null, "tronqué");
  assert.equal(verifierVocalMp4(vocal), "ok");
  assert.equal(verifierVocalMp4(fabriquerMp4({ pistes: ["vide", "soun"] })), "format", "une vidéo n'est pas une note vocale");
  assert.equal(verifierVocalMp4(fabriquerMp4({ pistes: ["vide"] })), "format");
  assert.equal(verifierVocalMp4(PHOTO), "format");
  const propre = neutraliserMetadonneesMp4(vocal);
  assert.equal(propre.length, vocal.length);
  for (const secret of [POSITION_ESSAI, "©xyz", "Chez Léa", "Mémo de Léa"]) assert.equal(compter(propre, Buffer.from(secret, secret.startsWith("©") ? "latin1" : "utf8")), 0, secret);
  assert.equal(propre.indexOf(SON_ESSAI), vocal.indexOf(SON_ESSAI), "le son est à la même place");
  assert.deepEqual([verifierVocalMp4(propre), lireDureeMp4(propre)], ["ok", lireDureeMp4(vocal)]);
  assert.equal(compter(vocal, "udta"), 2, "le fichier d'essai a bien ses métadonnées");
});

test("photo envoyée : nettoyée, chiffrée sur le stockage, relue en clair par un membre ; rejouée : un seul message", async () => {
  const { a, b, id } = await deuxPotes();
  banc.pushs.length = 0;
  const idClient = randomUUID();
  const envoi = await envoyerMedia(a, id, PHOTO, "image/jpeg", idClient);
  assert.equal(envoi.statut, 201, JSON.stringify(envoi.corps));
  const message = corps(envoi).message;
  assert.deepEqual([message.type, message.media.etat, message.media.typeMime, message.media.largeur, message.media.hauteur], ["photo", "disponible", "image/jpeg", 64, 48]);
  const ligne = banc.tables.messages.get(Number(message.id))!;
  const stocke = banc.social.medias.fichiers.get(ligne.fichier!)!.octets;
  assert.ok(stocke.subarray(0, 3).toString("latin1").startsWith("v"), "en-tête de version de clé");
  assert.equal(compter(stocke, Buffer.from([0xff, 0xd8, 0xff])), 0, "jamais en clair sur le disque");
  const lu = await lireMedia(b, id, message.id);
  assert.equal(lu.statut, 200);
  assert.deepEqual(lu.octets, retirerMetadonneesJpeg(PHOTO));
  assert.deepEqual([lu.entetes.get("content-type"), lu.entetes.get("cache-control")], ["image/jpeg", "private, no-store"]);
  const rejoue = await envoyerMedia(a, id, PHOTO, "image/jpeg", idClient);
  assert.deepEqual([rejoue.statut, corps(rejoue).message.id], [200, message.id]);
  assert.equal([...banc.tables.messages.values()].filter((m) => m.idClient === idClient).length, 1);
  assert.equal(banc.social.medias.fichiers.size, [...banc.tables.messages.values()].filter((m) => m.fichier).length, "aucun fichier orphelin");
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.filter((p) => p.compteId === b.compteId).map((p) => p.message.texte), ["T'a envoyé une photo."]);
  // MPF : seulement l'image principale
  const mpo = await envoyerMedia(a, id, MPO, "image/jpeg");
  assert.deepEqual((await lireMedia(b, id, corps(mpo).message.id)).octets, retirerMetadonneesJpeg(MPO));
  // Un inconnu ne lit rien
  const intrus = await banc.creerPersonne();
  assert.equal((await lireMedia(intrus, id, message.id)).statut, 404);
});

test("note vocale : durée relue, position neutralisée ; une vidéo envoyée comme vocal : 415", async () => {
  const { a, b, id } = await deuxPotes();
  const vocal = fabriquerMp4();
  const envoi = await envoyerMedia(a, id, vocal, "audio/mp4");
  assert.equal(envoi.statut, 201, JSON.stringify(envoi.corps));
  assert.deepEqual([corps(envoi).message.type, corps(envoi).message.media.dureeSecondes, corps(envoi).message.media.typeMime], ["vocal", 12, "audio/mp4"]);
  const lu = await lireMedia(b, id, corps(envoi).message.id);
  assert.equal(lu.octets.length, vocal.length);
  assert.equal(compter(lu.octets, POSITION_ESSAI), 0);
  assert.equal(lu.entetes.get("content-type"), "audio/mp4");
  assert.equal((await envoyerMedia(a, id, fabriquerMp4({ metadonnees: false }), "audio/x-m4a")).statut, 201);
  assert.deepEqual(corps(await envoyerMedia(a, id, fabriquerMp4({ pistes: ["vide", "soun"] }), "audio/mp4")), { ok: false, erreur: "format-refuse" });
  assert.equal((await envoyerMedia(a, id, PHOTO, "audio/mp4")).statut, 415, "un JPEG annoncé comme vocal");
  assert.equal((await envoyerMedia(a, id, vocal, "image/jpeg")).statut, 415, "un M4A annoncé comme photo");
  assert.equal((await envoyerMedia(a, id, Buffer.from("bonjour"), "text/plain")).statut, 415);
});

test("tailles et formats : 5 Mo, 6 Mo, 4 096 px, 61 s, JPEG illisible, idClient manquant", async () => {
  const { a, id } = await deuxPotes();
  const jpegDe = (taille: number) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(taille - 4)]);
  assert.deepEqual(corps(await envoyerMedia(a, id, jpegDe(5 * 1024 * 1024 + 1), "image/jpeg")), { ok: false, erreur: "media-trop-lourd" });
  assert.deepEqual(corps(await envoyerMedia(a, id, jpegDe(6 * 1024 * 1024 + 10), "image/jpeg")), { ok: false, erreur: "media-trop-lourd" });
  const geante = Buffer.from(PHOTO);
  const sof = geante.indexOf(Buffer.from([0xff, 0xc0]));
  geante.writeUInt16BE(5000, sof + 7);
  assert.deepEqual(corps(await envoyerMedia(a, id, geante, "image/jpeg")), { ok: false, erreur: "media-invalide", champ: "dimensions" });
  assert.equal(corps(await envoyerMedia(a, id, jpegDe(2000), "image/jpeg")).champ, "format");
  assert.deepEqual(corps(await envoyerMedia(a, id, fabriquerMp4({ secondes: 62 }), "audio/mp4")), { ok: false, erreur: "media-invalide", champ: "duree" });
  assert.equal((await envoyerMedia(a, id, fabriquerMp4({ secondes: 61 }), "audio/mp4")).statut, 201, "60 s et la seconde de tolérance");
  assert.equal((await envoyerMedia(a, id, Buffer.concat([Buffer.alloc(4), Buffer.from("ftyp"), Buffer.alloc(4 * 1024 * 1024)]), "audio/mp4")).statut, 413);
  const sansCle = await demanderBrut(adresse, a.jeton, "POST", `/app/conversations/${id}/medias`, { octets: PHOTO, type: "image/jpeg" });
  assert.deepEqual(sansCle.corps, { ok: false, erreur: "champ-invalide", champ: "idClient" });
});

test("quotas : 50 médias par 24 h, 1 Go gardé par compte, envois simultanés qui ne dépassent jamais", async () => {
  const { a, id } = await deuxPotes();
  const maintenant = new Date(banc.horloge.maintenant);
  const ajouter = (champs: { taille: number; fichier: string | null }) => {
    const mid = prendreId(banc.tables, "messages");
    banc.tables.messages.set(mid, {
      id: mid, conversationId: Number(id), auteurId: a.compteId, type: "photo", idClient: randomUUID(), texteChiffre: null, typeMime: "image/jpeg",
      largeur: 1, hauteur: 1, dureeSecondes: null, mediaExpireLe: new Date(maintenant.getTime() + 90 * JOUR), creeLe: maintenant,
      supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null, ...champs,
    });
    return mid;
  };
  for (let i = 0; i < 48; i++) ajouter({ taille: 10, fichier: null });
  const ensemble = await Promise.all([1, 2, 3].map(() => envoyerMedia(a, id, PHOTO, "image/jpeg")));
  assert.deepEqual(ensemble.map((r) => r.statut).sort(), [201, 201, 409], "49e et 50e passent, la 51e non, même envoyées ensemble");
  assert.equal(corps(ensemble.find((r) => r.statut === 409)!).erreur, "trop-de-medias");
  banc.horloge.maintenant += JOUR + 1000;
  const gros = ajouter({ taille: 1024 * 1024 * 1024, fichier: `${randomUUID()}.bin` });
  assert.equal(corps(await envoyerMedia(a, id, PHOTO, "image/jpeg")).erreur, "trop-de-medias", "1 Go gardé");
  banc.tables.messages.get(gros)!.fichier = null;
  assert.equal((await envoyerMedia(a, id, PHOTO, "image/jpeg")).statut, 201, "le fichier parti ne compte plus");
});

test("disque à moins de 15 % : 503 stockage-plein avec Retry-After, rien d'écrit", async () => {
  const { a, id } = await deuxPotes();
  const avant = banc.social.medias.fichiers.size;
  banc.social.medias.reglerPartLibre(0.1);
  try {
    const r = await envoyerMedia(a, id, PHOTO, "image/jpeg");
    assert.deepEqual([r.statut, r.corps, r.entetes.get("retry-after")], [503, { ok: false, erreur: "stockage-plein" }, "3600"]);
    assert.equal(banc.social.medias.fichiers.size, avant);
  } finally {
    banc.social.medias.reglerPartLibre(0.5);
  }
});

test("410 après 90 jours, ou quand le média est suspendu (même gardé pour la modération) ; supprimer efface le fichier, sauf s'il est signalé", async () => {
  const { a, b, id } = await deuxPotes();
  const un = corps(await envoyerMedia(a, id, PHOTO, "image/jpeg")).message.id as string;
  const deux = corps(await envoyerMedia(a, id, PROGRESSIVE, "image/jpeg")).message.id as string;
  const fichierUn = banc.tables.messages.get(Number(un))!.fichier!;
  const fichierDeux = banc.tables.messages.get(Number(deux))!.fichier!;
  // Un signalement ouvert garde le fichier du message « deux », suspendu en attendant la modération
  const sid = prendreId(banc.tables, "signalements");
  banc.tables.signalements.set(sid, {
    id: sid, cible: "message", cibleId: deux, lieuId: null, raison: "choquant", precision: null, explication: "", source: "app", statut: "a-traiter",
    decision: null, motif: null, motivation: null, contestation: null, contesteLe: null, reexamineLe: null, creeLe: new Date(banc.horloge.maintenant),
    traiteLe: null, signaleParId: b.compteId, auteurContenuId: a.compteId, instantaneChiffre: null, fichierMedia: fichierDeux,
  });
  banc.tables.messages.get(Number(deux))!.suspenduLe = new Date(banc.horloge.maintenant);
  assert.deepEqual([(await lireMedia(b, id, deux)).statut, (await lireMedia(b, id, deux)).corps], [410, { ok: false, erreur: "media-expire" }]);
  await a.demander("DELETE", `/app/conversations/${id}/messages/${deux}`);
  await a.demander("DELETE", `/app/conversations/${id}/messages/${un}`);
  assert.ok(banc.social.medias.fichiers.has(fichierDeux), "gardé pour la modération");
  assert.ok(!banc.social.medias.fichiers.has(fichierUn), "effacé du disque");
  const trois = corps(await envoyerMedia(a, id, PHOTO, "image/jpeg")).message.id as string;
  banc.horloge.maintenant += 91 * JOUR;
  assert.equal((await lireMedia(b, id, trois)).statut, 410);
  const fil = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.equal(fil.messages.find((m: { id: string }) => m.id === trois).media.etat, "expire");
});

test("lecture d'un média (B.0) : 404 d'avant ton arrivée ou avec un blocage (dans les deux sens) ; 410 retiré par la modération", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne();
  const c = await banc.creerPersonne();
  banc.rendrePotes(lea, b);
  banc.rendrePotes(lea, c);
  const id = (await lea.demander("POST", "/app/conversations/groupes", { titre: "Photos", emoji: "📸", invites: [b.idPublic, c.idPublic], idClient: randomUUID() })).corps.conversation.id as string;
  await c.demander("POST", `/app/conversations/${id}/reponse`, { rejoint: true });
  const avant = corps(await envoyerMedia(lea, id, PHOTO, "image/jpeg")).message.id as string;
  await b.demander("POST", `/app/conversations/${id}/reponse`, { rejoint: true });
  const lu = await lireMedia(b, id, avant);
  assert.deepEqual([lu.statut, lu.corps], [404, { ok: false, erreur: "message-inconnu" }], "d'avant son arrivée");
  assert.equal((await lireMedia(c, id, avant)).statut, 200, "C était déjà là");
  const apres = corps(await envoyerMedia(lea, id, PROGRESSIVE, "image/jpeg")).message.id as string;
  assert.equal((await lireMedia(b, id, apres)).statut, 200);
  banc.bloquer(c, lea);
  assert.equal((await lireMedia(c, id, apres)).statut, 404, "C a bloqué Léa");
  const deC = corps(await envoyerMedia(c, id, PHOTO, "image/jpeg")).message.id as string;
  assert.equal((await lireMedia(lea, id, deC)).statut, 404, "dans l'autre sens aussi");
  assert.equal((await lireMedia(b, id, deC)).statut, 200);
  // Retenu par la modération (retireLe) : 410, même si le fichier est encore là
  banc.tables.messages.get(Number(apres))!.retireLe = new Date(banc.horloge.maintenant);
  const retire = await lireMedia(b, id, apres);
  assert.deepEqual([retire.statut, retire.corps], [410, { ok: false, erreur: "media-expire" }]);
});
