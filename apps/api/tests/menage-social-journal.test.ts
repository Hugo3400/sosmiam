// Tests des lignes du journal du logiciel pour le ménage social de la nuit (decrireBilanMenageSocial, lot L7) : seulement
// ce qui ne vaut pas zéro, des nombres, la ligne du rechiffrement chaque nuit d'un changement de clé, la pause quand le
// disque est presque plein, et 60 caractères au plus par ligne (ce que garde noterAction), nombres en tête.
import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireBilanMenageSocial } from "../src/fonctions/social/decrire-bilan-menage-social.ts";
import type { BilanMenageSocial } from "../src/services/menage-social.ts";

const BILAN_VIDE: BilanMenageSocial = {
  medias: 0, conversations: 0, sorties: 0, conversationsVides: 0, demandesBande: 0, demandesSuivi: 0, invitationsSorties: 0, invitationsGroupes: 0,
  invitationsCoAuteurs: 0, departsGroupes: 0, clesIdempotence: 0, cloche: 0, masques: 0, contenusRetires: 0, commentairesSupprimes: 0,
  fichiersOrphelins: 0, rechiffrement: null, etapesRatees: [],
};

test("lignes du journal : seulement ce qui ne vaut pas zéro, des nombres, et le rechiffrement même à zéro", () => {
  assert.deepEqual(decrireBilanMenageSocial(BILAN_VIDE), []);
  const lignes = decrireBilanMenageSocial({ ...BILAN_VIDE, medias: 3, invitationsGroupes: 2, cloche: 40 });
  assert.deepEqual(lignes, [
    [3, "Médias du chat effacés (90 jours)"],
    [2, "Invitations à des groupes expirées (30 jours)"],
    [40, "Cloche : notifications effacées (90 jours, 200 par compte)"],
  ]);
  const rotation = decrireBilanMenageSocial({ ...BILAN_VIDE, rechiffrement: { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 }, etapesRatees: ["cloche"] });
  assert.deepEqual(rotation, [
    [0, "Rechiffrement social : 0 illisible(s), 0 restant(s)"],
    [1, "Ménage social, étape(s) ratée(s) : cloche"],
  ], "même à zéro : la règle de fin se lit chaque nuit (restants = illisibles deux nuits de suite, sans étape « rechiffrement » ratée)");
});

/** noterAction (services/gestion/journal.ts) ne garde que 60 caractères de l'action */
const LONGUEUR_ACTION_JOURNAL = 60;

test("lignes du journal : 60 caractères au plus, nombres entiers, « rechiffrement » en tête des étapes ratées, la pause du disque", () => {
  const tout: BilanMenageSocial = {
    ...Object.fromEntries(Object.entries(BILAN_VIDE).map(([cle, valeur]) => [cle, typeof valeur === "number" ? 123_456 : valeur])) as BilanMenageSocial,
    rechiffrement: { rechiffres: 500, illisibles: 99_999, restants: 1_234_567, enAttenteDePlace: 4321 },
    etapesRatees: ["médias", "conversations", "conversations vides", "demandes", "cloche", "masques", "contenus retirés", "fichiers orphelins", "rechiffrement"],
  };
  const lignes = decrireBilanMenageSocial(tout);
  assert.equal(lignes.length, 16 + 3);
  for (const [, quoi] of lignes) assert.ok(quoi.length <= LONGUEUR_ACTION_JOURNAL, `${quoi.length} : ${quoi}`);
  assert.deepEqual(lignes.slice(-3), [
    [500, "Rechiffrement social : 99999 illisible(s), 1234567 restant(…"],
    [4321, "Fichiers à rechiffrer en pause : disque presque plein"],
    [9, "Ménage social, étape(s) ratée(s) : rechiffrement, médias, c…"],
  ], "coupées par « … », mais jamais avant les nombres ; « rechiffrement » en tête de la liste des étapes ratées");
  // Pas de pause (plafond de la nuit, ou disque assez libre) : pas de ligne
  const sansPause = decrireBilanMenageSocial({ ...BILAN_VIDE, rechiffrement: { rechiffres: 500, illisibles: 0, restants: 40, enAttenteDePlace: 0 } });
  assert.deepEqual(sansPause, [[500, "Rechiffrement social : 0 illisible(s), 40 restant(s)"]]);
});
