import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import type { ClientHttp, MethodeHttp, OptionsDemande } from "../src/client-api/client-http.ts";
import { creerReglagesReservationsApi } from "../src/client-api/api/api-reglages-reservations.ts";
import { creerReservationsApi } from "../src/client-api/api/api-reservations.ts";
import { creerServicesApi } from "../src/client-api/api/creer-services-api.ts";
import { MESSAGES_SERVICE } from "../src/contenus/messages-services.ts";
import type { ReglagesReservations, ServiceReservation } from "../src/types/reglages-reservations.ts";
import { calculerCreneauxDemande } from "../src/fonctions/reservations/calculer-creneaux-demande.ts";
import { calculerLimiteReponseReservation } from "../src/fonctions/reservations/calculer-limite-reponse-reservation.ts";
import { calculerPropositionsReservation } from "../src/fonctions/reservations/calculer-propositions-reservation.ts";
import { changerJoursFermes } from "../src/fonctions/reservations/changer-jours-fermes.ts";
import { choisirHoraireParDefaut } from "../src/fonctions/reservations/choisir-horaire-par-defaut.ts";
import { lireCreneauxProposes } from "../src/fonctions/reservations/lire-creneaux-proposes.ts";
import { nettoyerJoursFermes } from "../src/fonctions/reservations/nettoyer-jours-fermes.ts";
import { calculerInstantParis } from "../src/fonctions/temps/calculer-instant-paris.ts";
import { decalerJour } from "../src/fonctions/temps/decaler-jour.ts";
import { ERREURS_RESERVATION_A_RELIRE, JOURS_FERMES_MAX } from "../src/regles/reglages-reservations.ts";
import { validerJourFermeReservation } from "../src/validation/valider-jour-ferme-reservation.ts";
import { validerReglagesReservations } from "../src/validation/valider-reglages-reservations.ts";

const SOIR: ServiceReservation = { jours: [2, 3, 4, 5, 6], premier: "19:00", dernier: "21:00", pas: 15, couvertsParService: 40, couvertsParCreneau: 8 };
const REGLAGES: ReglagesReservations = { services: [SOIR], acceptation: "manuelle", delai: "1-h", joursFermes: ["2026-10-17"] };
const MAINTENANT = new Date(calculerInstantParis("2026-10-16", "18:00"));
const a = (heure: string, jour = "2026-10-17") => new Date(calculerInstantParis(jour, heure)).toISOString();

type Appel = { methode: MethodeHttp; chemin: string; corps: unknown };

function fauxClient(): { client: ClientHttp; appels: Appel[] } {
  const appels: Appel[] = [];
  const client = {
    demander: async (methode: MethodeHttp, chemin: string, options: OptionsDemande = {}) => {
      appels.push({ methode, chemin, corps: options.corps });
      return { ok: true };
    },
  } as unknown as ClientHttp;
  return { client, appels };
}

test("jour fermé : une date de Paris, d'aujourd'hui à dans 365 jours", () => {
  assert.equal(validerJourFermeReservation("2026-10-16", MAINTENANT), "2026-10-16", "aujourd'hui : « Plus de résa aujourd'hui »");
  assert.equal(validerJourFermeReservation(decalerJour("2026-10-16", 365), MAINTENANT), "2027-10-16");
  for (const jour of ["2026-10-15", decalerJour("2026-10-16", 366), "2026-02-30", "16/10/2026", 20261016, null]) {
    assert.equal(validerJourFermeReservation(jour, MAINTENANT), null, String(jour));
  }
});

test("jours fermés : fermer, rouvrir, oublier les dates passées, 120 au plus", () => {
  assert.deepEqual(changerJoursFermes(["2026-10-20"], "2026-10-17", true, MAINTENANT), { ok: true, joursFermes: ["2026-10-17", "2026-10-20"] });
  assert.deepEqual(changerJoursFermes(["2026-10-17"], "2026-10-17", true, MAINTENANT), { ok: true, joursFermes: ["2026-10-17"] }, "déjà fermé");
  assert.deepEqual(changerJoursFermes(["2026-10-01", "2026-10-17"], "2026-10-17", false, MAINTENANT), { ok: true, joursFermes: [] });
  assert.deepEqual(changerJoursFermes(["2026-10-17"], "2026-10-01", false, MAINTENANT), { ok: true, joursFermes: ["2026-10-17"] }, "rouvrir un jour passé : rien");
  assert.deepEqual(changerJoursFermes([], "2026-10-15", true, MAINTENANT), { ok: false, champ: "jour" });
  assert.deepEqual(changerJoursFermes([], "demain", false, MAINTENANT), { ok: false, champ: "jour" });
  const pleins = Array.from({ length: JOURS_FERMES_MAX }, (_, i) => decalerJour("2026-10-20", i));
  assert.deepEqual(changerJoursFermes(pleins, "2026-10-17", true, MAINTENANT), { ok: false, champ: "joursFermes" });
  assert.deepEqual(nettoyerJoursFermes(["2026-10-20", "x", 3, "2026-10-01", "2026-10-17", "2026-10-20"], MAINTENANT), ["2026-10-17", "2026-10-20"]);
  assert.deepEqual(nettoyerJoursFermes(null, MAINTENANT), []);
});

test("le gérant qui enregistre un vieux brouillon ne rouvre jamais un jour fermé : les jours fermés ne passent pas par le PUT", async () => {
  const lu = validerReglagesReservations({ ...REGLAGES, joursFermes: [] });
  assert.deepEqual(lu, { ok: true, reglages: { services: [SOIR], acceptation: "manuelle", delai: "1-h" } });
  assert.ok(lu.ok && !("joursFermes" in lu.reglages));
  const { client, appels } = fauxClient();
  const api = creerReglagesReservationsApi(client);
  await api.lireReglages(18);
  await api.reglerReservations(18, { ...REGLAGES, joursFermes: [] } as ReglagesReservations);
  await api.fermerJour(18, "2026-10-17", true);
  await api.fermerJour(18, "2026-10-17", false);
  assert.deepEqual(appels, [
    { methode: "GET", chemin: "/pro/comptoir/lieux/18/reservations/reglages", corps: undefined },
    { methode: "PUT", chemin: "/pro/comptoir/lieux/18/reservations/reglages", corps: { services: [SOIR], acceptation: "manuelle", delai: "1-h" } },
    { methode: "PUT", chemin: "/pro/comptoir/lieux/18/reservations/jours-fermes/2026-10-17", corps: undefined },
    { methode: "DELETE", chemin: "/pro/comptoir/lieux/18/reservations/jours-fermes/2026-10-17", corps: undefined },
  ]);
});

test("client des réservations : jours, créneaux pour N personnes, réponse avec horaire et « quand même », annulation par le lieu", async () => {
  const { client, appels } = fauxClient();
  const reservations = creerReservationsApi(client);
  await reservations.listerJours(18, 4);
  await reservations.listerCreneaux(18, "2026-10-17", 4);
  await reservations.listerCreneaux(18, "2026-10-17");
  await reservations.reserver({ lieuId: 18, personnes: 4, jour: "2026-10-17", heure: "20:00", autresHeures: ["20:30"], message: null });
  const services = creerServicesApi(client, { lireStatutAmbassadeur: () => null });
  await services.comptoir.repondreReservation(7, { accepter: true });
  await services.comptoir.repondreReservation(7, { accepter: true, creneau: a("20:30"), depasser: true });
  await services.comptoir.repondreReservation(7, { accepter: false, motif: "complet" });
  await services.comptoir.annulerReservation(7, "ferme");
  await services.reglagesReservations.lireReglages(18);
  assert.deepEqual(appels.map((x) => [x.methode, x.chemin, x.corps]), [
    ["GET", "/app/reservations/jours?lieuId=18&personnes=4", undefined],
    ["GET", "/app/reservations/creneaux?lieuId=18&jour=2026-10-17&personnes=4", undefined],
    ["GET", "/app/reservations/creneaux?lieuId=18&jour=2026-10-17", undefined],
    ["POST", "/app/reservations", { lieuId: 18, personnes: 4, jour: "2026-10-17", heure: "20:00", autresHeures: ["20:30"], message: null }],
    ["POST", "/pro/comptoir/reservations/7/accepter", { creneau: null, depasser: false }],
    ["POST", "/pro/comptoir/reservations/7/accepter", { creneau: a("20:30"), depasser: true }],
    ["POST", "/pro/comptoir/reservations/7/refuser", { motif: "complet" }],
    ["POST", "/pro/comptoir/reservations/7/annuler", { motif: "ferme" }],
    ["GET", "/pro/comptoir/lieux/18/reservations/reglages", undefined],
  ]);
});

test("erreurs des réservations : connues de l'app, avec les places restantes, et les deux qui font relire les horaires", async () => {
  for (const erreur of ["creneau-complet", "reservation-en-double", "horaire-non-propose", "capacite-depassee", "jour-ferme", "reglages-invalides"]) {
    assert.ok(erreur in MESSAGES_SERVICE, erreur);
  }
  const reponses = [
    { ok: false, erreur: "capacite-depassee", details: { places: 2, autre: "x" } },
    { ok: false, erreur: "jour-ferme", details: { places: 0 } },
    { ok: false, erreur: "reglages-invalides", champ: "services.1.couvertsParService" },
  ];
  let i = 0;
  const faux = (async () => new Response(JSON.stringify(reponses[i++]), { status: 409, headers: { "Content-Type": "application/json" } })) as unknown as typeof fetch;
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton", fetch: faux });
  assert.deepEqual(await client.demander("POST", "/x"), { ok: false, erreur: "capacite-depassee", details: { places: 2 } });
  assert.deepEqual(await client.demander("POST", "/x"), { ok: false, erreur: "jour-ferme", details: { places: 0 } });
  assert.deepEqual(await client.demander("PUT", "/x"), { ok: false, erreur: "reglages-invalides", champ: "services.1.couvertsParService" });
  assert.deepEqual([...ERREURS_RESERVATION_A_RELIRE], ["creneau-complet", "creneau-invalide"]);
});

test("ce que voit le comptoir : un horaire par proposition, dans l'ordre du client, places et choix d'office", () => {
  const demande = { statut: "demandee" as const, creneau: a("19:30"), creneauxProposes: [a("20:00"), a("19:30")] };
  const ouvert = { ...REGLAGES, joursFermes: [] };
  const occupees = [{ creneau: a("20:00"), personnes: 6 }];
  const propositions = calculerPropositionsReservation(demande, ouvert, occupees);
  assert.deepEqual(propositions, [
    { creneau: a("20:00"), places: 2, horsReglages: false, jourFerme: false },
    { creneau: a("19:30"), places: 8, horsReglages: false, jourFerme: false },
  ]);
  assert.equal(choisirHoraireParDefaut(propositions, 4), a("19:30"));
  assert.equal(choisirHoraireParDefaut(propositions, 2), a("20:00"));
  assert.equal(choisirHoraireParDefaut(propositions, 9), null);
  assert.deepEqual(calculerPropositionsReservation(demande, REGLAGES, occupees).map((p) => p.jourFerme), [true, true]);
  assert.deepEqual(calculerPropositionsReservation({ ...demande, creneauxProposes: [] }, null, []), [{ creneau: a("19:30"), places: null, horsReglages: false, jourFerme: false }]);
  assert.deepEqual(calculerPropositionsReservation({ ...demande, statut: "acceptee" }, ouvert, occupees), [{ creneau: a("19:30"), places: null, horsReglages: false, jourFerme: false }]);
  assert.equal(calculerLimiteReponseReservation(demande, ouvert), a("19:00"));
  assert.equal(calculerLimiteReponseReservation(demande, { ...ouvert, delai: "30-min" }), a("19:20"));
  assert.equal(calculerLimiteReponseReservation({ ...demande, statut: "acceptee" }, ouvert), null);
  assert.deepEqual(lireCreneauxProposes({ creneau: a("19:30"), creneauxProposes: [] }), [a("19:30")]);
  assert.deepEqual(calculerCreneauxDemande({ jour: "2026-10-17", heure: "20:00", autresHeures: ["19:30"] }), [a("20:00"), a("19:30")]);
});
