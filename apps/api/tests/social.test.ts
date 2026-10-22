// Tests du socle social de l'app (/app/social, /app/personnes, /app/masques) : profil social jamais créé par une lecture,
// pseudo obligatoire pour écrire, recherche, niveaux de profil, abonnés réservés à la bande, masques, pouls et suggestions.
// Tout en mémoire (aucune base), avec une clé de test.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import type { Request } from "express";

import { ChampInvalide } from "../src/controleurs/gestion/lire-champs.ts";
import { lireIdClient, lireListeIdentifiantsPublics, lireTexteSocial, RefusSocial } from "../src/controleurs/social-champs.ts";
import { creerIdPublic } from "../src/fonctions/social/creer-id-public.ts";
import { ecrireCurseurDate } from "../src/fonctions/social/ecrire-curseur-date.ts";
import { ecrireCurseurPersonne } from "../src/fonctions/social/ecrire-curseur-personne.ts";
import { estVisiblePourMoi } from "../src/fonctions/social/est-visible-pour-moi.ts";
import { lireCurseurDate } from "../src/fonctions/social/lire-curseur-date.ts";
import { lireCurseurPersonne } from "../src/fonctions/social/lire-curseur-personne.ts";
import { lireIdentifiantPublic } from "../src/fonctions/social/lire-identifiant-public.ts";
import { presenterProfil } from "../src/fonctions/social/presenter-profil.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

// Les versions Prisma se branchent sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (doubles de tables)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerRelationsSociales } = await import("../src/services/relations-sociales.ts");
const { creerSocial } = await import("../src/services/social.ts");

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);

test("identifiant public, curseurs et visibilité : formes et refus", () => {
  let n = 0;
  const id = creerIdPublic((max) => (n++ * 7) % max);
  assert.match(id, /^[a-z2-9]{10}$/);
  assert.equal(lireIdentifiantPublic(id), id);
  for (const faux of ["abc", "ABCDEFGHJK", "abcdefghij1", "abcdefghi0", 42, null]) assert.equal(lireIdentifiantPublic(faux), null);
  const quand = new Date("2026-10-14T10:00:00.123Z");
  assert.deepEqual(lireCurseurDate(ecrireCurseurDate(quand, 42)), { date: quand, id: 42 });
  assert.equal(lireCurseurDate(undefined), null);
  assert.equal(lireCurseurDate(""), null);
  for (const faux of ["%%%", ["a", "b"], Buffer.from("2026-02-30T10:00:00.000Z_3").toString("base64url"), Buffer.from("n'importe quoi").toString("base64url")]) {
    assert.equal(lireCurseurDate(faux), undefined);
  }
  assert.deepEqual(lireCurseurPersonne(ecrireCurseurPersonne(quand, "k7mq2x9pa4")), { date: quand, idPublic: "k7mq2x9pa4" });
  assert.equal(lireCurseurPersonne(undefined), null);
  for (const faux of [ecrireCurseurDate(quand, 42), Buffer.from("2026-10-14T10:00:00.000Z_K7MQ2X9PA4").toString("base64url"), "%%%"]) {
    assert.equal(lireCurseurPersonne(faux), undefined, "jamais un id de compte, ni un identifiant mal formé");
  }
  assert.equal(estVisiblePourMoi(null, new Set([3])), true, "un compte supprimé reste visible");
  assert.equal(estVisiblePourMoi(3, new Set([3])), false);
});

test("presenterProfil : ville, gardes et lieux sauvés jamais hors de la bande", () => {
  const personne = { id: "abcdefghij", pseudo: "lea", prenom: "Léa", avatar: null };
  const bande = { ville: "Nantes", points: 30, palier: "curieux", pointsDuMois: 4, rescoussesDuMois: 2, lieuxSauves: [1], gardes: [2] };
  const relation = { pote: false, demandeBande: null, jeSuis: "aucun" as const, meSuit: false, meDemande: false, bloque: false };
  const base = { personne, prive: false, relation, compteurs: { abonnes: 3, abonnements: 1 }, badges: ["premier-sauveteur"], listes: [], bande, activitePartagee: true };
  assert.equal(presenterProfil({ ...base, niveau: "public" }).bande, undefined);
  assert.equal(presenterProfil({ ...base, niveau: "prive" }).badges, undefined);
  assert.deepEqual(presenterProfil({ ...base, niveau: "bande", relation: { ...relation, pote: true } }).bande, bande);
  const cache = presenterProfil({ ...base, niveau: "bande", relation: { ...relation, pote: true }, activitePartagee: false }).bande;
  assert.deepEqual(cache, { ...bande, pointsDuMois: 0, rescoussesDuMois: 0, lieuxSauves: [], gardes: [] });
  const bloquee = presenterProfil({ ...base, niveau: "public", relation: { ...relation, bloque: true } });
  assert.deepEqual([bloquee.niveau, bloquee.compteurs, bloquee.badges], ["prive", { abonnes: 0, abonnements: 0 }, undefined]);
});

test("lecteurs sociaux : texte filtré (message-refuse), identifiants publics, idClient du corps ou de l'en-tête", () => {
  const champ = (nom: string) => (e: unknown) => e instanceof ChampInvalide && e.champ === nom;
  assert.equal(lireTexteSocial({ mot: "  Le pain bâtard est top  " }, "mot", 140, true), "Le pain bâtard est top");
  assert.equal(lireTexteSocial({ mot: "   " }, "mot", 140, false), null);
  assert.equal(lireTexteSocial({}, "mot", 140, false), null);
  assert.throws(() => lireTexteSocial({}, "mot", 140, true), champ("mot"));
  assert.throws(() => lireTexteSocial({ mot: "x".repeat(141) }, "mot", 140, true), champ("mot"));
  assert.throws(() => lireTexteSocial({ mot: 12 }, "mot", 140, false), champ("mot"));
  assert.throws(
    () => lireTexteSocial({ mot: "espèce de connard" }, "mot", 140, true),
    (e: unknown) => e instanceof RefusSocial && e.erreur === "message-refuse" && e.statut === 400 && e.champ === "mot",
  );
  assert.deepEqual(lireListeIdentifiantsPublics({ invites: ["abcdefghij", "abcdefghij", "k7mq2x9pa4"] }, "invites", 3), ["abcdefghij", "k7mq2x9pa4"]);
  assert.throws(() => lireListeIdentifiantsPublics({ invites: ["abcdefghij", "PAS-BON"] }, "invites", 3), champ("invites"));
  assert.throws(() => lireListeIdentifiantsPublics({ invites: ["abcdefghij", "bcdefghijk"] }, "invites", 1), champ("invites"));
  const uuid = "3f1c2b8e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";
  const requete = (body: unknown, entete?: string) => ({ body, get: (nom: string) => (nom === "idempotency-key" ? entete : undefined) }) as unknown as Request;
  assert.equal(lireIdClient(requete({ idClient: uuid })), uuid);
  assert.equal(lireIdClient(requete(undefined, uuid)), uuid);
  for (const faux of [uuid.toUpperCase(), "3f1c2b8e-9d4a-1c6b-8e2f-1a2b3c4d5e6f", 42]) assert.throws(() => lireIdClient(requete({ idClient: faux })), champ("idClient"));
  assert.throws(() => lireIdClient(requete({})), champ("idClient"));
});

test("relations en mémoire : liens dans les deux sens, push, clés d'idempotence", async () => {
  const [a, b, c] = [await banc.creerPersonne(), await banc.creerPersonne(), await banc.creerPersonne({ sansProfil: true })];
  const { relations } = banc.social.dependances;
  banc.rendrePotes(a, b);
  banc.suivre(b, a, "demande");
  banc.tables.demandes.push({ deId: a.compteId, aId: c.compteId, creeLe: date(), refuseeLe: date() });
  const liens = await relations.lireLiens(a.compteId, [b.compteId, c.compteId, a.compteId]);
  assert.deepEqual([...liens.keys()], [b.compteId, c.compteId], "jamais de lien avec soi-même");
  assert.deepEqual([liens.get(b.compteId)?.pote, liens.get(b.compteId)?.meDemande, liens.get(b.compteId)?.jeSuis], [true, true, "aucun"]);
  assert.equal(liens.get(c.compteId)?.demandeBande, "envoyee", "refusée en silence : toujours « envoyée »");
  assert.equal(await relations.trouverCompte(a.idPublic!, b.compteId), a.compteId);
  banc.bloquer(a, b);
  assert.equal(await relations.trouverCompte(a.idPublic!, b.compteId), null, "elle m'a bloqué : inconnue pour moi");
  assert.equal(await relations.trouverCompte(b.idPublic!, a.compteId), b.compteId, "celle que j'ai bloquée se trouve encore");
  assert.deepEqual([await relations.bloqueEntre(a.compteId, b.compteId), await relations.bloqueEntre(b.compteId, a.compteId)], [true, true]);
  assert.equal((await relations.presenter([a.compteId, c.compteId])).size, 1, "sans profil social : absent");
  await b.demander("PATCH", "/app/social/moi", { pushSocial: false });
  assert.deepEqual([...(await relations.lirePushSocial([a.compteId, b.compteId, c.compteId]))], [a.compteId]);
  const cle = "3f1c2b8e-9d4a-4c6b-8e2f-1a2b3c4d5e6f";
  assert.equal(await relations.lireIdempotence(a.compteId, cle, "groupe"), null);
  assert.equal(await relations.noterIdempotence(a.compteId, cle, "groupe", 12, date()), true);
  assert.equal(await relations.noterIdempotence(a.compteId, cle, "groupe", 13, date()), false, "deux envois en même temps : le second relit le premier");
  assert.equal(await relations.lireIdempotence(a.compteId, cle, "groupe"), 12);
  assert.equal(await relations.lireIdempotence(a.compteId, cle, "liste"), null);
  assert.equal(await relations.lireIdempotence(b.compteId, cle, "groupe"), null, "une clé est propre à chaque compte");
});

test("une lecture ne crée jamais le profil social ; écrire demande un pseudo, pas lire ni masquer", async () => {
  const sansProfil = await banc.creerPersonne({ sansProfil: true });
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  const avant = banc.tables.profils.size;
  for (const p of [sansProfil, sansPseudo]) {
    const moi = await p.demander("GET", "/app/social/moi");
    assert.deepEqual([moi.statut, moi.corps.moi], [200, null]);
    assert.equal(moi.entetes.get("cache-control"), "private, no-store");
    const pouls = await p.demander("GET", "/app/social/pouls");
    assert.equal(pouls.statut, 200);
    assert.deepEqual(pouls.corps.pouls.bande, { signature: "" });
    assert.equal(pouls.corps.pouls.messages.signature, "");
    assert.equal((await p.demander("GET", "/app/cloche")).statut, 200);
    assert.equal((await p.demander("POST", "/app/cloche/vu")).statut, 200);
    assert.equal((await p.demander("PUT", "/app/masques/suggestion/personne:abcdefghij")).statut, 200);
    assert.equal((await p.demander("GET", "/app/personnes/suggestions")).statut, 200);
    assert.equal((await p.demander("POST", "/app/personnes/recherche", { debut: "zz" })).statut, 200);
    // Les listes des domaines : conversations, sorties et listes de lieux, vides
    const vides = [
      [await p.demander("GET", "/app/conversations"), { ok: true, conversations: [], invitations: [], suite: null, epinglees: [] }],
      [await p.demander("GET", "/app/sorties"), { ok: true, sorties: [], invitations: [] }],
      [await p.demander("GET", "/app/listes"), { ok: true, miennes: [], coEcrites: [], suivies: [], invitations: [] }],
      [await p.demander("GET", "/app/listes/a-decouvrir"), { ok: true, listes: [], suite: null }],
    ] as const;
    for (const [r, attendu] of vides) assert.deepEqual([r.statut, r.corps], [200, attendu]);
  }
  assert.equal(banc.tables.profils.size, avant, "aucune ligne profils_sociaux");
  for (const [methode, corps] of [["POST", undefined], ["PATCH", { trouvable: false }]] as const) {
    const refus = await sansPseudo.demander(methode, "/app/social/moi", corps);
    assert.deepEqual([refus.statut, refus.corps.erreur], [409, "pseudo-requis"]);
  }
  assert.equal((await banc.demander("GET", "/app/social/moi")).statut, 401, "sans session");
});

test("POST /app/social/moi crée le profil une seule fois, même avec trois demandes en même temps", async () => {
  const p = await banc.creerPersonne({ sansProfil: true, pseudo: "trois.fois" });
  const reponses = await Promise.all([1, 2, 3].map(() => p.demander("POST", "/app/social/moi")));
  assert.deepEqual(reponses.map((r) => r.statut).sort(), [200, 200, 201]);
  assert.equal(new Set(reponses.map((r) => r.corps.moi.personne.id)).size, 1);
  assert.match(reponses[0].corps.moi.personne.id, /^[a-z2-9]{10}$/);
  assert.equal([...banc.tables.profils.values()].filter((l) => l.compteId === p.compteId).length, 1);
  assert.deepEqual(reponses[0].corps.moi.reglages, { trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true, accusesLecture: true, apercuMessages: true });
  const modifie = await p.demander("PATCH", "/app/social/moi", { trouvable: false, pushSocial: false });
  assert.deepEqual(modifie.corps.moi.reglages, { trouvable: false, suggerable: true, activitePartagee: true, pushSocial: false, accusesLecture: true, apercuMessages: true });
  const messagerie = await p.demander("PATCH", "/app/social/moi", { accusesLecture: false, apercuMessages: false });
  assert.deepEqual([messagerie.corps.moi.reglages.accusesLecture, messagerie.corps.moi.reglages.apercuMessages], [false, false]);
  assert.deepEqual([banc.tables.profils.get(p.compteId)!.accusesLecture, banc.tables.profils.get(p.compteId)!.apercuMessages], [false, false]);
  assert.equal((await p.demander("GET", "/app/social/moi")).corps.moi.reglages.accusesLecture, false);
  const refusLu = await p.demander("PATCH", "/app/social/moi", { accusesLecture: "non" });
  assert.deepEqual([refusLu.statut, refusLu.corps.champ], [400, "accusesLecture"]);
  const refus = await p.demander("PATCH", "/app/social/moi", { suggerable: "oui" });
  assert.deepEqual([refus.statut, refus.corps.erreur, refus.corps.champ], [400, "champ-invalide", "suggerable"]);
});

test("recherche par le corps : exact en tête, 10 au plus, ni bloqués (des deux côtés), ni introuvables, ni sans profil", async () => {
  const moi = await banc.creerPersonne({ pseudo: "chercheuse" });
  const exacte = await banc.creerPersonne({ pseudo: "tom" });
  const autres: PersonneDeTest[] = [];
  for (let i = 0; i < 12; i++) autres.push(await banc.creerPersonne({ pseudo: `tom.${String(i).padStart(2, "0")}` }));
  const jeBloque = await banc.creerPersonne({ pseudo: "tom_bloque" });
  const meBloque = await banc.creerPersonne({ pseudo: "tom_bloqueur" });
  const introuvable = await banc.creerPersonne({ pseudo: "tom_cache" });
  await banc.creerPersonne({ pseudo: "tom_sans_profil", sansProfil: true });
  banc.bloquer(moi, jeBloque);
  banc.bloquer(meBloque, moi);
  await introuvable.demander("PATCH", "/app/social/moi", { trouvable: false });
  banc.rendrePotes(moi, autres[0]);
  const r = await moi.demander("POST", "/app/personnes/recherche", { debut: "@TOM" });
  assert.equal(r.statut, 200);
  assert.equal(r.corps.resultats.length, 10);
  assert.deepEqual(r.corps.resultats[0], { personne: { id: exacte.idPublic, pseudo: "tom", prenom: r.corps.resultats[0].personne.prenom, avatar: null }, pote: false, prive: false });
  const pseudos = r.corps.resultats.map((x: { personne: { pseudo: string } }) => x.personne.pseudo);
  for (const absent of ["tom_bloque", "tom_bloqueur", "tom_cache", "tom_sans_profil", "chercheuse"]) assert.ok(!pseudos.includes(absent), absent);
  assert.equal(r.corps.resultats.find((x: { personne: { pseudo: string } }) => x.personne.pseudo === "tom.00")?.pote, true);
  // « _ » n'est pas un joker : « tom_ » ne trouve que les pseudos qui ont vraiment un « _ »
  const souligne = await moi.demander("POST", "/app/personnes/recherche", { debut: "tom_" });
  assert.deepEqual(souligne.corps.resultats, []);
  for (const debut of ["t", "x".repeat(21), 42]) assert.equal((await moi.demander("POST", "/app/personnes/recherche", { debut })).corps.champ, "debut");
  assert.deepEqual((await moi.demander("POST", "/app/personnes/recherche", { debut: "é!" })).corps, { ok: true, resultats: [] });
});

test("recherche : 150 par 10 minutes et par compte, puis 429 avec Retry-After", async () => {
  const p = await banc.creerPersonne({ pseudo: "frappe.rapide" });
  const reponses = [];
  for (let i = 0; i < 151; i++) reponses.push(await p.demander("POST", "/app/personnes/recherche", { debut: "ab" }));
  assert.equal(reponses.slice(0, 150).every((r) => r.statut === 200), true);
  assert.equal(reponses[150].statut, 429);
  assert.ok(Number(reponses[150].entetes.get("retry-after")) > 0);
});

test("niveaux de profil : inconnu, privé, abonné, bande, activité non partagée, blocages", async () => {
  const moi = await banc.creerPersonne({ pseudo: "visiteuse" });
  const publique = await banc.creerPersonne({ pseudo: "publique", ville: "Lyon" });
  const privee = await banc.creerPersonne({ pseudo: "privee", prive: true });
  const pote = await banc.creerPersonne({ pseudo: "pote.fidele", ville: "Brest" });
  banc.rendrePotes(moi, pote);
  for (const p of [publique, pote]) {
    banc.tables.gardes.push({ compteId: p.compteId, lieuId: 7, creeLe: date() });
    banc.tables.rescousses.push({ compteId: p.compteId, lieuId: 9, creeLe: date() });
    banc.tables.journalPoints.push({ compteId: p.compteId, points: 2, creeLe: date() });
  }
  banc.memoire.comptes.get(publique.compteId)!.badges = ["premier-sauveteur"];
  const lire = async (p: PersonneDeTest) => (await moi.demander("GET", `/app/personnes/${p.idPublic}`)).corps.profil;

  const vitrine = await lire(publique);
  assert.deepEqual([vitrine.niveau, vitrine.badges, vitrine.bande], ["public", ["premier-sauveteur"], undefined]);
  assert.equal(JSON.stringify(vitrine).includes("Lyon"), false, "la ville reste à la bande");
  const fermee = await lire(privee);
  assert.deepEqual([fermee.niveau, fermee.badges, fermee.listes], ["prive", undefined, undefined]);
  banc.suivre(moi, privee);
  assert.equal((await lire(privee)).niveau, "public", "abonné accepté d'un compte privé");
  const bande = await lire(pote);
  assert.deepEqual(bande.bande, { ville: "Brest", points: 0, palier: "curieux", pointsDuMois: 2, rescoussesDuMois: 1, lieuxSauves: [9], gardes: [7] });
  assert.equal(bande.relation.pote, true);
  await pote.demander("PATCH", "/app/social/moi", { activitePartagee: false });
  const discret = await lire(pote);
  assert.deepEqual([discret.bande.ville, discret.bande.lieuxSauves, discret.bande.gardes], ["Brest", [], []]);
  const toi = (await moi.demander("GET", `/app/personnes/${moi.idPublic}`)).corps.profil;
  assert.deepEqual([toi.niveau, toi.relation], ["bande", null]);

  banc.bloquer(moi, publique);
  const bloquee = await lire(publique);
  assert.deepEqual([bloquee.niveau, bloquee.relation.bloque, bloquee.badges], ["prive", true, undefined]);
  banc.bloquer(privee, moi);
  const cachee = await moi.demander("GET", `/app/personnes/${privee.idPublic}`);
  assert.deepEqual([cachee.statut, cachee.corps.erreur], [404, "personne-inconnue"], "elle m'a bloquée : inconnue");
  assert.equal((await moi.demander("GET", "/app/personnes/zzzzzzzzzz")).statut, 404);
  assert.deepEqual((await moi.demander("GET", "/app/personnes/PAS-UN-ID")).corps, { ok: false, erreur: "champ-invalide", champ: "personne" });
});

test("abonnés et abonnements réservés à la bande : 404 avant 403, pages de 50, sans les personnes bloquées", async () => {
  const moi = await banc.creerPersonne({ pseudo: "curieuse" });
  const star = await banc.creerPersonne({ pseudo: "star" });
  const inconnue = await moi.demander("GET", "/app/personnes/zzzzzzzzzz/abonnes");
  assert.equal(inconnue.statut, 404, "404 avant 403");
  const fermee = await moi.demander("GET", `/app/personnes/${star.idPublic}/abonnes`);
  assert.deepEqual([fermee.statut, fermee.corps.erreur], [403, "profil-prive"]);
  banc.rendrePotes(moi, star);
  const fans: PersonneDeTest[] = [];
  for (let i = 0; i < 52; i++) {
    const fan = await banc.creerPersonne({ pseudo: `fan.${i}` });
    banc.suivre(fan, star, "accepte", date(i * 1000));
    fans.push(fan);
  }
  banc.suivre(await banc.creerPersonne({ pseudo: "fan.en.attente" }), star, "demande");
  banc.bloquer(fans[51], moi);
  const page1 = await moi.demander("GET", `/app/personnes/${star.idPublic}/abonnes`);
  assert.equal(page1.statut, 200);
  assert.equal(page1.corps.liens.length, 50);
  assert.equal(page1.corps.liens[0].personne.pseudo, "fan.50", "le plus récent d'abord, sans la personne bloquée");
  // La suite n'est que du base64url : elle ne porte que la date et l'identifiant public, jamais l'id d'un compte
  const lu = Buffer.from(page1.corps.suite, "base64url").toString("utf8");
  assert.equal(lu, `${date(1000).toISOString()}_${fans[1].idPublic}`, "la date et l'identifiant public, rien d'autre");
  const page2 = await moi.demander("GET", `/app/personnes/${star.idPublic}/abonnes?apres=${page1.corps.suite}`);
  assert.deepEqual(page2.corps.liens.map((l: { personne: { pseudo: string } }) => l.personne.pseudo), ["fan.0"]);
  assert.equal(page2.corps.suite, null);
  const ancienFormat = await moi.demander("GET", `/app/personnes/${star.idPublic}/abonnes?apres=${ecrireCurseurDate(date(1000), fans[1].compteId)}`);
  assert.deepEqual([ancienFormat.statut, ancienFormat.corps.champ], [400, "apres"], "un id de compte n'est jamais accepté en curseur");
  assert.equal((await moi.demander("GET", `/app/personnes/${star.idPublic}/abonnes?apres=nimporte%25quoi`)).corps.champ, "apres");
  const abonnements = await fans[0].demander("GET", `/app/personnes/${fans[0].idPublic}/abonnements`);
  assert.deepEqual(abonnements.corps.liens.map((l: { personne: { id: string } }) => l.personne.id), [star.idPublic], "les miens, toujours");
});

test("listes d'un profil : « bande » pour la bande, signalée cachée pour soi, en modération pour son auteur seulement", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "autrice.listes" });
  const pote = await banc.creerPersonne({ pseudo: "pote.listes" });
  const inconnu = await banc.creerPersonne({ pseudo: "inconnu.listes" });
  banc.rendrePotes(auteur, pote);
  banc.tables.lieux.set(1, { statut: "publie" });
  banc.tables.lieux.set(2, { statut: "brouillon" });
  const ajouterListe = (id: number, visibilite: string, enPlus: Record<string, unknown> = {}) => banc.tables.listes.set(id, {
    id, auteurId: auteur.compteId, titre: `Liste ${id}`, emoji: "🍜", description: "", visibilite, suspendueLe: null, retireeLe: null,
    creeLe: date(), modifieLe: date(id * 1000), ...enPlus,
  });
  ajouterListe(101, "tous");
  ajouterListe(102, "bande");
  ajouterListe(103, "tous", { suspendueLe: date() });
  banc.tables.lieuxListes.push({ listeId: 101, lieuId: 1, ajouteParId: auteur.compteId, creeLe: date() }, { listeId: 101, lieuId: 2, ajouteParId: auteur.compteId, creeLe: date() });
  const ids = async (p: PersonneDeTest) => (await p.demander("GET", `/app/personnes/${auteur.idPublic}/listes`)).corps.listes.map((l: { id: string }) => l.id);
  assert.deepEqual(await ids(inconnu), ["101"]);
  assert.deepEqual(await ids(pote), ["102", "101"]);
  const miennes = (await auteur.demander("GET", `/app/personnes/${auteur.idPublic}/listes`)).corps.listes;
  assert.deepEqual(miennes.map((l: { id: string; enModeration?: boolean }) => [l.id, l.enModeration ?? false]), [["103", true], ["102", false], ["101", false]]);
  assert.equal(miennes.find((l: { id: string }) => l.id === "101").nombreLieux, 1, "seulement les lieux publiés");
  banc.tables.signalements.set(1, { id: 1, cible: "liste", cibleId: "101", signaleParId: inconnu.compteId } as never);
  assert.deepEqual(await ids(inconnu), [], "signalée : cachée pour moi");
  const profil = (await inconnu.demander("GET", `/app/personnes/${auteur.idPublic}`)).corps.profil;
  assert.deepEqual(profil.listes, []);
});

test("masques : retirer de sa vue, annuler, 2 000 au plus", async () => {
  const p = await banc.creerPersonne({ pseudo: "range.tout" });
  assert.equal((await p.demander("PUT", "/app/masques/activite/rescousse:118")).statut, 200);
  assert.equal((await p.demander("PUT", "/app/masques/activite/rescousse:118")).statut, 200, "déjà là : rien de plus");
  assert.equal((await p.demander("PUT", "/app/masques/lieu-recu/lieu:13")).statut, 200);
  const tous = await p.demander("GET", "/app/masques");
  assert.deepEqual(tous.corps.masques, [{ cible: "lieu-recu", cibleId: "lieu:13" }, { cible: "activite", cibleId: "rescousse:118" }]);
  assert.deepEqual((await p.demander("GET", "/app/masques?cible=activite")).corps.masques, [{ cible: "activite", cibleId: "rescousse:118" }]);
  assert.equal((await p.demander("DELETE", "/app/masques/activite/rescousse:118")).statut, 200);
  assert.equal((await p.demander("GET", "/app/masques?cible=activite")).corps.masques.length, 0);
  assert.equal((await p.demander("PUT", "/app/masques/publication/12")).corps.champ, "cible");
  assert.equal((await p.demander("PUT", "/app/masques/sortie/PAS%20BON")).corps.champ, "cibleId");
  assert.equal((await p.demander("GET", "/app/masques?cible=nimporte")).corps.champ, "cible");
  for (let i = 0; i < 1999; i++) banc.tables.masques.push({ compteId: p.compteId, cible: "sortie", cibleId: String(i), creeLe: date() });
  const plein = await p.demander("PUT", "/app/masques/sortie/plein");
  assert.deepEqual([plein.statut, plein.corps.erreur], [409, "trop-de-masques"]);
});

test("le pouls bouge : bande, demandes, cloche, non-lus (blocages dans les deux sens), invitations à un groupe", async () => {
  const moi = await banc.creerPersonne({ pseudo: "pouls" });
  const lea = await banc.creerPersonne({ pseudo: "lea.pouls" });
  const bloque = await banc.creerPersonne({ pseudo: "bloque.pouls" });
  const lire = async () => (await moi.demander("GET", "/app/social/pouls")).corps.pouls;
  const avant = await lire();
  assert.deepEqual([avant.messages.nonLus, avant.cloche.nonVues, avant.demandes.bande], [0, 0, 0]);
  banc.rendrePotes(moi, lea);
  banc.tables.demandes.push({ deId: bloque.compteId, aId: moi.compteId, creeLe: date(), refuseeLe: null });
  banc.suivre(lea, moi, "demande");
  const conversation = { id: 900, type: "groupe", clePrive: null, titreChiffre: null, emoji: "🍕", photo: null, creeParId: lea.compteId, version: 3, dernierMessageLe: date(), modifieLe: date(), creeLe: date() };
  banc.tables.conversations.set(900, conversation);
  for (const p of [moi, lea, bloque]) {
    banc.tables.membres.push({ conversationId: 900, compteId: p.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: date(), epingleeLe: null, luLe: null });
  }
  const message = (id: number, auteurId: number | null, enPlus: Record<string, unknown> = {}) => banc.tables.messages.set(id, {
    id, conversationId: 900, auteurId, type: "texte", idClient: `id-${id}`, texteChiffre: "v1:x", fichier: null, typeMime: null, taille: null,
    largeur: null, hauteur: null, dureeSecondes: null, mediaExpireLe: null, creeLe: date(), supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null, ...enPlus,
  });
  message(1, lea.compteId);
  message(2, lea.compteId, { supprimeLe: date() });
  message(3, moi.compteId);
  message(4, bloque.compteId);
  message(5, null);
  banc.bloquer(bloque, moi);
  banc.tables.invitationsGroupes.push({ conversationId: 901, compteId: moi.compteId, inviteParId: lea.compteId, statut: "invite", creeLe: date(), reponduLe: null });
  await banc.social.dependances.cloche.noter([{ compteId: moi.compteId, type: "nouvel-abonne", acteurId: lea.compteId }], date());
  const apres = await lire();
  assert.equal(apres.messages.nonLus, 2, "ni le mien, ni le supprimé, ni celui de quelqu'un qui m'a bloquée");
  assert.equal(apres.messages.invitations, 1);
  assert.deepEqual([apres.demandes.bande, apres.demandes.suivis, apres.cloche.nonVues], [1, 1, 1]);
  for (const champ of ["messages", "cloche", "demandes", "bande"] as const) assert.notEqual(apres[champ].signature, avant[champ].signature, champ);
  assert.equal(apres.sorties.signature, avant.sorties.signature, "rien n'a bougé du côté des sorties");
  assert.deepEqual(await lire(), apres, "relu sans changement : le même pouls");
  await moi.demander("POST", "/app/cloche/vu");
  assert.equal((await lire()).cloche.nonVues, 0);
});

test("suggestions : te suit, ta bande, potes de potes publics ; jamais suivi, bloqué, masqué ou privé", async () => {
  const moi = await banc.creerPersonne({ pseudo: "suggeree" });
  const fan = await banc.creerPersonne({ pseudo: "fan.sugg" });
  const pote = await banc.creerPersonne({ pseudo: "pote.sugg" });
  const amiDAmi = await banc.creerPersonne({ pseudo: "ami.ami" });
  const amiPrive = await banc.creerPersonne({ pseudo: "ami.prive", prive: true });
  const amiDiscret = await banc.creerPersonne({ pseudo: "ami.discret" });
  const dejaSuivi = await banc.creerPersonne({ pseudo: "deja.suivi" });
  const masque = await banc.creerPersonne({ pseudo: "masque.sugg" });
  banc.suivre(fan, moi);
  banc.rendrePotes(moi, pote);
  for (const p of [amiDAmi, amiPrive, amiDiscret, dejaSuivi, masque]) banc.rendrePotes(pote, p);
  banc.suivre(moi, dejaSuivi);
  await amiDiscret.demander("PATCH", "/app/social/moi", { suggerable: false });
  await moi.demander("PUT", `/app/masques/suggestion/personne:${masque.idPublic}`);
  const r = await moi.demander("GET", "/app/personnes/suggestions");
  assert.deepEqual(r.corps.suggestions.map((s: { personne: { pseudo: string }; raison: string }) => [s.personne.pseudo, s.raison]), [
    ["fan.sugg", "te-suit"], ["pote.sugg", "ta-bande"], ["ami.ami", "potes-en-commun"],
  ]);
});

test("abonnés, version Prisma : la suite porte l'identifiant public, le départage se fait par le compte retrouvé", async () => {
  const quand = new Date("2026-10-14T10:00:00.000Z");
  const lignes = Array.from({ length: 51 }, (_, i) => ({
    suiveurId: 100 + i, suiviId: 7, creeLe: quand, accepteLe: null, suiveur: { profilSocial: { idPublic: `fan${"abcdefghjk"[i % 10]}${"mnpqrstuvw"[Math.floor(i / 10)]}xyzab` } }, suivi: { profilSocial: { idPublic: "starzzzzzz" } },
  }));
  let filtre: unknown;
  const base = {
    profilSocial: { findUnique: async (a: { where: { idPublic: string } }) => (a.where.idPublic === "fanbmxyzab" ? { compteId: 4242 } : null) },
    suiviPersonne: { findMany: async (a: { where: unknown }) => ((filtre = a.where), lignes) },
  };
  const relations = {
    listerBlocages: async () => ({ parMoi: [], contreMoi: [], caches: new Set<number>() }),
    presenter: async (ids: readonly number[]) => new Map(ids.map((id) => [id, { id: `p${id}`, pseudo: `p${id}`, prenom: "P", avatar: null }])),
  };
  const social = creerSocial({ relations: relations as never, tirer: () => 0, base: base as never });
  const page = await social.listerLiens(7, 7, "abonnes", ecrireCurseurPersonne(quand, "fanbmxyzab"));
  assert.ok(page !== "ferme");
  assert.equal(Buffer.from(page.suite!, "base64url").toString("utf8"), `${quand.toISOString()}_${lignes[49].suiveur.profilSocial.idPublic}`);
  assert.match(JSON.stringify(filtre), /"suiveurId":\{"lt":4242\}/, "départage par le compte retrouvé, côté serveur");
  // Identifiant public parti depuis (compte supprimé) : la date seule
  await social.listerLiens(7, 7, "abonnes", ecrireCurseurPersonne(quand, "partizzzzz"));
  assert.doesNotMatch(JSON.stringify(filtre), /"lt":4242/);
});

test("lireLiens, version Prisma : ma demande passe avant la sienne, quel que soit l'ordre des lignes", async () => {
  const vide = async () => [];
  for (const ordre of [[{ deId: 2, aId: 1, refuseeLe: null }, { deId: 1, aId: 2, refuseeLe: new Date() }], [{ deId: 1, aId: 2, refuseeLe: new Date() }, { deId: 2, aId: 1, refuseeLe: null }]]) {
    const base = { membreBande: { findMany: vide }, blocage: { findMany: vide }, suiviPersonne: { findMany: vide }, demandeBande: { findMany: async () => ordre } };
    const liens = await creerRelationsSociales(base as never).lireLiens(1, [2]);
    assert.equal(liens.get(2)?.demandeBande, "envoyee");
  }
  const base = { membreBande: { findMany: vide }, blocage: { findMany: vide }, suiviPersonne: { findMany: vide }, demandeBande: { findMany: async () => [{ deId: 2, aId: 1, refuseeLe: null }] } };
  assert.equal((await creerRelationsSociales(base as never).lireLiens(1, [2])).get(2)?.demandeBande, "recue");
});

test("mentions : « trouvable: false » seulement pour sa bande et les suivis acceptés, jamais avec un blocage", async () => {
  const auteur = await banc.creerPersonne({ pseudo: "cite.tout" });
  const [discrete, pote, suivie, fan, bloquee, ouverte] = [
    await banc.creerPersonne({ pseudo: "m.discrete" }), await banc.creerPersonne({ pseudo: "m.pote" }), await banc.creerPersonne({ pseudo: "m.suivie" }),
    await banc.creerPersonne({ pseudo: "m.fan" }), await banc.creerPersonne({ pseudo: "m.bloquee" }), await banc.creerPersonne({ pseudo: "m.ouverte" }),
  ];
  for (const p of [discrete, pote, suivie, fan, bloquee]) await p.demander("PATCH", "/app/social/moi", { trouvable: false });
  banc.rendrePotes(auteur, pote);
  banc.suivre(auteur, suivie);
  banc.suivre(fan, auteur);
  banc.suivre(auteur, bloquee);
  banc.bloquer(bloquee, auteur);
  const carte = await banc.social.dependances.social.trouverMentions(auteur.compteId, ["M.Discrete", "m.pote", "m.suivie", "m.fan", "m.bloquee", "m.ouverte", "m.inconnue"]);
  assert.deepEqual(Object.fromEntries(carte), { "m.pote": pote.idPublic, "m.suivie": suivie.idPublic, "m.fan": fan.idPublic, "m.ouverte": ouverte.idPublic });
});

test("compte supprimé : ses lignes sociales partent avec lui (cascades), ses messages restent signés « Compte supprimé »", async () => {
  const a = await banc.creerPersonne({ pseudo: "reste.la" });
  const b = await banc.creerPersonne({ pseudo: "s.en.va" });
  banc.rendrePotes(a, b);
  banc.suivre(b, a);
  await banc.social.dependances.cloche.noter([{ compteId: a.compteId, type: "bande-ajout", acteurId: b.compteId }], date());
  banc.tables.conversations.set(950, { id: 950, type: "prive", clePrive: null, titreChiffre: null, emoji: null, photo: null, creeParId: b.compteId, version: 0, dernierMessageLe: date(), modifieLe: date(), creeLe: date() } as never);
  banc.tables.messages.set(9501, { id: 9501, conversationId: 950, auteurId: b.compteId, fichier: null } as never);
  banc.tables.reactions.push({ messageId: 9501, compteId: b.compteId, code: "miam", creeLe: date() } as never);
  const avant = (await a.demander("GET", "/app/social/pouls")).corps.pouls;
  await banc.supprimerCompte(b);
  const apres = (await a.demander("GET", "/app/social/pouls")).corps.pouls;
  assert.equal(banc.tables.profils.has(b.compteId), false);
  assert.equal(banc.tables.bande.some((l) => l.compteId === b.compteId || l.poteId === b.compteId), false);
  assert.equal(banc.tables.suivis.some((l) => l.suiveurId === b.compteId), false);
  assert.equal([...banc.tables.cloche.values()].some((l) => l.acteurId === b.compteId), false, "la cloche dont il est l'acteur part aussi");
  assert.notEqual(apres.bande.signature, avant.bande.signature);
  assert.equal(apres.cloche.nonVues, 0, "le pouls ne compte plus ce que la liste ne montre pas");
  assert.deepEqual([banc.tables.messages.get(9501)?.auteurId, banc.tables.conversations.get(950)?.creeParId, banc.tables.reactions.length], [null, null, 0]);
});
