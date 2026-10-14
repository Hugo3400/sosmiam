// Tests de la copie rangée dans « Envoyés » : liens personnels masqués, dans le texte comme dans le HTML.
import assert from "node:assert/strict";
import { test } from "node:test";

import { composerCourriel, masquerSecrets } from "../src/services/courriels/expedier-courriel.ts";

const lien = "https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=abc&x=1";
const message = { a: "lea@exemple.fr", objet: "Ton lien", texte: `Clique : ${lien}`, html: `<a href="${lien.replace("&", "&amp;")}">Choisir</a> ${lien}`, secrets: [lien] };

test("le lien personnel est masqué partout, le reste du mail est gardé", () => {
  const copie = masquerSecrets(message);
  assert.equal(copie.texte, "Clique : [lien personnel masqué]");
  assert.equal(copie.html, '<a href="[lien personnel masqué]">Choisir</a> [lien personnel masqué]');
  assert.equal(masquerSecrets({ ...message, secrets: undefined }).html, message.html, "sans secret, rien ne change");
});

test("la copie garde le Message-ID de l'envoi et ne contient plus le jeton", async () => {
  const reglages = { serveur: "127.0.0.1", port: 25, utilisateur: "bonjour@sosmiam.fr", motDePasse: "x", nomExpediteur: "SOS Miam", parHeure: 100 } as never;
  const brut = (await composerCourriel(reglages, masquerSecrets(message), "<essai@sosmiam.fr>")).toString();
  assert.match(brut, /^Message-ID: <essai@sosmiam\.fr>/m);
  assert.doesNotMatch(brut, /jeton=abc/);
});
