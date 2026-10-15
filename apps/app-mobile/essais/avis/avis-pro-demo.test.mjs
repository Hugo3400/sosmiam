import assert from "node:assert/strict";
import { test } from "node:test";

import { allumerDemo } from "~/services/demo/demo-visites-active";

allumerDemo();
const { LIEU_DEMO_PRO_ID } = await import("~/contenus/lieu-demo-pro");
const { creerMagasinDemo } = await import("~/services/demo/magasin-demo");
const { creerAvisDemo } = await import("~/services/demo/avis-demo");
const { creerAvisProDemo } = await import("~/services/demo/avis-pro-demo");

const MOI = { cle: "moi", prenom: "Hugo", initialeNom: "R", avatar: "🦁" };
const BOUIBOUI = { id: LIEU_DEMO_PRO_ID, nom: "Restaurant du Capitaine Bouiboui", emoji: "🛟" };
const GERANT = { ambassadeur: null, pro: [{ ...BOUIBOUI, role: "gerant" }] };
const EQUIPE = { ambassadeur: null, pro: [{ ...BOUIBOUI, role: "equipe" }] };
const SANS_ROLE = { ambassadeur: null, pro: [] };
const REGLAGES = { vraiePosition: false, lieuxRepondentSeuls: false, avisAccelere: false, pepin: null };

async function monterDemo(roles = GERANT) {
  const etat = { roles };
  const maintenant = () => Date.parse("2026-10-15T16:00:00.000Z");
  const magasin = creerMagasinDemo({ maintenant });
  await magasin.remettreAZero();
  const ctx = { magasin, lireClient: () => MOI, lireRoles: () => etat.roles, lireReglages: () => REGLAGES, maintenant };
  return { etat, magasin, pro: creerAvisProDemo(ctx), client: creerAvisDemo(ctx) };
}

test("le gérant du Capitaine Bouiboui voit les avis de son lieu, photo et réponse comprises", async () => {
  const d = await monterDemo();
  const r = await d.pro.listerAvis(LIEU_DEMO_PRO_ID);
  assert.equal(r.ok, true);
  assert.equal(r.resume.nombre, 3);
  assert.deepEqual(r.avis.map((a) => a.signature), ["Nadia K.", "Thomas B.", "Romane P."]);
  assert.equal(r.avis[0].photo, "demo-exemple-moules.jpg");
  assert.equal(r.avis[1].reponseLieu, null);
  assert.match(r.avis[2].reponseLieu.texte, /Merci Romane/);
  assert.equal(r.avis.some((a) => "age" in a || "client" in a), false);
});

test("sans rôle : ni liste ni réponse ; lieu inconnu : introuvable", async () => {
  const d = await monterDemo(SANS_ROLE);
  assert.deepEqual(await d.pro.listerAvis(LIEU_DEMO_PRO_ID), { ok: false, erreur: "role-requis" });
  d.etat.roles = GERANT;
  assert.deepEqual(await d.pro.listerAvis(999), { ok: false, erreur: "introuvable" });
  const [thomas] = await d.magasin.lire((m) => m.avis.filter((a) => a.signature === "Thomas B."));
  d.etat.roles = SANS_ROLE;
  assert.deepEqual(await d.pro.repondreAvis(thomas.id, "Merci Thomas, à bientôt un midi !"), { ok: false, erreur: "role-requis" });
});

test("l'équipe lit les avis, seul le gérant répond", async () => {
  const d = await monterDemo(EQUIPE);
  const liste = await d.pro.listerAvis(LIEU_DEMO_PRO_ID);
  assert.equal(liste.ok, true);
  const thomas = liste.avis.find((a) => a.signature === "Thomas B.");
  assert.deepEqual(await d.pro.repondreAvis(thomas.id, "Merci Thomas !"), { ok: false, erreur: "role-requis" });
});

test("le gérant répond une fois, en public : la réponse se voit tout de suite sur la fiche", async () => {
  const d = await monterDemo();
  const thomas = (await d.pro.listerAvis(LIEU_DEMO_PRO_ID)).avis.find((a) => a.signature === "Thomas B.");
  const r = await d.pro.repondreAvis(thomas.id, "  Merci Thomas ! Le midi, la terrasse t'attend.  ");
  assert.equal(r.ok, true);
  assert.equal(r.avis.reponseLieu.texte, "Merci Thomas ! Le midi, la terrasse t'attend.");
  assert.deepEqual(await d.pro.repondreAvis(thomas.id, "Encore merci !"), { ok: false, erreur: "reponse-deja-donnee" });
  const publics = await d.client.listerAvisLieu(LIEU_DEMO_PRO_ID);
  assert.equal(publics.avis.find((a) => a.id === thomas.id).reponseLieu.texte, "Merci Thomas ! Le midi, la terrasse t'attend.");
});

test("une réponse vide ou grossière ne part pas, un avis masqué n'existe plus", async () => {
  const d = await monterDemo();
  const [thomas] = await d.magasin.lire((m) => m.avis.filter((a) => a.signature === "Thomas B."));
  assert.deepEqual(await d.pro.repondreAvis(thomas.id, "   "), { ok: false, erreur: "message-refuse", champ: "texte" });
  await d.magasin.modifier((m) => {
    m.avis.find((a) => a.id === thomas.id).statut = "masque";
  });
  assert.deepEqual(await d.pro.repondreAvis(thomas.id, "Merci Thomas !"), { ok: false, erreur: "introuvable" });
  assert.equal((await d.pro.listerAvis(LIEU_DEMO_PRO_ID)).avis.some((a) => a.id === thomas.id), false);
});
