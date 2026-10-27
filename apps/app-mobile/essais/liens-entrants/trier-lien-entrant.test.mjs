import assert from "node:assert/strict";
import { test } from "node:test";

import { trierLienEntrant } from "~/fonctions/liens-entrants/trier-lien-entrant";

const PUBLIE = { expoGo: false };
const EXPO_GO = { expoGo: true };
const CODE_QR = "abcdefghjkmnpqrstuvwxyz234567892";
const RETOUR_GOOGLE =
  "com.googleusercontent.apps.186162767871-8r0s3pr05lgii94qg26trichbahb38vg:/oauth2redirect/google?state=x1y2&code=4/0AbCdEf&scope=email%20profile%20openid&authuser=0&prompt=consent";

const trier = (adresse, options = PUBLIE) => trierLienEntrant(adresse, options);

function verifier(cas) {
  for (const [adresse, attendu] of cas) assert.equal(trier(adresse), attendu, adresse);
}

test("lancement depuis l'écran d'accueil du téléphone : la racine de l'app mène à l'accueil", () => {
  verifier([
    ["sosmiam:///", "/"],
    ["sosmiam://", "/"],
    ["sosmiam://?depuis=raccourci", "/"],
    ["https://sosmiam.fr", "/"],
    ["https://sosmiam.fr/", "/"],
    ["/", "/"],
  ]);
});

test("invitations : lien universel, lien de secours du site, ancien ?c=, @ et majuscules tolérés comme lireLienInvitation", () => {
  verifier([
    ["https://sosmiam.fr/invitation/lea.croque#c=k7mq2x9pa4vt", "/invitation/lea.croque"],
    ["https://sosmiam.fr/invitation/lea.croque?c=K7MQ2X9PA4VT", "/invitation/lea.croque?c=k7mq2x9pa4vt"],
    ["sosmiam://invitation/lea.croque#c=k7mq2x9pa4vt", "/invitation/lea.croque"],
    ["sosmiam:///invitation/lea.croque", "/invitation/lea.croque"],
    ["https://www.sosmiam.fr/invitation/%40Lea.Croque/", "/invitation/lea.croque"],
    ["https://SOSMIAM.fr/invitation/lea_42", "/invitation/lea_42"],
  ]);
});

test("profils de créateurs, QR de vitrine, fiches du site et QR de connexion", () => {
  verifier([
    ["sosmiam://createur/capitaine.bouiboui", "/createur/capitaine.bouiboui"],
    ["https://sosmiam.fr/l/nonnalia", "/l/nonnalia"],
    ["https://sosmiam.fr/l/sucregar/", "/l/sucregar"],
    ["https://sosmiam.fr/lieux/42", "/lieux/42"],
    [`https://sosmiam.fr/q/${CODE_QR}`, `/q/${CODE_QR}`],
    [`sosmiam://q/${CODE_QR}`, `/q/${CODE_QR}`],
  ]);
});

test("liens des notifications (est-lien-permis) et entrées des espaces pro et ambassadeur", () => {
  const permis = [
    "/explorer", "/potes", "/profil", "/notifications", "/lieu/18", "/lieu/0", "/pro/comptoir", "/pro/reservations",
    "/miam-safe/partage/7", "/reservations", "/potes/messages", "/potes/discussion/12", "/potes/sortie/3",
    "/potes/profil/abcdefgh23", "/potes/miamis/sortie/5", "/potes/miamis/idee/9", "/potes/miamis/qui-est-la", "/ambassadeur",
  ];
  for (const chemin of permis) {
    assert.equal(trier(`sosmiam:/${chemin}`), chemin, chemin);
    assert.equal(trier(`sosmiam://${chemin.slice(1)}/`), chemin, `${chemin}/`);
  }
});

test("paramètres en trop : retirés (traceurs des réseaux sociaux compris), le chemin prévu reste", () => {
  verifier([
    ["https://sosmiam.fr/lieux/42?utm_source=instagram&fbclid=IwAR0abc", "/lieux/42"],
    ["sosmiam://potes/sortie/3?onglet=discussion", "/potes/sortie/3"],
    ["sosmiam://createur/lea?c=abcdefgh", "/createur/lea"],
    ["sosmiam://invitation/lea?c=<script>&x=1", "/invitation/lea"],
    ["sosmiam://invitation/lea?x=1&c=abcdef123456&y=2", "/invitation/lea?c=abcdef123456"],
    [`sosmiam://lieu/12?x=${"%".repeat(500)}`, "/lieu/12"],
  ]);
});

test("écrans internes jamais ouverts par un lien : retour à l'accueil", () => {
  verifier([
    ["sosmiam://potes/ajouter?lien=lea", "/"],
    ["sosmiam://potes/ajouter", "/"],
    [`sosmiam://reglages/connecter-appareil?code=${CODE_QR}`, "/"],
    ["sosmiam://reglages/compte", "/"],
    ["sosmiam://reglages", "/"],
    ["sosmiam://miam-safe/comptoir?phrase=1", "/"],
    ["sosmiam://lieu/12/reserver", "/"],
    ["sosmiam://scan/camera", "/"],
    ["sosmiam://pro/qr", "/"],
    ["sosmiam://ambassadeur/mission/3", "/"],
    ["sosmiam://(onglets)/profil", "/"],
    ["sosmiam://compte", "/"],
    ["https://sosmiam.fr/verifier-email#jeton=abc", "/"],
    ["https://sosmiam.fr/nouveau-mot-de-passe#jeton=abc", "/"],
  ]);
});

test("pièges du chemin : .., double encodage, //, barre encodée, caractères invisibles, mauvaise casse", () => {
  verifier([
    ["sosmiam://lieux/../reglages/compte", "/"],
    ["sosmiam://lieux/%2e%2e/reglages", "/"],
    ["sosmiam://potes/..%2Fajouter", "/"],
    ["sosmiam://lieu/12%2F..%2Freglages", "/"],
    ["sosmiam://invitation/%2540lea", "/"],
    ["sosmiam://invitation/%252e%252e", "/"],
    ["sosmiam://invitation//lea", "/"],
    ["sosmiam:////potes/ajouter", "/"],
    ["https://sosmiam.fr//potes/ajouter", "/"],
    ["https://sosmiam.fr/lieux/42//", "/"],
    ["sosmiam://invitation/lea%", "/"],
    ["sosmiam://invitation/lea%00", "/"],
    ["sosmiam://invitation/lea%20croque", "/"],
    ["sosmiam://invitation/lea%23c=abcdef", "/"],
    ["sosmiam://invitation/lea\\..\\reglages", "/"],
    ["sosmiam://Invitation/lea", "/"],
    ["sosmiam://l/ABCDEFGH", "/"],
    ["sosmiam://POTES", "/"],
    ["sosmiam:invitation/lea", "/"],
    ["invitation/lea", "/"],
    ["", "/"],
  ]);
});

test("formes refusées : pseudo, code ou identifiant mal formés, segment en trop", () => {
  verifier([
    ["sosmiam://invitation/a", "/"],
    ["sosmiam://invitation/lea..croque", "/"],
    ["sosmiam://invitation/lea/extra", "/"],
    ["sosmiam://invitation", "/"],
    ["sosmiam://createur/.lea", "/"],
    ["sosmiam://lieux/0", "/"],
    ["sosmiam://lieux/012", "/"],
    ["sosmiam://lieux/1234567890", "/"],
    ["sosmiam://lieu/-1", "/"],
    ["sosmiam://q/court", "/"],
    [`sosmiam://q/${CODE_QR}1`, "/"],
    ["sosmiam://l/abc", "/"],
    ["sosmiam://l/abcdefg1", "/"],
    ["sosmiam://potes/profil/abc", "/"],
  ]);
});

test("adresse démesurée de chez nous : accueil, sans y passer de temps", () => {
  const debut = performance.now();
  assert.equal(trier(`sosmiam://lieu/12${"a".repeat(3000)}`), "/");
  assert.equal(trier(`sosmiam://invitation/${"%25".repeat(5000)}`), "/");
  assert.equal(trier(`https://sosmiam.fr/${"%".repeat(100_000)}`), "/");
  assert.equal(trier(`sosmiam://invitation/lea?${"c=a&".repeat(20_000)}`), "/");
  assert.ok(performance.now() - debut < 200, `trop lent : ${performance.now() - debut} ms`);
});

test("schémas et sites étrangers : aucune navigation (null), retour de la connexion Google compris", () => {
  for (const adresse of [
    RETOUR_GOOGLE,
    "com.googleusercontent.apps.186162767871-8r0s3pr05lgii94qg26trichbahb38vg:/oauth2redirect/google",
    "https://evil.example/invitation/lea",
    "https://sosmiam.fr.evil.example/invitation/lea",
    "https://sosmiam.fr@evil.example/invitation/lea",
    "https://sosmiam.fr:8443/invitation/lea",
    "https://evil.example/https://sosmiam.fr/invitation/lea",
    "http://sosmiam.fr/invitation/lea",
    "https://ambassadeur.sosmiam.fr/espace",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "intent://invitation/lea#Intent;scheme=sosmiam;end",
    "sosmiam.evil://invitation/lea",
    "sosmiamx://invitation/lea",
    "exp://192.168.1.20:8081/--/invitation/lea",
    "https://u.expo.dev/update/abc",
    "mailto:bonjour@sosmiam.fr",
  ]) {
    assert.equal(trier(adresse), null, adresse);
  }
});

test("Expo Go (développement seulement) : le chemin après /--/ passe par les mêmes règles", () => {
  assert.equal(trier("exp://192.168.1.20:8081/--/invitation/lea#c=abcdef123456", EXPO_GO), "/invitation/lea");
  assert.equal(trier("exps://abc-hugov-8081.exp.direct/--/lieux/42", EXPO_GO), "/lieux/42");
  assert.equal(trier("exp://abc-hugov-8081.exp.direct/--/potes/ajouter?lien=lea", EXPO_GO), "/");
  assert.equal(trier("exp://abc-hugov-8081.exp.direct", EXPO_GO), "/");
  assert.equal(trier("exp://abc-hugov-8081.exp.direct/--/", EXPO_GO), "/");
  assert.equal(trier(RETOUR_GOOGLE, EXPO_GO), null);
  assert.equal(trier("sosmiam://invitation/lea", EXPO_GO), "/invitation/lea");
});

test("tout chemin rendu est sûr pour Expo Router (lettres, chiffres, / . _ - ? =) et relu à l'identique", () => {
  const adresses = [
    "https://sosmiam.fr/invitation/lea.croque?c=K7MQ2X9PA4VT#c=zzz",
    "https://www.sosmiam.fr/invitation/%40Lea.Croque/",
    `sosmiam://q/${CODE_QR}`,
    "https://sosmiam.fr/l/nonnalia?utm=1",
    "sosmiam://potes/miamis/qui-est-la",
    "sosmiam://potes/ajouter?lien=lea",
    "sosmiam://lieux/%2e%2e/reglages",
  ];
  for (const adresse of adresses) {
    const chemin = trier(adresse);
    assert.match(chemin, /^\/[a-z0-9/._?=-]*$/, adresse);
    assert.equal(trier(chemin), chemin, adresse);
    assert.equal(trier(`sosmiam:/${chemin}`), chemin, adresse);
  }
});

test("un article des Actus s'ouvre dans l'app, par le site comme par le schéma de l'app", () => {
  verifier([
    ["https://sosmiam.fr/actus/12", "/actus/12"],
    ["sosmiam://actus/12", "/actus/12"],
    ["https://sosmiam.fr/actus/12?utm_source=instagram", "/actus/12"],
    ["https://sosmiam.fr/actus", "/"],
    ["https://sosmiam.fr/actus/0", "/"],
    ["https://sosmiam.fr/actus/12/signaler", "/"],
    ["https://sosmiam.fr/actus/1234567890", "/"],
  ]);
});
