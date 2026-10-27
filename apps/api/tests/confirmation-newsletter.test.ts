import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { choisirEnvoiConfirmation } from "../src/fonctions/newsletter/choisir-envoi-confirmation.ts";
import { composerCourrielConfirmation } from "../src/fonctions/newsletter/composer-courriel-confirmation.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerConfirmationsNewsletterEnMemoire } from "../src/services/confirmations-newsletter-en-memoire.ts";
import { creerDemandesNewsletter } from "../src/services/demandes-newsletter.ts";

const HEURE = 3600_000;
const JOUR = 24 * HEURE;
const banc = { horloge: Date.parse("2026-10-22T10:00:00Z"), envoiEnPanne: false };
const horloge = () => banc.horloge;
const memoire = creerConfirmationsNewsletterEnMemoire();
const desinscrits = new Set<string>();
const envois: { email: string; lien: string; expireLe: Date; source: string; langue?: string }[] = [];

const demandes = creerDemandesNewsletter({
  depot: memoire.depot,
  horloge,
  estDesinscrit: async (email) => desinscrits.has(email),
  envoyerLien: async (email, lien, expireLe, source, langue) => {
    envois.push({ email, lien, expireLe, source, langue });
    return banc.envoiEnPanne ? { ok: false, erreur: "envoi-refuse" } : { ok: true };
  },
});

const serveur = creerApplication({
  enregistrerInscription: demandes.demander,
  newsletter: { cle: null, trouverInscrit: async () => null, desinscrire: async () => false, confirmerInscription: memoire.depot.confirmer, horloge },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

beforeEach(() => {
  banc.horloge = Date.parse("2026-10-22T10:00:00Z");
  banc.envoiEnPanne = false;
  memoire.attentes.clear();
  memoire.inscrits.clear();
  desinscrits.clear();
  envois.length = 0;
});

let visiteur = 0;
const laisserPasser = () => new Promise((fini) => setTimeout(fini, 20));
const avancer = (duree: number) => void (banc.horloge += duree);
const jetonDu = (lien: string) => new URL(lien).searchParams.get("jeton") ?? "";

async function inscrire(corps: Record<string, unknown>) {
  const reponse = await fetch(`${adresse}/inscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": `198.51.100.${++visiteur % 250}` },
    body: JSON.stringify(corps),
  });
  const resultat = { statut: reponse.status, corps: await reponse.json() };
  await laisserPasser();
  return resultat;
}

async function confirmer(jeton: unknown) {
  const reponse = await fetch(`${adresse}/newsletter/confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": `192.0.2.${++visiteur % 250}` },
    body: JSON.stringify({ jeton }),
  });
  return { statut: reponse.status, corps: await reponse.json(), cache: reponse.headers.get("cache-control") };
}

test("choisirEnvoiConfirmation : nouvelle sans attente ou après expiration, rien avant 1 h, renvoi jusqu'à 3 envois", () => {
  const t = new Date("2026-10-22T10:00:00Z");
  const attente = (envoyeIlYa: number, envois: number, expireDans = JOUR) =>
    ({ envoyeLe: new Date(t.getTime() - envoyeIlYa), expireLe: new Date(t.getTime() + expireDans), envois });
  assert.equal(choisirEnvoiConfirmation(null, t), "nouvelle");
  assert.equal(choisirEnvoiConfirmation(attente(10 * 60_000, 1), t), "attendre");
  assert.equal(choisirEnvoiConfirmation(attente(HEURE - 1, 1), t), "attendre");
  assert.equal(choisirEnvoiConfirmation(attente(HEURE, 1), t), "renvoi");
  assert.equal(choisirEnvoiConfirmation(attente(5 * HEURE, 2), t), "renvoi");
  assert.equal(choisirEnvoiConfirmation(attente(5 * HEURE, 3), t), "attendre");
  assert.equal(choisirEnvoiConfirmation(attente(8 * JOUR, 3, 0), t), "nouvelle");
});

test("le mail : objet sans « newsletter SOS Miam » ni « désinscri » (lus par recuperer-inscrits.py), lien et échéance, pied selon l'origine", () => {
  const lien = "https://sosmiam.fr/confirmer-newsletter?jeton=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcd";
  const site = composerCourrielConfirmation({ lien, expireLe: new Date("2026-10-29T10:00:00Z"), source: "site", langue: "fr" });
  assert.doesNotMatch(site.objet, /newsletter SOS Miam|d[ée]sinscri|unsubscribe/i);
  assert.ok(site.html.includes(lien) && site.texte.includes(`Je confirme mon inscription : ${lien}`));
  assert.match(site.texte, /29 octobre à 11:00, une seule fois/);
  assert.match(site.texte, /formulaire « Préviens-moi »/);
  assert.match(site.texte, /Miamis/);
  const app = composerCourrielConfirmation({ lien, expireLe: new Date("2026-10-29T10:00:00Z"), source: "app", langue: "fr" });
  assert.match(app.texte, /création d'un compte SOS Miam/);
});

test("inscription : rien n'est inscrit, l'attente garde l'empreinte du jeton (7 jours), un seul mail part avec le lien", async () => {
  const { statut, corps } = await inscrire({ email: "  Lea.Martin@Exemple.FR ", ville: "Sète", telephone: "iphone", beta: true, ambassadeur: true });
  assert.deepEqual([statut, corps], [201, { ok: true }]);
  assert.equal(memoire.inscrits.size, 0);
  const attente = memoire.attentes.get("lea.martin@exemple.fr");
  assert.ok(attente);
  assert.equal(envois.length, 1);
  const [envoi] = envois;
  assert.equal(envoi?.email, "lea.martin@exemple.fr");
  assert.equal(envoi?.source, "site");
  assert.match(envoi?.lien ?? "", /^https:\/\/sosmiam\.fr\/confirmer-newsletter\?jeton=[A-Za-z0-9_-]{43}$/);
  const jeton = jetonDu(envoi!.lien);
  assert.equal(attente.jetonEmpreinte, calculerEmpreinteJeton(jeton));
  assert.ok(!JSON.stringify([...memoire.attentes.values()]).includes(jeton), "la base ne garde jamais le jeton lui-même");
  assert.equal(attente.expireLe.getTime() - banc.horloge, 7 * JOUR);
  assert.equal(envoi?.expireLe.getTime(), attente.expireLe.getTime());
  assert.deepEqual([attente.ville, attente.telephone, attente.beta, attente.ambassadeur, attente.source], ["Sète", "iphone", true, true, "site"]);
});

test("confirmation : l'adresse devient inscrite avec ses choix ; le même lien ne resservira pas", async () => {
  await inscrire({ email: "lea@exemple.fr", ville: "Sète", telephone: "android", beta: true });
  const jeton = jetonDu(envois[0]!.lien);
  avancer(2 * JOUR);
  const premiere = await confirmer(jeton);
  assert.deepEqual([premiere.statut, premiere.corps, premiere.cache], [200, { ok: true }, "private, no-store"]);
  assert.equal(memoire.attentes.has("lea@exemple.fr"), false);
  const inscrit = memoire.inscrits.get("lea@exemple.fr");
  assert.deepEqual(
    [inscrit?.ville, inscrit?.telephone, inscrit?.beta, inscrit?.source, inscrit?.premiereInscription.getTime()],
    ["Sète", "android", true, "site", banc.horloge],
  );
  const deuxieme = await confirmer(jeton);
  assert.deepEqual([deuxieme.statut, deuxieme.corps], [400, { ok: false, erreur: "jeton-invalide" }]);
});

test("lien expiré (plus de 7 jours), inconnu ou mal formé : 400 jeton-invalide, personne n'est inscrit", async () => {
  await inscrire({ email: "tom@exemple.fr" });
  const jeton = jetonDu(envois[0]!.lien);
  avancer(7 * JOUR);
  assert.deepEqual((await confirmer(jeton)).corps, { ok: false, erreur: "jeton-invalide" });
  for (const faux of ["A".repeat(43), "pas un jeton", "", "court", 42, null, ["x"]]) {
    assert.equal((await confirmer(faux)).statut, 400, String(faux));
  }
  assert.equal(memoire.inscrits.size, 0);
  assert.equal(memoire.effacerExpirees(new Date(banc.horloge)), 1);
  assert.equal(memoire.attentes.size, 0);
});

test("pas de renvoi en boucle : rien avant 1 h, puis un nouveau lien qui remplace l'ancien, 3 mails au plus", async () => {
  await inscrire({ email: "ana@exemple.fr" });
  await inscrire({ email: "ana@exemple.fr" });
  avancer(30 * 60_000);
  await inscrire({ email: "ana@exemple.fr" });
  assert.equal(envois.length, 1);
  avancer(HEURE);
  await inscrire({ email: "ana@exemple.fr" });
  assert.equal(envois.length, 2);
  const [ancien, nouveau] = envois.map((envoi) => jetonDu(envoi.lien));
  assert.notEqual(ancien, nouveau);
  assert.equal(memoire.attentes.get("ana@exemple.fr")?.envois, 2);
  avancer(2 * HEURE);
  await inscrire({ email: "ana@exemple.fr" });
  avancer(2 * HEURE);
  await inscrire({ email: "ana@exemple.fr" });
  avancer(2 * HEURE);
  await inscrire({ email: "ana@exemple.fr" });
  assert.equal(envois.length, 3, "3 mails au plus pour une même attente");
  assert.equal((await confirmer(ancien)).statut, 400, "l'ancien lien est remplacé");
  avancer(8 * JOUR);
  await inscrire({ email: "ana@exemple.fr" });
  assert.equal(envois.length, 4, "après l'expiration, une nouvelle attente peut repartir");
  assert.equal((await confirmer(jetonDu(envois[3]!.lien))).statut, 200);
});

test("pas d'indice sur l'existence d'une adresse : même réponse pour une nouvelle, une en attente, une inscrite et un robot", async () => {
  await inscrire({ email: "deja@exemple.fr", ville: "Lunel", ambassadeur: true });
  await confirmer(jetonDu(envois[0]!.lien));
  await inscrire({ email: "attente@exemple.fr" });
  const reponses = [
    await inscrire({ email: "nouvelle@exemple.fr" }),
    await inscrire({ email: "attente@exemple.fr" }),
    await inscrire({ email: "deja@exemple.fr" }),
    await inscrire({ email: "robot@exemple.fr", piege: "http://spam" }),
  ];
  for (const reponse of reponses) assert.deepEqual(reponse, { statut: 201, corps: { ok: true } });
  assert.deepEqual(envois.map((envoi) => envoi.email), ["deja@exemple.fr", "attente@exemple.fr", "nouvelle@exemple.fr", "deja@exemple.fr"]);
  assert.equal(memoire.inscrits.get("deja@exemple.fr")?.ville, "Lunel", "une inscrite le reste, rien ne change sans son clic");
});

test("une inscrite qui renvoie le formulaire : ses infos changent seulement après son clic, les cases cochées le restent", async () => {
  await inscrire({ email: "ines@exemple.fr", ville: "Sète", ambassadeur: true });
  await confirmer(jetonDu(envois[0]!.lien));
  const premiere = memoire.inscrits.get("ines@exemple.fr")!.premiereInscription.getTime();
  avancer(3 * JOUR);
  await inscrire({ email: "ines@exemple.fr", ville: "", telephone: "iphone" });
  assert.equal(memoire.inscrits.get("ines@exemple.fr")?.telephone, null);
  await confirmer(jetonDu(envois[1]!.lien));
  const inscrit = memoire.inscrits.get("ines@exemple.fr");
  assert.deepEqual(
    [inscrit?.ville, inscrit?.telephone, inscrit?.ambassadeur, inscrit?.premiereInscription.getTime(), inscrit?.derniereInscription.getTime()],
    ["Sète", "iphone", true, premiere, banc.horloge],
  );
});

test("une adresse désinscrite qui se réinscrit sur le site refait la confirmation", async () => {
  desinscrits.add("revient@exemple.fr");
  await inscrire({ email: "revient@exemple.fr" });
  assert.equal(envois.length, 1);
  assert.equal(memoire.inscrits.size, 0);
  await confirmer(jetonDu(envois[0]!.lien));
  assert.ok(memoire.inscrits.has("revient@exemple.fr"));
});

test("case d'un compte de l'app : un mail de confirmation (origine « app »), jamais pour une adresse désinscrite", async () => {
  await demandes.demander({ email: "Zoe@Exemple.fr", ville: "Nantes", ambassadeur: false, telephone: null, beta: false, source: "app" });
  desinscrits.add("parti@exemple.fr");
  await demandes.demander({ email: "parti@exemple.fr", ville: null, ambassadeur: false, telephone: null, beta: false, source: "app" });
  await laisserPasser();
  assert.deepEqual(envois.map((envoi) => [envoi.email, envoi.source]), [["zoe@exemple.fr", "app"]]);
  assert.equal(memoire.attentes.has("parti@exemple.fr"), false);
  await confirmer(jetonDu(envois[0]!.lien));
  assert.deepEqual([memoire.inscrits.get("zoe@exemple.fr")?.source, memoire.inscrits.get("zoe@exemple.fr")?.ville], ["app", "Nantes"]);
});

test("mail refusé : la réponse reste la même, le journal ne dit ni l'adresse ni le jeton", async () => {
  banc.envoiEnPanne = true;
  const erreurs: unknown[][] = [];
  const journal = console.error;
  console.error = (...morceaux: unknown[]) => void erreurs.push(morceaux);
  try {
    assert.deepEqual(await inscrire({ email: "secret@exemple.fr" }), { statut: 201, corps: { ok: true } });
  } finally {
    console.error = journal;
  }
  const texte = JSON.stringify(erreurs.map((morceaux) => morceaux.map(String)));
  assert.match(texte, /lien de confirmation non envoyé/);
  assert.ok(!texte.includes("secret@exemple.fr") && !texte.includes(jetonDu(envois[0]!.lien)));
});

test("confirmation non branchée : 503 indisponible", async () => {
  const sans = creerApplication({ enregistrerInscription: async () => {}, newsletter: { cle: null, trouverInscrit: async () => null, desinscrire: async () => false } })
    .listen(0, "127.0.0.1");
  await new Promise<void>((pret) => sans.once("listening", () => pret()));
  try {
    const reponse = await fetch(`http://127.0.0.1:${(sans.address() as AddressInfo).port}/newsletter/confirmation`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jeton: "A".repeat(43) }),
    });
    assert.deepEqual([reponse.status, await reponse.json()], [503, { ok: false, erreur: "indisponible" }]);
  } finally {
    await new Promise<void>((fini) => sans.close(() => fini()));
  }
});

test("langue : celle de la demande est gardée avec l'attente, puis recopiée à la confirmation, quelle que soit la langue du clic", async () => {
  const demande = await fetch(`${adresse}/inscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": `198.51.100.${++visiteur % 250}`, "X-Langue": "en" },
    body: JSON.stringify({ email: "sam@exemple.fr", ville: "Nice" }),
  });
  assert.equal(demande.status, 201);
  await laisserPasser();
  assert.equal(memoire.attentes.get("sam@exemple.fr")?.langue, "en");
  assert.equal((await confirmer(jetonDu(envois[0]!.lien))).statut, 200);
  assert.equal(memoire.inscrits.get("sam@exemple.fr")?.langue, "en");
  await inscrire({ email: "lou@exemple.fr", ville: "Nice" });
  assert.equal(memoire.attentes.get("lou@exemple.fr")?.langue, "fr");
});

test("la langue de la demande suit jusqu'au mail de confirmation, et le mail anglais dit la même chose en anglais", async () => {
  for (const [entete, attendue] of [["en", "en"], [undefined, "fr"]] as const) {
    envois.length = 0;
    const reponse = await fetch(`${adresse}/inscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-IP-Visiteur": `198.51.100.${++visiteur % 250}`, ...(entete ? { "X-Langue": entete } : {}) },
      body: JSON.stringify({ email: `langue-${attendue}@exemple.fr`, ville: "Lyon", source: "site" }),
    });
    assert.ok(reponse.status < 300, String(reponse.status));
    await laisserPasser();
    assert.equal(envois[0]?.langue, attendue);
  }
  const lien = "https://sosmiam.fr/confirmer-newsletter?jeton=abc";
  const anglais = composerCourrielConfirmation({ lien, expireLe: new Date("2026-10-29T10:00:00Z"), source: "site", langue: "en" });
  assert.equal(anglais.objet, "One little click to confirm your newsletter 🛟");
  assert.match(anglais.html, /<html lang="en">/);
  assert.match(anglais.texte, /The link works until 29 October at 11:00, just once\./);
  assert.match(anglais.texte, /Confirm my sign-up: https:\/\/sosmiam\.fr\/confirmer-newsletter\?jeton=abc/);
  assert.match(anglais.texte, /“Keep me posted” form on sosmiam\.fr/);
  const francais = composerCourrielConfirmation({ lien, expireLe: new Date("2026-10-29T10:00:00Z"), source: "site", langue: "fr" });
  assert.match(francais.html, /<html lang="fr">/);
  assert.match(francais.texte, /Je confirme mon inscription : https:\/\/sosmiam\.fr/);
});

