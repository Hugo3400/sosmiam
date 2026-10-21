import assert from "node:assert/strict";
import { test } from "node:test";

import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

test("une notification de réponse du lieu peut ouvrir Mes réservations", () => {
  assert.equal(estLienPermis("/reservations"), true);
});

test("seulement l'écran lui-même : pas d'adresse inventée autour", () => {
  for (const lien of ["/reservations/", "/reservations/12", "/reservations?x=1", "//reservations", "https://exemple.fr/reservations", " /reservations"]) {
    assert.equal(estLienPermis(lien), false, lien);
  }
});

test("une notification « nouvelle table » ouvre l'onglet Réservations du mode pro, rien d'autre", () => {
  assert.equal(estLienPermis("/pro/reservations"), true);
  for (const lien of ["/pro/reservations/", "/pro/reservations/12", "/pro/reservations?lieu=18", "/pro/reglages-reservations"]) {
    assert.equal(estLienPermis(lien), false, lien);
  }
});

test("un lien de notification vers un mode attend les rôles du compte ; les autres partent tout de suite", async () => {
  const { lireModeDuLien } = await import("~/fonctions/notifications/lire-mode-du-lien");
  assert.equal(lireModeDuLien("/pro/reservations"), "pro");
  assert.equal(lireModeDuLien("/pro"), "pro");
  assert.equal(lireModeDuLien("/pro?lieu=18"), "pro");
  assert.equal(lireModeDuLien("/ambassadeur"), "ambassadeur");
  assert.equal(lireModeDuLien("/ambassadeur/mission/3"), "ambassadeur");
  for (const lien of ["/reservations", "/profil", "/produits", "/programme", "/ambassadeurs", "/potes/miamis/idees", "", "pro/reservations"]) {
    assert.equal(lireModeDuLien(lien), null, lien);
  }
});

test("au lancement, le dernier mode ne se rouvre que s'il est encore ouvert, avec un profil, et dans les 8 premières secondes", async () => {
  const { choisirModeARestaurer } = await import("~/fonctions/modes/choisir-mode-a-restaurer");
  const tous = ["perso", "pro", "ambassadeur"];
  assert.equal(choisirModeARestaurer("pro", tous, true, 0), "pro");
  assert.equal(choisirModeARestaurer("ambassadeur", tous, true, 7999), "ambassadeur");
  assert.equal(choisirModeARestaurer("pro", tous, true, 8001), null);
  assert.equal(choisirModeARestaurer("pro", ["perso"], true, 0), null);
  assert.equal(choisirModeARestaurer("pro", tous, false, 0), null);
  assert.equal(choisirModeARestaurer("perso", tous, true, 0), null);
});
