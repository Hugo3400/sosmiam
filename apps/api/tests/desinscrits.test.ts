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

test("« Inscrire les comptes de l'app » : désactivé en attendant que le « non » de la case soit noté", async () => {
  const { creerBancGestion } = await import("./outils/creer-banc-gestion.ts");
  const journal: string[] = [];
  const banc = await creerBancGestion({
    noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
    inscrireComptesAppNewsletter: async () => ({ comptes: 5, inscrits: 4, desinscrits: 1 }),
  } as never);
  const session = await banc.ouvrirSession();
  // Désactivé depuis l'audit du 14 octobre 2026 : rien n'est inscrit, rien n'est noté
  assert.deepEqual(await (await banc.demander("POST", "/newsletter/inscrire-comptes-app", { session })).json(), { ok: false, erreur: "desactive" });
  assert.equal(journal.length, 0);
  await banc.fermer();
});
