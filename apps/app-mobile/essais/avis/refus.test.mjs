import assert from "node:assert/strict";
import { test } from "node:test";

import { decrireRefusEnvoiAvis } from "~/fonctions/avis/decrire-refus-envoi-avis";
import { decrireRefusPhotoAvis } from "~/fonctions/avis/decrire-refus-photo-avis";

const ERREURS_PHOTO = ["format-refuse", "media-trop-lourd", "media-invalide", "stockage-plein", "trop-de-demandes", "introuvable", "avis-invalide"];

test("aucun texte de photo d'avis ne parle de 5 Mo ni de note vocale, et le titre ne se répète pas dans le texte", () => {
  for (const erreur of ERREURS_PHOTO) {
    for (const champ of [undefined, "format", "dimensions"]) {
      const m = decrireRefusPhotoAvis({ ou: "photo", erreur, champ }, "fr");
      assert.doesNotMatch(`${m.titre} ${m.texte}`, /5 Mo|vocale|4 096/, erreur);
      assert.doesNotMatch(m.texte, /Ta photo n'est pas (partie|passée)/, erreur);
      assert.ok(m.titre.length > 0 && m.texte.length > 0, erreur);
    }
  }
});

test("photo trop petite : on dit la taille attendue (320 px), pas un refus vague", () => {
  const m = decrireRefusPhotoAvis({ ou: "photo", erreur: "media-invalide", champ: "dimensions" }, "fr");
  assert.match(m.texte, /320/);
  assert.match(m.texte, /plus grande/);
  const format = decrireRefusPhotoAvis({ ou: "photo", erreur: "media-invalide", champ: "format" }, "fr");
  assert.doesNotMatch(format.texte, /320/);
  assert.match(format.texte, /Choisis-en une autre/);
});

test("trop de photos en une heure : l'attente donnée par le serveur, sinon « dans un moment »", () => {
  const avecAttente = decrireRefusPhotoAvis({ ou: "photo", erreur: "trop-de-demandes", details: { attenteS: 120 } }, "fr");
  assert.match(avecAttente.texte, /2[\s  ]minutes/);
  assert.equal(avecAttente.emoji, "🐢");
  const sansAttente = decrireRefusPhotoAvis({ ou: "photo", erreur: "trop-de-demandes" }, "fr");
  assert.match(sansAttente.texte, /dans un moment/);
});

test("photo qui n'a pas rejoint l'avis : on dit de retoucher Publier, pas d'en choisir une autre", () => {
  const m = decrireRefusPhotoAvis({ ou: "photo", erreur: "avis-invalide" }, "fr");
  assert.match(m.texte, /Touche Publier/);
  assert.doesNotMatch(m.texte, /Choisis-en une autre/);
  assert.notEqual(m.titre, decrireRefusPhotoAvis({ ou: "photo", erreur: "format-refuse" }, "fr").titre);
});

test("chaque refus garde son texte : lourde, placards pleins, pas encore, format", () => {
  assert.match(decrireRefusPhotoAvis({ ou: "photo", erreur: "media-trop-lourd" }, "fr").texte, /trop lourde/);
  assert.match(decrireRefusPhotoAvis({ ou: "photo", erreur: "stockage-plein" }, "fr").texte, /placards/);
  assert.match(decrireRefusPhotoAvis({ ou: "photo", erreur: "introuvable" }, "fr").texte, /tout bientôt/);
  assert.match(decrireRefusPhotoAvis({ ou: "photo", erreur: "format-refuse" }, "fr").texte, /Choisis-en une autre/);
});

test("decrireRefusEnvoiAvis : photo, envoi, et rien pour le texte, la limite ou le plein écran", () => {
  assert.equal(decrireRefusEnvoiAvis({ ou: "photo", erreur: "stockage-plein" }, "fr").emoji, "📷");
  assert.equal(decrireRefusEnvoiAvis({ ou: "envoi", erreur: "hors-ligne" }, "fr").titre, "Pas de réseau ici");
  assert.equal(decrireRefusEnvoiAvis({ ou: "texte" }, "fr"), null);
  assert.equal(decrireRefusEnvoiAvis({ ou: "limite" }, "fr"), null);
  assert.equal(decrireRefusEnvoiAvis({ ou: "ecran", erreur: "avis-ferme" }, "fr"), null);
  assert.equal(decrireRefusEnvoiAvis(null, "fr"), null);
});
