import type { ChangementsSignalementSecurite, GraviteSignalementSecurite, StatutSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { GRAVITES_SIGNALEMENT_SECURITE, STATUTS_SIGNALEMENT_SECURITE } from "../../services/securite-regles.ts";

export type LectureChangementsSignalement = { ok: true; changements: ChangementsSignalementSecurite } | { ok: false; champ: string };

export function lireChangementsSignalement(valeur: unknown): LectureChangementsSignalement {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) return { ok: false, champ: "changements" };
  const v = valeur as Record<string, unknown>;
  const changements: ChangementsSignalementSecurite = {};
  if (v.statut !== undefined) {
    if (!STATUTS_SIGNALEMENT_SECURITE.includes(v.statut as StatutSignalementSecurite)) return { ok: false, champ: "statut" };
    changements.statut = v.statut as StatutSignalementSecurite;
  }
  if (v.gravite !== undefined) {
    if (v.gravite !== null && !GRAVITES_SIGNALEMENT_SECURITE.includes(v.gravite as GraviteSignalementSecurite)) return { ok: false, champ: "gravite" };
    changements.gravite = v.gravite as GraviteSignalementSecurite | null;
  }
  if (v.auTableauHonneur !== undefined) {
    if (typeof v.auTableauHonneur !== "boolean") return { ok: false, champ: "auTableauHonneur" };
    changements.auTableauHonneur = v.auTableauHonneur;
  }
  if (Object.keys(changements).length === 0) return { ok: false, champ: "changements" };
  return { ok: true, changements };
}
