// Case « newsletter » de l'inscription de l'espace ambassadeur (cochée d'avance, décochable, sans JavaScript) : ce que
// l'action envoie à l'API. Cochée : true ; décochée : false (l'API retient le « non ») ; page sans la case : rien.
// Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { lireCaseNewsletter } from "../src/fonctions/compte/lire-case-newsletter.ts";

const formulaire = (champs: Record<string, string>) => {
  const donnees = new FormData();
  for (const [nom, valeur] of Object.entries(champs)) donnees.append(nom, valeur);
  return donnees;
};

test("cochée : true ; décochée (le navigateur n'envoie rien) : false", () => {
  assert.equal(lireCaseNewsletter(formulaire({ newsletterProposee: "oui", newsletter: "oui", cgu: "oui" })), true);
  assert.equal(lireCaseNewsletter(formulaire({ newsletterProposee: "oui", cgu: "oui" })), false);
  assert.equal(lireCaseNewsletter(formulaire({ newsletterProposee: "oui", newsletter: "n'importe quoi" })), false);
});

test("sans le champ caché (page affichée avant la case, ou espace pro) : rien, aucun « non » n'est retenu", () => {
  assert.equal(lireCaseNewsletter(formulaire({ cgu: "oui" })), undefined);
  assert.equal(lireCaseNewsletter(formulaire({ newsletter: "oui" })), undefined);
});
