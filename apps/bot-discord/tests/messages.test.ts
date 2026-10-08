// Construit chaque message et le formulaire : toJSON() fait vérifier par discord.js les limites de Discord.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { GuildMember, User } from "discord.js";
import { QUESTIONS_FAQ } from "../src/contenus/questions-faq.ts";
import { TYPES_LIEUX } from "../src/contenus/types-lieux.ts";
import { creerFormulaireProposition } from "../src/messages/creer-formulaire-proposition.ts";
import { creerMessageBienvenue } from "../src/messages/creer-message-bienvenue.ts";
import { creerMessageBigSos } from "../src/messages/creer-message-big-sos.ts";
import { creerMessageContact } from "../src/messages/creer-message-contact.ts";
import { creerMessagePresentation } from "../src/messages/creer-message-presentation.ts";
import { creerMessageProposition } from "../src/messages/creer-message-proposition.ts";
import { creerMessageReglement } from "../src/messages/creer-message-reglement.ts";
import { creerMessageReponseFaq } from "../src/messages/creer-message-reponse-faq.ts";

const auteur = { toString: () => "<@1>" } as unknown as User;
const membre = {
  toString: () => "<@2>",
  displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png",
  guild: { memberCount: 42 },
} as unknown as GuildMember;

/** Discord refuse un message dont les blocs de texte dépassent 4 000 caractères au total. */
function compterTexte(composant: unknown): number {
  if (Array.isArray(composant)) return composant.reduce((total, c) => total + compterTexte(c), 0);
  if (!composant || typeof composant !== "object") return 0;
  return Object.entries(composant).reduce(
    (total, [cle, valeur]) => total + (cle === "content" && typeof valeur === "string" ? valeur.length : compterTexte(valeur)),
    0,
  );
}

test("chaque message est valide et sous la limite de texte", () => {
  const messages = {
    presentation: creerMessagePresentation(),
    bigSos: creerMessageBigSos(),
    contact: creerMessageContact(),
    reglement: creerMessageReglement(),
    bienvenue: creerMessageBienvenue(membre),
    proposition: creerMessageProposition(
      { nom: "La Petite Cuillère", ville: "Sète", type: TYPES_LIEUX[0], pourquoi: "x".repeat(1000), lien: "https://exemple.fr" },
      auteur,
    ),
    ...Object.fromEntries(QUESTIONS_FAQ.map((q) => [`faq ${q.id}`, creerMessageReponseFaq(q)])),
  };
  for (const [nom, message] of Object.entries(messages)) {
    const json = message.toJSON();
    assert.ok(compterTexte(json) <= 4000, `${nom} : trop de texte`);
  }
});

test("le formulaire de proposition est valide", () => {
  const json = creerFormulaireProposition("proposer-lieu").toJSON();
  assert.equal(json.custom_id, "proposer-lieu");
  assert.ok(json.title.length <= 45);
  assert.ok(json.components.length <= 5);
});
