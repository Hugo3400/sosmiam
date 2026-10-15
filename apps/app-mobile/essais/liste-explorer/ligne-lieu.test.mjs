import assert from "node:assert/strict";
import { test } from "node:test";

import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { estLigneLieuInchangee } from "~/fonctions/lieux/est-ligne-lieu-inchangee";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";

import { creerHasard, creerLieux } from "../lieux-explorer/donnees.mjs";

const LIEUX = creerLieux(120, 11).map((lieu, i) =>
  i % 3 === 0 ? { ...lieu, ouverture: [{ jours: [4, 5, 6], de: "19:00", a: "02:00" }, { jours: [0, 1, 2, 3], de: "11:45", a: "14:15" }] } : lieu,
);
const ouvrir = () => {};
const IMAGE = { uri: "vignette" };

function props(lieu, maintenant, reste = {}) {
  return { lieu, km: 1.2, depuis: "de toi", image: IMAGE, selectionne: false, onOuvrir: ouvrir, evenement: null, maintenant, ...reste };
}

const ceQuiDependDeLHeure = ({ lieu, evenement, maintenant }) => JSON.stringify([estOuvertMaintenant(lieu, maintenant), evenement ? ecrireJourLong(evenement.debut, maintenant) : null]);

test("mêmes props : la ligne ne se redessine pas", () => {
  const maintenant = new Date(2026, 9, 15, 20, 0);
  assert.equal(estLigneLieuInchangee(props(LIEUX[0], maintenant), props(LIEUX[0], maintenant)), true);
});

test("chaque prop qui change redessine la ligne", () => {
  const maintenant = new Date(2026, 9, 15, 20, 0);
  const avant = props(LIEUX[0], maintenant);
  const changements = {
    lieu: { ...LIEUX[0] },
    km: 1.3,
    depuis: "de Marseille",
    image: { uri: "vignette" },
    selectionne: true,
    onOuvrir: () => {},
    evenement: { titre: "Quiz", type: "quiz", debut: "2026-10-16T19:00:00.000Z", alcool: false },
  };
  for (const [cle, valeur] of Object.entries(changements)) {
    assert.equal(estLigneLieuInchangee(avant, { ...avant, [cle]: valeur }), false, cle);
  }
  const { evenement: _retire, ...sansEvenement } = avant;
  assert.equal(estLigneLieuInchangee(avant, sansEvenement), false, "prop retirée");
});

test("SOS fini : le lieu recopié redessine la ligne", () => {
  const maintenant = new Date(2026, 9, 15, 23, 0);
  const avecSos = { ...LIEUX[1], sos: { places: 2, jusqua: "22:30" } };
  assert.equal(estLigneLieuInchangee(props(avecSos, maintenant), props({ ...avecSos, sos: undefined }, maintenant)), false);
});

test("nouvelle minute : la ligne ne se redessine que si Ouvert / Fermé ou le jour de l'événement change, jamais un oubli", () => {
  const hasard = creerHasard(5);
  const evenements = [null, { titre: "Concert", type: "concert", debut: "2027-01-01T20:00:00.000Z", alcool: false }, { titre: "Quiz", type: "quiz", debut: "2026-12-31T19:00:00.000Z", alcool: true }];
  const debut = new Date(2026, 11, 28, 0, 0).getTime();
  const fin = new Date(2027, 0, 3, 0, 0).getTime();
  let sautees = 0;
  let redessinees = 0;
  for (let instant = debut; instant < fin; instant += 60_000 * (1 + Math.floor(hasard() * 9))) {
    const avant = new Date(instant);
    const apres = new Date(instant + 60_000);
    for (const lieu of LIEUX) {
      const evenement = evenements[lieu.id % evenements.length];
      const p1 = props(lieu, avant, { evenement });
      const p2 = props(lieu, apres, { evenement });
      const inchangee = estLigneLieuInchangee(p1, p2);
      if (inchangee) {
        sautees++;
        assert.equal(ceQuiDependDeLHeure(p1), ceQuiDependDeLHeure(p2), `${lieu.nom} entre ${avant.toISOString()} et ${apres.toISOString()}`);
      } else redessinees++;
      if (!evenement && estOuvertMaintenant(lieu, avant) === estOuvertMaintenant(lieu, apres)) assert.equal(inchangee, true);
    }
  }
  assert.ok(sautees > redessinees * 20, `${sautees} lignes gardées, ${redessinees} redessinées`);
});

test("passage à la nouvelle année avec un événement : redessinée (l'année s'affiche ou disparaît)", () => {
  const evenement = { titre: "Réveillon", type: "soiree", debut: "2027-01-01T20:00:00.000Z", alcool: false };
  const lieu = { ...LIEUX[2], ouverture: [] };
  const p1 = props(lieu, new Date(2026, 11, 31, 23, 59), { evenement });
  const p2 = props(lieu, new Date(2027, 0, 1, 0, 0), { evenement });
  assert.notEqual(ceQuiDependDeLHeure(p1), ceQuiDependDeLHeure(p2));
  assert.equal(estLigneLieuInchangee(p1, p2), false);
});
