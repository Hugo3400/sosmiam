// Tests de la validation des visites d'un lieu dans le logiciel de gestion (active, rayon, code du QR de vitrine), avec de
// faux services, et du tirage du code public.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { lireCodeScanne } from "../../../packages/commun/src/fonctions/qr/lire-code-scanne.ts";
import { creerCodePublic } from "../src/fonctions/lieux/creer-code-public.ts";
import { creerBancGestion } from "./outils/creer-banc-gestion.ts";

const appels: unknown[] = [];
const journal: string[] = [];
const validation = { codePublic: "k7m2p9qa", validationActive: true, rayonM: null, modifieLe: "2026-10-09T18:00:00.000Z" };
const banc = await creerBancGestion({
  noterAction: async (_poste: string, action: string, detail?: string) => void journal.push(`${action} · ${detail ?? ""}`),
  lireValidationLieu: async (id: number) => (id === 12 ? { validation, publie: true, positionConnue: true, comptesPro: 1 } : null),
  reglerValidationLieu: async (id: number, reglage: unknown) => (appels.push({ regler: id, reglage }), id === 12 ? validation : null),
  changerCodePublic: async (id: number) => (id === 12 ? { ...validation, codePublic: "z3x4c5v6" } : null),
} as never);
let session = "";
before(async () => void (session = await banc.ouvrirSession()));
after(() => banc.fermer());

test("le code public : 8 caractères a-z et 2-9, lu par le scanner comme un QR de vitrine", () => {
  let n = 0;
  const code = creerCodePublic((max) => (n++ * 7) % max);
  assert.match(code, /^[a-z2-9]{8}$/);
  assert.deepEqual(lireCodeScanne(`https://sosmiam.fr/l/${code}`), { type: "lieu", codePublic: code });
  assert.equal(creerCodePublic(() => 33), "99999999");
});

test("lire : la validation et ce qui l'empêcherait de marcher ; 404 sans lieu", async () => {
  assert.deepEqual(await (await banc.demander("GET", "/lieux/12/validation", { session })).json(), { validation, publie: true, positionConnue: true, comptesPro: 1 });
  assert.equal((await banc.demander("GET", "/lieux/13/validation", { session })).status, 404);
});

test("régler : active obligatoire, rayon de 100 à 500 m ou null ; le journal ne garde jamais le code", async () => {
  const ok = await banc.demander("PUT", "/lieux/12/validation", { session, corps: { validationActive: true, rayonM: 300 } });
  assert.deepEqual(await ok.json(), { ok: true, validation });
  assert.deepEqual(appels.at(-1), { regler: 12, reglage: { validationActive: true, rayonM: 300 } });
  assert.equal(journal.at(-1), "Validation des visites activée · lieu n° 12, rayon 300 m");
  await banc.demander("PUT", "/lieux/12/validation", { session, corps: { validationActive: false, rayonM: null } });
  assert.equal(journal.at(-1), "Validation des visites coupée · lieu n° 12, rayon par défaut");
  for (const mauvais of [{ rayonM: 200 }, { validationActive: "oui" }, { validationActive: true, rayonM: 50 }, { validationActive: true, rayonM: 600 }, { validationActive: true, rayonM: 150.5 }]) {
    assert.equal((await banc.demander("PUT", "/lieux/12/validation", { session, corps: mauvais })).status, 400);
  }
  assert.equal((await banc.demander("PUT", "/lieux/13/validation", { session, corps: { validationActive: true } })).status, 404);
  assert.ok(!journal.some((ligne) => ligne.includes("k7m2p9qa")));
});

test("changer le code de vitrine ; 404 si la validation n'a jamais été réglée", async () => {
  const reponse = await banc.demander("POST", "/lieux/12/validation/code", { session });
  assert.equal(((await reponse.json()) as { validation: { codePublic: string } }).validation.codePublic, "z3x4c5v6");
  assert.equal(journal.at(-1), "Code du QR de vitrine changé (l'ancien ne marche plus) · lieu n° 12");
  assert.equal((await banc.demander("POST", "/lieux/13/validation/code", { session })).status, 404);
});
