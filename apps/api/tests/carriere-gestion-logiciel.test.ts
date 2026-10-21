import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const offre = { id: "a1", titre: "Modération" };
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  creerOffre: async (donnees: { titre?: string }) => (donnees.titre ? { ok: true, offre } : { ok: false, erreur: "champ-invalide", champ: "titre" }),
  publierOffre: async (id: string) => (id === "a1" ? offre : null),
  listerCandidaturesCarriere: async (filtres: unknown) => (appels.push(filtres), []),
  lireCvCandidature: async (id: string) => (id === "c1" ? Buffer.from("%PDF-1.4") : null),
  changerStatutCandidature: async (_id: string, statut: unknown) => (statut === "lue" ? { ok: true } : { ok: false, erreur: "champ-invalide" }),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("offres : champ refusé en 400, publication notée au journal, inconnue en 404", async () => {
  const refus = await banc.demander("POST", "/carriere/offres", { session, corps: {} });
  assert.deepEqual([refus.status, await refus.json()], [400, { ok: false, erreur: "champ-invalide", champ: "titre" }]);
  assert.equal((await banc.demander("POST", "/carriere/offres", { session, corps: { titre: "Modération" } })).status, 200);
  assert.equal((await banc.demander("POST", "/carriere/offres/a1/publication", { session, corps: {} })).status, 200);
  assert.equal(journal.at(-1), "Offre de la page Carrière publiée · offre n° a1");
  assert.equal((await banc.demander("POST", "/carriere/offres/zz/publication", { session, corps: {} })).status, 404);
});

test("candidatures : filtres connus seulement, CV en pièce jointe sandboxée et noté au journal, statut vérifié", async () => {
  await banc.demander("GET", "/carriere/candidatures?offre=a1&statut=nouvelle", { session });
  await banc.demander("GET", "/carriere/candidatures?offre=%3Cscript%3E&statut=piano", { session });
  assert.deepEqual(appels, [{ offreId: "a1", statut: "nouvelle" }, { offreId: undefined, statut: undefined }]);
  const cv = await banc.demander("GET", "/carriere/candidatures/c1/cv", { session });
  assert.equal(cv.status, 200);
  assert.equal(cv.headers.get("content-type"), "application/pdf");
  assert.match(cv.headers.get("content-security-policy") ?? "", /sandbox/);
  assert.match(cv.headers.get("content-disposition") ?? "", /attachment/);
  assert.equal(journal.at(-1), "CV d'une candidature ouvert · candidature n° c1");
  assert.equal((await banc.demander("GET", "/carriere/candidatures/c2/cv", { session })).status, 404);
  assert.equal((await banc.demander("POST", "/carriere/candidatures/c1/statut", { session, corps: { statut: "piano" } })).status, 400);
  assert.equal((await banc.demander("POST", "/carriere/candidatures/c1/statut", { session, corps: { statut: "lue" } })).status, 200);
});
