// Bouton « Me localiser » : demande à l'API la commune qui contient une position (côté serveur uniquement).
const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

export type CommuneTrouvee = { commune: string; departement: string; region: string };

export type ResultatLocalisation =
  | ({ ok: true } & CommuneTrouvee)
  | { ok: false; erreur: "position-invalide" | "hors-de-france" | "trop-de-demandes" | "erreur" };

/** Envoie la position à l'API. L'IP du visiteur ne sert qu'à limiter les demandes ; rien n'est gardé. */
export async function localiserCommune(latitude: unknown, longitude: unknown, ipVisiteur: string | null): Promise<ResultatLocalisation> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/localisation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) },
      body: JSON.stringify({ latitude, longitude }),
      signal: AbortSignal.timeout(8000),
    });
    const corps: unknown = await reponse.json().catch(() => null);
    if (reponse.ok && typeof corps === "object" && corps !== null && "commune" in corps && typeof corps.commune === "string") {
      const texte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");
      const { departement, region } = corps as { departement?: unknown; region?: unknown };
      return { ok: true, commune: corps.commune, departement: texte(departement), region: texte(region) };
    }
    const erreur = typeof corps === "object" && corps !== null && "erreur" in corps ? corps.erreur : null;
    if (erreur === "position-invalide" || erreur === "hors-de-france" || erreur === "trop-de-demandes") return { ok: false, erreur };
    return { ok: false, erreur: "erreur" };
  } catch {
    return { ok: false, erreur: "erreur" };
  }
}
