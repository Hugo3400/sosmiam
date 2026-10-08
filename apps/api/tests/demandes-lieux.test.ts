// Tests des demandes de lieux (formulaire du site) et des routes du bot Discord, avec de faux services.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import type { NouvelleDemandeLieu } from "../src/services/demandes-lieux.ts";

const SECRET = "s".repeat(40);
process.env.SECRET_BOT = SECRET;
const demandes: NouvelleDemandeLieu[] = [];
const notes: { id: number; resultat: unknown }[] = [];
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  enregistrerDemandeLieu: async (demande) => void demandes.push(demande),
  bot: {
    enregistrerDemandeLieu: async (demande) => void demandes.push(demande),
    listerAnnoncesAPublier: async () => [{ id: 7, titre: "Bienvenue", texte: "Salut la team" }],
    noterPublicationAnnonce: async (id, resultat) => (notes.push({ id, resultat }), id === 7),
  },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => {
  demandes.length = 0;
  notes.length = 0;
});

let visiteur = 0;
const VALIDE = {
  nom: "  La Petite Cuillère ", type: "patisserie", ville: "Montpellier", description: "Des choux à la crème faits minute, une équipe adorable.",
  contactNom: "Léa", contactEmail: "Lea@Exemple.fr", instagram: "@petitecuillere",
};
const envoyer = (corps: unknown, ip = `203.0.113.${++visiteur}`) =>
  fetch(`${adresse}/demandes-lieux`, { method: "POST", headers: { "Content-Type": "application/json", "X-IP-Visiteur": ip }, body: JSON.stringify(corps) });

test("une demande complète est enregistrée, nettoyée", async () => {
  const reponse = await envoyer(VALIDE);
  assert.equal(reponse.status, 201);
  assert.equal(demandes[0]?.nom, "La Petite Cuillère");
  assert.equal(demandes[0]?.contactEmail, "lea@exemple.fr");
  assert.equal(demandes[0]?.instagram, "petitecuillere");
  assert.equal(demandes[0]?.origine, "lieu");
});

test("un champ manquant ou invalide est signalé", async () => {
  for (const [champ, valeur] of [["contactEmail", "pas-une-adresse"], ["description", "trop court"], ["nom", ""], ["siteWeb", "javascript:alert(1)"]] as const) {
    const reponse = await envoyer({ ...VALIDE, [champ]: valeur });
    assert.equal(reponse.status, 400);
    assert.deepEqual(await reponse.json(), { ok: false, erreur: "champ-invalide", champ });
  }
  assert.equal(demandes.length, 0);
});

test("un robot qui remplit le champ piège n'est pas enregistré", async () => {
  assert.equal((await envoyer({ ...VALIDE, piege: "je suis un robot" })).status, 201);
  assert.equal(demandes.length, 0);
});

test("pas plus de 3 demandes par visiteur toutes les 30 minutes", async () => {
  const statuts = [];
  for (let i = 0; i < 4; i++) statuts.push((await envoyer(VALIDE, "198.51.100.7")).status);
  assert.deepEqual(statuts, [201, 201, 201, 429]);
});

const bot = (chemin: string, options: RequestInit = {}, secret = SECRET) =>
  fetch(`${adresse}/bot${chemin}`, { ...options, headers: { "Content-Type": "application/json", "X-Secret-Bot": secret } });

test("sans le bon secret, le bot est refusé", async () => {
  assert.equal((await bot("/annonces", {}, "mauvais")).status, 401);
  assert.equal((await fetch(`${adresse}/bot/annonces`)).status, 401);
});

test("une proposition Discord devient une demande de la communauté, sans auteur", async () => {
  const reponse = await bot("/propositions", {
    method: "POST",
    body: JSON.stringify({ nom: "Le Comptoir", ville: "Sète", type: "cafe-bar", pourquoi: "Le meilleur café de la Pointe Courte.", lien: "https://instagram.com/comptoir", lienDiscord: "https://discord.com/channels/1/2/3", auteur: "pseudo" }),
  });
  assert.equal(reponse.status, 201);
  assert.equal(demandes[0]?.origine, "communaute");
  assert.equal(demandes[0]?.type, "bar");
  assert.equal(demandes[0]?.siteWeb, "https://instagram.com/comptoir");
  assert.equal(demandes[0]?.lienDiscord, "https://discord.com/channels/1/2/3");
  assert.equal(demandes[0]?.contactNom, null);
});

test("le bot lit les annonces à publier et dit ce qu'il en a fait", async () => {
  assert.deepEqual(await (await bot("/annonces")).json(), [{ id: 7, titre: "Bienvenue", texte: "Salut la team" }]);
  assert.equal((await bot("/annonces/7", { method: "POST", body: JSON.stringify({ lien: "https://discord.com/channels/1/2/9" }) })).status, 200);
  assert.equal((await bot("/annonces/8", { method: "POST", body: JSON.stringify({ erreur: "salon introuvable" }) })).status, 404);
  assert.deepEqual(notes[0], { id: 7, resultat: { lien: "https://discord.com/channels/1/2/9" } });
});
