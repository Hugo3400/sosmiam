import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import { lireAvatarPhoto } from "../../../packages/commun/src/validation/lire-avatar-photo.ts";
import { FORME_NOM_PHOTO_PROFIL, TAILLE_MAX_PHOTO_PROFIL } from "../../../packages/commun/src/regles/photo-profil.ts";
import { choisirAvatarPublic } from "../src/fonctions/comptes/choisir-avatar-public.ts";
import { masquerPhotoAvatar } from "../src/fonctions/comptes/masquer-photo-avatar.ts";
import { preparerPhotoProfil } from "../src/fonctions/comptes/preparer-photo-profil.ts";
import { retirerMetadonneesJpeg } from "../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { lirePhotoProfilPourEquipe } from "../src/services/photos-profil.ts";
import { creerBancPhotosProfil } from "./outils/creer-banc-photos-profil.ts";
import { avecDimensions, avecSegmentApp13, HEIC, PNG, segmentsJpeg } from "./outils/fabriquer-photos-avis.ts";

const BRUTE = readFileSync(new URL("./donnees/photo-exif-position.jpg", import.meta.url));
const PHOTO = avecDimensions(BRUTE, 512, 512);
const NOM_INCONNU = "3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.jpg";

let b: Awaited<ReturnType<typeof creerBancPhotosProfil>>;
before(async () => { b = await creerBancPhotosProfil(); });
after(() => b.fermer());

const envoyer = (jeton: string | undefined, octets: Uint8Array = PHOTO, type = "image/jpeg") => b.demander("POST", "/comptes/moi/photo", { jeton, octets, type });
const lire = (nom: string, jeton?: string) => b.demander("GET", `/app/medias/profils/${nom}`, { jeton });
const nomDe = (r: { corps: Record<string, any> | null }) => lireAvatarPhoto(r.corps?.avatar)!;
const compter = (o: Buffer, motif: string | Buffer) => {
  let n = 0;
  for (let i = o.indexOf(motif); i >= 0; i = o.indexOf(motif, i + 1)) n += 1;
  return n;
};

test("preparerPhotoProfil : JPEG carré de 512 px seulement, 5 Mo au plus, sans métadonnées", async () => {
  assert.deepEqual(await preparerPhotoProfil(HEIC), { ok: false, erreur: "format-refuse" });
  assert.deepEqual(await preparerPhotoProfil(PNG), { ok: false, erreur: "format-refuse" });
  assert.deepEqual(await preparerPhotoProfil(Buffer.alloc(0)), { ok: false, erreur: "format-refuse" });
  const lourde = Buffer.concat([PHOTO.subarray(0, 4), Buffer.alloc(TAILLE_MAX_PHOTO_PROFIL)]);
  assert.deepEqual(await preparerPhotoProfil(lourde), { ok: false, erreur: "media-trop-lourd" });
  for (const [largeur, hauteur] of [[64, 48], [512, 511], [1024, 1024], [256, 256]]) {
    assert.deepEqual(await preparerPhotoProfil(avecDimensions(BRUTE, largeur!, hauteur!)), { ok: false, erreur: "media-invalide", champ: "dimensions" });
  }
  assert.deepEqual(await preparerPhotoProfil(PHOTO.subarray(0, PHOTO.length - 40)), { ok: false, erreur: "media-invalide", champ: "format" });
  const bonne = await preparerPhotoProfil(PHOTO);
  assert.ok(bonne.ok);
  assert.deepEqual(bonne.octets, retirerMetadonneesJpeg(PHOTO));
});

test("envoi : 201 { ok, avatar: photo:<uuid>.jpg }, EXIF (position GPS), IPTC et commentaires retirés, nom tiré au hasard", async () => {
  const zoe = await b.inscrire();
  const brute = avecSegmentApp13(PHOTO, "position:iptc 43.6108,3.8767");
  assert.ok(compter(brute, Buffer.from([0x88, 0x25])) > 0, "la photo d'essai a bien un pointeur GPS");
  const r = await envoyer(zoe.jeton, brute);
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual(Object.keys(r.corps!), ["ok", "avatar"]);
  assert.match(r.corps!.avatar, /^photo:/);
  const nom = nomDe(r);
  assert.match(nom, FORME_NOM_PHOTO_PROFIL);
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  const rangee = b.stockage.fichiers.get(nom)!;
  assert.deepEqual(rangee.fiche, { compteId: zoe.id, deposeLe: new Date(b.banc.horloge) });
  for (const secret of ["position:", "Exif", "xmpmeta", "8BIM", "Photoshop"]) assert.equal(compter(rangee.octets!, secret), 0, secret);
  assert.deepEqual(segmentsJpeg(rangee.octets!).filter((m) => m >= 0xe1 && m <= 0xef), []);
  const profil = await b.demander("GET", "/comptes/moi/profil", { jeton: zoe.jeton });
  assert.equal(profil.corps!.profil.avatar, r.corps!.avatar);
  const deux = await envoyer(zoe.jeton);
  assert.notEqual(nomDe(deux), nom, "un nouveau nom à chaque photo : le cache ne la confond jamais avec l'ancienne");
});

test("envoi refusé : autre type, faux JPEG, trop gros, mauvaises dimensions, sans session", async () => {
  const zoe = await b.inscrire();
  assert.deepEqual((await envoyer(zoe.jeton, PNG, "image/png")).corps, { ok: false, erreur: "format-refuse" });
  assert.equal((await envoyer(zoe.jeton, HEIC, "image/heic")).statut, 415);
  const fauxJpeg = await envoyer(zoe.jeton, PNG);
  assert.equal(fauxJpeg.statut, 415, "le type annoncé ne suffit pas : la signature du fichier décide");
  const gros = await envoyer(zoe.jeton, Buffer.concat([PHOTO, Buffer.alloc(TAILLE_MAX_PHOTO_PROFIL)]));
  assert.equal(gros.statut, 413);
  assert.deepEqual(gros.corps, { ok: false, erreur: "media-trop-lourd" });
  const rectangle = await envoyer(zoe.jeton, avecDimensions(BRUTE, 512, 384));
  assert.equal(rectangle.statut, 400);
  assert.deepEqual(rectangle.corps, { ok: false, erreur: "media-invalide", champ: "dimensions" });
  assert.equal((await envoyer(undefined)).statut, 401);
  assert.equal(b.memoire.comptes.get(zoe.id)!.photoProfil ?? null, null, "rien n'est gardé");
});

test("remplacement : l'ancienne photo est effacée du disque tout de suite, et n'est plus servie", async () => {
  const zoe = await b.inscrire();
  const premiere = nomDe(await envoyer(zoe.jeton));
  assert.equal((await lire(premiere)).statut, 200);
  const seconde = nomDe(await envoyer(zoe.jeton));
  assert.equal(b.stockage.fichiers.has(premiere), false);
  assert.equal(b.memoire.comptes.get(zoe.id)!.photoProfil, seconde);
  assert.equal((await lire(premiere)).statut, 404);
  assert.equal((await lire(seconde)).statut, 200);
  assert.equal(b.medias.fichiers.size, 0, "aucun signalement : aucune copie gardée");
});

test("retrait : DELETE rend l'emoji d'avant, efface le fichier ; sans photo, rien ne change", async () => {
  const zoe = await b.inscrire("🦊");
  const nom = nomDe(await envoyer(zoe.jeton));
  const r = await b.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton });
  assert.equal(r.statut, 200);
  assert.deepEqual(r.corps, { ok: true, avatar: "🦊" });
  assert.equal(b.stockage.fichiers.has(nom), false);
  assert.equal((await lire(nom)).statut, 404);
  assert.equal((await b.demander("GET", "/comptes/moi/profil", { jeton: zoe.jeton })).corps!.profil.avatar, "🦊");
  assert.deepEqual((await b.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton })).corps, { ok: true, avatar: "🦊" });
  const sansEmoji = await b.inscrire(null);
  await envoyer(sansEmoji.jeton);
  assert.deepEqual((await b.demander("DELETE", "/comptes/moi/photo", { jeton: sansEmoji.jeton })).corps, { ok: true, avatar: null });
});

test("profil : l'avatar « photo:… » renvoyé tel quel ne change rien ; un emoji change le repli, jamais la photo", async () => {
  const zoe = await b.inscrire("🦊");
  const avatar = (await envoyer(zoe.jeton)).corps!.avatar as string;
  const meme = await b.demander("PATCH", "/comptes/moi/profil", { jeton: zoe.jeton, json: { avatar, ville: "Sète" } });
  assert.equal(meme.statut, 200, JSON.stringify(meme.corps));
  assert.equal(meme.corps!.profil.avatar, avatar);
  assert.equal(b.memoire.comptes.get(zoe.id)!.avatar, "🦊");
  const emoji = await b.demander("PATCH", "/comptes/moi/profil", { jeton: zoe.jeton, json: { avatar: "🐙" } });
  assert.equal(emoji.corps!.profil.avatar, avatar);
  assert.deepEqual((await b.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton })).corps, { ok: true, avatar: "🐙" });
  const faux = await b.demander("PATCH", "/comptes/moi/profil", { jeton: zoe.jeton, json: { avatar: "photo:../../etc/passwd" } });
  assert.deepEqual(faux.corps, { ok: false, erreur: "champ-invalide", champ: "avatar" });
});

test("lecture : seulement la photo actuelle, en JPEG, cache privé d'une heure (jamais chez Cloudflare), nosniff ; 404 sinon, jamais la liste", async () => {
  const zoe = await b.inscrire();
  const nom = nomDe(await envoyer(zoe.jeton));
  const r = await lire(nom);
  assert.equal(r.statut, 200);
  assert.equal(r.entetes.get("content-type"), "image/jpeg");
  assert.equal(r.entetes.get("cache-control"), "private, max-age=3600");
  assert.equal(r.entetes.get("x-content-type-options"), "nosniff");
  assert.deepEqual(r.octets, b.stockage.fichiers.get(nom)!.octets);
  for (const chemin of [NOM_INCONNU, nom.toUpperCase(), `..%2F${nom}`, nom.replace(".jpg", ".json"), `${nom}.json`]) {
    const refus = await lire(chemin);
    assert.equal(refus.statut, 404, chemin);
    assert.notEqual(refus.entetes.get("cache-control"), "private, max-age=3600");
  }
  const dossier = await b.demander("GET", "/app/medias/profils/");
  assert.equal(dossier.statut, 404);
  assert.equal(dossier.octets.includes(nom), false);
  b.stockage.fichiers.set(NOM_INCONNU, { octets: PHOTO, fiche: { compteId: zoe.id, deposeLe: new Date(b.banc.horloge) }, modifieLe: new Date(b.banc.horloge) });
  assert.equal((await lire(NOM_INCONNU)).statut, 404, "un fichier qu'aucun compte ne cite n'est jamais servi");
});

test("blocage : avec une session et un blocage entre les deux, 404 ; sans session, la photo reste servie", async () => {
  const zoe = await b.inscrire();
  const malo = await b.inscrire();
  const lea = await b.inscrire();
  const nom = nomDe(await envoyer(zoe.jeton));
  b.donnees.bloquer(malo.id, zoe.id);
  assert.equal((await lire(nom, malo.jeton)).statut, 404);
  assert.equal((await lire(nom, lea.jeton)).statut, 200);
  assert.equal((await lire(nom, zoe.jeton)).statut, 200);
  assert.equal((await lire(nom)).statut, 200);
  assert.equal((await lire(nom, "jeton-qui-ne-vaut-rien-du-tout-0123456789")).statut, 200);
  const nomDeMalo = nomDe(await envoyer(malo.jeton));
  assert.equal((await lire(nomDeMalo, zoe.jeton)).statut, 404, "le blocage vaut dans les deux sens");
});

test("compte limité : nouvel envoi refusé (403), photo cachée aux autres, retrait permis", async () => {
  const zoe = await b.inscrire("🦊");
  const nom = nomDe(await envoyer(zoe.jeton));
  await b.limiter(zoe.id);
  const r = await envoyer(zoe.jeton);
  assert.equal(r.statut, 403);
  assert.equal(r.corps!.erreur, "compte-limite");
  assert.equal(b.memoire.comptes.get(zoe.id)!.photoProfil, nom);
  assert.equal((await lire(nom)).statut, 404);
  assert.equal((await b.demander("GET", "/comptes/moi/profil", { jeton: zoe.jeton })).corps!.profil.avatar, `photo:${nom}`, "elle voit toujours la sienne");
  assert.deepEqual((await b.demander("DELETE", "/comptes/moi/photo", { jeton: zoe.jeton })).corps, { ok: true, avatar: "🦊" });
  assert.equal(b.stockage.fichiers.has(nom), false);
});

test("équipe : la photo actuelle se lit même pour un compte limité ; sans photo, null", async () => {
  b.brancher();
  const zoe = await b.inscrire();
  assert.equal(await lirePhotoProfilPourEquipe(zoe.id), null);
  const nom = nomDe(await envoyer(zoe.jeton));
  await b.limiter(zoe.id);
  const lue = await lirePhotoProfilPourEquipe(zoe.id);
  assert.ok(lue && lue.equals(b.stockage.fichiers.get(nom)!.octets!));
});

test("effacement du compte : la photo part du disque avec lui", async () => {
  const zoe = await b.inscrire();
  const nom = nomDe(await envoyer(zoe.jeton));
  const r = await b.demander("DELETE", "/comptes/moi", { jeton: zoe.jeton, json: { motDePasse: b.MOT_DE_PASSE } });
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(b.memoire.comptes.has(zoe.id), false);
  assert.equal(b.stockage.fichiers.has(nom), false);
  assert.equal((await lire(nom)).statut, 404);
});

test("avatar public : la photo si elle n'est pas cachée, sinon l'emoji ; masquée pour une personne bloquée", () => {
  assert.equal(choisirAvatarPublic({ avatar: "🦊", photoProfil: NOM_INCONNU }), `photo:${NOM_INCONNU}`);
  assert.equal(choisirAvatarPublic({ avatar: "🦊", photoProfil: NOM_INCONNU, limitations: [{ id: 1 }] }), "🦊");
  assert.equal(choisirAvatarPublic({ avatar: null, photoProfil: NOM_INCONNU, limitations: [{ id: 1 }] }), null);
  assert.equal(choisirAvatarPublic({ avatar: "miami:toque", photoProfil: null }), "miami:toque");
  assert.equal(choisirAvatarPublic({ avatar: "🦊" }), "🦊");
  const personne = { id: "abcdefghij", pseudo: "zoe", prenom: "Zoé", avatar: `photo:${NOM_INCONNU}` };
  assert.deepEqual(masquerPhotoAvatar(personne), { ...personne, avatar: null });
  assert.deepEqual(masquerPhotoAvatar({ ...personne, avatar: "🦊" }), { ...personne, avatar: "🦊" });
});
