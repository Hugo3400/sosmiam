// Banc d'essai des visites, de la fidélité et du comptoir : l'API avec les comptes (sessions) et les visites EN MÉMOIRE
// (aucune base), une horloge réglable, une clé de QR et une clé de chiffrement de test, des rôles pro posés à la main
// et des points notés au lieu d'être écrits. Chaque appel a sa propre IP.
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import { calculerEmpreinteJeton } from "../../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../../src/fonctions/securite/creer-jeton.ts";
import { creerSignatureQr } from "../../src/fonctions/securite/creer-signature-qr.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../../src/services/comptes-en-memoire.ts";
import type { RoleRattachement } from "../../src/services/pro-regles.ts";
import { creerVisitesEnMemoire, type LieuVisiteEnMemoire } from "../../src/services/visites-en-memoire.ts";

export type Reponse = { statut: number; corps: Record<string, any>; entetes: Headers };

/** Une lecture de position prise au lieu, précise et fraîche */
export const SUR_PLACE = { latitude: 43.6108, longitude: 3.8767, precision: 15, ageMs: 2_000, simulee: false };

/** Un restaurant publié qui valide les visites, à Montpellier */
export const LIEU_TEST: LieuVisiteEnMemoire = {
  id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true,
  position: { latitude: 43.6108, longitude: 3.8767 }, reservable: false, validationActive: true, rayonM: null, codePublic: "chezlea2", sosEnCours: false,
};

export async function creerBancVisites() {
  const banc = { horloge: Date.parse("2026-10-09T10:00:00Z") };
  const memoire = creerComptesEnMemoire(() => banc.horloge);
  const visites = creerVisitesEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const signerQr = creerSignatureQr(new Uint8Array(32).fill(3));
  const roles = new Map<string, RoleRattachement>();
  const points: { compteId: number; valeur: number; raison: string }[] = [];
  let tirage = 0;
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: () => banc.horloge },
    visitesApp: {
      depot: visites.depot, chiffrement, signerQr,
      // Codes à 4 chiffres prévisibles : 1234, 1235…
      tirer: () => 1234 + tirage++,
      lireRole: async (compteId, lieuId) => roles.get(`${compteId}:${lieuId}`) ?? null,
      ajouterPoints: async (compteId, valeur, raison) => void points.push({ compteId, valeur, raison }),
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;

  /** Un compte avec session ; `naissance` : date gardée chiffrée (sans : compte du site, 18 ans) */
  async function creerCompte(o: { prenom?: string; nom?: string; naissance?: string; emailVerifie?: boolean; avatar?: string } = {}) {
    const email = `visite${++numero}@exemple.fr`;
    const id = await memoire.services.creerCompte({ email, motDePasse: "empreinte", prenom: o.prenom ?? "Léa", ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
    if (typeof id !== "number") throw new Error("compte de test impossible");
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
    visites.comptes.set(id, {
      id, prenom: o.prenom ?? "Léa", avatar: o.avatar ?? "🦊",
      nomChiffre: o.nom ? chiffrement.chiffrer(o.nom, "nom") : null,
      dateNaissanceChiffree: o.naissance ? chiffrement.chiffrer(o.naissance, "dateNaissance") : null,
      emailVerifie: o.emailVerifie ?? true, rattachements: [],
    });
    return { id, jeton };
  }

  /** Rattache un compte à un lieu (rôle validé) */
  function rattacher(compteId: number, lieuId: number, role: RoleRattachement = "gerant") {
    roles.set(`${compteId}:${lieuId}`, role);
    visites.comptes.get(compteId)?.rattachements.push({ lieuId, role });
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
    banc.horloge = Date.parse("2026-10-09T10:00:00Z");
    visites.lieux.clear();
    for (const liste of [visites.visites, visites.presentations, visites.cartes, visites.recompenses, visites.demandes]) liste.length = 0;
    visites.programmes.clear();
    points.length = 0;
    visites.lieux.set(1, { ...LIEU_TEST, position: { ...LIEU_TEST.position! } });
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { banc, visites, points, signerQr, creerCompte, rattacher, demander, vider, fermer };
}
