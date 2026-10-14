// Tests des pseudos libérés, réservés 30 jours (décision de Hugo du 14 octobre 2026) : changement de pseudo, suppression
// du compte, inscription, PATCH /comptes/moi/profil, GET /comptes/pseudo-disponible, estPseudoReserve (pour la session
// App) et ménage de nuit. Tout en mémoire, avec une clé de TEST : aucune base de données.
import assert from "node:assert/strict";
import { after, test } from "node:test";

import { DUREE_RESERVATION_PSEUDO } from "../src/services/pseudos-reserves-regles.ts";
import { creerBancApp, MOT_DE_PASSE_TEST } from "./outils/creer-banc-app.ts";

const { banc, memoire, demander, inscrireApp, inscriptionApp, fermer } = await creerBancApp();
after(fermer);

const { pseudosReserves } = memoire;
const modifier = (jeton: string, corps: unknown) => demander("PATCH", "/comptes/moi/profil", { jeton, corps });
const disponible = async (jeton: string, pseudo: string) =>
  (await demander("GET", `/comptes/pseudo-disponible?pseudo=${encodeURIComponent(pseudo)}`, { jeton })).corps.disponible;
const supprimer = (jeton: string) => demander("DELETE", "/comptes/moi", { jeton, corps: { motDePasse: MOT_DE_PASSE_TEST } });

test("changement de pseudo : l'ancien est refusé à un autre compte, comme un pseudo pris (PATCH, inscription, disponibilité)", async () => {
  const lea = await inscrireApp({ pseudo: "lea.croque" });
  const autre = await inscrireApp({ pseudo: "autre_miam" });
  assert.equal((await modifier(lea.jeton, { pseudo: "lea.nouvelle" })).statut, 200);
  const reservation = pseudosReserves.reservations.get("lea.croque");
  assert.deepEqual({ ...reservation, creeLe: undefined }, {
    compteId: lea.id, raison: "changement", reserveJusquLe: banc.horloge + DUREE_RESERVATION_PSEUDO, creeLe: undefined,
  });

  // Exactement la même réponse qu'un pseudo porté : rien ne dit qu'il a été libéré, ni par qui
  const reserve = await modifier(autre.jeton, { pseudo: "lea.croque" });
  const porte = await modifier(autre.jeton, { pseudo: "lea.nouvelle" });
  assert.deepEqual([reserve.statut, reserve.corps], [409, { ok: false, erreur: "pseudo-pris" }]);
  assert.deepEqual([porte.statut, porte.corps], [reserve.statut, reserve.corps]);
  assert.equal(await disponible(autre.jeton, "lea.croque"), false);
  assert.equal(await disponible(autre.jeton, "@Lea.Croque"), false, "forme normalisée");
  const inscription = await demander("POST", "/comptes", { corps: inscriptionApp({ pseudo: "lea.croque" }) });
  assert.deepEqual([inscription.statut, inscription.corps], [409, { ok: false, erreur: "pseudo-pris" }]);
  assert.equal(memoire.comptes.get(autre.id)?.pseudo, "autre_miam");
});

test("le même compte peut reprendre son ancien pseudo : la réservation part, et celui qu'il quitte est réservé à son tour", async () => {
  const zoe = await inscrireApp({ pseudo: "zoe.avant" });
  await modifier(zoe.jeton, { pseudo: "zoe.apres" });
  assert.equal(await disponible(zoe.jeton, "zoe.avant"), true);
  const retour = await modifier(zoe.jeton, { pseudo: "zoe.avant" });
  assert.deepEqual([retour.statut, retour.corps.profil.pseudo], [200, "zoe.avant"]);
  assert.equal(pseudosReserves.reservations.has("zoe.avant"), false);
  assert.equal(pseudosReserves.reservations.get("zoe.apres")?.compteId, zoe.id);
  // Remettre le même pseudo ne réserve rien
  await modifier(zoe.jeton, { pseudo: "zoe.avant" });
  assert.equal(pseudosReserves.reservations.has("zoe.avant"), false);
});

test("après 30 jours, la réservation est expirée et le pseudo est libre pour un autre", async () => {
  const sam = await inscrireApp({ pseudo: "sam.expire" });
  const autre = await inscrireApp();
  await modifier(sam.jeton, { pseudo: "sam.ailleurs" });
  const depart = banc.horloge;
  try {
    banc.horloge = depart + DUREE_RESERVATION_PSEUDO - 1;
    assert.equal(await disponible(autre.jeton, "sam.expire"), false, "encore réservé la dernière milliseconde");
    banc.horloge = depart + DUREE_RESERVATION_PSEUDO;
    assert.equal(await disponible(autre.jeton, "sam.expire"), true);
    const pris = await modifier(autre.jeton, { pseudo: "sam.expire" });
    assert.deepEqual([pris.statut, pris.corps.profil.pseudo], [200, "sam.expire"]);
    assert.equal(pseudosReserves.reservations.has("sam.expire"), false);
  } finally {
    banc.horloge = depart;
  }
});

test("suppression du compte : son pseudo est réservé 30 jours pour personne, ses anciens pseudos restent réservés sans lui", async () => {
  const ines = await inscrireApp({ pseudo: "ines.ancien" });
  await modifier(ines.jeton, { pseudo: "ines.part" });
  assert.equal((await supprimer(ines.jeton)).statut, 200);
  assert.equal(memoire.comptes.has(ines.id), false);
  assert.deepEqual(
    { ...pseudosReserves.reservations.get("ines.part"), creeLe: undefined },
    { compteId: null, raison: "suppression", reserveJusquLe: banc.horloge + DUREE_RESERVATION_PSEUDO, creeLe: undefined },
  );
  assert.equal(pseudosReserves.reservations.get("ines.ancien")?.compteId, null, "ON DELETE SET NULL");
  const autre = await inscrireApp();
  for (const pseudo of ["ines.part", "ines.ancien"]) {
    assert.equal(await disponible(autre.jeton, pseudo), false);
    assert.equal((await modifier(autre.jeton, { pseudo })).statut, 409);
  }
  const inscription = await demander("POST", "/comptes", { corps: inscriptionApp({ pseudo: "ines.part" }) });
  assert.deepEqual(inscription.corps, { ok: false, erreur: "pseudo-pris" });
});

test("estPseudoReserve : réservé, pas expiré et porté par personne ; forme normalisée ; jamais pour un pseudo inconnu", async () => {
  const tom = await inscrireApp({ pseudo: "tom.lien" });
  assert.equal(await pseudosReserves.estPseudoReserve("tom.lien"), false, "porté : pas réservé");
  await modifier(tom.jeton, { pseudo: "tom.neuf" });
  assert.equal(await pseudosReserves.estPseudoReserve("tom.lien"), true);
  assert.equal(await pseudosReserves.estPseudoReserve("@TOM.Lien "), true);
  assert.equal(await pseudosReserves.estPseudoReserve("personne.ici"), false);
  assert.equal(await pseudosReserves.estPseudoReserve(""), false);
  const apres = new Date(banc.horloge + DUREE_RESERVATION_PSEUDO);
  assert.equal(await pseudosReserves.estPseudoReserve("tom.lien", apres), false, "expiré");
  // Repris par son titulaire : porté de nouveau, donc plus « réservé »
  await modifier(tom.jeton, { pseudo: "tom.lien" });
  assert.equal(await pseudosReserves.estPseudoReserve("tom.lien"), false);
});

test("ménage de nuit : seules les réservations expirées partent, et il ne rend qu'un nombre", async () => {
  const noa = await inscrireApp({ pseudo: "noa.menage" });
  await modifier(noa.jeton, { pseudo: "noa.reste" });
  const depart = banc.horloge;
  pseudosReserves.reserver("vieux.pseudo", null, "suppression", depart - DUREE_RESERVATION_PSEUDO);
  const avant = pseudosReserves.reservations.size;
  assert.equal(pseudosReserves.effacerExpires(new Date(depart)), 1);
  assert.equal(pseudosReserves.reservations.has("vieux.pseudo"), false);
  assert.equal(pseudosReserves.reservations.has("noa.menage"), true);
  assert.equal(pseudosReserves.reservations.size, avant - 1);
  assert.equal(pseudosReserves.effacerExpires(new Date(depart + DUREE_RESERVATION_PSEUDO)), avant - 1, "tout expire au bout de 30 jours");
  assert.equal(pseudosReserves.reservations.size, 0);
});
