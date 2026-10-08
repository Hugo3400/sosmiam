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
