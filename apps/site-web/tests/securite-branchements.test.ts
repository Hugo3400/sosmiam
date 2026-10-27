import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${import.meta.dirname}/../src/`).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (specificateur.startsWith("~/")) return suivant(`${racine}${specificateur.slice(2)}.ts`, contexte);
    return suivant(specificateur, contexte);
  },
});

const { TEXTES_PIED_DE_PAGE } = await import("../src/contenus/liens-pied-de-page.ts");
const { TEXTES_PAGES_LEGALES } = await import("../src/contenus/legal/liens-legaux.ts");
const { construireGroupesPiedDePage } = await import("../src/fonctions/navigation/construire-groupes-pied-de-page.ts");
const groupesPiedDePage = construireGroupesPiedDePage(TEXTES_PIED_DE_PAGE, TEXTES_PAGES_LEGALES, "fr");
const { pagesIndexees } = await import("../src/contenus/plan-du-site.ts");
const { documentConfidentialite } = await import("../src/contenus/legal/confidentialite.ts");
const { documentCgu } = await import("../src/contenus/legal/cgu.ts");

test("Chasse aux bugs : les deux routes, le pied de page, le plan du site et les textes légaux", () => {
  const routes = readFileSync(`${import.meta.dirname}/../src/routes.ts`, "utf8");
  assert.match(routes, /route\("securite", "routes\/public\/securite\.tsx"\)/);
  assert.match(routes, /route\("\.well-known\/security\.txt", "routes\/ressources\/fichier-security-txt\.ts"\)/);
  const liens = groupesPiedDePage.flatMap((groupe) => groupe.liens);
  assert.ok(liens.some((lien) => lien.texte === "Chasse aux bugs" && lien.adresse === "/securite" && lien.site === "principal"));
  assert.ok(pagesIndexees.includes("/securite"));
  assert.ok(documentConfidentialite.sections.some((section) => section.id === "chasse-aux-bugs"));
  assert.ok(documentConfidentialite.chapitres.some((chapitre) => chapitre.sections.includes("chasse-aux-bugs")));
  assert.match(JSON.stringify(documentCgu.sections), /\[Chasse aux bugs\]\(\/securite\)/);
});
