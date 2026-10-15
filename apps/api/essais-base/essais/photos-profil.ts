import "../socle/garde-fou.ts";
import { readFileSync } from "node:fs";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerStockagePhotosProfilEnMemoire } from "../../src/services/stockage-photos-profil.ts";
import { avecDimensions } from "../../tests/outils/fabriquer-photos-avis.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerDepotPhotosProfil } = await import("../../src/services/photos-profil-base.ts");
const { brancherPhotosProfil, creerPhotosProfil, lirePhotoProfilSignalee } = await import("../../src/services/photos-profil.ts");
const { effacerCompte } = await import("../../src/services/comptes.ts");
const { creerRelationsSociales } = await import("../../src/services/relations-sociales.ts");
const { creerSocial } = await import("../../src/services/social.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const T = new Date("2026-10-15T10:00:00Z");
const JOUR = 86_400_000;
const PHOTO = avecDimensions(readFileSync(new URL("../../tests/donnees/photo-exif-position.jpg", import.meta.url)), 512, 512);
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const compte = async (pseudo: string, avatar: string | null) => {
  const id = await inserer("comptes", { email: `${pseudo}@exemple.fr`, prenom: "Zoé", points: 0, palier: "curieux", pseudo, avatar });
  await inserer("profils_sociaux", { compte_id: id, id_public: `${pseudo}xxxxxxxxxx`.slice(0, 10) });
  return id;
};

const horloge = { maintenant: T.getTime() };
const stockage = creerStockagePhotosProfilEnMemoire({ horloge: () => horloge.maintenant });
const medias = creerStockageMediasChatEnMemoire();
const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(new Uint8Array(32).fill(3)));
const depot = creerDepotPhotosProfil(baseDeDonnees);
const photos = creerPhotosProfil({ stockage, depot, preuves: { chiffrement, medias }, horloge: () => horloge.maintenant });
brancherPhotosProfil(photos);
const relations = creerRelationsSociales(baseDeDonnees);
const social = creerSocial({ relations, tirer: () => 1, base: baseDeDonnees });

const ZOE = await compte("zoephoto", "🦊");
const MALO = await compte("malophoto", null);
const LEA = await compte("leaphoto", "miami:toque");

const envoi = await photos.envoyer(ZOE, PHOTO);
vrai(envoi.ok, "envoi accepté");
const premiere = envoi.ok ? envoi.avatar.slice("photo:".length) : "";
egal(await depot.lirePhoto(ZOE), premiere, "la colonne photo_profil cite la photo");
egal(await depot.lireTitulaire(premiere, T), { compteId: ZOE, limite: false });
egal(await depot.lireTitulaire("3f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.jpg", T), null);
egal((await photos.lirePublique(premiere, null))?.length, stockage.fichiers.get(premiere)!.octets!.length, "servie sans session");

egal((await relations.presenter([ZOE, MALO, LEA])).get(ZOE)?.avatar, `photo:${premiere}`, "présentée partout comme l'avatar");
egal((await social.chercher(MALO, "zoep")).map((r) => r.personne.avatar), [`photo:${premiere}`], "recherche : la photo");
egal((await social.lireMoi(ZOE))?.personne.avatar, `photo:${premiere}`);

await inserer("blocages", { bloqueur_id: MALO, bloque_id: ZOE });
egal(await depot.bloqueEntre(ZOE, MALO), true);
egal(await depot.bloqueEntre(MALO, ZOE), true, "dans les deux sens");
egal(await depot.bloqueEntre(ZOE, LEA), false);
egal(await photos.lirePublique(premiere, MALO), null, "bloquée : 404 avec sa session");
egal((await photos.lirePublique(premiere, LEA)) !== null, true);
const profilBloque = await social.lireProfil(MALO, ZOE, T);
egal([profilBloque?.pseudo, profilBloque?.avatar], ["zoephoto", null], "le profil d'une personne bloquée n'a pas de photo");

await inserer("limitations_comptes", { compte_id: ZOE, motif: "haine", motivation: "Une photo insultante pour la Brigade.", debut: new Date(T.getTime() - JOUR) });
egal(await depot.lireTitulaire(premiere, T), { compteId: ZOE, limite: true });
egal(await photos.lirePublique(premiere, null), null, "compte limité : plus servie");
egal((await relations.presenter([ZOE])).get(ZOE)?.avatar, "🦊", "compte limité : les autres voient son emoji");
egal((await social.chercher(LEA, "zoep")).map((r) => r.personne.avatar), ["🦊"]);
egal((await social.lireMoi(ZOE))?.personne.avatar, `photo:${premiere}`, "elle voit toujours la sienne");
await essai.sql("UPDATE limitations_comptes SET levee_le = $1", [T]);
egal((await relations.presenter([ZOE])).get(ZOE)?.avatar, `photo:${premiere}`, "levée : de nouveau visible");

const vieux = await inserer("signalements", { cible: "profil", cible_id: "zoephotoxx", raison: "choquant", source: "app", auteur_contenu_id: ZOE, statut: "retenu", cree_le: new Date(T.getTime() - 300 * JOUR), traite_le: new Date(T.getTime() - 200 * JOUR) });
const ouvert = await inserer("signalements", { cible: "profil", cible_id: "zoephotoxx", raison: "choquant", source: "app", auteur_contenu_id: ZOE, signale_par_id: LEA, cree_le: new Date(T.getTime() + 1000) });
const message = await inserer("signalements", { cible: "message", cible_id: "1", raison: "choquant", source: "app", auteur_contenu_id: ZOE, cree_le: new Date(T.getTime() + 1000) });
horloge.maintenant = T.getTime() + 60_000;
egal(await lirePhotoProfilSignalee(ouvert), stockage.fichiers.get(premiere)!.octets, "signalement ouvert, photo encore affichée : la modération la lit");
const octetsPremiere = stockage.fichiers.get(premiere)!.octets!;
const seconde = await photos.envoyer(ZOE, PHOTO);
vrai(seconde.ok, "remplacement accepté");
egal(stockage.fichiers.has(premiere), false, "l'ancienne quitte le dossier des photos");
const lignes = await baseDeDonnees.signalement.findMany({ where: { id: { in: [vieux, ouvert, message] } }, select: { id: true, fichierMedia: true }, orderBy: { id: "asc" } });
egal(lignes.map((l) => l.fichierMedia === null), [true, false, true], "seul le signalement ouvert de ce profil cite une copie");
const preuve = lignes[1]!.fichierMedia!;
egal(chiffrement!.dechiffrerOctets(medias.fichiers.get(preuve)!.octets, preuve), octetsPremiere, "copie chiffrée, relue telle quelle");
egal(await lirePhotoProfilSignalee(ouvert), octetsPremiere);

const actuelle = seconde.ok ? seconde.avatar.slice("photo:".length) : "";
const orpheline = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg";
stockage.fichiers.set(orpheline, { octets: PHOTO, fiche: { compteId: MALO, deposeLe: new Date(T.getTime() - 2 * JOUR) }, modifieLe: new Date(T.getTime() - 2 * JOUR) });
horloge.maintenant = T.getTime() + 3 * JOUR;
egal(await photos.menager(), 1, "ménage : seule l'orpheline de plus de 24 h part");
egal([...stockage.fichiers.keys()], [actuelle], "la photo citée reste");

await effacerCompte(ZOE, new Date(horloge.maintenant));
egal(stockage.fichiers.size, 0, "effacée du disque avec le compte");
egal(await baseDeDonnees.compte.count({ where: { id: ZOE } }), 0);
egal((await baseDeDonnees.signalement.findUnique({ where: { id: ouvert }, select: { fichierMedia: true } }))?.fichierMedia, preuve, "la preuve reste avec le signalement");
egal(await depot.listerPhotosCitees([actuelle, orpheline]), new Set(), "plus aucun compte ne les cite");

await terminerEssai(import.meta.url, essai, verifications.nombre);
