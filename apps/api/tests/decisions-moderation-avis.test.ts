// Tests des décisions de la modération sur un avis et sur la réponse d'un lieu à un avis (décision de Hugo du 15/10/2026,
// « Modération des avis et limitation d'un compte ») : masqués par l'équipe à la relecture, ils entrent dans « mes
// décisions » de leur AUTEUR seulement (la ligne Signalement n'a personne qui a signalé), avec motif et motivation, et se
// contestent comme un contenu social retiré (une fois, dans les 6 mois). La ligne elle-même est écrite par le logiciel de
// gestion avec construireDecisionAvis (fonctions/avis) : ici, le test pose dans la table EXACTEMENT ce qu'elle construit
// (cible « avis » ou « reponse-avis », cibleId : l'id de l'avis, raison « relecture », source « equipe », statut
// « retenu »), plus les défauts de la base. Tout en mémoire.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import type { MotifModeration } from "../../../packages/commun/src/contenus/motifs-moderation.ts";
import { construireDecisionAvis } from "../src/fonctions/avis/construire-decision-avis.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const JOUR = 24 * 60 * 60 * 1000;
const MOTIVATION = "Ton avis parlait d'un autre restaurant que celui-ci.";
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

/**
 * Comme le rappel du logiciel quand l'équipe masque un avis ou une réponse à la relecture : la ligne de
 * construireDecisionAvis, avec ce que la base y ajoute d'elle-même (identifiant, colonnes laissées à leur défaut) ;
 * signaleParId : seulement pour vérifier qu'une ligne trafiquée ne va pas chez cette personne
 */
function masquerParLEquipe(cible: "avis" | "reponse-avis", avisId: number, auteur: PersonneDeTest, o: { motif?: MotifModeration; signaleParId?: number } = {}) {
  const id = prendreId(banc.tables, "signalements");
  const maintenant = new Date(banc.horloge.maintenant);
  const ecrite = construireDecisionAvis({ cible, avisId, lieuId: 77, compteId: auteur.compteId, motif: o.motif ?? "fausse-info", motivation: MOTIVATION, maintenant });
  banc.tables.signalements.set(id, {
    id, precision: null, decision: null, contestation: null, contesteLe: null, reexamineLe: null, creeLe: maintenant, instantaneChiffre: null, fichierMedia: null,
    ...ecrite,
    ...(o.signaleParId !== undefined ? { signaleParId: o.signaleParId } : {}),
  });
  return id;
}
/** Comme le réexamen du logiciel qui donne raison à l'auteur (avec retablirAvisDans : l'avis revient en ligne) */
function donnerRaison(id: number) {
  const maintenant = new Date(banc.horloge.maintenant);
  Object.assign(banc.tables.signalements.get(id)!, { statut: "rejete", motif: null, motivation: "Relu : ton avis parle bien de ce lieu.", traiteLe: maintenant, reexamineLe: maintenant });
}
const decisions = async (p: PersonneDeTest) => (await p.demander("GET", "/app/moderation/mes-decisions")).corps.decisions;
const contester = (p: PersonneDeTest, id: number, texte = "C'était bien ce lieu, j'y étais hier soir !") => p.demander("POST", `/app/moderation/${id}/contestation`, { texte });

test("construireDecisionAvis : la ligne que le logiciel écrit au masquage, champ par champ", () => {
  const maintenant = new Date("2026-10-16T14:00:00Z");
  assert.deepEqual(construireDecisionAvis({ cible: "reponse-avis", avisId: 42, lieuId: 18, compteId: null, motif: "haine", motivation: MOTIVATION, maintenant }), {
    cible: "reponse-avis", cibleId: "42", lieuId: 18, raison: "relecture", explication: "", source: "equipe", statut: "retenu",
    motif: "haine", motivation: MOTIVATION, traiteLe: maintenant, signaleParId: null, auteurContenuId: null,
  });
});

test("avis masqué par l'équipe : chez son auteur seulement, avec motif et motivation, contestable 6 mois, puis réexaminé", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "auteur.avis.masque" });
  const gerant = await banc.creerPersonne({ pseudo: "gerant.avis.masque" });
  const curieux = await banc.creerPersonne({ pseudo: "curieux.avis.masque" });
  assert.deepEqual(await decisions(auteur), [], "rien tant que l'équipe n'a rien masqué");

  const id = masquerParLEquipe("avis", 501, auteur);
  const decideLe = new Date(banc.horloge.maintenant).toISOString();
  assert.deepEqual(await decisions(auteur), [{
    id: String(id), cible: "avis", role: "auteur", statut: "retenu", motif: "fausse-info", motivation: MOTIVATION, decideLe,
    contestableJusqua: new Date(banc.horloge.maintenant + 183 * JOUR).toISOString(), contestation: "aucune",
  }]);
  for (const autre of [gerant, curieux]) assert.deepEqual(await decisions(autre), [], "jamais chez quelqu'un d'autre que l'auteur");

  assert.equal((await contester(curieux, id)).statut, 404, "pas la sienne");
  assert.deepEqual((await contester(auteur, id)).corps, { ok: true });
  assert.deepEqual(banc.social.contestations.map((x) => x.id), [id]);
  assert.equal((await contester(auteur, id)).corps.erreur, "deja-contestee", "une fois par décision");
  assert.equal((await decisions(auteur))[0].contestation, "envoyee");

  banc.horloge.maintenant += JOUR;
  donnerRaison(id);
  const [relue] = await decisions(auteur);
  assert.deepEqual([relue.statut, relue.motif, relue.contestation, relue.contestableJusqua], ["rejete", null, "reexaminee", null], "l'avis revient en ligne");
  assert.equal((await contester(auteur, id)).corps.erreur, "decision-inconnue", "rien à contester une fois l'avis remis en ligne");
});

test("avis masqué : la contestation ferme au bout de 6 mois", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "auteur.avis.delai" });
  const id = masquerParLEquipe("avis", 502, auteur, { motif: "haine" });
  banc.horloge.maintenant += 184 * JOUR;
  assert.equal((await contester(auteur, id)).corps.erreur, "contestation-hors-delai");
  banc.horloge.maintenant -= 184 * JOUR;
  assert.deepEqual((await contester(auteur, id)).corps, { ok: true });
});

test("réponse d'un lieu masquée : chez le compte qui l'a écrite, sans se mêler de l'avis auquel elle répond", async () => {
  const auteurAvis = await banc.creerPersonne({ pseudo: "auteur.avis.repondu" });
  const gerant = await banc.creerPersonne({ pseudo: "gerant.reponse.masquee" });
  const reponse = masquerParLEquipe("reponse-avis", 601, gerant, { motif: "haine" });
  const [d] = await decisions(gerant);
  assert.deepEqual([d.id, d.cible, d.role, d.statut, d.motif, d.motivation, d.contestation], [String(reponse), "reponse-avis", "auteur", "retenu", "haine", MOTIVATION, "aucune"]);
  assert.ok(d.contestableJusqua, "contestable");
  assert.deepEqual(await decisions(auteurAvis), [], "la réponse n'est pas de l'auteur de l'avis");

  // Même avis (même cibleId), masqué lui aussi : chacun ne voit que son contenu
  const avis = masquerParLEquipe("avis", 601, auteurAvis);
  assert.deepEqual((await decisions(auteurAvis)).map((x: { id: string; cible: string }) => [x.id, x.cible]), [[String(avis), "avis"]]);
  assert.deepEqual((await decisions(gerant)).map((x: { id: string; cible: string }) => [x.id, x.cible]), [[String(reponse), "reponse-avis"]]);
  assert.equal((await contester(auteurAvis, reponse)).statut, 404);
  assert.deepEqual((await contester(gerant, reponse)).corps, { ok: true });
  assert.deepEqual((await contester(auteurAvis, avis)).corps, { ok: true }, "la contestation de la réponse ne bloque pas celle de l'avis");
});

test("un avis n'a jamais de « signalement » à soi : une ligne avec signaleParId ne va pas chez cette personne", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "auteur.avis.signaleur" });
  const signaleur = await banc.creerPersonne({ pseudo: "signaleur.avis" });
  const id = masquerParLEquipe("avis", 701, auteur, { signaleParId: signaleur.compteId });
  Object.assign(banc.tables.signalements.get(id)!, { statut: "rejete", motif: null });
  assert.deepEqual(await decisions(signaleur), []);
  assert.equal((await contester(signaleur, id)).corps.erreur, "decision-inconnue");
});
