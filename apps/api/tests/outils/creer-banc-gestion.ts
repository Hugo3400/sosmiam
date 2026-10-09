// Banc d'essai des routes /api-gestion : un poste autorisé (clé Ed25519 de test), des demandes signées, une session
// ouverte avec un vrai code à 6 chiffres. Les services sont des faux, passés par le test : aucune base.
import assert from "node:assert/strict";
import { createHash, randomBytes, webcrypto } from "node:crypto";
import type { AddressInfo } from "node:net";

import { creerApplication } from "../../src/application.ts";
import type { OutilsComptes } from "../../src/controleurs/gestion/controleurs-ambassadeurs.ts";
import { calculerCodeTotp } from "../../src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../../src/fonctions/securite/calculer-id-poste.ts";
import { construireMessageGestion } from "../../src/fonctions/securite/construire-message-gestion.ts";
import { creerStockageSessionsEnMemoire } from "../../src/middlewares/proteger-gestion.ts";
import type { ChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import type { ServicesGestion } from "../../src/services/gestion/tous-les-services.ts";

const { subtle } = webcrypto;

export async function creerBancGestion(services: Partial<ServicesGestion>, comptes?: OutilsComptes, chiffrement: ChiffrementDonnees | null = null) {
  const secretTotp = new Uint8Array(randomBytes(20));
  let horloge = Date.now();
  const cles = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
  const clePublique = new Uint8Array(await subtle.exportKey("raw", cles.publicKey));
  const idPoste = calculerIdPoste(clePublique);
  const acces = { postes: [{ id: idPoste, nom: "PC de test", clePublique }], secretTotp };
  const serveur = creerApplication({
    enregistrerInscription: async () => {},
    gestion: {
      lireAcces: () => acces,
      services: { noterAction: async () => {}, ...services } as ServicesGestion,
      horloge: () => horloge,
      sessions: creerStockageSessionsEnMemoire(),
      comptes,
      chiffrement,
    },
  }).listen(0, "127.0.0.1");
  await new Promise<void>((pret) => serveur.once("listening", () => pret()));
  const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;

  async function demander(methode: string, chemin: string, options: { session?: string | null; corps?: unknown } = {}) {
    const corps = options.corps === undefined ? "" : JSON.stringify(options.corps);
    const nonce = randomBytes(16).toString("base64url");
    const horodatage = String(horloge);
    const message = construireMessageGestion({
      methode, chemin, horodatage, nonce, session: options.session ?? null, empreinteCorps: createHash("sha256").update(corps).digest("hex"),
    });
    const signature = Buffer.from(await subtle.sign("Ed25519", cles.privateKey, Buffer.from(message))).toString("base64url");
    return fetch(`${adresse}/api-gestion${chemin}`, {
      method: methode,
      headers: {
        "Content-Type": "application/json",
        "X-Gestion-Poste": idPoste,
        "X-Gestion-Horodatage": horodatage,
        "X-Gestion-Nonce": nonce,
        "X-Gestion-Signature": signature,
        ...(options.session ? { "X-Gestion-Session": options.session } : {}),
      },
      ...(corps ? { body: corps } : {}),
    });
  }

  async function ouvrirSession() {
    horloge += 30_000; // un code ne sert qu'une fois : on passe au pas suivant
    const reponse = await demander("POST", "/session", { corps: { code: calculerCodeTotp(secretTotp, Math.floor(horloge / 30_000)) } });
    assert.equal(reponse.status, 201);
    return ((await reponse.json()) as { session: string }).session;
  }

  const fermer = () => new Promise<void>((fini) => serveur.close(() => fini()));
  return { demander, ouvrirSession, fermer };
}
