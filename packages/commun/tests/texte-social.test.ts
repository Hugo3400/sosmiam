// Textes de la partie sociale qui ne se voient pas ou cachent des caractères de contrôle (verifierTexteSocial,
// estTexteAffichable), sans jamais gêner les emoji composés ni le texte français. Les caractères invisibles sont écrits en
// \u… pour qu'on les voie dans le test, espaces insécables et joints des emoji composés (U+200D, U+FE0F) compris.
import { test } from "node:test";
import assert from "node:assert/strict";

import { estTexteAffichable } from "../src/validation/est-texte-affichable.ts";
import { nettoyerTexteSocial } from "../src/validation/nettoyer-texte-social.ts";
import { validerNouveauGroupe } from "../src/validation/valider-nouveau-groupe.ts";
import { validerNouvelleListe } from "../src/validation/valider-nouvelle-liste.ts";
import { validerSignalementContenu } from "../src/validation/valider-signalement-contenu.ts";
import { verifierTexteSocial } from "../src/validation/verifier-texte-social.ts";

const verdicts = (textes: string[]) => textes.map((texte) => verifierTexteSocial(texte, 500));

test("texte invisible refusé (« vide ») : contrôles, formats, espaces sans largeur, joint seul, remplissages et braille vide", () => {
  const invisibles = [
    "\u0001".repeat(500),
    "\u200B\u200C\u200D\u2060\uFEFF",
    "\u200D",
    "\u00A0\u202F\u2009\u3000",
    "\u00AD",
    "\u202E\u2066\u2069\u200E\u200F",
    "\uFE0F\uFE0F",
    "\u3164\u115F\u1160\uFFA0",
    "\u2800\u2800",
    // Une vraie espace entre deux invisibles : le trim ne l'enlève pas, elle ne se voit pas plus
    "\u200B \u200B",
    "\u2800 \u2800",
    // Un format invisible qui n'est pas « ignorable » (ancre d'annotation) : seul \p{Cf} le reconnaît
    "\uFFF9",
    "\u{E0067}\u{E007F}",
    " \t \n ",
  ];
  assert.deepEqual(verdicts(invisibles), invisibles.map(() => "vide"));
  assert.equal(estTexteAffichable(""), false);
});

test("caractères de contrôle refusés (« vide »), même au milieu d'un texte visible ; retour à la ligne et tabulation acceptés", () => {
  const controles = ["Salut\u0000", "Salut\u0001 toi", "\u001B[31mrouge", "a\u007Fb", "a\u0085b", "a\u009Fb", "\u0008\u0008oups"];
  assert.deepEqual(verdicts(controles), controles.map(() => "vide"));
  assert.deepEqual(verdicts(["Ligne 1\nLigne 2", "\n\nOn se retrouve à 20 h\n", "Pizza\tKebab", "Le menu :\n\t- une soupe\n\t- un dessert"]), ["ok", "ok", "ok", "ok"]);
});

test("fins de ligne \\r\\n et \\r (texte collé depuis un ordinateur) : changées en \\n avant de vérifier, et gardées ainsi", () => {
  assert.equal(nettoyerTexteSocial("\r\n Ligne 1\r\nLigne 2\rLigne 3\r\n\r\n"), "Ligne 1\nLigne 2\nLigne 3");
  assert.deepEqual(verdicts(["Ligne 1\r\nLigne 2", "Ligne 1\rLigne 2", "Salut\r", "\r\n\r\n", "a\u0000\r\nb"]), ["ok", "ok", "ok", "vide", "vide"]);
  // \r\n compte pour un seul caractère : 250 lignes de « a » tiennent dans 500
  assert.equal(verifierTexteSocial("a\r\n".repeat(250), 500), "ok");
  assert.equal(verifierTexteSocial("espèce de\r\nconnard", 500), "mot-interdit");
  // estTexteAffichable vérifie un texte déjà nettoyé : un \r qui arriverait jusqu'à lui reste refusé
  assert.equal(estTexteAffichable("Ligne 1\r\nLigne 2"), false);
  const liste = validerNouvelleListe({ titre: "Mes brunchs\r\n", emoji: "🥞", description: "Le dimanche\r\nseulement", visibilite: "tous" });
  assert.deepEqual(liste.ok && [liste.liste.titre, liste.liste.description], ["Mes brunchs", "Le dimanche\nseulement"]);
});

test("emoji composés, drapeaux et tons de peau acceptés, seuls ou dans une phrase", () => {
  const emoji = [
    "👩\u200D🍳",
    "👨\u200D👩\u200D👧\u200D👦",
    "🏳\uFE0F\u200D🌈",
    "❤\uFE0F",
    "1\uFE0F\u20E3",
    "🧑🏽\u200D🍳",
    "🇫🇷",
    "🇧🇪🇨🇭",
    "🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    "👍🏽",
    "👋🏿🤝🏻",
    "Le chef 👩\u200D🍳 est au top, merci 🙏🏼🇫🇷",
  ];
  assert.deepEqual(verdicts(emoji), emoji.map(() => "ok"));
});

test("texte français : apostrophes, guillemets, espaces insécables (U+00A0, U+202F) ; la longueur et le filtre comme avant", () => {
  assert.deepEqual(
    verdicts(["L'apéro chez Léa, c’est à 19\u202Fh «\u00A0pile\u00A0» !", "Ça te dit\u00A0? On y va", "Un pain bâtard pour la route ?", "\u00A0Salut\u202F"]),
    ["ok", "ok", "ok", "ok"],
  );
  assert.equal(verifierTexteSocial("🍕".repeat(250), 500), "ok");
  assert.equal(verifierTexteSocial("a".repeat(501), 500), "trop-long");
  assert.equal(verifierTexteSocial("espèce de connard", 500), "mot-interdit");
});

test("un mot interdit ne se cache pas derrière un caractère invisible", () => {
  const caches = [
    "espèce de con\u200Bnard",
    "espèce de conn\u00ADard",
    "c\u2060o\u2060n\u2060n\u2060a\u2060r\u2060d",
    "fils\u200Bde\u200Bpute",
    // Ignorables sans être des formats (\p{Cf}) : remplissage coréen, sélecteur de variante
    "con\u3164nard",
    "con\uFE0Fnard",
  ];
  assert.deepEqual(verdicts(caches), caches.map(() => "mot-interdit"));
});

test("titres de groupe et de liste : la même règle (champ « titre » ou « description » refusé)", () => {
  const groupe = { titre: "Les gourmands", emoji: "🍜", invites: ["k7mq2x9pa4"] };
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "\u0001".repeat(10) }), { ok: false, champ: "titre" });
  assert.deepEqual(validerNouveauGroupe({ ...groupe, titre: "\u200B\u200B" }), { ok: false, champ: "titre" });
  assert.equal(validerNouveauGroupe({ ...groupe, titre: "Les 👩\u200D🍳 du jeudi" }).ok, true);
  const liste = { titre: "Mes brunchs", emoji: "🥞", description: "", visibilite: "tous" };
  assert.deepEqual(validerNouvelleListe({ ...liste, description: "Top\u0000" }), { ok: false, champ: "description" });
});

test("signalement : précision et explication affichables, mais le mot signalé peut y être cité", () => {
  const s = { cible: "message", cibleId: "42", raison: "autre", precision: null, explication: "Il m'insulte\nen boucle" };
  assert.equal(validerSignalementContenu(s)?.explication, "Il m'insulte\nen boucle");
  assert.equal(validerSignalementContenu({ ...s, explication: "Il m'a traité de connard" })?.explication, "Il m'a traité de connard");
  assert.equal(validerSignalementContenu({ ...s, explication: "\u200B".repeat(12) }), null);
  assert.equal(validerSignalementContenu({ ...s, precision: "  " })?.precision, null);
});

test("signalement : un caractère de contrôle ne le fait jamais perdre (retiré) ; rien de visible, refusé seulement si l'explication est obligatoire", () => {
  const s = { cible: "message", cibleId: "42", raison: "autre", precision: null, explication: "Il m'insulte en boucle" };
  const explication = (texte: string, raison = "autre") => validerSignalementContenu({ ...s, raison, explication: texte })?.explication;
  assert.equal(explication("Il m'insulte\u0000 en boucle"), "Il m'insulte en boucle");
  assert.equal(explication("Il m'insulte\r\nen boucle\rtous les soirs\r\n"), "Il m'insulte\nen boucle\ntous les soirs");
  assert.equal(explication("\u0007\u001B[31mIl m'insulte\u0085 \u009F"), "[31mIl m'insulte");
  assert.equal(explication("Le menu :\n\t- une insulte"), "Le menu :\n\t- une insulte");
  assert.equal(validerSignalementContenu({ ...s, precision: "Insultes\u0000\r\n" })?.precision, "Insultes");
  // Rien de visible : la précision devient null, l'explication facultative ""
  assert.equal(validerSignalementContenu({ ...s, precision: "\u2800" })?.precision, null);
  assert.equal(validerSignalementContenu({ ...s, precision: "\u0000\u0001\r\n" })?.precision, null);
  assert.equal(explication("\u200B\u0000".repeat(12), "haine"), "");
  assert.equal(explication("\r\n\u0000", "haine"), "");
  // Pour « autre », l'explication est obligatoire : 10 caractères au moins après le nettoyage
  assert.equal(explication("\u0000".repeat(12)), undefined);
  assert.equal(explication("court\u0000\u0000\u0000\u0000\u0000"), undefined);
  assert.equal(explication("\u0000Dix lettres"), "Dix lettres");
});
