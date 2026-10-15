// Le mode démo (allumé pour tout ce fichier, dans son propre processus) : tout reste sur le téléphone, rien ne part, aucune
// marque « à envoyer ».
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { creerMoteurSynchroProfil } from "~/services/synchro-profil";
import { PIZZA, TOQUE, etat, lireEtatGarde } from "./banc/donnees.mjs";
import { pause } from "./banc/minuteries.mjs";
import { demarrer, remettreDoublures } from "./banc/serveur.mjs";
import { allumerDemo } from "./doublures/demo-visites-active.mjs";

allumerDemo();
beforeEach(remettreDoublures);

test("démo : Mes infos s'enregistre pour de bon sur le téléphone, rien ne part", async () => {
  const demandes = [];
  const moteur = creerMoteurSynchroProfil({
    comptes: {
      lireProfil: async () => (demandes.push("GET"), { ok: false, erreur: "hors-ligne" }),
      modifierProfil: async () => (demandes.push("PATCH"), { ok: false, erreur: "hors-ligne" }),
    },
    moderation: { listerDecisions: async () => ({ ok: true, decisions: [] }) },
    rafraichirCompte: async () => {},
    afficherProfil: () => {},
    montrer: () => {},
  });
  moteur.poserProfil({ prenom: "Hugo", pseudo: "bob", dateNaissance: "1995-01-01", ville: "Montpellier", envies: {}, creeLe: "2026-01-01T00:00:00.000Z" });
  moteur.charger();
  await pause(5);
  const r = await moteur.modifierInfos({ ville: "Lyon" });
  assert.deepEqual(r, { ok: true, parti: true });
  assert.deepEqual(demandes, []);
  assert.equal(globalThis.__disque?.ville, "Lyon", "profil gardé sur le téléphone");
});

test("6. démo : l'avatar change sur le téléphone, rien ne part, aucune marque", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  s.demandes.length = 0;
  await moteur.modifierAvatar(PIZZA);
  await pause(40);
  await moteur.modifierAvatar(TOQUE);
  await pause(40);
  assert.deepEqual(s.demandes, []);
  assert.ok(!(lireEtatGarde()?.aEnvoyer ?? []).some((m) => m.champ === "avatar"), "aucune marque « avatar »");
  assert.deepEqual(s.avatar, TOQUE);
  assert.deepEqual(globalThis.__avatarDisque, TOQUE);
});
