import type { EtatCarteFidelite, ProgrammeFidelite, RecompensePrete } from "../../types/fidelite.ts";

/**
 * Pose (+1) ou retire (−1) un tampon sur une carte de fidélité. Ne modifie rien : rend la nouvelle carte.
 * - Programme inactif : rien ne change.
 * - Quand la carte atteint `visitesRequises`, les tampons repartent à 0 et une récompense prête est ajoutée, figée :
 *   son libellé ne bouge plus, même si le lieu change sa récompense ensuite.
 * - Retrait (visite annulée par le lieu ou retirée) : jamais sous 0, et une récompense déjà gagnée reste acquise.
 */
export function appliquerTampon(
  carte: EtatCarteFidelite,
  programme: Pick<ProgrammeFidelite, "actif" | "visitesRequises">,
  delta: 1 | -1,
  recompense: { id: number; libelle: string; alcool?: boolean },
  maintenantMs: number,
): { carte: EtatCarteFidelite; recompenseGagnee: boolean } {
  if (!programme.actif) return { carte, recompenseGagnee: false };
  if (delta === -1) return { carte: { tampons: Math.max(0, carte.tampons - 1), pretes: carte.pretes }, recompenseGagnee: false };

  const tampons = Math.max(0, carte.tampons) + 1;
  if (tampons < Math.max(1, programme.visitesRequises)) return { carte: { tampons, pretes: carte.pretes }, recompenseGagnee: false };

  const prete: RecompensePrete = {
    id: recompense.id,
    libelle: recompense.libelle,
    gagneeLe: new Date(maintenantMs).toISOString(),
    ...(recompense.alcool ? { alcool: true } : {}),
  };
  return { carte: { tampons: 0, pretes: [...carte.pretes, prete] }, recompenseGagnee: true };
}
