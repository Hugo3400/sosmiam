// Tests des routes de la boîte de réception (bonjour@) avec de faux services : liste, lecture, réponse, erreurs.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
let boiteJoignable = true;
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerMessagesRecus: async (nombre: number, adresse: string | null, dossier: string) => (appels.push({ liste: nombre, adresse, dossier }),
    boiteJoignable ? { ok: true, messages: [{ uid: 12, de: { nom: "Léa", adresse: "lea@exemple.fr" }, objet: "Re: ta pépite", compte: { id: 7, prenom: "Léa" } }] } : { ok: false, erreur: "boite-injoignable" }),
  lireMessageRecu: async (uid: number) => (uid === 12 ? { ok: true, message: { uid: 12, texte: "Merci !" } } : { ok: false, erreur: "introuvable" }),
  lirePieceMessage: async (uid: number, numero: number, dossier: string) => (appels.push({ piece: uid, numero, dossier }),
    uid === 12 && numero === 3 ? { ok: true, nom: "menu été.pdf", type: "application/pdf", contenu: Buffer.from("%PDF-1.4") }
      : numero === 4 ? { ok: false, erreur: "piece-trop-lourde" } : { ok: false, erreur: "introuvable" }),
  repondreMessageRecu: async (uid: number, texte: string) => (appels.push({ repondre: uid, texte }), uid === 12 ? { ok: true } : { ok: false, erreur: "introuvable" }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("liste : 50 derniers mails, filtre par adresse valable seulement ; boîte injoignable : 503", async () => {
  const liste = (await (await banc.demander("GET", "/boite", { session })).json()) as { uid: number }[];
  assert.equal(liste[0]?.uid, 12);
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: null, dossier: "recus" });
  await banc.demander("GET", "/boite?adresse=Lea%40Exemple.fr", { session });
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: "lea@exemple.fr", dossier: "recus" });
  await banc.demander("GET", "/boite?adresse=pas-une-adresse&dossier=envoyes", { session });
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: null, dossier: "envoyes" });
  await banc.demander("GET", "/boite?dossier=corbeille", { session });
  assert.deepEqual(appels.at(-1), { liste: 50, adresse: null, dossier: "recus" }, "dossier inconnu : les reçus");
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

test("pièce jointe : le fichier en téléchargement, jamais interprété ; trop lourde 413, introuvable 404", async () => {
  const reponse = await banc.demander("GET", "/boite/12/pieces/3?dossier=envoyes", { session });
  assert.equal(reponse.status, 200);
  assert.equal(reponse.headers.get("content-type"), "application/pdf");
  assert.equal(reponse.headers.get("content-disposition"), "attachment; filename*=UTF-8''menu%20%C3%A9t%C3%A9.pdf");
  assert.equal(reponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await reponse.text(), "%PDF-1.4");
  assert.deepEqual(appels.at(-1), { piece: 12, numero: 3, dossier: "envoyes" });
  assert.equal((await banc.demander("GET", "/boite/12/pieces/4", { session })).status, 413);
  assert.equal((await banc.demander("GET", "/boite/12/pieces/9", { session })).status, 404);
});
