// Tests de la messagerie (/app/conversations) : privé seulement entre potes, textes, lieux et titres chiffrés en base,
// idempotence (idClient), versions, pages, non-lus, accès croisés, blocages dans les deux sens, suppression, réactions,
// compte supprimé, sans clé. Les groupes sur invitation sont dans messagerie-groupes.test.ts. Tout en mémoire, clé de test.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { calculerClePrive } from "../src/fonctions/social/calculer-cle-prive.ts";
import { ecrirePushMessage } from "../src/fonctions/social/ecrire-push-message.ts";
import { presenterMessage, type LigneMessage } from "../src/fonctions/social/presenter-message.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
  banc.tables.lieux.set(12, { statut: "publie", nom: "Chez Léa" });
  banc.tables.lieux.set(13, { statut: "brouillon" });
});
after(() => banc.fermer());

/** Deux potes et leur discussion privée */
async function deuxPotes(prenoms: [string, string] = ["Léa", "Malo"]) {
  const a = await banc.creerPersonne({ prenom: prenoms[0] });
  const b = await banc.creerPersonne({ prenom: prenoms[1] });
  banc.rendrePotes(a, b);
  const ouvert = await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic });
  assert.equal(ouvert.statut, 201, JSON.stringify(ouvert.corps));
  return { a, b, id: ouvert.corps.conversation.id as string };
}
const ecrire = (p: PersonneDeTest, id: string, texte: string, idClient = randomUUID()) =>
  p.demander("POST", `/app/conversations/${id}/messages`, { idClient, type: "texte", texte });

test("fonctions : clé d'un privé, notification sans contenu, états d'un message", () => {
  assert.equal(calculerClePrive(9, 4), "4-9");
  assert.equal(calculerClePrive(4, 9), "4-9");
  const prive = ecrirePushMessage({ prenom: "Léa", type: "photo", conversation: { id: 3, type: "prive", titre: null } });
  assert.deepEqual(prive, { titre: "💬 Léa", texte: "T'a envoyé une photo.", lien: "/potes/discussion/3", regroupement: "conversation:3", categorie: "message" });
  const groupe = ecrirePushMessage({ prenom: "Léa", type: "texte", conversation: { id: 4, type: "groupe", titre: "Les gourmands" } });
  assert.deepEqual([groupe.titre, groupe.texte], ["💬 Les gourmands", "Léa a écrit."]);
  const sortie = ecrirePushMessage({ prenom: "Léa", type: "texte", conversation: { id: 5, type: "sortie", titre: "Pizza du jeudi" }, sortieId: 8 });
  assert.deepEqual([sortie.titre, sortie.texte, sortie.lien], ["🎉 Pizza du jeudi", "Léa a écrit dans la discussion.", "/potes/sortie/8"]);
  const base: LigneMessage = {
    id: 7, conversationId: 3, auteurId: 1, type: "photo", idClient: randomUUID(), texteChiffre: null, fichier: "x.bin", typeMime: "image/jpeg",
    taille: 10, largeur: 4, hauteur: 3, dureeSecondes: null, mediaExpireLe: new Date("2027-01-01T00:00:00Z"), creeLe: new Date("2026-10-14T10:00:00Z"),
    supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null,
  };
  const o = { auteur: null, contenu: { texte: null, lieuId: null }, reactions: { coeur: ["abcdefghij"] }, maintenant: new Date("2026-10-15T00:00:00Z") };
  assert.equal(presenterMessage(base, o).media?.etat, "disponible");
  assert.equal(presenterMessage(base, { ...o, maintenant: new Date("2027-02-01T00:00:00Z") }).media?.etat, "expire");
  const masque = presenterMessage({ ...base, suspenduLe: new Date() }, o);
  assert.deepEqual([masque.etat, masque.media, masque.reactions], ["masque", null, {}]);
  assert.equal(presenterMessage({ ...base, type: "texte" }, { ...o, contenu: "illisible" }).etat, "illisible");
});

test("privé : seulement entre potes ; une seule discussion par paire, dans les deux sens", async () => {
  const { a, b, id } = await deuxPotes();
  const encore = await b.demander("POST", "/app/conversations/prive", { personne: a.idPublic });
  assert.deepEqual([encore.statut, encore.corps.conversation.id], [200, id]);
  assert.equal(encore.corps.conversation.autre.id, a.idPublic);
  const inconnu = await banc.creerPersonne();
  assert.equal((await a.demander("POST", "/app/conversations/prive", { personne: inconnu.idPublic })).corps.erreur, "pas-dans-la-bande");
  assert.equal((await a.demander("POST", "/app/conversations/prive", { personne: a.idPublic })).statut, 400);
  assert.equal((await a.demander("POST", "/app/conversations/prive", { personne: "zzzzzzzzzz" })).statut, 404);
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await sansPseudo.demander("POST", "/app/conversations/prive", { personne: a.idPublic })).statut, 409, "pseudo-requis");
});

test("textes et lieux chiffrés en base, tels quels ; la notification ne dit le texte que dans l'aperçu, chiffré ensuite pour le téléphone", async () => {
  const { a, b, id } = await deuxPotes();
  banc.pushs.length = 0;
  const texte = "Rendez-vous chez Léa à 20 h, j'ai faim 🍕";
  const envoi = await ecrire(a, id, texte);
  assert.equal(envoi.statut, 201);
  assert.deepEqual([envoi.corps.message.texte, envoi.corps.message.etat, envoi.corps.message.auteur.id], [texte, "visible", a.idPublic]);
  const ligne = banc.tables.messages.get(Number(envoi.corps.message.id))!;
  assert.match(ligne.texteChiffre!, /^v\d+:/);
  assert.ok(!ligne.texteChiffre!.includes("Rendez-vous"));
  const lieu = await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 12, texte: "Le meilleur kebab" });
  assert.deepEqual([lieu.statut, lieu.corps.message.lieuId, lieu.corps.message.texte, lieu.corps.message.type], [201, 12, "Le meilleur kebab", "lieu"]);
  const ligneLieu = banc.tables.messages.get(Number(lieu.corps.message.id))!;
  assert.ok(!ligneLieu.texteChiffre!.includes("kebab") && !ligneLieu.texteChiffre!.includes('"l"'), "ni le lieu ni le mot en clair");
  const clair = banc.social.dependances.chiffrement!.dechiffrerMessage(ligneLieu.texteChiffre!, ligneLieu.conversationId, ligneLieu.idClient);
  assert.deepEqual(JSON.parse(clair), { l: 12, m: "Le meilleur kebab" });
  assert.throws(() => banc.social.dependances.chiffrement!.dechiffrerMessage(ligneLieu.texteChiffre!, ligneLieu.conversationId, randomUUID()), "déplacé vers un autre idClient : illisible");
  assert.equal((await a.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 13 })).corps.erreur, "lieu-inconnu");
  await banc.attendreEnvois();
  const pourB = banc.pushs.filter((p) => p.compteId === b.compteId);
  assert.deepEqual(pourB.map((p) => p.message.texte), ["Nouveau message. Viens voir !", "T'a envoyé un lieu à tester."]);
  assert.deepEqual(pourB.map((p) => [p.message.apercu?.titre, p.message.apercu?.texte]), [[pourB[0]!.message.titre, texte], [pourB[1]!.message.titre, "📍 Le meilleur kebab"]]);
  assert.ok(!JSON.stringify(banc.pushs.map(({ message: { apercu: _apercu, ...reste } }) => reste)).includes("Rendez-vous"), "hors de l'aperçu, jamais le texte");
  assert.equal((await b.demander("PATCH", "/app/social/moi", { apercuMessages: false })).statut, 200);
  banc.pushs.length = 0;
  await ecrire(a, id, "Toujours partant ?");
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.map((p) => [p.message.texte, "apercu" in p.message]), [["Nouveau message. Viens voir !", false]], "« Juste qui t'écrit » : pas d'aperçu");
  assert.ok(!JSON.stringify(banc.pushs).includes("partant"));
  assert.ok(banc.pushs.every((p) => p.compteId !== a.compteId), "jamais à soi-même");
  const lu = await b.demander("GET", `/app/conversations/${id}`);
  assert.deepEqual(lu.corps.fil.messages.map((m: { texte: string }) => m.texte), [texte, "Le meilleur kebab", "Toujours partant ?"]);
});

test("textes refusés : vide, invisible, caractère de contrôle, trop long, mot interdit (message-refuse), type inconnu, idClient mal formé ; fins de ligne \\r\\n gardées en \\n", async () => {
  const { a, id } = await deuxPotes();
  const envoi = (corps: unknown) => a.demander("POST", `/app/conversations/${id}/messages`, corps);
  assert.deepEqual((await envoi({ idClient: randomUUID(), type: "texte", texte: "  " })).corps, { ok: false, erreur: "champ-invalide", champ: "texte" });
  for (const texte of ["\u0001".repeat(500), "\u200B\u200D\uFEFF", "Salut\u0000"]) {
    const refus = await envoi({ idClient: randomUUID(), type: "texte", texte });
    assert.deepEqual([refus.statut, refus.corps], [400, { ok: false, erreur: "champ-invalide", champ: "texte" }], JSON.stringify(texte));
  }
  const accepte = await envoi({ idClient: randomUUID(), type: "texte", texte: "On y va ?\nÀ 20\u202Fh 👩\u200D🍳🇫🇷" });
  assert.deepEqual([accepte.statut, accepte.corps.message.texte], [201, "On y va ?\nÀ 20\u202Fh 👩\u200D🍳🇫🇷"]);
  // Collé depuis un ordinateur (l'app ne change pas les fins de ligne) : \r\n et \r arrivent en \n, jamais un refus
  const colle = await envoi({ idClient: randomUUID(), type: "texte", texte: "On y va ?\r\nÀ 20 h\rpile\r\n" });
  assert.deepEqual([colle.statut, colle.corps.message.texte], [201, "On y va ?\nÀ 20 h\npile"]);
  assert.equal((await envoi({ idClient: randomUUID(), type: "texte", texte: "x".repeat(501) })).corps.champ, "texte");
  assert.deepEqual((await envoi({ idClient: randomUUID(), type: "texte", texte: "espèce de connard" })).corps, { ok: false, erreur: "message-refuse", champ: "texte" });
  assert.equal((await envoi({ idClient: randomUUID(), type: "photo" })).corps.champ, "type");
  assert.equal((await envoi({ idClient: "PAS-UN-UUID", type: "texte", texte: "salut" })).corps.champ, "idClient");
  assert.equal((await a.demander("POST", "/app/conversations/abc/messages", { idClient: randomUUID(), type: "texte", texte: "salut" })).corps.champ, "id");
});

test("idempotence : le même idClient deux fois fait un seul message et une seule notification", async () => {
  const { a, b, id } = await deuxPotes();
  banc.pushs.length = 0;
  const idClient = randomUUID();
  const premier = await ecrire(a, id, "Une seule fois", idClient);
  const second = await ecrire(a, id, "Une seule fois", idClient);
  assert.deepEqual([premier.statut, second.statut], [201, 200]);
  assert.equal(second.corps.message.id, premier.corps.message.id);
  assert.equal([...banc.tables.messages.values()].filter((m) => m.idClient === idClient).length, 1);
  await banc.attendreEnvois();
  assert.equal(banc.pushs.filter((p) => p.compteId === b.compteId).length, 1);
  // Le idClient d'un autre (il le voit dans les messages) ne rend jamais son message : 400
  assert.equal((await ecrire(b, id, "Je vole", idClient)).corps.champ, "idClient");
});

test("version, « inchange », pages (avant), non-lus et lu qui ne recule pas", async () => {
  const { a, b, id } = await deuxPotes();
  // Directement par le service : la route limite à 30 messages par minute
  const messagerie = banc.social.dependances.messagerie;
  for (let i = 1; i <= 55; i++) await messagerie.envoyer(a.compteId, Number(id), { idClient: randomUUID(), type: "texte", texte: `message ${i}` }, new Date(banc.horloge.maintenant));
  const fil = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.equal(fil.messages.length, 50);
  assert.deepEqual([fil.messages[0].texte, fil.messages[49].texte], ["message 6", "message 55"]);
  assert.equal(fil.conversation.nonLus, 55);
  const plusAnciens = (await b.demander("GET", `/app/conversations/${id}?avant=${fil.suite}`)).corps.fil;
  assert.deepEqual([plusAnciens.messages.length, plusAnciens.suite], [5, null]);
  assert.deepEqual((await b.demander("GET", `/app/conversations/${id}?version=${fil.version}`)).corps, { ok: true, inchange: true, version: fil.version });
  await ecrire(a, id, "encore un");
  assert.ok((await b.demander("GET", `/app/conversations/${id}?version=${fil.version}`)).corps.fil, "la version a bougé");
  assert.equal((await b.demander("GET", `/app/conversations/${id}?version=-1`)).statut, 400);
  const dernier = fil.messages[49].id;
  assert.equal((await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: dernier })).statut, 200);
  const liste = (await b.demander("GET", "/app/conversations")).corps;
  assert.deepEqual([liste.conversations[0].id, liste.conversations[0].nonLus, liste.conversations[0].luJusqua], [id, 1, dernier]);
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: "1" });
  assert.equal((await b.demander("GET", "/app/conversations")).corps.conversations[0].luJusqua, dernier, "ne recule jamais");
  await b.demander("PUT", `/app/conversations/${id}/lu`, { jusqua: "999999" });
  const ramene = (await b.demander("GET", "/app/conversations")).corps.conversations[0];
  assert.deepEqual([ramene.nonLus, ramene.luJusqua], [0, ramene.dernierMessage.id], "ramené au dernier message visible");
});

test("accès croisés : 404 hors de la conversation, message d'une autre conversation, conversation d'un autre", async () => {
  const un = await deuxPotes();
  const deux = await deuxPotes();
  const message = (await ecrire(un.a, un.id, "à nous deux")).corps.message.id;
  assert.equal((await deux.a.demander("GET", `/app/conversations/${un.id}`)).corps.erreur, "conversation-inconnue");
  assert.equal((await deux.a.demander("POST", `/app/conversations/${un.id}/messages`, { idClient: randomUUID(), type: "texte", texte: "intrus" })).statut, 404);
  assert.equal((await deux.a.demander("DELETE", `/app/conversations/${deux.id}/messages/${message}`)).corps.erreur, "message-inconnu");
  assert.equal((await deux.a.demander("PUT", `/app/conversations/${deux.id}/messages/${message}/reactions/coeur`)).corps.erreur, "message-inconnu");
  assert.equal((await deux.a.demander("PUT", `/app/conversations/${un.id}/notifications`, { coupees: true })).statut, 404);
  assert.equal((await deux.a.demander("PATCH", `/app/conversations/${un.id}`, { titre: "Piraté" })).statut, 404, "404 avant 403");
});

test("supprimer pour tous, réactions (cumulables, une de chaque), couper les notifications, effacer pour moi", async () => {
  const { a, b, id } = await deuxPotes();
  const message = (await ecrire(a, id, "Réagis !")).corps.message.id;
  assert.equal((await b.demander("PUT", `/app/conversations/${id}/messages/${message}/reactions/coeur`)).statut, 200);
  await b.demander("PUT", `/app/conversations/${id}/messages/${message}/reactions/coeur`);
  await b.demander("PUT", `/app/conversations/${id}/messages/${message}/reactions/miam`);
  assert.equal((await b.demander("PUT", `/app/conversations/${id}/messages/${message}/reactions/beurk`)).corps.champ, "reaction");
  let fil = (await a.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual(fil.messages[0].reactions, { coeur: [b.idPublic], miam: [b.idPublic] });
  await b.demander("DELETE", `/app/conversations/${id}/messages/${message}/reactions/miam`);
  assert.equal((await b.demander("DELETE", `/app/conversations/${id}/messages/${message}`)).corps.erreur, "reserve-a-l-auteur");
  const supprime = await a.demander("DELETE", `/app/conversations/${id}/messages/${message}`);
  assert.equal(supprime.statut, 200);
  fil = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual([fil.messages[0].etat, fil.messages[0].texte, fil.messages[0].reactions], ["supprime", null, {}]);
  assert.equal(banc.tables.messages.get(Number(message))!.texteChiffre, null, "texte effacé tout de suite");
  // Couper : plus rien sur le téléphone de B
  await b.demander("PUT", `/app/conversations/${id}/notifications`, { coupees: true });
  banc.pushs.length = 0;
  await ecrire(a, id, "Tu dors ?");
  await banc.attendreEnvois();
  assert.equal(banc.pushs.filter((p) => p.compteId === b.compteId).length, 0);
  assert.equal((await b.demander("GET", "/app/conversations")).corps.conversations.find((c: { id: string }) => c.id === id).coupee, true);
  // Effacer pour moi : elle disparaît de ma liste jusqu'au prochain message, sans rien d'avant
  await b.demander("POST", `/app/conversations/${id}/effacer`);
  assert.ok(!(await b.demander("GET", "/app/conversations")).corps.conversations.some((c: { id: string }) => c.id === id));
  assert.equal((await b.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.length, 0);
  await ecrire(a, id, "Coucou, c'est reparti");
  const revenue = (await b.demander("GET", "/app/conversations")).corps.conversations.find((c: { id: string }) => c.id === id);
  assert.equal(revenue.dernierMessage.texte, "Coucou, c'est reparti");
  assert.equal((await b.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.length, 1);
});

test("privé : lecture seule quand on n'est plus potes ; disparaît des deux côtés avec un blocage", async () => {
  const { a, b, id } = await deuxPotes();
  await ecrire(a, id, "Avant la brouille");
  banc.tables.bande.splice(0, banc.tables.bande.length, ...banc.tables.bande.filter((l) => ![a.compteId, b.compteId].includes(l.compteId)));
  const ferme = (await a.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual([ferme.conversation.ouverte, ferme.messages.length], [false, 1]);
  assert.deepEqual((await ecrire(a, id, "Tu es là ?")).corps, { ok: false, erreur: "conversation-fermee" });
  banc.bloquer(b, a);
  for (const p of [a, b]) {
    assert.equal((await p.demander("GET", `/app/conversations/${id}`)).statut, 404);
    assert.ok(!(await p.demander("GET", "/app/conversations")).corps.conversations.some((c: { id: string }) => c.id === id));
  }
});

test("compte supprimé : ses messages restent, signés null (« Compte supprimé ») ; autre: null, lecture seule", async () => {
  const { a, b, id } = await deuxPotes();
  await ecrire(b, id, "Je pars bientôt");
  await banc.supprimerCompte(b);
  const fil = (await a.demander("GET", `/app/conversations/${id}`)).corps.fil;
  assert.deepEqual([fil.messages[0].auteur, fil.messages[0].texte], [null, "Je pars bientôt"]);
  assert.deepEqual([fil.conversation.autre, fil.conversation.ouverte], [null, false]);
});

test("sans clé des données : 503 chiffrement-indisponible sur les routes chiffrées, le reste répond", async () => {
  const sansCle = await creerBancSocial({ sansCle: true });
  try {
    const a = await sansCle.creerPersonne();
    assert.deepEqual((await a.demander("GET", "/app/conversations")).corps, { ok: false, erreur: "chiffrement-indisponible" });
    assert.equal((await a.demander("POST", "/app/conversations/1/messages", { idClient: randomUUID(), type: "texte", texte: "x" })).statut, 503);
    assert.equal((await a.demander("PUT", "/app/conversations/1/notifications", { coupees: true })).statut, 404);
  } finally {
    await sansCle.fermer();
  }
});

test("réactions refusées : message supprimé ou masqué (404), privé fermé (403 conversation-fermee)", async () => {
  const { a, b, id } = await deuxPotes();
  const supprime = (await ecrire(a, id, "Oups")).corps.message.id as string;
  await a.demander("DELETE", `/app/conversations/${id}/messages/${supprime}`);
  const masque = (await ecrire(a, id, "Pas joli")).corps.message.id as string;
  banc.tables.messages.get(Number(masque))!.suspenduLe = new Date(banc.horloge.maintenant);
  const reste = (await ecrire(a, id, "Tout va bien")).corps.message.id as string;
  for (const m of [supprime, masque]) {
    const r = await b.demander("PUT", `/app/conversations/${id}/messages/${m}/reactions/coeur`);
    assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "message-inconnu" }]);
  }
  banc.tables.bande.splice(0, banc.tables.bande.length, ...banc.tables.bande.filter((l) => ![a.compteId, b.compteId].includes(l.compteId)));
  const fermee = await b.demander("PUT", `/app/conversations/${id}/messages/${reste}/reactions/coeur`);
  assert.deepEqual([fermee.statut, fermee.corps], [403, { ok: false, erreur: "conversation-fermee" }]);
});

test("message signalé : caché pour qui l'a signalé (fil, dernier message), toujours là pour l'autre", async () => {
  const { a, b, id } = await deuxPotes();
  await ecrire(a, id, "Bonjour");
  const signale = (await ecrire(a, id, "Message signalé")).corps.message.id as string;
  const sid = prendreId(banc.tables, "signalements");
  banc.tables.signalements.set(sid, {
    id: sid, cible: "message", cibleId: signale, lieuId: null, raison: "choquant", precision: null, explication: "", source: "app", statut: "a-traiter",
    decision: null, motif: null, motivation: null, contestation: null, contesteLe: null, reexamineLe: null, creeLe: new Date(banc.horloge.maintenant),
    traiteLe: null, signaleParId: b.compteId, auteurContenuId: a.compteId, instantaneChiffre: null, fichierMedia: null,
  });
  const textes = async (p: PersonneDeTest) => (await p.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.map((m: { texte: string }) => m.texte);
  assert.deepEqual(await textes(b), ["Bonjour"]);
  assert.deepEqual(await textes(a), ["Bonjour", "Message signalé"]);
  const dernier = async (p: PersonneDeTest) => (await p.demander("GET", "/app/conversations")).corps.conversations.find((c: { id: string }) => c.id === id).dernierMessage.texte;
  assert.deepEqual([await dernier(b), await dernier(a)], ["Bonjour", "Message signalé"]);
});

test("lieu rejoué : le même idClient rend son message (200) même si le lieu n'est plus publié ; un nouvel envoi est refusé", async () => {
  const { a, id } = await deuxPotes();
  banc.tables.lieux.set(15, { statut: "publie", nom: "Le Fugace" });
  const idClient = randomUUID();
  const lieu = (cle: string) => a.demander("POST", `/app/conversations/${id}/messages`, { idClient: cle, type: "lieu", lieuId: 15, texte: "Vite, avant qu'il ferme" });
  const premier = await lieu(idClient);
  assert.equal(premier.statut, 201, JSON.stringify(premier.corps));
  banc.tables.lieux.set(15, { statut: "archive" });
  const rejoue = await lieu(idClient);
  assert.deepEqual([rejoue.statut, rejoue.corps.message?.id], [200, premier.corps.message.id], JSON.stringify(rejoue.corps));
  assert.deepEqual((await lieu(randomUUID())).corps, { ok: false, erreur: "lieu-inconnu" });
});
