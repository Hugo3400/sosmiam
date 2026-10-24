import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { CALENDRIER_PAR_LANGUE } from "../src/contenus/calendrier.ts";
import { accorder } from "../src/fonctions/langue/accorder.ts";
import { choisirLangueAppareil } from "../src/fonctions/langue/choisir-langue-appareil.ts";
import { choisirLangueNavigateur } from "../src/fonctions/langue/choisir-langue-navigateur.ts";
import { choisirTextes } from "../src/fonctions/langue/choisir-textes.ts";
import { citer } from "../src/fonctions/langue/citer.ts";
import { ecrireDateLangue } from "../src/fonctions/langue/ecrire-date-langue.ts";
import { ecrireMoisLangue } from "../src/fonctions/langue/ecrire-mois-langue.ts";
import { formaterHeureLangue } from "../src/fonctions/langue/formater-heure-langue.ts";
import { formaterPrixLangue } from "../src/fonctions/langue/formater-prix-langue.ts";
import { lireLangue } from "../src/fonctions/langue/lire-langue.ts";
import { nommerJourLangue } from "../src/fonctions/langue/nommer-jour-langue.ts";
import { LANGUES_OUVERTES_APP, LANGUES_OUVERTES_SITE, type Langue } from "../src/regles/langues.ts";
import type { ParLangue, Traduction } from "../src/types/traduction.ts";

const TOUTES: readonly Langue[] = ["fr", "en"];

test("langues : seul le français est ouvert tant que l'anglais n'est pas relu", () => {
  assert.deepEqual(LANGUES_OUVERTES_APP, ["fr"]);
  assert.deepEqual(LANGUES_OUVERTES_SITE, ["fr"]);
});

test("lireLangue : codes, régions, casse et tiret bas acceptés ; le reste refusé", () => {
  for (const [brut, attendu] of [
    ["fr", "fr"], ["en", "en"], ["en-GB", "en"], ["en-US", "en"], ["fr-FR", "fr"], ["fr-CA", "fr"], ["EN", "en"], ["en_GB", "en"],
    ["en-Latn-GB", "en"], [" en-GB ", "en"], ["es", null], ["de-DE", null], ["eng", null], ["english", null], ["", null], ["e", null],
    ["en-", null], ["en--GB", null], ["fr;q=1", null], ["*", null], [`en-${"a".repeat(40)}`, null],
  ] as const) assert.equal(lireLangue(brut), attendu, String(brut));
  for (const brut of [undefined, null, 1, {}, ["en"]]) assert.equal(lireLangue(brut), null);
});

test("choisirLangueAppareil : la 1re langue ouverte de la liste du téléphone, sinon le français", () => {
  assert.equal(choisirLangueAppareil(["es-ES", "en-GB", "fr-FR"], TOUTES), "en");
  assert.equal(choisirLangueAppareil(["es-ES", "fr-FR", "en-GB"], TOUTES), "fr");
  assert.equal(choisirLangueAppareil(["de-DE", "it-IT"], TOUTES), "fr");
  assert.equal(choisirLangueAppareil([], TOUTES), "fr");
  assert.equal(choisirLangueAppareil(["en-US"], TOUTES), "en");
  assert.equal(choisirLangueAppareil(["en-US"], LANGUES_OUVERTES_APP), "fr");
  assert.equal(choisirLangueAppareil(["en-US", "fr-FR"], LANGUES_OUVERTES_APP), "fr");
});

test("choisirLangueNavigateur : q, ordre, joker, q=0 et en-tête mal formé", () => {
  const cas: [string | null | undefined, Langue][] = [
    ["en-GB,en;q=0.9,fr;q=0.8", "en"],
    ["fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7", "fr"],
    ["de-DE,de;q=0.9,en;q=0.8,fr;q=0.7", "en"],
    ["fr;q=0.5,en;q=0.9", "en"],
    ["en;q=0.8,fr;q=0.8", "en"],
    ["fr;q=0.8,en;q=0.8", "fr"],
    ["en;q=0,fr;q=0.1", "fr"],
    ["en;q=0.000", "fr"],
    ["*", "fr"],
    ["*;q=1,en;q=0.5", "en"],
    ["en-US", "en"],
    ["en_GB", "en"],
    ["EN-gb", "en"],
    ["es,it", "fr"],
    ["en ; q = 0.7 , de", "en"],
    ["en,", "en"],
    [",,en", "en"],
    ["en;q=2", "fr"],
    ["en;q=abc", "fr"],
    ["en;level=1", "fr"],
    ["en,fr;q=", "fr"],
    ["en,@@", "fr"],
    ["", "fr"],
    [null, "fr"],
    [undefined, "fr"],
    [`${"de,".repeat(400)}en`, "fr"],
  ];
  for (const [entete, attendu] of cas) assert.equal(choisirLangueNavigateur(entete, TOUTES), attendu, String(entete));
  assert.equal(choisirLangueNavigateur("en-GB,en;q=0.9", LANGUES_OUVERTES_SITE), "fr");
});

test("choisirTextes : la langue demandée, le français pour une langue inconnue", () => {
  const paire: ParLangue<{ bonjour: string }> = { fr: { bonjour: "Salut" }, en: { bonjour: "Hi" } };
  assert.equal(choisirTextes(paire, "fr").bonjour, "Salut");
  assert.equal(choisirTextes(paire, "en").bonjour, "Hi");
  assert.equal(choisirTextes(paire, "es" as Langue).bonjour, "Salut");
});

test("Traduction : même forme que le français, fonctions gardées, une clé de trop ou de moins refusée", () => {
  const TEXTES = { titre: "Ta carte", points: (n: number) => `${n} points`, etapes: ["Un", "Deux"], sous: { ok: "Compris" } } as const;
  const anglais: Traduction<typeof TEXTES> = { titre: "Your card", points: (n) => `${n} points`, etapes: ["One", "Two"], sous: { ok: "Got it" } };
  // @ts-expect-error
  const deTrop: Traduction<typeof TEXTES> = { ...anglais, sous: { ok: "Got it", encore: "?" } };
  // @ts-expect-error
  const oubli: Traduction<typeof TEXTES> = { titre: "Your card", points: (n) => `${n}`, etapes: ["One", "Two"] };
  // @ts-expect-error
  const troisEtapes: Traduction<typeof TEXTES> = { ...anglais, etapes: ["One", "Two", "Three"] };
  // @ts-expect-error
  const mauvaiseFonction: Traduction<typeof TEXTES> = { ...anglais, points: (n: string) => n };
  assert.equal(anglais.points(3), "3 points");
  assert.ok(deTrop && oubli && troisEtapes && mauvaiseFonction);
});

test("accorder : 0 et 1 au singulier en français, seulement 1 en anglais", () => {
  assert.deepEqual([0, 1, 1.5, 2, -1].map((n) => accorder(n, "fr", "point", "points")), ["point", "point", "point", "points", "point"]);
  assert.deepEqual([0, 1, 1.5, 2, -1].map((n) => accorder(n, "en", "point", "points")), ["points", "point", "points", "points", "point"]);
});

test("citer : guillemets français avec espaces, guillemets anglais collés", () => {
  assert.equal(citer("Miam", "fr"), "« Miam »");
  assert.equal(citer("Miam", "en"), "“Miam”");
});

test("formaterHeureLangue : « 21h30 », « 21 h 30 » (insécables) et « 21:30 » en 24 h", () => {
  assert.deepEqual([[21, 30], [20, 0], [9, 5], [0, 0]].map(([h, m]) => formaterHeureLangue(h, m, "fr")), ["21h30", "20h", "9h05", "0h"]);
  assert.deepEqual([[21, 30], [12, 0], [9, 5]].map(([h, m]) => formaterHeureLangue(h, m, "fr", { espacee: true })), ["21 h 30", "12 h", "9 h 05"]);
  assert.deepEqual([[21, 30], [20, 0], [9, 5], [0, 0]].map(([h, m]) => formaterHeureLangue(h, m, "en")), ["21:30", "20:00", "09:05", "00:00"]);
  assert.equal(formaterHeureLangue(12, 30, "en", { espacee: true }), "12:30");
});

test("formaterPrixLangue : espaces exacts du français, euro devant en anglais", () => {
  const cas: [number, string, string][] = [
    [0, "0 €", "€0"],
    [4.5, "4,50 €", "€4.50"],
    [10.99, "10,99 €", "€10.99"],
    [12, "12 €", "€12"],
    [999.99, "999,99 €", "€999.99"],
    [1250, "1 250 €", "€1,250"],
    [1250.5, "1 250,50 €", "€1,250.50"],
    [12345678, "12 345 678 €", "€12,345,678"],
    [4.001, "4 €", "€4"],
    [0.07, "0,07 €", "€0.07"],
    [-3, "-3 €", "-€3"],
    [-0.5, "-0,50 €", "-€0.50"],
    [-0.001, "0 €", "€0"],
  ];
  for (const [prix, fr, en] of cas) {
    assert.equal(formaterPrixLangue(prix, "fr"), fr, String(prix));
    assert.equal(formaterPrixLangue(prix, "en"), en, String(prix));
  }
});

test("ecrireDateLangue, ecrireMoisLangue, nommerJourLangue", () => {
  assert.equal(ecrireDateLangue({ annee: 2004, mois: 3, jour: 12 }, "fr"), "12 mars 2004");
  assert.equal(ecrireDateLangue({ annee: 2004, mois: 3, jour: 1 }, "fr"), "1er mars 2004");
  assert.equal(ecrireDateLangue({ annee: 2025, mois: 1, jour: 1 }, "fr", { court: true }), "1er janv. 2025");
  assert.equal(ecrireDateLangue({ annee: 2026, mois: 10, jour: 17 }, "fr", { sansAnnee: true }), "17 octobre");
  assert.equal(ecrireDateLangue({ annee: 2004, mois: 3, jour: 1 }, "en"), "1 March 2004");
  assert.equal(ecrireDateLangue({ annee: 2026, mois: 9, jour: 21 }, "en", { court: true, sansAnnee: true }), "21 Sep");
  assert.equal(ecrireMoisLangue({ annee: 2026, mois: 10 }, "fr"), "octobre 2026");
  assert.equal(ecrireMoisLangue({ annee: 2026, mois: 10 }, "en"), "October 2026");
  assert.equal(nommerJourLangue(1, "fr"), "lundi");
  assert.equal(nommerJourLangue(0, "fr", true), "dim.");
  assert.equal(nommerJourLangue(6, "en"), "Saturday");
  assert.equal(nommerJourLangue(3, "en", true), "Wed");
  assert.equal(nommerJourLangue(7, "en"), "");
});

test("calendrier : 12 mois et 7 jours dans chaque langue", () => {
  for (const langue of TOUTES) {
    const c = CALENDRIER_PAR_LANGUE[langue];
    assert.deepEqual([c.mois.length, c.moisCourts.length, c.jours.length, c.joursCourts.length], [12, 12, 7, 7], langue);
  }
});

test("client HTTP : X-Langue posé par le client, jamais par un appelant", async () => {
  const appels: Record<string, string>[] = [];
  const faux = (async (_url: string, init: RequestInit) => {
    appels.push(init.headers as Record<string, string>);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  let langue: Langue | null = "en";
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, lireLangue: () => langue, fetch: faux });
  await client.demander("GET", "/a", { entetes: { "x-langue": "fr", "X-Langue": "fr" } });
  langue = null;
  await client.demander("GET", "/b", { entetes: { "X-LANGUE": "en" } });
  const sansLangue = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, fetch: faux });
  await sansLangue.demander("GET", "/c");
  assert.equal(appels[0]["X-Langue"], "en");
  assert.equal(appels[0]["x-langue"], undefined);
  assert.equal(Object.keys(appels[1]).some((nom) => nom.toLowerCase() === "x-langue"), false);
  assert.equal(Object.keys(appels[2]).some((nom) => nom.toLowerCase() === "x-langue"), false);
});
