import assert from "node:assert/strict";
import { test } from "node:test";

import { choisirRefusOuvertureAvis } from "~/fonctions/avis/choisir-refus-ouverture-avis";
import { estRefusOuverturePassager } from "~/fonctions/avis/est-refus-ouverture-passager";

const MAINTENANT = new Date("2026-10-15T18:00:00.000Z");
const VISITE = { id: 42, lieu: { id: 13, nom: "La Cabane d'Émile" }, avis: { ouvertLe: "2026-10-15T17:00:00.000Z", fermeLe: "2026-10-29T16:00:00.000Z", donne: false } };

test("visite pas lue : on rend l'échec de lecture tel quel", () => {
  for (const erreur of ["hors-ligne", "erreur-serveur", "introuvable"]) {
    assert.deepEqual(choisirRefusOuvertureAvis({ visite: null, echecLecture: { erreur }, refusEnvoi: null, etat: "ouvert", maintenant: MAINTENANT }, "fr"), { erreur, details: undefined });
  }
  assert.equal(choisirRefusOuvertureAvis({ visite: null, echecLecture: null, refusEnvoi: null, etat: "ouvert", maintenant: MAINTENANT }, "fr").erreur, "introuvable");
});

test("visite lue : déjà donné, fermé, pas encore ouvert, ou rien à refuser", () => {
  const entree = { visite: VISITE, echecLecture: null, refusEnvoi: null, maintenant: MAINTENANT };
  assert.equal(choisirRefusOuvertureAvis({ ...entree, etat: "donne" }, "fr").erreur, "avis-deja-donne");
  assert.equal(choisirRefusOuvertureAvis({ ...entree, etat: "ferme" }, "fr").erreur, "avis-ferme");
  assert.equal(choisirRefusOuvertureAvis({ ...entree, etat: "a-venir" }, "fr").erreur, "avis-pas-ouvert");
  assert.equal(choisirRefusOuvertureAvis({ ...entree, etat: "ouvert" }, "fr"), null);
  assert.equal(choisirRefusOuvertureAvis({ ...entree, etat: "ouvert", refusEnvoi: { ou: "ecran", erreur: "membre-du-lieu" } }, "fr").erreur, "membre-du-lieu");
});

test("« Réessayer » seulement pour une lecture ratée en passant (réseau, serveur, trop de demandes, service)", () => {
  for (const erreur of ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]) {
    assert.equal(estRefusOuverturePassager({ erreur }, false), true, erreur);
    assert.equal(estRefusOuverturePassager({ erreur }, true), false, erreur);
  }
  for (const erreur of ["introuvable", "avis-ferme", "avis-deja-donne", "avis-pas-ouvert", "membre-du-lieu", "connexion-requise"]) {
    assert.equal(estRefusOuverturePassager({ erreur }, false), false, erreur);
  }
});
