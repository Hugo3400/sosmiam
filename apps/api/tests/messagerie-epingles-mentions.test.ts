import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { MAX_CONVERSATIONS_EPINGLEES } from "../../../packages/commun/src/regles/chat.ts";
import type { LimitationActive } from "../src/services/limitations-comptes-regles.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";
import { demanderBrut, trouverAdresseBanc } from "./outils/demander-brut.ts";

const PHOTO = readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url));
const limites = new Map<number, LimitationActive>();

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let adresse = "";
before(async () => {
  banc = await creerBancSocial({ estLimite: async (compteId) => limites.get(compteId) ?? null });
  adresse = await trouverAdresseBanc(banc);
});
after(() => banc.fermer());

const ecrire = (p: PersonneDeTest, id: string, texte: string) => p.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte });
const epingler = (p: PersonneDeTest, id: string, epinglee: unknown) => p.demander("PUT", `/app/conversations/${id}/epingle`, { epinglee });
const lireFil = async (p: PersonneDeTest, id: string) => (await p.demander("GET", `/app/conversations/${id}`)).corps.fil;

async function prive(a: PersonneDeTest) {
  const b = await banc.creerPersonne();
  banc.rendrePotes(a, b);
  return { b, id: (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string };
}
async function groupe(admin: PersonneDeTest, membres: PersonneDeTest[]) {
  for (const m of membres) banc.rendrePotes(admin, m);
  const cree = await admin.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: membres.map((m) => m.idPublic), idClient: randomUUID() });
  assert.equal(cree.statut, 201, JSON.stringify(cree.corps));
  for (const m of membres) await m.demander("POST", `/app/conversations/${cree.corps.conversation.id}/reponse`, { rejoint: true });
  return cree.corps.conversation.id as string;
}

test("épingler : 3 au plus, rendues en tête de la première page (la dernière épinglée d'abord), sans changer la version", async () => {
  const moi = await banc.creerPersonne();
  const ids: string[] = [];
  for (let i = 0; i < MAX_CONVERSATIONS_EPINGLEES + 1; i++) ids.push((await prive(moi)).id);
  const version = (await lireFil(moi, ids[0]!)).version;
  for (const [i, id] of ids.slice(0, 3).entries()) {
    banc.horloge.maintenant += 1000 * (i + 1);
    assert.deepEqual([(await epingler(moi, id, true)).statut], [200]);
  }
  assert.equal((await epingler(moi, ids[0]!, true)).statut, 200, "déjà épinglée : rien de plus");
  assert.deepEqual([(await epingler(moi, ids[3]!, true)).statut, (await epingler(moi, ids[3]!, true)).corps.erreur], [409, "trop-d-epinglees"]);
  assert.equal((await lireFil(moi, ids[0]!)).version, version, "épingler ne concerne que toi");
  const page = (await moi.demander("GET", "/app/conversations")).corps;
  assert.deepEqual(page.epinglees.map((c: { id: string }) => c.id), [ids[2], ids[1], ids[0]]);
  assert.ok(page.epinglees.every((c: { epinglee: boolean }) => c.epinglee));
  assert.deepEqual(page.conversations.filter((c: { epinglee: boolean }) => c.epinglee).length, 3);
  assert.equal(page.conversations.find((c: { id: string }) => c.id === ids[3]).epinglee, false);
  assert.equal((await epingler(moi, ids[1]!, false)).statut, 200);
  assert.equal((await epingler(moi, ids[3]!, true)).statut, 200);
  assert.deepEqual((await moi.demander("GET", "/app/conversations")).corps.epinglees.map((c: { id: string }) => c.id), [ids[3], ids[2], ids[0]]);
  assert.equal((await epingler(moi, ids[0]!, "oui")).corps.champ, "epinglee");
  const intrus = await banc.creerPersonne();
  assert.equal((await epingler(intrus, ids[0]!, true)).statut, 404);
  const autre = await prive(intrus);
  assert.deepEqual((await epingler(autre.b, autre.id, true)).statut, 200, "chacun les siennes");
  assert.equal(banc.tables.membres.filter((m) => m.compteId === autre.b.compteId && m.epingleeLe).length, 1);
});

test("Vu : luJusqua d'un autre membre seulement si vous avez tous les deux les accusés de lecture ; lire fait alors monter la version", async () => {
  const a = await banc.creerPersonne();
  const { b, id } = await prive(a);
  const message = (await ecrire(a, id, "Tu viens ?")).corps;
  const avant = (await lireFil(a, id)).version;
  assert.equal((await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: message.message.id })).statut, 200);
  const fil = await lireFil(a, id);
  assert.equal(fil.version, avant + 1, "l'autre relit la discussion");
  const membreB = fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === b.idPublic);
  assert.equal(membreB.luJusqua, message.message.id);
  assert.equal(fil.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === a.idPublic).luJusqua, undefined, "jamais le sien dans la liste");
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: message.message.id });
  assert.equal((await lireFil(a, id)).version, avant + 1, "rien de neuf : la version ne bouge pas");

  await a.demander("PATCH", "/app/social/moi", { accusesLecture: false });
  const sansMoi = await lireFil(a, id);
  assert.equal(sansMoi.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === b.idPublic).luJusqua, undefined, "réciprocité");
  await a.demander("PATCH", "/app/social/moi", { accusesLecture: true });
  await b.demander("PATCH", "/app/social/moi", { accusesLecture: false });
  const second = (await ecrire(a, id, "Alors ?")).corps;
  const version = (await lireFil(a, id)).version;
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: second.message.id });
  const coupe = await lireFil(a, id);
  assert.equal(coupe.version, version, "coupé : lire ne se voit pas");
  assert.equal(coupe.conversation.membres.find((m: { personne: { id: string } }) => m.personne.id === b.idPublic).luJusqua, undefined);
  const ligneB = banc.tables.membres.find((m) => m.conversationId === Number(id) && m.compteId === b.compteId)!;
  assert.equal(ligneB.luJusqua, Number(second.message.id), "le lu avance quand même");
  assert.equal(ligneB.luLe, null, "mais l'heure de lecture n'est plus gardée");
});

test("mentions : @pseudo d'un membre (5 au plus, pas soi) ; prévenu même s'il a coupé, pas si pushSocial est coupé ; une cloche « mention »", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa", pseudo: "lea.gourmande" });
  const nina = await banc.creerPersonne({ prenom: "Nina", pseudo: "nina" });
  const malo = await banc.creerPersonne({ prenom: "Malo", pseudo: "malo.miam" });
  const tom = await banc.creerPersonne({ prenom: "Tom", pseudo: "tom.tom" });
  const dehors = await banc.creerPersonne({ pseudo: "pas.membre" });
  const id = await groupe(lea, [nina, malo, tom]);
  await nina.demander("PUT", `/app/conversations/${id}/notifications`, { coupees: true });
  await malo.demander("PUT", `/app/conversations/${id}/notifications`, { coupees: true });
  banc.tables.profils.get(malo.compteId)!.pushSocial = false;
  banc.pushs.length = 0;
  const envoi = await ecrire(lea, id, "@Nina et @malo.miam, on y va ? @pas.membre @lea.gourmande contact@nina.fr");
  assert.equal(envoi.statut, 201, JSON.stringify(envoi.corps));
  assert.deepEqual(envoi.corps.message.mentions, [nina.idPublic, malo.idPublic]);
  await banc.attendreEnvois();
  const pour = (p: PersonneDeTest) => banc.pushs.filter((x) => x.compteId === p.compteId).map((x) => [x.message.titre, x.message.texte]);
  assert.deepEqual(pour(nina), [["💬 Les gourmands", "Léa t'a mentionné."]], "coupée, mais mentionnée");
  assert.deepEqual(pour(malo), [], "pushSocial coupé : rien sur le téléphone");
  assert.deepEqual(pour(tom), [["💬 Les gourmands", "Léa a écrit."]]);
  assert.deepEqual(pour(lea), []);
  assert.ok(banc.pushs.every((x) => !x.message.texte.includes("on y va")), "jamais le texte");
  const cloche = [...banc.tables.cloche.values()].filter((n) => n.type === "mention" && n.cibleId === id);
  assert.deepEqual(cloche.map((n) => [n.compteId, n.acteurId, n.cible, n.detail]).sort(), [[nina.compteId, lea.compteId, "conversation", null], [malo.compteId, lea.compteId, "conversation", null]].sort());
  assert.equal(cloche.some((n) => n.compteId === dehors.compteId || n.compteId === lea.compteId), false);
  const vu = (await lireFil(tom, id)).messages.find((m: { id: string }) => m.id === envoi.corps.message.id);
  assert.deepEqual(vu.mentions, [nina.idPublic, malo.idPublic]);

  banc.pushs.length = 0;
  const modifie = await lea.demander("PATCH", `/app/conversations/${id}/messages/${envoi.corps.message.id}`, { texte: "@tom.tom finalement" });
  assert.deepEqual(modifie.corps.message.mentions, [tom.idPublic]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs, [], "une modification ne prévient personne");

  const { b, id: lePrive } = await prive(lea);
  assert.equal((await ecrire(lea, lePrive, `@${b.idPublic} et @nina`)).corps.message.mentions, undefined, "pas de mention dans un privé");
  banc.bloquer(nina, lea);
  banc.pushs.length = 0;
  await ecrire(lea, id, "@nina tu es là ?");
  await banc.attendreEnvois();
  assert.deepEqual(pour(nina), [], "un blocage coupe la mention");
});

test("mentions : 5 personnes au plus par message, et dans le petit mot d'une photo", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa", pseudo: "lea.cinq" });
  const membres: PersonneDeTest[] = [];
  for (let i = 0; i < 6; i++) membres.push(await banc.creerPersonne({ pseudo: `membre.${i}x` }));
  const id = await groupe(lea, membres);
  const envoi = await ecrire(lea, id, membres.map((_, i) => `@membre.${i}x`).join(" "));
  assert.deepEqual(envoi.corps.message.mentions, membres.slice(0, 5).map((m) => m.idPublic));
  banc.pushs.length = 0;
  await membres[0]!.demander("PUT", `/app/conversations/${id}/notifications`, { coupees: true });
  const photo = await demanderBrut(adresse, lea.jeton, "POST", `/app/conversations/${id}/medias`, {
    octets: PHOTO, type: "image/jpeg", entetes: { "Idempotency-Key": randomUUID(), "X-Legende": encodeURIComponent("Regarde @membre.0x !") },
  });
  assert.equal(photo.statut, 201, JSON.stringify(photo.corps));
  assert.deepEqual((photo.corps as { message: { mentions: string[] } }).message.mentions, [membres[0]!.idPublic]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.filter((p) => p.compteId === membres[0]!.compteId).map((p) => p.message.texte), ["Léa t'a mentionné."]);
});

test("compte limité : modifier un message et la photo du groupe refusés ; épingler et retirer la photo permis", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const malo = await banc.creerPersonne();
  const id = await groupe(lea, [malo]);
  const message = (await ecrire(lea, id, "Avant")).corps.message;
  const pose = await demanderBrut(adresse, lea.jeton, "PUT", `/app/conversations/${id}/photo`, { octets: PHOTO, type: "image/jpeg" });
  assert.equal(pose.statut, 200);
  limites.set(lea.compteId, { jusqua: null, motif: "harcelement" });
  assert.equal((await lea.demander("PATCH", `/app/conversations/${id}/messages/${message.id}`, { texte: "Après" })).corps.erreur, "compte-limite");
  assert.equal((await demanderBrut(adresse, lea.jeton, "PUT", `/app/conversations/${id}/photo`, { octets: PHOTO, type: "image/jpeg" })).statut, 403);
  assert.equal((await epingler(lea, id, true)).statut, 200);
  assert.equal((await lea.demander("DELETE", `/app/conversations/${id}/photo`)).statut, 200);
  assert.equal((await lea.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: message.id })).statut, 200);
  limites.delete(lea.compteId);
});
