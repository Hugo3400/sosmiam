// Lieux publiés : appel à l'API, côté serveur uniquement (l'API n'écoute qu'en local, 127.0.0.1:5192).
import type { CategorieLieu, LieuPublic } from "~/types/lieux";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const CATEGORIES = new Set<string>(["resto", "patisserie", "bar", "sortie"] satisfies CategorieLieu[]);

/** Les lieux publiés, ou null si l'API ne répond pas : la page s'affiche quand même, avec un message. */
export async function listerLieuxPublics(): Promise<LieuPublic[] | null> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/lieux`, { signal: AbortSignal.timeout(3000) });
    if (!reponse.ok) return null;
    const corps: unknown = await reponse.json();
    const lieux = typeof corps === "object" && corps !== null && "lieux" in corps ? corps.lieux : null;
    if (!Array.isArray(lieux)) return null;
    // Une catégorie inconnue (faute de saisie) n'est pas affichée plutôt que de casser la page
    return lieux.filter((lieu): lieu is LieuPublic => typeof lieu?.nom === "string" && CATEGORIES.has(lieu.type));
  } catch {
    return null;
  }
}

/** Une fiche publiée pour le plan du site : son identifiant et sa dernière modification (ISO 8601) */
export type LieuDuPlan = { id: number; modifieLe: string };

/**
 * Tous les lieux publiés pour /sitemap.xml (GET /lieux/plan de l'API), ou null si l'API ne répond pas (2 s au plus) :
 * le plan reste valable sans eux. Une ligne de forme inattendue est laissée de côté.
 */
export async function listerLieuxDuPlan(): Promise<LieuDuPlan[] | null> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/lieux/plan`, { signal: AbortSignal.timeout(2000) });
    if (!reponse.ok) return null;
    const corps: unknown = await reponse.json();
    const lieux = typeof corps === "object" && corps !== null && "lieux" in corps ? corps.lieux : null;
    if (!Array.isArray(lieux)) return null;
    return lieux.filter((lieu): lieu is LieuDuPlan =>
      Number.isSafeInteger(lieu?.id) && lieu.id > 0 && typeof lieu.modifieLe === "string" && !Number.isNaN(Date.parse(lieu.modifieLe)));
  } catch {
    return null;
  }
}

/** Où mène un QR de vitrine : le lieu publié, aucun lieu publié avec ce code, ou l'API qui ne répond pas */
export type LieuDuCode = { ok: true; lieuId: number } | { ok: false; erreur: "lieu-inconnu" | "indisponible" };

/**
 * Le lieu publié d'un QR de vitrine (GET /app/lieux/code/:code de l'API, sans compte). Le code doit déjà avoir sa forme
 * (estCodeVitrine). L'IP du visiteur part dans X-IP-Visiteur : la limite de l'API reste par visiteur.
 */
export async function trouverLieuParCode(code: string, ipVisiteur: string | null): Promise<LieuDuCode> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/app/lieux/code/${encodeURIComponent(code)}`, {
      headers: ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {},
      signal: AbortSignal.timeout(3000),
    });
    if (reponse.status === 404) return { ok: false, erreur: "lieu-inconnu" };
    if (!reponse.ok) return { ok: false, erreur: "indisponible" };
    const corps: unknown = await reponse.json();
    const lieuId = typeof corps === "object" && corps !== null && "lieuId" in corps ? corps.lieuId : null;
    return Number.isSafeInteger(lieuId) && (lieuId as number) > 0 ? { ok: true, lieuId: lieuId as number } : { ok: false, erreur: "indisponible" };
  } catch {
    return { ok: false, erreur: "indisponible" };
  }
}
