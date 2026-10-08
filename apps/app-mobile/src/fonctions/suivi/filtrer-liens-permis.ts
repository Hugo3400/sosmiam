import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import type { CompteSuivable, LienSuivi } from "@sos-miam/commun/types/suivis";

/** Ce qu'il faut pour juger un lien : toi (tel que la règle te voit), les autres personnes, et qui tu as bloqué */
export type ContexteLiensSuivi = {
  moi: CompteSuivable;
  trouverCible: (id: string) => CompteSuivable | null;
  bloques: ReadonlySet<string>;
};

/**
 * Les liens qu'on garde : sans toi, sans personne inconnue (compte disparu) ni bloquée, et sans doublon (le premier gardé).
 * « accepte » : un abonnement accepté n'est jamais retiré pour une raison d'âge (il reste au passage à 18 ans).
 * « en-attente » : une demande que peutSuivre ne permet plus (adulte ↔ mineur) est retirée, sans bruit.
 * sens : « vers-elle » pour un lien de toi vers elle (abonnements, demandes envoyées), « vers-moi » pour l'inverse.
 * Rend la même liste si rien n'est retiré.
 */
export function filtrerLiensPermis(
  liens: LienSuivi[],
  sens: "vers-elle" | "vers-moi",
  statut: "accepte" | "en-attente",
  contexte: ContexteLiensSuivi,
): LienSuivi[] {
  const vus = new Set<string>();
  const gardes = liens.filter((lien) => {
    if (vus.has(lien.id) || lien.id === contexte.moi.id || contexte.bloques.has(lien.id)) return false;
    const cible = contexte.trouverCible(lien.id);
    if (!cible) return false;
    vus.add(lien.id);
    if (statut === "accepte") return true;
    const verdict = sens === "vers-elle" ? peutSuivre(contexte.moi, cible, { bloque: false }) : peutSuivre(cible, contexte.moi, { bloque: false });
    return verdict.permis;
  });
  return gardes.length === liens.length ? liens : gardes;
}
