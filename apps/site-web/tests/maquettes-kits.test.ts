// Les maquettes validées dans les kits médias (contenus/maquettes-kits.ts) : chaque fichier cité existe dans presse/, aucun
// nom ne se répète dans un kit ni ne cache un fichier du kit lui-même, et un kit ne sert que ses maquettes (Miam Safe
// seulement si la charte est signée). Lancer : node --test tests/*.test.ts
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// @ts-ignore : Node a besoin de l'extension « .ts », que la configuration TypeScript du site n'autorise pas dans un import
import { listerMaquettesKit, maquettesKits, trouverFichierMaquette, zipsMaquettes } from "../src/contenus/maquettes-kits.ts";

const site = join(import.meta.dirname, "..");
const presse = join(site, "..", "..", "presse");
const KITS = { ambassadeurs: "kit-media", pro: "kit-media-pro", lieux: "kit-media-lieux" } as const;

/** Les noms des fichiers d'un dossier de kit, sous-dossiers compris */
function lister(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lister(join(dossier, e.name)) : [e.name]));
}

test("chaque fichier et chaque aperçu des maquettes existe dans presse/", () => {
  const chemins = [
    ...maquettesKits.flatMap((m: any) => [...m.fichiers.map((f: any) => f.chemin), ...m.apercus.map((a: any) => a.chemin)]),
    ...zipsMaquettes.map((z: any) => z.fichier.chemin),
  ];
  const manquants = chemins.filter((c) => !existsSync(join(presse, c)));
  assert.deepEqual(manquants, []);
  assert.ok(chemins.every((c) => !c.includes("..")));
});

test("dans chaque kit, un nom ne sert qu'une fois et ne cache aucun fichier du kit", () => {
  for (const [kit, dossier] of Object.entries(KITS)) {
    const noms = [
      ...listerMaquettesKit(kit as any).flatMap((m: any) => [...m.fichiers.map((f: any) => f.nom), ...m.apercus.map((a: any) => a.nom)]),
      ...zipsMaquettes.filter((z: any) => z.kit === kit).map((z: any) => z.fichier.nom),
    ];
    assert.equal(new Set(noms).size, noms.length, `doublon dans le kit ${kit}`);
    const duKit = new Set(lister(join(site, dossier)));
    assert.deepEqual(noms.filter((n) => duKit.has(n)), [], `nom déjà pris dans ${dossier}`);
  }
});

test("un kit ne sert que ses maquettes ; Miam Safe seulement aux lieux qui ont signé la charte", () => {
  assert.equal(trouverFichierMaquette("lieux", "affiche-vitrine-miam-safe-a3.pdf")?.chemin, "affiches/affiche-vitrine-miam-safe-a3.pdf");
  assert.equal(trouverFichierMaquette("ambassadeurs", "affiche-vitrine-miam-safe-a3.pdf"), null);
  assert.equal(trouverFichierMaquette("pro", "affiche-ambassadeurs-aventure.pdf"), null);
  assert.equal(trouverFichierMaquette("ambassadeurs", "sos-miam-reseaux.zip")?.format, "ZIP");
  assert.equal(trouverFichierMaquette("lieux", "sos-miam-reseaux.zip"), null);
  assert.equal(trouverFichierMaquette("ambassadeurs", "../../.env"), null);
  assert.ok(listerMaquettesKit("lieux", true).some((m: any) => m.miamSafe));
  assert.ok(!listerMaquettesKit("lieux", false).some((m: any) => m.miamSafe));
  // Les maquettes à personnaliser ne sont dans aucun kit
  assert.ok(maquettesKits.every((m: any) => !/vitrine-lieu|chevalet|carte-visite/.test(m.id)));
});
