process.env.TZ = "Europe/Paris";

import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireEnvoiMessage } from "~/fonctions/chat/decrire-envoi-message";
import { decrireMomentMessage } from "~/fonctions/chat/decrire-moment-message";

const MAINTENANT = new Date(2026, 9, 22, 19, 20);
const iso = (jour, heure, minute) => new Date(2026, 9, jour, heure, minute).toISOString();

test("le détail sous une bulle : « Envoyé » devant les tiens", () => {
  assert.deepEqual(decrireMomentMessage(iso(22, 19, 8), "19h08", MAINTENANT, true), { vu: "Envoyé il y a 12 min · 19h08", lu: "Envoyé il y a 12 minutes, à 19h08" });
  assert.deepEqual(decrireMomentMessage(iso(22, 19, 8), "19h08", MAINTENANT, false), { vu: "il y a 12 min · 19h08", lu: "il y a 12 minutes, à 19h08" });
});

test("hier, un jour de la semaine, une date : « le » seulement devant une date", () => {
  assert.equal(decrireMomentMessage(iso(21, 19, 8), "19h08", MAINTENANT, true).vu, "Envoyé hier · 19h08");
  assert.equal(decrireMomentMessage(iso(19, 19, 8), "19h08", MAINTENANT, true).vu, "Envoyé lun. · 19h08");
  assert.deepEqual(decrireMomentMessage(iso(12, 19, 8), "19h08", MAINTENANT, true), { vu: "Envoyé le 12 oct. · 19h08", lu: "Envoyé le 12 octobre, à 19h08" });
  assert.equal(decrireMomentMessage(iso(12, 19, 8), "19h08", MAINTENANT, false).vu, "12 oct. · 19h08");
});

test("date illisible : l'heure seule", () => {
  assert.deepEqual(decrireMomentMessage("?", "19h08", MAINTENANT, true), { vu: "19h08", lu: "19h08" });
});

test("sous ton dernier message : « Envoyé · il y a… »", () => {
  assert.deepEqual(decrireEnvoiMessage(iso(22, 19, 15), MAINTENANT), { vu: "Envoyé · il y a 5 min", lu: "Envoyé il y a 5 minutes" });
  assert.deepEqual(decrireEnvoiMessage(iso(22, 19, 20), MAINTENANT), { vu: "Envoyé · à l'instant", lu: "Envoyé à l'instant" });
  assert.deepEqual(decrireEnvoiMessage(iso(1, 9, 0), MAINTENANT), { vu: "Envoyé · 1er oct.", lu: "Envoyé le 1er octobre" });
  assert.deepEqual(decrireEnvoiMessage("?", MAINTENANT), { vu: "Envoyé", lu: "Envoyé" });
});
