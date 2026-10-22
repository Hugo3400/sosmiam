import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { declencher, lireMinuteriesEnAttente, oublierMinuteries, pause } from "../synchro-profil/banc/minuteries.mjs";
import { envoyerChoixTelephone } from "~/fonctions/notifications/envoyer-choix-telephone";

const JETON_NATIF = "natif-0123456789abcdefghij";
const JETON_GARDE = "garde-0123456789abcdefghij";
const NATIF = { ok: true, jeton: JETON_NATIF, plateforme: "ios" };

function creerOutils(o = {}) {
  const journal = [];
  let garde = o.garde === undefined ? JETON_NATIF : o.garde;
  const outils = {
    demo: false,
    ville: "Montpellier",
    plateforme: "ios",
    lireActives: async () => o.actives ?? true,
    lireJeton: (...args) => {
      journal.push(["lire-jeton", ...args]);
      return o.lu === "jamais" ? new Promise(() => {}) : Promise.resolve(o.lu ?? NATIF);
    },
    lireJetonGarde: async () => garde,
    inscrire: async (inscription) => {
      journal.push(["PUT", inscription]);
      return o.reponse ?? { ok: true };
    },
    desinscrire: async (jeton) => {
      journal.push(["DELETE", jeton]);
      return o.reponseDelete ?? { ok: true };
    },
    enregistrerJeton: async (jeton) => {
      journal.push(["garder", jeton]);
      garde = jeton;
    },
    effacerJeton: async () => {
      journal.push(["oublier"]);
      garde = null;
    },
    ...o.outils,
  };
  return { outils, journal, lireGarde: () => garde };
}

const requetes = (journal) => journal.filter(([quoi]) => quoi === "PUT" || quoi === "DELETE");

beforeEach(() => {
  globalThis.__magasin = new Map();
  oublierMinuteries();
});

test("jamais de question au système : le jeton est lu sans rien demander, et un « oui » sans autorisation ne part pas", async () => {
  for (const raison of ["a-demander", "refusee", "indisponible"]) {
    const t = creerOutils({ lu: { ok: false, raison } });
    assert.equal(await envoyerChoixTelephone("oui", t.outils), "sans-suite");
    assert.deepEqual(t.journal, [["lire-jeton"]]);
  }
});

test("autorisation donnée : le jeton natif part, avec la ville et le choix", async () => {
  for (const [choix, offres] of [["oui", true], ["non", false]]) {
    const t = creerOutils();
    assert.equal(await envoyerChoixTelephone(choix, t.outils), "parti");
    assert.deepEqual(requetes(t.journal), [["PUT", { jeton: JETON_NATIF, plateforme: "ios", ville: "Montpellier", offres }]]);
  }
});

test("un jeton neuf est gardé AVANT le PUT : une réponse perdue laisse de quoi retirer l'accord plus tard", async () => {
  const t = creerOutils({ garde: null, reponse: { ok: false, erreur: "hors-ligne" } });
  assert.equal(await envoyerChoixTelephone("oui", t.outils), "a-renvoyer");
  assert.deepEqual(t.journal.map(([quoi]) => quoi), ["lire-jeton", "garder", "PUT"]);
  assert.equal(t.lireGarde(), JETON_NATIF);
  const apres = creerOutils({ garde: t.lireGarde(), lu: { ok: false, raison: "refusee" } });
  assert.equal(await envoyerChoixTelephone("non", apres.outils), "parti");
  assert.deepEqual(requetes(apres.journal), [["PUT", { jeton: JETON_NATIF, plateforme: "ios", ville: "Montpellier", offres: false }]]);
});

test("éteindre sans autorisation du système : le jeton gardé part quand même, pour retirer l'accord", async () => {
  for (const raison of ["a-demander", "refusee", "indisponible"]) {
    const t = creerOutils({ garde: JETON_GARDE, lu: { ok: false, raison }, outils: { plateforme: "android" } });
    assert.equal(await envoyerChoixTelephone("non", t.outils), "parti");
    assert.deepEqual(requetes(t.journal), [["PUT", { jeton: JETON_GARDE, plateforme: "android", ville: "Montpellier", offres: false }]]);
    assert.equal(t.journal.some(([quoi]) => quoi === "garder"), false);
  }
});

test("allumer sans autorisation : rien ne part, même avec un vieux jeton gardé", async () => {
  const t = creerOutils({ garde: JETON_GARDE, lu: { ok: false, raison: "refusee" } });
  assert.equal(await envoyerChoixTelephone("oui", t.outils), "sans-suite");
  assert.deepEqual(requetes(t.journal), []);
});

test("éteindre sans autorisation ni jeton gardé : rien à retirer", async () => {
  const t = creerOutils({ garde: null, lu: { ok: false, raison: "refusee" } });
  assert.equal(await envoyerChoixTelephone("non", t.outils), "sans-suite");
  assert.deepEqual(requetes(t.journal), []);
});

test("navigateur : pas de plateforme de téléphone, rien ne part", async () => {
  const t = creerOutils({ garde: JETON_GARDE, lu: { ok: false, raison: "indisponible" }, outils: { plateforme: "web" } });
  assert.equal(await envoyerChoixTelephone("non", t.outils), "sans-suite");
  assert.deepEqual(requetes(t.journal), []);
});

test("démo : rien n'est lu, rien ne part", async () => {
  for (const choix of ["oui", "non", "couper"]) {
    const t = creerOutils({ outils: { demo: true } });
    assert.equal(await envoyerChoixTelephone(choix, t.outils), "sans-suite");
    assert.deepEqual(t.journal, []);
  }
});

test("couper : le jeton gardé est désinscrit, puis oublié", async () => {
  const t = creerOutils({ garde: JETON_GARDE });
  assert.equal(await envoyerChoixTelephone("couper", t.outils), "parti");
  assert.deepEqual(t.journal, [["DELETE", JETON_GARDE], ["oublier"]]);
  assert.equal(t.lireGarde(), null);
});

test("couper hors ligne : à renvoyer, et le jeton gardé reste pour le prochain essai", async () => {
  for (const erreur of ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]) {
    const t = creerOutils({ garde: JETON_GARDE, reponseDelete: { ok: false, erreur } });
    assert.equal(await envoyerChoixTelephone("couper", t.outils), "a-renvoyer");
    assert.equal(t.lireGarde(), JETON_GARDE);
  }
});

test("couper sans jeton gardé : le jeton natif s'il se lit sans rien demander, sinon rien", async () => {
  const t = creerOutils({ garde: null });
  assert.equal(await envoyerChoixTelephone("couper", t.outils), "parti");
  assert.deepEqual(requetes(t.journal), [["DELETE", JETON_NATIF]]);
  const sans = creerOutils({ garde: null, lu: { ok: false, raison: "refusee" } });
  assert.equal(await envoyerChoixTelephone("couper", sans.outils), "sans-suite");
  assert.deepEqual(requetes(sans.journal), []);
});

test("notifications coupées sur le téléphone : un « oui » ou un « non » en attente devient une désinscription", async () => {
  for (const choix of ["oui", "non"]) {
    const t = creerOutils({ actives: false, garde: JETON_GARDE });
    assert.equal(await envoyerChoixTelephone(choix, t.outils), "parti");
    assert.deepEqual(requetes(t.journal), [["DELETE", JETON_GARDE]]);
  }
});

test("pas de réseau, serveur en panne, trop de demandes : à renvoyer", async () => {
  for (const erreur of ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]) {
    const t = creerOutils({ reponse: { ok: false, erreur } });
    assert.equal(await envoyerChoixTelephone("non", t.outils), "a-renvoyer");
  }
});

test("refus définitif (champ invalide) : pas de nouvel essai en boucle", async () => {
  const t = creerOutils({ reponse: { ok: false, erreur: "champ-invalide", champ: "ville" } });
  assert.equal(await envoyerChoixTelephone("non", t.outils), "sans-suite");
});

test("ville vide : envoyée comme null", async () => {
  const t = creerOutils({ outils: { ville: "" } });
  await envoyerChoixTelephone("non", t.outils);
  assert.equal(requetes(t.journal)[0][1].ville, null);
});

test("nouveau jeton du téléphone : l'ancien est désinscrit avant, pour qu'il ne garde pas un vieil accord", async () => {
  const t = creerOutils({ garde: JETON_GARDE });
  assert.equal(await envoyerChoixTelephone("non", t.outils), "parti");
  assert.deepEqual(t.journal.slice(1).map(([quoi, x]) => [quoi, typeof x === "string" ? x : x.jeton]), [
    ["DELETE", JETON_GARDE],
    ["garder", JETON_NATIF],
    ["PUT", JETON_NATIF],
  ]);
});

test("nouveau jeton, ancien pas désinscrit faute de réseau : rien d'autre ne part, à renvoyer", async () => {
  const t = creerOutils({ garde: JETON_GARDE, reponseDelete: { ok: false, erreur: "hors-ligne" } });
  assert.equal(await envoyerChoixTelephone("oui", t.outils), "a-renvoyer");
  assert.deepEqual(requetes(t.journal), [["DELETE", JETON_GARDE]]);
  assert.equal(t.lireGarde(), JETON_GARDE);
});

test("lecture du jeton qui ne finit jamais : lâchée au bout de 10 s", async () => {
  const cas = [
    ["oui", JETON_GARDE, "a-renvoyer", []],
    ["non", JETON_GARDE, "parti", [["PUT", JETON_GARDE]]],
    ["non", null, "a-renvoyer", []],
    ["couper", null, "a-renvoyer", []],
  ];
  for (const [choix, garde, issue, attendu] of cas) {
    oublierMinuteries();
    const t = creerOutils({ garde, lu: "jamais" });
    const envoi = envoyerChoixTelephone(choix, t.outils);
    await pause(5);
    assert.deepEqual(lireMinuteriesEnAttente(), [10_000], `${choix} : la lecture attend`);
    await declencher(5);
    assert.equal(await envoi, issue, choix);
    assert.deepEqual(requetes(t.journal).map(([quoi, x]) => [quoi, typeof x === "string" ? x : x.jeton]), attendu, choix);
    assert.deepEqual(lireMinuteriesEnAttente(), []);
  }
});

test("une lecture du jeton qui lève une erreur compte comme indisponible", async () => {
  const t = creerOutils({ garde: null, outils: { lireJeton: async () => { throw new Error("module natif absent"); } } });
  assert.equal(await envoyerChoixTelephone("oui", t.outils), "sans-suite");
  assert.deepEqual(lireMinuteriesEnAttente(), []);
});

test("envoi lâché par le moteur : plus aucune requête ne part", async () => {
  for (const choix of ["oui", "non", "couper"]) {
    const t = creerOutils({ garde: JETON_GARDE });
    assert.equal(await envoyerChoixTelephone(choix, t.outils, () => false), "sans-suite");
    assert.deepEqual(requetes(t.journal), [], choix);
  }
});

test("clé de l'aperçu : jointe au PUT quand le compte en a une, absente sinon ; une lecture en panne ne bloque rien", async () => {
  const CLE = "A".repeat(43);
  const avec = creerOutils({ outils: { lireCleApercu: async () => CLE } });
  assert.equal(await envoyerChoixTelephone("non", avec.outils), "parti");
  assert.deepEqual(requetes(avec.journal), [["PUT", { jeton: JETON_NATIF, plateforme: "ios", ville: "Montpellier", offres: false, cleApercu: CLE }]]);
  for (const lireCleApercu of [async () => null, async () => { throw new Error("trousseau"); }, undefined]) {
    const t = creerOutils({ outils: { lireCleApercu } });
    assert.equal(await envoyerChoixTelephone("non", t.outils), "parti");
    assert.deepEqual(requetes(t.journal), [["PUT", { jeton: JETON_NATIF, plateforme: "ios", ville: "Montpellier", offres: false }]]);
  }
  const coupe = creerOutils({ outils: { lireCleApercu: async () => CLE } });
  await envoyerChoixTelephone("couper", coupe.outils);
  assert.deepEqual(requetes(coupe.journal), [["DELETE", JETON_NATIF]], "couper : aucune clé ne part");
});
