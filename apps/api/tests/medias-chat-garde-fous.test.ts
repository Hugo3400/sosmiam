import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { controlerMediaChat, preparerMediaChat } from "../src/controleurs/conversations-medias.ts";
import { LIMITE_ENVOIS_MEDIAS_IP } from "../src/middlewares/limiter-envois-medias.ts";
import type { MediaRecu } from "../src/services/messagerie-regles.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";
import { demanderBrut, trouverAdresseBanc } from "./outils/demander-brut.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url));
const ABIMEE = PHOTO.subarray(0, PHOTO.length - 40);
const JOUR = 24 * 60 * 60 * 1000;

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let adresse = "";
before(async () => {
  banc = await creerBancSocial();
  adresse = await trouverAdresseBanc(banc);
});
after(() => banc.fermer());

const envoyerMedia = (p: PersonneDeTest, id: string, octets: Uint8Array, o: { idClient?: string; ip?: string; type?: string } = {}) =>
  demanderBrut(adresse, p.jeton, "POST", `/app/conversations/${id}/medias`, {
    octets, type: o.type ?? "image/jpeg", entetes: { "Idempotency-Key": o.idClient ?? randomUUID(), ...(o.ip ? { "X-IP-Visiteur": o.ip } : {}) },
  });

async function deuxPotes() {
  const a = await banc.creerPersonne();
  const b = await banc.creerPersonne();
  banc.rendrePotes(a, b);
  const id = String((await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id);
  return { a, b, id };
}

async function groupeSeul(a: PersonneDeTest, pote: PersonneDeTest, titre: string) {
  const g = await a.demander("POST", "/app/conversations/groupes", { titre, emoji: "🍕", invites: [pote.idPublic], idClient: randomUUID() });
  return String(g.corps.conversation.id);
}

async function remplirQuota(a: PersonneDeTest, id: string) {
  const media = await preparerMediaChat(PHOTO, controlerMediaChat(PHOTO, "image/jpeg"));
  const idClients: string[] = [];
  for (let i = 0; i < 50; i++) {
    const idClient = randomUUID();
    const r = await banc.social.dependances.messagerie.envoyerMedia(a.compteId, Number(id), { ...media, idClient } as MediaRecu, new Date(banc.horloge.maintenant));
    assert.ok(r.ok, `média ${i + 1}`);
    idClients.push(idClient);
  }
  return idClients;
}

test("une photo abîmée hors de ses conversations : 404 avant tout décodage ; dans une conversation fermée : 403 ; membre : 400", async () => {
  const { a, b, id } = await deuxPotes();
  const intrus = await banc.creerPersonne();
  for (const [qui, conversation] of [[intrus, "424242"], [intrus, id]] as const) {
    const r = await envoyerMedia(qui, conversation, ABIMEE);
    assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "conversation-inconnue" }], conversation);
  }
  const membre = await envoyerMedia(a, id, ABIMEE);
  assert.deepEqual([membre.statut, membre.corps], [400, { ok: false, erreur: "media-invalide", champ: "format" }]);
  banc.tables.bande.splice(0, banc.tables.bande.length, ...banc.tables.bande.filter((l) => ![a.compteId, b.compteId].includes(l.compteId)));
  const fermee = await envoyerMedia(a, id, ABIMEE);
  assert.deepEqual([fermee.statut, fermee.corps], [403, { ok: false, erreur: "conversation-fermee" }]);
});

test("quota de 50 médias par 24 h : vérifié avant le décodage, un envoi rejoué passe encore, et effacer la conversation ne rend rien", async () => {
  const a = await banc.creerPersonne();
  const pote = await banc.creerPersonne();
  banc.rendrePotes(a, pote);
  const premier = await groupeSeul(a, pote, "Seul 1");
  const idClients = await remplirQuota(a, premier);
  const trop = await envoyerMedia(a, premier, ABIMEE);
  assert.deepEqual([trop.statut, trop.corps], [409, { ok: false, erreur: "trop-de-medias" }], "refusé avant de décoder la photo abîmée");
  assert.equal((await envoyerMedia(a, premier, PHOTO, { idClient: idClients[49] })).statut, 200, "le 50e, rejoué");
  assert.equal((await a.demander("DELETE", `/app/conversations/${premier}/membres/moi`)).statut, 200);
  assert.equal([...banc.tables.messages.values()].filter((m) => m.auteurId === a.compteId).length, 0, "la conversation et ses médias sont bien partis");
  const second = await groupeSeul(a, pote, "Seul 2");
  const apres = await envoyerMedia(a, second, PHOTO);
  assert.deepEqual([apres.statut, apres.corps], [409, { ok: false, erreur: "trop-de-medias" }]);
  const r = await banc.social.dependances.messagerie.envoyerMedia(
    a.compteId, Number(second), { ...(await preparerMediaChat(PHOTO, controlerMediaChat(PHOTO, "image/jpeg"))), idClient: randomUUID() } as MediaRecu,
    new Date(banc.horloge.maintenant),
  );
  assert.deepEqual(r, { ok: false, erreur: "trop-de-medias" }, "le service refuse aussi, sous le verrou du compte");
  banc.horloge.maintenant += JOUR + 1000;
  assert.equal((await envoyerMedia(a, second, PHOTO)).statut, 201, "24 h plus tard, le quota revient");
});

test(`envois de médias : ${LIMITE_ENVOIS_MEDIAS_IP.maximum} par IP en 10 min, quel que soit le compte, puis 429`, async () => {
  const ip = `203.0.113.${Math.floor(Math.random() * 250)}`;
  const personnes = await Promise.all(Array.from({ length: 7 }, () => banc.creerPersonne()));
  const pasUneImage = Buffer.from("pas une image");
  for (let i = 0; i < LIMITE_ENVOIS_MEDIAS_IP.maximum; i++) {
    const r = await envoyerMedia(personnes[i % personnes.length]!, "424242", pasUneImage, { ip });
    assert.equal(r.statut, 415, `envoi ${i + 1}`);
  }
  const refus = await envoyerMedia(personnes[0]!, "424242", pasUneImage, { ip });
  assert.deepEqual([refus.statut, refus.corps], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(refus.entetes.get("retry-after")) > 0);
  assert.equal((await envoyerMedia(personnes[0]!, "424242", pasUneImage, { ip: "198.51.100.9" })).statut, 415, "une autre IP passe");
});
