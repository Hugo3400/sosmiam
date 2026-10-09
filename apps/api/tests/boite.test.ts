// Tests des routes de la boîte de réception (bonjour@) avec de faux services : liste, lecture, réponse, erreurs.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
let boiteJoignable = true;
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerMessagesRecus: async (nombre: number, adresse: string | null) => (appels.push({ liste: nombre, adresse }),
    boiteJoignable ? { ok: true, messages: [{ uid: 12, de: { nom: "Léa", adresse: "lea@exemple.fr" }, objet: "Re: ta pépite", compte: { id: 7, prenom: "Léa" } }] } : { ok: false, erreur: "boite-injoignable" }),
  lireMessageRecu: async (uid: number) => (uid === 12 ? { ok: true, message: { uid: 12, texte: "Merci !" } } : { ok: false, erreur: "introuvable" }),
  repondreMessageRecu: async (uid: number, texte: string) => (appels.push({ repondre: uid, texte }), uid === 12 ? { ok: true } : { ok: false, erreur: "introuvable" }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("liste : 50 derniers mails, filtre par adresse valable seulement ; boîte injoignable : 503", async () => {
  const liste = (await (await banc.demander("GET", "/boite", { session })).json()) as { uid: number }[];
  assert.equal(liste[0]?.uid, 12);
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: null });
  await banc.demander("GET", "/boite?adresse=Lea%40Exemple.fr", { session });
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: "lea@exemple.fr" });
  await banc.demander("GET", "/boite?adresse=pas-une-adresse", { session });
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: null });
  boiteJoignable = false;
  assert.equal((await banc.demander("GET", "/boite", { session })).status, 503);
  boiteJoignable = true;
});

test("lecture et réponse : texte obligatoire, mail introuvable, rien de personnel dans le journal", async () => {
  assert.deepEqual(await (await banc.demander("GET", "/boite/12", { session })).json(), { uid: 12, texte: "Merci !" });
  assert.equal((await banc.demander("GET", "/boite/99", { session })).status, 404);
  assert.equal((await banc.demander("POST", "/boite/12/repondre", { session, corps: {} })).status, 400);
  assert.equal((await banc.demander("POST", "/boite/12/repondre", { session, corps: { texte: "Avec plaisir Léa !" } })).status, 200);
  assert.deepEqual(appels.at(-1), { repondre: 12, texte: "Avec plaisir Léa !" });
  assert.equal(journal.at(-1), "Réponse à un mail reçu · message n° 12");
  assert.equal((await banc.demander("POST", "/boite/99/repondre", { session, corps: { texte: "x" } })).status, 404);
});
