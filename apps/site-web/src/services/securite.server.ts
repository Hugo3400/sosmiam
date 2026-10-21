import type { EntreeTableauHonneur, NouveauSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const FORME_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;

const ERREURS_CONNUES = ["trop-d-images", "image-trop-lourde", "image-format", "trop-de-demandes", "chiffrement-indisponible", "stockage-plein"] as const;

type ErreurConnue = (typeof ERREURS_CONNUES)[number];

export type ResultatSignalement =
  | { ok: true }
  | { ok: false; erreur: "champ-invalide"; champ: string }
  | { ok: false; erreur: ErreurConnue | "erreur-serveur" };

function estErreurConnue(valeur: unknown): valeur is ErreurConnue {
  return ERREURS_CONNUES.some((erreur) => erreur === valeur);
}

function enTetesVisiteur(ipVisiteur: string | null): Record<string, string> {
  return ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {};
}

function lireEntree(brute: unknown): EntreeTableauHonneur | null {
  if (typeof brute !== "object" || brute === null) return null;
  const { nom, mois } = brute as Record<string, unknown>;
  if (typeof nom !== "string" || typeof mois !== "string") return null;
  const propre = nom.trim();
  if (!propre || propre.length > 80 || !FORME_MOIS.test(mois)) return null;
  return { nom: propre, mois };
}

export async function listerTableauHonneur(ipVisiteur: string | null, delai = 3000): Promise<EntreeTableauHonneur[] | null> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/securite/tableau-honneur`, { headers: enTetesVisiteur(ipVisiteur), signal: AbortSignal.timeout(delai) });
    if (!reponse.ok) return null;
    const corps: unknown = await reponse.json();
    const entrees = typeof corps === "object" && corps !== null && "entrees" in corps ? corps.entrees : null;
    if (!Array.isArray(entrees)) return null;
    return entrees.map(lireEntree).filter((entree): entree is EntreeTableauHonneur => entree !== null);
  } catch {
    return null;
  }
}

export async function envoyerSignalementSecurite(
  signalement: NouveauSignalementSecurite,
  piege: string,
  ipVisiteur: string | null,
): Promise<ResultatSignalement> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/securite/signalements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...enTetesVisiteur(ipVisiteur) },
      body: JSON.stringify({ ...signalement, site_web: piege }),
      signal: AbortSignal.timeout(30000),
    });
    if (reponse.ok) return { ok: true };
    const corps: unknown = await reponse.json().catch(() => null);
    const lu = typeof corps === "object" && corps !== null ? (corps as { erreur?: unknown; champ?: unknown }) : {};
    if (reponse.status === 400 && lu.erreur === "champ-invalide" && typeof lu.champ === "string") {
      return { ok: false, erreur: "champ-invalide", champ: lu.champ };
    }
    if (estErreurConnue(lu.erreur)) return { ok: false, erreur: lu.erreur };
    if (reponse.status === 429) return { ok: false, erreur: "trop-de-demandes" };
    if (reponse.status === 413) return { ok: false, erreur: "image-trop-lourde" };
    return { ok: false, erreur: "erreur-serveur" };
  } catch {
    return { ok: false, erreur: "erreur-serveur" };
  }
}
