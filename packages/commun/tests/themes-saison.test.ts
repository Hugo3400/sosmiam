import { test } from "node:test";
import assert from "node:assert/strict";
import { TEXTES_THEMES_SAISON_ANGLAIS } from "../src/contenus/anglais/themes-saison.ts";
import { TEXTES_THEMES_SAISON } from "../src/contenus/themes-saison.ts";
import { choisirThemeDuJour } from "../src/fonctions/themes-saison/choisir-theme-du-jour.ts";
import { listerThemesDuJour } from "../src/fonctions/themes-saison/lister-themes-du-jour.ts";
import { preparerThemeSaisonApi } from "../src/fonctions/themes-saison/preparer-theme-saison-api.ts";
import { THEMES_SAISON } from "../src/regles/calendrier-themes-saison.ts";
import { IDS_THEMES_SAISON, TENUES_CAPITAINE, type CouleursThemeSaison } from "../src/regles/themes-saison.ts";

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const TOMATE = "#FF4D3D";

function luminance(hex: string): number {
  const [r, v, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

test("thèmes de saison : un thème par identifiant, dans le même ordre, avec une tenue connue", () => {
  assert.deepEqual(THEMES_SAISON.map((t) => t.id), [...IDS_THEMES_SAISON]);
  for (const theme of THEMES_SAISON) assert.ok(TENUES_CAPITAINE.includes(theme.tenue), theme.id);
});

test("thèmes de saison : des périodes au format AAAA-MM-JJ, dans l'ordre", () => {
  for (const theme of THEMES_SAISON) {
    assert.ok(theme.periodes.length > 0, theme.id);
    for (const { debut, fin } of theme.periodes) {
      assert.match(debut, JOUR, theme.id);
      assert.match(fin, JOUR, theme.id);
      assert.ok(debut <= fin, `${theme.id} : ${debut} → ${fin}`);
      assert.ok(!Number.isNaN(Date.parse(debut)) && !Number.isNaN(Date.parse(fin)), theme.id);
    }
  }
});

test("thèmes de saison : lisibles en clair comme en sombre, et jamais la tomate des SOS", () => {
  for (const theme of THEMES_SAISON) {
    const palettes: [string, CouleursThemeSaison][] = [["clair", theme.couleurs], ["sombre", theme.couleursSombres ?? theme.couleurs]];
    for (const [nom, c] of palettes) {
      assert.ok(contraste(c.texte, c.fond) >= 4.5, `${theme.id} (${nom}) : texte sur fond`);
      assert.ok(contraste(c.surAccent, c.accent) >= 4.5, `${theme.id} (${nom}) : bouton`);
      for (const couleur of Object.values(c)) assert.notEqual(couleur.toUpperCase(), TOMATE, theme.id);
    }
  }
});

test("thèmes de saison : un fond clair a sa version sombre", () => {
  for (const theme of THEMES_SAISON) {
    if (luminance(theme.couleurs.fond) > 0.4) assert.ok(theme.couleursSombres, theme.id);
  }
});

test("thèmes de saison : tous les textes existent en français et en anglais, sans vide", () => {
  for (const id of IDS_THEMES_SAISON) {
    const fr = TEXTES_THEMES_SAISON[id];
    const en = TEXTES_THEMES_SAISON_ANGLAIS[id];
    assert.deepEqual(Object.keys(en), Object.keys(fr), id);
    for (const cle of Object.keys(fr) as (keyof typeof fr)[]) {
      assert.ok(fr[cle].trim().length > 0, `${id}.${cle} (fr)`);
      assert.ok(en[cle].trim().length > 0, `${id}.${cle} (en)`);
    }
  }
});

test("thèmes de saison : l'anglais suit le glossaire (pas d'espace avant la ponctuation, pas de tiret cadratin, pas de Captain Bouiboui)", () => {
  for (const id of IDS_THEMES_SAISON) {
    for (const texte of Object.values(TEXTES_THEMES_SAISON_ANGLAIS[id])) {
      assert.doesNotMatch(texte, /\s[?!:;]/, `${id} : ${texte}`);
      assert.doesNotMatch(texte, /—/, `${id} : ${texte}`);
      assert.doesNotMatch(texte, /Captain Bouiboui/, `${id} : ${texte}`);
    }
  }
});

test("thèmes de saison : le français garde l'espace avant ? et !, et ne parle jamais d'alcool sauf pour dire « sans »", () => {
  for (const id of IDS_THEMES_SAISON) {
    for (const texte of Object.values(TEXTES_THEMES_SAISON[id])) {
      assert.doesNotMatch(texte, /\S[?!]/, `${id} : ${texte}`);
      assert.doesNotMatch(texte, /\b(bière|vin|pinte|apéro|cocktails?(?! sans))\b/i, `${id} : ${texte}`);
    }
  }
});

test("thèmes de saison : un lien d'info officiel seulement pour les thèmes sobres, en https, et le bouton dit sa langue si elle change", () => {
  for (const theme of THEMES_SAISON) {
    if (!theme.lienInfo) continue;
    assert.equal(theme.sobre, true, theme.id);
    assert.match(theme.lienInfo.adresse, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//, theme.id);
    if (theme.lienInfo.langue !== "fr") assert.match(TEXTES_THEMES_SAISON[theme.id].bouton, /\(en anglais\)$/, theme.id);
    if (theme.lienInfo.langue !== "en") assert.match(TEXTES_THEMES_SAISON_ANGLAIS[theme.id].bouton, /\(in French\)$/, theme.id);
  }
  assert.ok(THEMES_SAISON.find((t) => t.id === "octobre-rose")?.lienInfo);
  assert.ok(THEMES_SAISON.find((t) => t.id === "movember")?.lienInfo);
});

test("choisirThemeDuJour : rien un jour sans thème", () => {
  assert.equal(choisirThemeDuJour("2026-09-01"), null);
});

test("choisirThemeDuJour : Halloween passe devant Octobre rose la dernière semaine d'octobre", () => {
  assert.equal(choisirThemeDuJour("2026-10-20")?.theme.id, "octobre-rose");
  assert.equal(choisirThemeDuJour("2026-10-31")?.theme.id, "halloween");
  assert.deepEqual(listerThemesDuJour("2026-10-31").map((t) => t.theme.id), ["halloween", "octobre-rose"]);
});

test("choisirThemeDuJour : un soir de match passe devant Movember, le 11 novembre aussi", () => {
  assert.equal(choisirThemeDuJour("2026-11-02")?.theme.id, "movember");
  assert.equal(choisirThemeDuJour("2026-11-04")?.theme.id, "soir-de-match");
  assert.equal(choisirThemeDuJour("2026-11-07")?.theme.id, "tests-novembre");
  assert.equal(choisirThemeDuJour("2026-11-11")?.theme.id, "jours-feries");
});

test("choisirThemeDuJour : Noël passe devant un soir de match, et la fête passe devant le Tournoi le 14 février", () => {
  assert.equal(choisirThemeDuJour("2026-12-08")?.theme.id, "noel");
  assert.equal(choisirThemeDuJour("2027-02-14")?.theme.id, "saint-valentin");
  assert.deepEqual(listerThemesDuJour("2027-02-14").map((t) => t.theme.id), ["saint-valentin", "six-nations"]);
});

test("choisirThemeDuJour : janvier enchaîne Nouvel An, galette puis Janvier tout doux", () => {
  assert.equal(choisirThemeDuJour("2027-01-01")?.theme.id, "nouvel-an");
  assert.equal(choisirThemeDuJour("2027-01-06")?.theme.id, "galette");
  assert.equal(choisirThemeDuJour("2027-01-25")?.theme.id, "janvier-tout-doux");
  assert.equal(choisirThemeDuJour("2027-01-27")?.theme.id, "soir-de-match");
});

test("choisirThemeDuJour : un thème réservé à une ville n'apparaît que pour elle", () => {
  assert.equal(choisirThemeDuJour("2027-04-03"), null);
  assert.equal(choisirThemeDuJour("2027-04-03", "Lyon"), null);
  assert.equal(choisirThemeDuJour("2027-04-03", "Paris")?.theme.id, "pasta-party");
});

test("preparerThemeSaisonApi : la période du jour, les textes dans la langue et la palette sombre par défaut", () => {
  const noel = choisirThemeDuJour("2026-12-10");
  assert.ok(noel);
  const fr = preparerThemeSaisonApi(noel, "fr");
  assert.equal(fr.debut, "2026-12-01");
  assert.equal(fr.fin, "2026-12-25");
  assert.equal(fr.textes.nom, "Noël");
  assert.deepEqual(fr.couleursSombres, fr.couleurs);
  assert.equal(fr.sobre, false);
  assert.equal(fr.lienInfo, null);
  assert.equal(preparerThemeSaisonApi(noel, "en").textes.nom, "Christmas");
  const rose = choisirThemeDuJour("2026-10-10");
  assert.ok(rose);
  const api = preparerThemeSaisonApi(rose, "fr");
  assert.equal(api.sobre, true);
  assert.deepEqual(api.lienInfo?.langue, "fr");
  assert.notDeepEqual(api.couleursSombres, api.couleurs);
});
