// Tests de l'envoi des mails : règles (réglages, erreurs, nouveaux essais, gabarit) et routes du logiciel de gestion.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { calculerProchainEssai } from "../src/fonctions/courriels/calculer-prochain-essai.ts";
import { classerErreurEnvoi } from "../src/fonctions/courriels/classer-erreur-envoi.ts";
import { filtrerInscrits, type FiltresInscrits } from "../src/fonctions/courriels/filtrer-inscrits.ts";
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

test("destinataires : ville (sans accent ni casse), candidats, bêta, téléphone, sans doublon", () => {
  const liste = [
    { adresse: "lea@exemple.fr", ville: "Sète", telephone: "iphone", beta: "oui" },
    { adresse: "tom@exemple.fr", ville: "sete", telephone: "android", beta: "non" },
    { adresse: "lea@exemple.fr", ville: "Sète", telephone: "iphone", beta: "oui" },
    { adresse: "ines@exemple.fr", ville: "Lunel", telephone: "", beta: "oui" },
  ];
  const tous: FiltresInscrits = { ville: null, candidats: false, beta: false, telephone: "" };
  const adresses = (filtres: Partial<FiltresInscrits>, candidats: string[] = []) =>
    filtrerInscrits(liste, { ...tous, ...filtres }, new Set(candidats)).map((i) => i.adresse);
  assert.deepEqual(adresses({}), ["lea@exemple.fr", "tom@exemple.fr", "ines@exemple.fr"]);
  assert.deepEqual(adresses({ ville: "SÈTE" }), ["lea@exemple.fr", "tom@exemple.fr"]);
  assert.deepEqual(adresses({ beta: true }), ["lea@exemple.fr", "ines@exemple.fr"]);
  assert.deepEqual(adresses({ telephone: "android" }), ["tom@exemple.fr"]);
  assert.deepEqual(adresses({ candidats: true }, ["ines@exemple.fr"]), ["ines@exemple.fr"]);
});

const appels: unknown[] = [];
test("gabarit d'un mail écrit à la main : sans titre, retours à la ligne gardés, liens https cliquables", () => {
  const { html, texte } = habillerCourriel({
    paragraphes: ["Salut Léa,\nmerci !", "Ton lien : https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=a&b. À bientôt", "Pas de lien : javascript:alert(1)"],
    pied: "Pied",
  });
  assert.ok(!html.includes("<h1"));
  assert.ok(html.includes("Salut Léa,<br>merci !"));
  assert.ok(html.includes('<a href="https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=a&amp;b" style="color:#1A1A1A;font-weight:700">https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=a&amp;b</a>. À bientôt'));
  assert.ok(!html.includes('href="javascript'));
  assert.ok(texte.startsWith("Salut Léa,\nmerci !"));
});

const journal: string[] = [];
let resultatEcrit: { ok: true } | { ok: false; erreur: string; message?: string } = { ok: true };

let resultatEssai: { ok: true } | { ok: false; erreur: string; message?: string } = { ok: true };
let resultatLancement: unknown = { campagne: { id: 4, total: 12 } };
const banc = await creerBancGestion({
  envoyerEssaiNewsletter: async (adresse: string, contenu: { objet: string }) => (appels.push({ essai: adresse, objet: contenu.objet }), resultatEssai),
  lancerCampagne: async (saisie: unknown) => (appels.push({ lancer: saisie }), resultatLancement),
  listerCampagnes: async () => [{ id: 4, objet: "Octobre", statuts: { envoye: 10, "en-attente": 2 } }],
  annulerCampagne: async (id: number) => (appels.push({ annuler: id }), 2),
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  envoyerCourrielEcrit: async (destinataire: unknown, objet: string, texte: string) => (appels.push({ ecrit: destinataire, objet, texte }), resultatEcrit),
  listerDestinataires: async (cible: { public: string; ville: string | null }) =>
    (appels.push({ destinataires: cible }), [{ adresse: "lea@exemple.fr", ville: cible.ville ?? "Sète", detail: "" }]),
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

test("envoi groupé : contenu obligatoire, public lu, adresses cochées transmises, un seul à la fois", async () => {
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: { objet: "Sans contenu" } })).status, 400);
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: { ...contenu, public: "tout-le-monde" } })).status, 400);
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: { ...contenu, adresses: "lea@exemple.fr" } })).status, 400);
  const lancee = await banc.demander("POST", "/newsletter/envois", {
    session,
    corps: { ...contenu, brouillonId: 3, public: "newsletter", ville: " Sète ", beta: true, telephone: "fax", adresses: ["lea@exemple.fr"], description: "Inscrits · Sète" },
  });
  assert.equal(lancee.status, 201);
  assert.deepEqual(await lancee.json(), { ok: true, id: 4, total: 12 });
  assert.deepEqual(appels.at(-1), {
    lancer: {
      cible: { public: "newsletter", ville: "Sète", candidats: false, beta: true, telephone: "" },
      adresses: ["lea@exemple.fr"], description: "Inscrits · Sète", brouillonId: 3, ...contenu,
    },
  });
  await banc.demander("POST", "/newsletter/envois", { session, corps: { ...contenu, public: "ambassadeurs", statut: "tous" } });
  assert.deepEqual((appels.at(-1) as { lancer: { cible: unknown } }).lancer.cible, { public: "ambassadeurs", statut: "tous", ville: null });
  resultatLancement = { erreur: "envoi-en-cours" };
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: contenu })).status, 409);
  resultatLancement = { erreur: "envoi-absent" };
  assert.equal((await banc.demander("POST", "/newsletter/envois", { session, corps: contenu })).status, 503);
});

test("envoi groupé : destinataires, suivi et arrêt", async () => {
  const liste = await (await banc.demander("GET", "/newsletter/destinataires?public=newsletter&ville=S%C3%A8te&candidats=1", { session })).json();
  assert.deepEqual(liste, { synchronisee: true, destinataires: [{ adresse: "lea@exemple.fr", ville: "Sète", detail: "" }] });
  assert.deepEqual(appels.at(-1), { destinataires: { public: "newsletter", ville: "Sète", candidats: true, beta: false, telephone: "" } });
  assert.equal(((await (await banc.demander("GET", "/newsletter/envois", { session })).json()) as unknown[]).length, 1);
  assert.deepEqual(await (await banc.demander("POST", "/newsletter/envois/4/annuler", { session, corps: {} })).json(), { ok: true, annules: 2 });
  assert.deepEqual(appels.at(-1), { annuler: 4 });
});

test("mail écrit : à un compte ou à une adresse, objet et texte obligatoires, rien de personnel dans le journal", async () => {
  const ecrire = (corps: unknown) => banc.demander("POST", "/courriels/ecrire", { session, corps });
  assert.equal((await ecrire({ compteId: 7, objet: "Coucou" })).status, 400);
  assert.equal((await ecrire({ compteId: 7, texte: "Salut" })).status, 400);
  assert.equal((await ecrire({ adresse: "pas-une-adresse", objet: "Coucou", texte: "Salut" })).status, 400);
  assert.equal((await ecrire({ compteId: "sept", objet: "Coucou", texte: "Salut" })).status, 400);
  assert.equal((await ecrire({ compteId: 7, objet: "Coucou", texte: "Salut Léa,\n\nÀ bientôt" })).status, 200);
  assert.deepEqual(appels.at(-1), { ecrit: { compteId: 7 }, objet: "Coucou", texte: "Salut Léa,\n\nÀ bientôt" });
  assert.equal(journal.at(-1), "Mail écrit depuis le logiciel · compte n° 7");
  assert.equal((await ecrire({ adresse: "Contact@Resto.fr", objet: "Ta demande", texte: "Bonjour" })).status, 200);
  assert.deepEqual(appels.at(-1), { ecrit: { adresse: "contact@resto.fr" }, objet: "Ta demande", texte: "Bonjour" });
  assert.equal(journal.at(-1), "Mail écrit depuis le logiciel · à une adresse");
  resultatEcrit = { ok: false, erreur: "introuvable" };
  assert.equal((await ecrire({ compteId: 9, objet: "Coucou", texte: "Salut" })).status, 404);
  resultatEcrit = { ok: false, erreur: "envoi-refuse", message: "550 boîte inconnue" };
  const refuse = await ecrire({ compteId: 7, objet: "Coucou", texte: "Salut" });
  assert.equal(refuse.status, 502);
  assert.deepEqual(await refuse.json(), { ok: false, erreur: "envoi-refuse", message: "550 boîte inconnue" });
  assert.ok(journal.every((ligne) => !ligne.includes("@") && !ligne.includes("Salut")));
});
