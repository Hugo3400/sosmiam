// « Ton compte est limité » (décision de Hugo du 15 octobre 2026) : la fin dite en mots à l'heure de Paris, le message des
// pages qui écrivent sur un refus « compte-limite », le motif en clair, la lecture de details.jusqua par le client des
// comptes, l'appel de la contestation, et les textes (Mon compte, CGU, confidentialité) d'accord avec la décision.
// Une fausse API locale répond ; node --test tests/*.test.ts (dans apps/site-web).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { registerHooks } from "node:module";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";

// Les services et les contenus importent « ~/… » (alias de src/) : on l'apprend à Node pour ce test
const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

/** Réponses de la fausse API, par « MÉTHODE chemin » ; les corps reçus sont notés */
const reponses: Record<string, { statut: number; corps: unknown }> = {
  "PATCH /pro/lieux/7": { statut: 403, corps: { ok: false, erreur: "compte-limite", details: { jusqua: "2026-10-22T10:00:00.000Z" } } },
  "PUT /pro/lieux/8/carte": { statut: 403, corps: { ok: false, erreur: "compte-limite", details: { jusqua: null } } },
  "POST /pro/lieux/9/equipe": { statut: 403, corps: { ok: false, erreur: "compte-limite", details: { jusqua: "pas une date" } } },
  "POST /comptes/moi/limitation/contestation": { statut: 409, corps: { ok: false, erreur: "deja-conteste" } },
};
const recus: { chemin: string; corps: string }[] = [];
const serveur = createServer((requete, reponse) => {
  let corps = "";
  requete.on("data", (morceau) => (corps += morceau));
  requete.on("end", () => {
    recus.push({ chemin: `${requete.method} ${requete.url}`, corps });
    const prevue = reponses[`${requete.method} ${requete.url}`] ?? { statut: 404, corps: { ok: false, erreur: "introuvable" } };
    reponse.writeHead(prevue.statut, { "Content-Type": "application/json" }).end(JSON.stringify(prevue.corps));
  });
});
await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
after(() => serveur.close());
// L'adresse de l'API est lue au chargement du service : on la donne avant de l'importer
process.env.ADRESSE_API = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

const comptes = await import("../src/services/comptes.server.ts");
const { contesterLimitation } = await import("../src/services/limitation-compte.server.ts");
const { decrireFinLimitation } = await import("../src/fonctions/compte/decrire-fin-limitation.ts");
const { expliquerCompteLimite } = await import("../src/fonctions/compte/expliquer-compte-limite.ts");
const { lireMotifLimitation } = await import("../src/fonctions/compte/lire-motif-limitation.ts");
const { TEXTES_LIMITATION: textesLimitation } = await import("../src/contenus/limitation-compte.ts");
const { sectionModerationCgu } = await import("../src/contenus/legal/cgu-moderation.ts");
const { sectionSignalementsSociaux } = await import("../src/contenus/legal/confidentialite-signalements-sociaux.ts");

test("la fin d'une limitation, à l'heure de Paris (été comme hiver), ou « jusqu'à nouvel ordre »", () => {
  assert.equal(decrireFinLimitation("2026-10-22T10:00:00.000Z"), "jusqu'au 22 octobre 2026 à 12 h");
  assert.equal(decrireFinLimitation("2026-11-01T09:30:00.000Z"), "jusqu'au 1er novembre 2026 à 10 h 30");
  assert.equal(decrireFinLimitation("2026-12-31T23:15:00.000Z"), "jusqu'au 1er janvier 2027 à 0 h 15");
  for (const fin of [null, undefined, "", "pas une date"]) assert.equal(decrireFinLimitation(fin), "jusqu'à nouvel ordre", String(fin));
  const message = expliquerCompteLimite("2026-10-22T10:00:00.000Z");
  assert.match(message, /^Rien n'est parti : ton compte est limité jusqu'au 22 octobre 2026 à 12 h\./);
  assert.match(message, /« Mon compte »/);
  assert.match(expliquerCompteLimite(null), /jusqu'à nouvel ordre/);
});

test("le motif en clair : le nom et la règle des CGU ; un code inconnu reste poli", () => {
  assert.deepEqual(lireMotifLimitation("haine").libelle, "Haine ou harcèlement");
  assert.match(lireMotifLimitation("haine").regle ?? "", /^pas de haine ni de harcèlement/);
  assert.deepEqual(lireMotifLimitation("toString"), { libelle: "Une règle de la communauté", regle: null });
  assert.deepEqual(lireMotifLimitation("nouveau-motif"), { libelle: "Une règle de la communauté", regle: null });
});

test("« compte-limite » est reconnu, avec details.jusqua (une date lisible, sinon null : jusqu'à nouvel ordre)", async () => {
  const appeler = (chemin: string, methode: "PATCH" | "PUT" | "POST") => comptes.appelerApiComptes(chemin, { methode, jeton: "jeton", corps: {} });
  assert.deepEqual(await appeler("/pro/lieux/7", "PATCH"), { ok: false, erreur: "compte-limite", jusqua: "2026-10-22T10:00:00.000Z" });
  assert.deepEqual(await appeler("/pro/lieux/8/carte", "PUT"), { ok: false, erreur: "compte-limite", jusqua: null });
  assert.deepEqual(await appeler("/pro/lieux/9/equipe", "POST"), { ok: false, erreur: "compte-limite", jusqua: null });
});

test("contester : le texte part tel quel ; « deja-conteste » est reconnu", async () => {
  assert.deepEqual(await contesterLimitation("jeton", null, "Ce n'était pas moi du tout."), { ok: false, erreur: "deja-conteste" });
  assert.deepEqual(recus.at(-1), { chemin: "POST /comptes/moi/limitation/contestation", corps: JSON.stringify({ texte: "Ce n'était pas moi du tout." }) });
});

test("les textes disent la décision : ce qui attend, ce qui reste, une contestation relue par une autre personne", () => {
  const cgu = JSON.stringify(sectionModerationCgu.blocs);
  const confidentialite = JSON.stringify(sectionSignalementsSociaux.blocs);
  assert.equal(sectionModerationCgu.id, "moderation");
  assert.equal(sectionSignalementsSociaux.id, "signalements-sociaux");
  const attendus = [
    /les autres verraient/, /Miam Safe/, /valider tes visites/, /proposer un lieu/, /demander à gérer un lieu/, /export/, /suppression de ton compte/,
    /une autre personne de l'équipe/, /une (seule )?fois/, /un nouveau prénom, pseudo ou avatar/,
  ];
  for (const texte of [cgu, JSON.stringify(textesLimitation)]) for (const attendu of attendus) assert.match(texte, attendu);
  assert.match(cgu, /dans l'app et par e-mail/);
  for (const morceau of ["Si ton compte est limité", "6.1.c", "6.1.f", "**1 an** après sa fin ou sa levée", "effacée automatiquement", "effacée avec lui"]) {
    assert.ok(confidentialite.includes(morceau), morceau);
  }
  // Tutoiement, et jamais de règle « 15-17 ans »
  for (const texte of [cgu, confidentialite, JSON.stringify(textesLimitation)]) assert.doesNotMatch(texte, /\bvous\b|15-17|mineur/i);
});
