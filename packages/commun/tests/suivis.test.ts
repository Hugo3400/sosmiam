import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerVisibiliteProfil } from "../src/regles/calculer-visibilite-profil.ts";
import { estComptePrive } from "../src/regles/est-compte-prive.ts";
import { peutSuivre } from "../src/regles/peut-suivre.ts";
import { CONFIDENTIALITE_PAR_DEFAUT } from "../src/regles/suivis.ts";

const moi = { id: "moi" };
const lien = { estMoi: false, bandeEnVrai: false, abonne: false };

test("compte privé : seulement par choix, public par défaut", () => {
  assert.equal(CONFIDENTIALITE_PAR_DEFAUT, "public");
  assert.equal(estComptePrive({}), false);
  assert.equal(estComptePrive({ prive: false }), false);
  assert.equal(estComptePrive({ prive: true }), true);
});

test("suivre : jamais soi-même ni une personne bloquée, sur demande vers un compte privé", () => {
  assert.deepEqual(peutSuivre(moi, { id: "moi" }, { bloque: false }), { permis: false, raison: "soi-meme" });
  assert.deepEqual(peutSuivre(moi, { id: "lea" }, { bloque: true }), { permis: false, raison: "bloque" });
  assert.deepEqual(peutSuivre(moi, { id: "lea" }, { bloque: false }), { permis: true, surDemande: false });
  assert.deepEqual(peutSuivre(moi, { id: "camille", prive: true }, { bloque: false }), { permis: true, surDemande: true });
});

test("visibilité d'un profil : tout pour toi, ta bande en vrai, tes abonnements et les comptes publics ; sinon privé", () => {
  assert.equal(calculerVisibiliteProfil({ prive: true }, { ...lien, estMoi: true }), "complet");
  assert.equal(calculerVisibiliteProfil({ prive: false }, lien), "complet");
  assert.equal(calculerVisibiliteProfil({ prive: true }, { ...lien, bandeEnVrai: true }), "complet");
  assert.equal(calculerVisibiliteProfil({ prive: true }, { ...lien, abonne: true }), "complet");
  assert.equal(calculerVisibiliteProfil({ prive: true }, lien), "prive");
});
