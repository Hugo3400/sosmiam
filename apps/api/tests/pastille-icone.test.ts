import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { MAX_PASTILLE_ICONE } from "../../../packages/commun/src/regles/chat.ts";
import { construireCorpsGoogle, construireEnvoiApple, type MessagePush } from "../src/services/notifications/expedier-push.ts";
import { creerLecteurPastille } from "../src/services/notifications/lire-pastille-compte.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial } from "./outils/creer-banc-social.ts";

process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { brancherPastillePush, prevenirCompte, prevenirCompteEtCompter } = await import("../src/services/notifications/prevenir-compte.ts");

const MESSAGE: MessagePush = { titre: "💬 Léa", texte: "Nouveau message. Viens voir !", lien: "/potes/discussion/3", regroupement: "conversation:3" };

function table(telephones: { id: number; jeton: string; plateforme: string }[]) {
  return {
    findMany: async () => telephones,
    update: async () => undefined,
  } as never;
}

test("pastille : aps.badge chez Apple, android.notification.notification_count chez Google ; rien sans elle", () => {
  const apple = JSON.parse(construireEnvoiApple({ ...MESSAGE, badge: 7 }).corps);
  assert.equal(apple.aps.badge, 7);
  assert.equal(JSON.parse(construireEnvoiApple({ ...MESSAGE, badge: 0 }).corps).aps.badge, 0, "0 efface la pastille");
  assert.equal("badge" in JSON.parse(construireEnvoiApple(MESSAGE).corps).aps, false);
  assert.equal(construireCorpsGoogle("jeton", { ...MESSAGE, badge: 7 }).message.android.notification.notification_count, 7);
  assert.equal(construireCorpsGoogle("jeton", { ...MESSAGE, badge: 3, sonore: false }).message.android.notification.notification_count, 3, "même muette");
  assert.equal("notification_count" in construireCorpsGoogle("jeton", MESSAGE).message.android.notification, false);
});

test("prevenirCompte : la pastille du compte lue une fois pour tous ses téléphones ; en panne ou pas branchée, la notification part sans elle", async (t) => {
  const envois: { jeton: string; badge?: number }[] = [];
  const envoyer = async (appareil: { jeton: string }, message: MessagePush) => (envois.push({ jeton: appareil.jeton, badge: message.badge }), "envoyee" as const);
  const deux = table([{ id: 1, jeton: "iphone", plateforme: "ios" }, { id: 2, jeton: "android", plateforme: "android" }]);
  let lectures = 0;
  const lire = async (compteId: number) => (lectures += 1, compteId === 7 ? 12 : 0);
  assert.equal(await prevenirCompteEtCompter(7, MESSAGE, envoyer, deux, lire), 2);
  assert.deepEqual([envois, lectures], [[{ jeton: "iphone", badge: 12 }, { jeton: "android", badge: 12 }], 1]);
  envois.length = 0;
  await prevenirCompte(7, MESSAGE, envoyer, table([]), lire);
  assert.deepEqual([envois, lectures], [[], 1], "aucun téléphone : rien n'est compté");
  await prevenirCompte(7, { ...MESSAGE, badge: 4 }, envoyer, deux, lire);
  assert.deepEqual([envois.map((e) => e.badge), lectures], [[4, 4], 1], "déjà posée : pas relue");
  envois.length = 0;
  const journal = t.mock.method(console, "error", () => {});
  await prevenirCompte(7, MESSAGE, envoyer, deux, async () => { throw new Error("SELECT … 'Coucou' …"); });
  assert.deepEqual(envois.map((e) => e.badge), [undefined, undefined], "la pastille en panne ne retient pas la notification");
  assert.ok(!JSON.stringify(journal.mock.calls).includes("Coucou"));
  envois.length = 0;
  await prevenirCompte(7, MESSAGE, envoyer, deux);
  assert.deepEqual(envois.map((e) => e.badge), [undefined, undefined], "pas branchée (les essais, une campagne) : pas de pastille");
  brancherPastillePush(async () => 5);
  try {
    envois.length = 0;
    await prevenirCompte(7, MESSAGE, envoyer, deux);
    assert.deepEqual(envois.map((e) => e.badge), [5, 5], "branchée au démarrage");
  } finally {
    brancherPastillePush(null);
  }
});

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

test("pastille du compte : messages non lus (privés, groupes, sorties) + invitations (groupes, sorties) + cloche pas vue, 99 au plus", async () => {
  const lire = creerLecteurPastille(banc.social.dependances.social.lirePouls, () => banc.horloge.maintenant);
  const moi = await banc.creerPersonne();
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  banc.rendrePotes(moi, lea);
  assert.equal(await lire(moi.compteId), 0);
  const prive = (await lea.demander("POST", "/app/conversations/prive", { personne: moi.idPublic })).corps.conversation.id;
  for (const texte of ["Coucou", "Tu viens ?"]) await lea.demander("POST", `/app/conversations/${prive}/messages`, { idClient: randomUUID(), type: "texte", texte });
  await lea.demander("POST", "/app/conversations/groupes", { titre: "Les gourmands", emoji: "🍕", invites: [moi.idPublic], idClient: randomUUID() });
  banc.tables.lieux.set(4242, { statut: "publie", nom: "Le Bouiboui" });
  const quand = new Date(banc.horloge.maintenant + 3 * 3_600_000).toISOString();
  const finVote = new Date(banc.horloge.maintenant + 3_600_000).toISOString();
  const s = await lea.demander("POST", "/app/sorties", { titre: "Pizza", emoji: "🍕", quand, finVote, invites: [moi.idPublic], lieux: [4242], idClient: randomUUID() });
  assert.equal(s.statut, 201, JSON.stringify(s.corps));
  const pouls = await banc.social.dependances.social.lirePouls(moi.compteId, new Date(banc.horloge.maintenant));
  const attendu = pouls.messages.nonLus + pouls.messages.invitations + pouls.sorties.nonLus + pouls.sorties.invitations + pouls.cloche.nonVues;
  assert.deepEqual([pouls.messages.nonLus, pouls.messages.invitations, pouls.sorties.invitations], [2, 1, 1]);
  assert.ok(pouls.cloche.nonVues >= 2, "les invitations sont aussi dans la cloche");
  assert.equal(await lire(moi.compteId), attendu);
  const modele = [...banc.tables.messages.values()].find((m) => m.conversationId === Number(prive))!;
  for (let i = 0; i < 120; i++) {
    const id = prendreId(banc.tables, "messages");
    banc.tables.messages.set(id, { ...modele, id, idClient: randomUUID() });
  }
  assert.equal(await lire(moi.compteId), MAX_PASTILLE_ICONE);
});
