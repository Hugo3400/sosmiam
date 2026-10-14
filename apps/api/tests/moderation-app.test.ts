// Tests des décisions de la modération vues dans l'app et de la contestation (/app/moderation, lot L6 ; règlement européen
// sur les services numériques) : mes décisions (auteur et signaleur), jamais qui a signalé ni son explication, une ligne par
// contenu pour l'auteur, contestation une fois, dans les 6 mois, réservée (sinon 404). La décision elle-même est écrite par
// le logiciel de gestion : ici, le test la pose dans la table comme le ferait deciderSignalement. Tout en mémoire.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { presenterDecisionModeration } from "../src/fonctions/social/presenter-decision-moderation.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const JOUR = 24 * 60 * 60 * 1000;
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let numeroPublication = 0;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

async function creerFiable(pseudo: string) {
  const p = await banc.creerPersonne({ pseudo });
  Object.assign(banc.memoire.comptes.get(p.compteId)!, { emailVerifieLe: banc.horloge.maintenant - 30 * JOUR, creeLe: banc.horloge.maintenant - 30 * JOUR });
  return p;
}
async function preparerCommentaire(auteur: PersonneDeTest, texte = "Un commentaire") {
  numeroPublication += 1;
  banc.tables.publications.set(numeroPublication, { lieuId: 900 + numeroPublication, statut: "publiee" });
  return (await auteur.demander("POST", `/app/commentaires/publications/${numeroPublication}`, { texte })).corps.commentaire.id as string;
}
const signaler = (p: PersonneDeTest, cibleId: string, raison = "haine", explication = "") =>
  p.demander("POST", "/app/signalements", { cible: "commentaire", cibleId, raison, precision: null, explication });
const signalementsDe = (cibleId: string) => [...banc.tables.signalements.values()].filter((s) => s.cible === "commentaire" && s.cibleId === cibleId).sort((a, b) => a.id - b.id);
/** Comme deciderSignalement (logiciel) : tous les signalements ouverts du contenu, ensemble ; un rejet remet le contenu en ligne */
function decider(cibleId: string, statut: "retenu" | "rejete") {
  const traiteLe = new Date(banc.horloge.maintenant);
  for (const s of signalementsDe(cibleId).filter((x) => x.statut === "a-traiter")) {
    Object.assign(s, { statut, traiteLe, motif: statut === "retenu" ? "haine" : null, motivation: "Propos haineux envers le personnel.", decision: "note privée" });
  }
  const c = banc.tables.commentaires.get(Number(cibleId))!;
  if (statut === "rejete") Object.assign(c, { suspenduLe: null, masqueParLieuLe: null });
  else c.retireLe = traiteLe;
}
const decisions = async (p: PersonneDeTest) => (await p.demander("GET", "/app/moderation/mes-decisions")).corps;
const contester = (p: PersonneDeTest, id: string | number, texte = "Je ne suis pas d'accord, relisez bien.") => p.demander("POST", `/app/moderation/${id}/contestation`, { texte });

test("presenterDecisionModeration : contestable 6 mois par le bon rôle, motif seulement pour un retrait", () => {
  const ligne = { id: 4, cible: "message" as const, statut: "retenu", motif: "haine", motivation: "Pourquoi", traiteLe: new Date("2026-10-14T10:00:00Z"), contesteLe: null, reexamineLe: null };
  const auteur = presenterDecisionModeration(ligne, "auteur");
  assert.equal(auteur.contestableJusqua, new Date(Date.parse("2026-10-14T10:00:00Z") + 183 * JOUR).toISOString());
  assert.equal(presenterDecisionModeration(ligne, "signale").contestableJusqua, null, "un retrait ne se conteste pas par qui a signalé");
  const rejet = presenterDecisionModeration({ ...ligne, statut: "rejete", motif: null }, "signale");
  assert.deepEqual([rejet.statut, rejet.motif, rejet.contestation], ["rejete", null, "aucune"]);
  const attente = presenterDecisionModeration({ ...ligne, statut: "a-traiter", traiteLe: null }, "auteur");
  assert.deepEqual([attente.statut, attente.decideLe, attente.motivation], ["masque", null, null]);
  assert.equal(presenterDecisionModeration({ ...ligne, contesteLe: new Date(), reexamineLe: new Date() }, "auteur").contestation, "reexaminee");
});

test("mes décisions : « masque » pour l'auteur dès le masquage, puis la décision ; jamais qui a signalé ni son explication", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "auteur.decisions" });
  const signaleur = await creerFiable("signaleur.decisions");
  const second = await creerFiable("second.decisions");
  const c = await preparerCommentaire(auteur, "Texte jugé");
  await signaler(second, c, "haine", "Explication secrète du second");
  assert.deepEqual((await decisions(auteur)).decisions, [], "rien tant que rien n'est masqué ni jugé");
  await signaler(signaleur, c, "choquant", "Explication secrète");
  const masque = (await decisions(auteur)).decisions;
  assert.deepEqual(masque.map((d: { statut: string; role: string; cible: string }) => [d.statut, d.role, d.cible]), [["masque", "auteur", "commentaire"]]);
  assert.equal((await decisions(signaleur)).decisions.length, 0, "pas encore jugé pour qui a signalé");
  banc.horloge.maintenant += JOUR;
  decider(c, "retenu");
  const pourAuteur = await decisions(auteur);
  assert.equal(pourAuteur.decisions.length, 1, "une seule ligne pour le contenu, même avec deux signalements");
  const [d] = pourAuteur.decisions;
  assert.deepEqual([d.statut, d.motif, d.motivation, d.decideLe, d.contestation], ["retenu", "haine", "Propos haineux envers le personnel.", new Date(banc.horloge.maintenant).toISOString(), "aucune"]);
  assert.equal(d.id, String(signalementsDe(c)[0]!.id), "le plus ancien signalement du contenu");
  const brut = JSON.stringify(pourAuteur);
  for (const secret of ["Explication secrète", signaleur.idPublic!, second.idPublic!, "note privée"]) assert.equal(brut.includes(secret), false, secret);
  const pourSignaleur = (await decisions(signaleur)).decisions;
  assert.deepEqual(pourSignaleur.map((x: { role: string; statut: string; contestableJusqua: string | null }) => [x.role, x.statut, x.contestableJusqua]), [["signale", "retenu", null]]);
  assert.equal((await banc.demander("GET", "/app/moderation/mes-decisions")).statut, 401);
});

test("contester : l'auteur d'un retrait, ou celui dont le signalement est rejeté ; une fois ; dans les 6 mois ; sinon 404", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "auteur.contester" });
  const signaleur = await creerFiable("signaleur.contester");
  const curieux = await banc.creerPersonne({ pseudo: "curieux.contester" });
  const retire = await preparerCommentaire(auteur, "Sera retiré");
  await signaler(signaleur, retire);
  const [s1] = signalementsDe(retire);
  assert.equal((await contester(auteur, s1!.id)).corps.erreur, "decision-inconnue", "pas encore jugé");
  decider(retire, "retenu");
  assert.equal((await contester(curieux, s1!.id)).statut, 404, "pas la sienne");
  assert.equal((await contester(signaleur, s1!.id)).corps.erreur, "decision-inconnue", "un retrait ne se conteste pas par qui a signalé");
  assert.deepEqual((await contester(auteur, s1!.id, "court")).corps, { ok: false, erreur: "champ-invalide", champ: "texte" });
  assert.deepEqual((await contester(auteur, s1!.id)).corps, { ok: true });
  assert.deepEqual(banc.social.contestations.map((x) => x.id), [s1!.id]);
  assert.equal((await contester(auteur, s1!.id)).corps.erreur, "deja-contestee");
  assert.equal((await decisions(auteur)).decisions.find((x: { id: string }) => x.id === String(s1!.id)).contestation, "envoyee");

  const garde = await preparerCommentaire(auteur, "Restera");
  await signaler(signaleur, garde);
  const [s2] = signalementsDe(garde);
  decider(garde, "rejete");
  assert.equal((await contester(auteur, s2!.id)).corps.erreur, "decision-inconnue", "rien à contester pour l'auteur : son texte reste");
  banc.horloge.maintenant += 184 * JOUR;
  assert.equal((await contester(signaleur, s2!.id)).corps.erreur, "contestation-hors-delai");
  banc.horloge.maintenant -= 184 * JOUR;
  assert.deepEqual((await contester(signaleur, s2!.id)).corps, { ok: true });
  assert.equal((await contester(signaleur, s2!.id)).statut, 409);
  // (5 contestations par 24 h et par compte, refus compris : le reste avec un autre compte)
  assert.equal((await contester(curieux, "abc")).corps.champ, "id");
  assert.equal((await contester(curieux, 999999)).statut, 404);
});
