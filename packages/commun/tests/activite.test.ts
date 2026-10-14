import { test } from "node:test";
import assert from "node:assert/strict";
import type { ActiviteApi } from "../src/types/activite.ts";
import type { GesteActiviteEnAttente } from "../src/types/geste-activite.ts";
import { ajouterGesteEnAttente } from "../src/fonctions/activite/ajouter-geste-en-attente.ts";
import { appliquerGesteActivite } from "../src/fonctions/activite/appliquer-geste-activite.ts";
import { creerActiviteApiVide } from "../src/fonctions/activite/creer-activite-api-vide.ts";
import { calculerProchainLundiParis } from "../src/fonctions/temps/calculer-prochain-lundi-paris.ts";

const iso = (ms: number) => new Date(ms).toISOString();
const prochainLundi = (instant: string) => iso(calculerProchainLundiParis(Date.parse(instant)));

/** Un mercredi d'octobre 2026 : une rescousse donnée (lieu 1), un lieu gardé, un J'aime, un suivi */
const activite: ActiviteApi = {
  ...creerActiviteApiVide(Date.parse("2026-10-14T10:00:00Z")),
  semaine: "2026-S42",
  restantes: 2,
  rescoussesSemaine: [1],
  lieuxSauves: [1, 5],
  rescoussesDonnees: 4,
  rescoussesDuMois: 2,
  premiersSauvetages: [5],
  gardes: [12],
  jaimes: ["34"],
  masques: [],
  suivis: ["lieu:7"],
};

test("prochain lundi à Paris : dimanche 25/10/2026 23:59, le soir du passage à l'heure d'hiver", () => {
  // 23 h 59 à Paris = 22 h 59 UTC (heure d'hiver depuis 3 h du matin) ; lundi 0 h = 23 h UTC
  assert.equal(prochainLundi("2026-10-25T22:59:00Z"), "2026-10-25T23:00:00.000Z");
  // Le samedi d'avant, encore à l'heure d'été : même lundi
  assert.equal(prochainLundi("2026-10-24T12:00:00Z"), "2026-10-25T23:00:00.000Z");
});

test("prochain lundi à Paris : pile lundi minuit, c'est le suivant ; en semaine, le lundi qui vient", () => {
  assert.equal(prochainLundi("2026-10-25T23:00:00Z"), "2026-11-01T23:00:00.000Z");
  assert.equal(prochainLundi("2026-10-25T23:00:01Z"), "2026-11-01T23:00:00.000Z");
  // Mercredi 14/10/2026 midi (heure d'été) : lundi 19 à 0 h = dimanche 18 à 22 h UTC
  assert.equal(prochainLundi("2026-10-14T10:00:00Z"), "2026-10-18T22:00:00.000Z");
  // Dimanche 23 h 30 à Paris en été : encore la même semaine, la recharge est dans une demi-heure
  assert.equal(prochainLundi("2026-10-11T21:30:00Z"), "2026-10-11T22:00:00.000Z");
});

test("prochain lundi à Paris : passage à l'heure d'été et changement d'année", () => {
  // Samedi 28/03/2026 23 h 30 (hiver) puis dimanche 29 midi (été) : lundi 30 à 0 h, heure d'été
  assert.equal(prochainLundi("2026-03-28T22:30:00Z"), "2026-03-29T22:00:00.000Z");
  assert.equal(prochainLundi("2026-03-29T10:00:00Z"), "2026-03-29T22:00:00.000Z");
  // Jeudi 31/12/2026 : lundi 4 janvier 2027
  assert.equal(prochainLundi("2026-12-31T12:00:00Z"), "2027-01-03T23:00:00.000Z");
});

test("activité vide : 3 rescousses, rien d'autre, recharge au prochain lundi", () => {
  const vide = creerActiviteApiVide(Date.parse("2026-10-25T22:59:00Z"));
  assert.equal(vide.restantes, 3);
  assert.equal(vide.rechargeLe, "2026-10-25T23:00:00.000Z");
  assert.deepEqual([vide.rescoussesSemaine, vide.lieuxSauves, vide.gardes, vide.jaimes, vide.masques, vide.suivis], [[], [], [], [], [], []]);
  assert.deepEqual([vide.rescoussesDonnees, vide.rescoussesDuMois, vide.premiersSauvetages.length], [0, 0, 0]);
});

test("garder, aimer, masquer, suivre : en tête de liste, retirés, et rien de neuf quand rien ne change", () => {
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "garde", lieuId: 3, oui: true }).gardes, [3, 12]);
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "garde", lieuId: 12, oui: false }).gardes, []);
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "jaime", publicationId: "35", oui: true }).jaimes, ["35", "34"]);
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "masque", publicationId: "36", oui: true }).masques, ["36"]);
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "suivi", cle: "createur:lea.mange", oui: true }).suivis, ["createur:lea.mange", "lieu:7"]);
  assert.deepEqual(appliquerGesteActivite(activite, { quoi: "suivi", cle: "lieu:7", oui: false }).suivis, []);
  // Déjà fait : le même objet (rien à redessiner, rien à envoyer)
  for (const geste of [
    { quoi: "garde", lieuId: 12, oui: true },
    { quoi: "garde", lieuId: 99, oui: false },
    { quoi: "jaime", publicationId: "34", oui: true },
    { quoi: "masque", publicationId: "36", oui: false },
    { quoi: "suivi", cle: "lieu:7", oui: true },
  ] satisfies GesteActiviteEnAttente[]) {
    assert.equal(appliquerGesteActivite(activite, geste), activite, JSON.stringify(geste));
  }
});

test("rescousse donnée : une de moins, comptée, lieu en tête des lieux sauvés ; jamais de premier sauveteur deviné", () => {
  const apres = appliquerGesteActivite(activite, { quoi: "rescousse", lieuId: 5, oui: true });
  assert.deepEqual(
    [apres.restantes, apres.rescoussesSemaine, apres.lieuxSauves, apres.rescoussesDonnees, apres.rescoussesDuMois, apres.premiersSauvetages],
    [1, [5, 1], [5, 1], 5, 3, [5]],
  );
  const nouveau = appliquerGesteActivite(activite, { quoi: "rescousse", lieuId: 8, oui: true });
  assert.deepEqual([nouveau.lieuxSauves, nouveau.premiersSauvetages], [[8, 1, 5], [5]]);
  // Déjà donnée cette semaine, ou plus de rescousse : rien ne change (comme l'API)
  assert.equal(appliquerGesteActivite(activite, { quoi: "rescousse", lieuId: 1, oui: true }), activite);
  const epuisee = { ...activite, restantes: 0 };
  assert.equal(appliquerGesteActivite(epuisee, { quoi: "rescousse", lieuId: 5, oui: true }), epuisee);
});

test("rescousse reprise : rendue, décomptée ; lieux sauvés et premier sauveteur attendent la réponse de l'API", () => {
  const apres = appliquerGesteActivite(activite, { quoi: "rescousse", lieuId: 1, oui: false });
  assert.deepEqual(
    [apres.restantes, apres.rescoussesSemaine, apres.lieuxSauves, apres.rescoussesDonnees, apres.rescoussesDuMois, apres.premiersSauvetages],
    [3, [], [1, 5], 3, 1, [5]],
  );
  // Pas donnée cette semaine : rien à reprendre
  assert.equal(appliquerGesteActivite(activite, { quoi: "rescousse", lieuId: 5, oui: false }), activite);
  // Jamais plus de 3, jamais sous 0
  const bizarre = { ...activite, restantes: 3, rescoussesDonnees: 0, rescoussesDuMois: 0 };
  const reprise = appliquerGesteActivite(bizarre, { quoi: "rescousse", lieuId: 1, oui: false });
  assert.deepEqual([reprise.restantes, reprise.rescoussesDonnees, reprise.rescoussesDuMois], [3, 0, 0]);
});

test("file d'attente : le dernier geste sur une cible remplace celui qui attendait, l'ordre des autres reste", () => {
  const garder: GesteActiviteEnAttente = { quoi: "garde", lieuId: 3, oui: true };
  const aimer: GesteActiviteEnAttente = { quoi: "jaime", publicationId: "35", oui: true };
  const suivre: GesteActiviteEnAttente = { quoi: "suivi", cle: "createur:lea.mange", oui: true };
  let file = ajouterGesteEnAttente([], garder, activite);
  file = ajouterGesteEnAttente(file, aimer, activite);
  file = ajouterGesteEnAttente(file, suivre, activite);
  assert.deepEqual(file, [garder, aimer, suivre]);
  // Le J'aime retiré avant d'être parti : revenu à ce qu'a l'API, les deux disparaissent
  const sansJaime = ajouterGesteEnAttente(file, { quoi: "jaime", publicationId: "35", oui: false }, activite);
  assert.deepEqual(sansJaime, [garder, suivre]);
  // La file reçue n'est pas modifiée
  assert.deepEqual(file, [garder, aimer, suivre]);
  // Un J'aime retiré puis remis avant de partir : l'API l'a déjà, il n'y a plus rien à envoyer pour lui
  const retire = ajouterGesteEnAttente([], { quoi: "jaime", publicationId: "34", oui: false }, activite);
  assert.deepEqual(retire, [{ quoi: "jaime", publicationId: "34", oui: false }]);
  assert.deepEqual(ajouterGesteEnAttente([...retire, garder], { quoi: "jaime", publicationId: "34", oui: true }, activite), [garder]);
});

test("file d'attente : un geste que l'API a déjà n'est pas envoyé ; même identifiant, cibles différentes", () => {
  assert.deepEqual(ajouterGesteEnAttente([], { quoi: "garde", lieuId: 12, oui: true }, activite), []);
  assert.deepEqual(ajouterGesteEnAttente([], { quoi: "rescousse", lieuId: 1, oui: true }, activite), []);
  // Garder le lieu 7 et suivre le lieu 7, aimer et masquer la publication 34 : quatre gestes distincts
  const gestes: GesteActiviteEnAttente[] = [
    { quoi: "garde", lieuId: 7, oui: true },
    { quoi: "suivi", cle: "lieu:7", oui: false },
    { quoi: "jaime", publicationId: "34", oui: false },
    { quoi: "masque", publicationId: "34", oui: true },
  ];
  assert.deepEqual(gestes.reduce<GesteActiviteEnAttente[]>((f, g) => ajouterGesteEnAttente(f, g, activite), []), gestes);
  // Une rescousse donnée puis reprise avant de partir : rien à envoyer
  const donnee = ajouterGesteEnAttente([], { quoi: "rescousse", lieuId: 5, oui: true }, activite);
  assert.deepEqual(ajouterGesteEnAttente(donnee, { quoi: "rescousse", lieuId: 5, oui: false }, activite), []);
});

test("file d'attente rejouée sur la réponse de l'API : l'état affiché ne dépend que du serveur et des gestes restants", () => {
  const file: GesteActiviteEnAttente[] = [
    { quoi: "garde", lieuId: 3, oui: true },
    { quoi: "jaime", publicationId: "34", oui: false },
  ];
  const affichee = file.reduce(appliquerGesteActivite, activite);
  assert.deepEqual([affichee.gardes, affichee.jaimes], [[3, 12], []]);
  // L'API a déjà pris le premier geste : le rejouer ne le double pas
  const serveur = { ...activite, gardes: [3, 12] };
  assert.deepEqual(file.reduce(appliquerGesteActivite, serveur).gardes, [3, 12]);
});

test("file d'attente : une rescousse donnée grâce à une reprise qui attend encore n'est jamais jetée", () => {
  // Le serveur : plus de rescousse, lieux 1, 2 et 3 sauvés cette semaine
  const serveur: ActiviteApi = { ...activite, restantes: 0, rescoussesSemaine: [1, 2, 3] };
  const reprise: GesteActiviteEnAttente = { quoi: "rescousse", lieuId: 1, oui: false };
  const don: GesteActiviteEnAttente = { quoi: "rescousse", lieuId: 4, oui: true };
  let file = ajouterGesteEnAttente([], reprise, serveur);
  assert.equal(file.reduce(appliquerGesteActivite, serveur).restantes, 1);
  file = ajouterGesteEnAttente(file, don, serveur);
  assert.deepEqual(file, [reprise, don]);
  assert.deepEqual(file.reduce(appliquerGesteActivite, serveur).rescoussesSemaine, [4, 2, 3]);
  // Sans la reprise, le don ne change rien : il ne part pas
  assert.deepEqual(ajouterGesteEnAttente([], don, serveur), []);
  // Le lieu 4 repris avant de partir : il ne reste que la reprise du lieu 1
  assert.deepEqual(ajouterGesteEnAttente(file, { quoi: "rescousse", lieuId: 4, oui: false }, serveur), [reprise]);
  // Re-donner au lieu 1 avant que la reprise parte : les deux disparaissent
  assert.deepEqual(ajouterGesteEnAttente([reprise], { quoi: "rescousse", lieuId: 1, oui: true }, serveur), []);
});

test("file d'attente refusionnée geste après geste : le même résultat que dans l'ordre d'origine", () => {
  const serveur: ActiviteApi = { ...activite, restantes: 0, rescoussesSemaine: [1, 2, 3] };
  const gestes: GesteActiviteEnAttente[] = [
    { quoi: "rescousse", lieuId: 2, oui: false },
    { quoi: "garde", lieuId: 3, oui: true },
    { quoi: "rescousse", lieuId: 5, oui: true },
  ];
  assert.deepEqual(gestes.reduce<GesteActiviteEnAttente[]>((f, g) => ajouterGesteEnAttente(f, g, serveur), []), gestes);
});
