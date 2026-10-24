import assert from "node:assert/strict";
import { test } from "node:test";

import { analyserLigne } from "../src/services/gestion/journaux-serveur.ts";
import { CACHE_SANTE_MS, creerSanteComplete, SAUVEGARDE_MAX_MS, type DependancesSante } from "../src/services/gestion/sante-complete.ts";

const MAINTENANT = Date.UTC(2026, 9, 24, 21, 0);
const enBonneSante = (): DependancesSante => ({
  verifierBase: async () => 1,
  lireDisqueLibre: async () => 0.4,
  lireDerniereSauvegarde: async () => MAINTENANT - 18 * 3600_000,
  horloge: () => MAINTENANT,
});

test("tout va bien : ok", async () => {
  assert.deepEqual(await creerSanteComplete(enBonneSante())(), { ok: true, base: "ok", disque: "ok", sauvegarde: "ok" });
});

test("base en panne, lente, disque presque plein, sauvegarde absente ou trop vieille : ko, point par point", async () => {
  const cas: [Partial<DependancesSante>, string][] = [
    [{ verifierBase: async () => { throw new Error("connexion refusée"); } }, "base"],
    [{ verifierBase: () => new Promise(() => {}) }, "base"],
    [{ verifierBase: () => { throw new Error("lancée tout de suite"); } }, "base"],
    [{ lireDerniereSauvegarde: () => { throw new Error("lancée tout de suite"); } }, "sauvegarde"],
    [{ lireDisqueLibre: async () => 0.03 }, "disque"],
    [{ lireDisqueLibre: async () => { throw new Error("statfs"); } }, "disque"],
    [{ lireDerniereSauvegarde: async () => null }, "sauvegarde"],
    [{ lireDerniereSauvegarde: async () => MAINTENANT - SAUVEGARDE_MAX_MS - 1 }, "sauvegarde"],
  ];
  for (const [panne, point] of cas) {
    const etat = await creerSanteComplete({ ...enBonneSante(), ...panne })();
    assert.equal(etat.ok, false, point);
    assert.equal(etat[point as "base"], "ko", point);
  }
});

test("15 s de cache : un robot qui appelle souvent ne touche pas la base à chaque fois", async () => {
  let maintenant = MAINTENANT;
  let appels = 0;
  const lire = creerSanteComplete({ ...enBonneSante(), verifierBase: async () => void appels++, horloge: () => maintenant });
  await Promise.all([lire(), lire(), lire()]);
  maintenant += CACHE_SANTE_MS - 1;
  await lire();
  assert.equal(appels, 1);
  maintenant += 2;
  await lire();
  assert.equal(appels, 2);
});

test("journaux pm2 horodatés (--log-date-format YYYY-MM-DDTHH:mm:ssZ) : heure lue, préfixe retiré", () => {
  const ligne = analyserLigne("2026-10-24T23:28:36+02:00: API SOS Miam prête", { flux: "sortie", sorte: "pm2" });
  assert.deepEqual([ligne?.heure, ligne?.texte], ["2026-10-24T21:28:36.000Z", "API SOS Miam prête"]);
});
