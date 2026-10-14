import { test } from "node:test";
import assert from "node:assert/strict";

import { MESSAGES_SERVICE } from "../src/contenus/messages-services.ts";
import { MESSAGES_SERVICES_SOCIAUX } from "../src/contenus/messages-services-sociaux.ts";
import { calculerClassement } from "../src/fonctions/potes/calculer-classement.ts";
import { creerLienInvitation } from "../src/fonctions/potes/creer-lien-invitation.ts";
import { lireLienInvitation } from "../src/fonctions/potes/lire-lien-invitation.ts";
import { calculerDebutMoisParis } from "../src/fonctions/temps/calculer-debut-mois-paris.ts";
import { MAX_PARTICIPANTS_GROUPE } from "../src/regles/chat.ts";
import { calculerNiveauProfil } from "../src/regles/calculer-niveau-profil.ts";
import { DUREE_CLOCHE_MODERATION_JOURS, TYPES_CLOCHE, TYPES_CLOCHE_MODERATION } from "../src/regles/cloche.ts";
import { MAX_CO_AUTEURS_LISTE, MAX_LIEUX_PAR_LISTE, MAX_LISTES_PAR_COMPTE } from "../src/regles/listes.ts";
import { FORME_ID_PUBLIC, MAX_BANDE, MAX_PARTICIPANTS_SORTIE, MAX_PROPOSITIONS_SORTIE, MAX_SORTIES_A_VENIR } from "../src/regles/potes.ts";
import { CIBLES_SIGNALEMENT_SOCIAL, DUREE_CONTESTATION_JOURS } from "../src/regles/signalement.ts";
import { estEmojiSeul } from "../src/validation/est-emoji-seul.ts";
import { validerSignalementContenu } from "../src/validation/valider-signalement-contenu.ts";
import { verifierTexteSocial } from "../src/validation/verifier-texte-social.ts";

test("texte social : vide après trim, 500 caractères passent, 501 non, insulte refusée, « pain bâtard » accepté", () => {
  assert.equal(verifierTexteSocial("   \n ", 500), "vide");
  assert.equal(verifierTexteSocial("a".repeat(500), 500), "ok");
  assert.equal(verifierTexteSocial(`  ${"a".repeat(500)}  `, 500), "ok");
  assert.equal(verifierTexteSocial("a".repeat(501), 500), "trop-long");
  assert.equal(verifierTexteSocial("espèce de connard", 500), "mot-interdit");
  assert.equal(verifierTexteSocial("Un pain bâtard pour la route ?", 500), "ok");
});

const signalement = { cible: "message", cibleId: "42", raison: "choquant", precision: null, explication: "" };

test("signalement social : les 6 cibles, et l'identifiant qui va avec", () => {
  assert.deepEqual([...CIBLES_SIGNALEMENT_SOCIAL].sort(), ["commentaire", "groupe", "liste", "message", "profil", "sortie"]);
  for (const cible of ["commentaire", "message", "liste", "sortie", "groupe"]) {
    assert.equal(validerSignalementContenu({ ...signalement, cible })?.cible, cible);
  }
  assert.equal(validerSignalementContenu({ ...signalement, cible: "profil", cibleId: "k7mq2x9pa4" })?.cibleId, "k7mq2x9pa4");
  assert.equal(validerSignalementContenu({ ...signalement, cible: "profil" }), null);
  assert.equal(validerSignalementContenu({ ...signalement, cibleId: "k7mq2x9pa4" }), null);
  assert.equal(validerSignalementContenu({ ...signalement, cibleId: "0" }), null);
  assert.equal(validerSignalementContenu({ ...signalement, cible: "recommandation" }), null);
  assert.equal(validerSignalementContenu({ ...signalement, cible: "publication" }), null);
  assert.equal(validerSignalementContenu(null), null);
  assert.equal(validerSignalementContenu([signalement]), null);
});

test("signalement social : raisons connues, explication obligatoire pour « autre », précision de 80 et explication de 500", () => {
  assert.equal(validerSignalementContenu({ ...signalement, raison: "pas-beau" }), null);
  assert.equal(validerSignalementContenu({ ...signalement, raison: "autre", explication: "  9 lettres " }), null);
  assert.equal(validerSignalementContenu({ ...signalement, raison: "autre", explication: " 10 lettres " })?.explication, "10 lettres");
  assert.equal(validerSignalementContenu({ ...signalement, raison: "autre" }), null);
  assert.deepEqual(validerSignalementContenu({ ...signalement, raison: "autre", explication: "  Il insulte tout le monde  " }), {
    cible: "message",
    cibleId: "42",
    raison: "autre",
    precision: null,
    explication: "Il insulte tout le monde",
  });
  assert.equal(validerSignalementContenu({ ...signalement, precision: "p".repeat(80) })?.precision, "p".repeat(80));
  assert.equal(validerSignalementContenu({ ...signalement, precision: "p".repeat(81) }), null);
  assert.equal(validerSignalementContenu({ ...signalement, precision: "   " })?.precision, null);
  assert.equal(validerSignalementContenu({ ...signalement, precision: 3 }), null);
  assert.equal(validerSignalementContenu({ ...signalement, explication: "e".repeat(500) })?.explication.length, 500);
  assert.equal(validerSignalementContenu({ ...signalement, explication: "e".repeat(501) }), null);
  assert.equal(validerSignalementContenu({ ...signalement, explication: undefined })?.explication, "");
});

test("emoji seul : un pictogramme, un drapeau, un emoji composé ; ni texte, ni deux emojis, ni espace autour", () => {
  for (const emoji of ["🍕", "❤️", "🇫🇷", "👩‍🍳", "👍🏽", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"]) assert.equal(estEmojiSeul(emoji), true, emoji);
  for (const pasEmoji of ["", "a", "🍕🍕", " 🍕", "pizza", "1", "🍕a", "🇫", "❤︎", "🍕\u0301", 42, null]) {
    assert.equal(estEmojiSeul(pasEmoji), false, String(pasEmoji));
  }
  assert.equal(estEmojiSeul("👨‍👩‍👧‍👦"), true);
  assert.equal(estEmojiSeul("👨‍👩‍👧‍👦👨‍👩‍👧‍👦"), false);
});

test("emoji seul : même verdict sans Intl.Segmenter (moteur du téléphone)", (t) => {
  const segmenteur = Intl.Segmenter;
  t.after(() => {
    Object.defineProperty(Intl, "Segmenter", { value: segmenteur, configurable: true, writable: true });
  });
  Object.defineProperty(Intl, "Segmenter", { value: undefined, configurable: true, writable: true });
  for (const emoji of ["🍕", "❤️", "🇫🇷", "👩‍🍳", "👍🏽", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "👨‍👩‍👧‍👦"]) assert.equal(estEmojiSeul(emoji), true, emoji);
  for (const pasEmoji of ["a", "🍕🍕", " 🍕", "🇫", "❤︎", "🍕\u0301", "🍕a"]) assert.equal(estEmojiSeul(pasEmoji), false, pasEmoji);
});

test("niveau de profil : toi et ta bande voient tout, la vitrine pour un compte public ou un abonné, sinon l'en-tête", () => {
  const personne = { estMoi: false, pote: false, abonne: false };
  assert.equal(calculerNiveauProfil({ prive: true }, { ...personne, estMoi: true }), "bande");
  assert.equal(calculerNiveauProfil({ prive: true }, { ...personne, pote: true }), "bande");
  assert.equal(calculerNiveauProfil({ prive: true }, { ...personne, abonne: true }), "public");
  assert.equal(calculerNiveauProfil({ prive: false }, personne), "public");
  assert.equal(calculerNiveauProfil({ prive: true }, personne), "prive");
});

test("classement : points du mois, puis rescousses ; même rang à égalité, et toi repéré", () => {
  const places = calculerClassement(
    [
      { id: "lea", pointsDuMois: 40, rescoussesDuMois: 2 },
      { id: "moi", pointsDuMois: 60, rescoussesDuMois: 1 },
      { id: "sofia", pointsDuMois: 40, rescoussesDuMois: 2 },
      { id: "tom", pointsDuMois: 40, rescoussesDuMois: 3 },
      { id: "ines", pointsDuMois: 10, rescoussesDuMois: 0 },
    ],
    "moi",
  );
  assert.deepEqual(
    places.map((p) => [p.personne.id, p.rang, p.estMoi]),
    [["moi", 1, true], ["tom", 2, false], ["lea", 3, false], ["sofia", 3, false], ["ines", 5, false]],
  );
  assert.deepEqual(calculerClassement([], "moi"), []);
});

test("lien d'invitation : le code dans le fragment, relu avec « #c= » et l'ancien « ?c= », aussi depuis « sosmiam:// »", () => {
  const lien = creerLienInvitation(" @Lea.Croque ", "k7mq2x9pa4vt");
  assert.equal(lien, "https://sosmiam.fr/invitation/lea.croque#c=k7mq2x9pa4vt");
  assert.deepEqual(lireLienInvitation(lien), { pseudo: "lea.croque", code: "k7mq2x9pa4vt" });
  assert.deepEqual(lireLienInvitation("https://sosmiam.fr/invitation/lea.croque?c=K7MQ2X9PA4VT"), { pseudo: "lea.croque", code: "k7mq2x9pa4vt" });
  assert.deepEqual(lireLienInvitation("sosmiam.fr/invitation/lea.croque/"), { pseudo: "lea.croque", code: null });
  assert.deepEqual(lireLienInvitation("www.sosmiam.fr/invitation/lea.croque?utm=qr#c=abcdef123456"), { pseudo: "lea.croque", code: "abcdef123456" });
  // Le lien de secours de l'app (bouton de la page d'invitation du site) et un « @ » devant le pseudo
  const attendu = { pseudo: "lea.croque", code: "k7mq2x9pa4vt" };
  assert.deepEqual(lireLienInvitation("sosmiam://invitation/lea.croque#c=k7mq2x9pa4vt"), attendu);
  assert.deepEqual(lireLienInvitation("sosmiam://invitation/lea.croque?c=k7mq2x9pa4vt"), attendu);
  assert.deepEqual(lireLienInvitation("https://sosmiam.fr/invitation/@lea.croque#c=k7mq2x9pa4vt"), attendu);
  assert.deepEqual(lireLienInvitation("https://sosmiam.fr/invitation/%40lea.croque#c=k7mq2x9pa4vt"), attendu);
  assert.equal(lireLienInvitation("sosmiam://autre/lea.croque#c=k7mq2x9pa4vt"), null);
  assert.equal(lireLienInvitation("lea.croque"), null);
  assert.equal(lireLienInvitation("https://autre.fr/invitation/lea.croque#c=k7mq2x9pa4vt"), null);
  assert.equal(lireLienInvitation("https://sosmiam.fr/invitation/.lea#c=k7mq2x9pa4vt"), null);
});

test("début du mois à Paris : minuit le 1er, heure d'hiver comme d'été", () => {
  // Le 31 octobre à 23 h 30 UTC, il est déjà 0 h 30 le 1er novembre à Paris (heure d'hiver)
  assert.equal(calculerDebutMoisParis(Date.parse("2026-10-31T23:30:00Z")), Date.parse("2026-10-31T23:00:00Z"));
  // Le 31 octobre à 22 h 30 UTC, c'est encore octobre à Paris (le 1er octobre était en heure d'été)
  assert.equal(calculerDebutMoisParis(Date.parse("2026-10-31T22:30:00Z")), Date.parse("2026-09-30T22:00:00Z"));
  assert.equal(calculerDebutMoisParis(Date.parse("2026-01-15T12:00:00Z")), Date.parse("2025-12-31T23:00:00Z"));
  assert.equal(calculerDebutMoisParis(Date.parse("2026-10-31T23:00:00Z")), Date.parse("2026-10-31T23:00:00Z"));
});

test("identifiant public : 10 caractères de a à z et de 2 à 9", () => {
  assert.equal(FORME_ID_PUBLIC.test("k7mq2x9pa4"), true);
  assert.equal(FORME_ID_PUBLIC.test("k7mq2x9pa"), false);
  assert.equal(FORME_ID_PUBLIC.test("k7mq2x9pa1"), false);
  assert.equal(FORME_ID_PUBLIC.test("K7MQ2X9PA4"), false);
});

test("cloche : 15 types sans doublon, dont les 3 de la modération gardés 6 mois (le temps de contester)", () => {
  assert.equal(TYPES_CLOCHE.length, 15);
  assert.equal(new Set(TYPES_CLOCHE).size, 15);
  assert.ok(TYPES_CLOCHE.includes("invitation-groupe"));
  assert.ok(TYPES_CLOCHE_MODERATION.every((type) => (TYPES_CLOCHE as readonly string[]).includes(type)));
  assert.equal(DUREE_CLOCHE_MODERATION_JOURS, DUREE_CONTESTATION_JOURS);
});

test("erreurs sociales : chaque code a son texte, repris par MESSAGES_SERVICE, sans emoji dans le titre ni le texte", () => {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const [code, message] of Object.entries(MESSAGES_SERVICES_SOCIAUX)) {
    assert.equal(MESSAGES_SERVICE[code as keyof typeof MESSAGES_SERVICE], message, code);
    assert.ok(message.emoji !== "" && message.titre !== "" && message.texte !== "", code);
    assert.equal(emoji.test(message.titre) || emoji.test(message.texte), false, code);
  }
  // « delai-depasse » reste le texte commun (réservations, visites) ; la contestation a le sien
  assert.equal(MESSAGES_SERVICE["delai-depasse"].titre, "Trop tard pour ça");
  assert.equal(MESSAGES_SERVICE["contestation-hors-delai"].titre, "Trop tard pour contester");
});

test("erreurs sociales : les nombres des textes suivent les règles", () => {
  const dit = (code: keyof typeof MESSAGES_SERVICES_SOCIAUX, nombre: number) =>
    assert.ok(MESSAGES_SERVICES_SOCIAUX[code].texte.startsWith(`${nombre} `), `${code} : ${nombre}`);
  dit("bande-pleine", MAX_BANDE);
  dit("groupe-plein", MAX_PARTICIPANTS_GROUPE);
  dit("sortie-pleine", MAX_PARTICIPANTS_SORTIE);
  dit("max-propositions", MAX_PROPOSITIONS_SORTIE);
  dit("trop-de-sorties", MAX_SORTIES_A_VENIR);
  dit("trop-de-listes", MAX_LISTES_PAR_COMPTE);
  dit("liste-pleine", MAX_LIEUX_PAR_LISTE);
  dit("trop-de-co-auteurs", MAX_CO_AUTEURS_LISTE);
});
