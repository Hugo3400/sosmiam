// Tests de la cloche de l'app (/app/cloche et ServicesCloche.noter, utilisé aussi par la session Logiciel) : dédoublonnage
// sur 24 h, acteur bloqué dans un sens ou dans l'autre, pages de 30, « vu » qui ne recule jamais. Tout en mémoire.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { presenterNotificationCloche } from "../src/fonctions/social/presenter-notification-cloche.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerBancSocial } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const HEURE = 60 * 60 * 1000;
const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const noter = (...n: Parameters<typeof banc.social.dependances.cloche.noter>[0]) => banc.social.dependances.cloche.noter(n, date());
const lignesDe = (compteId: number) => [...banc.tables.cloche.values()].filter((l) => l.compteId === compteId);

test("presenterNotificationCloche : identifiants en texte, cible complète ou rien", () => {
  const ligne = { id: 7, type: "sortie-annulee", cible: "sortie", cibleId: "42", detail: "Pizza", enRetour: false, creeLe: new Date("2026-10-14T10:00:00Z") };
  assert.deepEqual(presenterNotificationCloche(ligne, null), {
    id: "7", type: "sortie-annulee", acteur: null, date: "2026-10-14T10:00:00.000Z", cible: { type: "sortie", id: "42" }, detail: "Pizza", enRetour: false,
  });
  assert.equal(presenterNotificationCloche({ ...ligne, cibleId: null }, null).cible, null);
});

test("dédoublonnage : même type, même acteur, même cible dans les 24 h, la date est seulement remise à jour", async () => {
  const moi = await banc.creerPersonne({ pseudo: "cloche.doublon" });
  const lea = await banc.creerPersonne({ pseudo: "lea.doublon" });
  const n = { compteId: moi.compteId, type: "liste-coauteur" as const, acteurId: lea.compteId, cible: { type: "liste" as const, id: "5" } };
  await noter(n);
  banc.horloge.maintenant += 2 * HEURE;
  await noter(n);
  assert.equal(lignesDe(moi.compteId).length, 1);
  assert.equal(lignesDe(moi.compteId)[0].creeLe.getTime(), banc.horloge.maintenant, "remise à la date du jour");
  await noter({ ...n, cible: { type: "liste", id: "6" } });
  assert.equal(lignesDe(moi.compteId).length, 2, "une autre cible : une autre notification");
  banc.horloge.maintenant += 25 * HEURE;
  await noter(n);
  assert.equal(lignesDe(moi.compteId).length, 3, "plus de 24 h après : une nouvelle");
  await noter({ compteId: moi.compteId, type: "nouvel-abonne", acteurId: moi.compteId });
  assert.equal(lignesDe(moi.compteId).length, 3, "jamais de notification de soi à soi");
  await noter({ compteId: moi.compteId, type: "contenu-retire", acteurId: null, cible: { type: "signalement", id: "9" }, detail: "x".repeat(200) });
  const equipe = lignesDe(moi.compteId).find((l) => l.type === "contenu-retire");
  assert.equal(equipe?.detail?.length, 120, "detail coupé à 120 caractères");
});

test("acteur bloqué, dans un sens ou dans l'autre : rien n'est écrit, et ce qui était là disparaît de la cloche", async () => {
  const moi = await banc.creerPersonne({ pseudo: "cloche.blocage" });
  const jeBloque = await banc.creerPersonne({ pseudo: "je.bloque" });
  const meBloque = await banc.creerPersonne({ pseudo: "me.bloque" });
  const plusTard = await banc.creerPersonne({ pseudo: "plus.tard" });
  banc.bloquer(moi, jeBloque);
  banc.bloquer(meBloque, moi);
  await noter(
    { compteId: moi.compteId, type: "nouvel-abonne", acteurId: jeBloque.compteId },
    { compteId: moi.compteId, type: "nouvel-abonne", acteurId: meBloque.compteId },
    { compteId: jeBloque.compteId, type: "nouvel-abonne", acteurId: moi.compteId },
    { compteId: moi.compteId, type: "nouvel-abonne", acteurId: plusTard.compteId },
  );
  assert.deepEqual(lignesDe(moi.compteId).map((l) => l.acteurId), [plusTard.compteId]);
  assert.equal(lignesDe(jeBloque.compteId).length, 0);
  banc.bloquer(plusTard, moi);
  const cloche = (await moi.demander("GET", "/app/cloche")).corps.cloche;
  assert.deepEqual(cloche.notifications, [], "cachée dès le blocage, même avant le ménage");
  assert.equal((await moi.demander("GET", "/app/social/pouls")).corps.pouls.cloche.nonVues, 0);
});

test("lister : 30 par page, la plus récente d'abord, l'équipe en acteur null, jamais un acteur sans profil", async () => {
  const moi = await banc.creerPersonne({ pseudo: "cloche.pages" });
  const sansProfil = await banc.creerPersonne({ pseudo: "sans.profil.cloche", sansProfil: true });
  const acteurs = [];
  for (let i = 0; i < 31; i++) acteurs.push(await banc.creerPersonne({ pseudo: `acteur.${i}` }));
  for (const [i, acteur] of acteurs.entries()) {
    banc.horloge.maintenant += 1000;
    await noter({ compteId: moi.compteId, type: "nouvel-abonne", acteurId: acteur.compteId, enRetour: i === 30 });
  }
  await noter({ compteId: moi.compteId, type: "nouvel-abonne", acteurId: sansProfil.compteId });
  await noter({ compteId: moi.compteId, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id: "3" }, detail: "retenu" });
  const page1 = (await moi.demander("GET", "/app/cloche")).corps.cloche;
  assert.equal(page1.notifications.length, 29, "30 lues, celle de l'acteur sans profil ne se montre pas");
  assert.deepEqual([page1.notifications[0].type, page1.notifications[0].acteur], ["signalement-decide", null]);
  assert.deepEqual([page1.notifications[1].acteur.id, page1.notifications[1].enRetour], [acteurs[30].idPublic, true]);
  assert.equal(page1.vuesLe, null);
  assert.ok(page1.suite);
  const page2 = (await moi.demander("GET", `/app/cloche?apres=${page1.suite}`)).corps.cloche;
  assert.deepEqual(page2.notifications.map((n: { acteur: { id: string } }) => n.acteur.id), [acteurs[2].idPublic, acteurs[1].idPublic, acteurs[0].idPublic]);
  assert.equal(page2.suite, null);
  const refus = await moi.demander("GET", "/app/cloche?apres=pas-un-curseur");
  assert.deepEqual([refus.statut, refus.corps.champ], [400, "apres"]);
});

test("« vu » : ne recule jamais, jamais après maintenant, le même sur tous les téléphones", async () => {
  const moi = await banc.creerPersonne({ pseudo: "cloche.vue" });
  const lea = await banc.creerPersonne({ pseudo: "lea.vue" });
  const autreJeton = creerJeton();
  await banc.memoire.sessions.creer(calculerEmpreinteJeton(autreJeton), { compteId: moi.compteId, creeLe: banc.horloge.maintenant, activite: banc.horloge.maintenant, support: "app" });
  await noter({ compteId: moi.compteId, type: "bande-ajout", acteurId: lea.compteId });
  const maintenant = date().toISOString();
  const vu = await moi.demander("POST", "/app/cloche/vu", { jusqua: date(-HEURE).toISOString() });
  assert.deepEqual([vu.statut, vu.corps.vuesLe], [200, date(-HEURE).toISOString()]);
  const recul = await moi.demander("POST", "/app/cloche/vu", { jusqua: date(-2 * HEURE).toISOString() });
  assert.equal(recul.corps.vuesLe, date(-HEURE).toISOString(), "ne recule jamais");
  const futur = await moi.demander("POST", "/app/cloche/vu", { jusqua: date(48 * HEURE).toISOString() });
  assert.equal(futur.corps.vuesLe, maintenant, "jamais après maintenant");
  const autreTelephone = await banc.demander("GET", "/app/cloche", { jeton: autreJeton });
  assert.equal(autreTelephone.corps.cloche.vuesLe, maintenant);
  assert.equal((await moi.demander("POST", "/app/cloche/vu", { jusqua: "hier soir" })).corps.champ, "jusqua");
  assert.equal((await moi.demander("POST", "/app/cloche/vu", { jusqua: 12 })).corps.champ, "jusqua");
  banc.horloge.maintenant += 1000;
  await noter({ compteId: moi.compteId, type: "bande-acceptee", acteurId: lea.compteId });
  assert.equal((await moi.demander("GET", "/app/social/pouls")).corps.pouls.cloche.nonVues, 1);
});

test("sans profil social : rien n'est gardé sur le serveur, le pouls ne compte pas de non-vues, aucun profil créé", async () => {
  const p = await banc.creerPersonne({ pseudo: "sans.profil.vue", sansProfil: true });
  await noter({ compteId: p.compteId, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id: "11" } });
  const signatureAvant = (await p.demander("GET", "/app/social/pouls")).corps.pouls.cloche;
  assert.equal(signatureAvant.nonVues, 0, "un compteur qui ne retomberait jamais à 0 : l'app compte elle-même");
  assert.notEqual(signatureAvant.signature, "0:0:", "la signature dit quand relire la cloche");
  const vu = await p.demander("POST", "/app/cloche/vu");
  assert.deepEqual([vu.statut, vu.corps.vuesLe], [200, date().toISOString()], "la date à garder sur le téléphone");
  const cloche = (await p.demander("GET", "/app/cloche")).corps.cloche;
  assert.deepEqual([cloche.notifications.length, cloche.vuesLe], [1, null]);
  assert.equal(banc.tables.profils.has(p.compteId), false, "ni /vu ni le pouls ne créent le profil social");
});
