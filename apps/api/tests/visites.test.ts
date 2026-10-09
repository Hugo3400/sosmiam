// Tests des visites côté client (/app/visites) : addition demandée, refus, QR du comptoir, suivi, annulation, contestation.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { construireMessageQr } from "../../../packages/commun/src/fonctions/qr/construire-message-qr.ts";
import { construireTexteComptoir } from "../../../packages/commun/src/fonctions/qr/construire-texte-comptoir.ts";
import { calculerFenetreQr } from "../../../packages/commun/src/fonctions/qr/calculer-fenetre-qr.ts";
import { creerBancVisites, SUR_PLACE } from "./outils/creer-banc-visites.ts";

let b: Awaited<ReturnType<typeof creerBancVisites>>;
before(async () => { b = await creerBancVisites(); });
after(() => b.fermer());
beforeEach(() => b.vider());

/** Un gérant qui montre le QR du lieu 1 pour `personnes`, et le texte affiché */
async function montrerQr(personnes = 1, reglement?: unknown) {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1);
  const r = await b.demander("POST", "/pro/comptoir/lieux/1/qr", gerant.jeton, { personnes, reglement });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  return { gerant, texte: r.corps.etat.qr.texte as string };
}

test("sans session : 401 partout", async () => {
  for (const chemin of ["/app/visites", "/app/fidelite/cartes", "/pro/comptoir/lieux"]) assert.equal((await b.demander("GET", chemin)).statut, 401, chemin);
});

test("addition : demandée sur place, code à 4 chiffres, 30 min, une seule à la fois", async () => {
  const lea = await b.creerCompte();
  const r = await b.demander("POST", "/app/visites/addition", lea.jeton, { lieuId: 1, position: SUR_PLACE });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  const v = r.corps.visite;
  assert.deepEqual([v.mode, v.statut, v.code, v.expireLe, v.demo, v.lieu.nom], ["addition", "demandee", "1234", "2026-10-09T10:30:00.000Z", false, "Chez Léa"]);
  const liste = await b.demander("GET", "/app/visites", lea.jeton);
  assert.deepEqual([liste.corps.enCours.id, liste.corps.visites, liste.corps.points], [v.id, [], 0]);
  b.visites.lieux.set(2, { ...b.visites.lieux.get(1)!, id: 2, nom: "Le Comptoir" });
  const encore = await b.demander("POST", "/app/visites/addition", lea.jeton, { lieuId: 2, position: SUR_PLACE });
  assert.deepEqual([encore.statut, encore.corps.erreur, encore.corps.details], [409, "demande-en-cours", { lieu: "Chez Léa", lieuId: 1 }]);
  // 31 minutes plus tard : expirée, on peut redemander
  b.banc.horloge += 31 * 60_000;
  assert.equal((await b.demander("GET", `/app/visites/${v.id}`, lea.jeton)).corps.visite.statut, "expiree");
  assert.equal((await b.demander("POST", "/app/visites/addition", lea.jeton, { lieuId: 2, position: SUR_PLACE })).statut, 201);
});

test("addition refusée : e-mail, âge, équipe du lieu, lieu sans validation, position, champs", async () => {
  const sansEmail = await b.creerCompte({ emailVerifie: false });
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  const membre = await b.creerCompte();
  b.rattacher(membre.id, 1, "equipe");
  const lea = await b.creerCompte();
  const refus = async (jeton: string, corps: unknown) => {
    const r = await b.demander("POST", "/app/visites/addition", jeton, corps);
    return [r.statut, r.corps.erreur, r.corps.details ?? r.corps.champ ?? null];
  };
  assert.deepEqual(await refus(sansEmail.jeton, { lieuId: 1, position: SUR_PLACE }), [403, "email-non-verifie", null]);
  assert.deepEqual(await refus(membre.jeton, { lieuId: 1, position: SUR_PLACE }), [403, "membre-du-lieu", null]);
  b.visites.lieux.set(3, { ...b.visites.lieux.get(1)!, id: 3, nom: "Le Bar du Port", type: "bar" });
  // Le nom d'un bar n'est jamais rendu à un 15-17 ans
  assert.deepEqual(await refus(ado.jeton, { lieuId: 3, position: SUR_PLACE }), [403, "mineur-bar", null]);
  b.visites.lieux.set(4, { ...b.visites.lieux.get(1)!, id: 4, nom: "Sans QR", validationActive: false });
  assert.deepEqual(await refus(lea.jeton, { lieuId: 4, position: SUR_PLACE }), [409, "lieu-sans-validation", { lieu: "Sans QR" }]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 99, position: SUR_PLACE }), [404, "introuvable", null]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 1, position: { ...SUR_PLACE, latitude: 43.6208 } }), [422, "hors-zone", { distanceM: 1100, lieu: "Chez Léa" }]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 1, position: { ...SUR_PLACE, simulee: true } }), [422, "position-simulee", null]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 1, position: { ...SUR_PLACE, ageMs: 90_000 } }), [422, "position-perimee", null]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 1, position: { ...SUR_PLACE, precision: 800 } }), [422, "position-imprecise", { precisionM: 800 }]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: 1, position: { latitude: 43.6 } }), [400, "champ-invalide", "position"]);
  assert.deepEqual(await refus(lea.jeton, { lieuId: "1", position: SUR_PLACE }), [400, "champ-invalide", "lieuId"]);
  assert.equal(b.visites.visites.length, 0);
});

test("QR du comptoir : une visite par QR et par personne, points, puis épuisé", async () => {
  const { texte } = await montrerQr(2);
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const zoe = await b.creerCompte({ prenom: "Zoé" });
  const r = await b.demander("POST", "/app/visites/comptoir", lea.jeton, { texte, position: SUR_PLACE });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  const v = r.corps.visite;
  assert.deepEqual([v.mode, v.statut, v.points, v.annulableJusqua, v.reglement.type, r.corps.dejaValidee], ["comptoir", "validee", 15, "2026-10-09T10:15:00.000Z", "paye", false]);
  assert.equal(v.avis.ouvertLe, "2026-10-09T11:00:00.000Z");
  assert.deepEqual(b.points, [{ compteId: lea.id, valeur: 15, raison: "visite" }]);
  const encore = await b.demander("POST", "/app/visites/comptoir", lea.jeton, { texte, position: SUR_PLACE });
  assert.deepEqual([encore.statut, encore.corps.dejaValidee, encore.corps.visite.id, b.points.length], [200, true, v.id, 1]);
  assert.equal((await b.demander("POST", "/app/visites/comptoir", sam.jeton, { texte, position: SUR_PLACE })).statut, 201);
  const epuise = await b.demander("POST", "/app/visites/comptoir", zoe.jeton, { texte, position: SUR_PLACE });
  assert.deepEqual([epuise.statut, epuise.corps.erreur], [409, "qr-epuise"]);
  // Le membre de l'équipe qui a montré le QR est noté sur la visite
  assert.ok(b.visites.visites.every((x) => x.decideParId !== null));
});

test("QR refusés : illisible, démo, vitrine, signature fausse, trop vieux, caché", async () => {
  const { gerant, texte } = await montrerQr(3);
  const lea = await b.creerCompte();
  const scanner = async (t: string) => {
    const r = await b.demander("POST", "/app/visites/comptoir", lea.jeton, { texte: t, position: SUR_PLACE });
    return [r.statut, r.corps.erreur, r.corps.details ?? null];
  };
  assert.deepEqual(await scanner("https://exemple.fr/bonjour"), [400, "qr-illisible", null]);
  assert.deepEqual(await scanner("https://sosmiam.fr/l/chezlea2"), [409, "qr-vitrine", { lieuId: 1, lieu: "Chez Léa" }]);
  const fenetre = calculerFenetreQr(b.banc.horloge);
  assert.deepEqual(await scanner(construireTexteComptoir({ version: "d", lieuId: 1, presentationId: 1, fenetre, mac: "AAAAAAAAAAA" })), [400, "qr-demo", null]);
  const faux = texte.slice(0, -3) + (texte.endsWith("AAA") ? "BBB" : "AAA");
  assert.deepEqual(await scanner(faux), [400, "qr-invalide", null]);
  // Un QR d'une autre présentation, bien signé, mais d'un autre lieu : refusé
  const ailleurs = { version: "1" as const, lieuId: 2, presentationId: b.visites.presentations[0].id, fenetre };
  b.visites.lieux.set(2, { ...b.visites.lieux.get(1)!, id: 2 });
  assert.deepEqual(await scanner(construireTexteComptoir({ ...ailleurs, mac: b.signerQr(construireMessageQr(ailleurs)) })), [410, "qr-expire", null]);
  b.banc.horloge += 61_000;
  assert.deepEqual(await scanner(texte), [410, "qr-expire", null]);
  // Un QR frais, puis caché par l'équipe
  const frais = (await b.demander("GET", "/pro/comptoir/lieux/1", gerant.jeton)).corps.etat.qr.texte;
  await b.demander("DELETE", "/pro/comptoir/lieux/1/qr", gerant.jeton);
  assert.deepEqual(await scanner(frais), [410, "qr-expire", null]);
  assert.equal(b.visites.visites.length, 0);
});

test("pendant un SOS : +25, et une table offerte ne rapporte ni points ni tampon", async () => {
  b.visites.lieux.get(1)!.sosEnCours = true;
  b.visites.programmes.set(1, { lieuId: 1, actif: true, visitesRequises: 5, recompense: "Un tiramisu", alcool: false, recompenseSansAlcool: null, modifieLe: new Date() });
  const { texte } = await montrerQr(1);
  const lea = await b.creerCompte();
  const r = await b.demander("POST", "/app/visites/comptoir", lea.jeton, { texte, position: SUR_PLACE });
  assert.deepEqual([r.corps.visite.points, r.corps.visite.pendantSos, r.corps.carte.tampons], [25, true, 1]);
  assert.deepEqual(b.points.map((p) => [p.valeur, p.raison]), [[25, "visite-sos"]]);
  const offert = await montrerQr(1, { type: "offert", avantages: ["partenariat"] });
  const sam = await b.creerCompte({ prenom: "Sam" });
  const o = await b.demander("POST", "/app/visites/comptoir", sam.jeton, { texte: offert.texte, position: SUR_PLACE });
  assert.deepEqual([o.corps.visite.points, o.corps.visite.tampon, o.corps.visite.reglement.type, o.corps.carte], [0, false, "offert", null]);
  assert.ok(o.corps.visite.avis);
  assert.equal(b.points.length, 1);
});

test("suivi, annulation et contestation : seulement ses propres visites", async () => {
  const lea = await b.creerCompte();
  const sam = await b.creerCompte({ prenom: "Sam" });
  const { visite } = (await b.demander("POST", "/app/visites/addition", lea.jeton, { lieuId: 1, position: SUR_PLACE })).corps;
  assert.equal((await b.demander("GET", `/app/visites/${visite.id}`, sam.jeton)).statut, 404);
  assert.equal((await b.demander("POST", `/app/visites/${visite.id}/annuler`, sam.jeton)).statut, 404);
  const contesteTrop = await b.demander("POST", `/app/visites/${visite.id}/contester`, lea.jeton, { mot: "Je suis venue !" });
  assert.deepEqual([contesteTrop.statut, contesteTrop.corps.erreur], [409, "transition-interdite"]);
  const annulee = await b.demander("POST", `/app/visites/${visite.id}/annuler`, lea.jeton);
  assert.deepEqual([annulee.statut, annulee.corps.visite.statut, annulee.corps.visite.code], [200, "annulee", null]);
  assert.equal((await b.demander("POST", `/app/visites/${visite.id}/annuler`, lea.jeton)).corps.erreur, "transition-interdite");
  // Refusée par le lieu, puis contestée (le mot reste chez l'équipe SOS Miam)
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1);
  const seconde = (await b.demander("POST", "/app/visites/addition", lea.jeton, { lieuId: 1, position: SUR_PLACE })).corps.visite;
  await b.demander("POST", `/pro/comptoir/visites/${seconde.id}/refuser`, gerant.jeton, { motif: "pas-venu" });
  const conteste = await b.demander("POST", `/app/visites/${seconde.id}/contester`, lea.jeton, { mot: "  J'ai payé en espèces.  " });
  assert.deepEqual([conteste.corps.visite.statut, conteste.corps.visite.motifRefus, conteste.corps.visite.contestee], ["refusee", "pas-venu", true]);
  assert.equal(conteste.corps.visite.contestation, undefined);
  assert.equal(b.visites.visites.find((v) => v.id === seconde.id)?.contestation, "J'ai payé en espèces.");
});

test("lieux qui valident et infos d'un lieu, selon l'âge", async () => {
  b.visites.lieux.set(3, { ...b.visites.lieux.get(1)!, id: 3, nom: "Le Bar du Port", type: "bar" });
  b.visites.programmes.set(3, { lieuId: 3, actif: true, visitesRequises: 4, recompense: "Une pinte", alcool: true, recompenseSansAlcool: "Un sirop", modifieLe: new Date() });
  const lea = await b.creerCompte();
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  assert.deepEqual((await b.demander("GET", "/app/visites/lieux-qui-valident", lea.jeton)).corps.lieux, [1, 3]);
  assert.deepEqual((await b.demander("GET", "/app/visites/lieux-qui-valident", ado.jeton)).corps.lieux, [1]);
  const infos = (await b.demander("GET", "/app/visites/lieux/3", lea.jeton)).corps.infos;
  assert.deepEqual([infos.validationActive, infos.programme, infos.carte, infos.enCoursIci], [true, { visitesRequises: 4, recompense: "Une pinte", recompenseAlcool: true }, null, null]);
  assert.equal((await b.demander("GET", "/app/visites/lieux/3", ado.jeton)).corps.erreur, "mineur-bar");
});
