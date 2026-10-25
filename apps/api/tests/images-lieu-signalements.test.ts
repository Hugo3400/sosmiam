import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import express from "express";

import { creerRoutesSignalements } from "../src/routes/signalements.ts";
import type { SignalementRecu } from "../src/services/gestion/moderation.ts";
import { creerImagesLieu } from "../src/services/images-lieu.ts";
import { creerDepotImagesLieuEnMemoire } from "../src/services/images-lieu-en-memoire.ts";
import { creerSignalementsImagesLieu, lireCibleImageLieu, type DepotSignalementsImagesLieu, type NouveauSignalementImageLieu } from "../src/services/images-lieu-signalements.ts";
import { creerStockageMediasChatEnMemoire } from "../src/services/stockage-medias-chat.ts";
import { creerStockagesImagesLieuEnMemoire } from "../src/services/stockage-images-lieu.ts";

const QUAND = Date.parse("2026-10-25T14:00:00Z");
const NOM = "11111111-1111-4111-8111-111111111111.jpg";
const chiffrement = {
  chiffrerOctets: (octets: Uint8Array, fichier: string) => Buffer.concat([Buffer.from(`chiffre:${fichier}:`), Buffer.from(octets)]),
  chiffrerInstantane: (json: string, id: number) => `instantane:${id}:${json}`,
};

type Ligne = NouveauSignalementImageLieu & { id: number; instantane: string; statut: string };

function creerBanc(o: { image?: string | null; comptes?: number[] } = {}) {
  const lignes: Ligne[] = [];
  const stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => QUAND });
  const medias = creerStockageMediasChatEnMemoire({ horloge: () => QUAND });
  let image = o.image === undefined ? NOM : o.image;
  let echec = false;
  const depot: DepotSignalementsImagesLieu = {
    lireImagePubliee: async (lieuId, quelle) => (lieuId === 3 && quelle === "banniere" ? image : null),
    estDejaSignalee: async (cibleId, par) => lignes.some((l) => l.cibleId === cibleId && l.signaleParId === par && l.statut === "a-traiter"),
    aUnePreuveOuverte: async (cibleId) => lignes.some((l) => l.cibleId === cibleId && l.fichierMedia !== null && l.statut === "a-traiter"),
    compteExiste: async (id) => (o.comptes ?? [7]).includes(id),
    ecrire: async (s, instantane) => {
      if (echec) throw new Error("base en panne");
      const id = lignes.length + 1;
      lignes.push({ ...s, id, instantane: instantane(id), statut: "a-traiter" });
      return id;
    },
  };
  const signalements = creerSignalementsImagesLieu({ depot, stockages, chiffrement, medias, horloge: () => QUAND });
  return { lignes, stockages, medias, signalements, poserImage: (nom: string | null) => void (image = nom), casser: () => void (echec = true) };
}

const recu = (o: Partial<Parameters<ReturnType<typeof creerSignalementsImagesLieu>["enregistrer"]>[0]> = {}) => ({
  cible: "image-lieu" as const, lieuId: 3, quelle: "banniere" as const, raison: "choquant", precision: null, explication: "", signaleParId: null, source: "app" as const, ...o,
});

test("cible d'un signalement d'image : « <lieu>:<banniere|logo> » et rien d'autre", () => {
  assert.deepEqual(lireCibleImageLieu("3:banniere"), { lieuId: 3, quelle: "banniere" });
  assert.deepEqual(lireCibleImageLieu("12:logo"), { lieuId: 12, quelle: "logo" });
  for (const brut of ["0:logo", "3:fond", "3", "-3:logo", "3:logo:x", "abc:logo"]) assert.equal(lireCibleImageLieu(brut), null, brut);
});

test("signalement : une copie chiffrée de l'image comme preuve, l'instantané avec son nom, le gérant qui l'a déposée comme auteur", async () => {
  const b = creerBanc();
  await b.stockages.banniere.ecrire(NOM, Buffer.from("octets de la bannière"), { compteId: 7, deposeLe: new Date(QUAND) });
  assert.equal(await b.signalements.enregistrer(recu({ signaleParId: 12, explication: "  " })), "enregistre");
  const [ligne] = b.lignes;
  assert.deepEqual([ligne.cibleId, ligne.lieuId, ligne.auteurContenuId, ligne.signaleParId, ligne.source, ligne.creeLe.getTime()], ["3:banniere", 3, 7, 12, "app", QUAND]);
  assert.ok(ligne.fichierMedia);
  const preuve = b.medias.fichiers.get(ligne.fichierMedia!)?.octets;
  assert.equal(preuve?.toString(), `chiffre:${ligne.fichierMedia}:octets de la bannière`);
  assert.deepEqual(JSON.parse(ligne.instantane.replace(/^instantane:1:/, "")), { v: 1, cible: "image-lieu", lieuId: 3, quelle: "banniere", nom: NOM, media: { typeMime: "image/jpeg" } });
});

test("signalement : une seule preuve tant qu'une est ouverte ; une personne ne signale qu'une fois ; l'auteur supprimé n'est pas cité", async () => {
  const b = creerBanc({ comptes: [] });
  await b.stockages.banniere.ecrire(NOM, Buffer.from("x"), { compteId: 7, deposeLe: new Date(QUAND) });
  assert.equal(await b.signalements.enregistrer(recu({ signaleParId: 12 })), "enregistre");
  assert.equal(await b.signalements.enregistrer(recu({ signaleParId: 12 })), "deja-signalee");
  assert.equal(await b.signalements.enregistrer(recu({ signaleParId: null, source: "site" })), "enregistre");
  assert.equal(await b.signalements.enregistrer(recu({ signaleParId: 13 })), "enregistre");
  assert.deepEqual(b.lignes.map((l) => l.fichierMedia !== null), [true, false, false]);
  assert.equal(b.medias.fichiers.size, 1);
  assert.ok(b.lignes.every((l) => l.auteurContenuId === null));
  assert.equal(b.lignes[1]!.source, "site");
});

test("signalement : rien sans image publiée, sans clé des données, ou si la base refuse (la preuve part avec)", async () => {
  assert.equal(await creerBanc({ image: null }).signalements.enregistrer(recu()), "image-absente");
  assert.equal(await creerBanc().signalements.enregistrer(recu({ lieuId: 4 })), "image-absente");
  const sansFichier = creerBanc();
  assert.equal(await sansFichier.signalements.enregistrer(recu()), "image-absente");
  const sansCle = creerBanc();
  const s = creerSignalementsImagesLieu({ depot: { lireImagePubliee: async () => NOM } as unknown as DepotSignalementsImagesLieu, stockages: sansCle.stockages, chiffrement: null, medias: sansCle.medias });
  assert.equal(await s.enregistrer(recu()), "chiffrement-indisponible");
  const casse = creerBanc();
  await casse.stockages.banniere.ecrire(NOM, Buffer.from("x"), { compteId: 7, deposeLe: new Date(QUAND) });
  casse.casser();
  await assert.rejects(casse.signalements.enregistrer(recu()), /base en panne/);
  assert.equal(casse.medias.fichiers.size, 0);
});

test("retrait par la modération : seulement si l'image signalée est toujours celle du lieu", async () => {
  const depot = creerDepotImagesLieuEnMemoire();
  depot.lieux.set(1, { banniere: NOM, logo: null, statut: "publie", imagesMajLe: null });
  const stockages = creerStockagesImagesLieuEnMemoire({ horloge: () => QUAND });
  await stockages.banniere.ecrire(NOM, Buffer.from("x"), { compteId: 7, deposeLe: new Date(QUAND) });
  const images = creerImagesLieu({ stockages, depot: depot.depot, lireRole: async () => null, horloge: () => QUAND });
  assert.deepEqual(await images.retirerParEquipe(1, "banniere", "22222222-2222-4222-8222-222222222222.jpg"), { ok: true, retiree: false });
  assert.equal(depot.lieux.get(1)!.banniere, NOM);
  assert.equal(await stockages.banniere.existe(NOM), true);
  assert.deepEqual(await images.retirerParEquipe(1, "banniere", NOM), { ok: true, retiree: true });
  assert.equal(depot.lieux.get(1)!.banniere, null);
  assert.equal(await stockages.banniere.existe(NOM), false);
});

const recus: SignalementRecu[] = [];
const application = express();
application.use(express.json());
application.use("/signalements", creerRoutesSignalements(async (s) => void recus.push(s)));
const serveur = application.listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => void (recus.length = 0));

let visiteur = 0;
const poster = async (corps: unknown) => {
  const r = await fetch(`${adresse}/signalements`, { method: "POST", headers: { "Content-Type": "application/json", "X-IP-Visiteur": `v-${++visiteur}` }, body: JSON.stringify(corps) });
  return { statut: r.status, corps: await r.json() };
};

test("POST /signalements : une image de lieu, du site comme de l'app ; mal formé refusé ; une publication marche comme avant", async () => {
  assert.deepEqual(await poster({ cible: "image-lieu", lieuId: 3, quelle: "logo", raison: "haine", precision: " Propos racistes ", explication: "Le logo affiche un slogan haineux.", source: "site" }), { statut: 201, corps: { ok: true } });
  assert.deepEqual(recus[0], { cible: "image-lieu", lieuId: 3, quelle: "logo", raison: "haine", precision: "Propos racistes", explication: "Le logo affiche un slogan haineux.", signaleParId: null, source: "site" });
  for (const corps of [
    { cible: "image-lieu", lieuId: 3, quelle: "fond", raison: "haine" },
    { cible: "image-lieu", lieuId: 0, quelle: "logo", raison: "haine" },
    { cible: "image-lieu", lieuId: "3", quelle: "logo", raison: "haine" },
    { cible: "image-lieu", lieuId: 3, quelle: "logo", raison: "inconnue" },
    { cible: "image-lieu", lieuId: 3, quelle: "logo", raison: "autre", explication: "court" },
  ]) assert.deepEqual(await poster(corps), { statut: 400, corps: { ok: false, erreur: "signalement-invalide" } }, JSON.stringify(corps));
  assert.equal(recus.length, 1);
  assert.equal((await poster({ publicationId: "42", lieuId: 7, raison: "arnaque", precision: null, explication: "" })).statut, 201);
  assert.equal(recus[1]?.cible, undefined);
});
