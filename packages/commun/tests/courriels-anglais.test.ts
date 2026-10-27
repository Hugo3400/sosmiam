import assert from "node:assert/strict";
import { test } from "node:test";

import { TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_PAR_LANGUE } from "../src/contenus/courriel-confirmation-newsletter.ts";
import { TEXTES_COURRIELS_COMPTES_PAR_LANGUE } from "../src/contenus/courriels-comptes.ts";
import { TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE } from "../src/contenus/courriels-limitations.ts";
import { MOTIFS_MODERATION } from "../src/contenus/motifs-moderation.ts";

const EXEMPLES = ["Léa", "29 octobre 2026"];
const IDENTIQUES_PERMIS = new Set(["violence"]);
const MOTS_FRANCAIS = /\b(ton|ta|tes|le|la|les|une|des|est|mail|compte|équipe|lien)\b/i;

function aplatir(valeur: unknown, chemin: string, sortie: Map<string, string>) {
  if (typeof valeur === "string") return void sortie.set(chemin, valeur);
  if (typeof valeur === "function") return aplatir((valeur as (...a: string[]) => unknown)(...EXEMPLES), `${chemin}()`, sortie);
  if (Array.isArray(valeur)) return valeur.forEach((element, i) => aplatir(element, `${chemin}[${i}]`, sortie));
  if (valeur && typeof valeur === "object") for (const [cle, element] of Object.entries(valeur)) aplatir(element, `${chemin}.${cle}`, sortie);
}

for (const [nom, paire] of [
  ["courriels-comptes", TEXTES_COURRIELS_COMPTES_PAR_LANGUE],
  ["courriels-limitations", TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE],
  ["courriel-confirmation-newsletter", TEXTES_COURRIEL_CONFIRMATION_NEWSLETTER_PAR_LANGUE],
] as const) {
  test(`${nom} : la même forme dans les deux langues, aucun texte vide, recopié ou resté en français`, () => {
    const francais = new Map<string, string>();
    const anglais = new Map<string, string>();
    aplatir(paire.fr, "", francais);
    aplatir(paire.en, "", anglais);
    assert.deepEqual([...anglais.keys()], [...francais.keys()]);
    for (const [chemin, texte] of anglais) {
      assert.ok(texte.trim().length > 0, `${chemin} : vide`);
      if (!IDENTIQUES_PERMIS.has(texte)) assert.notEqual(texte, francais.get(chemin), `${chemin} : recopié du français`);
      assert.doesNotMatch(texte.replace(/“Collaboration commerciale”/, ""), MOTS_FRANCAIS, `${chemin} : « ${texte} »`);
      assert.doesNotMatch(texte, / [?!:;]/, `${chemin} : espace avant une ponctuation`);
    }
  });
}

test("courriels-limitations : chaque motif de modération a son nom en clair dans les deux langues", () => {
  for (const langue of ["fr", "en"] as const) {
    assert.deepEqual(Object.keys(TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE[langue].motifs).sort(), [...MOTIFS_MODERATION].sort(), langue);
  }
  assert.equal(TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE.fr.motifs["pub-cachee"], "pub cachée");
});
