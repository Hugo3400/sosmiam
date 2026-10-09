// Banc d'essai des événements des lieux : les comptes (sessions) et les événements EN MÉMOIRE (aucune base), une horloge
// réglable, des rôles pro posés à la main et une clé de chiffrement de test (âge). Les routes sont montées comme le
// coordinateur les branche : /app/evenements (routes/evenements.ts) et, dans /pro/comptoir, les lignes de routes/comptoir.ts
// (même protection : session, limite « connecté », jamais en cache). Chaque appel a sa propre IP.
import type { AddressInfo } from "node:net";

import express, { Router, type RequestHandler } from "express";

import { creerControleursEvenementsPro } from "../../src/controleurs/evenements-pro.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { gererErreurs } from "../../src/middlewares/gerer-erreurs.ts";
import { creerLimiteConnectes } from "../../src/middlewares/limiter-connectes.ts";
import { creerProtectionComptes, gererErreursComptes } from "../../src/middlewares/proteger-comptes.ts";
import { LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP } from "../../src/routes/comptes.ts";
import { LIMITE_GESTES_COMPTOIR, LIMITE_LECTURES_COMPTOIR } from "../../src/routes/comptoir.ts";
import { creerRoutesEvenementsApp } from "../../src/routes/evenements.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import { creerEvenementsEnMemoire, type LieuEvenementEnMemoire } from "../../src/services/evenements-en-memoire.ts";
import type { RoleRattachement } from "../../src/services/pro-regles.ts";
import { limiterRequetes } from "../../src/middlewares/limiter-requetes.ts";
import { lireCompteId } from "../../src/controleurs/comptes-champs.ts";

export type Reponse = { statut: number; corps: Record<string, any>; entetes: Headers };

/** Vendredi 9 octobre 2026, 12 h à Paris */
export const DEPART = Date.parse("2026-10-09T10:00:00Z");

/** Un restaurant publié et vérifié, à Montpellier */
export const LIEU_TEST: LieuEvenementEnMemoire = {
  id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true, latitude: 43.6108, longitude: 3.8767,
};

export async function creerBancEvenements() {
  const banc = { horloge: DEPART };
  const horloge = () => banc.horloge;
  const memoire = creerComptesEnMemoire(horloge);
  const evenements = creerEvenementsEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const roles = new Map<string, RoleRattachement>();

  const application = express();
  application.use(express.json({ limit: "16kb" }));
  const protection = creerProtectionComptes(memoire.sessions, horloge);
  const limiteConnectee = creerLimiteConnectes(LIMITE_CONNECTEE, LIMITE_CONNECTEE_IP);
  application.use("/app/evenements", creerRoutesEvenementsApp({ services: evenements.services, chiffrement }, protection, limiteConnectee, horloge));

  // Comme routes/visites.ts et routes/comptoir.ts : roleDe = comptoir.roleDe (rattachement validé ET 18 ans, posé ici à la main)
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const avant: RequestHandler[] = [limiteConnectee, protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  }];
  const evenementsPro = creerControleursEvenementsPro(evenements.services, async (compteId, lieuId) => roles.get(`${compteId}:${lieuId}`) ?? null, horloge);
  const lectures = parCompte(LIMITE_LECTURES_COMPTOIR);
  const gestes = parCompte(LIMITE_GESTES_COMPTOIR);
  const comptoir = Router();
  comptoir.use(...avant);
  comptoir.get("/lieux/:id/evenements", lectures, evenementsPro.lister);
  comptoir.post("/lieux/:id/evenements", gestes, evenementsPro.creer);
  comptoir.put("/lieux/:id/evenements/:evenementId", gestes, evenementsPro.modifier);
  comptoir.delete("/lieux/:id/evenements/:evenementId", gestes, evenementsPro.annuler);
  comptoir.use(gererErreursComptes);
  application.use("/pro/comptoir", comptoir);
  application.use((_q, reponse) => void reponse.status(404).json({ ok: false, erreur: "introuvable" }));
  application.use(gererErreurs);

  const serveur = application.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;

  /** Un compte avec session ; `naissance` : date gardée chiffrée (sans : compte du site, 18 ans) */
  async function creerCompte(o: { prenom?: string; naissance?: string } = {}) {
    const email = `evenement${++numero}@exemple.fr`;
    const id = await memoire.services.creerCompte({ email, motDePasse: "empreinte", prenom: o.prenom ?? "Léa", ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
    if (typeof id !== "number") throw new Error("compte de test impossible");
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge, support: "app" });
    evenements.comptes.set(id, { prenom: o.prenom ?? "Léa", dateNaissanceChiffree: o.naissance ? chiffrement.chiffrer(o.naissance, "dateNaissance") : null });
    return { id, jeton };
  }

  /** Rattache un compte à un lieu (rôle validé, 18 ans : c'est ce que rend comptoir.roleDe) */
  function rattacher(compteId: number, lieuId: number, role: RoleRattachement = "gerant") {
    roles.set(`${compteId}:${lieuId}`, role);
  }

  async function demander(methode: string, chemin: string, jeton?: string, corps?: unknown): Promise<Reponse> {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: { "X-IP-Visiteur": `v-${Math.random()}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any>, entetes: reponse.headers };
  }

  /** Remet tout à zéro entre deux tests (les comptes de memoire et leurs sessions restent, les rôles partent) */
  function vider() {
    banc.horloge = DEPART;
    const comptes = new Map(evenements.comptes);
    evenements.vider();
    for (const [id, compte] of comptes) evenements.comptes.set(id, compte);
    roles.clear();
    evenements.lieux.set(1, { ...LIEU_TEST });
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { banc, evenements, creerCompte, rattacher, demander, vider, fermer };
}
