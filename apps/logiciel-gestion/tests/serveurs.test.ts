import assert from "node:assert/strict";
import { test } from "node:test";

import { TEXTES_SERVEURS } from "../src/contenus/serveurs-dev.ts";
import { decrireEtatServeur } from "../src/fonctions/maintenance/decrire-etat-serveur.ts";
import { expliquerErreurServeur } from "../src/fonctions/maintenance/expliquer-erreur-serveur.ts";
import { listerActionsServeur } from "../src/fonctions/maintenance/lister-actions-serveur.ts";
import type { ErreurApi } from "../src/services/client-gestion.ts";

const erreurApi = (code: string, detail: string | null = null) => ({ code, statut: 0, champ: null, detail }) as unknown as ErreurApi;

test("boutons des serveurs : éteindre et redémarrer s'il tourne, allumer s'il est éteint ou planté, rien pour la production", () => {
  assert.deepEqual(listerActionsServeur({ pilotable: true, etat: "en-ligne" }), ["eteindre", "redemarrer"]);
  assert.deepEqual(listerActionsServeur({ pilotable: true, etat: "arrete" }), ["allumer"]);
  assert.deepEqual(listerActionsServeur({ pilotable: true, etat: "en-erreur" }), ["allumer"]);
  for (const etat of ["en-transition", "absent", "inconnu"] as const) assert.deepEqual(listerActionsServeur({ pilotable: true, etat }), [], etat);
  for (const etat of ["en-ligne", "arrete", "en-erreur", "en-transition", "absent", "inconnu"] as const) {
    assert.deepEqual(listerActionsServeur({ pilotable: false, etat }), [], etat);
  }
});

test("pastilles d'état : un serveur de dev éteint est normal, la production éteinte est rouge", () => {
  assert.deepEqual(decrireEtatServeur("en-ligne", true), { libelle: "Allumé", ton: "vert" });
  assert.deepEqual(decrireEtatServeur("en-ligne", false), { libelle: "En ligne", ton: "vert" });
  assert.deepEqual(decrireEtatServeur("arrete", true), { libelle: "Éteint", ton: "neutre" });
  assert.deepEqual(decrireEtatServeur("arrete", false), { libelle: "Éteint", ton: "rouge" });
  assert.equal(decrireEtatServeur("absent", true).ton, "rouge");
});

test("erreurs des serveurs en phrases, avec la ligne de pm2 quand il y en a une", () => {
  assert.equal(expliquerErreurServeur(erreurApi("lecture-seule")), "Celui-là reste en lecture seule : on ne coupe pas la production d'un clic.");
  assert.equal(
    expliquerErreurServeur(erreurApi("pm2-erreur", "Script not found")),
    "pm2 a refusé. Sa réponse : « Script not found »",
  );
  assert.equal(expliquerErreurServeur(erreurApi("reseau")), "Le serveur ne répond pas. Vérifie ta connexion, ou l'état du serveur.");
  assert.equal(expliquerErreurServeur(null), "");
});

test("le serveur Expo prévient du tunnel public et du redémarrage après un module natif", () => {
  const notes = TEXTES_SERVEURS["app-dev"]!.notes.map((note) => note.texte).join(" ");
  assert.ok(notes.includes("Metro") && notes.includes("Internet") && notes.includes("tunnel"));
  assert.ok(notes.includes("module natif") && notes.includes("ExpoAsset"));
  assert.ok(TEXTES_SERVEURS["app-dev"]!.notes.some((note) => note.ton === "alerte"));
});
