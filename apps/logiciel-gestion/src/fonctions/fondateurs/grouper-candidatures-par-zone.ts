import type { Candidature, ZoneCourte } from "~/services/fondateurs.ts";

export type GroupeZone = { zone: ZoneCourte | null; candidatures: Candidature[] };

/**
 * Range les candidatures par zone : les villes d'abord, puis les départements, chacun par ordre alphabétique, et les
 * candidatures sans zone à la fin ; dans une zone, par numéro (puis par date de candidature).
 */
export function grouperCandidaturesParZone(candidatures: Candidature[]): GroupeZone[] {
  const groupes = new Map<string, GroupeZone>();
  for (const candidature of candidatures) {
    const cle = candidature.zone?.code ?? "";
    const groupe = groupes.get(cle) ?? { zone: candidature.zone, candidatures: [] };
    groupe.candidatures.push(candidature);
    groupes.set(cle, groupe);
  }
  const rang = (zone: ZoneCourte | null) => (!zone ? 2 : zone.type === "ville" ? 0 : 1);
  for (const groupe of groupes.values()) {
    groupe.candidatures.sort((a, b) => (a.numeroLocal ?? Infinity) - (b.numeroLocal ?? Infinity) || a.creeLe.localeCompare(b.creeLe));
  }
  return [...groupes.values()].sort((a, b) => rang(a.zone) - rang(b.zone) || (a.zone?.nom ?? "").localeCompare(b.zone?.nom ?? "", "fr"));
}
