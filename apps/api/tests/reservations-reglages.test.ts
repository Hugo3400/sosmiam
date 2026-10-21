import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { creerBancVisites } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
});

const CHEMIN = "/pro/comptoir/lieux/1/reservations";
const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 30, couvertsParService: 6, couvertsParCreneau: 4 };
const REGLAGES = { services: [SOIR], acceptation: "manuelle", delai: "1-h" };

async function equipe() {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  return { gerant, serveur };
}

const lire = (jeton: string) => b.demander("GET", `${CHEMIN}/reglages`, jeton);
const regler = (jeton: string, corps: unknown) => b.demander("PUT", `${CHEMIN}/reglages`, jeton, corps);
const fermer = (jeton: string, jour: string, ferme = true) => b.demander(ferme ? "PUT" : "DELETE", `${CHEMIN}/jours-fermes/${jour}`, jeton);

async function reserver(jeton: string, corps: Record<string, unknown> = {}) {
  const r = await b.demander("POST", "/app/reservations", jeton, { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00", message: null, ...corps });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return r.corps.reservation.id as number;
}

test("lire : toute l'équipe, les défauts sans réglage, jamais un inconnu", async () => {
  const { gerant, serveur } = await equipe();
  const inconnu = await b.creerCompte({ prenom: "Paul" });
  for (const jeton of [gerant.jeton, serveur.jeton]) {
    const r = await lire(jeton);
    assert.equal(r.statut, 200, JSON.stringify(r.corps));
    assert.equal(r.entetes.get("cache-control"), "private, no-store");
    assert.deepEqual(r.corps, {
      ok: true, reglages: { services: [], acceptation: "manuelle", delai: "1-h", joursFermes: [] }, regle: false, aRevoir: [], reservable: true,
      ouverture: b.visites.lieux.get(1)!.ouverture,
    });
  }
  assert.deepEqual([(await lire(inconnu.jeton)).statut, (await lire(inconnu.jeton)).corps.erreur], [403, "role-requis"]);
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/abc/reservations/reglages", gerant.jeton)).corps.champ, "id");
  b.visites.lieux.get(1)!.reservable = false;
  assert.equal((await lire(serveur.jeton)).corps.reservable, false);
});

test("enregistrer : le gérant seul, réglages revérifiés, champ précis, couverts du service obligatoires", async () => {
  const { gerant, serveur } = await equipe();
  const ok = await regler(gerant.jeton, REGLAGES);
  assert.equal(ok.statut, 200, JSON.stringify(ok.corps));
  assert.deepEqual([ok.corps.regle, ok.corps.reglages], [true, { ...REGLAGES, joursFermes: [] }]);
  assert.deepEqual((await lire(serveur.jeton)).corps.reglages, { ...REGLAGES, joursFermes: [] });
  const equipier = await regler(serveur.jeton, REGLAGES);
  assert.deepEqual([equipier.statut, equipier.corps.erreur], [403, "role-requis"]);
  const cas: [unknown, string][] = [
    [{ ...REGLAGES, services: [{ ...SOIR, couvertsParService: undefined }] }, "services.0.couvertsParService"],
    [{ ...REGLAGES, services: [SOIR, { ...SOIR, premier: "21:00", dernier: "22:00" }] }, "services.1.premier"],
    [{ ...REGLAGES, services: [{ ...SOIR, couvertsParCreneau: 7 }] }, "services.0.couvertsParCreneau"],
    [{ ...REGLAGES, services: [], acceptation: "automatique" }, "acceptation"],
    [{ ...REGLAGES, delai: "3-h" }, "delai"],
  ];
  for (const [corps, champ] of cas) {
    const r = await regler(gerant.jeton, corps);
    assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "reglages-invalides", champ], champ);
  }
  assert.deepEqual(b.visites.reglagesReservations.get(1)?.services, [SOIR], "un refus n'écrit rien");
  const sansArrivees = await regler(gerant.jeton, { ...REGLAGES, services: [{ ...SOIR, couvertsParCreneau: null }] });
  assert.equal(sansArrivees.corps.reglages.services[0].couvertsParCreneau, 6, "les arrivées par créneau valent les couverts du service");
});

test("jours fermés : une ressource à part, gérant et équipe ; le PUT des réglages ne rouvre jamais un jour", async () => {
  const { gerant, serveur } = await equipe();
  const ferme = await fermer(serveur.jeton, "2026-10-12");
  assert.equal(ferme.statut, 200, JSON.stringify(ferme.corps));
  assert.deepEqual([ferme.corps.reglages.joursFermes, ferme.corps.regle, ferme.corps.reglages.services], [["2026-10-12"], true, []]);
  await fermer(gerant.jeton, "2026-10-10");
  assert.deepEqual((await fermer(gerant.jeton, "2026-10-10")).corps.reglages.joursFermes, ["2026-10-10", "2026-10-12"], "fermer deux fois : rien ne change");
  const reglages = await regler(gerant.jeton, { ...REGLAGES, joursFermes: [] });
  assert.deepEqual(reglages.corps.reglages.joursFermes, ["2026-10-10", "2026-10-12"], "un joursFermes envoyé est ignoré");
  const rouvert = await fermer(serveur.jeton, "2026-10-10", false);
  assert.deepEqual([rouvert.corps.reglages.joursFermes, rouvert.corps.reglages.services], [["2026-10-12"], [SOIR]]);
  for (const jour of ["2026-10-08", "2026-13-01", "demain", "2027-10-10"]) {
    const r = await fermer(serveur.jeton, jour);
    assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "champ-invalide", "jour"], jour);
  }
  const inconnu = await b.creerCompte({ prenom: "Paul" });
  assert.equal((await fermer(inconnu.jeton, "2026-10-14")).corps.erreur, "role-requis");
  const pleins = Array.from({ length: 120 }, (_, i) => new Date(Date.parse("2026-10-20T12:00:00Z") + i * 86_400_000).toISOString().slice(0, 10));
  b.visites.reglagesReservations.set(1, { ...b.visites.reglagesReservations.get(1)!, joursFermes: pleins });
  const trop = await fermer(serveur.jeton, "2026-10-14");
  assert.deepEqual([trop.statut, trop.corps.erreur, trop.corps.champ], [400, "reglages-invalides", "joursFermes"]);
});

test("fermer un jour n'écrit que les jours fermés : une ligne abîmée garde ses services", async () => {
  const { serveur } = await equipe();
  const abimes = [{ jours: "tous", premier: "midi" }];
  b.visites.reglagesReservations.set(1, { services: abimes as never, acceptation: "automatique", delai: "1-h", joursFermes: [] });
  const r = await fermer(serveur.jeton, "2026-10-12");
  assert.deepEqual([r.corps.reglages.services, r.corps.reglages.acceptation], [[], "manuelle"], "lus avec prudence");
  assert.deepEqual(b.visites.reglagesReservations.get(1)?.services, abimes, "jamais réécrits");
});

test("à revoir : un jour fermé avec des tables, un service décalé, des couverts baissés", async () => {
  const { gerant, serveur } = await equipe();
  await regler(gerant.jeton, REGLAGES);
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const ce = await reserver(lea.jeton, { personnes: 3 });
  const demain = await reserver(sam.jeton, { jour: "2026-10-10", heure: "19:00" });
  const attente = await reserver(zoe.jeton, { heure: "21:00" });
  for (const id of [ce, demain]) assert.equal((await b.demander("POST", `/pro/comptoir/reservations/${id}/accepter`, serveur.jeton)).statut, 200);
  assert.deepEqual((await lire(serveur.jeton)).corps.aRevoir, []);

  const ferme = await fermer(serveur.jeton, "2026-10-10");
  assert.deepEqual(ferme.corps.aRevoir, [{ id: demain, creneau: "2026-10-10T17:00:00.000Z", raison: "jour-ferme" }]);
  await fermer(serveur.jeton, "2026-10-10", false);

  const decale = await regler(gerant.jeton, { ...REGLAGES, services: [{ ...SOIR, premier: "19:15", dernier: "21:15" }] });
  assert.deepEqual(decale.corps.aRevoir, [{ id: demain, creneau: "2026-10-10T17:00:00.000Z", raison: "hors-service" }], "19 h sort du service de 19 h 15");
  assert.equal(b.visites.reservations.find((r) => r.id === attente)?.statut, "demandee");
  const baisse = await regler(gerant.jeton, { ...REGLAGES, services: [{ ...SOIR, couvertsParService: 2, couvertsParCreneau: 2 }] });
  assert.deepEqual(baisse.corps.aRevoir, [{ id: ce, creneau: "2026-10-09T18:00:00.000Z", raison: "capacite" }]);
});
