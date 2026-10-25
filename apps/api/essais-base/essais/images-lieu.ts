import "../socle/garde-fou.ts";
import { readFileSync } from "node:fs";

import { creerImagesLieu } from "../../src/services/images-lieu.ts";
import { creerDepotImagesLieu } from "../../src/services/images-lieu-base.ts";
import { retirerMetadonneesJpeg } from "../../src/fonctions/medias/retirer-metadonnees-jpeg.ts";
import { creerStockagesImagesLieuEnMemoire } from "../../src/services/stockage-images-lieu.ts";
import { avecDimensions } from "../../tests/outils/fabriquer-photos-avis.ts";
import { fabriquerPng } from "../../tests/outils/fabriquer-png.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

const BANNIERE = avecDimensions(readFileSync(new URL("../../tests/donnees/photo-avis-exif-position.jpg", import.meta.url)), 1600, 500);
const LOGO = fabriquerPng({ largeur: 512, hauteur: 512, couleur: 6 });
const QUAND = new Date("2026-10-25T10:00:00Z");

const lieuPublie = await inserer("lieux", { nom: "Chez Léa", type: "resto", emoji: "🍝", info: "Trattoria", texte: "", quartier: "Écusson", ville: "Montpellier", prix: "€€", couleurs: ["#FFD60A", "#FF7A00"], horaires: "", plat: "", tags: [], envies: [], statut: "publie" });
const lieuBrouillon = await inserer("lieux", { nom: "Brouillon", type: "bar", emoji: "🍹", info: "Bar", texte: "", quartier: "Centre", ville: "Lyon", prix: "€", couleurs: ["#000000", "#FFFFFF"], horaires: "", plat: "", tags: [], envies: [], statut: "brouillon" });

const depot = creerDepotImagesLieu(essai.baseDeDonnees);
const stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => QUAND.getTime() });
const images = creerImagesLieu({ stockages, depot, lireRole: async (compteId) => (compteId === 7 ? "gerant" : null), horloge: () => QUAND.getTime() }, async (o) => retirerMetadonneesJpeg(o));

const lireLigne = async (id: number) => essai.base.lieu.findUniqueOrThrow({ where: { id }, select: { banniere: true, logo: true, imagesMajLe: true, modifieLe: true } });

egal(await depot.ecrire((t) => t.verrouillerLieu(lieuPublie)), { banniere: null, logo: null }, "un lieu sans image : banniere et logo à null");
egal(await depot.ecrire((t) => t.verrouillerLieu(999_999)), null, "un lieu inconnu : null");

const envoi = await images.envoyer(7, lieuPublie, "banniere", BANNIERE);
const nomBanniere = envoi.ok ? envoi.adresse.split("/").pop()! : "";
const apresEnvoi = await lireLigne(lieuPublie);
egal([apresEnvoi.banniere, apresEnvoi.imagesMajLe?.toISOString()], [nomBanniere, QUAND.toISOString()], "envoi : le nom et l'heure sont écrits sur le lieu");

const logo = await images.envoyer(7, lieuPublie, "logo", LOGO);
const nomLogo = logo.ok ? logo.adresse.split("/").pop()! : "";
egal((await lireLigne(lieuPublie)).logo, nomLogo, "le logo à côté, la bannière gardée");
egal((await lireLigne(lieuPublie)).banniere, nomBanniere, "la bannière n'a pas bougé");

egal(await depot.lireLieuDeLImage(nomBanniere), { lieuId: lieuPublie, publie: true }, "lecture publique : le lieu de la bannière");
egal(await depot.lireLieuDeLImage(nomLogo), { lieuId: lieuPublie, publie: true }, "lecture publique : le lieu du logo");
egal(await depot.lireLieuDeLImage("11111111-1111-4111-8111-111111111111.jpg"), null, "un nom que personne ne cite : null");

await essai.sql("UPDATE lieux SET banniere = $1 WHERE id = $2", ["22222222-2222-4222-8222-222222222222.jpg", lieuBrouillon]);
egal(await depot.lireLieuDeLImage("22222222-2222-4222-8222-222222222222.jpg"), { lieuId: lieuBrouillon, publie: false }, "lieu en brouillon : pas publié");

const citees = await depot.listerImagesCitees([nomBanniere, nomLogo, "33333333-3333-4333-8333-333333333333.png"]);
egal([...citees].sort(), [nomBanniere, nomLogo].sort(), "ménage : seules les images citées par un lieu");
egal((await depot.listerImagesCitees([])).size, 0, "ménage : liste vide, rien à lire");

const deux = await Promise.all([images.envoyer(7, lieuPublie, "banniere", BANNIERE), images.envoyer(7, lieuPublie, "banniere", BANNIERE)]);
const finale = (await lireLigne(lieuPublie)).banniere;
const noms = deux.map((r) => (r.ok ? r.adresse.split("/").pop()! : ""));
egal(noms.includes(finale!), true, "deux envois en même temps : l'un des deux gagne");
egal(stockages.banniere.fichiers.size, 1, "et le perdant comme l'ancienne bannière sont effacés : un seul fichier reste");

egal(await images.retirer(7, lieuPublie, "logo"), { ok: true, retiree: true }, "retrait du logo");
egal((await lireLigne(lieuPublie)).logo, null, "le logo est à null en base");

await terminerEssai(import.meta.url, essai, verifications.nombre);
