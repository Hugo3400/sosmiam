import assert from "node:assert/strict";
import { test } from "node:test";

import { validerNouveauSondage } from "@sos-miam/commun/validation/valider-nouveau-sondage";
import { appliquerVoteSondage } from "~/fonctions/chat/appliquer-vote-sondage";
import { calculerFinsSondage } from "~/fonctions/chat/calculer-fins-sondage";
import { chercherLieuxSondage } from "~/fonctions/chat/chercher-lieux-sondage";
import { decrireSondage } from "~/fonctions/chat/decrire-sondage";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";

process.env.TZ = "Europe/Paris";
const MAINTENANT = new Date(2026, 9, 22, 17, 30);
const dans = (minutes) => new Date(MAINTENANT.getTime() + minutes * 60_000).toISOString();
const sondage = (o = {}) => ({
  finLe: dans(90),
  closLe: null,
  gagnant: null,
  options: [{ ordre: 0, lieuId: 3, votes: 2 }, { ordre: 1, lieuId: 9, votes: 1 }, { ordre: 2, lieuId: 0, votes: 0 }],
  monVote: 0,
  votants: 3,
  ...o,
});

test("fins du vote : dans 1 h, dans 3 h, et ce soir 19 h tant qu'il reste 10 minutes (et 2 de marge pour l'envoi)", () => {
  const fins = calculerFinsSondage(MAINTENANT, "fr");
  assert.deepEqual(fins.map((f) => [f.cle, f.libelle, f.heure]), [["1h", "Dans 1 h", "18h30"], ["3h", "Dans 3 h", "20h30"], ["ce-soir", "Ce soir 19 h", "19h"]]);
  assert.deepEqual(calculerFinsSondage(new Date(2026, 9, 22, 18, 50), "fr").map((f) => f.cle), ["1h", "3h"]);
  assert.deepEqual(calculerFinsSondage(new Date(2026, 9, 22, 18, 49), "fr").map((f) => f.cle), ["1h", "3h"]);
  assert.deepEqual(calculerFinsSondage(new Date(2026, 9, 22, 18, 48), "fr").map((f) => f.cle), ["1h", "3h", "ce-soir"]);
  assert.deepEqual(calculerFinsSondage(new Date(2026, 9, 22, 21, 0), "fr").map((f) => f.cle), ["1h", "3h"]);
});

test("fins du vote : chacune passe la validation du serveur", () => {
  for (const fin of calculerFinsSondage(MAINTENANT, "fr")) {
    assert.equal(validerNouveauSondage({ lieux: [1, 2], finLe: fin.date.toISOString() }, MAINTENANT).ok, true, fin.cle);
  }
});

test("pied : les votes, la fin du vote, puis le vote fini", () => {
  assert.deepEqual(decrireSondage(sondage(), 4, MAINTENANT, "fr"), { vu: "3 votes sur 4 · fin du vote à 19h", lu: "3 votes sur 4, fin du vote à 19h" });
  assert.equal(decrireSondage(sondage({ votants: 1 }), 4, MAINTENANT, "fr").vu, "1 vote sur 4 · fin du vote à 19h");
  assert.equal(decrireSondage(sondage({ votants: 4 }), 4, MAINTENANT, "fr").vu, "Tout le monde a voté · fin du vote à 19h");
  assert.equal(decrireSondage(sondage({ finLe: new Date(2026, 9, 23, 12, 15).toISOString() }), 4, MAINTENANT, "fr").vu, "3 votes sur 4 · fin du vote demain à 12h15");
  assert.equal(decrireSondage(sondage({ finLe: new Date(2026, 9, 25, 19, 0).toISOString() }), 4, MAINTENANT, "fr").vu, "3 votes sur 4 · fin du vote dimanche à 19h");
  assert.equal(decrireSondage(sondage({ closLe: dans(-5), gagnant: 0 }), 4, MAINTENANT, "fr").vu, "Vote fini · 3 votes sur 4");
  assert.equal(decrireSondage(sondage({ closLe: dans(-5), votants: 0, options: [] }), 4, MAINTENANT, "fr").vu, "Vote fini : personne n'a voté");
});

test("pied : jamais « 5 votes sur 4 » quand quelqu'un a quitté le groupe", () => {
  assert.equal(decrireSondage(sondage({ votants: 5 }), 4, MAINTENANT, "fr").vu, "Tout le monde a voté · fin du vote à 19h");
});

test("en anglais : fins du vote et pied, heures en 24 h", () => {
  assert.deepEqual(calculerFinsSondage(MAINTENANT, "en").map((f) => [f.libelle, f.heure]), [["In 1 hour", "18:30"], ["In 3 hours", "20:30"], ["Tonight at 19:00", "19:00"]]);
  assert.deepEqual(decrireSondage(sondage(), 4, MAINTENANT, "en"), { vu: "3 of 4 voted · voting ends at 19:00", lu: "3 of 4 voted, voting ends at 19:00" });
  assert.equal(decrireSondage(sondage({ finLe: new Date(2026, 9, 23, 12, 15).toISOString() }), 4, MAINTENANT, "en").vu, "3 of 4 voted · voting ends tomorrow at 12:15");
  assert.equal(decrireSondage(sondage({ finLe: new Date(2026, 9, 25, 19, 0).toISOString() }), 4, MAINTENANT, "en").vu, "3 of 4 voted · voting ends on Sunday at 19:00");
  assert.equal(decrireSondage(sondage({ finLe: new Date(2026, 9, 23, 0, 0).toISOString() }), 4, MAINTENANT, "en").vu, "3 of 4 voted · voting ends tomorrow at midnight");
  assert.equal(decrireSondage(sondage({ votants: 4 }), 4, MAINTENANT, "en").vu, "Everyone's voted · voting ends at 19:00");
  assert.equal(decrireSondage(sondage({ closLe: dans(-5), votants: 0, options: [] }), 4, MAINTENANT, "en").vu, "Voting's over – nobody voted");
});

test("état : ouvert, clos par le serveur, ou fini à l'heure avec le même gagnant que le serveur", () => {
  assert.deepEqual(lireEtatSondage(sondage(), MAINTENANT), { clos: false, gagnant: null });
  assert.deepEqual(lireEtatSondage(sondage({ closLe: dans(-1), gagnant: 1 }), MAINTENANT), { clos: true, gagnant: 1 });
  assert.deepEqual(lireEtatSondage(sondage({ finLe: dans(-1) }), MAINTENANT), { clos: true, gagnant: 0 });
  const egalite = sondage({ finLe: dans(-1), options: [{ ordre: 1, lieuId: 9, votes: 2 }, { ordre: 0, lieuId: 3, votes: 2 }] });
  assert.equal(lireEtatSondage(egalite, MAINTENANT).gagnant, 0);
  assert.equal(lireEtatSondage(sondage({ finLe: dans(-1), options: [{ ordre: 0, lieuId: 3, votes: 0 }] }), MAINTENANT).gagnant, null);
});

test("vote : changer, retirer, voter pour la première fois", () => {
  const change = appliquerVoteSondage(sondage(), 1);
  assert.deepEqual(change.options.map((o) => o.votes), [1, 2, 0]);
  assert.equal(change.monVote, 1);
  assert.equal(change.votants, 3);
  const retire = appliquerVoteSondage(sondage(), null);
  assert.deepEqual(retire.options.map((o) => o.votes), [1, 1, 0]);
  assert.equal(retire.votants, 2);
  assert.equal(retire.monVote, null);
  const premier = appliquerVoteSondage(sondage({ monVote: null }), 2);
  assert.deepEqual(premier.options.map((o) => o.votes), [2, 1, 1]);
  assert.equal(premier.votants, 4);
});

test("vote : rien ne change pour le même vote ou un lieu qui n'est pas dans le sondage", () => {
  const s = sondage();
  assert.equal(appliquerVoteSondage(s, 0), s);
  assert.equal(appliquerVoteSondage(s, 7), s);
});

test("lieux : la recherche passe par le nom, le genre, le plat, le quartier et la ville, sans accents", () => {
  const lieux = [
    { id: 0, nom: "Chez Nonna Lia", info: "Trattoria", plat: "Tiramisu", quartier: "Écusson", ville: "Montpellier" },
    { id: 9, nom: "La Tielle de Pépita", info: "Tielles & poulpe", plat: "Tielle", quartier: "", ville: "Sète" },
  ];
  assert.deepEqual(chercherLieuxSondage(lieux, "").map((l) => l.id), [0, 9]);
  assert.deepEqual(chercherLieuxSondage(lieux, "pepita").map((l) => l.id), [9]);
  assert.deepEqual(chercherLieuxSondage(lieux, "ecusson tiramisu").map((l) => l.id), [0]);
  assert.deepEqual(chercherLieuxSondage(lieux, "sete trattoria"), []);
});
