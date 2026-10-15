import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerProchainChangementGenre } from "../src/fonctions/genre/calculer-prochain-changement-genre.ts";
import { trouverIdeeProche } from "../src/fonctions/idees/trouver-idee-proche.ts";
import { calculerRappelVeille } from "../src/fonctions/sorties-miamis/calculer-rappel-veille.ts";
import { compterPlacesLibres } from "../src/fonctions/sorties-miamis/compter-places-libres.ts";
import { estDansTrancheAge } from "../src/fonctions/sorties-miamis/est-dans-tranche-age.ts";
import { peutOrganiserPourPublic } from "../src/fonctions/sorties-miamis/peut-organiser-pour-public.ts";
import { peutVoirSortieMiamis } from "../src/fonctions/sorties-miamis/peut-voir-sortie-miamis.ts";
import { BORNES_TRANCHES_AGE, MAX_PLACES_SORTIE_MIAMIS, TRANCHES_AGE } from "../src/regles/sorties-miamis.ts";
import type { ProfilVisibiliteMiamis } from "../src/types/sorties-miamis.ts";
import { validerNouvelleIdee } from "../src/validation/valider-nouvelle-idee.ts";
import { validerNouvelleSortieMiamis } from "../src/validation/valider-nouvelle-sortie-miamis.ts";

const profil = (p: Partial<ProfilVisibiliteMiamis> = {}): ProfilVisibiliteMiamis => ({ genre: null, age: 30, nouveau: false, ambassadeur: false, ...p });

test("tranches d'âge : jamais avant 18 ans, bornes comprises", () => {
  assert.ok(TRANCHES_AGE.every((t) => BORNES_TRANCHES_AGE[t].min >= 18));
  assert.equal(estDansTrancheAge(18, "18-25"), true);
  assert.equal(estDansTrancheAge(25, "25-35"), true);
  assert.equal(estDansTrancheAge(36, "25-35"), false);
  assert.equal(estDansTrancheAge(72, "40-plus"), true);
});

test("une sortie réservée ne se voit que de son public", () => {
  assert.equal(peutVoirSortieMiamis({ type: "tous" }, profil()), true);
  assert.equal(peutVoirSortieMiamis({ type: "genre", genre: "femme" }, profil({ genre: "femme" })), true);
  assert.equal(peutVoirSortieMiamis({ type: "genre", genre: "femme" }, profil({ genre: "homme" })), false);
  assert.equal(peutVoirSortieMiamis({ type: "genre", genre: "autre" }, profil({ genre: "ne-pas-dire" })), false);
  assert.equal(peutVoirSortieMiamis({ type: "genre", genre: "homme" }, profil()), false);
  assert.equal(peutVoirSortieMiamis({ type: "age", tranche: "18-25" }, profil({ age: 30 })), false);
  assert.equal(peutVoirSortieMiamis({ type: "age", tranche: "18-25" }, profil({ age: null })), false);
  assert.equal(peutVoirSortieMiamis({ type: "nouveaux" }, profil({ nouveau: true })), true);
  assert.equal(peutVoirSortieMiamis({ type: "ambassadeurs" }, profil()), false);
});

test("organiser : il faut faire partie du public, sauf pour accueillir les nouveaux", () => {
  assert.equal(peutOrganiserPourPublic({ type: "genre", genre: "homme" }, profil({ genre: "femme" })), false);
  assert.equal(peutOrganiserPourPublic({ type: "genre", genre: "femme" }, profil({ genre: "femme" })), true);
  assert.equal(peutOrganiserPourPublic({ type: "nouveaux" }, profil({ nouveau: false })), true);
  assert.equal(peutOrganiserPourPublic({ type: "ambassadeurs" }, profil({ ambassadeur: true })), true);
});

test("places libres : la place gardée ne s'ouvre qu'à un nouveau", () => {
  const occupation = { places: 6, occupees: 5, placeGardeePourNouveau: true, nouveauDejaLa: false };
  assert.equal(compterPlacesLibres(occupation, false), 0);
  assert.equal(compterPlacesLibres(occupation, true), 1);
  assert.equal(compterPlacesLibres({ ...occupation, nouveauDejaLa: true }, false), 1);
  assert.equal(compterPlacesLibres({ ...occupation, occupees: 7 }, true), 0);
});

test("rappel : la veille à 18 h, heure de Paris", () => {
  const quand = Date.parse("2026-10-19T09:00:00.000Z");
  assert.equal(new Date(calculerRappelVeille(quand)).toISOString(), "2026-10-18T16:00:00.000Z");
});

test("genre : un changement par mois", () => {
  assert.equal(calculerProchainChangementGenre(null), null);
  assert.equal(calculerProchainChangementGenre("2026-10-15T10:00:00.000Z"), "2026-11-15T10:00:00.000Z");
});

test("anti-doublon : une idée proche est retrouvée, une autre non", () => {
  const idees = [
    { id: "1", titre: "Un filtre « J'ai 10 € pour manger »", detail: "Voir où manger sans exploser mon budget, un bouton petit budget.", votes: 214 },
    { id: "2", titre: "Voir les lieux encore ouverts après minuit", detail: "Pour les fringales tard la nuit.", votes: 167 },
    { id: "3", titre: "Des sorties pour les nouveaux dans la ville", detail: "", votes: 142 },
  ];
  assert.equal(trouverIdeeProche("Un mode petit budget", idees)?.id, "1");
  assert.equal(trouverIdeeProche("Les restos ouverts après minuit", idees)?.id, "2");
  assert.equal(trouverIdeeProche("Sorties pour nouveaux arrivants", idees)?.id, "3");
  assert.equal(trouverIdeeProche("Un badge pour les fans de soupe", idees), null);
  assert.equal(trouverIdeeProche("de la", idees), null);
});

test("nouvelle sortie des Miamis : 6 places au plus, étiquettes vérifiées, public connu", () => {
  const maintenant = new Date("2026-10-15T10:00:00.000Z");
  const base = {
    titre: " Brunch des nouveaux ",
    description: "",
    quand: "2026-10-19T09:00:00.000Z",
    lieuId: 18,
    public: { type: "tous" },
    etiquettes: [{ nom: "vegetarien", officielle: false }, { nom: "fans de ramen", officielle: false }],
    places: 6,
    placeGardeePourNouveau: true,
    recurrente: false,
  };
  const ok = validerNouvelleSortieMiamis(base, maintenant);
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.sortie.titre, "Brunch des nouveaux");
    assert.deepEqual(ok.sortie.etiquettes, [{ nom: "Végétarien", officielle: true }, { nom: "Fans de ramen", officielle: false }]);
  }
  assert.deepEqual(validerNouvelleSortieMiamis({ ...base, places: MAX_PLACES_SORTIE_MIAMIS + 1 }, maintenant), { ok: false, champ: "places" });
  assert.deepEqual(validerNouvelleSortieMiamis({ ...base, public: { type: "genre", genre: "mineur" } }, maintenant), { ok: false, champ: "public" });
  assert.deepEqual(validerNouvelleSortieMiamis({ ...base, etiquettes: [{ nom: "Mojito à volonté" }] }, maintenant), { ok: false, champ: "etiquettes", raison: "alcool" });
  assert.deepEqual(validerNouvelleSortieMiamis({ ...base, quand: "2026-10-15T10:05:00.000Z" }, maintenant), { ok: false, champ: "quand" });
});

test("nouvelle idée : une phrase assez longue, détail facultatif", () => {
  assert.deepEqual(validerNouvelleIdee({ titre: "  Un badge soupe  " }), { ok: true, idee: { titre: "Un badge soupe", detail: "" } });
  assert.deepEqual(validerNouvelleIdee({ titre: "Soupe" }), { ok: false, champ: "titre", raison: "trop-court" });
  assert.deepEqual(validerNouvelleIdee({ titre: "" }), { ok: false, champ: "titre", raison: "vide" });
});
