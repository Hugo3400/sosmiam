import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";

export function estLieuDisparu(lieu: LieuResume): boolean {
  return lieu.ville === "" && lieu.nom === "Lieu disparu";
}
