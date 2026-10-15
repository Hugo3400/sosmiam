import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { lireAnnonceApp } from "../src/controleurs/gestion/controleurs-annonces-app.ts";
import { ChampInvalide } from "../src/controleurs/gestion/lire-champs.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const maintenant = new Date("2026-10-15T12:00:00Z");
const base = { titre: "Nouveau à Lyon", texte: "Les premiers lieux sont en ligne, viens les sauver !", cible: "tous" };
const champ = (corps: Record<string, unknown>) => {
  try {
    lireAnnonceApp(corps, maintenant);
    return null;
  } catch (erreur) {
    return erreur instanceof ChampInvalide ? erreur.champ : "autre";
  }
};

test("une pop-up : titre et texte, bouton complet ou absent, lien d'écran, ville pour la cible ville, fin après le début", () => {
  const lue = lireAnnonceApp(base, maintenant);
  assert.deepEqual([lue.debut.toISOString(), lue.fin, lue.ville, lue.boutonLien], [maintenant.toISOString(), null, null, null]);
  assert.equal(champ({ ...base, titre: "" }), "titre");
  assert.equal(champ({ ...base, cible: "mineurs" }), "cible");
  assert.equal(champ({ ...base, cible: "ville" }), "ville");
  assert.equal(lireAnnonceApp({ ...base, cible: "ville", ville: "Lyon" }, maintenant).ville, "Lyon");
  assert.equal(lireAnnonceApp({ ...base, cible: "pros", ville: "Lyon" }, maintenant).ville, null);
  assert.equal(champ({ ...base, boutonLibelle: "Voir" }), "boutonLien");
  assert.equal(champ({ ...base, boutonLien: "/explorer" }), "boutonLibelle");
  assert.equal(champ({ ...base, boutonLibelle: "Voir", boutonLien: "https://exemple.fr" }), "boutonLien");
  assert.equal(lireAnnonceApp({ ...base, boutonLibelle: "Voir", boutonLien: "/lieu/12" }, maintenant).boutonLien, "/lieu/12");
  assert.equal(champ({ ...base, debut: "2026-10-20T10:00:00Z", fin: "2026-10-19T10:00:00Z" }), "fin");
  assert.equal(champ({ ...base, debut: "pas une date" }), "debut");
});

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  creerAnnonceApp: async (saisie: { cible: string }) => (appels.push(saisie), { id: 4, cible: saisie.cible }),
  publierAnnonceApp: async (id: number, publiee: boolean) => (appels.push({ id, publiee }), id === 4),
  supprimerAnnonceApp: async (id: number) => (id === 4 ? "deja-publiee" : id === 5 ? "ok" : "introuvable"),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("routes : créer, publier ou retirer, supprimer seulement un brouillon ; journal sans texte", async () => {
  assert.equal((await banc.demander("POST", "/annonces-app", { session, corps: { ...base, titre: "" } })).status, 400);
  assert.equal((await banc.demander("POST", "/annonces-app", { session, corps: base })).status, 200);
  assert.equal(journal.at(-1), "Pop-up de l'app créée · pop-up n° 4, cible tous");
  assert.equal((await banc.demander("POST", "/annonces-app/4/publication", { session, corps: { publiee: "oui" } })).status, 400);
  assert.equal((await banc.demander("POST", "/annonces-app/4/publication", { session, corps: { publiee: false } })).status, 200);
  assert.equal(journal.at(-1), "Pop-up de l'app retirée · pop-up n° 4");
  assert.equal((await banc.demander("POST", "/annonces-app/9/publication", { session, corps: { publiee: true } })).status, 404);
  assert.equal((await banc.demander("DELETE", "/annonces-app/4", { session })).status, 409);
  assert.equal((await banc.demander("DELETE", "/annonces-app/5", { session })).status, 200);
  assert.equal((await banc.demander("DELETE", "/annonces-app/6", { session })).status, 404);
  assert.ok(!journal.some((ligne) => ligne.includes("sauver")));
});
