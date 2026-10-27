import type { Alertes } from "./alertes.ts";
import { ADRESSE_API, appeler, ErreurApi } from "./client-gestion.ts";

const DELAI_MS = 20_000;

export const demanderJetonCompteurs = () => appeler<{ ok: true; jeton: string }>("POST", "/compteurs/jeton");

export async function lireCompteurs(jeton: string): Promise<Alertes> {
  let reponse: Response;
  try {
    reponse = await fetch(`${ADRESSE_API}/compteurs`, { headers: { "X-Gestion-Jeton": jeton }, signal: AbortSignal.timeout(DELAI_MS) });
  } catch {
    throw new ErreurApi("reseau", 0);
  }
  if (!reponse.ok) {
    const corps = (await reponse.json().catch(() => null)) as { erreur?: string } | null;
    throw new ErreurApi(corps?.erreur ?? "erreur-serveur", reponse.status);
  }
  return (await reponse.json()) as Alertes;
}
