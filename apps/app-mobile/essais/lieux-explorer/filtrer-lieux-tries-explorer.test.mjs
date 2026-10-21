import assert from "node:assert/strict";
import { test } from "node:test";

import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { filtrerLieuxTriesExplorer } from "~/fonctions/lieux/filtrer-lieux-tries-explorer";
import { lireTexteRechercheLieu } from "~/fonctions/lieux/lire-texte-recherche-lieu";
import { trierLieuxExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

import { creerLieux } from "./donnees.mjs";

function filtrerLieuxExplorerAvant(lieux, filtres, maintenant) {
  const mots = normaliserRecherche(filtres.texte).split(" ").filter(Boolean);
  return lieux.filter((lieu) => {
    if (filtres.type !== "tous" && lieu.type !== filtres.type) return false;
    if (filtres.ville && lieu.ville !== filtres.ville) return false;
    if (filtres.budgets.length > 0 && !filtres.budgets.includes(lieu.prix)) return false;
    if (filtres.ouvertMaintenant && !estOuvertMaintenant(lieu, maintenant)) return false;
    if (mots.length === 0) return true;
    const texte = normaliserRecherche([lieu.nom, lieu.info, lieu.plat, lieu.quartier, lieu.ville, ...lieu.tags].join(" "));
    return mots.every((mot) => texte.includes(mot));
  });
}

const MAINTENANT = new Date(2026, 9, 16, 20, 15);
const LIEUX = creerLieux(600, 7);
const PROFIL = { prenom: "Hugo", pseudo: "hugo", dateNaissance: "1995-01-01", ville: "Marseille", envies: { lieux: ["restos"], moments: ["petit-budget"], regimes: [] }, creeLe: "2026-09-01T00:00:00.000Z" };
const MODES = [
  { nom: "selon tes envies", profil: PROFIL, position: null, depart: { latitude: 43.2965, longitude: 5.3698 } },
  { nom: "Autour de moi", profil: PROFIL, position: { latitude: 45.76, longitude: 4.83 }, depart: null },
  { nom: "visite sans compte", profil: null, position: null, depart: null },
];
const FILTRES = [
  { texte: "", type: "tous", ville: null, budgets: [], ouvertMaintenant: false },
  { texte: "pizza", type: "tous", ville: null, budgets: [], ouvertMaintenant: false },
  { texte: "PIZZÀ  port", type: "resto", ville: null, budgets: [], ouvertMaintenant: false },
  { texte: "coeur", type: "tous", ville: null, budgets: ["€", "€€"], ouvertMaintenant: false },
  { texte: "saint jean", type: "tous", ville: null, budgets: [], ouvertMaintenant: true },
  { texte: "", type: "bar", ville: "Marseille", budgets: [], ouvertMaintenant: true },
  { texte: "terrasse", type: "tous", ville: "Villeneuve-d'Ascq", budgets: ["€€€"], ouvertMaintenant: false },
  { texte: "œnologie", type: "tous", ville: null, budgets: [], ouvertMaintenant: false },
];

test("trier une fois puis filtrer donne la même liste que filtrer puis trier (ordre et distances)", () => {
  for (const { nom, profil, position, depart } of MODES) {
    const tries = trierLieuxExplorer(LIEUX, profil, position, depart);
    for (const filtres of FILTRES) {
      const attendu = trierLieuxExplorer(filtrerLieuxExplorerAvant(LIEUX, filtres, MAINTENANT), profil, position, depart);
      const obtenu = filtrerLieuxTriesExplorer(tries, { ...filtres, ouvertA: filtres.ouvertMaintenant ? MAINTENANT : null });
      assert.deepEqual(
        obtenu.map(({ lieu, km }) => [lieu.id, km]),
        attendu.map(({ lieu, km }) => [lieu.id, km]),
        `${nom} · ${JSON.stringify(filtres)}`,
      );
    }
  }
});

test("sans aucun filtre : la liste triée elle-même, sans copie", () => {
  const tries = trierLieuxExplorer(LIEUX, PROFIL, null, null);
  assert.equal(filtrerLieuxTriesExplorer(tries, { texte: "  ", type: "tous", ville: null, budgets: [], ouvertA: null }), tries);
});

test("le texte cherché d'un lieu : normalisé une fois, gardé tant que c'est le même objet", () => {
  const [lieu] = LIEUX;
  const attendu = normaliserRecherche([lieu.nom, lieu.info, lieu.plat, lieu.quartier, lieu.ville, ...lieu.tags].join(" "));
  assert.equal(lireTexteRechercheLieu(lieu), attendu);
  assert.equal(lireTexteRechercheLieu(lieu), attendu);
  const copie = { ...lieu, nom: "Chez Gégé" };
  assert.ok(lireTexteRechercheLieu(copie).startsWith("chez gege"));
});

test("filtre « étiquette » : ne garde que les lieux qui la portent (confirmée), sans tenir compte des accents ni de la casse", () => {
  const lieux = trierLieuxExplorer(LIEUX.slice(0, 30), null, null, null);
  const etiquettes = new Map([
    [lieux[0].lieu.id, [{ nom: "Végétarien", statut: "confirmee", propositions: 0, parToi: false }]],
    [lieux[3].lieu.id, [{ nom: "Vegan", statut: "confirmee", propositions: 0, parToi: false }, { nom: "végétarien", statut: "confirmee", propositions: 0, parToi: false }]],
  ]);
  const lire = (id) => etiquettes.get(id) ?? [];
  const base = { texte: "", type: "tous", ville: null, budgets: [], ouvertA: null };
  assert.deepEqual(
    filtrerLieuxTriesExplorer(lieux, { ...base, etiquette: "Vegetarien" }, lire).map(({ lieu }) => lieu.id),
    [lieux[0].lieu.id, lieux[3].lieu.id],
  );
  assert.deepEqual(filtrerLieuxTriesExplorer(lieux, { ...base, etiquette: "Halal" }, lire), []);
  assert.equal(filtrerLieuxTriesExplorer(lieux, { ...base, etiquette: null }, lire), lieux);
  assert.deepEqual(filtrerLieuxTriesExplorer(lieux, { ...base, etiquette: "Vegan" }), []);
});
