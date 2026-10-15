// Tests du ménage social de la nuit (lot L7, spécification E.1) : seuils et lignes du journal (fonctions pures), rechiffrement
// d'un texte et d'un fichier pendant un changement de clé (vraies clés de test, ancienne et nouvelle), et protection de chaque
// étape (une étape qui échoue n'arrête pas les autres ; le journal ne garde que des noms et des codes). Les requêtes SQL des
// étapes 1 à 9 sont essayées sur PGlite, hors de ces tests (scratchpad essai-l7/essai-menage-l7.mts).
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";

import { calculerSeuilsMenageSocial } from "../src/fonctions/social/calculer-seuils-menage-social.ts";
import { decrireBilanMenageSocial } from "../src/fonctions/social/decrire-bilan-menage-social.ts";
import { rechiffrerMediaSocial } from "../src/fonctions/social/rechiffrer-media-social.ts";
import { rechiffrerTexteSocial } from "../src/fonctions/social/rechiffrer-texte-social.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { CONTEXTES_SOCIAUX, creerChiffrementSocial } from "../src/services/chiffrement-social.ts";
import type { BaseMenage } from "../src/services/menage-social-etapes.ts";
import type { BilanMenageSocial } from "../src/services/menage-social.ts";
import { creerStockageMediasChatEnMemoire } from "../src/services/stockage-medias-chat.ts";

// Le ménage charge la connexion de l'API seulement sans `base` : une adresse d'essai suffit (jamais utilisée ici)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { faireLeMenageSocial } = await import("../src/services/menage-social.ts");
const { rechiffrerSocial } = await import("../src/services/rechiffrement-social.ts");

const JOUR = 86_400_000;
const T = new Date("2027-03-01T03:30:00Z");
const ilYa = (jours: number) => new Date(T.getTime() - jours * JOUR);

/** Une base qui refuse tout : chaque requête lève une erreur dont le message cite un faux contenu */
const baseEnPanne = new Proxy({}, {
  get: () => () => {
    const erreur = new Error("SELECT … 'Coucou la Brigade' …");
    erreur.name = "ErreurDeBase";
    throw erreur;
  },
}) as unknown as BaseMenage;

const BILAN_VIDE: BilanMenageSocial = {
  medias: 0, conversations: 0, sorties: 0, conversationsVides: 0, demandesBande: 0, demandesSuivi: 0, invitationsSorties: 0, invitationsGroupes: 0,
  invitationsCoAuteurs: 0, departsGroupes: 0, clesIdempotence: 0, cloche: 0, masques: 0, contenusRetires: 0, commentairesSupprimes: 0,
  fichiersOrphelins: 0, rechiffrement: null, etapesRatees: [],
};

test("seuils : les durées décidées (90 jours, 1 an, 30 jours, 24 h, 6 et 13 mois)", () => {
  const s = calculerSeuilsMenageSocial(T);
  assert.deepEqual(s, {
    medias: T, conversations: ilYa(365), demandesBande: ilYa(30), demandesSuivi: ilYa(30), invitationsGroupes: ilYa(30), coAuteurs: ilYa(30),
    sortiesPassees: T, departs: ilYa(30), cles: ilYa(1), cloche: ilYa(90), clocheModeration: ilYa(183), masques: ilYa(395),
    contenusRetires: ilYa(365), orphelins: ilYa(1),
  });
  assert.notEqual(s.medias, T, "une copie : le ménage ne peut pas déplacer maintenant");
});

test("lignes du journal : seulement ce qui ne vaut pas zéro, des nombres, et le rechiffrement même à zéro", () => {
  assert.deepEqual(decrireBilanMenageSocial(BILAN_VIDE), []);
  const lignes = decrireBilanMenageSocial({ ...BILAN_VIDE, medias: 3, invitationsGroupes: 2, cloche: 40 });
  assert.deepEqual(lignes, [
    [3, "Médias du chat effacés (90 jours)"],
    [2, "Invitations à des groupes expirées (30 jours)"],
    [40, "Notifications de la cloche effacées (90 jours ou au-delà de 200)"],
  ]);
  const rotation = decrireBilanMenageSocial({ ...BILAN_VIDE, rechiffrement: { rechiffres: 0, illisibles: 0, restants: 0 }, etapesRatees: ["cloche"] });
  assert.deepEqual(rotation, [
    [0, "Chiffrés sociaux réécrits avec la nouvelle clé (0 illisible(s), 0 restant(s))"],
    [1, "Ménage social : étape(s) ratée(s) (cloche), voir le journal du serveur"],
  ], "« 0 restant(s) » : l'ancienne clé n'est plus utile à la partie sociale");
});

/** Une clé v1, puis la v2 qui garde la v1 en ancienne (changement de clé en cours) */
function deuxCles() {
  const ancienne = randomBytes(32);
  const v1 = creerChiffrementDonnees(ancienne);
  const v2 = creerChiffrementDonnees(randomBytes(32), { version: 2, anciennes: [{ version: 1, cle: ancienne }] });
  return { v1, v2, s1: creerChiffrementSocial(v1)!, s2: creerChiffrementSocial(v2)! };
}

test("rechiffrer un texte : relu avec l'ancienne clé, réécrit avec la courante, même contexte", () => {
  const { s1, s2 } = deuxCles();
  const idClient = randomUUID();
  const ancien = s1.chiffrerMessage("Coucou la Brigade", 42, idClient);
  const contexte = CONTEXTES_SOCIAUX.message(42, idClient);
  const nouveau = rechiffrerTexteSocial(s2, "textes", contexte, ancien);
  assert.ok(nouveau?.startsWith("v2:") && ancien.startsWith("v1:"));
  assert.equal(s2.dechiffrerMessage(nouveau!, 42, idClient), "Coucou la Brigade");
  assert.equal(rechiffrerTexteSocial(s2, "textes", contexte, nouveau!), null, "déjà à la clé courante : rien à faire");
  assert.throws(() => rechiffrerTexteSocial(s2, "textes", CONTEXTES_SOCIAUX.message(42, randomUUID()), ancien), "déplacé vers un autre message : illisible");
  assert.throws(() => rechiffrerTexteSocial(s2, "textes", contexte, "v1:abc:def:ghi"), "abîmé : illisible");
  const code = rechiffrerTexteSocial(s2, "invitations", CONTEXTES_SOCIAUX.code(7), s1.chiffrerCode("CODESECRET23", 7));
  assert.equal(s2.dechiffrerCode(code!, 7), "CODESECRET23");
  const instantane = rechiffrerTexteSocial(s2, "instantanes", CONTEXTES_SOCIAUX.instantane(3), s1.chiffrerInstantane('{"texte":"x"}', 3));
  assert.equal(s2.dechiffrerInstantane(instantane!, 3), '{"texte":"x"}');
  // Sans l'ancienne clé, rien ne se relit (c'est pourquoi on ne la retire qu'à « 0 restant(s) »)
  const sansAncienne = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32), { version: 2 }))!;
  assert.throws(() => rechiffrerTexteSocial(sansAncienne, "textes", contexte, ancien));
});

test("rechiffrer un fichier : un nouveau nom, jamais l'ancien écrasé ; l'ancien nom ne relit pas le nouveau", () => {
  const { s1, s2 } = deuxCles();
  const medias = creerStockageMediasChatEnMemoire();
  const [ancien, nouveau] = [medias.tirerNom(), medias.tirerNom()];
  const chiffre = s1.chiffrerOctets(Buffer.from("photo de pâtes"), ancien);
  const rechiffre = rechiffrerMediaSocial(s2, chiffre, ancien, nouveau)!;
  assert.equal(s2.estAncienOctets(rechiffre), false);
  assert.equal(s2.dechiffrerOctets(rechiffre, nouveau).toString(), "photo de pâtes");
  assert.throws(() => s2.dechiffrerOctets(rechiffre, ancien), "le contexte suit le nom du fichier");
  assert.equal(rechiffrerMediaSocial(s2, rechiffre, nouveau, medias.tirerNom()), null);
  assert.throws(() => rechiffrerMediaSocial(s2, Buffer.from("pas un chiffré"), ancien, nouveau));
});

test("rechiffrement : rien n'est lu sans changement de clé", async () => {
  const medias = creerStockageMediasChatEnMemoire();
  assert.equal(await rechiffrerSocial(null, medias, baseEnPanne), null);
  assert.equal(await rechiffrerSocial(creerChiffrementDonnees(randomBytes(32)), medias, baseEnPanne), null, "une seule clé : rien à faire");
});

test("une étape qui échoue n'arrête pas les autres ; le journal ne garde que le nom et le code", async () => {
  const notes: string[] = [];
  const avant = console.error;
  console.error = (...morceaux: unknown[]) => void notes.push(morceaux.map(String).join(" "));
  let bilan: BilanMenageSocial;
  try {
    bilan = await faireLeMenageSocial({ medias: creerStockageMediasChatEnMemoire(), chiffrement: null, maintenant: T, base: baseEnPanne });
  } finally {
    console.error = avant;
  }
  assert.deepEqual(bilan.etapesRatees, ["médias", "conversations", "conversations vides", "demandes", "cloche", "masques", "contenus retirés"],
    "les fichiers orphelins (dossier vide) et le rechiffrement (pas d'ancienne clé) passent quand même");
  assert.deepEqual([bilan.fichiersOrphelins, bilan.rechiffrement], [0, null]);
  assert.equal(notes.length, 7);
  assert.ok(notes.every((n) => n.includes("ErreurDeBase") && !n.includes("Coucou")), "jamais le message d'une erreur (il peut citer un contenu)");
  assert.deepEqual(decrireBilanMenageSocial(bilan).at(-1)?.[0], 7);
});
