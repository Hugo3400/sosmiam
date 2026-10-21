import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { SignalementRecu } from "../src/services/gestion/moderation.ts";
import type { ServicesLimitations } from "../src/services/limitations-comptes-regles.ts";

const JOUR = 86_400_000;
const banc = { horloge: Date.parse("2026-10-22T10:00:00Z") };
const horloge = () => banc.horloge;
const memoire = creerComptesEnMemoire(horloge);
const recus: SignalementRecu[] = [];
const limites = new Set<number>();
const limitations = { estLimite: async (id: number) => (limites.has(id) ? { jusqua: null, motif: "spam" } : null) } as unknown as ServicesLimitations;
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  enregistrerSignalement: async (s) => void recus.push(s),
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge, limitations },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

let visiteur = 0;
async function signaler(jeton?: string, raison = "choquant") {
  const reponse = await fetch(`${adresse}/signalements`, {
    method: "POST",
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: JSON.stringify({ publicationId: "42", lieuId: 7, raison, precision: null, explication: "" }),
  });
  return { statut: reponse.status, masquage: recus.at(-1)?.masquageAutorise };
}

async function creerCompte(email: string, { confirme, ageJours }: { confirme: boolean; ageJours: number }) {
  const reponse = await fetch(`${adresse}/comptes`, {
    method: "POST",
    headers: { "X-IP-Visiteur": `inscription-${email}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, motDePasse: "une phrase de passe assez longue", prenom: "Léa", ville: "Lyon", dateNaissance: "1990-01-01", cgu: true }),
  });
  const corps = (await reponse.json()) as { session: string };
  const compte = [...memoire.comptes.values()].find((c) => c.email === email);
  assert.ok(compte);
  compte.creeLe = banc.horloge - ageJours * JOUR;
  if (confirme) compte.emailVerifieLe = compte.creeLe;
  return { id: compte.id, jeton: corps.session };
}

test("signaler une publication : sans compte, jamais de masquage immédiat", async () => {
  assert.deepEqual(await signaler(), { statut: 201, masquage: false });
});

test("masquage immédiat seulement par un compte au mail confirmé, de 7 jours au moins, non limité", async () => {
  const fiable = await creerCompte("fiable@exemple.fr", { confirme: true, ageJours: 30 });
  const recent = await creerCompte("recent@exemple.fr", { confirme: true, ageJours: 2 });
  const nonConfirme = await creerCompte("nonconfirme@exemple.fr", { confirme: false, ageJours: 30 });
  const limite = await creerCompte("limite@exemple.fr", { confirme: true, ageJours: 30 });
  limites.add(limite.id);
  assert.deepEqual(await signaler(fiable.jeton), { statut: 201, masquage: true });
  assert.deepEqual(await signaler(recent.jeton), { statut: 201, masquage: false });
  assert.deepEqual(await signaler(nonConfirme.jeton), { statut: 201, masquage: false });
  assert.deepEqual(await signaler(limite.jeton), { statut: 201, masquage: false });
  assert.deepEqual(await signaler("a".repeat(43)), { statut: 201, masquage: false }, "session inconnue : reçu comme anonyme");
  assert.ok(recus.every((s) => !("compteId" in s) && !("signaleParId" in s)), "jamais qui a signalé");
});
