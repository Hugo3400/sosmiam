// Demandes « brutes » au banc social, pour ce que creerBancSocial ne sait pas envoyer : un corps qui n'est pas du JSON (photo,
// note vocale), des en-têtes à soi (Idempotency-Key), une réponse en octets (un média). L'adresse du banc est retrouvée une
// fois, en regardant passer une demande ordinaire.
import type { creerBancSocial } from "./creer-banc-social.ts";

type Banc = Awaited<ReturnType<typeof creerBancSocial>>;

/** L'adresse (http://127.0.0.1:<port>) du serveur du banc */
export async function trouverAdresseBanc(banc: Banc): Promise<string> {
  const vrai = globalThis.fetch;
  let adresse = "";
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
    adresse = new URL(String(url)).origin;
    return vrai(url, init);
  }) as typeof fetch;
  try {
    await banc.demander("GET", "/sante");
  } finally {
    globalThis.fetch = vrai;
  }
  return adresse;
}

export type ReponseBrute = { statut: number; entetes: Headers; octets: Buffer; corps: Record<string, unknown> | null };

/** Une demande avec la session de `jeton`, un corps en octets (ou JSON) et ses propres en-têtes */
export async function demanderBrut(adresse: string, jeton: string, methode: string, chemin: string, o: { octets?: Uint8Array; type?: string; json?: unknown; entetes?: Record<string, string> } = {}): Promise<ReponseBrute> {
  const entetes: Record<string, string> = { Authorization: `Bearer ${jeton}`, "X-IP-Visiteur": `brut-${Math.random()}`, ...o.entetes };
  let corps: RequestInit["body"];
  if (o.octets) {
    entetes["Content-Type"] = o.type ?? "application/octet-stream";
    corps = o.octets as RequestInit["body"];
  } else if (o.json !== undefined) {
    entetes["Content-Type"] = "application/json";
    corps = JSON.stringify(o.json);
  }
  const reponse = await fetch(`${adresse}${chemin}`, { method: methode, headers: entetes, body: corps });
  const octets = Buffer.from(await reponse.arrayBuffer());
  let json: Record<string, unknown> | null = null;
  if ((reponse.headers.get("content-type") ?? "").includes("application/json")) json = JSON.parse(octets.toString("utf8")) as Record<string, unknown>;
  return { statut: reponse.status, entetes: reponse.headers, octets, corps: json };
}
