// Tests du profil de l'app (GET et PATCH /comptes/moi/profil, GET /comptes/pseudo-disponible), de « Proposer un nouveau
// lieu » ouvert aux 18 ans et plus (POST /comptes/moi/propositions-lieux) et des adresses /app (heure et version
// minimale). Tout en mémoire, avec une clé de TEST : aucune base de données, jamais la vraie clé.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { lireVersionApp } from "../src/fonctions/texte/lire-version-app.ts";
import { creerBancApp } from "./outils/creer-banc-app.ts";

const { banc, memoire, demander, inscrireApp, rendrePro, fermer } = await creerBancApp({ versionMinimale: { ios: "1.2.0", android: "1.1.3" } });
const sansCle = await creerBancApp({ sansCle: true });
after(async () => {
  await fermer();
  await sansCle.fermer();
});

const lireProfil = (jeton: string) => demander("GET", "/comptes/moi/profil", { jeton });
const modifier = (jeton: string, corps: unknown) => demander("PATCH", "/comptes/moi/profil", { jeton, corps });

test("GET profil : déchiffré, avec l'âge ; un compte du site n'a ni date ni ville de profil ; sans session : 401", async () => {
  const { jeton } = await inscrireApp({ nom: "Martin", dateNaissance: "2009-03-14", ville: "Nantes", pseudo: "zoe_m", envies: { boissons: ["cafe"] } });
  const { statut, corps } = await lireProfil(jeton);
  assert.equal(statut, 200);
  assert.deepEqual(corps, {
    ok: true,
    profil: {
      prenom: "Zoé", nom: "Martin", pseudo: "zoe_m", dateNaissance: "2009-03-14", ville: "Nantes", envies: { boissons: ["cafe"] }, avatar: null,
      prive: false, emailVerifie: false, age: 17,
    },
  });
  const site = await demander("POST", "/comptes", {
    corps: { email: "site@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Léo", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true },
  });
  const profilSite = (await lireProfil(site.corps.session)).corps.profil;
  assert.deepEqual([profilSite.dateNaissance, profilSite.ville, profilSite.age, profilSite.nom, profilSite.envies], [null, null, null, null, {}]);
  assert.equal((await demander("GET", "/comptes/moi/profil")).statut, 401);
});

test("PATCH profil : prénom, nom (effaçable), pseudo, ville, envies (remplacées), avatar emoji, privé ; jamais la date", async () => {
  const { id, jeton } = await inscrireApp({ nom: "Martin", envies: { lieux: ["restos"] } });
  const { statut, corps } = await modifier(jeton, {
    prenom: " Zoé-Lou ", nom: "Durand", pseudo: "@ZoeLou", ville: "Brest", envies: { musique: ["jazz"] }, avatar: "🦊", prive: true,
  });
  assert.equal(statut, 200);
  assert.deepEqual(
    { ...corps.profil, emailVerifie: undefined, age: undefined, dateNaissance: undefined },
    { prenom: "Zoé-Lou", nom: "Durand", pseudo: "zoelou", ville: "Brest", envies: { musique: ["jazz"] }, avatar: "🦊", prive: true,
      emailVerifie: undefined, age: undefined, dateNaissance: undefined },
  );
  assert.ok(!JSON.stringify(memoire.comptes.get(id)).includes("Durand"), "le nom reste chiffré");
  // Champ absent : inchangé ; null : nom et avatar effacés ; un drapeau est un emoji
  const efface = (await modifier(jeton, { nom: null, avatar: "🇫🇷" })).corps.profil;
  assert.deepEqual([efface.nom, efface.avatar, efface.ville, efface.pseudo], [null, "🇫🇷", "Brest", "zoelou"]);
  assert.equal((await modifier(jeton, { avatar: "" })).corps.profil.avatar, null);
  // Rien à changer : le profil tel quel
  assert.equal((await modifier(jeton, {})).statut, 200);
  const refus: [string, Record<string, unknown>][] = [
    ["dateNaissance", { dateNaissance: "1990-01-01" }],
    ["envies", { envies: { regimes: ["halal"] } }],
    ["avatar", { avatar: "A" }], ["avatar", { avatar: "🦊🦊" }], ["avatar", { avatar: 3 }],
    ["prive", { prive: "oui" }],
    ["pseudo", { pseudo: "pu.te" }], ["pseudo", { pseudo: null }],
    ["prenom", { prenom: "" }], ["ville", { ville: "x" }],
  ];
  for (const [champ, corpsRefuse] of refus) {
    const reponse = await modifier(jeton, corpsRefuse);
    assert.equal(reponse.statut, 400, champ);
    assert.equal(reponse.corps.champ, champ);
  }
  assert.equal((await lireProfil(jeton)).corps.profil.dateNaissance, "2000-01-31", "la date n'a pas bougé");
});

test("pseudo : 409 pseudo-pris s'il est à un autre ; le sien passe ; pseudo-disponible le dit (400 si mal formé)", async () => {
  const a = await inscrireApp({ pseudo: "camille" });
  const b = await inscrireApp();
  assert.deepEqual((await modifier(b.jeton, { pseudo: "Camille" })).corps, { ok: false, erreur: "pseudo-pris" });
  assert.equal((await modifier(a.jeton, { pseudo: "camille" })).statut, 200);
  const dispo = async (jeton: string, pseudo: string) => demander("GET", `/comptes/pseudo-disponible?pseudo=${encodeURIComponent(pseudo)}`, { jeton });
  assert.deepEqual((await dispo(b.jeton, "camille")).corps, { ok: true, disponible: false });
  assert.deepEqual((await dispo(a.jeton, "@Camille")).corps, { ok: true, disponible: true }, "le sien");
  assert.deepEqual((await dispo(b.jeton, "camille.b")).corps, { ok: true, disponible: true });
  assert.deepEqual((await dispo(b.jeton, "connard")).corps, { ok: true, disponible: false }, "gros mot : jamais");
  assert.equal((await dispo(b.jeton, "a b")).corps.champ, "pseudo");
  assert.equal((await demander("GET", "/comptes/pseudo-disponible?pseudo=camille")).statut, 401);
  // 60 questions par compte toutes les 10 minutes, même en changeant d'IP
  const c = await inscrireApp();
  for (let i = 0; i < 60; i++) assert.equal((await dispo(c.jeton, `essai${i}`)).statut, 200);
  assert.equal((await dispo(c.jeton, "encore")).statut, 429);
});

test("sans clé : GET et PATCH profil répondent 503 chiffrement-indisponible", async () => {
  const site = await sansCle.demander("POST", "/comptes", { corps: sansCle.inscriptionApp({ espace: "ambassadeur" }) });
  assert.equal((await sansCle.demander("GET", "/comptes/moi/profil", { jeton: site.corps.session })).statut, 503);
  const patch = await sansCle.demander("PATCH", "/comptes/moi/profil", { jeton: site.corps.session, corps: { prive: true } });
  assert.deepEqual([patch.statut, patch.corps.erreur], [503, "chiffrement-indisponible"]);
});

const PROPOSITION = { nom: "Le Petit Four", type: "patisserie", ville: "Nantes", description: "Des choux garnis à la minute, une équipe adorable." };

test("proposer un nouveau lieu : 18 ans et plus (âge connu, ambassadeur actif ou pro validé) ; 15-17 ans : 403", async () => {
  const mineur = await inscrireApp({ dateNaissance: "2010-06-01" });
  const proposer = (jeton: string, corps: unknown = PROPOSITION) => demander("POST", "/comptes/moi/propositions-lieux", { jeton, corps });
  assert.deepEqual((await proposer(mineur.jeton)).corps, { ok: false, erreur: "reserve-aux-majeurs" });
  assert.equal((await demander("GET", "/comptes/moi/propositions-lieux", { jeton: mineur.jeton })).statut, 403);
  // Mineur avec un lieu validé quand même : toujours non
  await rendrePro(mineur.jeton);
  assert.equal((await proposer(mineur.jeton)).statut, 403);

  const majeur = await inscrireApp({ dateNaissance: "2008-10-09" });
  assert.equal((await proposer(majeur.jeton)).statut, 201, "18 ans tout juste");
  const gardee = memoire.propositions.at(-1);
  assert.deepEqual([gardee?.nom, gardee?.compteId, gardee?.origine, gardee?.statut], ["Le Petit Four", majeur.id, "compte", "a-traiter"]);
  assert.equal((await proposer(majeur.jeton, { ...PROPOSITION, description: "court" })).corps.champ, "description");
  const liste = (await demander("GET", "/comptes/moi/propositions-lieux", { jeton: majeur.jeton })).corps;
  assert.deepEqual(liste.propositions.map(({ nom, statut }: { nom: string; statut: string }) => [nom, statut]), [["Le Petit Four", "a-traiter"]]);

  // Comptes du site (âge inconnu) : seulement ambassadeur actif ou pro validé
  const site = await demander("POST", "/comptes", {
    corps: { email: "pro-site@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Léo", dateNaissance: "1990-01-01", cgu: true, espace: "pro" },
  });
  assert.equal((await proposer(site.corps.session)).statut, 403);
  await rendrePro(site.corps.session);
  assert.equal((await proposer(site.corps.session)).statut, 201);
  const ambassadeur = await demander("POST", "/comptes", {
    corps: { email: "amb@exemple.fr", motDePasse: "mon chat adore les croissants", prenom: "Léa", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true },
  });
  assert.equal((await proposer(ambassadeur.corps.session)).statut, 403, "en attente : pas encore");
  const ambassadeurId = [...memoire.comptes.values()].find((compte) => compte.email === "amb@exemple.fr")?.id ?? 0;
  await memoire.decider(ambassadeurId, "actif");
  assert.equal((await proposer(ambassadeur.corps.session)).statut, 201);
  // La route du site reste réservée aux ambassadeurs actifs, avec son origine
  assert.equal((await demander("POST", "/comptes/moi/propositions", { jeton: majeur.jeton, corps: PROPOSITION })).statut, 403);
  assert.equal((await demander("POST", "/comptes/moi/propositions", { jeton: ambassadeur.corps.session, site: true, corps: PROPOSITION })).statut, 201);
  assert.equal(memoire.propositions.at(-1)?.origine, "ambassadeur");
});

test("proposer un nouveau lieu : 10 par compte et par 24 heures", async () => {
  const { jeton } = await inscrireApp();
  for (let i = 0; i < 10; i++) {
    assert.equal((await demander("POST", "/comptes/moi/propositions-lieux", { jeton, corps: { ...PROPOSITION, nom: `Lieu ${i}` } })).statut, 201);
  }
  assert.equal((await demander("POST", "/comptes/moi/propositions-lieux", { jeton, corps: PROPOSITION })).statut, 429);
});

test("GET /app/temps : l'heure du serveur et le jour à Paris, sans session ni cache", async () => {
  const debut = banc.horloge;
  try {
    banc.horloge = Date.parse("2026-10-09T22:30:00Z");
    const { statut, corps, entetes } = await demander("GET", "/app/temps");
    assert.equal(statut, 200);
    assert.deepEqual(corps, { ok: true, maintenant: "2026-10-09T22:30:00.000Z", jourParis: "2026-10-10" });
    assert.equal(entetes.get("cache-control"), "no-store");
  } finally {
    banc.horloge = debut;
  }
});

test("GET /app/version : versions minimales réglées, « 0.0.0 » par défaut ; lireVersionApp écarte les valeurs mal écrites", async () => {
  assert.deepEqual((await demander("GET", "/app/version")).corps, { ok: true, minimale: { ios: "1.2.0", android: "1.1.3" } });
  assert.deepEqual((await sansCle.demander("GET", "/app/version")).corps, { ok: true, minimale: { ios: "0.0.0", android: "0.0.0" } });
  assert.deepEqual([" 1.4.0 ", "1.4", "v1.4.0", undefined, "", "10.20.30"].map((v) => lireVersionApp(v)), ["1.4.0", "0.0.0", "0.0.0", "0.0.0", "0.0.0", "10.20.30"]);
});
