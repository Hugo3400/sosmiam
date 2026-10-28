import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { ajusterDerniereArrivee } from "~/fonctions/reservations/ajuster-derniere-arrivee";
import { decrireServiceReservation } from "~/fonctions/reservations/decrire-service-reservation";
import { ecrireJoursSemaine } from "~/fonctions/reservations/ecrire-jours-semaine";
import { lireChampReglages } from "~/fonctions/reservations/lire-champ-reglages";
import { listerAvertissementsReglages } from "~/fonctions/reservations/lister-avertissements-reglages";
import { listerMinutesArrivee } from "~/fonctions/reservations/lister-minutes-arrivee";
import { listerMoisCalendrier } from "~/fonctions/reservations/lister-mois-calendrier";
import { resumerReglagesReservations } from "~/fonctions/reservations/resumer-reglages-reservations";
import { verifierServiceReservation } from "~/fonctions/reservations/verifier-service-reservation";

const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 15, couvertsParService: 40, couvertsParCreneau: 8 };
const MIDI = { jours: [0, 2, 3, 4, 5, 6], premier: "12:00", dernier: "13:30", pas: 30, couvertsParService: 30, couvertsParCreneau: 30 };
const iso = (jour, heure) => new Date(calculerInstantParis(jour, heure)).toISOString();

test("les jours d'un service se lisent comme on les dit", () => {
  assert.equal(ecrireJoursSemaine([0, 1, 2, 3, 4, 5, 6], "fr"), "Tous les jours");
  assert.equal(ecrireJoursSemaine([0, 2, 3, 4, 5, 6], "fr"), "Tous les jours sauf le lundi");
  assert.equal(ecrireJoursSemaine([2, 3, 4, 5, 6], "fr"), "Du mardi au samedi");
  assert.equal(ecrireJoursSemaine([5, 6, 0], "fr"), "Du vendredi au dimanche");
  assert.equal(ecrireJoursSemaine([1, 3], "fr"), "Lundi et mercredi");
  assert.equal(ecrireJoursSemaine([4], "fr"), "Le jeudi");
});

test("la carte d'un service : son nom, ses heures, ses couverts, lue d'un bloc", () => {
  const soir = decrireServiceReservation(SOIR, [MIDI, SOIR], "fr");
  assert.equal(soir.titre, "Le soir");
  assert.equal(soir.plage, "19h → 21h30");
  assert.equal(soir.rythme, "toutes les 15 min, 11 créneaux");
  assert.equal(soir.capacite, "40 couverts sur le service · 8 arrivées par créneau au plus");
  assert.equal(soir.lu, "Le soir. Tous les jours. Arrivées de 19h à 21h30, toutes les 15 min, 11 créneaux. 40 couverts sur le service, 8 arrivées par créneau au plus.");
  assert.equal(decrireServiceReservation(MIDI, [MIDI, SOIR], "fr").capacite, "30 couverts sur le service");
});

test("feuille d'un service : les couverts du service sont obligatoires, les arrivées suivent tant qu'on n'y touche pas", () => {
  const brouillon = { jours: [5, 6], premier: "19:00", dernier: "21:00", pas: 30, couverts: "", arrivees: null };
  assert.deepEqual(verifierServiceReservation(brouillon, []), { ok: false, champ: "couvertsParService" });
  const ok = verifierServiceReservation({ ...brouillon, couverts: " 40 " }, []);
  assert.deepEqual(ok, { ok: true, service: { jours: [5, 6], premier: "19:00", dernier: "21:00", pas: 30, couvertsParService: 40, couvertsParCreneau: 40 } });
  assert.deepEqual(verifierServiceReservation({ ...brouillon, couverts: "40", arrivees: "50" }, []), { ok: false, champ: "couvertsParCreneau" });
  assert.deepEqual(verifierServiceReservation({ ...brouillon, couverts: "40", jours: [] }, []), { ok: false, champ: "jours" });
  const chevauche = verifierServiceReservation({ ...brouillon, couverts: "40", premier: "21:00", dernier: "22:00" }, [SOIR]);
  assert.equal(chevauche.champ, "chevauchement");
  assert.equal(chevauche.jour, 5);
});

test("passer à un créneau toutes les 30 min recale la dernière arrivée, sans jamais dépasser minuit", () => {
  assert.equal(ajusterDerniereArrivee("19:00", "21:45", 30), "21:30");
  assert.equal(ajusterDerniereArrivee("19:15", "21:30", 30), "21:15");
  assert.equal(ajusterDerniereArrivee("19:00", "18:00", 15), "19:00");
  assert.equal(ajusterDerniereArrivee("22:00", "23:45", 30), "23:30");
  assert.deepEqual(listerMinutesArrivee(21, { premier: "19:15", pas: 30 }), [15, 45]);
  assert.deepEqual(listerMinutesArrivee(23, { premier: "19:00", pas: 30 }), [0, 30]);
  assert.deepEqual(listerMinutesArrivee(23, { premier: "19:00", pas: 15 }), [0, 15, 30, 45]);
  assert.deepEqual(listerMinutesArrivee(12, null), [0, 15, 30, 45]);
});

test("le champ refusé par le serveur se range sous le bon service", () => {
  assert.deepEqual(lireChampReglages("services.1.premier"), { service: 1, champ: "premier" });
  assert.deepEqual(lireChampReglages("acceptation"), { service: null, champ: "acceptation" });
});

test("la ligne de Mon lieu résume les réglages", () => {
  const lus = (reglages, reservable = true) => ({ reglages, regle: true, aRevoir: [], reservable, ouverture: [] });
  assert.equal(resumerReglagesReservations(null, "fr"), "Tes services, tes couverts, ton délai et tes jours sans résa");
  assert.equal(resumerReglagesReservations(lus({ services: [], acceptation: "manuelle", delai: "1-h", joursFermes: [] }), "fr"), "Mode tranquille : tes horaires, un créneau toutes les 30 min · délai 1\u00a0h");
  assert.equal(
    resumerReglagesReservations(lus({ services: [MIDI, SOIR], acceptation: "automatique", delai: "veille", joursFermes: ["2026-10-30"] }), "fr"),
    "2 services · acceptation auto · délai la veille · 1 jour sans résa",
  );
  assert.equal(resumerReglagesReservations(lus({ services: [], acceptation: "manuelle", delai: "1-h", joursFermes: [] }, false), "fr"), "Coupées sur ta fiche pour l'instant : prépare tout ici");
});

test("le calendrier des jours sans résa : lundi d'abord, rien avant aujourd'hui, trois mois", () => {
  const mois = listerMoisCalendrier("2026-10-21", 92, "fr");
  assert.deepEqual(mois.map((m) => m.titre), ["Octobre 2026", "Novembre 2026", "Décembre 2026", "Janvier 2027"]);
  assert.deepEqual(mois[0].semaines[0], [null, null, "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]);
  assert.deepEqual(mois[1].semaines[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(mois.at(-1).semaines.flat().filter(Boolean).at(-1), "2027-01-20");
});

test("avant d'enregistrer : seulement ce que le changement abîme, et les demandes à finir en passant à l'auto", () => {
  const resa = (id, statut, creneau, plus = {}) => ({
    id, prenom: "Léa", initialeNom: "M", avatar: "🦩", personnes: 4, creneau, propositions: [{ creneau, places: null, horsReglages: false, jourFerme: false }],
    automatique: false, limiteReponse: statut === "demandee" ? iso("2026-10-23", "19:30") : null, message: null, statut, presence: false, code: null, creeLe: iso("2026-10-21", "10:00"), ...plus,
  });
  const reservations = [resa(1, "acceptee", iso("2026-10-23", "22:00")), resa(2, "demandee", iso("2026-10-23", "20:00")), resa(3, "acceptee", iso("2026-10-24", "20:00"))];
  const avant = { services: [{ ...SOIR, dernier: "22:00" }], acceptation: "manuelle", delai: "1-h" };
  const apres = { services: [SOIR], acceptation: "automatique", delai: "1-h" };
  const maintenantMs = calculerInstantParis("2026-10-21", "12:00");
  const avertissements = listerAvertissementsReglages({ avant, apres, joursFermes: ["2026-10-24"] }, reservations, maintenantMs, "fr");
  assert.deepEqual(avertissements.map((a) => a.cle), ["1-hors-service", "demandes-en-attente"]);
  assert.equal(avertissements[0].texte, "Vendredi 23 octobre à 22h : la table de Léa M. (4 personnes) tombe en dehors de tes services.");
  assert.equal(avertissements[1].texte, "Une demande t'attend encore : réponds-y à la main, les nouvelles s'accepteront toutes seules.");
  assert.deepEqual(listerAvertissementsReglages({ avant, apres: avant, joursFermes: ["2026-10-24"] }, reservations, maintenantMs, "fr"), []);
});
