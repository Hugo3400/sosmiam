import assert from "node:assert/strict";
import { after, before, beforeEach, mock, test } from "node:test";

import type { TablesVisites } from "../src/services/visites-regles.ts";
import { creerPassageExpirationReservations } from "../src/taches/expirer-reservations.ts";
import { creerBancVisites, SUR_PLACE } from "./outils/creer-banc-visites.ts";

mock.method(console, "log", () => {});

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
});

type Mutant = "aucun" | "sans-verrou-du-lieu" | "verrou-apres-lecture" | "sans-verrous" | "sans-verrous-ni-garde";

const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 30, couvertsParService: 6, couvertsParCreneau: 4 };
const iso = (heure: string) => new Date(Date.parse(`2026-10-09T${heure}:00+02:00`)).toISOString();

function creerBarriere(attendus: number, delaiMs: number) {
  let arrives = 0;
  let ouvrir!: () => void;
  const ouverte = new Promise<void>((fini) => (ouvrir = fini));
  return async () => {
    arrives++;
    if (arrives >= attendus) ouvrir();
    await Promise.race([ouverte, new Promise((fini) => setTimeout(fini, delaiMs))]);
  };
}

function adapter(t: TablesVisites, mutant: Mutant, barriere: () => Promise<void>): TablesVisites {
  const rien = async () => {};
  const sansVerrous = mutant === "sans-verrous" || mutant === "sans-verrous-ni-garde";
  return {
    ...t,
    async listerOccupation(lieuId, depuis, avant) {
      const lues = await t.listerOccupation(lieuId, depuis, avant);
      await barriere();
      if (mutant === "verrou-apres-lecture") await t.verrouillerLieu(lieuId);
      return lues;
    },
    ...(mutant === "aucun" ? {} : { verrouillerLieu: rien }),
    ...(sansVerrous ? { verrouillerCompte: rien, verrouillerReservation: rien } : {}),
    ...(mutant === "sans-verrous-ni-garde" ? { modifierReservation: (id, champs) => t.modifierReservation(id, champs) } : {}),
  };
}

async function avec<T>(mutant: Mutant, barriere: () => Promise<void>, faire: () => Promise<T>): Promise<T> {
  const depot = b.visites.depot;
  const ecrireReel = depot.ecrire;
  depot.ecrire = (fn) => ecrireReel((t) => fn(adapter(t, mutant, barriere)));
  try {
    return await faire();
  } finally {
    depot.ecrire = ecrireReel;
  }
}

async function equipe(acceptation: "automatique" | "manuelle") {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");
  const r = await b.demander("PUT", "/pro/comptoir/lieux/1/reservations/reglages", gerant.jeton, { services: [SOIR], acceptation, delai: "1-h" });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  return { gerant, serveur };
}

const reserver = (jeton: string, corps: Record<string, unknown> = {}) =>
  b.demander("POST", "/app/reservations", jeton, { lieuId: 1, personnes: 4, jour: "2026-10-09", heure: "20:00", message: null, ...corps });
const accepter = (id: number, jeton: string) => b.demander("POST", `/pro/comptoir/reservations/${id}/accepter`, jeton, {});
const couvertsPris = () => b.visites.reservations.filter((r) => r.statut === "acceptee").reduce((total, r) => total + r.personnes, 0);

async function prevenus() {
  await b.attendreEnvois();
  const tout = b.prevenus.map((p) => ({ compteId: p.compteId, titre: p.message.titre, lien: p.message.lien }));
  b.prevenus.length = 0;
  return tout;
}

async function courseDeDemandes(mutant: Mutant) {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
  const { serveur } = await equipe("automatique");
  const tom = await b.creerCompte({ prenom: "Tom" });
  assert.equal((await reserver(tom.jeton, { personnes: 2, heure: "19:00" })).statut, 201);
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  await prevenus();
  const reponses = await avec(mutant, creerBarriere(2, 150), () => Promise.all([reserver(lea.jeton), reserver(sam.jeton)]));
  return { statuts: reponses.map((r) => r.statut).sort(), couverts: couvertsPris(), recus: await prevenus(), serveur, clients: [lea.id, sam.id] };
}

test("course de deux demandes sur les dernières places : une seule passe, les couverts du service ne sont jamais dépassés", async () => {
  const { statuts, couverts, recus, serveur, clients } = await courseDeDemandes("aucun");
  assert.deepEqual([statuts, couverts], [[201, 409], 6]);
  const gagnant = b.visites.reservations.find((r) => r.statut === "acceptee" && clients.includes(r.compteId))!.compteId;
  assert.deepEqual(recus.filter((p) => p.compteId === serveur.id).map((p) => p.titre), ["Une résa de plus ⚡"], "l'équipe : une fois, pour la table prise");
  assert.deepEqual(recus.filter((p) => clients.includes(p.compteId)), [{ compteId: gagnant, titre: "C'est réservé ! 🎉", lien: "/reservations" }]);
});

test("mutants de la course des demandes : sans verrou du lieu, ou verrou pris après la lecture, le service déborde", async () => {
  for (const mutant of ["sans-verrou-du-lieu", "verrou-apres-lecture"] as const) {
    const { statuts, couverts } = await courseDeDemandes(mutant);
    assert.deepEqual([statuts, couverts], [[201, 201], 10], `${mutant} : la course est bien vue par l'essai`);
  }
});

async function deuxMembresSurLaMemeDemande(mutant: Mutant) {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
  const { gerant, serveur } = await equipe("manuelle");
  const lea = await b.creerCompte();
  const id = (await reserver(lea.jeton, { personnes: 2 })).corps.reservation.id as number;
  await prevenus();
  const reponses = await avec(mutant, creerBarriere(2, 150), () => Promise.all([accepter(id, gerant.jeton), accepter(id, serveur.jeton)]));
  return { reponses: reponses.map((r) => [r.statut, r.corps.erreur ?? r.corps.reservation.statut]).sort(), recus: await prevenus(), lea, membres: [gerant.id, serveur.id] };
}

test("deux membres acceptent la même demande en même temps : une seule acceptation, le client prévenu une fois, jamais les membres", async () => {
  const { reponses, recus, lea, membres } = await deuxMembresSurLaMemeDemande("aucun");
  assert.deepEqual(reponses, [[200, "acceptee"], [409, "transition-interdite"]]);
  assert.deepEqual(recus, [{ compteId: lea.id, titre: "C'est réservé ! 🎉", lien: "/reservations" }]);
  assert.ok(!recus.some((p) => membres.includes(p.compteId)));
  const sansVerrous = await deuxMembresSurLaMemeDemande("sans-verrous");
  assert.deepEqual(sansVerrous.reponses, [[200, "acceptee"], [409, "delai-depasse"]], "sans verrous, la garde « encore demandée » tient seule");
  assert.equal(sansVerrous.recus.length, 1);
  const mutant = await deuxMembresSurLaMemeDemande("sans-verrous-ni-garde");
  assert.deepEqual(mutant.reponses, [[200, "acceptee"], [200, "acceptee"]], "mutant sans verrous ni garde : la double acceptation est bien vue");
  assert.equal(mutant.recus.length, 2);
});

async function deuxDemandesPourLesDernieresPlaces(mutant: Mutant) {
  b.vider();
  b.visites.lieux.get(1)!.reservable = true;
  const { gerant, serveur } = await equipe("manuelle");
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const a = (await reserver(lea.jeton)).corps.reservation.id as number;
  const s = (await reserver(sam.jeton, { heure: "20:30" })).corps.reservation.id as number;
  const reponses = await avec(mutant, creerBarriere(2, 150), () => Promise.all([accepter(a, gerant.jeton), accepter(s, serveur.jeton)]));
  return { reponses: reponses.map((r) => [r.statut, r.corps.erreur ?? "ok", r.corps.details?.places ?? null]).sort(), couverts: couvertsPris() };
}

test("deux membres acceptent deux demandes pour les dernières places : la seconde voit la première (capacite-depassee)", async () => {
  assert.deepEqual(await deuxDemandesPourLesDernieresPlaces("aucun"), { reponses: [[200, "ok", null], [409, "capacite-depassee", 2]], couverts: 4 });
  for (const mutant of ["sans-verrou-du-lieu", "verrou-apres-lecture"] as const) {
    assert.deepEqual(await deuxDemandesPourLesDernieresPlaces(mutant), { reponses: [[200, "ok", null], [200, "ok", null]], couverts: 8 }, mutant);
  }
});

test("pas d'interblocage : tâche de la minute, acceptations, demandes, annulation, QR et réglages en même temps", async () => {
  const { gerant, serveur } = await equipe("manuelle");
  const clients = await Promise.all(["Léa", "Sam", "Zoé", "Tom", "Noé"].map((prenom) => b.creerCompte({ prenom })));
  const [aTemps, bientot, plusTard] = [
    (await reserver(clients[0]!.jeton, { personnes: 2, heure: "20:00" })).corps.reservation.id as number,
    (await reserver(clients[1]!.jeton, { personnes: 2, heure: "21:30", autresHeures: ["21:00"] })).corps.reservation.id as number,
    (await reserver(clients[2]!.jeton, { personnes: 2, heure: "21:30" })).corps.reservation.id as number,
  ];
  b.banc.horloge = Date.parse(iso("19:31"));
  const passer = creerPassageExpirationReservations({ depot: b.visitesApp.depot, prevenirCompte: b.visitesApp.prevenirCompte!, horloge: () => b.banc.horloge });
  const tout = avec("aucun", creerBarriere(99, 5), () => Promise.all([
    passer(), passer(),
    accepter(aTemps, gerant.jeton), accepter(bientot, serveur.jeton), accepter(plusTard, serveur.jeton),
    b.demander("POST", `/app/reservations/${plusTard}/annuler`, clients[2]!.jeton),
    reserver(clients[3]!.jeton, { personnes: 1, heure: "21:00" }),
    b.demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, { personnes: 2 }),
    b.demander("PUT", "/pro/comptoir/lieux/1/reservations/jours-fermes/2026-10-20", serveur.jeton),
    b.demander("PUT", "/pro/comptoir/lieux/1/reservations/reglages", gerant.jeton, { services: [SOIR], acceptation: "manuelle", delai: "1-h" }),
    b.demander("GET", "/pro/comptoir/lieux/1", serveur.jeton),
    b.demander("POST", `/app/visites/addition`, clients[4]!.jeton, { lieuId: 1, position: SUR_PLACE }),
  ]));
  const fini = await Promise.race([tout.then(() => "fini"), new Promise((r) => setTimeout(() => r("bloqué"), 5_000))]);
  assert.equal(fini, "fini");
  const statut = (id: number) => b.visites.reservations.find((r) => r.id === id)?.statut;
  assert.equal(statut(aTemps), "expiree", "à 29 min de 20 h : endormie, jamais acceptée");
  assert.equal(statut(bientot), "acceptee", "le plus tôt de ses horaires est 21 h : encore le temps de répondre");
  assert.ok(["acceptee", "annulee"].includes(statut(plusTard) ?? ""));
});
