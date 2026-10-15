import type { AddressInfo } from "node:net";

import express from "express";

import { DELAI_INVITATION_AVIS_MS, DUREE_INVITATION_AVIS_MS } from "../../../../packages/commun/src/regles/visites.ts";
import type { DependancesAvis } from "../../src/controleurs/avis.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { creerLimiteConnectes } from "../../src/middlewares/limiter-connectes.ts";
import { creerProtectionComptes } from "../../src/middlewares/proteger-comptes.ts";
import { creerRefuserSiLimite } from "../../src/middlewares/refuser-si-limite.ts";
import { creerRoutesAvisApp } from "../../src/routes/avis.ts";
import { LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP } from "../../src/routes/comptes.ts";
import { creerAvisEnMemoire } from "../../src/services/avis-en-memoire.ts";
import type { LieuAvis } from "../../src/services/avis-regles.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import type { CitationsPhotosAvis, DecisionPhotoAvis } from "../../src/services/photos-avis-regles.ts";
import { creerPhotosAvis } from "../../src/services/photos-avis.ts";
import { creerStockagePhotosAvisEnMemoire } from "../../src/services/stockage-photos-avis.ts";

export type ReponsePhotos = { statut: number; entetes: Headers; octets: Buffer; corps: Record<string, any> | null };
export type DemandePhotos = { jeton?: string; json?: unknown; octets?: Uint8Array; type?: string };

const DEBUT = Date.parse("2026-10-15T10:00:00Z");
const HEURE = 3600_000;

const LIEUX: LieuAvis[] = [
  { id: 1, nom: "Restaurant du Capitaine Bouiboui", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true },
  { id: 2, nom: "La Crêpe du Port", emoji: "🥞", type: "resto", ville: "Sète", publie: true, verifie: false },
];

export async function creerBancPhotosAvis() {
  const banc = { horloge: DEBUT };
  const horloge = () => banc.horloge;
  const memoire = creerComptesEnMemoire(horloge);
  const donnees = creerAvisEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const stockage = creerStockagePhotosAvisEnMemoire({ horloge });
  const decisions: DecisionPhotoAvis[] = [];
  const limites = new Set<number>();
  const lecturesCitations: string[][] = [];
  let retenue: Promise<void> | null = null;

  const citations: CitationsPhotosAvis = {
    lister: async (noms) => {
      lecturesCitations.push([...noms]);
      if (retenue) await retenue;
      return donnees.avis.filter((a) => a.photo !== null && noms.includes(a.photo)).map((a) => ({
        photo: a.photo!, avisId: a.id, statut: a.statut, lieuPublie: donnees.lieux.get(a.lieuId)?.publie ?? false, creeLe: a.creeLe,
      }));
    },
    listerDecisions: async (ids) => decisions.filter((d) => ids.includes(d.avisId)),
  };
  const photos = creerPhotosAvis({ stockage, citations, horloge });
  const dependances: DependancesAvis = { depot: donnees.depot, chiffrement, tirer: () => 7, verifierPhoto: photos.verifier, photos };
  const protection = creerProtectionComptes(memoire.sessions, horloge);
  const limiteConnectee = creerLimiteConnectes(LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP);
  const refuserSiLimite = creerRefuserSiLimite(async (compteId) => (limites.has(compteId) ? { jusqua: null, motif: "spam" } : null), horloge);

  const application = express();
  application.use("/app/avis", express.json({ limit: "8kb" }));
  application.use(express.json({ limit: "4kb" }));
  application.use("/app/avis", creerRoutesAvisApp(dependances, protection, limiteConnectee, horloge, refuserSiLimite));
  application.use((_q, reponse) => void reponse.status(404).json({ ok: false, erreur: "introuvable" }));
  const serveur = application.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;

  async function creerCompte(prenom = "Léa") {
    const id = await memoire.services.creerCompte({
      email: `photos${++numero}@exemple.fr`, motDePasse: "empreinte", prenom, ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro",
    });
    if (typeof id !== "number") throw new Error("compte de test impossible");
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge, support: "app" });
    donnees.comptes.set(id, { id, prenom, nomChiffre: null, emailVerifie: true, creeLe: new Date(banc.horloge - 30 * 24 * HEURE), lieuxLies: [] });
    return { id, jeton };
  }

  function creerVisite(compteId: number, lieuId = 1) {
    const valideLe = new Date(banc.horloge - 2 * HEURE);
    const id = donnees.visites.length + 1;
    donnees.visites.push({
      id, compteId, lieuId, mode: "comptoir", statut: "validee", code: null, creeLe: valideLe, expireLe: null, valideLe, decideLe: valideLe,
      decideParId: null, pendantSos: false, points: 15, tampon: false, resultatPosition: "dans-rayon", motifRefus: null,
      contestee: false, contestation: null,
      avisOuvertLe: new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS),
      avisFermeLe: new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS + DUREE_INVITATION_AVIS_MS),
      avisDonne: false, presentationId: null, reservationId: null, annulableJusqua: null,
      reglement: { type: "paye", reductionPourcent: null, avantages: [] },
    });
    return id;
  }

  async function demander(methode: string, chemin: string, o: DemandePhotos = {}): Promise<ReponsePhotos> {
    const entetes: Record<string, string> = { "X-IP-Visiteur": `v-${Math.random()}`, ...(o.jeton ? { Authorization: `Bearer ${o.jeton}` } : {}) };
    let corps: RequestInit["body"];
    if (o.octets) {
      entetes["Content-Type"] = o.type ?? "image/jpeg";
      corps = o.octets as RequestInit["body"];
    } else if (o.json !== undefined) {
      entetes["Content-Type"] = "application/json";
      corps = JSON.stringify(o.json);
    }
    const reponse = await fetch(`${adresse}${chemin}`, { method: methode, headers: entetes, body: corps });
    const octets = Buffer.from(await reponse.arrayBuffer());
    const estJson = (reponse.headers.get("content-type") ?? "").includes("application/json");
    return { statut: reponse.status, entetes: reponse.headers, octets, corps: estJson ? (JSON.parse(octets.toString("utf8")) as Record<string, any>) : null };
  }

  function retenirCitations(): () => void {
    let liberer = () => {};
    retenue = new Promise<void>((fini) => (liberer = fini));
    return () => {
      retenue = null;
      liberer();
    };
  }

  async function attendreLectures(nombre: number) {
    while (lecturesCitations.length < nombre) await new Promise((suite) => setTimeout(suite, 2));
  }

  function vider() {
    banc.horloge = DEBUT;
    donnees.lieux.clear();
    for (const lieu of LIEUX) donnees.lieux.set(lieu.id, { ...lieu });
    for (const liste of [donnees.visites, donnees.avis, donnees.relectures, donnees.pointsPhoto, decisions, lecturesCitations]) liste.length = 0;
    stockage.fichiers.clear();
    limites.clear();
  }
  vider();

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return {
    banc, donnees, stockage, decisions, limites, lecturesCitations, photos, citations, creerCompte, creerVisite, demander, retenirCitations, attendreLectures,
    vider, fermer, HEURE,
  };
}
