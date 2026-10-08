// Tests des mots de passe et des petites fonctions des comptes : empreintes scrypt, règles du mot de passe, âge à Paris,
// attente après des échecs. Aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { test } from "node:test";

import { creerAttenteParCompte } from "../src/controleurs/comptes-attente.ts";
import { calculerAgeAParis } from "../src/fonctions/comptes/calculer-age-a-paris.ts";
import { calculerAttenteConnexion } from "../src/fonctions/comptes/calculer-attente-connexion.ts";
import { nettoyerLigne } from "../src/fonctions/comptes/nettoyer-ligne.ts";
import { resumerErreur } from "../src/fonctions/comptes/resumer-erreur.ts";
import { validerMotDePasse } from "../src/fonctions/comptes/valider-mot-de-passe.ts";
import { calculerScrypt } from "../src/fonctions/securite/calculer-scrypt.ts";
import { hacherMotDePasse, REGLAGES_SCRYPT } from "../src/fonctions/securite/hacher-mot-de-passe.ts";
import { verifierMotDePasse } from "../src/fonctions/securite/verifier-mot-de-passe.ts";

test("l'empreinte s'écrit « scrypt$16384$8$5$sel$empreinte », et jamais deux fois la même", async () => {
  const [une, autre] = await Promise.all([hacherMotDePasse("une petite phrase de passe"), hacherMotDePasse("une petite phrase de passe")]);
  assert.match(une, /^scrypt\$16384\$8\$5\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
  assert.notEqual(une, autre);
  assert.ok(!une.includes("phrase"));
});

test("le bon mot de passe passe, un autre non ; « é » composé ou décomposé, c'est pareil", async () => {
  const empreinte = await hacherMotDePasse("Crème brûlée du dimanche");
  assert.equal(await verifierMotDePasse("Crème brûlée du dimanche", empreinte), true);
  assert.equal(await verifierMotDePasse("Crème brûlée du dimanche", empreinte), true);
  assert.equal(await verifierMotDePasse("crème brûlée du dimanche", empreinte), false);
  assert.equal(await verifierMotDePasse("", empreinte), false);
});

test("une empreinte écrite avec d'autres réglages se vérifie avec ses propres réglages", async () => {
  const sel = randomBytes(16);
  const cle = scryptSync("ancien réglage", sel, 32, { N: 1024, r: 8, p: 1 });
  const empreinte = `scrypt$1024$8$1$${sel.toString("base64url")}$${cle.toString("base64url")}`;
  assert.equal(await verifierMotDePasse("ancien réglage", empreinte), true);
  assert.equal(await verifierMotDePasse("autre chose", empreinte), false);
});

test("une empreinte mal formée ou démesurée donne false, sans erreur", async () => {
  const sel = randomBytes(16).toString("base64url");
  const cle = randomBytes(32).toString("base64url");
  for (const empreinte of [
    "", "scrypt", "scrypt$$$$$", `bcrypt$16384$8$5$${sel}$${cle}`, `scrypt$16384$8$5$${sel}$${cle}$en-trop`,
    `scrypt$16000$8$5$${sel}$${cle}`, `scrypt$1048576$32$5$${sel}$${cle}`, `scrypt$16384$0$5$${sel}$${cle}`, `scrypt$16384$8$99$${sel}$${cle}`,
    `scrypt$16384$8$5$${sel}$pas+du+base64`, `scrypt$16384$8$5$AAAA$${cle}`, `scrypt$16384$8$5$${sel}$AAAA`, `scrypt$-1$8$5$${sel}$${cle}`,
  ]) {
    assert.equal(await verifierMotDePasse("une petite phrase de passe", empreinte), false, empreinte);
  }
});

test("au plus 2 calculs scrypt en même temps : le 3e attend son tour", async () => {
  const ordre: string[] = [];
  const sel = randomBytes(16);
  const lourd = (nom: string) => calculerScrypt("x", sel, 32, REGLAGES_SCRYPT).then(() => void ordre.push(nom));
  // Lancé en 3e : sans file d'attente, ce calcul minuscule finirait bien avant les deux autres
  const leger = () => calculerScrypt("x", sel, 16, { N: 1024, r: 1, p: 1 }).then(() => void ordre.push("léger"));
  await Promise.all([lourd("premier"), lourd("deuxième"), leger()]);
  assert.notEqual(ordre[0], "léger");
  assert.equal(ordre.length, 3);
});

test("mot de passe : 12 à 128 caractères, pas parmi les plus courants, pas l'e-mail", () => {
  const email = "camille@exemple.fr";
  assert.equal(validerMotDePasse("une petite phrase", email), true);
  assert.equal(validerMotDePasse("douze carac.", email), true);
  assert.equal(validerMotDePasse("onze carac.", email), false);
  assert.equal(validerMotDePasse("x".repeat(128), email), true);
  assert.equal(validerMotDePasse("x".repeat(129), email), false);
  // Un emoji compte pour un caractère, et « é » décomposé aussi (normalisation NFC)
  assert.equal(validerMotDePasse("🍰".repeat(12), email), true);
  assert.equal(validerMotDePasse("🍰".repeat(11), email), false);
  assert.equal(validerMotDePasse("é".repeat(12), email), true);
  for (const courant of ["motdepasse123", "MotDePasse123", "Azerty 123456", "PASSWORD1234", "1q2w3e4r5t6y", "sosmiam12345"]) {
    assert.equal(validerMotDePasse(courant, email), false, courant);
  }
  assert.equal(validerMotDePasse("Camille@Exemple.fr", email), false);
  assert.equal(validerMotDePasse(" ".repeat(14), email), false);
});

test("l'âge se calcule avec la date du jour à Paris", () => {
  const midiAParis = new Date("2026-10-08T10:00:00Z");
  assert.equal(calculerAgeAParis("2008-10-08", midiAParis), 18);
  assert.equal(calculerAgeAParis("2008-10-09", midiAParis), 17);
  assert.equal(calculerAgeAParis("1990-01-31", midiAParis), 36);
  // 22 h 30 en heure universelle le 7 octobre = 0 h 30 le 8 octobre à Paris : c'est déjà son anniversaire
  assert.equal(calculerAgeAParis("2008-10-08", new Date("2026-10-07T22:30:00Z")), 18);
  assert.equal(calculerAgeAParis("2008-10-08", new Date("2026-10-07T21:30:00Z")), 17);
  // Né un 29 février : un an de plus le 1er mars les années sans 29 février
  assert.equal(calculerAgeAParis("2008-02-29", new Date("2026-02-28T12:00:00Z")), 17);
  assert.equal(calculerAgeAParis("2008-02-29", new Date("2026-03-01T12:00:00Z")), 18);
  for (const date of ["", "08-10-2008", "2008-13-01", "2007-02-29", "2008-10-32", "1899-12-31", "2026-10-09", "2008-1-8"]) {
    assert.equal(calculerAgeAParis(date, midiAParis), null, date);
  }
});

test("attente après des échecs : rien avant le 5e, puis 1 s, 2 s, 4 s… jamais plus de 15 minutes", () => {
  assert.deepEqual([0, 1, 4, 5, 6, 7, 14, 15, 40].map(calculerAttenteConnexion), [0, 0, 0, 1, 2, 4, 512, 900, 900]);
});

test("l'attente par compte : comptée par e-mail, effacée par un succès ou après un jour sans échec", () => {
  let horloge = 1_000_000;
  const attente = creerAttenteParCompte(() => horloge);
  for (let i = 0; i < 4; i++) attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 1);
  assert.equal(attente.lireAttente("tom@exemple.fr"), 0);
  horloge += 1000;
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 2);
  attente.oublier("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  for (let i = 0; i < 20; i++) attente.noterEchec("tom@exemple.fr");
  assert.equal(attente.lireAttente("tom@exemple.fr"), 900);
  horloge += 25 * 3600_000;
  attente.noterEchec("tom@exemple.fr");
  assert.equal(attente.lireAttente("tom@exemple.fr"), 0, "après un jour sans échec, on repart de zéro");
});

test("une ligne de texte est nettoyée (espaces, sauts de ligne, caractères invisibles)", () => {
  assert.equal(nettoyerLigne("  Zoé \n\t de  la‮ Mer  "), "Zoé de la Mer");
  assert.equal(nettoyerLigne("Zélie​"), "Zélie");
  assert.equal(nettoyerLigne(" \n "), "");
});

test("une erreur se résume sans son message (qui pourrait contenir un e-mail)", () => {
  const erreur = Object.assign(new Error("Unique constraint failed: lea@exemple.fr"), { name: "PrismaClientKnownRequestError", code: "P2002" });
  const resume = resumerErreur(erreur);
  assert.match(resume, /^PrismaClientKnownRequestError P2002/);
  assert.ok(!resume.includes("lea@exemple.fr"));
  assert.equal(resumerErreur("texte"), "valeur string");
});
