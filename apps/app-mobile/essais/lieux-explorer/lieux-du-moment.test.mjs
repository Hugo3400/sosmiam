import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireCleSosFinis } from "~/fonctions/lieux/ecrire-cle-sos-finis";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { retirerSosFinis } from "~/fonctions/lieux/retirer-sos-finis";

import { creerLieux } from "./donnees.mjs";

const lieuxDuMomentAvant = (lieux, maintenant) => lieux.map((lieu) => ({ ...lieu, sos: estSosEnCours(lieu, maintenant) ? lieu.sos : undefined }));
const LIEUX = creerLieux(400, 3);
const heure = (h, m) => new Date(2026, 9, 16, h, m);

test("aucun SOS fini : la même liste, les mêmes objets (rien ne se redessine)", () => {
  const sansSosFini = LIEUX.map((lieu) => (lieu.sos ? { ...lieu, sos: { ...lieu.sos, jusqua: "05:59" } } : lieu));
  const cle = ecrireCleSosFinis(sansSosFini, heure(20, 0));
  assert.equal(cle, "");
  assert.equal(retirerSosFinis(sansSosFini, cle), sansSosFini);
});

test("même résultat qu'avant à chaque minute de la journée, et seuls les lieux au SOS fini sont copiés", () => {
  for (let minute = 0; minute < 24 * 60; minute += 7) {
    const maintenant = heure(Math.floor(minute / 60), minute % 60);
    const cle = ecrireCleSosFinis(LIEUX, maintenant);
    const apres = retirerSosFinis(LIEUX, cle);
    const avant = lieuxDuMomentAvant(LIEUX, maintenant);
    assert.deepEqual(apres, avant, `à ${maintenant.toTimeString().slice(0, 5)}`);
    apres.forEach((lieu, i) => {
      const fini = LIEUX[i].sos !== undefined && !estSosEnCours(LIEUX[i], maintenant);
      assert.equal(lieu === LIEUX[i], !fini);
    });
  }
});

test("la clé ne change que quand un SOS se termine", () => {
  const lieux = [
    { ...LIEUX[0], id: 1, sos: { places: 2, jusqua: "21:00" } },
    { ...LIEUX[1], id: 2, sos: { places: 3, jusqua: "00:30" } },
    { ...LIEUX[2], id: 3, sos: undefined },
  ];
  assert.equal(ecrireCleSosFinis(lieux, heure(20, 59)), "");
  assert.equal(ecrireCleSosFinis(lieux, heure(21, 0)), "1");
  assert.equal(ecrireCleSosFinis(lieux, heure(23, 59)), "1");
  assert.equal(ecrireCleSosFinis(lieux, heure(0, 30)), "1,2");
});

test("ouvert maintenant : heures relues depuis la mémoire, mêmes réponses (créneau qui passe minuit compris)", () => {
  const lieu = { ...LIEUX[0], ouverture: [{ jours: [5], de: "19:00", a: "02:00" }] };
  const vendredi = (h, m) => new Date(2026, 9, 16, h, m);
  const samedi = (h, m) => new Date(2026, 9, 17, h, m);
  for (let i = 0; i < 2; i++) {
    assert.equal(estOuvertMaintenant(lieu, vendredi(18, 59)), false);
    assert.equal(estOuvertMaintenant(lieu, vendredi(19, 0)), true);
    assert.equal(estOuvertMaintenant(lieu, samedi(1, 59)), true);
    assert.equal(estOuvertMaintenant(lieu, samedi(2, 0)), false);
  }
});
