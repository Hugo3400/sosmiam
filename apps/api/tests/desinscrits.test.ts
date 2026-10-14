// Tests de la liste des désinscrits gardée 3 ans : la ligne la plus récente par adresse, rien de plus vieux que la limite.
import assert from "node:assert/strict";
import { test } from "node:test";

import { garderDesinscritsRecents } from "../src/fonctions/courriels/garder-desinscrits-recents.ts";

test("plus de 3 ans : effacé ; doublons : la plus récente ; sans date : gardée, une fois", () => {
  const texte = ["lea@exemple.fr 2022-01-10", "Lea@Exemple.fr 2025-03-01", "tom@exemple.fr 2023-10-13", "zoe@exemple.fr 2023-10-14", "vieux@exemple.fr", "vieux@exemple.fr", "", "  "].join("\n");
  const { texte: garde, retires } = garderDesinscritsRecents(texte, "2023-10-14");
  assert.equal(garde, "vieux@exemple.fr\nlea@exemple.fr 2025-03-01\nzoe@exemple.fr 2023-10-14\n");
  assert.equal(retires, 3);
  assert.deepEqual(garderDesinscritsRecents("", "2023-10-14"), { texte: "", retires: 0 });
});

test("« Inscrire les comptes de l'app » : le résultat noté au journal, sans adresse", async () => {
  const { creerBancGestion } = await import("./outils/creer-banc-gestion.ts");
  const journal: string[] = [];
  const banc = await creerBancGestion({
    noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
    inscrireComptesAppNewsletter: async () => ({ comptes: 5, inscrits: 4, desinscrits: 1 }),
  } as never);
  const session = await banc.ouvrirSession();
  assert.deepEqual(await (await banc.demander("POST", "/newsletter/inscrire-comptes-app", { session })).json(), { ok: true, comptes: 5, inscrits: 4, desinscrits: 1 });
  assert.equal(journal.at(-1), "Comptes de l'app inscrits à la newsletter · 4 sur 5 (1 désinscrit(s) laissé(s) de côté)");
  await banc.fermer();
});
