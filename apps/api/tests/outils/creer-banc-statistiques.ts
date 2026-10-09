// Banc d'essai des vues des fiches et des statistiques d'un lieu : un petit serveur Express qui monte les routes comme
// application.ts le fera (POST /app/lieux/:id/vue sans session, GET /pro/comptoir/lieux/:id/statistiques avec session), avec
// les comptes, les visites (pour l'âge et les rôles du comptoir), les vues et les statistiques EN MÉMOIRE (aucune base). Le
// rôle passe par le vrai comptoir (comptoir.roleDe : rattachement validé ET 18 ans). Horloge réglable.
import type { AddressInfo } from "node:net";

import express, { Router } from "express";

import { creerControleursStatistiques } from "../../src/controleurs/statistiques-lieu.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { creerSignatureQr } from "../../src/fonctions/securite/creer-signature-qr.ts";
import { gererErreurs } from "../../src/middlewares/gerer-erreurs.ts";
import { creerProtectionComptes, gererErreursComptes } from "../../src/middlewares/proteger-comptes.ts";
import { creerRoutesVuesLieux } from "../../src/routes/vues-lieux.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import { creerComptoir } from "../../src/services/comptoir.ts";
import type { RoleRattachement } from "../../src/services/pro-regles.ts";
import { creerStatistiquesLieuEnMemoire } from "../../src/services/statistiques-lieu-en-memoire.ts";
import { creerVisitesEnMemoire } from "../../src/services/visites-en-memoire.ts";
import { creerVuesLieuxEnMemoire } from "../../src/services/vues-lieux-en-memoire.ts";

export type Reponse = { statut: number; corps: Record<string, any> | null; entetes: Headers };

/** Vendredi 9 octobre 2026, 12 h à Paris (semaine 2026-S41, qui commence le lundi 5) */
export const DEBUT_BANC = Date.parse("2026-10-09T10:00:00Z");

export async function creerBancStatistiques(o: { retenuesMax?: number } = {}) {
  const banc = { horloge: DEBUT_BANC };
  const horloge = () => banc.horloge;
  const memoire = creerComptesEnMemoire(horloge);
  const visites = creerVisitesEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const roles = new Map<string, RoleRattachement>();
  const comptoir = creerComptoir({
    depot: visites.depot, chiffrement, signerQr: creerSignatureQr(new Uint8Array(32).fill(3)), tirer: () => 1234, horloge,
    lireRole: async (compteId, lieuId) => roles.get(`${compteId}:${lieuId}`) ?? null,
  });
  const vues = creerVuesLieuxEnMemoire();
  const statistiques = creerStatistiquesLieuEnMemoire(vues.vues);

  const application = express();
  application.use(express.json({ limit: "4kb" }));
  // Comme dans application.ts : monté sur /app, avant les autres routeurs /app (ce qu'il ne connaît pas passe)
  application.use("/app", creerRoutesVuesLieux({ services: vues.services, horloge, retenuesMax: o.retenuesMax }));
  // Comme la route ajoutée à routes/comptoir.ts : session obligatoire, jamais en cache
  const protection = creerProtectionComptes(memoire.sessions, horloge);
  const controleur = creerControleursStatistiques(statistiques.services, (compteId, lieuId) => comptoir.roleDe(compteId, lieuId), horloge);
  const pro = Router();
  pro.use(protection.exigerCompte, (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  });
  pro.get("/lieux/:id/statistiques", controleur.lire);
  pro.use(gererErreursComptes);
  application.use("/pro/comptoir", pro);
  application.use((_q, reponse) => {
    reponse.status(404).json({ ok: false, erreur: "introuvable" });
  });
  application.use(gererErreurs);

  const serveur = application.listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;
  let appel = 0;

  /** Un compte avec session ; `naissance` : date gardée chiffrée (sans : compte du site, 18 ans) */
  async function creerCompte(o: { prenom?: string; naissance?: string } = {}) {
    const id = await memoire.services.creerCompte({
      email: `stats${++numero}@exemple.fr`, motDePasse: "empreinte", prenom: o.prenom ?? "Léa", ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro",
    });
    if (typeof id !== "number") throw new Error("compte de test impossible");
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
    visites.comptes.set(id, {
      id, prenom: o.prenom ?? "Léa", avatar: "🦊", nomChiffre: null,
      dateNaissanceChiffree: o.naissance ? chiffrement.chiffrer(o.naissance, "dateNaissance") : null, emailVerifie: true, rattachements: [],
    });
    return { id, jeton };
  }

  /** Rattache un compte à un lieu (rôle validé) */
  function rattacher(compteId: number, lieuId: number, role: RoleRattachement = "gerant") {
    roles.set(`${compteId}:${lieuId}`, role);
    visites.comptes.get(compteId)?.rattachements.push({ lieuId, role });
  }

  /** Une demande ; `ip` : l'adresse du visiteur (X-IP-Visiteur), une nouvelle à chaque appel sans elle */
  async function demander(methode: string, chemin: string, o: { jeton?: string; ip?: string } = {}): Promise<Reponse> {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: { "X-IP-Visiteur": o.ip ?? `10.${(++appel >> 16) & 255}.${(appel >> 8) & 255}.${appel & 255}`, ...(o.jeton ? { Authorization: `Bearer ${o.jeton}` } : {}) },
    });
    const texte = await reponse.text();
    return { statut: reponse.status, corps: texte ? (JSON.parse(texte) as Record<string, any>) : null, entetes: reponse.headers };
  }

  /** Remet les données à zéro entre deux tests (comptes, sessions et empreintes du jour restent) */
  function vider() {
    banc.horloge = DEBUT_BANC;
    vues.vues.length = 0;
    vues.publies.clear();
    vues.publies.add(1);
    vues.publies.add(2);
    statistiques.rescousses.length = 0;
    statistiques.visites.length = 0;
    roles.clear();
    for (const compte of visites.comptes.values()) compte.rattachements.length = 0;
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { banc, vues, statistiques, creerCompte, rattacher, demander, vider, fermer };
}
