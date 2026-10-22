import assert from "node:assert/strict";
import { test } from "node:test";

import { ALERTES_MACHINE } from "../src/contenus/alertes-machine.ts";
import { ONGLETS_MAINTENANCE } from "../src/contenus/onglets-maintenance.ts";
import { formaterPourcentage } from "../src/fonctions/maintenance/formater-pourcentage.ts";
import { formaterTempsAllume } from "../src/fonctions/maintenance/formater-temps-allume.ts";
import { nommerMomentCourbe } from "../src/fonctions/maintenance/nommer-moment-courbe.ts";
import { resumerCourbe } from "../src/fonctions/maintenance/resumer-courbe.ts";
import { trouverProblemes } from "../src/fonctions/maintenance/trouver-problemes.ts";
import { formaterDebit } from "../src/fonctions/texte/formater-debit.ts";
import type { EtatServeur } from "../src/services/maintenance.ts";

const MAINTENANT = Date.parse("2026-10-22T10:00:00.000Z");

function etat(machine?: EtatServeur["machine"]): EtatServeur {
  return {
    api: { depuis: "2026-10-22T08:00:00.000Z", memoire: 1, node: "v22" },
    base: { enLigne: true, delai: 3, octets: 1, tables: [] },
    site: { enLigne: true, statut: 200, delai: 40 },
    disque: { total: 100, libre: 80 },
    processus: [
      { nom: "sos-miam-api", statut: "online", depuis: null, relances: 0, memoire: 0, processeur: 0, relancable: false },
      { nom: "sos-miam-site", statut: "online", depuis: null, relances: 0, memoire: 0, processeur: 0, relancable: true },
      { nom: "sos-miam-bot-discord", statut: "online", depuis: null, relances: 0, memoire: 0, processeur: 0, relancable: true },
    ],
    sauvegardes: { cleExiste: true, derniere: { nom: "s", taille: 1, creeLe: "2026-10-22T01:30:00.000Z" }, nombre: 1 },
    ...(machine ? { machine } : {}),
  };
}

test("les alertes de la machine rejoignent le bandeau, la pastille et les notifications", () => {
  assert.deepEqual(trouverProblemes(etat(), MAINTENANT), []);
  assert.deepEqual(trouverProblemes(etat({ releveLe: null, problemes: [] }), MAINTENANT), []);
  assert.deepEqual(trouverProblemes(etat({ releveLe: "x", problemes: ["Le service nginx est arrêté."] }), MAINTENANT), ["Le service nginx est arrêté."]);
});

test("un résumé de courbe ignore les trous et garde la dernière mesure connue", () => {
  assert.equal(resumerCourbe([]), null);
  assert.equal(resumerCourbe([null, null]), null);
  assert.deepEqual(resumerCourbe([10, null, 30, 20, null]), { moyenne: 20, pointe: 30, dernier: 20 });
});

test("les textes de la machine se lisent à la française", () => {
  assert.equal(formaterTempsAllume("2026-10-22T09:15:00.000Z", MAINTENANT), "45 min");
  assert.equal(formaterTempsAllume("2026-10-21T20:00:00.000Z", MAINTENANT), "14 h 00");
  assert.equal(formaterTempsAllume("2026-10-19T08:00:00.000Z", MAINTENANT), "3 j 2 h");
  assert.equal(formaterPourcentage(33.4), "33 %");
  assert.equal(formaterDebit(48 * 1024), "48 Ko/s");
  assert.equal(nommerMomentCourbe("2026-10-22T10:40:00.000Z", "24h"), "12:40");
  assert.match(nommerMomentCourbe("2026-10-20T10:00:00.000Z", "7j"), /^mar\.? 20$/);
});

test("Maintenance range ses fonctions en neuf sous-onglets, et chaque alerte dit sa règle", () => {
  assert.deepEqual(ONGLETS_MAINTENANCE.map((onglet) => onglet.valeur), ["machines", "courbes", "systeme", "pm2", "journaux", "sauvegardes", "base", "alertes", "historique"]);
  assert.ok(ALERTES_MACHINE.every((alerte) => alerte.titre && alerte.aide && alerte.regle));
});
