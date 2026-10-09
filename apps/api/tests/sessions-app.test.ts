// Tests des sessions de l'app : jeton en « Authorization: Bearer », session « app » d'un an prolongée à chaque usage (au
// plus une écriture par jour, sans limite totale), le site garde ses durées (30 jours sans visite, 90 jours au plus),
// « Me déconnecter partout », changement de mot de passe, et le ménage (durées par support, ambassadeur refusé).
// Tout en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { construireFiltreSessionsExpirees } from "../src/fonctions/comptes/construire-filtre-sessions-expirees.ts";
import { DUREES_SESSIONS, estSessionExpiree } from "../src/fonctions/comptes/est-session-expiree.ts";
import { lireSupportSession } from "../src/fonctions/comptes/lire-support-session.ts";
import { creerBancApp, MOT_DE_PASSE_TEST } from "./outils/creer-banc-app.ts";

const UN_JOUR = 86_400_000;
const { banc, memoire, ecritures, demander, inscrireApp, fermer } = await creerBancApp();
after(fermer);

const connecter = (email: string, support?: string) => demander("POST", "/comptes/session", { corps: { email, motDePasse: MOT_DE_PASSE_TEST, support } });
const lireSession = (jeton: string, site = false) => demander("GET", "/comptes/session", { jeton, site });

test("estSessionExpiree : le site (30 jours sans visite, 90 au plus), l'app (1 an sans usage, sans limite totale)", () => {
  const t0 = 0;
  assert.equal(estSessionExpiree({ support: "site", creeLe: t0, activite: t0 }, 30 * UN_JOUR), false);
  assert.equal(estSessionExpiree({ support: "site", creeLe: t0, activite: t0 }, 30 * UN_JOUR + 1), true);
  assert.equal(estSessionExpiree({ support: "site", creeLe: t0, activite: 89 * UN_JOUR }, 90 * UN_JOUR + 1), true);
  assert.equal(estSessionExpiree({ support: "app", creeLe: t0, activite: t0 }, 365 * UN_JOUR), false);
  assert.equal(estSessionExpiree({ support: "app", creeLe: t0, activite: t0 }, 365 * UN_JOUR + 1), true);
  assert.equal(estSessionExpiree({ support: "app", creeLe: t0, activite: 1000 * UN_JOUR }, 1200 * UN_JOUR), false, "pas de limite totale");
  assert.equal(DUREES_SESSIONS.app.ecritureActivite, UN_JOUR);
  assert.deepEqual(["app", "site", "autre", null].map(lireSupportSession), ["app", "site", "site", "site"]);
});

test("ménage de nuit : le filtre des sessions expirées suit le support (site 30/90 jours, app 1 an sans usage)", () => {
  const maintenant = new Date("2026-10-09T10:00:00Z");
  const jour = (n: number) => new Date(maintenant.getTime() - n * UN_JOUR);
  assert.deepEqual(construireFiltreSessionsExpirees(maintenant), {
    OR: [
      { support: { not: "app" }, OR: [{ activite: { lt: jour(30) } }, { creeLe: { lt: jour(90) } }] },
      { support: "app", activite: { lt: jour(365) } },
    ],
  });
});

test("connexion « app » : jeton en Bearer (ou X-Session-Compte), support inconnu : 400 ; sans jeton : 401", async () => {
  const { email } = await inscrireApp();
  const app = await connecter(email, "app");
  assert.equal(app.statut, 201);
  assert.equal((await lireSession(app.corps.session)).statut, 200);
  assert.equal((await lireSession(app.corps.session, true)).statut, 200);
  assert.equal((await connecter(email, "montre")).corps.champ, "support");
  assert.equal((await demander("GET", "/comptes/session", { jeton: "pas-un-jeton" })).statut, 401);
  assert.equal((await demander("GET", "/comptes/session")).statut, 401);
  // La déconnexion marche aussi avec le Bearer
  assert.deepEqual((await demander("DELETE", "/comptes/session", { jeton: app.corps.session })).corps, { ok: true });
  assert.equal((await lireSession(app.corps.session)).statut, 401);
});

test("session « app » : 1 an prolongé à chaque usage, sans limite de 90 jours ; 1 an sans usage : fermée", async () => {
  const { email, jeton } = await inscrireApp();
  const site = (await connecter(email)).corps.session as string;
  const debut = banc.horloge;
  try {
    // Un usage tous les 300 jours pendant 3 ans : toujours ouverte
    for (let annee = 1; annee <= 4; annee++) {
      banc.horloge += 300 * UN_JOUR;
      assert.equal((await lireSession(jeton)).statut, 200, `usage n° ${annee}`);
    }
    assert.equal((await lireSession(site, true)).statut, 401, "la session du site, elle, a fermé depuis longtemps");
    banc.horloge += 365 * UN_JOUR + 1;
    assert.equal((await lireSession(jeton)).statut, 401);
  } finally {
    banc.horloge = debut;
  }
});

test("session « app » : l'activité n'est réécrite qu'au plus une fois par jour ; le site garde ses 5 minutes", async () => {
  const { email, jeton } = await inscrireApp();
  const debut = banc.horloge;
  try {
    banc.horloge += 10 * 60_000;
    const avant = ecritures.toucher;
    for (let i = 0; i < 5; i++) assert.equal((await lireSession(jeton)).statut, 200);
    banc.horloge += 6 * 3600_000;
    assert.equal((await lireSession(jeton)).statut, 200);
    assert.equal(ecritures.toucher, avant, "moins d'un jour : rien n'est écrit");
    banc.horloge += UN_JOUR;
    await lireSession(jeton);
    await lireSession(jeton);
    assert.equal(ecritures.toucher, avant + 1);
    const site = (await connecter(email)).corps.session as string;
    banc.horloge += 6 * 60_000;
    await lireSession(site, true);
    assert.equal(ecritures.toucher, avant + 2, "site : réécrite après 5 minutes");
  } finally {
    banc.horloge = debut;
  }
});

test("« Me déconnecter partout » ferme toutes les sessions du compte, site et app ; pas celles des autres", async () => {
  const { email, jeton } = await inscrireApp();
  const autre = await inscrireApp();
  const site = (await connecter(email)).corps.session as string;
  const app2 = (await connecter(email, "app")).corps.session as string;
  assert.equal((await demander("POST", "/comptes/moi/deconnecter-partout")).statut, 401);
  assert.deepEqual((await demander("POST", "/comptes/moi/deconnecter-partout", { jeton })).corps, { ok: true });
  for (const fermee of [jeton, app2]) assert.equal((await lireSession(fermee)).statut, 401);
  assert.equal((await lireSession(site, true)).statut, 401);
  assert.equal((await lireSession(autre.jeton)).statut, 200);
});

test("changer de mot de passe depuis l'app : le nouveau jeton reste une session « app » (plus de 90 jours)", async () => {
  const { jeton } = await inscrireApp();
  const { statut, corps } = await demander("POST", "/comptes/moi/mot-de-passe", { jeton, corps: { actuel: MOT_DE_PASSE_TEST, nouveau: "une toute nouvelle phrase" } });
  assert.equal(statut, 200);
  assert.equal((await lireSession(jeton)).statut, 401);
  const debut = banc.horloge;
  try {
    banc.horloge += 200 * UN_JOUR;
    assert.equal((await lireSession(corps.session)).statut, 200);
  } finally {
    banc.horloge = debut;
  }
});

test("ménage : un ambassadeur refusé depuis plus de 30 jours perd son RÔLE, pas son compte (ni ses sessions)", async () => {
  const id = await memoire.services.creerCompte({
    email: "refuse@exemple.fr", motDePasse: "empreinte", prenom: "Rémi", ville: "Lyon", quartier: null, cguVersion: "2026-10-09",
  });
  assert.ok(typeof id === "number");
  await memoire.decider(id, "refuse");
  memoire.candidatures.push({
    id: 999, compteId: id, statut: "en-attente", pepites: "x", envies: [], reseaux: null, motivation: "x", partantRencontre: true, connuPar: null,
    communeCode: null, zoneCode: null, numeroLocal: null, numeroNational: null, creeLe: banc.horloge, reponduLe: null,
  });
  assert.equal(memoire.retirerAmbassadeursRefuses(banc.horloge + 29 * UN_JOUR), 0, "avant 30 jours : rien");
  assert.equal(memoire.retirerAmbassadeursRefuses(banc.horloge + 31 * UN_JOUR), 1);
  const compte = memoire.comptes.get(id);
  assert.ok(compte, "le compte reste");
  assert.equal(compte.statutAmbassadeur, null);
  assert.equal(memoire.candidatures.some((c) => c.compteId === id), false);
  assert.equal((await memoire.services.lireCompte(id))?.ambassadeur, null);
});
