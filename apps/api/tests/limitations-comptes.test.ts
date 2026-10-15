// Tests du service des limitations de compte (décision de Hugo du 15 octobre 2026) : estLimite (en cours, finie, levée, à
// venir), les vérifications de limiterCompte, lever, réexaminer, contester, et le ménage à 1 an. En mémoire, puis la
// version Prisma avec une fausse base (table absente : rien ne plante ; table présente : les bons gestes). Aucune vraie base.
import assert from "node:assert/strict";
import { test } from "node:test";

import { creerLimitationsEnMemoire } from "../src/services/limitations-comptes-en-memoire.ts";
import type { LimitationLue } from "../src/services/limitations-comptes-regles.ts";

// La version Prisma se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (fausse base)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerLimitationsComptes } = await import("../src/services/limitations-comptes.ts");

const JOUR = 86_400_000;
const MAINTENANT = new Date("2026-10-15T10:00:00Z");
const dans = (jours: number) => new Date(MAINTENANT.getTime() + jours * JOUR);
const POURQUOI = "Des messages insultants envoyés à plusieurs personnes.";

test("estLimite : en cours (jusqu'à une date, ou jusqu'à nouvel ordre), mais pas finie, levée ni à venir", async () => {
  const { services } = creerLimitationsEnMemoire(() => MAINTENANT.getTime());
  assert.equal(await services.estLimite(1), null);
  const enCours = await services.limiterCompte({ compteId: 1, motif: "haine", motivation: POURQUOI, fin: dans(7) });
  assert.ok(enCours.ok);
  assert.deepEqual(await services.estLimite(1), { jusqua: dans(7), motif: "haine" });
  // Finie : plus limité, au moment même de la fin
  assert.equal(await services.estLimite(1, dans(7)), null);
  // Jusqu'à nouvel ordre
  assert.ok((await services.limiterCompte({ compteId: 2, motif: "arnaque", motivation: POURQUOI })).ok);
  assert.deepEqual(await services.estLimite(2, dans(400)), { jusqua: null, motif: "arnaque" });
  // À venir : pas encore limité, mais elle est en vigueur (lireLimitationDuCompte la rend)
  assert.ok((await services.limiterCompte({ compteId: 3, motif: "triche", motivation: POURQUOI, debut: dans(2), fin: dans(5) })).ok);
  assert.equal(await services.estLimite(3), null);
  assert.equal((await services.lireLimitationDuCompte(3))?.motif, "triche");
  assert.deepEqual(await services.estLimite(3, dans(3)), { jusqua: dans(5), motif: "triche" });
  // Levée : plus limité tout de suite
  if (!enCours.ok) return;
  const levee = await services.leverLimitation(enCours.limitation.id, dans(1));
  assert.ok(levee.ok && levee.limitation.leveeLe?.getTime() === dans(1).getTime() && levee.limitation.compteId === 1);
  assert.equal(await services.estLimite(1, dans(2)), null);
  assert.deepEqual(await services.leverLimitation(enCours.limitation.id, dans(2)), { ok: false, erreur: "deja-terminee" });
  assert.deepEqual(await services.leverLimitation(999, dans(2)), { ok: false, erreur: "introuvable" });
});

test("limiterCompte vérifie le motif (MOTIFS_MODERATION), la motivation (10 à 1 000) et une fin après le début", async () => {
  const { services } = creerLimitationsEnMemoire(() => MAINTENANT.getTime(), (id) => id !== 404);
  const cas: [Record<string, unknown>, string][] = [
    [{ motif: "pas-un-motif" }, "motif"], [{ motif: "" }, "motif"],
    [{ motivation: "  court   " }, "motivation"], [{ motivation: "x".repeat(1001) }, "motivation"],
    [{ fin: MAINTENANT }, "fin"], [{ fin: dans(-1) }, "fin"], [{ fin: new Date("pas une date") }, "fin"],
    [{ debut: new Date(Number.NaN) }, "debut"], [{ debut: dans(3), fin: dans(2) }, "fin"],
  ];
  for (const [retouche, champ] of cas) {
    const r = await services.limiterCompte({ compteId: 1, motif: "haine", motivation: POURQUOI, ...retouche } as never);
    assert.deepEqual(r, { ok: false, erreur: "champ-invalide", champ }, champ);
  }
  assert.deepEqual(await services.limiterCompte({ compteId: 404, motif: "haine", motivation: POURQUOI }), { ok: false, erreur: "compte-inconnu" });
  const r = await services.limiterCompte({ compteId: 1, motif: "haine", motivation: `  ${"x".repeat(1000)}  ` });
  assert.ok(r.ok && r.limitation.motivation.length === 1000 && r.limitation.debut.getTime() === MAINTENANT.getTime() && r.limitation.fin === null);
  // Une seule en vigueur à la fois : la lever d'abord
  assert.deepEqual(await services.limiterCompte({ compteId: 1, motif: "arnaque", motivation: POURQUOI }), { ok: false, erreur: "deja-limite" });
});

test("contester : une fois, pendant la limitation ; réexaminer : une fois, et lever en même temps si on donne raison", async () => {
  const { services } = creerLimitationsEnMemoire(() => MAINTENANT.getTime());
  assert.deepEqual(await services.contesterLimitation(1, "Ce n'était pas moi."), { ok: false, erreur: "aucune-limitation" });
  const r = await services.limiterCompte({ compteId: 1, motif: "haine", motivation: POURQUOI, debut: dans(1), fin: dans(10) });
  assert.ok(r.ok);
  if (!r.ok) return;
  // À venir : pas encore contestable
  assert.deepEqual(await services.contesterLimitation(1, "Ce n'était pas moi."), { ok: false, erreur: "aucune-limitation" });
  assert.deepEqual(await services.reexaminerLimitation(r.limitation.id, dans(2)), { ok: false, erreur: "sans-contestation" });
  const contestee = await services.contesterLimitation(1, "Ce n'était pas moi.", dans(2));
  assert.ok(contestee.ok && contestee.limitation.contesteLe?.getTime() === dans(2).getTime());
  assert.deepEqual(await services.contesterLimitation(1, "Encore une fois !", dans(3)), { ok: false, erreur: "deja-conteste" });
  assert.deepEqual((await services.listerContestationsAReexaminer()).map((l) => l.id), [r.limitation.id]);
  const reexaminee = await services.reexaminerLimitation(r.limitation.id, dans(4), { lever: true });
  assert.ok(reexaminee.ok && reexaminee.limitation.reexamineLe?.getTime() === dans(4).getTime() && reexaminee.limitation.leveeLe?.getTime() === dans(4).getTime());
  assert.equal(await services.estLimite(1, dans(5)), null);
  assert.deepEqual(await services.reexaminerLimitation(r.limitation.id, dans(5)), { ok: false, erreur: "deja-reexaminee" });
  assert.deepEqual(await services.listerContestationsAReexaminer(), []);
  // Finie : plus contestable
  assert.ok((await services.limiterCompte({ compteId: 2, motif: "triche", motivation: POURQUOI, fin: dans(1) })).ok);
  assert.deepEqual(await services.contesterLimitation(2, "Ce n'était pas moi.", dans(2)), { ok: false, erreur: "aucune-limitation" });
});

test("ménage : effacée 1 an après sa fin ou sa levée, jamais avant ; une limitation sans fin reste", async () => {
  const memoire = creerLimitationsEnMemoire(() => MAINTENANT.getTime());
  const { services } = memoire;
  const finie = await services.limiterCompte({ compteId: 1, motif: "haine", motivation: POURQUOI, fin: dans(10) });
  const levee = await services.limiterCompte({ compteId: 2, motif: "haine", motivation: POURQUOI });
  assert.ok((await services.limiterCompte({ compteId: 3, motif: "haine", motivation: POURQUOI })).ok);
  assert.ok(finie.ok && levee.ok);
  if (!levee.ok) return;
  assert.ok((await services.leverLimitation(levee.limitation.id, dans(20))).ok);
  assert.equal(await services.effacerLimitationsAnciennes(new Date("2027-10-25T09:59:59Z")), 0);
  assert.equal(await services.effacerLimitationsAnciennes(new Date("2027-10-25T10:00:00Z")), 1);
  assert.equal(await services.effacerLimitationsAnciennes(new Date("2027-11-04T10:00:00Z")), 1);
  assert.deepEqual([...memoire.limitations.values()].map((l) => l.compteId), [3]);
  assert.equal((await services.listerLimitationsDuCompte(3)).length, 1);
});

/**
 * Une fausse base Prisma : chaque geste est noté (« base.limitationCompte.findMany », « tx.$queryRaw »…) avec ses
 * arguments, et rend la réponse donnée (une fonction ou une valeur), sinon une réponse vide.
 */
function fausseBase(reponses: Record<string, unknown> = {}) {
  const appels: { geste: string; args: unknown[] }[] = [];
  const vide = (geste: string) => (geste.endsWith("count") ? 0 : geste.endsWith("findMany") || geste.endsWith("$queryRaw") ? [] : geste.endsWith("findUnique") ? null : { count: 0 });
  const repondre = async (geste: string, args: unknown[]) => {
    appels.push({ geste, args });
    const reponse = reponses[geste];
    return typeof reponse === "function" ? reponse(...args) : geste in reponses ? reponse : vide(geste);
  };
  const client = (nom: string) => ({
    $queryRaw: (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => repondre(`${nom}.$queryRaw`, [morceaux.join("?"), ...valeurs]),
    limitationCompte: new Proxy({}, { get: (_m, geste: string) => (...args: unknown[]) => repondre(`${nom}.limitationCompte.${geste}`, args) }),
  });
  const tx = client("tx");
  const base = { ...client("base"), $transaction: async (f: (t: unknown) => unknown) => f(tx) };
  return { base: base as never, appels, gestes: () => appels.map((a) => a.geste) };
}

const ligne = (retouches: Partial<LimitationLue> = {}): LimitationLue => ({
  id: 7, compteId: 1, motif: "haine", motivation: POURQUOI, debut: dans(-1), fin: dans(6), leveeLe: null, contestation: null, contesteLe: null,
  reexamineLe: null, creeLe: dans(-1), ...retouches,
});

test("base : table absente (migration pas appliquée) → personne n'est limité, rien ne plante, limiterCompte « indisponible »", async () => {
  const { base, gestes } = fausseBase({ "base.$queryRaw": [{ presente: false }] });
  const services = creerLimitationsComptes(base);
  assert.equal(await services.estLimite(1, MAINTENANT), null);
  assert.equal(await services.lireLimitationDuCompte(1, MAINTENANT), null);
  assert.deepEqual(await services.contesterLimitation(1, "Ce n'était pas moi.", MAINTENANT), { ok: false, erreur: "aucune-limitation" });
  assert.deepEqual(await services.limiterCompte({ compteId: 1, motif: "haine", motivation: POURQUOI }, MAINTENANT), { ok: false, erreur: "indisponible" });
  assert.deepEqual(await services.leverLimitation(7, MAINTENANT), { ok: false, erreur: "introuvable" });
  assert.deepEqual(await services.reexaminerLimitation(7, MAINTENANT), { ok: false, erreur: "introuvable" });
  assert.deepEqual(await services.listerLimitationsDuCompte(1), []);
  assert.deepEqual(await services.listerContestationsAReexaminer(), []);
  assert.equal(await services.effacerLimitationsAnciennes(MAINTENANT), 0);
  assert.ok(gestes().every((g) => g === "base.$queryRaw"), "seule la présence de la table est demandée");
});

test("base : estLimite lit les limitations en vigueur du compte, et la table vue n'est plus revérifiée", async () => {
  const { base, appels, gestes } = fausseBase({
    "base.$queryRaw": [{ presente: true }],
    "base.limitationCompte.findMany": [ligne({ id: 1, fin: dans(3) }), ligne({ id: 2, fin: null, motif: "arnaque" }), ligne({ id: 3, debut: dans(2) })],
  });
  const services = creerLimitationsComptes(base);
  assert.deepEqual(await services.estLimite(1, MAINTENANT), { jusqua: null, motif: "arnaque" });
  assert.deepEqual(appels[1]?.args[0], { where: { compteId: 1, leveeLe: null, OR: [{ fin: null }, { fin: { gt: MAINTENANT } }] } });
  await services.estLimite(1, MAINTENANT);
  assert.deepEqual(gestes(), ["base.$queryRaw", "base.limitationCompte.findMany", "base.limitationCompte.findMany"]);
});

test("base : limiterCompte verrouille le compte, refuse un compte inconnu ou déjà limité, et écrit la ligne vérifiée", async () => {
  const nouvelle = { compteId: 5, motif: "haine", motivation: `  ${POURQUOI}  `, fin: dans(7) };
  const inconnu = fausseBase({ "base.$queryRaw": [{ presente: true }], "tx.$queryRaw": [] });
  assert.deepEqual(await creerLimitationsComptes(inconnu.base).limiterCompte(nouvelle, MAINTENANT), { ok: false, erreur: "compte-inconnu" });
  assert.match(String(inconnu.appels.find((a) => a.geste === "tx.$queryRaw")?.args[0]), /FROM comptes WHERE id = \? FOR UPDATE/);
  const deja = fausseBase({ "base.$queryRaw": [{ presente: true }], "tx.$queryRaw": [{ id: 5 }], "tx.limitationCompte.count": 1 });
  assert.deepEqual(await creerLimitationsComptes(deja.base).limiterCompte(nouvelle, MAINTENANT), { ok: false, erreur: "deja-limite" });
  assert.ok(!deja.gestes().includes("tx.limitationCompte.create"));
  const bon = fausseBase({
    "base.$queryRaw": [{ presente: true }], "tx.$queryRaw": [{ id: 5 }],
    "tx.limitationCompte.create": ({ data }: { data: object }) => ({ id: 9, ...data }),
  });
  const r = await creerLimitationsComptes(bon.base).limiterCompte(nouvelle, MAINTENANT);
  assert.ok(r.ok);
  assert.deepEqual(bon.appels.find((a) => a.geste === "tx.limitationCompte.create")?.args[0], {
    data: { compteId: 5, motif: "haine", motivation: POURQUOI, debut: MAINTENANT, fin: dans(7), creeLe: MAINTENANT },
  });
  // Mauvais motif : refusé avant toute demande à la base
  const rien = fausseBase();
  assert.equal((await creerLimitationsComptes(rien.base).limiterCompte({ ...nouvelle, motif: "autre" }, MAINTENANT)).ok, false);
  assert.deepEqual(rien.gestes(), []);
});

test("base : contester n'écrit que sur une limitation pas encore contestée ; le ménage efface ce qui a fini il y a plus d'un an", async () => {
  const { base, appels } = fausseBase({
    "base.$queryRaw": [{ presente: true }],
    "base.limitationCompte.findMany": [ligne()],
    "base.limitationCompte.updateMany": { count: 1 },
    "base.limitationCompte.findUnique": ligne({ contestation: "Ce n'était pas moi.", contesteLe: MAINTENANT }),
    "base.limitationCompte.deleteMany": { count: 4 },
  });
  const services = creerLimitationsComptes(base);
  const r = await services.contesterLimitation(1, "Ce n'était pas moi.", MAINTENANT);
  assert.ok(r.ok && r.limitation.contestation === "Ce n'était pas moi.");
  assert.deepEqual(appels.find((a) => a.geste === "base.limitationCompte.updateMany")?.args[0], {
    where: { id: 7, contestation: null }, data: { contestation: "Ce n'était pas moi.", contesteLe: MAINTENANT },
  });
  assert.equal(await services.effacerLimitationsAnciennes(MAINTENANT), 4);
  const unAn = new Date("2025-10-15T10:00:00Z");
  assert.deepEqual(appels.find((a) => a.geste === "base.limitationCompte.deleteMany")?.args[0], {
    where: { OR: [{ leveeLe: { lte: unAn } }, { fin: { lte: unAn } }] },
  });
  // Deux contestations au même moment : la seconde ne trouve plus la ligne libre
  const course = fausseBase({ "base.$queryRaw": [{ presente: true }], "base.limitationCompte.findMany": [ligne()], "base.limitationCompte.updateMany": { count: 0 } });
  assert.deepEqual(await creerLimitationsComptes(course.base).contesterLimitation(1, "Ce n'était pas moi.", MAINTENANT), { ok: false, erreur: "deja-conteste" });
});
