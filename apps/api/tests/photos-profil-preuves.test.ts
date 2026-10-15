import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { lireAvatarPhoto } from "../../../packages/commun/src/validation/lire-avatar-photo.ts";
import { lirePhotoProfilSignalee, retirerPhotoProfil } from "../src/services/photos-profil.ts";
import type { SignalementPhotoEnMemoire } from "../src/services/photos-profil-en-memoire.ts";
import { creerBancPhotosProfil } from "./outils/creer-banc-photos-profil.ts";
import { avecDimensions } from "./outils/fabriquer-photos-avis.ts";

const PHOTO = avecDimensions(readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url)), 512, 512);
const MINUTE = 60_000;
const JOUR = 86_400_000;

let b: Awaited<ReturnType<typeof creerBancPhotosProfil>>;
let sansCle: Awaited<ReturnType<typeof creerBancPhotosProfil>>;
before(async () => {
  sansCle = await creerBancPhotosProfil({ sansCle: true });
  b = await creerBancPhotosProfil();
});
after(async () => {
  await b.fermer();
  await sansCle.fermer();
});

type Banc = typeof b;
let prochainSignalement = 0;
const envoyer = async (banc: Banc, jeton: string) => {
  const r = await banc.demander("POST", "/comptes/moi/photo", { jeton, octets: PHOTO });
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  return lireAvatarPhoto(r.corps!.avatar)!;
};
function signaler(banc: Banc, auteurContenuId: number, o: Partial<SignalementPhotoEnMemoire> = {}): SignalementPhotoEnMemoire {
  const s: SignalementPhotoEnMemoire = {
    id: ++prochainSignalement, cible: "profil", auteurContenuId, fichierMedia: null, creeLe: new Date(banc.banc.horloge + MINUTE),
    statut: "a-traiter", contesteLe: null, reexamineLe: null, traiteLe: null, ...o,
  };
  banc.donnees.signalements.push(s);
  return s;
}
const dechiffrer = (fichier: string) => b.chiffrement!.dechiffrerOctets(b.medias.fichiers.get(fichier)!.octets, fichier);

test("signalement ouvert : remplacée, l'ancienne photo quitte son dossier mais une copie CHIFFRÉE reste avec le signalement", async () => {
  const zoe = await b.inscrire();
  const ancienne = await envoyer(b, zoe.jeton);
  const octets = b.stockage.fichiers.get(ancienne)!.octets!;
  const s = signaler(b, zoe.id);
  b.banc.horloge += 2 * MINUTE;
  const nouvelle = await envoyer(b, zoe.jeton);
  assert.equal(b.stockage.fichiers.has(ancienne), false, "plus jamais servie");
  assert.ok(s.fichierMedia, "le signalement cite la copie");
  assert.equal(b.medias.fichiers.get(s.fichierMedia!)!.octets.includes(octets.subarray(0, 64)), false, "chiffrée sur le disque");
  assert.deepEqual(dechiffrer(s.fichierMedia!), octets);
  assert.deepEqual(await lirePhotoProfilSignalee(s.id), octets, "la modération la relit");
  assert.equal(b.memoire.comptes.get(zoe.id)!.photoProfil, nouvelle);
});

test("signalement jugé : copie gardée moins de 183 jours après la décision (ou un réexamen en attente), pas au-delà", async () => {
  const zoe = await b.inscrire();
  await envoyer(b, zoe.jeton);
  const debut = b.banc.horloge;
  const recent = signaler(b, zoe.id, { statut: "rejete", traiteLe: new Date(debut + 100 * JOUR) });
  const ancien = signaler(b, zoe.id, { statut: "retenu", traiteLe: new Date(debut + 2 * MINUTE) });
  const conteste = signaler(b, zoe.id, { statut: "retenu", traiteLe: new Date(debut + 2 * MINUTE), contesteLe: new Date(debut + 3 * MINUTE) });
  b.banc.horloge = debut + 200 * JOUR;
  await envoyer(b, zoe.jeton);
  assert.ok(recent.fichierMedia);
  assert.equal(conteste.fichierMedia, recent.fichierMedia, "une seule copie, citée par chaque signalement qui la garde");
  assert.equal(ancien.fichierMedia, null);
  b.banc.horloge = debut;
});

test("pas de copie pour un signalement d'avant la photo, ni pour un autre profil ; une preuve déjà là n'est pas remplacée", async () => {
  const zoe = await b.inscrire();
  const malo = await b.inscrire();
  const avant = signaler(b, zoe.id, { creeLe: new Date(b.banc.horloge - JOUR) });
  await envoyer(b, zoe.jeton);
  const autre = signaler(b, malo.id);
  const message = signaler(b, zoe.id, { cible: "message" });
  const dejaPreuve = signaler(b, zoe.id, { fichierMedia: "11111111-2222-4333-8444-555555555555.bin" });
  const medias = b.medias.fichiers.size;
  await envoyer(b, zoe.jeton);
  assert.equal(avant.fichierMedia, null);
  assert.equal(autre.fichierMedia, null);
  assert.equal(message.fichierMedia, null);
  assert.equal(dejaPreuve.fichierMedia, "11111111-2222-4333-8444-555555555555.bin");
  assert.equal(b.medias.fichiers.size, medias, "aucune copie");
});

test("retrait par la personne ou par l'équipe (retirerPhotoProfil) : même preuve gardée", async () => {
  const zoe = await b.inscrire("🦊");
  const premiere = await envoyer(b, zoe.jeton);
  const s1 = signaler(b, zoe.id);
  assert.deepEqual((await b.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton })).corps, { ok: true, avatar: "🦊" });
  assert.ok(s1.fichierMedia);
  assert.equal(b.stockage.fichiers.has(premiere), false);
  b.banc.horloge += 5 * MINUTE;
  const seconde = await envoyer(b, zoe.jeton);
  const s2 = signaler(b, zoe.id);
  const octets = b.stockage.fichiers.get(seconde)!.octets!;
  assert.deepEqual(await lirePhotoProfilSignalee(s2.id), octets, "encore affichée : la modération lit la photo actuelle");
  assert.deepEqual(await retirerPhotoProfil(zoe.id, "moderation"), { ok: true, avatar: "🦊", retiree: true });
  assert.equal(b.memoire.comptes.get(zoe.id)!.photoProfil, null);
  assert.equal(b.stockage.fichiers.has(seconde), false);
  assert.deepEqual(dechiffrer(s2.fichierMedia!), octets);
  assert.deepEqual(await retirerPhotoProfil(zoe.id, "moderation"), { ok: true, avatar: "🦊", retiree: false });
  assert.equal(await lirePhotoProfilSignalee(signaler(b, zoe.id, { cible: "message" }).id), null);
});

test("effacement du compte signalé : la photo quitte son dossier, la copie chiffrée reste pour la modération", async () => {
  const zoe = await b.inscrire();
  const nom = await envoyer(b, zoe.jeton);
  const octets = b.stockage.fichiers.get(nom)!.octets!;
  const s = signaler(b, zoe.id);
  assert.equal((await b.demander("DELETE", "/comptes/moi", { jeton: zoe.jeton, json: { motDePasse: b.MOT_DE_PASSE } })).statut, 200);
  assert.equal(b.stockage.fichiers.has(nom), false);
  assert.deepEqual(dechiffrer(s.fichierMedia!), octets);
});

test("sans clé des données : un remplacement qui devrait garder une preuve est refusé (503), l'effacement du compte passe", async () => {
  sansCle.brancher();
  try {
    const zoe = await sansCle.inscrire();
    const nom = await envoyer(sansCle, zoe.jeton);
    assert.equal((await sansCle.demander("POST", "/comptes/moi/photo", { jeton: zoe.jeton, octets: PHOTO })).statut, 201, "sans signalement, rien à garder");
    const actuelle = sansCle.memoire.comptes.get(zoe.id)!.photoProfil!;
    assert.equal(sansCle.stockage.fichiers.has(nom), false);
    signaler(sansCle, zoe.id);
    const r = await sansCle.demander("POST", "/comptes/moi/photo", { jeton: zoe.jeton, octets: PHOTO });
    assert.equal(r.statut, 503);
    assert.deepEqual(r.corps, { ok: false, erreur: "chiffrement-indisponible" });
    assert.equal(sansCle.memoire.comptes.get(zoe.id)!.photoProfil, actuelle);
    assert.deepEqual([...sansCle.stockage.fichiers.keys()].filter((f) => f !== actuelle && sansCle.stockage.fichiers.get(f)!.fiche?.compteId === zoe.id), []);
    assert.equal((await sansCle.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton })).statut, 503);
    assert.equal((await sansCle.demander("DELETE", "/comptes/moi", { jeton: zoe.jeton, json: { motDePasse: sansCle.MOT_DE_PASSE } })).statut, 200);
    assert.equal(sansCle.stockage.fichiers.has(actuelle), false);
  } finally {
    b.brancher();
  }
});

test("ménage de nuit : les photos qu'aucun compte ne cite partent après 24 h ; les autres restent", async () => {
  const zoe = await b.inscrire();
  const citee = await envoyer(b, zoe.jeton);
  const vieille = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg";
  const recente = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff.jpg";
  const depot = (age: number) => ({ octets: PHOTO, fiche: { compteId: zoe.id, deposeLe: new Date(b.banc.horloge - age) }, modifieLe: new Date(b.banc.horloge - age) });
  b.stockage.fichiers.set(vieille, depot(25 * 3600_000));
  b.stockage.fichiers.set(recente, depot(23 * 3600_000));
  b.banc.horloge += 2 * JOUR;
  b.stockage.fichiers.set(recente, { ...depot(23 * 3600_000) });
  const avant = new Set(b.stockage.fichiers.keys());
  const effacees = await b.photos.menager();
  assert.ok(effacees >= 1);
  assert.equal(b.stockage.fichiers.has(vieille), false);
  assert.equal(b.stockage.fichiers.has(recente), true, "moins de 24 h : peut-être un envoi en cours");
  assert.equal(b.stockage.fichiers.has(citee), true, "la photo d'un compte reste, même vieille");
  for (const nom of avant) if (nom !== vieille && nom !== recente) assert.equal(b.stockage.fichiers.has(nom), [...b.memoire.comptes.values()].some((c) => c.photoProfil === nom), nom);
});
