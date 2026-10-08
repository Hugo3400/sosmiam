import { createSign } from "node:crypto";

const base64Url = (valeur: Buffer | string) => Buffer.from(valeur).toString("base64url");

/**
 * Un jeton JWT signé, comme l'attendent Apple (ES256, clé .p8) et Google (RS256, compte de service) pour envoyer des
 * notifications. La clé privée reste sur le serveur ; seul le jeton (valable 1 heure au plus) part.
 */
export function signerJetonJwt(algorithme: "ES256" | "RS256", clePrivee: string, entete: Record<string, string>, contenu: Record<string, unknown>): string {
  const partie = `${base64Url(JSON.stringify({ alg: algorithme, typ: "JWT", ...entete }))}.${base64Url(JSON.stringify(contenu))}`;
  const signataire = createSign("SHA256");
  signataire.update(partie);
  // ES256 : signature au format JOSE (r‖s), pas en DER
  const signature = algorithme === "ES256" ? signataire.sign({ key: clePrivee, dsaEncoding: "ieee-p1363" }) : signataire.sign(clePrivee);
  return `${partie}.${base64Url(signature)}`;
}
