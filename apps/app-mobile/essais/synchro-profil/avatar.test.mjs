// L'avatar dans la synchro du profil (règles 1 à 6) : l'état gardé relu, un emoji ou un Miami qui part, une photo qui
// reste sur le téléphone, la relecture du serveur, les refus, l'effacement ; puis deux courses. Le mode démo (règle 6) est
// dans demo.test.mjs.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { lireSynchroProfil } from "~/stockage/synchro-profil";
import { DEFAUT, LOCAL, PHOTO_A, PHOTO_B, PIZZA, TACO, TOQUE, VU, etat, lireEtatGarde as garde } from "./banc/donnees.mjs";
import { declencher, lireMinuteriesEnAttente, oublierMinuteries, pause } from "./banc/minuteries.mjs";
import { demarrer, lireEcrituresAvatar, lirePatchsAvecAvatar, remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

const aUneMarqueAvatar = () => (garde()?.aEnvoyer ?? []).some((m) => m.champ === "avatar");

test("1. un état gardé d'avant l'avatar se relit tel quel", async () => {
  globalThis.__magasin = new Map(etat({ aEnvoyer: [{ champ: "ville", numero: 3 }] }));
  const ancien = await lireSynchroProfil();
  assert.equal(ancien.premiereFaite, true);
  assert.deepEqual(ancien.aEnvoyer, [{ champ: "ville", numero: 3 }]);
  assert.ok(!("avatarServeur" in ancien));
});

test("1. la marque « avatar » et avatarServeur se relisent (un champ inconnu est écarté)", async () => {
  globalThis.__magasin = new Map(etat({ aEnvoyer: [{ champ: "avatar", numero: 2 }, { champ: "photo", numero: 4 }], avatarServeur: "miami:toque" }));
  const nouveau = await lireSynchroProfil();
  assert.deepEqual(nouveau.aEnvoyer, [{ champ: "avatar", numero: 2 }]);
  assert.equal(nouveau.avatarServeur, "miami:toque");
});

test("1. un avatarServeur illisible compte comme jamais lu", async () => {
  globalThis.__magasin = new Map(etat({ avatarServeur: 42 }));
  assert.ok(!("avatarServeur" in (await lireSynchroProfil())));
});

test("2. un emoji puis un Miami, avec un compte : marque gardée AVANT l'écriture, puis l'envoi part", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  s.demandes.length = 0;
  globalThis.__journalAvatar.length = 0;
  await moteur.modifierAvatar(PIZZA);
  await pause(40);
  const journal = [...globalThis.__journalAvatar];
  const iMarque = journal.findIndex((e) => e.startsWith("marque:") && e.includes("avatar"));
  const iEcriture = journal.findIndex((e) => e.startsWith("avatar:") && e.includes("🍕"));
  assert.ok(iMarque >= 0 && iMarque < iEcriture, "marque gardée avant l'écriture de l'avatar | " + journal.join(" → "));
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"🍕"}'], "l'emoji part");
  assert.equal(s.serveur.avatar, "🍕");
  assert.deepEqual(garde().aEnvoyer, [], "la marque s'en va");
  assert.equal(garde().avatarServeur, "🍕");
  s.demandes.length = 0;
  await moteur.modifierAvatar(TOQUE);
  await pause(40);
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"miami:toque"}'], "le Miami part en « miami:toque »");
  assert.equal(s.serveur.avatar, "miami:toque");
  assert.deepEqual(s.avatar, TOQUE);
});

test("2. visite (pas de profil) : rien ne part, aucune marque", async () => {
  const { moteur, s } = await demarrer({ profil: null });
  await moteur.modifierAvatar(PIZZA);
  await pause(40);
  assert.deepEqual(s.demandes, []);
  assert.equal((garde()?.aEnvoyer ?? []).length, 0);
  assert.deepEqual(s.avatar, PIZZA);
});

test("3. une photo : rien ne part ; une photo remplacée est effacée ; un emoji pas encore parti ne part plus", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.demandes.length = 0;
  globalThis.__journalAvatar.length = 0;
  await moteur.modifierAvatar(PHOTO_A);
  await pause(40);
  await moteur.modifierAvatar(PHOTO_B);
  await pause(40);
  assert.deepEqual(s.demandes, [], "photo : rien ne part");
  assert.equal((garde()?.aEnvoyer ?? []).length, 0, "photo : pas de marque");
  assert.equal(s.serveur.avatar, "🍕");
  const journal = globalThis.__journalAvatar;
  assert.ok(journal.includes("photo-supprimee:" + PHOTO_A.uri), "photo remplacée : l'ancienne est effacée | " + journal.join(" → "));
  assert.ok(!journal.includes("photo-supprimee:" + PHOTO_B.uri), "la nouvelle photo reste");
  s.horsLigne = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(40);
  const marqueHorsLigne = aUneMarqueAvatar();
  await moteur.modifierAvatar(PHOTO_A);
  await pause(40);
  s.horsLigne = false;
  for (let i = 0; i < 20 && lireMinuteriesEnAttente().length > 0; i++) await declencher();
  assert.deepEqual(lireMinuteriesEnAttente(), [], "plus aucun nouvel essai prévu");
  assert.ok(marqueHorsLigne, "l'emoji choisi hors ligne attendait");
  assert.deepEqual(garde().aEnvoyer, [], "puis la photo l'a retiré de la file");
  assert.ok(
    lirePatchsAvecAvatar(s).every((d) => d === 'PATCH {"avatar":"🌮"}'),
    "seuls les essais hors ligne ont emporté 🌮 | " + JSON.stringify(s.demandes),
  );
  assert.equal(s.serveur.avatar, "🍕", "le serveur garde 🍕");
  assert.deepEqual(s.avatar, PHOTO_A);
});

test("4. serveur sans avatar et avatar par défaut ici : rien", async () => {
  const { s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.equal(lireEcrituresAvatar().length, 0);
  assert.deepEqual(s.avatar, DEFAUT);
});

test("4. idem, téléphone d'avant l'avatar : rien", async () => {
  const { s } = await demarrer({ magasin: etat() });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.equal(lireEcrituresAvatar().length, 0);
});

test("4. plus d'avatar sur le serveur après une décision : retour au défaut, sans renvoi", async () => {
  const { s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), avatar: PIZZA });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.deepEqual(s.avatar, DEFAUT);
  assert.deepEqual(globalThis.__avatarDisque, DEFAUT);
  assert.equal(garde().avatarServeur, null);
});

test("4. rien sur le serveur, déjà lu ainsi (autre téléphone, refus perdu) : retour au défaut, sans renvoi", async () => {
  const { s } = await demarrer({ magasin: etat({ avatarServeur: null }), avatar: PIZZA });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.deepEqual(s.avatar, DEFAUT);
});

test("4. rattrapage (première synchro) : l'avatar du téléphone part", async () => {
  const { s } = await demarrer({ magasin: [], avatar: PIZZA });
  assert.deepEqual(lirePatchsAvecAvatar(s), ['PATCH {"avatar":"🍕"}']);
  assert.equal(s.serveur.avatar, "🍕");
  assert.deepEqual(s.avatar, PIZZA);
});

test("4. rattrapage (téléphone d'avant l'avatar) : l'avatar du téléphone part", async () => {
  const { s } = await demarrer({ magasin: etat(), avatar: TOQUE });
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"avatar":"miami:toque"}']);
  assert.equal(s.serveur.avatar, "miami:toque");
  assert.equal(garde().avatarServeur, "miami:toque");
});

test("4. rattrapage après l'inscription : l'avatar choisi pendant la visite part", async () => {
  // Visite : un emoji choisi, puis l'inscription (installer) ; le compte tout neuf n'a pas d'avatar
  const { moteur, s } = await demarrer({ profil: null, avatar: PIZZA });
  await moteur.installer(structuredClone(LOCAL));
  moteur.activer(true);
  await pause(40);
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"avatar":"🍕"}']);
  assert.equal(s.serveur.avatar, "🍕");
});

test("4. Miami choisi sur un autre téléphone : adopté, sans renvoi", async () => {
  const { s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "miami:toque" }, avatar: PIZZA });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.deepEqual(s.avatar, TOQUE);
  assert.deepEqual(globalThis.__avatarDisque, TOQUE);
});

test("4. rattrapage, le serveur a déjà un emoji : adopté", async () => {
  const { s } = await demarrer({ magasin: [], serveur: { ...VU, avatar: "🌮" }, avatar: PIZZA });
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
  assert.deepEqual(s.avatar, TACO);
});

for (const inconnu of ["miami:licorne", "miami:capitaine"]) {
  test(`4. ${inconnu} sur le serveur : on garde l'avatar du téléphone, sans renvoi`, async () => {
    const { s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: inconnu }, avatar: PIZZA });
    assert.deepEqual(s.demandes, ["GET"]);
    assert.deepEqual(s.avatar, PIZZA);
    assert.equal(lireEcrituresAvatar().length, 0);
  });
}

for (const serveur of ["🌮", null]) {
  test(`4. photo sur le téléphone, ${serveur ?? "rien"} sur le serveur : la photo reste, rien ne part`, async () => {
    const { s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: serveur }, avatar: PHOTO_A });
    assert.deepEqual(s.demandes, ["GET"]);
    assert.deepEqual(s.avatar, PHOTO_A);
    assert.ok(globalThis.__journalAvatar.every((e) => !e.startsWith("avatar:") && !e.startsWith("photo-supprimee")), globalThis.__journalAvatar.join(" → "));
  });
}

test("4. rattrapage avec une photo : rien ne part", async () => {
  const { s } = await demarrer({ magasin: [], avatar: PHOTO_A });
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
  assert.deepEqual(s.avatar, PHOTO_A);
});

test("5. compte limité : la marque s'en va, le téléphone reprend l'avatar du serveur, sans annonce de plus", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.limite = true;
  s.demandes.length = 0;
  s.vues.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(60);
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"🌮"}', "GET"]);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.deepEqual(s.avatar, PIZZA);
  assert.ok(s.vues.every((v) => v.annonce === null), "aucune annonce | " + JSON.stringify(s.vues.at(-1)));
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("5. rattrapage refusé (compte limité) : une seule fois, puis retour au défaut", async () => {
  // Téléphone d'avant l'avatar : le rattrapage est refusé une fois, puis le téléphone prend la valeur du serveur
  const { s } = await demarrer({ magasin: etat(), avatar: PIZZA, limite: true });
  assert.deepEqual(s.demandes, ["GET", 'PATCH {"avatar":"🍕"}', "GET"]);
  assert.deepEqual(s.avatar, DEFAUT);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("5. champ invalide : la marque s'en va, le téléphone reprend l'avatar du serveur", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.refuserAvatar = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(60);
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"🌮"}', "GET"]);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.deepEqual(s.avatar, PIZZA);
});

test("5. erreur passagère : nouvel essai dans 30 s, puis ça part", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.horsLigne = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(40);
  const attente = lireMinuteriesEnAttente();
  const marque = aUneMarqueAvatar();
  s.horsLigne = false;
  await declencher();
  assert.ok(marque, "la marque attend");
  assert.deepEqual(attente, [30000]);
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(garde().aEnvoyer, []);
  assert.deepEqual(s.avatar, TACO);
});

test("5. Mes infos pendant qu'un avatar attend, compte limité : la ville part, l'avatar reprend 🍕", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.horsLigne = true;
  await moteur.modifierAvatar(TACO);
  await pause(40);
  s.horsLigne = false;
  s.limite = true;
  s.demandes.length = 0;
  oublierMinuteries();
  const r = await moteur.modifierInfos({ ville: "Lyon" });
  await pause(60);
  assert.deepEqual(r, { ok: true, parti: true });
  // La relecture (GET) qui suit vient du refus mis de côté, comme pour un prénom ou un pseudo en attente
  assert.deepEqual(s.demandes, ['PATCH {"ville":"Lyon","avatar":"🌮"}', 'PATCH {"ville":"Lyon"}', "GET"]);
  assert.equal(s.serveur.ville, "Lyon");
  assert.deepEqual(s.avatar, PIZZA);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("6. effacer puis installer : plus de marque, avatarServeur oublié, avatar inchangé", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  s.horsLigne = true;
  await moteur.modifierAvatar(TACO);
  await pause(40);
  moteur.activer(false);
  await moteur.oublier();
  moteur.poserProfil(null);
  moteur.poserAvatar(DEFAUT);
  const apresOubli = garde();
  await moteur.installer(structuredClone(LOCAL));
  assert.equal(apresOubli, null, "rien de gardé après l'effacement");
  assert.deepEqual(garde().aEnvoyer, []);
  assert.ok(!("avatarServeur" in garde()));
  assert.deepEqual(s.avatar, DEFAUT);
});

test("course : un second avatar choisi pendant le voyage du premier gagne, et part après lui", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(PIZZA);
  await pause(5);
  await moteur.modifierAvatar(TACO);
  lacher();
  s.retard = null;
  await p;
  await pause(60);
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"🍕"}', 'PATCH {"avatar":"🌮"}']);
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(s.avatar, TACO);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("disque plein : l'écran reçoit l'erreur, l'avatar reste 🍕, rien de faux ne part", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA });
  globalThis.__avatarEchec = true;
  s.demandes.length = 0;
  let refus = null;
  await moteur.modifierAvatar(TACO).catch((e) => (refus = e.message));
  await pause(40);
  assert.equal(refus, "disque plein");
  assert.deepEqual(s.avatar, PIZZA);
  assert.equal(s.serveur.avatar, "🍕");
});

test("avatar pas encore lu (tout début du lancement) : la lecture n'y touche pas, le rattrapage reste à faire", async () => {
  const { s } = await demarrer({ magasin: etat(), avatar: null, serveur: { ...VU, avatar: "🌮" } });
  assert.equal(s.avatar, undefined);
  assert.ok(!("avatarServeur" in garde()), JSON.stringify(garde()));
});
