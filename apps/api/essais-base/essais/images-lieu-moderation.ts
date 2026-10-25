import "../socle/garde-fou.ts";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { retirerMetadonneesJpeg } from "../../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { deciderSignalement, enregistrerSignalement, listerSignalements } from "../../src/services/gestion/moderation.ts";
import { lireMediaSignale } from "../../src/services/gestion/moderation-sociale.ts";
import { brancherImagesLieu, creerImagesLieu } from "../../src/services/images-lieu.ts";
import { creerDepotImagesLieu, creerDepotSignalementsImagesLieu } from "../../src/services/images-lieu-base.ts";
import { brancherSignalementsImagesLieu, creerSignalementsImagesLieu } from "../../src/services/images-lieu-signalements.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerStockagesImagesLieuEnMemoire } from "../../src/services/stockage-images-lieu.ts";
import type { NouvelleNotificationCloche } from "../../src/services/effets-sociaux-regles.ts";
import type { ServicesCloche } from "../../src/services/cloche-regles.ts";
import { avecDimensions } from "../../tests/outils/fabriquer-photos-avis.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

const BANNIERE = avecDimensions(readFileSync(new URL("../../tests/donnees/photo-avis-exif-position.jpg", import.meta.url)), 1600, 500);
const QUAND = new Date("2026-10-25T15:00:00Z");

const gerant = await inserer("comptes", { email: "gerant@exemple.fr", prenom: "Capitaine" });
const signaleuse = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa" });
const lieuId = await inserer("lieux", { nom: "Chez Léa", type: "resto", emoji: "🍝", info: "Trattoria", texte: "", quartier: "Écusson", ville: "Montpellier", prix: "€€", couleurs: ["#FFD60A", "#FF7A00"], horaires: "", plat: "", tags: [], envies: [], statut: "publie" });

const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
const medias = creerStockageMediasChatEnMemoire({ horloge: () => QUAND.getTime() });
const notes: NouvelleNotificationCloche[] = [];
const cloche = { noter: async (n: readonly NouvelleNotificationCloche[]) => void notes.push(...n) } as unknown as ServicesCloche;
const social = { chiffrement, medias, cloche };

const stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => QUAND.getTime() });
const images = creerImagesLieu({ stockages, depot: creerDepotImagesLieu(essai.baseDeDonnees), lireRole: async (compteId) => (compteId === gerant ? "gerant" : null), horloge: () => QUAND.getTime() }, async (o) => retirerMetadonneesJpeg(o));
brancherImagesLieu(images);
brancherSignalementsImagesLieu(creerSignalementsImagesLieu({ depot: creerDepotSignalementsImagesLieu(essai.baseDeDonnees), stockages, chiffrement, medias, horloge: () => QUAND.getTime() }));

const envoi = await images.envoyer(gerant, lieuId, "banniere", BANNIERE);
const nom = envoi.ok ? envoi.adresse.split("/").pop()! : "";
egal(envoi.ok, true, "le gérant pose sa bannière");

await enregistrerSignalement({ cible: "image-lieu", lieuId, quelle: "banniere", raison: "choquant", precision: null, explication: "", signaleParId: signaleuse, source: "app" });
await enregistrerSignalement({ cible: "image-lieu", lieuId, quelle: "banniere", raison: "choquant", precision: null, explication: "", signaleParId: null, source: "site" });
await enregistrerSignalement({ cible: "image-lieu", lieuId, quelle: "logo", raison: "choquant", precision: null, explication: "", signaleParId: null, source: "site" });
const lignes = await essai.base.signalement.findMany({ where: { cible: "image-lieu" }, orderBy: { id: "asc" }, select: { id: true, cibleId: true, lieuId: true, auteurContenuId: true, signaleParId: true, source: true, fichierMedia: true, instantaneChiffre: true } });
egal(lignes.length, 2, "deux signalements de la bannière ; rien pour un logo absent");
egal(lignes.map((l) => [l.cibleId, l.lieuId, l.auteurContenuId, l.signaleParId, l.source]), [[`${lieuId}:banniere`, lieuId, gerant, signaleuse, "app"], [`${lieuId}:banniere`, lieuId, gerant, null, "site"]], "cible, lieu, auteur (le gérant), signaleuse et source");
egal(lignes.map((l) => l.fichierMedia !== null), [true, false], "une seule copie de l'image comme preuve");
egal(lignes.every((l) => l.instantaneChiffre !== null && !l.instantaneChiffre.includes(nom)), true, "l'instantané est chiffré");

const file = await listerSignalements("a-traiter", social, "image-lieu");
const premier = file.signalements.find((s) => s.id === lignes[0]!.id)!;
egal([premier.instantane?.etat, premier.instantane?.etat === "lu" ? premier.instantane.contenu.nom : null, premier.avecMedia], ["lu", nom, true], "le logiciel lit l'instantané (nom de l'image) et sait qu'une image est jointe");
egal(file.lieux[lieuId]?.nom, "Chez Léa", "avec le nom du lieu");
const media = await lireMediaSignale(lignes[0]!.id, social);
egal([media?.etat, media && "type" in media ? media.type : null], ["lu", "image/jpeg"], "l'image signalée se relit déchiffrée, en JPEG");
egal(media && "octets" in media ? Buffer.compare(media.octets, (await stockages.banniere.lire(nom))!) : -1, 0, "c'est bien la même image");

const decision = await deciderSignalement(lignes[0]!.id, { decision: "retenu", note: null, motif: "violence", motivation: "Image choquante." }, social, QUAND);
egal(decision !== null && decision !== "deja-decide" ? decision.regles : 0, 2, "retenu : les deux signalements de la bannière sont décidés ensemble");
egal((await essai.base.lieu.findUniqueOrThrow({ where: { id: lieuId }, select: { banniere: true } })).banniere, null, "la bannière est retirée du lieu");
egal(await stockages.banniere.existe(nom), false, "et son fichier effacé");
egal(notes.filter((n) => n.type === "contenu-retire").map((n) => [n.compteId, n.detail]), [[gerant, "violence"]], "le gérant est prévenu, avec le motif");
egal(notes.filter((n) => n.type === "signalement-decide").map((n) => [n.compteId, n.detail]), [[signaleuse, "retenu"]], "la signaleuse connectée est prévenue de la décision");

const remplacee = await images.envoyer(gerant, lieuId, "banniere", BANNIERE);
await enregistrerSignalement({ cible: "image-lieu", lieuId, quelle: "banniere", raison: "choquant", precision: null, explication: "", signaleParId: null, source: "app" });
const [dernier] = await essai.base.signalement.findMany({ where: { cible: "image-lieu", statut: "a-traiter" }, select: { id: true, fichierMedia: true } });
egal(dernier?.fichierMedia !== null, true, "une nouvelle bannière signalée a sa propre preuve");
const autre = await images.envoyer(gerant, lieuId, "banniere", BANNIERE);
await deciderSignalement(dernier!.id, { decision: "retenu", note: null, motif: "violence", motivation: "Image choquante." }, social, QUAND);
const courante = (await essai.base.lieu.findUniqueOrThrow({ where: { id: lieuId }, select: { banniere: true } })).banniere;
egal([courante !== null, courante === (autre.ok ? autre.adresse.split("/").pop() : ""), remplacee.ok], [true, true, true], "retenu après un remplacement : la nouvelle image, pas signalée, reste en place");

await terminerEssai(import.meta.url, essai, verifications.nombre);
