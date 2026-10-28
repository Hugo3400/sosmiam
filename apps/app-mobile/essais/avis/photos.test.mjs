import assert from "node:assert/strict";
import { test } from "node:test";

import { construireAdressePhotoAvis } from "~/fonctions/avis/construire-adresse-photo-avis";
import { ecrireResumeAvis } from "~/fonctions/avis/ecrire-resume-avis";
import { estPhotoAvisTropPetite } from "~/fonctions/avis/est-photo-avis-trop-petite";
import { filtrerAvisSelonAge } from "~/fonctions/avis/filtrer-avis-selon-age";
import { ADRESSE_API } from "~/services/adresse-api";

const avis = (id, texte, reponse = null) => ({ id, note: 4, texte, photo: null, signature: "Léa M.", preuve: "addition", mois: "2026-10", reponseLieu: reponse ? { texte: reponse, mois: "2026-10" } : null, verifie: true, repasOffert: false, avecReduction: false });

test("l'adresse publique d'une photo d'avis : /app/avis/photos/<nom>, nom protégé", () => {
  assert.equal(construireAdressePhotoAvis("3f2a9c1e-0000-4000-8000-000000000001.jpg"), `${ADRESSE_API}/app/avis/photos/3f2a9c1e-0000-4000-8000-000000000001.jpg`);
  assert.equal(construireAdressePhotoAvis("../moi?x=1"), `${ADRESSE_API}/app/avis/photos/..%2Fmoi%3Fx%3D1`);
  assert.doesNotMatch(ADRESSE_API, /\/$/);
});

test("une photo de moins de 320 px de petit côté ne part pas (pas de +10 pour une vignette)", () => {
  assert.equal(estPhotoAvisTropPetite({ largeur: 319, hauteur: 2048 }), true);
  assert.equal(estPhotoAvisTropPetite({ largeur: 2048, hauteur: 319 }), true);
  assert.equal(estPhotoAvisTropPetite({ largeur: 320, hauteur: 320 }), false);
  assert.equal(estPhotoAvisTropPetite({ largeur: 2048, hauteur: 1536 }), false);
});

test("visite sans compte : les avis qui parlent d'alcool (ou leur réponse) sont retirés ; avec un compte, tout reste", () => {
  const liste = [avis(1, "Les moules du Capitaine, un régal !"), avis(2, "Un spritz parfait en terrasse."), avis(3, "Super accueil.", "Merci, on t'offre l'apéro la prochaine fois !"), avis(4, "Flan à la vanille Bourbon divin.")];
  assert.deepEqual(filtrerAvisSelonAge(liste, null).map((a) => a.id), [1, 4]);
  assert.deepEqual(filtrerAvisSelonAge(liste, 31).map((a) => a.id), [1, 2, 3, 4]);
});

test("le résumé : moyenne au dixième avec une virgule, nombre d'avis, part de clients qui reviennent quand elle existe", () => {
  assert.equal(ecrireResumeAvis({ moyenne: null, nombre: 0, partRetour: null }, "fr"), null);
  assert.deepEqual(ecrireResumeAvis({ moyenne: 4.3, nombre: 12, partRetour: 0.68 }, "fr"), {
    visible: "4,3 sur 5 · 12 avis · 68 % des clients reviennent",
    lu: "Note de 4,3 sur 5, sur 12 avis. 68 % des clients reviennent",
  });
  assert.equal(ecrireResumeAvis({ moyenne: 4, nombre: 1, partRetour: null }, "fr").visible, "4 sur 5 · 1 avis");
});

test("le résumé en anglais : point décimal, reviews, pourcentage collé", () => {
  assert.deepEqual(ecrireResumeAvis({ moyenne: 4.3, nombre: 12, partRetour: 0.68 }, "en"), {
    visible: "4.3 out of 5 · 12 reviews · 68% of customers come back",
    lu: "Rated 4.3 out of 5, from 12 reviews. 68% of customers come back",
  });
  assert.equal(ecrireResumeAvis({ moyenne: 4, nombre: 1, partRetour: null }, "en").visible, "4 out of 5 · 1 review");
});
