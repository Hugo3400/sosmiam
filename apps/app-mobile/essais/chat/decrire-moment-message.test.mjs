process.env.TZ = "Europe/Paris";

import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireEnvoiMessage } from "~/fonctions/chat/decrire-envoi-message";
import { decrireMomentMessage } from "~/fonctions/chat/decrire-moment-message";

const MAINTENANT = new Date(2026, 9, 22, 19, 20);
const iso = (jour, heure, minute) => new Date(2026, 9, jour, heure, minute).toISOString();

test("le détail sous une bulle : « Envoyé » devant les tiens", () => {
  assert.deepEqual(decrireMomentMessage(iso(22, 19, 8), "19h08", MAINTENANT, true, "fr"), { vu: "Envoyé il y a 12 min · 19h08", lu: "Envoyé il y a 12 minutes, à 19h08" });
  assert.deepEqual(decrireMomentMessage(iso(22, 19, 8), "19h08", MAINTENANT, false, "fr"), { vu: "il y a 12 min · 19h08", lu: "il y a 12 minutes, à 19h08" });
});

test("hier, un jour de la semaine, une date : « le » seulement devant une date", () => {
  assert.equal(decrireMomentMessage(iso(21, 19, 8), "19h08", MAINTENANT, true, "fr").vu, "Envoyé hier · 19h08");
  assert.equal(decrireMomentMessage(iso(19, 19, 8), "19h08", MAINTENANT, true, "fr").vu, "Envoyé lun. · 19h08");
  assert.deepEqual(decrireMomentMessage(iso(12, 19, 8), "19h08", MAINTENANT, true, "fr"), { vu: "Envoyé le 12 oct. · 19h08", lu: "Envoyé le 12 octobre, à 19h08" });
  assert.equal(decrireMomentMessage(iso(12, 19, 8), "19h08", MAINTENANT, false, "fr").vu, "12 oct. · 19h08");
});

test("date illisible : l'heure seule", () => {
  assert.deepEqual(decrireMomentMessage("?", "19h08", MAINTENANT, true, "fr"), { vu: "19h08", lu: "19h08" });
});

test("sous ton dernier message : « Envoyé · il y a… »", () => {
  assert.deepEqual(decrireEnvoiMessage(iso(22, 19, 15), MAINTENANT, "fr"), { vu: "Envoyé · il y a 5 min", lu: "Envoyé il y a 5 minutes" });
  assert.deepEqual(decrireEnvoiMessage(iso(22, 19, 20), MAINTENANT, "fr"), { vu: "Envoyé · à l'instant", lu: "Envoyé à l'instant" });
  assert.deepEqual(decrireEnvoiMessage(iso(1, 9, 0), MAINTENANT, "fr"), { vu: "Envoyé · 1er oct.", lu: "Envoyé le 1er octobre" });
  assert.deepEqual(decrireEnvoiMessage("?", MAINTENANT, "fr"), { vu: "Envoyé", lu: "Envoyé" });
});

test("en anglais : « Sent », « on » devant un jour ou une date, l'heure en 24 h", () => {
  assert.deepEqual(decrireMomentMessage(iso(22, 19, 8), "19:08", MAINTENANT, true, "en"), { vu: "Sent 12 min ago · 19:08", lu: "Sent 12 minutes ago, at 19:08" });
  assert.equal(decrireMomentMessage(iso(21, 19, 8), "19:08", MAINTENANT, true, "en").vu, "Sent yesterday · 19:08");
  assert.equal(decrireMomentMessage(iso(19, 19, 8), "19:08", MAINTENANT, true, "en").vu, "Sent on Mon · 19:08");
  assert.deepEqual(decrireMomentMessage(iso(12, 19, 8), "19:08", MAINTENANT, true, "en"), { vu: "Sent on 12 Oct · 19:08", lu: "Sent on 12 October, at 19:08" });
  assert.equal(decrireMomentMessage(iso(12, 19, 8), "19:08", MAINTENANT, false, "en").vu, "12 Oct · 19:08");
  assert.deepEqual(decrireEnvoiMessage(iso(22, 19, 15), MAINTENANT, "en"), { vu: "Sent · 5 min ago", lu: "Sent 5 minutes ago" });
  assert.deepEqual(decrireEnvoiMessage(iso(1, 9, 0), MAINTENANT, "en"), { vu: "Sent · 1 Oct", lu: "Sent on 1 October" });
  assert.deepEqual(decrireEnvoiMessage("?", MAINTENANT, "en"), { vu: "Sent", lu: "Sent" });
});
