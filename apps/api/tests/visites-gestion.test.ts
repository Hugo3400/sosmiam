// Tests de « Donner raison au client » (services/visites-gestion.ts), appelé par le logiciel de gestion : aucune base de données.
import assert from "node:assert/strict";
import { test } from "node:test";

import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerVisitesEnMemoire } from "../src/services/visites-en-memoire.ts";
import { creerVisitesGestion } from "../src/services/visites-gestion.ts";
import type { LigneVisite } from "../src/services/visites-regles.ts";
import { LIEU_TEST } from "./outils/creer-banc-visites.ts";

const T0 = new Date("2026-10-09T18:00:00Z");

function creerBanc() {
  const memoire = creerVisitesEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const points: { compteId: number; valeur: number; raison: string }[] = [];
  const messages: { compteId: number; titre: string; texte: string; lien: string | null }[] = [];
  memoire.lieux.set(1, { ...LIEU_TEST });
  memoire.comptes.set(7, { id: 7, prenom: "Léa", avatar: "🦊", nomChiffre: null, dateNaissanceChiffree: chiffrement.chiffrer("2010-03-01", "dateNaissance"), emailVerifie: true, rattachements: [] });
  memoire.programmes.set(1, { lieuId: 1, actif: true, visitesRequises: 3, recompense: "Un verre de muscat", alcool: true, recompenseSansAlcool: "Une citronnade", modifieLe: T0 });
  const gestion = creerVisitesGestion({
    depot: memoire.depot,
    chiffrement,
    ajouterPoints: async (compteId, valeur, raison) => void points.push({ compteId, valeur, raison }),
    prevenirCompte: async (compteId, m) => void messages.push({ compteId, ...m }),
  });
  /** Une visite du compte 7 au lieu 1, refusée par le lieu (ou autre statut), contestée ou non */
  const visite = async (champs: Partial<LigneVisite>) => (await memoire.depot.ecrire((t) => t.creerVisite({
    compteId: 7, lieuId: 1, mode: "addition", statut: "refusee", code: "1234", creeLe: T0, expireLe: new Date(T0.getTime() + 1_800_000), valideLe: null,
    decideLe: T0, decideParId: 42, pendantSos: false, points: 0, tampon: false, resultatPosition: "dans-rayon", motifRefus: "pas-venu", contestee: true,
    contestation: "J'ai payé en espèces", avisOuvertLe: null, avisFermeLe: null, avisDonne: false, presentationId: null, reservationId: null,
    annulableJusqua: null, reglement: null, ...champs,
  }))).id;
  return { memoire, gestion, points, messages, visite };
}

test("donner raison : refusée et contestée → validée, points, tampon, avis, client prévenu, lieu jamais", async () => {
  const b = creerBanc();
  const id = await b.visite({});
  const maintenant = new Date("2026-10-11T10:00:00Z");
  assert.deepEqual(await b.gestion.donnerRaisonAuClient(id, maintenant), { ok: true, visiteId: id, compteId: 7, lieuId: 1 });
  const v = b.memoire.visites.find((x) => x.id === id)!;
  assert.deepEqual(
    [v.statut, v.points, v.tampon, v.valideLe?.toISOString(), v.decideParId, v.annulableJusqua, v.contestee, v.motifRefus, v.avisOuvertLe?.toISOString()],
    ["validee", 15, true, maintenant.toISOString(), null, null, true, "pas-venu", "2026-10-11T11:00:00.000Z"],
  );
  assert.deepEqual(b.points, [{ compteId: 7, valeur: 15, raison: "visite" }]);
  assert.equal(b.memoire.cartes.find((c) => c.compteId === 7)?.tampons, 1);
  assert.deepEqual(b.messages.map((m) => [m.compteId, m.lien]), [[7, `/visite/${id}`]]);
  assert.match(b.messages[0].texte, /Chez Léa : elle est validée \(\+15 points\)/i);
  assert.ok(!b.messages[0].texte.includes("espèces"));
  // Une deuxième fois : déjà validée
  assert.deepEqual(await b.gestion.donnerRaisonAuClient(id, maintenant), { ok: false, erreur: "transition-interdite" });
  assert.equal(b.points.length, 1);
});

test("donner raison : récompense figée selon l'âge, visite retirée gardant son règlement, refus parlants", async () => {
  const b = creerBanc();
  // Deux tampons déjà là : la revalidation remplit la carte, avec la version sans alcool (Léa a 16 ans)
  await b.memoire.depot.ecrire(async (t) => t.modifierTampons((await t.creerCarte(7, 1, T0)).id, 2));
  const retiree = await b.visite({ statut: "retiree", reglement: { type: "reduction", reductionPourcent: 20, avantages: [] }, motifRefus: "doublon" });
  assert.equal((await b.gestion.donnerRaisonAuClient(retiree, T0)).ok, true);
  assert.deepEqual(b.memoire.recompenses.map((r) => [r.libelle, r.alcool]), [["Une citronnade", false]]);
  assert.equal(b.memoire.visites.find((x) => x.id === retiree)?.reglement?.reductionPourcent, 20);
  assert.deepEqual(await b.gestion.donnerRaisonAuClient(9999, T0), { ok: false, erreur: "introuvable" });
  assert.deepEqual(await b.gestion.donnerRaisonAuClient(await b.visite({ contestee: false }), T0), { ok: false, erreur: "pas-contestee" });
  assert.deepEqual(await b.gestion.donnerRaisonAuClient(await b.visite({ statut: "annulee" }), T0), { ok: false, erreur: "transition-interdite" });
});
