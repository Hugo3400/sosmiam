// Défis écrits dans le logiciel de gestion (validerDefi), catalogue des badges, badges automatiques et client GET /app/defis.
import { test } from "node:test";
import assert from "node:assert/strict";
import { creerDefisApi } from "../src/client-api/api/api-defis.ts";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { BADGES } from "../src/contenus/badges.ts";
import { BADGES_AUTOMATIQUES } from "../src/regles/badges-automatiques.ts";
import { validerDefi } from "../src/validation/valider-defi.ts";

const BON = {
  emoji: "🥐", titre: "La tournée des pâtissiers", texte: "3 pâtisseries différentes, 3 visites validées. La balance, on verra plus tard.",
  mesure: "lieux-differents", filtres: { typesLieu: ["patisserie"] }, objectif: 3, points: 30, debut: "2026-10-14", fin: null, publie: true, ordre: 4,
};
const champ = (retouches: Record<string, unknown>) => {
  const r = validerDefi({ ...BON, ...retouches });
  return r.ok ? null : r.champ;
};

test("validerDefi : un défi complet passe, nettoyé ; publié, ordre, filtres et fin ont leur valeur par défaut", () => {
  assert.deepEqual(validerDefi({ ...BON, titre: "  La tournée \n des pâtissiers " }), { ok: true, defi: { ...BON, titre: "La tournée des pâtissiers" } });
  const { publie: _p, ordre: _o, filtres: _f, fin: _fi, ...minimum } = BON;
  assert.deepEqual(validerDefi({ ...minimum, mesure: "avis" }), { ok: true, defi: { ...minimum, mesure: "avis", filtres: null, fin: null, publie: false, ordre: 0 } });
  // Filtres vides : null ; écrits dans le même ordre, types de lieu une fois chacun
  assert.equal((validerDefi({ ...BON, filtres: {} }) as { defi: { filtres: unknown } }).defi.filtres, null);
  const r = validerDefi({ ...BON, mesure: "visites", filtres: { pendantSos: true, typesLieu: ["sortie", "resto", "sortie"], apresHeure: 22 } });
  assert.ok(r.ok);
  assert.equal(JSON.stringify(r.defi.filtres), '{"typesLieu":["resto","sortie"],"apresHeure":22,"pendantSos":true}');
});

test("validerDefi : le premier champ à corriger, dans l'ordre du formulaire", () => {
  assert.deepEqual(validerDefi(null), { ok: false, erreur: "champ-invalide", champ: "emoji" });
  for (const emoji of [undefined, "", "abc", "🚀 x", "🚀".repeat(9), "🍺", "🥂✨", 3]) assert.equal(champ({ emoji }), "emoji", String(emoji));
  for (const emoji of ["🚀", "✍️", "🇫🇷", "1️⃣"]) assert.equal(champ({ emoji }), null, emoji);
  for (const titre of [undefined, "  ", "x".repeat(61), "Le défi des connards", "La tournée des bières", 12]) assert.equal(champ({ titre }), "titre", String(titre));
  for (const texte of [undefined, "", "x".repeat(301), "Bois 3 cocktails et c'est gagné"]) assert.equal(champ({ texte }), "texte", String(texte));
  assert.equal(champ({ mesure: "kilometres" }), "mesure");
  // Filtres : seulement ceux de la mesure, bien formés ; jamais « bar » (un défi rapporte des points : loi Évin)
  for (const filtres of [[], "patisserie", { typesLieu: [] }, { typesLieu: ["bar"] }, { typesLieu: ["patisserie", "bar"] }, { avecPhoto: true }, { couleur: "bleu" }]) {
    assert.equal(champ({ filtres }), "filtres", JSON.stringify(filtres));
  }
  for (const filtres of [{ apresHeure: 11 }, { apresHeure: 24 }, { apresHeure: 22.5 }, { pendantSos: false }, { pendantSos: "oui" }]) {
    assert.equal(champ({ mesure: "visites", filtres }), "filtres", JSON.stringify(filtres));
  }
  assert.equal(champ({ mesure: "rescousses", filtres: { typesLieu: ["resto"] } }), "filtres");
  assert.equal(champ({ mesure: "villes-differentes", filtres: { pendantSos: true } }), "filtres");
  assert.equal(champ({ mesure: "avis", filtres: { avecPhoto: true } }), null);
  for (const objectif of [0, 101, 2.5, "3", null]) assert.equal(champ({ objectif }), "objectif", String(objectif));
  for (const points of [-1, 201, 10.5, "30"]) assert.equal(champ({ points }), "points", String(points));
  assert.equal(champ({ points: 0 }), null);
  for (const debut of [undefined, "14/10/2026", "2026-02-30", "2026-13-01", "1999-01-01"]) assert.equal(champ({ debut }), "debut", String(debut));
  for (const fin of ["2026-10-13", "2026-02-30", "bientôt", 3]) assert.equal(champ({ fin }), "fin", String(fin));
  assert.equal(champ({ fin: "2026-10-14" }), null);
  assert.equal(champ({ publie: "oui" }), "publie");
  for (const ordre of [-1, 1000, 1.5, "2"]) assert.equal(champ({ ordre }), "ordre", String(ordre));
});

test("validerDefi : les 8 défis de départ (migration du 14 octobre 2026) passent tels quels", () => {
  const depart = [
    ["🚀", "Premiers de cordée", "Sois le tout premier à donner une rescousse à 3 lieux qui viennent d'arriver.", "premiers-sauvetages", null, 3, 40, "2026-12-31"],
    ["🛟", "La Brigade de l'automne", "9 rescousses avant la fin novembre : 3 par semaine, et le tour est joué.", "rescousses", null, 9, 30, "2026-11-30"],
    ["🧭", "Globe-croqueur", "Fais valider ta visite dans 5 lieux différents. Ton estomac te dira merci.", "lieux-differents", null, 5, 50, null],
    ["🥐", "La tournée des pâtissiers", "3 pâtisseries différentes, 3 visites validées. La balance, on verra plus tard.", "lieux-differents", { typesLieu: ["patisserie"] }, 3, 30, null],
    ["🎳", "Sors de ta cuisine", "Bowling, escape game, karaoké… 2 sorties différentes validées.", "lieux-differents", { typesLieu: ["sortie"] }, 2, 30, null],
    ["🔥", "Pompier de service", "Réponds à 2 SOS : une visite validée pendant qu'un lieu a des tables à remplir.", "visites", { pendantSos: true }, 2, 40, null],
    ["✍️", "Plume gourmande", "Écris 3 avis après tes visites. Les lieux adorent, les gourmands aussi.", "avis", null, 3, 30, null],
    ["📅", "Fidèle au poste", "Une visite validée par semaine, 3 semaines d'affilée.", "semaines-d-affilee", null, 3, 40, null],
  ] as const;
  depart.forEach(([emoji, titre, texte, mesure, filtres, objectif, points, fin], i) => {
    const defi = { emoji, titre, texte, mesure, filtres, objectif, points, debut: "2026-10-14", fin, publie: true, ordre: i + 1 };
    assert.deepEqual(validerDefi(defi), { ok: true, defi }, titre);
  });
});

test("badges : catalogue partagé (ids uniques), critères automatiques, Noctambule après 22 h dans tous les lieux", () => {
  const ids = BADGES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["premier-sauveteur", "deniche-par-toi", "fondateur", ...BADGES_AUTOMATIQUES.map((b) => b.id)]) assert.ok(ids.includes(id as never), id);
  assert.equal(BADGES.find((b) => b.id === "noctambule")?.texte, "3 visites validées après 22 h");
  const noctambule = BADGES_AUTOMATIQUES.find((b) => b.id === "noctambule");
  assert.deepEqual(noctambule, { id: "noctambule", mesure: "visites", filtres: { apresHeure: 22 }, objectif: 3 });
  // Aucun badge automatique ne vise les bars
  assert.ok(BADGES_AUTOMATIQUES.every((b) => !b.filtres?.typesLieu?.includes("bar")));
});

test("client : GET /app/defis avec la session, et ses refus", async () => {
  const appels: { url: string; methode: string; jeton: string | null }[] = [];
  let reponse: { statut: number; corps: unknown } = { statut: 200, corps: { ok: true, defis: [{ id: 1, titre: "Globe-croqueur" }] } };
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), jeton: new Headers(init.headers).get("authorization") });
    return new Response(JSON.stringify(reponse.corps), { status: reponse.statut, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  const service = creerDefisApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: async () => "jeton", fetch: faux }));
  assert.deepEqual(await service.listerDefis(), { ok: true, defis: [{ id: 1, titre: "Globe-croqueur" }] });
  assert.deepEqual(appels, [{ url: "https://api.exemple.fr/app/defis", methode: "GET", jeton: "Bearer jeton" }]);
  reponse = { statut: 429, corps: { ok: false, erreur: "trop-de-demandes" } };
  assert.deepEqual(await service.listerDefis(), { ok: false, erreur: "trop-de-demandes" });
});
