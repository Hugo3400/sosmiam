import type { CompteSuivable, LienSuivi } from "@sos-miam/commun/types/suivis";

/** Ce qu'il faut pour juger un lien : toi (tel que la règle te voit), les autres personnes, et qui tu as bloqué */
export type ContexteLiensSuivi = {
  moi: CompteSuivable;
  trouverCible: (id: string) => CompteSuivable | null;
  bloques: ReadonlySet<string>;
};

/**
 * Les liens qu'on garde : sans toi, sans personne inconnue (compte disparu) ni bloquée, et sans doublon (le premier gardé).
 * Vaut pour les abonnements acceptés comme pour les demandes en attente. Rend la même liste si rien n'est retiré.
 */
export function filtrerLiensPermis(liens: LienSuivi[], contexte: ContexteLiensSuivi): LienSuivi[] {
  const vus = new Set<string>();
  const gardes = liens.filter((lien) => {
    if (vus.has(lien.id) || lien.id === contexte.moi.id || contexte.bloques.has(lien.id)) return false;
    if (!contexte.trouverCible(lien.id)) return false;
    vus.add(lien.id);
    return true;
  });
  return gardes.length === liens.length ? liens : gardes;
}
