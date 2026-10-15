// Deux appuis rapides (deux avatars, deux cases de Mes envies), à différents écarts et vitesses d'écriture du téléphone :
// le second choix gagne toujours, sur le téléphone et sur le serveur. S'il arrive pendant l'écriture du premier, un seul
// envoi part ; sinon, deux, dans l'ordre. L'issue tient à l'ordre des minuteries (une pause plus courte que l'écriture en
// cours finit toujours avant elle), pas à la vitesse de la machine.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { PIZZA, TACO, etat } from "./banc/donnees.mjs";
import { pause } from "./banc/minuteries.mjs";
import { demarrer, remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

const marque = (...champs) => "marque:" + JSON.stringify(champs);
const ecrit = (avatar) => "avatar:" + JSON.stringify(avatar);
const UN_ENVOI = { demandes: ['PATCH {"avatar":"🌮"}'], journal: [marque("avatar"), ecrit(PIZZA), marque("avatar"), ecrit(TACO), marque()] };
const DEUX_ENVOIS = {
  demandes: ['PATCH {"avatar":"🍕"}', 'PATCH {"avatar":"🌮"}'],
  journal: [marque("avatar"), ecrit(PIZZA), marque(), marque("avatar"), ecrit(TACO), marque()],
};

for (const [delaiAvatar, delaiMagasin, ecart, attendu] of [
  [0, 0, 0, UN_ENVOI],
  [0, 0, 1, DEUX_ENVOIS],
  [5, 2, 3, UN_ENVOI],
  [5, 2, 20, DEUX_ENVOIS],
  [5, 2, 40, DEUX_ENVOIS],
]) {
  const envois = attendu === UN_ENVOI ? "un seul envoi" : "deux envois";
  test(`avatar, écritures ${delaiAvatar}+${delaiMagasin} ms, 2e appui à ${ecart} ms : 🌮 gagne partout, ${envois}`, async () => {
    globalThis.__delaiAvatar = delaiAvatar;
    globalThis.__delaiMagasin = delaiMagasin;
    const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
    s.demandes.length = 0;
    globalThis.__journalAvatar.length = 0;
    const a = moteur.modifierAvatar(PIZZA);
    if (ecart) await pause(ecart);
    const b = moteur.modifierAvatar(TACO);
    await Promise.all([a, b]);
    await pause(150);
    assert.deepEqual(s.avatar, TACO, "téléphone");
    assert.equal(s.serveur.avatar, "🌮", "serveur");
    assert.deepEqual(s.demandes, attendu.demandes);
    assert.deepEqual(globalThis.__journalAvatar, attendu.journal, "chaque écriture après sa marque, la file vide à la fin");
  });
}

const enviesPatch = (lieux) => "PATCH " + JSON.stringify({ envies: { lieux } });

for (const [delaiEcriture, delaiMagasin, ecart, demandes] of [
  [5, 2, 3, [enviesPatch(["cafes", "bars", "restos"])]],
  [5, 2, 30, [enviesPatch(["cafes", "bars"]), enviesPatch(["cafes", "bars", "restos"])]],
]) {
  test(`envies, écritures ${delaiEcriture}+${delaiMagasin} ms, 2e case à ${ecart} ms : la dernière gagne partout, ${demandes.length === 1 ? "un seul envoi" : "deux envois"}`, async () => {
    globalThis.__delaiEcriture = delaiEcriture;
    globalThis.__delaiMagasin = delaiMagasin;
    const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
    s.demandes.length = 0;
    const a = moteur.modifierEnvies({ lieux: ["cafes", "bars"] });
    await pause(ecart);
    const b = moteur.modifierEnvies({ lieux: ["cafes", "bars", "restos"] });
    await Promise.all([a, b]);
    await pause(150);
    assert.deepEqual(s.profil.envies.lieux, ["cafes", "bars", "restos"], "téléphone");
    assert.deepEqual(s.serveur.envies.lieux, ["cafes", "bars", "restos"], "serveur");
    assert.deepEqual(s.demandes, demandes);
  });
}
