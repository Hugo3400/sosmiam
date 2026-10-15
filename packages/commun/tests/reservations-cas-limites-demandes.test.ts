import { test } from "node:test";
import assert from "node:assert/strict";
import type { CreneauOuverture } from "../src/types/lieu.ts";
import type { OccupationReservation, ReglagesReservations, ServiceReservation } from "../src/types/reglages-reservations.ts";
import type { DemandeReservation } from "../src/types/reservation.ts";
import { calculerMargeExpirationReservation } from "../src/fonctions/reservations/calculer-marge-expiration-reservation.ts";
import { deciderNouvelleReservation } from "../src/fonctions/reservations/decider-nouvelle-reservation.ts";
import { estAnnulationTardive } from "../src/fonctions/reservations/est-annulation-tardive.ts";
import { faireEvoluerReservation } from "../src/fonctions/reservations/faire-evoluer-reservation.ts";
import { listerReservationsARevoir } from "../src/fonctions/reservations/lister-reservations-a-revoir.ts";
import { verifierAcceptationHoraire } from "../src/fonctions/reservations/verifier-acceptation-horaire.ts";
import { verifierLimitesReservationCompte } from "../src/fonctions/reservations/verifier-limites-reservation-compte.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";
import { validerDemandeReservation } from "../src/validation/valider-demande-reservation.ts";

const MINUTE = 60_000;
const OUVERTURE: CreneauOuverture[] = [{ jours: [2, 3, 4, 5, 6], de: "12:00", a: "23:00" }];
const MIDI: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 30, couvertsParService: 24, couvertsParCreneau: 10 };
const SOIR: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "19:00", dernier: "21:00", pas: 15, couvertsParService: 72, couvertsParCreneau: 8 };
const AUTO: ReglagesReservations = { acceptation: "automatique", delai: "1-h", services: [MIDI, SOIR], joursFermes: [] };
const MAIN: ReglagesReservations = { ...AUTO, acceptation: "manuelle" };
const VENDREDI_10H = new Date(calculerInstantParis("2026-10-16", "10:00"));
const a = (heure: string, jour = "2026-10-17") => new Date(calculerInstantParis(jour, heure)).toISOString();
const t = (heure: string, jour = "2026-10-17") => calculerInstantParis(jour, heure);
const prise = (heure: string, personnes: number): OccupationReservation => ({ creneau: a(heure), personnes });
const demande = (personnes: number, heure: string, autresHeures?: string[]): DemandeReservation => ({
  lieuId: 18, personnes, jour: "2026-10-17", heure, autresHeures, message: null,
});
const contexte = (reglages: ReglagesReservations | null, occupees: OccupationReservation[] = [], maintenant = VENDREDI_10H) => ({
  ouverture: OUVERTURE, reglages, occupees, maintenant,
});
const valider = (d: DemandeReservation, reglages: ReglagesReservations | null, occupees: OccupationReservation[] = []) =>
  validerDemandeReservation(d, OUVERTURE, VENDREDI_10H, { reglages, occupees });

test("acceptation automatique : le premier horaire, dans l'ordre du client, qui a la place est retenu", () => {
  assert.deepEqual(deciderNouvelleReservation(demande(4, "20:00", ["19:30", "21:00"]), contexte(AUTO, [prise("20:00", 6)])), {
    ok: true, statut: "acceptee", creneau: a("19:30"), creneauxProposes: [a("20:00"), a("19:30"), a("21:00")], automatique: true,
  });
});

test("réponse à la main : la demande attend avec tous ses horaires ; son créneau est le plus tôt, qui fixe l'heure où elle s'endort", () => {
  assert.deepEqual(deciderNouvelleReservation(demande(2, "20:00", ["19:30", "21:00"]), contexte(MAIN)), {
    ok: true, statut: "demandee", creneau: a("19:30"), creneauxProposes: [a("20:00"), a("19:30"), a("21:00")], automatique: false,
  });
  const expiree = faireEvoluerReservation({ statut: "demandee", creneau: a("19:30"), presenceLe: null }, { type: "expirer" }, t("19:00"));
  assert.equal(expiree.ok && expiree.statut, "expiree");
});

test("plein entre l'affichage et l'envoi : la validation dit creneau-complet, et l'acceptation automatique aussi (sous le verrou)", () => {
  const occupees = [prise("20:00", 8), prise("21:00", 6)];
  assert.equal(valider(demande(3, "20:00", ["21:00"]), AUTO, occupees), "creneau-complet");
  assert.deepEqual(deciderNouvelleReservation(demande(3, "20:00", ["21:00"]), contexte(AUTO, occupees)), { ok: false, erreur: "creneau-complet" });
});

test("horaires de secours : en double, plus de 3, ou hors des créneaux du lieu → creneau-invalide ; dans deux services → chacun sa capacité", () => {
  assert.equal(valider(demande(2, "20:00", ["20:00"]), AUTO), "creneau-invalide");
  assert.equal(valider(demande(2, "20:00", ["19:00", "19:15", "19:30"]), AUTO), "creneau-invalide");
  assert.equal(valider(demande(2, "20:00", ["16:00"]), AUTO), "creneau-invalide");
  assert.equal(valider(demande(4, "12:30", ["19:30"]), AUTO, [prise("12:30", 10)]), null);
  const decision = deciderNouvelleReservation(demande(4, "12:30", ["19:30"]), contexte(AUTO, [prise("12:30", 10)]));
  assert.equal(decision.ok && decision.creneau, a("19:30"));
});

test("groupe plus grand que tout créneau : la demande ne passe nulle part (l'app plafonne le choix avec calculerPersonnesMax)", () => {
  assert.equal(valider(demande(11, "20:00"), AUTO), "creneau-complet");
  assert.equal(valider(demande(12, "20:00"), null), null);
  assert.equal(valider(demande(13, "20:00"), null), "personnes-invalides");
});

test("surbooking : 300 demandes au hasard, une à une sous le verrou du lieu, ne dépassent jamais la capacité", () => {
  let graine = 42;
  const hasard = (n: number) => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine % n;
  };
  const creneaux = ["12:00", "12:30", "13:00", "13:30", "19:00", "19:15", "19:30", "20:00", "21:00"];
  const occupees: OccupationReservation[] = [];
  for (let i = 0; i < 300; i += 1) {
    const choix = [...new Set([creneaux[hasard(9)]!, creneaux[hasard(9)]!, creneaux[hasard(9)]!])].slice(0, 1 + hasard(3));
    const d = demande(1 + hasard(10), choix[0]!, choix.slice(1));
    if (valider(d, AUTO, occupees) !== null) continue;
    const decision = deciderNouvelleReservation(d, contexte(AUTO, occupees));
    if (decision.ok) occupees.push({ creneau: decision.creneau, personnes: d.personnes });
  }
  const parCreneau = new Map<string, number>();
  for (const o of occupees) parCreneau.set(o.creneau, (parCreneau.get(o.creneau) ?? 0) + o.personnes);
  for (const [creneau, pris] of parCreneau) assert.ok(pris <= (Date.parse(creneau) < t("15:00") ? 10 : 8), `${creneau} : ${pris}`);
  const midi = occupees.filter((o) => Date.parse(o.creneau) < t("15:00")).reduce((s, o) => s + o.personnes, 0);
  assert.equal(midi, 24, "les couverts du midi sont atteints, jamais dépassés");
  assert.ok([...parCreneau.values()].some((pris) => pris === 8), "au moins un créneau du soir est plein");
});

test("réponse à la main : le lieu choisit un des horaires proposés ; sans choix, le premier qui a la place ; capacité relue", () => {
  const attente = { creneau: a("19:30"), creneauxProposes: [a("20:00"), a("19:30"), a("21:00")], personnes: 4 };
  const c = { reglages: MAIN, occupees: [prise("20:00", 6)], maintenant: VENDREDI_10H };
  const ok = (creneau: string, depassement = 0) => ({ ok: true, creneau, depassement, horsReglages: false, jourFerme: false });
  assert.deepEqual(verifierAcceptationHoraire(attente, a("21:00"), c, false), ok(a("21:00")));
  assert.deepEqual(verifierAcceptationHoraire(attente, a("20:30"), c, false), { ok: false, erreur: "horaire-non-propose" });
  assert.deepEqual(verifierAcceptationHoraire(attente, null, c, false), ok(a("19:30")), "le 1er choix est plein : on prend son plan B");
  assert.deepEqual(verifierAcceptationHoraire(attente, a("20:00"), c, false), { ok: false, erreur: "capacite-depassee", creneau: a("20:00"), places: 2 });
  assert.deepEqual(verifierAcceptationHoraire(attente, a("20:00"), c, true), ok(a("20:00"), 2));
  const plein = { ...c, occupees: [prise("20:00", 8), prise("19:30", 8), prise("21:00", 8)] };
  assert.deepEqual(verifierAcceptationHoraire(attente, null, plein, false), { ok: false, erreur: "capacite-depassee", creneau: a("20:00"), places: 0 });
  assert.deepEqual(verifierAcceptationHoraire(attente, null, plein, true), ok(a("20:00"), 4));
  const tard = { ...c, maintenant: new Date(t("19:00")) };
  assert.deepEqual(verifierAcceptationHoraire(attente, a("21:00"), tard, false), { ok: false, erreur: "delai-depasse" });
});

test("jour fermé (« Plus de résa aujourd'hui ») : accepter une demande en attente demande confirmation, places comprises", () => {
  const attente = { creneau: a("19:00"), creneauxProposes: [], personnes: 8 };
  const ferme = { reglages: { ...MAIN, joursFermes: ["2026-10-17"] }, occupees: [prise("19:00", 4)], maintenant: VENDREDI_10H };
  assert.deepEqual(verifierAcceptationHoraire(attente, null, ferme, false), { ok: false, erreur: "jour-ferme", creneau: a("19:00"), places: 4 });
  assert.deepEqual(verifierAcceptationHoraire(attente, null, ferme, true), { ok: true, creneau: a("19:00"), depassement: 4, horsReglages: false, jourFerme: true });
  const fermeSansService = { ...ferme, reglages: { ...ferme.reglages, services: [] } };
  assert.deepEqual(verifierAcceptationHoraire(attente, null, fermeSansService, false), { ok: false, erreur: "jour-ferme", creneau: a("19:00"), places: null });
});

test("réponse à la main : un service supprimé depuis la demande reste acceptable (hors de tes services, sans compter le midi)", () => {
  const attente = { creneau: a("19:00"), creneauxProposes: [], personnes: 8 };
  const sansSoir = { reglages: { ...MAIN, services: [MIDI] }, occupees: [prise("12:00", 10), prise("12:30", 10), prise("13:00", 4)], maintenant: VENDREDI_10H };
  assert.deepEqual(verifierAcceptationHoraire(attente, null, sansSoir, false), { ok: true, creneau: a("19:00"), depassement: 0, horsReglages: true, jourFerme: false });
  assert.equal(verifierAcceptationHoraire(attente, null, { ...sansSoir, reglages: null }, false).ok, true);
});

test("30 min de délai à la main : la demande s'endort 10 min avant son horaire, au lieu de 30", () => {
  const court: ReglagesReservations = { ...MAIN, delai: "30-min" };
  assert.equal(calculerMargeExpirationReservation(court), 10 * MINUTE);
  assert.equal(calculerMargeExpirationReservation(MAIN), 30 * MINUTE);
  assert.equal(calculerMargeExpirationReservation({ ...AUTO, delai: "30-min" }), 30 * MINUTE);
  assert.equal(calculerMargeExpirationReservation(null), 30 * MINUTE);
  const maintenant = new Date(t("20:00") - 40 * MINUTE);
  assert.deepEqual(validerDemandeReservation(demande(2, "20:00"), OUVERTURE, maintenant, { reglages: court, occupees: [] }), null);
  const attente = { creneau: a("20:00"), creneauxProposes: [a("20:00")], personnes: 2 };
  assert.equal(verifierAcceptationHoraire(attente, null, { reglages: court, occupees: [], maintenant: new Date(t("19:45")) }, false).ok, true);
  assert.deepEqual(verifierAcceptationHoraire(attente, null, { reglages: court, occupees: [], maintenant: new Date(t("19:50")) }, false), {
    ok: false, erreur: "delai-depasse",
  });
  assert.deepEqual(verifierAcceptationHoraire(attente, null, { reglages: MAIN, occupees: [], maintenant: new Date(t("19:45")) }, false), {
    ok: false, erreur: "delai-depasse",
  });
  const etat = { statut: "demandee" as const, creneau: a("20:00"), presenceLe: null };
  const regles = { expirationAvantCreneauMs: calculerMargeExpirationReservation(court) };
  assert.equal(faireEvoluerReservation(etat, { type: "accepter" }, t("19:49"), regles).ok, true);
  assert.deepEqual(faireEvoluerReservation(etat, { type: "accepter" }, t("19:50"), regles), { ok: false, erreur: "delai-depasse" });
  assert.deepEqual(faireEvoluerReservation(etat, { type: "expirer" }, t("19:49"), regles), { ok: false, erreur: "transition-interdite" });
  assert.equal(faireEvoluerReservation(etat, { type: "expirer" }, t("19:50"), regles).ok, true);
  assert.equal(faireEvoluerReservation(etat, { type: "expirer" }, t("19:30")).ok, true, "sans règle : 30 min, comme avant");
});

test("limites du compte : seul un doublon (même lieu, mêmes horaires, en moins de 2 min) est refusé ; midi et soir le même jour, oui", () => {
  const maintenant = VENDREDI_10H.getTime();
  const il = (minutes: number) => new Date(maintenant - minutes * MINUTE).toISOString();
  const table = { lieuId: 18, statut: "acceptee" as const, creneau: a("20:00"), creneauxProposes: [a("20:00"), a("20:30")], creeLe: il(1) };
  const pareille = { lieuId: 18, creneauxProposes: [a("20:30"), a("20:00")] };
  assert.equal(verifierLimitesReservationCompte([table], pareille, maintenant), "reservation-en-double");
  assert.equal(verifierLimitesReservationCompte([{ ...table, creeLe: il(3) }], pareille, maintenant), null, "plus de 2 min après : une autre table");
  assert.equal(verifierLimitesReservationCompte([table], { lieuId: 18, creneauxProposes: [a("12:30")] }, maintenant), null, "le midi après le soir");
  assert.equal(verifierLimitesReservationCompte([table], { ...pareille, lieuId: 5 }, maintenant), null, "un autre lieu");
  assert.equal(verifierLimitesReservationCompte([{ ...table, statut: "annulee" }], pareille, maintenant), null, "annulée entre-temps");
  const ancienne = { lieuId: 18, statut: "acceptee" as const, creneau: a("20:00"), creneauxProposes: [], creeLe: il(1) };
  assert.equal(verifierLimitesReservationCompte([ancienne], { lieuId: 18, creneauxProposes: [a("20:00")] }, maintenant), "reservation-en-double");
  const enAttente = { ...table, statut: "demandee" as const, creeLe: il(30) };
  assert.equal(verifierLimitesReservationCompte([enAttente], { lieuId: 18, creneauxProposes: [a("12:00")] }, maintenant), "reservation-en-cours");
  const trois = [5, 6, 7].map((lieuId) => ({ ...table, lieuId, creeLe: il(60) }));
  assert.equal(verifierLimitesReservationCompte(trois, pareille, maintenant), "trop-de-reservations");
  const passee = { ...table, creneau: new Date(maintenant - 60 * MINUTE).toISOString() };
  assert.equal(verifierLimitesReservationCompte([passee, passee, passee], pareille, maintenant), null);
});

test("annulation tardive : moins de 2 h avant, sauf dans les 15 min qui suivent l'acceptation (droit à l'erreur)", () => {
  const creneau = t("20:00");
  assert.equal(estAnnulationTardive(creneau, creneau - 70 * MINUTE, creneau - 60 * MINUTE), false);
  assert.equal(estAnnulationTardive(creneau, creneau - 90 * MINUTE, creneau - 60 * MINUTE), true);
  assert.equal(estAnnulationTardive(creneau, creneau - 5 * 60 * MINUTE, creneau - 3 * 60 * MINUTE), false);
  assert.equal(estAnnulationTardive(creneau, null, creneau - 60 * MINUTE), true);
  const acceptee = { statut: "acceptee" as const, creneau: a("20:00"), presenceLe: null };
  const juste = faireEvoluerReservation({ ...acceptee, reponduLe: new Date(creneau - 40 * MINUTE).toISOString() }, { type: "annuler-client" }, creneau - 30 * MINUTE);
  assert.deepEqual(juste, { ok: true, statut: "annulee", presenceLe: null, tardive: false, effets: [] });
  const tardive = faireEvoluerReservation({ ...acceptee, reponduLe: new Date(creneau - 5 * 60 * MINUTE).toISOString() }, { type: "annuler-client" }, creneau - 30 * MINUTE);
  assert.equal(tardive.ok && tardive.tardive, true);
  const sansReponse = faireEvoluerReservation(acceptee, { type: "annuler-client" }, creneau - 30 * MINUTE);
  assert.equal(sansReponse.ok && sansReponse.tardive, true, "sans heure d'acceptation connue : comme avant");
});

test("le lieu ne peut plus « annuler » une table une fois l'heure passée : c'est « Venu » ou « Pas venu »", () => {
  const acceptee = { statut: "acceptee" as const, creneau: a("20:00"), presenceLe: null };
  assert.equal(faireEvoluerReservation(acceptee, { type: "annuler-lieu", motif: "ferme" }, t("19:59")).ok, true);
  assert.deepEqual(faireEvoluerReservation(acceptee, { type: "annuler-lieu", motif: "ferme" }, t("20:00")), { ok: false, erreur: "delai-depasse" });
  assert.deepEqual(faireEvoluerReservation(acceptee, { type: "annuler-lieu", motif: "autre" }, t("23:00")), { ok: false, erreur: "delai-depasse" });
});

test("à revoir après un changement de réglages : rien n'est annulé ; une demande garde ses horaires encore possibles", () => {
  const reservations = [
    { id: 1, creneau: a("20:00"), personnes: 6, statut: "acceptee" as const },
    { id: 2, creneau: a("20:00"), personnes: 2, statut: "acceptee" as const },
    { id: 3, creneau: a("12:00"), creneauxProposes: [a("19:30"), a("12:00")], personnes: 2, statut: "demandee" as const },
    { id: 4, creneau: a("19:15"), personnes: 2, statut: "demandee" as const },
  ];
  assert.deepEqual(listerReservationsARevoir(MAIN, reservations, VENDREDI_10H), []);
  const baisse = { ...MAIN, services: [MIDI, { ...SOIR, couvertsParCreneau: 6 }] };
  assert.deepEqual(listerReservationsARevoir(baisse, reservations, VENDREDI_10H).map((r) => [r.id, r.raison]), [[1, "capacite"], [2, "capacite"]]);
  const sansSoir = { ...MAIN, services: [MIDI] };
  assert.deepEqual(listerReservationsARevoir(sansSoir, reservations, VENDREDI_10H).map((r) => [r.id, r.raison]), [
    [1, "hors-service"], [2, "hors-service"], [4, "hors-service"],
  ]);
  const sansMidi = { ...MAIN, services: [SOIR] };
  assert.deepEqual(listerReservationsARevoir(sansMidi, reservations, VENDREDI_10H), [], "la demande 3 peut encore être acceptée à 19 h 30");
});
