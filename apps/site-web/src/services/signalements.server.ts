import type { SignalementImageLieu } from "../../../../packages/commun/src/types/signalement.ts";
import { entetesLangue } from "./langue-courante.server.ts";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

export type ResultatSignalementImage = { ok: true } | { ok: false; erreur: "signalement-invalide" | "trop-de-demandes" | "erreur-serveur" };

export async function envoyerSignalementImage(signalement: SignalementImageLieu, ipVisiteur: string | null): Promise<ResultatSignalementImage> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/signalements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...entetesLangue(), ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) },
      body: JSON.stringify({ ...signalement, source: "site" }),
      signal: AbortSignal.timeout(8000),
    });
    if (reponse.ok) return { ok: true };
    const corps: unknown = await reponse.json().catch(() => null);
    const erreur = typeof corps === "object" && corps !== null ? (corps as { erreur?: unknown }).erreur : undefined;
    if (reponse.status === 400 && erreur === "signalement-invalide") return { ok: false, erreur: "signalement-invalide" };
    if (reponse.status === 429) return { ok: false, erreur: "trop-de-demandes" };
    return { ok: false, erreur: "erreur-serveur" };
  } catch {
    return { ok: false, erreur: "erreur-serveur" };
  }
}
