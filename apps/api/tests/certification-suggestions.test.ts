// Tests des routes de gestion « Ambassadeur certifié » et des modifications de fiches proposées, avec de faux services.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const suggestion = (statut = "en-attente") => ({
  id: 3, lieuId: 12, compteId: 7, statut,
  proposition: { horaires: "Mar-dim 12h-14h", siteWeb: "https://lafournee.fr", telephone: "04 67 00 00 00", statut: "publie" },
  avant: { horaires: "Mar-sam 12h-14h", siteWeb: null, telephone: null },
  lieu: { id: 12, nom: "La Fournée" }, compte: { id: 7, prenom: "Léa", email: "lea@exemple.fr" },
});
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  accepterCertification: async (id: number) => (id === 1 ? { etat: "acceptee", compteId: 7 } : id === 2 ? { etat: "pas-ambassadeur" } : { etat: "introuvable" }),
  prevenirCertifie: async (compteId: number) => (appels.push({ bienvenue: compteId }), true),
  refuserCertification: async (id: number) => id === 1,
  retirerCertification: async (id: number) => id === 7,
  lireSuggestion: async (id: number) =>
    id === 3 ? suggestion() : id === 4 ? suggestion("refusee") : id === 5 ? { ...suggestion(), proposition: { siteWeb: "javascript:alert(1)", nom: "" } } : null,
  deciderSuggestion: async (id: number, valeurs: Record<string, unknown>, reponse: string | null) => (
    appels.push({ decider: id, valeurs, reponse }),
    { etat: "decidee", statut: Object.keys(valeurs).length ? "partielle" : "refusee", champs: Object.keys(valeurs), lieuId: 12, compteId: 7, nomLieu: "La Fournée" }
  ),
  envoyerCourrielEcrit: async (destinataire: unknown, objet: string, texte: string) => (appels.push({ mail: destinataire, objet, texte }), { ok: true }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("certifié : accepter (avec mail de bienvenue), sans rôle d'ambassadeur, refuser, retirer le titre", async () => {
  assert.deepEqual(await (await banc.demander("POST", "/certifications/1/accepter", { session, corps: {} })).json(), { ok: true, bienvenue: true });
  assert.deepEqual(appels.at(-1), { bienvenue: 7 });
  assert.equal(journal.at(-1), "Ambassadeur certifié · candidature n° 1 (compte n° 7)");
  const sansRole = await banc.demander("POST", "/certifications/2/accepter", { session, corps: {} });
  assert.equal(sansRole.status, 409);
  assert.deepEqual(await sansRole.json(), { ok: false, erreur: "pas-ambassadeur" });
  assert.equal((await banc.demander("POST", "/certifications/9/accepter", { session, corps: {} })).status, 404);
  assert.equal((await banc.demander("POST", "/certifications/1/refuser", { session, corps: {} })).status, 200);
  assert.equal((await banc.demander("POST", "/certifications/2/refuser", { session, corps: {} })).status, 404);
  assert.equal((await banc.demander("POST", "/ambassadeurs/7/certification/retirer", { session, corps: {} })).status, 200);
  assert.equal((await banc.demander("POST", "/ambassadeurs/8/certification/retirer", { session, corps: {} })).status, 404);
});

test("modification proposée : seuls les champs proposés et modifiables, vérifiés comme dans le formulaire", async () => {
  const decider = (corps: unknown, id = 3) => banc.demander("POST", `/suggestions/${id}/decision`, { session, corps });
  // « statut » n'est pas modifiable par une suggestion ; « nom » n'était pas proposé ; pas de doublon
  for (const champs of [["statut"], ["nom"], ["horaires", "horaires"], "horaires"]) assert.equal((await decider({ champs })).status, 400, JSON.stringify(champs));
  assert.equal((await decider({ champs: [] }, 4)).status, 404, "déjà décidée");
  assert.equal((await decider({ champs: [] }, 9)).status, 404);
  // Une valeur proposée qui ne passerait pas le formulaire est refusée, avec le champ en cause
  assert.deepEqual(await (await decider({ champs: ["siteWeb"] }, 5)).json(), { ok: false, erreur: "champ-invalide", champ: "siteWeb" });
  assert.deepEqual(await (await decider({ champs: ["nom"] }, 5)).json(), { ok: false, erreur: "champ-invalide", champ: "nom" });
  // Partielle, avec la réponse envoyée par mail à l'auteur
  const reponse = await decider({ champs: ["horaires", "siteWeb"], reponse: "Merci Léa, c'est corrigé !", envoyer: true });
  assert.deepEqual(await reponse.json(), { ok: true, statut: "partielle", champs: ["horaires", "siteWeb"], mail: "envoye" });
  assert.deepEqual(appels.at(-2), { decider: 3, valeurs: { horaires: "Mar-dim 12h-14h", siteWeb: "https://lafournee.fr" }, reponse: "Merci Léa, c'est corrigé !" });
  assert.deepEqual(appels.at(-1), { mail: { compteId: 7 }, objet: "Ta suggestion pour La Fournée", texte: "Merci Léa, c'est corrigé !" });
  assert.equal(journal.at(-1), "Modification de fiche partielle · suggestion n° 3, lieu n° 12, 2 champ(s)");
  // Refusée sans mail
  assert.deepEqual(await (await decider({ champs: [] })).json(), { ok: true, statut: "refusee", champs: [], mail: "aucun" });
  assert.ok(journal.every((ligne) => !ligne.includes("Léa") && !ligne.includes("12h")));
});
