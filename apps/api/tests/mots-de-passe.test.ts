// Tests des mots de passe et des petites fonctions des comptes : empreintes scrypt (et leur file d'attente), règles du
// mot de passe, âge à Paris, attente après des échecs, clé d'un visiteur pour les limites. Aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { test } from "node:test";

import { creerAttenteParCompte } from "../src/controleurs/comptes-attente.ts";
import { calculerAgeAParis } from "../src/fonctions/comptes/calculer-age-a-paris.ts";
import { calculerAttenteConnexion } from "../src/fonctions/comptes/calculer-attente-connexion.ts";
import { chargerMotsDePasseCourants } from "../src/fonctions/comptes/charger-mots-de-passe-courants.ts";
import { nettoyerLigne } from "../src/fonctions/comptes/nettoyer-ligne.ts";
import { resumerErreur } from "../src/fonctions/comptes/resumer-erreur.ts";
import { validerMotDePasse } from "../src/fonctions/comptes/valider-mot-de-passe.ts";
import { calculerCleVisiteur } from "../src/fonctions/securite/calculer-cle-visiteur.ts";
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

test("file des calculs pleine (2 en cours, 20 en attente) : refus immédiat 503, que verifierMotDePasse laisse remonter", async () => {
  const sel = randomBytes(16);
  const occupe = (erreur: Error & { status?: number }) => erreur.status === 503;
  // Deux calculs lents (p = 16 : bien plus d'un quart de seconde) prennent les deux places ; vingt petits attendent leur tour
  const enCours = [1, 2].map(() => calculerScrypt("x", sel, 32, { ...REGLAGES_SCRYPT, p: 16 }));
  const enAttente = Array.from({ length: 20 }, () => calculerScrypt("x", sel, 16, { N: 1024, r: 1, p: 1 }));
  await assert.rejects(calculerScrypt("x", sel, 16, { N: 1024, r: 1, p: 1 }), occupe);
  const empreinte = `scrypt$1024$1$1$${sel.toString("base64url")}$${randomBytes(16).toString("base64url")}`;
  await assert.rejects(verifierMotDePasse("une petite phrase de passe", empreinte), occupe, "pas « false » : ce n'est pas un mauvais mot de passe");
  await assert.rejects(hacherMotDePasse("une petite phrase de passe"), occupe);
  await Promise.all([...enCours, ...enAttente]);
  // La file s'est vidée : tout repart
  assert.equal(await verifierMotDePasse("une petite phrase de passe", empreinte), false);
});

test("mot de passe : 12 à 128 caractères, pas parmi les plus courants, pas l'e-mail", () => {
  const email = "camille@exemple.fr";
  assert.equal(validerMotDePasse("une petite phrase", email), true);
  assert.equal(validerMotDePasse("douze carac.", email), true);
  assert.equal(validerMotDePasse("onze carac.", email), false);
  assert.equal(validerMotDePasse("une petite phrase ".repeat(8).slice(0, 128), email), true);
  assert.equal(validerMotDePasse("une petite phrase ".repeat(8).slice(0, 129), email), false);
  // Un emoji compte pour un caractère, et « é » décomposé aussi (normalisation NFC : 129 points de code avant, 128 après)
  assert.equal(validerMotDePasse("🍰🍕🍜🥐🧀🍩🍓🥗🍔🌮🍣🍦", email), true);
  assert.equal(validerMotDePasse("🍰🍕🍜🥐🧀🍩🍓🥗🍔🌮🍣", email), false);
  assert.equal(validerMotDePasse("e\u0301te\u0301 a\u0300 la mer", email), true);
  assert.equal(validerMotDePasse("e\u0301" + "une petite phrase ".repeat(8).slice(0, 127), email), true);
  for (const courant of ["motdepasse123", "MotDePasse123", "Azerty 123456", "PASSWORD1234", "1q2w3e4r5t6y", "sosmiam12345"]) {
    assert.equal(validerMotDePasse(courant, email), false, courant);
  }
  assert.equal(validerMotDePasse("Camille@Exemple.fr", email), false);
  assert.equal(validerMotDePasse(" ".repeat(14), email), false);
});

test("mot de passe : rien d'évident, même entouré de chiffres ou de signes ; 16 chiffres au moins s'il n'y a que des chiffres", () => {
  const email = "camille@exemple.fr";
  for (const evident of [
    "aaaaaaaaaaaaa", "1111111111111", "123456789012345", "000000000000000", "121212121212", "abcdefghijklm", "zyxwvutsrqpon",
    "Motdepasse2026!", "motdepasse12345", "password12345678", "azertyuiop1234", "qwertyuiop1234", "jetaime123456", "1q2w3e4r5t6y7u",
    "camille2026!!", "🍰".repeat(12), "x".repeat(128),
  ]) {
    assert.equal(validerMotDePasse(evident, email), false, evident);
  }
  assert.equal(validerMotDePasse("camille.dupont", "camille.dupont@exemple.fr"), false, "ce qui précède le « @ »");
  // Que des chiffres (CNIL 2022-100, cas 2, exemple 3) : 16 au moins, espaces et signes n'y changent rien
  for (const chiffres of ["482910374652", "4829 1037 4652 918", "06 12 34 56 78 90", "08/10/2026-1234"]) {
    assert.equal(validerMotDePasse(chiffres, email), false, chiffres);
  }
  assert.equal(validerMotDePasse("4829 1037 4652 9183", email), true);
  assert.equal(validerMotDePasse("Crème brûlée du dimanche", email), true);
});

test("grande liste de mots de passe courants : plus de 10 000, en français et en anglais, chargée une seule fois", () => {
  const liste = chargerMotsDePasseCourants();
  assert.ok(liste.size > 10_000, `${liste.size} mots de passe`);
  assert.equal(chargerMotsDePasseCourants(), liste, "lue une fois, puis gardée");
  for (const mot of ["azerty", "motdepasse", "soleil", "doudou", "chouchou", "marseille", "jennifer", "football", "pssw0rd"]) assert.ok(liste.has(mot), mot);
  assert.ok([...liste].every((mot) => mot.length >= 6 && mot === mot.toLowerCase() && !/\s/.test(mot)));
  const email = "camille@exemple.fr";
  for (const courant of ["Chouchou2026!!", "P@ssw0rd2026!", "!!Marseille13!!", "Jennifer1985", "iloveyou2026", "Doudou 123456", "Nicolas.2026!", "loulou 06 12 34"]) {
    assert.equal(validerMotDePasse(courant, email), false, courant);
  }
});

test("des phrases normales et 200 000 mots de passe tirés au hasard ne sont jamais refusés à tort", () => {
  const email = "camille@exemple.fr";
  for (const phrase of [
    "mon chat adore les croissants", "Crème brûlée du dimanche", "le soleil se lève sur Marseille", "J'aime le chocolat chaud 2026",
    "doudou dort sous la couette", "une petite phrase de passe", "football le mardi soir avec Nico", "Les crêpes de mamie Jeanne",
    "ma pizza préférée : la 4 fromages", "Azerty est un clavier bizarre",
  ]) {
    assert.equal(validerMotDePasse(phrase, email), true, phrase);
  }
  const lettres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.!?@#&*+=éèàç ";
  const mots = ["miam", "croissant", "tartine", "velo", "nuage", "riviere", "lampe", "orange", "tigre", "pomme", "jardin", "piano", "bleu", "vite"];
  const octets = randomBytes(200_000 * 24);
  let refuses = 0;
  const debut = performance.now();
  for (let i = 0; i < 200_000; i++) {
    const tranche = octets.subarray(i * 24, i * 24 + 24);
    const motDePasse = i % 2 === 0
      ? [...tranche.subarray(0, 12 + (tranche[23] % 12))].map((octet) => lettres[octet % lettres.length]).join("")
      // 4 mots différents (le même mot répété est un petit motif, refusé à raison), dans un ordre tiré au hasard
      : mots.map((mot, j) => ({ mot, rang: tranche[j] })).sort((a, b) => a.rang - b.rang).slice(0, 4).map(({ mot }) => mot).join(" ") + String(tranche[20] % 100);
    if (!validerMotDePasse(motDePasse, email)) refuses++;
  }
  assert.equal(refuses, 0);
  assert.ok(performance.now() - debut < 10_000, "rapide : la liste n'est lue qu'une fois");
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

test("attente après des échecs : rien avant le 5e, puis 2 min, 4 min, 8 min… jamais plus de 2 heures", () => {
  assert.deepEqual([0, 1, 4, 5, 6, 7, 10, 11, 40].map(calculerAttenteConnexion), [0, 0, 0, 120, 240, 480, 3840, 7200, 7200]);
});

test("en respectant chaque attente, 21 essais au plus sur 24 heures (CNIL : 25 au plus), puis 12 par jour", () => {
  let horloge = 0;
  const attente = creerAttenteParCompte(() => horloge);
  const UN_JOUR = 86_400_000;
  const essais: number[] = [];
  while (horloge < 3 * UN_JOUR) {
    horloge += attente.lireAttente("lea@exemple.fr") * 1000;
    essais.push(horloge);
    attente.noterEchec("lea@exemple.fr");
  }
  const surUnJour = (debut: number) => essais.filter((moment) => moment >= debut && moment < debut + UN_JOUR).length;
  assert.equal(Math.max(...essais.map(surUnJour)), 21);
  assert.equal(surUnJour(2 * UN_JOUR), 12);
});

test("l'attente par compte : comptée par e-mail, effacée par un succès ou après un jour sans échec", () => {
  let horloge = 1_000_000;
  const attente = creerAttenteParCompte(() => horloge);
  for (let i = 0; i < 4; i++) attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 120);
  assert.equal(attente.lireAttente("tom@exemple.fr"), 0);
  horloge += 120_000;
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  attente.noterEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 240);
  attente.oublier("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 0);
  for (let i = 0; i < 20; i++) attente.noterEchec("tom@exemple.fr");
  assert.equal(attente.lireAttente("tom@exemple.fr"), 7200);
  horloge += 25 * 3600_000;
  attente.noterEchec("tom@exemple.fr");
  assert.equal(attente.lireAttente("tom@exemple.fr"), 0, "après un jour sans échec, on repart de zéro");
});

test("un essai qui n'a pas pu avoir lieu (file des calculs pleine, panne) est retiré, sans raccourcir l'attente", () => {
  let horloge = 1_000_000;
  const attente = creerAttenteParCompte(() => horloge);
  attente.noterEchec("noa@exemple.fr");
  attente.annulerEchec("noa@exemple.fr");
  assert.equal(attente.compterSuivis(), 0, "un seul essai, retiré : l'adresse n'est plus gardée");
  for (let i = 0; i < 5; i++) attente.noterEchec("lea@exemple.fr");
  horloge += 120_000;
  attente.noterEchec("lea@exemple.fr");
  attente.annulerEchec("lea@exemple.fr");
  assert.equal(attente.lireAttente("lea@exemple.fr"), 120, "5 échecs comptés, l'attente part du dernier essai");
  attente.annulerEchec("tom@exemple.fr");
  assert.equal(attente.lireAttente("tom@exemple.fr"), 0);
});

test("le ménage passe chaque minute : sans nouvel échec, une adresse est oubliée au bout d'un jour", (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  let horloge = 1_000_000;
  const attente = creerAttenteParCompte(() => horloge);
  for (let i = 0; i < 5; i++) attente.noterEchec("lea@exemple.fr");
  horloge += 12 * 3600_000;
  attente.noterEchec("tom@exemple.fr");
  horloge += 12 * 3600_000 - 60_000;
  t.mock.timers.tick(60_000);
  assert.equal(attente.compterSuivis(), 2, "pas encore un jour");
  horloge += 60_000;
  t.mock.timers.tick(60_000);
  assert.equal(attente.compterSuivis(), 1, "un jour après son dernier échec, lea est oubliée ; tom, plus récent, reste");
});

test("clé d'un visiteur : une IPv4 telle quelle, une IPv6 par son bloc /56", () => {
  for (const [ip, cle] of [
    ["203.0.113.7", "203.0.113.7"], [" 203.0.113.7 ", "203.0.113.7"], ["visiteur-12", "visiteur-12"], ["inconnu", "inconnu"],
    ["2a01:cb00:1234:5678:9abc:def0:1234:5678", "2a01:cb00:1234:5600::/56"], ["2A01:CB00:1234:56ff::2", "2a01:cb00:1234:5600::/56"],
    ["2a01:cb00:1234:5700::1", "2a01:cb00:1234:5700::/56"], ["2606:4700:3036::6815:5f64", "2606:4700:3036:0::/56"], ["::1", "0:0:0:0::/56"],
    ["::ffff:192.0.2.60", "192.0.2.60"], ["0:0:0:0:0:ffff:c000:23c", "192.0.2.60"], ["2a01:e0a:1:2:3:4:1.2.3.4", "2a01:e0a:1:0::/56"],
  ]) {
    assert.equal(calculerCleVisiteur(ip), cle, ip);
  }
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
