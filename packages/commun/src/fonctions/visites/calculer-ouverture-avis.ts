import { DELAI_INVITATION_AVIS_MS, DUREE_INVITATION_AVIS_MS } from "../../regles/visites.ts";

/** Quand l'avis d'une visite s'ouvre (une heure après la validation, ou le délai donné) et quand il se ferme (14 jours plus tard). */
export function calculerOuvertureAvis(valideLeMs: number, delaiMs: number = DELAI_INVITATION_AVIS_MS): { ouvertLe: string; fermeLe: string } {
  const ouvertLeMs = valideLeMs + delaiMs;
  return {
    ouvertLe: new Date(ouvertLeMs).toISOString(),
    fermeLe: new Date(ouvertLeMs + DUREE_INVITATION_AVIS_MS).toISOString(),
  };
}
