// Tests de la désinscription dans les newsletters : lien « Me désinscrire » personnel, en-têtes « un clic » (RFC 8058).
import assert from "node:assert/strict";
import { test } from "node:test";

import { ajouterLienDesinscription } from "../src/fonctions/courriels/ajouter-lien-desinscription.ts";
import { composerCourriel } from "../src/services/courriels/expedier-courriel.ts";

const lien = "https://sosmiam.fr/desinscription?jeton=abc&x=1";
/** Les en-têtes repliés (RFC 5322) remis sur une ligne */
const deplier = (brut: Buffer) => brut.toString().replace(/\r\n[ \t]+/g, " ");
const reglages = { serveur: "127.0.0.1", port: 25, utilisateur: "bonjour@sosmiam.fr", motDePasse: "x", nomExpediteur: "SOS Miam", parHeure: 100 } as never;

test("le lien va avant </body> (ou à la fin), échappé dans le HTML, en clair dans le texte", () => {
  const avecBody = ajouterLienDesinscription({ html: "<html><body><p>Coucou</p></body></html>", texte: "Coucou\n" }, lien);
  assert.match(avecBody.html, /Me désinscrire<\/a> \(en un clic, promis\)\.<\/p><\/body><\/html>$/);
  assert.match(avecBody.html, /href="https:\/\/sosmiam\.fr\/desinscription\?jeton=abc&amp;x=1"/);
  assert.equal(avecBody.texte, `Coucou\n\nPlus envie de recevoir la newsletter ? Me désinscrire (en un clic) : ${lien}\n`);
  assert.match(ajouterLienDesinscription({ html: "<p>Sans corps</p>", texte: "" }, lien).html, /^<p>Sans corps<\/p><p /);
});

test("en-têtes : un clic et STOP quand l'adresse existe, STOP seul sinon ; rien de tout ça hors newsletter", async () => {
  const message = { a: "lea@exemple.fr", objet: "La newsletter", html: "<p>x</p>", texte: "x", newsletter: true };
  const unClic = deplier(await composerCourriel(reglages, { ...message, desinscriptionUnClic: "https://api.sosmiam.fr/newsletter/desinscription?jeton=abc" }));
  assert.match(unClic, /^List-Unsubscribe:\s*<https:\/\/api\.sosmiam\.fr\/newsletter\/desinscription\?jeton=abc>,\s*<mailto:bonjour@sosmiam\.fr\?subject=STOP>/m);
  assert.match(unClic, /^List-Unsubscribe-Post: List-Unsubscribe=One-Click/m);
  const stop = deplier(await composerCourriel(reglages, { ...message, desinscriptionUnClic: null }));
  assert.match(stop, /^List-Unsubscribe:\s*<mailto:bonjour@sosmiam\.fr\?subject=STOP>/m);
  assert.doesNotMatch(stop, /List-Unsubscribe-Post/);
  assert.doesNotMatch((await composerCourriel(reglages, { ...message, newsletter: false })).toString(), /List-Unsubscribe/);
});
