import assert from "node:assert/strict";
import { test } from "node:test";

import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { decrireLieuCarte } from "~/fonctions/lieux/decrire-lieu-carte";

import { creerHasard } from "./donnees.mjs";

function decrireLieuAvant(lieu) {
  const sos = lieu.sos
    ? `En SOS ce soir : ${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}${lieu.sos.offre ? `, ${lieu.sos.offre}` : ""}`
    : null;
  const nonVerifie = estLieuVerifie(lieu) ? null : "Lieu non vérifié, sans compte SOS Miam";
  const quoiEtOu = [lieu.info.trim(), lieu.quartier.trim()].filter(Boolean).join(", ");
  return [lieu.nom, ...[quoiEtOu, sos, lieu.alerte ?? null, nonVerifie].filter((morceau) => !!morceau)].join(". ");
}

test("le libellé lu par VoiceOver et TalkBack ne change pas", () => {
  const hasard = creerHasard(31);
  const choisir = (liste) => liste[Math.floor(hasard() * liste.length)];
  for (let i = 0; i < 500; i++) {
    const lieu = {
      id: i,
      nom: choisir(["Chez Mémé", "Le Bouiboui du Port", "Café Cœur", ""]),
      info: choisir(["Pizzeria", "  Pâtisserie ", "", "Bar à fruits"]),
      quartier: choisir(["Le Panier", "", " Vieux-Port "]),
      verifie: choisir([true, false, undefined]),
      alerte: choisir([undefined, "", "Salle calme ce soir"]),
      sos: choisir([undefined, { places: 1, jusqua: "21:30" }, { places: 4, jusqua: "20:00", offre: "Dessert offert" }]),
    };
    assert.equal(decrireLieuCarte(lieu, "fr"), decrireLieuAvant(lieu));
  }
  assert.equal(
    decrireLieuCarte({ nom: "Chez Mémé", info: "Pizzeria", quartier: "Le Panier", verifie: false, sos: undefined, alerte: undefined }, "fr"),
    "Chez Mémé. Pizzeria, Le Panier. Lieu non vérifié, sans compte SOS Miam",
  );
  assert.equal(
    decrireLieuCarte({ nom: "Chez Mémé", info: "Pizzeria", quartier: "Le Panier", verifie: false, sos: undefined, alerte: undefined }, "en"),
    "Chez Mémé. Pizzeria, Le Panier. Place not verified, no SOS Miam account",
  );
  assert.equal(
    decrireLieuCarte({ nom: "Chez Mémé", info: "Pizzeria", quartier: "", verifie: true, sos: { places: 1, jusqua: "21:30", offre: "Dessert offert" }, alerte: undefined }, "en"),
    "Chez Mémé. Pizzeria. SOS tonight: 1 seat until 21:30, Dessert offert",
  );
});
