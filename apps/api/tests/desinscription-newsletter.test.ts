// Désinscription de la newsletter par le lien signé : jetons (fonctions pures), liens, et routes /newsletter avec une
// fausse desinscrire() en mémoire. Aucune base, aucun fichier de clé réel. node --test tests/*.test.ts.
import assert from "node:assert/strict";
import { hkdfSync } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { creerJetonDesinscription } from "../src/fonctions/newsletter/creer-jeton-desinscription.ts";
import { lireJetonDesinscription } from "../src/fonctions/newsletter/lire-jeton-desinscription.ts";
import { deriverSousCle } from "../src/fonctions/securite/deriver-sous-cle.ts";
import { masquerEmail } from "../src/fonctions/texte/masquer-email.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import {
  brancherCleDesinscription, CONTEXTE_DESINSCRIPTION, creerAdresseDesinscriptionUnClic, creerLienDesinscription,
} from "../src/services/liens-desinscription.ts";

const cleMaitre = Buffer.alloc(32, 7);
const cle = deriverSousCle(cleMaitre, CONTEXTE_DESINSCRIPTION);

test("deriverSousCle : HKDF-SHA256 sans sel, 32 octets, une clé par contexte, différente de la clé maître", () => {
  assert.equal(cle.length, 32);
  assert.deepEqual(cle, Buffer.from(hkdfSync("sha256", cleMaitre, Buffer.alloc(0), Buffer.from(CONTEXTE_DESINSCRIPTION), 32)));
  assert.notDeepEqual(cle, deriverSousCle(cleMaitre, "autre usage"));
  assert.notDeepEqual(cle, cleMaitre);
  assert.throws(() => deriverSousCle(Buffer.alloc(16), CONTEXTE_DESINSCRIPTION));
  assert.deepEqual(creerChiffrementDonnees(cleMaitre).deriverCle(CONTEXTE_DESINSCRIPTION), cle, "le service de chiffrement donne la même");
});

test("jeton : adresse en minuscules + « . » + 16 octets de signature, relu à l'identique", () => {
  const jeton = creerJetonDesinscription("  Camille.Dupont@Gmail.COM ", cle);
  const [partieEmail, signature] = jeton.split(".");
  assert.equal(Buffer.from(partieEmail ?? "", "base64url").toString(), "camille.dupont@gmail.com");
  assert.equal(Buffer.from(signature ?? "", "base64url").length, 16);
  assert.match(jeton, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/);
  assert.equal(lireJetonDesinscription(jeton, cle), "camille.dupont@gmail.com");
  assert.equal(creerJetonDesinscription("camille.dupont@gmail.com", cle), jeton, "même jeton quelle que soit la casse");
  assert.equal(lireJetonDesinscription(creerJetonDesinscription("zoé@exemple.fr", cle), cle), "zoé@exemple.fr", "accents compris");
});

test("jeton faux : autre clé, signature ou adresse changée, forme bizarre → null", () => {
  const jeton = creerJetonDesinscription("lea@exemple.fr", cle);
  const [partieEmail = "", signature = ""] = jeton.split(".");
  const autreEmail = Buffer.from("tom@exemple.fr").toString("base64url");
  const signatureChangee = `${signature.slice(0, -2)}${signature.endsWith("AA") ? "BA" : "AA"}`;
  const fautifs: unknown[] = [
    creerJetonDesinscription("lea@exemple.fr", deriverSousCle(cleMaitre, "autre usage")),
    `${autreEmail}.${signature}`,
    `${partieEmail}.${signatureChangee}`,
    `${partieEmail}.${signature.slice(0, 20)}`,
    `${partieEmail}=.${signature}`,
    `${partieEmail}.${signature}.x`,
    partieEmail, "", ".", "a.b", `${"A".repeat(500)}.${signature}`, 42, null, undefined, ["x"],
    creerJetonDesinscription("pas-une-adresse", cle),
  ];
  for (const faux of fautifs) assert.equal(lireJetonDesinscription(faux, cle), null, String(faux).slice(0, 40));
});

test("masquerEmail : première lettre, *** et le domaine", () => {
  assert.equal(masquerEmail("camille@gmail.com"), "c***@gmail.com");
  assert.equal(masquerEmail("é@exemple.fr"), "é***@exemple.fr");
  assert.equal(masquerEmail("@exemple.fr"), "***");
  assert.equal(masquerEmail("rien"), "***");
});

test("liens : null sans clé des données ; sinon la page du site et l'adresse un clic de l'API, même jeton", () => {
  assert.equal(brancherCleDesinscription(null), null);
  assert.equal(creerLienDesinscription("lea@exemple.fr"), null);
  assert.equal(creerAdresseDesinscriptionUnClic("lea@exemple.fr"), null);
  assert.deepEqual(brancherCleDesinscription(creerChiffrementDonnees(cleMaitre)), cle);
  const jeton = creerJetonDesinscription("lea@exemple.fr", cle);
  assert.equal(creerLienDesinscription("Lea@Exemple.fr"), `https://sosmiam.fr/desinscription?jeton=${jeton}`);
  assert.equal(creerAdresseDesinscriptionUnClic("lea@exemple.fr"), `https://api.sosmiam.fr/newsletter/desinscription?jeton=${jeton}`);
});

// --- Routes, avec une fausse liste d'inscrits ---
const inscrits = new Map<string, number>();
const desinscrits: number[] = [];
const notes: string[] = [];
let enPanne = false;
let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  newsletter: {
    cle,
    trouverInscrit: async (email) => {
      if (enPanne) throw Object.assign(new Error(`base indisponible pour ${email}`), { code: "P1001" });
      return inscrits.get(email) ?? null;
    },
    desinscrire: async (id) => {
      for (const [email, idInscrit] of inscrits) if (idInscrit === id) {
        inscrits.delete(email);
        desinscrits.push(id);
        return true;
      }
      return false;
    },
    noterDesinscrit: async (email) => void notes.push(email),
  },
}).listen(0, "127.0.0.1");
const serveurSansCle = creerApplication({
  enregistrerInscription: async () => {},
  newsletter: { cle: null, trouverInscrit: async () => null, desinscrire: async () => false },
}).listen(0, "127.0.0.1");
let adresseSansCle = "";

before(() => Promise.all([serveur, serveurSansCle].map((s) => new Promise<void>((pret) => s.once("listening", () => pret())))).then(() => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  adresseSansCle = `http://127.0.0.1:${(serveurSansCle.address() as AddressInfo).port}`;
}));
after(() => Promise.all([serveur, serveurSansCle].map((s) => new Promise<void>((fini) => s.close(() => fini())))));
beforeEach(() => {
  inscrits.clear();
  inscrits.set("lea@exemple.fr", 3).set("tom@exemple.fr", 4);
  desinscrits.length = 0;
  notes.length = 0;
  enPanne = false;
});

let visiteur = 0;
const ip = () => `203.0.113.${++visiteur % 250}`;
const jetonDe = (email: string) => creerJetonDesinscription(email, cle);

test("POST un clic (RFC 8058) : formulaire « List-Unsubscribe=One-Click », jeton dans l'adresse → désinscrit tout de suite", async () => {
  const reponse = await fetch(`${adresse}/newsletter/desinscription?jeton=${jetonDe("lea@exemple.fr")}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-IP-Visiteur": ip() },
    body: "List-Unsubscribe=One-Click",
  });
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { ok: true });
  assert.equal(reponse.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(desinscrits, [3]);
  assert.equal(inscrits.has("lea@exemple.fr"), false);
  assert.deepEqual(notes, [], "desinscrire() a déjà noté l'adresse");
});

test("POST avec le jeton dans le corps, en JSON ou en formulaire", async () => {
  const json = await fetch(`${adresse}/newsletter/desinscription`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-IP-Visiteur": ip() }, body: JSON.stringify({ jeton: jetonDe("lea@exemple.fr") }),
  });
  const formulaire = await fetch(`${adresse}/newsletter/desinscription`, {
    method: "POST", headers: { "X-IP-Visiteur": ip() }, body: new URLSearchParams({ jeton: jetonDe("tom@exemple.fr") }),
  });
  assert.deepEqual([json.status, formulaire.status], [200, 200]);
  assert.deepEqual(desinscrits, [3, 4]);
});

test("GET ne désinscrit pas : il rend seulement l'adresse masquée", async () => {
  const reponse = await fetch(`${adresse}/newsletter/desinscription?jeton=${jetonDe("lea@exemple.fr")}`, { headers: { "X-IP-Visiteur": ip() } });
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { ok: true, email: "l***@exemple.fr" });
  assert.deepEqual(desinscrits, []);
  assert.deepEqual(notes, []);
  assert.equal(inscrits.has("lea@exemple.fr"), true);
});

test("adresse inconnue (ou déjà désinscrite) : 200 quand même, et notée comme désinscrite", async () => {
  for (let essai = 0; essai < 2; essai += 1) {
    const reponse = await fetch(`${adresse}/newsletter/desinscription?jeton=${jetonDe("zoe@exemple.fr")}`, { method: "POST", headers: { "X-IP-Visiteur": ip() } });
    assert.equal(reponse.status, 200);
  }
  assert.deepEqual(desinscrits, []);
  assert.deepEqual(notes, ["zoe@exemple.fr", "zoe@exemple.fr"]);
});

test("faux jeton : 400 jeton-invalide, en GET comme en POST, et rien ne bouge", async () => {
  const faux = `${Buffer.from("lea@exemple.fr").toString("base64url")}.${"A".repeat(22)}`;
  for (const methode of ["GET", "POST"]) {
    for (const suite of [`?jeton=${faux}`, "", "?jeton=abc"]) {
      const reponse = await fetch(`${adresse}/newsletter/desinscription${suite}`, { method: methode, headers: { "X-IP-Visiteur": ip() } });
      assert.equal(reponse.status, 400, `${methode} ${suite}`);
      assert.deepEqual(await reponse.json(), { ok: false, erreur: "jeton-invalide" });
    }
  }
  assert.deepEqual([desinscrits, notes], [[], []]);
});

test("limite par IP : au-delà de 30 demandes en 10 minutes, 429", async () => {
  const meme = "198.51.100.9";
  const statuts: number[] = [];
  for (let n = 0; n < 31; n += 1) {
    statuts.push((await fetch(`${adresse}/newsletter/desinscription?jeton=x`, { headers: { "X-IP-Visiteur": meme } })).status);
  }
  assert.equal(statuts.filter((statut) => statut === 400).length, 30);
  assert.equal(statuts.at(-1), 429);
});

test("panne : 500 sans l'adresse dans le journal ; sans clé des données : 503", async () => {
  enPanne = true;
  const journal: unknown[][] = [];
  const original = console.error;
  console.error = (...morceaux: unknown[]) => void journal.push(morceaux);
  try {
    const reponse = await fetch(`${adresse}/newsletter/desinscription?jeton=${jetonDe("lea@exemple.fr")}`, { method: "POST", headers: { "X-IP-Visiteur": ip() } });
    assert.equal(reponse.status, 500);
  } finally {
    console.error = original;
  }
  assert.equal(journal.length, 1);
  assert.doesNotMatch(JSON.stringify(journal), /lea@exemple\.fr/);
  const sansCle = await fetch(`${adresseSansCle}/newsletter/desinscription?jeton=${jetonDe("lea@exemple.fr")}`, { headers: { "X-IP-Visiteur": ip() } });
  assert.equal(sansCle.status, 503);
});
