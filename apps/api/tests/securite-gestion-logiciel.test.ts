import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  listerSignalementsSecurite: async (filtres: unknown) => (appels.push(filtres), []),
  changerSignalementSecurite: async (id: string, changements: { statut?: string; auTableauHonneur?: boolean }) =>
    id === "s9" ? { ok: false, erreur: "signalement-inconnu" }
      : changements.auTableauHonneur ? { ok: false, erreur: "sans-nom-tableau" }
      : changements.statut === "piano" ? { ok: false, erreur: "champ-invalide", champ: "statut" }
      : { ok: true, signalement: { id } },
  lireImageSignalementSecurite: async (id: string, numero: number) => (id === "s1" && numero === 0 ? { octets: Buffer.from("PNG"), typeMime: "image/png" } : null),
  donnerBadgeSignalementSecurite: async (id: string) => (id === "s1" ? { ok: true, nouveau: true } : { ok: false, erreur: "compte-introuvable" }),
  supprimerSignalementSecurite: async (id: string) => id === "s1",
  listerEntreesTableauHonneur: async () => [{ id: "e1", nom: "Zoé M.", mois: "2026-10", signalementId: null }],
  retirerEntreeTableauHonneur: async (id: string) => id === "e1",
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("signalements de sécurité : filtre connu, changements vérifiés, journal sans texte", async () => {
  await banc.demander("GET", "/securite/signalements?statut=nouveau", { session });
  await banc.demander("GET", "/securite/signalements?statut=piano", { session });
  assert.deepEqual(appels, [{ statut: "nouveau" }, { statut: undefined }]);
  assert.equal((await banc.demander("PUT", "/securite/signalements/s1", { session, corps: { statut: "piano" } })).status, 400);
  assert.equal((await banc.demander("PUT", "/securite/signalements/s1", { session, corps: { auTableauHonneur: true } })).status, 409);
  assert.equal((await banc.demander("PUT", "/securite/signalements/s9", { session, corps: { statut: "corrige" } })).status, 404);
  assert.equal((await banc.demander("PUT", "/securite/signalements/s1", { session, corps: { statut: "corrige", gravite: "haute" } })).status, 200);
  assert.equal(journal.at(-1), "Signalement de sécurité modifié · signalement n° s1 : statut, gravite");
});

test("captures servies sandboxées et notées au journal ; badge seulement avec un compte", async () => {
  const image = await banc.demander("GET", "/securite/signalements/s1/images/0", { session });
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.match(image.headers.get("content-security-policy") ?? "", /sandbox/);
  assert.equal(journal.at(-1), "Capture d'un signalement de sécurité ouverte · signalement n° s1, capture 1");
  assert.equal((await banc.demander("GET", "/securite/signalements/s1/images/5", { session })).status, 404);
  assert.equal((await banc.demander("POST", "/securite/signalements/s1/badge", { session, corps: {} })).status, 200);
  assert.equal((await banc.demander("POST", "/securite/signalements/s2/badge", { session, corps: {} })).status, 409);
});

test("suppression d'un signalement et tableau d'honneur : 200 puis 404, notés au journal", async () => {
  assert.equal((await banc.demander("DELETE", "/securite/signalements/s1", { session })).status, 200);
  assert.equal(journal.at(-1), "Signalement de sécurité supprimé · signalement n° s1");
  assert.equal((await banc.demander("DELETE", "/securite/signalements/s2", { session })).status, 404);
  const tableau = await banc.demander("GET", "/securite/tableau-honneur", { session });
  assert.deepEqual(await tableau.json(), { entrees: [{ id: "e1", nom: "Zoé M.", mois: "2026-10", signalementId: null }] });
  assert.equal((await banc.demander("DELETE", "/securite/tableau-honneur/e1", { session })).status, 200);
  assert.equal(journal.at(-1), "Nom retiré du tableau d'honneur · entrée n° e1");
  assert.equal((await banc.demander("DELETE", "/securite/tableau-honneur/e2", { session })).status, 404);
});
