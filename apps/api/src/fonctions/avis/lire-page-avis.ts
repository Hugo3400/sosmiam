import { resumerAvis } from "../../../../../packages/commun/src/fonctions/avis/resumer-avis.ts";
import type { PageAvisLieu } from "../../../../../packages/commun/src/types/avis.ts";
import { AVIS_PAR_PAGE, STATUTS_AVIS_VISIBLES, type TablesAvis } from "../../services/avis-regles.ts";
import { presenterAvisPublic } from "./presenter-avis-public.ts";

/**
 * Une page des avis visibles d'un lieu (30, les plus récents d'abord ; `apres` : l'identifiant du dernier avis de la page
 * précédente) et le résumé de tous ses avis visibles : moyenne prudente, nombre, part de clients qui reviennent (sur ses
 * visites validées, par client et par jour). Le lieu n'est pas vérifié ici : à l'appelant de le faire.
 */
export async function lirePageAvis(t: TablesAvis, lieuId: number, apres: number | null): Promise<PageAvisLieu> {
  const [lignes, notes, jours] = await Promise.all([
    t.listerAvisLieu(lieuId, STATUTS_AVIS_VISIBLES, apres, AVIS_PAR_PAGE + 1),
    t.compterNotes(lieuId, STATUTS_AVIS_VISIBLES),
    t.listerJoursClients(lieuId),
  ]);
  const page = lignes.slice(0, AVIS_PAR_PAGE);
  const derniere = page.at(-1);
  return {
    resume: resumerAvis(notes.flatMap(({ note, nombre }) => Array<number>(nombre).fill(note)), jours),
    avis: page.map(presenterAvisPublic),
    suite: lignes.length > AVIS_PAR_PAGE && derniere ? String(derniere.id) : null,
  };
}
