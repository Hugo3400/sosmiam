// Textes de la partie sociale qui ne se voient pas ou cachent des caractères de contrôle (verifierTexteSocial,
// estTexteAffichable), sans jamais gêner les emoji composés ni le texte français. Les caractères invisibles sont écrits en
// \u… pour qu'on les voie dans le test.
import { test } from "node:test";
import assert from "node:assert/strict";

import { estTexteAffichable } from "../src/validation/est-texte-affichable.ts";
import { validerNouveauGroupe } from "../src/validation/valider-nouveau-groupe.ts";
import { validerNouvelleListe } from "../src/validation/valider-nouvelle-liste.ts";
import { validerSignalementContenu } from "../src/validation/valider-signalement-contenu.ts";
import { verifierTexteSocial } from "../src/validation/verifier-texte-social.ts";

const verdicts = (textes: string[]) => textes.map((texte) => verifierTexteSocial(texte, 500));

test("texte invisible refusé (« vide ») : contrôles, formats, espaces sans largeur, joint seul, remplissages et braille vide", () => {
  const invisibles = [
    "\u0001".repeat(500),
    "​‌‍⁠﻿",
    "‍",
    "   　",
    "­",
    "‮⁦⁩‎‏",
    "️️",
    "ㅤᅟᅠﾠ",
    "⠀⠀",
    "\u{E0067}\u{E007F}",
    " \t \n ",
  ];
  assert.deepEqual(verdicts(invisibles), invisibles.map(() => "vide"));
  assert.equal(estTexteAffichable(""), false);
});

test("caractères de contrôle refusés (« vide »), même au milieu d'un texte visible ; retour à la ligne et tabulation acceptés", () => {
  const controles = ["Salut\u0000", "Salut\u0001 toi", "Ligne 1\r\nLigne 2", "\u001B[31mrouge", "a\u007Fb", "a\u0085b", "a\u009Fb", "\u0008\u0008oups"];
  assert.deepEqual(verdicts(controles), controles.map(() => "vide"));
  assert.deepEqual(verdicts(["Ligne 1\nLigne 2", "\n\nOn se retrouve à 20 h\n", "Pizza\tKebab", "Le menu :\n\t- une soupe\n\t- un dessert"]), ["ok", "ok", "ok", "ok"]);
});

test("emoji composés, drapeaux et tons de peau acceptés, seuls ou dans une phrase", () => {
  const emoji = [
    "👩‍🍳",
    "👨‍👩‍👧‍👦",
    "🏳️‍🌈",
    "❤️",
    "1️⃣",
    "🧑🏽‍🍳",
    "🇫🇷",
    "🇧🇪🇨🇭",
    "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    "👍🏽",
    "👋🏿🤝🏻",
    "Le chef 👩‍🍳 est au top, merci 🙏🏼🇫🇷",
  ];
  assert.deepEqual(verdicts(emoji), emoji.map(() => "ok"));
});

test("texte français : apostrophes, guillemets, espaces insécables (U+00A0, U+202F) ; la longueur et le filtre comme avant", () => {
  assert.deepEqual(
    verdicts(["L'apéro chez Léa, c’est à 19 h « pile » !", "Ça te dit ? On y va", "Un pain bâtard pour la route ?", " Salut "]),
    ["ok", "ok", "ok", "ok"],
  );
  assert.equal(verifierTexteSocial("🍕".repeat(250), 500), "ok");
  assert.equal(verifierTexteSocial("a".repeat(501), 500), "trop-long");
  assert.equal(verifierTexteSocial("espèce de connard", 500), "mot-interdit");
});

test("un mot interdit ne se cache pas derrière un caractère invisible", () => {
  assert.deepEqual(verdicts(["espèce de con​nard", "espèce de conn­ard", "c⁠o⁠n⁠n⁠a⁠r⁠d", "fils​de​pute"]), [
    "mot-interdit", "mot-interdit", "mot-interdit", "mot-interdit",
  ]);
});

test("titres de groupe et de liste : la même règle (champ « titre » ou « description » refusé)", () => {
  const groupe = { titre: "Les gourmands", emoji: "🍜", invites: ["k7mq2x9pa4"] };
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "\u0001".repeat(10) }), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "​​" }), { ok: false, champ: "titre" });
  assert.equal(validerNouveauGroupe({ ...groupe, titre: "Les 👩‍🍳 du jeudi" }).ok, true);
  const liste = { titre: "Mes brunchs", emoji: "🥞", description: "", visibilite: "tous" };
  assert.deepEqual(validerNouvelleListe({ ...liste, description: "Top\u0000" }), { ok: false, champ: "description" });
});

test("signalement : précision et explication affichables, mais le mot signalé peut y être cité", () => {
  const s = { cible: "message", cibleId: "42", raison: "autre", precision: null, explication: "Il m'insulte\nen boucle" };
  assert.equal(validerSignalementContenu(s)?.explication, "Il m'insulte\nen boucle");
  assert.equal(validerSignalementContenu({ ...s, explication: "Il m'a traité de connard" })?.explication, "Il m'a traité de connard");
  assert.equal(validerSignalementContenu({ ...s, explication: "​".repeat(12) }), null);
  assert.equal(validerSignalementContenu({ ...s, explication: "Il m'insulte\u0000 en boucle" }), null);
  assert.equal(validerSignalementContenu({ ...s, precision: "⠀" }), null);
  assert.equal(validerSignalementContenu({ ...s, precision: "  " })?.precision, null);
});
