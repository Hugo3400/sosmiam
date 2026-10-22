import assert from "node:assert/strict";
import { test } from "node:test";

import { LONGUEUR_MAX_EXTRAIT_CITATION } from "@sos-miam/commun/regles/chat";
import { citerMessage } from "~/fonctions/chat/citer-message";
import { decrireCitation } from "~/fonctions/chat/decrire-citation";

const message = (autre) => ({ id: "m1", auteur: "lea", date: "2026-10-22T19:00:00.000Z", type: "texte", texte: "On se fait une pizza ?", reactions: {}, ...autre });

test("citer un texte : l'auteur, le type et l'extrait tel quel", () => {
  assert.deepEqual(citerMessage(message()), { id: "m1", auteur: "lea", type: "texte", extrait: "On se fait une pizza ?", etat: "visible" });
});

test("l'extrait s'arrête à la longueur permise, sans couper un emoji", () => {
  const long = `${"🍕".repeat(LONGUEUR_MAX_EXTRAIT_CITATION - 1)}🍝🍰`;
  const extrait = citerMessage(message({ texte: long })).extrait;
  assert.equal(Array.from(extrait).length, LONGUEUR_MAX_EXTRAIT_CITATION);
  assert.ok(extrait.endsWith("🍝"));
});

test("compte supprimé, photo, message caché : rien à lire", () => {
  assert.equal(citerMessage(message({ auteur: "" })).auteur, null);
  assert.deepEqual(citerMessage(message({ type: "photo", texte: undefined })), { id: "m1", auteur: "lea", type: "photo", extrait: null, etat: "visible" });
  for (const etat of ["supprime", "masque", "retire", "illisible"]) {
    const cite = citerMessage(message({ etat }));
    assert.equal(cite.etat, etat);
    assert.equal(cite.extrait, null);
  }
  assert.equal(citerMessage(message({ etat: "envoi" })).etat, "visible");
});

test("la citation dans la bulle : « Message indisponible » pour un message caché", () => {
  for (const etat of ["supprime", "masque", "retire", "illisible"]) {
    assert.deepEqual(decrireCitation({ id: "m1", auteur: null, type: "texte", extrait: null, etat }), { vu: "Message indisponible", lu: "Message indisponible" });
  }
});

test("la citation dans la bulle : le texte replié, ou ce qu'était le message", () => {
  const cite = (type, extrait = null) => ({ id: "m1", auteur: "lea", type, extrait, etat: "visible" });
  assert.equal(decrireCitation(cite("texte", "Pizza\n\nce soir ?")).vu, "Pizza ce soir ?");
  assert.equal(decrireCitation(cite("photo")).vu, "📷 Photo");
  assert.equal(decrireCitation(cite("vocal")).lu, "une note vocale");
  assert.equal(decrireCitation(cite("lieu", "On y va ?"), "Chez Nonna Lia").vu, "📍 Chez Nonna Lia · On y va ?");
  assert.equal(decrireCitation(cite("lieu")).vu, "📍 Un lieu");
  assert.equal(decrireCitation(cite("gif")).vu, "🎞️ GIF");
  assert.equal(decrireCitation(cite("texte", "   ")).vu, "Message indisponible");
});
