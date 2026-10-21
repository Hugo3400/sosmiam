import { test } from "node:test";
import assert from "node:assert/strict";
import { BADGES } from "../src/contenus/badges.ts";
import { compterMesureDefi } from "../src/fonctions/defis/compter-mesure-defi.ts";
import { parleDAlcool } from "../src/fonctions/prevention/parle-d-alcool.ts";
import { BADGES_AUTOMATIQUES, type BadgeAutomatique } from "../src/regles/badges-automatiques.ts";
import { EMOJIS_ALCOOL_DEFI, FILTRES_PAR_MESURE, TYPES_LIEU_DEFI } from "../src/regles/defis.ts";
import type { FaitsDefi, VisiteDefi } from "../src/types/defi.ts";
import { contientMotInterdit } from "../src/validation/contient-mot-interdit.ts";

const TOUT = { debut: null, fin: null };
const LUNDI_MIDI = Date.parse("2026-10-12T10:00:00Z");
const SEMAINE = 7 * 24 * 3600 * 1000;
const ONZE_HEURES = 11 * 3600 * 1000;
const BADGES_DONNES_AILLEURS = ["premier-sauveteur", "deniche-par-toi", "fondateur", "iode", "bande", "chasseur-de-bugs"];

const faits = (f: Partial<FaitsDefi>): FaitsDefi => ({ rescousses: [], premiersSauvetages: [], visites: [], avis: [], ...f });
const visite = (minute: number, v: Partial<VisiteDefi> = {}): VisiteDefi => ({
  le: LUNDI_MIDI + minute * 60_000, lieuId: 1, typeLieu: "resto", ville: "Montpellier", pendantSos: false, ...v,
});
const repeter = <T>(n: number, fabriquer: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => fabriquer(i));
const listerBadgesAtteints = (f: FaitsDefi) =>
  BADGES_AUTOMATIQUES.filter((b) => compterMesureDefi(f, b.mesure, b.filtres, TOUT) >= b.objectif).map((b) => b.id);

function fabriquerFaitsPour(badge: BadgeAutomatique, n: number): FaitsDefi {
  const filtres = badge.filtres ?? {};
  const instants = repeter(n, (i) => LUNDI_MIDI + i * SEMAINE + (filtres.apresHeure === undefined ? 0 : ONZE_HEURES));
  return faits({
    rescousses: instants,
    premiersSauvetages: instants,
    visites: instants.map((le, i) => ({
      le,
      lieuId: badge.mesure === "visites" ? 1 : i,
      typeLieu: filtres.typesLieu?.[0] ?? "resto",
      ville: badge.mesure === "villes-differentes" ? `Ville ${i}` : "Montpellier",
      pendantSos: filtres.pendantSos === true,
    })),
    avis: instants.map((le) => ({ le, avecPhoto: filtres.avecPhoto === true })),
  });
}

test("catalogue : identifiants en kebab-case de 30 caractères au plus, emojis et noms jamais partagés, noms courts", () => {
  const ids = BADGES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, id);
  for (const id of ids) assert.ok(id.length <= 30, id);
  const emojis = BADGES.map((b) => b.emoji);
  assert.equal(new Set(emojis).size, emojis.length);
  const noms = BADGES.map((b) => b.nom.toLocaleLowerCase("fr"));
  assert.equal(new Set(noms).size, noms.length);
  for (const b of BADGES) assert.ok(b.nom.length <= 20, b.nom);
  assert.equal(BADGES.find((b) => b.id === "premiere-rescousse")?.emoji, "🛟");
  assert.equal(BADGES.find((b) => b.id === "serie-4")?.emoji, "🔥");
});

test("catalogue : ni alcool ni gros mot, dans l'emoji, le nom ou le texte", () => {
  for (const b of BADGES) {
    assert.ok(!EMOJIS_ALCOOL_DEFI.some((alcool) => b.emoji.includes(alcool)), b.id);
    assert.ok(!parleDAlcool(b.nom) && !parleDAlcool(b.texte), b.id);
    assert.ok(!contientMotInterdit(b.nom) && !contientMotInterdit(b.texte), b.id);
    assert.ok(b.texte.trim().length > 0, b.id);
  }
});

test("badges automatiques : tous au catalogue, une fois chacun ; les autres badges sont donnés ailleurs", () => {
  const automatiques = BADGES_AUTOMATIQUES.map((b) => b.id);
  assert.equal(new Set(automatiques).size, automatiques.length);
  for (const id of automatiques) assert.ok(BADGES.some((b) => b.id === id), id);
  for (const b of BADGES) assert.ok(automatiques.includes(b.id) || BADGES_DONNES_AILLEURS.includes(b.id), b.id);
});

test("badges automatiques : filtres permis pour leur mesure, jamais les bars, objectif entier", () => {
  for (const b of BADGES_AUTOMATIQUES) {
    const permis: readonly string[] = FILTRES_PAR_MESURE[b.mesure];
    for (const filtre of Object.keys(b.filtres ?? {})) assert.ok(permis.includes(filtre), `${b.id} : ${filtre}`);
    for (const type of b.filtres?.typesLieu ?? []) assert.ok(TYPES_LIEU_DEFI.includes(type), `${b.id} : ${type}`);
    assert.ok(Number.isInteger(b.objectif) && b.objectif >= 1, b.id);
  }
});

test("badges automatiques : chacun s'obtient pile à son objectif, pas une marche avant", () => {
  for (const b of BADGES_AUTOMATIQUES) {
    assert.ok(listerBadgesAtteints(fabriquerFaitsPour(b, b.objectif)).includes(b.id), `${b.id} à ${b.objectif}`);
    assert.ok(!listerBadgesAtteints(fabriquerFaitsPour(b, b.objectif - 1)).includes(b.id), `${b.id} à ${b.objectif - 1}`);
  }
});

test("rescousses : Première rescousse, Sauveteur en série à 10, Second du Capitaine à 25, Héros de la Brigade à 50", () => {
  const rescousses = (n: number) => faits({ rescousses: repeter(n, (i) => LUNDI_MIDI + i * 60_000) });
  assert.deepEqual(listerBadgesAtteints(rescousses(9)), ["premiere-rescousse"]);
  assert.deepEqual(listerBadgesAtteints(rescousses(10)), ["premiere-rescousse", "sauveteur-en-serie"]);
  assert.deepEqual(listerBadgesAtteints(rescousses(50)), ["premiere-rescousse", "sauveteur-en-serie", "second-du-capitaine", "heros-de-la-brigade"]);
  assert.deepEqual(listerBadgesAtteints(faits({ premiersSauvetages: repeter(5, (i) => LUNDI_MIDI + i) })), ["vigie"]);
});

test("restos : 25 visites à la même table font Fine fourchette, Fourchette d'or et Habitué, pas Tour de table", () => {
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(25, (i) => visite(i)) })), ["fine-fourchette", "fourchette-d-or", "habitue"]);
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(10, (i) => visite(i, { lieuId: i % 5 })) })), ["fine-fourchette", "tour-de-table"]);
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(10, (i) => visite(i, { typeLieu: "bar" })) })), []);
});

test("pâtisseries : Bec sucré dans la même, As du goûter dans 5 différentes, Crème de la crème à 20", () => {
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(5, (i) => visite(i, { typeLieu: "patisserie" })) })), ["bec-sucre"]);
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(5, (i) => visite(i, { typeLieu: "patisserie", lieuId: i })) })), ["bec-sucre", "as-du-gouter"]);
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(20, (i) => visite(i, { typeLieu: "patisserie" })) })), ["bec-sucre", "creme-de-la-creme"]);
});

test("SOS : Cœur sur la main pour 3 visites pendant un SOS, Bonne étoile pour 3 lieux différents", () => {
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(3, (i) => visite(i, { typeLieu: "sortie", pendantSos: true })) })), ["coeur-sur-la-main"]);
  const troisLieux = repeter(3, (i) => visite(i, { typeLieu: "sortie", pendantSos: true, lieuId: i }));
  assert.deepEqual(listerBadgesAtteints(faits({ visites: troisLieux })), ["coeur-sur-la-main", "bonne-etoile"]);
  const horsSos = repeter(3, (i) => visite(i, { typeLieu: "sortie", lieuId: i }));
  assert.deepEqual(listerBadgesAtteints(faits({ visites: [...horsSos, visite(9, { typeLieu: "sortie", pendantSos: true })] })), []);
});

test("semaines d'affilée : Saison complète à 12, une semaine vide fait repartir de zéro", () => {
  const semaine = (i: number) => visite(0, { le: LUNDI_MIDI + i * SEMAINE, typeLieu: "sortie" });
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(12, semaine) })), ["serie-4", "saison-complete"]);
  assert.deepEqual(listerBadgesAtteints(faits({ visites: [...repeter(6, semaine), ...repeter(6, (i) => semaine(i + 7))] })), ["serie-4"]);
});

test("lieux et villes : Fureteur à 10 lieux différents, Baroudeur à 10 villes", () => {
  const ailleurs = (i: number) => visite(i, { typeLieu: "sortie", lieuId: i, ville: `Ville ${i}` });
  assert.deepEqual(listerBadgesAtteints(faits({ visites: repeter(10, ailleurs) })), ["fureteur", "explorateur", "baroudeur"]);
});

test("avis : Première plume, Plume de la Brigade à 5 ; seuls les avis avec photo font Œil de chef", () => {
  const avis = (n: number, avecPhoto: boolean) => repeter(n, (i) => ({ le: LUNDI_MIDI + i, avecPhoto }));
  assert.deepEqual(listerBadgesAtteints(faits({ avis: avis(1, true) })), ["premiere-plume"]);
  assert.deepEqual(listerBadgesAtteints(faits({ avis: avis(5, false) })), ["premiere-plume", "plume-de-la-brigade"]);
  assert.deepEqual(listerBadgesAtteints(faits({ avis: avis(5, true) })), ["premiere-plume", "plume-de-la-brigade", "oeil-de-chef"]);
  assert.deepEqual(listerBadgesAtteints(faits({ avis: avis(20, true) })), ["premiere-plume", "plume-de-la-brigade", "plume-d-or", "oeil-de-chef", "objectif-gourmand"]);
});

test("bars : jamais comptés par un badge qui vise un type de lieu ; comptés, comme pour Noctambule, par ceux qui n'en visent aucun", () => {
  const bars = repeter(52, (i) => visite(0, { le: LUNDI_MIDI + i * SEMAINE + ONZE_HEURES, typeLieu: "bar", lieuId: i, ville: `Ville ${i % 12}`, pendantSos: true }));
  const atteints = listerBadgesAtteints(faits({ visites: bars }));
  const avecTypeDeLieu = BADGES_AUTOMATIQUES.filter((b) => b.filtres?.typesLieu).map((b) => b.id);
  assert.ok(atteints.every((id) => !avecTypeDeLieu.includes(id)));
  assert.deepEqual(atteints, [
    "coeur-sur-la-main", "bonne-etoile", "habitue", "mordu-de-miam", "serie-4", "saison-complete", "marathon-du-miam", "un-an-de-miam",
    "noctambule", "fureteur", "explorateur", "baroudeur",
  ]);
});
