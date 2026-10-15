import assert from "node:assert/strict";
import { test } from "node:test";

import { ETIQUETTES_LIEUX_EXEMPLES } from "~/contenus/etiquettes-lieux-exemples";
import { decrireEtiquetteLieu } from "~/fonctions/etiquettes/decrire-etiquette-lieu";
import { preparerPropositionEtiquette } from "~/fonctions/etiquettes/preparer-proposition-etiquette";
import { FAMILLES_ETIQUETTES } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";

const confirmee = (nom) => ({ nom, statut: "confirmee", propositions: 0, parToi: false });
const proposee = (nom, propositions, parToi = false) => ({ nom, statut: "proposee", propositions, parToi });

test("décrire : confirmée, proposée par plusieurs, par toi seul·e, par toi et d'autres", () => {
  assert.deepEqual(decrireEtiquetteLieu(confirmee("Vegan")), { texte: "Vegan", libelleLu: "Vegan, confirmée par le lieu" });
  assert.deepEqual(decrireEtiquetteLieu(proposee("Calme", 6)), { texte: "Calme · 6", libelleLu: "Calme, proposée par 6 Miamis" });
  assert.deepEqual(decrireEtiquetteLieu(proposee("Brunch", 1)), { texte: "Brunch · 1", libelleLu: "Brunch, proposée par 1 Miami" });
  assert.deepEqual(decrireEtiquetteLieu(proposee("Jeux de société", 1, true)), { texte: "Jeux de société · toi", libelleLu: "Jeux de société, proposée par toi" });
  assert.deepEqual(decrireEtiquetteLieu(proposee("Calme", 7, true)), { texte: "Calme · 7", libelleLu: "Calme, proposée par 7 Miamis, dont toi" });
});

test("préparer : une officielle choisie, une libre qui gagne sur le choix, une libre qui est en fait officielle", () => {
  assert.deepEqual(preparerPropositionEtiquette("Halal", "", []), { ok: true, nom: "Halal" });
  assert.deepEqual(preparerPropositionEtiquette("Halal", "fans de ramen", []), { ok: true, nom: "Fans de ramen" });
  assert.deepEqual(preparerPropositionEtiquette(null, "végétarien", []), { ok: true, nom: "Végétarien" });
});

test("préparer : rien de choisi, déjà confirmée, déjà proposée par toi, refus du filtre", () => {
  assert.equal(preparerPropositionEtiquette(null, "  ", []).ok, false);
  assert.deepEqual(preparerPropositionEtiquette("Vegan", "", [confirmee("Vegan")]), { ok: false, message: "Le lieu l'a déjà confirmée : bien vu !" });
  assert.deepEqual(preparerPropositionEtiquette(null, "calme", [proposee("Calme", 3, true)]), { ok: false, message: "Tu l'as déjà proposée, merci !" });
  assert.equal(preparerPropositionEtiquette(null, "Calme", [proposee("Calme", 3)]).ok, true);
  assert.equal(preparerPropositionEtiquette(null, "Happy hour pas chère", []).ok, false);
});

test("démo : chaque étiquette d'exemple est officielle, sans alcool, sans doublon dans un même lieu", () => {
  const officielles = new Set(FAMILLES_ETIQUETTES.flatMap((f) => f.etiquettes));
  for (const [id, etiquettes] of Object.entries(ETIQUETTES_LIEUX_EXEMPLES)) {
    for (const e of etiquettes) {
      assert.ok(officielles.has(e.nom), `lieu ${id} : ${e.nom}`);
      assert.ok(e.nom === "Sans alcool" || !parleDAlcool(e.nom), `lieu ${id} : ${e.nom}`);
    }
    assert.equal(new Set(etiquettes.map((e) => e.nom)).size, etiquettes.length, `lieu ${id}`);
  }
});
