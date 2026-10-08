import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { evaluerPosition } from "@sos-miam/commun/fonctions/visites/evaluer-position";
import { traduireResultatPosition } from "@sos-miam/commun/fonctions/visites/traduire-resultat-position";
import { RAYON_VALIDATION_M } from "@sos-miam/commun/regles/visites";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { LecturePosition } from "@sos-miam/commun/types/position";

import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";

type Echec = Extract<ReponseApi, { ok: false }>;

/**
 * Compare la lecture du téléphone au lieu (rayon du lieu, 200 m par défaut) : null si on est bien sur place, sinon
 * l'erreur à montrer. Comme l'API : la distance est arrondie à 100 m et ne sert qu'au message ; rien n'est gardé.
 */
export function verifierPositionDemo(position: LecturePosition, lieu: Lieu): Echec | null {
  if (!lieu.position) return { ok: false, erreur: "lieu-sans-validation", details: { lieu: lieu.nom } };
  const rayonM = validationLieuxExemples[lieu.id]?.rayonM ?? RAYON_VALIDATION_M;
  const { resultat, distanceM } = evaluerPosition(position, lieu.position, rayonM);
  const erreur = traduireResultatPosition(resultat);
  if (erreur === null) return null;
  if (erreur === "hors-zone") return { ok: false, erreur, details: { distanceM: Math.round(distanceM / 100) * 100, lieu: lieu.nom } };
  if (erreur === "position-imprecise") {
    const precisionM = position.precision !== null && Number.isFinite(position.precision) ? Math.round(position.precision) : undefined;
    return { ok: false, erreur, details: precisionM === undefined ? undefined : { precisionM } };
  }
  return { ok: false, erreur };
}
