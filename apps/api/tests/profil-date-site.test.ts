import assert from "node:assert/strict";
import { test } from "node:test";

import { creerBancApp, MOT_DE_PASSE_TEST } from "./outils/creer-banc-app.ts";

test("profil : un compte du site donne sa date une fois, 18 ans au moins, puis plus jamais", async () => {
  const outils = await creerBancApp();
  try {
    // Compte du site : pas de date de naissance gardée
    const inscription = await outils.demander("POST", "/comptes", {
      corps: { email: "site@exemple.fr", motDePasse: MOT_DE_PASSE_TEST, prenom: "Lou", dateNaissance: "1990-04-02", ville: "Lyon", cgu: true },
    });
    assert.equal(inscription.statut, 201);
    const jeton = inscription.corps.session as string;
    const envoyer = (corps: Record<string, unknown>) => outils.demander("PATCH", "/comptes/moi/profil", { jeton, corps });
    assert.deepEqual((await envoyer({ dateNaissance: "pas-une-date" })).corps, { ok: false, erreur: "champ-invalide", champ: "dateNaissance" });
    assert.deepEqual((await envoyer({ dateNaissance: "2012-05-01" })).corps, { ok: false, erreur: "age-minimum" });
    const ok = await envoyer({ dateNaissance: "1995-06-20", ville: "Lyon" });
    assert.equal(ok.statut, 200);
    assert.equal(ok.corps.profil.dateNaissance, "1995-06-20");
    assert.equal(ok.corps.profil.ville, "Lyon");
    assert.ok(ok.corps.profil.age >= 18);
    // Une fois gardée, plus jamais changée ici
    assert.deepEqual((await envoyer({ dateNaissance: "1990-01-01" })).corps, { ok: false, erreur: "champ-invalide", champ: "dateNaissance" });
    // Compte de l'app (qui a déjà sa date) : toujours refusé
    const app = await outils.inscrireApp();
    const refus = await outils.demander("PATCH", "/comptes/moi/profil", { jeton: app.jeton, corps: { dateNaissance: "1995-06-20" } });
    assert.deepEqual(refus.corps, { ok: false, erreur: "champ-invalide", champ: "dateNaissance" });
  } finally {
    await outils.fermer();
  }
});
