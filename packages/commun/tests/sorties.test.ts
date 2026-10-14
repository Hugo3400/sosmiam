import { test } from "node:test";
import assert from "node:assert/strict";

import { choisirLieuGagnant } from "../src/fonctions/sorties/choisir-lieu-gagnant.ts";
import { choisirOrganisateurSortie } from "../src/fonctions/sorties/choisir-organisateur-sortie.ts";
import { estVoteTermine } from "../src/fonctions/sorties/est-vote-termine.ts";
import { validerNouvelleSortie } from "../src/validation/valider-nouvelle-sortie.ts";

const MAINTENANT = new Date("2026-10-14T18:00:00.000Z");
const minutes = (n: number) => new Date(MAINTENANT.getTime() + n * 60_000).toISOString();
const jours = (n: number) => minutes(n * 24 * 60);
const INVITES = ["k7mq2x9pa4", "abcdefghij"];
const sortie = { titre: " Pizza du jeudi ", emoji: " 🍕 ", quand: jours(2), finVote: jours(1), invites: INVITES, lieux: [12, 7] };

test("nouvelle sortie : nettoyée et rendue", () => {
  assert.deepEqual(validerNouvelleSortie(sortie, MAINTENANT), {
    ok: true,
    sortie: { titre: "Pizza du jeudi", emoji: "🍕", quand: jours(2), finVote: jours(1), invites: INVITES, lieux: [12, 7] },
  });
  const avecFuseau = validerNouvelleSortie({ ...sortie, quand: "2026-10-16T21:30+02:00" }, MAINTENANT);
  assert.equal(avecFuseau.ok && avecFuseau.sortie.quand, "2026-10-16T19:30:00.000Z");
});

test("nouvelle sortie : titre de 1 à 40 caractères, sans mot interdit, et un seul emoji", () => {
  assert.deepEqual(validerNouvelleSortie({ ...sortie, titre: "   " }, MAINTENANT), { ok: false, champ: "titre" });
  assert.equal(validerNouvelleSortie({ ...sortie, titre: "t".repeat(40) }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, titre: "t".repeat(41) }, MAINTENANT), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, titre: "Soirée connard" }, MAINTENANT), { ok: false, champ: "titre", raison: "mot-interdit" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, titre: 42 }, MAINTENANT), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, emoji: "🍕🍔" }, MAINTENANT), { ok: false, champ: "emoji" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, emoji: undefined }, MAINTENANT), { ok: false, champ: "emoji" });
});

test("nouvelle sortie : au moins 15 minutes plus tard, au plus 366 jours", () => {
  assert.equal(validerNouvelleSortie({ ...sortie, quand: minutes(15), finVote: minutes(10) }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, quand: minutes(14), finVote: minutes(10) }, MAINTENANT), { ok: false, champ: "quand" });
  assert.equal(validerNouvelleSortie({ ...sortie, quand: jours(366) }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, quand: jours(367) }, MAINTENANT), { ok: false, champ: "quand" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, quand: "jeudi soir" }, MAINTENANT), { ok: false, champ: "quand" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, quand: "2026-10-16" }, MAINTENANT), { ok: false, champ: "quand" });
});

test("nouvelle sortie : fin du vote entre 10 minutes plus tard et l'heure de la sortie", () => {
  assert.equal(validerNouvelleSortie({ ...sortie, finVote: minutes(10) }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, finVote: minutes(9) }, MAINTENANT), { ok: false, champ: "finVote" });
  assert.equal(validerNouvelleSortie({ ...sortie, finVote: sortie.quand }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, finVote: jours(3) }, MAINTENANT), { ok: false, champ: "finVote" });
});

test("nouvelle sortie : 1 à 14 invités, identifiants publics sans doublon", () => {
  const quatorze = Array.from({ length: 14 }, (_, i) => `personne${String.fromCharCode(97 + i)}${String.fromCharCode(97 + i)}`);
  assert.equal(validerNouvelleSortie({ ...sortie, invites: quatorze }, MAINTENANT).ok, true);
  assert.deepEqual(validerNouvelleSortie({ ...sortie, invites: [...quatorze, "personnezz"] }, MAINTENANT), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, invites: [] }, MAINTENANT), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, invites: ["k7mq2x9pa4", "k7mq2x9pa4"] }, MAINTENANT), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, invites: ["lea"] }, MAINTENANT), { ok: false, champ: "invites" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, invites: "k7mq2x9pa4" }, MAINTENANT), { ok: false, champ: "invites" });
});

test("nouvelle sortie : 1 à 8 lieux, dédoublonnés dans l'ordre, 9 refusés", () => {
  const huit = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: [...huit, 8, 1] }, MAINTENANT), {
    ok: true,
    sortie: { titre: "Pizza du jeudi", emoji: "🍕", quand: jours(2), finVote: jours(1), invites: INVITES, lieux: huit },
  });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: [...huit, 9] }, MAINTENANT), { ok: false, champ: "lieux" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: [] }, MAINTENANT), { ok: false, champ: "lieux" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: [0] }, MAINTENANT), { ok: false, champ: "lieux" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: [1.5] }, MAINTENANT), { ok: false, champ: "lieux" });
  assert.deepEqual(validerNouvelleSortie({ ...sortie, lieux: ["12"] }, MAINTENANT), { ok: false, champ: "lieux" });
});

test("lieu gagnant : le plus de votes, le premier proposé à égalité, null sans proposition", () => {
  assert.equal(choisirLieuGagnant([{ lieuId: 3, votes: 1 }, { lieuId: 9, votes: 4 }, { lieuId: 5, votes: 4 }]), 9);
  assert.equal(choisirLieuGagnant([{ lieuId: 3, votes: 0 }, { lieuId: 9, votes: 0 }]), 3);
  assert.equal(choisirLieuGagnant([]), null);
});

test("vote terminé : lieu déjà retenu, ou heure de fin passée (pile à l'heure compris)", () => {
  assert.equal(estVoteTermine({ lieuChoisi: 4, finVote: jours(1) }, MAINTENANT), true);
  assert.equal(estVoteTermine({ lieuChoisi: null, finVote: jours(1) }, MAINTENANT), false);
  assert.equal(estVoteTermine({ lieuChoisi: null, finVote: MAINTENANT.toISOString() }, MAINTENANT), true);
  assert.equal(estVoteTermine({ lieuChoisi: null, finVote: minutes(-1) }, MAINTENANT), true);
});

test("organisateur : il garde la main tant qu'il est là ; sinon le plus ancien participant ; personne : null", () => {
  const participants = [
    { id: "lea", depuis: "2026-10-14T18:05:00Z" },
    { id: "sofia", depuis: "2026-10-14T18:01:00Z" },
    { id: "tom", depuis: "2026-10-14T18:01:00Z" },
  ];
  assert.equal(choisirOrganisateurSortie("lea", participants), "lea");
  assert.equal(choisirOrganisateurSortie(null, participants), "sofia");
  assert.equal(choisirOrganisateurSortie("ines", participants), "sofia");
  assert.equal(choisirOrganisateurSortie(null, [{ id: "tom", depuis: "2026-10-14T18:01:00Z" }, { id: "sofia", depuis: "2026-10-14T18:01:00Z" }]), "sofia");
  assert.equal(choisirOrganisateurSortie(null, [{ id: "lea", depuis: "pas une date" }, { id: "tom", depuis: "2026-10-14T19:00:00Z" }]), "tom");
  assert.equal(choisirOrganisateurSortie("lea", []), null);
  assert.equal(choisirOrganisateurSortie(null, []), null);
});
