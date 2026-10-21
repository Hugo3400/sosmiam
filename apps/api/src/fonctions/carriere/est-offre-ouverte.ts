export function estOffreOuverte(offre: { publieeLe: Date | null; fermeeLe: Date | null }, maintenant: Date): boolean {
  return offre.publieeLe !== null && offre.publieeLe.getTime() <= maintenant.getTime()
    && (offre.fermeeLe === null || offre.fermeeLe.getTime() > maintenant.getTime());
}
