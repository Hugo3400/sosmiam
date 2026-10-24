import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

import { creerApplication } from "../../apps/api/src/application.ts";
import { calculerCodeTotp } from "../../apps/api/src/fonctions/securite/calculer-code-totp.ts";
import { calculerIdPoste } from "../../apps/api/src/fonctions/securite/calculer-id-poste.ts";
import { creerStockageSessionsEnMemoire } from "../../apps/api/src/middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../../apps/api/src/services/gestion/acces.ts";
import type { ServicesGestion } from "../../apps/api/src/services/gestion/tous-les-services.ts";

const PORT_API = Number(process.env.PORT_API ?? 5198);
const PORT_PILOTE = Number(process.env.PORT_PILOTE ?? 5199);
const secretTotp = new Uint8Array(randomBytes(20));
let acces: AccesGestion | null = { postes: [], secretTotp };

const services = new Proxy({} as ServicesGestion, {
  get: (_cible, nom) => {
    if (typeof nom !== "string" || nom === "then") return undefined;
    if (nom === "noterAction") return async () => {};
    return async () => {
      throw new Error(`banc : ${nom} ne rend rien exprès`);
    };
  },
});

creerApplication({
  enregistrerInscription: async () => {},
  gestion: { lireAcces: () => acces, services, sessions: creerStockageSessionsEnMemoire() },
}).listen(PORT_API, "127.0.0.1", () => console.log(`banc API sur ${PORT_API}`));

createServer((requete, reponse) => {
  const adresse = new URL(requete.url ?? "/", "http://127.0.0.1");
  reponse.setHeader("Content-Type", "application/json");
  if (adresse.pathname === "/autoriser") {
    const cle = new Uint8Array(Buffer.from(adresse.searchParams.get("cle") ?? "", "base64url"));
    acces = { postes: [{ id: calculerIdPoste(cle), nom: "PC d'essai", clePublique: cle }], secretTotp };
    return reponse.end(JSON.stringify({ ok: true }));
  }
  if (adresse.pathname === "/code") return reponse.end(JSON.stringify({ code: calculerCodeTotp(secretTotp, Math.floor(Date.now() / 30_000)) }));
  reponse.statusCode = 404;
  reponse.end();
}).listen(PORT_PILOTE, "127.0.0.1", () => console.log(`pilote sur ${PORT_PILOTE}`));
