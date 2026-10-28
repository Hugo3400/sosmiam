import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const DOSSIERS = [new URL("../../src/contenus/", import.meta.url), new URL("../../../../packages/commun/src/contenus/", import.meta.url)];
const MARQUES = /SOS Miam|Miam Safe|BIG SOS|Capitaine Bouiboui|Miamis?|Brigade|Instagram|TikTok|Facebook|Google|Apple|GIPHY|Expo|iPhone|Android|Spotify|Deezer|Lydia|SAMU|CNIL/g;
const PHRASES_IDENTIQUES = new Set(["collaboration commerciale", "français", "english", "toujours en français", "always in english", "fête de la musique"]);
const MOTS_IDENTIQUES = new Set(["menu", "menus", "brunch", "email", "info", "infos", "photo", "photos", "pause", "note", "notes", "message", "messages", "actus", "miam", "tops", "point", "points", "vote", "votes", "admin", "gif", "gifs", "discrimination", "powered", "giphy", "halloween", "movember", "chandeleur", "bio", "solo", "duo", "golf", "karaoke", "quiz", "concert", "concerts", "sport", "brunchs", "burger", "burgers", "pizza", "pizzas", "sushi", "tapas", "bar", "bars", "restaurant", "restaurants", "type", "minimum", "maximum", "total", "service", "services", "ambassador", "max", "vegan", "local", "version", "play", "store", "app", "halal", "casher", "kosher", "wifi"]);
const IDENTIFIANT = /^([a-z0-9]+(-[a-z0-9]+)*|\/[^\s]*|(sms|tel|mailto|https?):[^\s]*)$/;
const ARGUMENTS = [[], [2], [2, 3], ["Léa"], ["Léa", 2], [2, "Léa"], ["Léa", "Paris"]];

async function listerPaires() {
  const paires = [];
  for (const dossier of DOSSIERS) {
    for (const nom of readdirSync(dossier).filter((n) => n.endsWith(".ts")).sort()) {
      const chemin = fileURLToPath(new URL(nom, dossier));
      if (!readFileSync(chemin, "utf8").includes("_PAR_LANGUE")) continue;
      const module = await import(pathToFileURL(chemin).href);
      for (const [cle, valeur] of Object.entries(module)) {
        if (cle.endsWith("_PAR_LANGUE") && valeur && typeof valeur === "object" && "fr" in valeur && "en" in valeur) paires.push({ nom: `${nom} › ${cle}`, fr: valeur.fr, en: valeur.en });
      }
    }
  }
  return paires;
}

function estTexteAvecMots(texte) {
  if (IDENTIFIANT.test(texte) || PHRASES_IDENTIQUES.has(texte.trim().toLowerCase())) return false;
  const sansMarques = texte.replace(MARQUES, " ").replace(/\{[^}]*\}|\$\{[^}]*\}/g, " ").replace(/\d+\s?(min|km|h)\b/g, " ");
  const mots = sansMarques.toLowerCase().split(/[^a-zà-ÿ]+/).filter((mot) => mot.length >= 3);
  return mots.some((mot) => !MOTS_IDENTIQUES.has(mot));
}

function comparer(fr, en, chemin, problemes) {
  if (typeof fr === "string") {
    if (typeof en !== "string") return problemes.push(`${chemin} : pas de texte anglais`);
    if (fr.trim() !== "" && en.trim() === "") return problemes.push(`${chemin} : texte anglais vide`);
    if (fr === en && estTexteAvecMots(fr)) problemes.push(`${chemin} : resté en français (« ${fr.slice(0, 60)} »)`);
    return;
  }
  if (typeof fr === "function") {
    if (typeof en !== "function") return problemes.push(`${chemin} : pas de fonction anglaise`);
    for (const args of ARGUMENTS) {
      if (args.length < fr.length) continue;
      let a;
      let b;
      try {
        a = fr(...args);
        b = en(...args);
      } catch {
        continue;
      }
      if (typeof a === "string" && typeof b === "string") return comparer(a, b, `${chemin}(${args.join(", ")})`, problemes);
    }
    return;
  }
  if (Array.isArray(fr)) {
    if (!Array.isArray(en) || en.length !== fr.length) return problemes.push(`${chemin} : liste anglaise de longueur différente`);
    fr.forEach((element, i) => comparer(element, en[i], `${chemin}[${i}]`, problemes));
    return;
  }
  if (fr && typeof fr === "object") {
    if (!en || typeof en !== "object") return problemes.push(`${chemin} : pas d'objet anglais`);
    for (const cle of Object.keys(fr)) comparer(fr[cle], en[cle], `${chemin}.${cle}`, problemes);
  }
}

test("chaque dictionnaire a son anglais : rien de vide, rien resté en français", async () => {
  const paires = await listerPaires();
  assert.ok(paires.length > 0, "aucune paire trouvée");
  const problemes = [];
  for (const { nom, fr, en } of paires) comparer(fr, en, nom, problemes);
  assert.deepEqual(problemes, []);
});
