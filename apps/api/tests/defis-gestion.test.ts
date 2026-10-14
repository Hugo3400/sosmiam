// Défis côté logiciel de gestion (services listerGestion, creer, modifier, supprimer, branchés par la session Logiciel sur
// /api-gestion/defis), et l'emballage d'ajouterPoints qui recompte les défis après les points des autres domaines.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { brancherReevaluationDefis } from "../src/fonctions/defis/brancher-reevaluation-defis.ts";
import { creerDefisEnMemoire } from "../src/services/defis-en-memoire.ts";

const points: { compteId: number; points: number }[] = [];
const defis = creerDefisEnMemoire({ ajouterPoints: async (compteId, n) => void points.push({ compteId, points: n }), donnerBadge: async () => {} });
const MAINTENANT = new Date("2026-10-14T10:00:00Z");

const BROUILLON = {
  emoji: "🥐", titre: "La tournée des pâtissiers", texte: "3 pâtisseries différentes, 3 visites validées. La balance, on verra plus tard.",
  mesure: "lieux-differents", filtres: { typesLieu: ["patisserie"] }, objectif: 3, points: 30, debut: "2026-10-14", fin: null, publie: true, ordre: 4,
};

/** Crée le défi et le fait réussir par le compte 1 (3 pâtisseries différentes) */
async function creerDefiReussi() {
  const cree = await defis.services.creer(BROUILLON);
  assert.ok(cree.ok);
  const f = defis.faitsDe(1);
  for (const lieuId of [1, 2, 3]) f.visites.push({ le: MAINTENANT.getTime(), lieuId, typeLieu: "patisserie", ville: "Sète", pendantSos: false });
  assert.deepEqual((await defis.services.reevaluer(1, MAINTENANT)).reussis, [cree.defi.id]);
  return cree.defi.id;
}

beforeEach(() => {
  defis.defis.clear();
  defis.reussites.length = 0;
  defis.faits.clear();
  defis.badges.clear();
  points.length = 0;
});

test("creer : vérifié par validerDefi (champ-invalide et son champ), brouillon par défaut, nettoyé", async () => {
  assert.deepEqual(await defis.services.creer({ ...BROUILLON, titre: "" }), { ok: false, erreur: "champ-invalide", champ: "titre" });
  assert.deepEqual(await defis.services.creer({ ...BROUILLON, filtres: { typesLieu: ["bar"] } }), { ok: false, erreur: "champ-invalide", champ: "filtres" });
  assert.deepEqual(await defis.services.creer("pas un défi"), { ok: false, erreur: "champ-invalide", champ: "emoji" });
  const { publie: _p, ordre: _o, ...sansPublie } = BROUILLON;
  const r = await defis.services.creer({ ...sansPublie, titre: "  Encore   des pâtisseries  " });
  assert.ok(r.ok);
  assert.deepEqual(r.defi, { ...r.defi, titre: "Encore des pâtisseries", publie: false, ordre: 0, reussites: 0 });
  assert.equal(typeof r.defi.id, "number");
  assert.equal(r.defi.creeLe, r.defi.modifieLe);
});

test("listerGestion : brouillons compris, triés par ordre puis premier jour, avec le nombre de réussites", async () => {
  const reussi = await creerDefiReussi();
  const brouillon = await defis.services.creer({ ...BROUILLON, titre: "Brouillon", publie: false, ordre: 1 });
  const tard = await defis.services.creer({ ...BROUILLON, titre: "Plus tard", ordre: 1, debut: "2026-12-01" });
  assert.ok(brouillon.ok && tard.ok);
  const liste = await defis.services.listerGestion();
  assert.deepEqual(liste.map((d) => [d.id, d.reussites]), [[brouillon.defi.id, 0], [tard.defi.id, 0], [reussi, 1]]);
});

test("modifier : tout est permis tant que personne ne l'a réussi ; defi-inconnu sinon", async () => {
  assert.deepEqual(await defis.services.modifier(999, { titre: "Rien" }), { ok: false, erreur: "defi-inconnu" });
  const cree = await defis.services.creer(BROUILLON);
  assert.ok(cree.ok);
  const r = await defis.services.modifier(cree.defi.id, { mesure: "visites", filtres: { apresHeure: 20 }, objectif: 4, debut: "2026-10-20" });
  assert.ok(r.ok);
  assert.deepEqual([r.defi.mesure, r.defi.filtres, r.defi.objectif, r.defi.debut, r.defi.titre], ["visites", { apresHeure: 20 }, 4, "2026-10-20", BROUILLON.titre]);
  // La fusion est revérifiée : un filtre qui ne va plus avec la nouvelle mesure est refusé
  assert.deepEqual(await defis.services.modifier(cree.defi.id, { mesure: "avis" }), { ok: false, erreur: "champ-invalide", champ: "filtres" });
  assert.deepEqual(await defis.services.modifier(cree.defi.id, { fin: "2026-10-01" }), { ok: false, erreur: "champ-invalide", champ: "fin" });
  assert.deepEqual(await defis.services.modifier(cree.defi.id, [1, 2]), { ok: false, erreur: "champ-invalide", champ: "emoji" });
});

test("modifier un défi déjà réussi : la règle est figée (defi-deja-reussi), le reste change ; renvoyer la même valeur passe", async () => {
  const id = await creerDefiReussi();
  for (const changement of [{ mesure: "visites" }, { filtres: { typesLieu: ["patisserie", "sortie"] } }, { filtres: null }, { objectif: 2 }, { debut: "2026-10-15" }]) {
    assert.deepEqual(await defis.services.modifier(id, changement), { ok: false, erreur: "defi-deja-reussi" }, JSON.stringify(changement));
  }
  const r = await defis.services.modifier(id, {
    emoji: "🧁", titre: "La tournée des pâtissières", texte: "Trois adresses sucrées, trois visites validées.", points: 40, fin: "2026-12-31", publie: false, ordre: 9,
    mesure: "lieux-differents", filtres: { typesLieu: ["patisserie"] }, objectif: 3, debut: "2026-10-14",
  });
  assert.ok(r.ok);
  assert.deepEqual([r.defi.emoji, r.defi.points, r.defi.fin, r.defi.publie, r.defi.ordre, r.defi.reussites], ["🧁", 40, "2026-12-31", false, 9, 1]);
  // Les points crédités restent ceux de la réussite (30) : seules les prochaines réussites rapporteront 40
  assert.equal(defis.reussites[0]!.points, 30);
});

test("supprimer : refusé pour un défi déjà réussi (on le dépublie), permis sinon ; defi-inconnu ensuite", async () => {
  const reussi = await creerDefiReussi();
  assert.deepEqual(await defis.services.supprimer(reussi), { ok: false, erreur: "defi-deja-reussi" });
  const cree = await defis.services.creer({ ...BROUILLON, titre: "Jamais réussi" });
  assert.ok(cree.ok);
  assert.deepEqual(await defis.services.supprimer(cree.defi.id), { ok: true });
  assert.deepEqual(await defis.services.supprimer(cree.defi.id), { ok: false, erreur: "defi-inconnu" });
  assert.deepEqual((await defis.services.listerGestion()).map((d) => d.id), [reussi]);
});

test("emballage d'ajouterPoints : recompte après les autres raisons, sans attendre ni faire échouer l'ajout", async () => {
  const ajouts: string[] = [];
  const recomptes: { compteId: number; maintenant: number }[] = [];
  let reponseRecompte: () => Promise<unknown> = async () => {};
  const ajouterPoints = async (compteId: number, n: number, raison: "visite" | "defi" | "rescousse") => (ajouts.push(`${compteId}:${n}:${raison}`), { points: 42 });
  const emballe = brancherReevaluationDefis(ajouterPoints, (compteId, maintenant) => (recomptes.push({ compteId, maintenant: maintenant.getTime() }), reponseRecompte()), () => 1234);

  assert.deepEqual(await emballe(7, 15, "visite"), { points: 42 });
  assert.deepEqual(recomptes, [{ compteId: 7, maintenant: 1234 }]);
  // Les points des défis ne relancent pas de recompte
  await emballe(7, 30, "defi", "defi:3");
  assert.equal(recomptes.length, 1);
  assert.deepEqual(ajouts, ["7:15:visite", "7:30:defi"]);

  // Un recompte qui échoue (ou qui ne finit jamais) ne fait ni échouer ni attendre l'ajout ; l'erreur est journalisée, résumée
  const journal: unknown[][] = [];
  const consoleErreur = console.error;
  console.error = (...args: unknown[]) => void journal.push(args);
  try {
    reponseRecompte = () => Promise.reject(Object.assign(new Error("compte lea@exemple.fr"), { code: "P2028" }));
    assert.deepEqual(await emballe(8, 2, "rescousse"), { points: 42 });
    reponseRecompte = () => new Promise(() => {});
    assert.deepEqual(await emballe(8, 2, "rescousse"), { points: 42 });
    await new Promise((fini) => setImmediate(fini));
    assert.equal(journal.length, 1);
    assert.match(String(journal[0]![1]), /^Error P2028/);
    assert.doesNotMatch(JSON.stringify(journal), /lea@exemple\.fr/);
  } finally {
    console.error = consoleErreur;
  }
});

test("le défi déjà réussi reste réussi même dépublié puis republié ; ses points ne sont pas crédités deux fois", async () => {
  const id = await creerDefiReussi();
  await defis.services.modifier(id, { publie: false });
  assert.deepEqual(await defis.services.listerPourCompte(1, MAINTENANT), []);
  await defis.services.modifier(id, { publie: true });
  const [defi] = await defis.services.listerPourCompte(1, MAINTENANT);
  assert.equal(defi!.etat, "reussi");
  assert.deepEqual(points, [{ compteId: 1, points: 30 }]);
});
