import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerPropositionsReservation } from "@sos-miam/commun/fonctions/reservations/calculer-propositions-reservation";
import { choisirHoraireParDefaut } from "@sos-miam/commun/fonctions/reservations/choisir-horaire-par-defaut";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerRemplissageJour } from "~/fonctions/reservations/calculer-remplissage-jour";
import { compterDemandesARepondre } from "~/fonctions/reservations/compter-demandes-a-repondre";
import { decrireDepassement } from "~/fonctions/reservations/decrire-depassement";
import { decrireEndormissementDemande } from "~/fonctions/reservations/decrire-endormissement-demande";
import { decrireHorairePropose } from "~/fonctions/reservations/decrire-horaire-propose";
import { decrireRemplissageCreneau } from "~/fonctions/reservations/decrire-remplissage-creneau";
import { repererNouvellesTables } from "~/fonctions/reservations/reperer-nouvelles-tables";
import { resumerDemandeReservation } from "~/fonctions/reservations/resumer-demande-reservation";

const JOUR = "2026-10-23";
const iso = (heure, jour = JOUR) => new Date(calculerInstantParis(jour, heure)).toISOString();
const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 15, couvertsParService: 40, couvertsParCreneau: 8 };
const REGLAGES = { services: [SOIR], acceptation: "manuelle", delai: "1-h", joursFermes: [] };
const resa = (id, statut, heure, personnes, plus = {}) => ({
  id, prenom: "Nour", initialeNom: null, avatar: "🦦", personnes, creneau: iso(heure), propositions: [{ creneau: iso(heure), places: null, horsReglages: false, jourFerme: false }],
  automatique: false, limiteReponse: null, message: null, statut, presence: false, code: null, creeLe: iso("17:00"), ...plus,
});

const acceptees = [resa(1, "acceptee", "20:00", 2), resa(2, "acceptee", "20:00", 4), resa(3, "acceptee", "20:30", 2)];
const occupees = acceptees.map((r) => ({ creneau: r.creneau, personnes: r.personnes }));
const proposes = [iso("20:00"), iso("20:30"), iso("21:00")];
const lea = {
  ...resa(9, "demandee", "20:00", 4, { prenom: "Léa", initialeNom: "M", limiteReponse: iso("19:30"), message: "Une bougie, c'est possible ?" }),
  propositions: calculerPropositionsReservation({ statut: "demandee", creneau: proposes[0], creneauxProposes: proposes }, REGLAGES, occupees),
};

test("la demande de Léa : 20h est complet pour 4, son plan B 20h30 a 6 places et il est choisi d'office", () => {
  assert.deepEqual(lea.propositions.map((p) => p.places), [2, 6, 8]);
  const choisi = choisirHoraireParDefaut(lea.propositions, lea.personnes);
  assert.equal(choisi, iso("20:30"));
  assert.deepEqual(resumerDemandeReservation(lea, choisi), {
    texte: "Léa M. · 4 pers. · 20h30 (son plan B, 6 places)",
    lu: "Léa M., 4 personnes, à 20h30, son plan B, 6 places",
  });
  assert.equal(resumerDemandeReservation(lea, iso("20:00")).texte, "Léa M. · 4 pers. · 20h (son 1er choix, complet)");
  const options = lea.propositions.map((p, i) => decrireHorairePropose(p, i, lea.personnes));
  assert.deepEqual(options.map((o) => [o.heure, o.rang, o.places, o.tient]), [
    ["20h", "son 1er choix", "complet pour 4 personnes", false],
    ["20h30", "son plan B", "il reste 6 places", true],
    ["21h", "son plan B", "il reste 8 places", true],
  ]);
});

test("un horaire hors des services ou un jour sans résa se dit, et demande « quand même »", () => {
  const hors = decrireHorairePropose({ creneau: iso("23:00"), places: null, horsReglages: true, jourFerme: false }, 0, 2);
  assert.deepEqual([hors.places, hors.tient], ["hors de tes services", true]);
  const ferme = decrireHorairePropose({ creneau: iso("20:00"), places: 8, horsReglages: false, jourFerme: true }, 1, 2);
  assert.deepEqual([ferme.places, ferme.tient], ["jour sans résa, il reste 8 places", false]);
  assert.equal(
    decrireDepassement({ nom: "Léa M.", heure: "20h", personnes: 4, places: 2, jourFerme: false }),
    "À 20h, il ne reste que 2 places pour 4 personnes : ça déborde de 2 personnes. Tu as la place quand même ? C'est toi le capitaine !",
  );
  assert.match(decrireDepassement({ nom: "Léa M.", heure: "20h", personnes: 4, places: 0, jourFerme: false }), /c'est déjà complet/);
  assert.match(decrireDepassement({ nom: "Léa M.", heure: "20h", personnes: 4, places: 8, jourFerme: true }), /fermé les résas ce jour-là/);
});

test("sans réponse, la demande s'endort : l'heure du jour même, sinon le jour en toutes lettres", () => {
  assert.equal(decrireEndormissementDemande(lea, calculerInstantParis(JOUR, "18:00")), "Sans réponse, la demande s'endort à 19h30.");
  assert.equal(decrireEndormissementDemande(lea, calculerInstantParis("2026-10-22", "18:00")), "Sans réponse, la demande s'endort demain à 19h30.");
  assert.equal(decrireEndormissementDemande({ creneau: iso("20:00"), limiteReponse: null }, calculerInstantParis(JOUR, "18:00")), "Sans réponse, la demande s'endort à 19h30.");
});

test("le remplissage du jour : couverts du service, arrivées par créneau et demandes qui le visent", () => {
  const remplissage = calculerRemplissageJour(REGLAGES, [...acceptees, lea], calculerInstantParis(JOUR, "18:00"));
  assert.equal(remplissage.etat, "ouvert");
  const [soir] = remplissage.services;
  assert.deepEqual([soir.acceptes, soir.capacite, soir.creneaux.length], [8, 40, 11]);
  const vingt = soir.creneaux.find((c) => c.heure === "20:00");
  assert.deepEqual(vingt, { heure: "20:00", acceptes: 6, arrivees: 8, restantes: 2, demandes: 1, personnesEnAttente: 4 });
  assert.equal(decrireRemplissageCreneau(vingt).lu, "20h, 6 sur 8 arrivées, reste 2 places, + 1 demande (4 personnes)");
  assert.equal(calculerRemplissageJour({ ...REGLAGES, joursFermes: [JOUR] }, acceptees, calculerInstantParis(JOUR, "18:00")).etat, "jour-sans-resa");
  assert.equal(calculerRemplissageJour(REGLAGES, acceptees, calculerInstantParis(JOUR, "23:00")).etat, "finis");
  assert.equal(calculerRemplissageJour({ ...REGLAGES, services: [] }, acceptees, calculerInstantParis(JOUR, "18:00")).etat, "sans-service");
});

test("nouvelles tables entre deux lectures : les demandes et les tables acceptées toutes seules, jamais au premier affichage", () => {
  const tom = resa(10, "acceptee", "19:15", 2, { automatique: true });
  assert.deepEqual(repererNouvellesTables(null, [lea, tom]), []);
  assert.deepEqual(repererNouvellesTables(new Set([1, 2, 3]), [...acceptees, lea, tom]).map((r) => r.id), [9, 10]);
  assert.deepEqual(repererNouvellesTables(new Set([9]), [lea, resa(11, "acceptee", "19:15", 2)]).map((r) => r.id), []);
  assert.equal(compterDemandesARepondre([lea, tom], calculerInstantParis(JOUR, "18:00")), 1);
  assert.equal(compterDemandesARepondre([lea], calculerInstantParis(JOUR, "19:31")), 0);
});
