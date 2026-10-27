import { entetesLangue } from "./langue-courante.server.ts";

export type ResultatConfirmation = "ok" | "jeton-invalide" | "trop-de-demandes" | "indisponible";

export function aFormeDeJetonConfirmation(jeton: string | null): jeton is string {
  return typeof jeton === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(jeton);
}

export async function confirmerNewsletter(jeton: string | null, ipVisiteur: string | null): Promise<ResultatConfirmation> {
  if (!aFormeDeJetonConfirmation(jeton)) return "jeton-invalide";
  try {
    const reponse = await fetch(`${process.env.ADRESSE_API ?? "http://127.0.0.1:5192"}/newsletter/confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...entetesLangue(), ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) },
      body: JSON.stringify({ jeton }),
      signal: AbortSignal.timeout(5000),
    });
    if (reponse.ok) return "ok";
    return reponse.status === 400 ? "jeton-invalide" : reponse.status === 429 ? "trop-de-demandes" : "indisponible";
  } catch {
    return "indisponible";
  }
}
