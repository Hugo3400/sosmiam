import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { MESSAGE_SANITAIRE_ALCOOL } from "../../../packages/commun/src/contenus/prevention-alcool.ts";
import { creerBancVisites } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
});

const MINUTE = 60_000;
const VINGT_HEURES = Date.parse("2026-10-09T18:00:00.000Z");
const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 30, couvertsParService: 6, couvertsParCreneau: 4 };
const MIDI = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 30, couvertsParService: 20, couvertsParCreneau: 20 };
const iso = (heure: string, jour = "2026-10-09") => new Date(Date.parse(`${jour}T${heure}:00+02:00`)).toISOString();

async function equipe(reglages: Record<string, unknown>) {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  const r = await b.demander("PUT", "/pro/comptoir/lieux/1/reservations/reglages", gerant.jeton, { services: [SOIR], delai: "1-h", ...reglages });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  return { gerant, serveur };
}

const reserver = (jeton: string, corps: Record<string, unknown> = {}) =>
  b.demander("POST", "/app/reservations", jeton, { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00", message: null, ...corps });
const accepter = (id: number, jeton: string, corps?: unknown) => b.demander("POST", `/pro/comptoir/reservations/${id}/accepter`, jeton, corps);

async function prevenus() {
  await b.attendreEnvois();
  const tout = b.prevenus.map((p) => ({ compteId: p.compteId, ...p.message }));
  b.prevenus.length = 0;
  return tout;
}

test("jours : 31 jours et leur état, le mode et le délai, les personnes vérifiées", async () => {
  const lea = await b.creerCompte();
  const sansReglage = await b.demander("GET", "/app/reservations/jours?lieuId=1&personnes=12", lea.jeton);
  assert.deepEqual([sansReglage.statut, sansReglage.corps.acceptation, sansReglage.corps.delai, sansReglage.corps.personnesMax, sansReglage.corps.jours[0]],
    [200, "manuelle", "1-h", 12, { jour: "2026-10-09", etat: "ouvert" }], "sans réglage : les horaires de la fiche");
  await equipe({ acceptation: "automatique" });
  const fermeture = await b.demander("PUT", "/pro/comptoir/lieux/1/reservations/jours-fermes/2026-10-11", (await b.creerCompte({ prenom: "Bob" })).jeton);
  assert.equal(fermeture.statut, 403);
  b.visites.reglagesReservations.get(1)!.joursFermes.push("2026-10-11");
  const r = await b.demander("GET", "/app/reservations/jours?lieuId=1&personnes=2", lea.jeton);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.deepEqual([r.corps.jours.length, r.corps.acceptation, r.corps.delai, r.corps.personnesMax], [31, "automatique", "1-h", 4]);
  assert.deepEqual(r.corps.jours.slice(0, 3), [{ jour: "2026-10-09", etat: "ouvert" }, { jour: "2026-10-10", etat: "ouvert" }, { jour: "2026-10-11", etat: "sans-resa" }]);
  assert.equal((await b.demander("GET", "/app/reservations/jours?lieuId=1&personnes=5", lea.jeton)).corps.jours[0].etat, "complet");
  for (const requete of ["lieuId=1", "lieuId=1&personnes=0", "lieuId=1&personnes=13", "lieuId=1&personnes=2.5", "personnes=2"]) {
    const x = await b.demander("GET", `/app/reservations/jours?${requete}`, lea.jeton);
    assert.deepEqual([x.statut, x.corps.erreur, x.corps.champ], [400, "champ-invalide", requete.startsWith("personnes") ? "lieuId" : "personnes"], requete);
  }
});

test("créneaux : ceux qui accueillent le groupe, sans jamais un nombre de places ni rien des autres clients", async () => {
  const { serveur } = await equipe({ services: [MIDI, SOIR], acceptation: "manuelle" });
  const lea = await b.creerCompte();
  const tom = await b.creerCompte({ prenom: "Tom" });
  const id = (await reserver(tom.jeton, { personnes: 4, heure: "19:00" })).corps.reservation.id;
  await accepter(id, serveur.jeton);
  const r = await b.demander("GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-09&personnes=2", lea.jeton);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.deepEqual(r.corps.creneaux, ["13:00", "13:30", "19:30", "20:00", "20:30", "21:00", "21:30"]);
  assert.deepEqual(r.corps.disponibles[2], { heure: "19:30", peuDePlaces: true });
  assert.deepEqual(r.corps.services.map((s: { premier: string; etat: string }) => [s.premier, s.etat]), [["12:00", "ouvert"], ["19:00", "ouvert"]]);
  assert.equal(r.corps.acceptation, "manuelle");
  assert.doesNotMatch(JSON.stringify(r.corps), /places|couverts|Tom|personnes/);
  const groupe = await b.demander("GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-09&personnes=3", lea.jeton);
  assert.deepEqual(groupe.corps.creneaux, ["13:00", "13:30"], "le soir n'a plus que 2 couverts");
  assert.equal((await b.demander("GET", "/app/reservations/creneaux?lieuId=1&jour=2026-10-09&personnes=x", lea.jeton)).corps.champ, "personnes");
});

test("acceptation automatique : acceptée tout de suite, le plan B si le premier est complet, sinon « Raté de peu »", async () => {
  const { serveur, gerant } = await equipe({ acceptation: "automatique" });
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const premiere = await reserver(lea.jeton, { personnes: 4 });
  assert.equal(premiere.statut, 201, JSON.stringify(premiere.corps));
  const v = premiere.corps.reservation;
  assert.deepEqual([v.statut, v.code, v.automatique, v.creneau, v.creneauxProposes, v.reponduLe], ["acceptee", "1234", true, iso("20:00"), [iso("20:00")], "2026-10-09T10:00:00.000Z"]);
  assert.equal(premiere.corps.nouvelleTable, undefined, "rien d'interne dans la réponse");
  assert.deepEqual(await prevenus(), [
    { compteId: gerant.id, titre: "Une résa de plus ⚡", texte: "Chez Léa : 4 gourmands arrivent ce soir à 20h. C'est accepté tout seul, le code d'arrivée est au comptoir.", lien: "/pro/reservations" },
    { compteId: serveur.id, titre: "Une résa de plus ⚡", texte: "Chez Léa : 4 gourmands arrivent ce soir à 20h. C'est accepté tout seul, le code d'arrivée est au comptoir.", lien: "/pro/reservations" },
    { compteId: lea.id, titre: "C'est réservé ! 🎉", texte: "Chez Léa t'attend ce soir à 20h. Ton code d'arrivée est dans Mes réservations.", lien: "/reservations" },
  ]);
  const planB = await reserver(sam.jeton, { heure: "20:00", autresHeures: ["20:30"] });
  assert.deepEqual([planB.statut, planB.corps.reservation.creneau, planB.corps.reservation.creneauxProposes], [201, iso("20:30"), [iso("20:00"), iso("20:30")]]);
  assert.equal((await prevenus()).length, 3);
  const complet = await reserver(zoe.jeton, { heure: "21:00", autresHeures: ["19:00", "21:30"] });
  assert.deepEqual([complet.statut, complet.corps.erreur], [409, "creneau-complet"]);
  assert.deepEqual([b.visites.reservations.length, await prevenus()], [2, []]);
});

test("doublon : mêmes horaires chez le même lieu en moins de 2 min ; un déjeuner et un dîner le même jour passent", async () => {
  await equipe({ services: [MIDI, SOIR], acceptation: "automatique" });
  const lea = await b.creerCompte();
  assert.equal((await reserver(lea.jeton, { heure: "20:00", autresHeures: ["21:00"] })).statut, 201);
  const double = await reserver(lea.jeton, { heure: "21:00", autresHeures: ["20:00"] });
  assert.deepEqual([double.statut, double.corps.erreur], [409, "reservation-en-double"]);
  assert.equal((await reserver(lea.jeton, { heure: "13:00" })).corps.reservation.statut, "acceptee", "le déjeuner du même jour");
  b.banc.horloge += 2 * MINUTE;
  assert.equal((await reserver(lea.jeton, { personnes: 1, heure: "21:00", autresHeures: ["20:00"] })).statut, 201, "2 min après, ce n'est plus un doublon");
  assert.equal((await reserver(lea.jeton, { heure: "13:30" })).corps.erreur, "trop-de-reservations");
  for (const corps of [{ heure: "19:10" }, { autresHeures: ["19:00", "19:30", "21:00"] }, { autresHeures: ["20:00"] }, { autresHeures: "21:00" }]) {
    const r = await reserver((await b.creerCompte({ prenom: "Tom" })).jeton, corps);
    assert.deepEqual([r.statut, r.corps.erreur], [400, "creneau-invalide"], JSON.stringify(corps));
  }
});

test("réponse à la main : plan B proposé au lieu, horaire choisi, le premier qui a de la place, « quand même »", async () => {
  const { serveur, gerant } = await equipe({ acceptation: "manuelle" });
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const a = (await reserver(lea.jeton, { personnes: 4, heure: "20:00", autresHeures: ["19:00"] })).corps.reservation;
  assert.deepEqual([a.statut, a.creneau, a.creneauxProposes, a.automatique], ["demandee", iso("19:00"), [iso("20:00"), iso("19:00")], false]);
  assert.deepEqual((await prevenus()).map((p) => [p.compteId, p.texte]), [gerant.id, serveur.id].map((id) => [
    id, "Chez Léa : 4 gourmands demandent une table ce soir à 20h (ou 19h). À toi de répondre au comptoir !",
  ]));
  const s = (await reserver(sam.jeton, { personnes: 4, heure: "20:30" })).corps.reservation;
  const liste = (await b.demander("GET", "/pro/comptoir/lieux/1/reservations", serveur.jeton)).corps.reservations;
  assert.deepEqual(liste[0].propositions, [
    { creneau: iso("20:00"), places: 4, horsReglages: false, jourFerme: false }, { creneau: iso("19:00"), places: 4, horsReglages: false, jourFerme: false },
  ]);
  assert.equal(liste[0].limiteReponse, "2026-10-09T16:30:00.000Z");

  const pasPropose = await accepter(a.id, serveur.jeton, { creneau: iso("21:00") });
  assert.deepEqual([pasPropose.statut, pasPropose.corps.erreur], [409, "horaire-non-propose"]);
  for (const [corps, champ] of [[{ creneau: 5 }, "creneau"], [{ depasser: "oui" }, "depasser"]] as const) {
    assert.deepEqual((await accepter(a.id, serveur.jeton, corps)).corps.champ, champ);
  }
  const choisi = await accepter(a.id, serveur.jeton, { creneau: iso("20:00"), depasser: false });
  assert.deepEqual([choisi.statut, choisi.corps.reservation.creneau, choisi.corps.reservation.statut], [200, iso("20:00"), "acceptee"]);
  const vue = (await b.demander("GET", `/app/reservations/${a.id}`, lea.jeton)).corps.reservation;
  assert.deepEqual([vue.creneau, vue.code], [iso("20:00"), "1234"]);
  assert.deepEqual((await prevenus()).filter((p) => p.lien === "/reservations").map((p) => p.texte), ["Chez Léa t'attend ce soir à 20h. Ton code d'arrivée est dans Mes réservations."]);

  const plein = await accepter(s.id, gerant.jeton);
  assert.deepEqual([plein.statut, plein.corps.erreur, plein.corps.details], [409, "capacite-depassee", { places: 2 }]);
  const quandMeme = await accepter(s.id, gerant.jeton, { depasser: true });
  assert.deepEqual([quandMeme.statut, quandMeme.corps.reservation.creneau], [200, iso("20:30")]);
});

test("réponse à la main : sans horaire choisi, le premier qui a de la place ; un jour fermé se confirme", async () => {
  const { serveur } = await equipe({ acceptation: "manuelle" });
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const t = (await reserver(lea.jeton, { personnes: 4, heure: "20:00" })).corps.reservation.id;
  const s = (await reserver(sam.jeton, { personnes: 2, heure: "20:00", autresHeures: ["21:00"] })).corps.reservation.id;
  const z = (await reserver(zoe.jeton, { jour: "2026-10-10" })).corps.reservation.id;
  await accepter(t, serveur.jeton);
  const r = await accepter(s, serveur.jeton);
  assert.deepEqual([r.statut, r.corps.reservation.creneau], [200, iso("21:00")], "20 h n'a plus d'arrivées : 21 h");
  await b.demander("PUT", "/pro/comptoir/lieux/1/reservations/jours-fermes/2026-10-10", serveur.jeton);
  const ferme = await accepter(z, serveur.jeton);
  assert.deepEqual([ferme.statut, ferme.corps.erreur, ferme.corps.details], [409, "jour-ferme", { places: 4 }]);
  assert.equal((await accepter(z, serveur.jeton, { depasser: true })).corps.reservation.statut, "acceptee");
});

test("expiration selon le mode et le délai : 10 min avant à la main avec 30 min de délai, 30 min avant sinon", async () => {
  const { serveur } = await equipe({ acceptation: "manuelle", delai: "30-min" });
  const lea = await b.creerCompte();
  const id = (await reserver(lea.jeton)).corps.reservation.id;
  const vue = (await b.demander("GET", "/pro/comptoir/lieux/1/reservations", serveur.jeton)).corps.reservations[0];
  assert.equal(vue.limiteReponse, "2026-10-09T17:50:00.000Z");
  b.banc.horloge = VINGT_HEURES - 11 * MINUTE;
  assert.equal((await b.demander("GET", `/app/reservations/${id}`, lea.jeton)).corps.reservation.statut, "demandee");
  b.banc.horloge = VINGT_HEURES - 10 * MINUTE;
  assert.equal((await accepter(id, serveur.jeton)).corps.erreur, "delai-depasse");
  assert.equal(b.visites.reservations[0]!.statut, "expiree");

  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
  const autre = await equipe({ acceptation: "manuelle", delai: "1-h" });
  const sam = await b.creerCompte({ prenom: "Sam" });
  const s = (await reserver(sam.jeton)).corps.reservation.id;
  b.banc.horloge = VINGT_HEURES - 31 * MINUTE;
  assert.equal((await accepter(s, autre.serveur.jeton)).statut, 200, "31 min avant : encore à temps");
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  b.banc.horloge = Date.parse("2026-10-09T10:00:00.000Z");
  const z = (await reserver(zoe.jeton, { heure: "21:00" })).corps.reservation.id;
  b.banc.horloge = VINGT_HEURES + 30 * MINUTE;
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/1", autre.serveur.jeton)).corps.etat.reservationsARepondre, 0);
  assert.equal(b.visites.reservations.find((r) => r.id === z)?.statut, "expiree");
});

test("annuler côté lieu : jusqu'à l'heure de la table, ensuite « Venu » ou « Pas venu »", async () => {
  const { serveur } = await equipe({ acceptation: "automatique" });
  const lea = await b.creerCompte();
  const id = (await reserver(lea.jeton)).corps.reservation.id;
  b.banc.horloge = VINGT_HEURES;
  const tard = await b.demander("POST", `/pro/comptoir/reservations/${id}/annuler`, serveur.jeton, { motif: "ferme" });
  assert.deepEqual([tard.statut, tard.corps.erreur], [409, "delai-depasse"]);
  b.banc.horloge = VINGT_HEURES - MINUTE;
  assert.equal((await b.demander("POST", `/pro/comptoir/reservations/${id}/annuler`, serveur.jeton, { motif: "ferme" })).statut, 200);
});

test("un bar : le message sanitaire dans chaque notification, à l'équipe comme au client", async () => {
  b.visites.lieux.get(1)!.type = "bar";
  b.visites.lieux.get(1)!.nom = "Le Zinc";
  const { serveur } = await equipe({ acceptation: "automatique" });
  const lea = await b.creerCompte();
  await reserver(lea.jeton);
  const recus = await prevenus();
  assert.equal(recus.length, 3);
  for (const p of recus) assert.ok(p.texte.endsWith(` ${MESSAGE_SANITAIRE_ALCOOL}`), p.texte);
  b.visites.lieux.get(1)!.type = "resto";
  b.visites.lieux.get(1)!.nom = "La Cave à bières";
  await b.demander("POST", `/app/reservations/${b.visites.reservations[0]!.id}/annuler`, lea.jeton);
  await reserver((await b.creerCompte({ prenom: "Sam" })).jeton);
  const equipeSeule = (await prevenus()).find((p) => p.compteId === serveur.id)!;
  assert.ok(equipeSeule.texte.includes(MESSAGE_SANITAIRE_ALCOOL), "un nom qui parle d'alcool");
});
