import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { MAX_PHOTOS_ALBUM } from "../../../packages/commun/src/regles/chat.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";
import { demanderBrut, trouverAdresseBanc } from "./outils/demander-brut.ts";
import { fabriquerMp4 } from "./outils/fabriquer-mp4.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url));
const ONDE = "012345678998765432100123456789987654321001234567";
const JOUR = 24 * 60 * 60 * 1000;

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let adresse = "";
before(async () => {
  banc = await creerBancSocial();
  adresse = await trouverAdresseBanc(banc);
  banc.tables.lieux.set(61, { statut: "publie", nom: "Le Bouiboui" });
});
after(() => banc.fermer());

const corps = (r: { corps: Record<string, unknown> | null }) => r.corps as Record<string, any>;
const envoyer = (p: PersonneDeTest, id: string, octets: Uint8Array, type: string, entetes: Record<string, string> = {}, idClient = randomUUID()) =>
  demanderBrut(adresse, p.jeton, "POST", `/app/conversations/${id}/medias`, { octets, type, entetes: { "Idempotency-Key": idClient, ...entetes } });
const photoGroupe = (p: PersonneDeTest, id: string, octets: Uint8Array = PHOTO, type = "image/jpeg") =>
  demanderBrut(adresse, p.jeton, "PUT", `/app/conversations/${id}/photo`, { octets, type });

async function deuxPotes() {
  const a = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne({ prenom: "Malo" });
  banc.rendrePotes(a, b);
  const id = (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string;
  return { a, b, id };
}
async function groupe() {
  const admin = await banc.creerPersonne({ prenom: "Léa" });
  const membre = await banc.creerPersonne({ prenom: "Malo" });
  banc.rendrePotes(admin, membre);
  const conversation = (await admin.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [membre.idPublic], idClient: randomUUID() })).corps.conversation;
  await membre.demander("POST", `/app/conversations/${conversation.id}/reponse`, { rejoint: true });
  return { admin, membre, id: conversation.id as string };
}

test("plusieurs photos d'un coup : un album (10 au plus), un petit mot chiffré, une seule notification", async () => {
  const { a, b, id } = await deuxPotes();
  banc.pushs.length = 0;
  const album = randomUUID();
  const legende = "Regarde ces pâtes 🍝 & co !";
  const premiere = await envoyer(a, id, PHOTO, "image/jpeg", { "X-Album": album, "X-Legende": encodeURIComponent(legende) });
  assert.equal(premiere.statut, 201, JSON.stringify(premiere.corps));
  const message = corps(premiere).message;
  assert.deepEqual([message.album, message.legende, message.texte, message.type], [album, legende, null, "photo"]);
  const ligne = banc.tables.messages.get(Number(message.id))!;
  assert.ok(ligne.texteChiffre && !ligne.texteChiffre.includes("pâtes"), "petit mot chiffré en base");
  assert.equal(banc.social.dependances.chiffrement!.dechiffrerMessage(ligne.texteChiffre!, Number(id), ligne.idClient), legende);
  for (let i = 1; i < MAX_PHOTOS_ALBUM; i++) assert.equal((await envoyer(a, id, PHOTO, "image/jpeg", { "X-Album": album })).statut, 201);
  const plein = await envoyer(a, id, PHOTO, "image/jpeg", { "X-Album": album });
  assert.deepEqual([plein.statut, corps(plein).erreur], [409, "album-plein"]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.filter((p) => p.compteId === b.compteId).map((p) => p.message.texte), ["T'a envoyé une photo."], "seule la première photo de l'album prévient");
  const fil = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.equal(fil.messages.filter((m: { album?: string }) => m.album === album).length, MAX_PHOTOS_ALBUM);
  assert.equal(fil.messages.find((m: { id: string }) => m.id === message.id).legende, legende);
  const intrus = await envoyer(b, id, PHOTO, "image/jpeg", { "X-Album": album });
  assert.deepEqual([intrus.statut, corps(intrus).champ], [400, "album"], "l'album d'un autre");
  const exporte = (await a.demander("GET", "/app/social/export")).corps.export;
  const mesPhotos = exporte.conversations.find((c: { id: string }) => c.id === id).messages.filter((m: { type: string }) => m.type === "photo");
  assert.deepEqual(mesPhotos.map((m: { texte: string | null }) => m.texte), [legende, ...Array(MAX_PHOTOS_ALBUM - 1).fill(null)], "le petit mot dans « Télécharger mes données »");
});

test("petit mot et album : formes refusées ; mot interdit ; l'onde d'une note vocale (16 à 48 chiffres)", async () => {
  const { a, b, id } = await deuxPotes();
  const refus = async (octets: Uint8Array, type: string, entetes: Record<string, string>) => {
    const r = await envoyer(a, id, octets, type, entetes);
    return [r.statut, corps(r).erreur, corps(r).champ];
  };
  assert.deepEqual(await refus(PHOTO, "image/jpeg", { "X-Album": "pas-un-uuid" }), [400, "champ-invalide", "album"]);
  assert.deepEqual(await refus(PHOTO, "image/jpeg", { "X-Legende": "%E0%A4%A" }), [400, "champ-invalide", "legende"]);
  assert.deepEqual(await refus(PHOTO, "image/jpeg", { "X-Legende": encodeURIComponent("x".repeat(501)) }), [400, "champ-invalide", "legende"]);
  assert.deepEqual(await refus(PHOTO, "image/jpeg", { "X-Legende": encodeURIComponent("Quel connard") }), [400, "message-refuse", "legende"]);
  assert.deepEqual(await refus(PHOTO, "image/jpeg", { "X-Onde": ONDE }), [400, "onde-invalide", undefined]);
  const vocal = fabriquerMp4();
  assert.deepEqual(await refus(vocal, "audio/mp4", { "X-Legende": "Coucou" }), [400, "champ-invalide", "legende"]);
  assert.deepEqual(await refus(vocal, "audio/mp4", { "X-Album": randomUUID() }), [400, "champ-invalide", "album"]);
  for (const onde of ["123", "1".repeat(49), "12345678901234ab"]) assert.deepEqual(await refus(vocal, "audio/mp4", { "X-Onde": onde }), [400, "onde-invalide", undefined], onde);
  const sansMot = corps(await envoyer(a, id, PHOTO, "image/jpeg", { "X-Legende": "" })).message;
  assert.deepEqual([sansMot.legende, banc.tables.messages.get(Number(sansMot.id))!.texteChiffre], [undefined, null]);
  const note = await envoyer(a, id, vocal, "audio/mp4", { "X-Onde": ONDE });
  assert.equal(note.statut, 201, JSON.stringify(note.corps));
  assert.equal(corps(note).message.media.onde, ONDE);
  assert.equal(banc.tables.messages.get(Number(corps(note).message.id))!.onde, ONDE);
  const lue = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.find((m: { id: string }) => m.id === corps(note).message.id);
  assert.equal(lue.media.onde, ONDE);
  assert.equal(corps(await envoyer(a, id, vocal, "audio/mp4")).message.media.onde, undefined);
});

test("photo du groupe : admins seulement, nettoyée, chiffrée, remplacée puis retirée ; lue par les membres, jamais en cache", async () => {
  const { admin, membre, id } = await groupe();
  const version = (await admin.demander("GET", `/app/conversations/${id}`)).corps.fil.version;
  assert.equal((await admin.demander("GET", `/app/conversations/${id}`)).corps.fil.conversation.photo, false);
  assert.deepEqual([(await photoGroupe(membre, id)).statut, corps(await photoGroupe(membre, id)).erreur], [403, "reserve-aux-admins"]);
  assert.equal((await demanderBrut(adresse, admin.jeton, "GET", `/app/conversations/${id}/photo`)).statut, 404);
  const pose = await photoGroupe(admin, id);
  assert.equal(pose.statut, 200, JSON.stringify(pose.corps));
  assert.equal(corps(pose).conversation.photo, true);
  assert.ok(corps(pose).conversation.version > version);
  const fichier = banc.tables.conversations.get(Number(id))!.photo!;
  const stocke = banc.social.medias.fichiers.get(fichier)!.octets;
  assert.equal(stocke.indexOf(Buffer.from([0xff, 0xd8, 0xff])), -1, "jamais en clair sur le disque");
  const lue = await demanderBrut(adresse, membre.jeton, "GET", `/app/conversations/${id}/photo`);
  assert.equal(lue.statut, 200);
  assert.deepEqual(lue.octets, retirerMetadonneesJpeg(PHOTO));
  assert.deepEqual([lue.entetes.get("content-type"), lue.entetes.get("cache-control")], ["image/jpeg", "private, no-store"]);
  const intrus = await banc.creerPersonne();
  assert.equal((await demanderBrut(adresse, intrus.jeton, "GET", `/app/conversations/${id}/photo`)).statut, 404);
  assert.equal((await photoGroupe(admin, id, Buffer.from("pas une image"), "image/jpeg")).statut, 415);
  assert.equal((await photoGroupe(admin, id, fabriquerMp4(), "audio/mp4")).statut, 415);
  assert.equal((await photoGroupe(admin, id)).statut, 200);
  const nouveau = banc.tables.conversations.get(Number(id))!.photo!;
  assert.notEqual(nouveau, fichier);
  assert.equal(banc.social.medias.fichiers.has(fichier), false, "l'ancienne photo part du disque");
  assert.equal((await membre.demander("DELETE", `/app/conversations/${id}/photo`)).corps.erreur, "reserve-aux-admins");
  const retire = await admin.demander("DELETE", `/app/conversations/${id}/photo`);
  assert.deepEqual([retire.statut, retire.corps.conversation.photo], [200, false]);
  assert.equal(banc.social.medias.fichiers.has(nouveau), false);
  assert.equal(banc.tables.conversations.get(Number(id))!.photo, null);

  assert.equal((await photoGroupe(intrus, id)).statut, 404);
  const { a, id: prive } = await deuxPotes();
  assert.equal((await photoGroupe(a, prive)).statut, 404);
});

test("photo du groupe : discussion d'une sortie refusée, quotas d'un média, effacée avec le groupe", async () => {
  const { admin, membre, id } = await groupe();
  const sortieConversation = Number(id) + 100_000;
  banc.tables.conversations.set(sortieConversation, {
    id: sortieConversation, type: "sortie", clePrive: null, titreChiffre: null, emoji: null, photo: null, creeParId: admin.compteId, version: 0,
    dernierMessageLe: new Date(banc.horloge.maintenant), modifieLe: new Date(banc.horloge.maintenant), creeLe: new Date(banc.horloge.maintenant),
  });
  banc.tables.membres.push({ conversationId: sortieConversation, compteId: admin.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: new Date(banc.horloge.maintenant), epingleeLe: null });
  assert.deepEqual([(await photoGroupe(admin, String(sortieConversation))).statut, corps(await photoGroupe(admin, String(sortieConversation))).erreur], [409, "geree-par-la-sortie"]);
  banc.social.medias.reglerPartLibre(0.1);
  assert.equal((await photoGroupe(admin, id)).statut, 503, "le disque presque plein compte aussi");
  banc.social.medias.reglerPartLibre(0.5);
  assert.equal((await photoGroupe(admin, id)).statut, 200);
  const fichier = banc.tables.conversations.get(Number(id))!.photo!;
  await membre.demander("DELETE", `/app/conversations/${id}/membres/moi`);
  await admin.demander("DELETE", `/app/conversations/${id}/membres/moi`);
  assert.equal(banc.tables.conversations.has(Number(id)), false);
  assert.equal(banc.social.medias.fichiers.has(fichier), false, "le groupe effacé emporte sa photo");
});

test("partages : photos et lieux d'une conversation, le plus récent d'abord, 30 par page, sans les expirés, supprimés ni masqués", async () => {
  const { a, b, id } = await deuxPotes();
  const maintenant = new Date(banc.horloge.maintenant);
  const poser = () => {
    const mid = prendreId(banc.tables, "messages");
    banc.tables.messages.set(mid, {
      id: mid, conversationId: Number(id), auteurId: a.compteId, type: "photo", idClient: randomUUID(), texteChiffre: null, fichier: `${randomUUID()}.bin`,
      typeMime: "image/jpeg", taille: 10, largeur: 1, hauteur: 1, dureeSecondes: null, mediaExpireLe: new Date(maintenant.getTime() + 90 * JOUR), creeLe: maintenant,
      supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null,
    });
    return String(mid);
  };
  const photos: string[] = [];
  for (let i = 0; i < 32; i++) photos.push(poser());
  for (let i = 0; i < 3; i++) await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte: `Texte ${i}` });
  const lieux: string[] = [];
  for (let i = 0; i < 2; i++) lieux.push((await b.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 61, texte: null })).corps.message.id);
  await a.demander("DELETE", `/app/conversations/${id}/messages/${photos[31]}`);
  banc.tables.messages.get(Number(photos[30]))!.suspenduLe = new Date(banc.horloge.maintenant);
  banc.tables.messages.get(Number(photos[0]))!.mediaExpireLe = new Date(banc.horloge.maintenant - JOUR);
  const page = await b.demander("GET", `/app/conversations/${id}/partages?type=photo`);
  assert.equal(page.statut, 200, JSON.stringify(page.corps));
  assert.deepEqual(page.corps.messages.map((m: { id: string }) => m.id), photos.slice(1, 30).reverse());
  assert.equal(page.corps.suite, null);
  const lus = await b.demander("GET", `/app/conversations/${id}/partages?type=lieu`);
  assert.deepEqual([lus.corps.messages.map((m: { id: string }) => m.id), lus.corps.messages[0].lieuId], [[...lieux].reverse(), 61]);
  for (let i = 0; i < 2; i++) poser();
  const premiere = await b.demander("GET", `/app/conversations/${id}/partages?type=photo`);
  assert.equal(premiere.corps.messages.length, 30);
  assert.ok(premiere.corps.suite);
  const suivante = await b.demander("GET", `/app/conversations/${id}/partages?type=photo&avant=${premiere.corps.suite}`);
  assert.deepEqual([suivante.corps.messages.length, suivante.corps.suite], [1, null]);
  assert.equal((await b.demander("GET", `/app/conversations/${id}/partages?type=vocal`)).corps.champ, "type");
  assert.equal((await b.demander("GET", `/app/conversations/${id}/partages?type=photo&avant=abc`)).corps.champ, "avant");
  const intrus = await banc.creerPersonne();
  assert.equal((await intrus.demander("GET", `/app/conversations/${id}/partages?type=photo`)).statut, 404);
  banc.bloquer(b, a);
  assert.equal((await b.demander("GET", `/app/conversations/${id}/partages?type=photo`)).statut, 404, "un privé avec un blocage disparaît");
});
