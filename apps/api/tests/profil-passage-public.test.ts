// PATCH /comptes/moi/profil { prive: false } : repasser en public accepte les demandes de suivi en attente (partie sociale,
// creerApresPassageEnPublic, branché dans demarrer.ts), et un échec de ce branchement ne fait pas échouer le profil.
// Tout en mémoire (aucune base), avec une clé de test.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerApresPassageEnPublic } from "../src/controleurs/suivis-personnes.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerSocialAppEnMemoire } from "../src/services/social-app-en-memoire.ts";

test("PATCH /comptes/moi/profil { prive: false } : avec apresPassageEnPublic, les demandes en attente sont acceptées (cloche « demande-acceptee »)", async () => {
  const essai = await creerBancProfil();
  try {
    const lea = await essai.personne("lea.discrete");
    const tom = await essai.personne("tom.patient");
    essai.social.tables.comptes.get(lea.compteId)!.prive = true;
    essai.social.tables.suivis.push({ suiveurId: tom.compteId, suiviId: lea.compteId, statut: "demande", creeLe: new Date(essai.horloge.maintenant), accepteLe: null });
    const r = await essai.demander(lea.jeton, "PATCH", "/comptes/moi/profil", { prive: false });
    assert.deepEqual([r.statut, r.corps.profil.prive], [200, false]);
    assert.equal(essai.social.tables.suivis[0]!.statut, "accepte");
    assert.deepEqual([...essai.social.tables.cloche.values()].map((n) => [n.compteId, n.type, n.acteurId]), [[tom.compteId, "demande-acceptee", lea.compteId]]);
    // Rester privé, ou ne rien dire de « prive » : rien ne bouge
    essai.social.tables.suivis.push({ suiveurId: lea.compteId, suiviId: tom.compteId, statut: "demande", creeLe: new Date(essai.horloge.maintenant), accepteLe: null });
    await essai.demander(tom.jeton, "PATCH", "/comptes/moi/profil", { prive: true });
    await essai.demander(tom.jeton, "PATCH", "/comptes/moi/profil", { ville: "Nantes" });
    assert.equal(essai.social.tables.suivis[1]!.statut, "demande");
  } finally {
    await essai.fermer();
  }
});

test("PATCH /comptes/moi/profil : un échec de apresPassageEnPublic ne fait pas échouer la modification du profil", async () => {
  const essai = await creerBancProfil(async () => {
    throw new Error("base indisponible");
  });
  try {
    const lea = await essai.personne("lea.tenace");
    const r = await essai.demander(lea.jeton, "PATCH", "/comptes/moi/profil", { prive: false });
    assert.deepEqual([r.statut, r.corps.ok], [200, true]);
  } finally {
    await essai.fermer();
  }
});

/**
 * L'API avec les comptes ET la dépendance apresPassageEnPublic branchée comme dans demarrer.ts (le banc social ne la pose
 * pas) : PATCH /comptes/moi/profil et la partie sociale sur les mêmes comptes en mémoire. `apres` : pour essayer un échec
 */
async function creerBancProfil(apres?: (compteId: number) => Promise<void>) {
  const horloge = { maintenant: Date.parse("2026-10-14T10:00:00Z") };
  const lire = () => horloge.maintenant;
  const memoire = creerComptesEnMemoire(lire);
  const chiffrement = creerChiffrementDonnees(randomBytes(32));
  const social = creerSocialAppEnMemoire({ chiffrement, comptes: memoire.comptes, horloge: lire });
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: {
      services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: lire, chiffrement,
      apresPassageEnPublic: apres ?? creerApresPassageEnPublic(social.dependances, lire),
    },
    socialApp: social.dependances,
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  let numero = 0;
  async function demander(jeton: string, methode: string, chemin: string, corps?: unknown) {
    const reponse = await fetch(`${adresse}${chemin}`, {
      method: methode,
      headers: { "X-IP-Visiteur": `profil-${++numero}`, "Content-Type": "application/json", Authorization: `Bearer ${jeton}` },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { statut: reponse.status, corps: (await reponse.json()) as any };
  }
  async function personne(pseudo: string) {
    const compteId = await memoire.services.creerCompte({
      email: `${pseudo}@exemple.fr`, motDePasse: "empreinte", prenom: "Miami", ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro",
    });
    if (typeof compteId !== "number") throw new Error("compte de test impossible");
    memoire.comptes.get(compteId)!.pseudo = pseudo;
    const jeton = creerJeton();
    await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: lire(), activite: lire(), support: "app" });
    assert.equal((await demander(jeton, "POST", "/app/social/moi")).statut, 201);
    return { compteId, jeton };
  }
  return { horloge, social, demander, personne, fermer: () => new Promise<void>((fini) => serveur.close(() => fini())) };
}
