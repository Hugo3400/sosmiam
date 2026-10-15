import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import { A_ENVOYER, A_ENVOYER_B, DEFAUT, EN_LIGNE, LOCAL, PHOTO_A, PIZZA, SUR_LE_SERVEUR, TACO, TOQUE, VU, etat, lireEtatGarde as garde } from "./banc/donnees.mjs";
import { declencher, lireMinuteriesEnAttente, pause } from "./banc/minuteries.mjs";
import { demarrer, lireDemandesPhoto, lirePatchsAvecAvatar, monter, remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

const AVEC_PIZZA = { magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA };
const AVEC_PHOTO = { magasin: etat({ avatarServeur: SUR_LE_SERVEUR }), serveur: { ...VU, avatar: SUR_LE_SERVEUR }, avatar: EN_LIGNE, repli: "🍕" };
const aUneMarqueAvatar = () => (garde()?.aEnvoyer ?? []).some((m) => m.champ === "avatar");
const dernierEtat = (s) => s.etatsPhoto.at(-1) ?? null;

async function plusTard(ms, faire) {
  const maintenant = Date.now;
  Date.now = () => maintenant() + ms;
  try {
    await faire();
  } finally {
    Date.now = maintenant;
  }
}

test("P1. envoi : marque gardée avant l'écriture, la photo part, le téléphone garde « photo:<nom> » et efface le fichier envoyé", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  globalThis.__journalAvatar.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  const journal = [...globalThis.__journalAvatar];
  const iMarque = journal.findIndex((e) => e.startsWith("marque:") && e.includes("avatar"));
  const iEcriture = journal.findIndex((e) => e.startsWith("avatar:") && e.includes("a-envoyer"));
  assert.ok(iMarque >= 0 && iMarque < iEcriture, "marque avant l'écriture | " + journal.join(" → "));
  assert.deepEqual(s.demandes, ["POST photo"]);
  assert.ok(lireAvatarPhoto(s.serveur.avatar), "le serveur a une photo");
  assert.deepEqual(s.avatar, { type: "photo", uri: null, partage: s.serveur.avatar });
  assert.deepEqual(globalThis.__avatarDisque, s.avatar);
  assert.ok(journal.includes("photo-supprimee:" + A_ENVOYER.uri), "le fichier envoyé est effacé | " + journal.join(" → "));
  assert.deepEqual(garde().aEnvoyer, []);
  assert.equal(garde().avatarServeur, s.serveur.avatar);
  assert.deepEqual(s.etatsPhoto, [null, { operation: "envoi", etat: "en-cours" }, null]);
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("P2. retrait : DELETE seulement, le téléphone revient au repli rendu par le serveur", async () => {
  const { moteur, s } = await demarrer(AVEC_PHOTO);
  s.demandes.length = 0;
  await moteur.retirerPhoto();
  await pause(40);
  assert.deepEqual(s.demandes, ["DELETE photo"]);
  assert.equal(s.serveur.avatar, "🍕");
  assert.deepEqual(s.avatar, PIZZA);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.ok(!garde().retraitPhoto);
  assert.equal(garde().avatarServeur, "🍕");
});

test("P3. hors ligne puis retour : la photo attend sur le téléphone (30 s), puis part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.horsLigne = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  const attente = lireMinuteriesEnAttente();
  const marque = aUneMarqueAvatar();
  const etatHorsLigne = dernierEtat(s);
  const avatarHorsLigne = structuredClone(s.avatar);
  s.horsLigne = false;
  await declencher();
  assert.deepEqual(attente, [30000]);
  assert.ok(marque, "la marque attend");
  assert.deepEqual(etatHorsLigne, { operation: "envoi", etat: "attente", raison: "reseau" });
  assert.deepEqual(avatarHorsLigne, A_ENVOYER, "la photo reste affichée pendant l'attente");
  assert.deepEqual(s.demandes, ["POST photo", "POST photo"]);
  assert.ok(lireAvatarPhoto(s.serveur.avatar));
  assert.equal(s.avatar.partage, s.serveur.avatar);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.equal(dernierEtat(s), null);
});

test("P3. retrait hors ligne, app relancée : le retrait est gardé, puis part au retour du réseau", async () => {
  const premier = await demarrer(AVEC_PHOTO);
  premier.s.horsLigne = true;
  await premier.moteur.retirerPhoto();
  await pause(40);
  const gardeHorsLigne = garde();
  const magasin = [...globalThis.__magasin.entries()];
  premier.moteur.arreter();
  const { s } = await demarrer({ ...AVEC_PHOTO, magasin, avatar: DEFAUT });
  assert.equal(gardeHorsLigne.retraitPhoto, true);
  assert.ok(gardeHorsLigne.aEnvoyer.some((m) => m.champ === "avatar"));
  assert.deepEqual(lireDemandesPhoto(s), ["DELETE photo"]);
  assert.equal(s.serveur.avatar, "🍕");
  assert.deepEqual(s.avatar, PIZZA);
  assert.ok(!garde().retraitPhoto);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("P4. dernier choix gagne, hors ligne : photo, puis 🌮, puis Miami ; au retour, seul le Miami part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.horsLigne = true;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  await moteur.modifierAvatar(TACO);
  await pause(40);
  await moteur.modifierAvatar(TOQUE);
  await pause(40);
  s.horsLigne = false;
  s.demandes.length = 0;
  for (let i = 0; i < 10 && lireMinuteriesEnAttente().length > 0; i++) await declencher();
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"miami:toque"}']);
  assert.equal(s.serveur.avatar, "miami:toque");
  assert.deepEqual(s.avatar, TOQUE);
  assert.ok(globalThis.__journalAvatar.includes("photo-supprimee:" + A_ENVOYER.uri), "la photo remplacée quitte le téléphone");
  assert.deepEqual(garde().aEnvoyer, []);
});

test("P4. photo en ligne, un emoji choisi : DELETE puis PATCH, dans cet ordre", async () => {
  const { moteur, s } = await demarrer(AVEC_PHOTO);
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(60);
  assert.deepEqual(s.demandes, ["DELETE photo", 'PATCH {"avatar":"🌮"}']);
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(s.avatar, TACO);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.equal(garde().avatarServeur, "🌮");
});

test("P4. photo en ligne, hors ligne : 🌮 puis une nouvelle photo ; au retour, seule la nouvelle photo part", async () => {
  const { moteur, s } = await demarrer(AVEC_PHOTO);
  s.horsLigne = true;
  await moteur.modifierAvatar(TACO);
  await pause(40);
  await moteur.modifierAvatar(A_ENVOYER_B);
  await pause(40);
  s.horsLigne = false;
  s.demandes.length = 0;
  for (let i = 0; i < 10 && lireMinuteriesEnAttente().length > 0; i++) await declencher();
  assert.deepEqual(s.demandes, ["POST photo"]);
  assert.ok(lireAvatarPhoto(s.serveur.avatar) && s.serveur.avatar !== SUR_LE_SERVEUR);
  assert.equal(s.avatar.partage, s.serveur.avatar);
  assert.equal(s.repli, "🍕", "le repli du serveur n'a pas bougé");
});

test("P4. 🌮 choisi pendant le voyage de la photo : la photo arrive, puis DELETE et PATCH 🌮", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(A_ENVOYER);
  await pause(10);
  await moteur.modifierAvatar(TACO);
  lacher();
  s.retard = null;
  await p;
  await pause(80);
  assert.deepEqual(s.demandes, ["POST photo", "DELETE photo", 'PATCH {"avatar":"🌮"}']);
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(s.avatar, TACO);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("P4. un emoji part alors qu'une photo inconnue du téléphone est en ligne : DELETE, puis l'emoji repart", async () => {
  const t = monter({ magasin: etat(), serveur: { ...VU, avatar: SUR_LE_SERVEUR }, repli: "🍕" });
  t.moteur.poserAvatar(PIZZA);
  t.moteur.poserProfil(structuredClone(LOCAL));
  await t.moteur.modifierAvatar(TACO);
  t.moteur.charger();
  await pause(5);
  t.moteur.activer(true);
  await pause(100);
  assert.deepEqual(t.s.demandes, ['PATCH {"avatar":"🌮"}', "DELETE photo", 'PATCH {"avatar":"🌮"}']);
  assert.equal(t.s.serveur.avatar, "🌮");
  assert.deepEqual(t.s.avatar, TACO);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("P5. compte limité : la photo est refusée, le téléphone reprend 🍕, aucun nouvel essai", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.limite = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(60);
  assert.deepEqual(s.demandes, ["POST photo", "GET"]);
  assert.deepEqual(s.avatar, PIZZA);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.deepEqual(dernierEtat(s), { operation: "envoi", etat: "refusee", raison: "compte-limite" });
  assert.deepEqual(lireMinuteriesEnAttente(), []);
  assert.ok(globalThis.__journalAvatar.includes("photo-supprimee:" + A_ENVOYER.uri));
});

test("P6. 20 photos aujourd'hui (429) : la photo attend Retry-After, le reste du profil part quand même", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.refusPhoto = { erreur: "trop-de-demandes", details: { attenteS: 3600 } };
  s.demandes.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  const etat429 = dernierEtat(s);
  const attente = lireMinuteriesEnAttente();
  const r = await moteur.modifierInfos({ ville: "Lyon" });
  await pause(40);
  const avantRetour = [...s.demandes];
  s.refusPhoto = null;
  await plusTard(3_700_000, () => declencher(60));
  assert.equal(etat429.raison, "quota");
  assert.equal(etat429.etat, "attente");
  assert.ok(etat429.jusqua > Date.now(), "jusqu'à quand");
  assert.deepEqual(attente, [3_600_000]);
  assert.deepEqual(r, { ok: true, parti: true });
  assert.deepEqual(avantRetour, ["POST photo", 'PATCH {"ville":"Lyon"}']);
  assert.equal(s.serveur.ville, "Lyon");
  assert.deepEqual(lireDemandesPhoto(s), ["POST photo", "POST photo"]);
  assert.ok(lireAvatarPhoto(s.serveur.avatar));
  assert.deepEqual(garde().aEnvoyer, []);
});

test("P7. stockage plein (503) : la photo attend une heure, puis part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.refusPhoto = { erreur: "stockage-plein" };
  s.demandes.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  const etat503 = dernierEtat(s);
  const attente = lireMinuteriesEnAttente();
  await moteur.auPremierPlan();
  await pause(40);
  const avantLHeure = lireDemandesPhoto(s).length;
  s.refusPhoto = null;
  await plusTard(3_700_000, () => declencher(60));
  assert.equal(etat503.raison, "stockage");
  assert.deepEqual(attente, [3_600_000]);
  assert.equal(avantLHeure, 1, "rien ne repart avant l'heure");
  assert.ok(lireAvatarPhoto(s.serveur.avatar));
  assert.equal(dernierEtat(s), null);
});

for (const [erreur, details] of [["format-refuse"], ["media-trop-lourd"], ["media-invalide", "dimensions"]]) {
  test(`P7. ${erreur} : refusée pour de bon, le téléphone reprend 🍕, aucun nouvel essai`, async () => {
    const { moteur, s } = await demarrer(AVEC_PIZZA);
    s.refusPhoto = { erreur, ...(details ? { champ: details } : {}) };
    s.demandes.length = 0;
    await moteur.modifierAvatar(A_ENVOYER);
    await pause(60);
    assert.deepEqual(s.demandes, ["POST photo", "GET"]);
    assert.deepEqual(dernierEtat(s), { operation: "envoi", etat: "refusee", raison: "fichier" });
    assert.deepEqual(s.avatar, PIZZA);
    assert.deepEqual(lireMinuteriesEnAttente(), []);
  });
}

test("P7. la photo à envoyer ne se lit plus : refusée une fois, pas de boucle", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  globalThis.__photosIllisibles.add(A_ENVOYER.uri);
  s.demandes.length = 0;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(60);
  assert.deepEqual(s.demandes, ["GET"]);
  assert.deepEqual(dernierEtat(s), { operation: "envoi", etat: "refusee", raison: "fichier" });
  assert.deepEqual(s.avatar, PIZZA);
});

test("P8. photo choisie avant (gardée sur le téléphone) : jamais envoyée toute seule, puis partie quand la personne le décide", async () => {
  const { moteur, s } = await demarrer({ ...AVEC_PIZZA, avatar: PHOTO_A });
  await moteur.modifierInfos({ ville: "Lyon" });
  await pause(40);
  await plusTard(120_000, async () => {
    moteur.auPremierPlan();
    await pause(40);
  });
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  const avant = lireDemandesPhoto(s);
  const avatarAvant = structuredClone(s.avatar);
  await moteur.modifierAvatar({ ...PHOTO_A, partage: "a-envoyer" });
  await pause(40);
  assert.deepEqual(avant, []);
  assert.deepEqual(avatarAvant, PHOTO_A);
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
  assert.deepEqual(lireDemandesPhoto(s), ["POST photo"]);
  assert.equal(s.avatar.partage, s.serveur.avatar);
});

test("P9. visite : une photo choisie reste sur le téléphone, et rien ne part après l'inscription", async () => {
  const { moteur, s } = await demarrer({ profil: null });
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(20);
  const gardee = structuredClone(globalThis.__avatarDisque);
  await moteur.installer(structuredClone(LOCAL));
  moteur.activer(true);
  await pause(60);
  assert.deepEqual(gardee, { type: "photo", uri: A_ENVOYER.uri });
  assert.deepEqual(lireDemandesPhoto(s), []);
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
  assert.deepEqual(s.avatar, { type: "photo", uri: A_ENVOYER.uri });
});

test("P10. réinstallation : la photo du serveur est adoptée (lue sur le serveur), rien ne part", async () => {
  const { s } = await demarrer({ magasin: [], serveur: { ...VU, avatar: SUR_LE_SERVEUR }, avatar: DEFAUT });
  assert.deepEqual(s.demandes, ["GET"]);
  assert.deepEqual(s.avatar, EN_LIGNE);
});

test("P10. une autre photo choisie sur un autre téléphone : adoptée ; photo retirée par l'équipe : retour au défaut", async () => {
  const autre = "photo:99999999-8888-4777-a666-555555555555.jpg";
  const { moteur, s } = await demarrer({ ...AVEC_PHOTO, serveur: { ...VU, avatar: autre } });
  const adoptee = structuredClone(s.avatar);
  s.serveur.avatar = null;
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  assert.deepEqual(adoptee, { type: "photo", uri: null, partage: autre });
  assert.deepEqual(s.avatar, DEFAUT);
  assert.deepEqual(lireDemandesPhoto(s), []);
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
});

test("P11. retirer une photo pas encore partie (rien en ligne) : pas de DELETE, retour à 🍕, le fichier quitte le téléphone", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.horsLigne = true;
  await moteur.modifierAvatar(A_ENVOYER);
  await pause(40);
  await moteur.retirerPhoto();
  await pause(20);
  s.horsLigne = false;
  s.demandes.length = 0;
  for (let i = 0; i < 10 && lireMinuteriesEnAttente().length > 0; i++) await declencher();
  assert.deepEqual(lireDemandesPhoto(s), []);
  assert.deepEqual(s.avatar, PIZZA);
  assert.ok(globalThis.__journalAvatar.includes("photo-supprimee:" + A_ENVOYER.uri));
  assert.deepEqual(garde().aEnvoyer, []);
  assert.equal(s.serveur.avatar, "🍕");
});

test("P11. retrait choisi pendant l'envoi de la photo : la photo arrive, puis DELETE ; le téléphone revient à 🍕", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(A_ENVOYER);
  await pause(10);
  await moteur.retirerPhoto();
  lacher();
  s.retard = null;
  await p;
  await pause(80);
  assert.deepEqual(s.demandes, ["POST photo", "DELETE photo"]);
  assert.equal(s.serveur.avatar, "🍕");
  assert.deepEqual(s.avatar, PIZZA);
  assert.deepEqual(garde().aEnvoyer, []);
  assert.ok(!garde().retraitPhoto);
});

test("P12. déconnexion pendant l'envoi : la réponse est ignorée, rien ne suit chez le compte suivant", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(A_ENVOYER);
  await pause(10);
  await moteur.oublier();
  moteur.poserAvatar(DEFAUT);
  moteur.poserProfil(null);
  moteur.activer(false);
  await moteur.installer({ ...LOCAL, prenom: "Zoe", pseudo: "zoe" });
  lacher();
  s.retard = null;
  await p;
  await pause(30);
  s.serveur = { ...VU, prenom: "Zoe", pseudo: "zoe", avatar: null };
  moteur.activer(true);
  await pause(80);
  assert.deepEqual(lireDemandesPhoto(s), ["POST photo"]);
  assert.deepEqual(s.avatar, DEFAUT);
  assert.equal(s.serveur.avatar, null);
  assert.deepEqual(garde().aEnvoyer, []);
});
