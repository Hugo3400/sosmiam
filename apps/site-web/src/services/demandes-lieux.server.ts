// « J'inscris mon lieu » : envoi de la demande à l'API, côté serveur uniquement (l'API n'écoute qu'en local, 127.0.0.1:5192).
const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

export type ResultatDemandeLieu =
  | { ok: true }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: "trop-de-demandes" | "erreur" };

/** Envoie la demande (les champs vides sont simplement absents). L'IP du visiteur ne sert qu'à limiter les envois. */
export async function envoyerDemandeLieu(demande: Record<string, string>, ipVisiteur: string | null): Promise<ResultatDemandeLieu> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/demandes-lieux`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) },
      body: JSON.stringify(demande),
      signal: AbortSignal.timeout(8000),
    });
    if (reponse.ok) return { ok: true };
    const corps: unknown = await reponse.json().catch(() => null);
    const lu = typeof corps === "object" && corps !== null ? (corps as { erreur?: unknown; champ?: unknown }) : {};
    if (lu.erreur === "champ-invalide" && typeof lu.champ === "string") return { ok: false, erreur: "champ-invalide", champ: lu.champ };
    return { ok: false, erreur: lu.erreur === "trop-de-demandes" ? "trop-de-demandes" : "erreur" };
  } catch {
    return { ok: false, erreur: "erreur" };
  }
}
