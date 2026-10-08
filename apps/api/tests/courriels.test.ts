// Tests de l'envoi des mails : règles (réglages, erreurs, nouveaux essais, gabarit) et routes du logiciel de gestion.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { calculerProchainEssai } from "../src/fonctions/courriels/calculer-prochain-essai.ts";
import { classerErreurEnvoi } from "../src/fonctions/courriels/classer-erreur-envoi.ts";
import { habillerCourriel } from "../src/fonctions/courriels/habiller-courriel.ts";
import { lireFichierReglages } from "../src/fonctions/texte/lire-fichier-reglages.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

test("fichier de la boîte : CLE=valeur, commentaires ignorés, valeur gardée telle quelle", () => {
  const reglages = lireFichierReglages("# boîte bonjour@\r\nIMAP_SERVEUR=mail.yubox.io\r\nIMAP_MOT_DE_PASSE=un mot=de passe \r\n\r\nSANS_EGAL\n");
  assert.deepEqual(reglages, { IMAP_SERVEUR: "mail.yubox.io", IMAP_MOT_DE_PASSE: "un mot=de passe " });
});

test("erreurs d'envoi : réglages faux, adresse refusée, ou on réessaie", () => {
  assert.equal(classerErreurEnvoi({ code: "EAUTH", responseCode: 535 }), "configuration");
  assert.equal(classerErreurEnvoi({ code: "EENVELOPE", responseCode: 553, command: "MAIL FROM" }), "configuration");
  assert.equal(classerErreurEnvoi({ code: "EENVELOPE", responseCode: 550, command: "RCPT TO" }), "echec");
  assert.equal(classerErreurEnvoi({ code: "EENVELOPE", responseCode: 451, command: "RCPT TO" }), "reessayer");
  assert.equal(classerErreurEnvoi({ code: "ETIMEDOUT" }), "reessayer");
});

test("nouveaux essais : 5 min, 30 min, 2 h, 6 h, 24 h, puis abandon", () => {
  const t = new Date("2026-10-08T12:00:00Z");
  assert.equal(calculerProchainEssai(1, t)?.toISOString(), "2026-10-08T12:05:00.000Z");
  assert.equal(calculerProchainEssai(5, t)?.toISOString(), "2026-10-09T12:00:00.000Z");
  assert.equal(calculerProchainEssai(6, t), null);
});

test("gabarit : le texte est échappé, le bouton et la version texte sont là", () => {
  const { html, texte } = habillerCourriel({ titre: "Salut <b>Léa</b>", paragraphes: ["1 < 2 & \"ok\""], bouton: { texte: "Y aller", adresse: "https://sosmiam.fr/?a=1&b=2" }, pied: "Pied" });
  assert.ok(html.includes("Salut &lt;b&gt;Léa&lt;/b&gt;") && !html.includes("<b>Léa"));
  assert.ok(html.includes("1 &lt; 2 &amp; &quot;ok&quot;"));
  assert.ok(html.includes('href="https://sosmiam.fr/?a=1&amp;b=2"'));
  assert.ok(texte.includes("Y aller : https://sosmiam.fr/?a=1&b=2") && texte.endsWith("Pied"));
});

const appels: unknown[] = [];
let resultatEssai: { ok: true } | { ok: false; erreur: string; message?: string } = { ok: true };
let resultatLancement: unknown = { campagne: { id: 4, total: 12 } };
const banc = await creerBancGestion({
  envoyerEssaiNewsletter: async (adresse: string, contenu: { objet: string }) => (appels.push({ essai: adresse, objet: contenu.objet }), resultatEssai),
  lancerCampagne: async (saisie: unknown) => (appels.push({ lancer: saisie }), resultatLancement),
  listerCampagnes: async () => [{ id: 4, objet: "Octobre", statuts: { envoye: 10, "en-attente": 2 } }],
  annulerCampagne: async (id: number) => (appels.push({ annuler: id }), 2),
  compterDestinataires: async (ville: string | null) => (ville ? 3 : 12),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

const contenu = { objet: "Des nouvelles 🛟", html: "<p>Salut</p>", texte: "Salut" };

test("essai : une adresse valable, et l'erreur du serveur mail est rendue", async () => {
  assert.equal((await banc.demander("POST", "/courriels/essai", { session, corps: { ...contenu, adresse: "pas-une-adresse" } })).status, 400);
  assert.equal((await banc.demander("POST", "/courriels/essai", { session, corps: { ...contenu, adresse: "Hugo@Exemple.fr" } })).status, 200);
  assert.deepEqual(appels.at(-1), { essai: "hugo@exemple.fr", objet: "Des nouvelles 🛟" });
  resultatEssai = { ok: false, erreur: "envoi-refuse", message: "535 identifiants refusés" };
  const refuse = await banc.demander("POST", "/courriels/essai", { session, corps: { ...contenu, adresse: "hugo@exemple.fr" } });
  assert.equal(refuse.status, 502);
  assert.deepEqual(await refuse.json(), { ok: false, erreur: "envoi-refuse", message: "535 identifiants refusés" });
});

test("newsletter : contenu obligatoire, une seule à la fois, ville facultative", async () => {
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: { objet: "Sans contenu" } })).status, 400);
  const lancee = await banc.demander("POST", "/newsletter/envois", { session, corps: { ...contenu, brouillonId: 3, ville: " Sète " } });
  assert.equal(lancee.status, 201);
  assert.deepEqual(await lancee.json(), { ok: true, id: 4, total: 12 });
  assert.deepEqual(appels.at(-1), { lancer: { brouillonId: 3, ville: "Sète", ...contenu } });
  resultatLancement = { erreur: "envoi-en-cours" };
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: contenu })).status, 409);
  resultatLancement = { erreur: "envoi-absent" };
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: contenu })).status, 503);
});

test("newsletter : destinataires, suivi et arrêt", async () => {
  assert.deepEqual(await (await banc.demander("GET", "/newsletter/destinataires?ville=S%C3%A8te", { session })).json(), { total: 3 });
  assert.equal(((await (await banc.demander("GET", "/newsletter/envois", { session })).json()) as unknown[]).length, 1);
  assert.deepEqual(await (await banc.demander("POST", "/newsletter/envois/4/annuler", { session, corps: {} })).json(), { ok: true, annules: 2 });
  assert.deepEqual(appels.at(-1), { annuler: 4 });
});
