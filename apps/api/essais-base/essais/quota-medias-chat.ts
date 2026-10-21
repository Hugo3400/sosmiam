import "../socle/garde-fou.ts";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { retirerMetadonneesJpeg } from "../../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import type { MediaRecu } from "../../src/services/messagerie-regles.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerRelationsSociales } = await import("../../src/services/relations-sociales.ts");
const { creerDepotMessagerie } = await import("../../src/services/messagerie-tables.ts");
const { creerMessagerie } = await import("../../src/services/messagerie.ts");
const verifications = creerVerifications();
const { egal } = verifications;

const T = new Date("2026-10-21T10:00:00Z");
const JOUR = 86_400_000;
const PHOTO = retirerMetadonneesJpeg(readFileSync(new URL("../../tests/donnees/photo-exif-position.jpg", import.meta.url)))!;
const compte = async (pseudo: string) => {
  const id = await insererLigne(essai.db, "comptes", { email: `${pseudo}@exemple.fr`, prenom: "Zoé", points: 0, palier: "curieux", pseudo });
  await insererLigne(essai.db, "profils_sociaux", { compte_id: id, id_public: `${pseudo}xxxxxxxxxx`.slice(0, 10) });
  return id;
};

const lea = await compte("lea");
const malo = await compte("malo");
await insererLigne(essai.db, "membres_bandes", { compte_id: lea, pote_id: malo, cree_le: T });
await insererLigne(essai.db, "membres_bandes", { compte_id: malo, pote_id: lea, cree_le: T });

const medias = creerStockageMediasChatEnMemoire();
const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(new Uint8Array(32).fill(5)));
const relations = creerRelationsSociales(baseDeDonnees);
const messagerie = creerMessagerie({ depot: creerDepotMessagerie({ relations, medias, base: baseDeDonnees }), relations, chiffrement, medias });
const photo = (): MediaRecu => ({ type: "photo", octets: PHOTO, largeur: 64, hauteur: 48, idClient: randomUUID() });
const groupeSeul = async (titre: string, quand: Date) => {
  const g = await messagerie.creerGroupe(lea, { titre, emoji: "🍕", invites: [malo] }, randomUUID(), quand);
  if (!g.ok) throw new Error(`groupe : ${g.erreur}`);
  return Number(g.conversation.id);
};
const compterMediasDeLea = async () => Number((await essai.sql(`SELECT count(*)::int AS n FROM messages_conversations WHERE auteur_id = ${lea}`))[0]!.n);

const premier = await groupeSeul("Seul 1", T);
let acceptes = 0;
for (let i = 0; i < 50; i++) if ((await messagerie.envoyerMedia(lea, premier, photo(), T)).ok) acceptes += 1;
egal(acceptes, 50, "50 médias acceptés");
egal(await messagerie.envoyerMedia(lea, premier, photo(), T), { ok: false, erreur: "trop-de-medias" }, "le 51e : refusé");
egal(await messagerie.retirerMembre(lea, premier, "moi", T), { ok: true }, "Léa quitte son groupe, seule membre");
egal(await compterMediasDeLea(), 0, "le groupe et ses 50 médias sont effacés de la base");

const second = await groupeSeul("Seul 2", T);
egal(await messagerie.verifierEnvoiMedia(lea, second, randomUUID(), PHOTO.length, T), "trop-de-medias", "vérification avant le décodage : toujours refusé");
egal(await messagerie.envoyerMedia(lea, second, photo(), T), { ok: false, erreur: "trop-de-medias" }, "sous le verrou du compte : toujours refusé");
const plusTard = new Date(T.getTime() + JOUR + 1000);
egal((await messagerie.envoyerMedia(lea, second, photo(), plusTard)).ok, true, "24 h plus tard : accepté");

await terminerEssai(import.meta.url, essai, verifications.nombre);
