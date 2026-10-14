import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { ResultatValidation } from "../../../../../packages/commun/src/types/visite.ts";
import type { LigneVisite, TablesVisites } from "../../services/visites-regles.ts";
import { presenterCarteFidelite } from "../fidelite/presenter-carte-fidelite.ts";
import { presenterVisite } from "./presenter-visite.ts";

/**
 * Ce que reçoit le client pour une visite : la visite, sa carte chez ce lieu, et si la carte vient de se remplir.
 * `recompenseGagnee` à null : retrouvée sur la carte (une récompense gagnée à l'instant même de la validation).
 */
export async function construireResultatValidation(
  t: TablesVisites, v: LigneVisite, lieu: LieuResume, recompenseGagnee: boolean | null, maintenant: Date, dejaValidee = false,
): Promise<ResultatValidation> {
  const [ligneCarte, programme] = await Promise.all([t.lireCarte(v.compteId, v.lieuId, maintenant), t.lireProgramme(v.lieuId)]);
  const carte = ligneCarte ? presenterCarteFidelite(ligneCarte, programme, lieu) : null;
  const retrouvee = v.statut === "validee" && v.tampon && v.valideLe !== null && (ligneCarte?.pretes.some((r) => r.gagneeLe.getTime() === v.valideLe?.getTime()) ?? false);
  return { visite: presenterVisite(v, lieu), carte, recompenseGagnee: recompenseGagnee ?? retrouvee, dejaValidee };
}
