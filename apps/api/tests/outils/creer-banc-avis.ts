// Banc d'essai des avis : le routeur /app/avis et les deux routes des avis au comptoir, montés comme application.ts et
// routes/comptoir.ts les monteront, avec les comptes (sessions) et les avis EN MÉMOIRE (aucune base), une horloge réglable,
// une clé de chiffrement de test, un tirage au sort réglable et des rôles pro posés à la main. Les points de la photo vont
// au journal du double (donnees.pointsPhoto, dans la transaction de l'avis) ; ajouterPoints (l'ancien branchement, qui ne
// doit plus servir) et les défis relancés après sont notés ; pannes à la demande (les points, ou la fin de la transaction,
// après tout ce qu'elle a écrit : ce qu'elle voyait est gardé dans vuEnFin). Les gestes qui comptent pour l'ordre des
// verrous (verrouiller le compte, lire et marquer la visite, poser les points) sont notés dans l'ordre (gestes). Chaque
// appel a sa propre IP.
import type { AddressInfo } from "node:net";

import express, { Router } from "express";

import { DELAI_INVITATION_AVIS_MS, DUREE_INVITATION_AVIS_MS } from "../../../../packages/commun/src/regles/visites.ts";
import type { ReglementVisite, StatutVisite } from "../../../../packages/commun/src/types/visite.ts";
import { creerControleursAvisPro } from "../../src/controleurs/avis-pro.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { creerLimiteConnectes } from "../../src/middlewares/limiter-connectes.ts";
import { creerProtectionComptes, gererErreursComptes } from "../../src/middlewares/proteger-comptes.ts";
import { creerRoutesAvisApp } from "../../src/routes/avis.ts";
import { LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP } from "../../src/routes/comptes.ts";
import { creerAvisEnMemoire } from "../../src/services/avis-en-memoire.ts";
import type { DepotAvis, LieuAvis, NouvelleLigneAvis, TablesAvis } from "../../src/services/avis-regles.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import type { RoleRattachement } from "../../src/services/pro-regles.ts";

export type Reponse = { statut: number; corps: Record<string, any>; entetes: Headers };

const DEBUT = Date.parse("2026-10-09T10:00:00Z");
const JOUR = 24 * 3600_000;

/** 1 : vérifié (il a un gérant) ; 2 : non vérifié ; 3 : bar non vérifié ; 4 : masqué */
const LIEUX: LieuAvis[] = [
  { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true },
  { id: 2, nom: "La Crêpe du Port", emoji: "🥞", type: "resto", ville: "Sète", publie: true, verifie: false },
  { id: 3, nom: "Le Comptoir du Lez", emoji: "🍹", type: "bar", ville: "Montpellier", publie: true, verifie: false },
  { id: 4, nom: "Le Rideau Baissé", emoji: "🍲", type: "resto", ville: "Béziers", publie: false, verifie: true },
];

export async function creerBancAvis() {
  const banc = { horloge: DEBUT, tirage: 7 };
  const memoire = creerComptesEnMemoire(() => banc.horloge);
  const donnees = creerAvisEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const roles = new Map<string, RoleRattachement>();
  const points: { compteId: number; valeur: number; raison: string; detail?: string }[] = [];
  const defis: number[] = [];
  const tirages: number[] = [];
  const horloge = () => banc.horloge;

  const panne = { points: false, finTransaction: false };
  /** Ce que la transaction voyait juste avant sa panne de fin : les avis et les détails des points de la photo écrits */
  const vuEnFin: { avis: number[]; points: string[] }[] = [];
  /** Dans l'ordre, chaque geste noté et son premier argument : « verrouillerCompte 3 », « lireVisite 1 »… */
  const gestes: string[] = [];
  const observer = (t: TablesAvis): TablesAvis => ({
    ...t,
    verrouillerCompte: async (compteId) => (gestes.push(`verrouillerCompte ${compteId}`), t.verrouillerCompte(compteId)),
    lireVisite: async (id) => (gestes.push(`lireVisite ${id}`), t.lireVisite(id)),
    marquerAvisDonne: async (visiteId) => (gestes.push(`marquerAvisDonne ${visiteId}`), t.marquerAvisDonne(visiteId)),
    poserPointsPhoto: async (...args) => {
      gestes.push(`poserPointsPhoto ${args[0]}`);
      if (panne.points) throw new Error("base indisponible");
      return t.poserPointsPhoto(...args);
    },
  });
  const depot: DepotAvis = {
    lire: donnees.depot.lire,
    ecrire: (fn) => donnees.depot.ecrire(async (t) => {
      const r = await fn(observer(t));
      if (panne.finTransaction) {
        vuEnFin.push({ avis: donnees.avis.map((a) => a.id), points: donnees.pointsPhoto.map((m) => m.detail) });
        throw new Error("transaction interrompue");
      }
      return r;
    }),
    dans: (tx) => observer(donnees.depot.dans(tx)),
  };

  const dependances = {
    depot, chiffrement,
    tirer: (max: number) => (tirages.push(max), banc.tirage),
    ajouterPoints: async (compteId: number, valeur: number, raison: "avis-photo", detail?: string) => void points.push({ compteId, valeur, raison, detail }),
    reevaluerDefis: async (compteId: number) => void defis.push(compteId),
    // Seule la photo « photo-<compte>.jpg » a été envoyée par ce compte
    verifierPhoto: async (fichier: string, compteId: number) => fichier === `photo-${compteId}.jpg`,
  };
  const protection = creerProtectionComptes(memoire.sessions, horloge);
  const limiteConnectee = creerLimiteConnectes(LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP);
  const roleDe = async (compteId: number, lieuId: number) => roles.get(`${compteId}:${lieuId}`) ?? null;

  // Comme routes/comptoir.ts : session, jamais en cache, puis les deux routes des avis
  const avisPro = creerControleursAvisPro(dependances, roleDe, horloge);
  const comptoir = Router();
  comptoir.use(limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  comptoir.get("/lieux/:id/avis", avisPro.lister);
  comptoir.post("/avis/:avisId/reponse", avisPro.repondre);
  comptoir.use(gererErreursComptes);

  const application = express();
  application.use("/app/avis", express.json({ limit: "8kb" }));
  application.use(express.json({ limit: "4kb" }));
  application.use("/app/avis", creerRoutesAvisApp(dependances, protection, limiteConnectee, horloge));
  application.use("/pro/comptoir", comptoir);
  application.use((_q, reponse) => void reponse.status(404).json({ ok: false, erreur: "introuvable" }));
  const serveur = application.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;

  /**
   * Un compte avec session. nom : gardé chiffré (l'initiale de la signature) ; neuf : créé à l'instant (sinon
   * il y a 30 jours) ; ambassadeur : ambassadeur actif ; lies : lieux de ses rattachements (validés ou en attente)
   */
  async function creerCompte(o: { prenom?: string; nom?: string; emailVerifie?: boolean; neuf?: boolean; ambassadeur?: boolean; lies?: number[] } = {}) {
    const email = `avis${++numero}@exemple.fr`;
    const prenom = o.prenom ?? "Léa";
    const id = await memoire.services.creerCompte({ email, motDePasse: "empreinte", prenom, ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
    if (typeof id !== "number") throw new Error("compte de test impossible");
    if (o.ambassadeur) await memoire.decider(id, "actif");
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge, support: "app" });
    donnees.comptes.set(id, {
      id, prenom,
      nomChiffre: o.nom ? chiffrement.chiffrer(o.nom, "nom") : null,
      emailVerifie: o.emailVerifie ?? true,
      creeLe: new Date(o.neuf ? banc.horloge : banc.horloge - 30 * JOUR),
      lieuxLies: o.lies ?? [],
    });
    return { id, jeton };
  }

  /** Rattache un compte à un lieu (rôle validé) */
  function rattacher(compteId: number, lieuId: number, role: RoleRattachement = "gerant") {
    roles.set(`${compteId}:${lieuId}`, role);
    donnees.comptes.get(compteId)?.lieuxLies.push(lieuId);
  }

  /** Une visite (validée par défaut, au comptoir, payée) ; valideLe par défaut : maintenant. L'avis s'ouvre 1 h après */
  function creerVisite(compteId: number, lieuId: number, o: { valideLe?: number; reglement?: ReglementVisite | null; statut?: StatutVisite } = {}) {
    const valideLe = new Date(o.valideLe ?? banc.horloge);
    const statut = o.statut ?? "validee";
    const ouvert = statut === "validee";
    const id = donnees.visites.length + 1;
    donnees.visites.push({
      id, compteId, lieuId, mode: "comptoir", statut, code: null, creeLe: valideLe, expireLe: null, valideLe: ouvert ? valideLe : null, decideLe: valideLe,
      decideParId: null, pendantSos: false, points: ouvert ? 15 : 0, tampon: false, resultatPosition: "dans-rayon", motifRefus: ouvert ? null : "pas-venu",
      contestee: false, contestation: null,
      avisOuvertLe: ouvert ? new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS) : null,
      avisFermeLe: ouvert ? new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS + DUREE_INVITATION_AVIS_MS) : null,
      avisDonne: false, presentationId: null, reservationId: null, annulableJusqua: null,
      reglement: o.reglement === undefined ? { type: "paye", reductionPourcent: null, avantages: [] } : o.reglement,
    });
    return id;
  }

  /** Un avis écrit directement dans les données (sans passer par l'API) */
  async function ajouterAvis(o: Partial<NouvelleLigneAvis> & { lieuId: number }) {
    return donnees.depot.ecrire((t) => t.creerAvis({
      compteId: 999, visiteId: null, note: 4, texte: "Très bonne adresse, on reviendra.", photo: null, signature: "Sam B.",
      statut: "publie", raisonRelecture: null, repasOffert: false, creeLe: new Date(banc.horloge), ...o,
    }));
  }

  async function demander(methode: string, chemin: string, jeton?: string, corps?: unknown): Promise<Reponse> {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: { "X-IP-Visiteur": `v-${Math.random()}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
  }

  /** Remet tout à zéro entre deux tests (comptes et sessions restent) */
  function vider() {
    banc.horloge = DEBUT;
    banc.tirage = 7;
    Object.assign(panne, { points: false, finTransaction: false });
    donnees.lieux.clear();
    donnees.pointsComptes.clear();
    for (const lieu of LIEUX) donnees.lieux.set(lieu.id, { ...lieu });
    for (const liste of [donnees.visites, donnees.avis, donnees.relectures, donnees.pointsPhoto, points, defis, tirages, vuEnFin, gestes]) liste.length = 0;
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { banc, donnees, points, defis, panne, vuEnFin, tirages, gestes, creerCompte, rattacher, creerVisite, ajouterAvis, demander, vider, fermer, JOUR };
}
