// Tests de « Prévenir un pote » (Miam Safe) : seulement un pote de sa bande, notification urgente honnête (0 téléphone :
// pas prévenu), position partagée 1 heure, arrêtable, effacée à la fin, invisible dès qu'on n'est plus potes.
import { test } from "node:test";
import assert from "node:assert/strict";

import { creerBancPro } from "./outils/creer-banc-pro.ts";

const POSITION = { latitude: 43.6109, longitude: 3.8772, precisionM: 12.4 };

async function preparer() {
  const b = await creerBancPro();
  const lea = await b.creerCompte("Léa");
  const sam = await b.creerCompte("Sam");
  const lieuId = b.ajouterLieu({ nom: "Chez Mo" });
  return { b, lea, sam, lieuId };
}

test("Prévenir un pote : seulement quelqu'un de sa bande, avec un lieu publié", async () => {
  const { b, lea, sam, lieuId } = await preparer();
  try {
    const demande = (corps: unknown) => b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps });
    assert.equal((await demande({ pote: "x", lieuId })).corps.champ, "pote");
    assert.equal((await demande({ pote: b.idPublic(sam.id), lieuId: 0 })).corps.champ, "lieuId");
    assert.equal((await demande({ pote: b.idPublic(sam.id), lieuId, position: { latitude: 91, longitude: 0 } })).corps.champ, "latitude");
    const pasPote = await demande({ pote: b.idPublic(sam.id), lieuId });
    assert.equal(pasPote.statut, 404);
    assert.equal(pasPote.corps.erreur, "pote-inconnu");
    assert.equal((await demande({ pote: "pinconnu00", lieuId })).corps.erreur, "pote-inconnu");
    b.rendrePotes(lea.id, sam.id);
    assert.equal((await demande({ pote: b.idPublic(lea.id), lieuId })).corps.erreur, "pote-inconnu", "pas soi-même");
    assert.equal((await demande({ pote: b.idPublic(sam.id), lieuId: 999 })).corps.erreur, "lieu-inconnu");
    assert.equal(b.potesPrevenus.length, 0);
    assert.equal((await b.demander("POST", "/miam-safe/prevenir", { corps: { pote: b.idPublic(sam.id), lieuId } })).statut, 401);
  } finally {
    await b.fermer();
  }
});

test("Prévenir un pote : notification urgente, position partagée 1 h, vue par le pote seulement", async () => {
  const { b, lea, sam, lieuId } = await preparer();
  try {
    b.rendrePotes(lea.id, sam.id);
    const r = await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps: { pote: b.idPublic(sam.id), lieuId, position: POSITION } });
    assert.equal(r.statut, 201);
    assert.equal(r.corps.telephones, 1);
    const partage = r.corps.partage;
    assert.equal(partage.sens, "envoye");
    assert.equal(partage.personne.id, b.idPublic(sam.id));
    assert.deepEqual(partage.lieu, { id: lieuId, nom: "Chez Mo" });
    assert.deepEqual(partage.position, { latitude: 43.6109, longitude: 3.8772, precisionM: 12, le: "2026-10-09T10:00:00.000Z" });
    assert.equal(partage.expireLe, "2026-10-09T11:00:00.000Z");
    assert.equal(partage.actif, true);

    assert.equal(b.potesPrevenus.length, 1);
    const { compteId, message } = b.potesPrevenus[0];
    assert.equal(compteId, sam.id);
    assert.deepEqual(message, {
      titre: "🛡 Léa a besoin de toi",
      texte: "Léa ne se sent pas en sécurité à « Chez Mo ». Sa position est partagée avec toi pendant 1 h.",
      lien: `/miam-safe/partage/${partage.id}`,
      urgent: true,
    });

    const vu = await b.demander("GET", `/miam-safe/partages/${partage.id}`, { jeton: sam.jeton });
    assert.equal(vu.corps.partage.sens, "recu");
    assert.equal(vu.corps.partage.personne.id, b.idPublic(lea.id));
    assert.equal(vu.corps.partage.position.latitude, 43.6109);
    const curieux = await b.creerCompte("Curieux");
    assert.equal((await b.demander("GET", `/miam-safe/partages/${partage.id}`, { jeton: curieux.jeton })).corps.erreur, "partage-inconnu");

    // La position bouge ; seul le téléphone qui partage peut l'envoyer
    b.banc.horloge += 60_000;
    const maj = await b.demander("PUT", `/miam-safe/partages/${partage.id}/position`, { jeton: lea.jeton, corps: { latitude: 43.612, longitude: 3.88 } });
    assert.equal(maj.statut, 200);
    assert.equal(maj.corps.expireLe, "2026-10-09T11:00:00.000Z");
    assert.equal((await b.demander("PUT", `/miam-safe/partages/${partage.id}/position`, { jeton: sam.jeton, corps: POSITION })).statut, 404);
    const relu = await b.demander("GET", `/miam-safe/partages/${partage.id}`, { jeton: sam.jeton });
    assert.deepEqual(relu.corps.partage.position, { latitude: 43.612, longitude: 3.88, precisionM: null, le: "2026-10-09T10:01:00.000Z" });

    // Les deux le voient dans les partages en cours
    assert.equal((await b.demander("GET", "/miam-safe/partages", { jeton: lea.jeton })).corps.partages[0].sens, "envoye");
    assert.equal((await b.demander("GET", "/miam-safe/partages", { jeton: sam.jeton })).corps.partages[0].sens, "recu");

    // Au bout d'une heure : plus de position, plus rien à envoyer
    b.banc.horloge += 60 * 60_000;
    const fini = await b.demander("GET", `/miam-safe/partages/${partage.id}`, { jeton: sam.jeton });
    assert.equal(fini.corps.partage.actif, false);
    assert.equal(fini.corps.partage.position, null);
    assert.equal(b.partages.lignes[0].position, null, "effacée, pas seulement cachée");
    assert.equal((await b.demander("PUT", `/miam-safe/partages/${partage.id}/position`, { jeton: lea.jeton, corps: POSITION })).corps.erreur, "partage-termine");
    assert.deepEqual((await b.demander("GET", "/miam-safe/partages", { jeton: sam.jeton })).corps.partages, []);
  } finally {
    await b.fermer();
  }
});

test("Prévenir un pote : arrêter efface la position ; un nouveau partage vers le même pote remplace l'ancien", async () => {
  const { b, lea, sam, lieuId } = await preparer();
  try {
    b.rendrePotes(lea.id, sam.id);
    const corps = { pote: b.idPublic(sam.id), lieuId, position: POSITION };
    const premier = (await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps })).corps.partage;
    const second = (await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps })).corps.partage;
    assert.equal((await b.demander("GET", `/miam-safe/partages/${premier.id}`, { jeton: sam.jeton })).corps.partage.actif, false);
    assert.equal((await b.demander("GET", "/miam-safe/partages", { jeton: sam.jeton })).corps.partages.length, 1);

    assert.equal((await b.demander("DELETE", `/miam-safe/partages/${second.id}`, { jeton: sam.jeton })).statut, 404, "le pote n'arrête pas");
    assert.equal((await b.demander("DELETE", `/miam-safe/partages/${second.id}`, { jeton: lea.jeton })).statut, 200);
    const vu = await b.demander("GET", `/miam-safe/partages/${second.id}`, { jeton: sam.jeton });
    assert.equal(vu.corps.partage.actif, false);
    assert.equal(vu.corps.partage.position, null);
    assert.ok(b.partages.lignes.every((l) => l.position === null));
  } finally {
    await b.fermer();
  }
});

test("Prévenir un pote : plus potes (retiré ou bloqué), plus rien ne se voit et le partage s'arrête", async () => {
  const { b, lea, sam, lieuId } = await preparer();
  try {
    b.rendrePotes(lea.id, sam.id);
    const partage = (await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps: { pote: b.idPublic(sam.id), lieuId, position: POSITION } })).corps.partage;
    b.retirerPotes(lea.id, sam.id);
    assert.equal((await b.demander("GET", `/miam-safe/partages/${partage.id}`, { jeton: sam.jeton })).corps.erreur, "partage-inconnu");
    assert.deepEqual((await b.demander("GET", "/miam-safe/partages", { jeton: sam.jeton })).corps.partages, []);
    const maj = await b.demander("PUT", `/miam-safe/partages/${partage.id}/position`, { jeton: lea.jeton, corps: POSITION });
    assert.equal(maj.statut, 410);
    assert.equal(b.partages.lignes[0].arreteLe !== null && b.partages.lignes[0].position === null, true);
  } finally {
    await b.fermer();
  }
});

test("Prévenir un pote : sans téléphone connecté, l'app le sait (0) ; sans position, le message le dit", async () => {
  const { b, lea, sam, lieuId } = await preparer();
  try {
    b.rendrePotes(lea.id, sam.id);
    b.telephones.set(sam.id, 0);
    const r = await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps: { pote: b.idPublic(sam.id), lieuId } });
    assert.equal(r.statut, 201);
    assert.equal(r.corps.telephones, 0);
    assert.equal(r.corps.partage.position, null);
    assert.equal(b.potesPrevenus.length, 0);
    b.telephones.set(sam.id, 2);
    const encore = await b.demander("POST", "/miam-safe/prevenir", { jeton: lea.jeton, corps: { pote: b.idPublic(sam.id), lieuId, position: null } });
    assert.equal(encore.corps.telephones, 2);
    assert.equal(b.potesPrevenus[0].message.texte, "Léa ne se sent pas en sécurité à « Chez Mo ». Prends vite de ses nouvelles.");
  } finally {
    await b.fermer();
  }
});
