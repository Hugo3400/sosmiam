// Tests des routes d'un compte limité (décision de Hugo du 15 octobre 2026) : « Ton compte est limité » (GET
// /comptes/moi/limitation) et sa contestation (une fois, pendant la limitation) ; 403 « compte-limite » { details: { jusqua } }
// sur ce que les autres verraient (suggestions, invitations et équipe pro, fiche et carte du lieu, prénom, pseudo, avatar) ;
// tout le reste passe (proposer un lieu, demander un rattachement, lire, Mon compte, supprimer son compte). Tout en
// mémoire, avec une clé de TEST : aucune base.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerLimitationsEnMemoire } from "../src/services/limitations-comptes-en-memoire.ts";
import type { ServicesLimitations } from "../src/services/limitations-comptes-regles.ts";
import { FICHE_TEST } from "./outils/creer-banc-pro.ts";

const JOUR = 86_400_000;
const horloge = { maintenant: Date.parse("2026-10-15T10:00:00Z") };
const MOT_DE_PASSE = "mon chat adore les croissants";
const POURQUOI = "Des messages insultants envoyés à plusieurs personnes.";
const memoire = creerComptesEnMemoire(() => horloge.maintenant);
const limitations = creerLimitationsEnMemoire(() => horloge.maintenant);

/** Une API en mémoire ; `limitations` absent : aucun service de limitations branché */
async function demarrer(services?: ServicesLimitations) {
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    comptes: {
      services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro,
      horloge: () => horloge.maintenant, chiffrement: creerChiffrementDonnees(randomBytes(32)), limitations: services,
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  return { adresse: `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`, fermer: () => new Promise<void>((fini) => serveur.close(() => fini())) };
}
const api = await demarrer(limitations.services);
const sansService = await demarrer();
after(async () => {
  await api.fermer();
  await sansService.fermer();
});

let visiteur = 0;
async function demander(methode: string, chemin: string, options: { jeton?: string; corps?: unknown; adresse?: string } = {}) {
  const reponse = await fetch(`${options.adresse ?? api.adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json", ...(options.jeton ? { "X-Session-Compte": options.jeton } : {}) },
    body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any> };
}

let numero = 0;
/** Un compte de l'app inscrit par l'API (vrai mot de passe, pseudo, avatar) : son id et son jeton */
async function inscrire() {
  const n = ++numero;
  const r = await demander("POST", "/comptes", {
    corps: { email: `limite${n}@exemple.fr`, motDePasse: MOT_DE_PASSE, prenom: "Zoé", dateNaissance: "2000-01-31", ville: "Nantes", cgu: true, espace: "app", pseudo: `zoe_${n}` },
  });
  assert.equal(r.statut, 201);
  const id = [...memoire.comptes.values()].find((c) => c.email === `limite${n}@exemple.fr`)?.id;
  if (!id) throw new Error("compte de test introuvable");
  assert.equal((await demander("PATCH", "/comptes/moi/profil", { jeton: r.corps.session, corps: { avatar: "🦊" } })).statut, 200);
  return { id, jeton: r.corps.session as string };
}
let prochainLieu = 900;
function ajouterLieu() {
  const id = ++prochainLieu;
  memoire.lieux.set(id, structuredClone(FICHE_TEST));
  return id;
}
/** Un gérant validé d'un nouveau lieu */
async function creerGerant() {
  const compte = await inscrire();
  const lieuId = ajouterLieu();
  const demande = await demander("POST", "/comptes/moi/rattachements", { jeton: compte.jeton, corps: { lieuId, role: "gerant", preuve: "Je suis la gérante." } });
  assert.ok(memoire.deciderRattachement(demande.corps.id, "valide"));
  return { ...compte, lieuId };
}
async function limiter(compteId: number, fin: Date | null = new Date(horloge.maintenant + 7 * JOUR), debut?: Date) {
  const r = await limitations.services.limiterCompte({ compteId, motif: "haine", motivation: POURQUOI, fin, debut });
  if (!r.ok) throw new Error(`limitation de test impossible : ${JSON.stringify(r)}`);
  return r.limitation;
}
const refus = (jusqua: Date | null) => ({ ok: false, erreur: "compte-limite", details: { jusqua: jusqua?.toISOString() ?? null } });

test("GET /comptes/moi/limitation : null sans limitation (ou sans service), puis la limitation en clair, sans rien sur l'équipe", async () => {
  const { id, jeton } = await inscrire();
  assert.deepEqual((await demander("GET", "/comptes/moi/limitation", { jeton })).corps, { ok: true, limitation: null });
  assert.equal((await demander("GET", "/comptes/moi/limitation")).statut, 401);
  const fin = new Date(horloge.maintenant + 7 * JOUR);
  await limiter(id, fin);
  assert.deepEqual((await demander("GET", "/comptes/moi/limitation", { jeton })).corps, {
    ok: true,
    limitation: {
      motif: "haine", motivation: POURQUOI, debut: new Date(horloge.maintenant).toISOString(), fin: fin.toISOString(), contestation: null,
      contesteLe: null, reexamineLe: null, active: true, peutContester: true,
    },
  });
  // Sans service branché : personne n'est limité
  assert.deepEqual((await demander("GET", "/comptes/moi/limitation", { jeton, adresse: sansService.adresse })).corps, { ok: true, limitation: null });
  // À venir : montrée, mais pas encore contestable
  const autre = await inscrire();
  await limiter(autre.id, null, new Date(horloge.maintenant + 2 * JOUR));
  const aVenir = (await demander("GET", "/comptes/moi/limitation", { jeton: autre.jeton })).corps.limitation;
  assert.deepEqual([aVenir.active, aVenir.peutContester, aVenir.fin], [false, false, null]);
});

test("POST /comptes/moi/limitation/contestation : 10 à 1 000 caractères, une seule fois, pendant la limitation seulement", async () => {
  const { id, jeton } = await inscrire();
  const contester = (texte: unknown, j = jeton) => demander("POST", "/comptes/moi/limitation/contestation", { jeton: j, corps: { texte } });
  assert.deepEqual((await contester("Ce n'était pas moi du tout.")).corps, { ok: false, erreur: "aucune-limitation" });
  const limitation = await limiter(id);
  for (const texte of ["  court !  ", "x".repeat(1001), 42]) assert.deepEqual((await contester(texte)).corps, { ok: false, erreur: "champ-invalide", champ: "texte" });
  const r = await contester("  Ce n'était pas moi du tout.  ");
  assert.equal(r.statut, 200);
  assert.deepEqual([r.corps.limitation.contestation, r.corps.limitation.contesteLe, r.corps.limitation.peutContester], [
    "Ce n'était pas moi du tout.", new Date(horloge.maintenant).toISOString(), false,
  ]);
  assert.deepEqual([(await contester("Une deuxième fois, pour voir.")).statut, limitations.limitations.get(limitation.id)?.contestation], [409, "Ce n'était pas moi du tout."]);
  // Finie : plus rien à contester
  const autre = await inscrire();
  await limiter(autre.id, new Date(horloge.maintenant + JOUR));
  horloge.maintenant += 2 * JOUR;
  try {
    assert.deepEqual((await contester("Ce n'était pas moi du tout.", autre.jeton)).corps, { ok: false, erreur: "aucune-limitation" });
    assert.deepEqual((await demander("GET", "/comptes/moi/limitation", { jeton: autre.jeton })).corps, { ok: true, limitation: null });
  } finally {
    horloge.maintenant -= 2 * JOUR;
  }
  // Sans service : 404
  const sans = await demander("POST", "/comptes/moi/limitation/contestation", { jeton, adresse: sansService.adresse, corps: { texte: "Ce n'était pas moi du tout." } });
  assert.deepEqual([sans.statut, sans.corps.erreur], [404, "aucune-limitation"]);
  // 10 envois par compte et par 24 h, essais refusés compris (6 déjà faits sur cette API)
  const statuts = [];
  for (let i = 0; i < 5; i++) statuts.push((await contester("Encore et encore, pour voir.")).statut);
  assert.deepEqual(statuts, [409, 409, 409, 409, 429]);
});

test("compte limité : 403 compte-limite sur les suggestions, et sur prénom, pseudo et avatar seulement s'ils CHANGENT", async () => {
  const { id, jeton } = await inscrire();
  const lieuId = ajouterLieu();
  const suggestion = { lieuId, proposition: { horaires: "Tous les jours, 12h–23h" } };
  const fin = new Date(horloge.maintenant + 7 * JOUR);
  await limiter(id, fin);
  assert.deepEqual((await demander("POST", "/comptes/moi/suggestions", { jeton, corps: suggestion })).corps, refus(fin));
  // Ce que l'app renvoie : tous les champs modifiables du profil
  const { prenom, nom, pseudo, ville, envies, avatar, prive } = (await demander("GET", "/comptes/moi/profil", { jeton })).corps.profil;
  const profil = { prenom, nom, pseudo, ville, envies, avatar, prive };
  for (const changement of [{ prenom: "Zouzou" }, { pseudo: "nouveau_pseudo" }, { avatar: "🐸" }]) {
    const r = await demander("PATCH", "/comptes/moi/profil", { jeton, corps: { ...profil, ...changement } });
    assert.deepEqual([r.statut, r.corps], [403, refus(fin)], JSON.stringify(changement));
  }
  assert.deepEqual((await demander("PATCH", "/comptes/moi", { jeton, corps: { prenom: "Zouzou" } })).corps, refus(fin));
  // Le profil entier renvoyé tel quel, avec une autre ville, d'autres envies, « privé » : permis ; retirer son avatar aussi
  const r = await demander("PATCH", "/comptes/moi/profil", { jeton, corps: { ...profil, ville: "Brest", envies: { musique: ["jazz"] }, prive: true } });
  assert.deepEqual([r.statut, r.corps.profil.ville, r.corps.profil.pseudo, r.corps.profil.avatar], [200, "Brest", profil.pseudo, "🦊"]);
  assert.equal((await demander("PATCH", "/comptes/moi/profil", { jeton, corps: { avatar: null } })).corps.profil.avatar, null);
  assert.equal((await demander("PATCH", "/comptes/moi", { jeton, corps: { prenom: "Zoé" } })).statut, 200);
  // Rien n'a changé de ce qui se voit
  assert.deepEqual([memoire.comptes.get(id)?.prenom, memoire.comptes.get(id)?.pseudo], ["Zoé", profil.pseudo]);
  // Levée : tout repasse
  const levee = await limitations.services.leverLimitation([...limitations.limitations.values()].find((l) => l.compteId === id)!.id, new Date(horloge.maintenant));
  assert.ok(levee.ok);
  assert.equal((await demander("POST", "/comptes/moi/suggestions", { jeton, corps: suggestion })).statut, 201);
  assert.equal((await demander("PATCH", "/comptes/moi/profil", { jeton, corps: { pseudo: "nouveau_pseudo" } })).statut, 200);
});

test("espace pro, compte limité : fiche, carte et invitations refusées (jusqu'à nouvel ordre : jusqua null), le reste passe", async () => {
  const gerant = await creerGerant();
  const employe = await inscrire();
  // Une invitation envoyée AVANT la limitation de l'employé : il ne peut pas l'accepter tant qu'il est limité
  assert.equal((await demander("POST", `/pro/lieux/${gerant.lieuId}/equipe`, { jeton: gerant.jeton, corps: { email: `limite${numero}@exemple.fr` } })).statut, 201);
  const invitation = (await demander("GET", "/comptes/moi/rattachements", { jeton: employe.jeton })).corps.rattachements[0];
  await limiter(employe.id, null);
  assert.deepEqual((await demander("POST", `/comptes/moi/rattachements/${invitation.id}/accepter`, { jeton: employe.jeton })).corps, refus(null));
  // Ce que seule l'équipe SOS Miam lit reste permis : proposer un lieu, demander à gérer un lieu
  const proposition = { nom: "Le Petit Four", type: "patisserie", ville: "Nantes", description: "Des choux garnis à la minute, une équipe adorable." };
  assert.equal((await demander("POST", "/comptes/moi/propositions-lieux", { jeton: employe.jeton, corps: proposition })).statut, 201);
  const demande = await demander("POST", "/comptes/moi/rattachements", { jeton: employe.jeton, corps: { lieuId: ajouterLieu(), role: "gerant", preuve: "Je suis le gérant." } });
  assert.equal(demande.statut, 201);
  // Refuser l'invitation (quitter) : permis
  assert.equal((await demander("DELETE", `/comptes/moi/rattachements/${invitation.id}`, { jeton: employe.jeton })).statut, 200);

  await limiter(gerant.id, null);
  const chemin = `/pro/lieux/${gerant.lieuId}`;
  assert.deepEqual((await demander("PATCH", chemin, { jeton: gerant.jeton, corps: { horaires: "Tous les jours" } })).corps, refus(null));
  assert.deepEqual((await demander("PUT", `${chemin}/carte`, { jeton: gerant.jeton, corps: { carte: null } })).corps, refus(null));
  assert.deepEqual((await demander("POST", `${chemin}/equipe`, { jeton: gerant.jeton, corps: { email: "quelqun@exemple.fr" } })).corps, refus(null));
  assert.equal(memoire.lieux.get(gerant.lieuId)?.horaires, FICHE_TEST.horaires, "rien n'a changé");
  // Lire sa fiche, sa carte, son équipe, chercher un lieu : permis
  for (const lecture of [chemin, `${chemin}/carte`, `${chemin}/equipe`, `${chemin}/suggestions`, "/pro/recherche-lieux?texte=Chez"]) {
    assert.equal((await demander("GET", lecture, { jeton: gerant.jeton })).statut, 200, lecture);
  }
  // Un lieu qui n'est pas le sien : le refus habituel d'abord (rien n'est dit de la limitation à qui n'a pas le droit)
  assert.equal((await demander("PATCH", `/pro/lieux/${ajouterLieu()}`, { jeton: gerant.jeton, corps: { horaires: "x" } })).corps.erreur, "pas-pro");
});

test("compte limité : Mon compte, la session, le mot de passe et la suppression du compte restent permis", async () => {
  const { id, jeton } = await inscrire();
  await limiter(id);
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 200);
  assert.equal((await demander("GET", "/comptes/moi/profil", { jeton })).statut, 200);
  assert.equal((await demander("GET", "/comptes/moi/connexions", { jeton })).statut, 200);
  const change = await demander("POST", "/comptes/moi/mot-de-passe", { jeton, corps: { actuel: MOT_DE_PASSE, nouveau: "une autre phrase de passe" } });
  assert.equal(change.statut, 200);
  const supprime = await demander("DELETE", "/comptes/moi", { jeton: change.corps.session, corps: { motDePasse: "une autre phrase de passe" } });
  assert.equal(supprime.statut, 200);
  assert.equal(memoire.comptes.has(id), false);
});
