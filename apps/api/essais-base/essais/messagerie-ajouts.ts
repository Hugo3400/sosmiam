import "../socle/garde-fou.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { calculerSeuilsMenageSocial } from "../../src/fonctions/social/calculer-seuils-menage-social.ts";
import type { LigneMessage } from "../../src/fonctions/social/presenter-message.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { effacerConversations } from "../../src/services/effacer-conversations.ts";
import { effacerFichiersOrphelins } from "../../src/services/menage-social-etapes.ts";
import { ecrireMessageSysteme } from "../../src/services/messagerie-systeme.ts";
import { creerTablesMessagerie } from "../../src/services/messagerie-tables.ts";
import { rechiffrerSocial } from "../../src/services/rechiffrement-social.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const q = essai.sql;
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const T = new Date("2026-10-22T20:00:00Z");
const JOUR = 86_400_000;
const medias = creerStockageMediasChatEnMemoire({ horloge: () => T.getTime() - 3 * JOUR });
const t = creerTablesMessagerie(base, {} as never, medias);
const donnees = creerChiffrementDonnees(randomBytes(32));
const chiffrement = creerChiffrementSocial(donnees)!;

await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version) VALUES
  (10, 'a@exemple.fr', 'x', 'A', 'v'), (11, 'b@exemple.fr', 'x', 'B', 'v'), (12, 'c@exemple.fr', 'x', 'C', 'v')`);
await insererLigne(essai.db, "profils_sociaux", { compte_id: 10, id_public: "aaaaaaaa10" });
await insererLigne(essai.db, "profils_sociaux", { compte_id: 11, id_public: "aaaaaaaa11", accuses_lecture: false });
await q(`INSERT INTO conversations (id, type, cle_prive, version) VALUES (1, 'prive', '10-11', 0), (2, 'groupe', NULL, 0), (3, 'sortie', NULL, 0), (4, 'groupe', NULL, 0)`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (1, 10), (1, 11), (2, 10), (2, 11), (3, 10), (4, 10)`);

const vide = {
  fichier: null, typeMime: null, taille: null, largeur: null, hauteur: null, dureeSecondes: null, mediaExpireLe: null,
  supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null, texteChiffre: null,
} satisfies Partial<LigneMessage>;
const inserer = async (m: Partial<LigneMessage> & Pick<LigneMessage, "conversationId" | "type">) => {
  const ligne = await t.insererMessage({ ...vide, auteurId: 10, idClient: randomUUID(), creeLe: T, ...m });
  if (!ligne) throw new Error("message non inséré");
  return ligne;
};

const cite = await inserer({ conversationId: 1, type: "texte", texteChiffre: "v2:x" });
const album = randomUUID();
const photo = (o: Partial<LigneMessage> = {}) => inserer({
  conversationId: 1, type: "photo", fichier: medias.tirerNom(), typeMime: "image/jpeg", taille: 10, largeur: 1, hauteur: 1,
  mediaExpireLe: new Date(T.getTime() + 90 * JOUR), album, ...o,
});
const reponse = await inserer({ conversationId: 1, auteurId: 11, type: "texte", texteChiffre: "v2:y", reponseAId: cite.id });
const vocal = await inserer({ conversationId: 1, type: "vocal", onde: "0123456789012345", fichier: medias.tirerNom(), typeMime: "audio/mp4", mediaExpireLe: new Date(T.getTime() + 90 * JOUR) });
const p1 = await photo();
const p2 = await photo({ auteurId: 11 });
const p3 = await photo({ supprimeLe: T, fichier: null });
const p4 = await photo({ mediaExpireLe: new Date(T.getTime() - JOUR) });
const lieu = await inserer({ conversationId: 1, type: "lieu", texteChiffre: "v2:z" });
const retire = await inserer({ conversationId: 1, type: "lieu", texteChiffre: "v2:z", retireLe: T });
egal([reponse.reponseAId, vocal.onde, p1.album, reponse.modifieLe, reponse.systeme], [cite.id, "0123456789012345", album, null, null], "les nouvelles colonnes, rendues par l'INSERT");

await t.modifierMessage(cite.id, { texteChiffre: "v2:w", modifieLe: T });
const relu = (await t.lireMessage(cite.id))!;
vrai(relu.modifieLe instanceof Date && relu.modifieLe.getTime() === T.getTime(), "modifie_le relu en Date");
const derniers = await t.lireDerniersMessages([{ id: 1, apres: 0 }], new Set(), new Set([retire.id]));
const dernier = derniers.get(1)!;
egal([dernier.id, dernier.type, dernier.reponseAId, dernier.album, dernier.onde, dernier.systeme], [lieu.id, "lieu", null, null, null, null], "COLONNES de la requête brute");
const avecReponse = await t.lireDerniersMessages([{ id: 1, apres: 0 }], new Set([10]), new Set([p2.id]));
egal([avecReponse.get(1)!.id, avecReponse.get(1)!.reponseAId, avecReponse.get(1)!.modifieLe], [reponse.id, cite.id, null], "reponse_a_id lu par la requête brute");
const envoyes = await t.listerLieuxEnvoyes(11, "recus", { caches: new Set(), exclus: new Set() }, null, 10);
egal(envoyes.map((l) => [l.message.id, l.message.modifieLe, l.message.systeme]), [[lieu.id, null, null]]);

egal((await t.listerAlbum(1, album, 10)).map((m) => m.id), [p1.id, p2.id, p3.id, p4.id], "l'album dans l'ordre d'envoi");
egal((await t.listerAlbum(1, album, 2)).length, 2);
const filtre = { apres: 0, caches: new Set<number>(), exclus: new Set<number>() };
egal((await t.listerPartages(1, "photo", filtre, null, 10, T)).map((m) => m.id), [p2.id, p1.id], "ni supprimée, ni expirée");
egal((await t.listerPartages(1, "photo", { ...filtre, caches: new Set([11]) }, null, 10, T)).map((m) => m.id), [p1.id]);
egal((await t.listerPartages(1, "photo", { ...filtre, apres: p1.id }, null, 10, T)).map((m) => m.id), [p2.id]);
egal((await t.listerPartages(1, "photo", filtre, p2.id, 10, T)).map((m) => m.id), [p1.id]);
egal((await t.listerPartages(1, "lieu", filtre, null, 10, T)).map((m) => m.id), [lieu.id], "pas le lieu retiré");
egal((await t.listerPartages(1, "photo", { ...filtre, exclus: new Set([p2.id]) }, null, 1, T)).map((m) => m.id), [p1.id]);

await t.modifierMembre(1, 10, { epingleeLe: new Date(T.getTime() + 1000) });
await t.modifierMembre(2, 10, { epingleeLe: new Date(T.getTime() + 2000) });
await t.modifierMembre(3, 10, { epingleeLe: new Date(T.getTime() + 3000) });
egal((await t.listerMesEpinglees(10)).map((c) => c.id), [2, 1], "la dernière épinglée d'abord, jamais une sortie");
egal([await t.compterEpinglees(10), await t.compterEpinglees(11)], [3, 0]);
await t.modifierMembre(2, 10, { epingleeLe: null });
egal((await t.listerMesEpinglees(10)).map((c) => c.id), [1]);
egal((await t.lireMembres([1])).find((m) => m.compteId === 10)!.epingleeLe?.getTime(), T.getTime() + 1000);
egal([...(await t.lireAccusesLecture([10, 11, 12, 10]))], [10], "11 a coupé, 12 n'a pas de profil");
egal((await t.lireAccusesLecture([])).size, 0);

const photoGroupe = medias.tirerNom();
await medias.ecrire(photoGroupe, Buffer.from("chiffre"));
await t.ecrireGroupe(4, { photo: photoGroupe });
egal((await t.lireConversations([4])).get(4)!.photo, photoGroupe);
egal((await t.listerMesConversations(10, null, 10)).find((c) => c.id === 4)!.photo, photoGroupe);
const orphelin = medias.tirerNom();
await medias.ecrire(orphelin, Buffer.from("chiffre"));
egal(await effacerFichiersOrphelins(base, calculerSeuilsMenageSocial(T), medias), 1, "seul l'orphelin part");
egal([medias.fichiers.has(photoGroupe), medias.fichiers.has(orphelin)], [true, false], "la photo du groupe n'est pas un orphelin");

const ancienne = randomBytes(32);
const v1 = creerChiffrementSocial(creerChiffrementDonnees(ancienne))!;
const v2 = creerChiffrementDonnees(randomBytes(32), { version: 2, anciennes: [{ version: 1, cle: ancienne }] });
await medias.supprimer([photoGroupe]);
await medias.ecrire(photoGroupe, v1.chiffrerOctets(Buffer.from("photo"), photoGroupe));
await rechiffrerSocial(v2, medias, base, { fichiersParNuit: 10 });
const rechiffree = (await t.lireConversations([4])).get(4)!.photo!;
vrai(rechiffree !== photoGroupe && medias.fichiers.has(rechiffree), "le rechiffrement suit la photo du groupe");

await q(`DELETE FROM messages_conversations WHERE id = $1`, [cite.id]);
egal((await t.lireMessage(reponse.id))!.reponseAId, null, "ON DELETE SET NULL");

const pose = await base.$transaction((tx) => ecrireMessageSysteme(creerTablesMessagerie(tx, {} as never, medias, tx), chiffrement, {
  conversationId: 2, systeme: "rappel-sortie", texte: "C'est dans 1 h !", maintenant: T,
}));
vrai(pose !== null);
const systeme = (await t.lireMessage(pose!.messageId))!;
egal([systeme.auteurId, systeme.systeme, systeme.type, pose!.version], [null, "rappel-sortie", "texte", 1]);
egal(chiffrement.dechiffrerMessage(systeme.texteChiffre!, 2, systeme.idClient), "C'est dans 1 h !");
egal(await base.$transaction((tx) => ecrireMessageSysteme(creerTablesMessagerie(tx, {} as never, medias, tx), chiffrement, {
  conversationId: 999, systeme: "rappel-sortie", texte: "Personne", maintenant: T,
})), null);

const effacees = await base.$transaction((tx) => effacerConversations(tx, [4], medias));
egal([effacees.conversations, effacees.fichiers], [1, [rechiffree]], "la photo du groupe part avec lui");
await effacees.apresTransaction(base);
egal(medias.fichiers.has(rechiffree), false);

await terminerEssai(import.meta.url, essai, verifications.nombre);
